<template>
  <div class="dashboard-container">
    <AdminSidebar initialActiveItem="Dashboard" />
    
    <div class="main-content">
      <header class="header">
        <div class="search-container">
          <div class="search-box">
            <Search size="18" class="search-icon" />
            <input type="text" placeholder="Search..." />
          </div>
        </div>
        
        <div class="header-actions">
          <!-- Notification System -->
      <div class="notification-wrapper">
            <NotificationSystem 
              ref="notificationSystem" 
              :userId="currentUserId" 
              :showAbsoluteTime="true"
        @notification-count-update="updateNotificationCount"
        @new-notification="handleNewNotification"
            />
          </div>
          
          <!-- User Profile -->
          <div class="user-profile" @click="navigateToEditProfile">
            <div class="avatar">
              <UserCircle size="24" class="profile-icon" />
            </div>
            <div class="user-info">
              <h3>{{ adminData ? `${adminData.firstName} ${adminData.lastName}` : 'Loading...' }}</h3>
              <p>{{ adminData ? adminData.email : 'Loading...' }}</p>
            </div>
          </div>
        </div>
      </header>
      
      <div class="dashboard-content">
        <!-- Admin Dashboard Overview -->
        <div class="dashboard-header">
          <h1>Admin Dashboard</h1>
          <div class="date-filter">
            <Calendar size="18" />
            <span>{{ currentDate }}</span>
            <ChevronDown size="16" />
          </div>
        </div>
        
        <!-- Metric Cards -->
        <div class="metric-cards">
          <div class="metric-card">
            <div class="metric-icon blue">
              <Store size="24" />
            </div>
            <div class="metric-content">
              <div class="metric-header">
                <h3>Total Sellers</h3>
                <div class="info-icon">
                  <Info size="16" />
                </div>
              </div>
              <div class="metric-value">{{ totalSellers }}</div>
              <div class="metric-trend positive">
                <TrendingUp size="16" />
                <span>12.5% from last month</span>
              </div>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon green">
              <Users size="24" />
            </div>
            <div class="metric-content">
              <div class="metric-header">
                <h3>Total Customers</h3>
                <div class="info-icon">
                  <Info size="16" />
                </div>
              </div>
              <div class="metric-value">{{ totalCustomers }}</div>
              <div class="metric-trend positive">
                <TrendingUp size="16" />
                <span>8.3% from last month</span>
              </div>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon purple">
              <UserPlus size="24" />
            </div>
            <div class="metric-content">
              <div class="metric-header">
                <h3>Total Users</h3>
                <div class="info-icon">
                  <Info size="16" />
                </div>
              </div>
              <div class="metric-value">{{ totalUsers }}</div>
              <div class="metric-trend positive">
                <TrendingUp size="16" />
                <span>10.2% from last month</span>
              </div>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon orange">
              <ShoppingBag size="24" />
            </div>
            <div class="metric-content">
              <div class="metric-header">
                <h3>Total Products</h3>
                <div class="info-icon">
                  <Info size="16" />
                </div>
              </div>
              <div class="metric-value">{{ totalProducts }}</div>
              <div class="metric-trend positive">
                <TrendingUp size="16" />
                <span>5.7% from last month</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="dashboard-grid">
          <!-- First Row -->
          <div class="grid-section">
            <!-- Seller Overview -->
            <SellerOverview />
            
            <!-- Product Categories -->
            <ProductCategories />
          </div>
          
          <!-- Second Row -->
          <div class="grid-section">
            <!-- Forecasting Overview -->
            <ForecastingOverview />
            
            <!-- Oriental Mindoro Map -->
            <OrientalMindoroMap />
          </div>
          
          <!-- Third Row -->
          <div class="grid-section">
            <!-- Top Sellers Chart (under Forecasting) -->
            <TopSellersChart />
            
            <!-- Price Monitoring (under Oriental Mindoro Map) -->
            <PriceMonitoringOverview />
          </div>
        </div>
        
        <!-- Recent Activity -->
        <RecentActivity />
      </div>
      <!-- Pop-out toast notification -->
      <Notification 
        :title="toastTitle"
        :message="toastMessage" 
        :timeText="toastTime"
        :actionText="toastAction"
        :type="toastType" 
        :visible="showToast" 
        :sticky="toastSticky"
        :duration="toastDuration"
        :clickable="!!toastLink"
        @action="handleToastAction"
        @close="closeToast"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { 
  Search, 
  Info, 
  Calendar,
  ChevronDown,
  UserCircle,
  UserPlus,
  TrendingUp,
  Store,
  Users,
  ShoppingBag
} from 'lucide-vue-next';
import AdminSidebar from '@/components/AdminSidebar.vue';
import SellerOverview from '@/components/admindashboard/SellerOverview.vue';
import ProductCategories from '@/components/admindashboard/ProductCategories.vue';
import PriceMonitoringOverview from '@/components/admindashboard/PriceMonitoringOverview.vue';
import RecentActivity from '@/components/admindashboard/RecentActivity.vue';
import ForecastingOverview from '@/components/admindashboard/ForecastingOverview.vue';
import OrientalMindoroMap from '@/components/admindashboard/OrientalMindoroMap.vue';
import TopSellersChart from '@/components/admindashboard/TopSellersChart.vue';
import NotificationSystem from '@/components/NotificationSystem.vue';
import Notification from '@/components/Notification.vue';
import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs, query, where, serverTimestamp, doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const auth = getAuth();
const router = useRouter();
const adminData = ref(null);
const currentUserId = ref(null);
const notificationSystem = ref(null);
const notificationCount = ref(0);
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('info');
const toastSticky = ref(false);
const toastDuration = ref(4000);
const toastTitle = ref('');
const toastTime = ref('');
const toastAction = ref('click to view');
const toastLink = ref('');
// Track scheduled timeout IDs so we can clear them on unmount
const reminderTimeouts = [];

const fetchAdminData = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      const userId = user.uid;
      currentUserId.value = userId;
      const adminsQuery = query(collection(db, "admins"), where("userId", "==", userId));
      const adminsSnapshot = await getDocs(adminsQuery);
      if (!adminsSnapshot.empty) {
        adminData.value = adminsSnapshot.docs[0].data();
      }
    }
  } catch (error) {
    console.error("Error fetching admin data:", error);
  }
};

const updateNotificationCount = (count) => {
  notificationCount.value = count;
};

// Pop-out toast when a new notification arrives
const handleNewNotification = (n) => {
  // Only toast for alerts and messages for admin
  toastType.value = n.type === 'alert' ? 'info' : 'success';
  toastTitle.value = n.title || 'Notification';
  toastMessage.value = n.message || '';
  // absolute time under it
  const d = n.timestamp?.toDate ? n.timestamp.toDate() : (n.timestamp ? new Date(n.timestamp) : new Date());
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const yy = String(d.getFullYear()).slice(-2);
  let h = d.getHours();
  const mer = h >= 12 ? 'P.M' : 'A.M';
  h = h % 12 || 12;
  const mm = String(d.getMinutes()).padStart(2, '0');
  toastTime.value = `${m}-${day}-${yy} ${h}:${mm}${mer}`;
  toastAction.value = 'click to view';
  toastLink.value = n.link || '';
  // Make price reminders sticky until closed (shows X)
  toastSticky.value = (n.category === 'price-reminder' || /price/i.test(n.title || ''));
  toastDuration.value = toastSticky.value ? 0 : 4000;
  showToast.value = true;
};

const closeToast = () => {
  showToast.value = false;
  toastSticky.value = false;
};

const handleToastAction = () => {
  if (toastLink.value) {
    router.push(toastLink.value);
    closeToast();
  }
};

// Create a price reminder for a specific time slot (idempotent per day/slot)
const createPriceReminderForSlot = async (slotLabel) => {
  try {
    const uid = currentUserId.value;
    if (!uid) return;
    const now = new Date();
    const dateKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
    const docId = `${uid}_${dateKey}_${slotLabel.replace(':','')}_pricereminder`;
    const nref = doc(db, 'notifications', docId);
    const exists = await getDoc(nref);
    if (exists.exists()) {
      return; // already created for this slot today
    }

    const title = 'Reminder to Check Product Prices';
    const message = 'It’s time to review your product prices. Check if you need to increase or decrease based on current market trends.';

    await setDoc(nref, {
      userId: uid,
      title,
      message,
      type: 'alert',
      category: 'price-reminder',
      read: false,
      timestamp: serverTimestamp(),
      link: '/admin',
      scheduleSlot: slotLabel,
      dateKey
    });
    // Force refresh so bell updates immediately
    try { notificationSystem.value?.refreshNotifications?.(); } catch {}
  } catch (err) {
    console.error('Error creating scheduled price reminder:', err);
  }
};

// Schedule reminders: 6:00, 9:00, 12:00, 14:00, 17:00 local time
const scheduleDailyPriceReminders = () => {
  const slots = [
    { h: 6, m: 0, label: '06:00' },
    { h: 9, m: 0, label: '09:00' },
    { h: 12, m: 0, label: '12:00' },
    { h: 14, m: 0, label: '14:00' },
    { h: 17, m: 0, label: '17:00' },
  ];
  slots.forEach(({ h, m, label }) => scheduleSlot(h, m, label));
};

const msUntilNext = (hour, minute) => {
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
};

const scheduleSlot = (hour, minute, label) => {
  const delay = msUntilNext(hour, minute);
  const tid = setTimeout(async () => {
    try {
      await createPriceReminderForSlot(label);
    } finally {
      // Reschedule same slot for the next day (~24h later)
      const tid2 = setTimeout(() => scheduleSlot(hour, minute, label), 24 * 60 * 60 * 1000);
      reminderTimeouts.push(tid2);
    }
  }, delay);
  reminderTimeouts.push(tid);
};

const currentDate = computed(() => {
  const date = new Date();
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
});

const sellers = ref([]);
const customers = ref([]);
const products = ref([]);

const totalSellers = computed(() => sellers.value.length);
const totalCustomers = computed(() => customers.value.length);
const totalUsers = computed(() => totalSellers.value + totalCustomers.value);
const totalProducts = computed(() => products.value.length);

const fetchData = async () => {
  try {
    const sellersQuery = query(collection(db, "users"), where("role", "==", "seller"));
    const sellersSnapshot = await getDocs(sellersQuery);
    sellers.value = sellersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const customersQuery = query(collection(db, "users"), where("role", "==", "customer"));
    const customersSnapshot = await getDocs(customersQuery);
    customers.value = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const productsSnapshot = await getDocs(collection(db, "products"));
    products.value = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

const navigateToEditProfile = () => {
  router.push('/admin/edit-profile');
};

onMounted(async () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUserId.value = user.uid;
      await fetchAdminData();
      // Start daily schedule for reminders at fixed times
      scheduleDailyPriceReminders();
    }
    await fetchData();
  });
});

onBeforeUnmount(() => {
  // Clear all scheduled timeouts when leaving this view
  while (reminderTimeouts.length) {
    const t = reminderTimeouts.pop();
    try { clearTimeout(t); } catch {}
  }
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
  overflow-y: auto;
  margin-left: 260px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-container {
  flex: 1;
}

.search-box {
  display: flex;
  align-items: center;
  background-color: #fff;
  border-radius: 20px;
  padding: 8px 16px;
  width: 300px;
  border: 1px solid #e5e7eb;
}

.search-icon {
  color: #9ca3af;
  margin-right: 8px;
}

.search-box input {
  border: none;
  outline: none;
  width: 100%;
  font-size: 0.9rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.notification-wrapper {
  display: flex;
  align-items: center;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 15px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.user-profile:hover {
  background-color: #f3f4f6;
  transform: translateY(-1px);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.profile-icon {
  color: #6b7280;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-info h3 {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
  color: #111827;
}

.user-info p {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dashboard-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

/* removed test push button styles */

.date-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #6b7280;
  cursor: pointer;
}

.metric-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.metric-card {
  background-color: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-5px);
}

.metric-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.metric-icon.blue {
  background-color: #3498db;
}

.metric-icon.green {
  background-color: #4a8f4d;
}

.metric-icon.purple {
  background-color: #8b5cf6;
}

.metric-icon.orange {
  background-color: #f59e0b;
}

.metric-content {
  flex: 1;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.metric-header h3 {
  font-size: 0.9rem;
  font-weight: 500;
  color: #6b7280;
  margin: 0;
}

.info-icon {
  color: #9ca3af;
  cursor: pointer;
}

.metric-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 5px;
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
}

.metric-trend.positive {
  color: #4a8f4d;
}

.metric-trend.negative {
  color: #ef4444;
}

.dashboard-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.grid-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

@media (max-width: 1200px) {
  .metric-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .grid-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .metric-cards {
    grid-template-columns: 1fr;
  }
}
</style>