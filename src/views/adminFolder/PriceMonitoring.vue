<template>
  <div class="admin-layout" :class="{ 'dark-mode': isDarkMode }">
    <AdminSidebar />
    
    <div class="content-wrapper">
      <div class="header">
        <h1>Price Monitoring</h1>
        <div class="header-actions">
          <button class="view-toggle-btn" :class="{ active: currentView === 'monitoring' }" @click="setView('monitoring')">
            <i class="fas fa-chart-line"></i> Price Monitoring
          </button>
          <button class="view-toggle-btn" :class="{ active: currentView === 'overpriced' }" @click="setView('overpriced')">
            <i class="fas fa-exclamation-triangle"></i> Overpriced Products ({{ overpricedProducts.length }})
          </button>
          <button class="refresh-btn" @click="refreshData" title="Refresh Data">
            <i class="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-icon">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="card-content">
            <h3>Average Price Deviation</h3>
            <div class="card-value" :class="avgDeviationClass">
              {{ avgDeviation }}
              <i :class="avgDeviationIconClass"></i>
            </div>
            <div class="card-period">From D.A. reference prices</div>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="card-icon">
            <i class="fas fa-tags"></i>
          </div>
          <div class="card-content">
            <h3>Products Monitored</h3>
            <div class="card-value">{{ monitoredProducts.length }}</div>
            <div class="card-period">{{ customProducts.length }} custom products</div>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="card-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="card-content">
            <h3>Overpriced Products</h3>
            <div class="card-value text-warning">{{ overpricedProducts.length }}</div>
            <div class="card-period">{{ severeOverpriced.length }} severe cases</div>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="card-icon">
            <i class="fas fa-store"></i>
          </div>
          <div class="card-content">
            <h3>Sellers</h3>
            <div class="card-value">{{ sellersCount }}</div>
            <div class="card-period">{{ flaggedSellers.length }} flagged</div>
          </div>
        </div>
      </div>

      <!-- Price Monitoring View -->
      <div v-if="currentView === 'monitoring'">
        <!-- Filters Section -->
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

        <!-- Price Trend Chart -->
        <div class="chart-section">
          <div class="section-header">
            <h2>Price Deviation Analysis</h2>
            <div class="chart-controls">
              <button 
                v-for="view in chartViews" 
                :key="view.value" 
                :class="{ active: currentChartView === view.value }"
                @click="setChartView(view.value)">
                {{ view.label }}
              </button>
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
              <button class="refresh-btn" @click="refreshData" title="Refresh Data">
                <i class="fas fa-sync-alt"></i> Refresh
              </button>
              <div class="search-container">
                <input 
                  type="text" 
                  v-model="searchQuery" 
                  placeholder="Search products..." 
                  @input="applyFilters"
                />
                <i class="fas fa-search"></i>
              </div>
            </div>
          </div>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th @click="sortTable('productName')">
                    Product Name
                    <i class="fas fa-sort"></i>
                  </th>
                  <th @click="sortTable('category')">
                    Category
                    <i class="fas fa-sort"></i>
                  </th>
                  <th @click="sortTable('sellerName')">
                    Seller
                    <i class="fas fa-sort"></i>
                  </th>
                  <th @click="sortTable('price')">
                    Seller Price
                    <i class="fas fa-sort"></i>
                  </th>
                  <th>D.A. Reference</th>
                  <th @click="sortTable('deviation')">
                    Deviation
                    <i class="fas fa-sort"></i>
                  </th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="product in filteredProducts" :key="product.id">
                  <td>
                    <div class="product-cell">
                      <div class="product-image" :style="{ backgroundImage: `url(${getImageUrl(product.image)})` }"></div>
                      <div class="product-info">
                        <span class="product-name">{{ product.productName }}</span>
                        <div class="product-meta">
                          <span class="unit-badge">{{ getDisplayUnit(product) }}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{{ product.category }}</td>
                  <td>{{ getSellerName(product.sellerId) }}</td>
                  <td>
                    <div class="price-display">
                      <span class="current-price">₱{{ formatPrice(product.currentPrice) }}</span>
                      <small class="price-unit">{{ getDisplayUnit(product) }}</small>
                    </div>
                  </td>
                  <td>
                    <div v-if="product.daReference" class="reference-price">
                      <span class="reference-range">₱{{ product.daReference.minPrice }}-{{ product.daReference.maxPrice }}</span>
                      <small class="reference-unit">{{ product.daReference.unit }}</small>
                    </div>
                    <span v-else class="no-reference">No Reference</span>
                  </td>
                  <td>
                    <div v-if="product.deviation !== null" class="deviation-display" :class="getDeviationClass(product.deviation)">
                      {{ formatDeviation(product.deviation) }}
                    </div>
                    <span v-else class="no-deviation">N/A</span>
                  </td>
                  <td>
                    <div class="status-indicator" :class="getPriceStatusClass(product.priceStatus)">
                      {{ getPriceStatusText(product.priceStatus) }}
                    </div>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button class="action-btn view-btn" @click="viewProductDetails(product)" title="View Details">
                        <i class="fas fa-eye"></i>
                      </button>
                      <button class="action-btn alert-btn" @click="togglePriceAlert(product)" title="Toggle Alert">
                        <i :class="product.hasAlert ? 'fas fa-bell' : 'far fa-bell'"></i>
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
        </div>
      </div>

      <!-- Overpriced Products View -->
      <OverpricedProducts 
        v-if="currentView === 'overpriced'" 
        :overpriced-products="overpricedProducts"
        :is-dark-mode="isDarkMode"
        @send-warning="sendWarning"
        @view-seller="viewSellerProfile"
        @send-custom-message="sendCustomMessage"
      />
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
            <button class="secondary-btn" @click="closeWarningModal">Cancel</button>
            <button class="primary-btn" @click="confirmSendWarning" :disabled="!warningMessage.trim()">
              <i class="fas fa-paper-plane"></i> Send Warning
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Details Modal -->
    <div v-if="showProductModal" class="modal-overlay" @click="closeProductModal">
      <div class="modal-content large-modal" @click.stop>
        <div class="modal-header">
          <h2>Product Price Analysis</h2>
          <button class="close-btn" @click="closeProductModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body" v-if="selectedProduct">
          <div class="product-analysis">
            <div class="product-details">
              <div class="product-image-large" :style="{ backgroundImage: `url(${getImageUrl(selectedProduct.image)})` }"></div>
              <div class="product-info">
                <h3>{{ selectedProduct.productName }}</h3>
                <div class="product-meta">
                  <div class="meta-item">
                    <span class="meta-label">Category:</span>
                    <span class="meta-value">{{ selectedProduct.category }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Seller:</span>
                    <span class="meta-value">{{ getSellerName(selectedProduct.sellerId) }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Current Price:</span>
                    <span class="meta-value">₱{{ formatPrice(selectedProduct.currentPrice) }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Price Status:</span>
                    <span class="meta-value" :class="getPriceStatusClass(selectedProduct.priceStatus)">
                      {{ getPriceStatusText(selectedProduct.priceStatus) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-if="selectedProduct.daReference" class="reference-comparison">
              <h4>D.A. Reference Comparison</h4>
              <div class="comparison-grid">
                <div class="comparison-item">
                  <span class="comparison-label">D.A. Min Price:</span>
                  <span class="comparison-value">₱{{ selectedProduct.daReference.minPrice }}</span>
                </div>
                <div class="comparison-item">
                  <span class="comparison-label">D.A. Max Price:</span>
                  <span class="comparison-value">₱{{ selectedProduct.daReference.maxPrice }}</span>
                </div>
                <div class="comparison-item">
                  <span class="comparison-label">Seller Price:</span>
                  <span class="comparison-value" :class="getPriceComparisonClass(selectedProduct)">₱{{ formatPrice(selectedProduct.currentPrice) }}</span>
                </div>
                <div class="comparison-item">
                  <span class="comparison-label">Deviation:</span>
                  <span class="comparison-value" :class="getDeviationClass(selectedProduct.deviation)">{{ formatDeviation(selectedProduct.deviation) }}</span>
                </div>
              </div>
            </div>
            
            <div class="price-history-chart">
              <h4>Price History</h4>
              <canvas ref="productHistoryChart"></canvas>
            </div>
            
            <div class="price-statistics">
              <div class="stat-card">
                <h4>Current Stock</h4>
                <div class="stat-value">{{ selectedProduct.stock || 'N/A' }}</div>
              </div>
              <div class="stat-card">
                <h4>Units Available</h4>
                <div class="stat-value">{{ selectedProduct.availableUnits?.length || 0 }}</div>
              </div>
              <div class="stat-card">
                <h4>Warning Count</h4>
                <div class="stat-value">{{ selectedProduct.warningCount || 0 }}</div>
              </div>
              <div class="stat-card">
                <h4>Last Updated</h4>
                <div class="stat-value">{{ formatDate(selectedProduct.updatedAt) }}</div>
              </div>
            </div>
          </div>
          
          <div class="modal-actions">
            <button class="secondary-btn" @click="exportProductReport(selectedProduct)">
              <i class="fas fa-download"></i> Export Report
            </button>
            <button v-if="selectedProduct.priceStatus === 'overpriced'" class="warning-btn" @click="sendWarningFromModal(selectedProduct)">
              <i class="fas fa-exclamation-triangle"></i> Send Warning
            </button>
            <button class="primary-btn" @click="setupPriceAlert(selectedProduct)">
              <i class="fas fa-bell"></i> Set Price Alert
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue';
import Chart from 'chart.js/auto';
import AdminSidebar from '@/components/AdminSidebar.vue';
import OverpricedProducts from '@/components/OverpricedProducts.vue';
import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs, query, where, orderBy, limit, Timestamp, doc, getDoc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";

export default {
  components: {
    AdminSidebar,
    OverpricedProducts
  },
  setup() {
    const isDarkMode = ref(false);
    const priceChart = ref(null);
    const productHistoryChart = ref(null);
    const chartInstance = ref(null);
    const productChartInstance = ref(null);
    
    // View state
    const currentView = ref('monitoring');
    
    // Data collections
    const products = ref([]);
    const daProducts = ref([]);
    const sellers = ref([]);
    const alerts = ref([]);
    const monitoredProducts = ref([]);
    const overpricedProducts = ref([]);
    const customProducts = ref([]);
    
    // Summary data
    const avgDeviation = ref('0.0%');
    const sellersCount = ref(0);
    const flaggedSellers = ref([]);
    const severeOverpriced = ref([]);
    
    // Filters
    const selectedCategory = ref('');
    const selectedProductType = ref('');
    const selectedPriceStatus = ref('');
    const sortBy = ref('productName');
    const searchQuery = ref('');
    
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
    
    // Categories
    const categories = ref([]);

    // Unit conversion mapping
    const unitConversions = {
      'per kg': 1,
      'per sack': 50, // Assuming 1 sack = 50kg
      'per tali': 1,
      'per kaing': 12, // Assuming 1 kaing = 12kg
      'per bundle': 1,
      'per tray': 1,
      'per piece': 1
    };

    // Fetch data from Firebase
    const fetchData = async () => {
      try {
        console.log('Starting data fetch...');
        
        // Fetch D.A. reference products from productPrices collection
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
        
        console.log('D.A. products fetched:', daProductsData.length);
        console.log('Sample D.A. products:', daProductsData.slice(0, 3).map(p => ({
          name: p.productName,
          category: p.category,
          variety: p.variety,
          units: Object.keys(p.unitPricing || {})
        })));
        daProducts.value = daProductsData;
        
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
        
        console.log('Products fetched:', productsData.length);
        console.log('Sample seller products:', productsData.slice(0, 3).map(p => ({
          name: p.productName,
          category: p.category,
          variety: p.variety,
          prices: {
            pricePerKilo: p.pricePerKilo,
            pricePerSack: p.pricePerSack,
            pricePerTali: p.pricePerTali
          }
        })));
        products.value = productsData;
        categories.value = Array.from(uniqueCategories);
        console.log('Categories:', categories.value);
        
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
        
        console.log('Sellers fetched:', sellersData.length);
        sellers.value = sellersData;
        
        // Process and analyze products
        console.log('Starting product analysis...');
        await processProductAnalysis();
        
        // Generate alerts
        generatePriceAlerts();
        
        // Render chart
        setTimeout(() => {
          renderChart();
        }, 100);
        
        console.log('Data fetch complete!');
        
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    // Add a refresh function
    const refreshData = async () => {
      console.log('Refreshing data...');
      await fetchData();
    };

    // Process product analysis
    const processProductAnalysis = async () => {
      const analyzed = [];
      const overpriced = [];
      const custom = [];
      
      console.log('Processing product analysis...');
      console.log('Total products:', products.value.length);
      console.log('Total D.A. products:', daProducts.value.length);
      
      for (const product of products.value) {
        // Skip inactive products
        if (product.status === 'inactive') continue;
        
        // Debug specific product
        if (product.productName.toLowerCase().includes('onion')) {
          console.log(`\n🧅 DEBUGGING ONION PRODUCT:`);
          console.log(`Product details:`, {
            id: product.id,
            productName: product.productName,
            category: product.category,
            variety: product.variety,
            status: product.status,
            pricePerKilo: product.pricePerKilo,
            pricePerSack: product.pricePerSack,
            sellerId: product.sellerId
          });
        }
        
        const sellerName = getSellerName(product.sellerId);
        
        // Find matching D.A. reference product
        const daReference = findDAReference(product);
        
        // Calculate current price (get the first available unit price)
        const currentPrice = getCurrentPrice(product);
        
        if (!currentPrice) {
          console.log(`❌ No current price found for product: ${product.productName}`);
          if (product.productName.toLowerCase().includes('onion')) {
            console.log(`🧅 ONION DEBUG - Available price fields:`, Object.keys(product).filter(key => key.includes('price')));
          }
          continue;
        }
        
        const analyzedProduct = {
          ...product,
          sellerName,
          currentPrice,
          daReference,
          isCustomProduct: !daReference,
          deviation: null,
          priceStatus: 'no-reference',
          excessAmount: 0,
          warningLevel: 'none',
          warningCount: 0,
          lastWarning: null
        };
        
        if (daReference) {
          // Calculate price deviation
          const { deviation, status, excess } = calculatePriceDeviation(currentPrice, daReference, product);
          analyzedProduct.deviation = deviation;
          analyzedProduct.priceStatus = status;
          analyzedProduct.excessAmount = excess;
          
          console.log(`✓ Product: ${product.productName}`);
          console.log(`  - Seller Price: ₱${currentPrice.price} ${currentPrice.unitLabel}`);
          console.log(`  - DA Reference: ₱${daReference.minPrice}-₱${daReference.maxPrice} ${daReference.unit}`);
          console.log(`  - Deviation: ${deviation?.toFixed(2)}%`);
          console.log(`  - Status: ${status}`);
          
          // Determine warning level and add to overpriced if necessary
          if (status === 'overpriced') {
            if (deviation > 50) {
              analyzedProduct.warningLevel = 'severe';
            } else if (deviation > 25) {
              analyzedProduct.warningLevel = 'moderate';
            } else if (deviation > 10) {
              analyzedProduct.warningLevel = 'mild';
            }
            
            // Add to overpriced list
            overpriced.push(analyzedProduct);
          }
        } else {
          // No D.A. reference found - mark as custom product
          custom.push(analyzedProduct);
          
          if (product.productName.toLowerCase().includes('onion')) {
            console.log(`🧅 ONION DEBUG - No D.A. reference found!`);
            console.log(`  - Looking for product: ${product.productName}`);
            console.log(`  - In category: ${product.category}`);
            console.log(`  - With variety: ${product.variety || 'Normal'}`);
            console.log(`  - Total D.A. products available: ${daProducts.value.length}`);
          }
          
          console.log(`✗ No D.A. reference found for: ${product.productName} (Category: ${product.category}, Variety: ${product.variety || 'Normal'})`);
        }
        
        analyzed.push(analyzedProduct);
      }
      
      console.log('Analysis complete:');
      console.log(`- Analyzed products: ${analyzed.length}`);
      console.log(`- Overpriced products: ${overpriced.length}`);
      console.log(`- Custom products: ${custom.length}`);
      
      monitoredProducts.value = analyzed;
      overpricedProducts.value = overpriced;
      customProducts.value = custom;
      
      // Calculate summary statistics
      calculateSummaryStats();
    };

    // Get seller name using the same logic as OverpricedProducts
    const getSellerName = (sellerId) => {
      // First try to find by sellerId (which might be the userId)
      let seller = sellers.value.find(s => s.sellerId === sellerId);
      
      // If not found, try to find by document ID
      if (!seller) {
        seller = sellers.value.find(s => s.id === sellerId);
      }
      
      if (seller) {
        // Try personalInfo first
        if (seller.personalInfo?.firstName && seller.personalInfo?.lastName) {
          return `${seller.personalInfo.firstName} ${seller.personalInfo.lastName}`;
        }
        
        // Try farmDetails.farmName
        if (seller.farmDetails?.farmName) {
          return seller.farmDetails.farmName;
        }
        
        // Try top-level farmName (in case structure is different)
        if (seller.farmName) {
          return seller.farmName;
        }
        
        // Try email as fallback
        if (seller.personalInfo?.email) {
          return seller.personalInfo.email;
        }
        
        return `Seller ${seller.id}`;
      } else {
        return 'Unknown Seller';
      }
    };

    // Find D.A. reference for a product
    const findDAReference = (product) => {
      console.log(`🔍 Finding D.A. reference for: ${product.productName} (Category: ${product.category}, Variety: ${product.variety || 'Normal'})`);
      
      // Try to find matching D.A. reference product
      let match = daProducts.value.find(da => {
        // Clean and normalize product names for comparison
        const cleanProductName = product.productName.toLowerCase()
          .replace(/[()]/g, '') // Remove parentheses
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        const cleanDAName = da.productName.toLowerCase()
          .replace(/[()]/g, '') // Remove parentheses
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        // Extract base name (before any parentheses or special characters)
        const baseProductName = cleanProductName.split(/[\s(,]/)[0];
        const baseDAName = cleanDAName.split(/[\s(,]/)[0];
        
        // Multiple matching strategies
        const exactMatch = cleanDAName === cleanProductName;
        const baseNameMatch = baseDAName === baseProductName && baseProductName.length >= 3;
        const containsMatch = cleanDAName.includes(baseProductName) || cleanProductName.includes(baseDAName);
        const baseNameContains = (product.baseProductName || '').toLowerCase() === cleanDAName;
        
        const nameMatch = exactMatch || baseNameMatch || containsMatch || baseNameContains;
        const categoryMatch = da.category === product.category;
        const varietyMatch = !product.variety || product.variety === 'Normal' || 
                           da.variety === product.variety || !da.variety || da.variety === 'Normal';
        
        const isMatch = nameMatch && categoryMatch && varietyMatch;
        
        if (isMatch) {
          console.log(`  ✓ Found potential match: ${da.productName} (Category: ${da.category}, Variety: ${da.variety || 'Normal'})`);
          console.log(`    Match type: ${exactMatch ? 'exact' : baseNameMatch ? 'base name' : containsMatch ? 'contains' : 'base product name'}`);
        }
        
        return isMatch;
      });
      
      if (!match) {
        console.log(`  ✗ No exact match found. Available D.A. products in category "${product.category}":`);
        const sameCategory = daProducts.value.filter(da => da.category === product.category);
        sameCategory.forEach(da => {
          console.log(`    - ${da.productName} (Variety: ${da.variety || 'Normal'})`);
        });
        
        // Also show all D.A. products if no category match
        if (sameCategory.length === 0) {
          console.log(`  No products in category "${product.category}". All D.A. products:`);
          daProducts.value.forEach(da => {
            console.log(`    - ${da.productName} (Category: ${da.category}, Variety: ${da.variety || 'Normal'})`);
          });
        }
        
        return null;
      }
      
      if (match && match.unitPricing) {
        console.log(`  📊 Processing unit pricing for ${match.productName}...`);
        console.log(`  Available units:`, Object.keys(match.unitPricing));
        
        // Find the best matching unit for the current product
        const currentPrice = getCurrentPrice(product);
        if (currentPrice) {
          console.log(`  💰 Current product price: ₱${currentPrice.price} ${currentPrice.unitLabel}`);
          
          // Try to find exact unit match in D.A. data
          const currentUnitLabel = currentPrice.unitLabel.toLowerCase();
          
          // Check all available units in D.A. reference
          for (const [daUnit, pricing] of Object.entries(match.unitPricing)) {
            if (pricing && typeof pricing === 'object' && 
                pricing.minPrice !== undefined && pricing.maxPrice !== undefined) {
              
              // Normalize unit names for comparison
              const normalizedDAUnit = daUnit.toLowerCase();
              const normalizedCurrentUnit = currentUnitLabel.replace('per ', '');
              
              console.log(`    Comparing: "${normalizedCurrentUnit}" vs D.A. unit "${normalizedDAUnit}"`);
              
              // Direct match or close match
              if (normalizedDAUnit.includes(normalizedCurrentUnit) || 
                  normalizedCurrentUnit.includes(normalizedDAUnit.replace('per ', '')) ||
                  normalizedDAUnit === currentUnitLabel) {
                
                console.log(`    ✓ Unit match found! Using ${daUnit}: ₱${pricing.minPrice}-₱${pricing.maxPrice}`);
                
                return {
                  ...match,
                  unit: daUnit,
                  minPrice: pricing.minPrice,
                  maxPrice: pricing.maxPrice,
                  unitPricing: match.unitPricing
                };
              }
            }
          }
          
          // If no exact match, use the first available unit
          console.log(`    ⚠️ No exact unit match, using first available unit...`);
          const firstUnit = Object.entries(match.unitPricing).find(([unit, pricing]) => 
            pricing && typeof pricing === 'object' && 
            pricing.minPrice !== undefined && pricing.maxPrice !== undefined
          );
          
          if (firstUnit) {
            const [unit, pricing] = firstUnit;
            console.log(`    📌 Using fallback unit ${unit}: ₱${pricing.minPrice}-₱${pricing.maxPrice}`);
            return {
              ...match,
              unit: unit,
              minPrice: pricing.minPrice,
              maxPrice: pricing.maxPrice,
              unitPricing: match.unitPricing
            };
          } else {
            console.log(`    ❌ No valid pricing units found in D.A. reference`);
          }
        } else {
          console.log(`    ❌ No current price found for product`);
        }
      } else if (match) {
        console.log(`  ⚠️ Match found but no unitPricing data available`);
      }
      
      return null;
    };

    // Get current price from product (first available unit)
    const getCurrentPrice = (product) => {
      const units = ['pricePerKilo', 'pricePerSack', 'pricePerTali', 'pricePerKaing', 'pricePerBundle', 'pricePerTray', 'pricePerPiece'];
      
      console.log(`  💰 Getting current price for ${product.productName}...`);
      
      for (const unit of units) {
        if (product[unit] && product[unit] > 0) {
          const priceInfo = {
            price: product[unit],
            unit: unit,
            unitLabel: getUnitLabel(unit)
          };
          console.log(`    ✓ Found price: ₱${priceInfo.price} ${priceInfo.unitLabel} (${unit})`);
          return priceInfo;
        }
      }
      
      console.log(`    ❌ No price found for ${product.productName}. Available fields:`, Object.keys(product).filter(key => key.includes('price')));
      return null;
    };

    // Calculate price deviation
    const calculatePriceDeviation = (currentPrice, daReference, product) => {
      if (!daReference || !currentPrice) {
        return { deviation: null, status: 'no-reference', excess: 0 };
      }
      
      // Ensure D.A. reference has valid price data
      if (!daReference.minPrice || !daReference.maxPrice || 
          daReference.minPrice <= 0 || daReference.maxPrice <= 0) {
        console.log(`    ⚠️ Invalid D.A. reference prices for ${product.productName}`);
        return { deviation: null, status: 'no-reference', excess: 0 };
      }
      
      const sellerPrice = currentPrice.price;
      const daMin = daReference.minPrice;
      const daMax = daReference.maxPrice;
      
      console.log(`    📊 Calculating deviation: Seller=₱${sellerPrice}, DA=₱${daMin}-₱${daMax}`);
      
      let deviation = 0;
      let status = 'within-range';
      let excess = 0;
      
      if (sellerPrice > daMax) {
        // Overpriced
        deviation = ((sellerPrice - daMax) / daMax) * 100;
        status = 'overpriced';
        excess = sellerPrice - daMax;
        console.log(`    🔴 OVERPRICED by ${deviation.toFixed(1)}% (₱${excess.toFixed(2)} excess)`);
      } else if (sellerPrice < daMin) {
        // Underpriced  
        deviation = ((daMin - sellerPrice) / daMin) * 100 * -1; // Negative for underpriced
        status = 'underpriced';
        excess = 0;
        console.log(`    🔵 UNDERPRICED by ${Math.abs(deviation).toFixed(1)}%`);
      } else {
        // Within range
        const midPoint = (daMin + daMax) / 2;
        deviation = ((sellerPrice - midPoint) / midPoint) * 100;
        status = 'within-range';
        excess = 0;
        console.log(`    🟢 WITHIN RANGE (${deviation.toFixed(1)}% from midpoint)`);
      }
      
      return { deviation, status, excess };
    };

    // Convert prices for comparison
    const convertPricesForComparison = (currentPrice, daReference, product) => {
      let convertedPrice = currentPrice.price;
      let convertedMin = daReference.minPrice;
      let convertedMax = daReference.maxPrice;
      
      // Get unit conversion factors
      const currentUnit = currentPrice.unit;
      const daUnit = daReference.unit;
      
      // If units are different, try to convert
      if (currentUnit !== daUnit) {
        const currentFactor = getUnitConversionFactor(currentUnit, product);
        const daFactor = getUnitConversionFactor(daUnit, product);
        
        if (currentFactor && daFactor) {
          // Convert to per kg equivalent
          const currentPerKg = convertedPrice / currentFactor;
          const daMinPerKg = convertedMin / daFactor;
          const daMaxPerKg = convertedMax / daFactor;
          
          convertedPrice = currentPerKg;
          convertedMin = daMinPerKg;
          convertedMax = daMaxPerKg;
        }
      }
      
      return { convertedPrice, convertedMin, convertedMax };
    };

    // Get unit conversion factor
    const getUnitConversionFactor = (unit, product) => {
      const unitMap = {
        'pricePerKilo': 1,
        'pricePerSack': product.sackWeight || 50,
        'pricePerTali': 1,
        'pricePerKaing': product.kaingWeight || 12,
        'pricePerBundle': product.bundleWeight || 1,
        'pricePerTray': 1,
        'pricePerPiece': 1
      };
      
      return unitMap[unit] || 1;
    };

    // Get unit label
    const getUnitLabel = (unit) => {
      const labels = {
        'pricePerKilo': 'per kg',
        'pricePerSack': 'per sack',
        'pricePerTali': 'per tali',
        'pricePerKaing': 'per kaing',
        'pricePerBundle': 'per bundle',
        'pricePerTray': 'per tray',
        'pricePerPiece': 'per piece'
      };
      
      return labels[unit] || unit;
    };

    // Calculate summary statistics
    const calculateSummaryStats = () => {
      const productsWithDeviation = monitoredProducts.value.filter(p => p.deviation !== null);
      
      if (productsWithDeviation.length > 0) {
        const totalDeviation = productsWithDeviation.reduce((sum, p) => sum + Math.abs(p.deviation), 0);
        const avgDev = totalDeviation / productsWithDeviation.length;
        avgDeviation.value = `${avgDev.toFixed(1)}%`;
      }
      
      sellersCount.value = sellers.value.length;
      
      // Find flagged sellers (sellers with multiple overpriced products)
      const sellerOverpriceCount = {};
      overpricedProducts.value.forEach(product => {
        sellerOverpriceCount[product.sellerId] = (sellerOverpriceCount[product.sellerId] || 0) + 1;
      });
      
      flaggedSellers.value = Object.keys(sellerOverpriceCount).filter(sellerId => 
        sellerOverpriceCount[sellerId] >= 3
      );
      
      severeOverpriced.value = overpricedProducts.value.filter(p => p.warningLevel === 'severe');
    };

    // Generate price alerts
    const generatePriceAlerts = () => {
      const newAlerts = [];
      
      // Generate alerts for overpriced products
      overpricedProducts.value.slice(0, 5).forEach(product => {
        newAlerts.push({
          productId: product.id,
          productName: product.productName,
          type: 'Price Violation',
          message: `Product is ${formatDeviation(product.deviation)} above D.A. maximum price.`,
          date: new Date().toISOString(),
          severity: product.warningLevel
        });
      });
      
      // Generate alerts for products without reference
      customProducts.value.slice(0, 3).forEach(product => {
        newAlerts.push({
          productId: product.id,
          productName: product.productName,
          type: 'No Reference',
          message: `Custom product without D.A. price reference.`,
          date: new Date().toISOString(),
          severity: 'info'
        });
      });
      
      alerts.value = newAlerts;
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
        result = result.filter(product => product.priceStatus === selectedPriceStatus.value);
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
            return (b.deviation || 0) - (a.deviation || 0);
          case 'price':
            return (b.currentPrice?.price || 0) - (a.currentPrice?.price || 0);
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

    const avgDeviationIconClass = computed(() => {
      const value = parseFloat(avgDeviation.value);
      if (value > 15) return 'fas fa-arrow-up';
      if (value > 5) return 'fas fa-exclamation-triangle';
      return 'fas fa-check-circle';
    });

    // Methods
    const setView = (view) => {
      currentView.value = view;
    };

    const applyFilters = () => {
      currentPage.value = 1;
      renderChart();
    };

    const resetFilters = () => {
      selectedCategory.value = '';
      selectedProductType.value = '';
      selectedPriceStatus.value = '';
      sortBy.value = 'productName';
      searchQuery.value = '';
      currentPage.value = 1;
      renderChart();
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

    // Warning and notification methods
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
      const deviation = formatDeviation(product.deviation);
      const excess = formatPrice(product.excessAmount);
      const sellerName = getSellerName(product.sellerId);
      
      return `Dear ${sellerName},

We have noticed that your product "${product.productName}" is priced at ₱${formatPrice(product.currentPrice.price)} ${product.currentPrice.unitLabel}, which is ${deviation} above the Department of Agriculture's maximum recommended price of ₱${product.daReference.maxPrice} ${product.daReference.unit}.

This represents an excess of ₱${excess} above the recommended maximum price.

We kindly request that you review and adjust your pricing to align with the D.A. guidelines to ensure fair pricing for consumers.

Thank you for your cooperation.

Best regards,
Agricultural Marketplace Administration`;
    };

    const confirmSendWarning = async () => {
      try {
        // In a real app, this would send the warning via email/SMS
        console.log('Sending warning to:', getSellerName(warningTarget.value.sellerId));
        console.log('Message:', warningMessage.value);
        
        // Create notification in Firebase for the seller
        const notificationsRef = collection(db, 'notifications');
        await addDoc(notificationsRef, {
          userId: warningTarget.value.sellerId,
          title: 'Price Warning Received',
          message: `Your product "${warningTarget.value.productName}" is priced ${formatDeviation(warningTarget.value.deviation)} above D.A. guidelines. Please review your pricing.`,
          type: 'alert',
          read: false,
          timestamp: serverTimestamp(),
          productId: warningTarget.value.id,
          link: `/seller/products/edit/${warningTarget.value.id}`,
          warningLevel: warningTarget.value.warningLevel,
          excessAmount: warningTarget.value.excessAmount
        });
        
        // Update warning count and last warning date
        const productIndex = overpricedProducts.value.findIndex(p => p.id === warningTarget.value.id);
        if (productIndex !== -1) {
          overpricedProducts.value[productIndex].warningCount = (overpricedProducts.value[productIndex].warningCount || 0) + 1;
          overpricedProducts.value[productIndex].lastWarning = new Date().toISOString();
        }
        
        // Add to alerts
        alerts.value.unshift({
          productId: warningTarget.value.id,
          productName: warningTarget.value.productName,
          type: 'Warning Sent',
          message: `Warning sent to ${getSellerName(warningTarget.value.sellerId)} for overpricing.`,
          date: new Date().toISOString(),
          severity: 'warning'
        });
        
        closeWarningModal();
        
        // Show success message
        alert('Warning sent successfully!');
        
      } catch (error) {
        console.error('Error sending warning:', error);
        alert('Failed to send warning. Please try again.');
      }
    };

    const sendCustomMessage = (product) => {
      // This would open a custom message modal
      alert(`Send custom message to ${getSellerName(product.sellerId)}`);
    };

    const closeWarningModal = () => {
      showWarningModal.value = false;
      warningTarget.value = null;
      warningMessage.value = '';
    };

    // Product details and analysis
    const viewProductDetails = async (product) => {
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

    const viewSellerProfile = (product) => {
      // This would navigate to seller profile
      alert(`View profile for ${getSellerName(product.sellerId)}`);
    };

    // Chart rendering
    const renderChart = () => {
      if (!priceChart.value) return;
      
      if (chartInstance.value) {
        chartInstance.value.destroy();
      }
      
      const ctx = priceChart.value.getContext('2d');
      
      let labels = [];
      let datasets = [];
      
      const primaryColor = isDarkMode.value ? '#6abe6e' : '#2e5c31';
      const dangerColor = '#ef4444';
      const warningColor = '#f59e0b';
      const successColor = '#10b981';
      const textColor = isDarkMode.value ? '#e0e0e0' : '#333';
      
      if (currentChartView.value === 'deviation') {
        // Show price deviation distribution
        const deviationRanges = {
          'Severe (>50%)': 0,
          'Moderate (25-50%)': 0,
          'Mild (10-25%)': 0,
          'Within Range': 0,
          'Below Range': 0
        };
        
        monitoredProducts.value.forEach(product => {
          if (product.deviation === null) return;
          
          if (product.priceStatus === 'overpriced') {
            if (product.deviation > 50) deviationRanges['Severe (>50%)']++;
            else if (product.deviation > 25) deviationRanges['Moderate (25-50%)']++;
            else deviationRanges['Mild (10-25%)']++;
          } else if (product.priceStatus === 'within-range') {
            deviationRanges['Within Range']++;
          } else {
            deviationRanges['Below Range']++;
          }
        });
        
        labels = Object.keys(deviationRanges);
        const data = Object.values(deviationRanges);
        const colors = [dangerColor, warningColor, '#fbbf24', successColor, '#3b82f6'];
        
        datasets.push({
          label: 'Products by Price Deviation',
          data: data,
          backgroundColor: colors.map(color => color + '80'),
          borderColor: colors,
          borderWidth: 1
        });
        
      } else if (currentChartView.value === 'category') {
        // Show average deviation by category
        const categoryDeviations = {};
        const categoryCounts = {};
        
        monitoredProducts.value.forEach(product => {
          if (product.deviation === null) return;
          
          if (!categoryDeviations[product.category]) {
            categoryDeviations[product.category] = 0;
            categoryCounts[product.category] = 0;
          }
          
          categoryDeviations[product.category] += Math.abs(product.deviation);
          categoryCounts[product.category]++;
        });
        
        // Calculate averages
        Object.keys(categoryDeviations).forEach(category => {
          if (categoryCounts[category] > 0) {
            categoryDeviations[category] = categoryDeviations[category] / categoryCounts[category];
          }
        });
        
        labels = Object.keys(categoryDeviations);
        const data = Object.values(categoryDeviations);
        
        datasets.push({
          label: 'Average Price Deviation by Category (%)',
          data: data,
          backgroundColor: labels.map((_, i) => {
            const colors = [primaryColor, warningColor, dangerColor, successColor, '#8b5cf6'];
            return colors[i % colors.length] + '80';
          }),
          borderColor: labels.map((_, i) => {
            const colors = [primaryColor, warningColor, dangerColor, successColor, '#8b5cf6'];
            return colors[i % colors.length];
          }),
          borderWidth: 1
        });
        
      } else if (currentChartView.value === 'warnings') {
        // Show warning levels distribution
        const warningLevels = {
          'Severe': severeOverpriced.value.length,
          'Moderate': overpricedProducts.value.filter(p => p.warningLevel === 'moderate').length,
          'Mild': overpricedProducts.value.filter(p => p.warningLevel === 'mild').length,
          'No Issues': monitoredProducts.value.filter(p => p.priceStatus === 'within-range').length
        };
        
        labels = Object.keys(warningLevels);
        const data = Object.values(warningLevels);
        const colors = [dangerColor, warningColor, '#fbbf24', successColor];
        
        datasets.push({
          label: 'Products by Warning Level',
          data: data,
          backgroundColor: colors.map(color => color + '80'),
          borderColor: colors,
          borderWidth: 1
        });
      }
      
      chartInstance.value = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  if (currentChartView.value === 'category') {
                    return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
                  }
                  return `${context.dataset.label}: ${context.parsed.y}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false,
                color: isDarkMode.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                color: textColor
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: isDarkMode.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                color: textColor,
                callback: function(value) {
                  if (currentChartView.value === 'category') {
                    return `${value.toFixed(1)}%`;
                  }
                  return value;
                }
              }
            }
          }
        }
      });
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
      const prices = [];
      const daMin = [];
      const daMax = [];
      
      for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        labels.push(formatDate(date.toISOString()));
        
        // Generate price fluctuation around current price
        const fluctuation = (Math.random() * 0.3) - 0.15; // -15% to +15%
        const historicalPrice = selectedProduct.value.currentPrice.price * (1 + fluctuation);
        prices.push(historicalPrice);
        
        // Add D.A. reference lines if available
        if (selectedProduct.value.daReference) {
          daMin.push(selectedProduct.value.daReference.minPrice);
          daMax.push(selectedProduct.value.daReference.maxPrice);
        }
      }
      
      const primaryColor = isDarkMode.value ? '#6abe6e' : '#2e5c31';
      const dangerColor = '#ef4444';
      const successColor = '#10b981';
      const textColor = isDarkMode.value ? '#e0e0e0' : '#333';
      
      const datasets = [
        {
          label: 'Seller Price',
          data: prices,
          borderColor: primaryColor,
          backgroundColor: primaryColor + '20',
          tension: 0.3,
          fill: false
        }
      ];
      
      if (selectedProduct.value.daReference) {
        datasets.push({
          label: 'D.A. Max Price',
          data: daMax,
          borderColor: dangerColor,
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0,
          fill: false
        });
        
        datasets.push({
          label: 'D.A. Min Price',
          data: daMin,
          borderColor: successColor,
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0,
          fill: false
        });
      }
      
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
            legend: {
              display: true,
              labels: {
                color: textColor
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: ₱${context.parsed.y.toFixed(2)}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false,
                color: isDarkMode.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                color: textColor,
                maxRotation: 45,
                minRotation: 45
              }
            },
            y: {
              beginAtZero: false,
              grid: {
                color: isDarkMode.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                color: textColor,
                callback: function(value) {
                  return `₱${value.toFixed(2)}`;
                }
              }
            }
          }
        }
      });
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
      return parseFloat(price).toFixed(2);
    };

    const formatDeviation = (deviation) => {
      if (deviation === null || deviation === undefined) return 'N/A';
      return deviation > 0 ? `+${deviation.toFixed(1)}%` : `${deviation.toFixed(1)}%`;
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

    const getDeviationClass = (deviation) => {
      if (deviation === null || deviation === undefined) return '';
      if (Math.abs(deviation) > 50) return 'text-danger';
      if (Math.abs(deviation) > 25) return 'text-warning';
      if (Math.abs(deviation) > 10) return 'text-info';
      return 'text-success';
    };

    const getPriceStatusClass = (status) => {
      switch (status) {
        case 'overpriced':
          return 'status-danger';
        case 'underpriced':
          return 'status-info';
        case 'within-range':
          return 'status-success';
        case 'no-reference':
          return 'status-warning';
        default:
          return '';
      }
    };

    const getPriceStatusText = (status) => {
      switch (status) {
        case 'overpriced':
          return 'Overpriced';
        case 'underpriced':
          return 'Underpriced';
        case 'within-range':
          return 'Within Range';
        case 'no-reference':
          return 'No Reference';
        default:
          return 'Unknown';
      }
    };

    const getPriceComparisonClass = (product) => {
      if (!product.daReference) return '';
      return getPriceStatusClass(product.priceStatus);
    };

    // Additional methods
    const togglePriceAlert = (product) => {
      const index = monitoredProducts.value.findIndex(p => p.id === product.id);
      if (index !== -1) {
        monitoredProducts.value[index].hasAlert = !monitoredProducts.value[index].hasAlert;
        
        if (monitoredProducts.value[index].hasAlert) {
          alerts.value.unshift({
            productId: product.id,
            productName: product.productName,
            type: 'Price Alert Set',
            message: `Price alert activated for ${product.productName}.`,
            date: new Date().toISOString(),
            severity: 'info'
          });
        }
      }
    };

    const exportProductReport = (product) => {
      console.log('Exporting product report for:', product.productName);
      alert(`Product report for ${product.productName} exported successfully!`);
    };

    const setupPriceAlert = (product) => {
      alert(`Setting up price alert for ${product.productName}`);
    };

    // Watch for dark mode changes
    watch(() => isDarkMode.value, () => {
      renderChart();
      if (showProductModal.value) {
        renderProductChart();
      }
    });

    onMounted(() => {
      // Check for dark mode
      isDarkMode.value = document.body.classList.contains('dark');
      
      // Fetch data from Firebase
      fetchData();
    });

    return {
      isDarkMode,
      priceChart,
      productHistoryChart,
      currentView,
      avgDeviation,
      monitoredProducts,
      overpricedProducts,
      customProducts,
      severeOverpriced,
      sellersCount,
      flaggedSellers,
      selectedCategory,
      selectedProductType,
      selectedPriceStatus,
      sortBy,
      searchQuery,
      currentPage,
      totalPages,
      currentChartView,
      chartViews,
      categories,
      filteredProducts,
      alerts,
      showProductModal,
      showWarningModal,
      selectedProduct,
      warningTarget,
      warningMessage,
      includeGuidelines,
      requestResponse,
      avgDeviationClass,
      avgDeviationIconClass,
      setView,
      getImageUrl,
      getDisplayUnit,
      formatPrice,
      formatDeviation,
      formatDate,
      getDeviationClass,
      getPriceStatusClass,
      getPriceStatusText,
      getPriceComparisonClass,
      getSellerName,
      applyFilters,
      resetFilters,
      changePage,
      sortTable,
      setChartView,
      sendWarning,
      sendWarningFromModal,
      confirmSendWarning,
      sendCustomMessage,
      closeWarningModal,
      viewProductDetails,
      closeProductModal,
      viewSellerProfile,
      togglePriceAlert,
      exportProductReport,
      setupPriceAlert,
      refreshData
    };
  }
};
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f9f9f9;
}

.dark-mode {
  background: #222;
  color: #e0e0e0;
}

.content-wrapper {
  flex: 1;
  margin-left: 260px;
  padding: 20px;
  transition: margin-left 0.3s ease;
}

.price-monitoring {
  max-width: 1400px;
  margin: 0 auto;
  background: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.dark-mode .price-monitoring {
  background: #222;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #2e5c31;
  color: white;
  padding: 15px 20px;
  border-radius: 10px 10px 0 0;
  margin-bottom: 20px;
}

.dark-mode .header {
  background: #1a3a1c;
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.view-toggle-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  transition: all 0.2s;
}

.view-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.view-toggle-btn.active {
  background: white;
  color: #2e5c31;
}

.refresh-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: #059669;
}

.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 20px 20px;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.summary-card {
  background: white;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.dark-mode .summary-card {
  background: #333;
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

.dark-mode .card-icon {
  background: #6abe6e;
  color: #222;
}

.card-content h3 {
  font-size: 14px;
  color: #666;
  margin: 0 0 5px 0;
}

.dark-mode .card-content h3 {
  color: #aaa;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.dark-mode .card-value {
  color: #e0e0e0;
}

.card-period {
  font-size: 12px;
  color: #888;
}

.dark-mode .card-period {
  color: #999;
}

.text-danger {
  color: #ef4444;
}

.text-warning {
  color: #f59e0b;
}

.text-success {
  color: #10b981;
}

.text-info {
  color: #3b82f6;
}

/* Filters Section */
.filters-section {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.dark-mode .filters-section {
  background: #333;
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

.dark-mode .filter-group label {
  color: #aaa;
}

.filter-group select,
.filter-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f9f9f9;
}

.dark-mode .filter-group select,
.dark-mode .filter-group input {
  background: #444;
  border-color: #555;
  color: #e0e0e0;
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

.dark-mode .reset-btn {
  background: #444;
  color: #e0e0e0;
}

/* Content Area */
.content-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Chart Section */
.chart-section {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.dark-mode .chart-section {
  background: #333;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h2 {
  color: #2e5c31;
  margin: 0;
  font-size: 18px;
}

.dark-mode .section-header h2 {
  color: #6abe6e;
}

.chart-controls {
  display: flex;
  gap: 10px;
}

.chart-controls button {
  background: #f0f0f0;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  font-size: 14px;
}

.dark-mode .chart-controls button {
  background: #444;
  color: #e0e0e0;
}

.chart-controls button.active {
  background: #2e5c31;
  color: white;
}

.dark-mode .chart-controls button.active {
  background: #6abe6e;
  color: #222;
}

.chart-container {
  height: 300px;
}

/* Table Section */
.table-section {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.dark-mode .table-section {
  background: #333;
}

.search-container {
  position: relative;
  width: 300px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.refresh-btn {
  background: #6abe6e;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background-color 0.2s;
}

.refresh-btn:hover {
  background: #5aa85f;
}

.dark-mode .refresh-btn {
  background: #2e5c31;
}

.dark-mode .refresh-btn:hover {
  background: #1e3f21;
}

.search-container input {
  width: 100%;
  padding: 8px 12px 8px 35px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f9f9f9;
}

.dark-mode .search-container input {
  background: #444;
  border-color: #555;
  color: #e0e0e0;
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
  margin-bottom: 15px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.dark-mode th, 
.dark-mode td {
  border-bottom: 1px solid #444;
}

th {
  background: #f5f5f5;
  color: #2e5c31;
  font-weight: 600;
  cursor: pointer;
}

.dark-mode th {
  background: #444;
  color: #6abe6e;
}

tr:hover {
  background: #f9f9f9;
}

.dark-mode tr:hover {
  background: #3a3a3a;
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

.dark-mode .product-image {
  background-color: #444;
}

.product-info {
  flex: 1;
}

.product-name {
  font-weight: 500;
  color: #333;
}

.dark-mode .product-name {
  color: #e0e0e0;
}

.product-meta {
  display: flex;
  gap: 5px;
  margin-top: 2px;
}

.custom-badge,
.variety-badge,
.unit-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
}

.custom-badge {
  background: #fbbf24;
  color: #92400e;
}

.variety-badge {
  background: #a78bfa;
  color: #5b21b6;
}

.unit-badge {
  background: #e5e7eb;
  color: #374151;
}

.dark-mode .unit-badge {
  background: #4b5563;
  color: #d1d5db;
}

.price-display {
  display: flex;
  flex-direction: column;
}

.current-price {
  font-weight: 600;
  color: #333;
}

.dark-mode .current-price {
  color: #e0e0e0;
}

.price-unit {
  color: #666;
  font-size: 12px;
}

.dark-mode .price-unit {
  color: #999;
}

.reference-price {
  display: flex;
  flex-direction: column;
}

.reference-range {
  font-weight: 500;
  color: #059669;
}

.reference-unit {
  color: #666;
  font-size: 12px;
}

.no-reference {
  color: #999;
  font-style: italic;
}

.deviation-display {
  font-weight: 600;
}

.no-deviation {
  color: #999;
  font-style: italic;
}

.status-indicator {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-success {
  background: #d1fae5;
  color: #065f46;
}

.status-warning {
  background: #fef3c7;
  color: #92400e;
}

.status-danger {
  background: #fee2e2;
  color: #991b1b;
}

.status-info {
  background: #dbeafe;
  color: #1e40af;
}

.dark-mode .status-success {
  background: rgba(5, 95, 70, 0.2);
  color: #6ee7b7;
}

.dark-mode .status-warning {
  background: rgba(146, 64, 14, 0.2);
  color: #fcd34d;
}

.dark-mode .status-danger {
  background: rgba(153, 27, 27, 0.2);
  color: #fca5a5;
}

.dark-mode .status-info {
  background: rgba(30, 64, 175, 0.2);
  color: #93c5fd;
}

.action-buttons {
  display: flex;
  gap: 5px;
}

.action-btn {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  border: none;
  background: #f0f0f0;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dark-mode .action-btn {
  background: #444;
  color: #e0e0e0;
}

.view-btn:hover {
  background: #e3f2fd;
  color: #1976d2;
}

.alert-btn:hover {
  background: #f3e8ff;
  color: #7c3aed;
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

.dark-mode .pagination-btn {
  background: #444;
  color: #e0e0e0;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #666;
  font-size: 14px;
}

.dark-mode .page-info {
  color: #aaa;
}

/* Modal */
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

.large-modal {
  max-width: 900px;
}

.dark-mode .modal-content {
  background: #333;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.dark-mode .modal-header {
  border-bottom: 1px solid #444;
}

.modal-header h2 {
  margin: 0;
  color: #2e5c31;
  font-size: 20px;
}

.dark-mode .modal-header h2 {
  color: #6abe6e;
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

.warning-details {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.product-summary {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
}

.dark-mode .product-summary {
  background: #3a3a3a;
}

.product-summary h3 {
  margin: 0 0 10px 0;
  color: #2e5c31;
}

.dark-mode .product-summary h3 {
  color: #6abe6e;
}

.warning-message label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.dark-mode .warning-message label {
  color: #e0e0e0;
}

.warning-message textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
}

.dark-mode .warning-message textarea {
  background: #444;
  border-color: #555;
  color: #e0e0e0;
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

.product-analysis {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.product-details {
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

.dark-mode .product-image-large {
  background-color: #444;
}

.product-info {
  flex: 1;
}

.product-info h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 24px;
}

.dark-mode .product-info h3 {
  color: #e0e0e0;
}

.product-meta {
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

.dark-mode .meta-label {
  color: #aaa;
}

.meta-value {
  font-weight: 500;
  color: #333;
}

.dark-mode .meta-value {
  color: #e0e0e0;
}

.reference-comparison {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
}

.dark-mode .reference-comparison {
  background: #3a3a3a;
}

.reference-comparison h4 {
  margin: 0 0 15px 0;
  color: #2e5c31;
}

.dark-mode .reference-comparison h4 {
  color: #6abe6e;
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.comparison-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: white;
  border-radius: 4px;
}

.dark-mode .comparison-item {
  background: #444;
}

.comparison-label {
  font-size: 14px;
  color: #666;
}

.dark-mode .comparison-label {
  color: #aaa;
}

.comparison-value {
  font-weight: 600;
  color: #333;
}

.dark-mode .comparison-value {
  color: #e0e0e0;
}

.price-history-chart {
  height: 250px;
}

.price-history-chart h4 {
  margin: 0 0 15px 0;
  color: #2e5c31;
}

.dark-mode .price-history-chart h4 {
  color: #6abe6e;
}

.price-statistics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.stat-card {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.dark-mode .stat-card {
  background: #444;
}

.stat-card h4 {
  margin: 0 0 5px 0;
  color: #666;
  font-size: 14px;
}

.dark-mode .stat-card h4 {
  color: #aaa;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #2e5c31;
}

.dark-mode .stat-value {
  color: #6abe6e;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.primary-btn, .secondary-btn, .warning-btn {
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

.dark-mode .primary-btn {
  background: #6abe6e;
  color: #222;
}

.secondary-btn {
  background: #f0f0f0;
  color: #666;
}

.dark-mode .secondary-btn {
  background: #444;
  color: #e0e0e0;
}

.warning-btn {
  background: #ef4444;
  color: white;
}

.primary-btn:disabled,
.warning-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 1024px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .price-statistics {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .comparison-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .content-wrapper {
    margin-left: 0;
    padding-top: 60px;
  }
  
  .filters-section {
    flex-direction: column;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .product-details {
    flex-direction: column;
  }
  
  .product-image-large {
    width: 100%;
    height: 200px;
  }
  
  .product-meta {
    grid-template-columns: 1fr;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 5px;
  }
  
  .view-toggle-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 576px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .price-statistics {
    grid-template-columns: 1fr;
  }
}
</style>