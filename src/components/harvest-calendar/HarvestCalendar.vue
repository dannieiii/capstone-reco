<template>
  <div class="calendar-container">
    <div class="calendar-header">
      <div class="calendar-title">
        <h1>Harvest Calendar</h1>
        <p>Plan and track your harvests in Oriental Mindoro</p>
      </div>
      
      <div class="calendar-actions">
        <div class="month-selector">
          <button @click="previousMonth" class="nav-btn">
            <ChevronLeft size="18" />
          </button>
          <span class="current-month">{{ currentMonthName }} {{ currentYear }}</span>
          <button @click="nextMonth" class="nav-btn">
            <ChevronRight size="18" />
          </button>
        </div>
        
        <button @click="showAddHarvestModal = true" class="add-harvest-btn">
          <Plus size="18" />
          Add Crop
        </button>
      </div>
    </div>
    
    <div class="view-toggle">
      <button 
        @click="activeView = 'calendar'" 
        :class="['view-btn', { active: activeView === 'calendar' }]"
      >
        <Calendar size="18" />
        Calendar View
      </button>
      <button 
        @click="activeView = 'list'" 
        :class="['view-btn', { active: activeView === 'list' }]"
      >
        <List size="18" />
        List View
      </button>
    </div>
    
    <!-- Calendar View -->
    <div v-if="activeView === 'calendar'" class="calendar-view">
      <div class="calendar-days">
        <div v-for="day in daysOfWeek" :key="day" class="day-header">{{ day }}</div>
      </div>
      
      <div class="calendar-grid">
        <div 
          v-for="(day, index) in calendarDays" 
          :key="index" 
          :class="['calendar-day', { 
            'other-month': !day.isCurrentMonth,
            'today': day.isToday,
            'has-harvest': day.harvests.length > 0
          }]"
          @click="selectDay(day)"
        >
          <div class="day-number">{{ day.date.getDate() }}</div>
          <div v-if="day.harvests.length > 0" class="harvest-indicators">
            <div 
              v-for="(harvest, i) in day.harvests.slice(0, 3)" 
              :key="i" 
              class="harvest-dot"
              :style="{ backgroundColor: getCategoryColor(harvest.category) }"
              :title="harvest.name"
            ></div>
            <div v-if="day.harvests.length > 3" class="harvest-more">+{{ day.harvests.length - 3 }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- List View -->
    <div v-else class="list-view">
      <div v-if="isLoading" class="loading-state">Loading harvests...</div>
      
      <div v-else-if="upcomingHarvests.length === 0" class="empty-state">
        <p>No upcoming harvests scheduled. Add your first crop to get started.</p>
        <button @click="showAddHarvestModal = true" class="add-harvest-btn">
          <Plus size="18" />
          Add Crop
        </button>
      </div>
      
      <div v-else class="harvest-timeline">
        <div v-for="(group, month) in groupedHarvests" :key="month" class="harvest-month">
          <h3 class="month-heading">{{ month }}</h3>
          
          <div v-for="harvest in group" :key="harvest.id" class="harvest-item">
            <div class="harvest-date">
              <div class="date-number">{{ formatDay(harvest.harvestStartDate) }}</div>
              <div class="date-month">{{ formatShortMonth(harvest.harvestStartDate) }}</div>
            </div>
            
            <div class="harvest-content">
              <div class="harvest-crop-badge" :style="{ backgroundColor: getCategoryColor(harvest.category) }">
                {{ harvest.category }}
              </div>
              <h4 class="harvest-name">{{ harvest.name }}</h4>
              <div class="harvest-details">
                <div class="harvest-detail">
                  <Sprout size="14" />
                  <span>Planted: {{ formatDate(harvest.plantingDate) }}</span>
                </div>
                <div class="harvest-detail">
                  <Calendar size="14" />
                  <span>Harvest window: {{ formatDate(harvest.harvestStartDate) }} - {{ formatDate(harvest.harvestEndDate) }}</span>
                </div>
              </div>
              <div class="harvest-status" :class="getStatusClass(harvest)">
                {{ harvest.status }}
              </div>
              <div v-if="harvest.notes" class="harvest-notes">
                {{ harvest.notes }}
              </div>
            </div>
            
            <div class="harvest-actions">
              <button @click="editHarvest(harvest)" class="action-btn edit-btn">
                <Edit size="16" />
              </button>
              <button @click="deleteHarvest(harvest.id)" class="action-btn delete-btn">
                <Trash size="16" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Day Detail Modal -->
    <div v-if="selectedDay && showDayDetail" class="modal-overlay" @click="closeDayDetail">
      <div class="day-detail-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ formatFullDate(selectedDay.date) }}</h3>
          <button @click="closeDayDetail" class="close-btn">
            <X size="18" />
          </button>
        </div>
        
        <div class="modal-content">
          <div v-if="selectedDay.harvests.length === 0" class="empty-harvests">
            <p>No harvests scheduled for this day.</p>
            <button @click="addHarvestForDay(selectedDay)" class="add-harvest-btn">
              <Plus size="18" />
              Add Crop
            </button>
          </div>
          
          <div v-else class="day-harvests">
            <div v-for="harvest in selectedDay.harvests" :key="harvest.id" class="day-harvest-item">
              <div class="harvest-crop-badge" :style="{ backgroundColor: getCategoryColor(harvest.category) }">
                {{ harvest.category }}
              </div>
              <div class="day-harvest-details">
                <h4>{{ harvest.name }}</h4>
                <div class="harvest-detail">
                  <Sprout size="14" />
                  <span>Planted: {{ formatDate(harvest.plantingDate) }}</span>
                </div>
                <div class="harvest-detail">
                  <Calendar size="14" />
                  <span>Harvest window: {{ formatDate(harvest.harvestStartDate) }} - {{ formatDate(harvest.harvestEndDate) }}</span>
                </div>
                <div v-if="harvest.notes" class="harvest-notes">
                  {{ harvest.notes }}
                </div>
              </div>
              <div class="day-harvest-actions">
                <button @click="editHarvest(harvest)" class="action-btn edit-btn">
                  <Edit size="16" />
                </button>
                <button @click="deleteHarvest(harvest.id)" class="action-btn delete-btn">
                  <Trash size="16" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Add/Edit Harvest Modal -->
    <div v-if="showAddHarvestModal" class="modal-overlay" @click="cancelAddHarvest">
      <div class="harvest-form-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingHarvest ? 'Edit Crop' : 'Add New Crop' }}</h3>
          <button @click="cancelAddHarvest" class="close-btn">
            <X size="18" />
          </button>
        </div>
        
        <div class="modal-content">
          <form @submit.prevent="saveHarvest" class="harvest-form">
            <div class="form-group">
              <label for="cropSelect">Select Crop</label>
              <select 
                id="cropSelect" 
                v-model="harvestForm.cropId"
                @change="onCropSelect"
                required
              >
                <option value="">Select a crop</option>
                <option 
                  v-for="crop in availableCrops" 
                  :key="crop.id" 
                  :value="crop.id"
                >
                  {{ crop.name }} ({{ crop.category }})
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="plantingDate">Planting Date</label>
              <input 
                type="date" 
                id="plantingDate" 
                v-model="harvestForm.plantingDate"
                required
                @change="updateHarvestDates"
              />
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="harvestStartDate">Harvest Start Date</label>
                <input 
                  type="date" 
                  id="harvestStartDate" 
                  v-model="harvestForm.harvestStartDate"
                  required
                />
              </div>
              
              <div class="form-group">
                <label for="harvestEndDate">Harvest End Date</label>
                <input 
                  type="date" 
                  id="harvestEndDate" 
                  v-model="harvestForm.harvestEndDate"
                  required
                />
              </div>
            </div>
            
            <div class="form-group">
              <label for="status">Status</label>
              <select id="status" v-model="harvestForm.status" required>
                <option value="planned">Planned</option>
                <option value="in progress">In Progress</option>
                <option value="harvested">Harvested</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="notes">Notes</label>
              <textarea 
                id="notes" 
                v-model="harvestForm.notes" 
                placeholder="Add any additional notes about this crop"
                rows="3"
              ></textarea>
            </div>
            
            <div class="form-actions">
              <button type="button" @click="cancelAddHarvest" class="cancel-btn">Cancel</button>
              <button type="submit" class="save-btn">
                {{ editingHarvest ? 'Update Crop' : 'Save Crop' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  List, 
  Sprout, 
  Edit, 
  Trash, 
  X 
} from 'lucide-vue-next';
import { db } from '@/firebase/firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// State variables
const isLoading = ref(true);
const sellerCrops = ref([]);
const availableCrops = ref([]);
const currentDate = ref(new Date());
const activeView = ref('calendar');
const selectedDay = ref(null);
const showDayDetail = ref(false);
const showAddHarvestModal = ref(false);
const editingHarvest = ref(null);

// Calendar data
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Form data
const harvestForm = ref({
  cropId: '',
  name: '',
  category: '',
  plantingDate: '',
  harvestStartDate: '',
  harvestEndDate: '',
  status: 'planned',
  notes: ''
});

// Computed properties
const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonth = computed(() => currentDate.value.getMonth());
const currentMonthName = computed(() => {
  return new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentDate.value);
});

// Calendar days computation
const calendarDays = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  
  // First day of the month
  const firstDay = new Date(year, month, 1);
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0);
  
  // Day of the week for the first day (0-6, where 0 is Sunday)
  const firstDayOfWeek = firstDay.getDay();
  
  // Total days in the month
  const daysInMonth = lastDay.getDate();
  
  // Array to hold all calendar days
  const days = [];
  
  // Add days from previous month to fill the first week
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: isSameDay(date, new Date()),
      harvests: getHarvestsForDay(date)
    });
  }
  
  // Add days of the current month
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    days.push({
      date,
      isCurrentMonth: true,
      isToday: isSameDay(date, new Date()),
      harvests: getHarvestsForDay(date)
    });
  }
  
  // Add days from next month to complete the last week
  const remainingDays = 42 - days.length; // 6 rows of 7 days
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: isSameDay(date, new Date()),
      harvests: getHarvestsForDay(date)
    });
  }
  
  return days;
});

// Upcoming harvests for list view
const upcomingHarvests = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return sellerCrops.value
    .filter(crop => {
      const harvestStartDate = crop.harvestStartDate instanceof Date 
        ? crop.harvestStartDate 
        : crop.harvestStartDate.toDate();
      return harvestStartDate >= today;
    })
    .sort((a, b) => {
      const dateA = a.harvestStartDate instanceof Date 
        ? a.harvestStartDate 
        : a.harvestStartDate.toDate();
      const dateB = b.harvestStartDate instanceof Date 
        ? b.harvestStartDate 
        : b.harvestStartDate.toDate();
      return dateA - dateB;
    });
});

// Group harvests by month for list view
const groupedHarvests = computed(() => {
  const groups = {};
  
  upcomingHarvests.value.forEach(harvest => {
    const date = harvest.harvestStartDate instanceof Date 
      ? harvest.harvestStartDate 
      : harvest.harvestStartDate.toDate();
    
    const monthYear = new Intl.DateTimeFormat('en-US', { 
      month: 'long', 
      year: 'numeric' 
    }).format(date);
    
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    
    groups[monthYear].push(harvest);
  });
  
  return groups;
});

// Methods
const fetchSellerCrops = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    console.error('User not authenticated');
    isLoading.value = false;
    return;
  }
  
  try {
    const q = query(
      collection(db, 'sellerCrops'), 
      where('sellerId', '==', user.uid.trim())
    );
    
    const querySnapshot = await getDocs(q);
    const crops = [];
    
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      
      // Get crop details
      let cropDetails = { category: 'Unknown' };
      if (data.cropId) {
        const cropDoc = await getDoc(doc(db, 'crops', data.cropId));
        if (cropDoc.exists()) {
          cropDetails = cropDoc.data();
        }
      }
      
      crops.push({
        id: docSnap.id,
        ...data,
        category: cropDetails.category || 'Unknown'
      });
    }
    
    sellerCrops.value = crops;
  } catch (error) {
    console.error('Error fetching seller crops:', error);
  } finally {
    isLoading.value = false;
  }
};

const fetchAvailableCrops = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'crops'));
    availableCrops.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching available crops:', error);
  }
};

const getHarvestsForDay = (date) => {
  return sellerCrops.value.filter(crop => {
    const harvestStartDate = crop.harvestStartDate instanceof Date 
      ? crop.harvestStartDate 
      : crop.harvestStartDate.toDate();
    
    const harvestEndDate = crop.harvestEndDate instanceof Date 
      ? crop.harvestEndDate 
      : crop.harvestEndDate.toDate();
    
    return date >= harvestStartDate && date <= harvestEndDate;
  });
};

const isSameDay = (date1, date2) => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

const previousMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1);
};

const nextMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1);
};

const selectDay = (day) => {
  selectedDay.value = day;
  showDayDetail.value = true;
};

const closeDayDetail = () => {
  showDayDetail.value = false;
  selectedDay.value = null;
};

const addHarvestForDay = (day) => {
  // Set the planting date to 110 days before the selected day (typical for rice)
  const plantingDate = new Date(day.date);
  plantingDate.setDate(plantingDate.getDate() - 110);
  
  harvestForm.value = {
    cropId: '',
    name: '',
    category: '',
    plantingDate: formatDateForInput(plantingDate),
    harvestStartDate: formatDateForInput(day.date),
    harvestEndDate: formatDateForInput(day.date),
    status: 'planned',
    notes: ''
  };
  
  showDayDetail.value = false;
  showAddHarvestModal.value = true;
};

const editHarvest = (harvest) => {
  editingHarvest.value = harvest;
  
  harvestForm.value = {
    cropId: harvest.cropId || '',
    name: harvest.name || '',
    category: harvest.category || '',
    plantingDate: formatDateForInput(harvest.plantingDate instanceof Date 
      ? harvest.plantingDate 
      : harvest.plantingDate.toDate()),
    harvestStartDate: formatDateForInput(harvest.harvestStartDate instanceof Date 
      ? harvest.harvestStartDate 
      : harvest.harvestStartDate.toDate()),
    harvestEndDate: formatDateForInput(harvest.harvestEndDate instanceof Date 
      ? harvest.harvestEndDate 
      : harvest.harvestEndDate.toDate()),
    status: harvest.status || 'planned',
    notes: harvest.notes || ''
  };
  
  showAddHarvestModal.value = true;
  
  // Close day detail if open
  if (showDayDetail.value) {
    showDayDetail.value = false;
  }
};

const cancelAddHarvest = () => {
  showAddHarvestModal.value = false;
  editingHarvest.value = null;
  resetForm();
};

const resetForm = () => {
  harvestForm.value = {
    cropId: '',
    name: '',
    category: '',
    plantingDate: '',
    harvestStartDate: '',
    harvestEndDate: '',
    status: 'planned',
    notes: ''
  };
};

const onCropSelect = () => {
  if (!harvestForm.value.cropId) {
    return;
  }
  
  const selectedCrop = availableCrops.value.find(crop => crop.id === harvestForm.value.cropId);
  if (selectedCrop) {
    harvestForm.value.name = selectedCrop.name;
    harvestForm.value.category = selectedCrop.category;
    
    // Update harvest dates if planting date is set
    if (harvestForm.value.plantingDate) {
      updateHarvestDates();
    }
  }
};

const updateHarvestDates = () => {
  if (!harvestForm.value.cropId || !harvestForm.value.plantingDate) {
    return;
  }
  
  const selectedCrop = availableCrops.value.find(crop => crop.id === harvestForm.value.cropId);
  if (selectedCrop && selectedCrop.harvestTime) {
    const plantingDate = new Date(harvestForm.value.plantingDate);
    
    // Calculate harvest start date (planting date + harvest time)
    const harvestStartDate = new Date(plantingDate);
    harvestStartDate.setDate(plantingDate.getDate() + selectedCrop.harvestTime);
    
    // Calculate harvest end date (start date + harvest window)
    const harvestEndDate = new Date(harvestStartDate);
    harvestEndDate.setDate(harvestStartDate.getDate() + (selectedCrop.harvestWindow || 14));
    
    harvestForm.value.harvestStartDate = formatDateForInput(harvestStartDate);
    harvestForm.value.harvestEndDate = formatDateForInput(harvestEndDate);
  }
};

const saveHarvest = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    console.error('User not authenticated');
    return;
  }
  
  try {
    const harvestData = {
      cropId: harvestForm.value.cropId,
      name: harvestForm.value.name,
      plantingDate: Timestamp.fromDate(new Date(harvestForm.value.plantingDate)),
      harvestStartDate: Timestamp.fromDate(new Date(harvestForm.value.harvestStartDate)),
      harvestEndDate: Timestamp.fromDate(new Date(harvestForm.value.harvestEndDate)),
      status: harvestForm.value.status,
      notes: harvestForm.value.notes,
      sellerId: user.uid.trim()
    };
    
    if (editingHarvest.value) {
      // Update existing harvest
      const harvestRef = doc(db, 'sellerCrops', editingHarvest.value.id);
      await updateDoc(harvestRef, {
        ...harvestData,
        updatedAt: serverTimestamp()
      });
    } else {
      // Add new harvest
      await addDoc(collection(db, 'sellerCrops'), {
        ...harvestData,
        createdAt: serverTimestamp()
      });
    }
    
    // Refresh harvests
    await fetchSellerCrops();
    
    // Close modal and reset form
    showAddHarvestModal.value = false;
    editingHarvest.value = null;
    resetForm();
  } catch (error) {
    console.error('Error saving harvest:', error);
    alert('Failed to save crop. Please try again.');
  }
};

const deleteHarvest = async (harvestId) => {
  if (!confirm('Are you sure you want to delete this crop entry?')) {
    return;
  }
  
  try {
    await deleteDoc(doc(db, 'sellerCrops', harvestId));
    
    // Refresh harvests
    await fetchSellerCrops();
    
    // Close day detail if open
    if (showDayDetail.value) {
      showDayDetail.value = false;
    }
  } catch (error) {
    console.error('Error deleting crop:', error);
    alert('Failed to delete crop. Please try again.');
  }
};

// Helper functions
const formatDateForInput = (date) => {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
};

const formatDate = (dateValue) => {
  if (!dateValue) return '';
  
  const date = dateValue instanceof Date 
    ? dateValue 
    : dateValue.toDate();
  
  return new Intl.DateTimeFormat('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }).format(date);
};

const formatDay = (dateValue) => {
  if (!dateValue) return '';
  
  const date = dateValue instanceof Date 
    ? dateValue 
    : dateValue.toDate();
  
  return date.getDate();
};

const formatShortMonth = (dateValue) => {
  if (!dateValue) return '';
  
  const date = dateValue instanceof Date 
    ? dateValue 
    : dateValue.toDate();
  
  return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
};

const formatFullDate = (date) => {
  return new Intl.DateTimeFormat('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }).format(date);
};

const getCategoryColor = (category) => {
  const colors = {
    'Vegetables': '#4a8f4d',
    'Vegetable': '#4a8f4d',
    'Fruits': '#e05d44',
    'Fruit': '#e05d44',
    'Grains': '#f0ad4e',
    'Grain': '#f0ad4e',
    'Herbs': '#8a6d3b',
    'Herb': '#8a6d3b',
    'Unknown': '#777777'
  };
  
  return colors[category] || '#4a8f4d';
};

const getStatusClass = (harvest) => {
  const status = harvest.status ? harvest.status.toLowerCase().trim() : '';
  
  switch (status) {
    case 'planned':
      return 'planned';
    case 'in progress':
      return 'in-progress';
    case 'harvested':
      return 'harvested';
    case 'failed':
      return 'failed';
    default:
      return 'planned';
  }
};

// Watch for changes to refresh calendar
watch(sellerCrops, () => {
  // This will trigger a recalculation of calendarDays
}, { deep: true });

// Lifecycle hooks
onMounted(async () => {
  await Promise.all([
    fetchSellerCrops(),
    fetchAvailableCrops()
  ]);
});
</script>

<style scoped>
.calendar-container {
  background-color: #f9fafb;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.calendar-title h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 5px 0;
}

.calendar-title p {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
}

.calendar-actions {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.month-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: #fff;
  border-radius: 8px;
  padding: 5px 10px;
  border: 1px solid #e5e7eb;
}

.current-month {
  font-weight: 600;
  color: #111827;
  min-width: 120px;
  text-align: center;
}

.nav-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
}

.nav-btn:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.add-harvest-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  background-color: #2e5c31;
  color: #fff;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-harvest-btn:hover {
  background-color: #26492a;
}

.view-toggle {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.view-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  background-color: #fff;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-btn:hover {
  background-color: #f9fafb;
}

.view-btn.active {
  background-color: #2e5c31;
  color: #fff;
  border-color: #2e5c31;
}

/* Calendar View */
.calendar-view {
  background-color: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background-color: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
}

.day-header {
  padding: 10px;
  text-align: center;
  font-weight: 600;
  color: #6b7280;
  font-size: 0.9rem;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
}

.calendar-day {
  min-height: 100px;
  border-right: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  padding: 8px;
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.calendar-day:hover {
  background-color: #f9fafb;
}

.calendar-day.other-month {
  background-color: #f9fafb;
  color: #9ca3af;
}

.calendar-day.today {
  background-color: #f0fdf4;
}

.calendar-day.today .day-number {
  background-color: #2e5c31;
  color: #fff;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.day-number {
  font-weight: 600;
  color: #111827;
  margin-bottom: 5px;
}

.harvest-indicators {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 5px;
}

.harvest-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #4a8f4d;
}

.harvest-more {
  font-size: 0.7rem;
  color: #6b7280;
}

/* List View */
.list-view {
  background-color: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 20px;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.empty-state .add-harvest-btn {
  margin-top: 20px;
  display: inline-flex;
}

.harvest-timeline {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.harvest-month {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.month-heading {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  padding-bottom: 5px;
  border-bottom: 1px solid #e5e7eb;
}

.harvest-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  border-radius: 8px;
  background-color: #f9fafb;
  transition: all 0.2s ease;
}

.harvest-item:hover {
  background-color: #f3f4f6;
  transform: translateY(-2px);
}

.harvest-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 50px;
}

.date-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

.date-month {
  font-size: 0.8rem;
  color: #6b7280;
}

.harvest-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.harvest-crop-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  color: #fff;
  background-color: #4a8f4d;
  align-self: flex-start;
}

.harvest-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.harvest-details {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.harvest-detail {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.9rem;
  color: #6b7280;
}

.harvest-status {
  margin-top: 5px;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  align-self: flex-start;
  text-transform: capitalize;
}

.harvest-status.planned {
  background-color: #e0f2fe;
  color: #0ea5e9;
}

.harvest-status.in-progress {
  background-color: #fef3c7;
  color: #f59e0b;
}

.harvest-status.harvested {
  background-color: #dcfce7;
  color: #10b981;
}

.harvest-status.failed {
  background-color: #fee2e2;
  color: #ef4444;
}

.harvest-notes {
  margin-top: 5px;
  font-size: 0.9rem;
  color: #6b7280;
  background-color: #f3f4f6;
  padding: 8px;
  border-radius: 4px;
}

.harvest-actions {
  display: flex;
  gap: 5px;
  align-items: flex-start;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-btn {
  background-color: #f3f4f6;
  color: #4b5563;
}

.edit-btn:hover {
  background-color: #e5e7eb;
}

.delete-btn {
  background-color: #fee2e2;
  color: #ef4444;
}

.delete-btn:hover {
  background-color: #fecaca;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.day-detail-modal, .harvest-form-modal {
  background-color: #fff;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 5px;
}

.modal-content {
  padding: 20px;
}

.empty-harvests {
  text-align: center;
  padding: 20px 0;
  color: #6b7280;
}

.day-harvests {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.day-harvest-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  background-color: #f9fafb;
  align-items: center;
}

.day-harvest-details {
  flex: 1;
}

.day-harvest-details h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 5px 0;
}

.day-harvest-actions {
  display: flex;
  gap: 5px;
}

/* Form Styles */
.harvest-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-row {
  display: flex;
  gap: 15px;
}

.form-row .form-group {
  flex: 1;
}

.harvest-form label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
}

.harvest-form input, .harvest-form select, .harvest-form textarea {
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  font-size: 0.9rem;
  color: #111827;
  background-color: #fff;
}

.harvest-form input:focus, .harvest-form select:focus, .harvest-form textarea:focus {
  outline: none;
  border-color: #2e5c31;
  box-shadow: 0 0 0 2px rgba(46, 92, 49, 0.2);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

.cancel-btn, .save-btn {
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn {
  background-color: #f3f4f6;
  color: #4b5563;
  border: none;
}

.cancel-btn:hover {
  background-color: #e5e7eb;
}

.save-btn {
  background-color: #2e5c31;
  color: #fff;
  border: none;
}

.save-btn:hover {
  background-color: #26492a;
}

/* Responsive Styles */
@media (max-width: 768px) {
  .calendar-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .calendar-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .form-row {
    flex-direction: column;
    gap: 15px;
  }
  
  .calendar-day {
    min-height: 80px;
  }
}

@media (max-width: 576px) {
  .view-toggle {
    width: 100%;
  }
  
  .view-btn {
    flex: 1;
    justify-content: center;
  }
  
  .harvest-item {
    flex-direction: column;
  }
  
  .harvest-date {
    flex-direction: row;
    gap: 5px;
  }
}

/* Dark Mode Styles */
:global(.dark) .calendar-container {
  background-color: #1f2937;
}

:global(.dark) .calendar-title h1 {
  color: #f9fafb;
}

:global(.dark) .calendar-title p,
:global(.dark) .day-header {
  color: #9ca3af;
}

:global(.dark) .month-selector,
:global(.dark) .view-btn,
:global(.dark) .calendar-view,
:global(.dark) .list-view,
:global(.dark) .day-detail-modal,
:global(.dark) .harvest-form-modal {
  background-color: #1f2937;
  border-color: #374151;
}

:global(.dark) .current-month,
:global(.dark) .day-number,
:global(.dark) .month-heading,
:global(.dark) .harvest-name,
:global(.dark) .modal-header h3 {
  color: #f9fafb;
}

:global(.dark) .calendar-days {
  background-color: #111827;
}

:global(.dark) .calendar-day {
  border-color: #374151;
}

:global(.dark) .calendar-day.other-month {
  background-color: #111827;
}

:global(.dark) .calendar-day.today {
  background-color: rgba(46, 92, 49, 0.2);
}

:global(.dark) .harvest-item,
:global(.dark) .day-harvest-item {
  background-color: #111827;
}

:global(.dark) .harvest-item:hover {
  background-color: #374151;
}

:global(.dark) .harvest-form input,
:global(.dark) .harvest-form select,
:global(.dark) .harvest-form textarea {
  background-color: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}
</style>