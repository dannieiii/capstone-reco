<template>
<div class="dashboard-container">
  <AdminSidebar />
  <div class="main-content">
    <div class="header-actions">
      <h1 class="page-title">Product Price Management</h1>
      <button class="add-btn" @click="openAddProductModal">
        <i class="fas fa-plus"></i> Add Product
      </button>
    </div>

    <!-- Filters -->
    <div class="filters-container">
      <div class="search-container">
        <i class="fas fa-search search-icon"></i>
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search products..." 
          class="search-input"
        />
      </div>
      <div class="filter-group">
        <select v-model="categoryFilter" class="filter-select">
          <option value="">All Categories</option>
          <option v-for="category in categories" :key="category.id" :value="category.category">
            {{ category.category }}
          </option>
        </select>
      </div>
      <div class="export-group">
        <button class="export-btn" @click="exportToCSV">
          <i class="fas fa-file-csv"></i> Export CSV
        </button>
        <button class="export-btn" @click="exportToPDF">
          <i class="fas fa-file-pdf"></i> Export PDF
        </button>
      </div>
    </div>

    <!-- Products Table -->
    <div class="table-container">
      <table class="products-table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Category</th>
            <th>Unit</th>
            <th>Price</th>
            <th>Variety</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody v-if="paginatedProducts.length > 0">
          <tr v-for="product in paginatedProducts" :key="product.id">
            <td>{{ product.productName }}</td>
            <td>{{ product.category }}</td>
            <td>
              <div class="unit-selector" v-if="product.unitPricing && Object.keys(product.unitPricing).length > 0">
                <!-- Single unit display -->
                <div v-if="Object.keys(product.unitPricing).length === 1" class="single-unit">
                  <span class="unit-badge">{{ Object.keys(product.unitPricing)[0] }}</span>
                </div>
                
                <!-- Multiple units dropdown -->
                <div v-else class="multiple-units">
                  <select 
                    :value="getSelectedUnit(product)" 
                    @change="updateSelectedUnit(product, $event.target.value)"
                    class="unit-dropdown"
                  >
                    <option v-for="unit in Object.keys(product.unitPricing)" :key="unit" :value="unit">
                      {{ unit }}
                    </option>
                  </select>
                </div>
              </div>
              <div v-else class="no-unit">
                <span class="text-gray-500">No units</span>
              </div>
            </td>
            <td>
              <div class="price-selector" v-if="product.unitPricing && Object.keys(product.unitPricing).length > 0">
                <!-- Single unit price display -->
                <div v-if="Object.keys(product.unitPricing).length === 1" class="single-unit-price">
                  <div class="price-display">
                    <span class="price-item-compact">
                      <span class="price-label-compact">Min:</span>
                      <div class="editable-cell-compact" @click="startEditing(product, 'minPrice', Object.keys(product.unitPricing)[0])">
                        <span v-if="editingCell.id !== product.id || editingCell.field !== 'minPrice' || editingCell.unit !== Object.keys(product.unitPricing)[0]">
                          ₱{{ (Object.values(product.unitPricing)[0]?.minPrice || 0).toFixed(2) }}
                        </span>
                        <input 
                          v-else
                          type="number" 
                          v-model="editingCell.value" 
                          @blur="saveEdit(product)"
                          @keyup.enter="saveEdit(product)"
                          step="0.01"
                          min="0"
                          :ref="(el) => setEditInputRef(el)"
                          class="edit-input-compact"
                        />
                      </div>
                    </span>
                    <span class="price-item-compact">
                      <span class="price-label-compact">Max:</span>
                      <div class="editable-cell-compact" @click="startEditing(product, 'maxPrice', Object.keys(product.unitPricing)[0])">
                        <span v-if="editingCell.id !== product.id || editingCell.field !== 'maxPrice' || editingCell.unit !== Object.keys(product.unitPricing)[0]">
                          ₱{{ (Object.values(product.unitPricing)[0]?.maxPrice || 0).toFixed(2) }}
                        </span>
                        <input 
                          v-else
                          type="number" 
                          v-model="editingCell.value" 
                          @blur="saveEdit(product)"
                          @keyup.enter="saveEdit(product)"
                          step="0.01"
                          min="0"
                          :ref="(el) => setEditInputRef(el)"
                          class="edit-input-compact"
                        />
                      </div>
                    </span>
                  </div>
                </div>
                
                <!-- Multiple units price display -->
                <div v-else class="multiple-units-price">
                  <div class="price-display" v-if="getSelectedUnitPricing(product)">
                    <span class="price-item-compact">
                      <span class="price-label-compact">Min:</span>
                      <div class="editable-cell-compact" @click="startEditing(product, 'minPrice', getSelectedUnit(product))">
                        <span v-if="editingCell.id !== product.id || editingCell.field !== 'minPrice' || editingCell.unit !== getSelectedUnit(product)">
                          ₱{{ (getSelectedUnitPricing(product)?.minPrice || 0).toFixed(2) }}
                        </span>
                        <input 
                          v-else
                          type="number" 
                          v-model="editingCell.value" 
                          @blur="saveEdit(product)"
                          @keyup.enter="saveEdit(product)"
                          step="0.01"
                          min="0"
                          :ref="(el) => setEditInputRef(el)"
                          class="edit-input-compact"
                        />
                      </div>
                    </span>
                    <span class="price-item-compact">
                      <span class="price-label-compact">Max:</span>
                      <div class="editable-cell-compact" @click="startEditing(product, 'maxPrice', getSelectedUnit(product))">
                        <span v-if="editingCell.id !== product.id || editingCell.field !== 'maxPrice' || editingCell.unit !== getSelectedUnit(product)">
                          ₱{{ (getSelectedUnitPricing(product)?.maxPrice || 0).toFixed(2) }}
                        </span>
                        <input 
                          v-else
                          type="number" 
                          v-model="editingCell.value" 
                          @blur="saveEdit(product)"
                          @keyup.enter="saveEdit(product)"
                          step="0.01"
                          min="0"
                          :ref="(el) => setEditInputRef(el)"
                          class="edit-input-compact"
                        />
                      </div>
                    </span>
                  </div>
                </div>
              </div>
              <div v-else class="no-pricing-compact">
                <span class="text-gray-500">No pricing data</span>
              </div>
            </td>
            <td>{{ product.variety || 'Normal' }}</td>
            <td>
              <div class="action-buttons">
                <button class="history-btn" @click="openPriceHistoryModal(product)" title="View Price History">
                  <i class="fas fa-chart-line"></i>
                </button>
                <button class="edit-btn" @click="editProduct(product)" title="Edit Product">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" @click="confirmDelete(product)" title="Delete Product">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="6" class="empty-state">
              <div class="empty-content">
                <i class="fas fa-box-open empty-icon"></i>
                <p>No products found</p>
                <button class="add-btn-small" @click="openAddProductModal">Add Product</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination-container" v-if="filteredProducts.length > 0">
      <div class="pagination-info">
        Showing {{ startIndex + 1 }} to {{ Math.min(endIndex, filteredProducts.length) }} of {{ filteredProducts.length }} products
      </div>
      <div class="pagination-controls">
        <button 
          class="pagination-btn" 
          @click="goToPage(currentPage - 1)" 
          :disabled="currentPage === 1"
        >
          <i class="fas fa-chevron-left"></i> Previous
        </button>
        
        <div class="page-numbers">
          <button 
            v-for="page in visiblePages" 
            :key="page"
            class="page-btn"
            :class="{ active: page === currentPage }"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </div>
        
        <button 
          class="pagination-btn" 
          @click="goToPage(currentPage + 1)" 
          :disabled="currentPage === totalPages"
        >
          Next <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Add/Edit Product Modal -->
    <div class="modal" v-if="showModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ isEditing ? 'Edit Product' : 'Add New Product' }}</h2>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveProduct">
            <div class="form-group">
              <label for="productName">Product Name *</label>
              <input 
                type="text" 
                id="productName" 
                v-model="currentProduct.productName" 
                required
                placeholder="Enter product name"
              />
            </div>

            <div class="form-group">
              <label for="category">Category *</label>
              <select id="category" v-model="currentProduct.category" required>
                <option value="" disabled>Select category</option>
                <option v-for="category in categories" :key="category.id" :value="category.category">
                  {{ category.category }}
                </option>
              </select>
            </div>

          <div class="form-group">
  <label>Units of Measurement *</label>
  <div class="unit-checkboxes">
    <div v-for="unit in availableUnits" :key="unit" class="unit-checkbox-container">
      <input 
        type="checkbox" 
        :id="`unit-${unit}`" 
        :value="unit" 
        v-model="currentProduct.selectedUnits"
        @change="updateUnitPricing"
        class="unit-checkbox-input"
      />
      <label :for="`unit-${unit}`" class="unit-checkbox-label">
        {{ unit }}
      </label>
    </div>
  </div>
  <div v-if="currentProduct.selectedUnits.length === 0" class="error-text">
    Please select at least one unit of measurement
  </div>
</div>

            <!-- Unit Pricing Section -->
            <div v-if="currentProduct.selectedUnits.length > 0" class="form-group">
              <label>Pricing for Selected Units *</label>
              <div class="unit-pricing-section">
                <div v-for="unit in currentProduct.selectedUnits" :key="unit" class="unit-pricing-group">
                  <h4 class="unit-title">{{ unit }}</h4>
                  <div class="form-row" v-if="currentProduct.unitPricing && currentProduct.unitPricing[unit]">
                    <div class="form-group">
                      <label :for="`minPrice-${unit}`">Minimum Price (₱) *</label>
                      <input 
                        type="number" 
                        :id="`minPrice-${unit}`"
                        v-model="currentProduct.unitPricing[unit].minPrice" 
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>

                    <div class="form-group">
                      <label :for="`maxPrice-${unit}`">Maximum Price (₱) *</label>
                      <input 
                        type="number" 
                        :id="`maxPrice-${unit}`"
                        v-model="currentProduct.unitPricing[unit].maxPrice" 
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div v-else class="loading-pricing">
                    <span>Loading pricing fields...</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="variety">Crop Variety (optional)</label>
              <input 
                type="text" 
                id="variety" 
                v-model="currentProduct.variety" 
                placeholder="e.g., Size, Type, or leave blank for normal"
              />
            </div>

            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="closeModal">Cancel</button>
              <button 
                type="submit" 
                class="save-btn" 
                :disabled="isSaving"
              >
                <i v-if="isSaving" class="fas fa-spinner fa-spin"></i>
                <span v-else>{{ isEditing ? 'Update Product' : 'Save Product' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal" v-if="showDeleteModal">
      <div class="modal-content delete-modal">
        <div class="modal-header">
          <h2>Confirm Delete</h2>
          <button class="close-btn" @click="showDeleteModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete <strong>{{ productToDelete?.productName }}</strong>?</p>
          <p class="warning-text">This action cannot be undone.</p>
          
          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="showDeleteModal = false">Cancel</button>
            <button 
              type="button" 
              class="delete-confirm-btn" 
              :disabled="isDeleting"
              @click="deleteProduct"
            >
              <i v-if="isDeleting" class="fas fa-spinner fa-spin"></i>
              <span v-else>Delete Product</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Price History Modal -->
    <div class="modal" v-if="showPriceHistoryModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Price History - {{ selectedProduct?.productName }} ({{ selectedHistoryUnit }})</h2>
          <button class="close-btn" @click="showPriceHistoryModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <!-- Unit selector for price history -->
          <div class="form-group" v-if="selectedProduct && selectedProduct.unitPricing && Object.keys(selectedProduct.unitPricing).length > 1">
            <label for="historyUnit">Select Unit:</label>
            <select id="historyUnit" v-model="selectedHistoryUnit" @change="fetchPriceHistory(selectedProduct.id)" class="filter-select">
              <option v-for="unit in Object.keys(selectedProduct.unitPricing)" :key="unit" :value="unit">
                {{ unit }}
              </option>
            </select>
          </div>
          
          <div class="chart-container" v-if="priceHistory.length > 0">
            <canvas ref="priceChart"></canvas>
          </div>
          <div v-else class="empty-history">
            <i class="fas fa-chart-bar"></i>
            <p>No price history available for {{ selectedHistoryUnit }}</p>
          </div>
          
          <div class="history-table-container" v-if="priceHistory.length > 0">
            <table class="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Unit</th>
                  <th>Min Price (₱)</th>
                  <th>Max Price (₱)</th>
                  <th>Changed By</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(record, index) in priceHistory" :key="index">
                  <td>{{ formatDate(record.timestamp) }}</td>
                  <td>{{ record.unit }}</td>
                  <td>₱{{ record.minPrice.toFixed(2) }}</td>
                  <td>₱{{ record.maxPrice.toFixed(2) }}</td>
                  <td>{{ record.updatedBy || 'System' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Price Update Notification Modal -->
    <div class="modal" v-if="showNotificationModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Send Price Update Notification</h2>
          <button class="close-btn" @click="showNotificationModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Product: <strong>{{ notificationProduct?.productName }}</strong></label>
          </div>
          <div class="form-group">
            <label>Price Change:</label>
            <div class="price-change">
              <span>Min: ₱{{ notificationOldPrice?.minPrice?.toFixed(2) }} → ₱{{ notificationProduct?.minPrice?.toFixed(2) }}</span>
              <span>Max: ₱{{ notificationOldPrice?.maxPrice?.toFixed(2) }} → ₱{{ notificationProduct?.maxPrice?.toFixed(2) }}</span>
            </div>
          </div>
          
          <!-- Notification Recipients -->
          <div class="form-group">
            <label>Send notifications to:</label>
            <div class="notification-recipients">
              <label class="checkbox-label">
                <input type="checkbox" v-model="notificationSettings.notifySellers" />
                <span>Sellers</span>
                <small>Notify all sellers about this price change</small>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="notificationSettings.notifyCustomers" />
                <span>Customers</span>
                <small>Notify customers who have this product in their favorites</small>
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label for="notificationMessage">Message (optional)</label>
            <textarea 
              id="notificationMessage" 
              v-model="notificationMessage" 
              placeholder="Add any additional information about this price change..."
              rows="4"
            ></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="showNotificationModal = false">Cancel</button>
            <button 
              type="button" 
              class="save-btn" 
              :disabled="isSendingNotification || (!notificationSettings.notifySellers && !notificationSettings.notifyCustomers)"
              @click="sendPriceUpdateNotification"
            >
              <i v-if="isSendingNotification" class="fas fa-spinner fa-spin"></i>
              <span v-else>Send Notification</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Notification Element - Moved outside main content -->
  <div v-if="notification.show" class="notification" :class="notification.type">
    {{ notification.message }}
    <button class="notification-close" @click="closeNotification">&times;</button>
  </div>
</div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '@/firebase/firebaseConfig';
import { 
collection, 
getDocs, 
addDoc, 
doc, 
updateDoc, 
deleteDoc, 
query, 
where, 
serverTimestamp,
orderBy
} from 'firebase/firestore';
import { Chart, registerables } from 'chart.js';
import AdminSidebar from '@/components/AdminSidebar.vue';

// Register Chart.js components
Chart.register(...registerables);

export default {
components: {
  AdminSidebar
},
setup() {
  // Router
  const router = useRouter();

  // Available units
  const availableUnits = [
    'per kg',
    'per tali', 
    'per piece',
    'per tray',
    'per bundle',
    'per kaing',
    'per sack'
  ];

  // Pagination state
  const currentPage = ref(1);
  const itemsPerPage = ref(10);

  // State
  const products = ref([]);
  const categories = ref([]);
  const searchQuery = ref('');
  const categoryFilter = ref('');
  const notification = ref({
    show: false,
    message: '',
    type: 'success'
  });
  const showModal = ref(false);
  const showDeleteModal = ref(false);
  const showPriceHistoryModal = ref(false);
  const showNotificationModal = ref(false);
  const isEditing = ref(false);
  const isSaving = ref(false);
  const isDeleting = ref(false);
  const isSendingNotification = ref(false);
  const currentProduct = ref({
    productName: '',
    category: '',
    selectedUnits: [],
    unitPricing: {},
    variety: '',
    createdAt: null,
    updatedAt: null
  });
  const originalProduct = ref(null); // Store original product data for comparison
  const productToDelete = ref(null);
  const selectedProduct = ref(null);
  const selectedHistoryUnit = ref(''); // Track which unit's history to show
  const priceHistory = ref([]);
  const priceChart = ref(null);
  const notificationProduct = ref(null);
  const notificationOldPrice = ref(null);
  const notificationMessage = ref('');
  const notificationSettings = ref({
    notifySellers: true,
    notifyCustomers: true
  });
  const editingCell = ref({
    id: null,
    field: null,
    unit: null,
    value: null
  });
  const editInput = ref(null);

  const setEditInputRef = (el) => {
    editInput.value = el;
  };  

  // State for tracking selected units per product
  const selectedUnits = ref({});

  // Computed
  const filteredProducts = computed(() => {
    let result = products.value;
    
    // Apply search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      result = result.filter(product => 
        product.productName.toLowerCase().includes(query) || 
        product.category.toLowerCase().includes(query) ||
        (product.variety && product.variety.toLowerCase().includes(query))
      );
    }
    
    // Apply category filter
    if (categoryFilter.value) {
      result = result.filter(product => product.category === categoryFilter.value);
    }
    
    return result;
  });

  // Pagination computed properties
  const totalPages = computed(() => {
    return Math.ceil(filteredProducts.value.length / itemsPerPage.value);
  });

  const startIndex = computed(() => {
    return (currentPage.value - 1) * itemsPerPage.value;
  });

  const endIndex = computed(() => {
    return startIndex.value + itemsPerPage.value;
  });

  const paginatedProducts = computed(() => {
    return filteredProducts.value.slice(startIndex.value, endIndex.value);
  });

  const visiblePages = computed(() => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages.value, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  });

  // Pagination methods
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page;
    }
  };

  // Export methods
  const exportToCSV = () => {
    const headers = ['Product Name', 'Category', 'Unit', 'Min Price', 'Max Price', 'Variety'];
    const csvContent = [headers.join(',')];
    
    filteredProducts.value.forEach(product => {
      if (product.unitPricing && Object.keys(product.unitPricing).length > 0) {
        Object.entries(product.unitPricing).forEach(([unit, pricing]) => {
          const row = [
            `"${product.productName}"`,
            `"${product.category}"`,
            `"${unit}"`,
            pricing.minPrice || 0,
            pricing.maxPrice || 0,
            `"${product.variety || 'Normal'}"`
          ];
          csvContent.push(row.join(','));
        });
      } else {
        const row = [
          `"${product.productName}"`,
          `"${product.category}"`,
          '""',
          '0',
          '0',
          `"${product.variety || 'Normal'}"`
        ];
        csvContent.push(row.join(','));
      }
    });
    
    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    showNotification('Products exported to CSV successfully');
  };

  // Replace the exportToPDF function with this simpler version:
  const exportToPDF = () => {
    // Create a simple HTML content for printing
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Product Price Management Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #2e5c31; margin-bottom: 10px; }
          .date { color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #2e5c31; color: white; }
          tr:nth-child(even) { background-color: #f9f9f9; }
        </style>
      </head>
      <body>
        <h1>Product Price Management Report</h1>
        <div class="date">Generated on: ${new Date().toLocaleDateString()}</div>
        <table>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Min Price</th>
              <th>Max Price</th>
              <th>Variety</th>
            </tr>
          </thead>
          <tbody>
            ${filteredProducts.value.map(product => {
              if (product.unitPricing && Object.keys(product.unitPricing).length > 0) {
                return Object.entries(product.unitPricing).map(([unit, pricing]) => `
                  <tr>
                    <td>${product.productName}</td>
                    <td>${product.category}</td>
                    <td>${unit}</td>
                    <td>₱${(pricing.minPrice || 0).toFixed(2)}</td>
                    <td>₱${(pricing.maxPrice || 0).toFixed(2)}</td>
                    <td>${product.variety || 'Normal'}</td>
                  </tr>
                `).join('');
              } else {
                return `
                  <tr>
                    <td>${product.productName}</td>
                    <td>${product.category}</td>
                    <td>No units</td>
                    <td>₱0.00</td>
                    <td>₱0.00</td>
                    <td>${product.variety || 'Normal'}</td>
                  </tr>
                `;
              }
            }).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    // Open print dialog
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
    
    showNotification('PDF export initiated - use your browser\'s print dialog to save as PDF');
  };

  // Helper functions for unit dropdown
  const getSelectedUnit = (product) => {
    if (!product.unitPricing || Object.keys(product.unitPricing).length === 0) {
      return null;
    }
    
    const availableUnits = Object.keys(product.unitPricing);
    
    // If we already have a selected unit for this product, return it
    if (selectedUnits.value[product.id] && availableUnits.includes(selectedUnits.value[product.id])) {
      return selectedUnits.value[product.id];
    }
    
    // Otherwise, default to the first unit
    const defaultUnit = availableUnits[0];
    selectedUnits.value[product.id] = defaultUnit;
    return defaultUnit;
  };

  const updateSelectedUnit = (product, unit) => {
    selectedUnits.value[product.id] = unit;
  };

  const getSelectedUnitPricing = (product) => {
    const selectedUnit = getSelectedUnit(product);
    if (!selectedUnit || !product.unitPricing || !product.unitPricing[selectedUnit]) {
      return null;
    }
    return product.unitPricing[selectedUnit];
  };

  // Methods
  const closeNotification = () => {
    notification.value.show = false;
  };

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'productPrices'));
      products.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      showNotification('Failed to load products', 'error');
    }
  };

  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      categories.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching categories:', error);
      showNotification('Failed to load categories', 'error');
    }
  };

  const fetchPriceHistory = async (productId) => {
try {
  const historyRef = collection(db, 'productPrices', productId, 'priceHistory');
  
  // First, get all price history records ordered by timestamp
  const q = query(historyRef, orderBy('timestamp', 'desc'));
  const querySnapshot = await getDocs(q);
  
  let allHistory = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp.toDate()
  }));
  
  // If a specific unit is selected, filter the results in JavaScript
  if (selectedHistoryUnit.value) {
    allHistory = allHistory.filter(record => record.unit === selectedHistoryUnit.value);
  }
  
  priceHistory.value = allHistory;
  
  if (priceHistory.value.length > 0) {
    renderPriceChart();
  }
} catch (error) {
  console.error('Error fetching price history:', error);
  showNotification('Failed to load price history', 'error');
}
};

  const renderPriceChart = () => {
    nextTick(() => {
      if (!priceChart.value) return;
      
      const ctx = priceChart.value.getContext('2d');
      
      // Destroy previous chart if it exists
      if (priceChart.value.chart) {
        priceChart.value.chart.destroy();
      }
      
      // Prepare data
      const labels = priceHistory.value.map(record => 
        record.timestamp.toLocaleDateString()
      ).reverse();
      
      const minPrices = priceHistory.value.map(record => record.minPrice).reverse();
      const maxPrices = priceHistory.value.map(record => record.maxPrice).reverse();
      
      // Create new chart
      priceChart.value.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Minimum Price',
              data: minPrices,
              borderColor: '#2e5c31',
              backgroundColor: 'rgba(46, 92, 49, 0.1)',
              tension: 0.3,
              fill: true
            },
            {
              label: 'Maximum Price',
              data: maxPrices,
              borderColor: '#f39c12',
              backgroundColor: 'rgba(243, 156, 18, 0.1)',
              tension: 0.3,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: `Price History Trend - ${selectedHistoryUnit.value}`
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: ₱${context.raw.toFixed(2)}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              ticks: {
                callback: function(value) {
                  return `₱${value.toFixed(2)}`;
                }
              }
            }
          }
        }
      });
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openAddProductModal = () => {
    isEditing.value = false;
    currentProduct.value = {
      productName: '',
      category: '',
      selectedUnits: [],
      unitPricing: {},
      variety: '',
      createdAt: null,
      updatedAt: null
      // Note: No 'id' field for new products
    };
    originalProduct.value = null;
    showModal.value = true;
  };

  const editProduct = (product) => {
    isEditing.value = true;
    currentProduct.value = {
      ...product,
      selectedUnits: Object.keys(product.unitPricing || {}),
      unitPricing: { ...product.unitPricing }
    };
    originalProduct.value = { ...product };
    showModal.value = true;
  };

  const openPriceHistoryModal = async (product) => {
    selectedProduct.value = product;
    
    // Set default unit for history display
    if (product.unitPricing && Object.keys(product.unitPricing).length > 0) {
      selectedHistoryUnit.value = Object.keys(product.unitPricing)[0];
    }
    
    showPriceHistoryModal.value = true;
    await fetchPriceHistory(product.id);
  };

  const closeModal = () => {
    showModal.value = false;
    originalProduct.value = null;
  };

  const checkForDuplicateProduct = () => {
    const baseProductName = currentProduct.value.productName.toLowerCase().trim();
    const currentCategory = currentProduct.value.category;
    const currentVariety = (currentProduct.value.variety || '').toLowerCase().trim();
    const currentId = currentProduct.value.id; // This will be undefined for new products
    
    console.log('=== DUPLICATE CHECK START ===');
    console.log('Checking duplicates for:', {
      name: baseProductName,
      category: currentCategory,
      variety: currentVariety,
      isEditing: isEditing.value,
      currentId: currentId
    });
    console.log('Total products in database:', products.value.length);
    
    // Find existing products with same name and category
    const similarProducts = products.value.filter(product => {
      // Skip self when editing (only if we have a valid ID)
      if (isEditing.value && currentId && product.id === currentId) {
        console.log('Skipping self (editing mode):', product.id);
        return false;
      }
      
      const existingName = product.productName.toLowerCase().trim();
      const existingCategory = product.category;
      
      // Check if names match exactly and same category
      const nameMatch = existingName === baseProductName;
      const categoryMatch = existingCategory === currentCategory;
      
      console.log('Comparing product:', {
        id: product.id,
        name: existingName,
        category: existingCategory,
        variety: product.variety,
        nameMatch,
        categoryMatch
      });
      
      return nameMatch && categoryMatch;
    });
    
    console.log('Similar products found:', similarProducts.length);
    similarProducts.forEach(p => {
      console.log('Similar product:', {
        id: p.id,
        name: p.productName,
        variety: p.variety,
        varietyType: typeof p.variety,
        varietyIsNull: p.variety === null,
        varietyIsUndefined: p.variety === undefined,
        varietyIsEmpty: p.variety === ''
      });
    });
    
    if (similarProducts.length === 0) {
      console.log('No similar products found, product is valid');
      return { isValid: true };
    }
    
    // More robust variety normalization
    const normalizeVariety = (variety) => {
      // Handle all possible falsy values and "normal" case
      if (!variety || 
          variety === null || 
          variety === undefined || 
          variety.toString().toLowerCase().trim() === '' || 
          variety.toString().toLowerCase().trim() === 'normal') {
        return 'normal';
      }
      return variety.toString().toLowerCase().trim();
    };
    
    const normalizedCurrentVariety = normalizeVariety(currentVariety);
    console.log('Normalized current variety:', normalizedCurrentVariety);
    
    // If current product has no variety (normal), it cannot coexist with any similar named product
    if (normalizedCurrentVariety === 'normal') {
      console.log('Current product has no variety, checking if any similar product exists');
      if (similarProducts.length > 0) {
        return {
          isValid: false,
          message: `A product named "${currentProduct.value.productName}" already exists in the ${currentProduct.value.category} category. To add another version of this product, please specify a variety (e.g., "Red", "White", "Large", "Small").`
        };
      }
    }
    
    // Check each similar product for variety conflicts
    for (const existingProduct of similarProducts) {
      const existingVariety = normalizeVariety(existingProduct.variety);
      console.log('Comparing varieties:', {
        current: normalizedCurrentVariety,
        existing: existingVariety,
        existingRaw: existingProduct.variety,
        match: existingVariety === normalizedCurrentVariety
      });
      
      // If existing product has no variety (normal), new product must have a variety
      if (existingVariety === 'normal' && normalizedCurrentVariety !== 'normal') {
        console.log('Existing product has no variety, but current has variety - this is allowed');
        continue; // This is allowed - adding variety to existing normal product
      }
      
      // If varieties match exactly, it's a conflict
      if (existingVariety === normalizedCurrentVariety) {
        console.log('=== CONFLICT FOUND ===');
        console.log('Conflicting product:', existingProduct.id);
        
        if (normalizedCurrentVariety === 'normal') {
          return {
            isValid: false,
            message: `A product named "${currentProduct.value.productName}" already exists in the ${currentProduct.value.category} category without a specific variety. Please add a specific variety (e.g., "Red", "White", "Large") to differentiate this product.`
          };
        } else {
          return {
            isValid: false,
            message: `A product named "${currentProduct.value.productName}" with variety "${currentProduct.value.variety}" already exists in the ${currentProduct.value.category} category. Please choose a different variety.`
          };
        }
      }
    }
    
    console.log('No conflicts found, product is valid');
    console.log('=== DUPLICATE CHECK END ===');
    return { isValid: true };
  };

  const updateUnitPricing = async () => {
    // Ensure unitPricing object exists
    if (!currentProduct.value.unitPricing) {
      currentProduct.value.unitPricing = {};
    }
    
    // Initialize pricing for newly selected units
    currentProduct.value.selectedUnits.forEach(unit => {
      if (!currentProduct.value.unitPricing[unit]) {
        // Use Vue's reactive assignment to ensure reactivity
        currentProduct.value.unitPricing[unit] = {
          minPrice: 0,
          maxPrice: 0
        };
      }
    });
    
    // Remove pricing for unselected units
    Object.keys(currentProduct.value.unitPricing).forEach(unit => {
      if (!currentProduct.value.selectedUnits.includes(unit)) {
        delete currentProduct.value.unitPricing[unit];
      }
    });
    
    // Force reactivity update and wait for DOM update
    currentProduct.value = { ...currentProduct.value };
    await nextTick();
  };

  const validateProduct = () => {
    console.log('=== VALIDATION START ===');
    console.log('Current product data:', currentProduct.value);
    
    if (!currentProduct.value.productName) {
      showNotification('Product name is required', 'error');
      return false;
    }
    
    if (!currentProduct.value.category) {
      showNotification('Category is required', 'error');
      return false;
    }
    
    if (currentProduct.value.selectedUnits.length === 0) {
      showNotification('At least one unit of measurement is required', 'error');
      return false;
    }
    
    // Validate pricing for each selected unit
    for (const unit of currentProduct.value.selectedUnits) {
      const pricing = currentProduct.value.unitPricing[unit];
      
      if (!pricing || pricing.minPrice <= 0) {
        showNotification(`Minimum price for ${unit} must be greater than zero`, 'error');
        return false;
      }
      
      if (!pricing || pricing.maxPrice <= 0) {
        showNotification(`Maximum price for ${unit} must be greater than zero`, 'error');
        return false;
      }
      
      if (pricing.minPrice > pricing.maxPrice) {
        showNotification(`Minimum price cannot be greater than maximum price for ${unit}`, 'error');
        return false;
      }
    }
    
    // Check for duplicate product names with variety logic
    console.log('About to check for duplicates...');
    const duplicateCheck = checkForDuplicateProduct();
    console.log('Duplicate check result:', duplicateCheck);
    
    if (!duplicateCheck.isValid) {
      console.log('Duplicate found, showing error message');
      showNotification(duplicateCheck.message, 'error');
      return false;
    }
    
    console.log('=== VALIDATION PASSED ===');
    return true;
  };

  // Enhanced function to record price history
  const recordPriceHistory = async (productId, unit, oldPricing, newPricing, changeType = 'update') => {
    try {
      const historyData = {
        unit: unit,
        minPrice: newPricing.minPrice,
        maxPrice: newPricing.maxPrice,
        previousMinPrice: oldPricing ? oldPricing.minPrice : null,
        previousMaxPrice: oldPricing ? oldPricing.maxPrice : null,
        changeType: changeType, // 'create', 'update', 'delete'
        timestamp: serverTimestamp(),
        updatedBy: 'Admin', // You can make this dynamic based on current user
        changes: {
          minPriceChanged: !oldPricing || oldPricing.minPrice !== newPricing.minPrice,
          maxPriceChanged: !oldPricing || oldPricing.maxPrice !== newPricing.maxPrice
        }
      };

      const historyRef = collection(db, 'productPrices', productId, 'priceHistory');
      await addDoc(historyRef, historyData);
      
      console.log('Price history recorded successfully for unit:', unit);
    } catch (error) {
      console.error('Error recording price history:', error);
      // Don't throw error here to avoid breaking the main save operation
    }
  };

  const saveProduct = async () => {
    console.log('Starting saveProduct, isEditing:', isEditing.value);
    console.log('Current product:', currentProduct.value);
    
    if (!validateProduct()) return;
    
    isSaving.value = true;
    
    try {
      const productData = {
        productName: currentProduct.value.productName.trim(),
        category: currentProduct.value.category,
        unitPricing: { ...currentProduct.value.unitPricing },
        variety: currentProduct.value.variety?.trim() || '',
        updatedAt: serverTimestamp()
      };
      
      if (isEditing.value && currentProduct.value.id) {
        // Update existing product
        console.log('Updating existing product with ID:', currentProduct.value.id);
        await updateDoc(doc(db, 'productPrices', currentProduct.value.id), productData);
        
        // Record price history for each unit that changed
        if (originalProduct.value && originalProduct.value.unitPricing) {
          for (const [unit, newPricing] of Object.entries(currentProduct.value.unitPricing)) {
            const oldPricing = originalProduct.value.unitPricing[unit];
            
            // Check if prices actually changed
            if (!oldPricing || 
                oldPricing.minPrice !== newPricing.minPrice || 
                oldPricing.maxPrice !== newPricing.maxPrice) {
              await recordPriceHistory(currentProduct.value.id, unit, oldPricing, newPricing, 'update');
            }
          }
        }
        
        showNotification('Product updated successfully');
        
        // Update local state
        const index = products.value.findIndex(p => p.id === currentProduct.value.id);
        if (index !== -1) {
          products.value[index] = { ...productData, id: currentProduct.value.id };
        }
      } else {
        // Add new product
        console.log('Adding new product');
        productData.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(db, 'productPrices'), productData);
        
        // Record initial price history for all units
        for (const [unit, pricing] of Object.entries(currentProduct.value.unitPricing)) {
          await recordPriceHistory(docRef.id, unit, null, pricing, 'create');
        }
        
        // Update local state
        products.value.push({
          ...productData,
          id: docRef.id
        });
        
        showNotification('Product added successfully');
      }
      
      closeModal();
    } catch (error) {
      console.error('Error saving product:', error);
      showNotification('Failed to save product', 'error');
    } finally {
      isSaving.value = false;
    }
  };

  const confirmDelete = (product) => {
    productToDelete.value = product;
    showDeleteModal.value = true;
  };

  const deleteProduct = async () => {
    if (!productToDelete.value) return;
    
    isDeleting.value = true;
    
    try {
      await deleteDoc(doc(db, 'productPrices', productToDelete.value.id));
      
      // Update local state
      products.value = products.value.filter(p => p.id !== productToDelete.value.id);
      
      showNotification('Product deleted successfully');
      showDeleteModal.value = false;
    } catch (error) {
      console.error('Error deleting product:', error);
      showNotification('Failed to delete product', 'error');
    } finally {
      isDeleting.value = false;
      productToDelete.value = null;
    }
  };

  const startEditing = async (product, field, unit) => {
    // Add safety check for unitPricing
    if (!product.unitPricing || !product.unitPricing[unit] || typeof product.unitPricing[unit] !== 'object') {
      showNotification('Pricing data not available for this unit', 'error');
      return;
    }
    
    // Additional safety check for the specific field
    if (product.unitPricing[unit][field] === undefined || product.unitPricing[unit][field] === null) {
      showNotification(`${field === 'minPrice' ? 'Minimum' : 'Maximum'} price data not available for ${unit}`, 'error');
      return;
    }
    
    editingCell.value = {
      id: product.id,
      field,
      unit,
      value: product.unitPricing[unit][field] || 0
    };
    
    // Focus the input after it's rendered
    await nextTick();
    if (editInput.value && editInput.value.focus) {
      editInput.value.focus();
    }
  };

  const saveEdit = async (product) => {
    if (editingCell.value.id !== product.id) return;
    
    const field = editingCell.value.field;
    const unit = editingCell.value.unit;
    const newValue = parseFloat(editingCell.value.value);
    
    // Validate
    if (isNaN(newValue) || newValue < 0) {
      showNotification('Please enter a valid price', 'error');
      editingCell.value = { id: null, field: null, unit: null, value: null };
      return;
    }
    
    // Safety check for unitPricing
    if (!product.unitPricing || !product.unitPricing[unit] || typeof product.unitPricing[unit] !== 'object') {
      showNotification('Pricing data not available for this unit', 'error');
      editingCell.value = { id: null, field: null, unit: null, value: null };
      return;
    }
    
    // Store old pricing for history
    const oldPricing = { ...product.unitPricing[unit] };
    
    // Additional validation for min/max price relationship
    const currentUnitPricing = product.unitPricing[unit];
    if (field === 'minPrice' && newValue > (currentUnitPricing.maxPrice || 0)) {
      showNotification(`Minimum price cannot be greater than maximum price for ${unit}`, 'error');
      editingCell.value = { id: null, field: null, unit: null, value: null };
      return;
    }
    
    if (field === 'maxPrice' && newValue < (currentUnitPricing.minPrice || 0)) {
      showNotification(`Maximum price cannot be less than minimum price for ${unit}`, 'error');
      editingCell.value = { id: null, field: null, unit: null, value: null };
      return;
    }
    
    try {
      // Update in Firestore
      const updatePath = `unitPricing.${unit}.${field}`;
      await updateDoc(doc(db, 'productPrices', product.id), {
        [updatePath]: newValue,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      const index = products.value.findIndex(p => p.id === product.id);
      if (index !== -1) {
        // Ensure unitPricing structure exists
        if (!products.value[index].unitPricing) {
          products.value[index].unitPricing = {};
        }
        if (!products.value[index].unitPricing[unit]) {
          products.value[index].unitPricing[unit] = { minPrice: 0, maxPrice: 0 };
        }
        products.value[index].unitPricing[unit][field] = newValue;
      }
      
      // Record price history - create new pricing object with updated value
      const newPricing = { ...oldPricing, [field]: newValue };
      await recordPriceHistory(product.id, unit, oldPricing, newPricing, 'update');
      
      showNotification(`Product ${field === 'minPrice' ? 'minimum' : 'maximum'} price updated for ${unit}`);
    } catch (error) {
      console.error('Error updating product:', error);
      showNotification('Failed to update price', 'error');
    } finally {
      editingCell.value = { id: null, field: null, unit: null, value: null };
    }
  };

  const sendPriceUpdateNotification = async () => {
    if (!notificationProduct.value) return;
    
    isSendingNotification.value = true;
    
    try {
      // Standardized notification schema
      const baseNotification = {
        type: 'price_update',
        productId: notificationProduct.value.id,
        productName: notificationProduct.value.productName,
        category: notificationProduct.value.category,
        oldMinPrice: notificationOldPrice.value.minPrice,
        newMinPrice: notificationProduct.value.minPrice,
        oldMaxPrice: notificationOldPrice.value.maxPrice,
        newMaxPrice: notificationProduct.value.maxPrice,
        title: 'D.A. Price Updated',
        message: notificationMessage.value || `D.A. price reference updated for ${notificationProduct.value.productName}`,
        // Use createdAt to align with seller Notifications.vue
        createdAt: serverTimestamp(),
        // Keep timestamp for backward compatibility with other widgets
        timestamp: serverTimestamp(),
        read: false,
        sentBy: 'admin'
      };
      
      // Send notifications to sellers if enabled
      if (notificationSettings.value.notifySellers) {
        // Get all sellers who might have this product
        const sellersSnapshot = await getDocs(collection(db, 'sellers'));
        const sellerNotifications = sellersSnapshot.docs.map(sellerDoc => {
          const sellerData = sellerDoc.data() || {};
          // Prefer the auth userId stored on the seller profile; fall back to doc id
          const targetSellerId = sellerData.userId || sellerDoc.id;
          return {
            ...baseNotification,
            sellerId: targetSellerId,
            recipientType: 'seller'
          };
        });
        
        // Add notifications for all sellers
        for (const notification of sellerNotifications) {
          await addDoc(collection(db, 'notifications'), notification);
        }
      }
      
      // Send notifications to customers if enabled
      if (notificationSettings.value.notifyCustomers) {
        // Get customers who have this product in favorites or recent orders
        const customersSnapshot = await getDocs(collection(db, 'customers'));
        const customerNotifications = [];
        
        for (const customerDoc of customersSnapshot.docs) {
          const customerData = customerDoc.data();
          // Check if customer has this product in favorites or recent orders
          if (customerData.favoriteProducts?.includes(notificationProduct.value.id) ||
              customerData.recentOrders?.some(order => 
                order.items?.some(item => item.productId === notificationProduct.value.id)
              )) {
            customerNotifications.push({
              ...baseNotification,
              customerId: customerDoc.id,
              recipientType: 'customer',
              title: 'Price Update Alert'
            });
          }
        }
        
        // Add notifications for relevant customers
        for (const notification of customerNotifications) {
          await addDoc(collection(db, 'notifications'), notification);
        }
      }
      
      showNotification('Price update notifications sent successfully');
      showNotificationModal.value = false;
      notificationMessage.value = '';
    } catch (error) {
      console.error('Error sending notifications:', error);
      showNotification('Failed to send notifications', 'error');
    } finally {
      isSendingNotification.value = false;
    }
  };

  const showNotification = (message, type = 'success') => {
    notification.value = {
      show: true,
      message,
      type
    };
    
    setTimeout(() => {
      notification.value.show = false;
    }, 3000);
  };

  // Lifecycle hooks
  onMounted(async () => {
    await Promise.all([fetchProducts(), fetchCategories()]);
  });

  return {
    availableUnits,
    currentPage,
    itemsPerPage,
    products,
    categories,
    searchQuery,
    categoryFilter,
    notification,
    showModal,
    showDeleteModal,
    showPriceHistoryModal,
    showNotificationModal,
    isEditing,
    isSaving,
    isDeleting,
    isSendingNotification,
    currentProduct,
    originalProduct,
    productToDelete,
    selectedProduct,
    selectedHistoryUnit,
    priceHistory,
    priceChart,
    notificationProduct,
    notificationOldPrice,
    notificationMessage,
    notificationSettings,
    editingCell,
    editInput,
    selectedUnits,
    filteredProducts,
    totalPages,
    startIndex,
    endIndex,
    paginatedProducts,
    visiblePages,
    goToPage,
    exportToCSV,
    exportToPDF,
    getSelectedUnit,
    updateSelectedUnit,
    getSelectedUnitPricing,
    closeNotification,
    fetchProducts,
    fetchCategories,
    fetchPriceHistory,
    renderPriceChart,
    formatDate,
    openAddProductModal,
    editProduct,
    openPriceHistoryModal,
    closeModal,
    checkForDuplicateProduct,
    updateUnitPricing,
    validateProduct,
    recordPriceHistory,
    saveProduct,
    confirmDelete,
    deleteProduct,
    startEditing,
    saveEdit,
    sendPriceUpdateNotification,
    setEditInputRef
  };
}
};
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css');

.unit-checkboxes {
display: flex;
flex-wrap: wrap;
gap: 0.5rem;
margin-top: 0.5rem;
}

.unit-checkbox-container {
position: relative;
}

.unit-checkbox-input {
position: absolute;
opacity: 0;
}

.unit-checkbox-label {
display: inline-block;
padding: 0.5rem 1rem;
background-color: #f3f4f6;
border: 1px solid #e5e7eb;
border-radius: 6px;
cursor: pointer;
transition: all 0.2s ease;
font-size: 0.875rem;
}

.unit-checkbox-input:checked + .unit-checkbox-label {
background-color: #2e5c31;
color: white;
border-color: #2e5c31;
}

.unit-checkbox-input:focus + .unit-checkbox-label {
box-shadow: 0 0 0 2px rgba(46, 92, 49, 0.3);
}

/* Dashboard Layout */
.dashboard-container {
display: flex;
min-height: 100vh;
background-color: #f5f7fa;
}

.main-content {
flex: 1;
padding: 2rem;
position: relative;
width: 100%;
margin-left: 260px; /* Sidebar width */
min-width: 0; /* Prevent flex item from shrinking below content size */
}

/* Notification styles */
.notification {
position: fixed;
top: 20px;
right: 20px;
padding: 15px 20px;
border-radius: 8px;
color: white;
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
z-index: 9999;
display: flex;
align-items: center;
justify-content: space-between;
min-width: 300px;
max-width: 500px;
animation: slideIn 0.3s ease-out;
backdrop-filter: blur(10px);
}

.notification.success {
background-color: #2ecc71;
}

.notification.error {
background-color: #e74c3c;
}

.notification.warning {
background-color: #f39c12;
}

.notification-close {
background: none;
border: none;
color: white;
cursor: pointer;
margin-left: 15px;
font-size: 1.2rem;
}

@keyframes slideIn {
from {
  transform: translateX(100%);
  opacity: 0;
}
to {
  transform: translateX(0);
  opacity: 1;
}
}

/* Header */
.header-actions {
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 1.5rem;
}

.page-title {
font-size: 1.75rem;
font-weight: 700;
color: #2c3e50;
margin: 0;
}

.add-btn {
display: flex;
align-items: center;
gap: 0.5rem;
padding: 0.75rem 1.25rem;
background-color: #2e5c31;
color: white;
border: none;
border-radius: 6px;
font-weight: 600;
cursor: pointer;
transition: all 0.2s ease;
}

.add-btn:hover {
background-color: #26492a;
}

.add-btn-small {
padding: 0.5rem 1rem;
background-color: #2e5c31;
color: white;
border: none;
border-radius: 4px;
font-weight: 500;
cursor: pointer;
transition: all 0.2s ease;
}

.add-btn-small:hover {
background-color: #26492a;
}

/* Filters */
.filters-container {
display: flex;
gap: 2rem;
margin-bottom: 1.5rem;
flex-wrap: wrap;
align-items: center;
}

.search-container {
position: relative;
flex: 1;
min-width: 250px;
margin-right: 5rem;
}

.search-icon {
position: absolute;
left: 12px;
top: 50%;
transform: translateY(-50%);
color: #6b7280;
}

.search-input {
width: 100%;
padding: 0.75rem 0.75rem 0.75rem 2.5rem;
border: 1px solid #e5e7eb;
border-radius: 6px;
font-size: 0.875rem;
}

.filter-group {
min-width: 200px;
margin-right: 1rem;
}

.filter-select {
width: 100%;
padding: 0.75rem;
border: 1px solid #e5e7eb;
border-radius: 6px;
font-size: 0.875rem;
background-color: white;
}

.export-group {
display: flex;
gap: 0.5rem;
}

.export-btn {
display: flex;
align-items: center;
gap: 0.5rem;
padding: 0.75rem 1rem;
background-color: #f3f4f6;
color: #374151;
border: 1px solid #d1d5db;
border-radius: 6px;
font-weight: 500;
cursor: pointer;
transition: all 0.2s ease;
font-size: 0.875rem;
}

.export-btn:hover {
background-color: #e5e7eb;
border-color: #9ca3af;
}

.export-btn:first-child {
color: #059669;
}

.export-btn:first-child:hover {
background-color: #ecfdf5;
border-color: #059669;
}

.export-btn:last-child {
color: #dc2626;
}

.export-btn:last-child:hover {
background-color: #fef2f2;
border-color: #dc2626;
}

/* Table */
.table-container {
background-color: white;
border-radius: 8px;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
overflow: hidden;
}

.products-table {
width: 100%;
border-collapse: collapse;
}

.products-table th,
.products-table td {
padding: 1rem;
text-align: left;
border-bottom: 1px solid #e5e7eb;
}

.products-table th {
background-color: #f9fafb;
font-weight: 600;
color: #374151;
}

.products-table tr:last-child td {
border-bottom: none;
}

.products-table tr:hover td {
background-color: #f9fafb;
}

.empty-state {
padding: 3rem 1rem;
text-align: center;
}

.empty-content {
display: flex;
flex-direction: column;
align-items: center;
gap: 1rem;
}

.empty-icon {
font-size: 2.5rem;
color: #d1d5db;
}

/* Pagination */
.pagination-container {
display: flex;
justify-content: space-between;
align-items: center;
padding: 1.5rem;
background-color: white;
border-top: 1px solid #e5e7eb;
margin-top: 1rem;
border-radius: 8px;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.pagination-info {
color: #6b7280;
font-size: 0.875rem;
}

.pagination-controls {
display: flex;
align-items: center;
gap: 1rem;
}

.pagination-btn {
display: flex;
align-items: center;
gap: 0.5rem;
padding: 0.5rem 1rem;
background-color: white;
color: #374151;
border: 1px solid #d1d5db;
border-radius: 6px;
font-size: 0.875rem;
cursor: pointer;
transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
background-color: #f9fafb;
border-color: #9ca3af;
}

.pagination-btn:disabled {
opacity: 0.5;
cursor: not-allowed;
}

.page-numbers {
display: flex;
gap: 0.25rem;
}

.page-btn {
display: flex;
align-items: center;
justify-content: center;
width: 2.5rem;
height: 2.5rem;
background-color: white;
color: #374151;
border: 1px solid #d1d5db;
border-radius: 6px;
font-size: 0.875rem;
cursor: pointer;
transition: all 0.2s ease;
}

.page-btn:hover {
background-color: #f9fafb;
border-color: #9ca3af;
}

.page-btn.active {
background-color: #2e5c31;
color: white;
border-color: #2e5c31;
}

/* Editable cells */
.editable-cell {
position: relative;
cursor: pointer;
padding: 0.25rem;
border-radius: 4px;
transition: background-color 0.2s;
}

.editable-cell:hover {
background-color: #f3f4f6;
}

.editable-cell:hover::after {
content: '\f044';
font-family: 'Font Awesome 6 Free';
font-weight: 900;
font-size: 0.75rem;
color: #6b7280;
margin-left: 0.5rem;
}

.edit-input {
width: 100%;
padding: 0.25rem;
border: 1px solid #2e5c31;
border-radius: 4px;
font-size: 0.875rem;
}

/* Action buttons */
.action-buttons {
display: flex;
gap: 0.5rem;
}

.history-btn,
.edit-btn,
.delete-btn {
display: flex;
align-items: center;
justify-content: center;
width: 2rem;
height: 2rem;
border: none;
border-radius: 4px;
cursor: pointer;
transition: all 0.2s;
}

.history-btn {
background-color: #f3f4f6;
color: #3b82f6;
}

.history-btn:hover {
background-color: #dbeafe;
}

.edit-btn {
background-color: #f3f4f6;
color: #2e5c31;
}

.edit-btn:hover {
background-color: #e5e7eb;
}

.delete-btn {
background-color: #f3f4f6;
color: #ef4444;
}

.delete-btn:hover {
background-color: #fee2e2;
}

/* Modal */
.modal {
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

.modal-content {
background-color: white;
border-radius: 8px;
width: 90%;
max-width: 600px;
max-height: 90vh;
overflow-y: auto;
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.delete-modal {
max-width: 400px;
}

.modal-header {
display: flex;
justify-content: space-between;
align-items: center;
padding: 1.5rem;
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
font-size: 1.5rem;
color: #6b7280;
cursor: pointer;
}

.modal-body {
padding: 1.5rem;
}

/* Form */
.form-group {
margin-bottom: 1.25rem;
}

.form-row {
display: grid;
grid-template-columns: 1fr 1fr;
gap: 1rem;
}

.form-group label {
display: block;
font-size: 0.875rem;
font-weight: 500;
color: #374151;
margin-bottom: 0.5rem;
}

.form-group input,
.form-group select,
.form-group textarea {
width: 100%;
padding: 0.75rem;
border: 1px solid #d1d5db;
border-radius: 6px;
font-size: 0.875rem;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
outline: none;
border-color: #2e5c31;
box-shadow: 0 0 0 2px rgba(46, 92, 49, 0.1);
}

.form-actions {
display: flex;
justify-content: flex-end;
gap: 1rem;
margin-top: 1.5rem;
}

.cancel-btn,
.save-btn,
.delete-confirm-btn {
padding: 0.75rem 1.5rem;
border-radius: 6px;
font-weight: 500;
cursor: pointer;
transition: all 0.2s;
}

.cancel-btn {
background-color: #f3f4f6;
color: #374151;
border: 1px solid #d1d5db;
}

.cancel-btn:hover {
background-color: #e5e7eb;
}

.save-btn {
background-color: #2e5c31;
color: white;
border: none;
min-width: 120px;
display: flex;
align-items: center;
justify-content: center;
}

.save-btn:hover:not(:disabled) {
background-color: #26492a;
}

.save-btn:disabled,
.delete-confirm-btn:disabled {
opacity: 0.7;
cursor: not-allowed;
}

.delete-confirm-btn {
background-color: #ef4444;
color: white;
border: none;
min-width: 120px;
display: flex;
align-items: center;
justify-content: center;
}

.delete-confirm-btn:hover:not(:disabled) {
background-color: #dc2626;
}

.warning-text {
color: #ef4444;
font-size: 0.875rem;
}

/* Notification Recipients */
.notification-recipients {
display: flex;
flex-direction: column;
gap: 1rem;
padding: 1rem;
background-color: #f9fafb;
border-radius: 6px;
}

.checkbox-label {
display: flex;
align-items: flex-start;
gap: 0.75rem;
cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
width: auto;
margin: 0;
margin-top: 0.125rem;
}

.checkbox-label span {
font-weight: 500;
color: #374151;
}

.checkbox-label small {
display: block;
color: #6b7280;
font-size: 0.8rem;
margin-top: 0.25rem;
}

/* No pricing message */
.no-pricing {
padding: 0.5rem;
text-align: center;
font-style: italic;
color: #6b7280;
font-size: 0.875rem;
}

/* Compact unit-price display styles */
.unit-price-selector {
display: flex;
flex-direction: column;
gap: 0.5rem;
}

.single-unit-display {
display: flex;
align-items: center;
gap: 0.75rem;
flex-wrap: wrap;
}

.unit-badge {
background-color: #2e5c31;
color: white;
padding: 0.25rem 0.5rem;
border-radius: 4px;
font-size: 0.75rem;
font-weight: 500;
text-align: center;
}

.multiple-units-display {
display: flex;
align-items: center;
gap: 0.75rem;
flex-wrap: wrap;
}

.unit-dropdown {
padding: 0.25rem 0.5rem;
border: 1px solid #d1d5db;
border-radius: 4px;
font-size: 0.75rem;
background-color: white;
min-width: 80px;
}

.unit-dropdown:focus {
outline: none;
border-color: #2e5c31;
box-shadow: 0 0 0 1px rgba(46, 92, 49, 0.3);
}

.price-display {
display: flex;
align-items: center;
gap: 0.75rem;
}

.price-item-compact {
display: flex;
align-items: center;
gap: 0.25rem;
}

.price-label-compact {
font-size: 0.75rem;
font-weight: 500;
color: #6b7280;
min-width: 30px;
}

.editable-cell-compact {
position: relative;
cursor: pointer;
padding: 0.125rem 0.25rem;
border-radius: 3px;
transition: background-color 0.2s;
font-size: 0.875rem;
}

.editable-cell-compact:hover {
background-color: #f3f4f6;
}

.editable-cell-compact:hover::after {
content: '\f044';
font-family: 'Font Awesome 6 Free';
font-weight: 900;
font-size: 0.625rem;
color: #6b7280;
margin-left: 0.25rem;
}

.edit-input-compact {
width: 60px;
padding: 0.125rem 0.25rem;
border: 1px solid #2e5c31;
border-radius: 3px;
font-size: 0.875rem;
}

.no-pricing-compact {
padding: 0.5rem;
text-align: center;
font-style: italic;
color: #6b7280;
font-size: 0.875rem;
}

/* Separated Unit and Price column styles */
.unit-selector {
display: flex;
align-items: center;
justify-content: center;
}

.single-unit .unit-badge {
background-color: #2e5c31;
color: white;
padding: 0.25rem 0.5rem;
border-radius: 4px;
font-size: 0.75rem;
font-weight: 500;
text-align: center;
}

.multiple-units .unit-dropdown {
padding: 0.25rem 0.5rem;
border: 1px solid #d1d5db;
border-radius: 4px;
font-size: 0.75rem;
background-color: white;
min-width: 80px;
}

.multiple-units .unit-dropdown:focus {
outline: none;
border-color: #2e5c31;
box-shadow: 0 0 0 1px rgba(46, 92, 49, 0.3);
}

.no-unit {
text-align: center;
color: #6b7280;
font-style: italic;
font-size: 0.875rem;
}

.price-selector {
display: flex;
align-items: center;
justify-content: center;
}

.single-unit-price .price-display,
.multiple-units-price .price-display {
display: flex;
align-items: center;
gap: 0.75rem;
flex-wrap: wrap;
justify-content: center;
}

/* Table responsive adjustments */
.products-table th:nth-child(1) { /* Product Name */
min-width: 150px;
width: 20%;
}

.products-table th:nth-child(2) { /* Category */
min-width: 120px;
width: 15%;
}

.products-table th:nth-child(3) { /* Unit */
min-width: 100px;
width: 15%;
}

.products-table th:nth-child(4) { /* Price */
min-width: 180px;
width: 25%;
}

.products-table th:nth-child(5) { /* Variety */
min-width: 100px;
width: 15%;
}

.products-table th:nth-child(6) { /* Actions */
min-width: 120px;
width: 10%;
}

/* Chart container */
.chart-container {
margin: 1rem 0;
height: 400px;
}

.empty-history {
text-align: center;
padding: 2rem;
color: #6b7280;
}

.empty-history i {
font-size: 3rem;
margin-bottom: 1rem;
display: block;
}

/* History table */
.history-table-container {
margin-top: 0; /* Removed space between chart and table */
max-height: 300px;
overflow-y: auto;
}

.history-table {
width: 100%;
border-collapse: collapse;
font-size: 0.875rem;
}

.history-table th,
.history-table td {
padding: 0.75rem;
text-align: left;
border-bottom: 1px solid #e5e7eb;
}

.history-table th {
background-color: #f9fafb;
font-weight: 600;
color: #374151;
position: sticky;
top: 0;
}

.history-table tr:hover td {
background-color: #f9fafb;
}

/* Price change display */
.price-change {
display: flex;
flex-direction: column;
gap: 0.5rem;
padding: 0.75rem;
background-color: #f9fafb;
border-radius: 6px;
font-size: 0.875rem;
}

/* Unit pricing section */
.unit-pricing-section {
display: flex;
flex-direction: column;
gap: 1.5rem;
}

.unit-pricing-group {
padding: 1rem;
border: 1px solid #e5e7eb;
border-radius: 6px;
background-color: #f9fafb;
}

.unit-title {
font-size: 1rem;
font-weight: 600;
color: #2e5c31;
margin: 0 0 1rem 0;
}

.loading-pricing {
text-align: center;
color: #6b7280;
font-style: italic;
padding: 1rem;
}

.error-text {
color: #ef4444;
font-size: 0.875rem;
margin-top: 0.5rem;
}

/* Responsive Design */
@media (max-width: 768px) {
.dashboard-container {
  flex-direction: column;
}

.main-content {
  margin-left: 0;
  padding: 1rem;
}

.header-actions {
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
}

.form-row {
  grid-template-columns: 1fr;
}

.products-table {
  display: block;
  overflow-x: auto;
  white-space: nowrap;
}

.products-table th,
.products-table td {
  min-width: 120px;
  padding: 0.75rem;
}

.price-display {
  flex-direction: column;
  gap: 0.25rem;
}

.filters-container {
  flex-direction: column;
}

.export-group {
  width: 100%;
  justify-content: stretch;
}

.export-btn {
  flex: 1;
}

.pagination-container {
  flex-direction: column;
  gap: 1rem;
}

.pagination-controls {
  flex-direction: column;
  gap: 0.5rem;
}
}

@media (max-width: 1024px) {
.main-content {
  margin-left: 220px; /* Smaller sidebar on medium screens */
}
}
</style>