<template>
    <div class="product-rating">
      <div v-if="loading" class="rating-loading">
        <span>...</span>
      </div>
      <div v-else class="rating-display">
        <Star size="12" fill="#FFD700" color="#FFD700" />
        <span>{{ rating }}</span>
      </div>
    </div>
  </template>
  
  <script>
  import { Star } from 'lucide-vue-next';
  import { ref, onMounted } from 'vue';
  import { collection, query, where, getDocs } from 'firebase/firestore';
  import { db } from '@/firebase/firebaseConfig';
  
  export default {
    components: {
      Star
    },
    props: {
      productId: {
        type: String,
        required: true
      }
    },
    setup(props) {
      const loading = ref(true);
      const rating = ref('0.0');
      
      const fetchRating = async () => {
        try {
          const reviewsQuery = query(
            collection(db, 'reviews'),
            where('productId', '==', props.productId)
          );
          
          const querySnapshot = await getDocs(reviewsQuery);
          
          if (querySnapshot.size > 0) {
            const totalRating = querySnapshot.docs.reduce((sum, doc) => {
              return sum + doc.data().rating;
            }, 0);
            
            rating.value = (totalRating / querySnapshot.size).toFixed(1);
          } else {
            rating.value = '0.0';
          }
        } catch (error) {
          console.error('Error fetching rating:', error);
          rating.value = '0.0';
        } finally {
          loading.value = false;
        }
      };
      
      onMounted(() => {
        fetchRating();
      });
      
      return {
        loading,
        rating
      };
    }
  };
  </script>
  
  <style scoped>
  .product-rating {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: #666;
  }
  
  .rating-loading {
    opacity: 0.5;
  }
  
  .rating-display {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  </style>