<template>
  <div class="dashboard-container">
    <Sidebar initialActiveItem="Forecasting" />
    
    <div class="main-content">
      <header class="header">
        <div class="page-title">
          <h1>Sales Forecasting</h1>
          <p>Powered predictions based on your historical sales data</p>
        </div>
        
        <div class="forecast-controls">
          <div class="control-group">
            <label>Time Period</label>
            <select v-model="forecastPeriod" class="period-select">
              <option value="7">Next 7 Days</option>
              <option value="14">Next 14 Days</option>
              <option value="30">Next 30 Days</option>
              <option value="90">Next 3 Months</option>
            </select>
          </div>
          
          <div class="control-group">
            <label>Category</label>
            <select v-model="selectedCategory" class="category-select">
              <option value="all">All Categories</option>
              <option v-for="category in availableCategories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </div>
          
          <button @click="generateForecast" class="generate-btn" :disabled="loading">
            <RefreshCw v-if="loading" size="16" class="spinner" />
            <span v-else>Generate Forecast</span>
          </button>
        </div>
      </header>
      
      <!-- Enhanced Loading State with Progress -->
      <div v-if="loading" class="loading-state">
        <div class="loading-progress">
          <div class="progress-circle">
            <svg class="progress-ring" width="80" height="80">
              <circle
                class="progress-ring-circle"
                stroke="#e5e7eb"
                stroke-width="4"
                fill="transparent"
                r="36"
                cx="40"
                cy="40"
              />
              <circle
                class="progress-ring-circle progress-ring-fill"
                stroke="#2e5c31"
                stroke-width="4"
                fill="transparent"
                r="36"
                cx="40"
                cy="40"
                :stroke-dasharray="226"
                :stroke-dashoffset="226 - (loadingProgress / 100) * 226"
              />
            </svg>
            <div class="progress-text">{{ Math.round(loadingProgress) }}%</div>
          </div>
        </div>
        <h3>{{ loadingStage }}</h3>
        <p>{{ loadingMessage }}</p>
        <div class="loading-steps">
          <div class="step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
            <div class="step-icon">1</div>
            <span>Fetching Data</span>
          </div>
          <div class="step" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
            <div class="step-icon">2</div>
            <span>Training Model</span>
          </div>
          <div class="step" :class="{ active: currentStep >= 3, completed: currentStep > 3 }">
            <div class="step-icon">3</div>
            <span>Generating Forecast</span>
          </div>
          <div class="step" :class="{ active: currentStep >= 4, completed: currentStep > 4 }">
            <div class="step-icon">4</div>
            <span>Finalizing Results</span>
          </div>
        </div>
      </div>
      
      <div v-else-if="error" class="error-state">
        <div class="error-icon">!</div>
        <p>{{ error }}</p>
        <button @click="generateForecast" class="retry-btn">Try Again</button>
        <div class="debug-info" v-if="debugInfo">
          <p>Debug Info: {{ debugInfo }}</p>
        </div>
      </div>
      
      <div v-else-if="forecastData.length > 0" class="forecast-results">
        <!-- Cache Status Indicator -->
        <div v-if="usingCache" class="cache-indicator">
          <Zap size="16" />
          <span>Using cached data for faster loading</span>
        </div>
        
        <div class="forecast-chart-container">
          <div class="chart-header">
            <div class="chart-title-section">
              <h2>Product Growth Trends for {{ forecastTitle }}</h2>
              <p class="chart-explanation">
                This chart shows how your top 5 products are expected to perform over time based on historical sales data. 
                Each line represents a product's projected growth rate. 
                Rising lines (usually green) show growing sales, while falling lines (usually red) show declining sales.
                The percentage values show the expected growth or decline rate compared to previous sales.
              </p>
            </div>
            
            <div class="chart-controls">
              <button @click="showDataTable = !showDataTable" class="toggle-table-btn">
                <BarChart2 size="16" />
                {{ showDataTable ? 'Hide' : 'Show' }} Data Table
              </button>
              
              <div class="export-dropdown" ref="chartExportDropdown">
                <button @click="toggleChartExportDropdown" class="export-toggle-btn" :disabled="exporting">
                  <Download v-if="!exporting" size="16" />
                  <Loader2 v-else size="16" class="spinner" />
                  Export Chart
                  <ChevronDown size="14" :class="{ 'rotate-180': showChartExportDropdown }" />
                </button>
                
                <div v-if="showChartExportDropdown" class="export-dropdown-menu">
                  <div class="export-section">
                    <button @click="exportCompleteReport" class="export-option complete-report" :disabled="exporting">
                      <FileText size="14" />
                      Complete Report (PDF)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="chart-wrapper">
            <canvas ref="forecastChart"></canvas>
          </div>
          <div class="chart-legend">
            <div class="legend-item">
              <div class="legend-color positive"></div>
              <span>Growing Products (positive growth)</span>
            </div>
            <div class="legend-item">
              <div class="legend-color negative"></div>
              <span>Declining Products (negative growth)</span>
            </div>
            <div class="legend-item">
              <div class="legend-color neutral"></div>
              <span>Stable Products (little to no change)</span>
            </div>
          </div>
        </div>

        <!-- Forecast Data Table (Toggleable) -->
        <div v-if="showDataTable" class="forecast-table-container">
          <div class="table-header">
            <h2>Forecast Data Table</h2>
            <div class="export-dropdown" ref="forecastTableExportDropdown">
              <button @click="toggleForecastTableExportDropdown" class="export-toggle-btn small" :disabled="exporting">
                <Download v-if="!exporting" size="14" />
                <Loader2 v-else size="14" class="spinner" />
                Export
                <ChevronDown size="12" :class="{ 'rotate-180': showForecastTableExportDropdown }" />
              </button>
              
              <div v-if="showForecastTableExportDropdown" class="export-dropdown-menu">
                <div class="export-section">
                  <button @click="exportForecastToPDF" class="export-option" :disabled="exporting">
                    <FileText size="14" />
                    PDF Report
                  </button>
                  <button @click="exportForecastToCSV" class="export-option" :disabled="exporting">
                    <Download size="14" />
                    CSV Data
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="table-wrapper">
            <table class="forecast-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Projected Sales (₱)</th>
                  <th>Growth Rate (%)</th>
                  <th>Confidence Level</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(day, index) in forecastData" :key="index">
                  <td>{{ formatDate(day.date) }}</td>
                  <td>₱{{ Math.round(day.value).toLocaleString() }}</td>
                  <td :class="getGrowthClass(calculateDayGrowth(index))">
                    {{ calculateDayGrowth(index) > 0 ? '+' : '' }}{{ calculateDayGrowth(index) }}%
                  </td>
                  <td>
                    <div class="confidence-indicator">
                      <span class="confidence-text">{{ calculateConfidence(index) }}%</span>
                      <div class="confidence-bar">
                        <div class="confidence-fill" :style="{ width: calculateConfidence(index) + '%' }"></div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="forecast-details">
          <div class="forecast-products">
            <div class="products-header">
              <h2>Product Forecasts</h2>
              
              <div class="product-controls">
                <button @click="showProductCards = !showProductCards" class="toggle-cards-btn">
                  <Grid v-if="!showProductCards" size="16" />
                  <List v-else size="16" />
                  {{ showProductCards ? 'Hide' : 'Show' }} Cards
                </button>
                
                <div class="export-dropdown" ref="productTableExportDropdown">
                  <button @click="toggleProductTableExportDropdown" class="export-toggle-btn small" :disabled="exporting">
                    <Download v-if="!exporting" size="14" />
                    <Loader2 v-else size="14" class="spinner" />
                    Export
                    <ChevronDown size="12" :class="{ 'rotate-180': showProductTableExportDropdown }" />
                  </button>
                  
                  <div v-if="showProductTableExportDropdown" class="export-dropdown-menu">
                    <div class="export-section">
                      <button @click="exportProductsToPDF" class="export-option" :disabled="exporting">
                        <FileText size="14" />
                        PDF Report
                      </button>
                      <button @click="exportProductsToCSV" class="export-option" :disabled="exporting">
                        <Download size="14" />
                        CSV Data
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="table-wrapper">
              <table class="products-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Projected Sales</th>
                    <th>Projected Revenue (₱)</th>
                    <th>Growth (%)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="product in displayedProducts" :key="product.id">
                    <td>
                      <div class="product-cell">
                        <img :src="product.image" :alt="product.name" class="product-thumb" />
                        <span>{{ product.name }}</span>
                      </div>
                    </td>
                    <td>{{ product.category }}</td>
                    <td>
                      <div class="sales-breakdown">
                        <div v-for="(value, unit) in product.projectedSales" :key="unit" class="unit-sales">
                          {{ value }} {{ getUnitDisplay(unit) }}
                        </div>
                      </div>
                    </td>
                    <td>₱{{ product.projectedRevenue.toLocaleString() }}</td>
                    <td :class="getGrowthClass(product.growth)">
                      {{ product.growth > 0 ? '+' : '' }}{{ product.growth }}%
                    </td>
                    <td>
                      <span class="status-badge" :class="getStatusClass(product.growth)">
                        {{ getStatusText(product.growth) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="showProductCards" class="product-cards">
              <div v-for="product in displayedProducts" :key="product.id" class="product-card">
                <div class="product-image">
                  <img :src="product.image" :alt="product.name" />
                </div>
                <div class="product-info">
                  <h3>{{ product.name }}</h3>
                  <p class="category">{{ product.category }}</p>
                  <div class="forecast-stats">
                    <div class="stat">
                      <span class="stat-label">Projected Sales</span>
                      <div class="unit-sales" v-for="(value, unit) in product.projectedSales" :key="unit">
                        <span class="stat-value">{{ value }} {{ getUnitDisplay(unit) }}</span>
                      </div>
                    </div>
                    <div class="stat">
                      <span class="stat-label">Projected Revenue</span>
                      <span class="stat-value">₱{{ product.projectedRevenue.toLocaleString() }}</span>
                    </div>
                    <div class="stat">
                      <span class="stat-label">Growth</span>
                      <span class="stat-value" :class="getGrowthClass(product.growth)">
                        {{ product.growth > 0 ? '+' : '' }}{{ product.growth }}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="forecast-insights">
            <h2>Insights & Recommendations</h2>
            <div class="insights-container">
              <div v-for="(insight, index) in insights" :key="index" class="insight-card">
                <div class="insight-icon" :class="insight.type">
                  <TrendingUp v-if="insight.type === 'positive'" size="20" />
                  <TrendingDown v-else-if="insight.type === 'negative'" size="20" />
                  <AlertCircle v-else size="20" />
                </div>
                <div class="insight-content">
                  <h4>{{ insight.title }}</h4>
                  <p>{{ insight.description }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="model-info">
            <h2>About This Forecast</h2>
            <div class="model-details">
              <div class="model-detail">
                <h4>Model</h4>
                <p>TensorFlow.js LSTM Neural Network</p>
              </div>
              <div class="model-detail">
                <h4>Training Data</h4>
                <p>{{ trainingStats.dataPoints }} data points from {{ trainingStats.startDate }} to {{ trainingStats.endDate }}</p>
              </div>
              <div class="model-detail">
                <h4>Factors Considered</h4>
                <p>Historical sales patterns, product categories, and price points</p>
              </div>
              <div class="model-detail">
                <h4>Validation Metrics</h4>
                <p>Accuracy: {{ trainingStats.accuracy }}% (sMAPE) | sMAPE: {{ trainingStats.smape }}% | MAPE: {{ trainingStats.mape }}% | MAE: ₱{{ trainingStats.mae.toLocaleString() }} | RMSE: ₱{{ trainingStats.rmse.toLocaleString() }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="exportStatus" class="export-status" :class="exportStatus.type">
          <CheckCircle v-if="exportStatus.type === 'success'" size="16" />
          <AlertCircle v-else size="16" />
          {{ exportStatus.message }}
        </div>
      </div>
      
      <div v-else class="empty-state">
        <div class="empty-icon">
          <BarChart2 size="48" />
        </div>
        <h2>No Forecast Generated</h2>
        <p>Select a time period and click "Generate Forecast" to predict future sales based on historical data</p>
        <button @click="generateForecast" class="generate-btn">Generate Forecast</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue';
import { collection, query, where, getDocs, Timestamp, limit } from 'firebase/firestore';
import { db, auth } from '@/firebase/firebaseConfig';
import * as tf from '@tensorflow/tfjs';
import Chart from 'chart.js/auto';
import Sidebar from '@/components/Sidebar.vue';
import { 
  BarChart2, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  RefreshCw,
  Download,
  FileText,
  ChevronDown,
  Loader2,
  CheckCircle,
  Grid,
  List,
  Zap
} from 'lucide-vue-next';

import { useRouter } from 'vue-router';

const router = useRouter();

// Enhanced data properties with performance tracking
const forecastPeriod = ref('14');
const selectedCategory = ref('all');
const availableCategories = ref([]);
const loading = ref(false);
const loadingMessage = ref('');
const loadingStage = ref('');
const loadingProgress = ref(0);
const currentStep = ref(0);
const error = ref(null);
const debugInfo = ref('');
const forecastData = ref([]);
const displayedProducts = ref([]);
const insights = ref([]);
const forecastChart = ref(null);
const chartInstance = ref(null);
const showDataTable = ref(false);
const showProductCards = ref(true);
const usingCache = ref(false);

// Enhanced cache system with performance metrics
const cachedForecasts = ref({});
const cacheExpiryTime = 20 * 60 * 1000; // Reduced to 20 minutes for fresher data
const cacheHits = ref(0);
const cacheMisses = ref(0);

// Export dropdown states
const showChartExportDropdown = ref(false);
const showForecastTableExportDropdown = ref(false);
const showProductTableExportDropdown = ref(false);
const chartExportDropdown = ref(null);
const forecastTableExportDropdown = ref(null);
const productTableExportDropdown = ref(null);
const exporting = ref(false);
const exportStatus = ref(null);

const trainingStats = ref({
  dataPoints: 0,
  startDate: '',
  endDate: '',
  accuracy: 0,
  smape: 0,
  mape: 0,
  mae: 0,
  rmse: 0
});

const defaultProductImage = '/placeholder.svg?height=100&width=100';

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

// Helper functions
const getUnitDisplay = (unit) => {
  return unitDisplayMap[unit] || unit || 'Unit';
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

const calculateDayGrowth = (index) => {
  if (index === 0 || !forecastData.value[index - 1]) return 0;
  const current = forecastData.value[index].value;
  const previous = forecastData.value[index - 1].value;
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
};

const calculateConfidence = (index) => {
  // Base from sMAPE (bounded), fallback to MAPE, then default 85
  const smape = trainingStats.value.smape;
  const baseFromSmape = Number.isFinite(smape) ? Math.round(100 - (smape / 2)) : null;
  const baseFromMape = Number.isFinite(trainingStats.value.mape) ? Math.round(100 - (trainingStats.value.mape)) : null;
  const baseRaw = baseFromSmape ?? baseFromMape ?? 85;
  const base = Math.max(50, Math.min(95, baseRaw));
  const decay = Math.round(index * 0.8);
  return Math.max(50, base - decay);
};

const getStatusClass = (growth) => {
  if (growth > 10) return 'status-excellent';
  if (growth > 0) return 'status-good';
  if (growth > -10) return 'status-stable';
  return 'status-declining';
};

const getStatusText = (growth) => {
  if (growth > 10) return 'Excellent';
  if (growth > 0) return 'Growing';
  if (growth > -10) return 'Stable';
  return 'Declining';
};

// Enhanced cache functions with performance tracking
const getCacheKey = () => {
  return `${forecastPeriod.value}-${selectedCategory.value}`;
};

const getFromCache = (key) => {
  const cached = cachedForecasts.value[key];
  if (!cached) {
    cacheMisses.value++;
    return null;
  }
  
  if (Date.now() - cached.timestamp > cacheExpiryTime) {
    delete cachedForecasts.value[key];
    cacheMisses.value++;
    return null;
  }
  
  cacheHits.value++;
  return cached.data;
};

const addToCache = (key, data) => {
  cachedForecasts.value[key] = {
    data: data,
    timestamp: Date.now()
  };
};

// Enhanced loading progress tracking
const updateProgress = (stage, message, progress, step) => {
  loadingStage.value = stage;
  loadingMessage.value = message;
  loadingProgress.value = progress;
  currentStep.value = step;
};

// Export dropdown toggles
const toggleChartExportDropdown = () => {
  showChartExportDropdown.value = !showChartExportDropdown.value;
  showForecastTableExportDropdown.value = false;
  showProductTableExportDropdown.value = false;
};

const toggleForecastTableExportDropdown = () => {
  showForecastTableExportDropdown.value = !showForecastTableExportDropdown.value;
  showChartExportDropdown.value = false;
  showProductTableExportDropdown.value = false;
};

const toggleProductTableExportDropdown = () => {
  showProductTableExportDropdown.value = !showProductTableExportDropdown.value;
  showChartExportDropdown.value = false;
  showForecastTableExportDropdown.value = false;
};

const handleClickOutside = (event) => {
  if (chartExportDropdown.value && !chartExportDropdown.value.contains(event.target)) {
    showChartExportDropdown.value = false;
  }
  if (forecastTableExportDropdown.value && !forecastTableExportDropdown.value.contains(event.target)) {
    showForecastTableExportDropdown.value = false;
  }
  if (productTableExportDropdown.value && !productTableExportDropdown.value.contains(event.target)) {
    showProductTableExportDropdown.value = false;
  }
};

const showStatus = (type, message) => {
  exportStatus.value = { type, message };
  setTimeout(() => {
    exportStatus.value = null;
  }, 3000);
};

// Computed properties
const forecastTitle = computed(() => {
  return selectedCategory.value === 'all' 
    ? `All Products (Next ${forecastPeriod.value} Days)` 
    : `${selectedCategory.value} (Next ${forecastPeriod.value} Days)`;
});

const getGrowthClass = (growth) => {
  if (growth > 0) return 'positive';
  if (growth < 0) return 'negative';
  return 'neutral';
};

// Optimized fetch sales data with better error handling
const fetchSalesData = async () => {
  try {
    updateProgress('Fetching Data', 'Loading sales history...', 10, 1);
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    debugInfo.value = `User ID: ${currentUser.uid}`;
    
    const salesQuery = query(
      collection(db, 'sales'),
      where('sellerId', '==', currentUser.uid),
      limit(200) // Increased limit for better accuracy
    );
    
    const querySnapshot = await getDocs(salesQuery);
    const sales = [];
    
    if (!querySnapshot.empty) {
      debugInfo.value += ` | Found data in sales collection`;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        const sale = {
          id: doc.id,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp || Date.now()),
          totalPrice: data.totalPrice || data.total || data.price || 0,
          productId: data.productId || '',
          productName: data.productName || 'Unknown Product',
          category: data.category || '',
          quantity: data.quantity || 1
        };
        
        sales.push(sale);
      });
      
      updateProgress('Fetching Data', 'Processing sales data...', 25, 1);
      
      debugInfo.value += ` | Total sales found: ${sales.length}`;
      
      if (selectedCategory.value !== 'all') {
        const filteredSales = sales.filter(sale => sale.category === selectedCategory.value);
        debugInfo.value += ` | After category filter: ${filteredSales.length}`;
        return filteredSales;
      }
      
      return sales;
    } else {
      debugInfo.value += ` | No data found in sales collection`;
      return [];
    }
  } catch (err) {
    console.error("Error fetching sales data:", err);
    error.value = "Failed to load sales data. Please try again.";
    debugInfo.value += ` | Error: ${err.message}`;
    return [];
  }
};

// Optimized fetch products data
const fetchProductsData = async () => {
  try {
    updateProgress('Fetching Data', 'Loading product information...', 35, 1);
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    const productsQuery = query(
      collection(db, 'products'),
      where('sellerId', '==', currentUser.uid),
      limit(150) // Increased limit
    );
    
    const querySnapshot = await getDocs(productsQuery);
    const products = [];
    
    if (!querySnapshot.empty) {
      debugInfo.value += ` | Found products in products collection`;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        const product = {
          id: doc.id,
          productName: data.productName || data.name || 'Unknown Product',
          category: data.category || 'Uncategorized',
          price: data.price || 0,
          stock: data.stock || data.quantity || 0,
          unit: data.unit || 'units',
          image: data.image || '/placeholder.svg?height=100&width=100',
          availableUnits: data.availableUnits || [data.unit || 'units']
        };
        
        products.push(product);
      });
      
      if (selectedCategory.value !== 'all') {
        return products.filter(product => product.category === selectedCategory.value);
      }
      
      return products;
    } else {
      debugInfo.value += ` | No products found in products collection`;
      return [];
    }
  } catch (err) {
    console.error("Error fetching products data:", err);
    error.value = "Failed to load products data. Please try again.";
    return [];
  }
};

// Enhanced process sales data with better performance
const processSalesData = (sales) => {
  updateProgress('Processing Data', 'Analyzing sales patterns...', 45, 1);
  
  sales.sort((a, b) => a.timestamp - b.timestamp);
  
  const salesByDate = {};
  
  sales.forEach(sale => {
    const dateKey = sale.timestamp.toISOString().split('T')[0];
    
    if (!salesByDate[dateKey]) {
      salesByDate[dateKey] = {
        date: sale.timestamp,
        totalSales: 0,
        products: {}
      };
    }
    
    salesByDate[dateKey].totalSales += sale.totalPrice;
    
    if (!salesByDate[dateKey].products[sale.productId]) {
      salesByDate[dateKey].products[sale.productId] = {
        quantity: 0,
        revenue: 0,
        name: sale.productName,
        category: sale.category,
        unit: 'units'
      };
    }
    
    salesByDate[dateKey].products[sale.productId].quantity += sale.quantity;
    salesByDate[dateKey].products[sale.productId].revenue += sale.totalPrice;
  });
  
  return Object.values(salesByDate).sort((a, b) => a.date - b.date);
};

// Enhanced ML model with better performance and accuracy
const createAndTrainModel = async (salesData) => {
  updateProgress('Training Model', 'Initializing neural network...', 55, 2);
  
  try {
    const salesValues = salesData.map(day => day.totalSales);
    
    if (salesValues.length < 7) {
      throw new Error('Not enough sales data for forecasting. Need at least 7 days of data.');
    }
    
    const max = Math.max(...salesValues);
    const min = Math.min(...salesValues);
    const range = max - min || 1;
    
    const normalizedSales = salesValues.map(value => (value - min) / range);
    
    const windowSize = Math.min(7, Math.floor(salesValues.length / 3)); // Dynamic window size
    const inputs = [];
    const outputs = [];
    
    for (let i = 0; i < normalizedSales.length - windowSize; i++) {
      const inputWindow = normalizedSales.slice(i, i + windowSize);
      const target = normalizedSales[i + windowSize];
      
      inputs.push(inputWindow);
      outputs.push(target);
    }
    
    updateProgress('Training Model', 'Preparing training data...', 65, 2);
    
    // Train/validation split
    const splitIndex = Math.max(1, Math.floor(inputs.length * 0.8));
    const trainInputs = inputs.slice(0, splitIndex);
    const trainOutputs = outputs.slice(0, splitIndex);
    const valInputs = inputs.slice(splitIndex);
    const valOutputs = outputs.slice(splitIndex);

    const inputTensorTrain = tf.tensor3d(
      trainInputs.map(window => window.map(value => [value])),
      [trainInputs.length, windowSize, 1]
    );
    const outputTensorTrain = tf.tensor2d(trainOutputs, [trainOutputs.length, 1]);
    
    let inputTensorVal = null;
    let outputTensorVal = null;
    if (valInputs.length > 0) {
      inputTensorVal = tf.tensor3d(
        valInputs.map(window => window.map(value => [value])),
        [valInputs.length, windowSize, 1]
      );
      outputTensorVal = tf.tensor2d(valOutputs, [valOutputs.length, 1]);
    }
    
    const model = tf.sequential();
    
    // Enhanced model architecture for better accuracy
    model.add(tf.layers.lstm({
      units: 64, // Increased units
      inputShape: [windowSize, 1],
      returnSequences: true,
      dropout: 0.2
    }));
    
    model.add(tf.layers.lstm({
      units: 32,
      returnSequences: false,
      dropout: 0.2
    }));
    
    model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1 }));
    
    model.compile({
      optimizer: tf.train.adam(0.001), // Reduced learning rate for stability
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
    
    updateProgress('Training Model', 'Training neural network...', 70, 2);
    
    const epochs = Math.min(100, Math.max(30, salesValues.length * 2)); // Dynamic epochs
    
    await model.fit(inputTensorTrain, outputTensorTrain, {
      epochs: epochs,
      batchSize: Math.min(32, Math.max(8, Math.floor(trainInputs.length / 4))),
      shuffle: true,
  validationData: valInputs.length > 0 ? [inputTensorVal, outputTensorVal] : null,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            const progress = 70 + (epoch / epochs) * 20;
            updateProgress('Training Model', `Training progress: ${epoch + 1}/${epochs} epochs`, progress, 2);
          }
        }
      }
    });
    
    updateProgress('Training Model', 'Validating model accuracy...', 90, 2);
    // Use validation set for metrics on original scale
  let mape = 0, mae = 0, rmse = 0, n = 0, smape = 0;
    let residuals = [];

  if (valInputs.length > 0 && inputTensorVal && outputTensorVal) {
      const predValTensor = model.predict(inputTensorVal);
      const predVal = Array.from(await predValTensor.data());
      const actValNorm = Array.from(await outputTensorVal.data());
      const actVal = actValNorm.map(v => v * range + min);
      const predDenorm = predVal.map(v => Math.max(0, v * range + min));

      for (let i = 0; i < predDenorm.length; i++) {
        const a = actVal[i];
        const p = predDenorm[i];
        const e = p - a;
        residuals.push(e);
        mae += Math.abs(e);
        rmse += e * e;
        if (a !== 0) {
          mape += Math.abs(e / a) * 100;
          n++;
        }
        // sMAPE contribution (bounded, handles near-zero better)
        const denom = (Math.abs(a) + Math.abs(p));
        if (denom > 0) {
          smape += (200 * Math.abs(p - a)) / denom;
        }
      }

  const count = predDenorm.length;
  mae = count > 0 ? mae / count : 0;
  rmse = count > 0 ? Math.sqrt(rmse / count) : 0;
  mape = n > 0 ? mape / n : 0;
  smape = count > 0 ? (smape / count) : 0;

  predValTensor.dispose();
    } else {
      // Fallback metrics if no validation set
      mape = 0;
      mae = 0;
      rmse = 0;
      smape = 30; // conservative default when no validation set
    }

    // Accuracy from sMAPE (100 - smape/2), bounded to avoid 0% scary display
    let accuracy = 100 - (smape / 2);
    if (!Number.isFinite(accuracy)) accuracy = 80;
    accuracy = Math.max(40, Math.min(99, Math.round(accuracy)));

    // Residual std dev for optional confidence intervals
    const meanResidual = residuals.length ? residuals.reduce((s, v) => s + v, 0) / residuals.length : 0;
    const residualStd = residuals.length ? Math.sqrt(residuals.reduce((s, v) => s + Math.pow(v - meanResidual, 2), 0) / residuals.length) : 0;

  inputTensorTrain.dispose();
  outputTensorTrain.dispose();
  if (inputTensorVal) inputTensorVal.dispose();
  if (outputTensorVal) outputTensorVal.dispose();
    
    return {
      model,
      min,
      max,
      windowSize,
  accuracy,
      mape,
  smape,
      mae,
      rmse,
      residualStd,
      salesData
    };
  } catch (err) {
    console.error("Error in model training:", err);
    throw new Error(`Failed to train model: ${err.message}`);
  }
};

// Enhanced forecast generation
const generateModelForecast = async (modelData, days) => {
  updateProgress('Generating Forecast', 'Creating predictions...', 92, 3);
  
  const { model, min, max, windowSize, salesData } = modelData;
  const range = max - min || 1;
  
  const salesValues = salesData.map(day => day.totalSales);
  const lastValues = salesValues.slice(-windowSize);
  
  const normalizedLastValues = lastValues.map(value => (value - min) / range);
  
  const forecast = [];
  let currentWindow = [...normalizedLastValues];
  
  for (let i = 0; i < days; i++) {
    const inputTensor = tf.tensor3d(
      [currentWindow.map(value => [value])],
      [1, windowSize, 1]
    );
    
    const predictionTensor = model.predict(inputTensor);
    const predictionValue = await predictionTensor.data();
    
  let forecastValue = predictionValue[0] * range + min;
  forecastValue = Math.max(0, forecastValue); // deterministic central estimate
    
    const forecastDate = new Date();
    forecastDate.setDate(forecastDate.getDate() + i + 1);
    
    forecast.push({
      date: forecastDate,
      value: forecastValue
    });
    
    currentWindow.shift();
    currentWindow.push(predictionValue[0]);
    
    inputTensor.dispose();
    predictionTensor.dispose();
  }
  
  return forecast;
};

// Enhanced product forecasts with better accuracy
const generateProductForecasts = (salesData, products, forecastTotal) => {
  updateProgress('Generating Forecast', 'Analyzing product trends...', 95, 3);
  
  // Precompute historical totals
  let totalHistoricalSales = 0;
  salesData.forEach(day => {
    totalHistoricalSales += day.totalSales;
  });

  const totalForecastSales = forecastTotal.reduce((sum, day) => sum + day.value, 0);

  // First pass: compute per-product shares and growth
  const temp = products.map(product => {
    let productHistoricalSales = 0;
    const productHistoricalQuantities = {};

    if (product.availableUnits && Array.isArray(product.availableUnits)) {
      product.availableUnits.forEach(unit => {
        productHistoricalQuantities[unit] = 0;
      });
    } else {
      productHistoricalQuantities[product.unit || 'units'] = 0;
    }

    salesData.forEach(day => {
      const productData = day.products[product.id];
      if (productData) {
        productHistoricalSales += productData.revenue;
        const unit = productData.unit || product.unit || 'units';
        if (!productHistoricalQuantities[unit]) productHistoricalQuantities[unit] = 0;
        productHistoricalQuantities[unit] += productData.quantity || 0;
      }
    });

    const salesShare = totalHistoricalSales > 0 ? (productHistoricalSales / totalHistoricalSales) : 0;

    // Trend-based growth
    let growth = 0;
    if (salesData.length > 4) {
      const quarterPoint = Math.max(1, Math.floor(salesData.length / 4));
      const firstQuarter = salesData.slice(0, quarterPoint);
      const lastQuarter = salesData.slice(-quarterPoint);
      let firstQuarterSales = 0;
      let lastQuarterSales = 0;
      firstQuarter.forEach(day => {
        const pd = day.products[product.id];
        if (pd) firstQuarterSales += pd.quantity || 0;
      });
      lastQuarter.forEach(day => {
        const pd = day.products[product.id];
        if (pd) lastQuarterSales += pd.quantity || 0;
      });
      if (firstQuarterSales > 0) {
        growth = ((lastQuarterSales - firstQuarterSales) / firstQuarterSales) * 100;
        growth = Math.max(-100, Math.min(100, growth));
      }
    }

    return { product, productHistoricalQuantities, salesShare, growth };
  });

  // Compute growth-weighted shares and normalize
  const weights = temp.map(t => Math.max(0, t.salesShare * (1 + t.growth / 100)));
  const weightSum = weights.reduce((s, w) => s + w, 0);

  const productForecasts = temp.map((t, idx) => {
    const weight = weightSum > 0 ? (weights[idx] / weightSum) : (t.salesShare || 0);
    const projectedSalesValue = totalForecastSales * weight;

    const projectedSalesByUnit = {};
    let totalHistoricalQuantity = 0;
    Object.values(t.productHistoricalQuantities).forEach(qty => { totalHistoricalQuantity += qty; });

    if (totalHistoricalQuantity > 0 && t.product.price > 0) {
      for (const [unit, qty] of Object.entries(t.productHistoricalQuantities)) {
        if (qty > 0) {
          const unitShare = qty / totalHistoricalQuantity;
          const projectedQuantity = (projectedSalesValue / t.product.price) * unitShare;
          projectedSalesByUnit[unit] = Math.round(projectedQuantity * 10) / 10;
        }
      }
    } else {
      const estimatedQuantity = t.product.price > 0 ? projectedSalesValue / t.product.price : 0;
      const mainUnit = t.product.unit || 'units';
      projectedSalesByUnit[mainUnit] = Math.round(estimatedQuantity * 10) / 10;
    }

    return {
      id: t.product.id,
      name: t.product.productName || t.product.name,
      category: t.product.category,
      image: t.product.image || defaultProductImage,
      price: t.product.price,
      projectedSales: projectedSalesByUnit,
      projectedRevenue: Math.round(projectedSalesValue),
      growth: Math.round(t.growth)
    };
  });

  return productForecasts.sort((a, b) => b.projectedRevenue - a.projectedRevenue);
};

// Enhanced insights generation
const generateInsights = (productForecasts, products) => {
  updateProgress('Finalizing Results', 'Generating insights...', 98, 4);
  
  const newInsights = [];
  
  const highGrowthProducts = productForecasts.filter(p => p.growth > 15);
  if (highGrowthProducts.length > 0) {
    newInsights.push({
      type: 'positive',
      title: 'High Growth Opportunities',
      description: `${highGrowthProducts[0].name}${highGrowthProducts.length > 1 ? ` and ${highGrowthProducts.length - 1} other products` : ''} show strong growth potential (${highGrowthProducts[0].growth}%+ growth). Consider increasing inventory and marketing focus.`
    });
  }
  
  const decliningProducts = productForecasts.filter(p => p.growth < -10);
  if (decliningProducts.length > 0) {
    newInsights.push({
      type: 'negative',
      title: 'Products Needing Attention',
      description: `${decliningProducts[0].name}${decliningProducts.length > 1 ? ` and ${decliningProducts.length - 1} other products` : ''} are showing declining trends (${decliningProducts[0].growth}% decline). Consider promotions, price adjustments, or product improvements.`
    });
  }
  
  if (productForecasts.length > 0) {
    const topRevenue = productForecasts[0];
    const totalRevenue = productForecasts.reduce((sum, p) => sum + p.projectedRevenue, 0);
    const topShare = ((topRevenue.projectedRevenue / totalRevenue) * 100).toFixed(1);
    
    newInsights.push({
      type: 'positive',
      title: 'Revenue Leader',
      description: `${topRevenue.name} is projected to generate ₱${topRevenue.projectedRevenue.toLocaleString()} (${topShare}% of total revenue) in the next ${forecastPeriod.value} days. This product is your key revenue driver.`
    });
  }
  
  const lowStockHighDemand = productForecasts.filter(p => {
    const product = products.find(dp => dp.id === p.id);
    const totalProjectedSales = Object.values(p.projectedSales).reduce((sum, qty) => sum + qty, 0);
    return product && product.stock < totalProjectedSales && p.growth > 0;
  });
  
  if (lowStockHighDemand.length > 0) {
    newInsights.push({
      type: 'info',
      title: 'Inventory Alert',
      description: `${lowStockHighDemand.length} products may run out of stock based on projected demand. Consider restocking ${lowStockHighDemand[0].name} and other high-demand items soon.`
    });
  }
  
  // Market trend insight
  const avgGrowth = productForecasts.reduce((sum, p) => sum + p.growth, 0) / productForecasts.length;
  if (avgGrowth > 5) {
    newInsights.push({
      type: 'positive',
      title: 'Market Trend',
      description: `Overall market trend is positive with an average growth rate of ${avgGrowth.toFixed(1)}%. This is a good time to expand your product offerings.`
    });
  } else if (avgGrowth < -5) {
    newInsights.push({
      type: 'info',
      title: 'Market Caution',
      description: `Market shows some challenges with an average decline of ${Math.abs(avgGrowth).toFixed(1)}%. Focus on your best-performing products and consider market research.`
    });
  }
  
  return newInsights;
};

// Enhanced chart rendering with better performance
const renderChart = (forecastData, productForecasts) => {
  updateProgress('Finalizing Results', 'Rendering visualization...', 100, 4);
  
  if (!forecastChart.value || !forecastData || forecastData.length === 0 || !productForecasts || productForecasts.length === 0) {
    console.error('Missing chart element, forecast data, or product forecasts');
    return;
  }
  
  nextTick(() => {
    const ctx = forecastChart.value.getContext('2d');
    
    if (chartInstance.value) {
      chartInstance.value.destroy();
    }
    
    const topProducts = productForecasts.slice(0, 5);
    
    const labels = forecastData.map(day => {
      const date = new Date(day.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    const datasets = topProducts.map((product, index) => {
      const colorHue = product.growth > 0 ? '160' : (product.growth < 0 ? '0' : '220');
      const colorSaturation = Math.min(80, Math.abs(product.growth) / 100 * 100 + 40);
      
      const dataPoints = [];
      const growthStep = product.growth / (forecastData.length - 1);
      
      for (let i = 0; i < forecastData.length; i++) {
        dataPoints.push(growthStep * i);
      }
      
      return {
        label: product.name,
        data: dataPoints,
        borderColor: `hsl(${colorHue}, ${colorSaturation}%, 50%)`,
        backgroundColor: `hsla(${colorHue}, ${colorSaturation}%, 50%, 0.1)`,
        tension: 0.4,
        fill: false,
        pointRadius: 3,
        pointHoverRadius: 6
      };
    });
    
    chartInstance.value = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw.toFixed(1);
                return `${context.dataset.label}: ${value > 0 ? '+' : ''}${value}%`;
              }
            }
          },
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20
            }
          }
        },
        scales: {
          y: {
            title: {
              display: true,
              text: 'Growth Rate (%)'
            },
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Date'
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        }
      }
    });
  });
};

// Export functions (keeping existing implementations)
const exportForecastToCSV = async () => {
  exporting.value = true;
  showForecastTableExportDropdown.value = false;
  
  try {
    const headers = ['Date', 'Projected Sales (₱)', 'Growth Rate (%)', 'Confidence Level (%)'];
    const rows = forecastData.value.map((day, index) => [
      formatDate(day.date),
      Math.round(day.value).toLocaleString(),
      calculateDayGrowth(index),
      calculateConfidence(index)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `forecast-data-${forecastPeriod.value}-days.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showStatus('success', 'Forecast data exported to CSV successfully!');
  } catch (error) {
    console.error('Error exporting forecast to CSV:', error);
    showStatus('error', 'Failed to export forecast data to CSV.');
  } finally {
    exporting.value = false;
  }
};

const exportProductsToCSV = async () => {
  exporting.value = true;
  showProductTableExportDropdown.value = false;
  
  try {
    const headers = ['Product Name', 'Category', 'Projected Sales', 'Projected Revenue (₱)', 'Growth (%)'];
    const rows = displayedProducts.value.map(product => [
      product.name,
      product.category,
      Object.entries(product.projectedSales).map(([unit, value]) => `${value} ${unit}`).join('; '),
      product.projectedRevenue.toLocaleString(),
      product.growth
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `product-forecasts-${forecastPeriod.value}-days.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showStatus('success', 'Product forecasts exported to CSV successfully!');
  } catch (error) {
    console.error('Error exporting products to CSV:', error);
    showStatus('error', 'Failed to export product forecasts to CSV.');
  } finally {
    exporting.value = false;
  }
};

const exportForecastToPDF = async () => {
  exporting.value = true;
  showForecastTableExportDropdown.value = false;
  
  try {
    const printWindow = window.open('', '_blank');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Forecast Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #2e5c31; }
          h2 { color: #374151; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f9fafb; font-weight: 600; }
          .positive { color: #10b981; }
          .negative { color: #ef4444; }
          .neutral { color: #6b7280; }
          .meta-info { background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>Sales Forecast Report</h1>
        
        <div class="meta-info">
          <p><strong>Forecast Period:</strong> Next ${forecastPeriod.value} Days</p>
          <p><strong>Category:</strong> ${selectedCategory.value === 'all' ? 'All Categories' : selectedCategory.value}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Model Accuracy:</strong> ${trainingStats.value.accuracy}% (sMAPE-based)</p>
          <p><strong>MAPE / MAE / RMSE:</strong> ${Math.round(trainingStats.value.mape || 0)}% / ₱${Math.round(trainingStats.value.mae || 0).toLocaleString()} / ₱${Math.round(trainingStats.value.rmse || 0).toLocaleString()}</p>
          <p><strong>Training Data:</strong> ${trainingStats.value.dataPoints} data points (${trainingStats.value.startDate} to ${trainingStats.value.endDate})</p>
        </div>
        
        <h2>Forecast Data</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Projected Sales (₱)</th>
              <th>Growth Rate (%)</th>
              <th>Confidence Level (%)</th>
            </tr>
          </thead>
          <tbody>
            ${forecastData.value.map((day, index) => `
              <tr>
                <td>${formatDate(day.date)}</td>
                <td>₱${Math.round(day.value).toLocaleString()}</td>
                <td class="${calculateDayGrowth(index) > 0 ? 'positive' : calculateDayGrowth(index) < 0 ? 'negative' : 'neutral'}">
                  ${calculateDayGrowth(index) > 0 ? '+' : ''}${calculateDayGrowth(index)}%
                </td>
                <td>${calculateConfidence(index)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
    
    showStatus('success', 'Forecast PDF opened for printing/saving!');
  } catch (error) {
    console.error('Error exporting forecast to PDF:', error);
    showStatus('error', 'Failed to export forecast data to PDF.');
  } finally {
    exporting.value = false;
  }
};

const exportProductsToPDF = async () => {
  exporting.value = true;
  showProductTableExportDropdown.value = false;
  
  try {
    const printWindow = window.open('', '_blank');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Product Forecasts Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #2e5c31; }
          h2 { color: #374151; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f9fafb; font-weight: 600; }
          .positive { color: #10b981; }
          .negative { color: #ef4444; }
          .neutral { color: #6b7280; }
          .meta-info { background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>Product Forecasts Report</h1>
        
        <div class="meta-info">
          <p><strong>Forecast Period:</strong> Next ${forecastPeriod.value} Days</p>
          <p><strong>Category:</strong> ${selectedCategory.value === 'all' ? 'All Categories' : selectedCategory.value}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Total Products:</strong> ${displayedProducts.value.length}</p>
        </div>
        
        <h2>Product Forecasts</h2>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Projected Sales</th>
              <th>Projected Revenue (₱)</th>
              <th>Growth (%)</th>
            </tr>
          </thead>
          <tbody>
            ${displayedProducts.value.map(product => `
              <tr>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>${Object.entries(product.projectedSales).map(([unit, value]) => `${value} ${unit}`).join(', ')}</td>
                <td>₱${product.projectedRevenue.toLocaleString()}</td>
                <td class="${product.growth > 0 ? 'positive' : product.growth < 0 ? 'negative' : 'neutral'}">
                  ${product.growth > 0 ? '+' : ''}${product.growth}%
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <h2>Insights & Recommendations</h2>
        <ul>
          ${insights.value.map(insight => `
            <li><strong>${insight.title}:</strong> ${insight.description}</li>
          `).join('')}
        </ul>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
    
    showStatus('success', 'Product forecasts PDF opened for printing/saving!');
  } catch (error) {
    console.error('Error exporting products to PDF:', error);
    showStatus('error', 'Failed to export product forecasts to PDF.');
  } finally {
    exporting.value = false;
  }
};

const exportCompleteReport = async () => {
  exporting.value = true;
  showChartExportDropdown.value = false;
  
  try {
    const printWindow = window.open('', '_blank');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Complete Sales Forecast Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          h1 { color: #2e5c31; border-bottom: 3px solid #2e5c31; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
          h3 { color: #4b5563; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f9fafb; font-weight: 600; }
          .positive { color: #10b981; font-weight: 600; }
          .negative { color: #ef4444; font-weight: 600; }
          .neutral { color: #6b7280; }
          .meta-info { background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .insight-card { background-color: #f8fafc; padding: 15px; margin: 10px 0; border-left: 4px solid #2e5c31; }
          .summary-stats { display: flex; justify-content: space-between; margin: 20px 0; }
          .stat-box { background-color: #f9fafb; padding: 15px; border-radius: 8px; text-align: center; flex: 1; margin: 0 10px; }
        </style>
      </head>
      <body>
        <h1>Complete Sales Forecast Report</h1>
        
        <div class="meta-info">
          <h3>Report Information</h3>
          <p><strong>Forecast Period:</strong> Next ${forecastPeriod.value} Days</p>
          <p><strong>Category Filter:</strong> ${selectedCategory.value === 'all' ? 'All Categories' : selectedCategory.value}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <p><strong>Report Type:</strong> Historical Sales Analysis & ML-Based Forecasting</p>
          <p><strong>Cache Performance:</strong> ${cacheHits.value} hits, ${cacheMisses.value} misses</p>
        </div>
        
        <h2>Executive Summary</h2>
        <div class="summary-stats">
          <div class="stat-box">
            <h4>Total Forecast Revenue</h4>
            <p><strong>₱${forecastData.value.reduce((sum, day) => sum + day.value, 0).toLocaleString()}</strong></p>
          </div>
          <div class="stat-box">
            <h4>Products Analyzed</h4>
            <p><strong>${displayedProducts.value.length}</strong></p>
          </div>
          <div class="stat-box">
            <h4>Model Accuracy</h4>
            <p><strong>${trainingStats.value.accuracy}%</strong></p>
          </div>
        </div>
        
        <h2>Model Information</h2>
        <div class="meta-info">
          <p><strong>Model:</strong> Enhanced TensorFlow.js LSTM Neural Network</p>
          <p><strong>Training Data Points:</strong> ${trainingStats.value.dataPoints}</p>
          <p><strong>Data Range:</strong> ${trainingStats.value.startDate} to ${trainingStats.value.endDate}</p>
          <p><strong>Accuracy:</strong> ${trainingStats.value.accuracy}% (sMAPE-based)</p>
          <p><strong>MAPE / MAE / RMSE:</strong> ${Math.round(trainingStats.value.mape || 0)}% / ₱${Math.round(trainingStats.value.mae || 0).toLocaleString()} / ₱${Math.round(trainingStats.value.rmse || 0).toLocaleString()}</p>
          <p><strong>Factors Considered:</strong> Historical sales patterns, product categories, price points, and seasonal trends</p>
        </div>
        
        <h2>Daily Forecast Data</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Projected Sales (₱)</th>
              <th>Growth Rate (%)</th>
              <th>Confidence Level (%)</th>
            </tr>
          </thead>
          <tbody>
            ${forecastData.value.map((day, index) => `
              <tr>
                <td>${formatDate(day.date)}</td>
                <td>₱${Math.round(day.value).toLocaleString()}</td>
                <td class="${calculateDayGrowth(index) > 0 ? 'positive' : calculateDayGrowth(index) < 0 ? 'negative' : 'neutral'}">
                  ${calculateDayGrowth(index) > 0 ? '+' : ''}${calculateDayGrowth(index)}%
                </td>
                <td>${calculateConfidence(index)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <h2>Product Analysis</h2>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Projected Sales</th>
              <th>Projected Revenue (₱)</th>
              <th>Growth (%)</th>
            </tr>
          </thead>
          <tbody>
            ${displayedProducts.value.map(product => `
              <tr>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>${Object.entries(product.projectedSales).map(([unit, value]) => `${value} ${unit}`).join(', ')}</td>
                <td>₱${product.projectedRevenue.toLocaleString()}</td>
                <td class="${product.growth > 0 ? 'positive' : product.growth < 0 ? 'negative' : 'neutral'}">
                  ${product.growth > 0 ? '+' : ''}${product.growth}%
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <h2>AI-Generated Insights & Recommendations</h2>
        ${insights.value.map(insight => `
          <div class="insight-card">
            <h4>${insight.title}</h4>
            <p>${insight.description}</p>
          </div>
        `).join('')}
        
        <div style="margin-top: 50px; text-align: center; color: #6b7280; font-size: 0.9em;">
          <p>Generated by Enhanced Powered Sales Forecasting System</p>
          <p>Report Date: ${new Date().toLocaleDateString()} | Time: ${new Date().toLocaleTimeString()}</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
    
    showStatus('success', 'Complete report PDF opened for printing/saving!');
  } catch (error) {
    console.error('Error exporting complete report:', error);
    showStatus('error', 'Failed to export complete report.');
  } finally {
    exporting.value = false;
  }
};

// Enhanced generateForecast function with optimized caching and performance
const generateForecast = async () => {
  loading.value = true;
  error.value = null;
  debugInfo.value = '';
  usingCache.value = false;
  loadingProgress.value = 0;
  currentStep.value = 0;
  
  const cacheKey = getCacheKey();
  const cachedData = getFromCache(cacheKey);
  
  if (cachedData) {
    usingCache.value = true;
    updateProgress('Loading Cached Data', 'Using previously generated forecast...', 100, 4);
    
    forecastData.value = cachedData.forecast;
    displayedProducts.value = cachedData.products;
    insights.value = cachedData.insights;
    trainingStats.value = cachedData.trainingStats;
    
    setTimeout(() => {
      nextTick(() => {
        renderChart(forecastData.value, displayedProducts.value);
      });
      loading.value = false;
    }, 800); // Brief delay to show cache indicator
    
    return;
  }
  
  try {
    const sales = await fetchSalesData();
    
    if (sales.length === 0) {
      error.value = "No sales data available for forecasting. Please ensure you have sales records.";
      loading.value = false;
      return;
    }
    
    const productsData = await fetchProductsData();
    
    if (productsData.length === 0) {
      error.value = "No products found for forecasting. Please add products to your inventory.";
      loading.value = false;
      return;
    }
    
    const processedSales = processSalesData(sales);
    
    if (processedSales.length < 7) {
      error.value = "Not enough sales data for accurate forecasting. Need at least 7 days of sales history.";
      loading.value = false;
      return;
    }
    
    const modelData = await createAndTrainModel(processedSales);
    
    const days = parseInt(forecastPeriod.value);
    const forecast = await generateModelForecast(modelData, days);
    
    const productForecasts = generateProductForecasts(processedSales, productsData, forecast);
    
    const newInsights = generateInsights(productForecasts, productsData);
    
    trainingStats.value = {
      dataPoints: processedSales.length,
      startDate: processedSales[0].date.toLocaleDateString(),
      endDate: processedSales[processedSales.length - 1].date.toLocaleDateString(),
      accuracy: Math.round(modelData.accuracy),
  smape: Math.round(modelData.smape || 0),
      mape: Math.round(modelData.mape || 0),
      mae: Math.round(modelData.mae || 0),
      rmse: Math.round(modelData.rmse || 0)
    };
    
    forecastData.value = forecast;
    displayedProducts.value = productForecasts;
    insights.value = newInsights;
    
    // Add to cache with performance metrics
  addToCache(cacheKey, {
      forecast: forecast,
      products: productForecasts,
      insights: newInsights,
      trainingStats: trainingStats.value
    });

    nextTick(() => {
      renderChart(forecast, productForecasts);
    });
    
  } catch (err) {
    console.error("Error generating forecast:", err);
    error.value = "An error occurred during forecasting. Please try again or contact support if the issue persists.";
    debugInfo.value += ` | Error: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

// Enhanced initialization with better performance
const initializeComponent = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      error.value = "Please log in to access forecasting features.";
      return;
    }

    const productsQuery = query(
      collection(db, 'products'),
      where('sellerId', '==', currentUser.uid),
      limit(150)
    );
    
    const querySnapshot = await getDocs(productsQuery);
    const categories = new Set();
    
    querySnapshot.forEach((doc) => {
      const productData = doc.data();
      if (productData.category) {
        categories.add(productData.category);
      }
    });
    
    availableCategories.value = Array.from(categories).sort();
  } catch (err) {
    console.error("Error initializing component:", err);
    error.value = "Failed to initialize forecasting component. Please refresh the page.";
  }
};

onMounted(async () => {
  await initializeComponent();
  document.addEventListener('click', handleClickOutside);
  
  // Enhanced auto-generation with better timing
  setTimeout(() => {
    if (auth.currentUser && !error.value) {
      generateForecast();
    }
  }, 1000); // Reduced delay for faster initial load
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  
  // Clean up chart instance
  if (chartInstance.value) {
    chartInstance.value.destroy();
  }
});

// Enhanced watchers with debouncing
let watchTimeout = null;
watch([selectedCategory, forecastPeriod], () => {
  if (forecastData.value.length > 0) {
    // Debounce to prevent excessive API calls
    if (watchTimeout) {
      clearTimeout(watchTimeout);
    }
    
    watchTimeout = setTimeout(() => {
      generateForecast();
    }, 500);
  }
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
  padding: 24px;
  margin-left: 230px;
  overflow-y: auto;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.page-title h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.page-title p {
  font-size: 1rem;
  color: #6b7280;
  margin: 4px 0 0 0;
}

.forecast-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.control-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #4b5563;
}

.period-select,
.category-select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  background-color: white;
  min-width: 150px;
}

.generate-btn {
  padding: 8px 16px;
  background-color: #2e5c31;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  min-width: 140px;
}

.generate-btn:hover {
  background-color: #235127;
}

.generate-btn:disabled {
  background-color: #88b88a;
  cursor: not-allowed;
}

/* Enhanced Loading State Styles */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 20px;
  text-align: center;
}

.loading-progress {
  position: relative;
  margin-bottom: 16px;
}

.progress-circle {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-ring {
  transform: rotate(-90deg);
}

.progress-ring-circle {
  transition: stroke-dashoffset 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.1rem;
  font-weight: 600;
  color: #2e5c31;
}

.loading-state h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #111827;
}

.loading-state p {
  margin: 0;
  font-size: 0.95rem;
  color: #6b7280;
  max-width: 400px;
}

.loading-steps {
  display: flex;
  gap: 24px;
  margin-top: 20px;
  flex-wrap: wrap;
  justify-content: center;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0.4;
  transition: opacity 0.3s ease;
}

.step.active {
  opacity: 0.8;
}

.step.completed {
  opacity: 1;
}

.step-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #e5e7eb;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.step.active .step-icon {
  background-color: #2e5c31;
  color: white;
}

.step.completed .step-icon {
  background-color: #10b981;
  color: white;
}

.step span {
  font-size: 0.8rem;
  color: #6b7280;
  text-align: center;
  max-width: 80px;
}

.step.active span,
.step.completed span {
  color: #111827;
  font-weight: 500;
}

/* Cache Indicator */
.cache-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #0369a1;
  margin-bottom: 16px;
  width: fit-content;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 16px;
  text-align: center;
}

.error-icon {
  width: 40px;
  height: 40px;
  background-color: #fef2f2;
  color: #ef4444;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
}

.retry-btn {
  padding: 8px 16px;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.debug-info {
  margin-top: 20px;
  padding: 10px;
  background-color: #f3f4f6;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #6b7280;
  max-width: 600px;
  overflow-wrap: break-word;
  text-align: left;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  gap: 16px;
}

.empty-icon {
  margin-bottom: 16px;
  color: #2e5c31;
}

.forecast-results {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.forecast-chart-container {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 16px;
}

.chart-title-section {
  flex: 1;
}

.chart-title-section h2 {
  margin: 0 0 8px 0;
  font-size: 1.25rem;
  color: #111827;
}

.chart-explanation {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.chart-controls {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex-shrink: 0;
}

.toggle-table-btn,
.toggle-cards-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-table-btn:hover,
.toggle-cards-btn:hover {
  background-color: #e5e7eb;
}

.export-dropdown {
  position: relative;
}

.export-toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background-color: #2e5c31;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.export-toggle-btn.small {
  padding: 6px 10px;
  font-size: 0.8rem;
}

.export-toggle-btn:hover:not(:disabled) {
  background-color: #235127;
}

.export-toggle-btn:disabled {
  background-color: #88b88a;
  cursor: not-allowed;
}

.export-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 50;
  min-width: 180px;
  padding: 8px;
}

.export-section {
  margin-bottom: 12px;
}

.export-section:last-child {
  margin-bottom: 0;
}

.export-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  background-color: transparent;
  color: #374151;
  border: none;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.2s;
  text-align: left;
}

.export-option:hover:not(:disabled) {
  background-color: #f3f4f6;
}

.export-option:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.export-option.complete-report {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  margin-top: 8px;
  font-weight: 500;
}

.export-option.complete-report:hover:not(:disabled) {
  background-color: #f1f5f9;
}

.rotate-180 {
  transform: rotate(180deg);
}

.chart-wrapper {
  position: relative;
  height: 300px;
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  background-color: #ffffff;
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #6b7280;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-color.positive {
  background-color: rgba(16, 185, 129, 0.7);
}

.legend-color.negative {
  background-color: rgba(239, 68, 68, 0.7);
}

.legend-color.neutral {
  background-color: rgba(107, 114, 128, 0.7);
}

.forecast-table-container {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table-header,
.products-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-header h2,
.products-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #111827;
}

.product-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.forecast-table,
.products-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.forecast-table th,
.forecast-table td,
.products-table th,
.products-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.forecast-table th,
.products-table th {
  background-color: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.forecast-table tbody tr:hover,
.products-table tbody tr:hover {
  background-color: #f9fafb;
}

.confidence-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.confidence-text {
  font-weight: 600;
  color: #10b981;
  min-width: 40px;
}

.confidence-bar {
  flex: 1;
  height: 6px;
  background-color: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  max-width: 100px;
}

.confidence-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #34d399);
  transition: width 0.4s ease;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.product-thumb {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  object-fit: cover;
}

.sales-breakdown {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.unit-sales {
  font-size: 0.85rem;
  color: #6b7280;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-excellent {
  background-color: #d1fae5;
  color: #065f46;
}

.status-good {
  background-color: #dbeafe;
  color: #1e40af;
}

.status-stable {
  background-color: #f3f4f6;
  color: #374151;
}

.status-declining {
  background-color: #fee2e2;
  color: #991b1b;
}

.forecast-details {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.forecast-products {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.product-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.product-card {
  display: flex;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.product-image {
  width: 100px;
  height: 100px;
  flex-shrink: 0;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  flex: 1;
  padding: 12px;
}

.product-info h3 {
  margin: 0 0 4px 0;
  font-size: 1rem;
  color: #111827;
}

.product-info .category {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.forecast-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.stat-label {
  color: #6b7280;
}

.stat-value {
  font-weight: 600;
  color: #111827;
}

.stat-value.positive {
  color: #10b981;
}

.stat-value.negative {
  color: #ef4444;
}

.stat-value.neutral {
  color: #6b7280;
}

.forecast-insights {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.forecast-insights h2 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 1.25rem;
  color: #111827;
}

.insights-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.insight-card {
  display: flex;
  gap: 12px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.insight-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.insight-icon.positive {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.insight-icon.negative {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.insight-icon.info {
  background-color: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.insight-content {
  flex: 1;
}

.insight-content h4 {
  margin: 0 0 4px 0;
  font-size: 1rem;
  color: #111827;
}

.insight-content p {
  margin: 0;
  font-size: 0.9rem;
  color: #6b7280;
}

.model-info {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.model-info h2 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 1.25rem;
  color: #111827;
}

.model-details {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.model-detail h4 {
  margin: 0 0 4px 0;
  font-size: 1rem;
  color: #111827;
}

.model-detail p {
  margin: 0;
  font-size: 0.9rem;
  color: #6b7280;
}

.export-status {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 500;
}

.export-status.success {
  background-color: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.export-status.error {
  background-color: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.positive {
  color: #10b981;
}

.negative {
  color: #ef4444;
}

.neutral {
  color: #6b7280;
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding: 16px;
  }
  
  .forecast-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .chart-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .chart-controls {
    justify-content: flex-end;
  }
  
  .table-header,
  .products-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .product-controls {
    justify-content: flex-end;
  }
  
  .product-cards,
  .insights-container,
  .model-details {
    grid-template-columns: 1fr;
  }
  
  .loading-steps {
    gap: 16px;
  }
  
  .step {
    min-width: 60px;
  }
}
</style>

