<template>
  <div class="top-products-container">
    <div class="header">
      <div class="title-section">
        <h2>Top Selling Products</h2>
        <p>Best performing products based on sales volume</p>
      </div>
      <div class="time-filter">
        <select v-model="selectedPeriod" @change="fetchTopProducts" class="period-select">
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>
    </div>

    <div class="products-list" v-if="!loading && topProducts.length > 0">
      <div 
        v-for="(product, index) in topProducts" 
        :key="product.productName"
        class="product-item"
        :style="{ '--item-color': chartColors[index] }"
      >
        <div class="product-rank">{{ index + 1 }}</div>
        <div class="product-image">
          <img :src="getProductImage(product)" alt="Product image">
        </div>
        <div class="product-info">
          <h4 class="product-name">{{ product.productName }}</h4>
          <p class="product-category">{{ product.category }}</p>
          <div class="product-stats">
            <div class="stat">
              <span class="stat-label">Unit Price</span>
              <span class="stat-value">₱{{ formatNumber(product.unitPrice) }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Profit</span>
              <span class="stat-value">₱{{ formatNumber(product.profit) }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Sold</span>
              <span class="stat-value">{{ product.sold }} {{ getUnitDisplay(product.unit) }}</span>
            </div>
          </div>
        </div>
        <div class="product-bar">
          <div 
            class="bar-fill" 
            :style="{ 
              width: `${(product.sold / maxSold) * 100}%`,
              backgroundColor: chartColors[index]
            }"
          ></div>
        </div>
      </div>
    </div>

    <div v-else-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading top products...</p>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">📊</div>
      <h3>No Sales Data</h3>
      <p>No product sales found for the selected period.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db, auth } from '@/firebase/firebaseConfig'

// Props
const props = defineProps({
  sellerId: {
    type: String,
    default: null
  }
})

// Reactive data
const topProducts = ref([])
const orders = ref([])
const loading = ref(true)
const selectedPeriod = ref('month')
const currentSellerId = ref('')

// Unit display mapping (same as Analytics.vue)
const unitDisplayMap = {
  'kg': 'Kilogram',
  'sack': 'Sack',
  'tali': 'Tali',
  'kaing': 'Kaing',
  'bundle': 'Bundle',
  'tray': 'Tray',
  'piece': 'Piece',
  'perKilo': 'Kilogram',
  'perSack': 'Sack',
  'perTali': 'Tali',
  'perKaing': 'Kaing',
  'perBundle': 'Bundle',
  'perTray': 'Tray',
  'perPiece': 'Piece'
}

// Chart colors for top 5
const chartColors = [
  '#2e5c31', '#4a8f4d', '#6abe6e', '#8bc88f', '#acd2b0'
]

// Computed
const maxSold = computed(() => {
  return topProducts.value.length > 0 
    ? Math.max(...topProducts.value.map(p => p.sold))
    : 0
})

// Helper function to get unit display name (same as Analytics.vue)
const getUnitDisplay = (unit) => {
  return unitDisplayMap[unit] || unit || 'Unit'
}

// Helper function to get product image (same as Analytics.vue)
const getProductImage = (product) => {
  // Check for image field first
  if (product.image && product.image.trim() !== '') {
    return product.image
  }
  
  // Check for images array
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0]
  }
  
  // Check for productImage field
  if (product.productImage && product.productImage.trim() !== '') {
    return product.productImage
  }
  
  // Return placeholder
  return '/placeholder.svg?height=200&width=200'
}

// Format number with commas (same as Analytics.vue)
const formatNumber = (num) => {
  return parseFloat(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

// Fetch orders from Firebase - filtered by sellerId (same logic as Analytics.vue)
const fetchOrders = async () => {
  try {
    if (!currentSellerId.value) return
    
    const ordersQuery = query(
      collection(db, "orders"),
      where("sellerId", "==", currentSellerId.value)
    )
    
    const ordersSnapshot = await getDocs(ordersQuery)
    const ordersList = []
    
    ordersSnapshot.forEach((doc) => {
      const orderData = doc.data()
      ordersList.push({
        id: doc.id,
        ...orderData
      })
    })
    
    orders.value = ordersList
    
  } catch (error) {
    console.error("Error fetching orders:", error)
  }
}

// Calculate top selling products based on orders (same logic as Analytics.vue)
const calculateTopProducts = () => {
  const productSales = {}
  
  // Filter orders by selected time period
  const filteredOrders = filterOrdersByPeriod(orders.value)
  
  filteredOrders.forEach(order => {
    // Skip cancelled orders
    if (order.status === 'Cancelled') return
    
    const productName = order.productName
    if (!productSales[productName]) {
      productSales[productName] = {
        productName: productName,
        category: order.category || 'Other',
        unitPrice: order.unitPrice || 0,
        unit: order.unit || 'piece',
        sold: 0,
        profit: 0,
        image: order.productImage || '',
        productImage: order.productImage || ''
      }
    }
    
    // Add quantity sold
    productSales[productName].sold += order.quantity || 0
    
    // Add profit (simplified calculation - same as Analytics.vue)
    const itemPrice = order.itemPrice || (order.unitPrice * order.quantity) || order.totalPrice || 0
    productSales[productName].profit += itemPrice * 0.3 // Assume 30% profit margin
  })
  
  // Convert to array and sort by quantity sold - TOP 5 ONLY
  topProducts.value = Object.values(productSales)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5) // Top 5 products only
}

// Filter orders by time period (same logic as Analytics.vue)
const filterOrdersByPeriod = (ordersList) => {
  const now = new Date()
  let startDate = new Date()
  
  switch (selectedPeriod.value) {
    case 'today':
      startDate.setHours(0, 0, 0, 0)
      break
    case 'week':
      startDate.setDate(now.getDate() - 7)
      break
    case 'month':
      startDate.setMonth(now.getMonth() - 1)
      break
    case 'quarter':
      startDate.setMonth(now.getMonth() - 3)
      break
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1)
      break
  }
  
  return ordersList.filter(order => {
    let orderDate
    if (order.createdAt && typeof order.createdAt.toDate === 'function') {
      orderDate = order.createdAt.toDate()
    } else if (order.timestamp && typeof order.timestamp.toDate === 'function') {
      orderDate = order.timestamp.toDate()
    } else {
      orderDate = new Date()
    }
    return orderDate >= startDate
  })
}

// Fetch top products
const fetchTopProducts = async () => {
  loading.value = true
  
  try {
    await fetchOrders()
    calculateTopProducts()
  } catch (error) {
    console.error('Error fetching top products:', error)
  } finally {
    loading.value = false
  }
}

// Watch for sellerId changes
watch(() => props.sellerId, (newSellerId) => {
  if (newSellerId) {
    currentSellerId.value = newSellerId
    fetchTopProducts()
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  // Get current user/seller ID (same as Analytics.vue)
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentSellerId.value = props.sellerId || user.uid
      fetchTopProducts()
    }
  })
})
</script>

<style scoped>
.top-products-container {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.title-section h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px 0;
}

.title-section p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.time-filter {
  display: flex;
  align-items: center;
}

.period-select {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #f9fafb;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  outline: none;
  transition: all 0.2s;
}

.period-select:focus {
  border-color: #2e5c31;
  box-shadow: 0 0 0 2px rgba(46, 92, 49, 0.1);
}

.products-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.product-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background-color: #f9fafb;
  border-radius: 8px;
  transition: all 0.2s;
}

.product-item:hover {
  background-color: #f3f4f6;
  transform: translateY(-1px);
}

.product-rank {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: var(--item-color);
  color: white;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.product-image {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-category {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.product-stats {
  display: flex;
  gap: 16px;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.7rem;
  color: #6b7280;
}

.stat-value {
  font-size: 0.8rem;
  font-weight: 600;
  color: #111827;
}

.product-bar {
  width: 100px;
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  flex: 1;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #2e5c31;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state p {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  flex: 1;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.empty-state p {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

/* Dark mode styles */
:global(.dark) .top-products-container {
  background-color: #1f2937;
}

:global(.dark) .title-section h2 {
  color: #f9fafb;
}

:global(.dark) .title-section p {
  color: #9ca3af;
}

:global(.dark) .period-select {
  background-color: #374151;
  border-color: #4b5563;
  color: #e5e7eb;
}

:global(.dark) .product-item {
  background-color: #374151;
}

:global(.dark) .product-item:hover {
  background-color: #4b5563;
}

:global(.dark) .product-name {
  color: #f9fafb;
}

:global(.dark) .product-category {
  color: #9ca3af;
}

:global(.dark) .stat-label {
  color: #9ca3af;
}

:global(.dark) .stat-value {
  color: #f9fafb;
}

:global(.dark) .product-bar {
  background-color: #4b5563;
}

:global(.dark) .loading-state p,
:global(.dark) .empty-state p {
  color: #9ca3af;
}

:global(.dark) .empty-state h3 {
  color: #f9fafb;
}

/* Responsive styles */
@media (max-width: 768px) {
  .top-products-container {
    padding: 16px;
  }
  
  .header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .product-item {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .product-bar {
    width: 100%;
    order: 3;
  }
  
  .product-stats {
    justify-content: space-between;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .product-item {
    padding: 12px;
  }
  
  .product-stats {
    flex-direction: column;
    gap: 8px;
  }
}
</style>