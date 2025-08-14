<template>
  <transition name="slide-fade">
    <div 
      v-if="visible" 
      class="toast" 
      :class="[type, clickable ? 'clickable' : '']"
      @click="handleAction"
    >
      <button class="close-btn" @click.stop="$emit('close')" aria-label="Close notification">×</button>
      <div class="left-icon">
        <img v-if="iconUrl" :src="iconUrl" alt="" />
        <div v-else class="placeholder-icon"></div>
      </div>
      <div class="content">
        <div class="header-row">
          <div class="brand">{{ title }}</div>
          <div class="time" v-if="timeText">{{ timeText }}</div>
        </div>
        <div class="message">{{ message }}</div>
        <div class="action" v-if="actionText">{{ actionText }}</div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  emits: ['close', 'action'],
  props: {
    title: {
      type: String,
      default: ''
    },
    message: String,
    timeText: {
      type: String,
      default: ''
    },
    actionText: {
      type: String,
      default: ''
    },
    iconUrl: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'success'
    },
    visible: Boolean,
    sticky: {
      type: Boolean,
      default: false
    },
    duration: {
      type: Number,
      default: 4000
    },
    clickable: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    visible(newVal) {
      if (newVal && !this.sticky) {
        clearTimeout(this._t);
        this._t = setTimeout(() => this.$emit('close'), this.duration);
      }
    }
  },
  beforeUnmount() {
    clearTimeout(this._t);
  },
  methods: {
    handleAction() {
      if (this.clickable) this.$emit('action');
    }
  }
}
</script>

<style scoped>
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 14px 44px 14px 14px;
  border-radius: 12px;
  background: #1f2937; /* dark card */
  color: #fff;
  font-weight: 400;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
  z-index: 9999;
  max-width: 380px;
  display: flex;
  gap: 12px;
  border: 1px solid rgba(255,255,255,0.08);
}
.toast.clickable { cursor: pointer; }
.toast .close-btn {
  position: absolute;
  top: 6px;
  right: 8px;
  background: transparent;
  border: 0;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  opacity: 0.9;
}
.toast .close-btn:hover {
  opacity: 1;
}

/* optional type accents as a subtle left border */
.toast.success { box-shadow: inset 3px 0 #34d399, 0 10px 25px rgba(0,0,0,.25); }
.toast.error { box-shadow: inset 3px 0 #ef4444, 0 10px 25px rgba(0,0,0,.25); }
.toast.info { box-shadow: inset 3px 0 #60a5fa, 0 10px 25px rgba(0,0,0,.25); }

.left-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  overflow: hidden;
  background: rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.left-icon img { width: 100%; height: 100%; object-fit: cover; }
.left-icon .placeholder-icon {
  width: 20px; height: 20px; border-radius: 50%; background: rgba(255,255,255,0.3);
}

.content { flex: 1; min-width: 0; }
.header-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.brand { font-weight: 700; letter-spacing: 0.2px; }
.time { color: #9ca3af; font-size: 0.8rem; white-space: nowrap; }
.message { color: #e5e7eb; margin-top: 4px; line-height: 1.3; }
.action { color: #93c5fd; margin-top: 6px; font-size: 0.85rem; text-decoration: underline; }

.slide-fade-enter-active { transition: all 0.3s ease-out; }
.slide-fade-leave-active { transition: all 0.5s ease-in; }
.slide-fade-enter-from,
.slide-fade-leave-to { transform: translateX(20px); opacity: 0; }
</style>