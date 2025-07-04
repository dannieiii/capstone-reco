<template>
<div class="harvest-calendar-container">
  <!-- Header Section with Weather Display -->
  <div class="calendar-header">
    <div class="weather-section">
      <div class="current-weather-card">
        <div class="weather-header">
          <div class="weather-icon">
            <component :is="getWeatherIcon(currentWeather?.condition || 'partly-cloudy')" :size="48" />
          </div>
          <div class="weather-info">
            <h3>{{ currentWeather?.description || 'Loading weather...' }}</h3>
            <p>{{ sellerLocation.farmAddress || 'Loading location...' }}</p>
          </div>
        </div>
        <div class="weather-stats">
          <div class="weather-stat">
            <Thermometer :size="16" />
            <span>{{ currentWeather ? Math.round(currentWeather.temp) : '--' }}°C</span>
          </div>
          <div class="weather-stat">
            <CloudRain :size="16" />
            <span>{{ currentWeather?.humidity || '--' }}% Humidity</span>
          </div>
          <div class="weather-stat">
            <Wind :size="16" />
            <span>{{ currentWeather?.windSpeed || '--' }} km/h Wind</span>
          </div>
          <div class="weather-stat">
            <Eye :size="16" />
            <span>{{ currentWeather?.condition || 'Clear' }}</span>
          </div>
        </div>
      </div>
      
      <div class="weather-forecast">
        <h4>7-Day Weather Outlook</h4>
        <div class="forecast-grid">
          <div class="forecast-day" v-for="(day, index) in weatherForecast" :key="index">
            <div class="forecast-date">{{ day.date }}</div>
            <component :is="getWeatherIcon(day.condition)" :size="32" />
            <div class="forecast-temp">{{ day.high }}° / {{ day.low }}°</div>
            <div class="forecast-rain" v-if="day.rain > 0">
              <CloudRain :size="12" />
              {{ day.rain }}%
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="header-actions">
      <div class="location-widget">
        <MapPin :size="16" />
        <span class="location-text">{{ sellerLocation.farmName || 'Loading location...' }}</span>
        <button @click="refreshLocation" class="refresh-location-btn" :disabled="isLoadingLocation">
          <RotateCcw :size="14" />
        </button>
      </div>
      
      <div class="month-navigation">
        <button @click="previousMonth" class="nav-btn" :disabled="isLoading">
          <ChevronLeft :size="20" />
        </button>
        <div class="current-month">
          <span class="month-name">{{ currentMonthName }}</span>
          <span class="year">{{ currentYear }}</span>
        </div>
        <button @click="nextMonth" class="nav-btn" :disabled="isLoading">
          <ChevronRight :size="20" />
        </button>
      </div>
      
      <button @click="openAddModal" class="add-harvest-btn" :disabled="isLoading">
        <Plus :size="18" />
        <span class="btn-text">Add Crop</span>
      </button>
    </div>
    
    <!-- Weather Alert Bar -->
    <div v-if="weatherAlert" class="weather-alert" :class="weatherAlert.type">
      <AlertTriangle :size="16" />
      <span>{{ weatherAlert.message }}</span>
      <button @click="weatherAlert = null" class="alert-close">
        <X :size="14" />
      </button>
    </div>

    <!-- Weather Status Indicator -->
    <div v-if="currentWeather && currentWeather.location && currentWeather.location.includes('Demo')" class="weather-status-info">
      <Info :size="16" />
      <span>Using demo weather data. Set up OpenWeatherMap API key for live weather.</span>
    </div>
  </div>

  <!-- Upcoming Harvest Alerts -->
  <div v-if="upcomingHarvests.length > 0" class="harvest-alerts">
    <div class="alert-header">
      <Bell :size="18" />
      <h3>Upcoming Harvests ({{ upcomingHarvests.length }})</h3>
      <button @click="markAllAlertsRead" class="mark-read-btn">Mark All Read</button>
    </div>
    <div class="alert-list">
      <div v-for="alert in upcomingHarvests" :key="alert.id" class="harvest-alert-item">
        <div class="alert-icon">
          <Calendar :size="16" />
        </div>
        <div class="alert-content">
          <div class="alert-title">{{ alert.name }} ready for harvest</div>
          <div class="alert-subtitle">{{ getDaysUntilHarvest(alert.harvestStartDate) }} • Prepare tools and schedule</div>
        </div>
        <div class="alert-actions">
          <button @click="sendNotificationToSeller(alert)" class="notification-btn" title="Send Notification">
            <Send :size="14" />
          </button>
          <button @click="dismissAlert(alert.id)" class="dismiss-btn" title="Dismiss">
            <X :size="14" />
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- View Toggle -->
  <div class="view-toggle">
    <button 
      @click="activeView = 'calendar'" 
      :class="['view-btn', { active: activeView === 'calendar' }]"
    >
      <Calendar :size="18" />
      Calendar
    </button>
    <button 
      @click="activeView = 'list'" 
      :class="['view-btn', { active: activeView === 'list' }]"
    >
      <List :size="18" />
      Schedule
    </button>
  </div>

  <!-- Loading State -->
  <div v-if="isLoading" class="loading-state">
    <div class="loading-spinner"></div>
    <p>Loading your smart harvest calendar...</p>
  </div>

  <!-- Calendar View -->
  <div v-else-if="activeView === 'calendar'" class="calendar-view">
    <div class="calendar-wrapper">
      <!-- Calendar Header -->
      <div class="calendar-days-header">
        <div v-for="day in daysOfWeek" :key="day" class="day-header">
          {{ day }}
        </div>
      </div>
      
      <!-- Calendar Grid -->
      <div class="calendar-grid">
        <div 
          v-for="(day, index) in calendarDays" 
          :key="index" 
          :class="['calendar-day', { 
            'other-month': !day.isCurrentMonth,
            'today': day.isToday,
            'has-harvest': day.harvests.length > 0,
            'weekend': day.isWeekend
          }]"
          @click="selectDay(day)"
        >
          <div class="day-content">
            <div class="day-number">{{ day.date.getDate() }}</div>
            
            <!-- Weather indicator for current day -->
            <div v-if="day.isToday && currentWeather" class="weather-indicator">
              <span class="temp">{{ Math.round(currentWeather.temp) }}°C</span>
            </div>
            
            <!-- Harvest Indicators -->
            <div v-if="day.harvests.length > 0" class="harvest-indicators">
              <div 
                v-for="(harvest, i) in day.harvests.slice(0, 2)" 
                :key="i" 
                class="harvest-indicator"
                :style="{ backgroundColor: getCategoryColor(harvest.category) }"
                :title="`${harvest.name} - ${harvest.status}`"
              >
                <span class="harvest-name">{{ truncateName(harvest.name) }}</span>
                <AlertTriangle v-if="harvest.delayed" :size="10" class="delay-warning" />
              </div>
              <div v-if="day.harvests.length > 2" class="harvest-more">
                +{{ day.harvests.length - 2 }} more
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- List View -->
  <div v-else class="list-view">
    <div v-if="filteredHarvests.length === 0" class="empty-state">
      <div class="empty-icon">
        <Sprout :size="48" />
      </div>
      <h3>No harvests scheduled</h3>
      <p>Start by adding your first crop to track your harvest schedule</p>
      <button @click="openAddModal" class="add-harvest-btn">
        <Plus :size="18" />
        Add Your First Crop
      </button>
    </div>
    
    <div v-else class="schedule-list">
      <div class="list-filters">
        <div class="filter-tabs">
          <button 
            v-for="filter in statusFilters" 
            :key="filter.value"
            @click="selectedFilter = filter.value"
            :class="['filter-tab', { active: selectedFilter === filter.value }]"
          >
            {{ filter.label }}
            <span class="filter-count">{{ getFilterCount(filter.value) }}</span>
          </button>
        </div>
      </div>

      <div class="harvest-groups">
        <div v-for="(group, month) in groupedHarvests" :key="month" class="harvest-month-group">
          <div class="month-header">
            <h3>{{ month }}</h3>
            <span class="month-count">{{ group.length }} crops</span>
          </div>
          
          <div class="harvest-items">
            <div 
              v-for="harvest in group" 
              :key="harvest.id" 
              class="harvest-item"
              :class="[getStatusClass(harvest.status), { 'weather-delayed': harvest.delayed }]"
            >
              <div class="harvest-timeline">
                <div class="timeline-date">
                  <div class="date-number">{{ formatDay(harvest.harvestStartDate) }}</div>
                  <div class="date-month">{{ formatShortMonth(harvest.harvestStartDate) }}</div>
                </div>
                <div class="timeline-line"></div>
              </div>
              
              <div class="harvest-details">
                <div class="harvest-header">
                  <div class="crop-badge" :style="{ backgroundColor: getCategoryColor(harvest.category) }">
                    {{ harvest.category }}
                  </div>
                  <div class="harvest-status-badge">{{ harvest.status }}</div>
                  <div v-if="harvest.delayed" class="delay-badge">
                    <AlertTriangle :size="12" />
                    Delayed
                  </div>
                </div>
                
                <h4 class="harvest-name">{{ harvest.name }}</h4>
                
                <div class="harvest-info">
                  <div class="info-item">
                    <Sprout :size="14" />
                    <span>Planted: {{ formatDate(harvest.plantingDate) }}</span>
                  </div>
                  <div class="info-item">
                    <CalendarDays :size="14" />
                    <span>Harvest: {{ formatDate(harvest.harvestStartDate) }} - {{ formatDate(harvest.harvestEndDate) }}</span>
                  </div>
                  <div class="info-item">
                    <Clock :size="14" />
                    <span>{{ getDaysUntilHarvest(harvest.harvestStartDate) }}</span>
                  </div>
                  <div v-if="harvest.smartEstimate" class="info-item">
                    <Brain :size="14" />
                    <span>AI Estimate: {{ harvest.smartEstimate.confidence }}% confidence</span>
                  </div>
                </div>
                
                <div v-if="harvest.weatherAdjustment" class="weather-adjustment">
                  <CloudRain :size="14" />
                  <span>{{ harvest.weatherAdjustment }}</span>
                </div>
                
                <div v-if="harvest.notes" class="harvest-notes">
                  <MessageSquare :size="14" />
                  <span>{{ harvest.notes }}</span>
                </div>
              </div>
              
              <div class="harvest-actions">
                <button @click="editHarvest(harvest)" class="action-btn edit-btn" title="Edit">
                  <Edit2 :size="16" />
                </button>
                <button @click="deleteHarvest(harvest.id)" class="action-btn delete-btn" title="Delete">
                  <Trash2 :size="16" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Add/Edit Harvest Modal -->
  <div v-if="showHarvestModal" class="modal-overlay" @click="closeHarvestModal">
    <div class="harvest-modal" @click.stop>
      <div class="modal-header">
        <h3>{{ editingHarvest ? 'Edit Crop Schedule' : 'Smart Crop Planner' }}</h3>
        <button @click="closeHarvestModal" class="close-btn">
          <X :size="20" />
        </button>
      </div>
      
      <div class="modal-content">
        <form @submit.prevent="saveHarvest" class="harvest-form">
          <!-- Crop Selection -->
          <div class="form-section">
            <h4>Crop Information</h4>
            <div class="form-group">
              <label for="cropSelect">Select Crop *</label>
              <select 
                id="cropSelect" 
                v-model="harvestForm.cropId"
                @change="onCropSelect"
                required
                :disabled="isSubmitting"
              >
                <option value="">Choose a crop...</option>
                <optgroup 
                  v-for="category in groupedCrops" 
                  :key="category.name" 
                  :label="category.name"
                >
                  <option 
                    v-for="crop in category.crops" 
                    :key="crop.id" 
                    :value="crop.id"
                  >
                    {{ crop.name }} ({{ crop.daysToHarvest || crop.harvestTime }} days)
                  </option>
                </optgroup>
              </select>
            </div>
          </div>

          <!-- Planting Information -->
          <div class="form-section">
            <h4>Planting Schedule</h4>
            <div class="form-group">
              <label for="plantingDate">Planting Date *</label>
              <input 
                type="date" 
                id="plantingDate" 
                v-model="harvestForm.plantingDate"
                @change="updateSmartHarvestDates"
                required
                :disabled="isSubmitting"
              />
            </div>
          </div>

          <!-- Smart Harvest Estimation -->
          <div v-if="harvestForm.cropId && smartEstimation" class="form-section">
            <h4>Smart Harvest Estimation</h4>
            <div class="smart-estimation-card">
              <div class="estimation-header">
                <Brain :size="18" />
                <span>AI-Powered Prediction</span>
                <div class="confidence-badge">{{ smartEstimation.confidence }}% Confidence</div>
              </div>
              <div class="estimation-details">
                <div class="detail-row">
                  <span>Base Growth Period:</span>
                  <span>{{ smartEstimation.baseDays }} days</span>
                </div>
                <div class="detail-row">
                  <span>Weather Adjustment:</span>
                  <span :class="{ 'positive': smartEstimation.weatherAdjustment >= 0, 'negative': smartEstimation.weatherAdjustment < 0 }">
                    {{ smartEstimation.weatherAdjustment >= 0 ? '+' : '' }}{{ smartEstimation.weatherAdjustment }} days
                  </span>
                </div>
                <div class="detail-row">
                  <span>Final Estimate:</span>
                  <span class="final-estimate">{{ smartEstimation.finalDays }} days</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Weather Impact Display -->
          <div v-if="currentWeather && harvestForm.cropId" class="form-section">
            <h4>Current Growing Conditions</h4>
            <div class="weather-conditions">
              <div class="weather-item">
                <Thermometer :size="16" />
                <span>{{ Math.round(currentWeather.temp) }}°C</span>
                <span class="weather-status" :class="getTemperatureStatus(currentWeather.temp)">
                  {{ getTemperatureLabel(currentWeather.temp) }}
                </span>
              </div>
              <div class="weather-item">
                <CloudRain :size="16" />
                <span>{{ currentWeather.humidity }}% humidity</span>
              </div>
              <div class="weather-item">
                <Eye :size="16" />
                <span>{{ currentWeather.description }}</span>
              </div>
            </div>
          </div>

          <!-- Harvest Information -->
          <div class="form-section">
            <h4>Harvest Schedule</h4>
            <div class="estimated-info" v-if="harvestForm.cropId && estimatedDays">
              <Info :size="16" />
              <span>Smart estimate: {{ estimatedDays }} days from planting to harvest</span>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="harvestStartDate">Harvest Start Date *</label>
                <input 
                  type="date" 
                  id="harvestStartDate" 
                  v-model="harvestForm.harvestStartDate"
                  required
                  :disabled="isSubmitting"
                />
              </div>
              
              <div class="form-group">
                <label for="harvestEndDate">Harvest End Date *</label>
                <input 
                  type="date" 
                  id="harvestEndDate" 
                  v-model="harvestForm.harvestEndDate"
                  required
                  :disabled="isSubmitting"
                />
              </div>
            </div>
          </div>

          <!-- Additional Information -->
          <div class="form-section">
            <h4>Additional Details</h4>
            <div class="form-group">
              <label for="status">Current Status</label>
              <select 
                id="status" 
                v-model="harvestForm.status" 
                required
                :disabled="isSubmitting"
              >
                <option value="planned">Planned</option>
                <option value="planted">Planted</option>
                <option value="growing">Growing</option>
                <option value="ready">Ready to Harvest</option>
                <option value="harvested">Harvested</option>
                <option value="sold">Sold</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="notes">Notes (Optional)</label>
              <textarea 
                id="notes" 
                v-model="harvestForm.notes" 
                placeholder="Add any notes about this crop, variety, expected yield, etc."
                rows="3"
                :disabled="isSubmitting"
              ></textarea>
            </div>

            <!-- Notification Settings -->
            <div class="form-group">
              <div class="checkbox-group">
                <input 
                  type="checkbox" 
                  id="enableNotifications" 
                  v-model="harvestForm.enableNotifications"
                />
                <label for="enableNotifications">Enable harvest notifications</label>
              </div>
              <div v-if="harvestForm.enableNotifications" class="notification-options">
                <label for="notificationDays">Notify me</label>
                <select id="notificationDays" v-model="harvestForm.notificationDays">
                  <option value="1">1 day before</option>
                  <option value="3">3 days before</option>
                  <option value="7">7 days before</option>
                  <option value="14">14 days before</option>
                </select>
                <span>harvest date</span>
              </div>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeHarvestModal" class="cancel-btn" :disabled="isSubmitting">
              Cancel
            </button>
            <button type="submit" class="save-btn" :disabled="isSubmitting">
              <span v-if="isSubmitting">Saving...</span>
              <span v-else>{{ editingHarvest ? 'Update Schedule' : 'Add to Calendar' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Day Detail Modal -->
  <div v-if="selectedDay && showDayModal" class="modal-overlay" @click="closeDayModal">
    <div class="day-modal" @click.stop>
      <div class="modal-header">
        <h3>{{ formatFullDate(selectedDay.date) }}</h3>
        <button @click="closeDayModal" class="close-btn">
          <X :size="20" />
        </button>
      </div>
      
      <div class="modal-content">
        <div v-if="selectedDay.harvests.length === 0" class="empty-day">
          <CalendarPlus :size="32" />
          <p>No harvests scheduled for this day</p>
          <button @click="addHarvestForDay(selectedDay)" class="add-harvest-btn">
            <Plus :size="16" />
            Add Crop for This Day
          </button>
        </div>
        
        <div v-else class="day-harvests">
          <div class="day-harvests-header">
            <h4>Scheduled Harvests ({{ selectedDay.harvests.length }})</h4>
            <button @click="addHarvestForDay(selectedDay)" class="add-small-btn">
              <Plus :size="14" />
            </button>
          </div>
          
          <div class="day-harvest-list">
            <div 
              v-for="harvest in selectedDay.harvests" 
              :key="harvest.id" 
              class="day-harvest-item"
            >
              <div class="crop-badge" :style="{ backgroundColor: getCategoryColor(harvest.category) }">
                {{ harvest.category }}
              </div>
              <div class="day-harvest-info">
                <h5>{{ harvest.name }}</h5>
                <div class="harvest-period">
                  {{ formatDate(harvest.harvestStartDate) }} - {{ formatDate(harvest.harvestEndDate) }}
                </div>
                <div class="harvest-status-badge">{{ harvest.status }}</div>
              </div>
              <div class="day-harvest-actions">
                <button @click="editHarvest(harvest)" class="action-btn edit-btn">
                  <Edit2 :size="14" />
                </button>
                <button @click="deleteHarvest(harvest.id)" class="action-btn delete-btn">
                  <Trash2 :size="14" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  List, 
  Sprout,
  CalendarDays,
  Clock,
  Edit2, 
  Trash2, 
  X,
  CalendarPlus,
  MessageSquare,
  Info,
  MapPin,
  AlertTriangle,
  Bell,
  Send,
  Brain,
  CloudRain,
  Thermometer,
  Eye,
  RotateCcw,
  Sun,
  Cloud,
  CloudSun,
  Wind
} from 'lucide-vue-next'
import { getAuth } from 'firebase/auth'
import { db } from '@/firebase/firebaseConfig'
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  addDoc,
  serverTimestamp,
  getDoc,
  setDoc  // Add this import
} from 'firebase/firestore'

// Enhanced environment variable handling
const WEATHER_API_KEY = process.env.VUE_APP_WEATHER_API_KEY || process.env.VITE_WEATHER_API_KEY || ''

console.log('Weather API Configuration:', {
  nodeEnv: process.env.NODE_ENV,
  hasApiKey: !!WEATHER_API_KEY,
  keyLength: WEATHER_API_KEY.length,
  keyPreview: WEATHER_API_KEY ? WEATHER_API_KEY.substring(0, 8) + '...' : 'Not found'
})

// State variables
const isLoading = ref(true)
const isSubmitting = ref(false)
const isLoadingLocation = ref(false)
const harvests = ref([])
const availableCrops = ref([])
const currentDate = ref(new Date())
const activeView = ref('calendar')
const selectedDay = ref(null)
const showDayModal = ref(false)
const showHarvestModal = ref(false)
const editingHarvest = ref(null)
const selectedFilter = ref('all')
const currentWeather = ref(null)
const weatherAlert = ref(null)
const smartEstimation = ref(null)
const upcomingHarvests = ref([])
const sellerLocation = ref({})
const currentSellerId = ref('')

// Weather forecast data
const weatherForecast = ref([
  { date: 'Jan 5', condition: 'sunny', high: 29, low: 22, rain: 0 },
  { date: 'Jan 6', condition: 'partly-cloudy', high: 31, low: 24, rain: 10 },
  { date: 'Jan 7', condition: 'cloudy', high: 28, low: 21, rain: 30 },
  { date: 'Jan 8', condition: 'rainy', high: 26, low: 19, rain: 80 },
  { date: 'Jan 9', condition: 'partly-cloudy', high: 30, low: 23, rain: 20 },
  { date: 'Jan 10', condition: 'sunny', high: 32, low: 25, rain: 0 },
  { date: 'Jan 11', condition: 'sunny', high: 33, low: 26, rain: 5 }
])

// Oriental Mindoro coordinates (Calapan City as default)
const ORIENTAL_MINDORO_COORDS = {
  lat: 13.4119,
  lng: 121.1803,
  name: 'Calapan City, Oriental Mindoro'
}

// Enhanced crop database with growing conditions
const enhancedCropDatabase = [
  { 
    id: '1', 
    name: 'Rice', 
    category: 'Grains', 
    daysToHarvest: 120, 
    harvestWindow: 14,
    optimalTemp: { min: 22, max: 32 },
    optimalHumidity: { min: 70, max: 85 }
  },
  { 
    id: '2', 
    name: 'Corn', 
    category: 'Grains', 
    daysToHarvest: 90, 
    harvestWindow: 10,
    optimalTemp: { min: 18, max: 27 },
    optimalHumidity: { min: 60, max: 75 }
  },
  { 
    id: '3', 
    name: 'Tomato', 
    category: 'Vegetables', 
    daysToHarvest: 75, 
    harvestWindow: 21,
    optimalTemp: { min: 18, max: 25 },
    optimalHumidity: { min: 65, max: 75 }
  },
  { 
    id: '4', 
    name: 'Eggplant', 
    category: 'Vegetables', 
    daysToHarvest: 80, 
    harvestWindow: 30,
    optimalTemp: { min: 21, max: 30 },
    optimalHumidity: { min: 60, max: 70 }
  },
  { 
    id: '5', 
    name: 'Banana', 
    category: 'Fruits', 
    daysToHarvest: 365, 
    harvestWindow: 60,
    optimalTemp: { min: 26, max: 30 },
    optimalHumidity: { min: 75, max: 85 }
  },
  { 
    id: '6', 
    name: 'Mango', 
    category: 'Fruits', 
    daysToHarvest: 365, 
    harvestWindow: 90,
    optimalTemp: { min: 24, max: 30 },
    optimalHumidity: { min: 60, max: 70 }
  },
  { 
    id: '7', 
    name: 'Sweet Potato', 
    category: 'Vegetables', 
    daysToHarvest: 100, 
    harvestWindow: 14,
    optimalTemp: { min: 20, max: 30 },
    optimalHumidity: { min: 65, max: 80 }
  }
]

// Calendar data
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const statusFilters = [
  { label: 'All', value: 'all' },
  { label: 'Planned', value: 'planned' },
  { label: 'Growing', value: 'growing' },
  { label: 'Ready', value: 'ready' },
  { label: 'Harvested', value: 'harvested' }
]

// Form data
const harvestForm = ref({
  cropId: '',
  name: '',
  category: '',
  plantingDate: '',
  harvestStartDate: '',
  harvestEndDate: '',
  status: 'planned',
  notes: '',
  enableNotifications: true,
  notificationDays: '7'
})

// Computed properties
const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth())
const currentMonthName = computed(() => {
  return new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentDate.value)
})

const estimatedDays = computed(() => {
  if (!smartEstimation.value) return null
  return smartEstimation.value.finalDays
})

const groupedCrops = computed(() => {
  const groups = {}
  availableCrops.value.forEach(crop => {
    if (!groups[crop.category]) {
      groups[crop.category] = []
    }
    groups[crop.category].push(crop)
  })

  return Object.keys(groups).map(category => ({
    name: category,
    crops: groups[category].sort((a, b) => a.name.localeCompare(b.name))
  }))
})

const filteredHarvests = computed(() => {
  if (selectedFilter.value === 'all') {
    return harvests.value
  }
  return harvests.value.filter(harvest => harvest.status === selectedFilter.value)
})

const groupedHarvests = computed(() => {
  const groups = {}

  filteredHarvests.value
    .filter(harvest => harvest.harvestStartDate >= new Date())
    .sort((a, b) => a.harvestStartDate - b.harvestStartDate)
    .forEach(harvest => {
      const monthYear = new Intl.DateTimeFormat('en-US', { 
        month: 'long', 
        year: 'numeric' 
      }).format(harvest.harvestStartDate)
      
      if (!groups[monthYear]) {
        groups[monthYear] = []
      }
      
      groups[monthYear].push(harvest)
    })

  return groups
})

// Calendar days computation
const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const firstDayOfWeek = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const days = []

  // Previous month days
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i)
    days.push(createCalendarDay(date, false))
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i)
    days.push(createCalendarDay(date, true))
  }

  // Next month days
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i)
    days.push(createCalendarDay(date, false))
  }

  return days
})

// Weather icon helper function
const getWeatherIcon = (condition) => {
  const iconMap = {
    'sunny': Sun,
    'clear': Sun,
    'partly-cloudy': CloudSun,
    'cloudy': Cloud,
    'overcast': Cloud,
    'rainy': CloudRain,
    'rain': CloudRain
  }
  return iconMap[condition] || CloudSun
}

// Enhanced Weather API Functions
const fetchWeatherData = async (lat, lon) => {
  // Validate API key first
  if (!WEATHER_API_KEY || WEATHER_API_KEY.trim() === '' || WEATHER_API_KEY === 'demo_mode') {
    console.warn('Weather API key not configured. Using demo weather data.')
    setDemoWeatherData()
    return
  }

  console.log('Fetching weather data for coordinates:', { lat, lon })

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
    )
    
    if (!response.ok) {
      if (response.status === 401) {
        console.error('Weather API: Invalid API key')
        throw new Error('Invalid or inactive API key')
      } else if (response.status === 429) {
        console.error('Weather API: Rate limit exceeded')
        throw new Error('API rate limit exceeded')
      } else {
        console.error(`Weather API: HTTP ${response.status}`)
        throw new Error(`Weather API request failed: ${response.status}`)
      }
    }
    
    const data = await response.json()
    
    currentWeather.value = {
      temp: data.main.temp,
      humidity: data.main.humidity,
      description: data.weather[0].description,
      windSpeed: data.wind?.speed || 0,
      location: data.name || 'Unknown Location',
      condition: mapWeatherCondition(data.weather[0].main)
    }
    
    console.log('Weather data fetched successfully:', currentWeather.value)
  } catch (error) {
    console.error('Error fetching weather data:', error)
    
    // Enhanced fallback with location-specific mock data
    const locationName = lat === ORIENTAL_MINDORO_COORDS.lat ? 'Oriental Mindoro' : 'Philippines'
    
    setDemoWeatherData(locationName, error.message)
    
    // Show user-friendly message for specific errors
    if (error.message.includes('Invalid or inactive API key')) {
      console.warn('Weather API key issue. Please check your OpenWeatherMap API key configuration.')
    } else if (error.message.includes('rate limit')) {
      console.warn('Weather API rate limit reached. Using demo data temporarily.')
    }
  }
}

const setDemoWeatherData = (locationName = 'Oriental Mindoro', errorReason = 'API key not configured') => {
  // Generate realistic weather data for Oriental Mindoro climate
  const baseTemp = 28 // Typical temperature for Oriental Mindoro
  const baseHumidity = 75 // Typical humidity

  currentWeather.value = {
    temp: Math.round(baseTemp + (Math.random() - 0.5) * 4), // 26-30°C range
    humidity: Math.round(baseHumidity + (Math.random() - 0.5) * 10), // 70-80% range
    description: getRandomWeatherDescription(),
    windSpeed: Math.round(5 + Math.random() * 10), // 5-15 km/h
    location: `${locationName} (Demo - ${errorReason})`,
    condition: 'partly-cloudy'
  }
}

const getRandomWeatherDescription = () => {
  const descriptions = [
    'partly cloudy',
    'sunny',
    'light rain',
    'overcast',
    'scattered clouds',
    'clear sky'
  ]
  return descriptions[Math.floor(Math.random() * descriptions.length)]
}

const mapWeatherCondition = (condition) => {
  const conditionMap = {
    'Clear': 'clear',
    'Clouds': 'clouds',
    'Rain': 'rain',
    'Drizzle': 'rain',
    'Thunderstorm': 'rain',
    'Snow': 'snow',
    'Mist': 'clouds',
    'Fog': 'clouds'
  }
  return conditionMap[condition] || 'partly-cloudy'
}

// Firebase and Location Methods
const fetchSellerLocation = async () => {
  isLoadingLocation.value = true
  try {
    const auth = getAuth()
    const currentUser = auth.currentUser
    
    if (!currentUser) {
      console.error('No authenticated user found')
      sellerLocation.value = {
        farmName: 'Please log in',
        farmAddress: 'Authentication required',
        personalInfo: {},
        farmDetails: {},
        coordinates: null
      }
      // Still provide weather data for demo
      await fetchWeatherData(ORIENTAL_MINDORO_COORDS.lat, ORIENTAL_MINDORO_COORDS.lng)
      return
    }

    currentSellerId.value = currentUser.uid
    console.log('Fetching seller data for user ID:', currentUser.uid)
    
    // Fetch seller details from Firebase
    const sellerDoc = await getDoc(doc(db, 'sellers', currentUser.uid))
    
    if (sellerDoc.exists()) {
      const sellerData = sellerDoc.data()
      console.log('Seller document found:', sellerData)
      
      sellerLocation.value = {
        farmName: sellerData.farmDetails?.farmName || 
                 (sellerData.personalInfo?.firstName ? `${sellerData.personalInfo.firstName}'s Farm` : 'My Farm'),
        farmAddress: sellerData.farmDetails?.farmAddress || 
                     sellerData.personalInfo?.address || 
                     'Oriental Mindoro, Philippines',
        personalInfo: sellerData.personalInfo || {},
        farmDetails: sellerData.farmDetails || {},
        paymentInfo: sellerData.paymentInfo || {},
        deliveryInfo: sellerData.deliveryInfo || {},
        additionalDetails: sellerData.additionalDetails || {},
        termsAgreement: sellerData.termsAgreement || {},
        documents: sellerData.documents || {},
        status: sellerData.status || 'Active',
        isVerified: sellerData.isVerified || false,
        isOnline: sellerData.farmDetails?.isOnline || false,
        userId: currentUser.uid,
        coordinates: sellerData.coordinates || null,
        createdAt: sellerData.createdAt
      }

      console.log('Seller location data loaded:', {
        farmName: sellerLocation.value.farmName,
        farmAddress: sellerLocation.value.farmAddress,
        hasCoordinates: !!sellerLocation.value.coordinates
      })
      
      // Determine coordinates for weather data
      let weatherLat = ORIENTAL_MINDORO_COORDS.lat
      let weatherLng = ORIENTAL_MINDORO_COORDS.lng
      
      if (sellerLocation.value.coordinates) {
        weatherLat = sellerLocation.value.coordinates.lat
        weatherLng = sellerLocation.value.coordinates.lng
        console.log('Using stored coordinates for weather:', { weatherLat, weatherLng })
      } else if (sellerLocation.value.farmAddress && 
                 sellerLocation.value.farmAddress !== 'Oriental Mindoro, Philippines' &&
                 sellerLocation.value.farmAddress.trim() !== '') {
        console.log('Geocoding farm address for weather:', sellerLocation.value.farmAddress)
        // Try to geocode the address
        await geocodeAndFetchWeather(sellerLocation.value.farmAddress)
        return // geocodeAndFetchWeather will handle the weather fetch
      }
      
      // Fetch weather data with determined coordinates
      await fetchWeatherData(weatherLat, weatherLng)
      
      // Update seller document with coordinates if not present
      if (!sellerLocation.value.coordinates) {
        try {
          await updateDoc(doc(db, 'sellers', currentUser.uid), {
            coordinates: { lat: weatherLat, lng: weatherLng },
            updatedAt: serverTimestamp()
          })
          console.log('Saved default coordinates to seller profile')
        } catch (updateError) {
          console.warn('Could not update seller coordinates:', updateError)
        }
      }
    } else {
      console.warn('Seller document not found for user:', currentUser.uid)
      console.log('Creating default seller profile...')
      
      // Create a basic seller document for users who don't have one yet
      const defaultSellerData = {
        personalInfo: {
          email: currentUser.email || '',
          firstName: currentUser.displayName?.split(' ')[0] || 'User',
          lastName: currentUser.displayName?.split(' ')[1] || '',
          address: 'Oriental Mindoro, Philippines'
        },
        farmDetails: {
          farmName: (currentUser.displayName || 'User') + "'s Farm",
          farmAddress: 'Oriental Mindoro, Philippines',
          isOnline: false
        },
        paymentInfo: {},
        deliveryInfo: {},
        additionalDetails: {},
        termsAgreement: {},
        documents: {},
        status: 'Active',
        isVerified: false,
        coordinates: ORIENTAL_MINDORO_COORDS,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      
      try {
        // Create the seller document
        await setDoc(doc(db, 'sellers', currentUser.uid), defaultSellerData)
        console.log('Created default seller document')
        
        // Set the location data
        sellerLocation.value = {
          farmName: defaultSellerData.farmDetails.farmName,
          farmAddress: defaultSellerData.farmDetails.farmAddress,
          personalInfo: defaultSellerData.personalInfo,
          farmDetails: defaultSellerData.farmDetails,
          paymentInfo: defaultSellerData.paymentInfo,
          deliveryInfo: defaultSellerData.deliveryInfo,
          additionalDetails: defaultSellerData.additionalDetails,
          termsAgreement: defaultSellerData.termsAgreement,
          documents: defaultSellerData.documents,
          status: defaultSellerData.status,
          isVerified: defaultSellerData.isVerified,
          isOnline: defaultSellerData.farmDetails.isOnline,
          userId: currentUser.uid,
          coordinates: defaultSellerData.coordinates,
          createdAt: defaultSellerData.createdAt
        }
      } catch (createError) {
        console.error('Error creating seller document:', createError)
        
        // Fallback to basic location data
        sellerLocation.value = {
          farmName: (currentUser.displayName || 'User') + "'s Farm",
          farmAddress: 'Oriental Mindoro, Philippines',
          personalInfo: {
            email: currentUser.email || '',
            firstName: currentUser.displayName?.split(' ')[0] || 'User',
            lastName: currentUser.displayName?.split(' ')[1] || ''
          },
          farmDetails: {
            farmName: (currentUser.displayName || 'User') + "'s Farm",
            farmAddress: 'Oriental Mindoro, Philippines'
          },
          coordinates: ORIENTAL_MINDORO_COORDS
        }
      }
      
      // Use Oriental Mindoro coordinates for new users
      await fetchWeatherData(ORIENTAL_MINDORO_COORDS.lat, ORIENTAL_MINDORO_COORDS.lng)
    }
  } catch (error) {
    console.error('Error fetching seller location:', error)
    
    // Fallback location data
    sellerLocation.value = {
      farmName: 'FarmXpress User',
      farmAddress: 'Oriental Mindoro, Philippines',
      personalInfo: {},
      farmDetails: {},
      coordinates: ORIENTAL_MINDORO_COORDS
    }
    
    // Always provide weather data, even on error
    await fetchWeatherData(ORIENTAL_MINDORO_COORDS.lat, ORIENTAL_MINDORO_COORDS.lng)
  } finally {
    isLoadingLocation.value = false
  }
}

const refreshLocation = async () => {
  console.log('Refreshing location and weather data...')
  await fetchSellerLocation()
}

// Weather and Smart Estimation Methods
const calculateSmartEstimation = (cropId, plantingDate) => {
  if (!cropId || !plantingDate || !currentWeather.value) return null

  const crop = availableCrops.value.find(c => c.id === cropId)
  if (!crop) return null

  const baseDays = crop.daysToHarvest
  let weatherAdjustment = 0
  let confidence = 85

  // Temperature-based adjustments
  const avgTemp = currentWeather.value.temp
  if (avgTemp < crop.optimalTemp.min) {
    const tempDiff = crop.optimalTemp.min - avgTemp
    weatherAdjustment += Math.floor(tempDiff * 0.5)
    confidence -= Math.floor(tempDiff * 2)
  } else if (avgTemp > crop.optimalTemp.max) {
    const tempDiff = avgTemp - crop.optimalTemp.max
    weatherAdjustment += Math.floor(tempDiff * 0.3)
    confidence -= Math.floor(tempDiff * 1.5)
  }

  // Humidity-based adjustments
  const humidity = currentWeather.value.humidity
  if (humidity < crop.optimalHumidity.min) {
    weatherAdjustment += 2
    confidence -= 5
  } else if (humidity > crop.optimalHumidity.max) {
    weatherAdjustment += 1
    confidence -= 3
  }

  confidence = Math.max(confidence, 60)

  return {
    baseDays,
    weatherAdjustment,
    finalDays: baseDays + weatherAdjustment,
    confidence
  }
}

const updateSmartHarvestDates = () => {
  if (!harvestForm.value.cropId || !harvestForm.value.plantingDate) return

  smartEstimation.value = calculateSmartEstimation(
    harvestForm.value.cropId, 
    harvestForm.value.plantingDate
  )

  if (smartEstimation.value) {
    const plantingDate = new Date(harvestForm.value.plantingDate)
    
    const harvestStartDate = new Date(plantingDate)
    harvestStartDate.setDate(plantingDate.getDate() + smartEstimation.value.finalDays)
    
    const selectedCrop = availableCrops.value.find(crop => crop.id === harvestForm.value.cropId)
    const harvestEndDate = new Date(harvestStartDate)
    harvestEndDate.setDate(harvestStartDate.getDate() + (selectedCrop?.harvestWindow || 14))
    
    harvestForm.value.harvestStartDate = formatDateForInput(harvestStartDate)
    harvestForm.value.harvestEndDate = formatDateForInput(harvestEndDate)
    
    // Generate weather alert if significant adjustment
    if (Math.abs(smartEstimation.value.weatherAdjustment) >= 3) {
      const delayType = smartEstimation.value.weatherAdjustment > 0 ? 'delayed' : 'accelerated'
      const days = Math.abs(smartEstimation.value.weatherAdjustment)
      
      weatherAlert.value = {
        type: 'warning',
        message: `Current weather conditions may cause harvest to be ${delayType} by ${days} days`
      }
    }
  }
}

const getTemperatureStatus = (temp) => {
  if (temp < 20) return 'cold'
  if (temp > 30) return 'hot'
  return 'optimal'
}

const getTemperatureLabel = (temp) => {
  if (temp < 20) return 'Below optimal'
  if (temp > 30) return 'Above optimal'
  return 'Optimal'
}

// Notification and Alert Methods
const checkUpcomingHarvests = () => {
  const today = new Date()
  const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

  upcomingHarvests.value = harvests.value.filter(harvest => {
    const harvestDate = new Date(harvest.harvestStartDate)
    return harvestDate >= today && harvestDate <= weekFromNow && harvest.enableNotifications
  })
}

const sendNotificationToSeller = async (alert) => {
  try {
    // Create notification in Firebase
    const notificationData = {
      sellerId: currentSellerId.value,
      type: 'harvest_reminder',
      title: `Harvest Alert: ${alert.name}`,
      message: `Your ${alert.name} is ready for harvest. ${getDaysUntilHarvest(alert.harvestStartDate)}. Prepare your tools and schedule the harvest.`,
      harvestId: alert.id,
      productName: alert.name,
      category: alert.category,
      harvestDate: alert.harvestStartDate,
      read: false,
      createdAt: serverTimestamp()
    }
    
    await addDoc(collection(db, 'notifications'), notificationData)
    
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Harvest Alert: ${alert.name}`, {
        body: `${alert.name} is ready for harvest. Prepare your tools and schedule.`,
        icon: '/harvest-icon.png'
      })
    }
    
    console.log(`Notification sent for ${alert.name}`)
    alert(`Harvest notification sent for ${alert.name}`)
  } catch (error) {
    console.error('Error sending notification:', error)
    alert('Failed to send notification. Please try again.')
  }
}

const dismissAlert = (harvestId) => {
  upcomingHarvests.value = upcomingHarvests.value.filter(h => h.id !== harvestId)
}

const markAllAlertsRead = () => {
  upcomingHarvests.value = []
}

// Request notification permission
const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission()
  }
}

// Firebase Harvest Management
const setupHarvestListener = async () => {
  try {
    const auth = getAuth()
    const currentUser = auth.currentUser
    
    if (!currentUser) {
      console.error('No authenticated user found')
      return
    }

    // Simple query without orderBy to avoid index requirement
    const harvestQuery = query(
      collection(db, 'harvests'),
      where('sellerId', '==', currentUser.uid)
    )

    const unsubscribe = onSnapshot(harvestQuery, (snapshot) => {
      const harvestData = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          plantingDate: data.plantingDate?.toDate() || new Date(data.plantingDate),
          harvestStartDate: data.harvestStartDate?.toDate() || new Date(data.harvestStartDate),
          harvestEndDate: data.harvestEndDate?.toDate() || new Date(data.harvestEndDate)
        }
      })
      
      // Sort on client side instead of using orderBy in query
      harvests.value = harvestData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0)
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0)
        return dateB - dateA
      })
      
      checkUpcomingHarvests()
      console.log(`Loaded ${harvests.value.length} harvests`)
    }, (error) => {
      console.error('Error in harvest listener:', error)
      // Fallback to empty array on error
      harvests.value = []
    })

    return unsubscribe
  } catch (error) {
    console.error('Error setting up harvest listener:', error)
    harvests.value = []
  }
}

// Existing methods (keeping all original functionality)
const createCalendarDay = (date, isCurrentMonth) => {
  const today = new Date()
  return {
    date,
    isCurrentMonth,
    isToday: isSameDay(date, today),
    isWeekend: date.getDay() === 0 || date.getDay() === 6,
    harvests: getHarvestsForDay(date)
  }
}

const getHarvestsForDay = (date) => {
  return harvests.value.filter(harvest => {
    return date >= harvest.harvestStartDate && date <= harvest.harvestEndDate
  })
}

const isSameDay = (date1, date2) => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate()
}

const previousMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
}

const selectDay = (day) => {
  selectedDay.value = day
  showDayModal.value = true
}

const closeDayModal = () => {
  showDayModal.value = false
  selectedDay.value = null
}

const openAddModal = () => {
  resetForm()
  showHarvestModal.value = true
}

const closeHarvestModal = () => {
  showHarvestModal.value = false
  editingHarvest.value = null
  smartEstimation.value = null
  weatherAlert.value = null
  resetForm()
}

const addHarvestForDay = (day) => {
  const plantingDate = new Date(day.date)
  plantingDate.setDate(plantingDate.getDate() - 90)

  harvestForm.value = {
    cropId: '',
    name: '',
    category: '',
    plantingDate: formatDateForInput(plantingDate),
    harvestStartDate: formatDateForInput(day.date),
    harvestEndDate: formatDateForInput(day.date),
    status: 'planned',
    notes: '',
    enableNotifications: true,
    notificationDays: '7'
  }

  showDayModal.value = false
  showHarvestModal.value = true
}

const editHarvest = (harvest) => {
  editingHarvest.value = harvest

  harvestForm.value = {
    cropId: harvest.cropId || '',
    name: harvest.name,
    category: harvest.category,
    plantingDate: formatDateForInput(harvest.plantingDate),
    harvestStartDate: formatDateForInput(harvest.harvestStartDate),
    harvestEndDate: formatDateForInput(harvest.harvestEndDate),
    status: harvest.status,
    notes: harvest.notes || '',
    enableNotifications: harvest.enableNotifications || false,
    notificationDays: harvest.notificationDays?.toString() || '7'
  }

  if (harvestForm.value.cropId) {
    smartEstimation.value = calculateSmartEstimation(
      harvestForm.value.cropId, 
      harvestForm.value.plantingDate
    )
  }

  showHarvestModal.value = true
  showDayModal.value = false
}

const deleteHarvest = async (harvestId) => {
  if (!confirm('Are you sure you want to delete this crop schedule?')) {
    return
  }

  try {
    await deleteDoc(doc(db, 'harvests', harvestId))
    showDayModal.value = false
  } catch (error) {
    console.error('Error deleting harvest:', error)
    alert('Failed to delete crop schedule. Please try again.')
  }
}

const onCropSelect = () => {
  if (!harvestForm.value.cropId) return

  const selectedCrop = availableCrops.value.find(crop => crop.id === harvestForm.value.cropId)
  if (selectedCrop) {
    harvestForm.value.name = selectedCrop.name
    harvestForm.value.category = selectedCrop.category
    
    if (harvestForm.value.plantingDate) {
      updateSmartHarvestDates()
    }
  }
}

const saveHarvest = async () => {
  isSubmitting.value = true

  try {
    const harvestData = {
      sellerId: currentSellerId.value,
      cropId: harvestForm.value.cropId,
      name: harvestForm.value.name,
      category: harvestForm.value.category,
      plantingDate: new Date(harvestForm.value.plantingDate),
      harvestStartDate: new Date(harvestForm.value.harvestStartDate),
      harvestEndDate: new Date(harvestForm.value.harvestEndDate),
      status: harvestForm.value.status,
      notes: harvestForm.value.notes,
      enableNotifications: harvestForm.value.enableNotifications,
      notificationDays: parseInt(harvestForm.value.notificationDays),
      smartEstimate: smartEstimation.value,
      weatherAdjustment: smartEstimation.value ? 
        `Weather conditions may ${smartEstimation.value.weatherAdjustment >= 0 ? 'delay' : 'accelerate'} harvest by ${Math.abs(smartEstimation.value.weatherAdjustment)} days` : null,
      delayed: smartEstimation.value ? smartEstimation.value.weatherAdjustment > 3 : false,
      updatedAt: serverTimestamp()
    }
    
    if (editingHarvest.value) {
      await updateDoc(doc(db, 'harvests', editingHarvest.value.id), harvestData)
    } else {
      // Only add createdAt for new documents
      await addDoc(collection(db, 'harvests'), {
        ...harvestData,
        createdAt: serverTimestamp()
      })
    }
    
    closeHarvestModal()
  } catch (error) {
    console.error('Error saving harvest:', error)
    alert('Failed to save crop schedule. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  harvestForm.value = {
    cropId: '',
    name: '',
    category: '',
    plantingDate: '',
    harvestStartDate: '',
    harvestEndDate: '',
    status: 'planned',
    notes: '',
    enableNotifications: true,
    notificationDays: '7'
  }
}

const getFilterCount = (filterValue) => {
  if (filterValue === 'all') return harvests.value.length
  return harvests.value.filter(h => h.status === filterValue).length
}

// Helper functions
const formatDateForInput = (date) => {
  return date.toISOString().split('T')[0]
}

const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric' 
  }).format(date)
}

const formatDay = (date) => {
  return date.getDate()
}

const formatShortMonth = (date) => {
  return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date)
}

const formatFullDate = (date) => {
  return new Intl.DateTimeFormat('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }).format(date)
}

const getCategoryColor = (category) => {
  const colors = {
    'Vegetables': '#16a34a',
    'Fruits': '#ea580c',
    'Grains': '#7c3aed',
    'Herbs': '#0891b2'
  }
  return colors[category] || '#4b5563'
}

const getStatusClass = (status) => {
  return `status-${status.toLowerCase().replace(/\s+/g, '-')}`
}

const truncateName = (name) => {
  return name.length > 8 ? name.substring(0, 8) + '...' : name
}

const getDaysUntilHarvest = (harvestDate) => {
  const today = new Date()
  const harvest = new Date(harvestDate)
  const diffTime = harvest - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return 'Harvest overdue'
  } else if (diffDays === 0) {
    return 'Harvest today'
  } else if (diffDays === 1) {
    return 'Harvest tomorrow'
  } else if (diffDays <= 7) {
    return `Harvest in ${diffDays} days`
  } else {
    return `${Math.floor(diffDays / 7)} weeks until harvest`
  }
}

// Geocoding function
const geocodeAndFetchWeather = async (address) => {
  try {
    const geocodingResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=jsonv2`
    );

    if (!geocodingResponse.ok) {
      console.error('Geocoding API: HTTP', geocodingResponse.status);
      throw new Error(`Geocoding API request failed: ${geocodingResponse.status}`);
    }

    const geocodingData = await geocodingResponse.json();

    if (geocodingData && geocodingData.length > 0) {
      const lat = parseFloat(geocodingData[0].lat);
      const lng = parseFloat(geocodingData[0].lon);

      console.log('Geocoding successful. Coordinates:', { lat, lng });

      // Update seller document with geocoded coordinates
      try {
        await updateDoc(doc(db, 'sellers', currentSellerId.value), {
          coordinates: { lat, lng },
          updatedAt: serverTimestamp()
        });
        console.log('Saved geocoded coordinates to seller profile');
      } catch (updateError) {
        console.warn('Could not update seller coordinates:', updateError);
      }

      // Fetch weather data with geocoded coordinates
      await fetchWeatherData(lat, lng);
    } else {
      console.warn('Geocoding: No results found for address:', address);
      // Fallback to default coordinates
      await fetchWeatherData(ORIENTAL_MINDORO_COORDS.lat, ORIENTAL_MINDORO_COORDS.lng);
    }
  } catch (geocodingError) {
    console.error('Geocoding error:', geocodingError);
    // Fallback to default coordinates
    await fetchWeatherData(ORIENTAL_MINDORO_COORDS.lat, ORIENTAL_MINDORO_COORDS.lng);
  }
};

// Initialize data
onMounted(async () => {
  try {
    console.log('Initializing Harvest Calendar...')
    await requestNotificationPermission()
    await fetchSellerLocation()
    
    setTimeout(async () => {
      availableCrops.value = enhancedCropDatabase
      await setupHarvestListener()
      isLoading.value = false
      console.log('Harvest Calendar initialized successfully')
    }, 1000)
  } catch (error) {
    console.error('Error during component initialization:', error)
    isLoading.value = false
  }
})
</script>

<style scoped>
/* Dark Green Theme Styles */
.harvest-calendar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.calendar-header {
  background: linear-gradient(135deg, #1e3a1e 0%, #2d5a2d 100%);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  color: white;
}

.weather-section {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
  margin-bottom: 20px;
}

.current-weather-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
}

.weather-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.weather-icon {
  color: #fbbf24;
}

.weather-info h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  margin: 0;
  text-transform: capitalize;
}

.weather-info p {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.weather-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.weather-stat {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: white;
}

.weather-forecast {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
}

.weather-forecast h4 {
  font-size: 1rem;
  font-weight: 600;
  color: white;
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
  background: rgba(255, 255, 255, 0.1);
}

.forecast-date {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
}

.forecast-temp {
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
}

.forecast-rain {
  font-size: 0.75rem;
  color: #93c5fd;
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-actions {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.location-widget {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px 12px;
  max-width: 250px;
}

.location-text {
  color: white;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.refresh-location-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.refresh-location-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.refresh-location-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.month-navigation {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 8px 16px;
}

.nav-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.current-month {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 120px;
}

.month-name {
  font-size: 18px;
  font-weight: 600;
}

.year {
  font-size: 14px;
  opacity: 0.8;
}

.add-harvest-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: white;
  color: #1e3a1e;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.add-harvest-btn:hover:not(:disabled) {
  background: #f0f9f0;
  transform: translateY(-1px);
}

.add-harvest-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.weather-alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-top: 16px;
  border-radius: 8px;
  font-size: 14px;
}

.weather-alert.warning {
  background: rgba(245, 158, 11, 0.2);
  border-left: 4px solid #f59e0b;
}

.alert-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  margin-left: auto;
  padding: 4px;
  border-radius: 4px;
}

.weather-status-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-top: 8px;
  border-radius: 8px;
  font-size: 14px;
  background: rgba(59, 130, 246, 0.1);
  border-left: 4px solid #3b82f6;
  color: #dbeafe;
}

.harvest-alerts {
  background: #f0f9f0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  border-left: 4px solid #16a34a;
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.alert-header h3 {
  margin: 0;
  color: #1e3a1e;
  font-size: 16px;
  font-weight: 600;
}

.mark-read-btn {
  background: none;
  border: 1px solid #d1d5db;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  color: #4b5563;
  cursor: pointer;
  margin-left: auto;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.harvest-alert-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #d1d5db;
}

.alert-icon {
  color: #16a34a;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-weight: 600;
  color: #1e3a1e;
  font-size: 14px;
}

.alert-subtitle {
  font-size: 12px;
  color: #4b5563;
  margin-top: 2px;
}

.alert-actions {
  display: flex;
  gap: 8px;
}

.notification-btn,
.dismiss-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-btn {
  background: #dbeafe;
  color: #2563eb;
}

.dismiss-btn {
  background: #fee2e2;
  color: #dc2626;
}

.view-toggle {
  display: flex;
  gap: 4px;
  background: #f1f5f9;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 24px;
  width: fit-content;
}

.view-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: none;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
}

.view-btn.active {
  background: white;
  color: #16a34a;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #4b5563;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #d1d5db;
  border-top: 3px solid #16a34a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Calendar View Styles */
.calendar-view {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.calendar-days-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  margin-bottom: 1px;
}

.day-header {
  padding: 12px;
  text-align: center;
  font-weight: 600;
  color: #4b5563;
  background: #f8fafc;
  font-size: 14px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #e5e7eb;
}

.calendar-day {
  background: white;
  min-height: 120px;
  padding: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.calendar-day:hover {
  background: #f9fafb;
}

.calendar-day.other-month {
  background: #f8fafc;
  color: #9ca3af;
}

.calendar-day.today {
  background: #ecfdf5;
  border: 2px solid #16a34a;
}

.calendar-day.weekend {
  background: #fefce8;
}

.calendar-day.has-harvest {
  background: #f0f9ff;
}

.day-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.day-number {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.weather-indicator {
  font-size: 10px;
  color: #6b7280;
  margin-bottom: 4px;
}

.harvest-indicators {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.harvest-indicator {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.harvest-name {
  font-weight: 500;
}

.delay-warning {
  color: #fbbf24;
}

.harvest-more {
  font-size: 10px;
  color: #6b7280;
  text-align: center;
  margin-top: 2px;
}

/* List View Styles */
.list-view {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.empty-icon {
  color: #d1d5db;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
}

.empty-state p {
  margin: 0 0 24px 0;
}

.list-filters {
  margin-bottom: 24px;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-tab.active {
  background: #16a34a;
  color: white;
  border-color: #16a34a;
}

.filter-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.filter-tab.active .filter-count {
  background: rgba(255, 255, 255, 0.3);
}

.harvest-month-group {
  margin-bottom: 32px;
}

.month-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e5e7eb;
}

.month-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.month-count {
  font-size: 14px;
  color: #6b7280;
}

.harvest-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.harvest-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.2s;
}

.harvest-item:hover {
  border-color: #16a34a;
  box-shadow: 0 2px 8px rgba(22, 163, 74, 0.1);
}

.harvest-item.weather-delayed {
  border-color: #f59e0b;
  background: #fffbeb;
}

.harvest-timeline {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
}

.timeline-date {
  text-align: center;
  margin-bottom: 8px;
}

.date-number {
  font-size: 24px;
  font-weight: 700;
  color: #16a34a;
  line-height: 1;
}

.date-month {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  font-weight: 600;
}

.timeline-line {
  width: 2px;
  height: 40px;
  background: #e5e7eb;
  border-radius: 1px;
}

.harvest-details {
  flex: 1;
}

.harvest-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.crop-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.harvest-status-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  background: #f3f4f6;
  color: #374151;
  text-transform: capitalize;
}

.delay-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  background: #fef3c7;
  color: #92400e;
}

.harvest-name {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.harvest-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #4b5563;
}

.weather-adjustment,
.harvest-notes {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
  margin-top: 8px;
  padding: 8px;
  background: #f8fafc;
  border-radius: 6px;
}

.harvest-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.edit-btn {
  background: #dbeafe;
  color: #2563eb;
}

.edit-btn:hover {
  background: #bfdbfe;
}

.delete-btn {
  background: #fee2e2;
  color: #dc2626;
}

.delete-btn:hover {
  background: #fecaca;
}

/* Modal Styles */
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
  padding: 20px;
}

.harvest-modal,
.day-modal {
  background: white;
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 24px 0 24px;
  margin-bottom: 24px;
}

.modal-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: #f3f4f6;
  color: #4b5563;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e5e7eb;
}

.modal-content {
  padding: 0 24px 24px 24px;
}

/* Form Styles */
.harvest-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-section h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #16a34a;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkbox-group input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.notification-options {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 14px;
  color: #4b5563;
}

.notification-options select {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
}

.smart-estimation-card {
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 8px;
  padding: 16px;
}

.estimation-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.confidence-badge {
  background: #0ea5e9;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  margin-left: auto;
}

.estimation-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.detail-row .positive {
  color: #dc2626;
}

.detail-row .negative {
  color: #16a34a;
}

.final-estimate {
  font-weight: 600;
  color: #0ea5e9;
}

.weather-conditions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.weather-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #4b5563;
}

.weather-status.optimal {
  color: #16a34a;
  font-weight: 500;
}

.weather-status.cold,
.weather-status.hot {
  color: #dc2626;
  font-weight: 500;
}

.estimated-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 8px;
  font-size: 14px;
  color: #0369a1;
  margin-bottom: 16px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn,
.save-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: white;
  color: #4b5563;
  border: 1px solid #d1d5db;
}

.cancel-btn:hover:not(:disabled) {
  background: #f9fafb;
}

.save-btn {
  background: #16a34a;
  color: white;
  border: 1px solid #16a34a;
}

.save-btn:hover:not(:disabled) {
  background: #15803d;
}

.cancel-btn:disabled,
.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Day Modal Styles */
.empty-day {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}

.empty-day p {
  margin: 16px 0 24px 0;
}

.day-harvests-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.day-harvests-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.add-small-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: #16a34a;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.day-harvest-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.day-harvest-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.day-harvest-info {
  flex: 1;
}

.day-harvest-info h5 {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.harvest-period {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.day-harvest-actions {
  display: flex;
  gap: 8px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .weather-section {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .forecast-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .location-widget {
    max-width: 200px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .harvest-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .harvest-actions {
    flex-direction: row;
    align-self: flex-end;
  }
}

@media (max-width: 480px) {
  .harvest-calendar-container {
    padding: 12px;
  }

  .calendar-header {
    padding: 16px;
  }

  .modal-overlay {
    padding: 12px;
  }

  .calendar-day {
    min-height: 80px;
    padding: 4px;
  }

  .day-number {
    font-size: 12px;
  }

  .harvest-indicator {
    font-size: 9px;
    padding: 1px 4px;
  }
}
</style>
