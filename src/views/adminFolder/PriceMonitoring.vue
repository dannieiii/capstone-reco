<template>
  <div class="admin-layout" :class="{ 'dark-mode': isDarkMode }">
    <AdminSidebar />
    
    <div class="content-wrapper">
      <div class="price-monitoring">
        <div class="header">
          
          <h1>Price Monitoring</h1>
        </div>

        <div class="dashboard-container">
          <!-- Summary Cards -->
          <div class="summary-cards">
            <div class="summary-card">
              <div class="card-icon">
                <i class="fas fa-chart-line"></i>
              </div>
              <div class="card-content">
                <h3>Average Price Change</h3>
                <div class="card-value" :class="avgPriceChangeClass">
                  {{ avgPriceChange }}
                  <i :class="avgPriceChangeIconClass"></i>
                </div>
                <div class="card-period">Last 30 days</div>
              </div>
            </div>
            
            <div class="summary-card">
              <div class="card-icon">
                <i class="fas fa-tags"></i>
              </div>
              <div class="card-content">
                <h3>Products Monitored</h3>
                <div class="card-value">{{ productsMonitored }}</div>
                <div class="card-period">Across {{ categoriesCount }} categories</div>
              </div>
            </div>
            
            <div class="summary-card">
              <div class="card-icon">
                <i class="fas fa-exclamation-triangle"></i>
              </div>
              <div class="card-content">
                <h3>Price Alerts</h3>
                <div class="card-value">{{ priceAlerts }}</div>
                <div class="card-period">{{ newAlertsToday }} new today</div>
              </div>
            </div>
            
            <div class="summary-card">
              <div class="card-icon">
                <i class="fas fa-store"></i>
              </div>
              <div class="card-content">
                <h3>Sellers</h3>
                <div class="card-value">{{ sellersCount }}</div>
                <div class="card-period">{{ activeSellersCount }} active</div>
              </div>
            </div>
          </div>

          <!-- Filters Section -->
          <div class="filters-section">
            <div class="filter-group">
              <label>Category</label>
              <select v-model="selectedCategory" @change="applyFilters">
                <option value="">All Categories</option>
                <option v-for="category in categories" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
            </div>
            
            <div class="filter-group">
              <label>Time Period</label>
              <select v-model="selectedTimePeriod" @change="applyFilters">
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 3 months</option>
                <option value="180">Last 6 months</option>
                <option value="365">Last year</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label>Price Change</label>
              <select v-model="selectedPriceChange" @change="applyFilters">
                <option value="">All Changes</option>
                <option value="increase">Price Increases</option>
                <option value="decrease">Price Decreases</option>
                <option value="stable">Stable Prices</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label>Sort By</label>
              <select v-model="sortBy" @change="applyFilters">
                <option value="productName">Product Name</option>
                <option value="price">Current Price</option>
                <option value="change">Price Change %</option>
                <option value="stock">Stock Level</option>
              </select>
            </div>
            
            <button class="reset-btn" @click="resetFilters">Reset Filters</button>
          </div>

          <!-- Main Content Area -->
          <div class="content-area">
            <!-- Price Trend Chart -->
            <div class="chart-section">
              <div class="section-header">
                <h2>Price Trends</h2>
                <div class="chart-controls">
                  <button 
                    v-for="view in chartViews" 
                    :key="view.value" 
                    :class="{ active: currentChartView === view.value }"
                    @click="setChartView(view.value)">
                    {{ view.label }}
                  </button>
                </div>
              </div>
              <div class="chart-container">
                <canvas ref="priceChart"></canvas>
              </div>
            </div>
            
            <!-- Products Table -->
            <div class="table-section">
              <div class="section-header">
                <h2>Product Price Monitoring</h2>
                <div class="search-container">
                  <input 
                    type="text" 
                    v-model="searchQuery" 
                    placeholder="Search products..." 
                    @input="applyFilters"
                  />
                  <i class="fas fa-search"></i>
                </div>
              </div>
              
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th @click="sortTable('productName')">
                        Product Name
                        <i class="fas fa-sort"></i>
                      </th>
                      <th @click="sortTable('category')">
                        Category
                        <i class="fas fa-sort"></i>
                      </th>
                      <th @click="sortTable('sellerName')">
                        Seller
                        <i class="fas fa-sort"></i>
                      </th>
                      <th @click="sortTable('price')">
                        Current Price
                        <i class="fas fa-sort"></i>
                      </th>
                      <th @click="sortTable('previousPrice')">
                        Previous Price
                        <i class="fas fa-sort"></i>
                      </th>
                      <th @click="sortTable('change')">
                        Change %
                        <i class="fas fa-sort"></i>
                      </th>
                      <th @click="sortTable('stock')">
                        Stock
                        <i class="fas fa-sort"></i>
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(product, index) in filteredProducts" :key="product.productId">
                      <td>
                        <div class="product-cell">
                          <div class="product-image" :style="{ backgroundImage: `url(${getImageUrl(product.image)})` }"></div>
                          <span>{{ product.productName }}</span>
                        </div>
                      </td>
                      <td>{{ product.category }}</td>
                      <td>{{ product.sellerName || 'Unknown' }}</td>
                      <td>₱{{ product.price.toFixed(2) }}</td>
                      <td>₱{{ product.previousPrice ? product.previousPrice.toFixed(2) : 'N/A' }}</td>
                      <td :class="getPriceChangeClass(product.change)">
                        {{ formatPriceChange(product.change) }}
                      </td>
                      <td>
                        <div class="volatility-indicator" :class="getStockLevelClass(product.stock)">
                          {{ product.stock }}
                        </div>
                      </td>
                      <td>
                        <div class="action-buttons">
                          <button class="action-btn view-btn" @click="viewProductDetails(product)">
                            <i class="fas fa-eye"></i>
                          </button>
                          <button class="action-btn alert-btn" @click="togglePriceAlert(product)">
                            <i :class="product.hasAlert ? 'fas fa-bell' : 'far fa-bell'"></i>
                          </button>
                          <button class="action-btn more-btn" @click="showMoreOptions(product)">
                            <i class="fas fa-ellipsis-v"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div class="pagination">
                <button 
                  :disabled="currentPage === 1" 
                  @click="changePage(currentPage - 1)"
                  class="pagination-btn"
                >
                  <i class="fas fa-chevron-left"></i> Previous
                </button>
                <div class="page-info">
                  Page {{ currentPage }} of {{ totalPages }}
                </div>
                <button 
                  :disabled="currentPage === totalPages" 
                  @click="changePage(currentPage + 1)"
                  class="pagination-btn"
                >
                  Next <i class="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Price Alerts Section -->
          <div class="alerts-section">
            <div class="section-header">
              <h2>Price Alerts</h2>
              <button class="add-alert-btn" @click="showAddAlertModal">
                <i class="fas fa-plus"></i> Add Alert
              </button>
            </div>
            
            <div class="alerts-container">
              <div v-if="alerts.length === 0" class="no-alerts">
                <i class="fas fa-bell-slash"></i>
                <p>No active price alerts</p>
              </div>
              
              <div v-else class="alert-items">
                <div v-for="(alert, index) in alerts" :key="index" class="alert-item">
                  <div class="alert-icon" :class="getAlertTypeClass(alert.type)">
                    <i :class="getAlertTypeIcon(alert.type)"></i>
                  </div>
                  <div class="alert-content">
                    <div class="alert-header">
                      <h4>{{ alert.productName }}</h4>
                      <span class="alert-date">{{ formatDate(alert.date) }}</span>
                    </div>
                    <p>{{ alert.message }}</p>
                    <div class="alert-footer">
                      <span class="alert-type">{{ alert.type }}</span>
                      <button class="dismiss-btn" @click="dismissAlert(index)">
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Details Modal -->
    <div v-if="showProductModal" class="modal-overlay" @click="closeProductModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Product Price History</h2>
          <button class="close-btn" @click="closeProductModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body" v-if="selectedProduct">
          <div class="product-details">
            <div class="product-image-large" :style="{ backgroundImage: `url(${getImageUrl(selectedProduct.image)})` }"></div>
            <div class="product-info">
              <h3>{{ selectedProduct.productName }}</h3>
              <div class="product-meta">
                <div class="meta-item">
                  <span class="meta-label">Category:</span>
                  <span class="meta-value">{{ selectedProduct.category }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Seller:</span>
                  <span class="meta-value">{{ selectedProduct.sellerName || 'Unknown' }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Current Price:</span>
                  <span class="meta-value">₱{{ selectedProduct.price.toFixed(2) }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Price Change:</span>
                  <span class="meta-value" :class="getPriceChangeClass(selectedProduct.change)">
                    {{ formatPriceChange(selectedProduct.change) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="price-history-chart">
            <canvas ref="productHistoryChart"></canvas>
          </div>
          
          <div class="price-statistics">
            <div class="stat-card">
              <h4>Current Stock</h4>
              <div class="stat-value">{{ selectedProduct.stock }}</div>
              <div class="stat-date">{{ formatDate(selectedProduct.updatedAt) }}</div>
            </div>
            <div class="stat-card">
              <h4>Cost Price</h4>
              <div class="stat-value">₱{{ selectedProduct.cost.toFixed(2) }}</div>
              <div class="stat-date">Base cost</div>
            </div>
            <div class="stat-card">
              <h4>Profit</h4>
              <div class="stat-value">₱{{ selectedProduct.profit }}</div>
              <div class="stat-date">Per unit</div>
            </div>
            <div class="stat-card">
              <h4>Status</h4>
              <div class="stat-value">{{ selectedProduct.status }}</div>
              <div class="volatility-indicator" :class="getStatusClass(selectedProduct.status)"></div>
            </div>
          </div>
          
          <div class="price-history-table">
            <h3>Order History</h3>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(order, index) in productOrders" :key="index">
                  <td>{{ formatDate(order.timestamp) }}</td>
                  <td>₱{{ order.totalPrice.toFixed(2) }}</td>
                  <td>{{ order.stock - order.remainingStock }}</td>
                  <td :class="getOrderStatusClass(order.status)">
                    {{ order.status }}
                  </td>
                </tr>
                <tr v-if="productOrders.length === 0">
                  <td colspan="4" class="text-center">No order history available</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="modal-actions">
            <button class="secondary-btn" @click="exportPriceHistory(selectedProduct)">
              <i class="fas fa-download"></i> Export History
            </button>
            <button class="primary-btn" @click="setupPriceAlert(selectedProduct)">
              <i class="fas fa-bell"></i> Set Price Alert
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue';
import Chart from 'chart.js/auto';
import AdminSidebar from '@/components/AdminSidebar.vue';
import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs, query, where, orderBy, limit, Timestamp, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Import Firebase Auth

export default {
  components: {
    AdminSidebar
  },
  setup() {
    const auth = getAuth();
    const isDarkMode = ref(false);
    const priceChart = ref(null);
    const productHistoryChart = ref(null);
    const chartInstance = ref(null);
    const productChartInstance = ref(null);
    
    // Data collections
    const products = ref([]);
    const orders = ref([]);
    const sellers = ref([]);
    const alerts = ref([]);
    const productOrders = ref([]);
    
    // Summary data
    const avgPriceChange = ref('0.0%');
    const productsMonitored = ref(0);
    const categoriesCount = ref(0);
    const priceAlerts = ref(0);
    const newAlertsToday = ref(0);
    const sellersCount = ref(0);
    const activeSellersCount = ref(0);
    
    // Filters
    const selectedCategory = ref('');
    const selectedTimePeriod = ref('30');
    const selectedPriceChange = ref('');
    const sortBy = ref('productName');
    const searchQuery = ref('');
    
    // Pagination
    const currentPage = ref(1);
    const itemsPerPage = ref(10);
    const totalItems = ref(0);
    
    // Chart views
    const currentChartView = ref('category');
    const chartViews = [
      { label: 'By Category', value: 'category' },
      { label: 'By Seller', value: 'seller' },
      { label: 'Top Products', value: 'products' }
    ];
    
    // Modal state
    const showProductModal = ref(false);
    const selectedProduct = ref(null);
    
    // Categories
    const categories = ref([]);
    
    // Fetch data from Firebase
    const fetchData = async () => {
      try {
        // Fetch products
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const productsData = [];
        const uniqueCategories = new Set();
        
        productsSnapshot.forEach((doc) => {
          const productData = doc.data();
          if (productData.category) {
            uniqueCategories.add(productData.category);
          }
          
          // Calculate previous price (for demo, using cost as previous price)
          const previousPrice = productData.cost || productData.price * 0.9;
          const change = ((productData.price - previousPrice) / previousPrice) * 100;
          
          productsData.push({
            ...productData,
            previousPrice,
            change,
            hasAlert: false,
            priceHistory: []
          });
        });
        
        products.value = productsData;
        categories.value = Array.from(uniqueCategories);
        
        // Fetch sellers
        const sellersSnapshot = await getDocs(collection(db, 'sellers'));
        const sellersData = [];
        const activeSellers = [];
        
        sellersSnapshot.forEach((doc) => {
          const sellerData = doc.data();
          sellersData.push(sellerData);
          
          if (sellerData.status === 'Active') {
            activeSellers.push(sellerData);
          }
        });
        
        sellers.value = sellersData;
        
        // Fetch orders
        const ordersSnapshot = await getDocs(collection(db, 'orders'));
        const ordersData = [];
        
        ordersSnapshot.forEach((doc) => {
          const orderData = doc.data();
          ordersData.push(orderData);
        });
        
        orders.value = ordersData;
        
        // Add seller names to products
        products.value = products.value.map(product => {
          const seller = sellers.value.find(s => s.sellerId === product.sellerId);
          return {
            ...product,
            sellerName: seller ? `${seller.farmName}` : 'Unknown Seller'
          };
        });
        
        // Update summary data
        productsMonitored.value = products.value.length;
        categoriesCount.value = categories.value.length;
        sellersCount.value = sellers.value.length;
        activeSellersCount.value = activeSellers.length;
        
        // Calculate average price change
        const totalChange = products.value.reduce((sum, product) => sum + (product.change || 0), 0);
        const avgChange = products.value.length > 0 ? totalChange / products.value.length : 0;
        avgPriceChange.value = avgChange > 0 ? `+${avgChange.toFixed(1)}%` : `${avgChange.toFixed(1)}%`;
        
        // Generate sample alerts (in a real app, these would come from Firebase)
        generateSampleAlerts();
        
        // Render chart
        setTimeout(() => {
          renderChart();
        }, 100);
        
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    
    // Generate sample alerts
    const generateSampleAlerts = () => {
      const sampleAlerts = [];
      const alertTypes = ['Price Increase', 'Price Decrease', 'Low Stock', 'High Demand'];
      
      // Use 5 random products for alerts
      const randomProducts = [...products.value].sort(() => 0.5 - Math.random()).slice(0, 5);
      
      randomProducts.forEach(product => {
        const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        const date = new Date();
        date.setHours(date.getHours() - Math.floor(Math.random() * 48)); // Random time in the last 48 hours
        
        let message = '';
        switch (alertType) {
          case 'Price Increase':
            message = `Price increased by ${(Math.random() * 10 + 5).toFixed(1)}% in the last 24 hours.`;
            break;
          case 'Price Decrease':
            message = `Price decreased by ${(Math.random() * 10 + 5).toFixed(1)}% in the last 24 hours.`;
            break;
          case 'Low Stock':
            message = `Stock level is low (${product.stock} units remaining).`;
            break;
          case 'High Demand':
            message = `Unusual demand detected. Multiple orders in 24 hours.`;
            break;
        }
        
        sampleAlerts.push({
          productId: product.productId,
          productName: product.productName,
          type: alertType,
          message: message,
          date: date.toISOString()
        });
        
        // Mark product as having an alert
        const index = products.value.findIndex(p => p.productId === product.productId);
        if (index !== -1) {
          products.value[index].hasAlert = true;
        }
      });
      
      alerts.value = sampleAlerts;
      priceAlerts.value = sampleAlerts.length;
      
      // Count alerts from today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayAlerts = sampleAlerts.filter(alert => {
        const alertDate = new Date(alert.date);
        return alertDate >= today;
      });
      
      newAlertsToday.value = todayAlerts.length;
    };
    
    // Fetch orders for a specific product
    const fetchProductOrders = async (productId) => {
      try {
        productOrders.value = orders.value.filter(order => 
          order.productName === selectedProduct.value.productName
        );
      } catch (error) {
        console.error("Error fetching product orders:", error);
        productOrders.value = [];
      }
    };
    
    // Helper function to get image URL
    const getImageUrl = (imageData) => {
      if (!imageData) return '/placeholder.svg?height=50&width=50';
      
      // If it's already a URL, return it
      if (imageData.startsWith('http')) return imageData;
      
      // If it's a base64 image, return it as is
      if (imageData.startsWith('data:image')) return imageData;
      
      // Default placeholder
      return '/placeholder.svg?height=50&width=50';
    };
    
    // Computed properties
    const filteredProducts = computed(() => {
      let result = [...products.value];
      
      // Apply category filter
      if (selectedCategory.value) {
        result = result.filter(product => 
          product.category === selectedCategory.value
        );
      }
      
      // Apply price change filter
      if (selectedPriceChange.value) {
        switch (selectedPriceChange.value) {
          case 'increase':
            result = result.filter(product => product.change > 0);
            break;
          case 'decrease':
            result = result.filter(product => product.change < 0);
            break;
          case 'stable':
            result = result.filter(product => Math.abs(product.change) < 1);
            break;
        }
      }
      
      // Apply search filter
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(product => 
          product.productName.toLowerCase().includes(query) || 
          product.category.toLowerCase().includes(query) ||
          (product.sellerName && product.sellerName.toLowerCase().includes(query))
        );
      }
      
      // Apply sorting
      result.sort((a, b) => {
        switch (sortBy.value) {
          case 'productName':
            return a.productName.localeCompare(b.productName);
          case 'price':
            return b.price - a.price;
          case 'change':
            return b.change - a.change;
          case 'stock':
            return a.stock - b.stock;
          default:
            return 0;
        }
      });
      
      totalItems.value = result.length;
      
      // Apply pagination
      const startIndex = (currentPage.value - 1) * itemsPerPage.value;
      const endIndex = startIndex + itemsPerPage.value;
      return result.slice(startIndex, endIndex);
    });
    
    const totalPages = computed(() => {
      return Math.ceil(totalItems.value / itemsPerPage.value);
    });
    
    const avgPriceChangeClass = computed(() => {
      const value = parseFloat(avgPriceChange.value);
      if (value > 0) return 'price-up';
      if (value < 0) return 'price-down';
      return 'price-stable';
    });
    
    const avgPriceChangeIconClass = computed(() => {
      const value = parseFloat(avgPriceChange.value);
      if (value > 0) return 'fas fa-arrow-up';
      if (value < 0) return 'fas fa-arrow-down';
      return 'fas fa-equals';
    });
    
    // Methods
    const applyFilters = () => {
      currentPage.value = 1; // Reset to first page when filters change
      renderChart(); // Update chart based on new filters
    };
    
    const resetFilters = () => {
      selectedCategory.value = '';
      selectedTimePeriod.value = '30';
      selectedPriceChange.value = '';
      sortBy.value = 'productName';
      searchQuery.value = '';
      currentPage.value = 1;
      renderChart();
    };
    
    const changePage = (page) => {
      currentPage.value = page;
    };
    
    const sortTable = (column) => {
      sortBy.value = column;
      applyFilters();
    };
    
    const setChartView = (view) => {
      currentChartView.value = view;
      renderChart();
    };
    
    const renderChart = () => {
      if (!priceChart.value) return;
      
      if (chartInstance.value) {
        chartInstance.value.destroy();
      }
      
      const ctx = priceChart.value.getContext('2d');
      
      // Prepare data based on current view
      let labels = [];
      let datasets = [];
      
      // Set chart colors based on dark mode
      const primaryColor = isDarkMode.value ? '#6abe6e' : '#2e5c31';
      const secondaryColor = isDarkMode.value ? '#4a8f4d' : '#4a8f4d';
      const tertiaryColor = isDarkMode.value ? '#3a7f3d' : '#3a7f3d';
      const textColor = isDarkMode.value ? '#e0e0e0' : '#333';
      
      if (currentChartView.value === 'category') {
        // Group by category
        const categoryData = {};
        categories.value.forEach(category => {
          categoryData[category] = 0;
        });
        
        // Calculate average price for each category
        products.value.forEach(product => {
          if (product.category && categoryData[product.category] !== undefined) {
            categoryData[product.category] += product.price;
          }
        });
        
        // Count products in each category for average calculation
        const categoryCounts = {};
        products.value.forEach(product => {
          if (product.category) {
            categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
          }
        });
        
        // Calculate average price for each category
        Object.keys(categoryData).forEach(category => {
          if (categoryCounts[category] > 0) {
            categoryData[category] = categoryData[category] / categoryCounts[category];
          }
        });
        
        // Create labels and data arrays
        labels = Object.keys(categoryData);
        const data = Object.values(categoryData);
        
        // Create dataset
        datasets.push({
          label: 'Average Price by Category',
          data: data,
          backgroundColor: labels.map((_, i) => {
            const colors = [primaryColor, secondaryColor, tertiaryColor, '#5aaf5d', '#7ac97d'];
            return colors[i % colors.length] + '80';
          }),
          borderColor: labels.map((_, i) => {
            const colors = [primaryColor, secondaryColor, tertiaryColor, '#5aaf5d', '#7ac97d'];
            return colors[i % colors.length];
          }),
          borderWidth: 1
        });
        
        // Create chart
        chartInstance.value = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: datasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `${context.dataset.label}: ₱${context.parsed.y.toFixed(2)}`;
                  }
                }
              }
            },
            scales: {
              x: {
                grid: {
                  display: false,
                  color: isDarkMode.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                  color: textColor
                }
              },
              y: {
                beginAtZero: true,
                grid: {
                  color: isDarkMode.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                  color: textColor,
                  callback: function(value) {
                    return `₱${value.toFixed(2)}`;
                  }
                }
              }
            }
          }
        });
      } else if (currentChartView.value === 'seller') {
        // Group by seller
        const sellerData = {};
        const sellerNames = {};
        
        // Get seller names
        sellers.value.forEach(seller => {
          sellerNames[seller.sellerId] = seller.farmName || 'Unknown';
        });
        
        // Group products by seller
        products.value.forEach(product => {
          if (product.sellerId) {
            const sellerName = sellerNames[product.sellerId] || 'Unknown';
            if (!sellerData[sellerName]) {
              sellerData[sellerName] = {
                totalPrice: 0,
                count: 0
              };
            }
            sellerData[sellerName].totalPrice += product.price;
            sellerData[sellerName].count += 1;
          }
        });
        
        // Calculate average price per seller
        Object.keys(sellerData).forEach(seller => {
          if (sellerData[seller].count > 0) {
            sellerData[seller] = sellerData[seller].totalPrice / sellerData[seller].count;
          } else {
            sellerData[seller] = 0;
          }
        });
        
        // Create labels and data arrays
        labels = Object.keys(sellerData);
        const data = Object.values(sellerData);
        
        // Create dataset
        datasets.push({
          label: 'Average Price by Seller',
          data: data,
          backgroundColor: labels.map((_, i) => {
            const colors = [primaryColor, secondaryColor, tertiaryColor, '#5aaf5d', '#7ac97d', '#8ad98d'];
            return colors[i % colors.length] + '80';
          }),
          borderColor: labels.map((_, i) => {
            const colors = [primaryColor, secondaryColor, tertiaryColor, '#5aaf5d', '#7ac97d', '#8ad98d'];
            return colors[i % colors.length];
          }),
          borderWidth: 1
        });
        
        // Create chart
        chartInstance.value = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: datasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `${context.dataset.label}: ₱${context.parsed.y.toFixed(2)}`;
                  }
                }
              }
            },
            scales: {
              x: {
                grid: {
                  display: false,
                  color: isDarkMode.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                  color: textColor
                }
              },
              y: {
                beginAtZero: true,
                grid: {
                  color: isDarkMode.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                  color: textColor,
                  callback: function(value) {
                    return `₱${value.toFixed(2)}`;
                  }
                }
              }
            }
          }
        });
      } else if (currentChartView.value === 'products') {
        // Show top 5 products by price
        const topProducts = [...products.value]
          .sort((a, b) => b.price - a.price)
          .slice(0, 5);
        
        // Create labels and data arrays
        labels = topProducts.map(product => product.productName);
        
        const data = topProducts.map(product => product.price);
        
        // Create dataset
        datasets.push({
          label: 'Top Products by Price',
          data: data,
          backgroundColor: labels.map((_, i) => {
            const colors = [primaryColor, secondaryColor, tertiaryColor, '#5aaf5d', '#7ac97d'];
            return colors[i % colors.length] + '80';
          }),
          borderColor: labels.map((_, i) => {
            const colors = [primaryColor, secondaryColor, tertiaryColor, '#5aaf5d', '#7ac97d'];
            return colors[i % colors.length];
          }),
          borderWidth: 1
        });
        
        // Create chart
        chartInstance.value = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: datasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `${context.dataset.label}: ₱${context.parsed.y.toFixed(2)}`;
                  }
                }
              }
            },
            scales: {
              x: {
                grid: {
                  display: false,
                  color: isDarkMode.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                  color: textColor
                }
              },
              y: {
                beginAtZero: true,
                grid: {
                  color: isDarkMode.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                  color: textColor,
                  callback: function(value) {
                    return `₱${value.toFixed(2)}`;
                  }
                }
              }
            }
          }
        });
      }
    };
    
    const renderProductChart = () => {
      if (!productHistoryChart.value || !selectedProduct.value) return;
      
      if (productChartInstance.value) {
        productChartInstance.value.destroy();
      }
      
      const ctx = productHistoryChart.value.getContext('2d');
      
      // For demo purposes, generate some price history data
      // In a real app, this would come from Firebase
      const today = new Date();
      const labels = [];
      const prices = [];
      
      for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        labels.push(formatDate(date.toISOString()));
        
        // Generate a price that fluctuates around the current price
        const fluctuation = (Math.random() * 0.2) - 0.1; // -10% to +10%
        const historicalPrice = selectedProduct.value.price * (1 + fluctuation);
        prices.push(historicalPrice);
      }
      
      // Set chart colors based on dark mode
      const primaryColor = isDarkMode.value ? '#6abe6e' : '#2e5c31';
      const textColor = isDarkMode.value ? '#e0e0e0' : '#333';
      
      productChartInstance.value = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Price History',
              data: prices,
              borderColor: primaryColor,
              backgroundColor: primaryColor + '20',
              tension: 0.3,
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
              callbacks: {
                label: function(context) {
                  return `Price: ₱${context.parsed.y.toFixed(2)}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false,
                color: isDarkMode.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                color: textColor,
                maxRotation: 45,
                minRotation: 45
              }
            },
            y: {
              beginAtZero: false,
              grid: {
                color: isDarkMode.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                color: textColor,
                callback: function(value) {
                  return `₱${value.toFixed(2)}`;
                }
              }
            }
          }
        }
      });
    };
    
    const viewProductDetails = async (product) => {
      selectedProduct.value = product;
      showProductModal.value = true;
      
      // Fetch orders for this product
      await fetchProductOrders(product.productId);
      
      // Render product chart after modal is shown
      setTimeout(() => {
        renderProductChart();
      }, 100);
    };
    
    const closeProductModal = () => {
      showProductModal.value = false;
      selectedProduct.value = null;
      productOrders.value = [];
      
      if (productChartInstance.value) {
        productChartInstance.value.destroy();
        productChartInstance.value = null;
      }
    };
    
    const togglePriceAlert = async (product) => {
      try {
        const sellerId = product.sellerId;
        if (!sellerId) {
          console.error('No seller ID found for product:', product.productId);
          return;
        }

        // Check existing alerts in notifadmin collection
        const notifadminRef = collection(db, 'notifadmin');
        const q = query(
          notifadminRef,
          where('productId', '==', product.productId),
          where('sellerId', '==', sellerId)
        );
        
        const snapshot = await getDocs(q);
        const existingAlerts = snapshot.docs.map(doc => doc.data());
        
        // Count attempts
        const attemptCount = existingAlerts.length;
        
        if (attemptCount >= 3) {
          alert('Maximum alert attempts reached. Product will be terminated.');
          // Here you would add logic to terminate/hide the product
          return;
        }

        // Create new alert
        const alertData = {
          productId: product.productId,
          sellerId: sellerId,
          productName: product.productName,
          currentPrice: product.price,
          attemptNumber: attemptCount + 1,
          message: `Price Alert: Your product "${product.productName}" is priced above market average. This is attempt ${attemptCount + 1} of 3.`,
          timestamp: serverTimestamp(),
          status: 'unread',
          type: 'price_alert'
        };

        await addDoc(notifadminRef, alertData);

        // Update local state
        const index = products.value.findIndex(p => p.productId === product.productId);
        if (index !== -1) {
          products.value[index].hasAlert = true;
        }

        alert(`Price alert sent to seller. Attempt ${attemptCount + 1} of 3.`);
      } catch (error) {
        console.error('Error creating price alert:', error);
        alert('Error creating price alert. Please try again.');
      }
    };
    
    const showMoreOptions = (product) => {
      // This would show a dropdown menu with more options
      alert(`More options for ${product.productName}`);
    };
    
    const dismissAlert = (index) => {
      const alert = alerts.value[index];
      alerts.value.splice(index, 1);
      priceAlerts.value = alerts.value.length;
      
      // If this was the last alert for a product, update the product's hasAlert property
      if (alert && alert.productId) {
        const productIndex = products.value.findIndex(p => p.productId === alert.productId);
        if (productIndex !== -1 && !alerts.value.some(a => a.productId === alert.productId)) {
          products.value[productIndex].hasAlert = false;
        }
      }
    };
    
    const showAddAlertModal = () => {
      // This would show a modal to add a new price alert
      alert('Add new price alert');
    };
    
    const exportPriceHistory = (product) => {
      // This would export the price history to CSV or PDF
      alert(`Exporting price history for ${product.productName}`);
    };
    
    const setupPriceAlert = async (product) => {
      try {
        const sellerId = product.sellerId;
        if (!sellerId) {
          console.error('No seller ID found for product:', product.productId);
          return;
        }

        // Check existing alerts
        const notifadminRef = collection(db, 'notifadmin');
        const q = query(
          notifadminRef,
          where('productId', '==', product.productId),
          where('sellerId', '==', sellerId)
        );
        
        const snapshot = await getDocs(q);
        const existingAlerts = snapshot.docs.map(doc => doc.data());
        
        // Count attempts
        const attemptCount = existingAlerts.length;
        
        if (attemptCount >= 3) {
          alert('Maximum alert attempts reached. Product will be terminated.');
          // Here you would add logic to terminate/hide the product
          return;
        }

        // Create new alert
        const alertData = {
          productId: product.productId,
          sellerId: sellerId,
          productName: product.productName,
          currentPrice: product.price,
          attemptNumber: attemptCount + 1,
          message: `Price Alert: Your product "${product.productName}" is priced above market average. This is attempt ${attemptCount + 1} of 3.`,
          timestamp: serverTimestamp(),
          status: 'unread',
          type: 'price_alert'
        };

        await addDoc(notifadminRef, alertData);
        alert(`Price alert sent to seller. Attempt ${attemptCount + 1} of 3.`);
        
        // Close the modal
        closeProductModal();
      } catch (error) {
        console.error('Error setting up price alert:', error);
        alert('Error setting up price alert. Please try again.');
      }
    };
    
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      
      // Handle Firestore Timestamp objects
      if (dateString instanceof Timestamp) {
        const date = dateString.toDate();
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    
    const formatPriceChange = (change) => {
      if (change === undefined || change === null) return 'N/A';
      return change > 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
    };
    
    const getPriceChangeClass = (change) => {
      if (change === undefined || change === null) return '';
      if (change > 0) return 'price-up';
      if (change < 0) return 'price-down';
      return 'price-stable';
    };
    
    const getStockLevelClass = (stock) => {
      if (stock === undefined || stock === null) return '';
      if (stock < 10) return 'volatility-high';
      if (stock < 30) return 'volatility-medium';
      return 'volatility-low';
    };
    
    const getStatusClass = (status) => {
      if (!status) return '';
      switch (status.toLowerCase()) {
        case 'active':
          return 'volatility-low';
        case 'inactive':
          return 'volatility-high';
        default:
          return 'volatility-medium';
      }
    };
    
    const getOrderStatusClass = (status) => {
      if (!status) return '';
      switch (status.toLowerCase()) {
        case 'delivered':
        case 'completed':
          return 'price-up';
        case 'cancelled':
        case 'rejected':
          return 'price-down';
        default:
          return 'price-stable';
      }
    };
    
    const getAlertTypeClass = (type) => {
      switch (type) {
        case 'Price Increase':
          return 'alert-increase';
        case 'Price Decrease':
          return 'alert-decrease';
        case 'Low Stock':
          return 'alert-threshold';
        case 'High Demand':
          return 'alert-volatility';
        default:
          return '';
      }
    };
    
    const getAlertTypeIcon = (type) => {
      switch (type) {
        case 'Price Increase':
          return 'fas fa-arrow-up';
        case 'Price Decrease':
          return 'fas fa-arrow-down';
        case 'Low Stock':
          return 'fas fa-exclamation-circle';
        case 'High Demand':
          return 'fas fa-exchange-alt';
        default:
          return 'fas fa-bell';
      }
    };
    
    // Watch for dark mode changes
    watch(() => isDarkMode.value, () => {
      renderChart();
      if (showProductModal.value) {
        renderProductChart();
      }
    });
    
    onMounted(() => {
      // Check for dark mode
      isDarkMode.value = document.body.classList.contains('dark');
      
      // Fetch data from Firebase
      fetchData();
    });
    
    return {
      isDarkMode,
      priceChart,
      productHistoryChart,
      avgPriceChange,
      productsMonitored,
      categoriesCount,
      priceAlerts,
      newAlertsToday,
      sellersCount,
      activeSellersCount,
      selectedCategory,
      selectedTimePeriod,
      selectedPriceChange,
      sortBy,
      searchQuery,
      currentPage,
      totalPages,
      currentChartView,
      chartViews,
      categories,
      filteredProducts,
      alerts,
      showProductModal,
      selectedProduct,
      productOrders,
      avgPriceChangeClass,
      avgPriceChangeIconClass,
      getImageUrl,
      applyFilters,
      resetFilters,
      changePage,
      sortTable,
      setChartView,
      viewProductDetails,
      closeProductModal,
      togglePriceAlert,
      showMoreOptions,
      dismissAlert,
      showAddAlertModal,
      exportPriceHistory,
      setupPriceAlert,
      formatDate,
      formatPriceChange,
      getPriceChangeClass,
      getStockLevelClass,
      getStatusClass,
      getOrderStatusClass,
      getAlertTypeClass,
      getAlertTypeIcon
    };
  }
};
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f9f9f9;
}

.dark-mode {
  background: #222;
  color: #e0e0e0;
}

.content-wrapper {
  flex: 1;
  margin-left: 260px; /* Match the sidebar width */
  padding: 20px;
  transition: margin-left 0.3s ease;
}

.price-monitoring {
  max-width: 1200px;
  margin: 0 auto;
  background: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.dark-mode .price-monitoring {
  background: #222;
}

.header {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #2e5c31;
  color: white;
  padding: 15px;
  border-radius: 10px 10px 0 0;
  margin-bottom: 20px;
}

.dark-mode .header {
  background: #1a3a1c;
}

.header i {
  font-size: 20px;
}

.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 20px 20px;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.summary-card {
  background: white;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.dark-mode .summary-card {
  background: #333;
}

.card-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #2e5c31;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.dark-mode .card-icon {
  background: #6abe6e;
  color: #222;
}

.card-icon i {
  font-size: 20px;
}

.card-content {
  flex: 1;
}

.card-content h3 {
  font-size: 14px;
  color: #666;
  margin: 0 0 5px 0;
}

.dark-mode .card-content h3 {
  color: #aaa;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.dark-mode .card-value {
  color: #e0e0e0;
}

.card-period {
  font-size: 12px;
  color: #888;
}

.dark-mode .card-period {
  color: #999;
}

.price-up {
  color: #4caf50;
}

.price-down {
  color: #f44336;
}

.price-stable {
  color: #ff9800;
}

/* Filters Section */
.filters-section {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.dark-mode .filters-section {
  background: #333;
}

.filter-group {
  flex: 1;
  min-width: 150px;
}

.filter-group label {
  display: block;
  margin-bottom: 5px;
  color: #666;
  font-size: 14px;
}

.dark-mode .filter-group label {
  color: #aaa;
}

.filter-group select,
.filter-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f9f9f9;
}

.dark-mode .filter-group select,
.dark-mode .filter-group input {
  background: #444;
  border-color: #555;
  color: #e0e0e0;
}

.reset-btn {
  background: #f0f0f0;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  font-weight: 500;
  align-self: flex-end;
  margin-top: 21px;
}

.dark-mode .reset-btn {
  background: #444;
  color: #e0e0e0;
}

.reset-btn:hover {
  background: #e0e0e0;
}

.dark-mode .reset-btn:hover {
  background: #555;
}

/* Content Area */
.content-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Chart Section */
.chart-section {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.dark-mode .chart-section {
  background: #333;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h2 {
  color: #2e5c31;
  margin: 0;
  font-size: 18px;
}

.dark-mode .section-header h2 {
  color: #6abe6e;
}

.chart-controls {
  display: flex;
  gap: 10px;
}

.chart-controls button {
  background: #f0f0f0;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  font-size: 14px;
}

.dark-mode .chart-controls button {
  background: #444;
  color: #e0e0e0;
}

.chart-controls button.active {
  background: #2e5c31;
  color: white;
}

.dark-mode .chart-controls button.active {
  background: #6abe6e;
  color: #222;
}

.chart-container {
  height: 300px;
}

/* Table Section */
.table-section {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.dark-mode .table-section {
  background: #333;
}

.search-container {
  position: relative;
  width: 300px;
}

.search-container input {
  width: 100%;
  padding: 8px 12px 8px 35px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f9f9f9;
}

.dark-mode .search-container input {
  background: #444;
  border-color: #555;
  color: #e0e0e0;
}

.search-container i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.dark-mode .search-container i {
  color: #aaa;
}

.table-container {
  overflow-x: auto;
  margin-bottom: 15px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.dark-mode th, 
.dark-mode td {
  border-bottom: 1px solid #444;
}

th {
  background: #f5f5f5;
  color: #2e5c31;
  font-weight: 600;
  cursor: pointer;
}

.dark-mode th {
  background: #444;
  color: #6abe6e;
}

th i {
  margin-left: 5px;
  font-size: 12px;
}

tr:hover {
  background: #f9f9f9;
}

.dark-mode tr:hover {
  background: #3a3a3a;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.product-image {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  background-size: cover;
  background-position: center;
  background-color: #f0f0f0;
}

.dark-mode .product-image {
  background-color: #444;
}

.volatility-indicator {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.volatility-low {
  background: #e8f5e9;
  color: #2e7d32;
}

.volatility-medium {
  background: #fff8e1;
  color: #ff8f00;
}

.volatility-high {
  background: #ffebee;
  color: #c62828;
}

.dark-mode .volatility-low {
  background: rgba(46, 125, 50, 0.2);
  color: #81c784;
}

.dark-mode .volatility-medium {
  background: rgba(255, 143, 0, 0.2);
  color: #ffd54f;
}

.dark-mode .volatility-high {
  background: rgba(198, 40, 40, 0.2);
  color: #ef9a9a;
}

.action-buttons {
  display: flex;
  gap: 5px;
}

.action-btn {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  border: none;
  background: #f0f0f0;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dark-mode .action-btn {
  background: #444;
  color: #e0e0e0;
}

.view-btn:hover {
  background: #e3f2fd;
  color: #1976d2;
}

.alert-btn:hover {
  background: #fff8e1;
  color: #ff8f00;
}

.more-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.dark-mode .view-btn:hover {
  background: rgba(25, 118, 210, 0.2);
  color: #64b5f6;
}

.dark-mode .alert-btn:hover {
  background: rgba(255, 143, 0, 0.2);
  color: #ffd54f;
}

.dark-mode .more-btn:hover {
  background: #555;
  color: #e0e0e0;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-btn {
  background: #f0f0f0;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  gap: 5px;
}

.dark-mode .pagination-btn {
  background: #444;
  color: #e0e0e0;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #666;
  font-size: 14px;
}

.dark-mode .page-info {
  color: #aaa;
}

/* Alerts Section */
.alerts-section {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.dark-mode .alerts-section {
  background: #333;
}

.add-alert-btn {
  background: #2e5c31;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 500;
}

.dark-mode .add-alert-btn {
  background: #6abe6e;
  color: #222;
}

.no-alerts {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  color: #999;
}

.dark-mode .no-alerts {
  color: #777;
}

.no-alerts i {
  font-size: 40px;
  margin-bottom: 10px;
  opacity: 0.5;
}

.alert-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.alert-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
}

.dark-mode .alert-item {
  background: #3a3a3a;
}

.alert-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.alert-increase {
  background: #e8f5e9;
  color: #2e7d32;
}

.alert-decrease {
  background: #e3f2fd;
  color: #1976d2;
}

.alert-volatility {
  background: #fff8e1;
  color: #ff8f00;
}

.alert-threshold {
  background: #ffebee;
  color: #c62828;
}

.dark-mode .alert-increase {
  background: rgba(46, 125, 50, 0.2);
  color: #81c784;
}

.dark-mode .alert-decrease {
  background: rgba(25, 118, 210, 0.2);
  color: #64b5f6;
}

.dark-mode .alert-volatility {
  background: rgba(255, 143, 0, 0.2);
  color: #ffd54f;
}

.dark-mode .alert-threshold {
  background: rgba(198, 40, 40, 0.2);
  color: #ef9a9a;
}

.alert-content {
  flex: 1;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.alert-header h4 {
  margin: 0;
  color: #333;
  font-size: 16px;
}

.dark-mode .alert-header h4 {
  color: #e0e0e0;
}

.alert-date {
  color: #999;
  font-size: 12px;
}

.dark-mode .alert-date {
  color: #777;
}

.alert-content p {
  margin: 0 0 10px 0;
  color: #666;
}

.dark-mode .alert-content p {
  color: #aaa;
}

.alert-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-type {
  font-size: 12px;
  color: #999;
  background: #f0f0f0;
  padding: 3px 8px;
  border-radius: 12px;
}

.dark-mode .alert-type {
  background: #444;
  color: #777;
}

.dismiss-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 12px;
  text-decoration: underline;
}

.dark-mode .dismiss-btn {
  color: #777;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.dark-mode .modal-content {
  background: #333;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.dark-mode .modal-header {
  border-bottom: 1px solid #444;
}

.modal-header h2 {
  margin: 0;
  color: #2e5c31;
  font-size: 20px;
}

.dark-mode .modal-header h2 {
  color: #6abe6e;
}

.close-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 20px;
  cursor: pointer;
}

.dark-mode .close-btn {
  color: #777;
}

.modal-body {
  padding: 20px;
}

.product-details {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.product-image-large {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  background-size: cover;
  background-position: center;
  background-color: #f0f0f0;
  flex-shrink: 0;
}

.dark-mode .product-image-large {
  background-color: #444;
}

.product-info {
  flex: 1;
}

.product-info h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 24px;
}

.dark-mode .product-info h3 {
  color: #e0e0e0;
}

.product-meta {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.meta-item {
  display: flex;
  flex-direction: column;
}

.meta-label {
  font-size: 14px;
  color: #666;
}

.dark-mode .meta-label {
  color: #aaa;
}

.meta-value {
  font-weight: 500;
  color: #333;
}

.dark-mode .meta-value {
  color: #e0e0e0;
}

.price-history-chart {
  height: 250px;
  margin-bottom: 20px;
}

.price-statistics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.stat-card {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.dark-mode .stat-card {
  background: #444;
}

.stat-card h4 {
  margin: 0 0 5px 0;
  color: #666;
  font-size: 14px;
}

.dark-mode .stat-card h4 {
  color: #aaa;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #2e5c31;
  margin-bottom: 5px;
}

.dark-mode .stat-value {
  color: #6abe6e;
}

.stat-date {
  font-size: 12px;
  color: #999;
}

.dark-mode .stat-date {
  color: #777;
}

.price-history-table {
  margin-bottom: 20px;
}

.price-history-table h3 {
  margin: 0 0 10px 0;
  color: #2e5c31;
  font-size: 18px;
}

.dark-mode .price-history-table h3 {
  color: #6abe6e;
}

.text-center {
  text-align: center;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.primary-btn, .secondary-btn {
  padding: 10px 15px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 500;
}

.primary-btn {
  background: #2e5c31;
  color: white;
}

.dark-mode .primary-btn {
  background: #6abe6e;
  color: #222;
}

.secondary-btn {
  background: #f0f0f0;
  color: #666;
}

.dark-mode .secondary-btn {
  background: #444;
  color: #e0e0e0;
}

@media (max-width: 1024px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .price-statistics {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .content-wrapper {
    margin-left: 0;
    padding-top: 60px; /* Add space for mobile header */
  }
  
  .filters-section {
    flex-direction: column;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .product-details {
    flex-direction: column;
  }
  
  .product-image-large {
    width: 100%;
    height: 200px;
  }
  
  .product-meta {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 576px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .price-statistics {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .search-container {
    width: 100%;
  }
  
  .chart-controls {
    width: 100%;
    overflow-x: auto;
  }
}
</style>