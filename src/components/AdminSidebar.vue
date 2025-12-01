<template>
  <div class="sidebar" :class="{ 'dark-mode': isDarkMode }">
    <div class="logo-container">
  <img src="@/assets/farmxpress-iconwhite.png" alt="FarmXpress Logo" class="logo-image">
      <div class="logo-text-container">
        <h1 class="logo-text">FarmXpress</h1>
        <span class="admin-badge">ADMIN</span>
      </div>
    </div>
    
    <nav class="nav-menu">
      <div class="menu-section">
        <span class="section-title">MAIN</span>
        <ul>
          <li v-for="(item, index) in mainMenuItems" :key="index" 
              :class="{ active: activeItem === item.name }"
              @click="setActiveItem(item.name)">
            <router-link :to="item.path" class="nav-link">
              <component :is="item.icon" class="nav-icon" />
              <span class="nav-text">{{ item.name }}</span>
              <span v-if="item.badge" class="badge">{{ item.badge }}</span>
            </router-link>
          </li>
        </ul>
      </div>
      
      <div class="menu-section">
        <span class="section-title">MANAGEMENT & ANALYTICS</span>
        <ul>
          <li v-for="(item, index) in otherMenuItems" :key="index" 
              :class="{ active: activeItem === item.name }"
              @click="handleItemClick(item)">
            <router-link v-if="item.action !== 'logout'" :to="item.path" class="nav-link">
              <component :is="item.icon" class="nav-icon" />
              <span class="nav-text">{{ item.name }}</span>
              <span v-if="item.badge" class="badge">{{ item.badge }}</span>
            </router-link>
            <div v-else class="nav-link logout-link">
              <component :is="item.icon" class="nav-icon" />
              <span class="nav-text">{{ item.name }}</span>
            </div>
          </li>
        </ul>
      </div>
      
      <div class="menu-section">
        <span class="section-title">ADMINISTRATION</span>
        <ul>
          <li v-for="(item, index) in adminMenuItems" :key="index" 
              :class="{ active: activeItem === item.name }"
              @click="setActiveItem(item.name)">
            <router-link :to="item.path" class="nav-link">
              <component :is="item.icon" class="nav-icon" />
              <span class="nav-text">{{ item.name }}</span>
              <span v-if="item.badge" class="badge">{{ item.badge }}</span>
            </router-link>
          </li>
        </ul>
      </div>
    </nav>
    
    <div class="theme-toggle">
      <button class="theme-btn" :class="{ active: !isDarkMode }" @click="setLightMode">
        <Sun size="18" />
        <span>Light</span>
      </button>
      <button class="theme-btn" :class="{ active: isDarkMode }" @click="setDarkMode">
        <Moon size="18" />
        <span>Dark</span>
      </button>
    </div>
  </div>

  <!-- Logout Confirmation Modal -->
  <div v-if="showLogoutModal" class="modal-overlay">
    <div class="modal-content">
      <h3>Confirm Logout</h3>
      <p>Do you really want to logout?</p>
      <div class="modal-actions">
        <button class="btn-cancel" @click="cancelLogout">No</button>
        <button class="btn-confirm" @click="confirmLogout">Yes</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getAuth, signOut } from 'firebase/auth';
import { 
  LayoutDashboard, 
  Users, 
  Store,
  ShoppingBag,
  Layers,
  TrendingUp,
  MessageSquare, 
  Bell,
  LogOut,
  HelpCircle,
  FileText,
  Sun,
  Moon,
  UserPlus,
  Shield,
  Tag,
  MessageCircle,
  LineChart
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const activeItem = ref('');
const isDarkMode = ref(false);
const showLogoutModal = ref(false);

const mainMenuItems = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Notifications', path: '/admin/notifications', icon: Bell},
];

const otherMenuItems = [
  
  { name: 'Sellers', path: '/admin/sellers', icon: Store },
  { name: 'Customers', path: '/admin/customers', icon: Users },
  { name: 'Product Categories', path: '/admin/categories', icon: Layers },
  { name: 'Product Prices', path: '/admin/product-prices', icon: Tag },
 // { name: 'Forecasting', path: '/admin-forecasting', icon: TrendingUp },
  { name: 'Price Monitoring', path: '/admin/price-monitoring', icon: LineChart },
  { name: 'Marketplace', path: '/', icon: ShoppingBag },
  { name: 'Help', path: '/admin/help', icon: HelpCircle },
  { name: 'Logout', path: '#', icon: LogOut, action: 'logout' }
];

const adminMenuItems = [
  { name: 'Add Admin', path: '/admin/add-admin', icon: UserPlus }
];

const setActiveItemFromRoute = () => {
  const currentPath = route.path;
  const allMenuItems = [...mainMenuItems, ...otherMenuItems, ...adminMenuItems];
  const activeMenuItem = allMenuItems.find(item => item.path === currentPath);
  if (activeMenuItem) {
    activeItem.value = activeMenuItem.name;
  }
};

const setActiveItem = (itemName) => {
  activeItem.value = itemName;
};

const handleItemClick = (item) => {
  if (item.action === 'logout') {
    showLogoutModal.value = true;
  } else {
    setActiveItem(item.name);
  }
};

const confirmLogout = async () => {
  try {
    const auth = getAuth();
    await signOut(auth);
    showLogoutModal.value = false;
    router.push('/login');
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

const cancelLogout = () => {
  showLogoutModal.value = false;
};

watch(() => route.path, setActiveItemFromRoute);

onMounted(() => {
  setActiveItemFromRoute();
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    setDarkMode();
  } else {
    setLightMode();
  }
});

const setLightMode = () => {
  isDarkMode.value = false;
  document.body.classList.remove('dark');
  localStorage.setItem('theme', 'light');
};

const setDarkMode = () => {
  isDarkMode.value = true;
  document.body.classList.add('dark');
  localStorage.setItem('theme', 'dark');
};
</script>

<style scoped>
.sidebar {
  width: 260px;
  height: 100vh;
  background: #2e5c31;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  color: white;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  /* Hide scrollbar */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer 10+ */
}

.sidebar::-webkit-scrollbar {
  display: none; /* WebKit browsers (Chrome, Safari, etc.) */
}

.logo-container {
  display: flex;
  align-items: center;
  padding: 20px;
  gap: 8px;
  position: relative;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-image {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.logo-text-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}

.admin-badge {
  background-color: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 12px;
  letter-spacing: 0.5px;
  margin-top: 4px;
}

.nav-menu {
  flex: 1;
  padding: 10px 0;
}

.menu-section {
  margin-bottom: 20px;
}

.section-title {
  display: block;
  padding: 10px 20px;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 1px;
}

.nav-menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-menu li {
  position: relative;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.nav-link:hover, .active .nav-link {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.logout-link {
  cursor: pointer;
}

.logout-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.active .nav-link {
  background-color: rgba(255, 255, 255, 0.15);
  border-left: 3px solid #ffffff;
}

.nav-icon {
  margin-right: 12px;
  width: 18px;
  height: 18px;
}

.badge {
  background-color: #ffffff;
  color: #2e5c31;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  margin-left: auto;
  font-weight: bold;
}

.theme-toggle {
  display: flex;
  margin: 20px;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 4px;
}

.theme-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
}

.theme-btn.active {
  background-color: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

/* Dark mode styles */
.dark-mode {
  background: #1a3a1c;
}

.dark-mode .theme-toggle {
  background-color: rgba(0, 0, 0, 0.2);
}

.dark-mode .theme-btn.active {
  background-color: rgba(0, 0, 0, 0.3);
  color: #ffffff;
}

/* Logout Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-content h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 1.2rem;
  font-weight: 600;
}

.modal-content p {
  margin: 0 0 24px 0;
  color: #666;
  font-size: 1rem;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.btn-cancel,
.btn-confirm {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
  flex: 1;
  max-width: 120px;
}

.btn-cancel {
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #e0e0e0;
}

.btn-cancel:hover {
  background-color: #e0e0e0;
  border-color: #ccc;
}

.btn-confirm {
  background-color: #ef4444;
  color: white;
}

.btn-confirm:hover {
  background-color: #dc2626;
}
</style>