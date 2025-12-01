<template>
  <!-- Mobile Header -->
  <div class="mobile-header" v-if="isMobile">
    <button class="mobile-hamburger" @click="toggleMobileSidebar">
      <svg viewBox="0 0 24 24" width="24" height="24">
        <path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
      </svg>
    </button>
    <h1 class="mobile-logo-text">FarmXpress</h1>
  </div>

  <!-- Sidebar -->
  <div class="sidebar-overlay" 
       @click="toggleMobileSidebar" 
       v-if="isMobile && isMobileSidebarOpen"></div>
  
  <div class="sidebar" :class="{ 
    'collapsed': isCollapsed,
    'mobile-sidebar': isMobile,
    'mobile-open': isMobileSidebarOpen
  }">
    <div class="logo-container">
    <div class="logo-content">
  <img src="@/assets/farmxpress-iconwhite.png" alt="Logo" class="sidebar-logo" v-if="!isMobile" />
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
              @click="handleItemClick(item)">
          <router-link v-if="item.action !== 'logout'" :to="item.path" class="nav-link">
            <component :is="item.icon" class="nav-icon" />
            <span class="nav-text">{{ item.name }}</span>
            <span v-if="item.badge && (!isCollapsed || isMobile)" class="badge" :class="item.badgeClass">
              {{ item.badge }}
            </span>
          </router-link>
          <div v-else class="nav-link logout-link">
            <component :is="item.icon" class="nav-icon" />
            <span class="nav-text">{{ item.name }}</span>
          </div>
        </li>
      </ul>
    </nav>
    
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
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { 
  LayoutDashboard, 
  Sprout, 
  Users, 
  BarChart, 
  Receipt, 
  MessageSquare, 
  ThumbsUp, 
  HelpCircle, 
  LogOut,
  TrendingUp,
  Calendar,
  FileText,
  Bell
} from 'lucide-vue-next';
// Add ShoppingBag icon for marketplace shortcut
import { ShoppingBag } from 'lucide-vue-next';
import { db } from '@/firebase/firebaseConfig';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter, useRoute } from 'vue-router';

const props = defineProps({
  initialActiveItem: {
    type: String,
    default: 'Dashboard'
  }
});

const router = useRouter();
const route = useRoute();

const activeItem = ref(props.initialActiveItem);
const isCollapsed = ref(false);
const isMobile = ref(false);
const isMobileSidebarOpen = ref(false);
const mobileBreakpoint = 768;
const unreadNotifications = ref(0);
const chatMessages = ref(); // Keep existing chat badge
const showLogoutModal = ref(false);

const getActiveItemFromRoute = (currentRoute) => {
  const path = currentRoute.path;
  
  // Map routes to menu item names
  const routeMap = {
    '/seller-dashboard': 'Dashboard',
    '/products': 'Farm Products',
    '/seller/forecasting': 'Forecasting',
    '/harvest-calendar': 'Harvest Calendar',
    '/seller/customer': 'Customers',
    '/seller/analytics': 'Analytics',
    '/orders': 'Orders',
    '/notifications': 'Notifications',
    '/seller/chat': 'Chat',
    '/seller/feedbacks': 'Feedback',
    '/seller/reports': 'Reports',
    '/sellerhelp': 'Help'
  };
  
  return routeMap[path] || 'Dashboard';
};

watch(() => route.path, (newPath) => {
  const newActiveItem = getActiveItemFromRoute(route);
  activeItem.value = newActiveItem;
}, { immediate: true });

// Real-time notification listener
const setupNotificationListener = () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  if (!currentUser) return;

  // Listen for new orders
  const ordersQuery = query(
    collection(db, 'orders'),
    where('sellerId', '==', currentUser.uid),
    where('status', '==', 'Pending'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  onSnapshot(ordersQuery, (snapshot) => {
    let newOrdersCount = 0;
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));

    snapshot.forEach((doc) => {
      const data = doc.data();
      let createdAt = data.createdAt;
      
      if (createdAt && typeof createdAt.toDate === 'function') {
        createdAt = createdAt.toDate();
      } else if (typeof createdAt === 'string') {
        createdAt = new Date(createdAt);
      }
      
      // Count orders from the last hour as "new"
      if (createdAt && createdAt > oneHourAgo) {
        newOrdersCount++;
      }
    });

    unreadNotifications.value = newOrdersCount;
  });
};

const checkScreenSize = () => {
  isMobile.value = window.innerWidth < mobileBreakpoint;
  if (!isMobile.value) {
    isMobileSidebarOpen.value = false;
  }
};

const menuItems = computed(() => [
  
  { name: 'Dashboard', path: '/seller-dashboard', icon: LayoutDashboard },
  { name: 'Farm Products', path: '/products', icon: Sprout },
  { name: 'Forecasting', path: '/seller/forecasting', icon: TrendingUp },
  { name: 'Harvest Calendar', path: '/harvest-calendar', icon: Calendar },
  { name: 'Customers', path: '/seller/customer', icon: Users },
  { name: 'Analytics', path: '/seller/analytics', icon: BarChart },
  { name: 'Orders', path: '/orders', icon: Receipt },
  { 
    name: 'Notifications', 
    path: '/notifications', 
    icon: Bell, 
    badge: unreadNotifications.value > 0 ? unreadNotifications.value : null,
    badgeClass: 'notification-badge'
  },
  { name: 'Marketplace', path: '/', icon: ShoppingBag },
  { 
    name: 'Chat', 
    path: '/seller/chat', 
    icon: MessageSquare, 
    badge: chatMessages.value,
    badgeClass: 'chat-badge'
  },
  { name: 'Feedback', path: '/seller/feedbacks', icon: ThumbsUp },
  // { name: 'Reports', path: '/seller/reports', icon: FileText },
  // { name: 'Help', path: '/sellerhelp', icon: HelpCircle },
  { name: 'Logout', path: '#', icon: LogOut, action: 'logout' }
]);

const setActiveItem = (itemName) => {
  activeItem.value = itemName;
};

const handleItemClick = (item) => {
  if (item.action === 'logout') {
    showLogoutModal.value = true;
  } else {
    setActiveItem(item.name);
    if (isMobile.value) {
      toggleMobileSidebar();
    }
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

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
  localStorage.setItem('sidebarCollapsed', isCollapsed.value);
  // Broadcast sidebar state so pages can adjust their layout
  try {
    window.dispatchEvent(new CustomEvent('sidebar:toggled', { detail: { collapsed: isCollapsed.value } }));
  } catch {}
};

const toggleMobileSidebar = () => {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value;
};

onMounted(() => {
  const savedCollapseState = localStorage.getItem('sidebarCollapsed');
  if (savedCollapseState === 'true') {
    isCollapsed.value = true;
  }
  
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
  
  // Setup notification listener
  setupNotificationListener();

  activeItem.value = getActiveItemFromRoute(route);

  // Emit initial state for consumers
  try {
    window.dispatchEvent(new CustomEvent('sidebar:state', { detail: { collapsed: isCollapsed.value } }));
  } catch {}
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
  /* Hide scrollbar */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer 10+ */
}

.sidebar::-webkit-scrollbar {
  display: none; /* WebKit browsers (Chrome, Safari, etc.) */
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
  /* Hide scrollbar */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer 10+ */
}

.nav-menu::-webkit-scrollbar {
  display: none; /* WebKit browsers (Chrome, Safari, etc.) */
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

.logout-link {
  cursor: pointer;
}

.logout-link:hover {
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

.chat-badge {
  background-color: #ffffff;
  color: #2e5c31;
}

.notification-badge {
  background-color: #ef4444;
  color: #ffffff;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.sidebar.collapsed .badge {
  display: none;
}

.sidebar:not(.collapsed) .badge,
.sidebar.mobile-sidebar .badge {
  display: flex;
}


/* Collapsed state styles */
.sidebar.collapsed .nav-text {
  display: none;
}

.sidebar.collapsed .nav-icon {
  margin-right: 0;
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
