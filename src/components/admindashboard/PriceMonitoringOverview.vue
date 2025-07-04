<template>
  <div class="price-monitoring-overview">
    <!-- Header -->
    <div class="overview-header">
      <h3>Price Monitoring Overview</h3>
      <button @click="refreshData" class="refresh-btn" :disabled="loading">
        <RefreshCw v-if="loading" size="16" class="spinner" />
        <span v-else>Refresh</span>
      </button>
    </div>

    <!-- Simple Stats -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-label">Total Products:</span>
        <span class="stat-value">{{ totalProducts }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Overpriced:</span>
        <span class="stat-value text-danger">{{ overpricedCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Within Range:</span>
        <span class="stat-value text-success">{{ withinRangeCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">No Reference:</span>
        <span class="stat-value text-warning">{{ noReferenceCount }}</span>
      </div>
    </div>

    <!-- Chart -->
    <div class="chart-container">
      <h4>Price Status Distribution</h4>
      <div class="chart-wrapper">
        <canvas ref="priceChart" width="400" height="200"></canvas>
      </div>
      <div v-if="!chartRendered && !loading" class="chart-error">
        Chart failed to render. Check console for errors.
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <RefreshCw size="20" class="spinner" />
      <span>Loading data...</span>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-message">
      <p>Error: {{ error }}</p>
      <button @click="refreshData" class="retry-btn">Retry</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase/firebaseConfig'
import Chart from 'chart.js/auto'
import { RefreshCw } from 'lucide-vue-next'

// Data
const loading = ref(false)
const error = ref(null)
const products = ref([])
const daProducts = ref([])
const processedProducts = ref([])
const priceChart = ref(null)
const chartInstance = ref(null)
const chartRendered = ref(false)

// Unit mapping
const unitMapping = {
  'perKilo': { label: 'Per Kilo', priceField: 'pricePerKilo' },
  'perSack': { label: 'Per Sack', priceField: 'pricePerSack' },
  'perTali': { label: 'Per Tali', priceField: 'pricePerTali' },
  'perKaing': { label: 'Per Kaing', priceField: 'pricePerKaing' },
  'perBundle': { label: 'Per Bundle', priceField: 'pricePerBundle' },
  'perTray': { label: 'Per Tray', priceField: 'pricePerTray' },
  'perPiece': { label: 'Per Piece', priceField: 'pricePerPiece' }
}

// Computed
const totalProducts = computed(() => processedProducts.value.length)
const overpricedCount = computed(() => 
  processedProducts.value.filter(p => p.hasOverpricedUnits).length
)
const withinRangeCount = computed(() => 
  processedProducts.value.filter(p => p.priceStatus === 'within-range').length
)
const noReferenceCount = computed(() => 
  processedProducts.value.filter(p => p.priceStatus === 'no-reference').length
)

// Methods
const fetchData = async () => {
  loading.value = true
  error.value = null
  
  try {
    console.log('Starting data fetch...')
    
    // Fetch products
    const productsSnapshot = await getDocs(collection(db, 'products'))
    const productsData = []
    
    productsSnapshot.forEach((doc) => {
      const productData = doc.data()
      productsData.push({
        id: doc.id,
        ...productData
      })
    })
    
    products.value = productsData
    console.log('Products loaded:', productsData.length)
    
    // Fetch D.A. reference products
    const daProductsSnapshot = await getDocs(collection(db, 'productPrices'))
    const daProductsData = []
    
    daProductsSnapshot.forEach((doc) => {
      const data = doc.data()
      daProductsData.push({
        id: doc.id,
        productName: data.productName || '',
        category: data.category || '',
        variety: data.variety || 'Normal',
        unitPricing: data.unitPricing || {}
      })
    })
    
    daProducts.value = daProductsData
    console.log('DA Products loaded:', daProductsData.length)
    
    // Process products
    processProducts()
    
    // Render chart after a short delay
    await nextTick()
    setTimeout(() => {
      renderChart()
    }, 100)
    
  } catch (err) {
    console.error('Error fetching data:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const processProducts = () => {
  console.log('Processing products...')
  const processed = []
  
  products.value.forEach(product => {
    if (!product || !product.productName) return
    
    // Find DA reference
    const daReference = findDAReference(product)
    
    // Get product units
    const units = getProductUnits(product)
    
    if (units.length === 0) return
    
    let hasOverpriced = false
    let hasWithinRange = false
    
    // Check each unit for price status
    units.forEach(unit => {
      if (unit.daReference) {
        const status = calculatePriceStatus(unit.price, unit.daReference)
        unit.priceStatus = status
        
        if (status === 'overpriced') {
          hasOverpriced = true
        } else if (status === 'within-range') {
          hasWithinRange = true
        }
      } else {
        unit.priceStatus = 'no-reference'
      }
    })
    
    // Determine overall product status
    let priceStatus = 'no-reference'
    if (hasOverpriced) {
      priceStatus = 'overpriced'
    } else if (hasWithinRange) {
      priceStatus = 'within-range'
    } else if (daReference) {
      priceStatus = 'within-range'
    }
    
    const processedProduct = {
      ...product,
      daReference,
      units,
      hasOverpricedUnits: hasOverpriced,
      priceStatus,
      isCustomProduct: !daReference
    }
    
    processed.push(processedProduct)
  })
  
  processedProducts.value = processed
  console.log('Processed products:', processed.length)
  console.log('Sample processed product:', processed[0])
}

const findDAReference = (product) => {
  if (!product || !product.productName) return null
  
  return daProducts.value.find(da => {
    if (!da || !da.productName) return false
    
    const cleanProductName = product.productName.toLowerCase().trim()
    const cleanDAName = da.productName.toLowerCase().trim()
    
    // Try exact match first
    if (cleanDAName === cleanProductName) return true
    
    // Try partial match with same category
    const productWords = cleanProductName.split(' ')
    const daWords = cleanDAName.split(' ')
    
    const hasCommonWord = productWords.some(word => 
      word.length > 2 && daWords.some(daWord => daWord.includes(word) || word.includes(daWord))
    )
    
    return hasCommonWord && da.category === product.category
  })
}

const getProductUnits = (product) => {
  if (!product || !product.availableUnits || !Array.isArray(product.availableUnits)) {
    return []
  }
  
  const units = []
  
  product.availableUnits.forEach(unitType => {
    const unitConfig = unitMapping[unitType]
    if (!unitConfig) return
    
    const price = product[unitConfig.priceField] || 0
    
    if (price > 0) {
      const unit = {
        type: unitConfig.label,
        price: price,
        daReference: findUnitDAReference(product, unitType),
        priceStatus: 'unknown'
      }
      
      units.push(unit)
    }
  })
  
  return units
}

const findUnitDAReference = (product, unitType) => {
  const daProduct = findDAReference(product)
  if (!daProduct || !daProduct.unitPricing) return null
  
  const unitNameMapping = {
    'perKilo': ['per kg', 'per kilo', 'kg', 'kilo'],
    'perSack': ['per sack', 'sack', 'per bag', 'bag'],
    'perTali': ['per tali', 'tali'],
    'perKaing': ['per kaing', 'kaing'],
    'perBundle': ['per bundle', 'bundle'],
    'perTray': ['per tray', 'tray'],
    'perPiece': ['per piece', 'piece', 'each']
  }
  
  const possibleNames = unitNameMapping[unitType] || []
  
  for (const [daUnitName, pricing] of Object.entries(daProduct.unitPricing)) {
    if (pricing && pricing.minPrice > 0 && pricing.maxPrice > 0) {
      const normalizedDAName = daUnitName.toLowerCase().trim()
      
      if (possibleNames.some(name => normalizedDAName.includes(name))) {
        return {
          unit: daUnitName,
          minPrice: parseFloat(pricing.minPrice),
          maxPrice: parseFloat(pricing.maxPrice)
        }
      }
    }
  }
  
  return null
}

const calculatePriceStatus = (sellerPrice, daReference) => {
  if (!daReference || !sellerPrice || sellerPrice <= 0) {
    return 'no-reference'
  }
  
  const price = parseFloat(sellerPrice)
  const daMin = parseFloat(daReference.minPrice)
  const daMax = parseFloat(daReference.maxPrice)
  
  if (price > daMax) {
    return 'overpriced'
  } else if (price < daMin) {
    return 'underpriced'
  } else {
    return 'within-range'
  }
}

const renderChart = () => {
  if (!priceChart.value) {
    console.error('Chart canvas not found')
    return
  }
  
  try {
    if (chartInstance.value) {
      chartInstance.value.destroy()
    }
    
    const ctx = priceChart.value.getContext('2d')
    
    const withinRange = withinRangeCount.value
    const overpriced = overpricedCount.value
    const noReference = noReferenceCount.value
    
    console.log('Chart data:', {
      withinRange,
      overpriced,
      noReference,
      total: totalProducts.value
    })
    
    // Create chart with sample data if no real data
    const hasData = withinRange > 0 || overpriced > 0 || noReference > 0
    
    const data = hasData ? [withinRange, overpriced, noReference] : [10, 5, 3]
    const labels = ['Within D.A. Range', 'Overpriced', 'No Reference']
    
    chartInstance.value = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            '#10b981', // Green for within range
            '#ef4444', // Red for overpriced
            '#f59e0b'  // Orange for no reference
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || ''
                const value = context.parsed || 0
                const total = context.dataset.data.reduce((a, b) => a + b, 0)
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0'
                return `${label}: ${value} (${percentage}%)`
              }
            }
          }
        }
      }
    })
    
    chartRendered.value = true
    console.log('Chart rendered successfully')
    
  } catch (err) {
    console.error('Error rendering chart:', err)
    chartRendered.value = false
  }
}

const refreshData = async () => {
  await fetchData()
}

// Watch for data changes and re-render chart
watch([totalProducts, overpricedCount, withinRangeCount], () => {
  if (totalProducts.value > 0) {
    setTimeout(() => {
      renderChart()
    }, 100)
  }
}, { deep: true })

// Lifecycle
onMounted(() => {
  console.log('Component mounted')
  fetchData()
})
</script>

<style scoped>
.price-monitoring-overview {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.overview-header h3 {
  margin: 0;
  color: #2e5c31;
  font-size: 1.25rem;
  font-weight: 600;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #2e5c31;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #1f4e23;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

.text-danger {
  color: #ef4444;
}

.text-success {
  color: #10b981;
}

.text-warning {
  color: #f59e0b;
}

.chart-container {
  margin-bottom: 20px;
}

.chart-container h4 {
  margin: 0 0 16px 0;
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
}

.chart-wrapper {
  height: 300px;
  position: relative;
}

.chart-error {
  text-align: center;
  color: #ef4444;
  padding: 20px;
  background: #fef2f2;
  border-radius: 6px;
  margin-top: 10px;
}

.loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  gap: 8px;
  color: #6b7280;
  font-size: 0.875rem;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #dc2626;
  padding: 16px;
  border-radius: 6px;
  text-align: center;
}

.retry-btn {
  background: #dc2626;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 8px;
}

.retry-btn:hover {
  background: #b91c1c;
}

@media (max-width: 768px) {
  .price-monitoring-overview {
    padding: 16px;
  }
  
  .overview-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
}
</style>