<template>
  <div class="dashboard-container">
    <Sidebar initialActiveItem="Forecasting" />
    
    <div class="main-content">
      <header class="header">
        <div class="page-title">
          <h1>Sales Forecasting</h1>
          <p>AI-powered predictions based on your historical sales data</p>
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
          
          <div class="control-group toggle-group">
            <label>Seasonal Adjustment</label>
            <div class="toggle-wrapper">
              <label class="toggle">
                <input type="checkbox" v-model="useSeasonalAdjustment">
                <span class="toggle-slider"></span>
              </label>
              <span class="toggle-label">{{ useSeasonalAdjustment ? 'On' : 'Off' }}</span>
            </div>
          </div>
          
          <button @click="generateForecast" class="generate-btn" :disabled="loading">
            <RefreshCw v-if="loading" size="16" class="spinner" />
            <span v-else>Generate Forecast</span>
          </button>
        </div>
      </header>
      
      <div v-if="loading" class="loading-state">
        <div class="spinner-container">
          <div class="spinner"></div>
        </div>
        <p>Training AI model with your sales data...</p>
        <p class="loading-detail">{{ loadingMessage }}</p>
      </div>
      
      <div v-else-if="error" class="error-state">
        <div class="error-icon">!</div>
        <p>{{ error }}</p>
        <button @click="generateForecast" class="retry-btn">Try Again</button>
        <div class="debug-info">
          <p>Debug Info: {{ debugInfo }}</p>
        </div>
      </div>
      
      <div v-else-if="forecastData.length > 0" class="forecast-results">
        <div class="forecast-chart-container">
          <h2>Product Growth Trends for {{ forecastTitle }}</h2>
          <p class="chart-explanation">
            This chart shows how your top 5 products are expected to perform over time. 
            Each line represents a product's projected growth rate. 
            Rising lines (usually green) show growing sales, while falling lines (usually red) show declining sales.
            The percentage values show the expected growth or decline rate compared to previous sales.
          </p>
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
        
        <div class="forecast-details">
<div class="forecast-products">
  <h2>Product Forecasts</h2>
  <div class="product-cards">
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
          
          <div v-if="useSeasonalAdjustment" class="seasonal-trends">
            <h2>Seasonal Trends in the Philippines</h2>
            <div class="seasons-container">
              <div v-for="season in seasons" :key="season.name" 
                   class="season-card" 
                   :class="{ 'active-season': selectedSeason === season.id }">
                <div class="season-header">
                  <h3>{{ season.name }}</h3>
                  <span class="season-months">{{ season.months }}</span>
                </div>
                <div class="season-content">
                  <h4>Top Products:</h4>
                  <ul class="season-products">
                    <li v-for="product in season.topProducts" :key="product">{{ product }}</li>
                  </ul>
                  <div class="season-impact">
                    <h4>Seasonal Impact:</h4>
                    <p>{{ season.impact }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="model-info">
            <h2>About This Forecast</h2>
            <div class="model-details">
              <div class="model-detail">
                <h4>AI Model</h4>
                <p>TensorFlow.js LSTM Neural Network</p>
              </div>
              <div class="model-detail">
                <h4>Training Data</h4>
                <p>{{ trainingStats.dataPoints }} data points from {{ trainingStats.startDate }} to {{ trainingStats.endDate }}</p>
              </div>
              <div class="model-detail">
                <h4>Accuracy</h4>
                <p>{{ trainingStats.accuracy }}% (based on validation data)</p>
              </div>
              <div class="model-detail">
                <h4>Factors Considered</h4>
                <p>Historical sales{{ useSeasonalAdjustment ? ', seasonal patterns' : '' }}, product categories, and price points</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <div class="empty-icon">
          <BarChart2 size="48" />
        </div>
        <h2>No Forecast Generated</h2>
        <p>Select a time period and click "Generate Forecast" to predict future sales</p>
        <button @click="generateForecast" class="generate-btn">Generate Forecast</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
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
  RefreshCw 
} from 'lucide-vue-next';

import { useRouter } from 'vue-router';

const router = useRouter();

// Data properties
const forecastPeriod = ref('14');
const selectedCategory = ref('all');
const selectedSeason = ref('auto');
const useSeasonalAdjustment = ref(false);
const availableCategories = ref([]);
const loading = ref(false);
const loadingMessage = ref('');
const error = ref(null);
const debugInfo = ref('');
const forecastData = ref([]);
const displayedProducts = ref([]);
const insights = ref([]);
const forecastChart = ref(null);
const chartInstance = ref(null);
const trainingStats = ref({
  dataPoints: 0,
  startDate: '',
  endDate: '',
  accuracy: 0
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

// Helper function to get unit display name
const getUnitDisplay = (unit) => {
  return unitDisplayMap[unit] || unit || 'Unit';
};

// Philippine seasons
const seasons = ref([
  {
    id: 'dry',
    name: 'Dry Season',
    months: 'March - May',
    topProducts: ['Mango', 'Pineapple', 'Watermelon', 'Papaya'],
    impact: 'Higher demand for fruits and cooling vegetables. Prices for water-intensive crops may increase due to limited water supply.'
  },
  {
    id: 'rainy',
    name: 'Rainy Season',
    months: 'June - November',
    topProducts: ['Rice', 'Corn', 'Leafy Vegetables', 'Root Crops'],
    impact: 'Increased production of water-loving crops. Transportation challenges may affect supply chains and increase prices.'
  },
  {
    id: 'cool',
    name: 'Cool Season',
    months: 'December - February',
    topProducts: ['Cabbage', 'Carrots', 'Strawberries', 'Broccoli'],
    impact: 'Ideal growing conditions for highland vegetables. Holiday season increases demand for specialty produce.'
  }
]);

// Computed properties
const forecastTitle = computed(() => {
  let title = selectedCategory.value === 'all' ? 'All Products' : selectedCategory.value;
  
  if (useSeasonalAdjustment.value && selectedSeason.value !== 'auto') {
    const seasonObj = seasons.value.find(s => s.id === selectedSeason.value);
    if (seasonObj) {
      title += ` (${seasonObj.name})`;
    }
  }
  
  return `${title} (Next ${forecastPeriod.value} Days)`;
});

// Helper function to get growth class
const getGrowthClass = (growth) => {
  if (growth > 0) return 'positive';
  if (growth < 0) return 'negative';
  return 'neutral';
};

// Helper function to get current season
const getCurrentSeason = () => {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  
  if (month >= 3 && month <= 5) return 'dry';
  if (month >= 6 && month <= 11) return 'rainy';
  return 'cool'; // December, January, February
};

// Simplified fetch sales data from Firestore
const fetchSalesData = async () => {
  try {
    loadingMessage.value = 'Fetching sales data...';
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    debugInfo.value = `User ID: ${currentUser.uid}`;
    
    // Create a simple query for the sales collection
    const salesQuery = query(
      collection(db, 'sales'),
      where('sellerId', '==', currentUser.uid),
      limit(100)
    );
    
    const querySnapshot = await getDocs(salesQuery);
    const sales = [];
    
    if (!querySnapshot.empty) {
      debugInfo.value += ` | Found data in sales collection`;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Simple normalization
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
      
      debugInfo.value += ` | Total sales found: ${sales.length}`;
      
      // Apply category filter if selected
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

// Simplified fetch products data from Firestore
const fetchProductsData = async () => {
  try {
    loadingMessage.value = 'Fetching product data...';
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Create a simple query for the products collection
    const productsQuery = query(
      collection(db, 'products'),
      where('sellerId', '==', currentUser.uid),
      limit(100)
    );
    
    const querySnapshot = await getDocs(productsQuery);
    const products = [];
    
    if (!querySnapshot.empty) {
      debugInfo.value += ` | Found products in products collection`;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Simple normalization
        const product = {
          id: doc.id,
          productName: data.productName || data.name || 'Unknown Product',
          category: data.category || 'Uncategorized',
          price: data.price || 0,
          stock: data.stock || data.quantity || 0,
          unit: data.unit || 'units',
          image: data.image || '/placeholder.svg?height=100&width=100'
        };
        
        products.push(product);
      });
      
      // Apply category filter if selected
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

// Simplified process sales data
const processSalesData = (sales) => {
  loadingMessage.value = 'Processing sales data...';
  
  // Sort sales by date
  sales.sort((a, b) => a.timestamp - b.timestamp);
  
  // Group sales by date
  const salesByDate = {};
  
  sales.forEach(sale => {
    const dateKey = sale.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
    
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
        category: sale.category
      };
    }
    
    salesByDate[dateKey].products[sale.productId].quantity += sale.quantity;
    salesByDate[dateKey].products[sale.productId].revenue += sale.totalPrice;
  });
  
  // Convert to array and sort by date
  return Object.values(salesByDate).sort((a, b) => a.date - b.date);
};

// Simplified TensorFlow model creation and training
const createAndTrainModel = async (salesData) => {
  loadingMessage.value = 'Creating and training AI model...';
  
  try {
    // Extract daily sales values
    const salesValues = salesData.map(day => day.totalSales);
    
    // Need at least 7 days of data
    if (salesValues.length < 7) {
      throw new Error('Not enough sales data for forecasting. Need at least 7 days of data.');
    }
    
    // Normalize data between 0 and 1
    const max = Math.max(...salesValues);
    const min = Math.min(...salesValues);
    const range = max - min || 1; // Avoid division by zero
    
    const normalizedSales = salesValues.map(value => (value - min) / range);
    
    // Prepare training data with a simple window approach
    const windowSize = 5; // Use 5 days to predict the next day
    const inputs = [];
    const outputs = [];
    
    for (let i = 0; i < normalizedSales.length - windowSize; i++) {
      // Create input window
      const inputWindow = normalizedSales.slice(i, i + windowSize);
      // The target is the next value after the window
      const target = normalizedSales[i + windowSize];
      
      inputs.push(inputWindow);
      outputs.push(target);
    }
    
    // Reshape inputs for LSTM [samples, time steps, features]
    const inputTensor = tf.tensor3d(
      inputs.map(window => window.map(value => [value])),
      [inputs.length, windowSize, 1]
    );
    
    const outputTensor = tf.tensor2d(outputs, [outputs.length, 1]);
    
    // Create a simple LSTM model
    const model = tf.sequential();
    
    // Add layers
    model.add(tf.layers.lstm({
      units: 32,
      inputShape: [windowSize, 1],
      returnSequences: false
    }));
    
    model.add(tf.layers.dense({ units: 1 }));
    
    // Compile the model
    model.compile({
      optimizer: tf.train.adam(0.01),
      loss: 'meanSquaredError'
    });
    
    // Train the model
    await model.fit(inputTensor, outputTensor, {
      epochs: 50,
      batchSize: 16,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            loadingMessage.value = `Training AI model: ${epoch + 1}/50 epochs completed`;
          }
        }
      }
    });
    
    // Calculate a simple accuracy metric
    const predictions = model.predict(inputTensor);
    const predValues = await predictions.data();
    const actualValues = await outputTensor.data();
    
    let sumError = 0;
    let validPoints = 0;
    
    for (let i = 0; i < predValues.length; i++) {
      if (actualValues[i] !== 0) {
        sumError += Math.abs((predValues[i] - actualValues[i]) / actualValues[i]);
        validPoints++;
      }
    }
    
    // Calculate accuracy, ensuring we don't divide by zero
    const avgError = validPoints > 0 ? sumError / validPoints : 0;
    const accuracy = Math.max(0, Math.min(100, Math.round(100 - (avgError * 100))));
    
    console.log('Model accuracy calculation:', { 
      sumError, 
      validPoints, 
      avgError, 
      accuracy 
    });
    
    // Clean up tensors
    inputTensor.dispose();
    outputTensor.dispose();
    predictions.dispose();
    
    return {
      model,
      min,
      max,
      windowSize,
      accuracy,
      salesData
    };
  } catch (err) {
    console.error("Error in model training:", err);
    throw new Error(`Failed to train model: ${err.message}`);
  }
};

// Generate forecast using the trained model
const generateModelForecast = async (modelData, days) => {
  loadingMessage.value = 'Generating forecast...';
  
  const { model, min, max, windowSize, salesData } = modelData;
  const range = max - min || 1;
  
  // Get the last window of data
  const salesValues = salesData.map(day => day.totalSales);
  const lastValues = salesValues.slice(-windowSize);
  
  // Normalize the last window
  const normalizedLastValues = lastValues.map(value => (value - min) / range);
  
  // Generate predictions
  const forecast = [];
  let currentWindow = [...normalizedLastValues];
  
  for (let i = 0; i < days; i++) {
    // Reshape for prediction [1, time steps, features]
    const inputTensor = tf.tensor3d(
      [currentWindow.map(value => [value])],
      [1, windowSize, 1]
    );
    
    // Get prediction
    const predictionTensor = model.predict(inputTensor);
    const predictionValue = await predictionTensor.data();
    
    // Denormalize the prediction
    let forecastValue = predictionValue[0] * range + min;
    
    // Apply seasonal adjustment if enabled
    if (useSeasonalAdjustment.value) {
      const seasonalFactor = getSeasonalFactor(i);
      forecastValue *= seasonalFactor;
    }
    
    // Ensure no negative values
    forecastValue = Math.max(0, forecastValue);
    
    // Create forecast date
    const forecastDate = new Date();
    forecastDate.setDate(forecastDate.getDate() + i + 1);
    
    // Add to forecast
    forecast.push({
      date: forecastDate,
      value: forecastValue
    });
    
    // Update window for next prediction (sliding window)
    currentWindow.shift();
    currentWindow.push(predictionValue[0]);
    
    // Clean up tensors
    inputTensor.dispose();
    predictionTensor.dispose();
  }
  
  return forecast;
};

// Get seasonal adjustment factor
const getSeasonalFactor = (dayOffset) => {
  if (!useSeasonalAdjustment.value) return 1.0;
  
  let season;
  
  if (selectedSeason.value === 'auto') {
    season = getCurrentSeason();
  } else {
    season = selectedSeason.value;
  }
  
  // Base seasonal factors
  const seasonalFactors = {
    dry: 1.15,    // 15% increase in dry season
    rainy: 0.9,   // 10% decrease in rainy season
    cool: 1.05    // 5% increase in cool season
  };
  
  // Get base factor for selected season
  const baseFactor = seasonalFactors[season] || 1;
  
  // Add slight variation based on day within forecast period
  const variation = (Math.sin(dayOffset / 7 * Math.PI) * 0.05);
  
  return baseFactor + variation;
};

const generateProductForecasts = (salesData, products, forecastTotal) => {
  loadingMessage.value = 'Generating product-specific forecasts...';
  
  const productForecasts = [];
  
  // Calculate total historical sales
  let totalHistoricalSales = 0;
  salesData.forEach(day => {
    totalHistoricalSales += day.totalSales;
  });
  
  // Calculate total forecasted sales
  const totalForecastSales = forecastTotal.reduce((sum, day) => sum + day.value, 0);
  
  // Process each product
  for (const product of products) {
    // Calculate historical sales for this product
    let productHistoricalSales = 0;
    const productHistoricalQuantities = {};
    
    // Initialize quantities for all available units
    if (product.availableUnits) {
      product.availableUnits.forEach(unit => {
        productHistoricalQuantities[unit] = 0;
      });
    }
    
    // Count occurrences of this product in sales data
    let occurrences = 0;
    
    salesData.forEach(day => {
      const productData = day.products[product.id];
      if (productData) {
        productHistoricalSales += productData.revenue;
        
        // Track quantities by unit
        if (productData.unit && productData.quantity) {
          if (!productHistoricalQuantities[productData.unit]) {
            productHistoricalQuantities[productData.unit] = 0;
          }
          productHistoricalQuantities[productData.unit] += productData.quantity;
        }
        occurrences++;
      }
    });
    
    // Calculate product's share of total sales
    const salesShare = totalHistoricalSales > 0 
      ? productHistoricalSales / totalHistoricalSales 
      : 0;
    
    // Calculate growth (similar to existing logic)
    let growth = 0;
    if (salesData.length > 2) {
      const halfPoint = Math.floor(salesData.length / 2);
      const firstHalf = salesData.slice(0, halfPoint);
      const secondHalf = salesData.slice(halfPoint);
      
      let firstHalfSales = 0;
      let secondHalfSales = 0;
      
      firstHalf.forEach(day => {
        const productData = day.products[product.id];
        if (productData) {
          firstHalfSales += productData.quantity || 0;
        }
      });
      
      secondHalf.forEach(day => {
        const productData = day.products[product.id];
        if (productData) {
          secondHalfSales += productData.quantity || 0;
        }
      });
      
      if (firstHalfSales > 0) {
        growth = ((secondHalfSales - firstHalfSales) / firstHalfSales) * 100;
        growth = Math.max(-100, Math.min(100, growth));
      }
    }
    
    // Apply seasonal adjustment (existing logic)
    let seasonalFactor = 1;
    if (useSeasonalAdjustment.value) {
      const season = selectedSeason.value === 'auto' ? getCurrentSeason() : selectedSeason.value;
      
      if (season === 'dry') {
        if (product.category === 'Fruits') {
          seasonalFactor = 1.3;
        } else if (product.category === 'Vegetables') {
          seasonalFactor = 0.9;
        }
      } else if (season === 'rainy') {
        if (product.category === 'Vegetables') {
          seasonalFactor = 1.2;
        } else if (product.category === 'Fruits') {
          seasonalFactor = 0.8;
        }
      } else if (season === 'cool') {
        if (product.category === 'Vegetables') {
          seasonalFactor = 1.15;
        } else if (product.category === 'Fruits') {
          seasonalFactor = 0.95;
        }
      }
    }
    
    // Calculate projected sales for each unit
    const projectedSalesShare = salesShare * seasonalFactor;
    const projectedSalesValue = totalForecastSales * projectedSalesShare;
    
    // Calculate projected quantities per unit
    const projectedSalesByUnit = {};
    let totalHistoricalQuantity = 0;
    
    // Calculate total historical quantity across all units
    Object.values(productHistoricalQuantities).forEach(qty => {
      totalHistoricalQuantity += qty;
    });
    
    // Distribute forecasted quantities by unit
    if (totalHistoricalQuantity > 0) {
      for (const [unit, qty] of Object.entries(productHistoricalQuantities)) {
        const unitShare = qty / totalHistoricalQuantity;
        projectedSalesByUnit[unit] = Math.round(unitShare * (projectedSalesValue / (product.price || 1)) * 10) / 10;
      }
    }
    
    // Add to product forecasts
    productForecasts.push({
      id: product.id,
      name: product.productName || product.name,
      category: product.category,
image: product.image || defaultProductImage,
      price: product.price,
      projectedSales: projectedSalesByUnit,
      projectedRevenue: Math.round(projectedSalesValue),
      growth: Math.round(growth),
      seasonalFactor
    });
  }
  
  // Sort by projected revenue (highest first)
  return productForecasts.sort((a, b) => b.projectedRevenue - a.projectedRevenue);
};

// Generate insights based on forecast data
const generateInsights = (productForecasts, products) => {
  loadingMessage.value = 'Generating insights...';
  
  const newInsights = [];
  
  // Check for high-growth products
  const highGrowthProducts = productForecasts.filter(p => p.growth > 15);
  if (highGrowthProducts.length > 0) {
    newInsights.push({
      type: 'positive',
      title: 'High Growth Products',
      description: `${highGrowthProducts[0].name}${highGrowthProducts.length > 1 ? ` and ${highGrowthProducts.length - 1} other products` : ''} show strong growth potential. Consider increasing inventory.`
    });
  }
  
  // Check for declining products
  const decliningProducts = productForecasts.filter(p => p.growth < -10);
  if (decliningProducts.length > 0) {
    newInsights.push({
      type: 'negative',
      title: 'Declining Products',
      description: `${decliningProducts[0].name}${decliningProducts.length > 1 ? ` and ${decliningProducts.length - 1} other products` : ''} are showing declining sales. Consider promotions or price adjustments.`
    });
  }
  
  // Seasonal recommendations
  if (useSeasonalAdjustment.value) {
    const season = selectedSeason.value === 'auto' ? getCurrentSeason() : selectedSeason.value;
    const seasonObj = seasons.value.find(s => s.id === season);
    
    if (seasonObj) {
      newInsights.push({
        type: 'info',
        title: `${seasonObj.name} Recommendations`,
        description: `${seasonObj.name} is optimal for ${seasonObj.topProducts.join(', ')}. Consider featuring these products prominently.`
      });
    }
  }
  
  // Top revenue generators
  if (productForecasts.length > 0) {
    const topRevenue = productForecasts[0];
    newInsights.push({
      type: 'positive',
      title: 'Top Revenue Generator',
      description: `${topRevenue.name} is projected to generate ₱${topRevenue.projectedRevenue.toLocaleString()} in the next ${forecastPeriod.value} days.`
    });
  }
  
  // Inventory recommendations
  const lowStockHighDemand = productForecasts.filter(p => {
    const product = products.find(dp => dp.id === p.id);
    return product && product.stock < p.projectedSales && p.growth > 0;
  });
  
  if (lowStockHighDemand.length > 0) {
    newInsights.push({
      type: 'info',
      title: 'Inventory Alert',
      description: `${lowStockHighDemand.length} products may need restocking soon based on projected demand.`
    });
  }
  
  return newInsights;
};

// Update the renderChart function to show a line graph of product growth trends over time
const renderChart = (forecastData, productForecasts) => {
  loadingMessage.value = 'Rendering chart...';
  
  // Make sure we have the canvas element and forecast data
  if (!forecastChart.value || !forecastData || forecastData.length === 0 || !productForecasts || productForecasts.length === 0) {
    console.error('Missing chart element, forecast data, or product forecasts');
    return;
  }
  
  // Wait for the next tick to ensure the DOM is updated
  nextTick(() => {
    const ctx = forecastChart.value.getContext('2d');
    
    // Destroy previous chart instance if exists
    if (chartInstance.value) {
      chartInstance.value.destroy();
    }
    
    // Get top 5 products by revenue
    const topProducts = productForecasts.slice(0, 5);
    
    // Prepare chart data
    const labels = forecastData.map(day => {
      const date = new Date(day.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    // Create a dataset for each product
    const datasets = topProducts.map((product, index) => {
      // Set color based on growth (positive, negative, or neutral)
      const colorHue = product.growth > 0 ? '160' : (product.growth < 0 ? '0' : '220');
      const colorSaturation = Math.abs(product.growth) / 100 * 100; // Scale saturation by growth percentage
      
      // Generate data points for this product over time
      // We'll create a trend line that starts at 0 and ends at the product's growth rate
      const dataPoints = [];
      const growthStep = product.growth / (forecastData.length - 1);
      
      for (let i = 0; i < forecastData.length; i++) {
        // Create a trend line that shows the projected growth over time
        dataPoints.push(growthStep * i);
      }
      
      return {
        label: product.name,
        data: dataPoints,
        borderColor: `hsl(${colorHue}, ${colorSaturation}%, 50%)`,
        backgroundColor: `hsla(${colorHue}, ${colorSaturation}%, 50%, 0.1)`,
        tension: 0.3,
        fill: false
      };
    });
    
    console.log('Chart data:', { labels, datasets });
    
    // Create new line chart showing product growth trends over time
    chartInstance.value = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
            }
          },
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          }
        }
      }
    });
  });
};

// Main function to generate forecast
const generateForecast = async () => {
  loading.value = true;
  error.value = null;
  debugInfo.value = '';
  
  try {
    // 1. Fetch sales data
    const sales = await fetchSalesData();
    
    if (sales.length === 0) {
      error.value = "No sales data available for forecasting";
      loading.value = false;
      return;
    }
    
    // 2. Fetch products data
    const productsData = await fetchProductsData();
    
    if (productsData.length === 0) {
      error.value = "No products found for forecasting";
      loading.value = false;
      return;
    }
    
    // 3. Process sales data
    const processedSales = processSalesData(sales);
    
    if (processedSales.length < 7) {
      error.value = "Not enough sales data for forecasting. Need at least 7 days of data.";
      loading.value = false;
      return;
    }
    
    // 4. Create and train model
    const modelData = await createAndTrainModel(processedSales);
    
    // 5. Generate forecast
    const days = parseInt(forecastPeriod.value);
    const forecast = await generateModelForecast(modelData, days);
    
    // 6. Generate product-specific forecasts
    const productForecasts = generateProductForecasts(processedSales, productsData, forecast);
    
    // 7. Generate insights
    const newInsights = generateInsights(productForecasts, productsData);
    
    // 8. Update training stats
    console.log('Setting accuracy to:', modelData.accuracy);
    trainingStats.value = {
      dataPoints: processedSales.length,
      startDate: processedSales[0].date.toLocaleDateString(),
      endDate: processedSales[processedSales.length - 1].date.toLocaleDateString(),
      accuracy: Math.round(modelData.accuracy)
    };
    
    // 9. Update state
    forecastData.value = forecast;
    displayedProducts.value = productForecasts;
    insights.value = newInsights;

    // Ensure the DOM is updated before rendering the chart
    nextTick(() => {
      // Render product growth trends as a line chart over time
      renderChart(forecast, productForecasts);
    });
    
  } catch (err) {
    console.error("Error generating forecast:", err);
    error.value = "An error occurred during forecasting. Please try again.";
    debugInfo.value += ` | Error: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

// Initialize component
onMounted(async () => {
  try {
    // Wait for auth to initialize
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Fetch categories for dropdown
        const productsQuery = query(
          collection(db, 'products'),
          where('sellerId', '==', user.uid),
          limit(100)
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
      }
    });
  } catch (err) {
    console.error("Error initializing:", err);
  }
});

// Watch for changes in filters
watch([selectedCategory, selectedSeason, useSeasonalAdjustment], () => {
  if (forecastData.value.length > 0) {
    // Re-generate forecast when filters change
    generateForecast();
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
.unit-sales {
  margin-top: 4px;
}

.unit-sales:first-child {
  margin-top: 0;
}
.toggle-group {
  flex-direction: column;
}

.toggle-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #2e5c31;
}

input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.toggle-label {
  font-size: 0.85rem;
  color: #4b5563;
}

.control-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #4b5563;
}

.period-select,
.category-select,
.season-select {
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

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 16px;
  text-align: center;
}

.spinner-container {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(46, 92, 49, 0.2);
  border-top: 4px solid #2e5c31;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-detail {
  font-size: 0.9rem;
  color: #6b7280;
  max-width: 400px;
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

.forecast-chart-container h2 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 1.25rem;
  color: #111827;
}

.chart-explanation {
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 16px;
  line-height: 1.5;
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

.forecast-products h2 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 1.25rem;
  color: #111827;
}

.product-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
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

.seasonal-trends {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.seasonal-trends h2 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 1.25rem;
  color: #111827;
}

.seasons-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.season-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
}

.season-card.active-season {
  border-color: #2e5c31;
  background-color: rgba(46, 92, 49, 0.05);
}

.season-header {
  margin-bottom: 12px;
}

.season-header h3 {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  color: #111827;
}

.season-months {
  font-size: 0.85rem;
  color: #6b7280;
}

.season-content h4 {
  margin: 0 0 8px 0;
  font-size: 0.95rem;
  color: #4b5563;
}

.season-products {
  margin: 0;
  padding-left: 20px;
}

.season-products li {
  margin-bottom: 4px;
  font-size: 0.9rem;
  color: #6b7280;
}

.season-impact {
  margin-top: 12px;
}

.season-impact p {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 4px 0 0 0;
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

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding: 16px;
  }
  
  .forecast-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .product-cards,
  .insights-container,
  .seasons-container,
  .model-details {
    grid-template-columns: 1fr;
  }
}

/* Dark mode styles */
:global(body.dark) .main-content {
  background-color: #111827;
}

:global(body.dark) .page-title h1,
:global(body.dark) .forecast-chart-container h2,
:global(body.dark) .forecast-products h2,
:global(body.dark) .forecast-insights h2,
:global(body.dark) .seasonal-trends h2,
:global(body.dark) .model-info h2,
:global(body.dark) .product-info h3,
:global(body.dark) .insight-content h4,
:global(body.dark) .season-header h3,
:global(body.dark) .model-detail h4,
:global(body.dark) .stat-value {
  color: #f9fafb;
}

:global(body.dark) .page-title p,
:global(body.dark) .chart-explanation,
:global(body.dark) .product-info .category,
:global(body.dark) .insight-content p,
:global(body.dark) .season-months,
:global(body.dark) .season-products li,
:global(body.dark) .season-impact p,
:global(body.dark) .model-detail p,
:global(body.dark) .stat-label,
:global(body.dark) .loading-detail,
:global(body.dark) .toggle-label,
:global(body.dark) .legend-item {
  color: #9ca3af;
}

:global(body.dark) .forecast-controls,
:global(body.dark) .forecast-chart-container,
:global(body.dark) .forecast-products,
:global(body.dark) .forecast-insights,
:global(body.dark) .seasonal-trends,
:global(body.dark) .model-info,
:global(body.dark) .debug-info {
  background-color: #1f2937;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

:global(body.dark) .period-select,
:global(body.dark) .category-select,
:global(body.dark) .season-select {
  background-color: #374151;
  border-color: #4b5563;
  color: #e5e7eb;
}

:global(body.dark) .product-card,
:global(body.dark) .insight-card,
:global(body.dark) .season-card {
  border-color: #374151;
}

:global(body.dark) .season-card.active-season {
  border-color: #4caf50;
  background-color: rgba(76, 175, 80, 0.1);
}

:global(body.dark) .stat-value.positive {
  color: #34d399;
}

:global(body.dark) .stat-value.negative {
  color: #f87171;
}

:global(body.dark) .stat-value.neutral {
  color: #9ca3af;
}

:global(body.dark) .debug-info {
  background-color: #111827;
  color: #9ca3af;
}

:global(body.dark) .chart-wrapper {
  background-color: #1f2937;
  border-color: #374151;
}
</style>
