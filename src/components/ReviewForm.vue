<template>
  <div class="review-form-container">
    <h3 class="review-title">Write a Review</h3>
    
    <div class="rating-input">
      <p>Rate this product:</p>
      <div class="stars-container">
        <button 
          v-for="star in 5" 
          :key="star" 
          type="button"
          class="star-button"
          @click="setRating(star)"
        >
          <Star 
            :size="24" 
            :fill="rating >= star ? '#FFD700' : '#E0E0E0'" 
            :color="rating >= star ? '#FFD700' : '#E0E0E0'" 
          />
        </button>
      </div>
    </div>
    
    <div class="review-input">
      <label for="review-text">Your Review:</label>
      <textarea 
        id="review-text" 
        v-model="reviewText" 
        placeholder="Share your experience with this product..."
        rows="4"
        :class="{ 'error': containsProfanity(reviewText) }"
      ></textarea>
      <div v-if="containsProfanity(reviewText)" class="error-message">
        <span>⚠️ Your review contains inappropriate language. Please revise your review.</span>
      </div>
    </div>
    
    <div class="image-upload">
      <label>Upload Image (Optional):</label>
      <div class="upload-area" @click="triggerFileInput">
        <input 
          type="file" 
          ref="fileInput" 
          accept="image/*" 
          @change="handleFileUpload"
          style="display: none"
        >
        <div v-if="!previewImage" class="upload-placeholder">
          <Upload size="24" />
          <p>Click to upload an image</p>
        </div>
        <div v-else class="image-preview">
          <img :src="previewImage" alt="Preview" />
          <button class="remove-image" @click.stop="removeImage">
            <X size="16" />
          </button>
        </div>
      </div>
      <div v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
        </div>
        <p>Uploading... {{ uploadProgress }}%</p>
      </div>
    </div>
    
    <div class="form-actions">
      <button class="cancel-btn" @click="$emit('cancel')">Cancel</button>
      <button 
        class="submit-btn" 
        :disabled="!isValid || isSubmitting" 
        @click="submitReview"
      >
        <Loader2 v-if="isSubmitting" size="16" class="spinner" />
        <span v-else>Submit Review</span>
      </button>
    </div>
  </div>
</template>

<script>
import { Star, Loader2, Upload, X } from 'lucide-vue-next';
import { ref, computed } from 'vue';
import { addDoc, collection, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

export default {
  components: {
    Star,
    Loader2,
    Upload,
    X
  },
  props: {
    productId: {
      type: String,
      required: true
    },
    orderId: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    productImage: {
      type: String,
      default: ''
    }
    // sellerId is now fetched from the order collection instead of being passed as a prop
  },
  setup(props, { emit }) {
    const rating = ref(0);
    const reviewText = ref('');
    const isSubmitting = ref(false);
    const fileInput = ref(null);
    const selectedFile = ref(null);
    const previewImage = ref(null);
    const uploadProgress = ref(0);
    
    // Debug the props when component is created
    console.log('ReviewForm component created with props:', {
      orderId: props.orderId,
      productId: props.productId,
      userId: props.userId,
      productName: props.productName
    });
    
    // Profanity filter - list of forbidden words
    const forbiddenWords = [
      'stupid', 'idiot', 'dumb', 'hate', 'suck', 'sucks', 'terrible', 'awful',
      'worst', 'horrible', 'disgusting', 'trash', 'garbage', 'shit', 'damn',
      'hell', 'fuck', 'bitch', 'ass', 'bastard', 'crap', 'piss', 'bloody',
      'scam', 'fraud', 'fake', 'lie', 'liar', 'cheat', 'cheater', 'rip-off',
      'ripoff', 'useless', 'pathetic', 'worthless', 'junk',
      // Filipino profanity
      'putang ina', 'putangina', 'tangina', 'gago', 'gaga', 'bobo', 'hayop',
      'tarantado', 'ulol', 'puta', 'punyeta', 'leche', 'bwisit', 
      'walang hiya', 'walang-hiya', 'pakshet', 'hinayupak', 'ungas'
    ];

    const containsProfanity = (text) => {
      const cleanText = text.toLowerCase().replace(/[^a-z\s]/g, '');
      return forbiddenWords.some(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        return regex.test(cleanText);
      });
    };

    const isValid = computed(() => {
      return rating.value > 0 && reviewText.value.trim().length > 0 && !containsProfanity(reviewText.value);
    });
    
    const setRating = (value) => {
      rating.value = value;
    };
    
    const triggerFileInput = () => {
      fileInput.value.click();
    };
    
    const handleFileUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          emit('error', 'File size should be less than 5MB');
          return;
        }
        
        // Check file type
        if (!file.type.startsWith('image/')) {
          emit('error', 'Please select an image file');
          return;
        }
        
        selectedFile.value = file;
        previewImage.value = URL.createObjectURL(file);
        
        // Show quick progress animation for better UX
        uploadProgress.value = 50;
        setTimeout(() => {
          uploadProgress.value = 0;
        }, 500);
      }
    };
    
    const removeImage = () => {
      selectedFile.value = null;
      previewImage.value = null;
      uploadProgress.value = 0;
      if (fileInput.value) {
        fileInput.value.value = '';
      }
    };
    
    const uploadImage = async (file) => {
      return new Promise((resolve, reject) => {
        // Use FileReader to convert image to base64 (same as product table)
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target.result); // Returns base64 data URL
        };
        reader.onerror = (error) => {
          reject(error);
        };
        reader.readAsDataURL(file);
      });
    };
    
    const submitReview = async () => {
      if (!isValid.value || isSubmitting.value) return;
      
      // Double-check for profanity before submission
      if (containsProfanity(reviewText.value)) {
        emit('error', 'Your review contains inappropriate language. Please revise your review and try again.');
        return;
      }
      
      // Validate sellerId
      // Fetch the actual sellerId from the order instead of using props or hardcoded values
      let actualSellerId = null;
      try {
        console.log('🔍 Fetching order details for orderId:', props.orderId);
        const orderRef = doc(db, 'orders', props.orderId);
        const orderDoc = await getDoc(orderRef);
        
        if (orderDoc.exists()) {
          const orderData = orderDoc.data();
          actualSellerId = orderData.sellerId;
          console.log('✅ Successfully fetched sellerId from order:', actualSellerId);
          
          if (!actualSellerId) {
            console.error('❌ Order exists but sellerId is missing or null:', orderData);
            emit('error', 'Order data is incomplete - sellerId not found');
            isSubmitting.value = false;
            return;
          }
        } else {
          console.error('❌ Order not found with ID:', props.orderId);
          emit('error', 'Order not found - cannot submit review');
          isSubmitting.value = false;
          return;
        }
      } catch (error) {
        console.error('❌ Error fetching order details:', error);
        emit('error', 'Failed to fetch order details: ' + error.message);
        isSubmitting.value = false;
        return;
      }
      
      console.log(`✅ Using actual sellerId from order: ${actualSellerId}`);
      
      isSubmitting.value = true;
      uploadProgress.value = 0;
      
      try {
        let imageUrl = null;
        
        // Upload image if selected
        if (selectedFile.value) {
          try {
            imageUrl = await uploadImage(selectedFile.value);
            uploadProgress.value = 100; // Set to 100% since base64 conversion is instant
          } catch (uploadError) {
            console.error('Image processing failed:', uploadError);
            emit('error', 'Failed to process image. Please try again.');
            isSubmitting.value = false;
            return;
          }
        }
        
        const reviewData = {
          productId: props.productId,
          orderId: props.orderId,
          userId: props.userId,
          username: props.username,
          productName: props.productName,
          productImage: props.productImage,
          sellerId: actualSellerId, // Use the actual sellerId fetched from the order
          rating: rating.value,
          review: reviewText.value.trim(),
          createdAt: serverTimestamp(),
          ...(imageUrl && { imageUrl })
        };
        
        console.log('📝 Submitting review with data:', {
          orderId: reviewData.orderId,
          productId: reviewData.productId,
          userId: reviewData.userId,
          sellerId: reviewData.sellerId,
          rating: reviewData.rating,
          hasReview: !!reviewData.review,
          hasImage: !!reviewData.imageUrl
        });
        console.log('🔑 SellerId being saved:', actualSellerId);
        console.log('📋 Full review data:', reviewData);
        
        // Add review to reviews collection
        const docRef = await addDoc(collection(db, 'reviews'), reviewData);
        console.log('Review saved with ID:', docRef.id);
        
        // Update order to mark it as reviewed
        if (props.orderId) {
          const orderRef = doc(db, 'orders', props.orderId);
          await updateDoc(orderRef, {
            isReviewed: true
          });
        }
        
        emit('success', {
          id: docRef.id,
          ...reviewData
        });
        
        // Reset form
        rating.value = 0;
        reviewText.value = '';
        removeImage();
      } catch (error) {
        console.error('Error submitting review:', error);
        emit('error', 'Failed to submit review. Please try again.');
      } finally {
        isSubmitting.value = false;
        uploadProgress.value = 0;
      }
    };      return {
      rating,
      reviewText,
      isSubmitting,
      isValid,
      setRating,
      submitReview,
      fileInput,
      previewImage,
      triggerFileInput,
      handleFileUpload,
      removeImage,
      uploadProgress,
      containsProfanity
    };
  }
};
</script>

<style scoped>
.review-form-container {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.review-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #333;
}

.rating-input {
  margin-bottom: 15px;
}

.rating-input p {
  font-size: 14px;
  margin-bottom: 8px;
  color: #555;
}

.stars-container {
  display: flex;
  gap: 5px;
}

.star-button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.star-button:hover {
  transform: scale(1.1);
}

.review-input {
  margin-bottom: 20px;
}

.review-input label {
  display: block;
  font-size: 14px;
  margin-bottom: 8px;
  color: #555;
}

.review-input textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
}

.review-input textarea:focus {
  outline: none;
  border-color: #2e5c31;
}

.review-input textarea.error {
  border-color: #e53935;
  background-color: #fff5f5;
}

.error-message {
  margin-top: 5px;
  padding: 8px 12px;
  background-color: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 6px;
  font-size: 12px;
  color: #c62828;
}

.error-message span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.image-upload {
  margin-bottom: 20px;
}

.image-upload label {
  display: block;
  font-size: 14px;
  margin-bottom: 8px;
  color: #555;
}

.upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-area:hover {
  border-color: #2e5c31;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #888;
}

.upload-placeholder svg {
  color: #ccc;
}

.image-preview {
  position: relative;
  max-width: 100%;
}

.image-preview img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
}

.remove-image {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #fff;
  border: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.remove-image:hover {
  background-color: #f5f5f5;
}

.upload-progress {
  margin-top: 10px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #2e5c31;
  transition: width 0.3s ease;
}

.upload-progress p {
  font-size: 12px;
  color: #666;
  margin: 5px 0 0 0;
  text-align: center;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-btn, .submit-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.cancel-btn:hover {
  background-color: #e5e5e5;
}

.submit-btn {
  background-color: #2e5c31;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
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
