<template>
  <div class="customer-overview-graph">
    <div class="chart-header">
      <div class="chart-title">
        <h3>Customer Overview</h3>
        <p>Track your customer engagement and order patterns</p>
      </div>
      <div class="chart-controls">
        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-color" style="background-color: #2e5c31;"></span>
            <span>New Customers</span>
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background-color: #4a8f4d;"></span>
            <span>Returning Customers</span>
          </div>
        </div>
        <select v-model="chartTimeRange" @change="updateChartData" class="time-filter">
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>
    </div>
    
    <div class="chart-container">
      <canvas ref="customerChart"></canvas>
    </div>
    
    <div class="chart-summary">
      <div class="summary-item">
        <span class="summary-label">Total Customers</span>
        <span class="summary-value">{{ totalCustomers }}</span>
        <span class="summary-trend" :class="customerTrend >= 0 ? 'positive' : 'negative'">
          <span v-if="customerTrend >= 0">↑</span>
          <span v-else>↓</span>
          {{ Math.abs(customerTrend) }}%
        </span>
      </div>
      <div class="summary-item">
        <span class="summary-label">New This Period</span>
        <span class="summary-value">{{ newCustomersThisPeriod }}</span>
        <span class="summary-trend" :class="newCustomerTrend >= 0 ? 'positive' : 'negative'">
          <span v-if="newCustomerTrend >= 0">↑</span>
          <span v-else>↓</span>
          {{ Math.abs(newCustomerTrend) }}%
        </span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Avg Orders/Customer</span>
        <span class="summary-value">{{ averageOrdersPerCustomer }}</span>
        <span class="summary-trend" :class="avgOrderTrend >= 0 ? 'positive' : 'negative'">
          <span v-if="avgOrderTrend >= 0">↑</span>
          <span v-else>↓</span>
          {{ Math.abs(avgOrderTrend) }}%
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import Chart from 'chart.js/auto'

// Props
const props = defineProps({
  sellerId: {
    type: String,
    required: true
  }
})

// Reactive data
const customerChart = ref(null)
const chartTimeRange = ref('month')
let chartInstance = null

// Data from Firebase (simulated based on CustomersTable.vue structure)
const orders = ref([])
const customers = ref([])
const totalCustomers = ref(0)
const newCustomersThisPeriod = ref(0)
const averageOrdersPerCustomer = ref(0)
const customerTrend = ref(12.5)
const newCustomerTrend = ref(18.3)
const avgOrderTrend = ref(5.7)

// Computed properties for chart data
const chartData = computed(() => {
  return processCustomersForChart(orders.value, chartTimeRange.value)
})

// Methods
const formatNumber = (num) => {
  return parseFloat(num).toFixed(0)
}

// Process customer data for chart (based on CustomersTable.vue logic)
const processCustomersForChart = (ordersData, timeRange) => {
  const now = new Date()
  let labels = []
  let newCustomersData = []
  let returningCustomersData = []
  
  // Track first order date for each customer
  const customerFirstOrder = new Map()
  const customerOrderCounts = new Map()
  
  // Process orders to identify customer patterns
  ordersData.forEach(order => {
    const customerId = order.userId
    const orderDate = getOrderDate(order)
    
    if (!customerFirstOrder.has(customerId)) {
      customerFirstOrder.set(customerId, orderDate)
      customerOrderCounts.set(customerId, 1)
    } else {
      customerOrderCounts.set(customerId, customerOrderCounts.get(customerId) + 1)
    }
  })
  
  switch (timeRange) {
    case 'week':
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(now.getDate() - i)
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
        newCustomersData.push(0)
        returningCustomersData.push(0)
      }
      
      // Count new vs returning customers per day
      ordersData.forEach(order => {
        const orderDate = getOrderDate(order)
        const daysDiff = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24))
        
        if (daysDiff >= 0 && daysDiff < 7) {
          const index = 6 - daysDiff
          const customerId = order.userId
          const firstOrderDate = customerFirstOrder.get(customerId)
          
          // Check if this is customer's first order on this day
          if (firstOrderDate && Math.floor((now - firstOrderDate) / (1000 * 60 * 60 * 24)) === daysDiff) {
            newCustomersData[index]++
          } else if (customerOrderCounts.get(customerId) > 1) {
            returningCustomersData[index]++
          }
        }
      })
      break
      
    case 'month':
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        labels.push(`Week ${4 - i}`)
        newCustomersData.push(0)
        returningCustomersData.push(0)
      }
      
      ordersData.forEach(order => {
        const orderDate = getOrderDate(order)
        const daysDiff = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24))
        
        if (daysDiff >= 0 && daysDiff < 28) {
          const weekIndex = Math.floor(daysDiff / 7)
          if (weekIndex < 4) {
            const index = 3 - weekIndex
            const customerId = order.userId
            const firstOrderDate = customerFirstOrder.get(customerId)
            
            if (firstOrderDate && Math.floor((now - firstOrderDate) / (1000 * 60 * 60 * 24 * 7)) === weekIndex) {
              newCustomersData[index]++
            } else if (customerOrderCounts.get(customerId) > 1) {
              returningCustomersData[index]++
            }
          }
        }
      })
      break
      
    case 'quarter':
      // Last 3 months
      for (let i = 2; i >= 0; i--) {
        const date = new Date()
        date.setMonth(now.getMonth() - i)
        labels.push(date.toLocaleDateString('en-US', { month: 'long' }))
        newCustomersData.push(0)
        returningCustomersData.push(0)
      }
      
      ordersData.forEach(order => {
        const orderDate = getOrderDate(order)
        const monthDiff = (now.getMonth() - orderDate.getMonth()) + 
                          (now.getFullYear() - orderDate.getFullYear()) * 12
        
        if (monthDiff >= 0 && monthDiff < 3) {
          const index = 2 - monthDiff
          const customerId = order.userId
          const firstOrderDate = customerFirstOrder.get(customerId)
          
          const firstOrderMonthDiff = (now.getMonth() - firstOrderDate.getMonth()) + 
                                     (now.getFullYear() - firstOrderDate.getFullYear()) * 12
          
          if (firstOrderMonthDiff === monthDiff) {
            newCustomersData[index]++
          } else if (customerOrderCounts.get(customerId) > 1) {
            returningCustomersData[index]++
          }
        }
      })
      break
      
    case 'year':
      // All 12 months
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      labels = [...months]
      newCustomersData = Array(12).fill(0)
      returningCustomersData = Array(12).fill(0)
      
      const currentYear = now.getFullYear()
      
      ordersData.forEach(order => {
        const orderDate = getOrderDate(order)
        
        if (orderDate.getFullYear() === currentYear) {
          const month = orderDate.getMonth()
          const customerId = order.userId
          const firstOrderDate = customerFirstOrder.get(customerId)
          
          if (firstOrderDate && firstOrderDate.getFullYear() === currentYear && 
              firstOrderDate.getMonth() === month) {
            newCustomersData[month]++
          } else if (customerOrderCounts.get(customerId) > 1) {
            returningCustomersData[month]++
          }
        }
      })
      break
  }
  
  return { labels, newCustomersData, returningCustomersData }
}

// Helper functions (based on CustomersTable.vue)
const getOrderDate = (order) => {
  if (order.createdAt && typeof order.createdAt.toDate === 'function') {
    return order.createdAt.toDate()
  } else if (order.timestamp && typeof order.timestamp.toDate === 'function') {
    return order.timestamp.toDate()
  } else {
    return new Date()
  }
}

// Fetch orders and process customer data (simulated)
const fetchCustomerData = async () => {
  try {
    // Simulate Firebase data fetching
    // In real implementation, this would use the same logic as CustomersTable.vue:
    // const ordersQuery = query(collection(db, 'orders'), where('sellerId', '==', props.sellerId))
    // const ordersSnapshot = await getDocs(ordersQuery)
    
    // Sample data structure matching CustomersTable.vue
    const sampleOrders = [
      {
        id: '1',
        sellerId: props.sellerId,
        userId: 'user1',
        username: 'john_doe',
        productName: 'Fresh Tomatoes',
        totalPrice: 450,
        createdAt: { toDate: () => new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }
      },
      {
        id: '2',
        sellerId: props.sellerId,
        userId: 'user2',
        username: 'jane_smith',
        productName: 'Organic Lettuce',
        totalPrice: 280,
        createdAt: { toDate: () => new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
      },
      {
        id: '3',
        sellerId: props.sellerId,
        userId: 'user1',
        username: 'john_doe',
        productName: 'Sweet Corn',
        totalPrice: 375,
        createdAt: { toDate: () => new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
      },
      {
        id: '4',
        sellerId: props.sellerId,
        userId: 'user3',
        username: 'mike_wilson',
        productName: 'Fresh Carrots',
        totalPrice: 480,
        createdAt: { toDate: () => new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }
      },
      {
        id: '5',
        sellerId: props.sellerId,
        userId: 'user2',
        username: 'jane_smith',
        productName: 'Green Beans',
        totalPrice: 330,
        createdAt: { toDate: () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      {
        id: '6',
        sellerId: props.sellerId,
        userId: 'user4',
        username: 'sarah_jones',
        productName: 'Bell Peppers',
        totalPrice: 220,
        createdAt: { toDate: () => new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }
      },
      {
        id: '7',
        sellerId: props.sellerId,
        userId: 'user1',
        username: 'john_doe',
        productName: 'Cucumber',
        totalPrice: 150,
        createdAt: { toDate: () => new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) }
      }
    ]
    
    orders.value = sampleOrders
    
    // Process customer data (matching CustomersTable.vue logic)
    const customerMap = new Map()
    
    sampleOrders.forEach(order => {
      if (!customerMap.has(order.userId)) {
        customerMap.set(order.userId, {
          userId: order.userId,
          username: order.username,
          orderCount: 0,
          totalSpent: 0,
          firstOrderDate: getOrderDate(order)
        })
      }
      
      const customer = customerMap.get(order.userId)
      customer.orderCount++
      customer.totalSpent += order.totalPrice
      
      // Update first order date if this order is earlier
      const orderDate = getOrderDate(order)
      if (orderDate < customer.firstOrderDate) {
        customer.firstOrderDate = orderDate
      }
    })
    
    customers.value = Array.from(customerMap.values())
    totalCustomers.value = customers.value.length
    
    // Calculate new customers this period
    const now = new Date()
    const periodStart = new Date()
    
    switch (chartTimeRange.value) {
      case 'week':
        periodStart.setDate(now.getDate() - 7)
        break
      case 'month':
        periodStart.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        periodStart.setMonth(now.getMonth() - 3)
        break
      case 'year':
        periodStart.setFullYear(now.getFullYear() - 1)
        break
    }
    
    newCustomersThisPeriod.value = customers.value.filter(customer => 
      customer.firstOrderDate >= periodStart
    ).length
    
    // Calculate average orders per customer
    const totalOrders = customers.value.reduce((sum, customer) => sum + customer.orderCount, 0)
    averageOrdersPerCustomer.value = customers.value.length > 0 
      ? Math.round((totalOrders / customers.value.length) * 10) / 10 
      : 0
    
  } catch (error) {
    console.error("Error fetching customer data:", error)
  }
}

const initChart = () => {
  if (!customerChart.value) return
  
  const ctx = customerChart.value.getContext('2d')
  const { labels, newCustomersData, returningCustomersData } = chartData.value
  
  if (chartInstance) {
    chartInstance.destroy()
  }
  
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'New Customers',
          data: newCustomersData,
          backgroundColor: 'rgba(46, 92, 49, 0.8)',
          borderColor: '#2e5c31',
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false
        },
        {
          label: 'Returning Customers',
          data: returningCustomersData,
          backgroundColor: 'rgba(74, 143, 77, 0.8)',
          borderColor: '#4a8f4d',
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#2e5c31',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.raw} customers`
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          grid: {
            display: false
          },
          ticks: {
            color: '#6b7280',
            font: {
              size: 12
            }
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            color: '#6b7280',
            font: {
              size: 12
            },
            stepSize: 1,
            callback: function(value) {
              return Math.floor(value)
            }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  })
}

const updateChartData = () => {
  fetchCustomerData()
}

// Lifecycle
onMounted(async () => {
  await fetchCustomerData()
  initChart()
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})

// Watch for changes
watch(() => props.sellerId, async () => {
  await fetchCustomerData()
  initChart()
})

watch(chartData, () => {
  initChart()
}, { deep: true })
</script>

<style scoped>
.customer-overview-graph {
  background-color: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  overflow: hidden; /* avoid inner elements bleeding outside rounded corners */
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.chart-title h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.chart-title p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.chart-legend {
  display: flex;
  gap: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: #6b7280;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.time-filter {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background-color: #fff;
  color: #111827;
  cursor: pointer;
  transition: border-color 0.2s;
}

.time-filter:focus {
  outline: none;
  border-color: #2e5c31;
  box-shadow: 0 0 0 3px rgba(46, 92, 49, 0.1);
}

.chart-container {
  position: relative;
  height: 320px;
  margin-bottom: 24px;
}

.chart-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 16px;
  background-color: #f9fafb;
  border-radius: 8px;
}

.summary-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.summary-trend {
  font-size: 0.8rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 2px;
}

.summary-trend.positive {
  color: #2e5c31;
}

.summary-trend.negative {
  color: #ef4444;
}

/* Responsive design */
@media (max-width: 768px) {
  .customer-overview-graph {
    padding: 16px; /* tighter card padding on phones */
  }

  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .chart-controls {
    width: 100%;
    justify-content: space-between;
    gap: 12px;
  }

  .chart-legend {
    flex-wrap: wrap;
    gap: 12px;
  }

  .chart-container {
    height: clamp(220px, 45vh, 320px); /* scale with viewport but cap to keep summary visible */
    -webkit-overflow-scrolling: touch;
  }

  .chart-summary {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .summary-item {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    text-align: left;
  }

  .summary-trend {
    margin-left: auto;
  }
}

@media (max-width: 480px) {
  .customer-overview-graph {
  padding: 14px; /* a bit tighter on very small devices */
  }

  .chart-container {
  height: clamp(200px, 42vh, 280px);
  }

  .chart-title h3 {
    font-size: 1.125rem;
  }

  .time-filter {
    padding: 6px 10px;
    font-size: 0.8rem;
  width: 100%; /* full width select for narrow screens to avoid overlap */
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .customer-overview-graph {
    background-color: #1f2937;
    border-color: #374151;
  }

  .chart-title h3 {
    color: #f9fafb;
  }

  .chart-title p,
  .legend-item,
  .summary-label {
    color: #9ca3af;
  }

  .summary-value {
    color: #f9fafb;
  }

  .time-filter {
    background-color: #374151;
    border-color: #4b5563;
    color: #f9fafb;
  }

  .chart-summary {
    border-color: #374151;
  }

  .summary-item {
    background-color: #374151;
  }
}
</style>