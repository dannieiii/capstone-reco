<template>
    <div class="notification-container">
      <div 
        v-for="notification in notifications" 
        :key="notification.id"
        :class="['notification', notification.type]"
        @click="removeNotification(notification.id)"
      >
        <div class="notification-content">
          <span class="notification-icon">
            <span v-if="notification.type === 'success'">✓</span>
            <span v-else-if="notification.type === 'error'">✕</span>
            <span v-else>!</span>
          </span>
          <span class="notification-message">{{ notification.message }}</span>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  
  const notifications = ref([]);
  
  const showNotification = (message, type = 'success') => {
    const notification = {
      message,
      type,
      id: Date.now() + Math.random().toString(36).substr(2, 9)
    };
    
    notifications.value.unshift(notification);
    
    setTimeout(() => {
      removeNotification(notification.id);
    }, 5000);
  };
  
  const removeNotification = (id) => {
    notifications.value = notifications.value.filter(n => n.id !== id);
  };
  
  // Make the function available to parent components
  defineExpose({
    showNotification
  });
  </script>
  
  <style scoped>
  .notification-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 350px;
  }
  
  .notification {
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
    animation: slideIn 0.3s ease forwards;
    display: flex;
    align-items: center;
    opacity: 0.95;
  }
  
  .notification:hover {
    opacity: 1;
    transform: translateX(-5px);
  }
  
  .notification.success {
    background-color: #38a169;
    border-left: 5px solid #2f855a;
  }
  
  .notification.error {
    background-color: #e53e3e;
    border-left: 5px solid #c53030;
  }
  
  .notification.warning {
    background-color: #dd6b20;
    border-left: 5px solid #c05621;
  }
  
  .notification-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .notification-icon {
    font-weight: bold;
    font-size: 1.3em;
  }
  
  .notification-message {
    font-size: 0.9rem;
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 0.95;
    }
  }
  
  @media (max-width: 768px) {
    .notification-container {
      top: 10px;
      right: 10px;
      max-width: 90%;
    }
    
    .notification {
      padding: 12px 16px;
    }
  }
  </style>