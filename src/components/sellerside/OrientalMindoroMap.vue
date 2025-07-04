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
        style="height: 100%; width: 100%;"
      >
        <l-tile-layer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          layer-type="base"
          name="OpenStreetMap"
          :bounds="bounds"
        />
        
       <l-marker
          v-for="(municipality, index) in municipalityMarkers"
          :key="index"
          :lat-lng="municipality.coordinates"
          :icon="icon"
        >
          <l-popup>
            <div class="popup-content">
              <h4>{{ municipality.name }}</h4>
              <div class="info-item">
                <span class="info-label">Sellers covering this area:</span>
                <span class="info-value">{{ sellersByMunicipality[municipality.name]?.length || 0 }}</span>
              </div>
              <ul>
                <li v-for="seller in sellersByMunicipality[municipality.name]" :key="seller.id">
                  {{ seller.name || seller.id }}
                </li>
              </ul>
            </div>
          </l-popup>
        </l-marker>
      </l-map>
      <div v-if="municipalityMarkers.length === 0" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#888;">
        No delivery areas registered by sellers yet.
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
import { ref, computed, onMounted } from 'vue';
import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import "leaflet/dist/leaflet.css";
import { LMap, LTileLayer, LMarker, LPopup } from "@vue-leaflet/vue-leaflet";
import L from 'leaflet';

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
const currentSeller = ref(null);
const municipalityMarkers = ref([]);
const zoom = ref(10);
const center = ref([13.0, 121.5]);
const bounds = ref([
  [12.2, 120.8],
  [13.6, 121.6]
]);
const auth = getAuth();
const currentUserId = ref(null);

const municipalities = [
  { name: "Puerto Galera", coordinates: [13.5022, 120.9547] },
  { name: "San Teodoro", coordinates: [13.4333, 120.9167] },
  { name: "Baco", coordinates: [13.3578, 120.9739] },
  { name: "Calapan City", coordinates: [13.4117, 121.1803] },
  { name: "Naujan", coordinates: [13.3239, 121.3028] },
  { name: "Victoria", coordinates: [13.1778, 121.2778] },
  { name: "Socorro", coordinates: [13.0583, 121.4083] },
  { name: "Pola", coordinates: [13.1444, 121.4444] },
  { name: "Pinamalayan", coordinates: [13.0333, 121.4833] },
  { name: "Gloria", coordinates: [12.9833, 121.4667] },
  { name: "Bansud", coordinates: [12.8667, 121.4500] },
  { name: "Bongabong", coordinates: [12.7500, 121.4833] },
  { name: "Roxas", coordinates: [12.5833, 121.5167] },
  { name: "Mansalay", coordinates: [12.5167, 121.4333] },
  { name: "Bulalacao", coordinates: [12.3333, 121.3500] }
];

// Fetch current seller's delivery areas
const fetchCurrentSellerAreas = async (userId) => {
  loading.value = true;
  try {
    console.log('Fetching data for userId:', userId);
    
    // Get current seller's document using userId
    const sellersSnapshot = await getDocs(collection(db, "sellers"));
    let sellerDoc = null;
    
    sellersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.userId === userId) {
        sellerDoc = { id: doc.id, ...data };
      }
    });

    if (!sellerDoc) {
      console.log('No seller found for userId:', userId);
      municipalityMarkers.value = [];
      return;
    }

    currentSeller.value = sellerDoc;
    console.log('Found seller:', sellerDoc);

    // Get the seller's covered areas
    let areas = sellerDoc.deliveryInfo?.areasCovered;
    console.log('Seller areasCovered:', areas);

    const coveredAreas = new Set();
    
    if (Array.isArray(areas)) {
      areas.forEach(area => {
        if (typeof area === 'string') {
          const normalizedArea = area.trim().toLowerCase().replace(/\s+/g, ' ');
          coveredAreas.add(normalizedArea);
        }
      });
    } else if (areas && typeof areas === 'object') {
      Object.values(areas).forEach(area => {
        if (typeof area === 'string') {
          const normalizedArea = area.trim().toLowerCase().replace(/\s+/g, ' ');
          coveredAreas.add(normalizedArea);
        }
      });
    }

    console.log('Normalized covered areas:', Array.from(coveredAreas));

    // Filter municipalities to only those covered by current seller
    municipalityMarkers.value = municipalities.filter(municipality => {
      if (!municipality || !municipality.name || !municipality.coordinates) return false;
      const normalizedMuni = municipality.name.trim().toLowerCase().replace(/\s+/g, ' ');
      const isIncluded = coveredAreas.has(normalizedMuni);
      console.log(`Municipality ${municipality.name}: ${isIncluded ? 'INCLUDED' : 'excluded'}`);
      return isIncluded;
    });

    console.log('Final municipalityMarkers:', municipalityMarkers.value);
  } catch (error) {
    console.error("Error fetching seller areas:", error);
  } finally {
    loading.value = false;
  }
};

// Listen for authentication changes
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUserId.value = user.uid;
      console.log('User authenticated:', user.uid);
      fetchCurrentSellerAreas(user.uid);
    } else {
      console.log('No user authenticated');
      currentUserId.value = null;
      municipalityMarkers.value = [];
      loading.value = false;
    }
  });
});

// For popup info - show current seller info
const sellersByMunicipality = computed(() => {
  const map = {};
  if (!currentSeller.value) return map;
  
  municipalityMarkers.value.forEach(municipality => {
    // Since we're only showing current seller's areas, each municipality will have this seller
    map[municipality.name] = [currentSeller.value];
  });
  return map;
});

const topMunicipality = computed(() => {
  if (municipalityMarkers.value.length === 0) {
    return { name: 'N/A', count: 0 };
  }
  // Since we're only showing current seller's areas, all have count of 1
  return { 
    name: municipalityMarkers.value[0]?.name || 'N/A', 
    count: 1 
  };
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
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-shrink: 0;
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
  flex: 1;
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
  height: 320px; /* Match the chart container height */
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 15px;
  border: 1px solid #d1e5f0;
  flex: 1;
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
  flex-shrink: 0;
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
  font-weight: 500;
  color: #111827;
}

.leaflet-control-attribution {
  display: none !important;
}
.custom-attribution {
  text-align: center;
  font-size: 0.8em;
  color: #888;
  margin-top: -10px;
}

</style>