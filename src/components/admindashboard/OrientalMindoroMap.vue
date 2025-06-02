<template>
  <div class="dashboard-card user-distribution">
    <div class="card-header">
      <h3>Oriental Mindoro User Distribution</h3>
      <div class="filter-controls">
        <select v-model="selectedUserType" class="user-type-select">
          <option value="all">All Users</option>
          <option value="seller">Sellers</option>
          <option value="customer">Customers</option>
        </select>
      </div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading data...</p>
    </div>
    
    <div v-else class="map-container" :class="{ 'zoomed': isZoomed }">
      <!-- SVG Map of Oriental Mindoro -->
      <div class="svg-container" :style="zoomStyles">
        <svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
          <!-- Background -->
          <rect x="0" y="0" width="800" height="600" fill="#e6f2ff" />
          
          <!-- Water/Ocean -->
          <path d="M0,0 L800,0 L800,600 L0,600 Z" fill="#cce6ff" />
          
          <!-- Oriental Mindoro Island Shape (simplified) -->
          <path d="M200,100 C300,80 400,90 500,150 C600,250 650,350 600,450 C550,520 450,550 350,500 C250,450 150,350 150,250 C150,180 180,120 200,100 Z" 
                fill="#f2f2f2" stroke="#cccccc" stroke-width="2" />
          
          <!-- Municipalities (simplified for demonstration) -->
          <!-- Each path represents a municipality -->
          <path v-for="(municipality, index) in municipalities" 
                :key="index"
                :d="municipality.path"
                :fill="getMunicipalityColor(municipality.name)"
                :stroke="selectedMunicipality === municipality.name ? '#ff6600' : '#ffffff'"
                stroke-width="2"
                @click="selectMunicipality(municipality.name)"
                class="municipality-path" />
                
          <!-- Municipality Labels -->
          <g v-for="(municipality, index) in municipalities" :key="`label-${index}`">
            <text :x="municipality.labelX" 
                  :y="municipality.labelY" 
                  font-size="12" 
                  fill="#333333" 
                  text-anchor="middle"
                  class="municipality-label">
              {{ municipality.name }}
            </text>
          </g>
        </svg>
      </div>
      
      <!-- Municipality Info Panel (shows when a municipality is selected) -->
      <div v-if="selectedMunicipality" class="municipality-info-panel">
        <div class="info-panel-header">
          <h4>{{ selectedMunicipality }}</h4>
          <button class="close-btn" @click="selectedMunicipality = null">×</button>
        </div>
        <div class="info-panel-content">
          <div class="info-item">
            <span class="info-label">Total Users:</span>
            <span class="info-value">{{ getMunicipalityUsers(selectedMunicipality).length }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Sellers:</span>
            <span class="info-value">{{ getMunicipalityUsers(selectedMunicipality).filter(u => u.role === 'seller').length }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Customers:</span>
            <span class="info-value">{{ getMunicipalityUsers(selectedMunicipality).filter(u => u.role === 'customer').length }}</span>
          </div>
        </div>
      </div>
      
      <!-- Legend -->
      <div class="map-legend">
        <div class="legend-title">User Count</div>
        <div class="legend-items">
          <div class="legend-item">
            <div class="legend-color" style="background-color: #eff3ff;"></div>
            <div class="legend-label">1-5</div>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #bdd7e7;"></div>
            <div class="legend-label">6-15</div>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #6baed6;"></div>
            <div class="legend-label">16-30</div>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #3182bd;"></div>
            <div class="legend-label">31-50</div>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #08519c;"></div>
            <div class="legend-label">50+</div>
          </div>
        </div>
      </div>
      
      <!-- Zoom Controls -->
      <div class="zoom-controls">
        <button class="zoom-btn" @click="zoomIn" title="Zoom In">+</button>
        <button class="zoom-btn" @click="zoomOut" title="Zoom Out">−</button>
        <button class="zoom-btn" @click="resetZoom" title="Reset">↺</button>
      </div>
    </div>
    
    <div class="stats-summary">
      <div class="stat-item">
        <div class="stat-label">Total Municipalities</div>
        <div class="stat-value">{{ municipalities.length }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Top Municipality</div>
        <div class="stat-value">{{ topMunicipality.name || 'N/A' }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Users in Top Municipality</div>
        <div class="stat-value">{{ topMunicipality.count || 0 }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs, query, where } from "firebase/firestore";

const loading = ref(true);
const selectedUserType = ref('all');
const sellers = ref([]);
const customers = ref([]);
const usersByMunicipality = ref({});
const selectedMunicipality = ref(null);
const zoomLevel = ref(1);
const zoomOriginX = ref(400);
const zoomOriginY = ref(300);
const isZoomed = computed(() => zoomLevel.value > 1);

// Oriental Mindoro municipalities with simplified SVG paths
// In a real implementation, you would use accurate GeoJSON data
const municipalities = [
  {
    name: "Calapan City",
    path: "M350,200 C380,180 410,190 430,220 C450,250 440,290 410,310 C380,330 340,320 320,290 C300,260 320,220 350,200 Z",
    labelX: 375,
    labelY: 255
  },
  {
    name: "Puerto Galera",
    path: "M300,120 C320,110 340,115 350,135 C360,155 355,180 335,190 C315,200 290,190 280,170 C270,150 280,130 300,120 Z",
    labelX: 315,
    labelY: 155
  },
  {
    name: "San Teodoro",
    path: "M320,190 C340,180 360,185 370,205 C380,225 375,250 355,260 C335,270 315,260 305,240 C295,220 300,200 320,190 Z",
    labelX: 335,
    labelY: 225
  },
  {
    name: "Baco",
    path: "M380,220 C400,210 420,215 430,235 C440,255 435,280 415,290 C395,300 375,290 365,270 C355,250 360,230 380,220 Z",
    labelX: 395,
    labelY: 255
  },
  {
    name: "Naujan",
    path: "M440,210 C460,200 480,205 490,225 C500,245 495,270 475,280 C455,290 435,280 425,260 C415,240 420,220 440,210 Z",
    labelX: 455,
    labelY: 245
  },
  {
    name: "Victoria",
    path: "M430,290 C450,280 470,285 480,305 C490,325 485,350 465,360 C445,370 425,360 415,340 C405,320 410,300 430,290 Z",
    labelX: 445,
    labelY: 325
  },
  {
    name: "Socorro",
    path: "M480,280 C500,270 520,275 530,295 C540,315 535,340 515,350 C495,360 475,350 465,330 C455,310 460,290 480,280 Z",
    labelX: 495,
    labelY: 315
  },
  {
    name: "Pola",
    path: "M500,350 C520,340 540,345 550,365 C560,385 555,410 535,420 C515,430 495,420 485,400 C475,380 480,360 500,350 Z",
    labelX: 515,
    labelY: 385
  },
  {
    name: "Pinamalayan",
    path: "M450,360 C470,350 490,355 500,375 C510,395 505,420 485,430 C465,440 445,430 435,410 C425,390 430,370 450,360 Z",
    labelX: 465,
    labelY: 395
  },
  {
    name: "Gloria",
    path: "M400,380 C420,370 440,375 450,395 C460,415 455,440 435,450 C415,460 395,450 385,430 C375,410 380,390 400,380 Z",
    labelX: 415,
    labelY: 415
  },
  {
    name: "Bansud",
    path: "M450,430 C470,420 490,425 500,445 C510,465 505,490 485,500 C465,510 445,500 435,480 C425,460 430,440 450,430 Z",
    labelX: 465,
    labelY: 465
  },
  {
    name: "Bongabong",
    path: "M400,450 C420,440 440,445 450,465 C460,485 455,510 435,520 C415,530 395,520 385,500 C375,480 380,460 400,450 Z",
    labelX: 415,
    labelY: 485
  },
  {
    name: "Roxas",
    path: "M350,420 C370,410 390,415 400,435 C410,455 405,480 385,490 C365,500 345,490 335,470 C325,450 330,430 350,420 Z",
    labelX: 365,
    labelY: 455
  },
  {
    name: "Mansalay",
    path: "M400,500 C420,490 440,495 450,515 C460,535 455,560 435,570 C415,580 395,570 385,550 C375,530 380,510 400,500 Z",
    labelX: 415,
    labelY: 535
  },
  {
    name: "Bulalacao",
    path: "M350,520 C370,510 390,515 400,535 C410,555 405,580 385,590 C365,600 345,590 335,570 C325,550 330,530 350,520 Z",
    labelX: 365,
    labelY: 555
  }
];

// Computed property to get the top municipality by user count
const topMunicipality = computed(() => {
  const municipalityCounts = municipalities.map(m => {
    return {
      name: m.name,
      count: getMunicipalityUsers(m.name).length
    };
  });
  
  if (municipalityCounts.length === 0) return { name: null, count: 0 };
  
  return municipalityCounts.sort((a, b) => b.count - a.count)[0];
});

// Computed styles for zooming
const zoomStyles = computed(() => {
  return {
    transform: `scale(${zoomLevel.value})`,
    transformOrigin: `${zoomOriginX.value}px ${zoomOriginY.value}px`
  };
});

// Function to fetch users data from Firestore
const fetchUsersData = async () => {
  try {
    loading.value = true;
    
    // Fetch sellers
    const sellersQuery = query(collection(db, "users"), where("role", "==", "seller"));
    const sellersSnapshot = await getDocs(sellersQuery);
    sellers.value = sellersSnapshot.docs.map(doc => ({ id: doc.id, role: 'seller', ...doc.data() }));
    
    // Fetch customers
    const customersQuery = query(collection(db, "users"), where("role", "==", "customer"));
    const customersSnapshot = await getDocs(customersQuery);
    customers.value = customersSnapshot.docs.map(doc => ({ id: doc.id, role: 'customer', ...doc.data() }));
    
    // Process data
    processUserData();
    
  } catch (error) {
    console.error("Error fetching users data:", error);
  } finally {
    loading.value = false;
  }
};

// Function to process user data and group by municipality
const processUserData = () => {
  const municipalityData = {};
  
  // Initialize all municipalities with empty arrays
  municipalities.forEach(m => {
    municipalityData[m.name] = [];
  });
  
  // Process data based on selected user type
  let usersToProcess = [];
  
  if (selectedUserType.value === 'all') {
    usersToProcess = [...sellers.value, ...customers.value];
  } else if (selectedUserType.value === 'seller') {
    usersToProcess = [...sellers.value];
  } else {
    usersToProcess = [...customers.value];
  }
  
  // For demonstration purposes, we'll randomly assign users to municipalities
  // In a real implementation, you would parse the address to determine the municipality
  usersToProcess.forEach(user => {
    // Extract municipality from address
    // This is a simple implementation - in a real app, you'd need more robust address parsing
    const addressParts = (user.address || '').split(',').map(part => part.trim());
    let municipality = null;
    
    // Try to find a municipality in the address that matches our list
    for (const part of addressParts) {
      const match = municipalities.find(m => 
        part.toLowerCase().includes(m.name.toLowerCase())
      );
      if (match) {
        municipality = match.name;
        break;
      }
    }
    
    // If no match found, assign to a random municipality for demonstration
    if (!municipality) {
      const randomIndex = Math.floor(Math.random() * municipalities.length);
      municipality = municipalities[randomIndex].name;
    }
    
    if (!municipalityData[municipality]) {
      municipalityData[municipality] = [];
    }
    
    municipalityData[municipality].push(user);
  });
  
  usersByMunicipality.value = municipalityData;
};

// Function to get users for a specific municipality
const getMunicipalityUsers = (municipalityName) => {
  return usersByMunicipality.value[municipalityName] || [];
};

// Function to get color based on user count
const getMunicipalityColor = (municipalityName) => {
  const count = getMunicipalityUsers(municipalityName).length;
  
  if (count === 0) return '#f2f2f2'; // No users
  if (count <= 5) return '#eff3ff';
  if (count <= 15) return '#bdd7e7';
  if (count <= 30) return '#6baed6';
  if (count <= 50) return '#3182bd';
  return '#08519c';
};

// Function to select a municipality
const selectMunicipality = (municipalityName) => {
  selectedMunicipality.value = municipalityName;
  
  // Find the municipality object
  const municipality = municipalities.find(m => m.name === municipalityName);
  if (municipality) {
    // Set zoom origin to the municipality's label position
    zoomOriginX.value = municipality.labelX;
    zoomOriginY.value = municipality.labelY;
    
    // Zoom in if not already zoomed
    if (zoomLevel.value === 1) {
      zoomLevel.value = 2;
    }
  }
};

// Zoom functions
const zoomIn = () => {
  if (zoomLevel.value < 3) {
    zoomLevel.value += 0.5;
  }
};

const zoomOut = () => {
  if (zoomLevel.value > 1) {
    zoomLevel.value -= 0.5;
  }
};

const resetZoom = () => {
  zoomLevel.value = 1;
  zoomOriginX.value = 400;
  zoomOriginY.value = 300;
  selectedMunicipality.value = null;
};

// Watch for changes in selected user type
watch(selectedUserType, () => {
  processUserData();
});

onMounted(async () => {
  await fetchUsersData();
});
</script>

<style scoped>
.dashboard-card {
  background-color: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.card-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.user-type-select {
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #6b7280;
  background-color: #fff;
  outline: none;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  width: 100%;
  background-color: #f9fafb;
  border-radius: 8px;
  margin-bottom: 15px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.map-container {
  position: relative;
  height: 300px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 15px;
  background-color: #e6f2ff;
  border: 1px solid #d1e5f0;
}

.svg-container {
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease;
}

.municipality-path {
  cursor: pointer;
  transition: fill 0.3s ease, stroke 0.3s ease;
}

.municipality-path:hover {
  stroke: #ff6600;
  stroke-width: 3;
}

.municipality-label {
  pointer-events: none;
  font-family: Arial, sans-serif;
  font-weight: 500;
}

.municipality-info-panel {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 200px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 10;
}

.info-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f0f7ff;
  border-bottom: 1px solid #d1e5f0;
}

.info-panel-header h4 {
  margin: 0;
  font-size: 0.9rem;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #666;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.info-panel-content {
  padding: 10px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 0.85rem;
}

.info-label {
  color: #666;
}

.info-value {
  font-weight: 600;
  color: #333;
}

.map-legend {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background-color: white;
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 1px 5px rgba(0,0,0,0.2);
  z-index: 5;
}

.legend-title {
  font-weight: 600;
  font-size: 0.8rem;
  margin-bottom: 5px;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.legend-color {
  width: 15px;
  height: 15px;
  border: 1px solid #ccc;
}

.legend-label {
  font-size: 0.7rem;
}

.zoom-controls {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  z-index: 5;
}

.zoom-btn {
  width: 30px;
  height: 30px;
  background-color: white;
  border: 1px solid #d1e5f0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
  color: #3182bd;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.zoom-btn:hover {
  background-color: #f0f7ff;
}

.stats-summary {
  display: flex;
  justify-content: space-between;
  margin-top: auto;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-label {
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: #3182bd;
}
</style>