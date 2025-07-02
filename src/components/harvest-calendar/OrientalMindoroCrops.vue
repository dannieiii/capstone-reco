<template>
  <div class="crop-info-container">
    <div class="crop-info-header">
      <h1>Oriental Mindoro Crop Guide</h1>
      <p>Reference information for crops commonly grown in Oriental Mindoro, Philippines</p>
    </div>
    
    <div class="search-filter">
      <div class="search-box">
        <Search size="18" class="search-icon" />
        <input 
          type="text" 
          placeholder="Search crops..." 
          v-model="searchQuery"
        />
      </div>
      
      <div class="filter-buttons">
        <button 
          v-for="category in categories" 
          :key="category"
          :class="['filter-btn', { active: activeCategory === category }]"
          @click="setCategory(category)"
        >
          {{ category }}
        </button>
      </div>
    </div>
    
    <div class="crops-grid">
      <div v-if="isLoading" class="loading-state">Loading crop information...</div>
      
      <div v-else-if="filteredCrops.length === 0" class="empty-state">
        <p>No crops found matching your search.</p>
      </div>
      
      <div v-else class="crop-cards">
        <div v-for="crop in filteredCrops" :key="crop.id" class="crop-card">
          <div class="crop-header" :style="{ backgroundColor: getCategoryColor(crop.category) }">
            <h3>{{ crop.name }}</h3>
            <span class="crop-category">{{ crop.category }}</span>
          </div>
          
          <div class="crop-content">
            <div v-if="crop.image" class="crop-image">
              <img :src="crop.image" :alt="crop.name" />
            </div>
            
            <div class="crop-details">
              <div class="detail-item">
                <div class="detail-label">Region</div>
                <div class="detail-value">{{ crop.region || 'All regions' }}</div>
              </div>
              
              <div class="detail-item">
                <div class="detail-label">Soil Type</div>
                <div class="detail-value">{{ crop.soilType || 'Various' }}</div>
              </div>
              
              <div class="detail-item">
                <div class="detail-label">Sunlight</div>
                <div class="detail-value">{{ crop.sunlight || 'Full sun' }}</div>
              </div>
              
              <div class="detail-item">
                <div class="detail-label">Water Needs</div>
                <div class="detail-value">{{ crop.waterNeeds || 'Moderate' }}</div>
              </div>
              
              <div class="detail-item">
                <div class="detail-label">Planting Season</div>
                <div class="detail-value">
                  <div v-if="crop.plantingSeason && crop.plantingSeason.length > 0">
                    {{ crop.plantingSeason.join(', ') }}
                  </div>
                  <div v-else>Year-round</div>
                </div>
              </div>
              
              <div class="detail-item">
                <div class="detail-label">Days to Harvest</div>
                <div class="detail-value">{{ crop.harvestTime || 'Unknown' }} days</div>
              </div>
              
              <div class="detail-item">
                <div class="detail-label">Harvest Window</div>
                <div class="detail-value">{{ crop.harvestWindow || 'Unknown' }} days</div>
              </div>
            </div>
            
            <div class="crop-timeline">
              <div class="timeline-header">
                <span>Growth Timeline</span>
                <span>{{ crop.harvestTime || '90' }} days</span>
              </div>
              <div class="timeline-bar">
                <div class="timeline-progress" :style="{ width: '100%' }"></div>
                <div class="timeline-marker germination" :style="{ left: '10%' }">
                  <div class="marker-label">Germination</div>
                </div>
                <div class="timeline-marker growth" :style="{ left: '50%' }">
                  <div class="marker-label">Growth</div>
                </div>
                <div class="timeline-marker harvest" :style="{ left: '100%' }">
                  <div class="marker-label">Harvest</div>
                </div>
              </div>
            </div>
            
            <div class="crop-notes">
              <p>{{ crop.notes || 'No additional information available.' }}</p>
            </div>

            <div v-if="crop.growingTips && crop.growingTips.length > 0" class="growing-tips">
              <h4>Growing Tips</h4>
              <ul>
                <li v-for="(tip, index) in crop.growingTips" :key="index">{{ tip }}</li>
              </ul>
            </div>
            
            <button @click="addToCalendar(crop)" class="add-to-calendar-btn">
              <CalendarPlus size="16" />
              Add to Calendar
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Add to Calendar Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click="cancelAdd">
      <div class="add-calendar-modal" @click.stop>
        <div class="modal-header">
          <h3>Add {{ selectedCrop?.name }} to Calendar</h3>
          <button @click="cancelAdd" class="close-btn">
            <X size="18" />
          </button>
        </div>
        
        <div class="modal-content">
          <form @submit.prevent="saveToCalendar" class="add-calendar-form">
            <div class="form-group">
              <label for="plantingDate">Planting Date</label>
              <input 
                type="date" 
                id="plantingDate" 
                v-model="calendarForm.plantingDate"
                required
              />
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="harvestStartDate">Harvest Start Date (Estimated)</label>
                <input 
                  type="date" 
                  id="harvestStartDate" 
                  v-model="calendarForm.harvestStartDate"
                  required
                  disabled
                />
              </div>
              
              <div class="form-group">
                <label for="harvestEndDate">Harvest End Date (Estimated)</label>
                <input 
                  type="date" 
                  id="harvestEndDate" 
                  v-model="calendarForm.harvestEndDate"
                  required
                  disabled
                />
              </div>
            </div>
            
            <div class="form-group">
              <label for="status">Status</label>
              <select id="status" v-model="calendarForm.status" required>
                <option value="planned">Planned</option>
                <option value="in progress">In Progress</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="notes">Notes</label>
              <textarea 
                id="notes" 
                v-model="calendarForm.notes" 
                placeholder="Add any additional notes about this crop"
                rows="3"
              ></textarea>
            </div>
            
            <div class="form-actions">
              <button type="button" @click="cancelAdd" class="cancel-btn">Cancel</button>
              <button type="submit" class="save-btn">Add to Calendar</button>
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
  Search, 
  CalendarPlus, 
  X 
} from 'lucide-vue-next';
import { db } from '@/firebase/firebaseConfig';
import { 
  collection, 
  getDocs, 
  addDoc, 
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// State variables
const isLoading = ref(true);
const crops = ref([]);
const searchQuery = ref('');
const activeCategory = ref('All');
const showAddModal = ref(false);
const selectedCrop = ref(null);

// Calendar form
const calendarForm = ref({
  plantingDate: '',
  harvestStartDate: '',
  harvestEndDate: '',
  status: 'planned',
  notes: ''
});

// Categories
const categories = ref(['All']);

// Computed properties
const filteredCrops = computed(() => {
  return crops.value.filter(crop => {
    const matchesSearch = crop.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesCategory = activeCategory.value === 'All' || crop.category === activeCategory.value;
    
    return matchesSearch && matchesCategory;
  });
});

// Methods
const fetchCrops = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'crops'));
    
    const fetchedCrops = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    crops.value = fetchedCrops;
    
    // Extract unique categories
    const uniqueCategories = ['All', ...new Set(fetchedCrops.map(crop => crop.category).filter(Boolean))];
    categories.value = uniqueCategories;
  } catch (error) {
    console.error('Error fetching crops:', error);
  } finally {
    isLoading.value = false;
  }
};

const setCategory = (category) => {
  activeCategory.value = category;
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
    'Herb': '#8a6d3b'
  };
  
  return colors[category] || '#4a8f4d';
};

const addToCalendar = (crop) => {
  selectedCrop.value = crop;
  
  // Set default values
  const today = new Date();
  const plantingDate = today.toISOString().split('T')[0];
  
  // Calculate harvest dates based on crop data
  const harvestTime = crop.harvestTime || 90; // Default to 90 days if not specified
  const harvestWindow = crop.harvestWindow || 14; // Default to 14 days if not specified
  
  const harvestStartDate = new Date(today);
  harvestStartDate.setDate(today.getDate() + harvestTime);
  
  const harvestEndDate = new Date(harvestStartDate);
  harvestEndDate.setDate(harvestStartDate.getDate() + harvestWindow);
  
  calendarForm.value = {
    plantingDate: plantingDate,
    harvestStartDate: harvestStartDate.toISOString().split('T')[0],
    harvestEndDate: harvestEndDate.toISOString().split('T')[0],
    status: 'planned',
    notes: crop.notes || ''
  };
  
  showAddModal.value = true;
};

const cancelAdd = () => {
  showAddModal.value = false;
  selectedCrop.value = null;
};

const saveToCalendar = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    console.error('User not authenticated');
    return;
  }
  
  try {
    const harvestData = {
      cropId: selectedCrop.value.id,
      name: selectedCrop.value.name,
      plantingDate: Timestamp.fromDate(new Date(calendarForm.value.plantingDate)),
      harvestStartDate: Timestamp.fromDate(new Date(calendarForm.value.harvestStartDate)),
      harvestEndDate: Timestamp.fromDate(new Date(calendarForm.value.harvestEndDate)),
      status: calendarForm.value.status,
      notes: calendarForm.value.notes,
      sellerId: user.uid.trim(),
      createdAt: serverTimestamp()
    };
    
    await addDoc(collection(db, 'sellerCrops'), harvestData);
    
    // Close modal
    showAddModal.value = false;
    selectedCrop.value = null;
    
    // Show success message
    alert(`${selectedCrop.value.name} has been added to your harvest calendar.`);
  } catch (error) {
    console.error('Error saving to calendar:', error);
    alert('Failed to add to calendar. Please try again.');
  }
};

// Watch for planting date changes to update harvest dates
watch(() => calendarForm.value.plantingDate, (newDate) => {
  if (newDate && selectedCrop.value) {
    const plantDate = new Date(newDate);
    
    // Calculate harvest dates based on crop data
    const harvestTime = selectedCrop.value.harvestTime || 90; // Default to 90 days if not specified
    const harvestWindow = selectedCrop.value.harvestWindow || 14; // Default to 14 days if not specified
    
    const harvestStartDate = new Date(plantDate);
    harvestStartDate.setDate(plantDate.getDate() + harvestTime);
    
    const harvestEndDate = new Date(harvestStartDate);
    harvestEndDate.setDate(harvestStartDate.getDate() + harvestWindow);
    
    calendarForm.value.harvestStartDate = harvestStartDate.toISOString().split('T')[0];
    calendarForm.value.harvestEndDate = harvestEndDate.toISOString().split('T')[0];
  }
});

// Lifecycle hooks
onMounted(() => {
  fetchCrops();
});
</script>

<style scoped>
.crop-info-container {
  background-color: #f9fafb;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.crop-info-header {
  margin-bottom: 20px;
}

.crop-info-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 5px 0;
}

.crop-info-header p {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
}

.search-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
}

.search-box {
  display: flex;
  align-items: center;
  background-color: #fff;
  border-radius: 20px;
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  flex: 1;
  min-width: 200px;
}

.search-icon {
  color: #9ca3af;
  margin-right: 8px;
}

.search-box input {
  border: none;
  outline: none;
  width: 100%;
  font-size: 0.9rem;
}

.filter-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-btn {
  padding: 8px 16px;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  font-size: 0.9rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  background-color: #f9fafb;
}

.filter-btn.active {
  background-color: #2e5c31;
  color: #fff;
  border-color: #2e5c31;
}

.crops-grid {
  margin-top: 20px;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.crop-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.crop-card {
  background-color: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.crop-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.crop-header {
  padding: 15px;
  background-color: #4a8f4d;
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.crop-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.crop-category {
  font-size: 0.8rem;
  padding: 4px 8px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.crop-content {
  padding: 15px;
}

.crop-image {
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  background-color: #f3f4f6;
  border-radius: 6px;
  overflow: hidden;
}

.crop-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.crop-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 15px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.detail-label {
  font-size: 0.8rem;
  color: #6b7280;
}

.detail-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
}

.crop-timeline {
  margin-bottom: 15px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 5px;
}

.timeline-bar {
  height: 8px;
  background-color: #f3f4f6;
  border-radius: 4px;
  position: relative;
  margin-bottom: 20px;
}

.timeline-progress {
  height: 100%;
  background-color: #4a8f4d;
  border-radius: 4px;
}

.timeline-marker {
  position: absolute;
  top: -4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #fff;
  border: 2px solid #4a8f4d;
  transform: translateX(-50%);
}

.timeline-marker.germination {
  background-color: #f3f4f6;
}

.timeline-marker.growth {
  background-color: #d1fae5;
}

.timeline-marker.harvest {
  background-color: #4a8f4d;
  transform: translateX(-100%);
}

.marker-label {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.7rem;
  color: #6b7280;
  white-space: nowrap;
}

.crop-notes {
  background-color: #f9fafb;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 15px;
}

.crop-notes p {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
}

.growing-tips {
  background-color: #f0f9ff;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 15px;
  border-left: 4px solid #2e5c31;
}

.growing-tips h4 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 10px 0;
}

.growing-tips ul {
  margin: 0;
  padding-left: 20px;
}

.growing-tips li {
  font-size: 0.85rem;
  color: #374151;
  margin-bottom: 5px;
  line-height: 1.4;
}

.add-to-calendar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px;
  background-color: #2e5c31;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-to-calendar-btn:hover {
  background-color: #26492a;
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

.add-calendar-modal {
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

/* Form Styles */
.add-calendar-form {
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

.add-calendar-form label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
}

.add-calendar-form input, .add-calendar-form select, .add-calendar-form textarea {
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  font-size: 0.9rem;
  color: #111827;
  background-color: #fff;
}

.add-calendar-form input:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.add-calendar-form input:focus, .add-calendar-form select:focus, .add-calendar-form textarea:focus {
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
  .crop-details {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .form-row {
    flex-direction: column;
    gap: 15px;
  }
}

/* Dark Mode Styles */
:global(.dark) .crop-info-container {
  background-color: #1f2937;
}

:global(.dark) .crop-info-header h1 {
  color: #f9fafb;
}

:global(.dark) .crop-info-header p,
:global(.dark) .detail-label,
:global(.dark) .timeline-header,
:global(.dark) .marker-label,
:global(.dark) .crop-notes p {
  color: #9ca3af;
}

:global(.dark) .search-box,
:global(.dark) .filter-btn,
:global(.dark) .crop-card,
:global(.dark) .add-calendar-modal {
  background-color: #1f2937;
  border-color: #374151;
}

:global(.dark) .detail-value,
:global(.dark) .modal-header h3 {
  color: #f9fafb;
}

:global(.dark) .timeline-bar {
  background-color: #374151;
}

:global(.dark) .crop-notes,
:global(.dark) .crop-image {
  background-color: #111827;
}

:global(.dark) .add-calendar-form input,
:global(.dark) .add-calendar-form select,
:global(.dark) .add-calendar-form textarea {
  background-color: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}

:global(.dark) .add-calendar-form input:disabled {
  background-color: #1f2937;
}
</style>
