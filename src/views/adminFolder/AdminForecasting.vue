<template>
  <div class="dashboard-container">
    <AdminSidebar />
    
    <div class="main-content">
      <header class="header">
        <div class="page-title">
          <h1>Market Forecasting</h1>
          <p>Platform-wide predictions and market trend analysis for Oriental Mindoro</p>
        </div>
        
        <div class="forecast-controls">
          <div class="control-group">
            <label>Time Period</label>
            <select v-model="forecastPeriod" class="period-select">
              <option value="7">Next 7 Days</option>
              <option value="14">Next 14 Days</option>
              <option value="30">Next 30 Days</option>
              <option value="90">Next 3 Months</option>
              <option value="180">Next 6 Months</option>
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
          
          <div class="control-group">
            <label>Municipality</label>
            <select v-model="selectedMunicipality" class="municipality-select">
              <option value="all">All Municipalities</option>
              <option v-for="municipality in municipalities" :key="municipality" :value="municipality">
                {{ municipality }}
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
            <span v-if="loading" class="spinner"></span>
            <span v-else>Generate Forecast</span>
          </button>
        </div>
      </header>
      
      <div v-if="loading" class="loading-state">
        <div class="spinner-container">
          <div class="spinner"></div>
        </div>
        <p>Analyzing market data across all sellers...</p>
        <p class="loading-detail">{{ loadingMessage }}</p>
      </div>
      
      <div v-else-if="forecastData.length > 0" class="forecast-results">
        <!-- Market Overview Section -->
        <div class="market-overview">
          <h2>Market Overview</h2>
          
          <div class="stats-cards">
            <div class="stat-card">
              <h3>Total Projected Sales</h3>
              <p class="stat-value">₱{{ totalProjectedSales.toLocaleString() }}</p>
              <p class="stat-change" :class="getGrowthClass(overallGrowth)">
                {{ overallGrowth > 0 ? '+' : '' }}{{ overallGrowth }}% from previous period
              </p>
            </div>
            
            <div class="stat-card">
              <h3>Total Products</h3>
              <p class="stat-value">{{ totalProducts }}</p>
            </div>
            
            <div class="stat-card">
              <h3>Active Sellers</h3>
              <p class="stat-value">{{ activeSellers }}</p>
            </div>
            
            <div class="stat-card">
              <h3>Top Category</h3>
              <p class="stat-value">{{ topCategory }}</p>
              <p class="stat-detail">{{ topCategoryShare }}% of sales</p>
            </div>
          </div>
        </div>
        
        <!-- Market Trends Chart -->
        <div class="forecast-chart-container">
          <h2>Market Trends</h2>
          <div class="chart-tabs">
            <button 
              v-for="tab in chartTabs" 
              :key="tab.id" 
              :class="['tab-btn', { active: activeChartTab === tab.id }]"
              @click="activeChartTab = tab.id"
            >
              {{ tab.name }}
            </button>
          </div>
          
          <div class="export-actions">
            <button @click="exportChartAsImage" class="export-btn">
              <i class="fas fa-image"></i> Save Chart as Image
            </button>
            <button @click="exportChartData" class="export-btn">
              <i class="fas fa-file-csv"></i> Export Chart Data
            </button>
          </div>
          
          <div class="chart-wrapper">
            <canvas ref="marketTrendsChart"></canvas>
          </div>
        </div>
        
        <!-- Top Products Section -->
        <div class="top-products">
          <h2>Top Products</h2>
          
          <div class="table-actions">
            <button @click="exportProductsAsPDF" class="export-btn">
              <i class="fas fa-file-pdf"></i> Export as PDF
            </button>
            <button @click="exportProductsAsCSV" class="export-btn">
              <i class="fas fa-file-csv"></i> Export as CSV
            </button>
            <button @click="saveForecastToDatabase" class="save-forecast-btn">
              <i class="fas fa-save"></i> Save Forecast
            </button>
          </div>
          
          <div class="table-container">
            <table class="products-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Projected Sales</th>
                  <th>Growth</th>
                  <th>Price Trend</th>
                  <th>Sellers</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(product, index) in topProducts" :key="product.id">
                  <td>{{ index + 1 }}</td>
                  <td>
                    <div class="product-cell">
                      <div class="product-image">
                        <img :src="product.image" :alt="product.name">
                      </div>
                      <span>{{ product.name }}</span>
                    </div>
                  </td>
                  <td>{{ product.category }}</td>
                  <td>{{ product.projectedSales }} {{ product.unit }}</td>
                  <td>
                    <span :class="['growth-badge', getGrowthClass(product.growth)]">
                      {{ product.growth > 0 ? '+' : '' }}{{ product.growth }}%
                    </span>
                  </td>
                  <td>
                    <div class="price-trend">
                      <div class="trend-line" :class="product.priceTrend"></div>
                      <span>{{ formatPriceTrend(product.priceTrend) }}</span>
                    </div>
                  </td>
                  <td>{{ product.sellerCount }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Regional Analysis -->
        <div class="regional-analysis">
          <h2>Municipality Analysis</h2>
          <div class="region-map">
            <!-- Simplified Oriental Mindoro map visualization -->
            <div class="map-container">
              <div class="map-placeholder">
                <p>Oriental Mindoro Municipality Analysis</p>
                <p class="map-note">Shows municipal demand and supply distribution</p>
              </div>
            </div>
            <div class="region-stats">
              <div v-for="municipality in topMunicipalities" :key="municipality.name" class="region-stat-card">
                <h3>{{ municipality.name }}</h3>
                <div class="region-stat-details">
                  <div class="region-stat">
                    <span class="stat-label">Top Product</span>
                    <span class="stat-value">{{ municipality.topProduct }}</span>
                  </div>
                  <div class="region-stat">
                    <span class="stat-label">Sales Forecast</span>
                    <span class="stat-value">₱{{ municipality.projectedSales.toLocaleString() }}</span>
                  </div>
                  <div class="region-stat">
                    <span class="stat-label">Growth</span>
                    <span :class="['stat-value', getGrowthClass(municipality.growth)]">
                      {{ municipality.growth > 0 ? '+' : '' }}{{ municipality.growth }}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Supply & Demand Analysis -->
        <div class="supply-demand">
          <h2>Supply & Demand Analysis</h2>
          <div class="supply-demand-cards">
            <div v-for="item in supplyDemandAnalysis" :key="item.category" class="supply-demand-card">
              <h3>{{ item.category }}</h3>
              <div class="supply-demand-meter">
                <div class="meter-bar">
                  <div class="supply-bar" :style="{ width: item.supplyPercentage + '%' }"></div>
                  <div class="demand-bar" :style="{ width: item.demandPercentage + '%' }"></div>
                </div>
                <div class="meter-labels">
                  <span>Supply</span>
                  <span>Demand</span>
                </div>
              </div>
              <p class="supply-demand-insight">
                {{ item.insight }}
              </p>
            </div>
          </div>
        </div>
        
        <!-- Market Insights -->
        <div class="market-insights">
          <h2>Market Insights</h2>
          <div class="insights-container">
            <div v-for="(insight, index) in marketInsights" :key="index" class="insight-card">
              <div class="insight-icon" :class="insight.type">
                <i :class="getInsightIcon(insight.type)"></i>
              </div>
              <div class="insight-content">
                <h4>{{ insight.title }}</h4>
                <p>{{ insight.description }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Seasonal Forecast -->
        <div v-if="useSeasonalAdjustment" class="seasonal-forecast">
          <h2>Seasonal Forecast</h2>
          <div class="seasons-timeline">
            <div v-for="season in seasons" :key="season.id" 
                 class="season-block" 
                 :class="{ 'current-season': season.isCurrent }">
              <div class="season-header">
                <h3>{{ season.name }}</h3>
                <span class="season-months">{{ season.months }}</span>
              </div>
              <div class="season-products">
                <h4>Trending Products:</h4>
                <div class="trending-products">
                  <div v-for="product in season.trendingProducts" :key="product.name" class="trending-product">
                    <span class="product-name">{{ product.name }}</span>
                    <span :class="['growth-indicator', getGrowthClass(product.growth)]">
                      {{ product.growth > 0 ? '+' : '' }}{{ product.growth }}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-chart-line"></i>
        </div>
        <h2>No Market Forecast Generated</h2>
        <p>Generate a forecast to see market trends and predictions</p>
        <button @click="generateForecast" class="generate-btn">Generate Forecast</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { collection, query, getDocs, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import Chart from 'chart.js/auto';
import AdminSidebar from '@/components/AdminSidebar.vue';

// State variables
const forecastPeriod = ref('30');
const selectedCategory = ref('all');
const selectedMunicipality = ref('all');
const useSeasonalAdjustment = ref(true);
const loading = ref(false);
const loadingMessage = ref('');
const forecastData = ref([]);
const availableCategories = ref([]);
const activeChartTab = ref('sales');

// Oriental Mindoro municipalities
const municipalities = ref([
  'Baco', 
  'Bansud', 
  'Bongabong', 
  'Bulalacao', 
  'Calapan', 
  'Gloria', 
  'Mansalay', 
  'Naujan', 
  'Pinamalayan', 
  'Pola', 
  'Puerto Galera', 
  'Roxas', 
  'San Teodoro', 
  'Socorro', 
  'Victoria'
]);

// Chart references
const marketTrendsChart = ref(null);
const chartInstance = ref(null);

// Chart tab options
const chartTabs = [
  { id: 'sales', name: 'Sales Forecast' },
  { id: 'categories', name: 'Categories' },
  { id: 'growth', name: 'Growth Rates' }
];

// Mock data for demonstration
const totalProjectedSales = ref(5250000);
const overallGrowth = ref(12.5);
const totalProducts = ref(124);
const activeSellers = ref(48);
const topCategory = ref('Vegetables');
const topCategoryShare = ref(35);

// Top products data
const topProducts = ref([
  {
    id: 'p1',
    name: 'Rice',
    category: 'Grains',
    projectedSales: 2500,
    unit: 'kg',
    growth: 15,
    priceTrend: 'rising',
    sellerCount: 12,
    image: '/placeholder.svg?height=40&width=40'
  },
  {
    id: 'p2',
    name: 'Tomatoes',
    category: 'Vegetables',
    projectedSales: 1800,
    unit: 'kg',
    growth: 8,
    priceTrend: 'stable',
    sellerCount: 9,
    image: '/placeholder.svg?height=40&width=40'
  },
  {
    id: 'p3',
    name: 'Mangoes',
    category: 'Fruits',
    projectedSales: 1200,
    unit: 'kg',
    growth: 22,
    priceTrend: 'rising',
    sellerCount: 7,
    image: '/placeholder.svg?height=40&width=40'
  },
  {
    id: 'p4',
    name: 'Corn',
    category: 'Grains',
    projectedSales: 2200,
    unit: 'kg',
    growth: -5,
    priceTrend: 'falling',
    sellerCount: 10,
    image: '/placeholder.svg?height=40&width=40'
  },
  {
    id: 'p5',
    name: 'Bananas',
    category: 'Fruits',
    projectedSales: 1500,
    unit: 'kg',
    growth: 10,
    priceTrend: 'stable',
    sellerCount: 8,
    image: '/placeholder.svg?height=40&width=40'
  }
]);

// Municipality data
const topMunicipalities = ref([
  {
    name: 'Calapan',
    topProduct: 'Rice',
    projectedSales: 2100000,
    growth: 15
  },
  {
    name: 'Naujan',
    topProduct: 'Mangoes',
    projectedSales: 1450000,
    growth: 8
  },
  {
    name: 'Pinamalayan',
    topProduct: 'Bananas',
    projectedSales: 1700000,
    growth: 12
  }
]);

// Supply & Demand Analysis
const supplyDemandAnalysis = ref([
  {
    category: 'Vegetables',
    supplyPercentage: 60,
    demandPercentage: 80,
    insight: 'Demand exceeds supply by 20%. Consider encouraging more sellers to list vegetable products.'
  },
  {
    category: 'Fruits',
    supplyPercentage: 75,
    demandPercentage: 70,
    insight: 'Supply and demand are relatively balanced. Market is stable.'
  },
  {
    category: 'Grains',
    supplyPercentage: 50,
    demandPercentage: 90,
    insight: 'Significant supply shortage. Prices likely to increase in coming weeks.'
  }
]);

// Market insights
const marketInsights = ref([
  {
    type: 'opportunity',
    title: 'Vegetable Shortage',
    description: 'Projected vegetable shortage in the next 30 days. Encourage sellers to increase inventory of leafy greens and root crops.'
  },
  {
    type: 'trend',
    title: 'Rising Fruit Demand',
    description: 'Seasonal increase in fruit demand expected. Mango and banana sales projected to grow by 20%.'
  },
  {
    type: 'risk',
    title: 'Price Volatility',
    description: 'Rice prices showing increased volatility. Monitor closely and consider implementing price stabilization measures.'
  },
  {
    type: 'opportunity',
    title: 'Regional Opportunity',
    description: 'Mindanao sellers showing 30% higher growth than other regions. Consider targeted promotions to boost seller acquisition.'
  }
]);

// Seasonal data
const seasons = ref([
  {
    id: 'dry',
    name: 'Dry Season',
    months: 'March - May',
    isCurrent: false,
    trendingProducts: [
      { name: 'Mangoes', growth: 35 },
      { name: 'Bananas', growth: 28 },
      { name: 'Coconut', growth: 22 }
    ]
  },
  {
    id: 'rainy',
    name: 'Rainy Season',
    months: 'June - November',
    isCurrent: true,
    trendingProducts: [
      { name: 'Rice', growth: 15 },
      { name: 'Vegetables', growth: 18 },
      { name: 'Root Crops', growth: 12 }
    ]
  },
  {
    id: 'cool',
    name: 'Cool Season',
    months: 'December - February',
    isCurrent: false,
    trendingProducts: [
      { name: 'Vegetables', growth: 20 },
      { name: 'Citrus Fruits', growth: 15 },
      { name: 'Coffee', growth: 10 }
    ]
  }
]);

// Helper functions
const getGrowthClass = (growth) => {
  if (growth > 0) return 'positive';
  if (growth < 0) return 'negative';
  return 'neutral';
};

const formatPriceTrend = (trend) => {
  if (trend === 'rising') return 'Rising';
  if (trend === 'falling') return 'Falling';
  return 'Stable';
};

const getInsightIcon = (type) => {
  switch (type) {
    case 'opportunity': return 'fas fa-lightbulb';
    case 'trend': return 'fas fa-chart-line';
    case 'risk': return 'fas fa-exclamation-triangle';
    default: return 'fas fa-info-circle';
  }
};

// Export chart as image using Chart.js built-in method
const exportChartAsImage = () => {
  if (!chartInstance.value) return;
  
  try {
    // Use Chart.js built-in method to get image
    const url = chartInstance.value.toBase64Image();
    
    // Create a download link
    const link = document.createElement('a');
    link.download = `market_forecast_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = url;
    link.click();
  } catch (error) {
    console.error('Error exporting chart as image:', error);
    alert('Failed to export chart as image');
  }
};

// Export chart data as CSV
const exportChartData = () => {
  if (!chartInstance.value) return;
  
  try {
    const chart = chartInstance.value;
    const labels = chart.data.labels;
    const datasets = chart.data.datasets;
    
    // Create CSV content
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Add header row with dataset names
    csvContent += 'Date,' + datasets.map(ds => ds.label).join(',') + '\n';
    
    // Add data rows
    labels.forEach((label, i) => {
      csvContent += label + ',';
      csvContent += datasets.map(ds => ds.data[i]).join(',');
      csvContent += '\n';
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `market_forecast_data_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting chart data:', error);
    alert('Failed to export chart data');
  }
};

// Export products as PDF
const exportProductsAsPDF = () => {
  try {
    // Create a new window for PDF content
    const printWindow = window.open('', '_blank');
    
    // Create PDF content
    let pdfContent = '<!DOCTYPE html>';
    pdfContent += '<html>';
    pdfContent += '<head>';
    pdfContent += '<title>Top Products Forecast</title>';
    pdfContent += '<style>';
    pdfContent += 'body { font-family: Arial, sans-serif; margin: 20px; }';
    pdfContent += 'h1 { color: #2e5c31; margin-bottom: 20px; }';
    pdfContent += 'table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }';
    pdfContent += 'th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }';
    pdfContent += 'th { background-color: #f2f2f2; font-weight: bold; }';
    pdfContent += 'tr:nth-child(even) { background-color: #f9f9f9; }';
    pdfContent += '.export-info { margin-top: 20px; font-size: 12px; color: #666; }';
    pdfContent += '.growth-positive { color: #10b981; }';
    pdfContent += '.growth-negative { color: #ef4444; }';
    pdfContent += '.growth-neutral { color: #6b7280; }';
    pdfContent += '</style>';
    pdfContent += '</head>';
    pdfContent += '<body>';
    pdfContent += '<h1>Top Products Forecast - Oriental Mindoro</h1>';
    pdfContent += '<table>';
    pdfContent += '<thead>';
    pdfContent += '<tr>';
    pdfContent += '<th>Rank</th>';
    pdfContent += '<th>Product</th>';
    pdfContent += '<th>Category</th>';
    pdfContent += '<th>Projected Sales</th>';
    pdfContent += '<th>Growth</th>';
    pdfContent += '<th>Price Trend</th>';
    pdfContent += '<th>Sellers</th>';
    pdfContent += '</tr>';
    pdfContent += '</thead>';
    pdfContent += '<tbody>';
    
    // Add product rows
    topProducts.value.forEach((product, index) => {
      const growthClass = product.growth > 0 ? 'growth-positive' : (product.growth < 0 ? 'growth-negative' : 'growth-neutral');
      
      pdfContent += '<tr>';
      pdfContent += `<td>${index + 1}</td>`;
      pdfContent += `<td>${escapeHtml(product.name)}</td>`;
      pdfContent += `<td>${escapeHtml(product.category)}</td>`;
      pdfContent += `<td>${product.projectedSales} ${product.unit}</td>`;
      pdfContent += `<td class="${growthClass}">${product.growth > 0 ? '+' : ''}${product.growth}%</td>`;
      pdfContent += `<td>${formatPriceTrend(product.priceTrend)}</td>`;
      pdfContent += `<td>${product.sellerCount}</td>`;
      pdfContent += '</tr>';
    });
    
    pdfContent += '</tbody>';
    pdfContent += '</table>';
    pdfContent += '<div class="export-info">';
    pdfContent += `<p>Generated on: ${new Date().toLocaleString()}</p>`;
    pdfContent += `<p>Forecast Period: Next ${forecastPeriod.value} days</p>`;
    pdfContent += '</div>';
    pdfContent += '<script>';
    pdfContent += 'window.onload = function() { window.print(); }';
    pdfContent += '<\/script>';
    pdfContent += '</body>';
    pdfContent += '</html>';
    
    // Write content to the new window
    printWindow.document.open();
    printWindow.document.write(pdfContent);
    printWindow.document.close();
  } catch (error) {
    console.error('Error exporting products as PDF:', error);
    alert('Failed to export products as PDF');
  }
};

// Export products as CSV
const exportProductsAsCSV = () => {
  try {
    // Create CSV content
    const headers = ['Rank', 'Product', 'Category', 'Projected Sales', 'Unit', 'Growth', 'Price Trend', 'Sellers'];
    const csvContent = [
      headers.join(','),
      ...topProducts.value.map((product, index) => [
        index + 1,
        product.name,
        product.category,
        product.projectedSales,
        product.unit,
        `${product.growth > 0 ? '+' : ''}${product.growth}%`,
        formatPriceTrend(product.priceTrend),
        product.sellerCount
      ].join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `top_products_forecast_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting products as CSV:', error);
    alert('Failed to export products as CSV');
  }
};

// Helper function to escape HTML for PDF export
const escapeHtml = (text) => {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// Save forecast to Firebase
const saveForecastToDatabase = async () => {
  try {
    // Create a forecast record
    await addDoc(collection(db, 'marketForecasts'), {
      timestamp: serverTimestamp(),
      period: forecastPeriod.value,
      category: selectedCategory.value,
      municipality: selectedMunicipality.value,
      totalProjectedSales: totalProjectedSales.value,
      overallGrowth: overallGrowth.value,
      topProducts: topProducts.value.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        projectedSales: p.projectedSales,
        growth: p.growth,
        priceTrend: p.priceTrend
      })),
      marketInsights: marketInsights.value
    });
    
    alert('Forecast saved successfully!');
  } catch (error) {
    console.error('Error saving forecast:', error);
    alert('Failed to save forecast');
  }
};

// Fetch categories
const fetchCategories = async () => {
  try {
    // In a real implementation, you would fetch this data from Firestore
    availableCategories.value = ['Vegetables', 'Fruits', 'Grains', 'Root Crops', 'Herbs'];
  } catch (error) {
    console.error('Error fetching categories:', error);
  }
};

// Render market trends chart
const renderMarketTrendsChart = () => {
  if (!marketTrendsChart.value) return;
  
  // Destroy previous chart instance if it exists
  if (chartInstance.value) {
    chartInstance.value.destroy();
  }
  
  const ctx = marketTrendsChart.value.getContext('2d');
  
  // Sample data for demonstration
  const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  
  let datasets = [];
  
  if (activeChartTab.value === 'sales') {
    datasets = [
      {
        label: 'Projected Sales',
        data: [1200000, 1350000, 1450000, 1600000],
        borderColor: '#2e5c31',
        backgroundColor: 'rgba(46, 92, 49, 0.1)',
        tension: 0.3,
        fill: true
      },
      {
        label: 'Previous Period',
        data: [1100000, 1200000, 1250000, 1300000],
        borderColor: '#9ca3af',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        tension: 0.3,
        borderDash: [5, 5],
        fill: false
      }
    ];
  } else if (activeChartTab.value === 'categories') {
    datasets = [
      {
        label: 'Vegetables',
        data: [450000, 500000, 520000, 580000],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3
      },
      {
        label: 'Fruits',
        data: [350000, 400000, 430000, 470000],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.3
      },
      {
        label: 'Grains',
        data: [400000, 450000, 500000, 550000],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.3
      }
    ];
  } else if (activeChartTab.value === 'growth') {
    datasets = [
      {
        label: 'Vegetables',
        data: [8, 10, 12, 15],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3
      },
      {
        label: 'Fruits',
        data: [12, 15, 18, 22],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.3
      },
      {
        label: 'Grains',
        data: [5, 3, -2, -5],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.3
      }
    ];
  }
  
  chartInstance.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (activeChartTab.value === 'growth') {
                return label + context.parsed.y + '%';
              } else {
                return label + '₱' + context.parsed.y.toLocaleString();
              }
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: activeChartTab.value === 'growth',
          ticks: {
            callback: function(value) {
              if (activeChartTab.value === 'growth') {
                return value + '%';
              } else {
                return '₱' + (value / 1000) + 'k';
              }
            }
          }
        }
      }
    }
  });
};

// Generate forecast
const generateForecast = async () => {
  loading.value = true;
  loadingMessage.value = 'Fetching market data...';
  
  try {
    // In a real implementation, you would:
    // 1. Fetch sales data from all sellers
    // 2. Aggregate and process the data
    // 3. Train a model on the aggregated data
    // 4. Generate forecasts
    
    // Simulate loading states
    await new Promise(resolve => setTimeout(resolve, 1000));
    loadingMessage.value = 'Analyzing sales patterns...';
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    loadingMessage.value = 'Generating market forecasts...';
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Set forecast data (in a real implementation, this would be the result of your analysis)
    forecastData.value = [1, 2, 3]; // Just a placeholder to indicate we have data
    
    // Render the chart
    nextTick(() => {
      renderMarketTrendsChart();
    });
    
  } catch (error) {
    console.error('Error generating forecast:', error);
  } finally {
    loading.value = false;
  }
};

// Watch for chart tab changes
watch(activeChartTab, () => {
  renderMarketTrendsChart();
});

// Initialize component
onMounted(async () => {
  await fetchCategories();
});
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css');

.dashboard-container {
  display: flex;
  min-height: 100vh;
  background-color: #f9fafb;
}

.main-content {
  flex: 1;
  padding: 24px;
  margin-left: 260px;
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
.category-select,
.municipality-select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  background-color: white;
  min-width: 150px;
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
  width: 20px;
  height: 20px;
  border: 3px solid rgba(46, 92, 49, 0.2);
  border-top: 3px solid #2e5c31;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-detail {
  font-size: 0.9rem;
  color: #6b7280;
  max-width: 400px;
}

.forecast-results {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.market-overview h2,
.forecast-chart-container h2,
.top-products h2,
.regional-analysis h2,
.supply-demand h2,
.market-insights h2,
.seasonal-forecast h2 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 1.25rem;
  color: #111827;
}

.market-overview,
.forecast-chart-container,
.top-products,
.regional-analysis,
.supply-demand,
.market-insights,
.seasonal-forecast {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Market Overview */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background-color: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-3px);
}

.stat-card h3 {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.stat-card .stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.stat-card .stat-change {
  font-size: 0.85rem;
  margin: 4px 0 0 0;
}

.stat-card .stat-detail {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 4px 0 0 0;
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

/* Chart */
.chart-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.tab-btn {
  padding: 6px 12px;
  background-color: #f3f4f6;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background-color: #2e5c31;
  color: white;
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

/* Export Actions */
.export-actions, .table-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  justify-content: flex-end;
}

.export-btn {
  padding: 6px 12px;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.export-btn:hover {
  background-color: #e5e7eb;
}

.save-forecast-btn {
  padding: 8px 16px;
  background-color: #2e5c31;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.save-forecast-btn:hover {
  background-color: #235127;
}

/* Top Products Table */
.table-container {
  overflow-x: auto;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
}

.products-table th,
.products-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.products-table th {
  font-weight: 600;
  color: #4b5563;
  background-color: #f9fafb;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.product-image {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.growth-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 500;
}

.growth-badge.positive {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.growth-badge.negative {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.growth-badge.neutral {
  background-color: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.price-trend {
  display: flex;
  align-items: center;
  gap: 8px;
}

.trend-line {
  width: 40px;
  height: 2px;
  position: relative;
}

.trend-line.rising {
  background: linear-gradient(90deg, #10b981 0%, #10b981 100%);
}

.trend-line.rising:after {
  content: '';
  position: absolute;
  right: -2px;
  top: -4px;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 6px solid #10b981;
  transform: rotate(90deg);
}

.trend-line.falling {
  background: linear-gradient(90deg, #ef4444 0%, #ef4444 100%);
}

.trend-line.falling:after {
  content: '';
  position: absolute;
  right: -2px;
  top: -4px;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 6px solid #ef4444;
  transform: rotate(-90deg);
}

.trend-line.stable {
  background: linear-gradient(90deg, #6b7280 0%, #6b7280 100%);
}

/* Regional Analysis */
.region-map {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.map-container {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  height: 300px;
}

.map-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f9fafb;
  color: #6b7280;
}

.map-note {
  font-size: 0.85rem;
  margin-top: 8px;
}

.region-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.region-stat-card {
  background-color: #f9fafb;
  border-radius: 8px;
  padding: 16px;
}

.region-stat-card h3 {
  margin: 0 0 12px 0;
  font-size: 1.1rem;
  color: #111827;
}

.region-stat-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.region-stat {
  display: flex;
  justify-content: space-between;
}

.stat-label {
  color: #6b7280;
  font-size: 0.9rem;
}

.stat-value {
  font-weight: 600;
  font-size: 0.9rem;
}

/* Supply & Demand */
.supply-demand-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.supply-demand-card {
  background-color: #f9fafb;
  border-radius: 8px;
  padding: 16px;
}

.supply-demand-card h3 {
  margin: 0 0 12px 0;
  font-size: 1.1rem;
  color: #111827;
}

.supply-demand-meter {
  margin-bottom: 12px;
}

.meter-bar {
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  margin-bottom: 4px;
}

.supply-bar {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background-color: #3b82f6;
}

.demand-bar {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  background-color: #f59e0b;
}

.meter-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #6b7280;
}

.supply-demand-insight {
  font-size: 0.9rem;
  color: #4b5563;
  margin: 12px 0 0 0;
}

/* Market Insights */
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

.insight-icon.opportunity {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.insight-icon.trend {
  background-color: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.insight-icon.risk {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
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

/* Seasonal Forecast */
.seasons-timeline {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.season-block {
  flex: 1;
  min-width: 250px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
}

.season-block.current-season {
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

.season-products h4 {
  margin: 0 0 8px 0;
  font-size: 0.95rem;
  color: #4b5563;
}

.trending-products {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.trending-product {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background-color: white;
  border-radius: 6px;
}

.product-name {
  font-size: 0.9rem;
  color: #111827;
}

.growth-indicator {
  font-size: 0.8rem;
  font-weight: 600;
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
  font-size: 2.5rem;
  color: #2e5c31;
  margin-bottom: 16px;
}

.empty-state h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #111827;
}

.empty-state p {
  margin: 0 0 16px 0;
  font-size: 1rem;
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
  
  .stats-cards,
  .region-stats,
  .supply-demand-cards,
  .insights-container {
    grid-template-columns: 1fr;
  }
}
</style>