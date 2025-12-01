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
import { db } from '@/firebase/firebaseConfig'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'

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

// Data from Firebase
const orders = ref([]) // normalized entries per seller: { userId, normalizedDate, totalPrice }
const customers = ref([])
const totalCustomers = ref(0)
const newCustomersThisPeriod = ref(0)
const averageOrdersPerCustomer = ref(0)
const customerTrend = ref(0)
const newCustomerTrend = ref(0)
const avgOrderTrend = ref(0)

// Computed properties for chart data
const chartData = computed(() => {
  return processCustomersForChart(orders.value, chartTimeRange.value)
})

// Helper functions (date + id normalization)
const toJSDate = (value) => {
  try {
    if (!value) return new Date()
    if (typeof value?.toDate === 'function') return value.toDate()
    if (typeof value === 'number') return new Date(value)
    if (typeof value === 'string') return new Date(value)
    if (typeof value === 'object' && typeof value.seconds === 'number') return new Date(value.seconds * 1000)
  } catch (_) {}
  return new Date()
}

const getOrderDate = (order) => {
  if (order.normalizedDate instanceof Date) return order.normalizedDate
  if (order.createdAt && typeof order.createdAt.toDate === 'function') {
    return order.createdAt.toDate()
  } else if (order.timestamp && typeof order.timestamp.toDate === 'function') {
    return order.timestamp.toDate()
  } else if (order.createdAt || order.timestamp) {
    return toJSDate(order.createdAt || order.timestamp)
  } else {
    return new Date()
  }
}

const getCustomerId = (dataOrItem) => (
  dataOrItem.userId || dataOrItem.customerId || dataOrItem.buyerId || dataOrItem.uid || dataOrItem.userUID || null
)

// Normalize docs to seller-specific order entries { userId, normalizedDate, totalPrice }
const normalizeOrdersForSeller = (docs, sellerId) => {
  const entries = []
  docs.forEach(d => {
    const data = d.data ? d.data() : d
    const baseDate = data.timestamp || data.createdAt || data.date || null
    const normalizedDate = toJSDate(baseDate)

    const sellerFields = [data.sellerId, data.sellerID, data.sellerUid, data.sellerUID]
    const userId = getCustomerId(data)
    // Whole order belongs to seller
    if (sellerFields.includes(sellerId)) {
      entries.push({
        id: d.id,
        userId,
        normalizedDate,
        totalPrice: Number(data.totalPrice) || Number(data.amount) || Number(data.orderTotal) || 0,
        createdAt: data.createdAt,
        timestamp: data.timestamp
      })
      return
    }

    // Otherwise, extract from items belonging to this seller
    const items = data.items || data.orderItems || data.cartItems || []
    items.forEach((it, idx) => {
      const itSeller = it.sellerId || it.sellerID || it.sellerUid || it.sellerUID
      if (itSeller === sellerId) {
        const itemUser = getCustomerId(data) || getCustomerId(it)
        const price = (
          Number(it.totalPrice) ||
          (Number(it.price) * Number(it.quantity || 1)) ||
          (Number(it.unitPrice) * Number(it.quantity || 1)) ||
          Number(it.amount) || 0
        )
        entries.push({
          id: `${d.id}_${idx}`,
          userId: itemUser,
          normalizedDate,
          totalPrice: price,
          createdAt: data.createdAt,
          timestamp: data.timestamp
        })
      }
    })
  })
  // filter out entries without a customer id
  return entries.filter(e => !!e.userId)
}

// Compute trends helper (% change of last two points)
const computeTrend = (series) => {
  if (!series || series.length < 2) return 0
  const prev = Number(series[series.length - 2] || 0)
  const curr = Number(series[series.length - 1] || 0)
  if (prev === 0) return curr > 0 ? 100 : 0
  return Math.round(((curr - prev) / prev) * 1000) / 10
}

// Process customer data for chart using unique customers per bucket
const processCustomersForChart = (ordersData, timeRange) => {
  const now = new Date()

  // Build earliest first-order date per customer
  const firstOrderByCustomer = new Map()
  ordersData.forEach(o => {
    const cid = o.userId
    if (!cid) return
    const d = getOrderDate(o)
    const prev = firstOrderByCustomer.get(cid)
    if (!prev || d < prev) firstOrderByCustomer.set(cid, d)
  })

  // Helper to build buckets with start/end
  const buckets = []
  const labels = []
  const pushBucket = (label, start, end) => { buckets.push({ start, end }); labels.push(label) }

  const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x }
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }

  switch (timeRange) {
    case 'week': {
      // Oldest to newest: 7 daily buckets
      const todayStart = startOfDay(now)
      for (let i = 6; i >= 0; i--) {
        const start = addDays(todayStart, -i)
        const end = addDays(start, 1)
        pushBucket(start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), start, end)
      }
      break
    }
    case 'month': {
      // 4 weekly buckets (oldest to newest)
      const end0 = startOfDay(addDays(now, 1))
      for (let i = 3; i >= 0; i--) {
        const end = addDays(end0, -(i * 7))
        const start = addDays(end, -7)
        pushBucket(`Week ${4 - i}`, start, end)
      }
      break
    }
    case 'quarter': {
      // 3 monthly buckets
      for (let i = 2; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const start = new Date(d.getFullYear(), d.getMonth(), 1)
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
        pushBucket(d.toLocaleDateString('en-US', { month: 'long' }), start, end)
      }
      break
    }
    case 'year': {
      // 12 months of current year
      for (let m = 0; m < 12; m++) {
        const start = new Date(now.getFullYear(), m, 1)
        const end = new Date(now.getFullYear(), m + 1, 1)
        const label = start.toLocaleDateString('en-US', { month: 'short' })
        pushBucket(label, start, end)
      }
      break
    }
  }

  // Sets of unique customers per bucket
  const customersInBucket = buckets.map(() => new Set())
  ordersData.forEach(o => {
    const cid = o.userId
    if (!cid) return
    const d = getOrderDate(o)
    for (let i = 0; i < buckets.length; i++) {
      const b = buckets[i]
      if (d >= b.start && d < b.end) {
        customersInBucket[i].add(cid)
        break
      }
    }
  })

  const newCustomersData = new Array(buckets.length).fill(0)
  const returningCustomersData = new Array(buckets.length).fill(0)

  for (let i = 0; i < buckets.length; i++) {
    const b = buckets[i]
    const set = customersInBucket[i]
    let newCount = 0
    let returningCount = 0
    set.forEach(cid => {
      const first = firstOrderByCustomer.get(cid)
      if (!first) return
      if (first >= b.start && first < b.end) newCount++
      else if (first < b.start) returningCount++
    })
    newCustomersData[i] = newCount
    returningCustomersData[i] = returningCount
  }

  return { labels, newCustomersData, returningCustomersData }
}

// Fetch orders and process customer data
const fetchCustomerData = async () => {
  try {
    if (!props.sellerId) {
      orders.value = []
      customers.value = []
      totalCustomers.value = 0
      newCustomersThisPeriod.value = 0
      averageOrdersPerCustomer.value = 0
      customerTrend.value = 0
      newCustomerTrend.value = 0
      avgOrderTrend.value = 0
      return
    }

    const ordersRef = collection(db, 'orders')
    const tryQueryByField = async (field) => {
      try {
        try {
          const snap = await getDocs(query(ordersRef, where(field, '==', props.sellerId), orderBy('timestamp', 'desc'), limit(500)))
          return snap.docs
        } catch (e1) {
          try {
            const snap = await getDocs(query(ordersRef, where(field, '==', props.sellerId), orderBy('createdAt', 'desc'), limit(500)))
            return snap.docs
          } catch (e2) {
            const snap = await getDocs(query(ordersRef, where(field, '==', props.sellerId), limit(500)))
            return snap.docs
          }
        }
      } catch (_) { return [] }
    }

    let docs = await tryQueryByField('sellerId')
    if (!docs.length) docs = await tryQueryByField('sellerID')
    if (!docs.length) docs = await tryQueryByField('sellerUid')
    if (!docs.length) docs = await tryQueryByField('sellerUID')

    if (!docs.length) {
      let recentSnap
      try {
        recentSnap = await getDocs(query(ordersRef, orderBy('timestamp', 'desc'), limit(500)))
      } catch (e3) {
        try {
          recentSnap = await getDocs(query(ordersRef, orderBy('createdAt', 'desc'), limit(500)))
        } catch (e4) {
          recentSnap = await getDocs(query(ordersRef, limit(500)))
        }
      }
      orders.value = normalizeOrdersForSeller(recentSnap.docs, props.sellerId)
    } else {
      orders.value = normalizeOrdersForSeller(docs, props.sellerId)
    }

    // Build customer aggregates
    const customerMap = new Map()
    orders.value.forEach(o => {
      const id = o.userId
      if (!customerMap.has(id)) {
        customerMap.set(id, {
          userId: id,
          orderCount: 0,
          totalSpent: 0,
          firstOrderDate: getOrderDate(o)
        })
      }
      const c = customerMap.get(id)
      c.orderCount += 1
      c.totalSpent += Number(o.totalPrice) || 0
      const d = getOrderDate(o)
      if (d < c.firstOrderDate) c.firstOrderDate = d
    })

    customers.value = Array.from(customerMap.values())
    totalCustomers.value = customers.value.length

    // Calculate new customers this period
    const now = new Date()
    const periodStart = new Date()
    switch (chartTimeRange.value) {
      case 'week': periodStart.setDate(now.getDate() - 7); break
      case 'month': periodStart.setMonth(now.getMonth() - 1); break
      case 'quarter': periodStart.setMonth(now.getMonth() - 3); break
      case 'year': periodStart.setFullYear(now.getFullYear() - 1); break
    }
    newCustomersThisPeriod.value = customers.value.filter(c => c.firstOrderDate >= periodStart).length

    // Average orders per customer
    const totalOrders = customers.value.reduce((sum, c) => sum + c.orderCount, 0)
    averageOrdersPerCustomer.value = customers.value.length > 0
      ? Math.round((totalOrders / customers.value.length) * 10) / 10
      : 0

    // Compute trends from chart series
    const { newCustomersData, returningCustomersData } = processCustomersForChart(orders.value, chartTimeRange.value)
    customerTrend.value = computeTrend(newCustomersData.map((v, i) => v + returningCustomersData[i]))
    newCustomerTrend.value = computeTrend(newCustomersData)
    // Proxy for avg orders trend: use total orders/labels
    const totalPerBucket = newCustomersData.map((v, i) => v + returningCustomersData[i])
    const avgSeries = totalPerBucket.map(v => customers.value.length ? v / customers.value.length : 0)
    avgOrderTrend.value = computeTrend(avgSeries)

  } catch (error) {
    console.error('Error fetching customer data:', error)
    orders.value = []
    customers.value = []
    totalCustomers.value = 0
    newCustomersThisPeriod.value = 0
    averageOrdersPerCustomer.value = 0
    customerTrend.value = 0
    newCustomerTrend.value = 0
    avgOrderTrend.value = 0
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

:global(.dark) .customer-overview-graph {
  background-color: #1f2937;
  border-color: #374151;
}

:global(.dark) .customer-overview-graph .chart-title h3 {
  color: #f9fafb;
}

:global(.dark) .customer-overview-graph .chart-title p,
:global(.dark) .customer-overview-graph .legend-item,
:global(.dark) .customer-overview-graph .summary-label {
  color: #9ca3af;
}

:global(.dark) .customer-overview-graph .summary-value {
  color: #f9fafb;
}

:global(.dark) .customer-overview-graph .time-filter {
  background-color: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}

:global(.dark) .customer-overview-graph .chart-summary {
  border-color: #374151;
}

:global(.dark) .customer-overview-graph .summary-item {
  background-color: #374151;
}
</style>