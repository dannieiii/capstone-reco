<template>
  <div class="admin-layout" :class="{ 'dark-mode': isDarkMode }">
    <AdminSidebar />
    
    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Notification Header -->
      <div class="notification-header">
        <div class="header-content">
          <Bell class="header-icon" />
          <h2>Notifications</h2>
          <span class="notification-count" v-if="unreadCount > 0">{{ unreadCount }}</span>
        </div>
        <div class="header-actions">
          <button 
            class="mark-all-read-btn" 
            @click="markAllAsRead"
            v-if="unreadCount > 0"
          >
            Mark all as read
          </button>
          <button class="filter-btn" @click="toggleFilter">
            <Filter size="16" />
          </button>
        </div>
      </div>

      <!-- Filter Options -->
      <div class="filter-options" v-if="showFilter">
        <div class="filter-tabs">
          <button 
            v-for="filter in filterOptions" 
            :key="filter.value"
            class="filter-tab"
            :class="{ active: activeFilter === filter.value }"
            @click="setFilter(filter.value)"
          >
            {{ filter.label }}
            <span v-if="getFilterCount(filter.value) > 0" class="filter-count">
              {{ getFilterCount(filter.value) }}
            </span>
          </button>
        </div>
      </div>

      <!-- Notifications List -->
      <div class="notifications-list">
        <div v-if="filteredNotifications.length === 0" class="empty-state">
          <Bell size="48" class="empty-icon" />
          <h3>No notifications</h3>
          <p>New seller registrations will appear here.</p>
        </div>

        <div 
          v-for="notification in filteredNotifications" 
          :key="notification.id"
          class="notification-item"
          :class="{ 
            'unread': !notification.read,
            'urgent': notification.priority === 'high'
          }"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-icon">
            <UserPlus />
          </div>

          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
            <div class="notification-meta">
              <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
              <span v-if="notification.priority === 'high'" class="priority-badge">New</span>
              <span class="status-badge" :class="notification.status">{{ notification.status }}</span>
            </div>
          </div>

          <div class="notification-actions">
            <button 
              class="action-btn primary"
              @click.stop="reviewSellerApplication(notification.sellerData)"
            >
              View Details
            </button>
            <button 
              class="action-btn approve"
              @click.stop="approveApplication(notification.id, notification.sellerData)"
              v-if="notification.status === 'pending'"
            >
              <Check size="14" />
            </button>
            <button 
              class="action-btn danger"
              @click.stop="rejectApplication(notification.id, notification.sellerData)"
              v-if="notification.status === 'pending'"
            >
              <X size="14" />
            </button>
          </div>
        </div>
      </div>

      <!-- Seller Details Modal -->
      <div v-if="showSellerModal" class="modal-overlay" @click="closeSellerModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Seller Application Details</h3>
            <button class="close-btn" @click="closeSellerModal">
              <X size="20" />
            </button>
          </div>
          <div class="modal-body" v-if="selectedSeller">
            <div class="seller-section">
              <h4>Personal Information</h4>
              <div class="info-grid">
                <div class="info-item">
                  <label>Name:</label>
                  <span>{{ selectedSeller.personalInfo?.firstName || 'N/A' }} {{ selectedSeller.personalInfo?.lastName || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <label>Email:</label>
                  <span>{{ selectedSeller.personalInfo?.email || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <label>Contact:</label>
                  <span>{{ selectedSeller.personalInfo?.contact || 'N/A' }}</span>
                </div>
                <div class="info-item full-width">
                  <label>Address:</label>
                  <span>{{ selectedSeller.personalInfo?.address || 'N/A' }}</span>
                </div>
              </div>
            </div>

            <div class="seller-section">
              <h4>Farm Details</h4>
              <div class="info-grid">
                <div class="info-item">
                  <label>Farm Name:</label>
                  <span>{{ selectedSeller.farmDetails?.farmName || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <label>Farm Type:</label>
                  <span>{{ selectedSeller.farmDetails?.farmType || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <label>Experience:</label>
                  <span>{{ selectedSeller.farmDetails?.yearInFarming || 'N/A' }} years</span>
                </div>
                <div class="info-item full-width">
                  <label>Products:</label>
                  <span>{{ selectedSeller.farmDetails?.products || 'N/A' }}</span>
                </div>
                <div class="info-item full-width" v-if="selectedSeller.deliveryInfo?.areasCovered">
                  <label>Areas Covered:</label>
                  <span>{{ selectedSeller.deliveryInfo.areasCovered.join(', ') }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="action-btn approve" @click="approveFromModal">
              <Check size="16" />
              Approve Application
            </button>
            <button class="action-btn danger" @click="rejectFromModal">
              <X size="16" />
              Reject Application
            </button>
          </div>
        </div>
      </div>

      <!-- Floating Action Button for Manual Refresh -->
      <button class="refresh-fab" @click="refreshNotifications" :disabled="isLoading">
        <RotateCcw :class="{ 'spinning': isLoading }" size="20" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  Bell,
  UserPlus,
  Filter,
  Check,
  X,
  RotateCcw
} from 'lucide-vue-next'
import AdminSidebar from '@/components/AdminSidebar.vue'
import { db } from '@/firebase/firebaseConfig'
import { collection, getDocs, doc, updateDoc, onSnapshot } from "firebase/firestore"

// Reactive data
const notifications = ref([])
const showFilter = ref(false)
const activeFilter = ref('all')
const isLoading = ref(false)
const isDarkMode = ref(false)
const showSellerModal = ref(false)
const selectedSeller = ref(null)

// Filter options
const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' }
]

// Computed properties
const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read).length
})

const filteredNotifications = computed(() => {
  let filtered = notifications.value

  switch (activeFilter.value) {
    case 'unread':
      filtered = filtered.filter(n => !n.read)
      break
    case 'pending':
      filtered = filtered.filter(n => n.status === 'pending')
      break
    case 'approved':
      filtered = filtered.filter(n => n.status === 'approved')
      break
    case 'rejected':
      filtered = filtered.filter(n => n.status === 'rejected')
      break
    default:
      break
  }

  return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

// Methods
const getFilterCount = (filterValue) => {
  switch (filterValue) {
    case 'all':
      return notifications.value.length
    case 'unread':
      return notifications.value.filter(n => !n.read).length
    case 'pending':
      return notifications.value.filter(n => n.status === 'pending').length
    case 'approved':
      return notifications.value.filter(n => n.status === 'approved').length
    case 'rejected':
      return notifications.value.filter(n => n.status === 'rejected').length
    default:
      return 0
  }
}

const toggleFilter = () => {
  showFilter.value = !showFilter.value
}

const setFilter = (filterValue) => {
  activeFilter.value = filterValue
}

const markAsRead = (notificationId) => {
  const notification = notifications.value.find(n => n.id === notificationId)
  if (notification) {
    notification.read = true
    // You might want to update this in Firebase as well
  }
}

const markAllAsRead = () => {
  notifications.value.forEach(notification => {
    if (!notification.read) {
      notification.read = true
    }
  })
  // You might want to update this in Firebase as well
}

const handleNotificationClick = (notification) => {
  if (!notification.read) {
    markAsRead(notification.id)
  }
}

const reviewSellerApplication = (sellerData) => {
  selectedSeller.value = sellerData
  showSellerModal.value = true
}

const closeSellerModal = () => {
  showSellerModal.value = false
  selectedSeller.value = null
}

const approveApplication = async (notificationId, sellerData) => {
  try {
    // Update seller status in Firebase
    const sellerRef = doc(db, "sellers", sellerData.id)
    await updateDoc(sellerRef, { 
      registrationStatus: 'Accept',
      status: 'Accept',
      isVerified: true,
      verificationStatus: 'Verified',
      updatedAt: new Date()
    })

    // Update user role in users collection
    const userRef = doc(db, "users", sellerData.userId)
    await updateDoc(userRef, {
      role: "seller",
      isSeller: true
    })

    // Update local notification state
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.status = 'approved'
      notification.read = true
      notification.sellerData.registrationStatus = 'Accept'
      notification.sellerData.verificationStatus = 'Verified'
    }

    alert(`Seller application for ${sellerData.personalInfo?.firstName || 'seller'} has been approved!`)
  } catch (error) {
    console.error("Error approving seller:", error)
    alert("Failed to approve seller. Please try again.")
  }
}

const rejectApplication = async (notificationId, sellerData) => {
  try {
    // Update seller status in Firebase
    const sellerRef = doc(db, "sellers", sellerData.id)
    await updateDoc(sellerRef, { 
      registrationStatus: 'Decline',
      status: 'Decline',
      isVerified: false,
      verificationStatus: 'Rejected',
      updatedAt: new Date()
    })

    // Update local notification state
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.status = 'rejected'
      notification.read = true
      notification.sellerData.registrationStatus = 'Decline'
      notification.sellerData.verificationStatus = 'Rejected'
    }

    alert(`Seller application for ${sellerData.personalInfo?.firstName || 'seller'} has been rejected.`)
  } catch (error) {
    console.error("Error rejecting seller:", error)
    alert("Failed to reject seller. Please try again.")
  }
}

const approveFromModal = () => {
  if (selectedSeller.value) {
    const notification = notifications.value.find(n => n.sellerData.id === selectedSeller.value.id)
    if (notification) {
      approveApplication(notification.id, selectedSeller.value)
    }
    closeSellerModal()
  }
}

const rejectFromModal = () => {
  if (selectedSeller.value) {
    const notification = notifications.value.find(n => n.sellerData.id === selectedSeller.value.id)
    if (notification) {
      rejectApplication(notification.id, selectedSeller.value)
    }
    closeSellerModal()
  }
}

// Update the formatTime method in AdminNotification.vue
const formatTime = (timestamp) => {
  // If timestamp is already a Date object or a string in ISO format
  if (timestamp instanceof Date) {
    return formatDateDifference(timestamp);
  }
  
  // If timestamp is a Firestore Timestamp object
  if (timestamp && typeof timestamp.toDate === 'function') {
    return formatDateDifference(timestamp.toDate());
  }
  
  // If timestamp is a string in the format "May 19, 2025 at 2:51:24 AM UTC+8"
  if (typeof timestamp === 'string') {
    try {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return formatDateDifference(date);
      }
    } catch (e) {
      console.error("Error parsing date:", e);
    }
  }
  
  return 'Unknown time';
};

const formatDateDifference = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

const refreshNotifications = async () => {
  isLoading.value = true
  try {
    await fetchNotifications()
  } finally {
    isLoading.value = false
  }
}

const createSellerNotification = (sellerData) => {
  return {
    id: sellerData.id,
    title: 'New Seller Registration',
    message: `${sellerData.personalInfo?.firstName || 'A seller'} ${sellerData.personalInfo?.lastName || ''} has submitted a seller application for ${sellerData.farmDetails?.farmName || 'their farm'}.`,
    read: false,
    priority: 'high',
    status: 'pending',
    createdAt: sellerData.createdAt || new Date(),
    sellerData: sellerData
  }
}

const fetchNotifications = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "sellers"))
    const sellers = querySnapshot.docs.map(doc => {
      const sellerData = doc.data()
      return { 
        id: doc.id,
        registrationStatus: sellerData.registrationStatus || 'Pending',
        verificationStatus: sellerData.isVerified ? 'Verified' : 'Pending',
        ...sellerData 
      }
    })

    // Create notifications for pending sellers
    const pendingSellers = sellers.filter(seller => 
      seller.registrationStatus === 'Pending' || 
      (seller.registrationStatus === undefined && !seller.isVerified)
    )

    notifications.value = pendingSellers.map(seller => 
      createSellerNotification(seller)
    )
  } catch (error) {
    console.error("Error fetching sellers:", error)
  }
}

// Set up real-time listener for new seller registrations
const setupRealtimeListener = () => {
  return onSnapshot(collection(db, "sellers"), (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const sellerData = change.doc.data()
        if (sellerData.registrationStatus === 'Pending' || sellerData.registrationStatus === undefined) {
          const newNotification = createSellerNotification({
            id: change.doc.id,
            registrationStatus: 'Pending',
            ...sellerData
          })
          
          // Check if notification already exists
          const exists = notifications.value.some(n => n.id === newNotification.id)
          if (!exists) {
            notifications.value.unshift(newNotification)
          }
        }
      }
    })
  })
}

// Lifecycle hooks
let unsubscribe = null

onMounted(() => {
  fetchNotifications()
  unsubscribe = setupRealtimeListener()
  
  // Set up theme
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    isDarkMode.value = true
    document.body.classList.add('dark')
  } else {
    isDarkMode.value = false
    document.body.classList.remove('dark')
  }
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>


<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
  background-color: #f8f9fa;
}

/* Main Content Styles */
.main-content {
  margin-left: 260px;
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  color: #2e5c31;
}

.header-content h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.notification-count {
  background: #dc3545;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.mark-all-read-btn {
  background: #2e5c31;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.mark-all-read-btn:hover {
  background: #1e3f21;
}

.filter-btn {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: #e9ecef;
}

.filter-options {
  margin-bottom: 20px;
  padding: 15px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-tabs {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-tab {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.filter-tab:hover {
  background: #e9ecef;
}

.filter-tab.active {
  background: #2e5c31;
  color: white;
  border-color: #2e5c31;
}

.filter-count {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 12px;
  font-weight: bold;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  color: #6c757d;
  margin-bottom: 16px;
}

.empty-state h3 {
  color: #333;
  margin-bottom: 8px;
}

.empty-state p {
  color: #6c757d;
  margin: 0;
}

.notification-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
  border-left: 4px solid transparent;
}

.notification-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.notification-item.unread {
  border-left-color: #2e5c31;
  background: #f8fff9;
}

.notification-item.urgent {
  border-left-color: #dc3545;
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2e5c31;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  font-size: 16px;
}

.notification-message {
  color: #6c757d;
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 8px;
}

.notification-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notification-time {
  color: #adb5bd;
  font-size: 12px;
}

.priority-badge {
  background: #dc3545;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: bold;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: bold;
  text-transform: capitalize;
}

.status-badge.pending {
  background: #ffc107;
  color: #212529;
}

.status-badge.approved {
  background: #28a745;
  color: white;
}

.status-badge.rejected {
  background: #dc3545;
  color: white;
}

.notification-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.2s;
  white-space: nowrap;
}

.action-btn.primary {
  background: #2e5c31;
  color: white;
}

.action-btn.primary:hover {
  background: #1e3f21;
}

.action-btn.approve {
  background: #28a745;
  color: white;
  padding: 6px 8px;
}

.action-btn.approve:hover {
  background: #218838;
}

.action-btn.danger {
  background: #dc3545;
  color: white;
  padding: 6px 8px;
}

.action-btn.danger:hover {
  background: #c82333;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #dee2e6;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #6c757d;
  padding: 4px;
}

.modal-body {
  padding: 20px;
}

.seller-section {
  margin-bottom: 20px;
}

.seller-section h4 {
  color: #2e5c31;
  margin-bottom: 12px;
  font-size: 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-item label {
  font-weight: 600;
  color: #495057;
  font-size: 14px;
}

.info-item span {
  color: #6c757d;
  font-size: 14px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #dee2e6;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.refresh-fab {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #2e5c31;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(46, 92, 49, 0.3);
  transition: all 0.2s;
  z-index: 1000;
}

.refresh-fab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(46, 92, 49, 0.4);
}

.refresh-fab:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
  }
  
  .notification-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .notification-item {
    padding: 15px;
  }
  
  .notification-actions {
    flex-direction: column;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
}
</style>