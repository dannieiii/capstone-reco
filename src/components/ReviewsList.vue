<template>
  <div class="reviews-list">
    <div v-if="loading" class="loading-state">
      <Loader2 size="24" class="spinner" />
      <p>Loading reviews...</p>
    </div>
    
    <div v-else-if="reviews.length === 0" class="empty-state">
      <MessageSquare size="40" />
      <p>No reviews yet</p>
      <p class="sub-text">Be the first to review this product!</p>
    </div>
    
    <div v-else class="reviews-container">
      <div v-for="review in reviews" :key="review.id" class="review-card">
        <div class="review-header">
          <div class="reviewer-info">
            <div class="reviewer-avatar">
              <User size="18" />
            </div>
            <div>
              <h4>{{ review.username }}</h4>
              <p class="review-date">{{ formatDate(review.createdAt) }}</p>
            </div>
          </div>
          <div class="review-rating">
            <Star 
              v-for="star in 5" 
              :key="star" 
              :size="16" 
              :fill="review.rating >= star ? '#FFD700' : '#E0E0E0'" 
              :color="review.rating >= star ? '#FFD700' : '#E0E0E0'" 
            />
          </div>
        </div>
        <div class="review-content">
          <p>{{ review.review }}</p>
          <div v-if="review.imageUrl" class="review-image">
            <img :src="review.imageUrl" alt="Review image" @click="openImageModal(review.imageUrl)" />
          </div>
        </div>
      </div>
    </div>

    <!-- Image Modal -->
    <div v-if="showImageModal" class="image-modal" @click="closeImageModal">
      <div class="modal-content" @click.stop>
        <img :src="modalImageUrl" alt="Review image" />
        <button class="close-modal" @click="closeImageModal">
          <X size="24" />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { Loader2, MessageSquare, Star, User, X } from 'lucide-vue-next';
import { ref, onMounted } from 'vue';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

export default {
  components: {
    Loader2,
    MessageSquare,
    Star,
    User,
    X
  },
  props: {
    productId: {
      type: String,
      required: true
    },
    limit: {
      type: Number,
      default: 5
    }
  },
  setup(props) {
    const reviews = ref([]);
    const loading = ref(true);
    const showImageModal = ref(false);
    const modalImageUrl = ref('');
    
    const fetchReviews = async () => {
      loading.value = true;
      try {
        // Simplified query - only filter by productId
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('productId', '==', props.productId)
        );
        
        const querySnapshot = await getDocs(reviewsQuery);
        
        // Get reviews and sort client-side
        let reviewsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));

        // Sort by createdAt descending (newest first)
        reviewsData.sort((a, b) => b.createdAt - a.createdAt);
        
        // Apply limit if specified
        if (props.limit > 0) {
          reviewsData = reviewsData.slice(0, props.limit);
        }

        reviews.value = reviewsData;
      } catch (error) {
        console.error('Error fetching reviews:', error);
        // Show user-friendly error message
        reviews.value = [];
      } finally {
        loading.value = false;
      }
    };
    
    const formatDate = (date) => {
      if (!date) return '';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    const openImageModal = (imageUrl) => {
      modalImageUrl.value = imageUrl;
      showImageModal.value = true;
    };

    const closeImageModal = () => {
      showImageModal.value = false;
      modalImageUrl.value = '';
    };
    
    onMounted(() => {
      fetchReviews();
    });
    
    return {
      reviews,
      loading,
      formatDate,
      showImageModal,
      modalImageUrl,
      openImageModal,
      closeImageModal
    };
  }
};
</script>

<style scoped>
.reviews-list {
  width: 100%;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
  color: #666;
}

.spinner {
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
  color: #666;
  text-align: center;
}

.empty-state svg {
  color: #ccc;
  margin-bottom: 10px;
}

.sub-text {
  font-size: 14px;
  color: #999;
  margin-top: 5px;
}

.reviews-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.review-card {
  background-color: white;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.reviewer-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.reviewer-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #f0f8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2e5c31;
}

.reviewer-info h4 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 3px 0;
  color: #333;
}

.review-date {
  font-size: 12px;
  color: #888;
  margin: 0;
}

.review-rating {
  display: flex;
  gap: 2px;
}

.review-content {
  font-size: 14px;
  line-height: 1.5;
  color: #555;
}

.review-content p {
  margin: 0 0 10px 0;
}

.review-image {
  margin-top: 10px;
}

.review-image img {
  max-width: 200px;
  max-height: 150px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.review-image img:hover {
  transform: scale(1.02);
}

.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
}

.modal-content img {
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
}

.close-modal {
  position: absolute;
  top: -15px;
  right: -15px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.close-modal:hover {
  background-color: #f5f5f5;
}
</style>
