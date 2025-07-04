<template>
  <div class="top-sellers-chart">
    <div class="chart-header">
      <div class="header-content">
        <h3>Top 5 Sellers Performance</h3>
        <p>Sales analytics across all sellers</p>
      </div>
      <div class="chart-actions">
        <button class="action-btn" @click="refreshData">
          <RefreshCw :size="16" />
        </button>
        <div class="export-dropdown">
          <button class="action-btn export-btn">
            <Download :size="16" />
            <ChevronDown :size="14" class="ml-1" />
          </button>
          <div class="export-menu">
            <button class="export-option" @click="exportData('csv')">
              <FileText :size="16" />
              Export as CSV
            </button>
            <button class="export-option" @click="exportData('pdf')">
              <FileText :size="16" />
              Export as PDF
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading seller data...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <AlertCircle :size="48" />
      <p>{{ error }}</p>
      <button @click="fetchSellersData" class="retry-btn">
        <RefreshCw :size="16" />
        Retry
      </button>
    </div>

    <div v-else class="chart-content">
      <!-- Stats Summary -->
      <div class="stats-row">
        <div class="stat-item">
          <div class="stat-value">{{ totalSellers }}</div>
          <div class="stat-label">Total Sellers</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ activeSellers }}</div>
          <div class="stat-label">Active Sellers</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">₱{{ totalRevenue.toLocaleString() }}</div>
          <div class="stat-label">Total Revenue</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ averageOrders.toFixed(1) }}</div>
          <div class="stat-label">Avg Orders</div>
        </div>
      </div>

      <!-- Horizontal Bar Chart -->
      <div class="chart-container">
        <h4>Top 5 Sellers by Revenue</h4>
        <div class="horizontal-bars">
          <div 
            v-for="(seller, index) in topSellers" 
            :key="seller.id"
            class="bar-item"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <div class="seller-info">
              <div class="seller-rank">{{ index + 1 }}</div>
              <div class="seller-avatar" :style="{ backgroundColor: getAvatarColor(seller.email) }">
                {{ getInitials(seller.firstName, seller.lastName) }}
              </div>
              <div class="seller-details">
                <div class="seller-name">{{ seller.name }}</div>
                <div class="seller-meta">
                  <span class="seller-status" :class="seller.status.toLowerCase()">
                    {{ seller.status }}
                  </span>
                  <span class="seller-orders">
                    <ShoppingBag :size="12" />
                    {{ seller.totalOrders }} orders
                  </span>
                </div>
              </div>
            </div>
            <div class="bar-container">
              <div 
                class="bar-fill" 
                :style="{ 
                  width: `${(seller.totalSales / maxRevenue) * 100}%`,
                  backgroundColor: getBarColor(index)
                }"
              ></div>
              <div class="bar-value">₱{{ formatNumber(seller.totalSales) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Indicators -->
      <div class="performance-grid">
        <div class="performance-card">
          <div class="performance-icon trending-up">
            <TrendingUp :size="20" />
          </div>
          <div class="performance-content">
            <div class="performance-value">{{ newSellersThisMonth }}</div>
            <div class="performance-label">New This Month</div>
          </div>
        </div>
        <div class="performance-card">
          <div class="performance-icon users">
            <Users :size="20" />
          </div>
          <div class="performance-content">
            <div class="performance-value">{{ verifiedSellers }}</div>
            <div class="performance-label">Verified Sellers</div>
          </div>
        </div>
        <div class="performance-card">
          <div class="performance-icon star">
            <Star :size="20" />
          </div>
          <div class="performance-content">
            <div class="performance-value">{{ topPerformers }}</div>
            <div class="performance-label">Top Performers</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Export Success Notification -->
    <div v-if="exportNotification.show" class="export-notification" :class="exportNotification.type">
      <div class="notification-content">
        <CheckCircle v-if="exportNotification.type === 'success'" :size="20" />
        <AlertCircle v-else :size="20" />
        <span>{{ exportNotification.message }}</span>
        <button @click="closeExportNotification" class="notification-close">×</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  User, 
  Star, 
  TrendingUp, 
  Users, 
  RefreshCw, 
  Download, 
  AlertCircle,
  ShoppingBag,
  ChevronDown,
  FileText,
  CheckCircle
} from 'lucide-vue-next'
import { db } from '@/firebase/firebaseConfig'
import { collection, getDocs, query, where } from 'firebase/firestore'

const loading = ref(true)
const error = ref(null)
const sellers = ref([])

// Export notification state
const exportNotification = ref({
  show: false,
  type: 'success',
  message: ''
})

const fetchSellersData = async () => {
  try {
    loading.value = true
    error.value = null
    
    console.log('Fetching sellers data...')
    
    // Fetch all sellers from the sellers collection (same as Sellers.vue)
    const sellersSnapshot = await getDocs(collection(db, 'sellers'))
    const sellersList = []
    
    for (const docSnapshot of sellersSnapshot.docs) {
      const sellerData = docSnapshot.data()
      const seller = { 
        id: docSnapshot.id, 
        registrationStatus: sellerData.registrationStatus || 'Pending',
        isVerified: sellerData.isVerified || false,
        ...sellerData 
      }
      
      // Fetch sales data for this seller (same logic as Sellers.vue)
      const salesData = await fetchSellerSalesData(seller.userId || docSnapshot.id)
      seller.totalSales = salesData.totalSales
      seller.totalOrders = salesData.totalOrders
      
      // Process seller info for display
      seller.name = `${seller.personalInfo?.firstName || 'Unknown'} ${seller.personalInfo?.lastName || 'Seller'}`.trim()
      seller.firstName = seller.personalInfo?.firstName || 'Unknown'
      seller.lastName = seller.personalInfo?.lastName || 'Seller'
      seller.email = seller.personalInfo?.email || 'No email'
      seller.farmName = seller.farmDetails?.farmName || 'Unknown Farm'
      seller.farmType = seller.farmDetails?.farmType || 'Unknown Type'
      seller.contact = seller.personalInfo?.contact || 'No contact'
      seller.address = seller.personalInfo?.address || 'No address'
      seller.status = seller.isVerified ? 'Verified' : (seller.registrationStatus === 'Accept' ? 'Active' : seller.registrationStatus)
      
      sellersList.push(seller)
    }
    
    sellers.value = sellersList
    console.log('Fetched sellers:', sellers.value.length)
    
  } catch (err) {
    console.error('Error fetching sellers:', err)
    error.value = 'Failed to load seller data. Please try again.'
  } finally {
    loading.value = false
  }
}

const fetchSellerSalesData = async (sellerId) => {
  try {
    // Same logic as Sellers.vue for fetching sales data
    const ordersQuery = query(
      collection(db, "orders"),
      where("sellerId", "==", sellerId)
    )
    
    const ordersSnapshot = await getDocs(ordersQuery)
    let totalSales = 0
    let totalOrders = 0
    
    ordersSnapshot.forEach((doc) => {
      const orderData = doc.data()
      const itemPrice = orderData.itemPrice || (orderData.unitPrice * orderData.quantity) || orderData.totalPrice || 0
      totalSales += itemPrice
      totalOrders++
    })
    
    return { totalSales, totalOrders }
  } catch (error) {
    console.error("Error fetching seller sales data:", error)
    return { totalSales: 0, totalOrders: 0 }
  }
}

const refreshData = () => {
  fetchSellersData()
}

// Export functionality
const exportData = (format) => {
  try {
    const dataToExport = topSellers.value // Export top 5 sellers data
    
    if (format === 'csv') {
      exportCSV(dataToExport)
    } else if (format === 'pdf') {
      exportPDF(dataToExport)
    }
  } catch (error) {
    console.error(`Error exporting ${format}:`, error)
    showExportNotification(`Failed to export data as ${format.toUpperCase()}. Please try again.`, 'error')
  }
}

const exportCSV = (data) => {
  const headers = ['Rank', 'Name', 'Email', 'Contact', 'Farm Name', 'Farm Type', 'Address', 'Total Sales', 'Total Orders', 'Status']
  const csvContent = [
    headers.join(','),
    ...data.map((seller, index) => [
      index + 1,
      `"${seller.name}"`,
      `"${seller.email}"`,
      `"${seller.contact}"`,
      `"${seller.farmName}"`,
      `"${seller.farmType}"`,
      `"${seller.address}"`,
      seller.totalSales || 0,
      seller.totalOrders || 0,
      `"${seller.status}"`
    ].join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `top_5_sellers_${new Date().toISOString().slice(0, 10)}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  showExportNotification('Top 5 sellers data exported successfully as CSV!', 'success')
}

const exportPDF = (data) => {
  const printWindow = window.open('', '_blank')
  
  let pdfContent = '<!DOCTYPE html>'
  pdfContent += '<html>'
  pdfContent += '<head>'
  pdfContent += '<title>Top 5 Sellers Performance Report</title>'
  pdfContent += '<style>'
  pdfContent += 'body { font-family: Arial, sans-serif; margin: 20px; color: #333; }'
  pdfContent += 'h1 { color: #2e5c31; margin-bottom: 10px; text-align: center; }'
  pdfContent += '.report-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2e5c31; padding-bottom: 20px; }'
  pdfContent += '.report-date { color: #666; font-size: 14px; }'
  pdfContent += '.stats-summary { display: flex; justify-content: space-around; margin-bottom: 30px; }'
  pdfContent += '.stat-box { text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px; }'
  pdfContent += '.stat-value { font-size: 24px; font-weight: bold; color: #2e5c31; }'
  pdfContent += '.stat-label { font-size: 12px; color: #666; margin-top: 5px; }'
  pdfContent += 'table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }'
  pdfContent += 'th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }'
  pdfContent += 'th { background-color: #2e5c31; color: white; font-weight: bold; }'
  pdfContent += 'tr:nth-child(even) { background-color: #f9f9f9; }'
  pdfContent += '.rank-cell { text-align: center; font-weight: bold; color: #2e5c31; }'
  pdfContent += '.sales-cell { text-align: right; font-weight: bold; color: #2e5c31; }'
  pdfContent += '.status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }'
  pdfContent += '.status-verified { background-color: #d1fae5; color: #059669; }'
  pdfContent += '.status-active { background-color: #d1fae5; color: #059669; }'
  pdfContent += '.status-pending { background-color: #fef3c7; color: #d97706; }'
  pdfContent += '.export-info { margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }'
  pdfContent += '</style>'
  pdfContent += '</head>'
  pdfContent += '<body>'
  
  // Header
  pdfContent += '<div class="report-header">'
  pdfContent += '<h1>Top 5 Sellers Performance Report</h1>'
  pdfContent += `<div class="report-date">Generated on: ${new Date().toLocaleString()}</div>`
  pdfContent += '</div>'
  
  // Stats Summary
  pdfContent += '<div class="stats-summary">'
  pdfContent += '<div class="stat-box">'
  pdfContent += `<div class="stat-value">${totalSellers.value}</div>`
  pdfContent += '<div class="stat-label">Total Sellers</div>'
  pdfContent += '</div>'
  pdfContent += '<div class="stat-box">'
  pdfContent += `<div class="stat-value">${activeSellers.value}</div>`
  pdfContent += '<div class="stat-label">Active Sellers</div>'
  pdfContent += '</div>'
  pdfContent += '<div class="stat-box">'
  pdfContent += `<div class="stat-value">₱${totalRevenue.value.toLocaleString()}</div>`
  pdfContent += '<div class="stat-label">Total Revenue</div>'
  pdfContent += '</div>'
  pdfContent += '<div class="stat-box">'
  pdfContent += `<div class="stat-value">${averageOrders.value.toFixed(1)}</div>`
  pdfContent += '<div class="stat-label">Avg Orders</div>'
  pdfContent += '</div>'
  pdfContent += '</div>'
  
  // Table
  pdfContent += '<table>'
  pdfContent += '<thead>'
  pdfContent += '<tr>'
  pdfContent += '<th>Rank</th>'
  pdfContent += '<th>Seller Name</th>'
  pdfContent += '<th>Email</th>'
  pdfContent += '<th>Farm Name</th>'
  pdfContent += '<th>Total Sales</th>'
  pdfContent += '<th>Total Orders</th>'
  pdfContent += '<th>Status</th>'
  pdfContent += '</tr>'
  pdfContent += '</thead>'
  pdfContent += '<tbody>'
  
  data.forEach((seller, index) => {
    const statusClass = `status-${seller.status.toLowerCase()}`
    
    pdfContent += '<tr>'
    pdfContent += `<td class="rank-cell">${index + 1}</td>`
    pdfContent += `<td>${escapeHtml(seller.name)}</td>`
    pdfContent += `<td>${escapeHtml(seller.email)}</td>`
    pdfContent += `<td>${escapeHtml(seller.farmName)}</td>`
    pdfContent += `<td class="sales-cell">₱${formatNumber(seller.totalSales)}</td>`
    pdfContent += `<td style="text-align: center;">${seller.totalOrders}</td>`
    pdfContent += `<td><span class="status-badge ${statusClass}">${escapeHtml(seller.status)}</span></td>`
    pdfContent += '</tr>'
  })
  
  pdfContent += '</tbody>'
  pdfContent += '</table>'
  
  // Footer
  pdfContent += '<div class="export-info">'
  pdfContent += `<p><strong>Report Summary:</strong></p>`
  pdfContent += `<p>• Top performing sellers based on total sales revenue</p>`
  pdfContent += `<p>• Data includes verified sales transactions and order counts</p>`
  pdfContent += `<p>• Generated from live database on ${new Date().toLocaleDateString()}</p>`
  pdfContent += '</div>'
  
  pdfContent += '<script>'
  pdfContent += 'window.onload = function() { window.print(); }'
  pdfContent += '<\/script>'
  pdfContent += '</body>'
  pdfContent += '</html>'
  
  printWindow.document.open()
  printWindow.document.write(pdfContent)
  printWindow.document.close()
  
  showExportNotification('Top 5 sellers report opened for printing/PDF save!', 'success')
}

const escapeHtml = (text) => {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

const showExportNotification = (message, type = 'success') => {
  exportNotification.value = {
    show: true,
    type,
    message
  }
  
  // Auto-hide after 4 seconds
  setTimeout(() => {
    closeExportNotification()
  }, 4000)
}

const closeExportNotification = () => {
  exportNotification.value.show = false
}

// Computed properties
const totalSellers = computed(() => sellers.value.length)

const activeSellers = computed(() => 
  sellers.value.filter(seller => seller.status === 'Verified' || seller.status === 'Active').length
)

const verifiedSellers = computed(() => 
  sellers.value.filter(seller => seller.isVerified).length
)

const totalRevenue = computed(() => 
  sellers.value.reduce((sum, seller) => sum + (seller.totalSales || 0), 0)
)

const averageOrders = computed(() => {
  if (sellers.value.length === 0) return 0
  const totalOrders = sellers.value.reduce((sum, seller) => sum + (seller.totalOrders || 0), 0)
  return totalOrders / sellers.value.length
})

const topSellers = computed(() => 
  sellers.value
    .filter(seller => seller.totalSales > 0) // Only sellers with sales
    .sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0))
    .slice(0, 5) // Top 5 only
)

const maxRevenue = computed(() => 
  topSellers.value.length > 0 ? topSellers.value[0].totalSales : 1
)

const newSellersThisMonth = computed(() => {
  const now = new Date()
  return sellers.value.filter(seller => {
    if (!seller.createdAt) return false
    const createdDate = seller.createdAt.toDate ? seller.createdAt.toDate() : new Date(seller.createdAt)
    return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear()
  }).length
})

const topPerformers = computed(() => 
  sellers.value.filter(seller => (seller.totalSales || 0) > 50000).length
)

// Helper functions (same as Sellers.vue)
const getInitials = (firstName, lastName) => {
  const first = firstName ? firstName.charAt(0) : ''
  const last = lastName ? lastName.charAt(0) : ''
  return (first + last).toUpperCase() || 'NA'
}

const getAvatarColor = (email) => {
  if (!email) return '#2e5c31'
  
  const colors = [
    '#2e5c31', '#1e40af', '#9d174d', '#b45309', '#4c1d95',
    '#064e3b', '#7f1d1d', '#1e3a8a', '#3f6212', '#831843'
  ]
  
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash) + email.charCodeAt(i)
    hash = hash & hash
  }
  
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

const formatNumber = (num) => {
  return parseFloat(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

// Helper function for bar colors
const getBarColor = (index) => {
  const colors = [
    '#3498db', // Blue
    '#2ecc71', // Green  
    '#f39c12', // Orange
    '#e74c3c', // Red
    '#9b59b6'  // Purple
  ]
  return colors[index % colors.length]
}

onMounted(() => {
  fetchSellersData()
})
</script>

<style scoped>
.top-sellers-chart {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: fit-content;
  position: relative;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 4px 0;
}

.header-content p {
  font-size: 0.875rem;
  color: #718096;
  margin: 0;
}

.chart-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn:hover {
  background: #f7fafc;
  border-color: #cbd5e0;
}

.export-dropdown {
  position: relative;
}

.export-btn {
  background: #2e5c31;
  color: white;
  border-color: #2e5c31;
}

.export-btn:hover {
  background: #1f4e23;
  border-color: #1f4e23;
}

.export-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 5px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 10;
  min-width: 180px;
  overflow: hidden;
  display: none;
}

.export-dropdown:hover .export-menu {
  display: block;
}

.export-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  width: 100%;
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.9rem;
  color: #4b5563;
  transition: background-color 0.2s;
}

.export-option:hover {
  background-color: #f9fafb;
}

.ml-1 {
  margin-left: 4px;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  color: #e53e3e;
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 16px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.75rem;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.chart-container {
  margin-bottom: 32px;
}

.chart-container h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 20px 0;
}

.horizontal-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  animation: slideInLeft 0.5s ease-out forwards;
  opacity: 0;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.seller-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
}

.seller-rank {
  width: 24px;
  height: 24px;
  background: #3498db;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

.seller-avatar {
  width: 32px;
  height: 32px;
  background: #e2e8f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
}

.seller-details {
  flex: 1;
}

.seller-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #2d3748;
  margin-bottom: 2px;
}

.seller-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
}

.seller-status {
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: capitalize;
  font-weight: 500;
}

.seller-status.verified {
  background: #c6f6d5;
  color: #22543d;
}

.seller-status.active {
  background: #c6f6d5;
  color: #22543d;
}

.seller-status.pending {
  background: #fed7d7;
  color: #742a2a;
}

.seller-orders {
  display: flex;
  align-items: center;
  gap: 2px;
  color: #718096;
}

.bar-container {
  flex: 1;
  position: relative;
  height: 24px;
  background: #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 12px;
  transition: width 1s ease-out;
  position: relative;
}

.bar-value {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.75rem;
  font-weight: 600;
  color: #2d3748;
}

.performance-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.performance-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.performance-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.performance-icon.trending-up {
  background: #48bb78;
}

.performance-icon.users {
  background: #3498db;
}

.performance-icon.star {
  background: #f6ad55;
}

.performance-content {
  flex: 1;
}

.performance-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 2px;
}

.performance-label {
  font-size: 0.75rem;
  color: #718096;
}

/* Export Notification */
.export-notification {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: slideInRight 0.3s ease-out;
}

.export-notification.success {
  background-color: #d1fae5;
  border-left: 4px solid #10b981;
}

.export-notification.error {
  background-color: #fee2e2;
  border-left: 4px solid #ef4444;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  color: #065f46;
  font-size: 0.875rem;
}

.export-notification.error .notification-content {
  color: #991b1b;
}

.notification-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  margin-left: auto;
  opacity: 0.7;
}

.notification-close:hover {
  opacity: 1;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .performance-grid {
    grid-template-columns: 1fr;
  }
  
  .seller-info {
    min-width: 150px;
  }
}
</style>