<template>
  <div class="chart-card">
    <div class="chart-header">
      <h2>Top Selling Products</h2>
      <div class="period-selector">
        <button 
          v-for="period in timePeriods" 
          :key="period.value"
          :class="{ 'active': activePeriod === period.value }"
          @click="$emit('setActivePeriod', period.value)"
        >
          {{ period.label }}
        </button>
      </div>
    </div>
    
    <div class="top-sales-list" ref="topSalesList">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading sales data...</p>
      </div>
      
      <div v-else-if="salesItems.length === 0" class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 3v18h18"></path>
          <path d="m19 9-5 5-4-4-3 3"></path>
        </svg>
        <p>No sales data available for this period</p>
      </div>
      
      <div v-else class="sales-item" v-for="(item, index) in salesItems" :key="index">
        <div class="item-info">
          <span class="item-rank">{{ index + 1 }}</span>
          <div class="item-details">
            <span class="item-name">{{ item.name }}</span>
          </div>
        </div>
        <div class="item-progress">
          <div class="progress-bar-container">
            <div class="progress-bar" :style="{ width: `${item.percentage}%` }"></div>
          </div>
          <span class="percentage">{{ item.percentage }}%</span>
        </div>
      </div>
    </div>
    
    <div class="view-more" v-if="salesItems.length > 5">
      <button @click="toggleViewAll">
        {{ viewAll ? 'Show Less' : 'View All' }}
        <svg v-if="!viewAll" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const props = defineProps({
  salesItems: {
    type: Array,
    default: () => []
  },
  timePeriods: {
    type: Array,
    default: () => []
  },
  activePeriod: {
    type: String,
    default: '1m'
  }
});

defineEmits(['setActivePeriod']);

const loading = ref(true);
const viewAll = ref(false);
const topSalesList = ref(null);
const db = getFirestore();

// Toggle between showing all items or just the top 5
const toggleViewAll = () => {
  viewAll.value = !viewAll.value;
  
  if (viewAll.value) {
    // If we're showing all items, make sure the list is scrollable
    if (topSalesList.value) {
      topSalesList.value.style.maxHeight = '400px';
      topSalesList.value.style.overflowY = 'auto';
    }
  } else {
    // If we're showing only the top 5, remove scrolling
    if (topSalesList.value) {
      topSalesList.value.style.maxHeight = '';
      topSalesList.value.style.overflowY = '';
    }
  }
};

// Fetch sales data based on selected period
const fetchSalesData = async () => {
  loading.value = true;
  
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      console.error('User not authenticated');
      loading.value = false;
      return;
    }
    
    // Determine date range based on active period
    const now = new Date();
    let startDate = new Date();
    
    switch (props.activePeriod) {
      case '1d': // Today
        startDate.setHours(0, 0, 0, 0);
        break;
      case '7d': // This Week
        startDate.setDate(now.getDate() - 7);
        break;
      case '1m': // This Month
        startDate.setMonth(now.getMonth(), 1); // First day of current month
        break;
      case '1y': // This Year
        startDate.setMonth(0, 1); // January 1st of current year
        break;
      default:
        startDate.setMonth(now.getMonth(), 1); // Default to month
    }
    
    // Query orders within the date range
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('sellerId', '==', user.uid),
      where('timestamp', '>=', startDate),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    // Process orders to get top selling products
    const productSales = {};
    
    snapshot.forEach(doc => {
      const orderData = doc.data();
      const productName = orderData.productName || 'Unknown Product';
      const quantity = orderData.quantity || 1;
      
      if (!productSales[productName]) {
        productSales[productName] = {
          name: productName,
          quantity: quantity,
          image: orderData.productImage || '/images/placeholder.jpg'
        };
      } else {
        productSales[productName].quantity += quantity;
      }
    });
    
    // Convert to array and sort by quantity
    const sortedProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity);
    
    // Calculate percentage relative to highest selling product
    if (sortedProducts.length > 0) {
      const highestQuantity = sortedProducts[0].quantity;
      
      sortedProducts.forEach(product => {
        product.percentage = Math.round((product.quantity / highestQuantity) * 100);
      });
    }
    
    // Set data loading to false
    loading.value = false;
    
  } catch (error) {
    console.error('Error fetching sales data:', error);
    loading.value = false;
  }
};

// Watch for changes in active period
watch(() => props.activePeriod, () => {
  fetchSalesData();
});

// Display only the top 5 items unless viewAll is true
const displayedItems = computed(() => {
  if (viewAll.value) {
    return props.salesItems;
  } else {
    return props.salesItems.slice(0, 5);
  }
});

onMounted(() => {
  fetchSalesData();
});
</script>

<style scoped>
.chart-card {
  background-color: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.chart-header h2 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.period-selector {
  display: flex;
  align-items: center;
  background-color: #f3f4f6;
  border-radius: 6px;
  padding: 2px;
  font-size: 0.8rem;
}

.period-selector button {
  background: none;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  color: #6b7280;
}

.period-selector button.active {
  background-color: #fff;
  color: #111827;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.top-sales-list {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.loading-state, .empty-state {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(46, 92, 49, 0.1);
  border-radius: 50%;
  border-top-color: #2e5c31;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state svg {
  color: #d1d5db;
  margin-bottom: 10px;
}

.sales-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.sales-item:last-child {
  border-bottom: none;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-rank {
  width: 24px;
  height: 24px;
  background-color: #f3f4f6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: #6b7280;
}

.item-details {
  display: flex;
  flex-direction: column;
}

.item-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: #111827;
}

.item-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 150px;
}

.progress-bar-container {
  flex-grow: 1;
  height: 8px;
  background-color: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: #2e5c31;
  border-radius: 4px;
}

.percentage {
  font-size: 0.8rem;
  font-weight: 600;
  color: #111827;
  min-width: 40px;
  text-align: right;
}

.view-more {
  margin-top: 15px;
  text-align: center;
}

.view-more button {
  background: none;
  border: none;
  color: #2e5c31;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0 auto;
}

/* Dark mode styles */
:global(.dark) .chart-card {
  background-color: #1f2937;
}

:global(.dark) .chart-header h2 {
  color: #f9fafb;
}

:global(.dark) .period-selector {
  background-color: #374151;
}

:global(.dark) .period-selector button {
  color: #9ca3af;
}

:global(.dark) .period-selector button.active {
  background-color: #1f2937;
  color: #f9fafb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

:global(.dark) .loading-state,
:global(.dark) .empty-state {
  color: #9ca3af;
}

:global(.dark) .empty-state svg {
  color: #4b5563;
}

:global(.dark) .sales-item {
  border-color: #374151;
}

:global(.dark) .item-rank {
  background-color: #374151;
  color: #9ca3af;
}

:global(.dark) .item-name {
  color: #f9fafb;
}

:global(.dark) .progress-bar-container {
  background-color: #374151;
}

:global(.dark) .percentage {
  color: #f9fafb;
}

:global(.dark) .view-more button {
  color: #4a8f4d;
}

/* Responsive styles */
@media (max-width: 576px) {
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .item-progress {
    min-width: 100px;
  }
}
</style>