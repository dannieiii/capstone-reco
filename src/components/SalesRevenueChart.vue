<template>
  <div class="chart-card">
    <div class="chart-header">
      <h2>Sales Revenue</h2>
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
    
    <div class="revenue-stats">
      <div class="stat-card">
        <div class="stat-icon total-revenue-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Revenue</span>
          <span class="stat-value">{{ currency }}{{ formatNumber(totalRevenue) }}</span>
          <div class="stat-change positive">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
            <span>+{{ revenueGrowth }}% from last period</span>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon total-orders-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Orders</span>
          <span class="stat-value">{{ totalOrders }}</span>
          <div class="stat-change positive">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
            <span>+{{ ordersGrowth }}% from last period</span>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon avg-order-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="8 12 12 16 16 12"></polyline>
            <line x1="12" y1="8" x2="12" y2="16"></line>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">Average Order</span>
          <span class="stat-value">{{ currency }}{{ formatNumber(avgOrderValue) }}</span>
          <div class="stat-change negative">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
              <polyline points="17 18 23 18 23 12"></polyline>
            </svg>
            <span>-{{ avgOrderDecline }}% from last period</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="chart-wrapper">
      <canvas ref="salesChart"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import Chart from 'chart.js/auto';
import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const props = defineProps({
  totalRevenue: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: '₱'
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

const salesChart = ref(null);
let chartInstance = null;
const db = getFirestore();

// Stats data with default values
const totalOrders = ref(0);
const avgOrderValue = ref(0);
const revenueGrowth = ref(12);
const ordersGrowth = ref(8);
const avgOrderDecline = ref(3);

// Format number with commas
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Initialize sales chart with data
const initSalesChart = async () => {
  if (!salesChart.value) return;
  
  const ctx = salesChart.value.getContext('2d');
  
  if (chartInstance) {
    chartInstance.destroy();
  }
  
  // Fetch chart data based on active period
  const { labels, revenueData, ordersData } = await fetchChartData();
  
  // Calculate stats
  if (revenueData.length > 0 && ordersData.length > 0) {
    const totalRev = revenueData.reduce((sum, val) => sum + val, 0);
    const totalOrd = ordersData.reduce((sum, val) => sum + val, 0);
    
    totalOrders.value = totalOrd;
    avgOrderValue.value = totalOrd > 0 ? Math.round(totalRev / totalOrd) : 0;
  }
  
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Revenue',
          data: revenueData,
          borderColor: '#2e5c31',
          backgroundColor: 'rgba(46, 92, 49, 0.1)',
          tension: 0.4,
          fill: true,
          yAxisID: 'y'
        },
        {
          label: 'Orders',
          data: ordersData,
          borderColor: '#4a8f4d',
          backgroundColor: 'rgba(74, 143, 77, 0.1)',
          tension: 0.4,
          borderDash: [5, 5],
          fill: false,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            boxWidth: 6
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              if (label === 'Revenue') {
                return `${label}: ${props.currency}${formatNumber(context.raw)}`;
              } else {
                return `${label}: ${context.raw}`;
              }
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return props.currency + formatNumber(value);
            }
          },
          grid: {
            borderDash: [2, 2]
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          beginAtZero: true,
          grid: {
            drawOnChartArea: false,
          }
        }
      }
    }
  });
};

// Fetch chart data from Firestore based on active period
const fetchChartData = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    console.error('User not authenticated');
    return { labels: [], revenueData: [], ordersData: [] };
  }
  
  // Determine date range based on active period
  const now = new Date();
  let startDate = new Date();
  let labels = [];
  
  switch (props.activePeriod) {
    case '1d': // Today
      startDate.setHours(0, 0, 0, 0);
      labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
      break;
    case '7d': // This Week
      startDate.setDate(now.getDate() - 7);
      labels = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - 6 + i);
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      });
      break;
    case '1m': // This Month
      startDate.setMonth(now.getMonth(), 1); // First day of current month
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
      break;
    case '1y': // This Year
      startDate.setMonth(0, 1); // January 1st of current year
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      break;
    default:
      startDate.setMonth(now.getMonth(), 1); // Default to month
      const defaultDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      labels = Array.from({ length: defaultDaysInMonth }, (_, i) => `${i + 1}`);
  }
  
  try {
    // Query orders within the date range
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('sellerId', '==', user.uid),
      where('timestamp', '>=', startDate),
      orderBy('timestamp')
    );
    
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp || new Date()
    }));
    
    // Initialize data arrays
    let revenueData = Array(labels.length).fill(0);
    let ordersData = Array(labels.length).fill(0);
    
    // Process orders based on active period
    orders.forEach(order => {
      let index = 0;
      
      if (props.activePeriod === '1d') {
        // For today, group by hour
        index = order.timestamp.getHours();
      } else if (props.activePeriod === '7d') {
        // For week, group by day
        const dayDiff = Math.floor((order.timestamp - startDate) / (1000 * 60 * 60 * 24));
        index = Math.min(Math.max(dayDiff, 0), 6);
      } else if (props.activePeriod === '1m') {
        // For month, group by day of month
        index = order.timestamp.getDate() - 1;
      } else if (props.activePeriod === '1y') {
        // For year, group by month
        index = order.timestamp.getMonth();
      }
      
      if (index >= 0 && index < labels.length) {
        revenueData[index] += order.totalPrice || 0;
        ordersData[index] += 1; // Count each order
      }
    });
    
    return { labels, revenueData, ordersData };
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return { 
      labels, 
      revenueData: Array(labels.length).fill(0), 
      ordersData: Array(labels.length).fill(0) 
    };
  }
};

// Watch for changes in active period and update chart
watch(() => props.activePeriod, () => {
  initSalesChart();
});

// Initialize chart when component is mounted
onMounted(() => {
  initSalesChart();
  
  // Handle dark mode
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class' && 
          document.body.classList.contains('dark') && 
          chartInstance) {
        // Update chart text colors for dark mode
        chartInstance.options.scales.x.ticks.color = '#9ca3af';
        chartInstance.options.scales.y.ticks.color = '#9ca3af';
        chartInstance.options.scales.y1.ticks.color = '#9ca3af';
        chartInstance.options.plugins.legend.labels.color = '#9ca3af';
        chartInstance.update();
      } else if (mutation.attributeName === 'class' && 
                !document.body.classList.contains('dark') && 
                chartInstance) {
        // Update chart text colors for light mode
        chartInstance.options.scales.x.ticks.color = '#6b7280';
        chartInstance.options.scales.y.ticks.color = '#6b7280';
        chartInstance.options.scales.y1.ticks.color = '#6b7280';
        chartInstance.options.plugins.legend.labels.color = '#6b7280';
        chartInstance.update();
      }
    });
  });
  
  observer.observe(document.body, { attributes: true });
  
  // Clean up
  onBeforeUnmount(() => {
    if (chartInstance) {
      chartInstance.destroy();
    }
    observer.disconnect();
  });
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
  margin-bottom: 15px;
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

.revenue-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  background-color: #f9fafb;
  border-radius: 8px;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.total-revenue-icon {
  background-color: #2e5c31;
}

.total-orders-icon {
  background-color: #4a8f4d;
}

.avg-order-icon {
  background-color: #84cc16;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.8rem;
  color: #6b7280;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
  margin: 2px 0;
}

.stat-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
}

.stat-change.positive {
  color: #10b981;
}

.stat-change.negative {
  color: #ef4444;
}

.chart-wrapper {
  position: relative;
  flex-grow: 1;
  min-height: 250px;
}

/* Dark mode styles */
:global(.dark) .chart-card {
  background-color: #1f2937;
}

:global(.dark) .chart-header h2,
:global(.dark) .stat-value {
  color: #f9fafb;
}

:global(.dark) .stat-label {
  color: #9ca3af;
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

:global(.dark) .stat-card {
  background-color: #111827;
}

/* Responsive styles */
@media (max-width: 992px) {
  .revenue-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .revenue-stats {
    grid-template-columns: 1fr;
  }
  
  .chart-wrapper {
    min-height: 200px;
  }
}
</style>