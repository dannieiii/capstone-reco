<template>
    <div class="ratings-summary">
      <div v-if="loading" class="loading-state">
        <Loader2 size="20" class="spinner" />
      </div>
      
      <div v-else class="summary-content">
        <div class="average-rating">
          <span class="rating-number">{{ averageRating.toFixed(1) }}</span>
          <div class="stars-display">
            <div class="stars-filled" :style="{ width: `${averageRatingPercent}%` }">
              <Star v-for="i in 5" :key="`filled-${i}`" :size="16" fill="#FFD700" color="#FFD700" />
            </div>
            <div class="stars-background">
              <Star v-for="i in 5" :key="`bg-${i}`" :size="16" fill="#E0E0E0" color="#E0E0E0" />
            </div>
          </div>
        </div>
        
        <div class="rating-count">
          <span>{{ totalReviews }} {{ totalReviews === 1 ? 'review' : 'reviews' }}</span>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { Star, Loader2 } from 'lucide-vue-next';
  import { ref, computed, onMounted } from 'vue';
  import { collection, query, where, getDocs } from 'firebase/firestore';
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
      }
    },
    setup(props) {
      const loading = ref(true);
      const totalReviews = ref(0);
      const ratingSum = ref(0);
      
      const averageRating = computed(() => {
        if (totalReviews.value === 0) return 0;
        return ratingSum.value / totalReviews.value;
      });
      
      const averageRatingPercent = computed(() => {
        return (averageRating.value / 5) * 100;
      });
      
      const fetchRatings = async () => {
        loading.value = true;
        try {
          const reviewsQuery = query(
            collection(db, 'reviews'),
            where('productId', '==', props.productId)
          );
          
          const querySnapshot = await getDocs(reviewsQuery);
          
          totalReviews.value = querySnapshot.size;
          ratingSum.value = querySnapshot.docs.reduce((sum, doc) => {
            return sum + doc.data().rating;
          }, 0);
        } catch (error) {
          console.error('Error fetching ratings:', error);
        } finally {
          loading.value = false;
        }
      };
      
      onMounted(() => {
        fetchRatings();
      });
      
      return {
        loading,
        totalReviews,
        averageRating,
        averageRatingPercent
      };
    }
  };
  </script>
  
  <style scoped>
  .ratings-summary {
    display: flex;
    align-items: center;
  }
  
  .loading-state {
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 5px 0;
  }
  
  .spinner {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .summary-content {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .average-rating {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .rating-number {
    font-size: 16px;
    font-weight: 700;
    color: #333;
  }
  
  .stars-display {
    position: relative;
    display: inline-block;
  }
  
  .stars-background {
    display: flex;
  }
  
  .stars-filled {
    position: absolute;
    top: 0;
    left: 0;
    white-space: nowrap;
    overflow: hidden;
    display: flex;
  }
  
  .rating-count {
    font-size: 14px;
    color: #666;
  }
  </style>