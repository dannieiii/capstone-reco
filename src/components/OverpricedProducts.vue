<template>
  <div class="overpriced-view">
    <div class="overpriced-header">
      <h2>Overpriced Products Management</h2>
      <div class="bulk-actions">
  <!-- Only keep export button, remove bulk warning and deactivate buttons -->
</div>
    </div>

    <!-- Compact Filters and Settings Row -->
    <div class="controls-row">
      <!-- Warning Level Filters -->
      <div class="warning-filters">
        <div class="filter-group">
          <label>Warning Level</label>
          <select v-model="selectedWarningLevel" @change="applyOverpricedFilters">
            <option value="">All Levels</option>
            <option value="mild">Mild (10-25% above)</option>
            <option value="moderate">Moderate (25-50% above)</option>
            <option value="severe">Severe (50%+ above)</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Warning Status</label>
          <select v-model="selectedNotificationStatus" @change="applyOverpricedFilters">
            <option value="">All Status</option>
            <option value="not-warned">Not Warned</option>
            <option value="warned">Warned (1-2 times)</option>
            <option value="final-warning">Final Warning (3+ times)</option>
            <option value="pending-deactivation">Pending Deactivation</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Days Since Last Warning</label>
          <select v-model="selectedDaysSinceWarning" @change="applyOverpricedFilters">
            <option value="">All</option>
            <option value="1">1+ days</option>
            <option value="3">3+ days</option>
            <option value="7">7+ days</option>
            <option value="14">14+ days</option>
          </select>
        </div>
      </div>

      <!-- Compact Auto-notification Settings -->
      <div class="auto-notification-settings">
        <div class="settings-header">
          <h3>Auto-Notifications</h3>
          <button class="toggle-auto" @click="toggleAutoNotifications" :class="{ active: autoNotificationsEnabled }">
            <i class="fas fa-robot"></i>
            {{ autoNotificationsEnabled ? 'ON' : 'OFF' }}
          </button>
        </div>
        <div v-if="autoNotificationsEnabled" class="settings-content">
          <div class="setting-item">
            <label>Check interval:</label>
            <select v-model="systemCheckInterval" @change="updateAutoSettings">
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="60">1 hour</option>
              <option value="240">4 hours</option>
            </select>
          </div>
          <div class="setting-item">
            <label>Days between warnings:</label>
            <select v-model="daysBetweenWarnings" @change="updateAutoSettings">
              <option value="1">1 day</option>
              <option value="3">3 days</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
            </select>
          </div>
          <div class="setting-item">
            <label>
              <input type="checkbox" v-model="autoDeactivateEnabled" @change="updateAutoSettings">
              Auto-deactivate
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Overpriced Products Table -->
    <div class="overpriced-table-section">
      <div class="table-header">
        <h3>Overpriced Products ({{ filteredOverpricedProducts.length }})</h3>
        <div class="table-actions">
          <!-- Search Bar -->
          <div class="search-container">
            <i class="fas fa-search search-icon"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Search products, sellers..." 
              class="search-input"
              @input="handleSearch"
            >
            <button v-if="searchQuery" @click="clearSearch" class="clear-search">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <button class="refresh-btn" @click="refreshData" :disabled="isRefreshing">
            <i class="fas fa-sync-alt" :class="{ 'fa-spin': isRefreshing }"></i>
            {{ isRefreshing ? 'Refreshing...' : 'Refresh' }}
          </button>
          
          <!-- Export Dropdown -->
          <div class="export-dropdown" ref="exportDropdown">
            <button class="bulk-btn export-toggle" @click="toggleExportDropdown">
              <i class="fas fa-download"></i> Export Report
              <i class="fas fa-chevron-down"></i>
            </button>
            <div v-if="showExportDropdown" class="export-menu">
              <button @click="previewExport('csv')" class="export-option">
                <i class="fas fa-file-csv"></i> Export as CSV
              </button>
              <button @click="previewExport('pdf')" class="export-option">
                <i class="fas fa-file-pdf"></i> Export as PDF
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="table-wrapper">
        <table class="products-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Seller</th>
              <th>Seller Price</th>
              <th>D.A. Max Price</th>
              <th>Excess Amount</th>
              <th>Warning Level</th>
              <th>Warning Status</th>
              <th>Last Warning</th>
              <th>Next Action</th>
              <th>Auto Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in paginatedProducts" :key="product.id" :class="getProductRowClass(product)">
              <td>
                <div class="product-cell">
                  <div class="product-image" :style="{ backgroundImage: `url(${getImageUrl(product.image)})` }"></div>
                  <div class="product-info">
                    <span class="product-name">{{ product.productName }}</span>
                    <div class="product-meta">
                      <span class="unit-badge">{{ getDisplayUnit(product) }}</span>
                      <span v-if="product.variety && product.variety !== 'Normal'" class="variety-badge">{{ product.variety }}</span>
                      <span v-if="product.status === 'inactive'" class="status-badge inactive">INACTIVE</span>
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <div class="seller-info">
                  <span class="seller-name">{{ getSellerName(product.sellerId) }}</span>
                  <div class="seller-stats">
                    <span class="overpriced-count">{{ getSellerOverpricedCount(product.sellerId) }} overpriced</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="price-display">
                  <span class="current-price text-danger">
                    ₱{{ formatPrice(product.currentPrice?.price || product.price || 0) }}
                  </span>
                  <small v-if="product.currentPrice?.unitLabel" class="unit-label">
                    {{ product.currentPrice.unitLabel }}
                  </small>
                </div>
              </td>
              <td>
                <div class="reference-price">
                  <span class="max-price">₱{{ formatPrice(product.daReference?.maxPrice || 0) }}</span>
                  <small v-if="product.daReference?.unit" class="unit-label">
                    {{ product.daReference.unit }}
                  </small>
                </div>
              </td>
              <td>
                <div class="excess-amount" :class="getExcessClass(product.excessAmount)">
                  ₱{{ formatPrice(product.excessAmount) }}
                  <small>({{ formatDeviation(product.deviation) }})</small>
                </div>
              </td>
              <td>
                <div class="warning-level" :class="getWarningLevelClass(product.warningLevel)">
                  <i :class="getWarningLevelIcon(product.warningLevel)"></i>
                  {{ getWarningLevelText(product.warningLevel) }}
                </div>
              </td>
              <td>
                <div class="warning-status" :class="getWarningStatusClass(product)">
                  <i :class="getWarningStatusIcon(product)"></i>
                  {{ getWarningStatusText(product) }}
                </div>
              </td>
              <td>
                <div v-if="getProductWarningHistory(product.id).length > 0" class="last-warning">
                  {{ formatDate(getLastWarningDate(product.id)) }}
                  <small class="warning-count">({{ getProductWarningHistory(product.id).length }}/3 warnings)</small>
                </div>
                <span v-else class="no-warning">Never warned</span>
              </td>
              <td>
                <div class="next-action">
                  {{ getNextActionText(product) }}
                  <small v-if="getNextActionDate(product)" class="next-date">
                    {{ formatDate(getNextActionDate(product)) }}
                  </small>
                </div>
              </td>
              <td>
                <div class="auto-status" :class="getAutoStatusClass(product)">
                  <i :class="getAutoStatusIcon(product)"></i>
                  {{ getAutoStatusText(product) }}
                </div>
              </td>
              <td>
                <div class="action-buttons">
                  <button 
                    v-if="canSendWarning(product)" 
                    class="action-btn warn-btn" 
                    @click="sendIndividualWarning(product)" 
                    title="Send Manual Warning"
                  >
                    <i class="fas fa-exclamation-triangle"></i>
                  </button>
                  <button 
                    v-if="canDeactivateProduct(product)" 
                    class="action-btn deactivate-btn" 
                    @click="deactivateProduct(product)" 
                    title="Deactivate Product"
                  >
                    <i class="fas fa-ban"></i>
                  </button>
                  <button 
                    v-if="product.status === 'inactive'" 
                    class="action-btn reactivate-btn" 
                    @click="reactivateProduct(product)" 
                    title="Reactivate Product"
                  >
                    <i class="fas fa-check-circle"></i>
                  </button>
                  <button class="action-btn history-btn" @click="viewWarningHistory(product)" title="View Warning History">
                    <i class="fas fa-history"></i>
                  </button>
                  <button class="action-btn view-btn" @click="viewSellerProfile(product)" title="View Seller">
                    <i class="fas fa-user"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Simple Pagination -->
      <div class="simple-pagination">
        <div class="pagination-info">
          Showing {{ startIndex + 1 }}-{{ endIndex }} of {{ filteredOverpricedProducts.length }} products
        </div>
        <div class="pagination-nav">
          <button 
            @click="previousPage" 
            :disabled="currentPage === 1"
            class="pagination-btn"
          >
            <i class="fas fa-chevron-left"></i> Previous
          </button>
          <span class="page-indicator">Page {{ currentPage }} of {{ totalPages }}</span>
          <button 
            @click="nextPage" 
            :disabled="currentPage === totalPages"
            class="pagination-btn"
          >
            Next <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Export Preview Modal -->
    <div v-if="showExportPreview" class="modal-overlay" @click="closeExportPreview">
      <div class="modal-content export-preview-modal" @click.stop>
        <div class="modal-header">
          <h2>Export Preview - {{ exportFormat.toUpperCase() }}</h2>
          <button class="close-btn" @click="closeExportPreview">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="export-summary">
            <div class="summary-item">
              <strong>Total Records:</strong> {{ exportPreviewData.length }}
            </div>
            <div class="summary-item">
              <strong>Export Format:</strong> {{ exportFormat.toUpperCase() }}
            </div>
            <div class="summary-item">
              <strong>Generated:</strong> {{ new Date().toLocaleString() }}
            </div>
          </div>
          
          <div class="preview-container">
            <h4>Data Preview (First 5 records):</h4>
            <div class="preview-table-container">
              <table class="preview-table">
                <thead>
                  <tr>
                    <th v-for="header in exportHeaders" :key="header">{{ header }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in exportPreviewData.slice(0, 5)" :key="index">
                    <td v-for="header in exportHeaders" :key="header">
                      {{ row[header] }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="exportPreviewData.length > 5" class="preview-note">
              ... and {{ exportPreviewData.length - 5 }} more records
            </div>
          </div>
          
          <div class="modal-actions">
            <button class="secondary-btn" @click="closeExportPreview">Cancel</button>
            <button class="primary-btn" @click="confirmExport">
              <i class="fas fa-download"></i> Download {{ exportFormat.toUpperCase() }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Warning History Modal -->
    <div v-if="showWarningHistoryModal" class="modal-overlay" @click="closeWarningHistoryModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Warning History - {{ selectedProductForHistory?.productName }}</h2>
          <button class="close-btn" @click="closeWarningHistoryModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="warningHistory.length === 0" class="no-history">
            <p>No warning history found for this product.</p>
          </div>
          <div v-else class="warning-history-list">
            <div v-for="warning in warningHistory" :key="warning.id" class="warning-history-item">
              <div class="warning-header">
                <span class="warning-type">{{ getWarningTypeLabel(warning.type) }}</span>
                <span class="warning-date">{{ formatDate(warning.sentAt) }}</span>
                <span v-if="warning.automated" class="auto-badge">AUTO</span>
              </div>
              <p class="warning-message">{{ warning.message }}</p>
              <div class="warning-details">
                <span class="warning-level">Level: {{ warning.warningLevel?.toUpperCase() || 'MILD' }}</span>
                <span class="price-at-time">Price at time: ₱{{ formatPrice(warning.priceAtTime) }}</span>
                <span class="response-status" :class="warning.responded ? 'responded' : 'no-response'">
                  {{ warning.responded ? 'Seller Responded' : 'No Response' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Warning Message Modal -->
    <div v-if="showWarningModal" class="modal-overlay" @click="closeWarningModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Send Price Warning</h2>
          <button class="close-btn" @click="closeWarningModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="warningTarget" class="warning-details">
            <div class="product-summary">
              <h3>{{ warningTarget.productName }}</h3>
              <p><strong>Seller:</strong> {{ getSellerName(warningTarget.sellerId) }}</p>
              <p><strong>Current Price:</strong> ₱{{ formatPrice(warningTarget.currentPrice?.price || warningTarget.price) }}</p>
              <p><strong>D.A. Max Price:</strong> ₱{{ warningTarget.daReference?.maxPrice || 'N/A' }}</p>
              <p><strong>Excess:</strong> <span class="text-danger">₱{{ formatPrice(warningTarget.excessAmount) }} ({{ formatDeviation(warningTarget.deviation) }})</span></p>
              <p><strong>Warning Level:</strong> <span :class="getWarningLevelClass(warningTarget.warningLevel)">{{ getWarningLevelText(warningTarget.warningLevel) }}</span></p>
              <p><strong>Warning Count:</strong> {{ getProductWarningHistory(warningTarget.id).length + 1 }}/3</p>
            </div>
            
            <div class="warning-message">
              <label>Warning Message:</label>
              <textarea v-model="warningMessage" rows="6" placeholder="Enter warning message..."></textarea>
            </div>
            
            <div class="warning-options">
              <label>
                <input type="checkbox" v-model="includeGuidelines" @change="updateWarningMessage">
                Include pricing guidelines
              </label>
              <label>
                <input type="checkbox" v-model="requestResponse" @change="updateWarningMessage">
                Request response within {{ daysBetweenWarnings }} days
              </label>
              <label>
                <input type="checkbox" v-model="isManualWarning">
                Manual warning (bypass auto-system)
              </label>
            </div>
          </div>
          
          <div class="modal-actions">
            <button class="secondary-btn" @click="closeWarningModal">Cancel</button>
            <button class="primary-btn" @click="confirmSendWarning" :disabled="!warningMessage.trim()">
              <i class="fas fa-paper-plane"></i> Send Warning
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  onSnapshot,
  getDoc
} from "firebase/firestore";
import { db } from '@/firebase/firebaseConfig';

// Props
const props = defineProps({
  overpricedProducts: {
    type: Array,
    required: true
  },
  isDarkMode: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['send-warning', 'view-seller', 'product-deactivated', 'refresh-products']);

// Reactive data
const selectedWarningLevel = ref('');
const selectedNotificationStatus = ref('');
const selectedDaysSinceWarning = ref('');
const isRefreshing = ref(false);

// Search and pagination
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 10; // Fixed to 10

// Export functionality
const showExportDropdown = ref(false);
const showExportPreview = ref(false);
const exportFormat = ref('csv');
const exportPreviewData = ref([]);
const exportHeaders = ref([]);

// Enhanced Auto-notification settings
const autoNotificationsEnabled = ref(true);
const daysBetweenWarnings = ref(3);
const autoDeactivateEnabled = ref(true);
const systemCheckInterval = ref(30); // minutes
const gracePeriodHours = ref(24);

// Modal states
const showWarningModal = ref(false);
const showWarningHistoryModal = ref(false);
const selectedProductForHistory = ref(null);
const warningHistory = ref([]);
const warningTarget = ref(null);
const warningMessage = ref('');
const includeGuidelines = ref(true);
const requestResponse = ref(true);
const isManualWarning = ref(false);

// Data
const sellers = ref([]);
const allWarningHistory = ref([]);
const lastSystemCheck = ref(new Date());

// Auto-notification interval
let autoNotificationInterval = null;

// Search functionality
const searchFilteredProducts = computed(() => {
  let result = productsWithWarningLevels.value;
  
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    result = result.filter(product => {
      const productName = product.productName?.toLowerCase() || '';
      const sellerName = getSellerName(product.sellerId).toLowerCase();
      const category = product.category?.toLowerCase() || '';
      const status = product.status?.toLowerCase() || '';
      
      return productName.includes(query) || 
             sellerName.includes(query) || 
             category.includes(query) || 
             status.includes(query);
    });
  }
  
  return result;
});

const filteredOverpricedProducts = computed(() => {
  // Ensure we have valid products with proper structure, including inactive ones
  let result = searchFilteredProducts.value.filter(product => 
    product && 
    product.id && 
    product.productName &&
    (product.hasOverpricedUnits || product.deviation > 0)
  );
  
  if (selectedWarningLevel.value) {
    result = result.filter(product => product.warningLevel === selectedWarningLevel.value);
  }
  
  if (selectedNotificationStatus.value) {
    if (selectedNotificationStatus.value === 'not-warned') {
      result = result.filter(product => getProductWarningHistory(product.id).length === 0);
    } else if (selectedNotificationStatus.value === 'warned') {
      result = result.filter(product => {
        const warningCount = getProductWarningHistory(product.id).length;
        return warningCount >= 1 && warningCount < 3;
      });
    } else if (selectedNotificationStatus.value === 'final-warning') {
      result = result.filter(product => getProductWarningHistory(product.id).length >= 3);
    } else if (selectedNotificationStatus.value === 'pending-deactivation') {
      result = result.filter(product => 
        getProductWarningHistory(product.id).length >= 3 && product.status !== 'inactive'
      );
    }
  }
  
  if (selectedDaysSinceWarning.value) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(selectedDaysSinceWarning.value));
    
    result = result.filter(product => {
      const lastWarningDate = getLastWarningDate(product.id);
      if (!lastWarningDate) return false;
      return new Date(lastWarningDate) <= daysAgo;
    });
  }
  
  return result;
});

// Simple pagination
const totalPages = computed(() => {
  return Math.ceil(filteredOverpricedProducts.value.length / itemsPerPage);
});

const startIndex = computed(() => {
  return (currentPage.value - 1) * itemsPerPage;
});

const endIndex = computed(() => {
  return Math.min(startIndex.value + itemsPerPage, filteredOverpricedProducts.value.length);
});

const paginatedProducts = computed(() => {
  return filteredOverpricedProducts.value.slice(startIndex.value, endIndex.value);
});

const productsWithWarningLevels = computed(() => {
  return props.overpricedProducts.map(product => {
    // Ensure we have valid deviation data
    let deviation = 0;
    let excessAmount = 0;
    let currentPrice = null;
    let daReference = null;
    
    // Extract pricing information from units if available
    if (product.units && Array.isArray(product.units)) {
      const overpricedUnit = product.units.find(unit => unit.isOverpriced);
      if (overpricedUnit) {
        deviation = overpricedUnit.deviation || 0;
        excessAmount = overpricedUnit.excessAmount || 0;
        currentPrice = {
          price: overpricedUnit.price,
          unitLabel: overpricedUnit.type
        };
        daReference = overpricedUnit.daReference;
      }
    } else {
      // Fallback to product-level data
      deviation = product.deviation || product.overallDeviation || 0;
      excessAmount = product.excessAmount || 0;
      currentPrice = product.currentPrice || { price: product.price || 0, unitLabel: 'N/A' };
      daReference = product.daReference;
    }
    
    let warningLevel = 'mild';
    const absDeviation = Math.abs(deviation);
    if (absDeviation >= 50) {
      warningLevel = 'severe';
    } else if (absDeviation >= 25) {
      warningLevel = 'moderate';
    } else if (absDeviation >= 10) {
      warningLevel = 'mild';
    }
    
    return {
      ...product,
      warningLevel,
      deviation: parseFloat(deviation),
      excessAmount: parseFloat(excessAmount),
      currentPrice,
      daReference,
      hasOverpricedUnits: deviation > 0
    };
  }).filter(product => product.deviation > 0); // Only show products with actual deviations
});

// Search methods
const handleSearch = () => {
  currentPage.value = 1; // Reset to first page when searching
};

const clearSearch = () => {
  searchQuery.value = '';
  currentPage.value = 1;
};

// Simple pagination methods
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

// Export methods
const toggleExportDropdown = () => {
  showExportDropdown.value = !showExportDropdown.value;
};

const previewExport = (format) => {
  exportFormat.value = format;
  generateExportPreview();
  showExportDropdown.value = false;
  showExportPreview.value = true;
};

const generateExportPreview = () => {
  const data = filteredOverpricedProducts.value.map(product => {
    const warningCount = getProductWarningHistory(product.id).length;
    const lastWarning = getLastWarningDate(product.id);
    
    return {
      'Product Name': product.productName,
      'Category': product.category || 'N/A',
      'Seller': getSellerName(product.sellerId),
      'Seller ID': product.sellerId,
      'Current Price': formatPrice(product.currentPrice?.price || product.price),
      'D.A. Max Price': product.daReference?.maxPrice || 'N/A',
      'Excess Amount': formatPrice(product.excessAmount),
      'Deviation %': formatDeviation(product.deviation),
      'Warning Level': getWarningLevelText(product.warningLevel),
      'Warning Count': warningCount,
      'Last Warning Date': lastWarning ? formatDate(lastWarning) : 'Never',
      'Days Since Last Warning': lastWarning ? Math.floor((new Date() - lastWarning) / (1000 * 60 * 60 * 24)) : 'N/A',
      'Status': product.status || 'active',
      'Next Action': getNextActionText(product),
      'Auto Status': getAutoStatusText(product),
      'Pending Auto Warning': shouldSendAutoWarning(product) ? 'Yes' : 'No',
      'Pending Auto Deactivation': shouldAutoDeactivate(product) ? 'Yes' : 'No'
    };
  });
  
  exportPreviewData.value = data;
  exportHeaders.value = Object.keys(data[0] || {});
};

const closeExportPreview = () => {
  showExportPreview.value = false;
  exportPreviewData.value = [];
  exportHeaders.value = [];
};

const confirmExport = () => {
  if (exportFormat.value === 'csv') {
    downloadCSV();
  } else if (exportFormat.value === 'pdf') {
    downloadPDF();
  }
  closeExportPreview();
};

const downloadCSV = () => {
  try {
    const csvData = exportPreviewData.value.map(row => ({
      ...row,
      'Export Date': new Date().toISOString().split('T')[0],
      'Export Time': new Date().toLocaleTimeString()
    }));
    
    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `overpriced-products-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    alert(`CSV export completed! Downloaded ${csvData.length} records.`);
    
  } catch (error) {
    console.error('CSV export error:', error);
    alert('Failed to export CSV. Please try again.');
  }
};

const downloadPDF = () => {
  try {
    // Create a simple HTML table for PDF generation
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Overpriced Products Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #2e5c31; text-align: center; }
          .report-info { margin-bottom: 20px; text-align: center; color: #666; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          th, td { border: 1px solid #ddd; padding: 4px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .warning-severe { color: #dc2626; }
          .warning-moderate { color: #ea580c; }
          .warning-mild { color: #92400e; }
        </style>
      </head>
      <body>
        <h1>Overpriced Products Report</h1>
        <div class="report-info">
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Total Records: ${exportPreviewData.value.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              ${exportHeaders.value.map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${exportPreviewData.value.map(row => `
              <tr>
                ${exportHeaders.value.map(header => `<td>${row[header]}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Open in new window for printing/saving as PDF
    const printWindow = window.open(url, '_blank');
    printWindow.onload = () => {
      printWindow.print();
    };
    
    alert('PDF preview opened in new window. Use your browser\'s print function to save as PDF.');
    
  } catch (error) {
    console.error('PDF export error:', error);
    alert('Failed to generate PDF. Please try again.');
  }
};

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  if (showExportDropdown.value && !event.target.closest('.export-dropdown')) {
    showExportDropdown.value = false;
  }
};

// Enhanced methods for automatic system
const shouldSendAutoWarning = (product) => {
  if (!autoNotificationsEnabled.value || product.status === 'inactive') {
    return false;
  }
  
  const warningCount = getProductWarningHistory(product.id).length;
  if (warningCount >= 3) return false;
  
  const lastWarningDate = getLastWarningDate(product.id);
  
  // If never warned, should warn immediately
  if (!lastWarningDate) return true;
  
  const now = new Date();
  const daysSinceLastWarning = Math.floor((now - lastWarningDate) / (1000 * 60 * 60 * 24));
  
  return daysSinceLastWarning >= daysBetweenWarnings.value;
};

const shouldAutoDeactivate = (product) => {
  if (!autoDeactivateEnabled.value || product.status === 'inactive') {
    return false;
  }
  
  const warningCount = getProductWarningHistory(product.id).length;
  if (warningCount < 3) return false;
  
  const lastWarningDate = getLastWarningDate(product.id);
  if (!lastWarningDate) return false;
  
  const now = new Date();
  const hoursSinceLastWarning = Math.floor((now - lastWarningDate) / (1000 * 60 * 60));
  
  return hoursSinceLastWarning >= gracePeriodHours.value;
};

const getAutoStatusClass = (product) => {
  if (product.status === 'inactive') return 'auto-status-inactive';
  if (shouldAutoDeactivate(product)) return 'auto-status-deactivate';
  if (shouldSendAutoWarning(product)) return 'auto-status-warning';
  return 'auto-status-normal';
};

const getAutoStatusIcon = (product) => {
  if (product.status === 'inactive') return 'fas fa-ban';
  if (shouldAutoDeactivate(product)) return 'fas fa-clock';
  if (shouldSendAutoWarning(product)) return 'fas fa-exclamation-triangle';
  return 'fas fa-check-circle';
};

const getAutoStatusText = (product) => {
  if (product.status === 'inactive') return 'Deactivated';
  
  const warningCount = getProductWarningHistory(product.id).length;
  
  // If pending deactivation (3+ warnings), don't show "Next in X days"
  if (warningCount >= 3) {
    if (shouldAutoDeactivate(product)) {
      return 'Pending Deactivation';
    }
    return 'Grace Period';
  }
  
  if (shouldSendAutoWarning(product)) return 'Warning Due';
  
  if (warningCount === 0) return 'Monitoring';
  
  const lastWarningDate = getLastWarningDate(product.id);
  if (lastWarningDate) {
    const nextWarning = new Date(lastWarningDate);
    nextWarning.setDate(nextWarning.getDate() + daysBetweenWarnings.value);
    const daysUntilNext = Math.ceil((nextWarning - new Date()) / (1000 * 60 * 60 * 24));
    return `Next in ${daysUntilNext}d`;
  }
  
  return 'Monitoring';
};

// Enhanced automatic system checking
const runAutomaticSystem = async () => {
  if (!autoNotificationsEnabled.value) return;
  
  console.log('Running automatic warning system check...');
  lastSystemCheck.value = new Date();
  
  try {
    // Process automatic warnings
    const productsNeedingWarnings = productsWithWarningLevels.value.filter(shouldSendAutoWarning);
    
    for (const product of productsNeedingWarnings) {
      try {
        await sendWarningNotification(product, true); // true = automated
        console.log(`Auto-warning sent for product: ${product.productName}`);
      } catch (error) {
        console.error(`Failed to send auto-warning for product ${product.productName}:`, error);
      }
    }
    
    // Process automatic deactivations
    if (autoDeactivateEnabled.value) {
      const productsNeedingDeactivation = productsWithWarningLevels.value.filter(shouldAutoDeactivate);
      
      for (const product of productsNeedingDeactivation) {
        try {
          await deactivateProductById(product.id, 'auto');
          console.log(`Auto-deactivated product: ${product.productName}`);
        } catch (error) {
          console.error(`Failed to auto-deactivate product ${product.productName}:`, error);
        }
      }
    }
    
    // Refresh data if any actions were taken
    if (productsNeedingWarnings.length > 0 || 
        (autoDeactivateEnabled.value && productsWithWarningLevels.value.filter(shouldAutoDeactivate).length > 0)) {
      await refreshData();
    }
    
  } catch (error) {
    console.error('Error in automatic system check:', error);
  }
};

const refreshData = async () => {
  isRefreshing.value = true;
  try {
    await Promise.all([
      fetchSellers(),
      fetchWarningHistory()
    ]);
    emit('refresh-products');
  } catch (error) {
    console.error('Error refreshing data:', error);
  } finally {
    isRefreshing.value = false;
  }
};

// Enhanced export functionality (keeping original method for backward compatibility)
const exportOverpricedReport = () => {
  previewExport('csv');
};

// Enhanced warning notification with automation flag
const sendWarningNotification = async (product, automated = false) => {
  const warningCount = getProductWarningHistory(product.id).length + 1;
  const isFirstWarning = warningCount === 1;
  const isFinalWarning = warningCount >= 3;
  
  // Create notification for seller
  const notificationData = {
    sellerId: product.sellerId,
    type: isFinalWarning ? 'final_warning' : 'price_warning',
    title: isFinalWarning ? 'FINAL PRICE WARNING' : isFirstWarning ? 'Price Warning' : `Price Warning #${warningCount}`,
    message: generateWarningMessage(product, warningCount, automated),
    productId: product.id,
    productName: product.productName,
    currentPrice: product.currentPrice?.price || product.price,
    maxAllowedPrice: product.daReference?.maxPrice,
    excessAmount: product.excessAmount,
    deviation: product.deviation,
    warningLevel: product.warningLevel,
    warningCount: warningCount,
    isFinalWarning: isFinalWarning,
    automated: automated,
    read: false,
    createdAt: serverTimestamp(),
    expiresAt: getWarningExpiryDate(),
    link: `/seller/products/edit/${product.id}`
  };
  
  await addDoc(collection(db, 'notifications'), notificationData);
  
  // Create warning history record
  await addDoc(collection(db, 'warningHistory'), {
    productId: product.id,
    sellerId: product.sellerId,
    type: isFinalWarning ? 'final_warning' : 'price_warning',
    message: notificationData.message,
    warningLevel: product.warningLevel,
    warningCount: warningCount,
    priceAtTime: product.currentPrice?.price || product.price,
    maxAllowedPrice: product.daReference?.maxPrice,
    excessAmount: product.excessAmount,
    deviation: product.deviation,
    automated: automated,
    sentAt: serverTimestamp(),
    responded: false,
    adminId: automated ? 'auto-system' : 'manual-admin'
  });
};

// Enhanced warning message generation
const generateWarningMessage = (product, warningCount, automated = false) => {
  const isFinalWarning = warningCount >= 3;
  const deviation = formatDeviation(product.deviation);
  const excess = formatPrice(product.excessAmount);
  const sellerName = getSellerName(product.sellerId);
  const warningLevelText = getWarningLevelText(product.warningLevel);
  
  let message = `Dear ${sellerName},\n\n`;
  
  if (automated) {
    message += `This is an automated message from our pricing monitoring system.\n\n`;
  }
  
  if (isFinalWarning) {
    message += `🚨 FINAL WARNING - IMMEDIATE ACTION REQUIRED 🚨\n\n`;
    message += `This is your FINAL WARNING regarding the pricing of your product "${product.productName}".\n\n`;
    message += `Your product is currently priced at ₱${formatPrice(product.currentPrice?.price || product.price)}, which is ${deviation} above the Department of Agriculture's maximum recommended price of ₱${product.daReference?.maxPrice}.\n\n`;
    message += `This represents an excess of ₱${excess} above the recommended maximum price.\n\n`;
    message += `WARNING LEVEL: ${warningLevelText}\n\n`;
    message += `⚠️ CRITICAL: Your product will be automatically deactivated in ${gracePeriodHours.value} hours if pricing is not corrected.\n\n`;
    message += `To prevent automatic deactivation:\n`;
    message += `1. Log into your seller dashboard immediately\n`;
    message += `2. Navigate to your products section\n`;
    message += `3. Adjust the price to ₱${product.daReference?.maxPrice} or below\n`;
    message += `4. Save the changes\n\n`;
  } else {
    message += `We have detected that your product "${product.productName}" is priced ${deviation} above the Department of Agriculture's maximum recommended price.\n\n`;
    message += `Current Details:\n`;
    message += `• Your Price: ₱${formatPrice(product.currentPrice?.price || product.price)}\n`;
    message += `• D.A. Maximum: ₱${product.daReference?.maxPrice}\n`;
    message += `• Excess Amount: ₱${excess}\n`;
    message += `• Warning Level: ${warningLevelText}\n\n`;
    message += `This is warning ${warningCount} of 3. Please review and adjust your pricing to align with D.A. guidelines.\n\n`;
  }
  
  if (automated) {
    message += `AUTOMATED MONITORING SYSTEM:\n`;
    message += `- This system monitors pricing 24/7\n`;
    message += `- Warnings are sent automatically every ${daysBetweenWarnings.value} days\n`;
    message += `- After 3 warnings, products are automatically deactivated\n`;
    message += `- You can prevent this by adjusting your pricing promptly\n\n`;
  }
  
  if (includeGuidelines.value) {
    message += `PRICING GUIDELINES:\n`;
    message += `- Prices must not exceed D.A. maximum recommended prices\n`;
    message += `- Consider market conditions and fair pricing for consumers\n`;
    message += `- Regular price reviews help maintain marketplace standards\n`;
    message += `- Compliance ensures continued marketplace participation\n\n`;
  }
  
  if (requestResponse.value) {
    message += `Please respond within ${daysBetweenWarnings.value} days to acknowledge this warning.\n\n`;
  }
  
  message += `We appreciate your cooperation in maintaining fair pricing for consumers.\n\n`;
  message += `Best regards,\n`;
  message += automated ? 'Automated Marketplace Monitoring System\n' : 'Agricultural Marketplace Administration\n';
  message += `Department of Agriculture Partnership Program`;
  
  return message;
};

// Keep existing methods but enhance them
const getProductWarningHistory = (productId) => {
  return allWarningHistory.value.filter(warning => warning.productId === productId);
};

const getLastWarningDate = (productId) => {
  const productWarnings = getProductWarningHistory(productId);
  if (productWarnings.length === 0) return null;
  
  const sortedWarnings = productWarnings.sort((a, b) => {
    const dateA = a.sentAt?.toDate?.() || new Date(a.sentAt || 0);
    const dateB = b.sentAt?.toDate?.() || new Date(b.sentAt || 0);
    return dateB - dateA;
  });
  
  const lastWarning = sortedWarnings[0];
  return lastWarning.sentAt?.toDate?.() || new Date(lastWarning.sentAt);
};

const getWarningTypeLabel = (type) => {
  const labels = {
    'price_warning': 'Price Warning',
    'final_warning': 'Final Warning',
    'acknowledgment': 'Acknowledgment',
    'system': 'System Notice'
  };
  return labels[type] || type;
};

// Enhanced warning level methods
const getWarningLevelText = (level) => {
  switch (level) {
    case 'severe':
      return 'SEVERE';
    case 'moderate':
      return 'MODERATE';
    case 'mild':
      return 'MILD';
    default:
      return 'MILD'; // Default to MILD instead of UNKNOWN
  }
};

const getWarningLevelClass = (level) => {
  switch (level) {
    case 'severe':
      return 'warning-severe';
    case 'moderate':
      return 'warning-moderate';
    case 'mild':
      return 'warning-mild';
    default:
      return 'warning-mild'; // Default to mild styling
  }
};

const getWarningLevelIcon = (level) => {
  switch (level) {
    case 'severe':
      return 'fas fa-exclamation-circle';
    case 'moderate':
      return 'fas fa-exclamation-triangle';
    case 'mild':
      return 'fas fa-info-circle';
    default:
      return 'fas fa-info-circle'; // Default to info icon
  }
};

// Methods
const applyOverpricedFilters = () => {
  currentPage.value = 1; // Reset to first page when filtering
};

const canSendWarning = (product) => {
  const warningCount = getProductWarningHistory(product.id).length;
  return product.status !== 'inactive' && warningCount < 3;
};

const canDeactivateProduct = (product) => {
  const warningCount = getProductWarningHistory(product.id).length;
  return product.status !== 'inactive' && warningCount >= 3;
};

const getProductRowClass = (product) => {
  const classes = [];
  if (product.status === 'inactive') classes.push('product-inactive');
  
  const warningCount = getProductWarningHistory(product.id).length;
  if (warningCount >= 3) classes.push('final-warning-reached');
  if (shouldSendAutoWarning(product)) classes.push('auto-warning-pending');
  if (shouldAutoDeactivate(product)) classes.push('auto-deactivation-pending');
  
  return classes.join(' ');
};

const getWarningStatusClass = (product) => {
  const warningCount = getProductWarningHistory(product.id).length;
  if (warningCount === 0) return 'status-none';
  if (warningCount < 3) return 'status-warned';
  return 'status-final';
};

const getWarningStatusIcon = (product) => {
  const warningCount = getProductWarningHistory(product.id).length;
  if (warningCount === 0) return 'fas fa-circle';
  if (warningCount < 3) return 'fas fa-exclamation-triangle';
  return 'fas fa-ban';
};

const getWarningStatusText = (product) => {
  const warningCount = getProductWarningHistory(product.id).length;
  if (warningCount === 0) return 'Not Warned';
  if (warningCount < 3) return `${warningCount} Warning${warningCount > 1 ? 's' : ''}`;
  return 'Final Warning Sent';
};

const getNextActionText = (product) => {
  const warningCount = getProductWarningHistory(product.id).length;
  
  if (product.status === 'inactive') return 'Deactivated';
  if (shouldAutoDeactivate(product)) return `Auto-Deactivation in ${gracePeriodHours.value}h`;
  if (warningCount >= 3) return 'Pending Deactivation';
  if (shouldSendAutoWarning(product)) return 'Auto-Warning Scheduled';
  if (warningCount === 0) return 'Monitoring';
  
  return `Next Check in ${daysBetweenWarnings.value}d`;
};

const getNextActionDate = (product) => {
  const lastWarningDate = getLastWarningDate(product.id);
  const warningCount = getProductWarningHistory(product.id).length;
  
  if (!lastWarningDate || product.status === 'inactive') {
    return null;
  }
  
  if (warningCount >= 3) {
    // Next action is deactivation
    const nextAction = new Date(lastWarningDate);
    nextAction.setHours(nextAction.getHours() + gracePeriodHours.value);
    return nextAction.toISOString();
  }
  
  // Next action is warning
  const nextAction = new Date(lastWarningDate);
  nextAction.setDate(nextAction.getDate() + daysBetweenWarnings.value);
  return nextAction.toISOString();
};

const sendIndividualWarning = (product) => {
  warningTarget.value = product;
  const warningCount = getProductWarningHistory(product.id).length + 1;
  warningMessage.value = generateWarningMessage(product, warningCount, false);
  showWarningModal.value = true;
};

const deactivateProduct = async (product) => {
  const confirmed = confirm(`Are you sure you want to deactivate "${product.productName}"? This will remove it from the marketplace.`);
  if (!confirmed) return;
  
  try {
    await deactivateProductById(product.id, 'manual');
    alert('Product deactivated successfully!');
    emit('product-deactivated', product.id);
    await refreshData();
  } catch (error) {
    console.error('Error deactivating product:', error);
    alert('Failed to deactivate product. Please try again.');
  }
};

const deactivateProductById = async (productId, reason = 'manual') => {
  const productRef = doc(db, 'products', productId);
  await updateDoc(productRef, {
    status: 'inactive',
    deactivatedAt: serverTimestamp(),
    deactivationReason: reason === 'auto' ? 'Automatic deactivation after 3 warnings' : 'Manual deactivation by admin',
    deactivatedBy: reason
  });
  
  // Create notification for seller
  const product = props.overpricedProducts.find(p => p.id === productId);
  if (product) {
    await addDoc(collection(db, 'notifications'), {
      sellerId: product.sellerId,
      type: 'product_deactivated',
      title: 'Product Deactivated',
      message: `Your product "${product.productName}" has been deactivated due to repeated pricing violations. ${reason === 'auto' ? 'This was done automatically by our monitoring system.' : ''} Contact support if you believe this was an error.`,
      productId: productId,
      productName: product.productName,
      reason: reason === 'auto' ? 'Automatic deactivation after 3 warnings' : 'Manual deactivation by admin',
      automated: reason === 'auto',
      read: false,
      createdAt: serverTimestamp()
    });
  }
};

const reactivateProduct = async (product) => {
  const confirmed = confirm(`Are you sure you want to reactivate "${product.productName}"?`);
  if (!confirmed) return;
  
  try {
    const productRef = doc(db, 'products', product.id);
    await updateDoc(productRef, {
      status: 'active',
      reactivatedAt: serverTimestamp()
    });
    
    // Create notification for seller
    await addDoc(collection(db, 'notifications'), {
      sellerId: product.sellerId,
      type: 'product_reactivated',
      title: 'Product Reactivated',
      message: `Your product "${product.productName}" has been reactivated. Please ensure pricing complies with D.A. guidelines to avoid automatic warnings.`,
      productId: product.id,
      productName: product.productName,
      read: false,
      createdAt: serverTimestamp()
    });
    
    alert('Product reactivated successfully!');
    await refreshData();
  } catch (error) {
    console.error('Error reactivating product:', error);
    alert('Failed to reactivate product. Please try again.');
  }
};

const toggleAutoNotifications = () => {
  autoNotificationsEnabled.value = !autoNotificationsEnabled.value;
  updateAutoSettings();
};

const updateAutoSettings = () => {
  const settings = {
    enabled: autoNotificationsEnabled.value,
    daysBetweenWarnings: daysBetweenWarnings.value,
    autoDeactivateEnabled: autoDeactivateEnabled.value,
    systemCheckInterval: systemCheckInterval.value,
    gracePeriodHours: gracePeriodHours.value
  };
  localStorage.setItem('autoNotificationSettings', JSON.stringify(settings));
  
  setupAutoNotificationChecking();
};

const setupAutoNotificationChecking = () => {
  if (autoNotificationInterval) {
    clearInterval(autoNotificationInterval);
  }
  
  if (autoNotificationsEnabled.value) {
    // Run the automatic system at the specified interval
    autoNotificationInterval = setInterval(async () => {
      await runAutomaticSystem();
    }, systemCheckInterval.value * 60 * 1000); // Convert minutes to milliseconds
    
    // Run once immediately
    setTimeout(runAutomaticSystem, 5000); // 5 second delay for initial load
  }
};

const viewWarningHistory = async (product) => {
  selectedProductForHistory.value = product;
  showWarningHistoryModal.value = true;
  
  try {
    const historyQuery = query(
      collection(db, 'warningHistory'),
      where('productId', '==', product.id)
    );
    
    const historySnapshot = await getDocs(historyQuery);
    const historyData = historySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    warningHistory.value = historyData.sort((a, b) => {
      const dateA = a.sentAt?.toDate?.() || new Date(a.sentAt || 0);
      const dateB = b.sentAt?.toDate?.() || new Date(b.sentAt || 0);
      return dateB - dateA;
    });
    
  } catch (error) {
    console.error('Error fetching warning history:', error);
    warningHistory.value = [];
  }
};

const closeWarningHistoryModal = () => {
  showWarningHistoryModal.value = false;
  selectedProductForHistory.value = null;
  warningHistory.value = [];
};

const closeWarningModal = () => {
  showWarningModal.value = false;
  warningTarget.value = null;
  warningMessage.value = '';
  isManualWarning.value = false;
};

const updateWarningMessage = () => {
  if (warningTarget.value) {
    const warningCount = getProductWarningHistory(warningTarget.value.id).length + 1;
    warningMessage.value = generateWarningMessage(warningTarget.value, warningCount, false);
  }
};

const confirmSendWarning = async () => {
  try {
    await sendWarningNotification(warningTarget.value, false); // false = manual
    closeWarningModal();
    alert('Warning sent successfully!');
    await refreshData();
  } catch (error) {
    console.error('Error sending warning:', error);
    alert('Failed to send warning. Please try again.');
  }
};

const viewSellerProfile = (product) => {
  emit('view-seller', product);
};

const getWarningExpiryDate = () => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysBetweenWarnings.value);
  return expiryDate;
};

// Fetch sellers data
const fetchSellers = async () => {
  try {
    const sellersSnapshot = await getDocs(collection(db, 'sellers'));
    sellers.value = sellersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        sellerId: data.userId || doc.id,
        ...data,
        personalInfo: data.personalInfo || {},
        farmDetails: data.farmDetails || {},
      };
    });
  } catch (error) {
    console.error('Error fetching sellers:', error);
  }
};

// Fetch all warning history
const fetchWarningHistory = async () => {
  try {
    const historySnapshot = await getDocs(collection(db, 'warningHistory'));
    allWarningHistory.value = historySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching warning history:', error);
    allWarningHistory.value = [];
  }
};

const getSellerName = (sellerId) => {
  let seller = sellers.value.find(s => s.sellerId === sellerId);
  
  if (!seller) {
    seller = sellers.value.find(s => s.id === sellerId);
  }
  
  if (seller) {
    if (seller.personalInfo?.firstName && seller.personalInfo?.lastName) {
      return `${seller.personalInfo.firstName} ${seller.personalInfo.lastName}`;
    }
    
    if (seller.farmDetails?.farmName) {
      return seller.farmDetails.farmName;
    }
    
    if (seller.farmName) {
      return seller.farmName;
    }
    
    if (seller.personalInfo?.email) {
      return seller.personalInfo.email;
    }
    
    return `Seller ${seller.id}`;
  } else {
    return 'Unknown Seller';
  }
};

// Utility methods
const getImageUrl = (imageData) => {
  if (!imageData) return '/placeholder.svg?height=50&width=50';
  if (imageData.startsWith('http')) return imageData;
  if (imageData.startsWith('data:image')) return imageData;
  return '/placeholder.svg?height=50&width=50';
};

const getDisplayUnit = (product) => {
  if (product.currentPrice) {
    return product.currentPrice.unitLabel;
  }
  return 'N/A';
};

const formatPrice = (price) => {
  if (typeof price === 'object' && price.price) {
    return price.price.toFixed(2);
  }
  return parseFloat(price || 0).toFixed(2);
};

const formatDeviation = (deviation) => {
  if (deviation === null || deviation === undefined) return 'N/A';
  return deviation > 0 ? `+${deviation.toFixed(1)}%` : `${deviation.toFixed(1)}%`;
};

const formatDate = (dateInput) => {
  if (!dateInput) return 'N/A';
  
  let date;
  if (dateInput.toDate && typeof dateInput.toDate === 'function') {
    date = dateInput.toDate();
  } else {
    date = new Date(dateInput);
  }
  
  if (isNaN(date.getTime())) return 'N/A';
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

const getExcessClass = (amount) => {
  if (amount > 100) return 'excess-severe';
  if (amount > 50) return 'excess-moderate';
  if (amount > 20) return 'excess-mild';
  return '';
};

const getSellerOverpricedCount = (sellerId) => {
  return props.overpricedProducts.filter(p => p.sellerId === sellerId).length;
};

// Load settings and data on mount
onMounted(async () => {
  const savedSettings = localStorage.getItem('autoNotificationSettings');
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    autoNotificationsEnabled.value = settings.enabled ?? true;
    daysBetweenWarnings.value = settings.daysBetweenWarnings ?? 3;
    autoDeactivateEnabled.value = settings.autoDeactivateEnabled ?? true;
    systemCheckInterval.value = settings.systemCheckInterval ?? 30;
    gracePeriodHours.value = settings.gracePeriodHours ?? 24;
  }
  
  // Fetch initial data
  await refreshData();
  
  // Setup automatic system
  setupAutoNotificationChecking();
  
  // Add click outside listener for export dropdown
  document.addEventListener('click', handleClickOutside);
});

// Cleanup on unmount
onUnmounted(() => {
  if (autoNotificationInterval) {
    clearInterval(autoNotificationInterval);
  }
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
/* Compact layout without sidebar margin */
.overpriced-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  max-width: 100%;
  min-height: 100vh; /* Change from height to min-height */
  overflow-y: visible; /* Change from auto to visible */
}

.overpriced-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.overpriced-header h2 {
  color: #2e5c31;
  margin: 0;
  font-size: 1.25rem;
}

.bulk-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.bulk-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  transition: all 0.2s;
  font-size: 0.8125rem;
}

.bulk-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bulk-btn:nth-child(2) {
  background: #6b7280;
}

.bulk-btn.deactivate-btn {
  background: #dc2626;
}

.bulk-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Compact controls row */
.controls-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
  align-items: start;
}

.warning-filters {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  background: white;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-group label {
  margin-bottom: 4px;
  color: #666;
  font-size: 0.75rem;
  font-weight: 500;
}

.filter-group select {
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f9f9f9;
  font-size: 0.75rem;
}

.auto-notification-settings {
  background: white;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  border-left: 4px solid #2e5c31;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.settings-header h3 {
  margin: 0;
  color: #2e5c31;
  font-size: 0.875rem;
}

.toggle-auto {
  background: #f3f4f6;
  color: #4b5563;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  transition: all 0.2s;
  font-size: 0.75rem;
}

.toggle-auto.active {
  background: #2e5c31;
  color: white;
}

.settings-content {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  align-items: start;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-item label {
  font-size: 0.6875rem;
  color: #666;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.setting-item select {
  padding: 4px 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 0.6875rem;
}

.setting-item input[type="checkbox"] {
  width: 12px;
  height: 12px;
}

.overpriced-table-section {
  background: white;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: auto; /* Remove fixed height constraints */
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.table-header h3 {
  margin: 0;
  color: #2e5c31;
  font-size: 1rem;
}

.table-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

/* Search Bar Styles */
.search-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 8px;
  color: #666;
  font-size: 0.75rem;
  z-index: 1;
}

.search-input {
  padding: 6px 12px 6px 28px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 0.75rem;
  width: 200px;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #2e5c31;
  box-shadow: 0 0 0 2px rgba(46, 92, 49, 0.1);
}

.clear-search {
  position: absolute;
  right: 4px;
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 2px;
  border-radius: 2px;
  font-size: 0.625rem;
}

.clear-search:hover {
  color: #666;
  background: #f0f0f0;
}

/* Export Dropdown Styles */
.export-dropdown {
  position: relative;
}

.export-toggle {
  background: #2e5c31;
  color: white;
  display: flex;
  align-items: center;
  gap: 6px;
}

.export-toggle:hover {
  background: #1f4322;
}

.export-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  min-width: 160px;
  margin-top: 2px;
}

.export-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 0.75rem;
  color: #333;
  transition: background-color 0.2s;
}

.export-option:hover {
  background: #f5f5f5;
}

.export-option:first-child {
  border-radius: 4px 4px 0 0;
}

.export-option:last-child {
  border-radius: 0 0 4px 4px;
}

.refresh-btn {
  background: #2e5c31;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  transition: all 0.2s;
  font-size: 0.75rem;
}

.refresh-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Table Wrapper - No scroll bars, fixed layout */
.table-wrapper {
  width: 100%;
  overflow: visible; /* Remove hidden overflow */
  margin-bottom: 16px; /* Add space before pagination */
}

.products-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
  table-layout: fixed;
  margin-bottom: 0; /* Remove any bottom margin */
}

.products-table th,
.products-table td {
  padding: 12px 8px; /* Taller row height */
  text-align: left;
  border-bottom: 1px solid #eee;
  vertical-align: top;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Column widths */
.products-table th:nth-child(1),
.products-table td:nth-child(1) { width: 18%; } /* Product */
.products-table th:nth-child(2),
.products-table td:nth-child(2) { width: 12%; } /* Seller */
.products-table th:nth-child(3),
.products-table td:nth-child(3) { width: 8%; } /* Seller Price */
.products-table th:nth-child(4),
.products-table td:nth-child(4) { width: 8%; } /* D.A. Max Price */
.products-table th:nth-child(5),
.products-table td:nth-child(5) { width: 10%; } /* Excess Amount */
.products-table th:nth-child(6),
.products-table td:nth-child(6) { width: 8%; } /* Warning Level */
.products-table th:nth-child(7),
.products-table td:nth-child(7) { width: 8%; } /* Warning Status */
.products-table th:nth-child(8),
.products-table td:nth-child(8) { width: 9%; } /* Last Warning */
.products-table th:nth-child(9),
.products-table td:nth-child(9) { width: 8%; } /* Next Action */
.products-table th:nth-child(10),
.products-table td:nth-child(10) { width: 8%; } /* Auto Status */
.products-table th:nth-child(11),
.products-table td:nth-child(11) { width: 8%; } /* Actions - reduced width */

.products-table th {
  background: #f5f5f5;
  color: #2e5c31;
  font-weight: 600;
  font-size: 0.75rem;
  position: sticky;
  top: 0;
  z-index: 10;
}

.products-table tr:hover {
  background: #f9f9f9;
}

.product-inactive {
  background: #fee2e2 !important;
  opacity: 0.7;
}

.final-warning-reached {
  background: #fef3c7 !important;
}

.auto-warning-pending {
  border-left: 3px solid #f59e0b;
}

.auto-deactivation-pending {
  border-left: 3px solid #dc2626;
  background: #fef2f2 !important;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.product-image {
  width: 32px; /* Slightly bigger */
  height: 32px;
  border-radius: 4px;
  background-size: cover;
  background-position: center;
  background-color: #f0f0f0;
  flex-shrink: 0;
}

.product-info {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-weight: 500;
  color: #333;
  line-height: 1.3;
  font-size: 0.8125rem; /* Slightly bigger font */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-meta {
  display: flex;
  gap: 3px;
  margin-top: 3px;
  flex-wrap: wrap;
}

.variety-badge,
.unit-badge,
.status-badge {
  font-size: 0.625rem;
  padding: 2px 4px;
  border-radius: 6px;
  font-weight: 500;
}

.variety-badge {
  background: #a78bfa;
  color: #5b21b6;
}

.unit-badge {
  background: #e5e7eb;
  color: #374151;
}

.status-badge.inactive {
  background: #ef4444;
  color: white;
}

.seller-info {
  display: flex;
  flex-direction: column;
}

.seller-name {
  font-weight: 500;
  color: #333;
  line-height: 1.3;
  font-size: 0.8125rem; /* Slightly bigger font */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.seller-stats {
  margin-top: 2px;
}

.overpriced-count {
  font-size: 0.6875rem;
  color: #ef4444;
  font-weight: 500;
}

.price-display {
  display: flex;
  flex-direction: column;
}

.current-price {
  font-weight: 600;
  color: #333;
  font-size: 0.8125rem; /* Slightly bigger font */
}

.text-danger {
  color: #ef4444;
}

.reference-price {
  display: flex;
  flex-direction: column;
}

.max-price {
  font-weight: 500;
  color: #059669;
  font-size: 0.8125rem; /* Slightly bigger font */
}

.excess-amount {
  font-weight: 600;
  font-size: 0.8125rem; /* Slightly bigger font */
}

.excess-mild {
  color: #f59e0b;
}

.excess-moderate {
  color: #ef4444;
}

.excess-severe {
  color: #dc2626;
}

.warning-level {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 0.625rem; /* Made smaller */
  font-weight: 500;
}

.warning-mild {
  background: #fef3c7;
  color: #92400e;
}

.warning-moderate {
  background: #fed7aa;
  color: #ea580c;
}

.warning-severe {
  background: #fee2e2;
  color: #991b1b;
}

.warning-status {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 0.625rem; /* Made smaller */
  font-weight: 500;
}

.status-none {
  background: #f3f4f6;
  color: #6b7280;
}

.status-warned {
  background: #fef3c7;
  color: #92400e;
}

.status-final {
  background: #fee2e2;
  color: #991b1b;
}

.last-warning {
  display: flex;
  flex-direction: column;
  font-size: 0.8125rem; /* Slightly bigger font */
}

.warning-count {
  color: #666;
  font-size: 0.6875rem;
  margin-top: 2px;
}

.no-warning {
  color: #999;
  font-style: italic;
  font-size: 0.6875rem;
}

.next-action {
  display: flex;
  flex-direction: column;
  font-size: 0.6875rem;
}

.next-date {
  color: #666;
  font-size: 0.625rem;
  margin-top: 2px;
}

.auto-status {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 0.625rem;
  font-weight: 500;
}

.auto-status-normal {
  background: #d1fae5;
  color: #065f46;
}

.auto-status-warning {
  background: #fef3c7;
  color: #92400e;
}

.auto-status-deactivate {
  background: #fee2e2;
  color: #991b1b;
}

.auto-status-inactive {
  background: #f3f4f6;
  color: #6b7280;
}

.action-buttons {
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.action-btn {
  width: 20px; /* Compact size */
  height: 20px;
  border-radius: 3px;
  border: none;
  background: #f0f0f0;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 0.625rem;
}

.warn-btn:hover {
  background: #fff8e1;
  color: #ff8f00;
}

.deactivate-btn:hover {
  background: #fee2e2;
  color: #dc2626;
}

.reactivate-btn:hover {
  background: #d1fae5;
  color: #059669;
}

.view-btn:hover {
  background: #e3f2fd;
  color: #1976d2;
}

.history-btn:hover {
  background: #f3e8ff;
  color: #7c3aed;
}

/* Simple Pagination Styles */
.simple-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-top: 1px solid #eee;
  margin-top: 0; /* Remove extra margin */
  flex-shrink: 0; /* Prevent shrinking */
}

.pagination-info {
  color: #666;
  font-size: 0.875rem;
}

.pagination-nav {
  display: flex;
  align-items: center;
  gap: 16px;
}

.pagination-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  color: #666;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  font-size: 0.875rem;
  font-weight: 500;
}

.pagination-btn:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #2e5c31;
  color: #2e5c31;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-indicator {
  font-size: 0.875rem;
  color: #666;
  font-weight: 500;
  white-space: nowrap;
}

/* Export Preview Modal Styles */
.export-preview-modal {
  max-width: 90vw;
  width: 800px;
}

.export-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
}

.summary-item {
  font-size: 0.875rem;
}

.preview-container h4 {
  margin: 0 0 12px 0;
  color: #2e5c31;
  font-size: 1rem;
}

.preview-table-container {
  overflow-x: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 12px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
  min-width: 600px;
}

.preview-table th,
.preview-table td {
  padding: 6px 8px;
  border-bottom: 1px solid #eee;
  text-align: left;
}

.preview-table th {
  background: #f5f5f5;
  font-weight: 600;
  color: #2e5c31;
  position: sticky;
  top: 0;
}

.preview-table td {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-note {
  text-align: center;
  color: #666;
  font-style: italic;
  font-size: 0.875rem;
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
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  color: #2e5c31;
  font-size: 1.125rem;
}

.close-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
}

.close-btn:hover {
  color: #666;
}

.modal-body {
  padding: 20px;
}

.no-history {
  text-align: center;
  color: #666;
  padding: 40px 20px;
}

.warning-history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.warning-history-item {
  background: #f9f9f9;
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid #2e5c31;
}

.warning-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.warning-type {
  background: #2e5c31;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.warning-date {
  color: #666;
  font-size: 0.75rem;
}

.auto-badge {
  background: #f59e0b;
  color: white;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 0.625rem;
  font-weight: 600;
}

.warning-message {
  color: #333;
  margin: 8px 0;
  line-height: 1.4;
  white-space: pre-wrap;
  font-size: 0.875rem;
}

.warning-details {
  display: flex;
  gap: 12px;
  font-size: 0.75rem;
  flex-wrap: wrap;
}

.warning-level,
.price-at-time {
  color: #666;
}

.response-status.responded {
  color: #059669;
  font-weight: 500;
}

.response-status.no-response {
  color: #ef4444;
  font-weight: 500;
}

/* Warning modal styles */
.product-summary {
  background: #f9f9f9;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.product-summary h3 {
  margin: 0 0 8px 0;
  color: #2e5c31;
  font-size: 1rem;
}

.product-summary p {
  margin: 4px 0;
  font-size: 0.875rem;
}

.warning-message {
  margin-bottom: 12px;
}

.warning-message label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #333;
  font-size: 0.875rem;
}

.warning-message textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.875rem;
  line-height: 1.4;
  resize: vertical;
  min-height: 100px;
}

.warning-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.warning-options label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: #666;
  cursor: pointer;
}

.warning-options input[type="checkbox"] {
  width: 14px;
  height: 14px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.secondary-btn {
  background: #f3f4f6;
  color: #4b5563;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.secondary-btn:hover {
  background: #e5e7eb;
}

.primary-btn {
  background: #2e5c31;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.primary-btn:hover:not(:disabled) {
  background: #1f4322;
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive styles */
@media (max-width: 1024px) {
  .controls-row {
    grid-template-columns: 1fr;
  }
  
  .warning-filters {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .settings-content {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .table-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .overpriced-view {
    padding: 8px;
    gap: 8px;
  }
  
  .overpriced-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .bulk-actions {
    flex-direction: column;
  }
  
  .bulk-btn {
    width: 100%;
    justify-content: center;
  }
  
  .warning-filters {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .settings-content {
    grid-template-columns: 1fr;
    gap: 6px;
  }
  
  .settings-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .table-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .table-actions {
    flex-direction: column;
    gap: 6px;
  }
  
  .simple-pagination {
    flex-direction: column;
    gap: 8px;
  }
  
  .pagination-nav {
    flex-direction: column;
    gap: 8px;
  }
  
  .modal-content {
    width: 95%;
    margin: 10px;
  }
  
  .warning-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .warning-details {
    flex-direction: column;
    gap: 4px;
  }
  
  .export-summary {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .overpriced-view {
    padding: 6px;
  }
  
  .overpriced-header h2 {
    font-size: 1.125rem;
  }
  
  .bulk-btn {
    padding: 8px 10px;
    font-size: 0.75rem;
  }
  
  .modal-body {
    padding: 16px;
  }
  
  .product-summary {
    padding: 10px;
  }
  
  .warning-message textarea {
    min-height: 80px;
  }
  
  .pagination-nav {
    flex-wrap: wrap;
  }
}

.unit-label {
  display: block;
  color: #666;
  font-size: 0.6875rem;
  margin-top: 2px;
}
</style>