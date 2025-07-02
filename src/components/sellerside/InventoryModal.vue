<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Product Price Analysis</h2>
        <button class="close-btn" @click="closeModal">
          <i class="i-lucide-x"></i>
        </button>
      </div>
      
      <div class="modal-body" v-if="product">
        <!-- Product Info Section -->
        <div class="product-info-section">
          <div class="product-image-container">
            <img :src="getProductImage(product)" :alt="product.productName" class="product-image">
          </div>
          
          <div class="product-details">
            <h3 class="product-title">{{ product.productName }}</h3>
            <div class="product-meta">
              <div class="meta-item">
                <span class="meta-label">Category:</span>
                <span class="meta-value">{{ product.category }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Current Price:</span>
                <span class="meta-value price">₱{{ formatPrice(getMainPrice(product)) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary Info -->
        <div class="summary-section">
               <h4>Current Stock Levels</h4>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="summary-label">Stock</span>
              <span class="summary-value">{{ getTotalStock() }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Units Available</span>
              <span class="summary-value">{{ getAvailableUnitsCount() }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Warning Count</span>
              <span class="summary-value warning">{{ getLowStockCount() }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Last Updated</span>
              <span class="summary-value">{{ formatDate(product.updatedAt) }}</span>
            </div>
          </div>
        </div>

        <!-- Stock Levels Section -->
        <div class="stock-section">
       
          <div class="stock-grid">
            <div v-if="product.availableUnits?.includes('perKilo') || product.stockPerKilo > 0" class="stock-item">
              <div class="stock-header">
                <span class="stock-unit">Kilogram</span>
                <span class="stock-count" :class="getStockLevelClass(product.stockPerKilo)">
                  {{ product.stockPerKilo || 0 }}
                </span>
              </div>
              <div class="stock-actions">
                <button class="stock-btn decrease" @click="adjustStock('stockPerKilo', -1)" :disabled="true">-</button>
                <input 
                  type="number" 
                  v-model.number="localStocks.stockPerKilo" 
                  @change="updateStock('stockPerKilo')"
                  class="stock-input"
                  min="0"
                >
                <button class="stock-btn increase" @click="adjustStock('stockPerKilo', 1)">+</button>
              </div>
            </div>

            <div v-if="product.availableUnits?.includes('perSack') || product.stockPerSack > 0" class="stock-item">
              <div class="stock-header">
                <span class="stock-unit">Sack</span>
                <span class="stock-count" :class="getStockLevelClass(product.stockPerSack)">
                  {{ product.stockPerSack || 0 }}
                </span>
              </div>
              <div class="stock-actions">
                <button class="stock-btn decrease" @click="adjustStock('stockPerSack', -1)" :disabled="true">-</button>
                <input 
                  type="number" 
                  v-model.number="localStocks.stockPerSack" 
                  @change="updateStock('stockPerSack')"
                  class="stock-input"
                  min="0"
                >
                <button class="stock-btn increase" @click="adjustStock('stockPerSack', 1)">+</button>
              </div>
            </div>

            <div v-if="product.availableUnits?.includes('perTali') || product.stockPerTali > 0" class="stock-item">
              <div class="stock-header">
                <span class="stock-unit">Tali</span>
                <span class="stock-count" :class="getStockLevelClass(product.stockPerTali)">
                  {{ product.stockPerTali || 0 }}
                </span>
              </div>
              <div class="stock-actions">
                <button class="stock-btn decrease" @click="adjustStock('stockPerTali', -1)" :disabled="true">-</button>
                <input 
                  type="number" 
                  v-model.number="localStocks.stockPerTali" 
                  @change="updateStock('stockPerTali')"
                  class="stock-input"
                  min="0"
                >
                <button class="stock-btn increase" @click="adjustStock('stockPerTali', 1)">+</button>
              </div>
            </div>

            <div v-if="product.availableUnits?.includes('perKaing') || product.stockPerKaing > 0" class="stock-item">
              <div class="stock-header">
                <span class="stock-unit">Kaing</span>
                <span class="stock-count" :class="getStockLevelClass(product.stockPerKaing)">
                  {{ product.stockPerKaing || 0 }}
                </span>
              </div>
              <div class="stock-actions">
                <button class="stock-btn decrease" @click="adjustStock('stockPerKaing', -1)" :disabled="true">-</button>
                <input 
                  type="number" 
                  v-model.number="localStocks.stockPerKaing" 
                  @change="updateStock('stockPerKaing')"
                  class="stock-input"
                  min="0"
                >
                <button class="stock-btn increase" @click="adjustStock('stockPerKaing', 1)">+</button>
              </div>
            </div>

            <div v-if="product.availableUnits?.includes('perBundle') || product.stockPerBundle > 0" class="stock-item">
              <div class="stock-header">
                <span class="stock-unit">Bundle</span>
                <span class="stock-count" :class="getStockLevelClass(product.stockPerBundle)">
                  {{ product.stockPerBundle || 0 }}
                </span>
              </div>
              <div class="stock-actions">
                <button class="stock-btn decrease" @click="adjustStock('stockPerBundle', -1)" :disabled="true">-</button>
                <input 
                  type="number" 
                  v-model.number="localStocks.stockPerBundle" 
                  @change="updateStock('stockPerBundle')"
                  class="stock-input"
                  min="0"
                >
                <button class="stock-btn increase" @click="adjustStock('stockPerBundle', 1)">+</button>
              </div>
            </div>

            <div v-if="product.availableUnits?.includes('perTray') || product.stockPerTray > 0" class="stock-item">
              <div class="stock-header">
                <span class="stock-unit">Tray</span>
                <span class="stock-count" :class="getStockLevelClass(product.stockPerTray)">
                  {{ product.stockPerTray || 0 }}
                </span>
              </div>
              <div class="stock-actions">
                <button class="stock-btn decrease" @click="adjustStock('stockPerTray', -1)" :disabled="true">-</button>
                <input 
                  type="number" 
                  v-model.number="localStocks.stockPerTray" 
                  @change="updateStock('stockPerTray')"
                  class="stock-input"
                  min="0"
                >
                <button class="stock-btn increase" @click="adjustStock('stockPerTray', 1)">+</button>
              </div>
            </div>

            <div v-if="product.availableUnits?.includes('perPiece') || product.stockPerPiece > 0" class="stock-item">
              <div class="stock-header">
                <span class="stock-unit">Piece</span>
                <span class="stock-count" :class="getStockLevelClass(product.stockPerPiece)">
                  {{ product.stockPerPiece || 0 }}
                </span>
              </div>
              <div class="stock-actions">
                <button class="stock-btn decrease" @click="adjustStock('stockPerPiece', -1)" :disabled="true">-</button>
                <input 
                  type="number" 
                  v-model.number="localStocks.stockPerPiece" 
                  @change="updateStock('stockPerPiece')"
                  class="stock-input"
                  min="0"
                >
                <button class="stock-btn increase" @click="adjustStock('stockPerPiece', 1)">+</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Stock Overview Table -->
        <div class="stock-table-section">
          <div class="stock-table-container">
            <table class="stock-table">
              <thead>
                <tr>
                  <th>Stock Unit</th>
                  <th>Min</th>
                  <th>Add</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="product.availableUnits?.includes('perKilo') || product.stockPerKilo > 0">
                  <td class="unit-name">
                    <span class="unit-icon">📦</span>
                    Kilogram
                  </td>
                  <td class="min-stock">{{ getMinStock('stockPerKilo') }}</td>
                  <td class="add-stock">
                    <div class="add-controls">
                      <button class="add-btn" @click="quickAddStock('stockPerKilo', 10)">+10</button>
                      <button class="add-btn" @click="quickAddStock('stockPerKilo', 50)">+50</button>
                    </div>
                  </td>
                  <td class="total-stock">
                    <span class="total-value" :class="getStockLevelClass(localStocks.stockPerKilo)">
                      {{ localStocks.stockPerKilo || 0 }}
                    </span>
                  </td>
                </tr>
                
                <tr v-if="product.availableUnits?.includes('perSack') || product.stockPerSack > 0">
                  <td class="unit-name">
                    <span class="unit-icon">🎒</span>
                    Sack
                  </td>
                  <td class="min-stock">{{ getMinStock('stockPerSack') }}</td>
                  <td class="add-stock">
                    <div class="add-controls">
                      <button class="add-btn" @click="quickAddStock('stockPerSack', 5)">+5</button>
                      <button class="add-btn" @click="quickAddStock('stockPerSack', 20)">+20</button>
                    </div>
                  </td>
                  <td class="total-stock">
                    <span class="total-value" :class="getStockLevelClass(localStocks.stockPerSack)">
                      {{ localStocks.stockPerSack || 0 }}
                    </span>
                  </td>
                </tr>
                
                <tr v-if="product.availableUnits?.includes('perTali') || product.stockPerTali > 0">
                  <td class="unit-name">
                    <span class="unit-icon">🪢</span>
                    Tali
                  </td>
                  <td class="min-stock">{{ getMinStock('stockPerTali') }}</td>
                  <td class="add-stock">
                    <div class="add-controls">
                      <button class="add-btn" @click="quickAddStock('stockPerTali', 10)">+10</button>
                      <button class="add-btn" @click="quickAddStock('stockPerTali', 30)">+30</button>
                    </div>
                  </td>
                  <td class="total-stock">
                    <span class="total-value" :class="getStockLevelClass(localStocks.stockPerTali)">
                      {{ localStocks.stockPerTali || 0 }}
                    </span>
                  </td>
                </tr>
                
                <tr v-if="product.availableUnits?.includes('perKaing') || product.stockPerKaing > 0">
                  <td class="unit-name">
                    <span class="unit-icon">🧺</span>
                    Kaing
                  </td>
                  <td class="min-stock">{{ getMinStock('stockPerKaing') }}</td>
                  <td class="add-stock">
                    <div class="add-controls">
                      <button class="add-btn" @click="quickAddStock('stockPerKaing', 5)">+5</button>
                      <button class="add-btn" @click="quickAddStock('stockPerKaing', 15)">+15</button>
                    </div>
                  </td>
                  <td class="total-stock">
                    <span class="total-value" :class="getStockLevelClass(localStocks.stockPerKaing)">
                      {{ localStocks.stockPerKaing || 0 }}
                    </span>
                  </td>
                </tr>
                
                <tr v-if="product.availableUnits?.includes('perBundle') || product.stockPerBundle > 0">
                  <td class="unit-name">
                    <span class="unit-icon">📦</span>
                    Bundle
                  </td>
                  <td class="min-stock">{{ getMinStock('stockPerBundle') }}</td>
                  <td class="add-stock">
                    <div class="add-controls">
                      <button class="add-btn" @click="quickAddStock('stockPerBundle', 10)">+10</button>
                      <button class="add-btn" @click="quickAddStock('stockPerBundle', 25)">+25</button>
                    </div>
                  </td>
                  <td class="total-stock">
                    <span class="total-value" :class="getStockLevelClass(localStocks.stockPerBundle)">
                      {{ localStocks.stockPerBundle || 0 }}
                    </span>
                  </td>
                </tr>
                
                <tr v-if="product.availableUnits?.includes('perTray') || product.stockPerTray > 0">
                  <td class="unit-name">
                    <span class="unit-icon">🗃️</span>
                    Tray
                  </td>
                  <td class="min-stock">{{ getMinStock('stockPerTray') }}</td>
                  <td class="add-stock">
                    <div class="add-controls">
                      <button class="add-btn" @click="quickAddStock('stockPerTray', 5)">+5</button>
                      <button class="add-btn" @click="quickAddStock('stockPerTray', 20)">+20</button>
                    </div>
                  </td>
                  <td class="total-stock">
                    <span class="total-value" :class="getStockLevelClass(localStocks.stockPerTray)">
                      {{ localStocks.stockPerTray || 0 }}
                    </span>
                  </td>
                </tr>
                
                <tr v-if="product.availableUnits?.includes('perPiece') || product.stockPerPiece > 0">
                  <td class="unit-name">
                    <span class="unit-icon">🔢</span>
                    Piece
                  </td>
                  <td class="min-stock">{{ getMinStock('stockPerPiece') }}</td>
                  <td class="add-stock">
                    <div class="add-controls">
                      <button class="add-btn" @click="quickAddStock('stockPerPiece', 50)">+50</button>
                      <button class="add-btn" @click="quickAddStock('stockPerPiece', 100)">+100</button>
                    </div>
                  </td>
                  <td class="total-stock">
                    <span class="total-value" :class="getStockLevelClass(localStocks.stockPerPiece)">
                      {{ localStocks.stockPerPiece || 0 }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="closeModal">Close</button>
        <button class="btn-primary" @click="saveChanges" :disabled="!hasChanges">
          <i class="i-lucide-save" v-if="!isSaving"></i>
          <i class="i-lucide-loader-2 spinning" v-else></i>
          {{ isSaving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </div>
    
    <!-- Alert Component -->
    <div v-if="alert.show" class="alert-overlay">
      <div class="alert-container" :class="alert.type">
        <div class="alert-icon">
          <svg v-if="alert.type === 'success'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <svg v-else-if="alert.type === 'error'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <div class="alert-content">
          <h4>{{ alert.title }}</h4>
          <p>{{ alert.message }}</p>
        </div>
        <button class="alert-close" @click="closeAlert">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  product: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'update']);

const isSaving = ref(false);
const localStocks = reactive({
  stockPerKilo: 0,
  stockPerSack: 0,
  stockPerTali: 0,
  stockPerKaing: 0,
  stockPerBundle: 0,
  stockPerTray: 0,
  stockPerPiece: 0
});

const originalStocks = reactive({
  stockPerKilo: 0,
  stockPerSack: 0,
  stockPerTali: 0,
  stockPerKaing: 0,
  stockPerBundle: 0,
  stockPerTray: 0,
  stockPerPiece: 0
});

// Alert state
const alert = reactive({
  show: false,
  type: 'info', // 'success', 'error', 'warning', 'info'
  title: '',
  message: ''
});

// Watch for product changes to update local stocks
watch(() => props.product, (newProduct) => {
  if (newProduct) {
    localStocks.stockPerKilo = newProduct.stockPerKilo || 0;
    localStocks.stockPerSack = newProduct.stockPerSack || 0;
    localStocks.stockPerTali = newProduct.stockPerTali || 0;
    localStocks.stockPerKaing = newProduct.stockPerKaing || 0;
    localStocks.stockPerBundle = newProduct.stockPerBundle || 0;
    localStocks.stockPerTray = newProduct.stockPerTray || 0;
    localStocks.stockPerPiece = newProduct.stockPerPiece || 0;

    // Store original values
    Object.assign(originalStocks, localStocks);
  }
}, { immediate: true });

// Check if there are any changes
const hasChanges = computed(() => {
  return Object.keys(localStocks).some(key => localStocks[key] !== originalStocks[key]);
});

// Helper functions
const getProductImage = (product) => {
  if (product.image && product.image.trim() !== '') {
    return product.image;
  }
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0];
  }
  if (product.productImage && product.productImage.trim() !== '') {
    return product.productImage;
  }
  return '/placeholder.svg?height=200&width=200';
};

const getMainPrice = (product) => {
  if (product.pricePerKg) return product.pricePerKg;
  if (product.pricePerSack) return product.pricePerSack;
  if (product.pricePerTali) return product.pricePerTali;
  if (product.pricePerKaing) return product.pricePerKaing;
  if (product.pricePerBundle) return product.pricePerBundle;
  if (product.pricePerTray) return product.pricePerTray;
  if (product.pricePerPiece) return product.pricePerPiece;
  return 0;
};

const formatPrice = (price) => {
  return parseFloat(price || 0).toFixed(2);
};

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  let date;
  if (timestamp && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStockLevelClass = (stock) => {
  if (stock === 0) return 'out-of-stock';
  if (stock <= 10) return 'low-stock';
  if (stock > 50) return 'high-stock';
  return 'normal-stock';
};

const getTotalStock = () => {
  return Object.values(localStocks).reduce((total, stock) => total + (stock || 0), 0);
};

const getAvailableUnitsCount = () => {
  if (!props.product?.availableUnits) return 0;
  return props.product.availableUnits.length;
};

const getLowStockCount = () => {
  return Object.values(localStocks).filter(stock => stock > 0 && stock <= 10).length;
};

// Stock adjustment functions
const adjustStock = (stockType, change) => {
  const oldValue = localStocks[stockType] || 0;
  
  // Prevent stock deduction by sellers
  if (change < 0) {
    const unitName = getUnitDisplayName(stockType);
    showAlert('error', 'Action Not Allowed', `Cannot decrease ${unitName} stock. Only stock additions are permitted.`);
    return;
  }
  
  const newValue = Math.max(0, oldValue + change);
  localStocks[stockType] = newValue;
  
  // Show alert for stock increase only
  if (change > 0) {
    const unitName = getUnitDisplayName(stockType);
    showAlert('info', 'Stock Increased', `${unitName} stock increased by ${change} units. New total: ${newValue}`);
  }
};

const updateStock = (stockType) => {
  const originalValue = originalStocks[stockType] || 0;
  const currentValue = localStocks[stockType] || 0;
  
  // Prevent manual stock reduction
  if (currentValue < originalValue) {
    localStocks[stockType] = originalValue;
    const unitName = getUnitDisplayName(stockType);
    showAlert('error', 'Action Not Allowed', `Cannot reduce ${unitName} stock below original value. Stock can only be increased.`);
    return;
  }
  
  // Ensure minimum value is 0
  if (localStocks[stockType] < 0) {
    localStocks[stockType] = 0;
  }
};

// Quick add stock functions
const quickAddStock = (stockType, amount) => {
  const oldValue = localStocks[stockType] || 0;
  localStocks[stockType] = oldValue + amount;
  
  // Show alert for quick add
  const unitName = getUnitDisplayName(stockType);
  showAlert('success', 'Stock Added', `${amount} units added to ${unitName}. New total: ${localStocks[stockType]}`);
};

const getMinStock = (stockType) => {
  // Set minimum stock levels for different units
  const minLevels = {
    stockPerKilo: 5,
    stockPerSack: 2,
    stockPerTali: 3,
    stockPerKaing: 2,
    stockPerBundle: 5,
    stockPerTray: 3,
    stockPerPiece: 10
  };
  return minLevels[stockType] || 0;
};

// Helper function to get unit display name
const getUnitDisplayName = (stockType) => {
  const unitNames = {
    stockPerKilo: 'Kilogram',
    stockPerSack: 'Sack',
    stockPerTali: 'Tali',
    stockPerKaing: 'Kaing',
    stockPerBundle: 'Bundle',
    stockPerTray: 'Tray',
    stockPerPiece: 'Piece'
  };
  return unitNames[stockType] || 'Unit';
};

// Alert functions
const showAlert = (type, title, message, duration = 3000) => {
  alert.type = type;
  alert.title = title;
  alert.message = message;
  alert.show = true;
  
  // Auto-hide alert after duration
  setTimeout(() => {
    closeAlert();
  }, duration);
};

const closeAlert = () => {
  alert.show = false;
  alert.type = 'info';
  alert.title = '';
  alert.message = '';
};

// Modal functions
const closeModal = () => {
  emit('close');
};

const saveChanges = async () => {
  if (!props.product?.id || !hasChanges.value) return;
  
  isSaving.value = true;
  
  try {
    const productRef = doc(db, 'products', props.product.id);
    const updateData = {
      ...localStocks,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(productRef, updateData);
    
    // Update original stocks
    Object.assign(originalStocks, localStocks);
    
    // Emit update event
    emit('update', { ...props.product, ...localStocks });
    
    // Show success alert
    showAlert('success', 'Stock Updated', 'Product stock levels have been successfully updated!', 2000);
    
    // Close modal after a brief delay to show the alert
    setTimeout(() => {
      closeModal();
    }, 2000);
    
  } catch (error) {
    console.error('Error updating stock:', error);
    showAlert('error', 'Update Failed', 'Failed to update stock. Please try again.');
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background-color: white;
  border-radius: 12px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 1.25rem;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.modal-body {
  padding: 24px;
}

/* Product Info Section */
.product-info-section {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.product-image-container {
  flex-shrink: 0;
}

.product-image {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.product-details {
  flex: 1;
}

.product-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
}

.product-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.meta-value {
  font-size: 0.875rem;
  color: #111827;
  font-weight: 600;
}

.meta-value.price {
  color: #2e5c31;
  font-size: 1rem;
}

/* Stock Table Section */
.stock-table-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.stock-table-container {
  overflow-x: auto;
}

.stock-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stock-table thead {
  background-color: #f9fafb;
}

.stock-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
  border-bottom: 1px solid #e5e7eb;
}

.stock-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.unit-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #111827;
}

.unit-icon {
  font-size: 1.125rem;
}

.min-stock {
  color: #6b7280;
  font-weight: 500;
}

.add-controls {
  display: flex;
  gap: 6px;
}

.add-btn {
  padding: 4px 8px;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover {
  background-color: #e5e7eb;
  border-color: #9ca3af;
}

.total-stock {
  text-align: center;
}

.total-value {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.875rem;
}

.total-value.out-of-stock {
  background-color: #fee2e2;
  color: #dc2626;
}

.total-value.low-stock {
  background-color: #fef3c7;
  color: #d97706;
}

.total-value.normal-stock {
  background-color: #dbeafe;
  color: #2563eb;
}

.total-value.high-stock {
  background-color: #d1fae5;
  color: #059669;
}

/* Stock Section */
.stock-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.stock-section h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
}

.stock-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.stock-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background-color: #f9fafb;
}

.stock-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stock-unit {
  font-weight: 500;
  color: #111827;
}

.stock-count {
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.875rem;
}

.stock-count.out-of-stock {
  background-color: #fee2e2;
  color: #dc2626;
}

.stock-count.low-stock {
  background-color: #fef3c7;
  color: #d97706;
}

.stock-count.normal-stock {
  background-color: #dbeafe;
  color: #2563eb;
}

.stock-count.high-stock {
  background-color: #d1fae5;
  color: #059669;
}

.stock-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.stock-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #d1d5db;
  background-color: white;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.stock-btn:hover:not(:disabled) {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.stock-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stock-btn.increase {
  color: #059669;
}

.stock-btn.decrease {
  color: #dc2626;
}

.stock-input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  text-align: center;
  font-weight: 500;
}

.stock-input:focus {
  outline: none;
  border-color: #2e5c31;
  box-shadow: 0 0 0 2px rgba(46, 92, 49, 0.1);
}

/* Summary Section */
.summary-section {
  margin-bottom: 24px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.summary-item {
  text-align: center;
  padding: 16px;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.summary-label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 4px;
}

.summary-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.summary-value.warning {
  color: #d97706;
}

/* Modal Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
}

.btn-secondary,
.btn-primary {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-secondary {
  background-color: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.btn-primary {
  background-color: #2e5c31;
  color: white;
  border: 1px solid #2e5c31;
}

.btn-primary:hover:not(:disabled) {
  background-color: #1e3a20;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
  }
  
  .product-info-section {
    flex-direction: column;
    text-align: center;
  }
  
  .product-meta {
    grid-template-columns: 1fr;
  }
  
  .price-comparison {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stock-grid {
    grid-template-columns: 1fr;
  }
  
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Alert Component Styles */
.alert-overlay {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  pointer-events: none;
}

.alert-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border-left: 4px solid;
  min-width: 320px;
  max-width: 400px;
  pointer-events: all;
  animation: slideInRight 0.3s ease-out;
}

.alert-container.success {
  border-left-color: #10b981;
  background-color: #f0fdf4;
}

.alert-container.error {
  border-left-color: #ef4444;
  background-color: #fef2f2;
}

.alert-container.warning {
  border-left-color: #f59e0b;
  background-color: #fffbeb;
}

.alert-container.info {
  border-left-color: #3b82f6;
  background-color: #eff6ff;
}

.alert-icon {
  flex-shrink: 0;
}

.alert-container.success .alert-icon {
  color: #10b981;
}

.alert-container.error .alert-icon {
  color: #ef4444;
}

.alert-container.warning .alert-icon {
  color: #f59e0b;
}

.alert-container.info .alert-icon {
  color: #3b82f6;
}

.alert-content {
  flex: 1;
}

.alert-content h4 {
  margin: 0 0 4px 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.alert-content p {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
  line-height: 1.4;
}

.alert-close {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.alert-close:hover {
  color: #6b7280;
  background-color: rgba(0, 0, 0, 0.05);
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Dark mode styles for alerts */
:global(.dark) .alert-container {
  background-color: #1f2937;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
}

:global(.dark) .alert-container.success {
  background-color: #064e3b;
}

:global(.dark) .alert-container.error {
  background-color: #7f1d1d;
}

:global(.dark) .alert-container.warning {
  background-color: #78350f;
}

:global(.dark) .alert-container.info {
  background-color: #1e3a8a;
}

:global(.dark) .alert-content h4 {
  color: #f9fafb;
}

:global(.dark) .alert-content p {
  color: #d1d5db;
}

:global(.dark) .alert-close {
  color: #6b7280;
}

:global(.dark) .alert-close:hover {
  color: #9ca3af;
  background-color: rgba(255, 255, 255, 0.1);
}
</style>