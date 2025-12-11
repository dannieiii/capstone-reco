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
        <div
          v-for="(group, month) in groupedHarvests"
          :key="month"
          class="harvest-month-group"
        >
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
                </div>

                <h4 class="harvest-name">{{ harvest.name }}</h4>
                <div class="harvest-period">
                  {{ formatDate(harvest.harvestStartDate) }} - {{ formatDate(harvest.harvestEndDate) }}
                </div>

                <div class="harvest-meta">
                  <div class="meta-item">
                    <CalendarDays :size="14" />
                    <span>{{ getDaysUntilHarvest(harvest.harvestStartDate) }}</span>
                  </div>
                  <div class="meta-item" v-if="harvest.weatherAdjustment">
                    <CloudRain :size="14" />
                    <span>{{ harvest.weatherAdjustment }}</span>
                  </div>
                  <div class="meta-item" v-if="harvest.notes">
                    <MessageSquare :size="14" />
                    <span>{{ harvest.notes }}</span>
                  </div>
                </div>

                <div class="harvest-actions">
                  <button class="action-btn edit-btn" @click="editHarvest(harvest)">
                    <Edit2 :size="14" />
                    Edit
                  </button>
                  <button class="action-btn delete-btn" @click="deleteHarvest(harvest.id)">
                    <Trash2 :size="14" />
                    Delete
                  </button>
                </div>
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
        <h3>{{ editingHarvest ? 'Edit Harvest Schedule' : 'Add Harvest Schedule' }}</h3>
        <button @click="closeHarvestModal" class="close-btn">
          <X :size="20" />
        </button>
      </div>

      <div class="modal-content">
        <form class="harvest-form" @submit.prevent="saveHarvest">
          <div class="form-section">
            <h4>Crop Selection</h4>

            <div class="checkbox-group">
              <input
                type="checkbox"
                id="isCustomCrop"
                v-model="harvestForm.isCustomCrop"
                @change="handleCustomCropToggle"
              />
              <label for="isCustomCrop">Enter a custom crop</label>
            </div>

            <div v-if="!harvestForm.isCustomCrop" class="form-group">
              <label for="cropId">Choose Crop *</label>
              <select
                id="cropId"
                v-model="harvestForm.cropId"
                :disabled="isSubmitting"
                required
                @change="onCropSelect"
              >
                <option value="">Select from catalog</option>
                <optgroup
                  v-for="group in groupedCrops"
                  :key="group.name"
                  :label="group.name"
                >
                  <option
                    v-for="crop in group.crops"
                    :key="crop.id"
                    :value="crop.id"
                  >
                    {{ crop.name }} ({{ crop.daysToHarvest }} days)
                  </option>
                </optgroup>
              </select>
            </div>

            <div v-else class="custom-crop-grid">
              <div class="form-group">
                <label for="customName">Crop Name *</label>
                <input
                  id="customName"
                  type="text"
                  v-model="harvestForm.customName"
                  :disabled="isSubmitting"
                  required
                />
              </div>
              <div class="form-group">
                <label for="customCategory">Category *</label>
                <select
                  id="customCategory"
                  v-model="harvestForm.customCategory"
                  :disabled="isSubmitting"
                  required
                >
                  <option value="Fruits">Fruits</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Grains">Grains</option>
                  <option value="Root Crops">Root Crops</option>
                  <option value="Herbs">Herbs</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
              <div class="form-group">
                <label for="customDaysToHarvest">Days to Harvest *</label>
                <input
                  id="customDaysToHarvest"
                  type="number"
                  min="1"
                  v-model.number="harvestForm.customDaysToHarvest"
                  :disabled="isSubmitting"
                  required
                />
              </div>
              <div class="form-group">
                <label for="customHarvestWindow">Harvest Window (days)</label>
                <input
                  id="customHarvestWindow"
                  type="number"
                  min="1"
                  v-model.number="harvestForm.customHarvestWindow"
                  :disabled="isSubmitting"
                />
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4>Planting & Smart Estimate</h4>
            <div class="form-group">
              <label for="plantingDate">Planting Date *</label>
              <input
                id="plantingDate"
                type="date"
                v-model="harvestForm.plantingDate"
                :disabled="isSubmitting"
                required
                @change="updateSmartHarvestDates"
              />
            </div>
            <div class="estimated-info" v-if="smartEstimation">
              <Brain :size="16" />
              <span>
                Smart estimate: {{ smartEstimation.baseDays }} base days •
                Adjustment {{ smartEstimation.weatherAdjustment >= 0 ? '+' : '-' }}{{ Math.abs(smartEstimation.weatherAdjustment) }} days •
                Final {{ smartEstimation.finalDays }} days
              </span>
            </div>
          </div>

          <div class="form-section">
            <h4>Harvest Schedule</h4>
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
          </div>

          <div class="form-section">
            <h4>Notifications</h4>
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
import { ref, computed, onMounted, watch } from 'vue'
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
  serverTimestamp
} from 'firebase/firestore'

// Weather data now relies solely on FarmXpress' built-in offline climate model
console.log('Weather service: using offline FarmXpress climate model – no external API required.')

// State variables
const isLoading = ref(true)
const isSubmitting = ref(false)
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

// Weather forecast data generated entirely by the offline model
const weatherForecast = ref([])

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
  notificationDays: '7',
  isCustomCrop: false,
  customName: '',
  customCategory: 'Fruits',
  customDaysToHarvest: 90,
  customHarvestWindow: 14
})

watch(() => harvestForm.value.customName, (newName) => {
  if (harvestForm.value.isCustomCrop) {
    harvestForm.value.name = newName || ''
  }
})

watch(() => harvestForm.value.customCategory, (newCategory) => {
  if (harvestForm.value.isCustomCrop) {
    harvestForm.value.category = newCategory || ''
  }
})

watch(
  () => [
    harvestForm.value.isCustomCrop,
    harvestForm.value.customDaysToHarvest,
    harvestForm.value.customHarvestWindow,
    harvestForm.value.plantingDate
  ],
  () => {
    if (harvestForm.value.plantingDate) {
      updateSmartHarvestDates()
    }
  }
)

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

// Offline weather model helpers
const fetchWeatherData = async (lat, lon) => {
  console.log('Weather service: generating offline forecast for', { lat, lon })
  setDemoWeatherData('Oriental Mindoro', 'FarmXpress climate model')
  await fetchForecastData(lat, lon)
}

const setDemoWeatherData = (locationName = 'Oriental Mindoro', errorReason = 'FarmXpress climate model') => {
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
  // Also set a demo forecast for completeness
  setDemoForecastData(baseTemp)
}
// Generate a plausible 7-day forecast without modifying currentWeather
const setDemoForecastData = (baseTemp = 28) => {
  const today = new Date()
  weatherForecast.value = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i + 1)
    const variance = (Math.random() - 0.5) * 4
    const high = Math.round(baseTemp + variance + 2)
    const low = Math.round(baseTemp + variance - 3)
    const rain = Math.max(0, Math.min(100, Math.round(Math.random() * 60)))
    const hum = Math.max(55, Math.min(90, Math.round(70 + (Math.random() - 0.5) * 20)))
    const cond = rain > 50 ? 'rainy' : (Math.random() > 0.5 ? 'partly-cloudy' : 'sunny')
    return {
      date: formatShortDate(d),
      condition: cond,
      high,
      low,
      rain,
      humidity: hum
    }
  })
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

const mapWeatherCondition = (main, description = '') => {
  // Normalize OWM conditions to our icon keys
  const desc = (description || '').toLowerCase()
  if (main === 'Clear') return 'clear'
  if (main === 'Clouds') {
    if (desc.includes('few') || desc.includes('scattered')) return 'partly-cloudy'
    return 'cloudy'
  }
  if (main === 'Rain' || main === 'Drizzle' || main === 'Thunderstorm') return 'rainy'
  if (main === 'Snow') return 'cloudy'
  if (main === 'Mist' || main === 'Fog' || main === 'Haze' || main === 'Smoke') return 'cloudy'
  return 'partly-cloudy'
}

// Fetch 7-day forecast with fallback to 5-day/3-hour aggregation
const fetchForecastData = async (lat, lon) => {
  console.log('Weather service: generating 7-day offline forecast for', { lat, lon })
  setDemoForecastData(currentWeather.value?.temp ?? 28)
}

const formatShortDate = (date) => {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)
}

// Firebase and Location Methods
const fetchSellerLocation = async () => {
  isLoadingLocation.value = true
  try {
    const auth = getAuth()
    const currentUser = auth.currentUser

    if (!currentUser) {
      console.warn('No authenticated user found; using default location context.')
      sellerLocation.value = {
        farmName: 'Please log in',
        farmAddress: ORIENTAL_MINDORO_COORDS.name,
        personalInfo: {},
        farmDetails: {},
        coordinates: ORIENTAL_MINDORO_COORDS
      }
      await fetchWeatherData(ORIENTAL_MINDORO_COORDS.lat, ORIENTAL_MINDORO_COORDS.lng)
      return
    }

    currentSellerId.value = currentUser.uid

    const farmLabel = currentUser.displayName
      ? `${currentUser.displayName}'s Farm`
      : 'My Farm'

    sellerLocation.value = {
      farmName: farmLabel,
      farmAddress: ORIENTAL_MINDORO_COORDS.name,
      personalInfo: {
        email: currentUser.email || '',
        firstName: currentUser.displayName || 'Farmer'
      },
      farmDetails: {
        farmName: farmLabel,
        farmAddress: ORIENTAL_MINDORO_COORDS.name,
        isOnline: false
      },
      paymentInfo: {},
      deliveryInfo: {},
      additionalDetails: {},
      termsAgreement: {},
      documents: {},
      status: 'Active',
      isVerified: false,
      isOnline: false,
      userId: currentUser.uid,
      coordinates: ORIENTAL_MINDORO_COORDS
    }

    await fetchWeatherData(ORIENTAL_MINDORO_COORDS.lat, ORIENTAL_MINDORO_COORDS.lng)
  } catch (error) {
    console.error('Error initializing seller context:', error)
    sellerLocation.value = {
      farmName: 'FarmXpress User',
      farmAddress: ORIENTAL_MINDORO_COORDS.name,
      personalInfo: {},
      farmDetails: {},
      coordinates: ORIENTAL_MINDORO_COORDS
    }
    await fetchWeatherData(ORIENTAL_MINDORO_COORDS.lat, ORIENTAL_MINDORO_COORDS.lng)
  }
  finally {
    isLoadingLocation.value = false
  }
}

// Weather and Smart Estimation Methods
const calculateSmartEstimation = (cropId, plantingDate) => {
  if (!cropId || !plantingDate || !currentWeather.value) return null

  const crop = availableCrops.value.find(c => c.id === cropId)
  if (!crop) return null

  const baseDays = crop.daysToHarvest
  let weatherAdjustment = 0
  let confidence = 85

  // Temperature-based adjustments using forecast average if available
  const avgTemp = weatherForecast.value.length
    ? Math.round(weatherForecast.value.reduce((s, d) => s + ((d.high + d.low) / 2), 0) / weatherForecast.value.length)
    : currentWeather.value.temp
  if (avgTemp < crop.optimalTemp.min) {
    const tempDiff = crop.optimalTemp.min - avgTemp
    weatherAdjustment += Math.floor(tempDiff * 0.5)
    confidence -= Math.floor(tempDiff * 2)
  } else if (avgTemp > crop.optimalTemp.max) {
    const tempDiff = avgTemp - crop.optimalTemp.max
    weatherAdjustment += Math.floor(tempDiff * 0.3)
    confidence -= Math.floor(tempDiff * 1.5)
  }

  // Humidity-based adjustments using forecast average if available
  const humidity = weatherForecast.value.length
    ? Math.round(weatherForecast.value.reduce((s, d) => s + (d.humidity ?? currentWeather.value.humidity), 0) / weatherForecast.value.length)
    : currentWeather.value.humidity
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
  if (!harvestForm.value.plantingDate) return

  if (harvestForm.value.isCustomCrop) {
    const baseDays = Number(harvestForm.value.customDaysToHarvest) || 90
    const harvestWindow = Number(harvestForm.value.customHarvestWindow) || 14
    smartEstimation.value = {
      baseDays,
      weatherAdjustment: 0,
      finalDays: baseDays,
      confidence: 72
    }

    const plantingDate = new Date(harvestForm.value.plantingDate)
    const harvestStartDate = new Date(plantingDate)
    harvestStartDate.setDate(plantingDate.getDate() + baseDays)
    const harvestEndDate = new Date(harvestStartDate)
    harvestEndDate.setDate(harvestStartDate.getDate() + harvestWindow)
    harvestForm.value.harvestStartDate = formatDateForInput(harvestStartDate)
    harvestForm.value.harvestEndDate = formatDateForInput(harvestEndDate)
    return
  }

  if (!harvestForm.value.cropId) return

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
    notificationDays: '7',
    isCustomCrop: false,
    customName: '',
    customCategory: 'Fruits',
    customDaysToHarvest: 90,
    customHarvestWindow: 14
  }

  showDayModal.value = false
  showHarvestModal.value = true
}

const editHarvest = (harvest) => {
  editingHarvest.value = harvest

  const isCustom = !!harvest.customCropDetails || harvest.isCustomCrop
  const customDetails = harvest.customCropDetails || {}

  harvestForm.value = {
    cropId: isCustom ? '' : (harvest.cropId || ''),
    name: harvest.name,
    category: harvest.category,
    plantingDate: formatDateForInput(harvest.plantingDate),
    harvestStartDate: formatDateForInput(harvest.harvestStartDate),
    harvestEndDate: formatDateForInput(harvest.harvestEndDate),
    status: harvest.status,
    notes: harvest.notes || '',
    enableNotifications: harvest.enableNotifications || false,
    notificationDays: harvest.notificationDays?.toString() || '7',
    isCustomCrop: isCustom,
    customName: isCustom ? (customDetails.name || harvest.name) : '',
    customCategory: isCustom ? (customDetails.category || harvest.category || 'Custom') : 'Fruits',
    customDaysToHarvest: isCustom ? (customDetails.daysToHarvest || 90) : 90,
    customHarvestWindow: isCustom ? (customDetails.harvestWindow || 14) : 14
  }

  if (isCustom) {
    smartEstimation.value = {
      baseDays: harvestForm.value.customDaysToHarvest,
      weatherAdjustment: 0,
      finalDays: harvestForm.value.customDaysToHarvest,
      confidence: 72
    }
  } else if (harvestForm.value.cropId) {
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

const handleCustomCropToggle = () => {
  if (harvestForm.value.isCustomCrop) {
    harvestForm.value.cropId = ''
    harvestForm.value.name = harvestForm.value.customName
    harvestForm.value.category = harvestForm.value.customCategory
    smartEstimation.value = null
    updateSmartHarvestDates()
  } else {
    harvestForm.value.customName = ''
    harvestForm.value.customCategory = 'Fruits'
    harvestForm.value.customDaysToHarvest = 90
    harvestForm.value.customHarvestWindow = 14
    harvestForm.value.name = ''
    harvestForm.value.category = ''
    smartEstimation.value = null
  }
}

const onCropSelect = () => {
  if (harvestForm.value.isCustomCrop || !harvestForm.value.cropId) return

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
    const isCustomCrop = harvestForm.value.isCustomCrop
    const cropName = (isCustomCrop ? harvestForm.value.customName : harvestForm.value.name)?.trim()
    if (!cropName) {
      alert('Please provide a crop name before saving.')
      isSubmitting.value = false
      return
    }

    const cropCategory = (isCustomCrop ? harvestForm.value.customCategory : harvestForm.value.category) || 'Custom'
    const customDetails = isCustomCrop
      ? {
          name: cropName,
          category: cropCategory,
          daysToHarvest: Number(harvestForm.value.customDaysToHarvest) || 90,
          harvestWindow: Number(harvestForm.value.customHarvestWindow) || 14
        }
      : null

    const estimatePayload = isCustomCrop
      ? {
          baseDays: Number(harvestForm.value.customDaysToHarvest) || 90,
          weatherAdjustment: 0,
          finalDays: Number(harvestForm.value.customDaysToHarvest) || 90,
          confidence: 72
        }
      : smartEstimation.value

    const weatherNote = estimatePayload && estimatePayload.weatherAdjustment
      ? `Weather conditions may ${estimatePayload.weatherAdjustment >= 0 ? 'delay' : 'accelerate'} harvest by ${Math.abs(estimatePayload.weatherAdjustment)} days`
      : (isCustomCrop ? 'Custom crop timeline provided by farmer' : null)

    const harvestData = {
      sellerId: currentSellerId.value,
      cropId: isCustomCrop ? null : harvestForm.value.cropId,
      name: cropName,
      category: cropCategory,
      plantingDate: new Date(harvestForm.value.plantingDate),
      harvestStartDate: new Date(harvestForm.value.harvestStartDate),
      harvestEndDate: new Date(harvestForm.value.harvestEndDate),
      status: harvestForm.value.status,
      notes: harvestForm.value.notes,
      enableNotifications: harvestForm.value.enableNotifications,
      notificationDays: parseInt(harvestForm.value.notificationDays),
      smartEstimate: estimatePayload,
      weatherAdjustment: weatherNote,
      delayed: estimatePayload ? estimatePayload.weatherAdjustment > 3 : false,
      customCropDetails: customDetails,
      isCustomCrop,
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
    notificationDays: '7',
    isCustomCrop: false,
    customName: '',
    customCategory: 'Fruits',
    customDaysToHarvest: 90,
    customHarvestWindow: 14
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

.custom-crop-toggle {
  margin-top: 12px;
}

.custom-crop-fields {
  margin-top: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.custom-helper-text {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 8px;
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
