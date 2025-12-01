<template>
  <div class="sales-revenue-overview">
    <div class="chart-header">
      <div class="chart-title">
        <h3>Sales Revenue Overview</h3>
        <p>Track your revenue performance over time</p>
      </div>
      <div class="chart-controls">
        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-color" style="background-color: #2e5c31;"></span>
            <span>Revenue</span>
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background-color: #4a8f4d;"></span>
            <span>Profit</span>
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
      <canvas ref="revenueChart"></canvas>
    </div>
    
    <div class="chart-summary">
      <div class="summary-item">
        <span class="summary-label">Total Revenue</span>
        <span class="summary-value">₱{{ formatNumber(totalRevenue) }}</span>
        <span class="summary-trend" :class="revenueTrend >= 0 ? 'positive' : 'negative'">
          <span v-if="revenueTrend >= 0">↑</span>
          <span v-else>↓</span>
          {{ Math.abs(revenueTrend) }}%
        </span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Total Profit</span>
        <span class="summary-value">₱{{ formatNumber(totalProfit) }}</span>
        <span class="summary-trend" :class="profitTrend >= 0 ? 'positive' : 'negative'">
                  <span v-if="profitTrend >= 0">↑</span>
                  <span v-else>↓</span>
          {{ Math.abs(profitTrend) }}%
        </span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Profit Margin</span>
        <span class="summary-value">{{ profitMargin }}%</span>
        <span class="summary-trend" :class="marginTrend >= 0 ? 'positive' : 'negative'">
          <span v-if="marginTrend >= 0">↑</span>
          <span v-else>↓</span>
          {{ Math.abs(marginTrend) }}%
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
import { normalizeOrdersForSeller, getPriceFromEntry, STATUS_WHITELIST } from '@/helpers/salesUtils'

// Props
const props = defineProps({
  sellerId: {
    type: String,
    required: true
  },
  currency: {
    type: String,
    default: '₱'
  }
})

// Reactive data
const revenueChart = ref(null)
const chartTimeRange = ref('month')
let chartInstance = null

// Data from Firebase (simulated based on Analytics.vue structure)
const orders = ref([])
const totalRevenue = ref(0)
const totalProfit = ref(0)
const profitMargin = ref(0)
const revenueTrend = ref(0)
const profitTrend = ref(0)
const marginTrend = ref(0)
// Some orders may reference the seller document ID instead of the auth UID
const sellerDocId = ref('')

// Computed properties for chart data
const chartData = computed(() => {
  return processOrdersForChart(orders.value, chartTimeRange.value)
})

// Methods
const formatNumber = (num) => {
  return parseFloat(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

// Process orders data for chart (based on Analytics.vue logic)
const processOrdersForChart = (ordersData, timeRange) => {
  const now = new Date()
  let labels = []
  let revenueData = []
  let profitData = []
  
  switch (timeRange) {
    case 'week':
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(now.getDate() - i)
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
        revenueData.push(0)
        profitData.push(0)
      }
      
      // Populate data for each day
      ordersData.forEach(order => {
        let orderDate = getOrderDate(order)
        const daysDiff = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24))
        
        if (daysDiff >= 0 && daysDiff < 7) {
          const index = 6 - daysDiff
          const itemPrice = getOrderPrice(order)
          revenueData[index] += itemPrice
          profitData[index] += itemPrice * 0.3 // 30% profit margin
        }
      })
      break
      
    case 'month':
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        labels.push(`Week ${4 - i}`)
        revenueData.push(0)
        profitData.push(0)
      }
      
      ordersData.forEach(order => {
        let orderDate = getOrderDate(order)
        const daysDiff = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24))
        
        if (daysDiff >= 0 && daysDiff < 28) {
          const weekIndex = Math.floor(daysDiff / 7)
          if (weekIndex < 4) {
            const index = 3 - weekIndex
            const itemPrice = getOrderPrice(order)
            revenueData[index] += itemPrice
            profitData[index] += itemPrice * 0.3
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
        revenueData.push(0)
        profitData.push(0)
      }
      
      ordersData.forEach(order => {
        let orderDate = getOrderDate(order)
        const monthDiff = (now.getMonth() - orderDate.getMonth()) + 
                          (now.getFullYear() - orderDate.getFullYear()) * 12
        
        if (monthDiff >= 0 && monthDiff < 3) {
          const index = 2 - monthDiff
          const itemPrice = getOrderPrice(order)
          revenueData[index] += itemPrice
          profitData[index] += itemPrice * 0.3
        }
      })
      break
      
    case 'year':
      // All 12 months
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      labels = [...months]
      revenueData = Array(12).fill(0)
      profitData = Array(12).fill(0)
      
      const currentYear = now.getFullYear()
      
      ordersData.forEach(order => {
        let orderDate = getOrderDate(order)
        
        if (orderDate.getFullYear() === currentYear) {
          const month = orderDate.getMonth()
          const itemPrice = getOrderPrice(order)
          revenueData[month] += itemPrice
          profitData[month] += itemPrice * 0.3
        }
      })
      break
  }
  
  return { labels, revenueData, profitData }
}

const getOrderDate = (order) => {
  if (order.normalizedDate instanceof Date) return order.normalizedDate
  if (order.timestamp && typeof order.timestamp.toDate === 'function') return order.timestamp.toDate()
  if (order.createdAt && typeof order.createdAt.toDate === 'function') return order.createdAt.toDate()
  if (order.timestamp || order.createdAt) return (order.timestamp ?? order.createdAt)
  return new Date()
}

const getOrderPrice = (order) => {
  return getPriceFromEntry(order)
}

// Fetch orders from Firebase for the logged-in seller
const fetchOrders = async () => {
  try {
    if (!props.sellerId) {
      orders.value = []
      totalRevenue.value = 0
      totalProfit.value = 0
      profitMargin.value = 0
      revenueTrend.value = 0
      profitTrend.value = 0
      marginTrend.value = 0
      return
    }

    const ordersRef = collection(db, 'orders')

    const tryQueryByField = async (field, value) => {
      try {
        // Prefer timestamp desc; fall back to createdAt; then no orderBy
        try {
          const snap = await getDocs(query(ordersRef, where(field, '==', value), orderBy('timestamp', 'desc'), limit(500)))
          return snap.docs
        } catch (e1) {
          try {
            const snap = await getDocs(query(ordersRef, where(field, '==', value), orderBy('createdAt', 'desc'), limit(500)))
            return snap.docs
          } catch (e2) {
            const snap = await getDocs(query(ordersRef, where(field, '==', value), limit(500)))
            return snap.docs
          }
        }
      } catch (_) {
        return []
      }
    }

    // Build candidate seller IDs: auth UID and (if found) seller document ID
    const candidates = [props.sellerId].concat(sellerDocId.value ? [sellerDocId.value] : [])
    const seen = new Set()
    const aggregated = []

    for (const id of candidates) {
      // Try common field names first
      let docs = await tryQueryByField('sellerId', id)
      if (!docs.length) docs = await tryQueryByField('sellerID', id)
      if (!docs.length) docs = await tryQueryByField('sellerUid', id)
      if (!docs.length) docs = await tryQueryByField('sellerUID', id)

      // If still empty, fetch recent orders and extract items that belong to this seller
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
        const normalized = normalizeOrdersForSeller(recentSnap.docs, id, { statusWhitelist: STATUS_WHITELIST })
        for (const e of normalized) {
          const key = String(e.id)
          if (seen.has(key)) continue
          seen.add(key)
          aggregated.push(e)
        }
      } else {
        const normalized = normalizeOrdersForSeller(docs, id, { statusWhitelist: STATUS_WHITELIST })
        for (const e of normalized) {
          const key = String(e.id)
          if (seen.has(key)) continue
          seen.add(key)
          aggregated.push(e)
        }
      }
    }

    orders.value = aggregated

    // Totals (30% profit heuristic unless real profit is present)
    let totalSalesValue = 0
    let totalProfitValue = 0
    orders.value.forEach(entry => {
      const price = getOrderPrice(entry)
      totalSalesValue += price
      const explicitProfit = typeof entry.profit === 'number' ? entry.profit : null
      totalProfitValue += explicitProfit !== null ? explicitProfit : price * 0.3
    })

    totalRevenue.value = totalSalesValue
    totalProfit.value = totalProfitValue
    profitMargin.value = totalSalesValue > 0 ? Math.round((totalProfitValue / totalSalesValue) * 100) : 0

    // Recompute trends from chart series after orders change
    recomputeSummaryFromChartData()
  } catch (error) {
    console.error('Error fetching orders:', error)
    orders.value = []
    totalRevenue.value = 0
    totalProfit.value = 0
    profitMargin.value = 0
    revenueTrend.value = 0
    profitTrend.value = 0
    marginTrend.value = 0
  }
}

const initChart = () => {
  if (!revenueChart.value) return
  
  const ctx = revenueChart.value.getContext('2d')
  const { labels, revenueData, profitData } = chartData.value
  
  if (chartInstance) {
    chartInstance.destroy()
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
          pointBackgroundColor: '#2e5c31',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'Profit',
          data: profitData,
          borderColor: '#4a8f4d',
          backgroundColor: 'rgba(74, 143, 77, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#4a8f4d',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
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
              return `${context.dataset.label}: ${props.currency}${formatNumber(context.raw)}`
            }
          }
        }
      },
      scales: {
        x: {
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
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            color: '#6b7280',
            font: {
              size: 12
            },
            callback: function(value) {
              return props.currency + formatNumber(value)
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

const computeTrend = (series) => {
  if (!series || series.length < 2) return 0
  const prev = Number(series[series.length - 2] || 0)
  const curr = Number(series[series.length - 1] || 0)
  if (prev === 0) return curr > 0 ? 100 : 0
  return Math.round(((curr - prev) / prev) * 1000) / 10
}

const recomputeSummaryFromChartData = () => {
  const { revenueData, profitData } = chartData.value
  const totalRev = revenueData.reduce((a, b) => a + b, 0)
  const totalProf = profitData.reduce((a, b) => a + b, 0)
  totalRevenue.value = totalRev
  totalProfit.value = totalProf
  profitMargin.value = totalRev > 0 ? Math.round((totalProf / totalRev) * 100) : 0
  revenueTrend.value = computeTrend(revenueData)
  profitTrend.value = computeTrend(profitData)
  const prevRev = revenueData.length > 1 ? revenueData[revenueData.length - 2] : 0
  const prevProf = profitData.length > 1 ? profitData[profitData.length - 2] : 0
  const prevMargin = prevRev > 0 ? (prevProf / prevRev) * 100 : 0
  marginTrend.value = Math.round((profitMargin.value - prevMargin) * 10) / 10
}

const updateChartData = () => {
  recomputeSummaryFromChartData()
  initChart()
}

// Lifecycle
onMounted(async () => {
  // Attempt to find the seller document ID for this userId to ensure we include orders that reference it
  try {
    const sellersRef = collection(db, 'sellers')
    const snap = await getDocs(query(sellersRef, where('userId', '==', props.sellerId), limit(1)))
    if (!snap.empty) sellerDocId.value = snap.docs[0].id
  } catch (_) {}

  await fetchOrders()
  initChart()
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})

// Watch for changes
watch(() => props.sellerId, async () => {
  try {
    sellerDocId.value = ''
    const sellersRef = collection(db, 'sellers')
    const snap = await getDocs(query(sellersRef, where('userId', '==', props.sellerId), limit(1)))
    if (!snap.empty) sellerDocId.value = snap.docs[0].id
  } catch (_) {}
  await fetchOrders()
  initChart()
})

watch(chartData, () => {
  updateChartData()
}, { deep: true })
</script>

<style scoped>
.sales-revenue-overview {
  background-color: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
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
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .chart-controls {
    width: 100%;
    justify-content: space-between;
  }

  .chart-legend {
    flex-wrap: wrap;
    gap: 12px;
  }

  .chart-container {
    height: 280px;
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
  .sales-revenue-overview {
    padding: 16px;
  }

  .chart-container {
    height: 240px;
  }

  .chart-title h3 {
    font-size: 1.125rem;
  }

  .time-filter {
    padding: 6px 10px;
    font-size: 0.8rem;
  }
}

/* Intentionally omit prefers-color-scheme overrides so the card stays light even when the OS is in dark mode */
</style>