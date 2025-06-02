<template>
  <div class="status-update-container">
    <h3>Update Order Status</h3>
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
          <div class="image-upload-container">
            <div 
              class="image-preview" 
              :class="{ 'has-image': imagePreview }"
              @click="triggerFileInput"
            >
              <img v-if="imagePreview" :src="imagePreview" alt="Delivery confirmation" />
              <div v-else class="upload-placeholder">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Click to upload image</p>
              </div>
            </div>
            <input 
              type="file" 
              ref="fileInput" 
              @change="handleImageUpload" 
              accept="image/*" 
              class="file-input"
            />
          </div>
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
  </div>
</template>

<script setup>
import { ref, watch, computed, reactive } from 'vue';
import { getFirestore, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera, X, AlertCircle, Loader } from 'lucide-vue-next';

const props = defineProps({
  orderId: {
    type: String,
    required: true
  },
  currentStatus: {
    type: String,
    default: 'Pending'
  }
});

const emit = defineEmits(['statusUpdated']);

const statusOptions = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
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
    
    emit('statusUpdated', {
      status: selectedStatus.value,
      additionalData: selectedStatus.value === 'Shipped' ? {
        estimatedTime: estimatedTime.value,
        deliveryNotes: deliveryNotes.value,
        sellerContact: sellerContact.value
      } : selectedStatus.value === 'Delivered' ? {
        deliveryPhotoURL: updateData.deliveryPhotoURL,
        deliveryNotes: deliveryNotes.value
      } : null
    });
    
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
    alert('Failed to update order status. Please try again.');
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
</style>