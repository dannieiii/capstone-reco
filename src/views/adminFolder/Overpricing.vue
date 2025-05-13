<template>
    <div class="overpricing-monitoring">
      <div class="header">
        <h1>Overpricing Monitoring</h1>
        <p>Monitor and manage farms that overprice their products</p>
      </div>
  
      <div class="controls">
        <div class="filter-group">
          <label>Filter by Status</label>
          <select v-model="selectedStatus" @change="applyFilters">
            <option value="">All Statuses</option>
            <option v-for="status in statusOptions" :key="status.value" :value="status.value">
              {{ status.label }}
            </option>
          </select>
        </div>
        
        <div class="search-container">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Search farms..." 
            @input="applyFilters"
          />
          <i class="fas fa-search"></i>
        </div>
      </div>
  
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Farm Name</th>
              <th>Average Price Difference</th>
              <th>Overpricing Count</th>
              <th>Status</th>
              <th>Last Warning</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="farm in filteredFarms" :key="farm.id">
              <td>
                <div class="farm-cell">
                  <div class="farm-image" :style="{ backgroundImage: `url(${getImageUrl(farm.image)})` }"></div>
                  <span>{{ farm.name }}</span>
                </div>
              </td>
              <td :class="getPriceDiffClass(farm.avgPriceDiff)">
                {{ formatPriceDiff(farm.avgPriceDiff) }}
              </td>
              <td>{{ farm.overpricingCount }}</td>
              <td>
                <span class="status-badge" :class="farm.status.toLowerCase()">
                  {{ farm.status }}
                </span>
              </td>
              <td>
                {{ farm.lastWarning || 'Never' }}
              </td>
              <td>
                <div class="action-buttons">
                  <button 
                    class="action-btn warning-btn" 
                    @click="sendWarning(farm)"
                    :disabled="farm.status === 'Banned'"
                  >
                    <i class="fas fa-exclamation-triangle"></i> Warning
                  </button>
                  <button 
                    class="action-btn ban-btn" 
                    @click="toggleBan(farm)"
                    :class="{ 'unban-btn': farm.status === 'Banned' }"
                  >
                    <i :class="farm.status === 'Banned' ? 'fas fa-undo' : 'fas fa-ban'"></i>
                    {{ farm.status === 'Banned' ? 'Unban' : 'Ban' }}
                  </button>
                  <button class="action-btn view-btn" @click="viewFarmDetails(farm)">
                    <i class="fas fa-eye"></i> Details
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
  
      <div class="pagination">
        <button 
          :disabled="currentPage === 1" 
          @click="changePage(currentPage - 1)"
          class="pagination-btn"
        >
          <i class="fas fa-chevron-left"></i> Previous
        </button>
        <div class="page-info">
          Page {{ currentPage }} of {{ totalPages }}
        </div>
        <button 
          :disabled="currentPage === totalPages" 
          @click="changePage(currentPage + 1)"
          class="pagination-btn"
        >
          Next <i class="fas fa-chevron-right"></i>
        </button>
      </div>
  
      <!-- Warning Modal -->
      <div v-if="showWarningModal" class="modal-overlay" @click="closeWarningModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>Send Warning to {{ selectedFarm?.name }}</h2>
            <button class="close-btn" @click="closeWarningModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Warning Type</label>
              <select v-model="warningType">
                <option v-for="type in warningTypes" :key="type.value" :value="type.value">
                  {{ type.label }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Warning Message</label>
              <textarea v-model="warningMessage" placeholder="Enter warning message..."></textarea>
            </div>
            <div class="modal-actions">
              <button class="secondary-btn" @click="closeWarningModal">
                Cancel
              </button>
              <button class="primary-btn" @click="confirmSendWarning">
                <i class="fas fa-paper-plane"></i> Send Warning
              </button>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Farm Details Modal -->
      <div v-if="showFarmModal" class="modal-overlay" @click="closeFarmModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>Farm Details - {{ selectedFarm?.name }}</h2>
            <button class="close-btn" @click="closeFarmModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body" v-if="selectedFarm">
            <div class="farm-details">
              <div class="farm-image-large" :style="{ backgroundImage: `url(${getImageUrl(selectedFarm.image)})` }"></div>
              <div class="farm-info">
                <h3>{{ selectedFarm.name }}</h3>
                <div class="farm-meta">
                  <div class="meta-item">
                    <span class="meta-label">Status:</span>
                    <span class="meta-value status-badge" :class="selectedFarm.status.toLowerCase()">
                      {{ selectedFarm.status }}
                    </span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Overpricing Count:</span>
                    <span class="meta-value">{{ selectedFarm.overpricingCount }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Average Price Difference:</span>
                    <span class="meta-value" :class="getPriceDiffClass(selectedFarm.avgPriceDiff)">
                      {{ formatPriceDiff(selectedFarm.avgPriceDiff) }}
                    </span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Last Warning:</span>
                    <span class="meta-value">{{ selectedFarm.lastWarning || 'Never' }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="section-title">
              <h3>Overpriced Products</h3>
              <span class="badge">{{ selectedFarm.overpricedProducts.length }}</span>
            </div>
            
            <div class="products-table">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Market Price</th>
                    <th>Farm Price</th>
                    <th>Difference</th>
                    <th>Date Reported</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(product, index) in selectedFarm.overpricedProducts" :key="index">
                    <td>{{ product.name }}</td>
                    <td>₱{{ product.marketPrice.toFixed(2) }}</td>
                    <td>₱{{ product.farmPrice.toFixed(2) }}</td>
                    <td :class="getPriceDiffClass(product.difference)">
                      {{ formatPriceDiff(product.difference) }}
                    </td>
                    <td>{{ formatDate(product.dateReported) }}</td>
                  </tr>
                  <tr v-if="selectedFarm.overpricedProducts.length === 0">
                    <td colspan="5" class="text-center">No overpriced products found</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="section-title">
              <h3>Warning History</h3>
              <span class="badge">{{ selectedFarm.warningHistory.length }}</span>
            </div>
            
            <div class="warning-history">
              <div v-for="(warning, index) in selectedFarm.warningHistory" :key="index" class="warning-item">
                <div class="warning-header">
                  <span class="warning-type">{{ warning.type }}</span>
                  <span class="warning-date">{{ formatDate(warning.date) }}</span>
                </div>
                <p class="warning-message">{{ warning.message }}</p>
                <div class="warning-admin">
                  Sent by: {{ warning.admin || 'System' }}
                </div>
              </div>
              <div v-if="selectedFarm.warningHistory.length === 0" class="no-warnings">
                No warnings have been sent to this farm
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted, computed } from 'vue';
  import { db } from '@/firebase/firebaseConfig';
  import { collection, getDocs, doc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore";
  import { getAuth } from "firebase/auth";
  
  export default {
    setup() {
      const auth = getAuth();
      const farms = ref([]);
      const selectedStatus = ref('');
      const searchQuery = ref('');
      const currentPage = ref(1);
      const itemsPerPage = ref(10);
      const showWarningModal = ref(false);
      const showFarmModal = ref(false);
      const selectedFarm = ref(null);
      const warningType = ref('first');
      const warningMessage = ref('');
  
      // Status options for filtering
      const statusOptions = [
        { label: 'Active', value: 'Active' },
        { label: 'Warning', value: 'Warning' },
        { label: 'Final Warning', value: 'Final Warning' },
        { label: 'Banned', value: 'Banned' }
      ];
  
      // Warning types
      const warningTypes = [
        { label: 'First Warning', value: 'first' },
        { label: 'Final Warning', value: 'final' },
        { label: 'Notice of Suspension', value: 'suspension' }
      ];
  
      // Fetch farms data from Firebase
      const fetchFarms = async () => {
        try {
          const farmsSnapshot = await getDocs(collection(db, 'farms'));
          const farmsData = [];
          
          farmsSnapshot.forEach((doc) => {
            const farmData = doc.data();
            farmsData.push({
              id: doc.id,
              ...farmData,
              // Ensure these fields exist in your Firestore documents
              overpricingCount: farmData.overpricingCount || 0,
              status: farmData.status || 'Active',
              lastWarning: farmData.lastWarning || null,
              warningHistory: farmData.warningHistory || [],
              overpricedProducts: farmData.overpricedProducts || [],
              avgPriceDiff: farmData.avgPriceDiff || 0
            });
          });
          
          farms.value = farmsData;
        } catch (error) {
          console.error("Error fetching farms:", error);
        }
      };
  
      // Apply filters to farms list
      const filteredFarms = computed(() => {
        let result = [...farms.value];
        
        // Apply status filter
        if (selectedStatus.value) {
          result = result.filter(farm => farm.status === selectedStatus.value);
        }
        
        // Apply search filter
        if (searchQuery.value) {
          const query = searchQuery.value.toLowerCase();
          result = result.filter(farm => 
            farm.name.toLowerCase().includes(query)
          );
        }
        
        // Sort by overpricing count (highest first)
        result.sort((a, b) => b.overpricingCount - a.overpricingCount);
        
        return result;
      });
  
      // Pagination
      const totalPages = computed(() => {
        return Math.ceil(filteredFarms.value.length / itemsPerPage.value);
      });
  
      const paginatedFarms = computed(() => {
        const startIndex = (currentPage.value - 1) * itemsPerPage.value;
        const endIndex = startIndex + itemsPerPage.value;
        return filteredFarms.value.slice(startIndex, endIndex);
      });
  
      // Helper functions
      const getImageUrl = (imageData) => {
        if (!imageData) return '/placeholder-farm.png';
        if (imageData.startsWith('http')) return imageData;
        if (imageData.startsWith('data:image')) return imageData;
        return '/placeholder-farm.png';
      };
  
      const formatPriceDiff = (diff) => {
        if (diff === undefined || diff === null) return 'N/A';
        return diff > 0 ? `+${diff.toFixed(2)}%` : `${diff.toFixed(2)}%`;
      };
  
      const getPriceDiffClass = (diff) => {
        if (diff === undefined || diff === null) return '';
        if (diff > 10) return 'price-high';
        if (diff > 5) return 'price-medium';
        return 'price-low';
      };
  
      const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        
        if (dateString instanceof Timestamp) {
          const date = dateString.toDate();
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      };
  
      // Action functions
      const sendWarning = (farm) => {
        selectedFarm.value = farm;
        warningType.value = 'first';
        warningMessage.value = '';
        
        // Set appropriate default message based on farm status
        if (farm.status === 'Warning') {
          warningType.value = 'final';
          warningMessage.value = `This is a FINAL WARNING regarding your pricing practices. Our system has detected ${farm.overpricingCount} instances of overpricing. Please adjust your prices to match market rates or face potential suspension.`;
        } else {
          warningMessage.value = `We've detected ${farm.overpricingCount} instances of overpricing. Please review your pricing to match market rates.`;
        }
        
        showWarningModal.value = true;
      };
  
      const confirmSendWarning = async () => {
        if (!selectedFarm.value || !warningMessage.value) return;
        
        try {
          const farmRef = doc(db, 'farms', selectedFarm.value.id);
          const admin = auth.currentUser?.displayName || 'Admin';
          const newStatus = warningType.value === 'final' ? 'Final Warning' : 
                           warningType.value === 'suspension' ? 'Banned' : 'Warning';
          
          const warningData = {
            type: warningType.value === 'first' ? 'First Warning' : 
                 warningType.value === 'final' ? 'Final Warning' : 'Notice of Suspension',
            message: warningMessage.value,
            date: Timestamp.now(),
            admin: admin
          };
          
          await updateDoc(farmRef, {
            status: newStatus,
            lastWarning: Timestamp.now(),
            warningHistory: arrayUnion(warningData)
          });
          
          // Update local data
          const farmIndex = farms.value.findIndex(f => f.id === selectedFarm.value.id);
          if (farmIndex !== -1) {
            farms.value[farmIndex].status = newStatus;
            farms.value[farmIndex].lastWarning = Timestamp.now();
            farms.value[farmIndex].warningHistory = [...farms.value[farmIndex].warningHistory, warningData];
          }
          
          closeWarningModal();
        } catch (error) {
          console.error("Error sending warning:", error);
          alert("Failed to send warning. Please try again.");
        }
      };
  
      const toggleBan = async (farm) => {
        const confirmMessage = farm.status === 'Banned' ? 
          `Are you sure you want to unban ${farm.name}?` : 
          `Are you sure you want to ban ${farm.name}? This will prevent them from listing products.`;
        
        if (!confirm(confirmMessage)) return;
        
        try {
          const farmRef = doc(db, 'farms', farm.id);
          const newStatus = farm.status === 'Banned' ? 'Active' : 'Banned';
          
          await updateDoc(farmRef, {
            status: newStatus
          });
          
          // Update local data
          const farmIndex = farms.value.findIndex(f => f.id === farm.id);
          if (farmIndex !== -1) {
            farms.value[farmIndex].status = newStatus;
          }
        } catch (error) {
          console.error("Error updating farm status:", error);
          alert("Failed to update farm status. Please try again.");
        }
      };
  
      const viewFarmDetails = (farm) => {
        selectedFarm.value = farm;
        showFarmModal.value = true;
      };
  
      // Modal functions
      const closeWarningModal = () => {
        showWarningModal.value = false;
        selectedFarm.value = null;
      };
  
      const closeFarmModal = () => {
        showFarmModal.value = false;
        selectedFarm.value = null;
      };
  
      // Pagination
      const changePage = (page) => {
        currentPage.value = page;
      };
  
      // Apply filters (reset to first page)
      const applyFilters = () => {
        currentPage.value = 1;
      };
  
      // Initialize
      onMounted(() => {
        fetchFarms();
      });
  
      return {
        farms,
        filteredFarms: paginatedFarms,
        selectedStatus,
        statusOptions,
        searchQuery,
        currentPage,
        totalPages,
        showWarningModal,
        showFarmModal,
        selectedFarm,
        warningType,
        warningTypes,
        warningMessage,
        getImageUrl,
        formatPriceDiff,
        getPriceDiffClass,
        formatDate,
        sendWarning,
        confirmSendWarning,
        toggleBan,
        viewFarmDetails,
        closeWarningModal,
        closeFarmModal,
        changePage,
        applyFilters
      };
    }
  };
  </script>
  
  <style scoped>
  .overpricing-monitoring {
    padding: 20px;
    background: #f9f9f9;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  
  .header {
    margin-bottom: 20px;
  }
  
  .header h1 {
    color: #2e5c31;
    margin: 0;
  }
  
  .header p {
    color: #666;
    margin: 5px 0 0 0;
  }
  
  .controls {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    gap: 15px;
    flex-wrap: wrap;
  }
  
  .filter-group {
    flex: 1;
    min-width: 200px;
  }
  
  .filter-group label {
    display: block;
    margin-bottom: 5px;
    color: #666;
    font-size: 14px;
  }
  
  .filter-group select {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #f9f9f9;
  }
  
  .search-container {
    position: relative;
    min-width: 250px;
  }
  
  .search-container input {
    width: 100%;
    padding: 8px 12px 8px 35px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #f9f9f9;
  }
  
  .search-container i {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #999;
  }
  
  .table-container {
    overflow-x: auto;
    margin-bottom: 20px;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  }
  
  th, td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  
  th {
    background: #f5f5f5;
    color: #2e5c31;
    font-weight: 600;
  }
  
  tr:hover {
    background: #f9f9f9;
  }
  
  .farm-cell {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .farm-image {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-size: cover;
    background-position: center;
    background-color: #f0f0f0;
  }
  
  .price-high {
    color: #c62828;
    font-weight: 500;
  }
  
  .price-medium {
    color: #ff8f00;
    font-weight: 500;
  }
  
  .price-low {
    color: #2e7d32;
  }
  
  .status-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }
  
  .status-badge.active {
    background: #e8f5e9;
    color: #2e7d32;
  }
  
  .status-badge.warning {
    background: #fff8e1;
    color: #ff8f00;
  }
  
  .status-badge.final {
    background: #ffebee;
    color: #c62828;
  }
  
  .status-badge.banned {
    background: #f5f5f5;
    color: #616161;
  }
  
  .action-buttons {
    display: flex;
    gap: 8px;
  }
  
  .action-btn {
    padding: 6px 10px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  .warning-btn {
    background: #fff8e1;
    color: #ff8f00;
  }
  
  .warning-btn:hover {
    background: #ffe0b2;
  }
  
  .ban-btn {
    background: #ffebee;
    color: #c62828;
  }
  
  .ban-btn:hover {
    background: #ffcdd2;
  }
  
  .unban-btn {
    background: #e8f5e9;
    color: #2e7d32;
  }
  
  .unban-btn:hover {
    background: #c8e6c9;
  }
  
  .view-btn {
    background: #e3f2fd;
    color: #1976d2;
  }
  
  .view-btn:hover {
    background: #bbdefb;
  }
  
  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .pagination-btn {
    background: #f0f0f0;
    border: none;
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
    color: #666;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  .pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .page-info {
    color: #666;
    font-size: 14px;
  }
  
  /* Modal styles */
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
  }
  
  .modal-content {
    background: white;
    border-radius: 8px;
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #eee;
  }
  
  .modal-header h2 {
    margin: 0;
    color: #2e5c31;
    font-size: 20px;
  }
  
  .close-btn {
    background: none;
    border: none;
    color: #999;
    font-size: 20px;
    cursor: pointer;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 5px;
    color: #666;
    font-size: 14px;
  }
  
  .form-group select, 
  .form-group textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #f9f9f9;
  }
  
  .form-group textarea {
    min-height: 100px;
    resize: vertical;
  }
  
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
  }
  
  .primary-btn, .secondary-btn {
    padding: 10px 15px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    font-weight: 500;
  }
  
  .primary-btn {
    background: #2e5c31;
    color: white;
  }
  
  .primary-btn:hover {
    background: #1b3a1e;
  }
  
  .secondary-btn {
    background: #f0f0f0;
    color: #666;
  }
  
  .secondary-btn:hover {
    background: #e0e0e0;
  }
  
  /* Farm details modal */
  .farm-details {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
  }
  
  .farm-image-large {
    width: 150px;
    height: 150px;
    border-radius: 8px;
    background-size: cover;
    background-position: center;
    background-color: #f0f0f0;
    flex-shrink: 0;
  }
  
  .farm-info {
    flex: 1;
  }
  
  .farm-info h3 {
    margin: 0 0 10px 0;
    color: #333;
    font-size: 24px;
  }
  
  .farm-meta {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .meta-item {
    display: flex;
    flex-direction: column;
  }
  
  .meta-label {
    font-size: 14px;
    color: #666;
  }
  
  .meta-value {
    font-weight: 500;
    color: #333;
  }
  
  .section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 20px 0 10px 0;
  }
  
  .section-title h3 {
    margin: 0;
    color: #2e5c31;
    font-size: 18px;
  }
  
  .badge {
    background: #2e5c31;
    color: white;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
  }
  
  .products-table {
    margin-bottom: 20px;
    overflow-x: auto;
  }
  
  .products-table table {
    width: 100%;
  }
  
  .warning-history {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .warning-item {
    padding: 15px;
    background: #f9f9f9;
    border-radius: 8px;
    border-left: 4px solid #ff8f00;
  }
  
  .warning-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
  }
  
  .warning-type {
    font-weight: 500;
    color: #ff8f00;
  }
  
  .warning-date {
    color: #999;
    font-size: 12px;
  }
  
  .warning-message {
    margin: 0 0 5px 0;
    color: #666;
  }
  
  .warning-admin {
    font-size: 12px;
    color: #999;
    text-align: right;
  }
  
  .no-warnings {
    padding: 15px;
    text-align: center;
    color: #999;
    font-style: italic;
  }
  
  .text-center {
    text-align: center;
  }
  
  @media (max-width: 768px) {
    .controls {
      flex-direction: column;
    }
    
    .filter-group, .search-container {
      width: 100%;
    }
    
    .farm-details {
      flex-direction: column;
    }
    
    .farm-image-large {
      width: 100%;
      height: 200px;
    }
    
    .farm-meta {
      grid-template-columns: 1fr;
    }
    
    .action-buttons {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .action-btn {
      width: 100%;
      justify-content: center;
    }
  }
  
  @media (max-width: 480px) {
    .modal-content {
      width: 95%;
    }
  }
  </style>