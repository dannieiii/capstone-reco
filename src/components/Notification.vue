<template>
    <transition name="slide-fade">
      <div v-if="visible" class="notification" :class="type">
        {{ message }}
      </div>
    </transition>
  </template>
  
  <script>
  export default {
    props: {
      message: String,
      type: {
        type: String,
        default: 'success'
      },
      visible: Boolean
    }
  }
  </script>
  
  <style scoped>
  .notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 24px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 9999;
  }
  
  .notification.success {
    background-color: #2e5c31;
  }
  
  .notification.info {
    background-color: #3498db;
  }
  
  .slide-fade-enter-active {
    transition: all 0.3s ease-out;
  }
  
  .slide-fade-leave-active {
    transition: all 0.5s ease-in;
  }
  
  .slide-fade-enter-from,
  .slide-fade-leave-to {
    transform: translateX(20px);
    opacity: 0;
  }
  </style>