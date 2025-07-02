<template>
  <div class="notifications-page">
    <!-- Header -->
    <div class="header">
      <h1>Notifications</h1>
      <div class="header-actions">
        <button 
          v-if="unreadCount > 0" 
          @click="markAllAsRead" 
          class="mark-all-btn"
        >
          Mark All Read
        </button>
        <div class="notification-count" v-if="unreadCount > 0">
          {{ unreadCount }} unread
        </div>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="filter-tabs">
      <button 
        v-for="filter in filterOptions" 
        :key="filter.key"
        :class="['filter-tab', { active: activeFilter === filter.key }]"
        @click="setActiveFilter(filter.key)"
      >
        <component :is="filter.icon" size="16" />
        {{ filter.label }}
        <span v-if="filter.count > 0" class="tab-badge">{{ filter.count }}</span>
      </button>
    </div>

    <!-- Notifications List -->
    <div class="notifications-container">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading notifications...</p>
      </div>
      
      <div v-else-if="filteredNotifications.length === 0" class="empty-state">
        <Bell size="48" class="empty-icon" />
        <h3>No notifications</h3>
        <p>{{ getEmptyMessage() }}</p>
      </div>
      
      <div v-else class="notifications-list">
        <div 
          v-for="notification in paginatedNotifications" 
          :key="notification.id"
          :class="['notification-item', getNotificationClasses(notification)]"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-icon" :class="getNotificationIconClass(notification)">
            <component :is="getNotificationIcon(notification.type)" size="20" />
          </div>
          
          <div class="notification-content">
            <div class="notification-header">
              <h4 class="notification-title">{{ notification.title }}</h4>
              <span class="notification-time">{{ formatTime(notification.timestamp || notification.createdAt) }}</span>
            </div>
            
            <p class="notification-message">{{ notification.message }}</p>
            
            <!-- Price Update Details -->
            <div v-if="notification.type === 'price_update'" class="price-update-details">
              <div class="product-info">
                <strong>{{ notification.productName }}</strong>
                <span class="category-badge">{{ notification.category }}</span>
              </div>
              <div class="price-comparison">
                <div class="price-row">
                  <span class="price-label">Min Price:</span>
                  <span class="old-price">₱{{ notification.oldMinPrice?.toFixed(2) }}</span>
                  <span class="arrow">→</span>
                  <span class="new-price">₱{{ notification.newMinPrice?.toFixed(2) }}</span>
                  <span :class="['price-change', getPriceChangeClass(notification.oldMinPrice, notification.newMinPrice)]">
                    {{ getPriceChangeText(notification.oldMinPrice, notification.newMinPrice) }}
                  </span>
                </div>
                <div class="price-row">
                  <span class="price-label">Max Price:</span>
                  <span class="old-price">₱{{ notification.oldMaxPrice?.toFixed(2) }}</span>
                  <span class="arrow">→</span>
                  <span class="new-price">₱{{ notification.newMaxPrice?.toFixed(2) }}</span>
                  <span :class="['price-change', getPriceChangeClass(notification.oldMaxPrice, notification.newMaxPrice)]">
                    {{ getPriceChangeText(notification.oldMaxPrice, notification.newMaxPrice) }}
                  </span>
                </div>
              </div>
              <div class="notification-actions">
                <button 
                  class="action-btn primary" 
                  @click.stop="viewProduct(notification.productId)"
                >
                  <Eye size="14" />
                  View Product
                </button>
                <button 
                  class="action-btn secondary" 
                  @click.stop="addToFavorites(notification.productId)"
                  v-if="!isInFavorites(notification.productId)"
                >
                  <Heart size="14" />
                  Add to Favorites
                </button>
              </div>
            </div>
            
            <!-- Order Update Details -->
            <div v-if="notification.orderDetails" class="order-details">
              <span class="order-code">#{{ notification.orderDetails.orderCode }}</span>
              <span class="order-amount">₱{{ notification.orderDetails.amount?.toFixed(2) }}</span>
            </div>
          </div>
          
          <div class="notification-menu">
            <button 
              v-if="!notification.read" 
              class="mark-read-btn"
              @click.stop="markAsRead(notification.id)"
              title="Mark as read"
            >
              <Check size="14" />
            </button>
            
            <button 
              class="delete-btn"
              @click.stop="deleteNotification(notification.id)"
              title="Delete notification"
            >
              <X size="14" />
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          :disabled="currentPage === 1" 
          @click="currentPage--"
          class="pagination-btn"
        >
          <ChevronLeft size="16" />
          Previous
        </button>
        
        <span class="pagination-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        
        <button 
          :disabled="currentPage === totalPages" 
          @click="currentPage++"
          class="pagination-btn"
        >
          Next
          <ChevronRight size="16" />
        </button>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <BottomNavigation />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { 
  Bell, 
  ShoppingCart, 
  List, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Package,
  AlertCircle,
  Info,
  TrendingUp,
  Eye,
  Heart
} from 'lucide-vue-next';
import BottomNavigation from '@/components/BottomNavigation.vue';
import { db } from '@/firebase/firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  addDoc,
  serverTimestamp,
  getDocs,
  or,
  and
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// State
const loading = ref(true);
const notifications = ref([]);
const activeFilter = ref('all');
const currentPage = ref(1);
const itemsPerPage = 10;
const currentCustomerId = ref('');
const favoriteProducts = ref([]);

// Computed properties
const unreadCount = computed(() => 
  notifications.value.filter(n => !n.read).length
);

const priceUpdatesCount = computed(() => 
  notifications.value.filter(n => n.type === 'price_update' && !n.read).length
);

const ordersCount = computed(() => 
  notifications.value.filter(n => n.type === 'order_update' && !n.read).length
);

const filterOptions = computed(() => [
  { key: 'all', label: 'All', icon: List, count: notifications.value.length },
  { key: 'unread', label: 'Unread', icon: Bell, count: unreadCount.value },
  { key: 'price_update', label: 'Price Updates', icon: TrendingUp, count: priceUpdatesCount.value },
  { key: 'order_update', label: 'Orders', icon: ShoppingCart, count: ordersCount.value },
  { key: 'system', label: 'System', icon: Info, count: notifications.value.filter(n => n.type === 'system').length }
]);

const filteredNotifications = computed(() => {
  let filtered = [...notifications.value];
  
  if (activeFilter.value === 'unread') {
    filtered = filtered.filter(n => !n.read);
  } else if (activeFilter.value !== 'all') {
    filtered = filtered.filter(n => n.type === activeFilter.value);
  }
  
  return filtered.sort((a, b) => {
    const dateA = (a.timestamp || a.createdAt)?.toDate?.() || new Date(a.timestamp || a.createdAt);
    const dateB = (b.timestamp || b.createdAt)?.toDate?.() || new Date(b.timestamp || b.createdAt);
    return dateB - dateA;
  });
});

const totalPages = computed(() => 
  Math.max(1, Math.ceil(filteredNotifications.value.length / itemsPerPage))
);

const paginatedNotifications = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredNotifications.value.slice(start, end);
});

// Methods
const setActiveFilter = (filter) => {
  activeFilter.value = filter;
  currentPage.value = 1;
};

const getNotificationIcon = (type) => {
  const icons = {
    price_update: TrendingUp,
    order_update: ShoppingCart,
    system: Info,
    alert: AlertCircle,
    promotion: Package
  };
  return icons[type] || Bell;
};

const getNotificationClasses = (notification) => {
  const classes = [];
  if (!notification.read) classes.push('unread');
  if (notification.type === 'price_update') classes.push('price-update');
  if (notification.type === 'order_update') classes.push('order-update');
  return classes.join(' ');
};

const getNotificationIconClass = (notification) => {
  const baseClass = 'notification-icon';
  if (notification.type === 'price_update') return `${baseClass} price-icon`;
  if (notification.type === 'order_update') return `${baseClass} order-icon`;
  return baseClass;
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = timestamp?.toDate?.() || new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getPriceChangeClass = (oldPrice, newPrice) => {
  if (!oldPrice || !newPrice) return '';
  return newPrice > oldPrice ? 'increase' : 'decrease';
};

const getPriceChangeText = (oldPrice, newPrice) => {
  if (!oldPrice || !newPrice) return '';
  const change = ((newPrice - oldPrice) / oldPrice) * 100;
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
};

const getEmptyMessage = () => {
  const messages = {
    all: "You don't have any notifications yet.",
    unread: "All caught up! No unread notifications.",
    price_update: "No price updates at the moment.",
    order_update: "No order updates.",
    system: "No system notifications."
  };
  return messages[activeFilter.value] || "No notifications found.";
};

const handleNotificationClick = async (notification) => {
  if (!notification.read) {
    await markAsRead(notification.id);
  }
  
  if (notification.type === 'order_update' && notification.orderDetails?.orderId) {
    window.location.href = `/customer/orders?id=${notification.orderDetails.orderId}`;
  } else if (notification.type === 'price_update' && notification.productId) {
    viewProduct(notification.productId);
  }
};

const viewProduct = (productId) => {
  window.location.href = `/products/${productId}`;
};

const isInFavorites = (productId) => {
  return favoriteProducts.value.includes(productId);
};

const addToFavorites = async (productId) => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (currentUser) {
      await addDoc(collection(db, 'favorites'), {
        customerId: currentUser.uid,
        productId: productId,
        addedAt: serverTimestamp()
      });
      
      favoriteProducts.value.push(productId);
    }
  } catch (error) {
    console.error('Error adding to favorites:', error);
  }
};

const markAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

const markAllAsRead = async () => {
  try {
    const unreadNotifications = notifications.value.filter(n => !n.read);
    const promises = unreadNotifications.map(notification => 
      updateDoc(doc(db, 'notifications', notification.id), {
        read: true,
        readAt: serverTimestamp()
      })
    );
    await Promise.all(promises);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
};

const deleteNotification = async (notificationId) => {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
  } catch (error) {
    console.error('Error deleting notification:', error);
  }
};

const setupNotificationListener = async () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    loading.value = false;
    return;
  }

  currentCustomerId.value = currentUser.uid;

  try {
    // Fixed query structure using and() to wrap composite filters
    const notificationsQuery = query(
      collection(db, 'notifications'),
      and(
        or(
          where('customerId', '==', currentUser.uid),
          where('userId', '==', currentUser.uid)
        ),
        where('recipientType', '==', 'customer')
      )
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        notifications.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        loading.value = false;
        console.log(`Loaded ${notifications.value.length} customer notifications`);
      },
      (error) => {
        console.error('Error in notification listener:', error);
        loading.value = false;
        
        // Fallback: try a simpler query if composite query fails
        setupFallbackListener();
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up notification listener:', error);
    loading.value = false;
    
    // Try fallback approach
    setupFallbackListener();
    return null;
  }
};

const setupFallbackListener = async () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  if (!currentUser) return;

  try {
    // Fallback: Use simpler query with just customerId
    const fallbackQuery = query(
      collection(db, 'notifications'),
      where('customerId', '==', currentUser.uid),
      where('recipientType', '==', 'customer')
    );

    const unsubscribe = onSnapshot(
      fallbackQuery,
      (snapshot) => {
        notifications.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        loading.value = false;
        console.log(`Loaded ${notifications.value.length} customer notifications (fallback)`);
      },
      (error) => {
        console.error('Error in fallback notification listener:', error);
        loading.value = false;
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up fallback listener:', error);
    loading.value = false;
  }
};

const loadFavoriteProducts = async () => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (currentUser) {
      const favoritesQuery = query(
        collection(db, 'favorites'),
        where('customerId', '==', currentUser.uid)
      );
      
      const snapshot = await getDocs(favoritesQuery);
      favoriteProducts.value = snapshot.docs.map(doc => doc.data().productId);
    }
  } catch (error) {
    console.error('Error loading favorite products:', error);
  }
};

onMounted(async () => {
  const unsubscribe = await setupNotificationListener();
  await loadFavoriteProducts();
  
  onUnmounted(() => {
    if (unsubscribe && typeof unsubscribe === 'function') {
      unsubscribe();
    }
  });
});
</script>

<style scoped>
.notifications-page {
  padding: 20px;
  padding-bottom: 90px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #2e5c31;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mark-all-btn {
  padding: 8px 16px;
  background-color: #2e5c31;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.mark-all-btn:hover {
  background-color: #234425;
}

.notification-count {
  background-color: #ef4444;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0;
  overflow-x: auto;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: #6b7280;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  white-space: nowrap;
}

.filter-tab:hover {
  color: #2e5c31;
}

.filter-tab.active {
  color: #2e5c31;
  border-bottom-color: #2e5c31;
  font-weight: 600;
}

.tab-badge {
  background-color: #ef4444;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
}

.notifications-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #2e5c31;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  color: #9ca3af;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 1.1rem;
  color: #4b5563;
  margin: 0 0 8px 0;
}

.empty-state p {
  color: #6b7280;
  margin: 0;
}

.notifications-list {
  divide-y: 1px solid #e5e7eb;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-left: 3px solid transparent;
}

.notification-item:hover {
  background-color: #f9fafb;
}

.notification-item.unread {
  background-color: #fefce8;
  border-left-color: #eab308;
}

.notification-item.price-update {
  border-left-color: #f59e0b;
}

.notification-item.order-update {
  border-left-color: #2563eb;
}

.notification-icon {
  padding: 8px;
  border-radius: 6px;
  background-color: #f3f4f6;
  color: #4b5563;
  flex-shrink: 0;
  margin-top: 4px;
}

.notification-icon.price-icon {
  background-color: #fef3c7;
  color: #f59e0b;
}

.notification-icon.order-icon {
  background-color: #dbeafe;
  color: #2563eb;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
}

.notification-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.notification-time {
  font-size: 0.8rem;
  color: #6b7280;
  flex-shrink: 0;
  margin-left: 12px;
}

.notification-message {
  font-size: 0.9rem;
  color: #4b5563;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.price-update-details {
  background: #fef3c7;
  padding: 12px;
  border-radius: 6px;
  margin-top: 8px;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.category-badge {
  background: #2e5c31;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}

.price-comparison {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.price-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
}

.price-label {
  font-weight: 600;
  color: #374151;
  min-width: 70px;
}

.old-price {
  color: #6b7280;
  text-decoration: line-through;
}

.arrow {
  color: #6b7280;
}

.new-price {
  color: #059669;
  font-weight: 600;
}

.price-change {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 4px;
  border-radius: 4px;
}

.price-change.increase {
  background: #fee2e2;
  color: #dc2626;
}

.price-change.decrease {
  background: #d1fae5;
  color: #059669;
}

.notification-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.primary {
  background: #2e5c31;
  color: white;
}

.action-btn.primary:hover {
  background: #234425;
}

.action-btn.secondary {
  background: #f3f4f6;
  color: #4b5563;
}

.action-btn.secondary:hover {
  background: #e5e7eb;
}

.order-details {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.8rem;
}

.order-code {
  background-color: #f3f4f6;
  color: #4b5563;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.order-amount {
  color: #059669;
  font-weight: 600;
}

.notification-menu {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.notification-item:hover .notification-menu {
  opacity: 1;
}

.mark-read-btn, .delete-btn {
  background: none;
  border: none;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.mark-read-btn {
  color: #059669;
}

.mark-read-btn:hover {
  background-color: #d1fae5;
}

.delete-btn {
  color: #ef4444;
}

.delete-btn:hover {
  background-color: #fee2e2;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.9rem;
  color: #6b7280;
}

@media (max-width: 768px) {
  .notifications-page {
    padding: 15px;
    padding-bottom: 90px;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .notification-item {
    padding: 12px 16px;
  }
  
  .notification-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .notification-time {
    margin-left: 0;
  }
  
  .price-row {
    flex-wrap: wrap;
  }
  
  .notification-actions {
    flex-direction: column;
  }
}
</style>
