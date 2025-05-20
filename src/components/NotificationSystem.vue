<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, limit } from 'firebase/firestore'
import { db } from '@/firebase/firebaseConfig'
import { CheckSquare, X, Bell } from 'lucide-vue-next'

const props = defineProps({ 
  userId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['notification-count-update'])

const showNotificationPanel = ref(false)
const notifications = ref([])
const unreadCount = ref(0)

let unsubscribe = null

const toggleNotificationPanel = () => {
  showNotificationPanel.value = !showNotificationPanel.value
}

const formatTime = (timestamp) => {
  if (!timestamp) return 'Unknown'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleString()
}

const markAllAsRead = async () => {
  try {
    const batchUpdates = notifications.value
      .filter(n => n.status === 'unread')
      .map(async notification => {
        const notifRef = doc(db, 'notifadmin', notification.id)
        await updateDoc(notifRef, { status: 'read' })
      })
    
    await Promise.all(batchUpdates)
    unreadCount.value = 0
    emit('notification-count-update', 0)
  } catch (error) {
    console.error('Error marking all as read:', error)
  }
}

const markAsRead = async (notification) => {
  if (notification.status === 'read') return
  
  try {
    const notifRef = doc(db, 'notifadmin', notification.id)
    await updateDoc(notifRef, { status: 'read' })
    
    notification.status = 'read'
    unreadCount.value = Math.max(0, unreadCount.value - 1)
    emit('notification-count-update', unreadCount.value)
  } catch (error) {
    console.error('Error marking notification as read:', error)
  }
}

const subscribeToNotifications = () => {
  if (!props.userId) return

  const q = query(
    collection(db, 'notifadmin'),
    where('sellerId', '==', props.userId),
    orderBy('timestamp', 'desc'),
    limit(50)
  )

  return onSnapshot(q, (snapshot) => {
    const notifList = []
    let unread = 0
    
    snapshot.forEach(doc => {
      const data = doc.data()
      const notification = {
        id: doc.id,
        title: data.title || 'Admin Notification',
        message: data.message,
        type: data.type || 'general',
        status: data.status || 'unread',
        timestamp: data.timestamp,
        sellerId: data.sellerId
      }
      
      notifList.push(notification)
      if (notification.status === 'unread') unread++
    })
    
    notifications.value = notifList
    unreadCount.value = unread
    emit('notification-count-update', unread)
  })
}

const setupNotificationListener = () => {
  if (unsubscribe) unsubscribe() // cleanup old listener
  if (props.userId) {
    console.log('Listening for notifications for user:', props.userId)
    unsubscribe = subscribeToNotifications()
  }
}

// Trigger on userId change
watch(() => props.userId, (newId) => {
  if (newId) setupNotificationListener()
})

// Setup on mount
onMounted(() => {
  if (props.userId) setupNotificationListener()
})

onBeforeUnmount(() => {
  if (unsubscribe) unsubscribe()
})

defineExpose({ 
  toggleNotificationPanel,
  setupNotificationListener
})
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