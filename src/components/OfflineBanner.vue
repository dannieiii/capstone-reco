<template>
  <transition name="offline-fade-slide">
    <div v-if="!isOnline" class="offline-banner" role="status" aria-live="polite">
      <span class="dot" aria-hidden="true"></span>
      <span class="msg">You're offline. Some features may be unavailable.</span>
      <button class="retry" type="button" @click="retry" :disabled="checking">
        <span v-if="!checking">Retry</span>
        <span v-else class="spinner" aria-hidden="true"></span>
      </button>
    </div>
  </transition>
  <transition name="online-fade-slide">
    <div v-if="showOnline" class="online-banner" role="status" aria-live="polite">
      <span class="dot" aria-hidden="true"></span>
      <span class="msg">You're online. Connection restored.</span>
      <button class="dismiss" type="button" @click="hideOnline" aria-label="Dismiss online message">×</button>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// Track navigator onLine status
const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true);
const checking = ref(false);
const showOnline = ref(false);
let checkTimeout; let onlineTimeout;

const updateStatus = () => {
  const prev = isOnline.value;
  isOnline.value = navigator.onLine;
  if (prev === false && isOnline.value === true) {
    // Just came back online
    triggerOnlineBanner();
  }
};

const triggerOnlineBanner = () => {
  showOnline.value = true;
  if (onlineTimeout) clearTimeout(onlineTimeout);
  onlineTimeout = setTimeout(() => { showOnline.value = false; }, 4000);
};

const hideOnline = () => {
  showOnline.value = false;
  if (onlineTimeout) clearTimeout(onlineTimeout);
};

// Attempt a lightweight HEAD request to confirm connectivity
const probe = async (url = '/', timeoutMs = 4000) => {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await fetch(url, { method: 'HEAD', cache: 'no-store', signal: controller.signal });
    return true;
  } catch (e) {
    return false;
  } finally {
    clearTimeout(t);
  }
};

const retry = async () => {
  if (checking.value) return;
  checking.value = true;
  // Immediate status check (in case event already fired but UI not yet updated)
  updateStatus();
  if (!isOnline.value) {
    const ok = await probe();
    if (ok) {
      isOnline.value = true; // Force UI update if events not fired
    }
  }
  // Small delay to let spinner show
  checkTimeout = setTimeout(() => { checking.value = false; }, 350);
};

onMounted(() => {
  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
});

onUnmounted(() => {
  window.removeEventListener('online', updateStatus);
  window.removeEventListener('offline', updateStatus);
  if (checkTimeout) clearTimeout(checkTimeout);
  if (onlineTimeout) clearTimeout(onlineTimeout);
});
</script>

<script>
// Provide named export if needed for tests
export default {};
</script>

<style scoped>
.offline-banner {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg,#b91c1c,#dc2626);
  color: #fff;
  padding: 10px 16px;
  border-radius: 0 0 12px 12px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 3000;
  box-shadow: 0 4px 16px -2px rgba(0,0,0,0.35);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.online-banner {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg,#0f766e,#059669);
  color: #fff;
  padding: 10px 16px;
  border-radius: 0 0 12px 12px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 3000;
  box-shadow: 0 4px 16px -2px rgba(0,0,0,0.35);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.online-banner .dot { background:#fff; animation: none; opacity:.9; }
.dismiss { 
  margin-left:auto; background:rgba(255,255,255,0.15); color:#fff; border:1px solid rgba(255,255,255,0.45); padding:2px 10px; font-size:14px; line-height:1; border-radius:8px; cursor:pointer; transition:background .25s,border-color .25s,opacity .25s; 
}
.dismiss:hover { background:rgba(255,255,255,0.25); }
.online-fade-slide-enter-active, .online-fade-slide-leave-active { transition: opacity .3s, transform .3s; }
.online-fade-slide-enter-from, .online-fade-slide-leave-to { opacity:0; transform: translate(-50%, -12px); }
.msg { line-height: 1.2; }
.dot {
  width: 10px;
  height: 10px;
  background: #fff;
  border-radius: 50%;
  animation: pulse 1.2s infinite;
  flex-shrink: 0;
}
.retry {
  margin-left: auto;
  background: rgba(255,255,255,0.15);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.45);
  padding: 5px 12px;
  font-size: 12px;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background .25s,border-color .25s,opacity .25s;
}
.retry:hover:not(:disabled) { background: rgba(255,255,255,0.25); }
.retry:disabled { opacity: .55; cursor: default; }
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.5);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse {
  0%,100% { opacity: 0.4; transform: scale(.85); }
  50% { opacity: 1; transform: scale(1); }
}
.offline-fade-slide-enter-active,
.offline-fade-slide-leave-active { transition: opacity .3s, transform .3s; }
.offline-fade-slide-enter-from,
.offline-fade-slide-leave-to { opacity: 0; transform: translate(-50%, -12px); }
</style>
