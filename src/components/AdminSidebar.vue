<template>
  <div class="sidebar" :class="{ 'dark-mode': isDarkMode }">
    <div class="logo-container">
      <img src="@/assets/logowhite.png" alt="FarmXpress Logo" class="logo-image">
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
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { 
  LayoutDashboard, 
  Users, 
  Store,
  ShoppingBag,
  Layers,
  TrendingUp,
  DollarSign,
  MessageSquare, 
  Bell,
  Settings,
  HelpCircle,
  FileText,
  Sun,
  Moon,
  UserPlus,
  Shield
} from 'lucide-vue-next';

const route = useRoute();
const activeItem = ref('');
const isDarkMode = ref(false);

const mainMenuItems = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Notifications', path: '/admin/notifications', icon: Bell, badge: 12 },
  { name: 'Messages', path: '/admin/messages', icon: MessageSquare, badge: 5 }
];

const otherMenuItems = [
  { name: 'Sellers', path: '/admin/sellers', icon: Store },
  { name: 'Customers', path: '/admin/customers', icon: Users },
  { name: 'Product Categories', path: '/admin/categories', icon: Layers },
  { name: 'Products', path: '/admin/products', icon: ShoppingBag },
  { name: 'Forecasting', path: '/admin/forecasting', icon: TrendingUp },
  { name: 'Price Monitoring', path: '/admin/price-monitoring', icon: DollarSign },
  { name: 'Reports', path: '/admin/reports', icon: FileText },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
  { name: 'Help', path: '/admin/help', icon: HelpCircle }
];

const adminMenuItems = [
  { name: 'Admin Management', path: '/admin/admin-management', icon: Shield },
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

watch(() => route.path, () => {
  setActiveItemFromRoute();
});

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
</style>