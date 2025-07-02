<template>
<div class="dashboard-container">
<AdminSidebar initialActiveItem="Crop Seasons" />

<div class="main-content">
  <header class="header">
    <div class="page-title">
      <h1>Oriental Mindoro Crop Season Predictions</h1>
      <p>AI-powered crop season forecasting and seller notifications for Oriental Mindoro</p>
    </div>
    
    <div class="prediction-controls">
      <div class="control-group">
        <label>Prediction Period</label>
        <select v-model="predictionPeriod" class="period-select" @change="generatePredictions">
          <option value="30">Next 30 Days</option>
          <option value="60">Next 60 Days</option>
          <option value="90">Next 3 Months</option>
          <option value="180">Next 6 Months</option>
        </select>
      </div>
      
      <button @click="generatePredictions" class="generate-btn" :disabled="loading">
        <RefreshCw v-if="loading" size="16" class="spinner" />
        <span v-else>Generate Predictions</span>
      </button>
      
      <button @click="sendNotifications" class="notify-btn" :disabled="!predictions.length || sending">
        <Send v-if="!sending" size="16" />
        <Loader2 v-else size="16" class="spinner" />
        Send Notifications
      </button>
    </div>
  </header>
  
  <!-- Weather Overview for Oriental Mindoro -->
  <div class="weather-overview">
    <div class="weather-card">
      <div class="weather-header">
        <CloudSun size="24" />
        <div class="weather-info">
          <h3>Current Weather</h3>
          <p>Oriental Mindoro, Philippines</p>
        </div>
      </div>
      <div class="weather-details">
        <div class="weather-stat">
          <Thermometer size="16" />
          <span>{{ currentWeather.temperature }}°C</span>
        </div>
        <div class="weather-stat">
          <Droplets size="16" />
          <span>{{ currentWeather.humidity }}%</span>
        </div>
        <div class="weather-stat">
          <Wind size="16" />
          <span>{{ currentWeather.windSpeed }} km/h</span>
        </div>
        <div class="weather-stat">
          <CloudRain size="16" />
          <span>{{ currentWeather.rainfall }}mm</span>
        </div>
      </div>
    </div>
    
    <div class="weather-forecast">
      <h4>7-Day Weather Forecast</h4>
      <div class="forecast-grid">
        <div v-for="day in staticWeatherForecast" :key="day.date" class="forecast-day">
          <span class="forecast-date">{{ formatDate(day.date) }}</span>
          <component :is="getWeatherIcon(day.condition)" size="20" />
          <span class="forecast-temp">{{ day.temperature }}°C</span>
          <span class="forecast-rain">{{ day.rainfall }}mm</span>
        </div>
      </div>
    </div>
  </div>
  
  <div v-if="loading" class="loading-state">
    <div class="spinner-container">
      <div class="spinner"></div>
    </div>
    <p>Analyzing Oriental Mindoro weather patterns and crop data...</p>
    <p class="loading-detail">{{ loadingMessage }}</p>
  </div>
  
  <div v-else-if="error" class="error-state">
    <div class="error-icon">!</div>
    <p>{{ error }}</p>
    <button @click="generatePredictions" class="retry-btn">Try Again</button>
  </div>
  
  <div v-else-if="predictions.length > 0" class="prediction-results">
    <!-- Seasonal Prediction Chart -->
    <div class="chart-container">
      <div class="chart-header">
        <h2>Crop Season Success Predictions - Oriental Mindoro ({{ predictionPeriod }} Days)</h2>
        <div class="chart-controls">
          <button @click="exportChartData" class="export-btn" :disabled="exporting">
            <Download v-if="!exporting" size="16" />
            <Loader2 v-else size="16" class="spinner" />
            Export Chart
          </button>
        </div>
      </div>
      <div class="chart-wrapper">
        <canvas ref="seasonChart"></canvas>
      </div>
    </div>
    
    <!-- Crop Recommendations Table -->
    <div class="recommendations-container">
      <div class="table-header">
        <h2>Crop Recommendations for Oriental Mindoro ({{ predictionPeriod }} Day Period)</h2>
      </div>
      
      <div class="table-wrapper">
        <table class="recommendations-table">
          <thead>
            <tr>
              <th>Crop</th>
              <th>Optimal Season</th>
              <th>Success Rate</th>
              <th>Weather Suitability</th>
              <th>Market Demand</th>
              <th>Region Suitability</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="crop in cropRecommendations" :key="crop.id">
              <td>
                <span>{{ crop.name }}</span>
              </td>
              <td>
                <span class="season-badge" :class="getSeasonClass(crop.season)">
                  {{ crop.season }}
                </span>
              </td>
              <td>
                <div class="success-indicator">
                  <span class="success-text">{{ crop.successRate }}%</span>
                  <div class="success-bar">
                    <div class="success-fill" :style="{ width: crop.successRate + '%' }"></div>
                  </div>
                </div>
              </td>
              <td>
                <span class="suitability-badge" :class="getSuitabilityClass(crop.weatherSuitability)">
                  {{ crop.weatherSuitability }}
                </span>
              </td>
              <td>
                <span class="demand-badge" :class="getDemandClass(crop.marketDemand)">
                  {{ crop.marketDemand }}
                </span>
              </td>
              <td>
                <span class="region-badge" :class="getRegionSuitabilityClass(crop.regionSuitability)">
                  {{ crop.regionSuitability }}
                </span>
              </td>
              <td>
                <button @click="viewCropDetails(crop)" class="view-btn">
                  <Eye size="16" />
                  View Details
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Weather Impact Analysis -->
    <div class="weather-analysis">
      <h2>Weather Impact Analysis - Oriental Mindoro ({{ predictionPeriod }} Day Period)</h2>
      <div class="analysis-grid">
        <div class="analysis-card">
          <div class="analysis-header">
            <Thermometer size="20" />
            <h4>Temperature Trends</h4>
          </div>
          <div class="trend-chart">
            <canvas ref="temperatureChart"></canvas>
          </div>
          <p class="analysis-summary">Avg: {{ weatherAnalysis.avgTemperature }}°C</p>
        </div>
        
        <div class="analysis-card">
          <div class="analysis-header">
            <CloudRain size="20" />
            <h4>Rainfall Patterns</h4>
          </div>
          <div class="trend-chart">
            <canvas ref="rainfallChart"></canvas>
          </div>
          <p class="analysis-summary">Total: {{ weatherAnalysis.totalRainfall }}mm</p>
        </div>
        
        <div class="analysis-card">
          <div class="analysis-header">
            <Droplets size="20" />
            <h4>Humidity Levels</h4>
          </div>
          <div class="trend-chart">
            <canvas ref="humidityChart"></canvas>
          </div>
          <p class="analysis-summary">Avg: {{ weatherAnalysis.avgHumidity }}%</p>
        </div>
      </div>
    </div>
    
    <!-- Notification Management -->
    <div class="notification-management">
      <h2>Seller Notifications</h2>
      <div class="notification-history">
        <h4>Recent Notifications</h4>
        <div class="notification-list">
          <div v-for="notification in recentNotifications" :key="notification.id" class="notification-item">
            <div class="notification-content">
              <h5>{{ notification.title }}</h5>
              <p>{{ notification.message }}</p>
              <span class="notification-date">{{ formatDateTime(notification.timestamp) }}</span>
            </div>
            <div class="notification-status">
              <span class="status-badge" :class="notification.status">{{ notification.status }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div v-else class="empty-state">
    <div class="empty-icon">
      <Sprout size="48" />
    </div>
    <h2>No Predictions Generated</h2>
    <p>Click "Generate Predictions" to start analyzing crop seasons for Oriental Mindoro</p>
    <button @click="generatePredictions" class="generate-btn">Generate Predictions</button>
  </div>
  
  <!-- Status Messages -->
  <div v-if="statusMessage" class="status-message" :class="statusMessage.type">
    <CheckCircle v-if="statusMessage.type === 'success'" size="16" />
    <AlertCircle v-else size="16" />
    {{ statusMessage.text }}
  </div>
</div>
</div>

<!-- Enhanced Modal with Year Display -->
<div v-if="showModal" class="modal-overlay" @click="closeModal">
  <div class="modal-content" @click.stop>
    <div class="modal-header">
      <h3>{{ selectedCrop?.name }} - Detailed Analysis</h3>
      <button @click="closeModal" class="close-btn">
        <X size="20" />
      </button>
    </div>
    <div class="modal-body">
      <div class="detail-sections">
        <div class="detail-section">
          <h4>Success Metrics</h4>
          <div class="metrics-grid">
            <div class="metric">
              <span class="metric-label">Success Rate</span>
              <span class="metric-value">{{ selectedCrop?.successRate }}%</span>
            </div>
            <div class="metric">
              <span class="metric-label">Weather Suitability</span>
              <span class="metric-value">{{ selectedCrop?.weatherSuitability }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Market Demand</span>
              <span class="metric-value">{{ selectedCrop?.marketDemand }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Region Fit</span>
              <span class="metric-value">{{ selectedCrop?.regionSuitability }}</span>
            </div>
          </div>
        </div>
        
        <div class="detail-section">
          <h4>Planting Schedule</h4>
          <div class="schedule-info">
            <p><strong>Optimal Planting:</strong> {{ formatDateWithYear(selectedCrop?.plantingDate) }}</p>
            <p><strong>Expected Harvest:</strong> {{ formatDateWithYear(selectedCrop?.harvestDate) }}</p>
            <p><strong>Growth Period:</strong> {{ selectedCrop?.growthPeriod }} days</p>
            <p><strong>Season:</strong> {{ selectedCrop?.season }}</p>
          </div>
        </div>
        
        <div class="detail-section">
          <h4>Analysis & Recommendations</h4>
          <p><strong>Recommendation:</strong> {{ selectedCrop?.recommendation }}</p>
          <p><strong>Risk Factors:</strong> {{ selectedCrop?.riskFactors }}</p>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Monthly Planting Calendar -->
<div class="planting-calendar">
  <h2>Monthly Planting Calendar</h2>
  <div class="calendar-container">
    <div class="calendar-header">
      <div class="month-navigation">
        <button @click="previousMonth" class="nav-btn">
          <ChevronLeft size="16" />
        </button>
        <h3>{{ currentCalendarMonth.name }} {{ currentCalendarYear }}</h3>
        <button @click="nextMonth" class="nav-btn">
          <ChevronRight size="16" />
        </button>
      </div>
      <div class="calendar-legend">
        <div class="legend-item">
          <div class="legend-color plant"></div>
          <span>Planting</span>
        </div>
        <div class="legend-item">
          <div class="legend-color harvest"></div>
          <span>Harvesting</span>
        </div>
      </div>
    </div>
    
    <div class="calendar-grid">
      <div class="calendar-day-header">Sun</div>
      <div class="calendar-day-header">Mon</div>
      <div class="calendar-day-header">Tue</div>
      <div class="calendar-day-header">Wed</div>
      <div class="calendar-day-header">Thu</div>
      <div class="calendar-day-header">Fri</div>
      <div class="calendar-day-header">Sat</div>
      
      <div v-for="day in calendarDays" :key="day.date" 
           class="calendar-day" 
           :class="{ 
             'other-month': !day.isCurrentMonth,
             'today': day.isToday,
             'has-activities': day.activities.length > 0
           }">
        <div class="day-number">{{ day.day }}</div>
        <div class="day-activities">
          <div v-for="activity in day.activities.slice(0, 2)" 
               :key="activity.crop + activity.type" 
               class="activity-item" 
               :class="activity.type"
               :title="`${activity.type} ${activity.crop}`">
            <span class="activity-text">{{ activity.crop }}</span>
          </div>
          <div v-if="day.activities.length > 2" class="more-activities">
            +{{ day.activities.length - 2 }} more
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { collection, query, where, getDocs, addDoc, Timestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import Chart from 'chart.js/auto';
import AdminSidebar from '@/components/AdminSidebar.vue';
import {
RefreshCw,
Send,
Download,
CloudSun,
Thermometer,
Droplets,
Wind,
CloudRain,
Sun,
Cloud,
Sprout,
CheckCircle,
AlertCircle,
Loader2,
Eye,
X,
ChevronLeft,
ChevronRight
} from 'lucide-vue-next';

// Import crop datasets
import { orientalMindoroCrops } from '@/data/cropDatasets';

// Data properties
const predictionPeriod = ref('90');
const loading = ref(false);
const sending = ref(false);
const exporting = ref(false);
const loadingMessage = ref('');
const error = ref(null);
const predictions = ref([]);
const cropRecommendations = ref([]);
const statusMessage = ref(null);

// Chart refs
const seasonChart = ref(null);
const temperatureChart = ref(null);
const rainfallChart = ref(null);
const humidityChart = ref(null);

// Weather data for Oriental Mindoro - Static 7-day forecast (unaffected by prediction period)
const currentWeather = ref({
temperature: 28,
humidity: 78,
windSpeed: 15,
rainfall: 2,
condition: 'partly-cloudy'
});

// Static 7-day forecast that doesn't change with prediction period
const staticWeatherForecast = ref([
{ date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), temperature: 29, rainfall: 3, condition: 'partly-cloudy' },
{ date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), temperature: 27, rainfall: 8, condition: 'rain' },
{ date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), temperature: 30, rainfall: 1, condition: 'clear' },
{ date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), temperature: 28, rainfall: 5, condition: 'clouds' },
{ date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), temperature: 26, rainfall: 12, condition: 'rain' },
{ date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), temperature: 31, rainfall: 0, condition: 'clear' },
{ date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), temperature: 29, rainfall: 4, condition: 'partly-cloudy' }
]);

// Weather analysis based on prediction period
const weatherAnalysis = ref({
avgTemperature: 0,
totalRainfall: 0,
avgHumidity: 0
});

// Notification data
const notificationStats = ref({
sent: 0,
successRate: 0
});

const recentNotifications = ref([]);

// Modal and calendar data
const showModal = ref(false);
const selectedCrop = ref(null);
const currentCalendarMonth = ref({ name: 'January', number: 1 });
const currentCalendarYear = ref(new Date().getFullYear());
const calendarDays = ref([]);

// Helper functions
const formatDate = (date) => {
return new Date(date).toLocaleDateString('en-US', { 
  month: 'short', 
  day: 'numeric'
});
};

const formatDateWithYear = (date) => {
return new Date(date).toLocaleDateString('en-US', { 
  year: 'numeric',
  month: 'long', 
  day: 'numeric'
});
};

const formatDateTime = (date) => {
return new Date(date).toLocaleDateString('en-US', { 
  year: 'numeric',
  month: 'short', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});
};

const getWeatherIcon = (condition) => {
switch (condition) {
  case 'clear': return Sun;
  case 'rain': return CloudRain;
  case 'clouds': return Cloud;
  case 'partly-cloudy': return CloudSun;
  default: return Cloud;
}
};

const getSeasonClass = (season) => {
switch (season.toLowerCase()) {
  case 'wet': return 'season-wet';
  case 'dry': return 'season-dry';
  case 'transitional': return 'season-transitional';
  default: return 'season-optimal';
}
};

const getSuitabilityClass = (suitability) => {
switch (suitability.toLowerCase()) {
  case 'excellent': return 'suitability-excellent';
  case 'good': return 'suitability-good';
  case 'fair': return 'suitability-fair';
  default: return 'suitability-poor';
}
};

const getDemandClass = (demand) => {
switch (demand.toLowerCase()) {
  case 'high': return 'demand-high';
  case 'medium': return 'demand-medium';
  default: return 'demand-low';
}
};

const getRegionSuitabilityClass = (suitability) => {
switch (suitability.toLowerCase()) {
  case 'excellent': return 'region-excellent';
  case 'good': return 'region-good';
  case 'fair': return 'region-fair';
  default: return 'region-poor';
}
};

const showStatus = (type, text) => {
statusMessage.value = { type, text };
setTimeout(() => {
  statusMessage.value = null;
}, 3000);
};

// Generate weather data based on prediction period
const generateWeatherDataForPeriod = (days) => {
const weatherData = [];
const baseTemp = currentWeather.value.temperature;
const baseHumidity = currentWeather.value.humidity;

for (let i = 0; i < days; i++) {
  const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
  const month = date.getMonth() + 1;
  
  // Seasonal temperature variation
  let tempVariation = 0;
  if (month >= 3 && month <= 5) tempVariation = 2; // Hot season
  else if (month >= 6 && month <= 11) tempVariation = -1; // Wet season
  else tempVariation = 1; // Cool dry season
  
  // Add some randomness but keep it realistic
  const temperature = Math.round(baseTemp + tempVariation + (Math.random() - 0.5) * 4);
  const humidity = Math.round(baseHumidity + (Math.random() - 0.5) * 10);
  const rainfall = Math.round(Math.random() * (month >= 6 && month <= 11 ? 20 : 8));
  
  weatherData.push({
    date,
    temperature: Math.max(22, Math.min(35, temperature)),
    humidity: Math.max(60, Math.min(95, humidity)),
    rainfall,
    condition: rainfall > 10 ? 'rain' : rainfall > 5 ? 'clouds' : 'clear'
  });
}

return weatherData;
};

// Enhanced crop analysis based on prediction period
const analyzeCropSeasons = async (predictionDays) => {
loadingMessage.value = `Running ML analysis for ${predictionDays}-day period...`;

const currentMonth = new Date().getMonth() + 1;
const predictions = [];
const recommendations = [];

// Generate weather data for the specific prediction period
const periodWeatherData = generateWeatherDataForPeriod(predictionDays);

// Calculate weather analysis for the period
weatherAnalysis.value = {
  avgTemperature: Math.round(periodWeatherData.reduce((sum, day) => sum + day.temperature, 0) / periodWeatherData.length),
  totalRainfall: periodWeatherData.reduce((sum, day) => sum + day.rainfall, 0),
  avgHumidity: Math.round(periodWeatherData.reduce((sum, day) => sum + day.humidity, 0) / periodWeatherData.length)
};

for (const crop of orientalMindoroCrops) {
  const weatherScore = calculateWeatherSuitabilityForPeriod(crop, periodWeatherData);
  const seasonalScore = calculateSeasonalSuitabilityForPeriod(crop, currentMonth, predictionDays);
  const marketDemand = calculateMarketDemandForPeriod(crop, predictionDays);
  const riskFactors = analyzeRiskFactorsForPeriod(crop, periodWeatherData, currentMonth);
  const regionSuitability = crop.orientalMindoroSuitability?.score || 75;
  
  const mlScore = calculateMLScore(weatherScore, seasonalScore, marketDemand, regionSuitability);
  
  const plantingDate = getOptimalPlantingDateForPeriod(crop, currentMonth, predictionDays);
  const harvestDate = getOptimalHarvestDate(crop, plantingDate);
  
  const season = determineSeasonType(currentMonth);
  const weatherSuitability = getWeatherSuitabilityText(weatherScore);
  const demandLevel = getMarketDemandText(marketDemand);
  const regionSuitabilityText = getRegionSuitabilityText(regionSuitability);
  
  recommendations.push({
    id: crop.id,
    name: crop.name,
    image: crop.image,
    season,
    plantingDate,
    harvestDate,
    successRate: Math.round(mlScore),
    weatherSuitability,
    marketDemand: demandLevel,
    regionSuitability: regionSuitabilityText,
    recommendation: generateAdvancedRecommendation(crop, mlScore, weatherSuitability, riskFactors),
    riskFactors: riskFactors.join(', '),
    growthPeriod: crop.growthPeriod,
    plantingMonths: crop.plantingMonths,
    harvestMonths: crop.harvestMonths
  });
  
  predictions.push({
    crop: crop.name,
    month: currentMonth,
    suitability: Math.round(mlScore),
    weatherScore,
    seasonalScore,
    marketScore: marketDemand,
    predictionPeriod: predictionDays
  });
}

return { 
  predictions, 
  recommendations: recommendations.sort((a, b) => b.successRate - a.successRate) 
};
};

// Enhanced calculation functions for period-based analysis
const calculateWeatherSuitabilityForPeriod = (crop, periodWeatherData) => {
let totalScore = 0;
const requirements = crop.weatherRequirements;

periodWeatherData.forEach(day => {
  let dayScore = 0;
  let factors = 0;

  const tempScore = calculateParameterScore(
    day.temperature, 
    requirements.temperature.min, 
    requirements.temperature.max
  );
  dayScore += tempScore * 0.4;
  factors += 0.4;

  const humidityScore = calculateParameterScore(
    day.humidity, 
    requirements.humidity.min, 
    requirements.humidity.max
  );
  dayScore += humidityScore * 0.3;
  factors += 0.3;

  const rainfallScore = calculateParameterScore(
    day.rainfall * 30, // Convert daily to monthly equivalent
    requirements.rainfall.min, 
    requirements.rainfall.max
  );
  dayScore += rainfallScore * 0.3;
  factors += 0.3;

  totalScore += dayScore / factors;
});

return Math.round(totalScore / periodWeatherData.length);
};

const calculateSeasonalSuitabilityForPeriod = (crop, currentMonth, predictionDays) => {
const endMonth = new Date(Date.now() + predictionDays * 24 * 60 * 60 * 1000).getMonth() + 1;
const monthsInPeriod = [];

// Get all months covered in the prediction period
let month = currentMonth;
while (month !== endMonth || monthsInPeriod.length === 0) {
  monthsInPeriod.push(month);
  month = month === 12 ? 1 : month + 1;
  if (monthsInPeriod.length > 12) break; // Safety check
}

// Calculate how many optimal months are in the period
const optimalMonthsInPeriod = monthsInPeriod.filter(month => 
  crop.plantingMonths.includes(month)
).length;

const periodScore = (optimalMonthsInPeriod / monthsInPeriod.length) * 100;
return Math.max(20, Math.round(periodScore));
};

const calculateMarketDemandForPeriod = (crop, predictionDays) => {
// Simulate market demand based on crop type and season
const baseDemand = crop.marketDemand || 70;
const seasonalMultiplier = predictionDays > 90 ? 1.1 : predictionDays > 180 ? 1.2 : 1.0;

return Math.min(100, Math.round(baseDemand * seasonalMultiplier));
};

const analyzeRiskFactorsForPeriod = (crop, periodWeatherData, currentMonth) => {
const risks = [];

// Temperature risks
const avgTemp = periodWeatherData.reduce((sum, day) => sum + day.temperature, 0) / periodWeatherData.length;
if (avgTemp > crop.weatherRequirements.temperature.max) {
  risks.push('High temperature stress during period');
}
if (avgTemp < crop.weatherRequirements.temperature.min) {
  risks.push('Low temperature risk during period');
}

// Rainfall risks
const totalRainfall = periodWeatherData.reduce((sum, day) => sum + day.rainfall, 0);
const avgMonthlyRainfall = (totalRainfall / periodWeatherData.length) * 30;
if (avgMonthlyRainfall > crop.weatherRequirements.rainfall.max) {
  risks.push('Excessive rainfall expected');
}
if (avgMonthlyRainfall < crop.weatherRequirements.rainfall.min) {
  risks.push('Insufficient rainfall expected');
}

// Seasonal risks
const typhoonMonths = [7, 8, 9, 10, 11];
if (typhoonMonths.includes(currentMonth)) {
  risks.push('Typhoon season risk');
}

// Crop-specific risks
if (crop.name.toLowerCase().includes('rice') && currentMonth >= 6 && currentMonth <= 8) {
  risks.push('Pest pressure (wet season)');
}

if (crop.category === 'Fruits') {
  const highHumidityDays = periodWeatherData.filter(day => day.humidity > 85).length;
  if (highHumidityDays > periodWeatherData.length * 0.5) {
    risks.push('Fungal disease risk (high humidity)');
  }
}

return risks.length > 0 ? risks : ['Low risk conditions'];
};

const getOptimalPlantingDateForPeriod = (crop, currentMonth, predictionDays) => {
const today = new Date();
const periodEnd = new Date(Date.now() + predictionDays * 24 * 60 * 60 * 1000);

// Find the best planting month within the prediction period
let bestMonth = crop.plantingMonths.find(month => {
  const plantingDate = new Date(today.getFullYear(), month - 1, 15);
  if (plantingDate < today) {
    plantingDate.setFullYear(plantingDate.getFullYear() + 1);
  }
  return plantingDate <= periodEnd;
});

if (!bestMonth) {
  bestMonth = crop.plantingMonths[0];
}

const plantingDate = new Date(today.getFullYear(), bestMonth - 1, 15);
if (plantingDate < today) {
  plantingDate.setFullYear(plantingDate.getFullYear() + 1);
}

return plantingDate;
};

// Other helper functions remain the same
const calculateParameterScore = (value, min, max) => {
if (value >= min && value <= max) return 100;

const optimal = (min + max) / 2;
const range = max - min;
const deviation = Math.abs(value - optimal);

if (deviation <= range * 0.2) return 90;
if (deviation <= range * 0.4) return 75;
if (deviation <= range * 0.6) return 60;
if (deviation <= range * 0.8) return 45;
if (deviation <= range * 1.2) return 30;
return 15;
};

const calculateMLScore = (weatherScore, seasonalScore, marketDemand, regionSuitability) => {
const weights = {
  weather: 0.30,
  seasonal: 0.25,
  market: 0.25,
  region: 0.20
};

const mlScore = (
  weatherScore * weights.weather +
  seasonalScore * weights.seasonal +
  marketDemand * weights.market +
  regionSuitability * weights.region
);

return Math.max(10, Math.min(100, mlScore));
};

const getOptimalHarvestDate = (crop, plantingDate) => {
const harvestDate = new Date(plantingDate);
harvestDate.setDate(harvestDate.getDate() + crop.growthPeriod);
return harvestDate;
};

const determineSeasonType = (month) => {
if (month >= 6 && month <= 11) return 'Wet';
if (month >= 12 || month <= 2) return 'Dry';
return 'Transitional';
};

const getWeatherSuitabilityText = (score) => {
if (score >= 85) return 'Excellent';
if (score >= 70) return 'Good';
if (score >= 55) return 'Fair';
return 'Poor';
};

const getMarketDemandText = (score) => {
if (score >= 80) return 'High';
if (score >= 60) return 'Medium';
return 'Low';
};

const getRegionSuitabilityText = (score) => {
if (score >= 85) return 'Excellent';
if (score >= 70) return 'Good';
if (score >= 55) return 'Fair';
return 'Poor';
};

const generateAdvancedRecommendation = (crop, mlScore, weatherSuitability, riskFactors) => {
if (mlScore >= 85) {
  return `Excellent conditions for ${crop.name} cultivation. Proceed with confidence and consider expanding planting area.`;
} else if (mlScore >= 70) {
  return `Good opportunity for ${crop.name}. Monitor weather conditions and implement proper crop management practices.`;
} else if (mlScore >= 55) {
  return `Moderate conditions for ${crop.name}. Consider risk mitigation strategies: ${riskFactors.slice(0, 2).join(', ')}.`;
} else {
  return `Not recommended for ${crop.name} at this time. Wait for better conditions or consider alternative crops.`;
}
};

// Modal functions
const viewCropDetails = (crop) => {
selectedCrop.value = crop;
showModal.value = true;
};

const closeModal = () => {
showModal.value = false;
selectedCrop.value = null;
};

// Calendar functions
const previousMonth = () => {
if (currentCalendarMonth.value.number === 1) {
  currentCalendarMonth.value = { name: 'December', number: 12 };
  currentCalendarYear.value--;
} else {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  currentCalendarMonth.value.number--;
  currentCalendarMonth.value.name = monthNames[currentCalendarMonth.value.number - 1];
}
generateCalendarDays();
};

const nextMonth = () => {
if (currentCalendarMonth.value.number === 12) {
  currentCalendarMonth.value = { name: 'January', number: 1 };
  currentCalendarYear.value++;
} else {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  currentCalendarMonth.value.number++;
  currentCalendarMonth.value.name = monthNames[currentCalendarMonth.value.number - 1];
}
generateCalendarDays();
};

const generateCalendarDays = () => {
const year = currentCalendarYear.value;
const month = currentCalendarMonth.value.number;
const today = new Date();

const firstDay = new Date(year, month - 1, 1);
const lastDay = new Date(year, month, 0);
const daysInMonth = lastDay.getDate();
const startingDayOfWeek = firstDay.getDay();

const prevMonth = new Date(year, month - 2, 0);
const daysInPrevMonth = prevMonth.getDate();

const days = [];

// Previous month's days
for (let i = startingDayOfWeek - 1; i >= 0; i--) {
  const day = daysInPrevMonth - i;
  days.push({
    day,
    date: `${year}-${month - 1}-${day}`,
    isCurrentMonth: false,
    isToday: false,
    activities: []
  });
}

// Current month's days
for (let day = 1; day <= daysInMonth; day++) {
  const isToday = today.getFullYear() === year && 
                 today.getMonth() === month - 1 && 
                 today.getDate() === day;
  
  const activities = getActivitiesForDay(month, day);
  
  days.push({
    day,
    date: `${year}-${month}-${day}`,
    isCurrentMonth: true,
    isToday,
    activities
  });
}

// Next month's days to fill the grid
const remainingDays = 42 - days.length;
for (let day = 1; day <= remainingDays; day++) {
  days.push({
    day,
    date: `${year}-${month + 1}-${day}`,
    isCurrentMonth: false,
    isToday: false,
    activities: []
  });
}

calendarDays.value = days;
};

const getActivitiesForDay = (month, day) => {
const activities = [];

cropRecommendations.value.forEach(crop => {
  if (crop.plantingMonths?.includes(month)) {
    const plantingDate = new Date(crop.plantingDate);
    if (plantingDate.getDate() === day && plantingDate.getMonth() + 1 === month) {
      activities.push({
        crop: crop.name,
        type: 'plant'
      });
    }
  }
  
  if (crop.harvestMonths?.includes(month)) {
    const harvestDate = new Date(crop.harvestDate);
    if (harvestDate.getDate() === day && harvestDate.getMonth() + 1 === month) {
      activities.push({
        crop: crop.name,
        type: 'harvest'
      });
    }
  }
});

return activities;
};

// Chart rendering functions
const renderSeasonChart = () => {
if (!seasonChart.value || !cropRecommendations.value.length) return;

nextTick(() => {
  const ctx = seasonChart.value.getContext('2d');
  
  const chartData = {
    labels: cropRecommendations.value.map(crop => crop.name),
    datasets: [{
      label: 'Success Rate (%)',
      data: cropRecommendations.value.map(crop => crop.successRate),
      backgroundColor: cropRecommendations.value.map(crop => {
        if (crop.successRate >= 85) return 'rgba(16, 185, 129, 0.8)';
        if (crop.successRate >= 70) return 'rgba(59, 130, 246, 0.8)';
        if (crop.successRate >= 55) return 'rgba(245, 158, 11, 0.8)';
        return 'rgba(239, 68, 68, 0.8)';
      }),
      borderColor: '#2e5c31',
      borderWidth: 2
    }]
  };
  
  new Chart(ctx, {
    type: 'bar',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { 
          display: true, 
          text: `Crop Success Rate Predictions - ${predictionPeriod.value} Day Period` 
        }
      },
      scales: {
        y: { beginAtZero: true, max: 100, title: { display: true, text: 'Success Rate (%)' } },
        x: { title: { display: true, text: 'Crops' } }
      }
    }
  });
});
};

const renderWeatherCharts = () => {
// Generate weather data for charts based on prediction period
const chartWeatherData = generateWeatherDataForPeriod(Math.min(parseInt(predictionPeriod.value), 30));

if (temperatureChart.value) {
  const tempCtx = temperatureChart.value.getContext('2d');
  new Chart(tempCtx, {
    type: 'line',
    data: {
      labels: chartWeatherData.map((day, index) => `Day ${index + 1}`),
      datasets: [{
        label: 'Temperature (°C)',
        data: chartWeatherData.map(day => day.temperature),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: false }, 
        title: { display: true, text: `Temperature Forecast (${predictionPeriod.value} days)` } 
      },
      scales: { y: { beginAtZero: false, title: { display: true, text: '°C' } } }
    }
  });
}

if (rainfallChart.value) {
  const rainCtx = rainfallChart.value.getContext('2d');
  new Chart(rainCtx, {
    type: 'bar',
    data: {
      labels: chartWeatherData.map((day, index) => `Day ${index + 1}`),
      datasets: [{
        label: 'Rainfall (mm)',
        data: chartWeatherData.map(day => day.rainfall),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: '#3b82f6',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: false }, 
        title: { display: true, text: `Rainfall Forecast (${predictionPeriod.value} days)` } 
      },
      scales: { y: { beginAtZero: true, title: { display: true, text: 'mm' } } }
    }
  });
}

if (humidityChart.value) {
  const humidityCtx = humidityChart.value.getContext('2d');
  
  new Chart(humidityCtx, {
    type: 'line',
    data: {
      labels: chartWeatherData.map((day, index) => `Day ${index + 1}`),
      datasets: [{
        label: 'Humidity (%)',
        data: chartWeatherData.map(day => day.humidity),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: false }, 
        title: { display: true, text: `Humidity Forecast (${predictionPeriod.value} days)` } 
      },
      scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: '%' } } }
    }
  });
}
};

// Main prediction function
const generatePredictions = async () => {
loading.value = true;
error.value = null;

try {
  loadingMessage.value = `Analyzing ${predictionPeriod.value}-day period for Oriental Mindoro...`;
  
  // Run ML analysis with the selected prediction period
  const { predictions: newPredictions, recommendations } = await analyzeCropSeasons(parseInt(predictionPeriod.value));
  
  predictions.value = newPredictions;
  cropRecommendations.value = recommendations;
  
  // Render charts
  nextTick(() => {
    renderSeasonChart();
    renderWeatherCharts();
  });
  
  showStatus('success', `Oriental Mindoro crop season predictions generated for ${predictionPeriod.value} days!`);
  
  // Initialize calendar
  const now = new Date();
  currentCalendarMonth.value = {
    name: now.toLocaleString('default', { month: 'long' }),
    number: now.getMonth() + 1
  };
  currentCalendarYear.value = now.getFullYear();
  generateCalendarDays();
} catch (err) {
  console.error('Error generating predictions:', err);
  error.value = 'Failed to generate predictions. Please check your internet connection and try again.';
} finally {
  loading.value = false;
}
};

// Notification function
const sendNotifications = async () => {
sending.value = true;

try {
  loadingMessage.value = 'Sending notifications to Oriental Mindoro sellers...';
  
  const sellersQuery = query(collection(db, 'users'), where('role', '==', 'seller'));
  const sellersSnapshot = await getDocs(sellersQuery);
  
  const notificationPromises = [];
  
  sellersSnapshot.forEach(sellerDoc => {
    const sellerId = sellerDoc.id;
    
    const notificationData = {
      sellerId: sellerId,
      type: 'crop_season_update',
      title: `Oriental Mindoro Crop Season Update (${predictionPeriod.value} days)`,
      message: `New ${predictionPeriod.value}-day crop season predictions available for Oriental Mindoro. Top recommendations: ${cropRecommendations.value.slice(0, 3).map(c => c.name).join(', ')}. Check your dashboard for detailed insights and optimal planting schedules.`,
      read: false,
      createdAt: Timestamp.now(),
      data: {
        region: 'Oriental Mindoro',
        predictionPeriod: predictionPeriod.value,
        topRecommendations: cropRecommendations.value.slice(0, 5).map(crop => ({
          name: crop.name,
          successRate: crop.successRate,
          season: crop.season,
          weatherSuitability: crop.weatherSuitability,
          plantingDate: crop.plantingDate,
          harvestDate: crop.harvestDate
        })),
        weatherConditions: {
          temperature: currentWeather.value.temperature,
          humidity: currentWeather.value.humidity,
          rainfall: currentWeather.value.rainfall,
          condition: currentWeather.value.condition
        },
        analysisDate: new Date().toISOString(),
        totalCropsAnalyzed: cropRecommendations.value.length
      }
    };
    
    const notificationPromise = addDoc(collection(db, 'notifications'), notificationData);
    notificationPromises.push(notificationPromise);
  });
  
  await Promise.all(notificationPromises);
  
  notificationStats.value.sent = sellersSnapshot.size;
  notificationStats.value.successRate = 98;
  
  recentNotifications.value.unshift({
    id: Date.now(),
    title: `Oriental Mindoro Crop Season Update (${predictionPeriod.value} days)`,
    message: `Notifications sent to ${sellersSnapshot.size} sellers about ${predictionPeriod.value}-day crop season predictions`,
    timestamp: new Date(),
    status: 'delivered'
  });
  
  showStatus('success', `Crop season notifications sent to ${sellersSnapshot.size} Oriental Mindoro sellers successfully!`);
} catch (err) {
  console.error('Error sending notifications:', err);
  showStatus('error', 'Failed to send notifications. Please try again.');
} finally {
  sending.value = false;
}
};

// Export functions
const exportChartData = async () => {
exporting.value = true;

try {
  const csvContent = [
    ['Crop', 'Success Rate (%)', 'Weather Suitability', 'Market Demand', 'Region Suitability', 'Planting Date', 'Harvest Date', 'Prediction Period (Days)'],
    ...cropRecommendations.value.map(crop => [
      crop.name,
      crop.successRate,
      crop.weatherSuitability,
      crop.marketDemand,
      crop.regionSuitability,
      formatDateWithYear(crop.plantingDate),
      formatDateWithYear(crop.harvestDate),
      predictionPeriod.value
    ])
  ].map(row => row.join(',')).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `oriental-mindoro-crop-predictions-${predictionPeriod.value}days-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  
  showStatus('success', `Oriental Mindoro crop data exported successfully for ${predictionPeriod.value} days!`);
} catch (err) {
  showStatus('error', 'Failed to export data.');
} finally {
  exporting.value = false;
}
};

onMounted(async () => {
// Auto-generate initial predictions after a short delay
setTimeout(() => {
  generatePredictions();
}, 1500);
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
  margin-left: 250px;
  overflow-y: auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px 0;
}

.page-title p {
  font-size: 0.95rem;
  color: #6b7280;
  margin: 0;
}

.prediction-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.control-group label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #374151;
}

.period-select {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.85rem;
  background-color: white;
}

.generate-btn,
.notify-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.generate-btn {
  background-color: #2e5c31;
  color: white;
}

.generate-btn:hover:not(:disabled) {
  background-color: #234425;
}

.notify-btn {
  background-color: #059669;
  color: white;
}

.notify-btn:hover:not(:disabled) {
  background-color: #047857;
}

.generate-btn:disabled,
.notify-btn:disabled {
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

.weather-overview {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
  margin-bottom: 24px;
}

.weather-card {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.weather-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.weather-info h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.weather-info p {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0;
}

.weather-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.weather-stat {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #374151;
}

.weather-forecast {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.weather-forecast h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
}

.forecast-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
}

.forecast-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border-radius: 6px;
  background-color: #f9fafb;
}

.forecast-date {
  font-size: 0.75rem;
  color: #6b7280;
}

.forecast-temp {
  font-size: 0.8rem;
  font-weight: 600;
  color: #111827;
}

.forecast-rain {
  font-size: 0.75rem;
  color: #3b82f6;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.spinner-container .spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #2e5c31;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.loading-detail {
  font-size: 0.85rem;
  color: #6b7280;
  margin-top: 8px;
}

.error-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #fee2e2;
  color: #dc2626;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 16px;
}

.retry-btn {
  background-color: #dc2626;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  margin-top: 12px;
}

.retry-btn:hover {
  background-color: #b91c1c;
}

.empty-icon {
  color: #9ca3af;
  margin-bottom: 16px;
}

.prediction-results {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.chart-container,
.recommendations-container,
.weather-analysis,
.notification-management {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-header,
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h2,
.table-header h2,
.weather-analysis h2,
.notification-management h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.export-btn:hover:not(:disabled) {
  background-color: #e5e7eb;
}

.export-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.chart-wrapper {
  height: 300px;
  margin-top: 16px;
}

.table-wrapper {
  overflow-x: auto;
}

.recommendations-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.recommendations-table th,
.recommendations-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.recommendations-table th {
  background-color: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.season-badge,
.suitability-badge,
.demand-badge,
.region-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.season-wet {
  background-color: #dbeafe;
  color: #1d4ed8;
}

.season-dry {
  background-color: #fef3c7;
  color: #d97706;
}

.season-transitional {
  background-color: #e0e7ff;
  color: #6366f1;
}

.season-optimal {
  background-color: #d1fae5;
  color: #059669;
}

.suitability-excellent,
.region-excellent {
  background-color: #d1fae5;
  color: #059669;
}

.suitability-good,
.region-good {
  background-color: #dbeafe;
  color: #2563eb;
}

.suitability-fair,
.region-fair {
  background-color: #fef3c7;
  color: #d97706;
}

.suitability-poor,
.region-poor {
  background-color: #fee2e2;
  color: #dc2626;
}

.demand-high {
  background-color: #d1fae5;
  color: #059669;
}

.demand-medium {
  background-color: #fef3c7;
  color: #d97706;
}

.demand-low {
  background-color: #fee2e2;
  color: #dc2626;
}

.success-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.success-text {
  font-weight: 600;
  font-size: 0.8rem;
}

.success-bar {
  width: 40px;
  height: 4px;
  background-color: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.success-fill {
  height: 100%;
  background-color: #059669;
  transition: width 0.3s ease;
}

.weather-analysis .analysis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.analysis-card {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 16px;
}

.analysis-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.analysis-header h4 {
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.trend-chart {
  height: 120px;
  margin-bottom: 8px;
}

.analysis-summary {
  margin: 8px 0 0 0;
  font-size: 0.85rem;
  color: #6b7280;
  text-align: center;
  font-weight: 500;
}

.notification-management .notification-history h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background-color: #f9fafb;
}

.notification-content h5 {
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.notification-content p {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0 0 4px 0;
}

.notification-date {
  font-size: 0.75rem;
  color: #9ca3af;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
  background-color: #d1fae5;
  color: #059669;
}

.status-message {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 16px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.status-message.success {
  background-color: #d1fae5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.status-message.error {
  background-color: #fee2e2;
  color: #dc2626;
  border: 1px solid #fca5a5;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  width: 80%;
  max-width: 800px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 10px;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-btn {
  background-color: transparent;
  border: none;
  cursor: pointer;
  color: #6b7280;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #374151;
}

.modal-body {
  font-size: 0.9rem;
  color: #374151;
}

.detail-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 15px;
}

.detail-section h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 10px 0;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 5px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.metric {
  text-align: center;
}

.metric-label {
  display: block;
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 4px;
}

.metric-value {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.schedule-info p {
  margin: 5px 0;
}

/* Calendar Styles */
.planting-calendar {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-top: 24px;
}

.planting-calendar h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 20px 0;
}

.calendar-container {
  width: 100%;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;
}

.month-navigation {
  display: flex;
  align-items: center;
  gap: 15px;
}

.month-navigation h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  min-width: 180px;
  text-align: center;
}

.nav-btn {
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn:hover {
  background-color: #e5e7eb;
}

.calendar-legend {
  display: flex;
  gap: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #374151;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.plant {
  background-color: #d1fae5;
  border: 1px solid #059669;
}

.legend-color.harvest {
  background-color: #fef3c7;
  border: 1px solid #d97706;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background-color: #e5e7eb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.calendar-day-header {
  background-color: #f9fafb;
  padding: 12px 8px;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
}

.calendar-day {
  background-color: white;
  min-height: 100px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  position: relative;
}

.calendar-day.other-month {
  background-color: #f9fafb;
  color: #9ca3af;
}

.calendar-day.today {
  background-color: #eff6ff;
  border: 2px solid #3b82f6;
}

.calendar-day.has-activities {
  background-color: #fefce8;
}

.day-number {
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.calendar-day.other-month .day-number {
  color: #9ca3af;
}

.day-activities {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.activity-item {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
}

.activity-item.plant {
  background-color: #d1fae5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.activity-item.harvest {
  background-color: #fef3c7;
  color: #d97706;
  border: 1px solid #fcd34d;
}

.activity-text {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.more-activities {
  font-size: 0.65rem;
  color: #6b7280;
  text-align: center;
  margin-top: 2px;
  font-style: italic;
}

/* View Button Styles */
.view-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.view-btn:hover {
  background-color: #e5e7eb;
}

/* Responsive styles */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding: 15px;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .prediction-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .weather-overview {
    grid-template-columns: 1fr;
  }
  
  .forecast-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .chart-header,
  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .weather-analysis .analysis-grid {
    grid-template-columns: 1fr;
  }
  
  .calendar-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .calendar-legend {
    justify-content: center;
  }
  
  .calendar-day {
    min-height: 80px;
    padding: 4px;
  }
  
  .activity-item {
    font-size: 0.6rem;
    padding: 1px 4px;
  }
}
</style>