<template>
  <div class="dashboard-container">
    <Sidebar initialActiveItem="Notifications" />
    
    <div class="main-content">
      <header class="header">
        <div class="page-title">
          <h1>Notifications</h1>
          <p>Stay updated with price changes and order activities</p>
        </div>
        <div class="header-actions">
          <button class="mark-all-read-btn" @click="markAllAsRead" v-if="unreadCount > 0">
            <CheckCheck size="16" />
            Mark All Read
          </button>
          <button class="theme-toggle" @click="toggleDarkMode">
            <Sun v-if="isDarkMode" size="20" />
            <Moon v-else size="20" />
          </button>
        </div>
      </header>

      <!-- Connection Status -->
      <div v-if="connectionError" class="connection-error">
        <AlertTriangle size="16" />
        <span>Connection issue detected. Retrying...</span>
        <button @click="retryConnection" class="retry-btn">Retry Now</button>
      </div>

      <!-- Notification Stats -->
      <div class="notification-stats">
        <div class="stat-card">
          <div class="stat-icon new-orders">
            <ShoppingCart size="20" />
          </div>
          <div class="stat-content">
            <h3>New Orders</h3>
            <p class="stat-value">{{ newOrdersCount }}</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon unread">
            <Bell size="20" />
          </div>
          <div class="stat-content">
            <h3>Unread</h3>
            <p class="stat-value">{{ unreadCount }}</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon warnings">
            <AlertTriangle size="20" />
          </div>
          <div class="stat-content">
            <h3>Price Warnings</h3>
            <p class="stat-value">{{ priceWarningsCount }}</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon price-updates">
            <TrendingUp size="20" />
          </div>
          <div class="stat-content">
            <h3>Price Updates</h3>
            <p class="stat-value">{{ priceUpdatesCount }}</p>
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
          <small class="loading-hint">Setting up database connection...</small>
        </div>
        
        <div v-else-if="filteredNotifications.length === 0" class="empty-state">
          <Bell size="48" class="empty-icon" />
          <h3>No notifications</h3>
          <p>{{ getEmptyMessage() }}</p>
          <button v-if="connectionError" @click="retryConnection" class="retry-btn">
            Refresh Notifications
          </button>
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
                <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
              </div>
              
              <!-- Short preview message for price warnings -->
              <p v-if="notification.type === 'price_warning'" class="notification-message">
                Your product "{{ notification.productName }}" is priced {{ formatDeviation(notification.deviation) }} above the recommended price.
              </p>
              
              <!-- Display the admin's message directly for other notifications -->
              <p v-else class="notification-message">{{ notification.message }}</p>
              
              <!-- Price Update Details -->
              <div v-if="notification.type === 'price_update'" class="price-update-details">
                <div class="product-info">
                  <span class="product-name">{{ notification.productName }}</span>
                  <span class="category-badge">{{ notification.category }}</span>
                </div>
                <div class="price-changes">
                  <div class="price-change-item">
                    <span class="label">Min Price:</span>
                    <span class="price-change">
                      ₱{{ formatPrice(notification.oldMinPrice) }} → ₱{{ formatPrice(notification.newMinPrice) }}
                      <span :class="getPriceChangeClass(notification.oldMinPrice, notification.newMinPrice)">
                        ({{ getPriceChangePercentage(notification.oldMinPrice, notification.newMinPrice) }})
                      </span>
                    </span>
                  </div>
                  <div class="price-change-item">
                    <span class="label">Max Price:</span>
                    <span class="price-change">
                      ₱{{ formatPrice(notification.oldMaxPrice) }} → ₱{{ formatPrice(notification.newMaxPrice) }}
                      <span :class="getPriceChangeClass(notification.oldMaxPrice, notification.newMaxPrice)">
                        ({{ getPriceChangePercentage(notification.oldMaxPrice, notification.newMaxPrice) }})
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- Price Warning Preview -->
              <div v-if="notification.type === 'price_warning'" class="price-warning-preview">
                <div class="warning-preview-info">
                  <span class="product-name">{{ notification.productName }}</span>
                  <span class="warning-level-badge" :class="getWarningLevelClass(notification.warningLevel)">
                    {{ notification.warningLevel?.toUpperCase() }}
                  </span>
                </div>
                <div class="warning-preview-details">
                  <span class="current-price">Your Price: ₱{{ formatPrice(notification.currentPrice) }}</span>
                  <span class="excess-amount">Excess: ₱{{ formatPrice(notification.excessAmount) }}</span>
                </div>
                <button 
                  class="view-details-btn" 
                  @click.stop="openWarningModal(notification)"
                >
                  <Eye size="14" />
                  View Details
                </button>
              </div>
              
              <!-- Order Details -->
              <div v-if="notification.orderDetails" class="notification-details">
                <span class="order-code">#{{ notification.orderDetails.orderCode }}</span>
                <span class="customer-name">{{ notification.orderDetails.customerName }}</span>
                <span class="order-amount">₱{{ notification.orderDetails.amount.toFixed(2) }}</span>
              </div>
              
              <!-- Product Deactivation Details -->
              <div v-if="notification.type === 'product_deactivated'" class="deactivation-details">
                <div class="deactivation-reason">
                  <strong>Reason:</strong> {{ notification.reason }}
                </div>
                <div class="deactivation-actions">
                  <button 
                    class="action-btn secondary" 
                    @click.stop="contactSupport(notification)"
                  >
                    <MessageCircle size="14" />
                    Contact Support
                  </button>
                </div>
              </div>
            </div>
            
            <div class="notification-actions">
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

      <!-- Price Warning Modal -->
      <div v-if="showWarningModal" class="modal-overlay" @click="closeWarningModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>{{ selectedWarning?.title || 'Price Warning Details' }}</h2>
            <button class="close-btn" @click="closeWarningModal">
              <X size="20" />
            </button>
          </div>
          <div class="modal-body">
            <div v-if="selectedWarning" class="warning-details-full">
              <!-- Full Message Section -->
              <div class="message-section">
                <h3>Warning Message</h3>
                <div class="full-message">
                  {{ selectedWarning.message }}
                </div>
              </div>

              <div class="product-section">
                <h3>Product Information</h3>
                <div class="product-info-full">
                  <span class="product-name-full">{{ selectedWarning.productName }}</span>
                  <span class="category-badge">{{ selectedWarning.category }}</span>
                </div>
              </div>

              <div class="price-section">
                <h3>Price Comparison</h3>
                <div class="price-comparison-full">
                  <div class="price-item">
                    <span class="label">Your Current Price:</span>
                    <span class="current-price-full">₱{{ formatPrice(selectedWarning.currentPrice) }}</span>
                  </div>
                  <div class="price-item">
                    <span class="label">Maximum Allowed Price:</span>
                    <span class="max-price-full">₱{{ formatPrice(selectedWarning.maxAllowedPrice) }}</span>
                  </div>
                  <div class="price-item">
                    <span class="label">Excess Amount:</span>
                    <span class="excess-amount-full">₱{{ formatPrice(selectedWarning.excessAmount) }} ({{ formatDeviation(selectedWarning.deviation) }})</span>
                  </div>
                </div>
              </div>

              <div class="warning-section">
                <h3>Warning Information</h3>
                <div class="warning-level-full">
                  <span class="warning-level-badge-full" :class="getWarningLevelClass(selectedWarning.warningLevel)">
                    {{ selectedWarning.warningLevel?.toUpperCase() }} LEVEL
                  </span>
                </div>
                
                <div v-if="selectedWarning.isFinalWarning" class="final-warning-alert-full">
                  <AlertTriangle size="16" />
                  <span>FINAL WARNING - Product will be deactivated if not corrected within 24 hours</span>
                </div>
              </div>

              <div class="actions-section">
                <h3>Actions</h3>
                <div class="warning-actions-full">
                  <button 
                    class="action-btn primary" 
                    @click="navigateToEditProduct(selectedWarning.productId)"
                  >
                    <Edit size="14" />
                    Edit Product Price
                  </button>
                  <button 
                    class="action-btn secondary" 
                    @click="acknowledgeWarning(selectedWarning)"
                  >
                    <Check size="14" />
                    Acknowledge Warning
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { 
  Bell, 
  ShoppingCart, 
  List, 
  Sun, 
  Moon, 
  CheckCheck, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Package,
  AlertCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  Edit,
  MessageCircle,
  Ban,
  Eye
} from 'lucide-vue-next';
import Sidebar from '@/components/Sidebar.vue';
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
  limit,
  getDocs
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// State
const isDarkMode = ref(false);
const loading = ref(true);
const notifications = ref([]);
const activeFilter = ref('all');
const currentPage = ref(1);
const itemsPerPage = 10;
const currentSellerId = ref('');
const connectionError = ref(false);
const retryCount = ref(0);
const maxRetries = 3;
const showWarningModal = ref(false);
const selectedWarning = ref(null);

// Computed properties
const unreadCount = computed(() => 
  notifications.value.filter(n => !n.read).length
);

const newOrdersCount = computed(() => 
  notifications.value.filter(n => n.type === 'new_order' && !n.read).length
);

const priceWarningsCount = computed(() => 
  notifications.value.filter(n => n.type === 'price_warning' && !n.read).length
);

const priceUpdatesCount = computed(() => 
  notifications.value.filter(n => n.type === 'price_update' && !n.read).length
);

const filterOptions = computed(() => [
  { key: 'all', label: 'All', icon: List, count: notifications.value.length },
  { key: 'unread', label: 'Unread', icon: Bell, count: unreadCount.value },
  { key: 'new_order', label: 'New Orders', icon: ShoppingCart, count: newOrdersCount.value },
  { key: 'price_update', label: 'Price Updates', icon: TrendingUp, count: priceUpdatesCount.value },
  { key: 'price_warning', label: 'Price Warnings', icon: AlertTriangle, count: priceWarningsCount.value }
]);

const filteredNotifications = computed(() => {
  let filtered = [...notifications.value];
  
  if (activeFilter.value === 'unread') {
    filtered = filtered.filter(n => !n.read);
  } else if (activeFilter.value !== 'all') {
    filtered = filtered.filter(n => n.type === activeFilter.value);
  }
  
  return filtered.sort((a, b) => {
    const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
    const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
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
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  document.body.classList.toggle('dark', isDarkMode.value);
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light');
};

const setActiveFilter = (filter) => {
  activeFilter.value = filter;
  currentPage.value = 1;
};

const openWarningModal = (notification) => {
  selectedWarning.value = notification;
  showWarningModal.value = true;
};

const closeWarningModal = () => {
  showWarningModal.value = false;
  selectedWarning.value = null;
};

const getNotificationIcon = (type) => {
  const icons = {
    new_order: ShoppingCart,
    status_update: Package,
    alert: AlertCircle,
    analytics: TrendingUp,
    price_warning: AlertTriangle,
    price_update: TrendingUp,
    product_deactivated: Ban,
    product_reactivated: Check
  };
  return icons[type] || Bell;
};

const getNotificationClasses = (notification) => {
  const classes = [];
  if (!notification.read) classes.push('unread');
  if (notification.type === 'price_warning') {
    classes.push('price-warning');
    if (notification.isFinalWarning) classes.push('final-warning');
  }
  if (notification.type === 'product_deactivated') classes.push('product-deactivated');
  if (notification.type === 'new_order') classes.push('new-order');
  if (notification.type === 'price_update') classes.push('price-update');
  return classes.join(' ');
};

const getNotificationIconClass = (notification) => {
  const baseClass = 'notification-icon';
  if (notification.type === 'price_warning') {
    if (notification.isFinalWarning) return `${baseClass} final-warning-icon`;
    return `${baseClass} warning-icon`;
  }
  if (notification.type === 'product_deactivated') return `${baseClass} deactivated-icon`;
  if (notification.type === 'new_order') return `${baseClass} order-icon`;
  if (notification.type === 'price_update') return `${baseClass} price-update-icon`;
  return baseClass;
};

const getWarningLevelClass = (level) => {
  switch (level) {
    case 'severe':
      return 'warning-level-severe';
    case 'moderate':
      return 'warning-level-moderate';
    case 'mild':
      return 'warning-level-mild';
    default:
      return '';
  }
};

const getPriceChangeClass = (oldPrice, newPrice) => {
  if (newPrice > oldPrice) return 'price-increase';
  if (newPrice < oldPrice) return 'price-decrease';
  return 'price-same';
};

const getPriceChangePercentage = (oldPrice, newPrice) => {
  if (!oldPrice || oldPrice === 0) return 'N/A';
  const percentage = ((newPrice - oldPrice) / oldPrice) * 100;
  const sign = percentage > 0 ? '+' : '';
  return `${sign}${percentage.toFixed(1)}%`;
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

const formatPrice = (price) => {
  return parseFloat(price).toFixed(2);
};

const formatDeviation = (deviation) => {
  if (deviation === null || deviation === undefined) return 'N/A';
  return deviation > 0 ? `+${deviation.toFixed(1)}%` : `${deviation.toFixed(1)}%`;
};

const getEmptyMessage = () => {
  if (connectionError.value) {
    return "Unable to load notifications. Please check your connection and try again.";
  }
  
  const messages = {
    all: "You don't have any notifications yet.",
    unread: "All caught up! No unread notifications.",
    new_order: "No new orders at the moment.",
    price_update: "No price updates available.",
    price_warning: "No price warnings."
  };
  return messages[activeFilter.value] || "No notifications found.";
};

const handleNotificationClick = async (notification) => {
  // Mark as read if unread
  if (!notification.read) {
    await markAsRead(notification.id);
  }
  
  // Navigate based on notification type
  if (notification.type === 'new_order' && notification.orderDetails?.orderId) {
    window.location.href = `/orders?id=${notification.orderDetails.orderId}`;
  } else if (notification.type === 'price_warning' && notification.productId) {
    openWarningModal(notification);
  } else if (notification.type === 'price_update' && notification.productId) {
    // Navigate to product details or inventory page
    window.location.href = `/seller/products?highlight=${notification.productId}`;
  }
};

const navigateToEditProduct = (productId) => {
  window.location.href = `/seller/products/edit/${productId}`;
};

const acknowledgeWarning = async (notification) => {
  try {
    // Mark notification as acknowledged
    await updateDoc(doc(db, 'notifications', notification.id), {
      acknowledged: true,
      acknowledgedAt: serverTimestamp()
    });
    
    // Update warning history
    await addDoc(collection(db, 'warningHistory'), {
      productId: notification.productId,
      sellerId: currentSellerId.value,
      type: 'acknowledgment',
      message: 'Seller acknowledged the warning',
      acknowledgedAt: serverTimestamp(),
      originalWarningId: notification.id
    });
    
    closeWarningModal();
    alert('Warning acknowledged. Please update your product price to comply with guidelines.');
  } catch (error) {
    console.error('Error acknowledging warning:', error);
    alert('Failed to acknowledge warning. Please try again.');
  }
};

const contactSupport = (notification) => {
  // Navigate to support or open support modal
  window.location.href = `/support?product=${notification.productId}&reason=deactivation`;
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

const retryConnection = () => {
  connectionError.value = false;
  loading.value = true;
  retryCount.value++;
  setupNotificationListener();
};

const setupNotificationListener = async () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    loading.value = false;
    connectionError.value = true;
    return;
  }

  currentSellerId.value = currentUser.uid;

  try {
    // Query for notifications sent to this seller
    const notificationQuery = query(
      collection(db, 'notifications'),
      where('sellerId', '==', currentUser.uid),
      limit(100)
    );

    // Try to get data first to test if basic query works
    const snapshot = await getDocs(notificationQuery);
    console.log(`Found ${snapshot.docs.length} notifications`);

    // If basic query works, set up the listener
    const unsubscribe = onSnapshot(
      notificationQuery,
      (snapshot) => {
        const notificationData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort on client side since we can't use complex orderBy without index
        notifications.value = notificationData.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return dateB - dateA;
        });
        
        loading.value = false;
        connectionError.value = false;
        retryCount.value = 0;
        
        console.log(`Loaded ${notifications.value.length} notifications successfully`);
        console.log('Price update notifications:', notifications.value.filter(n => n.type === 'price_update').length);
        console.log('Price warning notifications:', notifications.value.filter(n => n.type === 'price_warning').length);
      },
      (error) => {
        console.error('Error in notification listener:', error);
        loading.value = false;
        connectionError.value = true;
        
        // If it's an index error, provide helpful message
        if (error.code === 'failed-precondition') {
          console.warn('Firestore index required. Using fallback query...');
        }
        
        // Auto-retry with exponential backoff
        if (retryCount.value < maxRetries) {
          const delay = Math.pow(2, retryCount.value) * 1000; // 1s, 2s, 4s
          setTimeout(() => {
            console.log(`Retrying connection (attempt ${retryCount.value + 1}/${maxRetries})...`);
            retryConnection();
          }, delay);
        }
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up notification listener:', error);
    loading.value = false;
    connectionError.value = true;
    notifications.value = [];
    return null;
  }
};

onMounted(async () => {
  // Load theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    isDarkMode.value = true;
    document.body.classList.add('dark');
  }

  // Setup listeners with better error handling
  const unsubscribe = await setupNotificationListener();
  
  // Cleanup on unmount
  onUnmounted(() => {
    if (unsubscribe && typeof unsubscribe === 'function') {
      unsubscribe();
    }
  });
});
</script>

<style scoped>
.dashboard-container {
  display: flex;
  min-height: 100vh;
  background-color: #f9fafb;
}

.main-content {
  flex: 1;
  padding: 20px;
  margin-left: 230px;
  overflow-y: auto;
}

.connection-error {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #fef3c7;
  color: #92400e;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  border-left: 4px solid #f59e0b;
}

.retry-btn {
  background-color: #f59e0b;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  margin-left: auto;
}

.retry-btn:hover {
  background-color: #d97706;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 5px 0;
}

.page-title p {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mark-all-read-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: #2e5c31;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.mark-all-read-btn:hover {
  background-color: #234425;
}

.theme-toggle {
  background: none;
  border: none;
  color: #111827;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
}

.theme-toggle:hover {
  background: rgba(0,0,0,0.05);
}

.notification-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  padding: 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.new-orders {
  background-color: #dbeafe;
  color: #2563eb;
}

.stat-icon.unread {
  background-color: #fef3c7;
  color: #d97706;
}

.stat-icon.warnings {
  background-color: #fee2e2;
  color: #dc2626;
}

.stat-icon.price-updates {
  background-color: #d1fae5;
  color: #059669;
}

.stat-content h3 {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0 0 4px 0;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0;
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
  margin: 0 0 16px 0;
}

.notifications-list {
  /* Remove the divide-y approach and use border-bottom instead */
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-left: 3px solid transparent;
  border-bottom: 1px solid #e5e7eb;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background-color: #f9fafb;
}

.notification-item.unread {
  background-color: #fefce8;
  border-left-color: #eab308;
}

.notification-item.price-warning {
  border-left-color: #f59e0b;
}

.notification-item.price-update {
  border-left-color: #059669;
}

.notification-item.final-warning {
  background-color: #fef2f2;
  border-left-color: #dc2626;
}

.notification-item.product-deactivated {
  border-left-color: #dc2626;
}

.notification-item.new-order {
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

.notification-icon.order-icon {
  background-color: #dbeafe;
  color: #2563eb;
}

.notification-icon.price-update-icon {
  background-color: #d1fae5;
  color: #059669;
}

.notification-icon.warning-icon {
  background-color: #fef3c7;
  color: #f59e0b;
}

.notification-icon.final-warning-icon {
  background-color: #fee2e2;
  color: #dc2626;
}

.notification-icon.deactivated-icon {
  background-color: #fee2e2;
  color: #dc2626;
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
  font-weight: 500;
}

.price-update-details {
  background: #d1fae5;
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

.product-name {
  font-weight: 600;
  color: #111827;
}

.category-badge {
  background: #f3f4f6;
  color: #6b7280;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.price-changes {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.price-change-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}

.price-change-item .label {
  font-weight: 500;
  color: #374151;
  min-width: 70px;
}

.price-change {
  color: #059669;
  font-weight: 600;
}

.price-increase {
  color: #dc2626;
}

.price-decrease {
  color: #059669;
}

.price-same {
  color: #6b7280;
}

.price-warning-preview {
  background: #fef3c7;
  padding: 12px;
  border-radius: 6px;
  margin-top: 8px;
}

.warning-preview-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.warning-preview-details {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  font-size: 0.8rem;
}

.current-price {
  color: #dc2626;
  font-weight: 600;
}

.excess-amount {
  color: #f59e0b;
  font-weight: 600;
}

.view-details-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #2e5c31;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.view-details-btn:hover {
  background: #234425;
}

.warning-level-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}

.warning-level-mild {
  background: #fbbf24;
  color: #92400e;
}

.warning-level-moderate {
  background: #f59e0b;
  color: #92400e;
}

.warning-level-severe {
  background: #dc2626;
  color: white;
}

.notification-details {
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

.customer-name {
  color: #6b7280;
}

.order-amount {
  color: #059669;
  font-weight: 600;
}

.deactivation-details {
  background: #fee2e2;
  padding: 12px;
  border-radius: 6px;
  margin-top: 8px;
}

.deactivation-reason {
  color: #dc2626;
  font-size: 0.8rem;
  margin-bottom: 8px;
}

.deactivation-actions {
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

.notification-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.notification-item:hover .notification-actions {
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

.loading-hint {
  color: #6b7280;
  margin-top: 8px;
  font-size: 0.8rem;
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
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: #f3f4f6;
}

.modal-body {
  padding: 20px;
}

.warning-details-full {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.message-section,
.product-section,
.price-section,
.warning-section,
.actions-section {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 16px;
}

.message-section:last-child,
.product-section:last-child,
.price-section:last-child,
.warning-section:last-child,
.actions-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.message-section h3,
.product-section h3,
.price-section h3,
.warning-section h3,
.actions-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 12px 0;
}

.full-message {
  background: #f9fafb;
  padding: 16px;
  border-radius: 6px;
  border-left: 4px solid #f59e0b;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #374151;
  white-space: pre-line;
}

.product-info-full {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-name-full {
  font-weight: 600;
  color: #111827;
  font-size: 1.1rem;
}

.price-comparison-full {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.price-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.price-item .label {
  font-weight: 500;
  color: #4b5563;
}

.current-price-full {
  color: #dc2626;
  font-weight: 600;
  font-size: 1.1rem;
}

.max-price-full {
  color: #059669;
  font-weight: 600;
  font-size: 1.1rem;
}

.excess-amount-full {
  color: #f59e0b;
  font-weight: 600;
  font-size: 1.1rem;
}

.warning-level-full {
  margin-bottom: 12px;
}

.warning-level-badge-full {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
}

.final-warning-alert-full {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fee2e2;
  color: #dc2626;
  padding: 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
}

.warning-actions-full {
  display: flex;
  gap: 12px;
}

/* Dark mode styles */
:global(.dark) .main-content {
  background-color: #111827;
}

:global(.dark) .page-title h1 {
  color: #f9fafb;
}

:global(.dark) .page-title p {
  color: #9ca3af;
}

:global(.dark) .theme-toggle {
  color: #f9fafb;
}

:global(.dark) .theme-toggle:hover {
  background-color: rgba(255,255,255,0.1);
}

:global(.dark) .stat-card {
  background-color: #1f2937;
}

:global(.dark) .stat-value {
  color: #f9fafb;
}

:global(.dark) .filter-tabs {
  border-bottom-color: #374151;
}

:global(.dark) .filter-tab {
  color: #9ca3af;
}

:global(.dark) .filter-tab:hover {
  color: #6abe6e;
}

:global(.dark) .filter-tab.active {
  color: #6abe6e;
  border-bottom-color: #6abe6e;
}

:global(.dark) .notifications-container {
  background-color: #1f2937;
}

:global(.dark) .notification-item {
  border-bottom-color: #374151;
}

:global(.dark) .notification-item:hover {
  background-color: #374151;
}

:global(.dark) .notification-item.unread {
  background-color: #422006;
}

:global(.dark) .notification-title {
  color: #f9fafb;
}

:global(.dark) .notification-message {
  color: #d1d5db;
}

:global(.dark) .notification-time {
  color: #9ca3af;
}

:global(.dark) .notification-icon {
  background-color: #374151;
  color: #9ca3af;
}

:global(.dark) .order-code {
  background-color: #374151;
  color: #d1d5db;
}

:global(.dark) .customer-name {
  color: #9ca3af;
}

:global(.dark) .pagination {
  border-top-color: #374151;
}

:global(.dark) .pagination-btn {
  background-color: #374151;
  border-color: #4b5563;
  color: #d1d5db;
}

:global(.dark) .pagination-btn:hover:not(:disabled) {
  background-color: #4b5563;
}

:global(.dark) .pagination-info {
  color: #9ca3af;
}

:global(.dark) .product-name {
  color: #f9fafb;
}

:global(.dark) .category-badge {
  background-color: #374151;
  color: #9ca3af;
}

:global(.dark) .modal-content {
  background-color: #1f2937;
}

:global(.dark) .modal-header {
  border-bottom-color: #374151;
}

:global(.dark) .modal-header h2 {
  color: #f9fafb;
}

:global(.dark) .close-btn {
  color: #9ca3af;
}

:global(.dark) .close-btn:hover {
  background-color: #374151;
}

:global(.dark) .message-section,
:global(.dark) .product-section,
:global(.dark) .price-section,
:global(.dark) .warning-section,
:global(.dark) .actions-section {
  border-bottom-color: #374151;
}

:global(.dark) .message-section h3,
:global(.dark) .product-section h3,
:global(.dark) .price-section h3,
:global(.dark) .warning-section h3,
:global(.dark) .actions-section h3 {
  color: #f9fafb;
}

:global(.dark) .full-message {
  background-color: #374151;
  color: #d1d5db;
}

:global(.dark) .product-name-full {
  color: #f9fafb;
}

:global(.dark) .price-item .label {
  color: #d1d5db;
}

/* Responsive styles */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding: 15px;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .notification-stats {
    grid-template-columns: 1fr;
  }
  
  .filter-tabs {
    overflow-x: auto;
    padding-bottom: 0;
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
  
  .warning-preview-info {
    flex-direction: column;
    gap: 8px;
  }
  
  .warning-preview-details {
    flex-direction: column;
    gap: 4px;
  }
  
  .warning-actions-full {
    flex-direction: column;
  }
  
  .price-changes {
    font-size: 0.8rem;
  }
  
  .product-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .modal-content {
    width: 95%;
    margin: 10px;
  }
}

:global(.dark) .notification-item {
  border-bottom-color: #374151;
}
</style>