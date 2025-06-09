<template>
  <div class="dashboard-container">
    <Sidebar initialActiveItem="Analytics" />
    
    <div class="main-content">
      <header class="header">
        <div class="page-title">
          <h1>Sales Analytics & Inventory</h1>
          <p>Track your farm products performance and inventory levels</p>
        </div>
        
        <div class="date-filter">
          <select v-model="timeRange" @change="updateDashboardData">
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </header>
      
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 3v18h18"></path>
              <path d="m19 9-5 5-4-4-3 3"></path>
            </svg>
          </div>
          <div class="card-content">
            <h3>Total Sales</h3>
            <p class="card-value">₱{{ formatNumber(totalSales) }}</p>
            <p class="card-trend" :class="salesTrend >= 0 ? 'positive' : 'negative'">
              <span v-if="salesTrend >= 0">↑</span>
              <span v-else>↓</span>
              {{ Math.abs(salesTrend) }}% from previous period
            </p>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
          </div>
          <div class="card-content">
            <h3>Profit Margin</h3>
            <p class="card-value">{{ profitMargin }}%</p>
            <p class="card-trend" :class="profitTrend >= 0 ? 'positive' : 'negative'">
              <span v-if="profitTrend >= 0">↑</span>
              <span v-else>↓</span>
              {{ Math.abs(profitTrend) }}% from previous period
            </p>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          </div>
          <div class="card-content">
            <h3>Total Inventory</h3>
            <p class="card-value">{{ totalInventory }} units</p>
            <p class="card-trend" :class="inventoryTrend >= 0 ? 'positive' : 'negative'">
              <span v-if="inventoryTrend >= 0">↑</span>
              <span v-else>↓</span>
              {{ Math.abs(inventoryTrend) }}% from previous period
            </p>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </div>
          <div class="card-content">
            <h3>Orders</h3>
            <p class="card-value">{{ totalOrders }}</p>
            <p class="card-trend" :class="ordersTrend >= 0 ? 'positive' : 'negative'">
              <span v-if="ordersTrend >= 0">↑</span>
              <span v-else>↓</span>
              {{ Math.abs(ordersTrend) }}% from previous period
            </p>
          </div>
        </div>
      </div>
      
      <!-- Sales & Inventory Charts -->
      <div class="charts-container">
        <div class="chart-card main-chart">
          <div class="chart-header">
            <h2>Sales Performance</h2>
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
              <div class="chart-actions">
                <select v-model="chartTimeRange" @change="updateChartData" class="chart-time-filter">
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
                <div class="chart-export-dropdown">
                  <button class="chart-export-btn" @click="toggleChartExportMenu">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Export
                  </button>
                  <div class="chart-export-menu" v-if="showChartExportMenu">
                    <button class="chart-export-option" @click="exportChart('png')">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="9" cy="9" r="2"></circle>
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                      </svg>
                      Export as PNG
                    </button>
                    <button class="chart-export-option" @click="exportChart('pdf')">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                      Export as PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="chart-wrapper main-chart-wrapper">
            <canvas ref="salesChart"></canvas>
          </div>
        </div>
        
        <div class="chart-card category-chart">
          <div class="chart-header">
            <h2>Category Distribution</h2>
          </div>
          <div class="chart-wrapper category-chart-wrapper">
            <canvas ref="categoryChart"></canvas>
          </div>
        </div>
      </div>
      
      <!-- Top Products -->
      <div class="section-container">
        <div class="section-header">
          <h2>Top Selling Products</h2>
          <button class="view-all-btn" @click="navigateToProducts">View All Products</button>
        </div>
        
        <div class="top-products">
          <div v-for="(product, index) in topProducts" :key="index" class="product-card">
            <div class="product-image">
              <img :src="getProductImage(product)" alt="Product image">
              <span v-if="product.ribbon" class="product-ribbon">{{ product.ribbon }}</span>
            </div>
            <div class="product-details">
              <h3>{{ product.productName }}</h3>
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
          </div>
        </div>
      </div>
      
      <!-- Inventory Management -->
      <div class="section-container">
        <div class="section-header">
          <h2>Inventory Management</h2>
          <button class="add-product-btn" @click="navigateToAddProduct">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Product
          </button>
        </div>
        
        <div class="inventory-filters">
          <div class="filter-group">
            <label for="categoryFilter">Category</label>
            <select id="categoryFilter" v-model="filters.category">
              <option value="">All Categories</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Fruits">Fruits</option>
              <option value="Grains">Grains</option>
              <option value="Herbs & Spices">Herbs & Spices</option>
              <option value="Livestock & Poultry">Livestock & Poultry</option>
              <option value="Dairy Products">Dairy Products</option>
              <option value="Processed Foods">Processed Foods</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label for="statusFilter">Status</label>
            <select id="statusFilter" v-model="filters.status">
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="limited">Limited</option>
              <option value="preorder">Pre-order</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label for="stockFilter">Stock Level</label>
            <select id="stockFilter" v-model="filters.stockLevel">
              <option value="">All Levels</option>
              <option value="out">Out of Stock</option>
              <option value="low">Low Stock</option>
              <option value="normal">Normal</option>
              <option value="high">High Stock</option>
            </select>
          </div>
          
          <div class="search-filter">
            <input type="text" v-model="filters.search" placeholder="Search products...">
          </div>
        </div>
        
        <div class="inventory-table-container">
          <table class="inventory-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Available Units</th>
                <th>Stock Levels</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in paginatedProducts" :key="product.id">
                <td class="product-cell">
                  <div class="product-image-small">
                    <img :src="getProductImage(product)" alt="Product thumbnail">
                  </div>
                  <span>{{ product.productName }}</span>
                </td>
                <td>{{ product.category }}</td>
                <td>
                  <div class="available-units">
                    <span v-for="unit in product.availableUnits" :key="unit" class="unit-badge">
                      {{ getUnitDisplay(unit) }}
                    </span>
                  </div>
                </td>
                <td>
                  <div class="stock-levels">
                    <div v-if="product.availableUnits?.includes('perKilo') && product.stockPerKilo > 0" class="stock-item">
                      <span class="stock-badge" :class="getStockLevelClass(product.stockPerKilo)">
                        {{ product.stockPerKilo }}
                      </span>
                    </div>
                    <div v-if="product.availableUnits?.includes('perSack') && product.stockPerSack > 0" class="stock-item">
                      <span class="stock-badge" :class="getStockLevelClass(product.stockPerSack)">
                        {{ product.stockPerSack }}
                      </span>
                    </div>
                    <div v-if="product.availableUnits?.includes('perTali') && product.stockPerTali > 0" class="stock-item">
                      <span class="stock-badge" :class="getStockLevelClass(product.stockPerTali)">
                        {{ product.stockPerTali }}
                      </span>
                    </div>
                    <div v-if="product.availableUnits?.includes('perKaing') && product.stockPerKaing > 0" class="stock-item">
                      <span class="stock-badge" :class="getStockLevelClass(product.stockPerKaing)">
                        {{ product.stockPerKaing }}
                      </span>
                    </div>
                    <div v-if="product.availableUnits?.includes('perBundle') && product.stockPerBundle > 0" class="stock-item">
                      <span class="stock-badge" :class="getStockLevelClass(product.stockPerBundle)">
                        {{ product.stockPerBundle }}
                      </span>
                    </div>
                    <div v-if="product.availableUnits?.includes('perTray') && product.stockPerTray > 0" class="stock-item">
                      <span class="stock-badge" :class="getStockLevelClass(product.stockPerTray)">
                        {{ product.stockPerTray }}
                      </span>
                    </div>
                    <div v-if="product.availableUnits?.includes('perPiece') && product.stockPerPiece > 0" class="stock-item">
                      <span class="stock-badge" :class="getStockLevelClass(product.stockPerPiece)">
                        {{ product.stockPerPiece }}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="status-badge" :class="getStatusClass(product.status)">
                    {{ product.status }}
                  </span>
                </td>
                <td class="actions-cell">
                  <button class="action-btn edit" @click="editProduct(product.id)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button class="action-btn view" @click="viewProductDetails(product.id)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="pagination">
          <button :disabled="currentPage === 1" @click="currentPage--">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Previous
          </button>
          <span>Page {{ currentPage }} of {{ totalPages }}</span>
          <button :disabled="currentPage === totalPages" @click="currentPage++">
            Next
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Low Stock Alert -->
      <div class="section-container" v-if="lowStockProducts.length > 0">
        <div class="section-header">
          <h2>Low Stock Alert</h2>
        </div>
        
        <div class="alert-container">
          <div v-for="product in lowStockProducts" :key="product.id" class="alert-card">
            <div class="alert-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div class="alert-content">
              <h3>{{ product.productName }}</h3>
              <p>Low stock in multiple units</p>
            </div>
            <button class="restock-btn" @click="editProduct(product.id)">Restock</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { db, auth } from '@/firebase/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Sidebar from '@/components/Sidebar.vue';
import Chart from 'chart.js/auto';

const router = useRouter();

// Current seller ID
const currentSellerId = ref('');

// Dashboard data
const timeRange = ref('month');
const totalSales = ref(0);
const salesTrend = ref(0);
const profitMargin = ref(0);
const profitTrend = ref(0);
const totalInventory = ref(0);
const inventoryTrend = ref(0);
const totalOrders = ref(0);
const ordersTrend = ref(0);

// Chart references
const salesChart = ref(null);
const categoryChart = ref(null);
let salesChartInstance = null;
let categoryChartInstance = null;

// Products data
const products = ref([]);
const topProducts = ref([]);
const orders = ref([]);

// Track if charts should be initialized
const chartsInitialized = ref(false);

// Pagination
const itemsPerPage = 10;
const currentPage = ref(1);
const totalItems = ref(0);
const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage));

// Filters
const filters = ref({
  category: '',
  status: '',
  stockLevel: '',
  search: ''
});

// Unit display mapping
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
};

// Chart filtering and export
const chartTimeRange = ref('week');
const showChartExportMenu = ref(false);

// Helper function to get unit display name
const getUnitDisplay = (unit) => {
  return unitDisplayMap[unit] || unit || 'Unit';
};

// Helper function to get product image
const getProductImage = (product) => {
  // Check for image field first
  if (product.image && product.image.trim() !== '') {
    return product.image;
  }
  
  // Check for images array
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0];
  }
  
  // Check for productImage field
  if (product.productImage && product.productImage.trim() !== '') {
    return product.productImage;
  }
  
  // Return placeholder
  return '/placeholder.svg?height=200&width=200';
};

// Chart time filtering
const updateChartData = () => {
  if (!chartsInitialized.value || orders.value.length === 0) return;
  
  const now = new Date();
  let startDate = new Date();
  
  switch (chartTimeRange.value) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }
  
  // Filter orders by date range
  const filteredOrders = orders.value.filter(order => {
    let orderDate;
    if (order.createdAt && typeof order.createdAt.toDate === 'function') {
      orderDate = order.createdAt.toDate();
    } else if (order.timestamp && typeof order.timestamp.toDate === 'function') {
      orderDate = order.timestamp.toDate();
    } else {
      orderDate = new Date();
    }
    return orderDate >= startDate;
  });
  
  // Calculate category sales for filtered data
  const categorySales = {};
  filteredOrders.forEach(order => {
    const category = order.category || 'Other';
    if (!categorySales[category]) {
      categorySales[category] = 0;
    }
    const itemPrice = order.itemPrice || (order.unitPrice * order.quantity) || order.totalPrice || 0;
    categorySales[category] += itemPrice;
  });
  
  updateChartsWithOrderData(filteredOrders, categorySales);
};

// Chart export functionality
const toggleChartExportMenu = (event) => {
  if (event) event.stopPropagation();
  showChartExportMenu.value = !showChartExportMenu.value;
};

const exportChart = (format) => {
  showChartExportMenu.value = false;
  
  if (format === 'png') {
    exportChartAsPNG();
  } else if (format === 'pdf') {
    exportChartAsPDF();
  }
};

const exportChartAsPNG = () => {
  if (!salesChartInstance) return;
  
  const canvas = salesChart.value;
  const url = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `sales-chart-${chartTimeRange.value}-${new Date().toISOString().slice(0, 10)}.png`;
  link.href = url;
  link.click();
};

const exportChartAsPDF = () => {
  if (!salesChartInstance) return;
  
  // Create a new window for PDF content
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow pop-ups to export as PDF');
    return;
  }
  
  const canvas = salesChart.value;
  const chartImageUrl = canvas.toDataURL('image/png');
  
  const pdfContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sales Performance Chart</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px; 
          text-align: center;
        }
        h1 { 
          color: #2e5c31; 
          margin-bottom: 20px; 
        }
        .chart-container {
          margin: 20px 0;
          display: flex;
          justify-content: center;
        }
        .chart-image {
          max-width: 100%;
          height: auto;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
        .export-info { 
          margin-top: 20px; 
          font-size: 12px; 
          color: #666; 
        }
        .summary-stats {
          display: flex;
          justify-content: space-around;
          margin: 20px 0;
          padding: 20px;
          background-color: #f9f9f9;
          border-radius: 8px;
        }
        .stat-item {
          text-align: center;
        }
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #2e5c31;
        }
        .stat-label {
          font-size: 14px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <h1>Sales Performance Report</h1>
      <p>Period: ${chartTimeRange.value.charAt(0).toUpperCase() + chartTimeRange.value.slice(1)}</p>
      
      <div class="summary-stats">
        <div class="stat-item">
          <div class="stat-value">₱${formatNumber(totalSales.value)}</div>
          <div class="stat-label">Total Sales</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${profitMargin.value}%</div>
          <div class="stat-label">Profit Margin</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${totalOrders.value}</div>
          <div class="stat-label">Total Orders</div>
        </div>
      </div>
      
      <div class="chart-container">
        <img src="${chartImageUrl}" alt="Sales Performance Chart" class="chart-image">
      </div>
      
      <div class="export-info">
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>FarmXpress Analytics Dashboard</p>
      </div>
      
      <script>
        window.onload = function() { 
          setTimeout(function() {
            window.print(); 
          }, 500);
        };
      <\/script>
    </body>
    </html>
  `;
  
  printWindow.document.open();
  printWindow.document.write(pdfContent);
  printWindow.document.close();
};

// Close export menu when clicking outside
const closeChartExportMenu = (event) => {
  if (showChartExportMenu.value && !event.target.closest('.chart-export-dropdown')) {
    showChartExportMenu.value = false;
  }
};

// Computed properties
const filteredProducts = computed(() => {
  let result = [...products.value];
  
  if (filters.value.category) {
    result = result.filter(product => product.category === filters.value.category);
  }
  
  if (filters.value.status) {
    result = result.filter(product => product.status === filters.value.status);
  }
  
  if (filters.value.stockLevel) {
    result = result.filter(product => {
      const totalStock = getTotalStock(product);
      switch (filters.value.stockLevel) {
        case 'out':
          return totalStock === 0;
        case 'low':
          return totalStock > 0 && totalStock <= 10;
        case 'normal':
          return totalStock > 10 && totalStock <= 50;
        case 'high':
          return totalStock > 50;
        default:
          return true;
      }
    });
  }
  
  if (filters.value.search) {
    const searchTerm = filters.value.search.toLowerCase();
    result = result.filter(product => 
      product.productName.toLowerCase().includes(searchTerm) || 
      product.category.toLowerCase().includes(searchTerm) ||
      (product.description && product.description.toLowerCase().includes(searchTerm))
    );
  }
  
  return result;
});

// Helper function to get total stock across all units
const getTotalStock = (product) => {
  let total = 0;
  if (product.stockPerKilo) total += product.stockPerKilo;
  if (product.stockPerSack) total += product.stockPerSack;
  if (product.stockPerTali) total += product.stockPerTali;
  if (product.stockPerKaing) total += product.stockPerKaing;
  if (product.stockPerBundle) total += product.stockPerBundle;
  if (product.stockPerTray) total += product.stockPerTray;
  if (product.stockPerPiece) total += product.stockPerPiece;
  return total;
};

// Update totalItems when filteredProducts changes
watch(filteredProducts, (newValue) => {
  totalItems.value = newValue.length;
}, { immediate: true });

const paginatedProducts = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return filteredProducts.value.slice(startIndex, endIndex);
});

const lowStockProducts = computed(() => {
  return products.value.filter(product => {
    const totalStock = getTotalStock(product);
    return totalStock > 0 && totalStock <= 10;
  });
});

// Format number with commas and two decimals for currency
const formatNumber = (num) => {
  return parseFloat(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Get stock level class
const getStockLevelClass = (stock) => {
  if (stock === 0) return 'out-of-stock';
  if (stock <= 10) return 'low-stock';
  if (stock > 50) return 'high-stock';
  return 'normal-stock';
};

// Get status class
const getStatusClass = (status) => {
  switch (status) {
    case 'available':
      return 'status-active';
    case 'limited':
      return 'status-inactive';
    case 'preorder':
      return 'status-scheduled';
    default:
      return '';
  }
};

// Fetch orders from Firebase - filtered by sellerId
const fetchOrders = async () => {
  try {
    if (!currentSellerId.value) return;
    
    const ordersQuery = query(
      collection(db, "orders"),
      where("sellerId", "==", currentSellerId.value)
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    const ordersList = [];
    
    let totalSalesValue = 0;
    let totalProfitValue = 0;
    let totalOrdersCount = 0;
    const categorySales = {};
    
    ordersSnapshot.forEach((doc) => {
      const orderData = doc.data();
      ordersList.push({
        id: doc.id,
        ...orderData
      });
      
      // Calculate total sales using new order structure
      const itemPrice = orderData.itemPrice || (orderData.unitPrice * orderData.quantity) || orderData.totalPrice || 0;
      totalSalesValue += itemPrice;
      
      // Calculate profit using cost data if available
      let profit = 0;
      if (orderData.tax && orderData.deliveryFee) {
        // New structure with detailed breakdown
        profit = itemPrice - (itemPrice * 0.7); // Assume 30% cost margin if no cost data
      } else {
        profit = itemPrice * 0.3; // Default 30% profit margin
      }
      totalProfitValue += profit;
      
      totalOrdersCount++;
      
      // Track sales by category using product category
      const category = orderData.category || 'Other';
      if (!categorySales[category]) {
        categorySales[category] = 0;
      }
      categorySales[category] += itemPrice;
    });
    
    orders.value = ordersList;
    totalSales.value = totalSalesValue;
    totalOrders.value = totalOrdersCount;
    
    // Calculate profit margin (percentage)
    if (totalSalesValue > 0) {
      profitMargin.value = Math.round((totalProfitValue / totalSalesValue) * 100);
    }
    
    // Update charts with real data
    updateChartsWithOrderData(ordersList, categorySales);
    
  } catch (error) {
    console.error("Error fetching orders:", error);
  }
};

// Fetch products from Firebase - filtered by sellerId
const fetchProducts = async () => {
  try {
    if (!currentSellerId.value) return;
    
    const productsQuery = query(
      collection(db, "products"),
      where("sellerId", "==", currentSellerId.value)
    );
    
    const productsSnapshot = await getDocs(productsQuery);
    const productsList = [];
    
    let totalInventoryValue = 0;
    
    productsSnapshot.forEach((doc) => {
      const productData = doc.data();
      const product = {
        id: doc.id,
        ...productData
      };
      
      productsList.push(product);
      
      // Calculate total inventory across all units
      totalInventoryValue += getTotalStock(product);
    });
    
    products.value = productsList;
    totalInventory.value = totalInventoryValue;
    
    // Calculate top products based on sales
    calculateTopProducts();
    
  } catch (error) {
    console.error("Error fetching products:", error);
  }
};

// Calculate top selling products based on orders
const calculateTopProducts = () => {
  const productSales = {};
  
  orders.value.forEach(order => {
    const productName = order.productName;
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
      };
    }
    
    // Add quantity sold
    productSales[productName].sold += order.quantity || 0;
    
    // Add profit (simplified calculation)
    const itemPrice = order.itemPrice || (order.unitPrice * order.quantity) || 0;
    productSales[productName].profit += itemPrice * 0.3; // Assume 30% profit margin
  });
  
  // Convert to array and sort by quantity sold
  topProducts.value = Object.values(productSales)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 4);
};

// Initialize sales chart with real data
const initSalesChart = (labels, revenueData, profitData) => {
  if (!salesChart.value) return;
  
  const ctx = salesChart.value.getContext('2d');
  
  if (salesChartInstance) {
    salesChartInstance.destroy();
  }
  
  salesChartInstance = new Chart(ctx, {
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
          fill: true
        },
        {
          label: 'Profit',
          data: profitData,
          borderColor: '#4a8f4d',
          backgroundColor: 'rgba(74, 143, 77, 0.1)',
          tension: 0.4,
          fill: true
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
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ₱${parseFloat(context.raw).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '₱' + formatNumber(value);
            }
          }
        }
      }
    }
  });
};

// Initialize category chart with real data
const initCategoryChart = (labels, data) => {
  if (!categoryChart.value) return;
  
  const ctx = categoryChart.value.getContext('2d');
  
  if (categoryChartInstance) {
    categoryChartInstance.destroy();
  }
  
  const backgroundColors = [
    '#2e5c31',
    '#4a8f4d',
    '#6ab76e',
    '#8fd991',
    '#b3e6b5'
  ];
  
  categoryChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 10
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.label}: ₱${formatNumber(context.raw)}`;
            }
          }
        }
      }
    }
  });
};

// Update charts with order data
const updateChartsWithOrderData = (orders, categorySales) => {
  if (!chartsInitialized.value) return;
  
  // Prepare data based on selected time range
  let labels = [];
  let revenueData = [];
  let profitData = [];
  
  const now = new Date();
  
  // Generate appropriate labels and data structure based on time range
  if (chartTimeRange.value === 'week') {
    // For week view: show last 7 days with actual dates
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      revenueData.push(0);
      profitData.push(0);
    }
    
    // Populate data for each day
    orders.forEach(order => {
      let orderDate;
      if (order.createdAt && typeof order.createdAt.toDate === 'function') {
        orderDate = order.createdAt.toDate();
      } else if (order.timestamp && typeof order.timestamp.toDate === 'function') {
        orderDate = order.timestamp.toDate();
      } else {
        orderDate = new Date();
      }
      
      // Check if order is within the last 7 days
      const daysDiff = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));
      if (daysDiff >= 0 && daysDiff < 7) {
        const index = 6 - daysDiff; // Reverse index (newest date at the end)
        const itemPrice = order.itemPrice || (order.unitPrice * order.quantity) || order.totalPrice || 0;
        revenueData[index] += itemPrice;
        profitData[index] += itemPrice * 0.3; // Assume 30% profit margin
      }
    });
  } else if (chartTimeRange.value === 'month') {
    // For month view: show last 4 weeks
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(now.getDate() - (i * 7) - 6);
      const weekEnd = new Date();
      weekEnd.setDate(now.getDate() - (i * 7));
      
      labels.push(`${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
      revenueData.push(0);
      profitData.push(0);
    }
    
    // Populate data for each week
    orders.forEach(order => {
      let orderDate;
      if (order.createdAt && typeof order.createdAt.toDate === 'function') {
        orderDate = order.createdAt.toDate();
      } else if (order.timestamp && typeof order.timestamp.toDate === 'function') {
        orderDate = order.timestamp.toDate();
      } else {
        orderDate = new Date();
      }
      
      // Check which week the order belongs to
      const daysDiff = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));
      if (daysDiff >= 0 && daysDiff < 28) {
        const weekIndex = Math.floor(daysDiff / 7);
        if (weekIndex < 4) {
          const index = 3 - weekIndex; // Reverse index (newest week at the end)
          const itemPrice = order.itemPrice || (order.unitPrice * order.quantity) || order.totalPrice || 0;
          revenueData[index] += itemPrice;
          profitData[index] += itemPrice * 0.3;
        }
      }
    });
  } else if (chartTimeRange.value === 'quarter') {
    // For quarter view: show last 3 months
    for (let i = 2; i >= 0; i--) {
      const date = new Date();
      date.setMonth(now.getMonth() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'long' }));
      revenueData.push(0);
      profitData.push(0);
    }
    
    // Populate data for each month
    orders.forEach(order => {
      let orderDate;
      if (order.createdAt && typeof order.createdAt.toDate === 'function') {
        orderDate = order.createdAt.toDate();
      } else if (order.timestamp && typeof order.timestamp.toDate === 'function') {
        orderDate = new Date();
      } else {
        orderDate = new Date();
      }
      
      // Check which month the order belongs to
      const monthDiff = (now.getMonth() - orderDate.getMonth()) + 
                        (now.getFullYear() - orderDate.getFullYear()) * 12;
      
      if (monthDiff >= 0 && monthDiff < 3) {
        const index = 2 - monthDiff; // Reverse index (newest month at the end)
        const itemPrice = order.itemPrice || (order.unitPrice * order.quantity) || order.totalPrice || 0;
        revenueData[index] += itemPrice;
        profitData[index] += itemPrice * 0.3;
      }
    });
  } else {
    // For year view: show all 12 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    labels = [...months];
    revenueData = Array(12).fill(0);
    profitData = Array(12).fill(0);
    
    const currentYear = now.getFullYear();
    
    // Populate data for each month
    orders.forEach(order => {
      let orderDate;
      if (order.createdAt && typeof order.createdAt.toDate === 'function') {
        orderDate = order.createdAt.toDate();
      } else if (order.timestamp && typeof order.timestamp.toDate === 'function') {
        orderDate = order.timestamp.toDate();
      } else {
        orderDate = new Date();
      }
      
      // Only include orders from current year
      if (orderDate.getFullYear() === currentYear) {
        const month = orderDate.getMonth();
        const itemPrice = order.itemPrice || (order.unitPrice * order.quantity) || order.totalPrice || 0;
        revenueData[month] += itemPrice;
        profitData[month] += itemPrice * 0.3;
      }
    });
  }
  
  // Initialize charts with the prepared data
  initSalesChart(labels, revenueData, profitData);
  
  // Prepare data for category chart
  const categoryLabels = Object.keys(categorySales);
  const categoryData = Object.values(categorySales);
  
  initCategoryChart(categoryLabels, categoryData);
};

// Update dashboard data based on time range
const updateDashboardData = () => {
  fetchOrders();
  fetchProducts();
};

// Navigation functions
const navigateToProducts = () => {
  router.push('/farm-products');
};

const navigateToAddProduct = () => {
  router.push('/add-product');
};

const editProduct = (productId) => {
  router.push(`/edit-product/${productId}`);
};

const viewProductDetails = (productId) => {
  router.push(`/product/${productId}`);
};

// Watch for changes in orders data and update charts
watch(orders, (newOrders) => {
  if (newOrders.length > 0 && chartsInitialized.value) {
    const categorySales = {};
    
    newOrders.forEach(order => {
      const category = order.category || 'Other';
      if (!categorySales[category]) {
        categorySales[category] = 0;
      }
      const itemPrice = order.itemPrice || (order.unitPrice * order.quantity) || order.totalPrice || 0;
      categorySales[category] += itemPrice;
    });
    
    updateChartsWithOrderData(newOrders, categorySales);
  }
}, { deep: true });

// Initialize charts when component is mounted
onMounted(() => {
  // Get current user/seller ID
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentSellerId.value = user.uid;
      setTimeout(() => {
        chartsInitialized.value = true;
        initSalesChart([], [], []);
        initCategoryChart([], []);
        updateDashboardData();
      }, 100);
    }
  });
  
  // Add event listeners
  document.addEventListener('click', closeExportMenu);
  document.addEventListener('click', closeChartExportMenu);
});

onUnmounted(() => {
  document.removeEventListener('click', closeExportMenu);
  document.removeEventListener('click', closeChartExportMenu);
});

defineOptions({
  name: 'SellerAnalytics'
});

const closeExportMenu = (event) => {
  if (showChartExportMenu.value && !event.target.closest('.chart-export-dropdown')) {
    showChartExportMenu.value = false;
  }
};
</script>

<style scoped>
.dashboard-container {
  display: flex;
  min-height: 100vh;
  background-color: #f9fafb;
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  margin-left: 230px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 5px 0;
}

.page-title p {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
}

.date-filter select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  background-color: #fff;
  color: #111827;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.summary-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: flex-start;
}

.card-icon {
  background-color: rgba(46, 92, 49, 0.1);
  color: #2e5c31;
  padding: 10px;
  border-radius: 8px;
  margin-right: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-content h3 {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0 0 5px 0;
}

.card-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 5px 0;
}

.card-trend {
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  margin: 0;
}

.card-trend.positive {
  color: #2e5c31;
}

.card-trend.negative {
  color: #ef4444;
}

/* Charts */
.charts-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.main-chart {
  grid-column: 1;
}

.category-chart {
  grid-column: 2;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.chart-header h2 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.chart-legend {
  display: flex;
  gap: 15px;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  color: #6b7280;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  margin-right: 5px;
}

/* Chart wrapper with different sizes */
.chart-wrapper {
  position: relative;
  width: 100%;
}

.main-chart-wrapper {
  height: 350px;
}

.category-chart-wrapper {
  height: 250px;
}

/* Section Container */
.section-container {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.view-all-btn {
  background-color: transparent;
  color: #2e5c31;
  border: 1px solid #2e5c31;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 0.9rem;
  cursor: pointer;
}

.add-product-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #2e5c31;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 0.9rem;
  cursor: pointer;
}

/* Top Products */
.top-products {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.product-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.product-image {
  position: relative;
  height: 160px;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-ribbon {
  position: absolute;
  top: 10px;
  right: 0;
  background-color: #2e5c31;
  color: #fff;
  padding: 4px 8px;
  font-size: 0.8rem;
  border-radius: 4px 0 0 4px;
}

.product-details {
  padding: 15px;
}

.product-details h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 5px 0;
}

.product-category {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0 0 10px 0;
}

.product-stats {
  display: flex;
  justify-content: space-between;
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
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
}

/* Inventory Filters */
.inventory-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-group label {
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 5px;
}

.filter-group select,
.search-filter input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  min-width: 150px;
}

.search-filter {
  flex-grow: 1;
}

.search-filter input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  width: 100%;
  height: 40px; /* Match height with other filter elements */
}

/* Inventory Table */
.inventory-table-container {
  overflow-x: auto;
  margin-bottom: 20px;
}

.inventory-table {
  width: 100%;
  border-collapse: collapse;
}

.inventory-table th,
.inventory-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: middle; /* Ensure proper alignment */
}

.inventory-table th {
  font-size: 0.8rem;
  font-weight: 600;
  color: #6b7280;
  background-color: #f9fafb;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 60px; /* Ensure consistent row height */
}

.product-image-small {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.product-image-small img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.available-units {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.unit-badge {
  background-color: rgba(46, 92, 49, 0.1);
  color: #2e5c31;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
}

.stock-levels {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.stock-item {
  display: inline-block;
  margin-right: 4px;
  margin-bottom: 4px;
}

.stock-label {
  font-size: 0.7rem;
  color: #6b7280;
  min-width: 40px;
}

.stock-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
}

.actions-cell {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.action-btn.edit {
  background-color: rgba(46, 92, 49, 0.1);
  color: #2e5c31;
}

.action-btn.view {
  background-color: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
}

.pagination button {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 16px;
  background-color: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Alert Cards */
.alert-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.alert-card {
  display: flex;
  align-items: center;
  background-color: rgba(245, 158, 11, 0.1);
  border-left: 4px solid #f59e0b;
  border-radius: 6px;
  padding: 15px;
}

.alert-icon {
  color: #f59e0b;
  margin-right: 15px;
}

.alert-content {
  flex-grow: 1;
}

.alert-content h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 5px 0;
}

.alert-content p {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
}

.restock-btn {
  background-color: #fff;
  color: #2e5c31;
  border: 1px solid #2e5c31;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 0.8rem;
  cursor: pointer;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .charts-container {
    grid-template-columns: 1fr;
  }
  
  .main-chart-wrapper {
    height: 300px;
  }
  
  .category-chart-wrapper {
    height: 200px;
  }
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
  }
  
  .charts-container {
    grid-template-columns: 1fr;
  }
  
  .top-products {
    grid-template-columns: 1fr;
  }
  
  .main-chart-wrapper {
    height: 250px;
  }
  
  .category-chart-wrapper {
    height: 180px;
  }
}

/* Dark mode styles */
:global(.dark) .main-content {
  background-color: #111827;
}

:global(.dark) .page-title h1 {
  color: #f9fafb;
}

:global(.dark) .page-title p {
  color: #9ca3af;
}

:global(.dark) .date-filter select {
  background-color: #1f2937;
  border-color: #374151;
  color: #e5e7eb;
}

:global(.dark) .summary-card,
:global(.dark) .chart-card,
:global(.dark) .section-container {
  background-color: #1f2937;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

:global(.dark) .card-content h3,
:global(.dark) .legend-item {
  color: #9ca3af;
}

:global(.dark) .card-value,
:global(.dark) .chart-header h2,
:global(.dark) .section-header h2,
:global(.dark) .product-details h3,
:global(.dark) .stat-value,
:global(.dark) .alert-content h3 {
  color: #f9fafb;
}

:global(.dark) .product-card {
  border-color: #374151;
}

:global(.dark) .product-category,
:global(.dark) .stat-label,
:global(.dark) .filter-group label,
:global(.dark) .alert-content p {
  color: #9ca3af;
}

:global(.dark) .filter-group select,
:global(.dark) .search-filter input {
  background-color: #374151;
  border-color: #4b5563;
  color: #e5e7eb;
}

:global(.dark) .inventory-table th {
  background-color: #374151;
  color: #d1d5db;
}

:global(.dark) .inventory-table td {
  border-color: #4b5563;
}

:global(.dark) .pagination button {
  background-color: #374151;
  border-color: #4b5563;
  color: #e5e7eb;
}

:global(.dark) .view-all-btn {
  border-color: #4a8f4d;
  color: #4a8f4d;
}

:global(.dark) .restock-btn {
  background-color: #374151;
  border-color: #4a8f4d;
  color: #4a8f4d;
}

/* Chart Controls */
.chart-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.chart-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chart-time-filter {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.8rem;
  background-color: #fff;
  color: #111827;
  min-width: 120px;
}

.chart-export-dropdown {
  position: relative;
}

.chart-export-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background-color: #2e5c31;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.chart-export-btn:hover {
  background-color: #234425;
}

.chart-export-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 5px;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 10;
  min-width: 160px;
  overflow: hidden;
}

.chart-export-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  width: 100%;
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.8rem;
  color: #4b5563;
  transition: background-color 0.2s;
}

.chart-export-option:hover {
  background-color: #f9fafb;
}

/* Dark mode styles for chart controls */
:global(.dark) .chart-time-filter {
  background-color: #374151;
  border-color: #4b5563;
  color: #e5e7eb;
}

:global(.dark) .chart-export-btn {
  background-color: #3b7a3f;
}

:global(.dark) .chart-export-btn:hover {
  background-color: #2e5c31;
}

:global(.dark) .chart-export-menu {
  background-color: #1f2937;
  border: 1px solid #4b5563;
}

:global(.dark) .chart-export-option {
  color: #e5e7eb;
}

:global(.dark) .chart-export-option:hover {
  background-color: #374151;
}

/* Responsive adjustments for chart controls */
@media (max-width: 768px) {
  .chart-controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .chart-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .chart-time-filter {
    min-width: 100px;
  }
}
</style>