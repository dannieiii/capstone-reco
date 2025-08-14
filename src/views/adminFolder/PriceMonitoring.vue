<template>
  <div class="dashboard-container">
    <AdminSidebar initialActiveItem="Price Monitoring" />
    
    <div class="main-content">
      <!-- Clean Header -->
      <header class="header">
        <div class="page-title">
          <h1>Oriental Mindoro Price Monitoring</h1>
          <p>Real-time price analysis and D.A. reference comparison for Oriental Mindoro products</p>
        </div>
        
        <div class="header-controls">
          <button 
            @click="setView('monitoring')" 
            class="view-btn" 
            :class="{ active: currentView === 'monitoring' }"
          >
            <BarChart3 size="16" />
            Price Monitoring
          </button>
          
          <button 
            @click="setView('overpriced')" 
            class="view-btn" 
            :class="{ active: currentView === 'overpriced' }"
          >
            <AlertTriangle size="16" />
            Overpriced Products ({{ overpricedProducts.length }})
          </button>
          
          <button 
            @click="setView('underpriced')" 
            class="view-btn" 
            :class="{ active: currentView === 'underpriced' }"
          >
            <TrendingDown size="16" />
            Underpriced Products ({{ underpricedProducts.length }})
          </button>
          
          <button @click="refreshData" class="refresh-btn" :disabled="loading">
            <RefreshCw v-if="loading" size="16" class="spinner" />
            <span v-else>Refresh Data</span>
          </button>
        </div>
      </header>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-icon">
            <TrendingUp size="24" />
          </div>
          <div class="card-content">
            <h3>Average Price Deviation</h3>
            <div class="card-value" :class="avgDeviationClass">
              {{ avgDeviation }}
              <TrendingUp v-if="avgDeviationTrend === 'up'" size="16" class="trend-icon" />
              <TrendingDown v-else-if="avgDeviationTrend === 'down'" size="16" class="trend-icon" />
            </div>
            <div class="card-period">From D.A. reference prices</div>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="card-icon">
            <Package size="24" />
          </div>
          <div class="card-content">
            <h3>Products Monitored</h3>
            <div class="card-value">{{ monitoredProducts.length }}</div>
            <div class="card-period">{{ customProducts.length }} custom products</div>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="card-icon">
            <AlertTriangle size="24" />
          </div>
          <div class="card-content">
            <h3>Overpriced Products</h3>
            <div class="card-value text-warning">{{ overpricedProducts.length }}</div>
            <div class="card-period">{{ severeOverpriced.length }} severe cases</div>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="card-icon">
            <TrendingDown size="24" />
          </div>
          <div class="card-content">
            <h3>Underpriced Products</h3>
            <div class="card-value text-info">{{ underpricedProducts.length }}</div>
            <div class="card-period">Below DA minimum</div>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="card-icon">
            <Store size="24" />
          </div>
          <div class="card-content">
            <h3>Active Sellers</h3>
            <div class="card-value">{{ sellersCount }}</div>
            <div class="card-period">{{ flaggedSellers.length }} flagged</div>
          </div>
        </div>
      </div>

      <!-- Price Monitoring View -->
      <div v-if="currentView === 'monitoring'">
        <!-- Price Analysis Charts -->
        <div class="chart-section">
          <div class="section-header">
            <h2>Price Analysis - Oriental Mindoro</h2>
            <div class="chart-controls">
              <div class="chart-view-controls">
                <button 
                  v-for="view in chartViews" 
                  :key="view.value" 
                  :class="{ active: currentChartView === view.value }"
                  @click="setChartView(view.value)"
                  class="chart-view-btn">
                  {{ view.label }}
                </button>
              </div>
              
              <div class="chart-filters" v-if="currentChartView === 'category' || currentChartView === 'warnings'">
                <select v-if="currentChartView === 'category'" v-model="chartCategoryFilter" @change="renderChart">
                  <option value="">All Categories</option>
                  <option v-for="category in categories" :key="category" :value="category">
                    {{ category }}
                  </option>
                </select>
                
                <select v-if="currentChartView === 'warnings'" v-model="chartWarningFilter" @change="renderChart">
                  <option value="">All Warning Levels</option>
                  <option value="severe">Severe Only</option>
                  <option value="moderate">Moderate & Above</option>
                  <option value="mild">Mild & Above</option>
                </select>
              </div>
              
              <div class="export-controls">
                <div class="export-dropdown">
                  <button class="export-dropdown-btn" @click="toggleExportDropdown" :disabled="isExporting">
                    <Download size="14" />
                    Export
                    <ChevronDown size="14" />
                  </button>
                  <div v-if="showExportDropdown" class="export-dropdown-menu">
                    <button @click="exportToCSV" class="export-dropdown-item" :disabled="isExporting">
                      <FileText size="14" />
                      Export as CSV
                    </button>
                    <button @click="exportToPDF" class="export-dropdown-item" :disabled="isExporting">
                      <FileText size="14" />
                      Export as PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="chart-container">
            <canvas ref="priceChart"></canvas>
          </div>
        </div>
        
        <!-- Products Table -->
        <div class="table-section">
          <div class="section-header">
            <h2>Product Price Analysis</h2>
            <div class="header-actions">
              <div class="search-container">
                <input 
                  type="text" 
                  v-model="searchQuery" 
                  placeholder="Search products..." 
                  @input="applyFilters"
                />
                <Search size="16" class="search-icon" />
              </div>
              <div class="table-export-dropdown">
                <button class="table-export-btn" @click="toggleTableExportDropdown" :disabled="isExporting">
                  <Download size="14" />
                  Export
                  <ChevronDown size="14" />
                </button>
                <div v-if="showTableExportDropdown" class="table-export-dropdown-menu">
                  <button @click="exportFilteredToCSV" class="table-export-dropdown-item" :disabled="isExporting">
                    <FileText size="14" />
                    Export Filtered as CSV
                  </button>
                  <button @click="exportFilteredToPDF" class="table-export-dropdown-item" :disabled="isExporting">
                    <FileText size="14" />
                    Export Filtered as PDF
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Filters Section - Moved here -->
          <div class="filters-section">
            <div class="filter-group">
              <label>Category</label>
              <select v-model="selectedCategory" @change="applyFilters">
                <option value="">All Categories</option>
                <option v-for="category in categories" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
            </div>
            
            <div class="filter-group">
              <label>Product Type</label>
              <select v-model="selectedProductType" @change="applyFilters">
                <option value="">All Products</option>
                <option value="da-reference">D.A. Reference Products</option>
                <option value="custom">Custom Products</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label>Price Status</label>
              <select v-model="selectedPriceStatus" @change="applyFilters">
                <option value="">All Prices</option>
                <option value="within-range">Within D.A. Range</option>
                <option value="above-range">Above D.A. Range</option>
                <option value="below-range">Below D.A. Range</option>
                <option value="no-reference">No Reference</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label>Sort By</label>
              <select v-model="sortBy" @change="applyFilters">
                <option value="productName">Product Name</option>
                <option value="deviation">Price Deviation</option>
                <option value="price">Current Price</option>
                <option value="seller">Seller</option>
              </select>
            </div>
            
            <button class="reset-btn" @click="resetFilters">Reset Filters</button>
          </div>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th @click="sortTable('productName')">
                    Product Name
                    <ArrowUpDown size="14" />
                  </th>
                  <th @click="sortTable('category')">
                    Category
                    <ArrowUpDown size="14" />
                  </th>
                  <th @click="sortTable('sellerName')">
                    Seller
                    <ArrowUpDown size="14" />
                  </th>
                  <th>Unit Type</th>
                  <th>Current Price</th>
                  <th>DA Min Price</th>
                  <th>DA Max Price</th>
                  <th @click="sortTable('deviation')">
                    Deviation
                    <ArrowUpDown size="14" />
                  </th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="product in filteredProducts" :key="product.id">
                  <tr v-for="(unit, unitIndex) in product.units" :key="`${product.id}-${unitIndex}`">
                    <td v-if="unitIndex === 0" :rowspan="product.units.length">
                      <div class="product-cell">
                        <div class="product-image" :style="{ backgroundImage: `url(${getImageUrl(product.image)})` }"></div>
                        <div class="product-info">
                          <span class="product-name">{{ product.productName }}</span>
                          <div class="product-meta">
                            <span v-if="product.variety && product.variety !== 'Normal'" class="variety-badge">
                              {{ product.variety }}
                            </span>
                            <span v-if="product.isCustomProduct" class="custom-badge">Custom</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td v-if="unitIndex === 0" :rowspan="product.units.length">{{ product.category }}</td>
                    <td v-if="unitIndex === 0" :rowspan="product.units.length">{{ getSellerName(product.sellerId) }}</td>
                    <td>{{ unit.type }}</td>
                    <td>₱{{ formatPrice(unit.price) }}</td>
                    <td>
                      <span v-if="unit.daReference" class="da-price">₱{{ formatPrice(unit.daReference.minPrice) }}</span>
                      <span v-else class="no-da">N/A</span>
                    </td>
                    <td>
                      <span v-if="unit.daReference" class="da-price">₱{{ formatPrice(unit.daReference.maxPrice) }}</span>
                      <span v-else class="no-da">N/A</span>
                    </td>
                    <td>
                      <span v-if="unit.deviation !== null && !isNaN(unit.deviation)" 
                            class="deviation-value" 
                            :class="getDeviationClass(unit.deviation)">
                        {{ formatDeviation(unit.deviation) }}
                      </span>
                      <span v-else class="no-ref">N/A</span>
                    </td>
                    <td>
                      <span class="status-badge" :class="getUnitStatusClass(unit)">
                        {{ getUnitStatusText(unit) }}
                      </span>
                    </td>
                    <td v-if="unitIndex === 0" :rowspan="product.units.length">
                      <div class="action-buttons-container">
                        <button class="icon-btn view-btn" @click="viewProductDetails(product)" title="View Details">
                          <Eye class="action-icon" :size="18"/>
                        </button>
                        <button class="icon-btn export-btn" @click="exportProductToPDF(product)" title="Export Product">
                          <Download class="action-icon" :size="18"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          
          <div class="pagination">
            <button 
              :disabled="currentPage === 1" 
              @click="changePage(currentPage - 1)"
              class="pagination-btn"
            >
              <ChevronLeft size="16" /> Previous
            </button>
            <div class="page-info">
              Page {{ currentPage }} of {{ totalPages }}
            </div>
            <button 
              :disabled="currentPage === totalPages" 
              @click="changePage(currentPage + 1)"
              class="pagination-btn"
            >
              Next <ChevronRight size="16" />
            </button>
          </div>
        </div>
      </div>

      <!-- Overpriced Products View -->
      <OverpricedProducts 
        v-if="currentView === 'overpriced'"
        :overpricedProducts="overpricedProducts"
        :sellers="sellers"
        @send-warning="handleSendWarning"
        @view-seller="handleViewSeller"
        @product-deactivated="handleProductDeactivated"
        @refresh-products="refreshData"
      />

      <!-- Underpriced Products View -->
      <UnderpricedProducts 
        v-if="currentView === 'underpriced'"
        :underpricedProducts="underpricedProducts"
        :sellers="sellers"
        @refresh-products="refreshData"
      />

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner-container">
          <div class="spinner"></div>
        </div>
        <p>Loading Oriental Mindoro price data...</p>
      </div>

      <!-- Status Messages -->
      <div v-if="statusMessage" class="status-message" :class="statusMessage.type">
        <CheckCircle v-if="statusMessage.type === 'success'" size="16" />
        <AlertCircle v-else size="16" />
        {{ statusMessage.text }}
      </div>
    </div>
  </div>

  <!-- Product Details Modal -->
  <div v-if="showProductModal" class="modal-overlay" @click="closeProductModal">
    <div class="modal-content large-modal" @click.stop>
      <div class="modal-header">
        <h2>{{ selectedProduct?.productName }} - Price Analysis</h2>
        <button @click="closeProductModal" class="close-btn">
          <X size="20" />
        </button>
      </div>
      <div class="modal-body" v-if="selectedProduct">
        <div class="product-analysis">
          <div class="product-overview">
            <div class="product-image-large" :style="{ backgroundImage: `url(${getImageUrl(selectedProduct.image)})` }"></div>
            <div class="product-details">
              <h3>{{ selectedProduct.productName }}</h3>
              <div class="product-meta-grid">
                <div class="meta-item">
                  <span class="meta-label">Category:</span>
                  <span class="meta-value">{{ selectedProduct.category }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Seller:</span>
                  <span class="meta-value">{{ getSellerName(selectedProduct.sellerId) }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Variety:</span>
                  <span class="meta-value">{{ selectedProduct.variety || 'Normal' }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Status:</span>
                  <span class="meta-value">{{ selectedProduct.status }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Units Analysis -->
          <div class="units-analysis">
            <h4>Units & Pricing Analysis</h4>
            <div class="units-grid">
              <div 
                v-for="unit in selectedProduct.units" 
                :key="unit.type"
                class="unit-analysis-card"
                :class="getUnitStatusClass(unit)"
              >
                <div class="unit-header">
                  <h5>{{ unit.type }}</h5>
                  <span class="unit-status" :class="getUnitStatusClass(unit)">
                    {{ getUnitStatusText(unit) }}
                  </span>
                </div>
                
                <div class="pricing-details">
                  <div class="price-item">
                    <span class="price-label">Seller Price:</span>
                    <span class="price-value seller">₱{{ formatPrice(unit.price) }}</span>
                  </div>
                  
                  <div v-if="unit.daReference" class="price-item">
                    <span class="price-label">D.A. Range:</span>
                    <span class="price-value da">₱{{ formatPrice(unit.daReference.minPrice) }} - ₱{{ formatPrice(unit.daReference.maxPrice) }}</span>
                  </div>
                  
                  <div v-if="unit.deviation !== null && unit.deviation !== undefined" class="price-item">
                    <span class="price-label">Deviation:</span>
                    <span class="price-value" :class="getDeviationClass(unit.deviation)">
                      {{ formatDeviation(unit.deviation) }}
                    </span>
                  </div>
                  
                  <div class="price-item">
                    <span class="price-label">Stock:</span>
                    <span class="price-value">{{ unit.stock }} {{ unit.stockUnit }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Price History Chart -->
          <div class="price-history">
            <h4>Price History (Last 30 Days)</h4>
            <canvas ref="productHistoryChart"></canvas>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn-secondary" @click="closeProductModal">Close</button>
          <button v-if="hasOverpricedUnits(selectedProduct)" class="btn-warning" @click="sendWarningFromModal(selectedProduct)">
            <AlertTriangle size="16" /> Send Warning
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Warning Modal -->
  <div v-if="showWarningModal" class="modal-overlay" @click="closeWarningModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Send Price Warning</h2>
        <button @click="closeWarningModal" class="close-btn">
          <X size="20" />
        </button>
      </div>
      <div class="modal-body">
        <div v-if="warningTarget" class="warning-details">
          <div class="product-summary">
            <h3>{{ warningTarget.productName }}</h3>
            <p><strong>Seller:</strong> {{ getSellerName(warningTarget.sellerId) }}</p>
            
            <!-- Show overpriced units -->
            <div class="overpriced-units-summary">
              <h4>Overpriced Units:</h4>
              <div 
                v-for="unit in getOverpricedUnits(warningTarget)" 
                :key="unit.type"
                class="unit-warning-item"
              >
                <div class="unit-warning-header">
                  <strong>{{ unit.type }}</strong>
                  <span class="excess-badge">{{ formatDeviation(unit.deviation) }} over limit</span>
                </div>
                <div class="unit-warning-details">
                  <span>Seller: ₱{{ formatPrice(unit.price) }}</span>
                  <span>D.A. Max: ₱{{ formatPrice(unit.daReference.maxPrice) }}</span>
                  <span class="excess">₱{{ formatPrice(unit.excessAmount) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="warning-message">
            <label>Warning Message:</label>
            <textarea v-model="warningMessage" rows="6" placeholder="Enter warning message..."></textarea>
          </div>
          
          <div class="warning-options">
            <label>
              <input type="checkbox" v-model="includeGuidelines">
              Include pricing guidelines
            </label>
            <label>
              <input type="checkbox" v-model="requestResponse">
              Request response within 24 hours
            </label>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn-secondary" @click="closeWarningModal">Cancel</button>
          <button class="btn-warning" @click="confirmSendWarning" :disabled="!warningMessage.trim()">
            <Send size="16" /> Send Warning
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { collection, getDocs, query, where, orderBy, limit, Timestamp, doc, getDoc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from '@/firebase/firebaseConfig';
import Chart from 'chart.js/auto';
import AdminSidebar from '@/components/AdminSidebar.vue';
import OverpricedProducts from '@/components/OverpricedProducts.vue';
import UnderpricedProducts from '@/components/UnderpricedProducts.vue';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  Store,
  Search,
  ArrowUpDown,
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  X,
  Send,
  BarChart3,
  Download,
  FileText,
  ChevronDown
} from 'lucide-vue-next';

// Data properties
const loading = ref(false);
const currentView = ref('monitoring');
const products = ref([]);
const daProducts = ref([]);
const sellers = ref([]);
const monitoredProducts = ref([]);
const overpricedProducts = ref([]);
const underpricedProducts = ref([]);
const customProducts = ref([]);

// Chart refs
const priceChart = ref(null);
const productHistoryChart = ref(null);
const chartInstance = ref(null);
const productChartInstance = ref(null);

// Summary data
const avgDeviation = ref('0.0%');
const avgDeviationTrend = ref('neutral');
const sellersCount = ref(0);
const flaggedSellers = ref([]);
const severeOverpriced = ref([]);

// Filters
const selectedCategory = ref('');
const selectedProductType = ref('');
const selectedPriceStatus = ref('');
const sortBy = ref('productName');
const searchQuery = ref('');

// Chart filtering (separate from table filtering)
const chartCategoryFilter = ref('');
const chartWarningFilter = ref('');

// Pagination
const currentPage = ref(1);
const itemsPerPage = ref(10);
const totalItems = ref(0);

// Chart views
const currentChartView = ref('deviation');
const chartViews = [
  { label: 'Price Deviation', value: 'deviation' },
  { label: 'By Category', value: 'category' },
  { label: 'Warning Levels', value: 'warnings' }
];

// Modal state
const showProductModal = ref(false);
const showWarningModal = ref(false);
const selectedProduct = ref(null);
const warningTarget = ref(null);
const warningMessage = ref('');
const includeGuidelines = ref(true);
const requestResponse = ref(true);
const statusMessage = ref(null);

// Export functionality
const isExporting = ref(false);
const showExportDropdown = ref(false);
const showTableExportDropdown = ref(false);

// Categories
const categories = ref([]);

// Unit mapping for proper price comparison
const unitMapping = {
  'perKilo': { label: 'Per Kilo', stockField: 'stockPerKilo', priceField: 'pricePerKilo', stockUnit: 'kg' },
  'perSack': { label: 'Per Sack', stockField: 'stockPerSack', priceField: 'pricePerSack', stockUnit: 'sacks' },
  'perTali': { label: 'Per Tali', stockField: 'stockPerTali', priceField: 'pricePerTali', stockUnit: 'tali' },
  'perKaing': { label: 'Per Kaing', stockField: 'stockPerKaing', priceField: 'pricePerKaing', stockUnit: 'kaing' },
  'perBundle': { label: 'Per Bundle', stockField: 'stockPerBundle', priceField: 'pricePerBundle', stockUnit: 'bundles' },
  'perTray': { label: 'Per Tray', stockField: 'stockPerTray', priceField: 'pricePerTray', stockUnit: 'trays' },
  'perPiece': { label: 'Per Piece', stockField: 'stockPerPiece', priceField: 'pricePerPiece', stockUnit: 'pieces' }
};

// Fetch data from Firebase
const fetchData = async () => {
  loading.value = true;
  try {
    console.log('Starting data fetch...');
    
    // Fetch D.A. reference products
    const daProductsSnapshot = await getDocs(collection(db, 'productPrices'));
    const daProductsData = [];
    
    daProductsSnapshot.forEach((doc) => {
      const data = doc.data();
      daProductsData.push({
        id: doc.id,
        productName: data.productName || '',
        category: data.category || '',
        variety: data.variety || 'Normal',
        unitPricing: data.unitPricing || {},
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
    });
    
    daProducts.value = daProductsData;
    console.log('DA Products loaded:', daProductsData.length);
    
    // Fetch seller products
    const productsSnapshot = await getDocs(collection(db, 'products'));
    const productsData = [];
    const uniqueCategories = new Set();
    
    productsSnapshot.forEach((doc) => {
      const productData = doc.data();
      if (productData.category) {
        uniqueCategories.add(productData.category);
      }
      productsData.push({
        id: doc.id,
        ...productData
      });
    });
    
    products.value = productsData;
    categories.value = Array.from(uniqueCategories);
    console.log('Products loaded:', productsData.length);
    
    // Fetch sellers
    const sellersSnapshot = await getDocs(collection(db, 'sellers'));
    const sellersData = [];
    
    sellersSnapshot.forEach((doc) => {
      sellersData.push({
        id: doc.id,
        sellerId: doc.data().userId || doc.id,
        ...doc.data(),
        personalInfo: doc.data().personalInfo || {},
        farmDetails: doc.data().farmDetails || {},
      });
    });
    
    sellers.value = sellersData;
    console.log('Sellers loaded:', sellersData.length);
    
    // Process and analyze products
    await processProductAnalysis();
    
    // Render chart
    setTimeout(() => {
      renderChart();
    }, 100);
    
  } catch (error) {
    console.error("Error fetching data:", error);
    showStatus('error', 'Failed to load data');
  } finally {
    loading.value = false;
  }
};

// Process product analysis with multi-unit support and fixed deviation calculation
const processProductAnalysis = async () => {
  console.log('Processing product analysis...');
  const analyzed = [];
  const overpriced = [];
  const underpriced = [];
  const custom = [];

  for (const product of products.value) {
    if (!product || product.status === 'inactive') continue;

    const sellerName = getSellerName(product.sellerId);
    const daReference = findDAReference(product);

    // Get all available units for this product with proper processing
    const productUnits = getProductUnits(product);

    if (!productUnits || productUnits.length === 0) continue;

    const analyzedProduct = {
      ...product,
      sellerName,
      daReference,
      isCustomProduct: !daReference,
      units: productUnits,
      overallDeviation: null,
      priceStatus: 'no-reference',
      hasOverpricedUnits: false,
      hasUnderpricedUnits: false,
      warningLevel: 'none'
    };

    // Analyze each unit with proper deviation calculation
    let totalDeviation = 0;
    let deviationCount = 0;
    let hasOverpriced = false;
    let hasUnderpriced = false;
    let maxDeviation = 0;

    productUnits.forEach(unit => {
      if (!unit) return;
      
      if (unit.daReference && unit.daReference.minPrice && unit.daReference.maxPrice) {
        const { deviation, status, excess } = calculatePriceDeviation(unit.price, unit.daReference);
        
        // Ensure deviation is properly set as a number
        unit.deviation = deviation !== null && !isNaN(deviation) ? parseFloat(deviation) : null;
        unit.priceStatus = status;
        unit.excessAmount = excess || 0;

        if (unit.deviation !== null && !isNaN(unit.deviation)) {
          totalDeviation += Math.abs(unit.deviation);
          deviationCount++;
          maxDeviation = Math.max(maxDeviation, Math.abs(unit.deviation));
        }

        if (status === 'overpriced') {
          hasOverpriced = true;
          unit.isOverpriced = true;
        } else if (status === 'underpriced') {
          hasUnderpriced = true;
          unit.isUnderpriced = true;
        }
      } else {
        // Explicitly set these values for units without DA reference
        unit.deviation = null;
        unit.priceStatus = 'no-reference';
        unit.excessAmount = 0;
        unit.isOverpriced = false;
        unit.isUnderpriced = false;
      }
    });

    // Calculate overall product metrics
    if (deviationCount > 0) {
      analyzedProduct.overallDeviation = totalDeviation / deviationCount;
      if (hasOverpriced) {
        analyzedProduct.priceStatus = 'overpriced';
      } else if (hasUnderpriced) {
        analyzedProduct.priceStatus = 'underpriced';
      } else {
        analyzedProduct.priceStatus = 'within-range';
      }
    }

    analyzedProduct.hasOverpricedUnits = hasOverpriced;
    analyzedProduct.hasUnderpricedUnits = hasUnderpriced;

    // Determine warning level based on maximum deviation
    if (hasOverpriced) {
      if (maxDeviation > 50) {
        analyzedProduct.warningLevel = 'severe';
      } else if (maxDeviation > 25) {
        analyzedProduct.warningLevel = 'moderate';
      } else if (maxDeviation > 10) {
        analyzedProduct.warningLevel = 'mild';
      }

      overpriced.push(analyzedProduct);
    }

    // Add products with underpriced units to underpriced array
    if (hasUnderpriced) {
      underpriced.push(analyzedProduct);
    }

    if (!daReference) {
      custom.push(analyzedProduct);
    }

    analyzed.push(analyzedProduct);
  }

  monitoredProducts.value = analyzed;
  overpricedProducts.value = overpriced;
  underpricedProducts.value = underpriced;
  customProducts.value = custom;

  console.log('Analysis complete:', {
    total: analyzed.length,
    overpriced: overpriced.length,
    underpriced: underpriced.length,
    custom: custom.length
  });

  // Calculate summary statistics
  calculateSummaryStats();
};

// Get product units with pricing and stock info - FIXED VERSION
const getProductUnits = (product) => {
  if (!product || !product.availableUnits || !Array.isArray(product.availableUnits)) {
    return [];
  }
  
  const units = [];
  
  product.availableUnits.forEach(unitType => {
    const unitConfig = unitMapping[unitType];
    if (!unitConfig) return;
    
    const price = product[unitConfig.priceField] || 0;
    const stock = product[unitConfig.stockField] || 0;
    
    // Only create unit if price > 0 (seller actually offers this unit)
    if (price > 0) {
      const daReference = findUnitDAReference(product, unitType);
      
      // Add debug logging
      if (!daReference) {
        console.log(`No DA reference found for ${product.productName} - ${unitType}:`, {
          product: product.productName,
          unitType,
          hasDAData: !!findDAReference(product),
          daProductKeys: findDAReference(product) ? Object.keys(findDAReference(product).unitPricing || {}) : []
        });
      } else {
        console.log(`DA reference found for ${product.productName} - ${unitType}:`, daReference);
      }
      
      const unit = {
        type: unitConfig.label,
        price: price,
        stock: stock,
        stockUnit: unitConfig.stockUnit,
        daReference: daReference,
        deviation: null, // Will be calculated in processProductAnalysis
        priceStatus: 'unknown',
        excessAmount: 0,
        isOverpriced: false
      };
      
      units.push(unit);
    }
  });
  
  return units;
};

// Find D.A. reference for a specific unit - IMPROVED VERSION
const findUnitDAReference = (product, unitType) => {
  const daProduct = findDAReference(product);
  if (!daProduct || !daProduct.unitPricing) return null;
  
  // Map unit types to D.A. unit names with better matching
  const unitNameMapping = {
    'perKilo': ['per kg', 'per kilo', 'kg', 'kilo', 'kilogram'],
    'perSack': ['per sack', 'sack', 'per bag', 'bag', 'sako'],
    'perTali': ['per tali', 'tali', 'tied', 'bundle'],
    'perKaing': ['per kaing', 'kaing', 'per basket', 'basket'],
    'perBundle': ['per bundle', 'bundle', 'bigkis'],
    'perTray': ['per tray', 'tray', 'bandehado'],
    'perPiece': ['per piece', 'piece', 'each', 'piraso', 'biji']
  };
  
  const possibleNames = unitNameMapping[unitType] || [];
  
  // First try exact matches
  for (const [daUnitName, pricing] of Object.entries(daProduct.unitPricing)) {
    if (pricing && typeof pricing === 'object') {
      // Check for both newMinPrice/newMaxPrice and minPrice/maxPrice patterns
      const minPrice = pricing.newMinPrice || pricing.minPrice;
      const maxPrice = pricing.newMaxPrice || pricing.maxPrice;
      
      if (minPrice !== undefined && maxPrice !== undefined && minPrice > 0 && maxPrice > 0) {
        const normalizedDAName = daUnitName.toLowerCase().trim();
        
        // Check for exact matches first
        if (possibleNames.some(name => normalizedDAName === name)) {
          return {
            unit: daUnitName,
            minPrice: parseFloat(minPrice),
            maxPrice: parseFloat(maxPrice)
          };
        }
      }
    }
  }
  
  // Then try partial matches
  for (const [daUnitName, pricing] of Object.entries(daProduct.unitPricing)) {
    if (pricing && typeof pricing === 'object') {
      // Check for both newMinPrice/newMaxPrice and minPrice/maxPrice patterns
      const minPrice = pricing.newMinPrice || pricing.minPrice;
      const maxPrice = pricing.newMaxPrice || pricing.maxPrice;
      
      if (minPrice !== undefined && maxPrice !== undefined && minPrice > 0 && maxPrice > 0) {
        const normalizedDAName = daUnitName.toLowerCase().trim();
        
        // Check for partial matches
        if (possibleNames.some(name => 
          normalizedDAName.includes(name) || name.includes(normalizedDAName.replace('per ', ''))
        )) {
          return {
            unit: daUnitName,
            minPrice: parseFloat(minPrice),
            maxPrice: parseFloat(maxPrice)
          };
        }
      }
    }
  }
  
  return null;
};

// Find D.A. reference for a product - IMPROVED VERSION
const findDAReference = (product) => {
  if (!product || !product.productName) return null;
  
  return daProducts.value.find(da => {
    if (!da || !da.productName) return false;
    
    const cleanProductName = product.productName.toLowerCase().replace(/[()]/g, '').replace(/\s+/g, ' ').trim();
    const cleanDAName = da.productName.toLowerCase().replace(/[()]/g, '').replace(/\s+/g, ' ').trim();
    
    // Try exact match first
    if (cleanDAName === cleanProductName) return true;
    
    // Try base name match
    const baseProductName = cleanProductName.split(/[\s(,]/)[0];
    const baseDAName = cleanDAName.split(/[\s(,]/)[0];
    
    if (baseDAName === baseProductName && baseProductName.length > 2) return true;
    
    // Try contains match for longer names
    const nameMatch = (cleanDAName.includes(baseProductName) || cleanProductName.includes(baseDAName)) && 
                     baseProductName.length > 3;
    
    const categoryMatch = da.category === product.category;
    const varietyMatch = !product.variety || product.variety === 'Normal' || 
                        da.variety === product.variety || !da.variety || da.variety === 'Normal';
    
    return nameMatch && categoryMatch && varietyMatch;
  });
};

// Modify the getUnitStatusClass and getUnitStatusText functions to be more robust
const getUnitStatusClass = (unit) => {
  if (!unit || !unit.daReference) return 'no-reference';
  if (unit.isOverpriced) return 'overpriced';
  if (unit.priceStatus === 'within-range') return 'within-range';
  if (unit.priceStatus === 'underpriced') return 'underpriced';
  return 'unknown';
};

const getUnitStatusText = (unit) => {
  if (!unit || !unit.daReference) return 'No Reference';
  if (unit.isOverpriced) return 'Overpriced';
  if (unit.priceStatus === 'within-range') return 'Normal';
  if (unit.priceStatus === 'underpriced') return 'Underpriced';
  return 'Unknown';
};

// Update the calculatePriceDeviation function to ensure it always returns valid numbers
const calculatePriceDeviation = (sellerPrice, daReference) => {
  if (!daReference || !sellerPrice || sellerPrice <= 0 || 
      !daReference.minPrice || !daReference.maxPrice || 
      daReference.minPrice <= 0 || daReference.maxPrice <= 0) {
    return { deviation: null, status: 'no-reference', excess: 0 };
  }
  
  const daMin = parseFloat(daReference.minPrice);
  const daMax = parseFloat(daReference.maxPrice);
  const price = parseFloat(sellerPrice);
  
  let deviation = 0;
  let status = 'within-range';
  let excess = 0;
  
  if (price > daMax) {
    deviation = ((price - daMax) / daMax) * 100;
    deviation = Math.min(deviation, 100);
    status = 'overpriced';
    excess = price - daMax;
  } else if (price < daMin) {
    deviation = ((daMin - price) / daMin) * 100 * -1;
    deviation = Math.max(deviation, -100);
    status = 'underpriced';
    excess = 0;
  } else {
    const midPoint = (daMin + daMax) / 2;
    deviation = ((price - midPoint) / midPoint) * 100;
    deviation = Math.max(-100, Math.min(100, deviation));
    status = 'within-range';
    excess = 0;
  }
  
  return { 
    deviation: parseFloat(deviation.toFixed(2)), 
    status, 
    excess 
  };
};

// Get seller name
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

// Calculate summary statistics
const calculateSummaryStats = () => {
  const productsWithDeviation = monitoredProducts.value.filter(p => p.overallDeviation !== null);
  
  if (productsWithDeviation.length > 0) {
    const totalDeviation = productsWithDeviation.reduce((sum, p) => sum + Math.abs(p.overallDeviation), 0);
    const avgDev = totalDeviation / productsWithDeviation.length;
    // Cap average deviation display at 100%
    avgDeviation.value = `${Math.min(avgDev, 100).toFixed(1)}%`;
    
    // Determine trend (simplified)
    avgDeviationTrend.value = avgDev > 15 ? 'up' : avgDev < 5 ? 'down' : 'neutral';
  }
  
  sellersCount.value = sellers.value.length;
  
  // Find flagged sellers
  const sellerOverpriceCount = {};
  overpricedProducts.value.forEach(product => {
    sellerOverpriceCount[product.sellerId] = (sellerOverpriceCount[product.sellerId] || 0) + 1;
  });
  
  flaggedSellers.value = Object.keys(sellerOverpriceCount).filter(sellerId => 
    sellerOverpriceCount[sellerId] >= 3
  );
  
  severeOverpriced.value = overpricedProducts.value.filter(p => p.warningLevel === 'severe');
};

// Helper functions
const getImageUrl = (imageData) => {
  if (!imageData) return '/placeholder.svg?height=50&width=50';
  if (imageData.startsWith('http')) return imageData;
  if (imageData.startsWith('data:image')) return imageData;
  return '/placeholder.svg?height=50&width=50';
};

const formatPrice = (price) => {
  return parseFloat(price || 0).toFixed(2);
};

const formatDeviation = (deviation) => {
  if (deviation === null || deviation === undefined || isNaN(deviation)) return 'N/A';
  return deviation > 0 ? `+${deviation.toFixed(1)}%` : `${deviation.toFixed(1)}%`;
};

const getDeviationClass = (deviation) => {
  if (deviation === null || deviation === undefined || isNaN(deviation)) return '';
  const absDeviation = Math.abs(deviation);
  if (absDeviation > 50) return 'text-danger';
  if (absDeviation > 25) return 'text-warning';
  if (absDeviation > 10) return 'text-info';
  return 'text-success';
};

const hasAnyDeviation = (product) => {
  if (!product || !product.units || !Array.isArray(product.units)) {
    return false;
  }
  return product.units.some(unit => 
    unit && 
    unit.deviation !== null && 
    unit.deviation !== undefined && 
    !isNaN(unit.deviation)
  );
};

const hasOverpricedUnits = (product) => {
  return product.units && Array.isArray(product.units) && 
    product.units.some(unit => unit && unit.isOverpriced);
};

const getOverpricedUnits = (product) => {
  return product.units ? product.units.filter(unit => unit.isOverpriced) : [];
};

// Chart rendering with different types for deviation, category, and warnings (UPDATED)
const renderChart = () => {
  if (!priceChart.value) return;

  if (chartInstance.value) {
    chartInstance.value.destroy();
  }

  const ctx = priceChart.value.getContext('2d');

  let labels = [];
  let datasets = [];
  let chartType = 'doughnut';

  const primaryColor = '#2e5c31';
  const dangerColor = '#ef4444';
  const warningColor = '#f59e0b';
  const successColor = '#10b981';
  const infoColor = '#3b82f6';

  if (currentChartView.value === 'deviation') {
    // Doughnut chart for deviation ranges
    const deviationRanges = {
      'Severe (>50%)': 0,
      'Moderate (25-50%)': 0,
      'Mild (10-25%)': 0,
      'Within Range': 0,
      'Below Range': 0
    };

    monitoredProducts.value.forEach(product => {
      if (!product || product.overallDeviation === null || product.overallDeviation === undefined) return;

      if (product.hasOverpricedUnits && product.units && Array.isArray(product.units)) {
        const validUnits = product.units.filter(u => 
          u && 
          u.deviation !== null && 
          u.deviation !== undefined && 
          !isNaN(u.deviation)
        );
        
        if (validUnits.length > 0) {
          const maxDeviation = Math.max(...validUnits.map(u => Math.abs(u.deviation)));
          if (maxDeviation > 50) deviationRanges['Severe (>50%)']++;
          else if (maxDeviation > 25) deviationRanges['Moderate (25-50%)']++;
          else deviationRanges['Mild (10-25%)']++;
        }
      } else if (product.priceStatus === 'within-range') {
        deviationRanges['Within Range']++;
      } else {
        deviationRanges['Below Range']++;
      }
    });

    labels = Object.keys(deviationRanges);
    const data = Object.values(deviationRanges);
    const colors = [dangerColor, warningColor, '#fbbf24', successColor, infoColor];

    datasets.push({
      label: 'Products by Price Deviation',
      data: data,
      backgroundColor: colors.map(color => color + '80'),
      borderColor: colors,
      borderWidth: 2
    });

    chartType = 'doughnut';

  } else if (currentChartView.value === 'category') {
    // Bar chart by category with filtering
    const categoryData = {};
    const filteredProducts = chartCategoryFilter.value 
      ? monitoredProducts.value.filter(p => p.category === chartCategoryFilter.value)
      : monitoredProducts.value;

    filteredProducts.forEach(product => {
      if (!categoryData[product.category]) {
        categoryData[product.category] = {
          total: 0,
          overpriced: 0,
          withinRange: 0,
          custom: 0
        };
      }
      
      categoryData[product.category].total++;
      
      if (product.hasOverpricedUnits) {
        categoryData[product.category].overpriced++;
      } else if (product.isCustomProduct) {
        categoryData[product.category].custom++;
      } else {
        categoryData[product.category].withinRange++;
      }
    });

    labels = Object.keys(categoryData);
    datasets = [
      {
        label: 'Overpriced',
        data: labels.map(cat => categoryData[cat].overpriced),
        backgroundColor: dangerColor + '80',
        borderColor: dangerColor,
        borderWidth: 1
      },
      {
        label: 'Within Range',
        data: labels.map(cat => categoryData[cat].withinRange),
        backgroundColor: successColor + '80',
        borderColor: successColor,
        borderWidth: 1
      },
      {
        label: 'Custom Products',
        data: labels.map(cat => categoryData[cat].custom),
        backgroundColor: warningColor + '80',
        borderColor: warningColor,
        borderWidth: 1
      }
    ];

    chartType = 'bar';

  } else if (currentChartView.value === 'warnings') {
    // Area chart for warning levels by category (CHANGED FROM LINE)
    let filteredProducts = overpricedProducts.value;
    
    if (chartWarningFilter.value) {
      if (chartWarningFilter.value === 'severe') {
        filteredProducts = filteredProducts.filter(p => p.warningLevel === 'severe');
      } else if (chartWarningFilter.value === 'moderate') {
        filteredProducts = filteredProducts.filter(p => ['severe', 'moderate'].includes(p.warningLevel));
      } else if (chartWarningFilter.value === 'mild') {
        filteredProducts = filteredProducts.filter(p => ['severe', 'moderate', 'mild'].includes(p.warningLevel));
      }
    }

    // Group by category and warning level
    const categoryWarningData = {};
    
    filteredProducts.forEach(product => {
      if (!categoryWarningData[product.category]) {
        categoryWarningData[product.category] = {
          severe: 0,
          moderate: 0,
          mild: 0,
          low: 0
        };
      }
      
      if (product.warningLevel === 'severe') {
        categoryWarningData[product.category].severe++;
      } else if (product.warningLevel === 'moderate') {
        categoryWarningData[product.category].moderate++;
      } else if (product.warningLevel === 'mild') {
        categoryWarningData[product.category].mild++;
      } else {
        categoryWarningData[product.category].low++;
      }
    });

    labels = Object.keys(categoryWarningData);
    
    datasets = [
      {
        label: 'Severe',
        data: labels.map(cat => categoryWarningData[cat].severe),
        backgroundColor: dangerColor + '60',
        borderColor: dangerColor,
        borderWidth: 2,
        fill: true,
        tension: 0.4
      },
      {
        label: 'Moderate',
        data: labels.map(cat => categoryWarningData[cat].moderate),
        backgroundColor: warningColor + '60',
        borderColor: warningColor,
        borderWidth: 2,
        fill: true,
        tension: 0.4
      },
      {
        label: 'Mild',
        data: labels.map(cat => categoryWarningData[cat].mild),
        backgroundColor: '#fbbf24' + '60',
        borderColor: '#fbbf24',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      },
      {
        label: 'Low',
        data: labels.map(cat => categoryWarningData[cat].low),
        backgroundColor: successColor + '60',
        borderColor: successColor,
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }
    ];

    chartType = 'line'; // Will be rendered as area chart due to fill: true
  }

  chartInstance.value = new Chart(ctx, {
    type: chartType,
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          display: true,
          position: chartType === 'bar' ? 'top' : 'right'
        },
        title: { 
          display: true, 
          text: `${chartViews.find(v => v.value === currentChartView.value)?.label} - Oriental Mindoro`,
          font: { size: 16, weight: 'bold' }
        }
      },
      scales: chartType === 'bar' ? {
        x: { 
          grid: { display: false },
          stacked: true
        },
        y: { 
          beginAtZero: true,
          title: { display: true, text: 'Number of Products' },
          stacked: true
        }
      } : chartType === 'line' ? {
        x: { 
          grid: { display: true },
          title: { display: true, text: 'Product Categories' }
        },
        y: { 
          beginAtZero: true,
          title: { display: true, text: 'Number of Products' }
        }
      } : {}
    }
  });
};

// Export functionality
const toggleExportDropdown = () => {
  showExportDropdown.value = !showExportDropdown.value;
};

const exportToCSV = async () => {
  showExportDropdown.value = false;
  isExporting.value = true;
  try {
    const csvContent = generateCSVContent();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `price-monitoring-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showStatus('success', 'CSV export completed successfully!');
  } catch (error) {
    console.error('Export error:', error);
    showStatus('error', 'Failed to export CSV');
  } finally {
    isExporting.value = false;
  }
};

const exportToPDF = async () => {
  showExportDropdown.value = false;
  isExporting.value = true;
  try {
    const content = generatePDFContent();
    const blob = new Blob([content], { type: 'application/pdf' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `price-monitoring-${new Date().toISOString().split('T')[0]}.pdf`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showStatus('success', 'PDF export completed successfully!');
  } catch (error) {
    console.error('Export error:', error);
    showStatus('error', 'Failed to export PDF');
  } finally {
    isExporting.value = false;
  }
};

const exportProductToPDF = async (product) => {
  isExporting.value = true;
  try {
    const content = generateProductPDFContent(product);
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${product.productName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-analysis.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showStatus('success', `Product analysis exported successfully!`);
  } catch (error) {
    console.error('Export error:', error);
    showStatus('error', 'Failed to export product analysis');
  } finally {
    isExporting.value = false;
  }
};

const generateCSVContent = () => {
  const headers = [
    'Product Name',
    'Category', 
    'Seller',
    'Unit Type',
    'Unit Price',
    'Stock',
    'D.A. Min Price',
    'D.A. Max Price',
    'Price Deviation',
    'Status',
    'Warning Level'
  ];
  
  let csvContent = headers.join(',') + '\n';
  
  filteredProducts.value.forEach(product => {
    const units = product.units || [];
    units.forEach(unit => {
      const row = [
        `"${product.productName}"`,
        `"${product.category}"`,
        `"${getSellerName(product.sellerId)}"`,
        `"${unit.type}"`,
        unit.price,
        `${unit.stock} ${unit.stockUnit}`,
        unit.daReference ? unit.daReference.minPrice : 'N/A',
        unit.daReference ? unit.daReference.maxPrice : 'N/A',
        unit.deviation !== null ? formatDeviation(unit.deviation) : 'N/A',
        getUnitStatusText(unit),
        product.warningLevel || 'none'
      ];
      csvContent += row.join(',') + '\n';
    });
  });
  
  return csvContent;
};

const generatePDFContent = () => {
  let content = 'ORIENTAL MINDORO PRICE MONITORING REPORT\n';
  content += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
  
  content += 'SUMMARY:\n';
  content += `- Total Products Monitored: ${monitoredProducts.value.length}\n`;
  content += `- Overpriced Products: ${overpricedProducts.value.length}\n`;
  content += `- Average Price Deviation: ${avgDeviation.value}\n`;
  content += `- Active Sellers: ${sellersCount.value}\n\n`;
  
  content += 'DETAILED ANALYSIS:\n\n';
  
  filteredProducts.value.forEach(product => {
    content += `Product: ${product.productName}\n`;
    content += `Category: ${product.category}\n`;
    content += `Seller: ${getSellerName(product.sellerId)}\n`;
    
    const units = product.units || [];
    units.forEach(unit => {
      content += `  - ${unit.type}: ₱${formatPrice(unit.price)}`;
      if (unit.deviation !== null) {
        content += ` (${formatDeviation(unit.deviation)})`;
      }
      content += `\n`;
    });
    content += '\n';
  });
  
  return content;
};

const generateProductPDFContent = (product) => {
  let content = `PRODUCT ANALYSIS REPORT\n`;
  content += `Product: ${product.productName}\n`;
  content += `Category: ${product.category}\n`;
  content += `Seller: ${getSellerName(product.sellerId)}\n`;
  content += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
  
  content += 'UNIT PRICING ANALYSIS:\n\n';
  
  const units = product.units || [];
  units.forEach(unit => {
    content += `${unit.type}:\n`;
    content += `  Seller Price: ₱${formatPrice(unit.price)}\n`;
    if (unit.daReference) {
      content += `  D.A. Range: ₱${formatPrice(unit.daReference.minPrice)} - ₱${formatPrice(unit.daReference.maxPrice)}\n`;
      content += `  Deviation: ${formatDeviation(unit.deviation)}\n`;
    } else {
      content += `  D.A. Reference: Not Available\n`;
    }
    content += `  Stock: ${unit.stock} ${unit.stockUnit}\n`;
    content += `  Status: ${getUnitStatusText(unit)}\n\n`;
  });
  
  if (hasOverpricedUnits(product)) {
    content += 'OVERPRICED UNITS:\n';
    getOverpricedUnits(product).forEach(unit => {
      content += `- ${unit.type}: ₱${formatPrice(unit.excessAmount)} over D.A. maximum\n`;
    });
  }
  
  return content;
};

const toggleTableExportDropdown = () => {
  showTableExportDropdown.value = !showTableExportDropdown.value;
};

const exportFilteredToCSV = async () => {
  showTableExportDropdown.value = false;
  isExporting.value = true;
  try {
    const csvContent = generateFilteredCSVContent();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `filtered-price-monitoring-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showStatus('success', 'Filtered CSV export completed successfully!');
  } catch (error) {
    console.error('Export error:', error);
    showStatus('error', 'Failed to export filtered CSV');
  } finally {
    isExporting.value = false;
  }
};

const exportFilteredToPDF = async () => {
  showTableExportDropdown.value = false;
  isExporting.value = true;
  try {
    const content = generateFilteredPDFContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `filtered-price-monitoring-${new Date().toISOString().split('T')[0]}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showStatus('success', 'Filtered PDF export completed successfully!');
  } catch (error) {
    console.error('Export error:', error);
    showStatus('error', 'Failed to export filtered PDF');
  } finally {
    isExporting.value = false;
  }
};

const generateFilteredCSVContent = () => {
  const headers = [
    'Product Name',
    'Category', 
    'Seller',
    'Unit Type',
    'Unit Price',
    'Stock',
    'D.A. Min Price',
    'D.A. Max Price',
    'Price Deviation',
    'Status',
    'Warning Level'
  ];
  
  let csvContent = headers.join(',') + '\n';
  
  filteredProducts.value.forEach(product => {
    const units = product.units || [];
    units.forEach(unit => {
      const row = [
        `"${product.productName}"`,
        `"${product.category}"`,
        `"${getSellerName(product.sellerId)}"`,
        `"${unit.type}"`,
        unit.price,
        `${unit.stock} ${unit.stockUnit}`,
        unit.daReference ? unit.daReference.minPrice : 'N/A',
        unit.daReference ? unit.daReference.maxPrice : 'N/A',
        unit.deviation !== null ? formatDeviation(unit.deviation) : 'N/A',
        getUnitStatusText(unit),
        product.warningLevel || 'none'
      ];
      csvContent += row.join(',') + '\n';
    });
  });
  
  return csvContent;
};

const generateFilteredPDFContent = () => {
  let content = 'ORIENTAL MINDORO PRICE MONITORING REPORT (FILTERED)\n';
  content += `Generated on: ${new Date().toLocaleDateString()}\n`;
  content += `Applied Filters: Category: ${selectedCategory.value || 'All'}, Type: ${selectedProductType.value || 'All'}, Status: ${selectedPriceStatus.value || 'All'}\n\n`;
  
  content += 'SUMMARY:\n';
  content += `- Filtered Products: ${filteredProducts.value.length}\n`;
  content += `- Total Products Monitored: ${monitoredProducts.value.length}\n`;
  content += `- Overpriced Products: ${overpricedProducts.value.length}\n\n`;
  
  content += 'DETAILED ANALYSIS:\n\n';
  
  filteredProducts.value.forEach(product => {
    content += `Product: ${product.productName}\n`;
    content += `Category: ${product.category}\n`;
    content += `Seller: ${getSellerName(product.sellerId)}\n`;
    
    const units = product.units || [];
    units.forEach(unit => {
      content += `  - ${unit.type}: ₱${formatPrice(unit.price)}`;
      if (unit.deviation !== null) {
        content += ` (${formatDeviation(unit.deviation)})`;
      }
      content += `\n`;
    });
    content += '\n';
  });
  
  return content;
};

// Computed properties
const filteredProducts = computed(() => {
  let result = [...monitoredProducts.value];
  
  // Apply filters
  if (selectedCategory.value) {
    result = result.filter(product => product.category === selectedCategory.value);
  }
  
  if (selectedProductType.value) {
    if (selectedProductType.value === 'da-reference') {
      result = result.filter(product => !product.isCustomProduct);
    } else if (selectedProductType.value === 'custom') {
      result = result.filter(product => product.isCustomProduct);
    }
  }
  
  if (selectedPriceStatus.value) {
    result = result.filter(product => {
      if (selectedPriceStatus.value === 'above-range') {
        return product.hasOverpricedUnits;
      } else if (selectedPriceStatus.value === 'within-range') {
        return !product.hasOverpricedUnits && !product.isCustomProduct;
      } else if (selectedPriceStatus.value === 'no-reference') {
        return product.isCustomProduct;
      }
      return true;
    });
  }
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(product => 
      product.productName.toLowerCase().includes(query) || 
      product.category.toLowerCase().includes(query) ||
      (product.sellerName && product.sellerName.toLowerCase().includes(query))
    );
  }
  
  // Apply sorting
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'productName':
        return a.productName.localeCompare(b.productName);
      case 'deviation':
        return (b.overallDeviation || 0) - (a.overallDeviation || 0);
      case 'seller':
        return (a.sellerName || '').localeCompare(b.sellerName || '');
      default:
        return 0;
    }
  });
  
  totalItems.value = result.length;
  
  // Apply pagination
  const startIndex = (currentPage.value - 1) * itemsPerPage.value;
  const endIndex = startIndex + itemsPerPage.value;
  return result.slice(startIndex, endIndex);
});

const totalPages = computed(() => {
  return Math.ceil(totalItems.value / itemsPerPage.value);
});

const avgDeviationClass = computed(() => {
  const value = parseFloat(avgDeviation.value);
  if (value > 15) return 'text-danger';
  if (value > 5) return 'text-warning';
  return 'text-success';
});

// Methods
const setView = (view) => {
  currentView.value = view;
};

const refreshData = async () => {
  await fetchData();
  showStatus('success', 'Data refreshed successfully');
};

const applyFilters = () => {
  currentPage.value = 1;
};

const resetFilters = () => {
  selectedCategory.value = '';
  selectedProductType.value = '';
  selectedPriceStatus.value = '';
  sortBy.value = 'productName';
  searchQuery.value = '';
  currentPage.value = 1;
};

const changePage = (page) => {
  currentPage.value = page;
};

const sortTable = (column) => {
  sortBy.value = column;
  applyFilters();
};

const setChartView = (view) => {
  currentChartView.value = view;
  renderChart();
};

const viewProductDetails = (product) => {
  selectedProduct.value = product;
  showProductModal.value = true;
  
  setTimeout(() => {
    renderProductChart();
  }, 100);
};

const closeProductModal = () => {
  showProductModal.value = false;
  selectedProduct.value = null;
  
  if (productChartInstance.value) {
    productChartInstance.value.destroy();
    productChartInstance.value = null;
  }
};

const sendWarning = (product) => {
  warningTarget.value = product;
  warningMessage.value = generateWarningMessage(product);
  showWarningModal.value = true;
};

const sendWarningFromModal = (product) => {
  closeProductModal();
  sendWarning(product);
};

const generateWarningMessage = (product) => {
  const overpricedUnits = getOverpricedUnits(product);
  const sellerName = getSellerName(product.sellerId);

  let message = `Dear ${sellerName},

We have noticed that your product "${product.productName}" has pricing that exceeds Department of Agriculture guidelines:

`;

  overpricedUnits.forEach(unit => {
    message += `• ${unit.type}: ₱${formatPrice(unit.price)} (${formatDeviation(unit.deviation)} above D.A. max of ₱${formatPrice(unit.daReference.maxPrice)})
`;
  });

  message += `
We kindly request that you review and adjust your pricing to align with D.A. guidelines to ensure fair pricing for consumers.

Thank you for your cooperation.

Best regards,
Agricultural Marketplace Administration`;

  return message;
};

const confirmSendWarning = async () => {
  try {
    // Create notification in Firebase
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      userId: warningTarget.value.sellerId,
      title: 'Price Warning Received',
      message: `Your product "${warningTarget.value.productName}" has units priced above D.A. guidelines. Please review your pricing.`,
      type: 'alert',
      read: false,
      timestamp: serverTimestamp(),
      productId: warningTarget.value.id,
      link: `/seller/products/edit/${warningTarget.value.id}`,
      warningLevel: warningTarget.value.warningLevel
    });
    
    closeWarningModal();
    showStatus('success', `Warning sent to ${getSellerName(warningTarget.value.sellerId)} successfully!`);
    
  } catch (error) {
    console.error('Error sending warning:', error);
    showStatus('error', 'Failed to send warning. Please try again.');
  }
};

const closeWarningModal = () => {
  showWarningModal.value = false;
  warningTarget.value = null;
  warningMessage.value = '';
};

const showStatus = (type, text) => {
  statusMessage.value = { type, text };
  setTimeout(() => {
    statusMessage.value = null;
  }, 3000);
};

const renderProductChart = () => {
  if (!productHistoryChart.value || !selectedProduct.value) return;

  if (productChartInstance.value) {
    productChartInstance.value.destroy();
  }

  const ctx = productHistoryChart.value.getContext('2d');

  // Generate sample price history data
  const today = new Date();
  const labels = [];
  const datasets = [];

  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }

  // Create datasets for each unit
  const colors = ['#2e5c31', '#059669', '#0284c7', '#7c3aed', '#dc2626'];

  selectedProduct.value.units.forEach((unit, index) => {
    const prices = [];
    const basePrice = unit.price;
    
    // Generate fluctuating prices around the current price
    for (let i = 0; i < 31; i++) {
      const fluctuation = (Math.random() * 0.2) - 0.1; // -10% to +10%
      prices.push(basePrice * (1 + fluctuation));
    }
    
    datasets.push({
      label: unit.type,
      data: prices,
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length] + '20',
      tension: 0.3,
      fill: false
    });
    
    // Add D.A. reference lines if available
    if (unit.daReference) {
      datasets.push({
        label: `${unit.type} D.A. Max`,
        data: new Array(31).fill(unit.daReference.maxPrice),
        borderColor: '#ef4444',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0,
        fill: false,
        pointRadius: 0
      });
    }
  });

  productChartInstance.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        title: { 
          display: true, 
          text: `Price History - ${selectedProduct.value.productName}` 
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: { 
          beginAtZero: false,
          title: { display: true, text: 'Price (₱)' }
        }
      }
    }
  });
};

// Event handlers for OverpricedProducts component
const handleSendWarning = (product) => {
  sendWarning(product);
};

const handleViewSeller = (product) => {
  // Navigate to seller profile or show seller details
  console.log('View seller:', getSellerName(product.sellerId));
};

const handleProductDeactivated = (productId) => {
  // Refresh data when a product is deactivated
  refreshData();
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.dashboard-container {
  display: flex;
  min-height: 100vh;
  background-color: #f9fafb;
}

.main-content {
  flex: 1;
  padding: 20px;
  margin-left: 250px;
  overflow-y: auto;
}

/* Header - matching AdminForecasting style */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px 0;
}

.page-title p {
  font-size: 0.95rem;
  color: #6b7280;
  margin: 0;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

/* View Buttons - Dark Green Style */
.view-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #1f4e23;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0.7;
}

.view-btn:hover {
  background-color: #2e5c31;
  opacity: 0.9;
}

.view-btn.active {
  background-color: #2e5c31;
  opacity: 1;
  box-shadow: 0 2px 4px rgba(46, 92, 49, 0.3);
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: #059669;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background-color: #047857;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 24px;
}

.summary-card {
  background: white;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.card-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #2e5c31;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.card-content h3 {
  font-size: 14px;
  color: #666;
  margin: 0 0 5px 0;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.trend-icon {
  color: inherit;
}

.card-period {
  font-size: 12px;
  color: #888;
}

.text-danger { color: #ef4444; }
.text-warning { color: #f59e0b; }
.text-success { color: #10b981; }
.text-info { color: #3b82f6; }

/* Filters Section */
.filters-section {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.filter-group {
  flex: 1;
  min-width: 150px;
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

.reset-btn {
  background: #f0f0f0;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  font-weight: 500;
  align-self: flex-end;
  margin-top: 21px;
}

/* Chart Section */
.chart-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
}

.section-header h2 {
  color: #2e5c31;
  margin: 0;
  font-size: 18px;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.chart-view-controls {
  display: flex;
  gap: 10px;
}

.chart-view-btn {
  background: #f0f0f0;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  font-size: 14px;
  transition: all 0.2s;
}

.chart-view-btn.active {
  background: #2e5c31;
  color: white;
}

.chart-filters {
  display: flex;
  gap: 10px;
}

.chart-filters select {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f9f9f9;
  font-size: 14px;
}

.export-controls {
  display: flex;
  gap: 8px;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #059669;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.export-btn:hover:not(:disabled) {
  background: #047857;
}

.export-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.chart-container {
  height: 300px;
}

/* Table Section */
.table-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.search-container {
  position: relative;
  width: 200px;
  max-width: 70%;
}

.search-container input {
  width: 70%;
  padding: 8px 12px 8px 35px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f9f9f9;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.table-container {
  overflow-x: auto;
  margin-bottom: 15px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 8px;
  text-align: left;
  border-bottom: 1px solid #eee;
  vertical-align: top;
}

th {
  background: #f5f5f5;
  color: #2e5c31;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
}

tr:hover {
  background: #f9f9f9;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.product-image {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  background-size: cover;
  background-position: center;
  background-color: #f0f0f0;
  flex-shrink: 0;
}

.product-info {
  flex: 1;
}

.product-name {
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

.product-meta {
  display: flex;
  gap: 5px;
  margin-top: 2px;
}

.variety-badge,
.custom-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
}

.variety-badge {
  background: #a78bfa;
  color: #5b21b6;
}

.custom-badge {
  background: #fbbf24;
  color: #92400e;
}

/* Add these new styles for the status badges */
.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
  display: inline-block;
}

.status-badge.overpriced {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.within-range {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.underpriced {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.no-reference {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.unknown {
  background: #f3f4f6;
  color: #6b7280;
}

/* Update the deviation value style */
.deviation-value {
  font-weight: 600;
  font-size: 0.875rem;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
}

.deviation-value.text-danger {
  background: #fef2f2;
  color: #ef4444;
}

.deviation-value.text-warning {
  background: #fffbeb;
  color: #f59e0b;
}

.deviation-value.text-success {
  background: #ecfdf5;
  color: #10b981;
}

.deviation-value.text-info {
  background: #eff6ff;
  color: #3b82f6;
}

.no-ref {
  color: #999;
  font-size: 0.75rem;
  font-style: italic;
}

.no-da {
  color: #f59e0b;
  font-style: italic;
  font-size: 0.75rem;
}
/* Add this to style DA price values */
.da-price {
  color: #2e5c31;
  font-weight: 500;
}
/* Action Buttons Container */
.action-buttons-container {
  display: flex;
  gap: 8px;
  min-width: 100px;
  justify-content: center;
  padding: 5px 0;
}

/* Base Icon Button */
.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;
}

/* View Button */
.icon-btn.view-btn {
  color: #3b82f6;
}

.icon-btn.view-btn:hover {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #1d4ed8;
}

/* Export Button */
.icon-btn.export-btn {
  color: #059669;
}

.icon-btn.export-btn:hover {
  background: #ecfdf5;
  border-color: #059669;
  color: #047857;
}

/* Ensure icons are visible */
.icon-btn svg {
  width: 16px !important;
  height: 16px !important;
  stroke-width: 2;
}

/* Pagination */
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

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.spinner-container .spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #2e5c31;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

/* Status Messages */
.status-message {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 16px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.status-message.success {
  background-color: #d1fae5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.status-message.error {
  background-color: #fee2e2;
  color: #dc2626;
  border: 1px solid #fca5a5;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.large-modal {
  max-width: 900px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  color: #2e5c31;
  font-size: 1.25rem;
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

/* Product Analysis Modal */
.product-analysis {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.product-overview {
  display: flex;
  gap: 20px;
}

.product-image-large {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  background-size: cover;
  background-position: center;
  background-color: #f0f0f0;
  flex-shrink: 0;
}

.product-details {
  flex: 1;
}

.product-details h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.5rem;
}

.product-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.meta-item {
  display: flex;
  flex-direction: column;
}

.meta-label {
  font-size: 0.875rem;
  color: #666;
}

.meta-value {
  font-weight: 500;
  color: #333;
}

.units-analysis h4,
.price-history h4 {
  margin: 0 0 15px 0;
  color: #2e5c31;
}

.units-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.unit-analysis-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #f9fafb;
}

.unit-analysis-card.overpriced {
  border-color: #ef4444;
  background: #fef2f2;
}

.unit-analysis-card.within-range {
  border-color: #10b981;
  background: #ecfdf5;
}

.unit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.unit-header h5 {
  margin: 0;
  color: #111827;
  font-size: 1rem;
}

.unit-status {
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.pricing-details {
  margin-top: 12px;
}

.price-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 0.875rem;
}

.price-label {
  color: #6b7280;
}

.price-value {
  font-weight: 500;
}

.price-value.seller {
  color: #111827;
}

.price-value.da {
  color: #059669;
}

.price-history {
  height: 250px;
}

/* Warning Modal */
.warning-details {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.product-summary {
  background: #f9fafb;
  padding: 15px;
  border-radius: 8px;
}

.product-summary h3 {
  margin: 0 0 10px 0;
  color: #2e5c31;
}

.overpriced-units-summary h4 {
  color: #111827;
  font-size: 1rem;
  margin: 12px 0 8px 0;
}

.unit-warning-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
}

.unit-warning-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.excess-badge {
  background: #ef4444;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.unit-warning-details {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #6b7280;
}

.unit-warning-details .excess {
  color: #ef4444;
  font-weight: 600;
}

.warning-message label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.warning-message textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
}

.warning-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.warning-options label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.btn-secondary,
.btn-warning {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-warning {
  background: #ef4444;
  color: white;
}

.btn-warning:hover {
  background: #dc2626;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .units-grid {
    grid-template-columns: 1fr;
  }

  .chart-controls {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding: 15px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .summary-cards {
    grid-template-columns: 1fr;
  }

  .filters-section {
    flex-direction: column;
  }

  .filter-group {
    width: 100%;
  }

  .product-overview {
    flex-direction: column;
  }

  .product-image-large {
    width: 100%;
    height: 200px;
  }

  .product-meta-grid {
    grid-template-columns: 1fr;
  }

  .chart-controls {
    gap: 10px;
  }

  .chart-view-controls {
    flex-wrap: wrap;
  }

  .export-controls {
    flex-wrap: wrap;
  }
}

@media (max-width: 576px) {
  .search-container {
    width: 100%;
  }

  .table-container {
    font-size: 0.8rem;
  }

  td {
    padding: 12px 8px !important;
  }
}

/* Export Dropdown Styles */
.export-dropdown {
  position: relative;
  display: inline-block;
}

.export-dropdown-btn,
.table-export-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #059669;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.export-dropdown-btn:hover:not(:disabled),
.table-export-btn:hover:not(:disabled) {
  background: #047857;
}

.export-dropdown-btn:disabled,
.table-export-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.export-dropdown-menu,
.table-export-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 100;
  min-width: 160px;
  margin-top: 2px;
}

.export-dropdown-item,
.table-export-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
  transition: background-color 0.2s;
}

.export-dropdown-item:hover:not(:disabled),
.table-export-dropdown-item:hover:not(:disabled) {
  background: #f3f4f6;
}

.export-dropdown-item:disabled,
.table-export-dropdown-item:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.export-dropdown-item:first-child,
.table-export-dropdown-item:first-child {
  border-radius: 6px 6px 0 0;
}

.export-dropdown-item:last-child,
.table-export-dropdown-item:last-child {
  border-radius: 0 0 6px 6px;
}

/* Table Export Dropdown */
.table-export-dropdown {
  position: relative;
  display: inline-block;
}

.table-export-dropdown-menu {
  right: 0;
}

/* Update header-actions to accommodate the new export button */
.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .header-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .search-container {
    width: 100%;
  }
  
  .table-export-dropdown {
    align-self: flex-end;
  }
}
</style>