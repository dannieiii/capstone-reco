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
          <div class="chart-card">
            <div class="chart-header">
              <h2>Sales Performance</h2>
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
            </div>
            <div class="chart-wrapper">
              <canvas ref="salesChart"></canvas>
            </div>
          </div>
          
          <div class="chart-card">
            <div class="chart-header">
              <h2>Category Distribution</h2>
            </div>
            <div class="chart-wrapper">
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
                <img :src="product.image || '/placeholder.jpg'" alt="Product image">
                <span v-if="product.ribbon" class="product-ribbon">{{ product.ribbon }}</span>
              </div>
              <div class="product-details">
                <h3>{{ product.productName }}</h3>
                <p class="product-category">{{ product.category }}</p>
                <div class="product-stats">
                  <div class="stat">
                    <span class="stat-label">Price</span>
                    <span class="stat-value">₱{{ product.price }}</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">Profit</span>
                    <span class="stat-value">₱{{ product.profit }}</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">Sold</span>
                    <span class="stat-value">{{ product.sold }}</span>
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
                <option value="All Products">All Products</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Fruits">Fruits</option>
                <option value="Grains">Grains</option>
                <option value="Herbs & Spices">Herbs & Spices</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="statusFilter">Status</label>
              <select id="statusFilter" v-model="filters.status">
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Scheduled">Scheduled</option>
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
                  <th>Price</th>
                  <th>Cost</th>
                  <th>Profit</th>
                  <th>Stock</th>
                  <th>Weight</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="product in paginatedProducts" :key="product.id">
                  <td class="product-cell">
                    <div class="product-image-small">
                      <img :src="product.images && product.images.length > 0 ? product.images[0] : '/placeholder.jpg'" alt="Product thumbnail">
                    </div>
                    <span>{{ product.productName }}</span>
                  </td>
                  <td>{{ product.category }}</td>
                  <td>₱{{ product.price }}</td>
                  <td>₱{{ product.cost }}</td>
                  <td>₱{{ product.profit }}</td>
                  <td>
                    <span class="stock-badge" :class="getStockLevelClass(product.stock)">
                      {{ product.stock }}
                    </span>
                  </td>
                  <td>{{ product.weight }} {{ product.unit }}</td>
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
                <p>Only {{ product.stock }} units left in stock</p>
              </div>
              <button class="restock-btn" @click="editProduct(product.id)">Restock</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import { db } from '@/firebase/firebaseConfig';
  import { collection, getDocs } from 'firebase/firestore';
  import Sidebar from '@/components/Sidebar.vue';
  import Chart from 'chart.js/auto';
  
  const router = useRouter();
  
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
  const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage));
  
  // Filters
  const filters = ref({
    category: '',
    status: '',
    stockLevel: '',
    search: ''
  });
  
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
      switch (filters.value.stockLevel) {
        case 'out':
          result = result.filter(product => product.stock === 0);
          break;
        case 'low':
          result = result.filter(product => product.stock > 0 && product.stock <= 10);
          break;
        case 'normal':
          result = result.filter(product => product.stock > 10 && product.stock <= 50);
          break;
        case 'high':
          result = result.filter(product => product.stock > 50);
          break;
      }
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
  
  const paginatedProducts = computed(() => {
    const startIndex = (currentPage.value - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.value.slice(startIndex, endIndex);
  });
  
  const lowStockProducts = computed(() => {
    return products.value.filter(product => product.stock > 0 && product.stock <= 10);
  });
  
  // Format number with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
      case 'Active':
        return 'status-active';
      case 'Inactive':
        return 'status-inactive';
      case 'Scheduled':
        return 'status-scheduled';
      default:
        return '';
    }
  };
  
  // Fetch orders from Firebase
  const fetchOrders = async () => {
    try {
      const ordersCollection = collection(db, "orders");
      const ordersSnapshot = await getDocs(ordersCollection);
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
        
        // Calculate total sales
        totalSalesValue += orderData.totalPrice || 0;
        
        // Calculate profit (using actual cost if available, otherwise 30% margin)
        const cost = orderData.cost || (orderData.totalPrice * 0.7); // Default to 30% margin if cost not available
        const profit = orderData.totalPrice - cost;
        totalProfitValue += profit;
        
        totalOrdersCount++;
        
        // Track sales by category
        if (orderData.category) {
          if (!categorySales[orderData.category]) {
            categorySales[orderData.category] = 0;
          }
          categorySales[orderData.category] += orderData.totalPrice || 0;
        }
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
  
  // Fetch products from Firebase
  const fetchProducts = async () => {
    try {
      const productsCollection = collection(db, "products");
      const productsSnapshot = await getDocs(productsCollection);
      const productsList = [];
      
      let totalInventoryValue = 0;
      
      productsSnapshot.forEach((doc) => {
        const productData = doc.data();
        const product = {
          id: doc.id,
          ...productData,
          // Calculate current stock
          currentStock: productData.remainingStock !== undefined ? 
                       productData.remainingStock : 
                       productData.stock || 0
        };
        
        productsList.push(product);
        
        // Calculate total inventory
        totalInventoryValue += product.currentStock;
      });
      
      products.value = productsList;
      totalInventory.value = totalInventoryValue;
      
      // Calculate top products based on sales
      calculateTopProducts();
      
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };
  
  // Calculate top selling products
  const calculateTopProducts = () => {
    // Create a map of product sales
    const productSales = {};
    
    orders.value.forEach(order => {
      if (!productSales[order.productName]) {
        const cost = order.cost || (order.totalPrice * 0.7); // Default to 30% margin if cost not available
        const profit = order.totalPrice - cost;
        
        productSales[order.productName] = {
          productName: order.productName,
          category: order.category,
          price: order.totalPrice,
          sold: (order.stock || 0) - (order.remainingStock || 0),
          image: order.productImage,
          stock: order.remainingStock || order.stock || 0,
          profit: profit
        };
      } else {
        const sold = (order.stock || 0) - (order.remainingStock || 0);
        const cost = order.cost || (order.totalPrice * 0.7);
        const profit = order.totalPrice - cost;
        
        productSales[order.productName].sold += sold;
        productSales[order.productName].profit += profit;
      }
    });
    
    // Convert to array and sort by sales
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
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ₱${formatNumber(context.raw)}`;
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
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'right'
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
    
    // Group orders by month for sales chart
    const monthlySales = {};
    const monthlyProfit = {};
    
    orders.forEach(order => {
      if (order.timestamp) {
        const date = order.timestamp.toDate();
        const month = date.getMonth();
        const year = date.getFullYear();
        const key = `${year}-${month}`;
        
        if (!monthlySales[key]) {
          monthlySales[key] = 0;
          monthlyProfit[key] = 0;
        }
        
        monthlySales[key] += order.totalPrice;
        const cost = order.cost || (order.totalPrice * 0.7);
        monthlyProfit[key] += order.totalPrice - cost;
      }
    });
    
    // Prepare data for sales chart
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueData = months.map((_, index) => {
      const key = `2025-${index}`; // Adjust year as needed
      return monthlySales[key] || 0;
    });
    
    const profitData = months.map((_, index) => {
      const key = `2025-${index}`; // Adjust year as needed
      return monthlyProfit[key] || 0;
    });
    
    initSalesChart(months, revenueData, profitData);
    
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
    router.push('/products');
  };
  
  const navigateToAddProduct = () => {
    router.push('/addproduct');
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
        if (order.category) {
          if (!categorySales[order.category]) {
            categorySales[order.category] = 0;
          }
          categorySales[order.category] += order.totalPrice || 0;
        }
      });
      
      updateChartsWithOrderData(newOrders, categorySales);
    }
  }, { deep: true });
  
  // Initialize charts when component is mounted
  onMounted(() => {
    setTimeout(() => {
      chartsInitialized.value = true;
      initSalesChart([], [], []);
      initCategoryChart([], []);
      updateDashboardData();
    }, 100);
  });
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
  transition: margin-left 0.3s ease;
}

.sidebar.collapsed ~ .main-content {
  margin-left: 70px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.page-title {
  flex: 1;
  min-width: 250px;
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

.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

.chart-wrapper {
  position: relative;
  height: 250px;
  width: 100%;
}

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
  width: 100%;
}

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
}

.product-image-small {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
}

.product-image-small img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.stock-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.stock-badge.out-of-stock {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.stock-badge.low-stock {
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.stock-badge.normal-stock {
  background-color: rgba(46, 92, 49, 0.1);
  color: #2e5c31;
}

.stock-badge.high-stock {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.status-active {
  background-color: rgba(46, 92, 49, 0.1);
  color: #2e5c31;
}

.status-badge.status-inactive {
  background-color: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.status-badge.status-scheduled {
  background-color: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
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
@media (max-width: 992px) {
  .main-content {
    margin-left: 70px;
  }
  
  .sidebar:not(.collapsed) ~ .main-content {
    margin-left: 230px;
  }
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding: 15px;
  }
  
  .sidebar:not(.collapsed) ~ .main-content {
    margin-left: 0;
    transform: translateX(230px);
  }
  
  .sidebar.collapsed ~ .main-content {
    margin-left: 0;
  }
  
  .charts-container {
    grid-template-columns: 1fr;
  }
  
  .top-products {
    grid-template-columns: 1fr;
  }
  
  .summary-cards {
    grid-template-columns: 1fr 1fr;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

@media (max-width: 576px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .inventory-filters {
    flex-direction: column;
  }
  
  .filter-group,
  .search-filter {
    width: 100%;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .date-filter {
    width: 100%;
  }
  
  .date-filter select {
    width: 100%;
  }
  
  .alert-container {
    grid-template-columns: 1fr;
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
:global(.dark) .section-container,
:global(.dark) .alert-card-container {
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
</style>