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
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Loader2, MessageSquare, Star, User } from 'lucide-vue-next';
import { ref, onMounted } from 'vue';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

export default {
  components: {
    Loader2,
    MessageSquare,
    Star,
    User
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
    
    const fetchReviews = async () => {
      loading.value = true;
      try {
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('productId', '==', props.productId),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(reviewsQuery);
        
        reviews.value = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));
        
        if (props.limit > 0) {
          reviews.value = reviews.value.slice(0, props.limit);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
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
    
    onMounted(() => {
      fetchReviews();
    });
    
    return {
      reviews,
      loading,
      formatDate
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
  margin: 0;
}
</style>