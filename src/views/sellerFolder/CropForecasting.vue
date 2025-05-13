<template>
  <div class="app-container" :class="{ 'dark': isDarkMode }">
    <!-- Sidebar -->
    <Sidebar :initial-active-item="'Forecasting'" />
    
    <div class="main-content">
      <div class="top-bar">
        <h1>Crop Forecasting</h1>
        <div class="top-bar-actions">
          <router-link to="/" class="back-btn">
            <i class="i-lucide-arrow-left mr-2"></i> Back to Market Overview
          </router-link>
          <button class="theme-toggle" @click="toggleDarkMode">
            <i :class="isDarkMode ? 'i-lucide-sun' : 'i-lucide-moon'"></i>
          </button>
        </div>
      </div>

      <div class="forecasting-page">
        <!-- Product Selection -->
        <div class="section">
          <h2>Step 1: Pick Your Crop</h2>
          <p class="helper-text">Choose which crop you want to see future trends for</p>
          <select v-model="selectedProduct" @change="loadProductData" class="farmer-select">
            <option value="">Select a crop</option>
            <option v-for="product in products" :key="product.id" :value="product.id">
              {{ product.productName }}
            </option>
          </select>
        </div>

        <!-- Forecast Settings -->
        <div class="section" v-if="selectedProduct">
          <h2>Step 2: Choose Your Settings</h2>
          <p class="helper-text">Adjust these to see different predictions</p>
          
          <div class="farmer-options">
            <div class="farmer-option">
              <label>How far ahead?</label>
              <select v-model="forecastPeriod" @change="generateForecast" class="farmer-select">
                <option value="7">Next Week</option>
                <option value="14">Next 2 Weeks</option>
                <option value="30">Next Month</option>
                <option value="90">Next 3 Months</option>
                <option value="180">Next 6 Months</option>
              </select>
            </div>
            
            <div class="farmer-option">
              <label>What to predict?</label>
              <select v-model="dataSource" @change="generateForecast" class="farmer-select">
                <option value="sales">How Much Will Sell</option>
                <option value="price">Price Changes</option>
                <option value="demand">Market Demand</option>
              </select>
            </div>
            
            <div class="farmer-option">
              <label>Include seasonal patterns?</label>
              <div class="toggle-switch">
                <button 
                  @click="toggleSeasonality" 
                  :class="{ active: includeSeasonality }"
                  class="toggle-btn"
                >
                  {{ includeSeasonality ? 'YES' : 'NO' }}
                </button>
              </div>
            </div>
          </div>
          
          <button class="primary-btn" @click="generateForecast">
            <i class="i-lucide-refresh-cw mr-2"></i> Update Forecast
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="section loading-section">
          <div class="spinner"></div>
          <p>Crunching the numbers...</p>
        </div>
        
        <!-- Results Section -->
        <div v-else-if="forecastData.length > 0" class="section">
          <h2>Your Crop Forecast</h2>
          
          <!-- Summary Cards -->
          <div class="forecast-summary">
            <div class="summary-card">
              <h3>Best Day</h3>
              <div class="summary-value">{{ peakValue }}</div>
              <div class="summary-date">{{ peakDate }}</div>
            </div>
            <div class="summary-card">
              <h3>Average</h3>
              <div class="summary-value">{{ averageForecast }}</div>
            </div>
            <div class="summary-card">
              <h3>Overall Trend</h3>
              <div class="summary-value" :class="trendClass">
                {{ trendDirection }}
                <i :class="trendIconClass"></i>
              </div>
            </div>
          </div>
          
          <!-- Chart -->
          <div class="chart-container">
            <canvas ref="forecastChart"></canvas>
          </div>
          
          <!-- Recommendations -->
          <div class="recommendations">
            <h3>What This Means For You:</h3>
            <div class="recommendation-item" v-for="(rec, index) in recommendations" :key="index">
              <div class="recommendation-icon">
                <i :class="'i-lucide-' + getRecommendationIcon(rec.icon)"></i>
              </div>
              <div class="recommendation-content">
                <h4>{{ rec.title }}</h4>
                <p>{{ rec.description }}</p>
              </div>
            </div>
          </div>
          
          <!-- Data Table -->
          <div class="data-table">
            <div class="table-header">
              <h3>Day-by-Day Numbers</h3>
              <button class="text-btn" @click="toggleShowAllData">
                {{ showAllData ? 'Show Less' : 'Show All Days' }}
              </button>
            </div>
            
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Expected {{ dataSourceLabel }}</th>
                    <th>Could be as low as</th>
                    <th>Could be as high as</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in displayedForecastData" :key="index">
                    <td>{{ formatDate(item.date) }}</td>
                    <td>{{ formatValue(item.forecast) }}</td>
                    <td>{{ formatValue(item.lowerBound) }}</td>
                    <td>{{ formatValue(item.upperBound) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="action-buttons">
            <button class="secondary-btn" @click="resetForecast">
              <i class="i-lucide-refresh-ccw mr-2"></i> Start Over
            </button>
            <button class="primary-btn" @click="exportForecast">
              <i class="i-lucide-download mr-2"></i> Save Report
            </button>
          </div>
        </div>
        
        <!-- Empty State -->
        <div v-else-if="selectedProduct" class="section empty-state">
          <i class="i-lucide-chart-line empty-icon"></i>
          <p>Choose your settings above and click "Update Forecast" to see predictions</p>
        </div>
        
        <div v-else class="section empty-state">
          <i class="i-lucide-sprout empty-icon"></i>
          <p>Select a crop to begin forecasting</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import Chart from 'chart.js/auto';
import Sidebar from '@/components/Sidebar.vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// UI State
const isDarkMode = ref(false);
const selectedProduct = ref('');
const products = ref([]);
const forecastPeriod = ref('30');
const dataSource = ref('sales');
const confidenceLevel = ref('95');
const includeSeasonality = ref(true);
const loading = ref(false);
const forecastData = ref([]);
const forecastChart = ref(null);
const chartInstance = ref(null);
const showAllData = ref(false);
const recommendations = ref([]);

// Toggle functions
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  document.body.classList.toggle('dark', isDarkMode.value);
  if (forecastData.value.length > 0) {
    renderChart();
  }
};

const toggleSeasonality = () => {
  includeSeasonality.value = !includeSeasonality.value;
  generateForecast();
};

const toggleShowAllData = () => {
  showAllData.value = !showAllData.value;
};

// Computed properties
const dataSourceLabel = computed(() => {
  switch (dataSource.value) {
    case 'price': return 'Price';
    case 'sales': return 'Sales';
    case 'demand': return 'Demand';
    default: return 'Value';
  }
});

const displayedForecastData = computed(() => {
  if (showAllData.value) {
    return forecastData.value;
  } else {
    return forecastData.value.slice(0, 7);
  }
});

// Add sample products for demonstration
const initSampleData = () => {
  // Sample products
  products.value = [
    {
      id: 'product1',
      productName: 'Tomatoes',
      price: 4.99,
      cost: 2.50,
      stock: 150,
      description: 'Fresh organic tomatoes grown without pesticides',
      category: 'Vegetables',
      image: '/placeholder.svg?height=100&width=100'
    },
    {
      id: 'product2',
      productName: 'Sweet Corn',
      price: 3.49,
      cost: 1.75,
      stock: 200,
      description: 'Locally grown sweet corn, picked fresh daily',
      category: 'Vegetables',
      image: '/placeholder.svg?height=100&width=100'
    },
    {
      id: 'product3',
      productName: 'Strawberries',
      price: 5.99,
      cost: 3.25,
      stock: 100,
      description: 'Juicy, ripe strawberries from our farm',
      category: 'Fruits',
      image: '/placeholder.svg?height=100&width=100'
    }
  ];
  
  // Pre-select the first product
  selectedProduct.value = 'product1';
  
  // Generate initial forecast
  generateForecast();
};

const loadProductData = () => {
  // Reset forecast data when product changes
  forecastData.value = [];
  if (chartInstance.value) {
    chartInstance.value.destroy();
    chartInstance.value = null;
  }
  
  // Generate new forecast for selected product
  if (selectedProduct.value) {
    generateForecast();
  }
};

const generateForecast = async () => {
  if (!selectedProduct.value) return;
  
  loading.value = true;
  
  try {
    // Simulate API call to ML backend
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate mock forecast data
    const today = new Date();
    const mockData = [];
    
    const selectedProductObj = products.value.find(p => p.id === selectedProduct.value);
    const baseValue = dataSource.value === 'price' 
      ? selectedProductObj?.price || 50 
      : dataSource.value === 'sales' 
        ? Math.floor(Math.random() * 50) + 20
        : Math.floor(Math.random() * 100) + 50;
    
    // Different trend patterns based on product and data source
    let trend = 0.02; // Default slight upward trend
    
    if (selectedProduct.value === 'product1') {
      // Tomatoes: Strong seasonal pattern
      trend = dataSource.value === 'price' ? 0.03 : 0.05;
    } else if (selectedProduct.value === 'product2') {
      // Corn: Stable with slight decline
      trend = dataSource.value === 'price' ? -0.01 : -0.02;
    } else if (selectedProduct.value === 'product3') {
      // Strawberries: Volatile with strong upward trend
      trend = dataSource.value === 'price' ? 0.07 : 0.08;
    }
    
    const volatility = dataSource.value === 'price' ? 0.08 : 0.15;
    
    // Confidence interval width based on confidence level
    const ciWidth = {
      '80': 1.28,
      '90': 1.645,
      '95': 1.96,
      '99': 2.576
    }[confidenceLevel.value] * volatility;
    
    for (let i = 0; i < parseInt(forecastPeriod.value); i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      // Calculate forecast with trend and seasonality
      let forecast = baseValue * (1 + trend * i);
      
      // Add seasonality if enabled
      if (includeSeasonality.value) {
        // Different seasonal patterns for different products
        if (selectedProduct.value === 'product1') {
          // Tomatoes: Strong summer peak
          forecast += Math.sin((i + date.getMonth()) / 6 * Math.PI) * baseValue * 0.25;
        } else if (selectedProduct.value === 'product2') {
          // Corn: Late summer peak
          forecast += Math.sin((i + date.getMonth() - 1) / 6 * Math.PI) * baseValue * 0.2;
        } else if (selectedProduct.value === 'product3') {
          // Strawberries: Spring peak
          forecast += Math.sin((i + date.getMonth() + 2) / 6 * Math.PI) * baseValue * 0.3;
        } else {
          // Default seasonal pattern
          forecast += Math.sin(i / 7 * Math.PI) * baseValue * 0.15;
        }
      }
      
      // Add some randomness
      forecast += (Math.random() - 0.5) * baseValue * 0.1;
      
      // Calculate confidence intervals
      const lowerBound = forecast - forecast * ciWidth;
      const upperBound = forecast + forecast * ciWidth;
      
      mockData.push({
        date: date.toISOString().split('T')[0],
        forecast: Math.max(0, forecast),
        lowerBound: Math.max(0, lowerBound),
        upperBound: upperBound
      });
    }
    
    forecastData.value = mockData;
    
    // Generate recommendations based on forecast
    recommendations.value = generateRecommendations();
    
    // Render chart after data is loaded
    setTimeout(() => {
      renderChart();
    }, 100);
  } catch (error) {
    console.error('Error generating forecast:', error);
  } finally {
    loading.value = false;
  }
};

const renderChart = () => {
  if (!forecastChart.value) return;
  
  if (chartInstance.value) {
    chartInstance.value.destroy();
  }
  
  const ctx = forecastChart.value.getContext('2d');
  
  const dates = forecastData.value.map(item => formatDate(item.date));
  const forecasts = forecastData.value.map(item => item.forecast);
  const lowerBounds = forecastData.value.map(item => item.lowerBound);
  const upperBounds = forecastData.value.map(item => item.upperBound);
  
  // Set chart colors based on dark mode
  const primaryColor = isDarkMode.value ? '#6abe6e' : '#2e5c31';
  const secondaryColor = isDarkMode.value ? 'rgba(106, 190, 110, 0.5)' : 'rgba(46, 92, 49, 0.5)';
  const backgroundColor = isDarkMode.value ? 'rgba(106, 190, 110, 0.1)' : 'rgba(46, 92, 49, 0.1)';
  
  chartInstance.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Expected',
          data: forecasts,
          borderColor: primaryColor,
          backgroundColor: backgroundColor,
          borderWidth: 2,
          tension: 0.3,
          fill: false
        },
        {
          label: 'Highest Possible',
          data: upperBounds,
          borderColor: secondaryColor,
          borderWidth: 1,
          borderDash: [5, 5],
          tension: 0.3,
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Lowest Possible',
          data: lowerBounds,
          borderColor: secondaryColor,
          borderWidth: 1,
          borderDash: [5, 5],
          tension: 0.3,
          fill: '-1',
          backgroundColor: backgroundColor,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: isDarkMode.value ? '#e0e0e0' : '#333',
            font: {
              size: 14
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${formatValue(context.parsed.y)}`;
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
            color: isDarkMode.value ? '#e0e0e0' : '#333',
            font: {
              size: 12
            }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: isDarkMode.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            color: isDarkMode.value ? '#e0e0e0' : '#333',
            font: {
              size: 12
            },
            callback: function(value) {
              return formatValue(value, false);
            }
          }
        }
      }
    }
  });
};

const generateRecommendations = () => {
  // Generate recommendations based on forecast data
  const trend = calculateTrend();
  const recommendations = [];
  
  const selectedProductObj = products.value.find(p => p.id === selectedProduct.value);
  const productName = selectedProductObj?.productName || 'crop';
  
  if (dataSource.value === 'price') {
    if (trend > 0.05) {
      recommendations.push({
        title: 'Price Opportunity',
        description: `${productName} prices are trending up. Consider gradually raising your prices in the coming weeks.`,
        icon: 'tags'
      });
    } else if (trend < -0.05) {
      recommendations.push({
        title: 'Consider Promotions',
        description: `${productName} prices are trending down. Try offering bundle deals to maintain your income.`,
        icon: 'percent'
      });
    }
  } else if (dataSource.value === 'sales') {
    if (trend > 0.05) {
      recommendations.push({
        title: 'Stock Up',
        description: `More people will be buying ${productName} soon. Make sure you have enough to sell.`,
        icon: 'package'
      });
    } else if (trend < -0.05) {
      recommendations.push({
        title: 'Diversify Crops',
        description: `${productName} sales are expected to drop. Consider growing other crops to balance your income.`,
        icon: 'shuffle'
      });
    }
  } else if (dataSource.value === 'demand') {
    if (trend > 0.05) {
      recommendations.push({
        title: 'Grow More',
        description: `More people will want ${productName} soon. Consider planting more if possible.`,
        icon: 'trending-up'
      });
    } else if (trend < -0.05) {
      recommendations.push({
        title: 'Find New Markets',
        description: `Fewer people may want ${productName} in your current market. Consider selling to restaurants or at different markets.`,
        icon: 'map'
      });
    }
  }
  
  // Add seasonal recommendation if seasonality is enabled
  if (includeSeasonality.value) {
    recommendations.push({
      title: 'Plan for Seasons',
      description: `${productName} demand changes with the seasons. Plan your planting and harvesting accordingly.`,
      icon: 'calendar'
    });
  }
  
  // Add product-specific recommendation
  if (selectedProduct.value === 'product1') {
    recommendations.push({
      title: 'Quality Matters',
      description: 'Keep your tomatoes fresh and unblemished to get the best prices at market.',
      icon: 'award'
    });
  } else if (selectedProduct.value === 'product2') {
    recommendations.push({
      title: 'Harvest Timing',
      description: 'Pick your corn at the right time to ensure maximum sweetness that customers love.',
      icon: 'clock'
    });
  } else if (selectedProduct.value === 'product3') {
    recommendations.push({
      title: 'Keep Cool',
      description: 'Strawberries spoil quickly. Keep them cool after picking to maintain freshness.',
      icon: 'thermometer'
    });
  }
  
  return recommendations;
};

const calculateTrend = () => {
  if (forecastData.value.length < 2) return 0;
  
  const first = forecastData.value[0].forecast;
  const last = forecastData.value[forecastData.value.length - 1].forecast;
  
  return (last - first) / first;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatValue = (value, includeCurrency = true) => {
  if (dataSource.value === 'price') {
    return includeCurrency ? `$${value.toFixed(2)}` : value.toFixed(2);
  } else {
    return value.toFixed(0);
  }
};

const exportForecast = () => {
  alert('Your forecast report will be saved as a PDF that you can print or share.');
};

const resetForecast = () => {
  forecastPeriod.value = '30';
  dataSource.value = 'sales';
  confidenceLevel.value = '95';
  includeSeasonality.value = true;
  showAllData.value = false;
  generateForecast();
};

// Helper function to convert Font Awesome icons to Lucide icons
const getRecommendationIcon = (faIcon) => {
  const iconMap = {
    'tags': 'tag',
    'percent': 'percent',
    'package': 'package',
    'shuffle': 'shuffle',
    'trending-up': 'trending-up',
    'map': 'map',
    'calendar': 'calendar',
    'award': 'award',
    'clock': 'clock',
    'thermometer': 'thermometer'
  };
  
  return iconMap[faIcon] || 'info';
};

// Computed properties for summary cards
const peakValue = computed(() => {
  if (!forecastData.value.length) return '-';
  
  const peak = forecastData.value.reduce((max, item) => 
    item.forecast > max.forecast ? item : max, forecastData.value[0]);
  
  return formatValue(peak.forecast);
});

const peakDate = computed(() => {
  if (!forecastData.value.length) return '';
  
  const peak = forecastData.value.reduce((max, item) => 
    item.forecast > max.forecast ? item : max, forecastData.value[0]);
  
  return formatDate(peak.date);
});

const averageForecast = computed(() => {
  if (!forecastData.value.length) return '-';
  
  const sum = forecastData.value.reduce((acc, item) => acc + item.forecast, 0);
  return formatValue(sum / forecastData.value.length);
});

const trendDirection = computed(() => {
  const trend = calculateTrend();
  if (trend > 0.05) return 'Going Up';
  if (trend < -0.05) return 'Going Down';
  return 'Staying Steady';
});

const trendClass = computed(() => {
  const trend = calculateTrend();
  if (trend > 0.05) return 'trend-up';
  if (trend < -0.05) return 'trend-down';
  return 'trend-stable';
});

const trendIconClass = computed(() => {
  const trend = calculateTrend();
  if (trend > 0.05) return 'i-lucide-trending-up';
  if (trend < -0.05) return 'i-lucide-trending-down';
  return 'i-lucide-minus';
});

onMounted(() => {
  // Check for dark mode
  isDarkMode.value = document.body.classList.contains('dark');
  
  // Initialize sample data
  initSampleData();
});
</script>

<style scoped>
/* Layout - Adjusted to work with fixed sidebar */
.app-container {
  min-height: 100vh;
  background: #f9f9f9;
  color: #333;
  display: flex;
}

.app-container.dark {
  background: #1a1a1a;
  color: #e0e0e0;
}

.main-content {
  margin-left: 230px; /* Match the sidebar width */
  min-height: 100vh;
  flex: 1;
  transition: all 0.3s ease;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: #2e5c31;
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.dark .top-bar {
  background: #1a3a1c;
}

.top-bar h1 {
  margin: 0;
  font-size: 1.5rem;
}

.top-bar-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-btn {
  display: flex;
  align-items: center;
  color: white;
  text-decoration: none;
  font-size: 0.9rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
  background: rgba(255,255,255,0.1);
  transition: background 0.2s;
}

.back-btn:hover {
  background: rgba(255,255,255,0.2);
}

.theme-toggle {
  background: none;
  border: none;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
}

.theme-toggle:hover {
  background: rgba(255,255,255,0.1);
}

.forecasting-page {
  max-width: 1000px;
  margin: 1rem auto;
  padding: 0 1rem;
}

/* Section Styles */
.section {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.dark .section {
  background: #2a2a2a;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

h2 {
  color: #2e5c31;
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

.dark h2 {
  color: #6abe6e;
}

.helper-text {
  color: #666;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.dark .helper-text {
  color: #aaa;
}

/* Form Elements */
.farmer-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
  font-size: 1rem;
  background: white;
  margin-bottom: 1rem;
}

.dark .farmer-select {
  background: #333;
  border-color: #444;
  color: #e0e0e0;
}

.farmer-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.farmer-option {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.farmer-option label {
  font-weight: 500;
}

.toggle-switch {
  display: flex;
  align-items: center;
  background: #f0f0f0;
  border-radius: 0.5rem;
  padding: 0.25rem;
}

.dark .toggle-switch {
  background: #333;
}

.toggle-btn {
  width: 100%;
  padding: 0.5rem;
  border: none;
  border-radius: 0.25rem;
  background: #ddd;
  cursor: pointer;
  font-weight: 500;
}

.toggle-btn.active {
  background: #2e5c31;
  color: white;
}

.dark .toggle-btn.active {
  background: #6abe6e;
  color: #1a1a1a;
}

/* Buttons */
.primary-btn {
  background: #2e5c31;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.primary-btn:hover {
  background: #234425;
}

.dark .primary-btn {
  background: #6abe6e;
  color: #1a1a1a;
}

.dark .primary-btn:hover {
  background: #58a85c;
}

.secondary-btn {
  background: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dark .secondary-btn {
  background: #333;
  color: #e0e0e0;
  border-color: #444;
}

.text-btn {
  background: none;
  border: none;
  color: #2e5c31;
  cursor: pointer;
  font-size: 0.9rem;
  text-decoration: underline;
}

.dark .text-btn {
  color: #6abe6e;
}

/* Loading */
.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid rgba(46, 92, 49, 0.1);
  border-radius: 50%;
  border-top: 4px solid #2e5c31;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.dark .spinner {
  border: 4px solid rgba(106, 190, 110, 0.1);
  border-top: 4px solid #6abe6e;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Forecast Results */
.forecast-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 0.5rem;
  text-align: center;
}

.dark .summary-card {
  background: #333;
}

.summary-card h3 {
  font-size: 1rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.dark .summary-card h3 {
  color: #aaa;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2e5c31;
}

.dark .summary-value {
  color: #6abe6e;
}

.summary-date {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.25rem;
}

.dark .summary-date {
  color: #aaa;
}

.trend-up {
  color: #4caf50;
}

.trend-down {
  color: #f44336;
}

.trend-stable {
  color: #ff9800;
}

/* Chart */
.chart-container {
  height: 300px;
  margin-bottom: 2rem;
}

/* Recommendations */
.recommendations {
  margin-bottom: 2rem;
}

.recommendations h3 {
  margin-bottom: 1rem;
  color: #2e5c31;
}

.dark .recommendations h3 {
  color: #6abe6e;
}

.recommendation-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
}

.dark .recommendation-item {
  background: #333;
}

.recommendation-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: #2e5c31;
  color: white;
  border-radius: 50%;
  flex-shrink: 0;
}

.dark .recommendation-icon {
  background: #6abe6e;
  color: #1a1a1a;
}

.recommendation-content h4 {
  margin: 0 0 0.5rem 0;
  color: #2e5c31;
}

.dark .recommendation-content h4 {
  color: #6abe6e;
}

.recommendation-content p {
  margin: 0;
  color: #666;
  font-size: 0.95rem;
}

.dark .recommendation-content p {
  color: #bbb;
}

/* Data Table */
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.dark th, .dark td {
  border-bottom: 1px solid #333;
}

th {
  background: #f5f5f5;
  color: #2e5c31;
  font-weight: 500;
}

.dark th {
  background: #333;
  color: #6abe6e;
}

tr:hover {
  background: #f9f9f9;
}

.dark tr:hover {
  background: #2d2d2d;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  color: #ccc;
  margin-bottom: 1rem;
}

.dark .empty-icon {
  color: #555;
}

/* Responsive */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0; /* On mobile, sidebar will be hidden or shown as overlay */
    padding-top: 60px; /* Add space for a mobile header */
  }
  
  .top-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 90;
    padding: 0.75rem 1rem;
  }
  
  .forecasting-page {
    padding: 0 0.5rem;
  }
  
  .section {
    padding: 1rem;
  }
  
  .forecast-summary {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .top-bar h1 {
    font-size: 1.25rem;
  }
}
</style>