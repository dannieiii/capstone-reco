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
            @click="onMarkerClick(municipality)"
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

        <!-- Barangay customer markers: shown only when zoomed in and a municipality is active -->
        <template v-if="showBarangays">
          <l-marker
            v-for="(b, bIndex) in barangayMarkers"
            :key="'b-'+bIndex"
            :lat-lng="b.coordinates"
            :icon="barangayIcon"
          >
            <l-popup>
              <div class="popup-content">
                <h4>{{ b.barangay }} ({{ b.municipality }})</h4>
                <div class="info-item">
                  <span class="info-label">Customers:</span>
                  <span class="info-value">{{ b.users.length }}</span>
                </div>
                <ul>
                  <li v-for="u in b.users" :key="u.id">{{ u.name }}</li>
                </ul>
              </div>
            </l-popup>
          </l-marker>
        </template>
      </l-map>
      <div v-if="municipalityMarkers.length === 0" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#888;">
        No delivery areas registered by sellers yet.
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
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
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
  // Slightly smaller marker
  iconSize: [18, 30],
  iconAnchor: [9, 30],
  popupAnchor: [1, -24],
  shadowSize: [30, 30]
});

// Tiny green dot icon for barangay markers
const barangayIcon = L.divIcon({
  className: 'barangay-dot',
  html: '<div class="dot"></div>',
  iconSize: [10, 10],
  iconAnchor: [5, 5]
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
const mapInstance = ref(null);
// Barangay/customer state
const usersAddresses = ref([]); // { municipality, barangay, raw, userId, name }
const activeMunicipality = ref(null);
const barangayMarkers = ref([]); // markers for the active municipality
const BARANGAY_ZOOM = 12;
// Shared resize handler to keep map sized correctly
const handleResize = () => {
  if (mapInstance.value) {
    try { mapInstance.value.invalidateSize(); } catch (e) { /* noop */ }
  }
};

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

// Fetch users collection and extract addresses for Oriental Mindoro
const fetchUsersAddresses = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    const results = [];
    snapshot.forEach(d => {
      const data = d.data() || {};
      const uid = d.id;
      const displayName = data.firstName || data.name || data.email || uid;
      const role = String(data.role || '').toLowerCase();
      const isSellerFlag = typeof data.isSeller === 'boolean' ? data.isSeller : undefined;
      // Only include customers: role === 'customer'; or if role is missing, treat as customer when isSeller !== true
      const isCustomer = role === 'customer' || (role === '' && isSellerFlag !== true);
      if (!isCustomer) return;
      // Prefer structured addresses array if present
      if (Array.isArray(data.addresses) && data.addresses.length) {
        data.addresses.forEach(addr => {
          const province = (addr.province || addr.address || '').toLowerCase();
          if (province.includes('oriental mindoro')) {
            const barangay = (addr.barangay || '').trim();
            const municipality = (addr.municipality || '').trim();
            if (barangay && municipality) {
              results.push({ userId: uid, name: displayName, barangay, municipality, raw: addr.address || '' });
            }
          }
        });
      }
      // Fallback to single string address
      const single = (data.address || '').trim();
      if (single && single.toLowerCase().includes('oriental mindoro')) {
        const { barangay, municipality } = parseAddress(single);
        if (barangay && municipality) {
          results.push({ userId: uid, name: displayName, barangay, municipality, raw: single });
        }
      }
    });
    usersAddresses.value = results;
  } catch (e) {
    console.error('Error fetching users addresses:', e);
    usersAddresses.value = [];
  }
};

// Basic parser for strings like "Tawiran, Calapan, Oriental Mindoro"
const parseAddress = (str) => {
  const parts = String(str).split(',').map(s => s.trim()).filter(Boolean);
  // Heuristic: barangay first, municipality second
  let barangay = parts[0] || '';
  let municipality = parts[1] || '';
  // Normalize known variants
  barangay = normalizeName(barangay);
  municipality = normalizeName(municipality);
  return { barangay, municipality };
};

const normalizeName = (s) => (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ').replace(/\./g, '').replace(/ city$/,'');

// Deterministic pseudo position around a municipality center for a barangay name
const positionAround = (base, key) => {
  if (!Array.isArray(base) || base.length !== 2) return base;
  const seed = [...key].reduce((a,c) => (a*31 + c.charCodeAt(0))>>>0, 0);
  const angle = (seed % 360) * Math.PI/180;
  const minR = 0.005; // ~500-700m
  const maxR = 0.02;  // ~2km
  const r = minR + (seed % 1000)/1000 * (maxR - minR);
  const dLat = r * Math.cos(angle);
  const dLng = r * Math.sin(angle);
  return [base[0] + dLat, base[1] + dLng];
};

// Build barangay markers for the selected municipality
const buildBarangayMarkers = (municipalityName) => {
  const muniNorm = normalizeName(municipalityName);
  const muni = municipalities.find(m => normalizeName(m.name) === muniNorm);
  if (!muni) { barangayMarkers.value = []; return; }
  const grouped = new Map();
  usersAddresses.value.forEach(u => {
    if (normalizeName(u.municipality) === muniNorm) {
      const bKey = normalizeName(u.barangay);
      if (!grouped.has(bKey)) grouped.set(bKey, { name: u.barangay, users: [] });
      grouped.get(bKey).users.push({ id: u.userId, name: u.name });
    }
  });
  const list = [];
  grouped.forEach((val, key) => {
    const coords = positionAround(muni.coordinates, key);
    list.push({ barangay: val.name, municipality: muni.name, coordinates: coords, users: val.users });
  });
  barangayMarkers.value = list;
};

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
  // Ensure the map reflows on initial mount/resizes (especially on mobile)
  window.addEventListener('resize', handleResize);
  // Preload user addresses for barangay markers
  fetchUsersAddresses();
});

// Cleanup listener
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});

// Vue-Leaflet map ready hook: save instance and fix sizing
const onMapReady = (map) => {
  mapInstance.value = map;
  // Recalculate size after DOM/layout settles
  nextTick(() => {
    try { map.invalidateSize(); } catch (e) { /* noop */ }
  });
  setTimeout(() => {
    try { map.invalidateSize(); } catch (e) { /* noop */ }
  }, 200);
  // Keep local zoom in sync with actual map zoom
  try {
    map.on('zoomend', () => {
      try { zoom.value = map.getZoom(); } catch (e) { /* noop */ }
    });
  } catch (e) { /* noop */ }
};

// Zoom into a municipality when its marker is clicked
const onMarkerClick = (municipality) => {
  if (!municipality || !municipality.coordinates || !mapInstance.value) return;
  // Zoom in to level 12 (or keep current if closer) and center on the marker
  const targetZoom = Math.max(zoom.value, 13);
  try {
    mapInstance.value.flyTo(municipality.coordinates, targetZoom, { duration: 0.8 });
  } catch (e) { /* noop */ }
  activeMunicipality.value = municipality.name;
  buildBarangayMarkers(municipality.name);
};

// When loading finishes or markers change, reflow the map
watch(loading, (v) => {
  if (v === false && mapInstance.value) {
    nextTick(() => {
      try { mapInstance.value.invalidateSize(); } catch (e) { /* noop */ }
    });
  }
});
watch(() => municipalityMarkers.value.length, () => {
  if (mapInstance.value) {
    nextTick(() => {
      try { mapInstance.value.invalidateSize(); } catch (e) { /* noop */ }
    });
  }
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

// Only show barangay markers when focused and zoomed in
const showBarangays = computed(() => {
  const currentZoom = mapInstance.value ? (function(){ try { return mapInstance.value.getZoom(); } catch (e) { return zoom.value; } })() : zoom.value;
  return !!activeMunicipality.value && currentZoom >= BARANGAY_ZOOM;
});

// If addresses load after a municipality is already active, rebuild markers
watch(usersAddresses, () => {
  if (activeMunicipality.value) {
    buildBarangayMarkers(activeMunicipality.value);
  }
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
  /* Fix mobile visibility: enforce a reliable height and avoid flex shrink issues */
  height: 320px;
  min-height: 260px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 15px;
  border: 1px solid #d1e5f0;
  /* Prevent parent flex rules from collapsing the map on small screens */
  flex: 0 0 auto;
}

/* Fallback to guarantee Leaflet fills container */
.leaflet-container {
  width: 100% !important;
  height: 100% !important;
}

@media (max-width: 576px) {
  .map-container {
    height: 280px;
    min-height: 240px;
  }
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

/* Barangay tiny dot marker */
.barangay-dot .dot {
  width: 10px;
  height: 10px;
  background-color: #22c55e; /* green */
  border-radius: 50%;
  border: 2px solid white; /* halo for contrast */
  box-shadow: 0 0 2px rgba(0,0,0,0.4);
}

</style>