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
        ></textarea>
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
  import { Star, Loader2 } from 'lucide-vue-next';
  import { ref, computed } from 'vue';
  import { addDoc, collection, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
  import { db } from '@/firebase/firebaseConfig';
  
  export default {
    components: {
      Star,
      Loader2
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
    },
    setup(props, { emit }) {
      const rating = ref(0);
      const reviewText = ref('');
      const isSubmitting = ref(false);
      
      const isValid = computed(() => {
        return rating.value > 0 && reviewText.value.trim().length > 0;
      });
      
      const setRating = (value) => {
        rating.value = value;
      };
      
      const submitReview = async () => {
        if (!isValid.value || isSubmitting.value) return;
        
        isSubmitting.value = true;
        
        try {
          const reviewData = {
            productId: props.productId,
            orderId: props.orderId,
            userId: props.userId,
            username: props.username,
            productName: props.productName,
            productImage: props.productImage,
            rating: rating.value,
            review: reviewText.value.trim(),
            createdAt: serverTimestamp()
          };
          
          // Add review to reviews collection
          const docRef = await addDoc(collection(db, 'reviews'), reviewData);
          
          // Update order to mark it as reviewed
          const orderRef = doc(db, 'orders', props.orderId);
          await updateDoc(orderRef, {
            isReviewed: true
          });
          
          emit('success', {
            id: docRef.id,
            ...reviewData
          });
          
          // Reset form
          rating.value = 0;
          reviewText.value = '';
        } catch (error) {
          console.error('Error submitting review:', error);
          emit('error', error.message);
        } finally {
          isSubmitting.value = false;
        }
      };
      
      return {
        rating,
        reviewText,
        isSubmitting,
        isValid,
        setRating,
        submitReview
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
  }
  
  .cancel-btn {
    background-color: #f5f5f5;
    color: #666;
    border: 1px solid #ddd;
  }
  
  .submit-btn {
    background-color: #2e5c31;
    color: white;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 100px;
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