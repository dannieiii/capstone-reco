<template>
  <!-- Mobile Header -->
  <div class="mobile-header" :class="{ 'dark-mode': isDarkMode }" v-if="isMobile">
    <button class="mobile-hamburger" @click="toggleMobileSidebar">
      <svg viewBox="0 0 24 24" width="24" height="24">
        <path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
      </svg>
    </button>
    <h1 class="mobile-logo-text">FarmXpress</h1>
  </div>

  <!-- Sidebar -->
  <div class="sidebar-overlay" 
       v-if="isMobile && isMobileSidebarOpen" 
       @click="toggleMobileSidebar"></div>
  
  <div class="sidebar" :class="{ 
    'dark-mode': isDarkMode, 
    'collapsed': isCollapsed,
    'mobile-sidebar': isMobile,
    'mobile-open': isMobileSidebarOpen
  }">
    <div class="logo-container">
      <div class="logo-content">
        <img src="@/assets/logowhite.png" alt="Logo" class="sidebar-logo" v-if="!isMobile" />
        <h1 class="logo-text">FarmXpress</h1>
      </div>
      <button class="desktop-hamburger" @click="toggleSidebar" v-if="!isMobile">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
      </button>
    </div>
    
    <nav class="nav-menu">
      <ul>
        <li v-for="(item, index) in menuItems" :key="index" 
            :class="{ active: activeItem === item.name }"
            @click="setActiveItem(item.name); isMobile && toggleMobileSidebar()">
          <router-link :to="item.path" class="nav-link">
            <component :is="item.icon" class="nav-icon" />
            <span class="nav-text">{{ item.name }}</span>
            <span v-if="item.badge && (!isCollapsed || isMobile)" class="badge">{{ item.badge }}</span>
          </router-link>
        </li>
      </ul>
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
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { 
  LayoutDashboard, 
  Sprout, 
  Users, 
  BarChart, 
  Receipt, 
  MessageSquare, 
  ThumbsUp, 
  HelpCircle, 
  Settings,
  Sun,
  Moon,
  TrendingUp,
  Calendar,
  FileText
} from 'lucide-vue-next';

const props = defineProps({
  initialActiveItem: {
    type: String,
    default: 'Dashboard'
  }
});

const activeItem = ref(props.initialActiveItem);
const isDarkMode = ref(false);
const isCollapsed = ref(false);
const isMobile = ref(false);
const isMobileSidebarOpen = ref(false);
const mobileBreakpoint = 768;

const checkScreenSize = () => {
  isMobile.value = window.innerWidth < mobileBreakpoint;
  if (!isMobile.value) {
    isMobileSidebarOpen.value = false;
  }
};

const menuItems = [
  { name: 'Dashboard', path: '/seller-dashboard', icon: LayoutDashboard },
  { name: 'Farm Products', path: '/products', icon: Sprout },
  { name: 'Forecasting', path: '/seller/forecasting', icon: TrendingUp },
  { name: 'Harvest Calendar', path: '/harvest-calendar', icon: Calendar },
  { name: 'Customers', path: '/seller/customer', icon: Users },
  { name: 'Analytics', path: '/seller/analytics', icon: BarChart },
  { name: 'Orders', path: '/orders', icon: Receipt },
  { name: 'Chat', path: '/seller/chat', icon: MessageSquare, badge: 8 },
  { name: 'Feedback', path: '/feedback', icon: ThumbsUp },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'Help', path: '/sellerhelp', icon: HelpCircle },
  { name: 'Settings', path: '/settings', icon: Settings }
];

const setActiveItem = (itemName) => {
  activeItem.value = itemName;
};

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

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
  localStorage.setItem('sidebarCollapsed', isCollapsed.value);
};

const toggleMobileSidebar = () => {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value;
};

onMounted(() => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    setDarkMode();
  }
  
  const savedCollapseState = localStorage.getItem('sidebarCollapsed');
  if (savedCollapseState === 'true') {
    isCollapsed.value = true;
  }
  
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkScreenSize);
});
</script>

<style scoped>
.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: linear-gradient(135deg, #2e5c31, #4a8f4d);
  display: flex;
  align-items: center;
  padding: 0 16px;
  z-index: 1000;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.mobile-header.dark-mode {
  background: linear-gradient(135deg, #1a3a1c, #2e5c31);
}

.mobile-hamburger {
  background: none;
  border: none;
  color: white;
  padding: 8px;
  margin-right: 16px;
}

.mobile-logo-text {
  font-size: 1.2rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  flex-grow: 1;
  text-align: center;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 998;
}

.sidebar {
  width: 250px;
  height: 100vh;
  background: linear-gradient(135deg, #2e5c31, #4a8f4d);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
  overflow-y: auto;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 999;
  padding: 0;
}

.sidebar.mobile-sidebar {
  transform: translateX(-100%);
}

.sidebar.mobile-sidebar.mobile-open {
  transform: translateX(0);
}

.sidebar.collapsed {
  width: 70px;
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 12px;
  position: relative;
}

.logo-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sidebar-logo {
  height: 28px;
  width: auto;
  object-fit: contain;
}

.logo-text {
  font-size: 1.3rem;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
  margin: 0;
}

.sidebar.collapsed .logo-text,
.sidebar.collapsed .sidebar-logo {
  display: none;
}

.desktop-hamburger {
  background: none;
  border: none;
  color: white;
  padding: 8px;
}

.nav-menu {
  flex: 1;
  margin-top: 8px;
  padding: 0 8px;
  overflow-y: auto;
}

.nav-menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-menu li {
  margin: 6px 0;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  border-radius: 6px;
  position: relative;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.active .nav-link {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.15);
  border-left: 3px solid #ffffff;
  font-weight: 600;
}

.nav-icon {
  margin-right: 12px;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-text {
  font-size: 0.95rem;
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

.sidebar.collapsed .badge {
  display: none;
}

.sidebar:not(.collapsed) .badge,
.sidebar.mobile-sidebar .badge {
  display: flex;
}

.theme-toggle {
  display: flex;
  margin: 12px 8px;
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
  font-size: 0.85rem;
}

.theme-btn.active {
  background-color: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

/* Dark mode styles */
.dark-mode {
  background: linear-gradient(135deg, #1a3a1c, #2e5c31);
}

/* Collapsed state styles */
.sidebar.collapsed .nav-text,
.sidebar.collapsed .theme-toggle span {
  display: none;
}

.sidebar.collapsed .nav-icon {
  margin-right: 0;
}

.sidebar.collapsed .theme-toggle {
  flex-direction: column;
  align-items: center;
  padding: 4px;
  gap: 4px;
}

/* Responsive styles */
@media (max-width: 767px) {
  .sidebar {
    width: 280px;
    max-width: 80%;
  }
  
  .sidebar:not(.mobile-open) {
    display: none;
  }
  
  .mobile-header {
    display: flex;
  }
}

@media (min-width: 768px) {
  .mobile-header {
    display: none;
  }
  
  .sidebar {
    transform: none !important;
    display: flex !important;
  }
}
</style>