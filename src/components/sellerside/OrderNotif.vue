<template>
  <Teleport to="body" v-if="isClient">
    <Transition name="slide-in">
      <div class="notification-container" v-show="visible">
        <div :class="['notification', `notification-${type}`]">
          <div class="notification-icon">
            <i v-if="type === 'success'" class="i-lucide-check-circle"></i>
            <i v-else-if="type === 'error'" class="i-lucide-x-circle"></i>
            <i v-else-if="type === 'warning'" class="i-lucide-alert-triangle"></i>
            <i v-else class="i-lucide-info"></i>
          </div>

          <div class="notification-content">
            <h4 class="notification-title">{{ title }}</h4>
            <p class="notification-message">{{ message }}</p>
          </div>

          <button @click="close" class="notification-close">
            <i class="i-lucide-x"></i>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: 'Notification'
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'info', // success, error, warning, info
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  duration: {
    type: Number,
    default: 5000 // 5 seconds
  },
  autoClose: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['close'])

const visible = ref(false)
let timeoutId = null
const isClient = ref(false)

const show = () => {
  visible.value = true
  
  if (props.autoClose && props.duration > 0) {
    timeoutId = setTimeout(() => {
      close()
    }, props.duration)
  }
}

const close = () => {
  visible.value = false
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
  emit('close')
}

onMounted(() => {
  isClient.value = true
  show()
})

onUnmounted(() => {
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
})

// Expose methods for parent components
defineExpose({
  show,
  close
})
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  pointer-events: none;
}

.notification {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 320px;
  max-width: 480px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(0, 0, 0, 0.08);
  border-left: 4px solid;
  pointer-events: auto;
  backdrop-filter: blur(8px);
}

.notification-success {
  border-left-color: #10b981;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(255, 255, 255, 0.95) 100%);
}

.notification-error {
  border-left-color: #ef4444;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(255, 255, 255, 0.95) 100%);
}

.notification-warning {
  border-left-color: #f59e0b;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(255, 255, 255, 0.95) 100%);
}

.notification-info {
  border-left-color: #3b82f6;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(255, 255, 255, 0.95) 100%);
}

.notification-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-top: 2px;
}

.notification-success .notification-icon {
  color: #10b981;
}

.notification-error .notification-icon {
  color: #ef4444;
}

.notification-warning .notification-icon {
  color: #f59e0b;
}

.notification-info .notification-icon {
  color: #3b82f6;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
  line-height: 1.2;
}

.notification-message {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
  word-wrap: break-word;
}

.notification-close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-size: 16px;
}

.notification-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #6b7280;
}

/* Transitions */
.slide-in-enter-active,
.slide-in-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-in-enter-from {
  transform: translateX(100%) scale(0.95);
  opacity: 0;
}

.slide-in-leave-to {
  transform: translateX(100%) scale(0.95);
  opacity: 0;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .notification {
    background: rgba(31, 41, 55, 0.95);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2);
  }
  
  .notification-success {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(31, 41, 55, 0.95) 100%);
  }
  
  .notification-error {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(31, 41, 55, 0.95) 100%);
  }
  
  .notification-warning {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(31, 41, 55, 0.95) 100%);
  }
  
  .notification-info {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(31, 41, 55, 0.95) 100%);
  }
  
  .notification-title {
    color: #f9fafb;
  }
  
  .notification-message {
    color: #d1d5db;
  }
  
  .notification-close {
    color: #9ca3af;
  }
  
  .notification-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #d1d5db;
  }
}

/* Responsive design */
@media (max-width: 640px) {
  .notification-container {
    top: 10px;
    right: 10px;
    left: 10px;
  }
  
  .notification {
    min-width: auto;
    max-width: none;
    width: 100%;
  }
}
</style>
