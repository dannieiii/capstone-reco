<template>
  <div class="orders-page">
    <div class="header">
      <button class="back-button" @click="$router.push('/')">
        <ChevronLeft size="22" />
      </button>
      <h1>My Orders</h1>
      <div class="header-spacer"></div>
    </div>

    
    <div class="content">
      <div class="tabs">
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'active' }"
          @click="activeTab = 'active'"
        >
          Active
        </button>
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'completed' }"
          @click="activeTab = 'completed'"
        >
          Completed
        </button>
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'cancelled' }"
          @click="activeTab = 'cancelled'"
        >
          Cancelled
        </button>
      </div>
      
        <div v-if="loading" class="loading-state">
    <p>Loading your orders...</p>
  </div>
     <div v-else-if="!sortedFilteredOrders || sortedFilteredOrders.length === 0" class="empty-state">
    <div class="empty-icon">
      <Package size="60" />
    </div>
    <h2>No {{ activeTab }} orders</h2>
    <p>Your {{ activeTab }} orders will appear here</p>
    <button v-if="activeTab === 'active'" class="shop-now-btn" @click="$emit('navigate', 'HomePage')">Shop Now</button>
  </div>
      
      <div v-else class="orders-list">
    <div class="order-card" v-for="(order, index) in sortedFilteredOrders" :key="index">
          <div class="order-header">
            <div>
              <h3>Order #{{ order.orderCode }}</h3>
              <p class="order-date">{{ formatDate(order.createdAt) }}</p>
            </div>
            <div class="order-status" :class="order.status.toLowerCase()">
              {{ order.status }}
            </div>
          </div>
          
          <div class="order-items">
            <div class="order-item">
              <div class="item-image">
                <img :src="order.productImage" :alt="order.productName">
              </div>
              <div class="item-details">
                <h4>{{ order.productName }}</h4>
                <p class="item-quantity">{{ order.weight }} x ₱{{ order.price }}</p>
              </div>
              <p class="item-total">₱{{ order.totalPrice.toFixed(2) }}</p>
            </div>
          </div>
          
          <div class="order-footer">
            <div class="order-total">
              <span>Total:</span>
              <span class="total-amount">₱{{ order.totalPrice.toFixed(2) }}</span>
            </div>
            
            <div class="order-actions">
              <button 
                v-if="order.status === 'Processing' || order.status === 'Shipped'" 
                class="track-btn"
                @click="trackOrder(order.id)"
              >
                <MapPin size="14" />
                Track Order
              </button>
              <button v-if="order.status === 'Delivered'" class="reorder-btn">
                <RefreshCw size="14" />
                Reorder
              </button>
              <button 
                v-if="order.status === 'Delivered' && !hasReviewed(order.id)" 
                class="review-btn"
                @click="openReviewForm(order)"
              >
                <MessageSquare size="14" />
                Review
              </button>
              <button 
                v-if="order.status === 'Delivered' && hasReviewed(order.id)" 
                class="reviewed-btn"
                disabled
              >
                <CheckCircle size="14" />
                Reviewed
              </button>

                            <div v-if="order.status === 'Processing'" class="cancel-section">
                <div v-if="getTimeRemaining(order.createdAt)" class="countdown-notice">
                  <p>Cancel within: {{ formatTime(getTimeRemaining(order.createdAt)) }}</p>
                </div>
                <button 
                  class="cancel-btn"
                  @click="cancelOrder(order)"
                  :disabled="!getTimeRemaining(order.createdAt)"
                >
                  <X size="14" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <bottom-navigation active-tab="orders" @navigate="$emit('navigate', $event)" />
    
    <!-- Order Tracking View -->
    <div v-if="showTracking" class="tracking-overlay">
      <CustomerOrderTracking 
        :orderId="trackingOrderId" 
        @back="closeTracking"
        @confirmed="handleOrderConfirmed"
      />
    </div>
    
    <!-- Review Form Modal -->
    <div v-if="showReviewForm" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h3>Review Your Purchase</h3>
          <button class="close-modal" @click="closeReviewForm">
            <X size="18" />
          </button>
        </div>
        <div class="modal-content">
          <div class="product-preview">
            <img :src="selectedOrder?.productImage" :alt="selectedOrder?.productName">
            <h4>{{ selectedOrder?.productName }}</h4>
          </div>
          
          <ReviewForm
            v-if="selectedOrder"
            :productId="selectedOrder.productId"
            :orderId="selectedOrder.id"
            :userId="userId"
            :username="username"
            :productName="selectedOrder.productName"
            :productImage="selectedOrder.productImage"
            @success="handleReviewSuccess"
            @error="handleReviewError"
            @cancel="closeReviewForm"
          />
        </div>
      </div>
    </div>
    
    <!-- Notification -->
    <div v-if="notification.show" class="notification" :class="notification.type">
      <div class="notification-content">
        <CheckCircle v-if="notification.type === 'success'" size="18" />
        <AlertCircle v-else size="18" />
        <p>{{ notification.message }}</p>
      </div>
      <button class="close-notification" @click="notification.show = false">
        <X size="14" />
      </button>
    </div>
  </div>
</template>

<script>
import BottomNavigation from '@/components/BottomNavigation.vue';
import ReviewForm from '@/components/ReviewForm.vue';
import { 
  ChevronLeft, 
  ShoppingCart, 
  Package, 
  MapPin, 
  RefreshCw, 
  X,
  MessageSquare,
  CheckCircle,
  AlertCircle
} from 'lucide-vue-next';
import { ref, computed, onMounted } from 'vue';
import { getFirestore, collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { serverTimestamp, updateDoc, runTransaction, increment } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import CustomerOrderTracking from '@/components/CustomerOrderTracking.vue';

export default {
  components: {
    BottomNavigation,
    ChevronLeft,
    ShoppingCart,
    Package,
    MapPin,
    RefreshCw,
    X,
    CustomerOrderTracking,
    ReviewForm,
    MessageSquare,
    CheckCircle,
    AlertCircle
  },
  setup() {
     const loading = ref(true);
    const activeTab = ref('active');
    const orders = ref([]);
    const db = getFirestore();
    const auth = getAuth();
    
    const trackingOrderId = ref(null);
    const showTracking = ref(false);
    
    const showReviewForm = ref(false);
    const selectedOrder = ref(null);
    const userId = ref('');
    const username = ref('');
    const userReviews = ref([]);
    
    const notification = ref({
      show: false,
      message: '',
      type: 'success'
    });

    // Define formatDate function before it's used
    const formatDate = (timestamp) => {
      if (!timestamp) return '';
      const date = timestamp.toDate();
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };
    
const fetchOrders = async () => {
      try {
        loading.value = true; // Set loading to true when starting fetch
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        
        const q = query(collection(db, 'orders'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        
        orders.value = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            orderCode: data.orderCode,
            productId: data.productId,
            productImage: data.productImage,
            productName: data.productName,
            weight: data.weight,
            price: data.price,
            totalPrice: data.totalPrice,
            status: data.status,
            createdAt: data.createdAt,
            userId: data.userId,
            type: data.status === 'Delivered' ? 'completed' : 
                  data.status === 'Cancelled' ? 'cancelled' : 'active'
          };
        });
      } catch (error) {
        console.error('Error fetching orders:', error);
        showNotification('Failed to load orders. Please try again.', 'error');
      } finally {
        loading.value = false; // Set loading to false when done
      }
    };
    
    const fetchUserInfo = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        
        userId.value = user.uid;
        
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          username.value = userDoc.data().username || 'User';
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };
    
    const fetchUserReviews = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        
        const q = query(collection(db, 'reviews'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        userReviews.value = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error('Error fetching user reviews:', error);
      }
    };

    const hasReviewed = (orderId) => {
      return userReviews.value.some(review => review.orderId === orderId);
    };
    
    const openReviewForm = (order) => {
      selectedOrder.value = order;
      showReviewForm.value = true;
    };
    
    const closeReviewForm = () => {
      showReviewForm.value = false;
      selectedOrder.value = null;
    };
    
    const handleReviewSuccess = (review) => {
      userReviews.value.push(review);
      closeReviewForm();
      showNotification('Your review has been submitted successfully!', 'success');
    };
    
    const handleReviewError = (errorMessage) => {
      showNotification(errorMessage || 'Failed to submit review. Please try again.', 'error');
    };
    
    const showNotification = (message, type = 'success') => {
      notification.value = {
        show: true,
        message,
        type
      };
      
      setTimeout(() => {
        notification.value.show = false;
      }, 5000);
    };

    const trackOrder = (orderId) => {
      trackingOrderId.value = orderId;
      showTracking.value = true;
    };

    const closeTracking = () => {
      showTracking.value = false;
      trackingOrderId.value = null;
    };

    const handleOrderConfirmed = (orderId) => {
      fetchOrders();
      closeTracking();
    };
    
 const sortedFilteredOrders = computed(() => {
      if (!orders.value) return []; // Handle undefined case
      
      // First filter the orders by active tab
      const filtered = orders.value.filter(order => {
        if (activeTab.value === 'active') {
          return order.status === 'Processing' || order.status === 'Shipped';
        } else if (activeTab.value === 'completed') {
          return order.status === 'Delivered';
        } else if (activeTab.value === 'cancelled') {
          return order.status === 'Cancelled';
        }
        return true;
      });
       // Then sort by createdAt in descending order (newest first)
      return filtered.sort((a, b) => {
        const dateA = a.createdAt?.toDate()?.getTime() || 0;
        const dateB = b.createdAt?.toDate()?.getTime() || 0;
        return dateB - dateA;
      });
    });

    const cancelOrder = async (order) => {
  try {
    if (!auth.currentUser) throw new Error('User not authenticated');
    
    // Update the order status to 'Cancelled'
    const orderRef = doc(db, 'orders', order.id);
    await updateDoc(orderRef, {
      status: 'Cancelled',
      cancelledAt: serverTimestamp()
    });
    
    // Update the product stock if needed
    const productRef = doc(db, 'products', order.productId);
    await runTransaction(db, async (transaction) => {
      const productDoc = await transaction.get(productRef);
      if (productDoc.exists()) {
        transaction.update(productRef, {
          stock: increment(order.weight)
        });
      }
    });
    
    // Update the sales record if needed
    const salesQuery = query(
      collection(db, 'sales'),
      where('orderCode', '==', order.orderCode)
    );
    const salesSnapshot = await getDocs(salesQuery);
    salesSnapshot.forEach(async (doc) => {
      await updateDoc(doc.ref, {
        paymentStatus: 'cancelled'
      });
    });
    
    // Refresh orders
    await fetchOrders();
    showNotification('Order cancelled successfully', 'success');
  } catch (error) {
    console.error('Error cancelling order:', error);
    showNotification('Failed to cancel order', 'error');
  }
};

const getTimeRemaining = (createdAt) => {
  if (!createdAt) return null;
  
  const orderDate = createdAt.toDate();
  const cancelDeadline = new Date(orderDate.getTime() + 5 * 60 * 1000); // 5 minutes
  const now = new Date();
  
  if (now > cancelDeadline) return null;
  
  const diff = cancelDeadline - now;
  const minutes = Math.floor(diff / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return {
    minutes,
    seconds,
    canCancel: true
  };
};

const formatTime = (time) => {
  if (!time) return '';
  return `${time.minutes}:${time.seconds.toString().padStart(2, '0')}`;
};
    onMounted(async () => {
      await fetchUserInfo();
      await fetchOrders();
      await fetchUserReviews();
    });
    
 return {
      loading,
      activeTab,
      orders,
      sortedFilteredOrders, // Make sure to return the correct name
      formatDate,
      trackingOrderId,
      showTracking,
      trackOrder,
      closeTracking,
      handleOrderConfirmed,
      showReviewForm,
      selectedOrder,
      openReviewForm,
      closeReviewForm,
      handleReviewSuccess,
      handleReviewError,
      hasReviewed,
      userId,
      username,
      notification,
        cancelOrder,
  getTimeRemaining,
  formatTime
    };
  }
}
</script>

<style scoped>
/* All the styles remain exactly the same as in your original file */
.cancel-section {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.countdown-notice {
  font-size: 10px;
  color: #e53935;
  text-align: center;
  padding: 2px 5px;
  background-color: rgba(229, 57, 53, 0.1);
  border-radius: 4px;
}

.countdown-notice p {
  margin: 0;
}

.cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.loading-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.loading-state p {
  margin: 0;
  font-size: 16px;
}
.orders-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding-bottom: 80px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 15px;
  background-color: #2e5c31;
  color: white;
}

.back-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: none; /* Remove background color */
  border: none; /* Remove border if any */
  padding: 0; /* Remove padding if any */
}

.header h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0; /* Added to ensure proper centering */
}

.header-buttons {
  display: flex;
  gap: 8px;
}
.header-spacer {
  width: 40px; /* Matches the back button width for symmetry */
}

.icon-button {
  width: 40px;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  overflow: hidden;
}

.profile-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.content {
  flex: 1;
  padding: 20px 15px;
  background-color: #f5f5f5;
  overflow-y: auto;
}

.tabs {
  display: flex;
  background-color: white;
  border-radius: 10px;
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.tab-button {
  flex: 1;
  padding: 15px 0;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  background: none;
  border: none;
  transition: all 0.2s ease;
}

.tab-button.active {
  color: #2e5c31;
  background-color: rgba(46, 92, 49, 0.1);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 50px 20px;
}

.empty-icon {
  color: #ccc;
  margin-bottom: 20px;
}

.empty-state h2 {
  font-size: 18px;
  margin-bottom: 10px;
  color: #333;
}

.empty-state p {
  font-size: 14px;
  color: #666;
  margin-bottom: 30px;
}

.shop-now-btn {
  padding: 12px 30px;
  background-color: #2e5c31;
  color: white;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 3px 8px rgba(46, 92, 49, 0.3);
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.order-card {
  background-color: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.order-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 5px;
  color: #333;
}

.order-date {
  font-size: 12px;
  color: #666;
}

.order-status {
  font-size: 12px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 15px;
}

.order-status.processing {
  background-color: #fff8e1;
  color: #ffa000;
}

.order-status.shipped {
  background-color: #e1f5fe;
  color: #0288d1;
}

.order-status.delivered {
  background-color: #e8f5e9;
  color: #2e5c31;
}

.order-status.cancelled {
  background-color: #ffebee;
  color: #e53935;
}

.order-items {
  padding: 15px;
}

.order-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.order-item:last-child {
  margin-bottom: 0;
}

  .item-image {
    width: 60px;  /* Increased from 40px */
    height: 60px; /* Increased from 40px */
    background-color: #f9f9f9;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
    overflow: hidden; /* Ensure image doesn't overflow rounded corners */
  }

  .item-image img {
    width: 100%;  /* Changed from fixed 25px to 100% of container */
    height: 100%; /* Changed from fixed 25px to 100% of container */
    object-fit: cover; /* Ensures image covers the space while maintaining aspect ratio */
  }

.item-details {
  flex: 1;
}

.item-details h4 {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 2px;
  color: #333;
}

.item-quantity {
  font-size: 12px;
  color: #666;
}

.item-total {
  font-size: 14px;
  font-weight: 600;
  color: #2e5c31;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #f9f9f9;
  border-top: 1px solid #eee;
}

.order-total {
  font-size: 14px;
  color: #666;
}

.total-amount {
  font-size: 16px;
  font-weight: 700;
  color: #2e5c31;
  margin-left: 5px;
}

.order-actions {
  display: flex;
  gap: 10px;
}

.track-btn, .reorder-btn, .cancel-btn, .review-btn, .reviewed-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 600;
}

.track-btn {
  background-color: #e1f5fe;
  color: #0288d1;
}

.reorder-btn {
  background-color: #e8f5e9;
  color: #2e5c31;
}

.cancel-btn {
  background-color: #ffebee;
  color: #e53935;
}

.review-btn {
  background-color: #f0f4c3;
  color: #afb42b;
}

.reviewed-btn {
  background-color: #e0e0e0;
  color: #757575;
  cursor: default;
}

.tracking-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #f5f5f5;
  z-index: 100;
  overflow-y: auto;
}

/* Modal Styles */
.modal-overlay {
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

.modal-container {
  background-color: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.close-modal {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 5px;
}

.modal-content {
  padding: 20px;
}

.product-preview {
  display: flex;
  align-items: center;
  gap: 15px;
  padding-bottom: 15px;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.product-preview img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
}

.product-preview h4 {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

/* Notification Styles */
.notification {
  position: fixed;
  bottom: 90px;
  left: 50%;
  transform: translateX(-50%);
  background-color: white;
  border-radius: 10px;
  padding: 12px 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 90%;
  max-width: 400px;
  z-index: 1000;
}

.notification.success {
  border-left: 4px solid #4caf50;
}

.notification.error {
  border-left: 4px solid #f44336;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.notification-content p {
  margin: 0;
  font-size: 14px;
  color: #333;
}

.notification.success .notification-content svg {
  color: #4caf50;
}

.notification.error .notification-content svg {
  color: #f44336;
}

.close-notification {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 5px;
}
</style>