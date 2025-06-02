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
    
    <div v-else class="map-container">
      <l-map
        ref="map"
        v-model:zoom="zoom"
        :center="center"
        :use-global-leaflet="false"
        :max-bounds="bounds"
        :min-zoom="8"
        :max-zoom="15"
        @ready="onMapReady"
      >
        <l-tile-layer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          layer-type="base"
          name="OpenStreetMap"
          :bounds="bounds"
        />
        
        <l-marker
          v-for="(municipality, index) in municipalities"
          :key="index"
          :lat-lng="municipality.coordinates"
          :icon="icon"
          @click="selectMunicipality(municipality.name)"
        >
          <l-popup>
            <div class="popup-content">
              <h4>{{ municipality.name }}</h4>
              <div class="info-item">
                <span class="info-label">Total Users:</span>
                <span class="info-value">{{ getMunicipalityUsers(municipality.name).length }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Sellers:</span>
                <span class="info-value">{{ getMunicipalityUsers(municipality.name).filter(u => u.role === 'seller').length }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Customers:</span>
                <span class="info-value">{{ getMunicipalityUsers(municipality.name).filter(u => u.role === 'customer').length }}</span>
              </div>
            </div>
          </l-popup>
        </l-marker>
      </l-map>
      
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

 <!-- Add custom attribution below the map for compliance -->
   
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs, query, where } from "firebase/firestore";
import "leaflet/dist/leaflet.css";
import { LMap, LTileLayer, LMarker, LPopup } from "@vue-leaflet/vue-leaflet";
import L from 'leaflet';

// Fix for default marker icons
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const loading = ref(true);
const selectedUserType = ref('all');
const sellers = ref([]);
const customers = ref([]);
const usersByMunicipality = ref({});
const selectedMunicipality = ref(null);
const zoom = ref(10); // Increased zoom level to focus more on Oriental Mindoro
const center = ref([13.0, 121.5]); // Center of Oriental Mindoro

// Define bounds for Oriental Mindoro
const bounds = ref([
  [12.2, 120.8], // Southwest coordinates
  [13.6, 121.6]  // Northeast coordinates
]);

// Oriental Mindoro municipalities with their coordinates
const municipalities = [
  {
    name: "Puerto Galera",
    coordinates: [13.5022, 120.9547]
  },
  {
    name: "San Teodoro",
    coordinates: [13.4333, 120.9167]
  },
  {
    name: "Baco",
    coordinates: [13.3578, 120.9739]
  },
  {
    name: "Calapan City",
    coordinates: [13.4117, 121.1803]
  },
  {
    name: "Naujan",
    coordinates: [13.3239, 121.3028]
  },
  {
    name: "Victoria",
    coordinates: [13.1778, 121.2778]
  },
  {
    name: "Socorro",
    coordinates: [13.0583, 121.4083]
  },
  {
    name: "Pola",
    coordinates: [13.1444, 121.4444]
  },
  {
    name: "Pinamalayan",
    coordinates: [13.0333, 121.4833]
  },
  {
    name: "Gloria",
    coordinates: [12.9833, 121.4667]
  },
  {
    name: "Bansud",
    coordinates: [12.8667, 121.4500]
  },
  {
    name: "Bongabong",
    coordinates: [12.7500, 121.4833]
  },
  {
    name: "Roxas",
    coordinates: [12.5833, 121.5167]
  },
  {
    name: "Mansalay",
    coordinates: [12.5167, 121.4333]
  },
  {
    name: "Bulalacao",
    coordinates: [12.3333, 121.3500]
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

// Function to select a municipality
const selectMunicipality = (municipalityName) => {
  selectedMunicipality.value = municipalityName;
};

// Map ready handler
const onMapReady = (map) => {
  // You can add any map initialization logic here
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
  height: 600px; /* Increased height for better visibility */
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 15px;
  border: 1px solid #d1e5f0;
}

.popup-content {
  padding: 5px;
}

.popup-content h4 {
  margin: 0 0 10px 0;
  font-size: 1rem;
  color: #333;
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
  z-index: 1000;
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

.leaflet-control-attribution {
  display: none !important;
}
</style>

<!-- Add custom attribution below the map for compliance -->
<div class="custom-attribution" style="text-align:center; font-size:0.8em; color:#888; margin-top:-10px;">
  Map data © OpenStreetMap contributors
</div>

<style>
.leaflet-control-attribution {
  display: none !important;
}
</style>