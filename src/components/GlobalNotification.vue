<template>
  <component :is="transitionName">
    <div v-if="notification.visible"
         :style="layoutStyle"
         :class="containerClasses"
         role="alert">
      <span v-if="isBanner" class="dot" :class="dotClass" aria-hidden="true"></span>
      <span v-else class="text-lg leading-none" :class="iconClass">{{ icon }}</span>
      <span class="flex-1" :class="messageClass">{{ notification.message }}</span>
      <button
        @click="close"
        class="close-btn"
        aria-label="Close notification"
        v-if="!autoHide"
      >×</button>
    </div>
  </component>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
export default {
  name: 'GlobalNotification',
  props: {
    offsetTop: { type: Number, default: 70 }, // pixels from top
    right: { type: Number, default: 16 }, // right margin
    autoHide: { type: Boolean, default: true },
  },
  computed: {
    ...mapGetters(['notification']),
    positionClass() { return ''; },
    isBanner() { return this.notification.layout === 'banner'; },
    transitionName() { return this.isBanner ? 'div' : 'transition'; },
    icon() {
      switch (this.notification.type) {
        case 'success': return '✔';
        case 'warning': return '⚠';
        case 'error': return '!';
        default: return 'ℹ';
      }
    },
    bgClass() {
      switch (this.notification.type) {
        case 'success': return 'bg-green-600 text-white';
        case 'warning': return 'bg-orange-600 text-white';
        case 'error': return 'bg-red-600 text-white';
        default: return 'bg-blue-600 text-white';
      }
    },
    iconClass() { return 'text-white'; },
    dotClass() { return 'bg-white'; },
    layoutStyle() {
      if (this.isBanner) {
        return { top: '0px', left: '50%', transform: 'translateX(-50%)' };
      }
      return { top: this.offsetTop + 'px', right: this.right + 'px' };
    },
    containerClasses() {
      if (this.isBanner) {
        return [
          'fixed z-[3500] flex items-center gap-3 px-5 py-3 rounded-b-xl shadow-lg text-sm font-medium w-auto max-w-[760px]',
          this.bannerBgClass,
        ];
      }
      return [
        'fixed z-[9999] w-auto max-w-sm min-w-[300px] rounded-md shadow-lg flex items-center gap-2 pl-3 pr-2 py-2 text-sm font-medium',
        this.bgClass
      ];
    },
    bannerBgClass() {
      // Slight gradient similar to OfflineBanner
      switch (this.notification.type) {
        case 'error': return 'text-white bg-red-600';
        case 'warning': return 'text-white bg-orange-600';
        case 'success': return 'text-white bg-green-600';
        default: return 'text-white bg-blue-600';
      }
    },
    messageClass() { return this.isBanner ? 'text-[14px] leading-snug pr-1' : 'text-[13px] leading-snug text-white'; }
  },
  methods: {
    ...mapActions(['hideNotification']),
    close() {
      this.hideNotification();
    }
  }
};
</script>

<style scoped>
.close-btn { height:1.5rem; width:1.5rem; display:inline-flex; align-items:center; justify-content:center; border-radius:0.375rem; color:rgba(255,255,255,0.8); cursor:pointer; }
.close-btn:hover { color:#fff; background:rgba(255,255,255,0.1); }
.close-btn:focus { outline:2px solid rgba(255,255,255,0.4); outline-offset:2px; }
.dot { width:10px; height:10px; border-radius:50%; opacity:.9; }
.notify-slide-enter-active, .notify-slide-leave-active { transition: all 0.28s cubic-bezier(.4,.0,.2,1); }
.notify-slide-enter-from { opacity: 0; transform: translateY(-12px) translateX(8px); }
.notify-slide-leave-to { opacity: 0; transform: translateY(-8px) translateX(8px); }
</style>
