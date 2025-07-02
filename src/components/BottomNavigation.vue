<template>
  <div class="bottom-navigation">
    <button 
      class="nav-item" 
      :class="{ active: isActive('/') }"
      @click="navigate('/')"
    >
      <Home :size="iconSize" :fill="isActive('/') ? '#2e5c31' : 'none'" :stroke="isActive('/') ? '#2e5c31' : '#2e5c31'" stroke-width="2" />
      <span>Home</span>
    </button>
    <button 
      class="nav-item" 
      :class="{ active: isActive('/community') }"
      @click="navigate('/community')"
    >
      <MessagesSquare :size="iconSize" :fill="isActive('/community') ? '#2e5c31' : 'none'" :stroke="isActive('/community') ? '#2e5c31' : '#2e5c31'" stroke-width="2" />
      <span>Community</span>
    </button>
    <button 
      class="nav-item" 
      :class="{ active: isActive('/messages') }"
      @click="navigate('/messages')"
    >
      <MessageCircle :size="iconSize" :fill="isActive('/messages') ? '#2e5c31' : 'none'" :stroke="isActive('/messages') ? '#2e5c31' : '#2e5c31'" stroke-width="2" />
      <span>Messages</span>
    </button>
    <button 
      class="nav-item" 
      :class="{ active: isActive('/customer/orders') || isActive('/orders') }"
      @click="navigate('/customer/orders')"
    >
      <Package :size="iconSize" :fill="(isActive('/customer/orders') || isActive('/orders')) ? '#2e5c31' : 'none'" :stroke="(isActive('/customer/orders') || isActive('/orders')) ? '#2e5c31' : '#2e5c31'" stroke-width="2" />
      <span>Orders</span>
    </button>
    <button 
      class="nav-item" 
      :class="{ active: isActive('/customer/notifications') }"
      @click="navigate('/customer/notifications')"
    >
      <Bell :size="iconSize" :fill="isActive('/customer/notifications') ? '#2e5c31' : 'none'" :stroke="isActive('/customer/notifications') ? '#2e5c31' : '#2e5c31'" stroke-width="2" />
      <span>Notifications</span>
    </button>
  </div>
</template>

<script>
import { Home, MessagesSquare, MessageCircle, Package, Bell } from 'lucide-vue-next';

export default {
  components: {
    Home,
    MessagesSquare,
    MessageCircle,
    Package,
    Bell
  },
  data() {
    return {
      iconSize: 24
    };
  },
  methods: {
    navigate(path) {
      if (this.$route.path !== path) {
        this.$router.push(path);
      }
    },
    isActive(path) {
      if (path === '/') {
        return this.$route.path === '/';
      }
      return this.$route.path.startsWith(path);
    }
  }
}
</script>

<style scoped>
.bottom-navigation {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 70px;
  background-color: white;
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 50;
  border-top: 1px solid #f0f0f0;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #888;
  background: none;
  border: none;
  padding: 8px;
  transition: all 0.2s ease;
  width: 20%;
  cursor: pointer;
  position: relative;
}

.nav-item span {
  font-size: 12px;
  font-weight: 500;
  transition: color 0.2s ease;
}

.nav-item.active {
  color: #2e5c31;
}

.nav-item.active span {
  color: #2e5c31;
  font-weight: 600;
}

/* Optional: Add a small indicator above active icon */
.nav-item.active::before {
  content: '';
  position: absolute;
  top: 6px;
  width: 6px;
  height: 6px;
  background-color: #2e5c31;
  border-radius: 50%;
}
</style>