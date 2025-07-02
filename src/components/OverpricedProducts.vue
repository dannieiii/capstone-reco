<template>
  <div class="overpriced-view">
    <div class="overpriced-header">
      <h2>Overpriced Products Management</h2>
      <div class="bulk-actions">
        <button class="bulk-btn" @click="sendBulkWarnings" :disabled="selectedOverpriced.length === 0">
          <i class="fas fa-bullhorn"></i> Send Bulk Warnings ({{ selectedOverpriced.length }})
        </button>
        <button class="bulk-btn" @click="exportOverpricedReport">
          <i class="fas fa-download"></i> Export Report
        </button>
        <button class="bulk-btn deactivate-btn" @click="bulkDeactivateProducts" :disabled="selectedForDeactivation.length === 0">
          <i class="fas fa-ban"></i> Deactivate Products ({{ selectedForDeactivation.length }})
        </button>
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
          <button class="refresh-btn" @click="refreshData" :disabled="isRefreshing">
            <i class="fas fa-sync-alt" :class="{ 'fa-spin': isRefreshing }"></i>
            {{ isRefreshing ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>
                <input type="checkbox" @change="toggleSelectAll" :checked="allSelected">
              </th>
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
            <tr v-for="product in filteredOverpricedProducts" :key="product.id" :class="getProductRowClass(product)">
              <td>
                <input type="checkbox" v-model="selectedOverpriced" :value="product.id">
              </td>
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
                  <span class="current-price text-danger">₱{{ formatPrice(product.currentPrice?.price || product.price) }}</span>
                </div>
              </td>
              <td>
                <div class="reference-price">
                  <span class="max-price">₱{{ product.daReference?.maxPrice || 'N/A' }}</span>
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
const selectedOverpriced = ref([]);
const selectedForDeactivation = ref([]);
const isRefreshing = ref(false);

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

const filteredOverpricedProducts = computed(() => {
  let result = [...productsWithWarningLevels.value];
  
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

const allSelected = computed(() => {
  return filteredOverpricedProducts.value.length > 0 && 
         selectedOverpriced.value.length === filteredOverpricedProducts.value.length;
});

const productsWithWarningLevels = computed(() => {
  return props.overpricedProducts.map(product => {
    let warningLevel = 'mild'; // Default to mild instead of empty
    if (product.deviation >= 50) {
      warningLevel = 'severe';
    } else if (product.deviation >= 25) {
      warningLevel = 'moderate';
    } else if (product.deviation >= 10) {
      warningLevel = 'mild';
    }
    
    return {
      ...product,
      warningLevel
    };
  });
});

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

// Enhanced export functionality
const exportOverpricedReport = () => {
  try {
    const csvData = filteredOverpricedProducts.value.map(product => {
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
        'Pending Auto Deactivation': shouldAutoDeactivate(product) ? 'Yes' : 'No',
        'Export Date': new Date().toISOString().split('T')[0],
        'Export Time': new Date().toLocaleTimeString()
      };
    });
    
    // Convert to CSV
    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in values
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');
    
    // Create and download file
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
    
    alert(`Export completed! Downloaded ${csvData.length} records.`);
    
  } catch (error) {
    console.error('Export error:', error);
    alert('Failed to export report. Please try again.');
  }
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
  selectedOverpriced.value = [];
  selectedForDeactivation.value = [];
};

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedOverpriced.value = [];
  } else {
    selectedOverpriced.value = filteredOverpricedProducts.value.map(p => p.id);
  }
  updateDeactivationSelection();
};

const updateDeactivationSelection = () => {
  selectedForDeactivation.value = selectedOverpriced.value.filter(productId => {
    const product = props.overpricedProducts.find(p => p.id === productId);
    return canDeactivateProduct(product);
  });
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

const sendBulkWarnings = async () => {
  if (selectedOverpriced.value.length === 0) return;
  
  const confirmed = confirm(`Send warnings to ${selectedOverpriced.value.length} sellers?`);
  if (!confirmed) return;
  
  try {
    const promises = selectedOverpriced.value.map(productId => {
      const product = props.overpricedProducts.find(p => p.id === productId);
      if (product && canSendWarning(product)) {
        return sendWarningNotification(product, false); // false = manual
      }
    });
    
    await Promise.all(promises.filter(Boolean));
    selectedOverpriced.value = [];
    alert('Bulk warnings sent successfully!');
    await refreshData();
    
  } catch (error) {
    console.error('Error sending bulk warnings:', error);
    alert('Failed to send bulk warnings. Please try again.');
  }
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

const bulkDeactivateProducts = async () => {
  if (selectedForDeactivation.value.length === 0) return;
  
  const confirmed = confirm(`Are you sure you want to deactivate ${selectedForDeactivation.value.length} products?`);
  if (!confirmed) return;
  
  try {
    const promises = selectedForDeactivation.value.map(productId => 
      deactivateProductById(productId, 'manual')
    );
    
    await Promise.all(promises);
    selectedOverpriced.value = [];
    selectedForDeactivation.value = [];
    alert('Products deactivated successfully!');
    await refreshData();
  } catch (error) {
    console.error('Error deactivating products:', error);
    alert('Failed to deactivate products. Please try again.');
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
});

// Cleanup on unmount
onUnmounted(() => {
  if (autoNotificationInterval) {
    clearInterval(autoNotificationInterval);
  }
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
  height: 100vh;
  overflow-y: auto;
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
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.table-header h3 {
  margin: 0;
  color: #2e5c31;
  font-size: 1rem;
}

.table-actions {
  display: flex;
  gap: 6px;
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

.table-container {
  overflow: auto;
  flex: 1;
  min-height: 0;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1200px;
  font-size: 0.75rem;
}

th, td {
  padding: 6px 8px;
  text-align: left;
  border-bottom: 1px solid #eee;
  vertical-align: top;
}

th {
  background: #f5f5f5;
  color: #2e5c31;
  font-weight: 600;
  font-size: 0.6875rem;
  position: sticky;
  top: 0;
  z-index: 10;
}

tr:hover {
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
  gap: 6px;
  min-width: 140px;
}

.product-image {
  width: 28px;
  height: 28px;
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
  line-height: 1.2;
  font-size: 0.75rem;
}

.product-meta {
  display: flex;
  gap: 2px;
  margin-top: 2px;
  flex-wrap: wrap;
}

.variety-badge,
.unit-badge,
.status-badge {
  font-size: 0.5625rem;
  padding: 1px 3px;
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
  min-width: 80px;
}

.seller-name {
  font-weight: 500;
  color: #333;
  line-height: 1.2;
  font-size: 0.75rem;
}

.seller-stats {
  margin-top: 1px;
}

.overpriced-count {
  font-size: 0.625rem;
  color: #ef4444;
  font-weight: 500;
}

.price-display {
  display: flex;
  flex-direction: column;
  min-width: 60px;
}

.current-price {
  font-weight: 600;
  color: #333;
  font-size: 0.75rem;
}

.text-danger {
  color: #ef4444;
}

.reference-price {
  display: flex;
  flex-direction: column;
  min-width: 60px;
}

.max-price {
  font-weight: 500;
  color: #059669;
  font-size: 0.75rem;
}

.excess-amount {
  font-weight: 600;
  min-width: 80px;
  font-size: 0.75rem;
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
  gap: 3px;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 0.625rem;
  font-weight: 500;
  min-width: 60px;
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
  gap: 3px;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 0.625rem;
  font-weight: 500;
  min-width: 60px;
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
  min-width: 80px;
  font-size: 0.75rem;
}

.warning-count {
  color: #666;
  font-size: 0.625rem;
  margin-top: 1px;
}

.no-warning {
  color: #999;
  font-style: italic;
  font-size: 0.625rem;
}

.next-action {
  display: flex;
  flex-direction: column;
  font-size: 0.625rem;
  min-width: 80px;
}

.next-date {
  color: #666;
  font-size: 0.5625rem;
  margin-top: 1px;
}

.auto-status {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 0.5625rem;
  font-weight: 500;
  min-width: 60px;
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
  min-width: 100px;
}

.action-btn {
  width: 20px;
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
    gap: 6px;
    align-items: stretch;
  }
  
  .table-container {
    overflow-x: scroll;
  }
  
  table {
    min-width: 800px;
  }
  
  th, td {
    padding: 4px 3px;
  }
  
  .product-cell {
    min-width: 100px;
  }
  
  .action-buttons {
    min-width: 80px;
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
}
</style>
