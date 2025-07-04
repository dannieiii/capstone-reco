<template>
  <div class="forecasting-overview">
    <!-- Header -->
    <div class="overview-header">
      <h3>Crop Season Forecasting Overview</h3>
      <button @click="refreshForecasts" class="refresh-btn" :disabled="loading">
        <RefreshCw v-if="loading" size="16" class="spinner" />
        <span v-else>Refresh</span>
      </button>
    </div>

    <!-- Weather Summary -->
    <div class="weather-summary">
      <div class="weather-card">
        <div class="weather-icon">
          <component :is="getWeatherIcon(currentWeather.condition)" size="24" />
        </div>
        <div class="weather-info">
          <h4>Oriental Mindoro Weather</h4>
          <p>{{ currentWeather.temperature }}°C • {{ currentWeather.humidity }}% humidity</p>
          <span class="weather-status">{{ getWeatherStatus() }}</span>
        </div>
      </div>
    </div>

    <!-- Forecast Stats -->
    <div class="forecast-stats">
      <div class="stat-card excellent">
        <div class="stat-icon">
          <TrendingUp size="20" />
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ excellentCrops }}</span>
          <span class="stat-label">Excellent Crops</span>
        </div>
      </div>
      
      <div class="stat-card good">
        <div class="stat-icon">
          <CheckCircle size="20" />
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ goodCrops }}</span>
          <span class="stat-label">Good Crops</span>
        </div>
      </div>
      
      <div class="stat-card warning">
        <div class="stat-icon">
          <AlertTriangle size="20" />
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ poorCrops }}</span>
          <span class="stat-label">Poor Conditions</span>
        </div>
      </div>
      
      <div class="stat-card info">
        <div class="stat-icon">
          <Calendar size="20" />
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ predictionPeriod }}</span>
          <span class="stat-label">Day Forecast</span>
        </div>
      </div>
    </div>

    <!-- Top Recommendations Chart -->
    <div class="chart-container">
      <h4>Top Crop Recommendations</h4>
      <div class="chart-wrapper">
        <canvas ref="forecastChart" width="400" height="200"></canvas>
      </div>
    </div>

    <!-- Quick Insights -->
    <div class="insights-section">
      <h4>Quick Insights</h4>
      <div class="insights-list">
        <div v-for="insight in insights" :key="insight.id" class="insight-item">
          <div class="insight-icon" :class="insight.type">
            <component :is="insight.icon" size="16" />
          </div>
          <div class="insight-content">
            <span class="insight-title">{{ insight.title }}</span>
            <span class="insight-description">{{ insight.description }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <RefreshCw size="20" class="spinner" />
      <span>Loading forecast data...</span>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="refreshForecasts" class="retry-btn">Retry</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import Chart from 'chart.js/auto'
import {
  RefreshCw,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Calendar,
  CloudSun,
  Sun,
  Cloud,
  CloudRain,
  Thermometer,
  Droplets,
  Sprout
} from 'lucide-vue-next'

// Data
const loading = ref(false)
const error = ref(null)
const forecastChart = ref(null)
const chartInstance = ref(null)
const predictionPeriod = ref(90)

// Mock weather data (in real app, this would come from API)
const currentWeather = ref({
  temperature: 30,
  humidity: 78,
  condition: 'partly-cloudy',
  rainfall: 2
})

// Mock forecast data
const cropForecasts = ref([
  { name: 'Rice', successRate: 92, category: 'excellent' },
  { name: 'Corn', successRate: 88, category: 'excellent' },
  { name: 'Coconut', successRate: 85, category: 'excellent' },
  { name: 'Banana', successRate: 78, category: 'good' },
  { name: 'Mango', successRate: 75, category: 'good' },
  { name: 'Tomato', successRate: 72, category: 'good' },
  { name: 'Eggplant', successRate: 68, category: 'good' },
  { name: 'Cabbage', successRate: 45, category: 'poor' },
  { name: 'Lettuce', successRate: 42, category: 'poor' }
])

// Computed
const excellentCrops = computed(() => 
  cropForecasts.value.filter(c => c.successRate >= 85).length
)

const goodCrops = computed(() => 
  cropForecasts.value.filter(c => c.successRate >= 70 && c.successRate < 85).length
)

const poorCrops = computed(() => 
  cropForecasts.value.filter(c => c.successRate < 55).length
)

const insights = computed(() => [
  {
    id: 1,
    type: 'success',
    icon: TrendingUp,
    title: 'Optimal Season',
    description: `${excellentCrops.value} crops showing excellent conditions`
  },
  {
    id: 2,
    type: 'info',
    icon: Thermometer,
    title: 'Weather Favorable',
    description: `${currentWeather.value.temperature}°C ideal for most crops`
  },
  {
    id: 3,
    type: 'warning',
    icon: AlertTriangle,
    title: 'Monitor Closely',
    description: `${poorCrops.value} crops need attention`
  },
  {
    id: 4,
    type: 'info',
    icon: Droplets,
    title: 'Humidity Level',
    description: `${currentWeather.value.humidity}% humidity optimal`
  }
])

// Methods
const getWeatherIcon = (condition) => {
  switch (condition) {
    case 'clear': return Sun
    case 'rain': return CloudRain
    case 'clouds': return Cloud
    case 'partly-cloudy': return CloudSun
    default: return Cloud
  }
}

const getWeatherStatus = () => {
  const temp = currentWeather.value.temperature
  const humidity = currentWeather.value.humidity
  
  if (temp >= 28 && temp <= 32 && humidity >= 70 && humidity <= 85) {
    return 'Excellent for farming'
  } else if (temp >= 25 && temp <= 35 && humidity >= 60 && humidity <= 90) {
    return 'Good conditions'
  } else {
    return 'Monitor conditions'
  }
}

const renderChart = () => {
  if (!forecastChart.value) return
  
  try {
    if (chartInstance.value) {
      chartInstance.value.destroy()
    }
    
    const ctx = forecastChart.value.getContext('2d')
    
    // Get top 6 crops for the chart
    const topCrops = cropForecasts.value
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 6)
    
    chartInstance.value = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: topCrops.map(crop => crop.name),
        datasets: [{
          label: 'Success Rate (%)',
          data: topCrops.map(crop => crop.successRate),
          backgroundColor: topCrops.map(crop => {
            if (crop.successRate >= 85) return '#10b981'  // Green
            if (crop.successRate >= 70) return '#3b82f6'  // Blue
            return '#f59e0b'  // Orange
          }),
          borderColor: topCrops.map(crop => {
            if (crop.successRate >= 85) return '#059669'
            if (crop.successRate >= 70) return '#2563eb'
            return '#d97706'
          }),
          borderWidth: 1,
          borderRadius: 4
        }]
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
                return `Success Rate: ${context.parsed.y}%`
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Success Rate (%)'
            },
            ticks: {
              stepSize: 20
            }
          },
          x: {
            title: {
              display: true,
              text: 'Crops'
            }
          }
        }
      }
    })
    
    console.log('Forecast chart rendered successfully')
    
  } catch (err) {
    console.error('Error rendering forecast chart:', err)
  }
}

const refreshForecasts = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // In real app, this would fetch from your forecasting API
    console.log('Refreshing forecast data...')
    
    // Re-render chart
    await nextTick()
    renderChart()
    
  } catch (err) {
    console.error('Error refreshing forecasts:', err)
    error.value = 'Failed to refresh forecast data'
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  setTimeout(() => {
    renderChart()
  }, 100)
})
</script>

<style scoped>
.forecasting-overview {
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

.weather-summary {
  margin-bottom: 20px;
}

.weather-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 8px;
  border: 1px solid #e0f2fe;
}

.weather-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  color: #0ea5e9;
}

.weather-info h4 {
  margin: 0 0 4px 0;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 600;
}

.weather-info p {
  margin: 0 0 4px 0;
  color: #475569;
  font-size: 0.875rem;
}

.weather-status {
  font-size: 0.75rem;
  color: #059669;
  font-weight: 500;
}

.forecast-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.stat-card.excellent {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-color: #a7f3d0;
}

.stat-card.good {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #93c5fd;
}

.stat-card.warning {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border-color: #fcd34d;
}

.stat-card.info {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-color: #cbd5e1;
}

.stat-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: white;
}

.stat-card.excellent .stat-icon {
  background: #059669;
}

.stat-card.good .stat-icon {
  background: #2563eb;
}

.stat-card.warning .stat-icon {
  background: #d97706;
}

.stat-card.info .stat-icon {
  background: #64748b;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  line-height: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.chart-container {
  margin-bottom: 24px;
}

.chart-container h4 {
  margin: 0 0 16px 0;
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
}

.chart-wrapper {
  height: 250px;
  position: relative;
}

.insights-section {
  margin-bottom: 20px;
}

.insights-section h4 {
  margin: 0 0 16px 0;
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
}

.insights-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.insight-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.insight-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: white;
}

.insight-icon.success {
  background: #059669;
}

.insight-icon.info {
  background: #2563eb;
}

.insight-icon.warning {
  background: #d97706;
}

.insight-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.insight-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 2px;
}

.insight-description {
  font-size: 0.75rem;
  color: #6b7280;
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
  .forecasting-overview {
    padding: 16px;
  }
  
  .overview-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .forecast-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .insights-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .forecast-stats {
    grid-template-columns: 1fr;
  }
  
  .weather-card {
    flex-direction: column;
    text-align: center;
  }
}
</style>