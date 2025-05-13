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
      
      <!-- Delivery confirmation photo upload for Delivered status -->
      <div v-if="selectedStatus === 'Delivered'" class="additional-fields">
        <div class="field-group">
          <label for="deliveryPhoto">Delivery Confirmation Photo</label>
          <div class="photo-upload-container">
            <div 
              v-if="!deliveryPhotoPreview" 
              class="photo-upload-placeholder"
              @click="triggerFileInput"
            >
              <Camera size="24" />
              <span>Upload Delivery Photo</span>
            </div>
            <div v-else class="photo-preview-container">
              <img :src="deliveryPhotoPreview" alt="Delivery confirmation" class="photo-preview" />
              <button class="remove-photo-btn" @click="removePhoto">
                <X size="16" />
              </button>
            </div>
            <input 
              type="file"
              ref="fileInput"
              accept="image/*"
              class="file-input"
              @change="handleFileChange"
            />
          </div>
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
        :disabled="isUpdating || (selectedStatus === 'Delivered' && !deliveryPhoto && requirePhotoForDelivery)"
      >
        <Loader v-if="isUpdating" size="16" class="spinner" />
        <span v-else>Update Status</span>
      </button>
      
      <div v-if="selectedStatus === 'Delivered' && requirePhotoForDelivery && !deliveryPhoto" class="photo-required-message">
        <AlertCircle size="16" />
        <span>A delivery confirmation photo is required</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
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
const deliveryPhoto = ref(null);
const deliveryPhotoPreview = ref(null);
const fileInput = ref(null);
const isUpdating = ref(false);
const requirePhotoForDelivery = ref(true); // Set to true to make photo required for delivery

// Reset additional fields when status changes
watch(selectedStatus, (newStatus) => {
  if (newStatus !== 'Shipped') {
    estimatedTime.value = 4;
    deliveryNotes.value = '';
  }
  
  if (newStatus !== 'Delivered') {
    deliveryPhoto.value = null;
    deliveryPhotoPreview.value = null;
  }
});

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  // Check file type
  if (!file.type.match('image.*')) {
    alert('Please select an image file');
    return;
  }
  
  // Check file size (limit to 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('Image size should be less than 5MB');
    return;
  }
  
  deliveryPhoto.value = file;
  
  // Create preview
  const reader = new FileReader();
  reader.onload = (e) => {
    deliveryPhotoPreview.value = e.target.result;
  };
  reader.readAsDataURL(file);
};

const removePhoto = () => {
  deliveryPhoto.value = null;
  deliveryPhotoPreview.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const uploadDeliveryPhoto = async () => {
  if (!deliveryPhoto.value) return null;

  const storage = getStorage();
  const photoRef = storageRef(storage, `delivery-photos/${props.orderId}_${Date.now()}`);

  // Add this metadata object with CORS settings
  const metadata = {
    contentType: deliveryPhoto.value.type,
    customMetadata: {
      'Access-Control-Allow-Origin': '*'
    }
  };

  try {
    // Pass the metadata as the third parameter
    const snapshot = await uploadBytes(photoRef, deliveryPhoto.value, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading delivery photo:', error);
    throw error;
  }
};

const updateOrderStatus = async () => {
  // Validate if photo is required for delivery
  if (selectedStatus.value === 'Delivered' && requirePhotoForDelivery.value && !deliveryPhoto.value) {
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
      if (deliveryPhoto.value) {
        const photoURL = await uploadDeliveryPhoto();
        updateData.deliveryPhotoURL = photoURL;
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
      deliveryPhoto.value = null;
      deliveryPhotoPreview.value = null;
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

/* Photo upload styles */
.photo-upload-container {
  position: relative;
  width: 100%;
  margin-top: 5px;
}

.photo-upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 150px;
  border: 2px dashed #d1d5db;
  border-radius: 6px;
  background-color: #f9fafb;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
}

.photo-upload-placeholder:hover {
  border-color: #9ca3af;
  background-color: #f3f4f6;
}

.file-input {
  display: none;
}

.photo-preview-container {
  position: relative;
  width: 100%;
  height: 200px;
  border-radius: 6px;
  overflow: hidden;
}

.photo-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-photo-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  color: #ef4444;
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