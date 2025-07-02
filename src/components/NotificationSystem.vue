<template>
    <div class="notification-container">
      <div class="notification-icon" @click="toggleNotificationPanel($event)" ref="notificationIconRef">
        <Bell size="20" />
        <span class="notification-badge" v-if="unreadCount > 0">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
        
        <!-- Simple Notification Popup -->
        <div class="notification-popup" v-if="showNotificationPanel">
          <div class="notification-header">
            <h3>Notifications</h3>
            <button 
              class="mark-all-read" 
              @click.stop="markAllAsRead"
              v-if="notifications.length > 0 && unreadCount > 0"
            >
              <CheckSquare size="14" />
              Mark all as read
            </button>
          </div>
          
          <div class="notification-list" v-if="notifications.length > 0">
            <div 
              v-for="notification in notifications.slice(0, 5)" 
              :key="notification.id"
              class="notification-item"
              :class="{ unread: !notification.read }"
              @click.stop="handleNotificationClick(notification)"
            >
              <div class="notification-icon-wrapper" :class="getNotificationTypeClass(notification.type)">
                <ShoppingBag v-if="notification.type === 'order'" size="16" />
                <AlertCircle v-else-if="notification.type === 'alert'" size="16" />
                <MessageSquare v-else-if="notification.type === 'message'" size="16" />
                <Bell v-else size="16" />
              </div>
              <div class="notification-content">
                <div class="notification-title">{{ notification.title }}</div>
                <div class="notification-message">{{ notification.message }}</div>
                <div class="notification-time">{{ formatTime(notification.timestamp) }}</div>
              </div>
            </div>
          </div>
          
          <div class="empty-notifications" v-else>
            <Bell size="24" class="empty-icon" />
            <p>No notifications</p>
            <button class="refresh-btn" @click="forceRefreshNotifications">
              <RefreshCw size="16" />
              Refresh Notifications
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import { Bell, CheckSquare, ShoppingBag, AlertCircle, MessageSquare, RefreshCw } from 'lucide-vue-next';
  import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    orderBy, 
    onSnapshot, 
    doc, 
    updateDoc, 
    Timestamp, 
    writeBatch,
    serverTimestamp,
    getDocs,
    addDoc,
    limit
  } from 'firebase/firestore';
  import { getAuth, onAuthStateChanged } from 'firebase/auth';
  
  const router = useRouter();
  const db = getFirestore();
  const auth = getAuth();
  
  // State
  const notifications = ref([]);
  const showNotificationPanel = ref(false);
  const notificationIconRef = ref(null);
  const currentUserId = ref(null);
  const unsubscribeNotifications = ref(null);
  const unsubscribeOrderListener = ref(null);
  const isAuthReady = ref(false);
  const isProcessingOrders = ref(false);
  const isInitialized = ref(false); // Track if the component is initialized
  
  // Props
  const props = defineProps({
    userId: {
      type: String,
      default: null
    }
  });
  
  // Computed properties
  const unreadCount = computed(() => {
    return notifications.value.filter(notification => !notification.read).length;
  });
  
  // Toggle notification panel
  const toggleNotificationPanel = (event) => {
    if (event) {
      event.stopPropagation();
    }
    showNotificationPanel.value = !showNotificationPanel.value;
    
    // If opening the panel, refresh notifications
    if (showNotificationPanel.value) {
      refreshNotifications();
    }
  };
  
  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    const date = timestamp instanceof Timestamp 
      ? timestamp.toDate() 
      : new Date(timestamp);
    
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) {
      return 'Just now';
    } else if (diffMin < 60) {
      return `${diffMin} min ago`;
    } else if (diffHour < 24) {
      return `${diffHour} hr ago`;
    } else if (diffDay < 7) {
      return `${diffDay} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Get notification type class
  const getNotificationTypeClass = (type) => {
    switch (type) {
      case 'order':
        return 'type-order';
      case 'alert':
        return 'type-alert';
      case 'message':
        return 'type-message';
      default:
        return 'type-default';
    }
  };
  
  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.type === 'order' && notification.orderId) {
      router.push(`/seller/orders/${notification.orderId}`);
      showNotificationPanel.value = false;
    } else if (notification.link) {
      router.push(notification.link);
      showNotificationPanel.value = false;
    }
  };
  
  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      });
      
      // Update local state
      notifications.value = notifications.value.map(notification => {
        if (notification.id === notificationId) {
          return { ...notification, read: true };
        }
        return notification;
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async (event) => {
    if (event) event.stopPropagation();
    
    try {
      const batch = writeBatch(db);
      const unreadNotificationsList = notifications.value.filter(notification => !notification.read);
      
      unreadNotificationsList.forEach(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.update(notificationRef, {
          read: true,
          readAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      
      // Update local state
      notifications.value = notifications.value.map(notification => {
        return { ...notification, read: true };
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  // Setup notification listener
  const setupNotificationListener = (userId) => {
    if (!userId) return;
    
    // Clear any existing listener
    if (unsubscribeNotifications.value) {
      unsubscribeNotifications.value();
    }
    
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    
    unsubscribeNotifications.value = onSnapshot(q, (snapshot) => {
      const notificationsList = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        notificationsList.push({
          id: doc.id,
          title: data.title || 'Notification',
          message: data.message || '',
          type: data.type || 'default',
          read: data.read || false,
          timestamp: data.timestamp || new Date(),
          orderId: data.orderId || null,
          link: data.link || null
        });
      });
      
      notifications.value = notificationsList;
      console.log('Notifications updated:', notificationsList.length);
    }, (error) => {
      console.error('Error setting up notification listener:', error);
    });
  };
  
  // Force refresh notifications
  const forceRefreshNotifications = () => {
    refreshNotifications();
    processExistingOrders();
  };
  
  // Refresh notifications
  const refreshNotifications = () => {
    const userId = currentUserId.value || props.userId;
    if (userId) {
      setupNotificationListener(userId);
    }
  };
  
  // Process existing orders
  const processExistingOrders = async () => {
    if (isProcessingOrders.value) return;
    
    const userId = currentUserId.value || props.userId;
    if (!userId) return;
    
    isProcessingOrders.value = true;
    console.log('Processing existing orders for user:', userId);
    
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef,
        where('sellerId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      console.log(`Found ${snapshot.size} orders to process`);
      
      let processedCount = 0;
      
      for (const doc of snapshot.docs) {
        const orderData = doc.data();
        await createOrderNotification({
          id: doc.id,
          ...orderData,
          sellerId: userId
        });
        processedCount++;
      }
      
      console.log(`Processed ${processedCount} orders`);
    } catch (error) {
      console.error('Error processing existing orders:', error);
    } finally {
      isProcessingOrders.value = false;
    }
  };
  
  // Setup order listener
  const setupOrderListener = (sellerId) => {
    if (!sellerId) return;
    
    // Process existing orders first
    processExistingOrders();
    
    // Clear any existing listener
    if (unsubscribeOrderListener.value) {
      unsubscribeOrderListener.value();
    }
    
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('sellerId', '==', sellerId),
      orderBy('timestamp', 'desc')
    );
    
    unsubscribeOrderListener.value = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const orderData = change.doc.data();
          console.log('New order detected:', change.doc.id);
          createOrderNotification({
            id: change.doc.id,
            ...orderData,
            sellerId: sellerId
          });
        } else if (change.type === 'modified') {
          // Handle status changes if needed
          const orderData = change.doc.data();
          console.log('Order modified:', change.doc.id, orderData.status);
        }
      });
    }, (error) => {
      console.error('Error setting up order listener:', error);
    });
  };
  
  // Create a notification for a new order
  const createOrderNotification = async (order) => {
    try {
      const sellerId = order.sellerId;
      if (!sellerId) {
        console.error('No seller ID found in order:', order.id);
        return;
      }
      
      // Check if a notification for this order already exists
      const notificationsRef = collection(db, 'notifications');
      const existingQuery = query(
        notificationsRef,
        where('userId', '==', sellerId),
        where('orderId', '==', order.id)
      );
      
      const existingSnapshot = await getDocs(existingQuery);
      
      // Only create a notification if one doesn't already exist
      if (existingSnapshot.empty) {
        console.log('Creating new notification for order:', order.id);
        
        // Create notification document
        await addDoc(notificationsRef, {
          userId: sellerId,
          title: 'New Order Received',
          message: `New order #${order.orderCode || order.id.substring(0, 6)} for ${order.productName || 'your product'} has been placed.`,
          type: 'order',
          read: false,
          timestamp: serverTimestamp(),
          orderId: order.id,
          link: `/seller/orders/${order.id}`
        });
        
        console.log('Notification created successfully for order:', order.id);
        
        // Refresh notifications
        refreshNotifications();
      } else {
        console.log('Notification already exists for order:', order.id);
      }
    } catch (error) {
      console.error('Error creating order notification:', error);
    }
  };
  
  // Close notification panel when clicking outside
  const handleClickOutside = (event) => {
    if (notificationIconRef.value && !notificationIconRef.value.contains(event.target)) {
      showNotificationPanel.value = false;
    }
  };
  
  // Initialize
  onMounted(() => {
    // Initialize only once
    if (isInitialized.value) return;
    isInitialized.value = true;
  
    // Use provided userId or get from auth
    if (props.userId) {
      currentUserId.value = props.userId;
      setupNotificationListener(props.userId);
      setupOrderListener(props.userId);
    } else {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          currentUserId.value = user.uid;
          setupNotificationListener(user.uid);
          setupOrderListener(user.uid);
        }
        isAuthReady.value = true;
      });
    }
    
    document.addEventListener('click', handleClickOutside);
    
    // Process existing orders on mount
    setTimeout(() => {
      processExistingOrders();
    }, 1000);
  });
  
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
    
    if (unsubscribeNotifications.value) {
      unsubscribeNotifications.value();
    }
    if (unsubscribeOrderListener.value) {
      unsubscribeOrderListener.value();
    }
  });
  
  // Watch for auth ready and currentUserId
  watch(
    () => [isAuthReady.value, currentUserId.value],
    ([newIsAuthReady, newCurrentUserId]) => {
      if (newIsAuthReady && newCurrentUserId) {
        setupNotificationListener(newCurrentUserId);
        setupOrderListener(newCurrentUserId);
      }
    }
  );
  
  // Watch for props.userId changes
  watch(
    () => props.userId,
    (newUserId) => {
      if (newUserId) {
        currentUserId.value = newUserId;
        setupNotificationListener(newUserId);
        setupOrderListener(newUserId);
      }
    }
  );
  
  // Expose for parent component
  defineExpose({
    unreadCount,
    toggleNotificationPanel,
    markAllAsRead,
    refreshNotifications,
    processExistingOrders
  });
  </script>
  
  <style scoped>
  .notification-container {
    position: relative;
  }
  
  .notification-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    cursor: pointer;
    border: 1px solid #e5e7eb;
    position: relative;
    transition: all 0.2s ease;
  }
  
  .notification-icon:hover {
    background-color: #f9fafb;
  }
  
  .notification-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background-color: #ef4444;
    color: white;
    border-radius: 50%;
    min-width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6rem;
    font-weight: bold;
    padding: 0 4px;
  }
  
  .notification-popup {
    position: absolute;
    top: 50px;
    right: -10px;
    width: 320px;
    background-color: #fff;
    border-radius: 10px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    z-index: 100;
    overflow: hidden;
  }
  
  .notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    border-bottom: 1px solid #f3f4f6;
  }
  
  .notification-header h3 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
    color: #111827;
  }
  
  .mark-all-read {
    background: none;
    border: none;
    font-size: 0.75rem;
    color: #4a8f4d;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 8px;
    border-radius: 4px;
    transition: background-color 0.2s ease;
  }
  
  .mark-all-read:hover {
    background-color: #ecfdf5;
  }
  
  .notification-list {
    max-height: 350px;
    overflow-y: auto;
  }
  
  .notification-item {
    display: flex;
    padding: 12px 15px;
    border-bottom: 1px solid #f3f4f6;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .notification-item:hover {
    background-color: #f9fafb;
  }
  
  .notification-item.unread {
    background-color: #f0fdf4;
  }
  
  .notification-item.unread:hover {
    background-color: #ecfdf5;
  }
  
  .notification-icon-wrapper {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    flex-shrink: 0;
  }
  
  .type-order {
    background-color: #e0f2fe;
    color: #0284c7;
  }
  
  .type-alert {
    background-color: #fee2e2;
    color: #dc2626;
  }
  
  .type-message {
    background-color: #f3e8ff;
    color: #7e22ce;
  }
  
  .type-default {
    background-color: #f3f4f6;
    color: #6b7280;
  }
  
  .notification-content {
    flex: 1;
    min-width: 0;
  }
  
  .notification-title {
    font-size: 0.9rem;
    font-weight: 500;
    color: #111827;
    margin-bottom: 3px;
  }
  
  .notification-message {
    font-size: 0.8rem;
    color: #6b7280;
    margin-bottom: 5px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .notification-time {
    font-size: 0.7rem;
    color: #9ca3af;
  }
  
  .empty-notifications {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30px 15px;
    color: #9ca3af;
  }
  
  .empty-icon {
    margin-bottom: 10px;
  }
  
  .empty-notifications p {
    font-size: 0.9rem;
    margin: 0 0 15px 0;
  }
  
  .refresh-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background-color: #f3f4f6;
    border: none;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.8rem;
    color: #4b5563;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .refresh-btn:hover {
    background-color: #e5e7eb;
  }
  
  /* Dark mode styles */
  :global(.dark) .notification-icon,
  :global(.dark) .notification-popup {
    background-color: #1f2937;
    border-color: #374151;
  }
  
  :global(.dark) .notification-header,
  :global(.dark) .notification-item {
    border-color: #374151;
  }
  
  :global(.dark) .notification-header h3,
  :global(.dark) .notification-title {
    color: #f9fafb;
  }
  
  :global(.dark) .notification-message {
    color: #9ca3af;
  }
  
  :global(.dark) .notification-time {
    color: #6b7280;
  }
  
  :global(.dark) .notification-item:hover {
    background-color: #2d3748;
  }
  
  :global(.dark) .notification-item.unread {
    background-color: rgba(74, 143, 77, 0.1);
  }
  
  :global(.dark) .notification-item.unread:hover {
    background-color: rgba(74, 143, 77, 0.15);
  }
  
  :global(.dark) .refresh-btn {
    background-color: #374151;
    color: #e5e7eb;
  }
  
  :global(.dark) .refresh-btn:hover {
    background-color: #4b5563;
  }
  
  /* Responsive styles */
  @media (max-width: 576px) {
    .notification-popup {
      position: fixed;
      top: 60px;
      right: 10px;
      left: 10px;
      width: auto;
      max-width: calc(100% - 20px);
      z-index: 1000;
    }
  }
  </style>