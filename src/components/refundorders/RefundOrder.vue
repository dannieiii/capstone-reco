<template>
  <div class="refund-modal-overlay" v-if="isVisible">
    <div class="refund-modal">
      <!-- Initial Selection Screen -->
      <div v-if="!selectedOption">
        <div class="refund-header">
          <button class="back-button" @click="$emit('back')">
            <ChevronLeft size="20" />
          </button>
          <h2>What happened to your order?</h2>
        </div>
        
        <div class="refund-options">
          <div 
            class="refund-option" 
            v-for="option in refundOptions" 
            :key="option.id"
            @click="selectOption(option)"
          >
            <div class="option-icon">
              <component :is="option.icon" size="24" :color="option.color" />
            </div>
            <div class="option-content">
              <h3>{{ option.title }}</h3>
              <p>{{ option.description }}</p>
            </div>
            <ChevronRight size="20" color="#666" />
          </div>
        </div>
      </div>
      
      <!-- Detailed Refund Form -->
      <div v-if="selectedOption" class="refund-form-container">
        <div class="refund-form-header">
          <button class="back-button" @click="goBack">
            <ChevronLeft size="20" />
          </button>
          <h2>Request Return/Refund</h2>
        </div>
        
        <div class="refund-form-content">
          <!-- Product Information -->
          <div class="product-info">
            <img :src="currentOrder.productImage" :alt="currentOrder.productName" class="product-image" />
            <div class="product-details">
              <h3>{{ currentOrder.productName }}</h3>
              <p class="product-meta">{{ currentOrder.quantity }} {{ currentOrder.unit }} x ₱{{ currentOrder.unitPrice }}</p>
              <p class="product-total">x{{ currentOrder.quantity }}</p>
            </div>
          </div>
          
          <!-- Reason Section -->
          <div class="form-section">
            <div class="form-row">
              <label>Reason</label>
            </div>
            <div class="reason-display">
              <span class="reason-text">{{ getReasonText() }}</span>
              <span class="solution-text">Solution: Return and Refund</span>
            </div>
          </div>
          
          <!-- Description Section -->
          <div class="form-section">
            <div class="form-row form-row--description">
              <label>Description</label>
              <div class="char-count">{{ refundDetails.reason.length }}/2000</div>
            </div>
            <textarea 
              v-model="refundDetails.reason"
              placeholder="Describe the problem you faced"
              maxlength="2000"
              rows="4"
              class="description-textarea"
            ></textarea>
          </div>
          
          <!-- Evidence Upload Section -->
          <div class="form-section">
            <div class="evidence-upload">
              <div class="upload-section">
                <div class="upload-box" @click="triggerFileUpload">
                  <div class="upload-icon">
                    <Camera size="24" color="#666" />
                  </div>
                  <div class="upload-text">
                    <span>Add Photo</span>
                    <small>{{ uploadedImages.length }}/6</small>
                  </div>
                </div>
                
                <div class="upload-box">
                  <div class="upload-icon">
                    <Video size="24" color="#666" />
                  </div>
                  <div class="upload-text">
                    <span>Add Video</span>
                    <small>0/1</small>
                  </div>
                </div>
              </div>
              
              <div class="upload-limits">
                <small>Max: 5MB &nbsp;&nbsp;&nbsp;&nbsp; Max: 100MB</small>
              </div>
              
              <!-- Evidence Note -->
              <div class="evidence-note">
                <p>* Clear photo showing the parcel and the wrong product(s) received is mandatory for this request. <a href="#" class="view-examples">View Examples</a></p>
                <p>1. All products received after packaging is removed and indicate which item/s is/are wrong</p>
              </div>
              
              <!-- Uploaded Images Display -->
              <div v-if="uploadedImages.length > 0" class="uploaded-images">
                <div v-for="(image, index) in uploadedImages" :key="index" class="image-preview">
                  <img :src="image.preview" :alt="`Evidence ${index + 1}`" />
                  <button class="remove-image" @click="removeImage(index)">
                    <X size="16" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Refund Information -->
          <div class="form-section">
            <div class="refund-info">
              <div class="refund-row">
                <span class="label">Refund To</span>
                <span class="value">{{ sellerInfo.name }}</span>
              </div>
              
              <div class="refund-row">
                <span class="label">Refund Amount</span>
                <div class="amount-section">
                  <span class="amount">₱ {{ currentOrder.totalPrice }}</span>
                  <button class="view-detail">View Detail <ChevronDown size="16" /></button>
                </div>
              </div>
              
              <div class="refund-row">
                <span class="label">Contact Email</span>
                <div class="email-section">
                  <input 
                    type="email" 
                    v-model="refundDetails.contactEmail"
                    :placeholder="defaultEmail"
                    class="email-input"
                  />
                  <ChevronRight size="16" color="#666" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Submit Button -->
        <div class="form-actions">
          <button 
            class="submit-btn" 
            @click="submitRefund"
            :disabled="!canSubmit || isSubmitting"
          >
            <Loader2 v-if="isSubmitting" size="16" class="spinner" />
            <span v-else>Submit</span>
          </button>
        </div>
        
        <!-- Hidden file input -->
        <input 
          type="file" 
          ref="fileInput" 
          accept="image/*" 
          multiple
          @change="handleFileUpload"
          style="display: none"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Package, 
  AlertTriangle, 
  XCircle, 
  HelpCircle,
  Camera,
  Video,
  X,
  Loader2
} from 'lucide-vue-next';
import { ref, computed, onMounted, watch } from 'vue';
import { addDoc, collection, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

export default {
  name: 'RefundOrder',
  components: {
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Package,
    AlertTriangle,
    XCircle,
    HelpCircle,
    Camera,
    Video,
    X,
    Loader2
  },
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    order: {
      type: Object,
      required: true
    }
  },
  emits: ['back', 'cancel', 'success', 'error'],
  setup(props, { emit }) {
    const defaultOrderData = {
      id: null,
      orderCode: '',
      productId: '',
      productName: '',
      productImage: '',
      quantity: 0,
      unit: '',
      unitPrice: 0,
      totalPrice: 0,
      userId: null,
      sellerId: null,
      sellerName: 'Seller',
      sellerEmail: 'seller@example.com'
    };

    const currentOrder = computed(() => props.order ?? defaultOrderData);

    const selectedOption = ref(null);
    const fileInput = ref(null);
    const uploadedImages = ref([]);
    const isSubmitting = ref(false);
    const fallbackEmail = ref(currentOrder.value.sellerEmail || 'seller@example.com');
    const sellerInfo = ref({
      name: currentOrder.value.sellerName || 'Seller',
      email: fallbackEmail.value
    });
    const defaultEmail = ref(fallbackEmail.value);
    
    const refundDetails = ref({
      reason: '',
      contactEmail: defaultEmail.value,
    });
    
    const refundOptions = [
      {
        id: 'damaged',
        title: 'Received Damaged Item(s)',
        description: 'Physical/functional damages on Item',
        icon: 'Package',
        color: '#ff6b35'
      },
      {
        id: 'incorrect',
        title: 'Received Incorrect Item(s)',
        description: 'Wrong item, wrong size, counterfeit etc.',
        icon: 'AlertTriangle',
        color: '#ffa500'
      },
      {
        id: 'not-received',
        title: 'Did Not Receive Some/All of the Items',
        description: 'Some/all of my item(s) or accessories are not delivered',
        icon: 'XCircle',
        color: '#e53935'
      },
      {
        id: 'others',
        title: 'Others',
        description: '',
        icon: 'HelpCircle',
        color: '#666'
      }
    ];
    
    const canSubmit = computed(() => {
      return selectedOption.value && 
             refundDetails.value.reason.trim().length > 10 &&
             refundDetails.value.contactEmail.trim().length > 0 &&
             uploadedImages.value.length > 0; // Require at least one image as evidence
    });
    
    const getReasonText = () => {
      if (!selectedOption.value) return '';
      
      switch (selectedOption.value.id) {
        case 'damaged':
          return 'Physical/functional damages on Item';
        case 'incorrect':
          return 'Seller sent wrong item (e.g wrong size, model)';
        case 'not-received':
          return 'Did not receive some/all items';
        case 'others':
          return 'Other issues';
        default:
          return selectedOption.value.description || selectedOption.value.title;
      }
    };
    
    const selectOption = (option) => {
      selectedOption.value = option;
    };
    
    const goBack = () => {
      selectedOption.value = null;
      refundDetails.value.reason = '';
      uploadedImages.value = [];
    };
    
    const triggerFileUpload = () => {
      fileInput.value?.click();
    };
    
    const handleFileUpload = (event) => {
      const files = Array.from(event.target.files);
      
      files.forEach(file => {
        if (file.type.startsWith('image/') && uploadedImages.value.length < 6) {
          const reader = new FileReader();
          reader.onload = (e) => {
            uploadedImages.value.push({
              file: file,
              preview: e.target.result,
              name: file.name
            });
          };
          reader.readAsDataURL(file);
        }
      });
      
      // Clear the input
      event.target.value = '';
    };
    
    const removeImage = (index) => {
      uploadedImages.value.splice(index, 1);
    };
    
    const fetchSellerInfo = async () => {
      const orderSnapshot = currentOrder.value;
      const sellerId = orderSnapshot?.sellerId;
      const orderFallbackEmail = orderSnapshot?.sellerEmail || 'seller@example.com';
      fallbackEmail.value = orderFallbackEmail;
      if (!sellerId) {
        sellerInfo.value = {
          name: orderSnapshot?.sellerName || 'Seller',
          email: fallbackEmail.value
        };
        defaultEmail.value = fallbackEmail.value;
        refundDetails.value.contactEmail = defaultEmail.value;
        return;
      }
      try {
        const sellerRef = doc(db, 'sellers', sellerId);
        const sellerSnap = await getDoc(sellerRef);
        if (sellerSnap.exists()) {
          const sellerData = sellerSnap.data() || {};
          const personalInfo = sellerData.personalInfo || {};
          const fullName = [personalInfo.firstName, personalInfo.lastName]
            .filter(Boolean)
            .join(' ')
            .trim();
          const derivedName = fullName || personalInfo.storeName || orderSnapshot?.sellerName || 'Seller';
          const derivedEmail = personalInfo.email || fallbackEmail.value;
          sellerInfo.value = {
            name: derivedName,
            email: derivedEmail
          };
          defaultEmail.value = derivedEmail || 'seller@example.com';
          refundDetails.value.contactEmail = defaultEmail.value;
        } else {
          sellerInfo.value = {
            name: orderSnapshot?.sellerName || 'Seller',
            email: fallbackEmail.value
          };
          defaultEmail.value = fallbackEmail.value;
          refundDetails.value.contactEmail = defaultEmail.value;
        }
      } catch (error) {
        console.error('Error fetching seller info:', error);
        sellerInfo.value = {
          name: orderSnapshot?.sellerName || 'Seller',
          email: fallbackEmail.value
        };
        defaultEmail.value = fallbackEmail.value;
        refundDetails.value.contactEmail = defaultEmail.value;
      }
    };
    
    const submitRefund = async () => {
      if (!canSubmit.value || isSubmitting.value) return;
      
      isSubmitting.value = true;
      
      try {
        // Convert images to base64 for storage
        const evidenceImages = uploadedImages.value.map(img => ({
          data: img.preview,
          name: img.name
        }));
        
        const orderPayload = currentOrder.value;
        if (!orderPayload?.id) {
          emit('error', 'Order details are missing. Please try again.');
          return;
        }

        const refundData = {
          orderId: orderPayload.id,
          orderCode: orderPayload.orderCode,
          productId: orderPayload.productId,
          productName: orderPayload.productName,
          productImage: orderPayload.productImage,
          userId: orderPayload.userId,
          sellerId: orderPayload.sellerId,
          refundType: selectedOption.value.id,
          refundTitle: selectedOption.value.title,
          reason: refundDetails.value.reason.trim(),
          contactEmail: refundDetails.value.contactEmail.trim() || defaultEmail.value,
          refundAmount: orderPayload.totalPrice,
          orderTotal: orderPayload.totalPrice,
          evidence: evidenceImages,
          status: 'Pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        console.log('Submitting refund request:', refundData);
        
        // Add to refunds collection
        const docRef = await addDoc(collection(db, 'refunds'), refundData);
        
        // Update the order status to "Refund Processing"
        const orderRef = doc(db, 'orders', orderPayload.id);
        await updateDoc(orderRef, {
          status: 'Refund Processing',
          refundRequestedAt: serverTimestamp(),
          refundId: docRef.id
        });
        
        console.log('Refund request submitted with ID:', docRef.id);
        console.log('Order status updated to "Refund Processing"');
        
        emit('success', {
          id: docRef.id,
          ...refundData
        });
        
      } catch (error) {
        console.error('Error submitting refund request:', error);
        emit('error', 'Failed to submit refund request. Please try again.');
      } finally {
        isSubmitting.value = false;
      }
    };
    
    onMounted(fetchSellerInfo);
    
    watch(
      () => [props.order?.sellerId, props.order?.sellerEmail, props.order?.sellerName],
      () => {
        fetchSellerInfo();
      },
      { deep: false }
    );
    
    return {
      selectedOption,
      refundOptions,
      refundDetails,
      fileInput,
      uploadedImages,
      isSubmitting,
      defaultEmail,
      sellerInfo,
      currentOrder,
      canSubmit,
      getReasonText,
      selectOption,
      goBack,
      triggerFileUpload,
      handleFileUpload,
      removeImage,
      submitRefund
    };
  }
};
</script>

<style scoped>
.refund-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.refund-modal {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  margin: auto;
}

/* Initial Selection Screen Styles */
.refund-header {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  background-color: #f8f9fa;
}

.back-button {
  background: none;
  border: none;
  padding: 8px;
  margin-right: 15px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.refund-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.refund-options {
  padding: 20px;
}

.refund-option {
  display: flex;
  align-items: center;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refund-option:hover {
  border-color: #2e5c31;
  background-color: #f8f9fa;
}

.option-icon {
  margin-right: 15px;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f4e6;
}

.option-content {
  flex: 1;
}

.option-content h3 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.option-content p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

/* Detailed Form Styles */
.refund-form-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.refund-form-header {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  background-color: #f8f9fa;
}

.refund-form-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.refund-form-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  text-align: left;
}

.product-info {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
  text-align: center;
}

.product-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 15px;
}

.product-details h3 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.product-meta {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.product-total {
  margin: 2px 0 0 0;
  font-size: 12px;
  color: #666;
}

.form-section {
  margin-bottom: 20px;
  text-align: center;
}

.form-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.form-row--description {
  max-width: 320px;
  margin: 0 auto 8px;
}

.form-row label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.char-count {
  font-size: 12px;
  color: #666;
}

.reason-display {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.reason-text {
  font-size: 14px;
  color: #333;
}

.solution-text {
  font-size: 12px;
  color: #666;
}

.description-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  max-width: 320px;
  margin: 0 auto;
  display: block;
}

.description-textarea:focus {
  outline: none;
  border-color: #2e5c31;
}

.evidence-upload {
  margin-top: 10px;
}

.upload-section {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
  justify-content: center;
}

.upload-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  border: 1px dashed #ddd;
  border-radius: 8px;
  cursor: pointer;
  flex: 1;
  transition: border-color 0.2s;
}

.upload-box:hover {
  border-color: #2e5c31;
}

.upload-icon {
  margin-bottom: 8px;
}

.upload-text span {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.upload-text small {
  font-size: 10px;
  color: #666;
}

.upload-limits {
  text-align: center;
  margin-bottom: 15px;
}

.upload-limits small {
  font-size: 10px;
  color: #666;
}

.evidence-note {
  background-color: #fff9e6;
  padding: 12px;
  border-radius: 6px;
  border-left: 3px solid #ffa500;
  margin-bottom: 15px;
}

.evidence-note p {
  margin: 0 0 8px 0;
  font-size: 11px;
  color: #666;
}

.evidence-note p:last-child {
  margin-bottom: 0;
}

.view-examples {
  color: #007bff;
  text-decoration: none;
}

.uploaded-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
  justify-content: center;
}

.image-preview {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
}

.refund-info {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
}

.refund-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.refund-row:last-child {
  border-bottom: none;
}

.refund-row .label {
  font-size: 14px;
  color: #333;
}

.refund-row .value {
  font-size: 14px;
  color: #666;
}

.amount-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.amount {
  font-size: 16px;
  font-weight: 600;
  color: #e74c3c;
}

.view-detail {
  background: none;
  border: none;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.email-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.email-input {
  border: none;
  background: none;
  font-size: 14px;
  color: #333;
  outline: none;
  flex: 1;
  text-align: right;
}

.form-actions {
  padding: 20px;
  border-top: 1px solid #eee;
  background-color: #f8f9fa;
}

.submit-btn {
  width: 100%;
  padding: 15px;
  background-color: #2e5c31;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.submit-btn:hover:not(:disabled) {
  background-color: #1e4a21;
}

.submit-btn:disabled {
  background-color: #a5c2a7;
  cursor: not-allowed;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
