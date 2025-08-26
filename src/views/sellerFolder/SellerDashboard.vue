<template>
<div class="dashboard-container">
  <Sidebar initialActiveItem="Dashboard" />
  
  <div class="main-content">
    <header class="header">
      <div class="search-container">
        <div class="search-box">
          <Search size="18" class="search-icon" />
          <input type="text" placeholder="Search products, orders..." v-model="searchQuery" @input="handleSearch" />
        </div>
      </div>
      
      <div class="user-profile" @click="toggleProfileMenu" ref="profileRef">
        <div class="notification-wrapper">
          <NotificationSystem 
            ref="notificationSystem" 
            :userId="currentUserId" 
            @notification-count-update="updateNotificationCount"
          />
        </div>
        <div class="avatar">
          <User v-if="!profilePicture" size="24" class="default-avatar" />
          <img v-else :src="profilePicture" alt="User avatar" />
        </div>
        <div class="user-info">
          <h3>{{ username }}</h3>
          <p>{{ email }}</p>
        </div>

        <!-- Profile Dropdown Menu -->
        <div class="profile-dropdown" v-if="showProfileMenu">
          <div class="profile-header">
            <div class="profile-avatar">
              <User v-if="!profilePicture" size="24" class="default-avatar" />
              <img v-else :src="profilePicture" alt="User avatar" />
            </div>
            <div>
              <h3>{{ username }}</h3>
              <p>{{ email }}</p>
            </div>
            <button class="logout-btn" @click="handleLogout">
              <LogOut size="18" />
            </button>
          </div>
          
          <div class="profile-tabs">
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'profile' }" 
              @click="setActiveTab('profile')"
            >
              <User size="18" />
              Profile
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'setting' }" 
              @click="setActiveTab('setting')"
            >
              <Settings size="18" />
              Setting
            </button>
          </div>
          
          <div class="tab-content" v-if="activeTab === 'profile'">
            <button class="menu-item" @click="navigateToEditProfile">
              <Edit size="18" />
              Edit Profile
            </button>
            <button class="menu-item" @click="navigateToFarmStore">
              <UserCheck size="18" />
              View Profile
            </button>
            <button class="menu-item">
              <CreditCard size="18" />
              Payment Methods
            </button>
            <button class="menu-item" @click="handleLogout">
              <LogOut size="18" />
              Logout
            </button>
          </div>
          
          <div class="tab-content" v-if="activeTab === 'setting'">
            <button class="menu-item">
              <HelpCircle size="18" />
              Farm Support
            </button>
            <button class="menu-item">
              <UserCog size="18" />
              Account Settings
            </button>
            <button class="menu-item">
              <Shield size="18" />
              Privacy Center
            </button>
            <button class="menu-item">
              <MessageSquare size="18" />
              Farmer Feedback
            </button>
          </div>
        </div>
      </div>
    </header>
    
    <div class="dashboard-content">
      <!-- Welcome Banner -->
      <div class="welcome-banner">
        <div class="welcome-text">
          <h2>Good {{ timeOfDay }}, {{ firstName }}</h2>
          <p>Here's what's happening with your farm products today</p>
        </div>
      </div>
      
      <!-- Metric Cards -->
      <div class="metric-cards">
        <div class="metric-card" v-for="(metric, index) in metrics" :key="index">
          <div class="metric-header">
            <h3>{{ metric.title }}</h3>
            <div class="info-icon" @click="showMetricInfo(metric.title)">
              <Info size="16" />
            </div>
          </div>
          <div class="metric-value">{{ metric.value }}</div>
          <div class="metric-change" :class="metric.change >= 0 ? 'positive' : 'negative'">
            <TrendingUp size="14" v-if="metric.change >= 0" />
            <TrendingDown size="14" v-else />
            {{ Math.abs(metric.change) }}% {{ metric.change >= 0 ? 'increase' : 'decrease' }} from yesterday
          </div>
        </div>
      </div>
      
      <!-- Sales Revenue Chart -->
      <div class="dashboard-row">
        <div class="dashboard-col dashboard-col--main">
          <SalesRevenueChart 
            :sellerId="currentUserId"
            :currency="'₱'"
          />
        </div>
        <div class="dashboard-col dashboard-col--side">
          <OrientalMindoroMap />
        </div>
      </div>
      
      <div class="bottom-section">
        <!-- Customer Overview Graph -->
        <CustomerOverviewGraph 
          :sellerId="currentUserId"
        />
        <!-- Top Selling Products -->
        <TopSellingProducts 
          :sellerId="currentUserId"
        />
      </div>
      
      <!-- Recent Orders -->
      <RecentOrders 
        :orders="recentOrders" 
        :totalOrders="totalOrders" 
        :currency="'₱'"
        v-if="recentOrders.length > 0"
      />
      <div v-else class="no-orders">
        <PackageOpen size="24" class="no-orders-icon" />
        <p>No recent orders found</p>
      </div>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { 
Search, 
Bell, 
Info,
User,
Settings,
Edit,
UserCheck,
CreditCard,
LogOut,
HelpCircle,
UserCog,
Shield,
MessageSquare,
PackageOpen,
TrendingUp,
TrendingDown
} from 'lucide-vue-next';
import Sidebar from '@/components/Sidebar.vue';
import SalesRevenueChart from '@/components/sellerside/SalesRevenueChart.vue';
import OrientalMindoroMap from '@/components/sellerside/OrientalMindoroMap.vue';
import CustomerOverviewGraph from '@/components/sellerside/CustomerOverviewGraph.vue';
import TopSellingProducts from '@/components/sellerside/TopSellingProducts.vue';
import RecentOrders from '@/components/RecentOrders.vue';
import NotificationSystem from '@/components/NotificationSystem.vue';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';

const router = useRouter();
const db = getFirestore();
const auth = getAuth();

// State
const username = ref('Loading...');
const firstName = ref('');
const email = ref('Loading...');
const profilePicture = ref(null);
const searchQuery = ref('');
const showProfileMenu = ref(false);
const activeTab = ref('profile');
const profileRef = ref(null);
const notificationSystem = ref(null);
const notificationCount = ref(0);
const currentUserId = ref(null);

// Computed properties
const timeOfDay = computed(() => {
const hour = new Date().getHours();
if (hour < 12) return 'morning';
if (hour < 18) return 'afternoon';
return 'evening';
});

// Metrics
// const metrics = ref([
// { title: 'New Orders', value: '0', change: 0 },
// { title: 'Harvest Ready', value: '0', change: 0 },
// { title: 'Products Low Stock', value: '0', change: 0 },
// { title: 'Customer Reviews', value: '0', change: 0 }
// ]);

// Data
const totalOrders = ref(0);
const recentOrders = ref([]);
const isLoading = ref(true);
const unreadNotificationsCount = ref(0);

// Methods
const handleNotificationClick = async () => {
console.log('Notification clicked in SellerDashboard');
await nextTick(); // Wait for component to be mounted
if (notificationSystem.value) {
  console.log('Notification system reference found, toggling panel');
  notificationSystem.value.toggleNotificationPanel();
} else {
  console.error('Notification system reference not found in SellerDashboard');
}
};

const updateNotificationCount = (count) => {
unreadNotificationsCount.value = count;
};

const toggleProfileMenu = () => {
showProfileMenu.value = !showProfileMenu.value;
};

const setActiveTab = (tab) => {
activeTab.value = tab;
};

const navigateToEditProfile = () => {
router.push('/seller/edit-profile');
showProfileMenu.value = false;
};

const navigateToFarmStore = () => {
if (currentUserId.value) {
  router.push({
    name: 'farmStore',
    params: { sellerId: currentUserId.value }
  });
} else {
  alert('Seller information not available');
}
};

const handleLogout = async () => {
try {
  await signOut(auth);
  router.push('/login');
} catch (error) {
  console.error('Error logging out:', error);
}
};

const handleSearch = () => {
console.log('Searching for:', searchQuery.value);
};

const handleClickOutside = (event) => {
if (profileRef.value && !profileRef.value.contains(event.target)) {
  showProfileMenu.value = false;
}
};

// Watch for notification count changes
watch(() => notificationSystem.value?.unreadCount, (newCount) => {
console.log('Notification count updated:', newCount);
notificationCount.value = newCount || 0;
}, { immediate: true });

// Lifecycle hooks
onMounted(async () => {
console.log('SellerDashboard mounted');

document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
document.removeEventListener('click', handleClickOutside);
});

// Calculate metrics based on orders and products
const calculateMetrics = () => {
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

const newOrdersCount = recentOrders.value.filter(order => 
  new Date(order.date) >= yesterday
).length;

metrics.value = [
  { title: 'New Orders', value: newOrdersCount.toString(), change: 20 },
  { title: 'Harvest Ready', value: '5', change: -10 },
  { title: 'Products Low Stock', value: '3', change: 0 },
  { title: 'Customer Reviews', value: '8', change: 60 }
];
};

// Setup real-time listener for orders
const setupOrdersListener = (sellerId) => {
const ordersRef = collection(db, 'orders');
const q = query(
  ordersRef,
  where('sellerId', '==', sellerId),
  orderBy('timestamp', 'desc')
);

// Set up real-time listener
const unsubscribe = onSnapshot(q, (snapshot) => {
  const orders = [];
  snapshot.forEach((doc) => {
    const orderData = doc.data();
    const safeOrder = {
      id: doc.id,
      productName: orderData.productName || 'Unknown Product',
      productImage: orderData.productImage || '',
      category: orderData.category || 'Uncategorized',
      status: orderData.status || 'Unknown',
      date: orderData.timestamp?.toDate()?.toLocaleDateString() || 'N/A',
      time: orderData.timestamp?.toDate()?.toLocaleTimeString() || 'N/A',
      price: orderData.totalPrice ? `₱${orderData.totalPrice.toFixed(2)}` : '₱0.00',
      quantity: orderData.quantity || 1,
      customer: orderData.customerName || 'N/A',
      location: orderData.shippingAddress || 'N/A',
      invoice: `INV-${doc.id.substring(0, 4).toUpperCase()}`
    };
    
    orders.push(safeOrder);
  });
  
  recentOrders.value = orders.slice(0, 3); // Get only the 3 most recent
  totalOrders.value = snapshot.size;
  
  // Update metrics when orders change
  calculateMetrics();
}, (error) => {
  console.error("Error setting up orders listener:", error);
});

// Store the unsubscribe function to clean up on component unmount
onBeforeUnmount(() => {
  unsubscribe();
});
};

// Fetch orders for the seller with proper error handling
const fetchSellerOrders = async (sellerId) => {
try {
  const ordersRef = collection(db, 'orders');
  const q = query(
    ordersRef,
    where('sellerId', '==', sellerId),
    orderBy('timestamp', 'desc'),
    limit(3)
  );
  
  const snapshot = await getDocs(q);
  const orders = [];
  
  snapshot.forEach((doc) => {
    const orderData = doc.data();
    orders.push({
      id: doc.id,
      productName: orderData.productName || 'Unknown Product',
      productImage: orderData.productImage || '',
      category: orderData.category || 'Uncategorized',
      status: orderData.status || 'Unknown',
      date: orderData.timestamp?.toDate()?.toLocaleDateString() || 'N/A',
      time: orderData.timestamp?.toDate()?.toLocaleTimeString() || 'N/A',
      price: orderData.totalPrice ? `₱${orderData.totalPrice.toFixed(2)}` : '₱0.00',
      quantity: orderData.quantity || 1,
      customer: orderData.customerName || 'N/A',
      location: orderData.shippingAddress || 'N/A',
      invoice: `INV-${doc.id.substring(0, 4).toUpperCase()}`
    });
  });
  
  recentOrders.value = orders;
  totalOrders.value = snapshot.size;
} catch (error) {
  console.error('Error fetching orders:', error);
  recentOrders.value = [];
}
};

// Metric information
const showMetricInfo = (metric) => {
let message = '';
switch(metric) {
  case 'New Orders':
    message = 'Number of new orders received in the last 24 hours';
    break;
  case 'Harvest Ready':
    message = 'Products ready for harvest in the next 7 days';
    break;
  case 'Products Low Stock':
    message = 'Products with less than 10 items in stock';
    break;
  case 'Customer Reviews':
    message = 'New customer reviews received in the last week';
    break;
}
alert(`${metric}: ${message}`);
};

// Add a method to manually check notifications
const checkNotifications = async () => {
await nextTick(); // Wait for component to be mounted
if (notificationSystem.value) {
  console.log('Manually checking notifications in SellerDashboard');
  await notificationSystem.value.checkNotifications();
} else {
  console.error('Notification system reference not found when checking notifications');
}
};

onAuthStateChanged(auth, async (user) => {
if (user) {
  console.log('User authenticated in SellerDashboard:', user.uid);
  currentUserId.value = user.uid;
  
  try {
    // Set email from auth user immediately
    email.value = user.email || '';
    
    // Wait for next tick to ensure notification system is mounted
    await nextTick();
    
    // Initialize notification system
    if (notificationSystem.value) {
      console.log('Initializing notification system in SellerDashboard');
      await notificationSystem.value.setupNotificationListener(user.uid);
      console.log('Notification system initialized');
    } else {
      console.error('Notification system reference not found during initialization');
    }

    // Replace the user document fetching section with:
    const sellerDoc = await getDoc(doc(db, 'sellers', user.uid));
    console.log('Seller document exists:', sellerDoc.exists());

    if (sellerDoc.exists()) {
      const sellerData = sellerDoc.data();
      console.log('Raw seller data:', sellerData);

      // Update seller information with correct field mapping
      const firstName = sellerData.firstName || sellerData.personalInfo?.firstName || '';
      const lastName = sellerData.lastName || sellerData.personalInfo?.lastName || '';
      console.log('First name:', firstName);
      console.log('Last name:', lastName);

      const fullName = `${firstName} ${lastName}`.trim();
      console.log('Full name:', fullName);

      if (fullName) {
        username.value = fullName;
        firstName.value = firstName;
      } else {
        username.value = 'Seller';
        firstName.value = 'Seller';
      }

      // Use correct email field
      email.value = sellerData.personalInfo?.email || user.email || '';

      // Use correct profile image field
      profilePicture.value = sellerData.profileImageUrl || null;

      console.log('Final username:', username.value);
      console.log('Final firstname:', firstName.value);

      // Fetch orders and products
      await fetchSellerOrders(user.uid);
      calculateMetrics();
    } else {
      console.error('Seller document not found in Firestore');
      // Fallback values
      username.value = user.displayName || 'Seller';
      firstName.value = user.displayName || 'Seller';
      email.value = user.email || '';
    }
  } catch (error) {
    console.error('Error in SellerDashboard initialization:', error);
    // Set fallback values on error
    if (user.displayName) {
      username.value = user.displayName;
      firstName.value = user.displayName;
    } else {
      username.value = 'Seller';
      firstName.value = 'Seller';
    }
  }
} else {
  console.log('No user authenticated in SellerDashboard');
  currentUserId.value = null;
  // Reset values
  username.value = 'Loading...';
  firstName.value = '';
  email.value = 'Loading...';
  profilePicture.value = null;
}
});
</script>

<style scoped>
/* Global top app bar height (fallback). Adjust if your app bar is taller) */
:root {
  --topbar-height: 56px;
}
.dashboard-container {
display: flex;
min-height: 100vh;
background-color: #f9fafb;
}

.main-content {
flex: 1;
padding: 20px;
overflow-y: auto;
margin-left: 230px;
transition: margin-left 0.3s ease;
}

.sidebar.collapsed ~ .main-content {
margin-left: 70px;
}

.header {
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 20px;
padding: 10px 0;
border-bottom: 1px solid #e5e7eb;
  position: relative; /* create stacking context */
  z-index: 2000; /* sit above map and content */
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
transition: all 0.3s ease;
}

.search-box:focus-within {
box-shadow: 0 0 0 2px rgba(74, 143, 77, 0.2);
border-color: #4a8f4d;
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

.user-profile {
display: flex;
align-items: center;
gap: 15px;
position: relative;
cursor: pointer;
}

.notification-wrapper {
position: relative;
margin-right: 1rem;
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

.avatar {
width: 40px;
height: 40px;
border-radius: 50%;
overflow: hidden;
background-color: #f3f4f6;
display: flex;
align-items: center;
justify-content: center;
}

.default-avatar {
color: #6b7280;
}

.avatar img {
width: 100%;
height: 100%;
object-fit: cover;
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

.profile-dropdown {
position: absolute;
top: 60px;
right: 0;
width: 280px;
background-color: #fff;
border-radius: 10px;
box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 2100; /* above leaflet popups */
overflow: hidden;
}

.profile-header {
display: flex;
align-items: center;
padding: 15px;
border-bottom: 1px solid #f3f4f6;
position: relative;
}

.profile-avatar {
width: 40px;
height: 40px;
border-radius: 50%;
overflow: hidden;
margin-right: 12px;
background-color: #f3f4f6;
display: flex;
align-items: center;
justify-content: center;
}

.profile-avatar img {
width: 100%;
height: 100%;
object-fit: cover;
}

.profile-header h3 {
font-size: 0.95rem;
font-weight: 600;
margin: 0;
color: #111827;
}

.profile-header p {
font-size: 0.8rem;
color: #6b7280;
margin: 0;
}

.logout-btn {
position: absolute;
right: 15px;
top: 15px;
background: none;
border: none;
color: #ef4444;
cursor: pointer;
padding: 5px;
border-radius: 50%;
}

.logout-btn:hover {
background-color: #fee2e2;
}

.profile-tabs {
display: flex;
border-bottom: 1px solid #f3f4f6;
}

.tab-btn {
flex: 1;
padding: 12px;
background: none;
border: none;
font-size: 0.9rem;
color: #6b7280;
cursor: pointer;
display: flex;
align-items: center;
justify-content: center;
gap: 8px;
position: relative;
}

.tab-btn.active {
color: #2e5c31;
font-weight: 500;
}

.tab-btn.active::after {
content: '';
position: absolute;
bottom: -1px;
left: 0;
width: 100%;
height: 2px;
background-color: #2e5c31;
}

.tab-content {
padding: 10px;
}

.menu-item {
display: flex;
align-items: center;
gap: 10px;
width: 100%;
padding: 10px 15px;
background: none;
border: none;
text-align: left;
font-size: 0.9rem;
color: #4b5563;
border-radius: 6px;
cursor: pointer;
transition: all 0.2s ease;
}

.menu-item:hover {
background-color: #f9fafb;
color: #2e5c31;
}

.dashboard-content {
display: flex;
flex-direction: column;
gap: 20px;
}

.welcome-banner {
display: flex;
justify-content: space-between;
align-items: center;
background-color: #fff;
border-radius: 10px;
padding: 20px;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.welcome-text h2 {
font-size: 1.5rem;
margin: 0 0 5px 0;
color: #111827;
}

.welcome-text p {
margin: 0;
color: #6b7280;
font-size: 0.9rem;
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
transition: all 0.3s ease;
border-left: 4px solid transparent;
}

.metric-card:nth-child(1) {
border-left-color: #4a8f4d;
}

.metric-card:nth-child(2) {
border-left-color: #f59e0b;
}

.metric-card:nth-child(3) {
border-left-color: #3b82f6;
}

.metric-card:nth-child(4) {
border-left-color: #8b5cf6;
}

.metric-card:hover {
transform: translateY(-3px);
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.metric-header {
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 10px;
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
font-size: 2rem;
font-weight: 700;
color: #111827;
margin-bottom: 5px;
}

.metric-change {
font-size: 0.75rem;
display: flex;
align-items: center;
gap: 4px;
}

.metric-change.positive {
color: #10b981;
}

.metric-change.negative {
color: #ef4444;
}

.bottom-section {
display: grid;
grid-template-columns: 1fr 1fr;
gap: 20px;
}

.no-orders {
background-color: #fff;
padding: 30px 20px;
border-radius: 10px;
text-align: center;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.no-orders-icon {
color: #9ca3af;
margin-bottom: 10px;
}

.no-orders p {
color: #6b7280;
margin-bottom: 15px;
}

/* Responsive Styles */
@media (max-width: 1200px) {
.metric-cards {
  grid-template-columns: repeat(2, 1fr);
}

.bottom-section {
  grid-template-columns: 1fr;
}
}

@media (max-width: 992px) {
.main-content {
  margin-left: 70px;
  padding: 15px;
}

.header {
  flex-direction: column;
  align-items: flex-start;
  gap: 15px;
}

.search-container {
  width: 100%;
}

.search-box {
  width: 100%;
}

.user-profile {
  width: 100%;
  justify-content: flex-end;
}
}

@media (max-width: 768px) {
.main-content {
  margin-left: 0;
  padding: 10px;
  /* Push below the fixed green app bar on mobile */
  padding-top: calc(10px + var(--topbar-height, 56px) + env(safe-area-inset-top));
}

.header {
  position: sticky;
  top: calc(var(--topbar-height, 56px) + env(safe-area-inset-top));
  background: #f9fafb;
  z-index: 10;
}

.welcome-banner {
  flex-direction: column;
  align-items: flex-start;
  gap: 15px;
}

.metric-cards {
  grid-template-columns: 1fr;
}

.profile-dropdown {
  width: 250px;
}
}

@media (max-width: 576px) {
.dashboard-content {
  gap: 15px;
}

.welcome-banner {
  padding: 15px;
}

.metric-card {
  padding: 15px;
}

.profile-dropdown {
  width: 100%;
  right: -10px;
}
}

/* Dark mode styles */
:global(.dark) .main-content {
background-color: #111827;
}

:global(.dark) .search-box,
:global(.dark) .metric-card,
:global(.dark) .notification-icon,
:global(.dark) .profile-dropdown,
:global(.dark) .welcome-banner,
:global(.dark) .no-orders {
background-color: #1f2937;
border-color: #374151;
}

:global(.dark) .metric-header h3,
:global(.dark) .welcome-text p,
:global(.dark) .no-orders p {
color: #9ca3af;
}

:global(.dark) .metric-value,
:global(.dark) .user-info h3,
:global(.dark) .welcome-text h2 {
color: #f9fafb;
}

:global(.dark) .user-info p {
color: #9ca3af;
}

:global(.dark) .profile-header,
:global(.dark) .profile-tabs {
border-color: #374151;
}

:global(.dark) .tab-btn.active {
color: #4a8f4d;
}

:global(.dark) .tab-btn.active::after {
background-color: #4a8f4d;
}

:global(.dark) .menu-item:hover {
background-color: #374151;
color: #4a8f4d;
}

:global(.dark) .default-avatar {
color: #9ca3af;
}

:global(.dark) .avatar,
:global(.dark) .profile-avatar {
background-color: #374151;
}

/* Add after .metric-cards styles or near other layout styles */
.dashboard-row {
display: flex;
gap: 20px;
margin-bottom: 20px;
}
.dashboard-col {
display: flex;
flex-direction: column;
}
.dashboard-col--main {
flex: 2 1 0%;
}
.dashboard-col--side {
flex: 1 1 0%;
min-width: 320px;
max-width: 400px;
}
@media (max-width: 992px) {
.dashboard-row {
  flex-direction: column;
  gap: 15px;
}
.dashboard-col--side {
  min-width: 0;
  max-width: 100%;
}
}
</style>