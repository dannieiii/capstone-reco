<template>  <div class="status-update-container">
    <h3>Update Order Status</h3>
    
    <!-- Order Details Summary -->
    <div v-if="orderData && Object.keys(orderData).length > 0" class="order-summary">
      <div class="summary-item">
        <span class="summary-label">Product:</span>
        <span class="summary-value">{{ orderData.productName || 'N/A' }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Quantity:</span>
        <span class="summary-value quantity-display">
          <span class="quantity-number">{{ quantityDisplay.quantity }}</span>
          <span class="quantity-unit">{{ quantityDisplay.unit }}</span>
        </span>
      </div>      <div class="summary-item">
        <span class="summary-label">Unit Price:</span>
        <span class="summary-value">₱{{ formatPrice(getUnitPrice(orderData)) }}/{{ quantityDisplay.unit }}</span>
      </div>
    </div>
    
    <div class="status-update-form">
      <div class="status-select-container">
        <select v-model="selectedStatus" class="status-select">
          <option v-for="status in statusOptions" :key="status" :value="status">
            {{ status }}
          </option>
        </select>
      </div>
      
      <!-- Additional fields based on selected status -->
      <div v-if="selectedStatus === 'Shipped'" class="additional-fields">
        <div class="field-group">
          <label for="estimatedTime">Estimated Delivery Time (hours)</label>
          <input 
            type="number" 
            id="estimatedTime" 
            v-model="estimatedTime" 
            min="1" 
            max="24"
            placeholder="e.g., 4"
            class="time-input"
          />
        </div>
        
        <div class="field-group">
          <label for="deliveryNotes">Delivery Notes (optional)</label>
          <textarea 
            id="deliveryNotes" 
            v-model="deliveryNotes" 
            placeholder="Add notes for the customer about this delivery..."
            class="notes-input"
          ></textarea>
        </div>
        
        <div class="field-group">
          <label for="sellerContact">Contact Number for Delivery</label>
          <input 
            type="tel" 
            id="sellerContact" 
            v-model="sellerContact" 
            placeholder="Your contact number"
            class="contact-input"
          />
        </div>
      </div>
      
      <div v-if="selectedStatus === 'Delivered'" class="additional-fields">
        <div class="field-group">
          <label for="deliveryPhoto">Delivery Confirmation Photo</label>
          <div class="image-options">
            <button 
              type="button" 
              class="image-option-btn"
              @click="openCamera"
              :disabled="isCameraOpen"
            >
              <i class="i-lucide-camera"></i>
              Take Photo
            </button>
            <button 
              type="button" 
              class="image-option-btn"
              @click="triggerFileInput"
            >
              <i class="i-lucide-upload"></i>
              Upload Photo
            </button>
          </div>
          
          <!-- Camera view when active -->
          <div v-if="isCameraOpen" class="camera-view">
            <video ref="video" autoplay playsinline class="camera-feed"></video>
            <div class="camera-controls">
              <button 
                type="button" 
                class="camera-btn capture-btn"
                @click="capturePhoto"
              >
                <i class="i-lucide-circle"></i>
              </button>
              <button 
                type="button" 
                class="camera-btn cancel-btn"
                @click="closeCamera"
              >
                <i class="i-lucide-x"></i>
              </button>
            </div>
          </div>
          
          <!-- Image preview -->
          <div 
            v-if="imagePreview && !isCameraOpen" 
            class="image-preview-container"
          >
            <img :src="imagePreview" alt="Delivery confirmation" class="preview-image" />
            <button 
              type="button" 
              class="remove-image-btn"
              @click="removeImage"
            >
              <i class="i-lucide-x"></i>
            </button>
          </div>
          
          <input 
            type="file" 
            ref="fileInput" 
            @change="handleImageUpload" 
            accept="image/*" 
            class="file-input"
            capture="environment"
          />
          
          <span v-if="errors.image" class="error-message">{{ errors.image }}</span>
          <p class="photo-help-text">
            Take a clear photo of the delivered package or delivery location as proof of delivery
          </p>
        </div>
        
        <div class="field-group">
          <label for="deliveryNotes">Delivery Notes (optional)</label>
          <textarea 
            id="deliveryNotes" 
            v-model="deliveryNotes" 
            placeholder="Add notes about the delivery..."
            class="notes-input"
          ></textarea>
        </div>
      </div>
      
      <button 
        class="update-status-btn" 
        @click="updateOrderStatus"
        :disabled="isUpdating || (selectedStatus === 'Delivered' && !selectedFile && requirePhotoForDelivery)"
      >
        <Loader v-if="isUpdating" size="16" class="spinner" />
        <span v-else>Update Status</span>
      </button>
        <div v-if="selectedStatus === 'Delivered' && requirePhotoForDelivery && !selectedFile" class="photo-required-message">
        <AlertCircle size="16" />
        <span>A delivery confirmation photo is required</span>
      </div>
    </div>
    
    <!-- Notification Component -->
    <OrderNotif
      v-if="showNotification"
      :title="notificationData.title"
      :message="notificationData.message"
      :type="notificationData.type"
      @close="hideNotification"
    />
  </div>
</template>

<script setup>
import { ref, watch, computed, reactive, onUnmounted } from 'vue';
import { getFirestore, doc, updateDoc, serverTimestamp, getDoc, runTransaction, increment, addDoc, collection } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera, X, AlertCircle, Loader } from 'lucide-vue-next';
import OrderNotif from '@/components/sellerside/OrderNotif.vue';

const props = defineProps({
  orderId: {
    type: String,
    required: true
  },
  currentStatus: {
    type: String,
    default: 'Pending'
  },
  orderData: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['statusUpdated']);

  const statusOptions = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Refund Processing', 'Cancelled'];
const selectedStatus = ref(props.currentStatus);
const estimatedTime = ref(4); // Default 4 hours
const deliveryNotes = ref('');
const sellerContact = ref('');
const fileInput = ref(null);
const imagePreview = ref(null);
const selectedFile = ref(null);
const isUpdating = ref(false);
const requirePhotoForDelivery = ref(true);
const errors = reactive({
  image: ''
});

// Camera related refs
const isCameraOpen = ref(false);
const video = ref(null);
const mediaStream = ref(null);

// Notification state
const showNotification = ref(false);
const notificationData = ref({
  title: '',
  message: '',
  type: 'info'
});

// Function to show notification
const showNotif = (title, message, type = 'info', duration = null) => {
  // Clear any existing notification first
  showNotification.value = false;
  
  // Small delay to ensure smooth transition
  setTimeout(() => {
    notificationData.value = { title, message, type };
    showNotification.value = true;
    
    // Auto-hide after specified duration or default based on type
    const timeout = duration || (type === 'error' ? 5000 : type === 'success' ? 4000 : 3500);
    setTimeout(() => {
      showNotification.value = false;
    }, timeout);
  }, 100);
};

// Function to hide notification
const hideNotification = () => {
  showNotification.value = false;
};

// Unit display mapping
const unitDisplayMap = {
  'kg': 'Kilogram',
  'sack': 'Sack',
  'tali': 'Tali',
  'kaing': 'Kaing',
  'bundle': 'Bundle',
  'tray': 'Tray',
  'piece': 'Piece',
  'perKilo': 'Kilogram',
  'perSack': 'Sack',
  'perTali': 'Tali',
  'perKaing': 'Kaing',
  'perBundle': 'Bundle',
  'perTray': 'Tray',
  'perPiece': 'Piece'
};

// Helper function to get unit display name
const getUnitDisplay = (unit) => {
  return unitDisplayMap[unit] || unit || 'Unit';
};

// Helper function to calculate unit price with fallback options
const getUnitPrice = (order) => {
  if (!order) return 0;
  
  // Priority: unitPrice -> pricePerKg -> calculated from total
  if (order.unitPrice && order.unitPrice > 0) {
    return order.unitPrice;
  }
  if (order.pricePerKg && order.pricePerKg > 0) {
    return order.pricePerKg;
  }
  if (order.totalPrice && order.quantity && order.quantity > 0) {
    return order.totalPrice / order.quantity;
  }
  return 0;
};

// Computed property for displaying quantity and unit based on weight
const quantityDisplay = computed(() => {
  const order = props.orderData;
  if (!order) return { quantity: 'N/A', unit: 'N/A' };
  
  const weight = order.weight || order.quantity || 0;
  const packagingType = order.packagingType || order.unit || 'kg';
  
  return {
    quantity: weight,
    unit: getUnitDisplay(packagingType)
  };
});

// Helper function to format price
const formatPrice = (price) => {
  const numPrice = parseFloat(price) || 0;
  return numPrice.toFixed(2);
};

// Computed property for subtotal
const subtotalDisplay = computed(() => {
  const order = props.orderData;
  if (!order) return '0.00';
  
  const quantity = order.weight || order.quantity || 0;
  const unitPrice = getUnitPrice(order);
  const subtotal = quantity * unitPrice;
  
  return formatPrice(subtotal);
});

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  // Validate file type
  if (!file.type.match('image.*')) {
    errors.image = 'Please select an image file';
    return;
  }
  
  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    errors.image = 'Image size should not exceed 2MB';
    return;
  }
  
  errors.image = '';
  selectedFile.value = file;
  
  // Create preview
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.value = e.target.result;
  };
  reader.readAsDataURL(file);
};

// Camera functions
const openCamera = async () => {
  try {
    isCameraOpen.value = true;
    const constraints = { 
      video: { 
        facingMode: 'environment', // Prefer rear camera
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } 
    };
    
    mediaStream.value = await navigator.mediaDevices.getUserMedia(constraints);
    if (video.value) {
      video.value.srcObject = mediaStream.value;
    }
  } catch (error) {
    console.error('Error accessing camera:', error);
    showNotif(
      'Camera Access Failed',
      'Could not access the camera. Please check permissions and try again.',
      'error'
    );
    closeCamera();
  }
};

const closeCamera = () => {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop());
    mediaStream.value = null;
  }
  isCameraOpen.value = false;
};

const capturePhoto = () => {
  if (!video.value) return;
  
  const canvas = document.createElement('canvas');
  canvas.width = video.value.videoWidth;
  canvas.height = video.value.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video.value, 0, 0, canvas.width, canvas.height);
  
  // Convert canvas to Blob
  canvas.toBlob((blob) => {
    if (!blob) return;
    
    // Create a File from the Blob
    const file = new File([blob], 'delivery-photo.jpg', { type: 'image/jpeg' });
    selectedFile.value = file;
    imagePreview.value = canvas.toDataURL('image/jpeg');
    closeCamera();
    
    showNotif(
      'Photo Captured!',
      'Delivery confirmation photo captured successfully',
      'success',
      2000
    );
  }, 'image/jpeg', 0.9); // 0.9 is the quality (0-1)
};

const removeImage = () => {
  selectedFile.value = null;
  imagePreview.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// Clean up camera on unmount
onUnmounted(() => {
  closeCamera();
});

// Use base64 approach to avoid CORS issues
const saveImageToFirestore = async () => {
  if (!selectedFile.value) return null;
  
  try {
    console.log('Converting image to base64...');
    // Convert the image to base64 string
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      reader.onerror = (e) => {
        console.error('Error reading file:', e);
        reject(new Error('Failed to read image file'));
      };
      reader.readAsDataURL(selectedFile.value);
    });
  } catch (error) {
    console.error("Error processing image:", error);
    throw new Error('Failed to process image');
  }
};

// Handle stock reduction when order status changes to Processing
const handleStockReduction = async () => {
  try {
    const order = props.orderData;
    if (!order || !order.productId) {
      console.warn('No product ID found in order data');
      return;
    }
    
    const db = getFirestore();
    const productRef = doc(db, 'products', order.productId);
    
    // Get the current product data
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      console.error('Product not found:', order.productId);
      throw new Error('Product not found');
    }
    
    const productData = productSnap.data();
    
    // Get the quantity to reduce from the order
    const quantityToReduce = order.weight || order.quantity || quantityDisplay.value.quantity || 0;
    
    // Get the unit from the order (check multiple possible fields)
    const orderUnit = order.unit || order.packagingType || order.selectedUnit || 'kg';
    
    // Map order unit to stock field name
    const unitToStockFieldMap = {
      'kg': 'stockPerKilo',
      'kilogram': 'stockPerKilo',
      'kilo': 'stockPerKilo',
      'perKilo': 'stockPerKilo',
      'sack': 'stockPerSack',
      'perSack': 'stockPerSack',
      'tali': 'stockPerTali',
      'perTali': 'stockPerTali',
      'kaing': 'stockPerKaing',
      'perKaing': 'stockPerKaing',
      'bundle': 'stockPerBundle',
      'perBundle': 'stockPerBundle',
      'tray': 'stockPerTray',
      'perTray': 'stockPerTray',
      'piece': 'stockPerPiece',
      'perPiece': 'stockPerPiece'
    };
    
    // Get the appropriate stock field name
    const stockFieldName = unitToStockFieldMap[orderUnit.toLowerCase()] || 'stockPerKilo';
    
    // Get current stock for the specific unit
    const currentUnitStock = productData[stockFieldName] || 0;
    
    // Calculate new stock for the specific unit
    const newUnitStock = Math.max(0, currentUnitStock - quantityToReduce);
    
    // Prepare update data
    const updateData = {
      [stockFieldName]: newUnitStock,
      lastUpdated: serverTimestamp()
    };
    
    // Update the product stock for the specific unit
    await updateDoc(productRef, updateData);
    
    console.log(`Stock reduced for product ${order.productId}: ${stockFieldName} ${currentUnitStock} -> ${newUnitStock} (reduced by ${quantityToReduce})`);
    
    // Show success notification
    showNotif(
      'Stock Updated Successfully!', 
      `${quantityToReduce} ${quantityDisplay.value.unit} deducted from inventory`,
      'success',
      3000 // Show for 3 seconds
    );
    
  } catch (error) {
    console.error('Error reducing stock:', error);
    showNotif(
      'Stock Update Failed',
      `Failed to update stock: ${error.message}`,
      'error'
    );
    throw error;
  }
};

const updateOrderStatus = async () => {
  // Validate if photo is required for delivery
  if (selectedStatus.value === 'Delivered' && requirePhotoForDelivery.value && !selectedFile.value) {
    return;
  }
  
  isUpdating.value = true;
  
  try {
    const db = getFirestore();
    const orderRef = doc(db, 'orders', props.orderId);
    
    // Base update data
    const updateData = {
      status: selectedStatus.value,
      lastUpdated: serverTimestamp()
    };
    
    // Add status timestamp to track when each status change occurred
    updateData[`statusTimestamps.${selectedStatus.value}`] = serverTimestamp();
    
    // Handle stock reduction when status changes to Processing
    if (selectedStatus.value === 'Processing') {
      await handleStockReduction();
    }
    
    // Add additional data for shipped status
    if (selectedStatus.value === 'Shipped') {
      updateData.estimatedDeliveryHours = parseInt(estimatedTime.value) || 4;
      updateData.deliveryNotes = deliveryNotes.value;
      updateData.sellerContact = sellerContact.value;
    }
    
    // Add delivery photo for delivered status
    if (selectedStatus.value === 'Delivered') {
      if (selectedFile.value) {
        // Store the image as base64 directly in Firestore
        updateData.deliveryPhotoURL = await saveImageToFirestore();
      }
      
      if (deliveryNotes.value) {
        updateData.deliveryNotes = deliveryNotes.value;
      }
    }
    
    await updateDoc(orderRef, updateData);

    // If order marked as Delivered or Order Received, increment product.sold once (idempotent)
    if (selectedStatus.value === 'Delivered' || selectedStatus.value === 'Order Received') {
      try {
        await runTransaction(db, async (transaction) => {
          const freshOrderSnap = await transaction.get(orderRef);
          if (!freshOrderSnap.exists()) return;
          const odata = freshOrderSnap.data() || {};
          // Skip if already applied
          if (odata.soldCountApplied === true) return;
          const productId = odata.productId;
          if (!productId) return;
          const productRef = doc(db, 'products', productId);
          const qty = Number(odata.quantity);
          const incrementBy = !isNaN(qty) && qty > 0 ? qty : 1;
          transaction.update(productRef, {
            sold: increment(incrementBy),
            lastSoldAt: serverTimestamp()
          });
          transaction.update(orderRef, { soldCountApplied: true });
        });
      } catch (e) {
        // Non-blocking: log but don't fail the UI update
        console.error('Failed to apply sold counter:', e);
      }
    }

    // Create a customer notification about the status change
    try {
      const o = props.orderData || {};
      const customerId = o.userId;
      if (customerId) {
        const code = o.orderCode || (props.orderId ? props.orderId.substring(0, 6) : '');
        const phrases = {
          'Pending': `We've received your order #${code}. It's now pending confirmation.`,
          'Processing': `Order #${code} is already On Processing.`,
          'On Processing': `Order #${code} is already On Processing.`,
          'Shipped': `Order #${code} is on the way. You'll be notified upon arrival.`,
          'Delivered': `Order #${code} has been delivered. Please verify your items.`,
          'Order Received': `Thanks! We've marked order #${code} as received.`,
          'Refund Processing': `Your refund request for order #${code} is being processed.`,
          'Cancelled': `Order #${code} has been cancelled.`
        };
        await addDoc(collection(db, 'notifications'), {
          type: 'order_update',
          recipientType: 'customer',
          customerId,
          userId: customerId,
          sellerId: o.sellerId || null,
          title: `Order update: ${selectedStatus.value}`,
          message: phrases[selectedStatus.value] || `Order #${code} status updated to ${selectedStatus.value}.`,
          orderDetails: {
            orderId: props.orderId,
            orderCode: o.orderCode || code,
            amount: Number(o.totalPrice || 0)
          },
          status: selectedStatus.value,
          read: false,
          createdAt: serverTimestamp(),
          timestamp: serverTimestamp()
        });
      }
    } catch (e) {
      console.error('Failed to create customer notification:', e);
      // non-blocking
    }
      emit('statusUpdated', {
      status: selectedStatus.value,
      additionalData: selectedStatus.value === 'Shipped' ? {
        estimatedTime: estimatedTime.value,
        deliveryNotes: deliveryNotes.value,
        sellerContact: sellerContact.value
      } : selectedStatus.value === 'Delivered' ? {
        deliveryPhotoURL: updateData.deliveryPhotoURL,
        deliveryNotes: deliveryNotes.value
      } : null    });
    
    // Show success notification for status update with a slight delay
    setTimeout(() => {
      showNotif(
        'Order Status Updated!',
        `Order status has been successfully changed to ${selectedStatus.value}`,
        'success',
        4000 // Show for 4 seconds
      );
    }, 500); // 500ms delay to ensure it shows after stock reduction notification
    
    // Reset form after successful update
    if (selectedStatus.value === 'Delivered') {
      selectedFile.value = null;
      imagePreview.value = null;
      if (fileInput.value) {
        fileInput.value.value = '';
      }
      deliveryNotes.value = '';
    }
    
  } catch (error) {
    console.error('Error updating order status:', error);
    showNotif(
      'Update Failed',
      'Failed to update order status. Please try again.',
      'error'
    );
  } finally {
    isUpdating.value = false;
  }
};
</script>

<style scoped>
.status-update-container {
  margin-top: 20px;
}

.status-update-container h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 15px 0;
}

.order-summary {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
}

.summary-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
}

.quantity-display {
  display: flex;
  align-items: center;
  gap: 6px;
}

.quantity-number {
  font-size: 1rem;
  font-weight: 700;
  color: #2e5c31;
}

.quantity-unit {
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
  text-transform: capitalize;
  background-color: #e2e8f0;
  padding: 2px 6px;
  border-radius: 4px;
}

.status-update-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.status-select-container {
  position: relative;
}

.status-select {
  width: 100%;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  font-size: 0.9rem;
  background-color: white;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
}

.additional-fields {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 15px;
  background-color: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.field-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #4b5563;
}

.time-input, .contact-input {
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  font-size: 0.9rem;
}

.notes-input {
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  font-size: 0.9rem;
  min-height: 80px;
  resize: vertical;
}

.update-status-btn {
  padding: 12px 16px;
  background-color: #2e5c31;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.update-status-btn:hover:not(:disabled) {
  background-color: #234425;
}

.update-status-btn:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

/* Image upload styles */
.image-options {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.image-option-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.image-option-btn:hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
}

.image-option-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.image-option-btn i {
  font-size: 16px;
}

.camera-view {
  position: relative;
  width: 100%;
  height: 300px;
  margin-bottom: 15px;
  border-radius: 6px;
  overflow: hidden;
  background-color: #000;
}

.camera-feed {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.camera-controls {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 20px;
}

.camera-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.capture-btn {
  background-color: #fff;
  color: #ef4444;
  font-size: 20px;
}

.capture-btn:hover {
  background-color: #f1f5f9;
  transform: scale(1.1);
}

.cancel-btn {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 18px;
}

.cancel-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.image-preview-container {
  position: relative;
  width: 100%;
  height: 300px;
  margin-bottom: 15px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.remove-image-btn:hover {
  background-color: rgba(220, 38, 38, 0.8);
  transform: scale(1.1);
}

.image-upload-container {
  position: relative;
  margin-top: 5px;
}

.image-preview {
  width: 100%;
  height: 200px;
  border: 2px dashed #e9ecef;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.2s ease;
}

.image-preview:hover {
  border-color: #3498db;
}

.image-preview.has-image {
  border-style: solid;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #6c757d;
  gap: 8px;
}

.upload-placeholder i {
  font-size: 2.5rem;
}

.file-input {
  display: none;
}

.photo-help-text {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 5px;
}

.photo-required-message {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #ef4444;
}

.error-message {
  color: #ef4444;
  font-size: 0.75rem;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .order-summary {
    padding: 12px;
    gap: 10px;
  }
  
  .summary-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .quantity-display {
    align-self: flex-end;
  }
  
  .image-options {
    flex-direction: column;
  }
  
  .camera-view,
  .image-preview-container {
    height: 250px;
  }
}
</style>