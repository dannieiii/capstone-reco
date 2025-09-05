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
            
            <!-- Message: override for price updates to show concise range -->
            <p v-if="notification.type !== 'price_update'" class="notification-message">{{ notification.message }}</p>
            <p v-else class="notification-message">{{ formatPriceUpdateMessage(notification) }}</p>
            
            <!-- Price Update Details (simplified) -->
            <div v-if="notification.type === 'price_update'" class="price-update-details">
              <div class="product-info">
                <strong>{{ notification.productName }}</strong>
                <span v-if="notification.category || notification.productCategory" class="category-badge">{{ notification.category || notification.productCategory }}</span>
              </div>
              <div class="price-range-row">
                <span class="price-label">Updated Price:</span>
                <span class="price-range">{{ formatPriceRange(notification) }}</span>
              </div>
              <div class="notification-actions">
                <button 
                  class="action-btn primary" 
                  @click.stop="viewProduct(notification.productId)"
                  v-if="notification.productId"
                >
                  <Eye size="14" />
                  View Product
                </button>
                <button 
                  class="action-btn secondary" 
                  @click.stop="addToFavorites(notification.productId)"
                  v-if="notification.productId && !isInFavorites(notification.productId)"
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
  and,
  limit
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
// Favorite product price listeners and cache
const favoriteUnsubs = new Map(); // productId -> unsubscribe fn
const priceRefCache = new Map(); // key `${productId}|${unit}` -> { min, max }
const initializedProducts = new Set();
// Maintain separate buckets as in seller view to merge multiple listeners
const notifByCustomer = ref([]);
const notifByUser = ref([]);
let unsubscribeByCustomer = null;
let unsubscribeByUser = null;

// Local cache for order statuses to detect changes
const orderStatusCache = new Map();
let ordersUnsubscribe = null;

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

// Helpers to format price update content
const peso = (v) => {
  const n = Number(v);
  if (!isFinite(n)) return '';
  return `₱${n.toFixed(2)}`;
};

// Normalize range from multiple possible schemas: top-level or nested in priceDetails
const pickNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const getPriceRange = (n) => {
  const pd = n?.priceDetails || {};
  const min =
    pd.minPrice?.new ??
    pd.newMinPrice ??
    pd.minPrice ??
    n.newMinPrice ??
    n.minPrice ??
    n.priceMin ??
    null;
  const max =
    pd.maxPrice?.new ??
    pd.newMaxPrice ??
    pd.maxPrice ??
    n.newMaxPrice ??
    n.maxPrice ??
    n.priceMax ??
    null;
  const unit = n.unit || pd.unit || n.units || 'per kg';
  return { min: pickNumber(min), max: pickNumber(max), unit };
};

const formatPriceRange = (n) => {
  const { min, max, unit } = getPriceRange(n);
  if (min != null && max != null) return `${peso(min)} - ${peso(max)} ${unit}`;
  if (min != null) return `${peso(min)} ${unit}`;
  if (max != null) return `${peso(max)} ${unit}`;
  return 'N/A';
};

const formatPriceUpdateMessage = (n) => {
  const name = n.productName || n.product || 'Product';
  const range = formatPriceRange(n);
  return `${name} is ${range}.`;
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
  // Start listening to this product's price reference
  attachFavoritePriceListener(productId);
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
    return null;
  }

  currentCustomerId.value = currentUser.uid;

  // Cleanup existing listeners if any
  try { if (unsubscribeByCustomer) unsubscribeByCustomer(); } catch {}
  try { if (unsubscribeByUser) unsubscribeByUser(); } catch {}
  unsubscribeByCustomer = null;
  unsubscribeByUser = null;

  const customerQuery = query(
    collection(db, 'notifications'),
    where('customerId', '==', currentUser.uid),
    limit(200)
  );
  const userQuery = query(
    collection(db, 'notifications'),
    where('userId', '==', currentUser.uid),
    limit(200)
  );

  const sortAndMerge = () => {
    const map = new Map();
    [...notifByCustomer.value, ...notifByUser.value].forEach(n => {
      map.set(n.id, n);
    });
    const merged = Array.from(map.values());
    notifications.value = merged.sort((a, b) => {
      const aDate = a.createdAt?.toDate?.() || a.timestamp?.toDate?.() || new Date(a.createdAt || a.timestamp || 0);
      const bDate = b.createdAt?.toDate?.() || b.timestamp?.toDate?.() || new Date(b.createdAt || b.timestamp || 0);
      return bDate - aDate;
    });
    loading.value = false;
  };

  const mapSnapshot = (snapshot) => snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      read: data.read || !!data.readAt
    };
  });

  unsubscribeByCustomer = onSnapshot(
    customerQuery,
    (snapshot) => {
      notifByCustomer.value = mapSnapshot(snapshot);
      sortAndMerge();
    },
    (error) => {
      console.error('Error in customerId notifications listener:', error);
      loading.value = false;
    }
  );

  unsubscribeByUser = onSnapshot(
    userQuery,
    (snapshot) => {
      notifByUser.value = mapSnapshot(snapshot);
      sortAndMerge();
    },
    (error) => {
      console.error('Error in userId notifications listener:', error);
      loading.value = false;
    }
  );

  return () => {
    try { if (unsubscribeByCustomer) unsubscribeByCustomer(); } catch {}
    try { if (unsubscribeByUser) unsubscribeByUser(); } catch {}
  };
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
  // Attach listeners for each favorite product
  favoriteProducts.value.forEach(pid => attachFavoritePriceListener(pid));
    }
  } catch (error) {
    console.error('Error loading favorite products:', error);
  }
};

onMounted(async () => {
  const notificationsUnsub = await setupNotificationListener();
  await loadFavoriteProducts();
  const ordersListenerUnsub = await setupOrderStatusListener();

  onUnmounted(() => {
    try { if (notificationsUnsub) notificationsUnsub(); } catch {}
    try { if (unsubscribeByCustomer) unsubscribeByCustomer(); } catch {}
    try { if (unsubscribeByUser) unsubscribeByUser(); } catch {}
    try { if (ordersListenerUnsub) ordersListenerUnsub(); } catch {}
    // Detach favorite listeners
    try {
      favoriteUnsubs.forEach(unsub => { try { unsub(); } catch {} });
      favoriteUnsubs.clear();
    } catch {}
  });
});

// Listen for the current customer's orders and create notifications on status changes
const setupOrderStatusListener = async () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) return null;

  currentCustomerId.value = currentUser.uid;

  try {
    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', currentUser.uid)
    );

    let initialized = false;

    ordersUnsubscribe = onSnapshot(
      ordersQuery,
      async (snapshot) => {
        // Use docChanges to handle added/modified docs efficiently
        const changes = snapshot.docChanges();

        // On first run, populate cache without sending notifications
        if (!initialized) {
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            orderStatusCache.set(docSnap.id, data.status || 'Pending');
          });
          initialized = true;
          return;
        }

        // For subsequent updates, process modifications
        for (const change of changes) {
          if (change.type === 'modified') {
            const docSnap = change.doc;
            const data = docSnap.data();
            const prevStatus = orderStatusCache.get(docSnap.id);
            const currentStatus = data.status || 'Pending';

            if (prevStatus && prevStatus !== currentStatus) {
              // Compose message
              const orderCode = data.orderCode || docSnap.id.slice(0, 6);
              const phrases = {
                Pending: `We've received your order #${orderCode}. It's now pending confirmation.`,
                Processing: `Order #${orderCode} is already On Processing.`,
                'On Processing': `Order #${orderCode} is already On Processing.`,
                Shipped: `Order #${orderCode} is on the way. You'll be notified upon arrival.`,
                Delivered: `Order #${orderCode} has been delivered. Please verify your items.`,
                'Order Received': `Thanks! We've marked order #${orderCode} as received.`,
                'Refund Processing': `Your refund request for order #${orderCode} is being processed.`,
                Cancelled: `Order #${orderCode} has been cancelled.`
              };

              try {
                await addDoc(collection(db, 'notifications'), {
                  type: 'order_update',
                  recipientType: 'customer',
                  customerId: currentUser.uid,
                  userId: currentUser.uid,
                  sellerId: data.sellerId || null,
                  title: `Order update: ${currentStatus}`,
                  message: phrases[currentStatus] || `Order #${orderCode} status updated to ${currentStatus}.`,
                  orderDetails: {
                    orderId: docSnap.id,
                    orderCode: data.orderCode || orderCode,
                    amount: Number(data.totalPrice || 0)
                  },
                  status: currentStatus,
                  read: false,
                  createdAt: serverTimestamp(),
                  timestamp: serverTimestamp()
                });
              } catch (err) {
                console.error('Error creating order update notification:', err);
              }
            }

            // Update cache
            orderStatusCache.set(docSnap.id, currentStatus);
          } else if (change.type === 'added') {
            // Track new orders without sending a notification on initial add
            const docSnap = change.doc;
            const data = docSnap.data();
            orderStatusCache.set(docSnap.id, data.status || 'Pending');
          }
        }
      },
      (error) => {
        console.error('Error in orders listener (customer):', error);
      }
    );

    return ordersUnsubscribe;
  } catch (error) {
    console.error('Error setting up order status listener:', error);
    return null;
  }
};

// Listen to product price reference for favorites, and create a notification on changes
const attachFavoritePriceListener = (productId) => {
  if (!productId || favoriteUnsubs.has(productId)) return; // already listening

  const productRef = doc(collection(db, 'productPrices'), productId);
  const unsub = onSnapshot(
    productRef,
    async (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const unitPricing = data.unitPricing || {};

      // On first snapshot, prime the cache and don't notify
      const isInitialized = initializedProducts.has(productId);

      for (const [unit, pricing] of Object.entries(unitPricing)) {
        const min = Number(pricing.newMinPrice ?? pricing.minPrice ?? 0);
        const max = Number(pricing.newMaxPrice ?? pricing.maxPrice ?? 0);
        const key = `${productId}|${unit}`;
        const prev = priceRefCache.get(key);

        if (!prev) {
          priceRefCache.set(key, { min, max });
          continue; // first seen
        }

        const changed = min !== prev.min || max !== prev.max;
        priceRefCache.set(key, { min, max });

        if (isInitialized && changed) {
          // Create a concise customer notification
          try {
            const auth = getAuth();
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            await addDoc(collection(db, 'notifications'), {
              type: 'price_update',
              recipientType: 'customer',
              customerId: currentUser.uid,
              userId: currentUser.uid,
              productId: productId,
              productName: data.productName || 'Product',
              productCategory: data.category || null,
              unit: unit,
              title: 'Price Update Alert',
              message: `${data.productName || 'Product'} is ${peso(min)} - ${peso(max)} ${unit}.`,
              priceDetails: {
                unit,
                minPrice: min,
                maxPrice: max,
                source: 'product_reference_change'
              },
              read: false,
              createdAt: serverTimestamp(),
              timestamp: serverTimestamp()
            });
          } catch (e) {
            console.error('Error creating customer price_update notification:', e);
          }
        }
      }

      // Mark initialized after processing first snapshot
      if (!isInitialized) initializedProducts.add(productId);
    },
    (err) => {
      console.error('Favorite product price listener error:', err);
    }
  );

  favoriteUnsubs.set(productId, unsub);
};
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

.notification-item + .notification-item {
  border-top: 1px solid #e5e7eb;
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
  display: none;
}

.price-row {
  display: none;
}

.price-range-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.price-range {
  font-weight: 700;
  color: #1f2937;
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
