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
        
        <div class="user-profile" @click="toggleProfileMenu" ref="profileRef">
          <div class="notification-icon">
            <Bell size="20" />
            <span class="notification-badge">5</span>
          </div>
          <div class="avatar">
            <User size="24" class="profile-icon" />
          </div>
          <div class="user-info">
            <h3>{{ adminData ? `${adminData.firstName} ${adminData.lastName}` : 'Loading...' }}</h3>
            <p>{{ adminData ? adminData.email : 'Loading...' }}</p>
          </div>
          
          <!-- Profile Dropdown Menu -->
          <div class="profile-dropdown" v-if="showProfileMenu">
            <div class="profile-header">
              <div class="profile-avatar">
                <User size="24" class="profile-icon" />
              </div>
              <div>
                <h3>{{ adminData ? `${adminData.firstName} ${adminData.lastName}` : 'Loading...' }}</h3>
                <p>{{ adminData ? adminData.email : 'Loading...' }}</p>
              </div>
              <button class="logout-btn">
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
              <button class="menu-item">
                <UserCheck size="18" />
                View Profile
              </button>
              <button class="menu-item">
                <Shield size="18" />
                Security
              </button>
              <button class="menu-item">
                <LogOut size="18" />
                Logout
              </button>
            </div>
            
            <div class="tab-content" v-if="activeTab === 'setting'">
              <button class="menu-item">
                <HelpCircle size="18" />
                Support
              </button>
              <button class="menu-item">
                <UserCog size="18" />
                Account Settings
              </button>
              <button class="menu-item">
                <Bell size="18" />
                Notifications
              </button>
              <button class="menu-item">
                <Eye size="18" />
                Appearance
              </button>
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
          <!-- Seller Overview -->
          <SellerOverview />
          
          <!-- Product Categories -->
          <ProductCategories />
          
          <!-- Price Monitoring -->
          <PriceMonitoring />
          
          <!-- Forecasting -->
          <HarvestForecasting />
        </div>
        
        <!-- Recent Activity -->
        <RecentActivity />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  Search, 
  Bell, 
  Info, 
  Calendar,
  ChevronDown,
  User,
  UserCheck,
  UserCog,
  UserPlus,
  Settings,
  Edit,
  Eye,
  Shield,
  LogOut,
  HelpCircle,
  TrendingUp,
  Store,
  Users,
  ShoppingBag
} from 'lucide-vue-next';
import AdminSidebar from '@/components/AdminSidebar.vue';
import SellerOverview from '@/components/admindashboard/SellerOverview.vue';
import ProductCategories from '@/components/admindashboard/ProductCategories.vue';
import PriceMonitoring from '@/components/admindashboard/PriceMonitoring.vue';
import HarvestForecasting from '@/components/admindashboard/HarvestForecasting.vue';
import RecentActivity from '@/components/admindashboard/RecentActivity.vue';
import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs, query, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const auth = getAuth();
const router = useRouter();
const adminData = ref(null);

const fetchAdminData = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      const userId = user.uid;
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

const showProfileMenu = ref(false);
const activeTab = ref('profile');
const profileRef = ref(null);

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

const toggleProfileMenu = () => {
  showProfileMenu.value = !showProfileMenu.value;
};

const setActiveTab = (tab) => {
  activeTab.value = tab;
};

const navigateToEditProfile = () => {
  router.push('/admin/edit-profile');
};

const handleClickOutside = (event) => {
  if (profileRef.value && !profileRef.value.contains(event.target)) {
    showProfileMenu.value = false;
  }
};

onMounted(async () => {
  if (profileRef.value) {
    document.addEventListener('click', handleClickOutside);
  }
  await fetchAdminData();
  await fetchData();
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

.user-profile {
  display: flex;
  align-items: center;
  gap: 15px;
  position: relative;
  cursor: pointer;
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
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #ef4444;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
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

.profile-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  margin-right: 12px;
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

.profile-dropdown {
  position: absolute;
  top: 60px;
  right: 0;
  width: 280px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 100;
  overflow: hidden;
}

.profile-header {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #f3f4f6;
  position: relative;
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
  color: #3498db;
  font-weight: 500;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #3498db;
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
  color: #3498db;
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
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

@media (max-width: 1200px) {
  .metric-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .metric-cards {
    grid-template-columns: 1fr;
  }
}
</style>