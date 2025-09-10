<template>
  <div class="dashboard-card recent-activity">
    <div class="card-header">
      <h3>Recent Activity</h3>
      <button class="view-all-btn">View All</button>
    </div>
    <div class="activity-list">
      <div v-for="(activity, index) in visibleActivities" :key="activity.id || index" class="activity-item">
        <div class="activity-icon" :class="activity.type">
          <component :is="getActivityIcon(activity.type)" size="18" />
        </div>
        <div class="activity-content">
          <div class="activity-text" v-html="activity.text"></div>
          <div class="activity-time">{{ activity.time }}</div>
        </div>
        <div class="activity-actions">
          <button class="action-btn">
            <MoreVertical size="16" />
          </button>
        </div>
      </div>
      <div v-if="!filteredActivities.length" class="activity-item" style="justify-content:center;color:#6b7280;">
        No recent activity yet.
      </div>
    </div>
    <div v-if="filteredActivities.length > pageSize" class="pagination-bar">
      <button class="pager-btn" :disabled="currentPage === 1" @click="prevPage">Previous</button>
      <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
      <button class="pager-btn" :disabled="currentPage === totalPages" @click="nextPage">Next</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { User, ShoppingBag, Truck, AlertCircle, CheckCircle, MessageSquare, MoreVertical, Info } from 'lucide-vue-next';
import { db } from '@/firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

// Reactive activities fed by Firestore
const activities = ref([]);
const currentPage = ref(1);
const pageSize = 5; // show 5 rows per page

// Unsubscribe handles
let unsubSellers = null;
let unsubNotifsByCreated = null;
let unsubNotifsByTimestamp = null;

const MAX_ACTIVITIES = 30;

const getActivityIcon = (type) => {
  const icons = {
    user: User,
    product: ShoppingBag,
    order: Truck,
    alert: AlertCircle,
    system: CheckCircle,
    message: MessageSquare
  };
  return icons[type] || Info;
};

function normalizeDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function timeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - date.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function upsertActivity(activity) {
  // Ensure createdAt is a Date and time label is set
  const created = activity.createdAt instanceof Date ? activity.createdAt : normalizeDate(activity.createdAt) || new Date();
  const act = { ...activity, createdAt: created, time: timeAgo(created) };
  // Dedupe by id when available, else by text+type+time
  const key = act.id || `${act.type}:${act.text}`;
  const map = new Map(activities.value.map(a => [a.id || `${a.type}:${a.text}`, a]));
  map.set(key, act);
  const merged = Array.from(map.values())
    .sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0))
    .slice(0, MAX_ACTIVITIES);
  activities.value = merged;
  // If we get new data and current page exceeds max, clamp it
  // Will be finalized by watcher below
}

function subscribeToSellerRegistrations() {
  try {
    // Many seller docs use createdAt as ISO string; ordering by string ISO works chronologically
    const sellersRef = collection(db, 'sellers');
    const sellersQuery = query(sellersRef, orderBy('createdAt', 'desc'), limit(20));
    unsubSellers = onSnapshot(sellersQuery, (snapshot) => {
      snapshot.forEach((doc) => {
        const data = doc.data();
        const created = normalizeDate(data.createdAt) || normalizeDate(data.timestamp) || new Date();
        const firstName = data.personalInfo?.firstName || data.owner?.firstName || '';
        const lastName = data.personalInfo?.lastName || data.owner?.lastName || '';
        const farmName = data.farmDetails?.farmName || data.farmName || '';
        const display = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : (farmName || 'New seller');
        upsertActivity({
          id: `seller:${doc.id}`,
          type: 'user',
          text: `<strong>${display}</strong> registered as a seller${farmName ? ` ("${farmName}")` : ''}`,
          createdAt: created
        });
      });
    });
  } catch (e) {
    // Fallback without order if composite index/types vary
    const sellersRef = collection(db, 'sellers');
    unsubSellers = onSnapshot(sellersRef, (snapshot) => {
      snapshot.forEach((doc) => {
        const data = doc.data();
        const created = normalizeDate(data.createdAt) || normalizeDate(data.timestamp) || new Date();
        const firstName = data.personalInfo?.firstName || data.owner?.firstName || '';
        const lastName = data.personalInfo?.lastName || data.owner?.lastName || '';
        const farmName = data.farmDetails?.farmName || data.farmName || '';
        const display = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : (farmName || 'New seller');
        upsertActivity({
          id: `seller:${doc.id}`,
          type: 'user',
          text: `<strong>${display}</strong> registered as a seller${farmName ? ` ("${farmName}")` : ''}`,
          createdAt: created
        });
      });
    });
  }
}

const INCLUDED_NOTIF_TYPES = new Set(['price_warning', 'final_warning', 'underprice_warning']);

function mapNotificationToActivity(doc) {
  const data = doc.data();
  const created = normalizeDate(data.createdAt) || normalizeDate(data.timestamp) || new Date();
  const type = data.type;
  const product = data.productName || data.product || 'a product';
  // Determine if it's an overprice-related alert
  const isPriceAlert = INCLUDED_NOTIF_TYPES.has(type) || (
    type === 'alert' && (
      (data.title && /price/i.test(data.title)) || (data.message && /price|overprice|above\s*D\.A\./i.test(data.message))
    )
  );
  if (!isPriceAlert) return null;

  let label = 'Price warning';
  if (type === 'final_warning') label = 'Final price warning';
  if (type === 'underprice_warning') label = 'Underprice warning';

  return {
    id: `notif:${doc.id}`,
    type: 'alert',
    text: `<strong>${label}:</strong> ${product}`,
    createdAt: created
  };
}

function subscribeToPriceNotifications() {
  // Primary: createdAt ordering
  try {
    const notifsRef = collection(db, 'notifications');
    const q1 = query(notifsRef, orderBy('createdAt', 'desc'), limit(50));
    unsubNotifsByCreated = onSnapshot(q1, (snapshot) => {
      snapshot.forEach((doc) => {
        const act = mapNotificationToActivity(doc);
        if (act) upsertActivity(act);
      });
    });
  } catch (e) {
    // ignore; fallback to timestamp below
  }

  // Fallback: timestamp ordering (some docs use 'timestamp' instead of 'createdAt')
  try {
    const notifsRef = collection(db, 'notifications');
    const q2 = query(notifsRef, orderBy('timestamp', 'desc'), limit(50));
    unsubNotifsByTimestamp = onSnapshot(q2, (snapshot) => {
      snapshot.forEach((doc) => {
        const act = mapNotificationToActivity(doc);
        if (act) upsertActivity(act);
      });
    });
  } catch (e) {
    // no-op
  }
}

onMounted(() => {
  subscribeToSellerRegistrations();
  subscribeToPriceNotifications();
});

onUnmounted(() => {
  if (unsubSellers) try { unsubSellers(); } catch {}
  if (unsubNotifsByCreated) try { unsubNotifsByCreated(); } catch {}
  if (unsubNotifsByTimestamp) try { unsubNotifsByTimestamp(); } catch {}
});

// Derived lists and pagination
const filteredActivities = computed(() => {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return activities.value
    .filter(a => a.createdAt && a.createdAt >= oneWeekAgo)
    .sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0));
});

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredActivities.value.length / pageSize));
});

const visibleActivities = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredActivities.value.slice(start, start + pageSize);
});

watch([filteredActivities, totalPages], () => {
  // Reset or clamp page when data changes
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value;
  if (currentPage.value < 1) currentPage.value = 1;
});

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value += 1;
}

function prevPage() {
  if (currentPage.value > 1) currentPage.value -= 1;
}
</script>
  
  <style scoped>
  .dashboard-card {
    background-color: #fff;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .card-header h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }
  
  .view-all-btn {
    background: none;
    border: none;
    color: #3498db;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
  }
  
  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .activity-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
    border-radius: 8px;
    background-color: #f9fafb;
  }
  
  .activity-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }
  
  .activity-icon.user {
    background-color: #3498db;
  }
  
  .activity-icon.product {
    background-color: #4a8f4d;
  }
  
  .activity-icon.order {
    background-color: #8b5cf6;
  }
  
  .activity-icon.alert {
    background-color: #ef4444;
  }
  
  .activity-icon.system {
    background-color: #f59e0b;
  }
  
  .activity-icon.message {
    background-color: #06b6d4;
  }
  
  .activity-content {
    flex: 1;
  }
  
  .activity-text {
    font-size: 0.9rem;
    color: #4b5563;
    margin-bottom: 5px;
  }
  
  .activity-time {
    font-size: 0.8rem;
    color: #9ca3af;
  }
  
  .activity-actions {
    display: flex;
    gap: 5px;
  }
  
  .action-btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .action-btn:hover {
    background-color: #e5e7eb;
    color: #111827;
  }

  .pagination-bar {
    margin-top: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .pager-btn {
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid #d1d5db;
    background: #fff;
    color: #111827;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .pager-btn:hover:enabled {
    background: #f3f4f6;
  }

  .pager-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .page-info {
    color: #374151;
    font-size: 0.9rem;
  }
  </style>