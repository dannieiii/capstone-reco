<template>
    <div class="notification-container">
      <!-- Remove the notification icon from here since it's in SellerDashboard -->
      <div class="notification-panel" v-if="showNotificationPanel" @click.stop>
        <div class="notification-header">
          <h3>Notifications</h3>
          <div class="header-actions">
            <button 
              v-if="notifications.length > 0 && unreadCount > 0"
              class="mark-all-read" 
              @click.stop="markAllAsRead"
            >
              <CheckSquare size="14" />
              Mark all as read
            </button>
            <button @click.stop="toggleNotificationPanel" class="close-button">
              <X size="20" />
            </button>
          </div>
        </div>
        
        <div class="notification-list" v-if="notifications.length > 0">
          <div 
            v-for="notification in notifications" 
            :key="notification.id"
            class="notification-item"
            :class="{ 
              unread: !notification.read,
              'price-alert': notification.type === 'price_alert'
            }"
            @click.stop="handleNotificationClick(notification)"
          >
            <div class="notification-icon-wrapper" :class="getNotificationTypeClass(notification.type)">
              <ShoppingBag v-if="notification.type === 'order'" size="16" />
              <AlertCircle v-else-if="notification.type === 'alert'" size="16" />
              <MessageSquare v-else-if="notification.type === 'message'" size="16" />
              <Bell v-else size="16" />
            </div>
            <div class="notification-content">
              <div class="notification-title">
                {{ notification.title }}
                <span v-if="notification.type === 'price_alert'" class="notification-attempt">
                  Attempt {{ notification.attemptNumber }}/3
                </span>
              </div>
              <div class="notification-message">{{ notification.message }}</div>
              <div class="notification-time">{{ formatTime(notification.timestamp) }}</div>
              <div v-if="notification.type === 'price_alert'" class="notification-details">
                <span class="notification-type">Price Alert</span>
                <span class="notification-status" :class="{ 'status-unread': !notification.read }">
                  {{ notification.read ? 'Read' : 'Unread' }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="empty-notifications" v-else>
          <Bell size="24" class="empty-icon" />
          <p>No notifications</p>
          <button class="refresh-btn" @click.stop="fetchNotifications">
            <RefreshCw size="16" />
            Refresh Notifications
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import { Bell, CheckSquare, ShoppingBag, AlertCircle, MessageSquare, RefreshCw, X } from 'lucide-vue-next';
  import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    getDocs,
    doc,
    updateDoc,
    serverTimestamp,
    orderBy,
    limit
  } from 'firebase/firestore';
  import { getAuth, onAuthStateChanged } from 'firebase/auth';
  
  const router = useRouter();
  const db = getFirestore();
  const auth = getAuth();
  
  // State
  const notifications = ref([]);
  const showNotificationPanel = ref(false);
  const currentUserId = ref(null);
  const isLoading = ref(false);
  const pollInterval = ref(null);
  
  // Props
  const props = defineProps({
    userId: {
      type: String,
      default: null
    }
  });
  
  // Emit definition
  const emit = defineEmits(['notification-count-update']);
  
  // Computed properties
  const unreadCount = computed(() => {
    return notifications.value.filter(notification => !notification.read).length;
  });
  
  // Toggle notification panel
  const toggleNotificationPanel = () => {
    showNotificationPanel.value = !showNotificationPanel.value;
    if (showNotificationPanel.value) {
      fetchNotifications();
    }
  };
  
  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHour < 24) return `${diffHour} hr ago`;
    if (diffDay < 7) return `${diffDay} days ago`;
    return date.toLocaleDateString();
  };
  
  // Get notification type class
  const getNotificationTypeClass = (type) => {
    switch (type) {
      case 'order': return 'type-order';
      case 'alert': return 'type-alert';
      case 'message': return 'type-message';
      case 'price_alert': return 'type-price-alert';
      default: return 'type-default';
    }
  };
  
  // Handle notification click
  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        const notificationRef = doc(db, 'notifications', notification.id);
        await updateDoc(notificationRef, {
          read: true,
          readAt: serverTimestamp()
        });
        
        // Update local state
        notifications.value = notifications.value.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        );
        
        emit('notification-count-update', unreadCount.value);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    
    if (notification.type === 'order' && notification.orderId) {
      router.push(`/seller/orders/${notification.orderId}`);
      showNotificationPanel.value = false;
    } else if (notification.link) {
      router.push(notification.link);
      showNotificationPanel.value = false;
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.value.filter(n => !n.read);
      for (const notification of unreadNotifications) {
        const notificationRef = doc(db, 'notifications', notification.id);
        await updateDoc(notificationRef, {
          read: true,
          readAt: serverTimestamp()
        });
      }
      
      // Update local state
      notifications.value = notifications.value.map(n => ({ ...n, read: true }));
      emit('notification-count-update', 0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  // Fetch notifications
  const fetchNotifications = async () => {
    if (isLoading.value || !currentUserId.value) return;
    
    isLoading.value = true;
    try {
      const notificationsRef = collection(db, 'notifications');
      // Simplified query to avoid index requirement
      const q = query(
        notificationsRef,
        where('userId', '==', currentUserId.value),
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      const loadedNotifications = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Add specific handling for OverPricing notifications
        if (data.type === 'price_alert') {
          loadedNotifications.push({
            id: doc.id,
            ...data,
            title: 'Price Alert',
            message: `Your product "${data.productName}" is priced ${data.priceDifference}% above the market average. Please review your pricing.`,
            timestamp: data.timestamp?.toDate() || new Date()
          });
        } else {
          loadedNotifications.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date()
          });
        }
      });
      
      // Sort notifications by timestamp in memory
      loadedNotifications.sort((a, b) => b.timestamp - a.timestamp);
      notifications.value = loadedNotifications;
      emit('notification-count-update', unreadCount.value);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      isLoading.value = false;
    }
  };
  
  // Start polling for notifications
  const startPolling = () => {
    if (pollInterval.value) return;
    
    // Initial fetch
    fetchNotifications();
    
    // Set up polling interval (every 30 seconds)
    pollInterval.value = setInterval(() => {
      if (currentUserId.value) {
        fetchNotifications();
      }
    }, 30000);
  };
  
  // Stop polling
  const stopPolling = () => {
    if (pollInterval.value) {
      clearInterval(pollInterval.value);
      pollInterval.value = null;
    }
  };
  
  // Initialize
  onMounted(async () => {
    const userId = props.userId;
    if (userId) {
      currentUserId.value = userId;
      startPolling();
    } else {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          currentUserId.value = user.uid;
          startPolling();
        }
      });
    }
  });
  
  // Cleanup
  onUnmounted(() => {
    stopPolling();
  });
  
  // Watch for userId changes
  watch(() => props.userId, (newUserId) => {
    if (newUserId) {
      currentUserId.value = newUserId;
      startPolling();
    }
  });
  
  // Expose methods
  defineExpose({
    unreadCount,
    toggleNotificationPanel,
    markAllAsRead,
    fetchNotifications
  });
  </script>
  
  <style scoped>
  .notification-container {
    position: relative;
  }
  
  .notification-panel {
    position: absolute;
    top: 50px;
    right: -10px;
    width: 320px;
    background-color: #fff;
    border-radius: 10px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    overflow: hidden;
  }
  
  .notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    border-bottom: 1px solid #f3f4f6;
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
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
  
  .close-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 5px;
    color: #666;
    border-radius: 4px;
    transition: background-color 0.2s ease;
  }
  
  .close-button:hover {
    background-color: #f3f4f6;
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
  
  .type-price-alert {
    background-color: #fef3c7;
    color: #a16207;
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
    line-clamp: 2;
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
  :global(.dark) .notification-panel {
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
    .notification-panel {
      position: fixed;
      top: 60px;
      right: 10px;
      left: 10px;
      width: auto;
      max-width: calc(100% - 20px);
      z-index: 1000;
    }
  }
  
  /* Add these styles in the <style> section */
  .type-price-alert {
    background-color: #fef3c7;
    color: #a16207;
  }
  
  :global(.dark) .type-price-alert {
    background-color: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
  }
  
  .notification-item.price-alert {
    border-left: 3px solid #f59e0b;
  }
  
  :global(.dark) .notification-item.price-alert {
    border-left-color: #fbbf24;
  }
  
  .notification-attempt {
    font-size: 0.7rem;
    color: #92400e;
    background-color: #fef3c7;
    padding: 2px 6px;
    border-radius: 10px;
    margin-left: 8px;
  }
  
  :global(.dark) .notification-attempt {
    color: #fbbf24;
    background-color: rgba(251, 191, 36, 0.2);
  }
  
  .notification-details {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 5px;
  }
  
  .notification-type {
    font-size: 0.7rem;
    color: #92400e;
    background-color: #fef3c7;
    padding: 2px 6px;
    border-radius: 10px;
  }
  
  .notification-status {
    font-size: 0.7rem;
    color: #6b7280;
    padding: 2px 6px;
    border-radius: 10px;
    background-color: #f3f4f6;
  }
  
  .notification-status.status-unread {
    color: #ef4444;
    background-color: #fee2e2;
  }
  
  :global(.dark) .notification-type {
    color: #fbbf24;
    background-color: rgba(251, 191, 36, 0.2);
  }
  
  :global(.dark) .notification-status {
    color: #9ca3af;
    background-color: #374151;
  }
  
  :global(.dark) .notification-status.status-unread {
    color: #f87171;
    background-color: rgba(248, 113, 113, 0.2);
  }
  </style>