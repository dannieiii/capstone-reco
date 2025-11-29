import { ref, onMounted, onBeforeUnmount } from 'vue';

const DESKTOP_WIDTH = 250;
const COLLAPSED_WIDTH = 70;
const MOBILE_BREAKPOINT = 768;
const MOBILE_TOP_OFFSET = 'calc(56px + env(safe-area-inset-top))';

const getInitialOffset = () => {
  if (typeof window === 'undefined') {
    return { offset: DESKTOP_WIDTH, isMobile: false, isCollapsed: false };
  }

  const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
  const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  const offset = isMobile ? 0 : (collapsed ? COLLAPSED_WIDTH : DESKTOP_WIDTH);

  return { offset, isMobile, isCollapsed: collapsed };
};

export const useSidebarOffset = () => {
  const initialState = getInitialOffset();
  const sidebarOffset = ref(initialState.offset);
  const isMobileViewport = ref(initialState.isMobile);
  const isSidebarCollapsed = ref(initialState.isCollapsed);

  const recalculateOffset = () => {
    if (typeof window === 'undefined') {
      sidebarOffset.value = DESKTOP_WIDTH;
      isMobileViewport.value = false;
      isSidebarCollapsed.value = false;
      return;
    }

    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    isMobileViewport.value = isMobile;

    if (isMobile) {
      sidebarOffset.value = 0;
      return;
    }

    const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    isSidebarCollapsed.value = collapsed;
    sidebarOffset.value = collapsed ? COLLAPSED_WIDTH : DESKTOP_WIDTH;
  };

  const handleSidebarEvent = (event) => {
    if (typeof window === 'undefined') {
      return;
    }

    if (event?.detail?.collapsed !== undefined) {
      isSidebarCollapsed.value = !!event.detail.collapsed;
    }

    recalculateOffset();
  };

  onMounted(() => {
    recalculateOffset();
    window.addEventListener('resize', recalculateOffset);
    window.addEventListener('sidebar:toggled', handleSidebarEvent);
    window.addEventListener('sidebar:state', handleSidebarEvent);
  });

  onBeforeUnmount(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.removeEventListener('resize', recalculateOffset);
    window.removeEventListener('sidebar:toggled', handleSidebarEvent);
    window.removeEventListener('sidebar:state', handleSidebarEvent);
  });

  return {
    sidebarOffset,
    isMobileViewport,
    isSidebarCollapsed,
    mobileTopOffset: MOBILE_TOP_OFFSET
  };
};
