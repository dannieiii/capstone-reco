<template>
  <div class="dashboard-container">
    <OfflineBanner />
    <Sidebar initialActiveItem="Farm Products" />
    
    <div class="main-content">
      <header class="header">
        <div class="page-title">
          <h1>Farm Products</h1>
          <p>Manage your farm products inventory, pricing, and details</p>
        </div>
      </header>
      
      <div class="product-actions">
        <div class="search-container">
          <div class="search-box">
            <Search size="18" class="search-icon" />
            <input type="text" placeholder="Search products..." v-model="searchQuery" />
          </div>
        </div>
        
        <div class="action-buttons">
          <div class="filter-dropdown">
            <button class="filter-btn" @click="toggleFilterDropdown">
              <Filter size="18" />
              {{ activeFilter }}
              <ChevronDown size="18" />
            </button>
            <div v-show="showFilterDropdown" class="filter-options">
              <button v-for="filter in filterOptions" :key="filter" @click="setFilter(filter)">
                {{ filter }}
              </button>
            </div>
          </div>
          <router-link to="/addproduct" class="add-product-btn">
            <Plus size="18" />
            Add Product
          </router-link>
        </div>
      </div>
      
      <div class="product-categories">
        <button 
          v-for="category in categories" 
          :key="category.id"
          :class="['category-btn', { active: activeCategory === category.name }]"
          @click="setActiveCategory(category.name)"
        >
          {{ category.name }}
        </button>
      </div>

      <div class="products-grid">
        <div v-if="isLoading" class="loading-state">Loading products...</div>
        <template v-else-if="filteredProducts.length > 0">
          <div class="product-card" v-for="product in filteredProducts" :key="product.id">
            <div class="product-image">
              <img :src="product.image || '/placeholder.svg?height=180&width=180'" alt="Product image" />
              <!-- Status Badges -->
              <div v-if="product.isOnSale" class="product-badge sale">
                Sale {{ product.discountPercentage }}%
              </div>
              <div v-else-if="product.isPreOrder" class="product-badge pre-order">
                Pre-Order
              </div>
              <div v-else-if="product.wholesaleAvailable" class="product-badge wholesale">
                Wholesale
              </div>
              <div v-else-if="product.status === 'limited'" class="product-badge limited">
                Limited
              </div>
              
              <!-- Status Indicator -->
              <div class="product-status" :class="product.isActive ? 'active' : 'inactive'">
                {{ product.isActive ? 'Active' : 'Inactive' }}
              </div>
            </div>
            <div class="product-details">
              <div class="product-category">{{ product.category || 'No Category' }}</div>
              <h3 class="product-name">{{ product.productName || 'No Name' }}</h3>
              <div class="product-stats">
                <div class="stat">
                  <ShoppingCart size="14" />
                  {{ product.sales || 0 }}
                </div>
                <div class="stat">
                  <Star size="14" />
                  {{ product.rating || 0 }}
                </div>
                <div class="stat">
                  <Eye size="14" />
                  {{ product.views || 0 }}
                </div>
              </div>
              
              <!-- Price Display -->
              <div class="product-price">
                <div class="current-price">₱{{ getDisplayPrice(product) }}</div>
                <div class="profit">Profit: ₱{{ Number(product.profit || 0).toFixed(2) }}</div>
              </div>

              <div class="available-units" v-if="getAvailableUnits(product).length > 0">
                <span class="units-label">Available as:</span>
                <div class="unit-tags">
                  <span class="unit-tag" v-for="unit in getAvailableUnits(product)" :key="unit">
                    {{ unit }}
                  </span>
                </div>
              </div>
                <!-- Stock Display -->
              <div class="product-stock">
                <div class="stock-header">
                  <div class="stock-label">Stock:</div>
                </div>
                
                <!-- Main Stock Display -->
                <div class="main-stock-display">
                  <div class="stock-bar">
                    <div 
                      class="stock-progress" 
                      :style="{ width: `${getMainStockPercentage(product)}%` }"
                      :class="getStockClass(getMainStockPercentage(product))"
                    ></div>
                  </div>
                  <div class="stock-value">{{ getMainStockDisplay(product) }}</div>
                </div>
              </div>
              
              <div class="product-actions">
                <router-link :to="`/edit-product/${product.id}`" class="edit-btn">
                  <Edit size="16" />
                  Edit
                </router-link>
                <button class="delete-btn" @click="showDeleteConfirmation(product.id)">
                  <Trash size="16" />
                </button>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="empty-state">
          <p>No products found. Try adjusting your search or filters.</p>
          <router-link to="/addproduct" class="add-product-btn">
            <Plus size="18" />
            Add Your First Product
          </router-link>
        </div>
      </div>

      <!-- Confirm Delete Modal -->
      <ConfirmModal 
        :isVisible="showModal"
        @confirm="handleDeleteConfirm"
        @cancel="handleDeleteCancel"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '@/firebase/firebaseConfig';
import { collection as fbCollection, query, where, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFirestore, getDocs as getDocsCat, collection as catCollection } from 'firebase/firestore';
import { getApp } from 'firebase/app';

import {
  Search,
  Filter,
  Plus,
  ShoppingCart,
  Star,
  Eye,
  Edit,
  Trash,
  ChevronDown
} from 'lucide-vue-next';

import Sidebar from '@/components/Sidebar.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import OfflineBanner from '@/components/OfflineBanner.vue';

const router = useRouter();
const auth = getAuth();

// States
const searchQuery = ref('');
const activeCategory = ref('all');
const showFilterDropdown = ref(false);
const activeFilter = ref('All');
const isLoading = ref(true);
const showModal = ref(false);
const productToDelete = ref(null);

// Filter options
// Use 'Unavailable' in the UI; still support legacy 'Not Available' label in code
const filterOptions = ['All', 'Active', 'Inactive', 'Unavailable', 'On Sale', 'Pre-Order', 'Wholesale', 'Limited'];

// Dynamic categories and products
const categories = ref([]);
const products = ref([]);

// Delete confirmation
const showDeleteConfirmation = (productId) => {
  productToDelete.value = productId;
  showModal.value = true;
};

const handleDeleteConfirm = async () => {
  if (productToDelete.value) {
    try {
      await deleteDoc(doc(db, 'products', productToDelete.value));
      await fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product.');
    }
  }
  showModal.value = false;
  productToDelete.value = null;
};

const handleDeleteCancel = () => {
  showModal.value = false;
  productToDelete.value = null;
};

// Get display price based on available pricing options
const getDisplayPrice = (product) => {
  if (product.pricePerKilo > 0) return product.pricePerKilo.toFixed(2) + '/kg';
  if (product.pricePerSack > 0) return product.pricePerSack.toFixed(2) + '/sack';
  if (product.pricePerTali > 0) return product.pricePerTali.toFixed(2) + '/tali';
  if (product.pricePerKaing > 0) return product.pricePerKaing.toFixed(2) + '/kaing';
  if (product.pricePerTray > 0) return product.pricePerTray.toFixed(2) + '/tray';
  if (product.pricePerPiece > 0) return product.pricePerPiece.toFixed(2) + '/piece';
  if (product.pricePerBundle > 0) return product.pricePerBundle.toFixed(2) + '/bundle';
  return '0.00';
};

// Get stock information - using specific unit stocks
const getStockByUnit = (product) => {
  const stockInfo = [];
  
  // Define the mapping between units and their stock fields
  const unitStockMap = {
    'kg': { stockField: 'stockPerKilo', label: 'kg' },
    'sack': { stockField: 'stockPerSack', label: 'sacks' },
    'tali': { stockField: 'stockPerTali', label: 'tali' },
    'kaing': { stockField: 'stockPerKaing', label: 'kaing' },
    'bundle': { stockField: 'stockPerBundle', label: 'bundles' },
    'tray': { stockField: 'stockPerTray', label: 'trays' },
    'piece': { stockField: 'stockPerPiece', label: 'pieces' }
  };

  // Get available units for this product
  const availableUnits = getAvailableUnits(product);
  
  // Add stock info for each available unit
  availableUnits.forEach(unit => {
    const unitInfo = unitStockMap[unit];
    if (unitInfo) {
      const stockQuantity = product[unitInfo.stockField] || 0;
      
      // Calculate percentage (assume 100 is optimal stock level)
      const optimalStock = Math.max(stockQuantity, 100);
      const percentage = Math.min(100, (stockQuantity / optimalStock) * 100);
      
      stockInfo.push({
        unit: unit,
        unitLabel: unitInfo.label,
        quantity: stockQuantity,
        percentage: percentage
      });
    }
  });

  return stockInfo;
};

// Get main stock display (first available unit)
const getMainStockDisplay = (product) => {
  const stockInfo = getStockByUnit(product);
  if (stockInfo.length > 0) {
    const main = stockInfo[0];
    return `${main.quantity} ${main.unitLabel}`;
  }
  return '0';
};

// Get main stock percentage (first available unit)
const getMainStockPercentage = (product) => {
  const stockInfo = getStockByUnit(product);
  if (stockInfo.length > 0) {
    return stockInfo[0].percentage;
  }
  return 0;
};

// Get stock class based on percentage
const getStockClass = (percentage) => {
  if (percentage <= 0) return 'out';
  if (percentage < 20) return 'low';
  if (percentage < 50) return 'medium';
  return 'high';
};

// Computed: filtered products
const filteredProducts = computed(() => {
  return products.value.filter(product => {
    const productName = product.productName?.toLowerCase() || '';
    const category = product.category?.toLowerCase() || '';
    
    const matchesSearch = productName.includes(searchQuery.value.toLowerCase());
    const matchesCategory = activeCategory.value === 'all' || category === activeCategory.value.toLowerCase();
    
    let matchesFilter = true;
    if (activeFilter.value === 'Active') matchesFilter = product.isActive;
    else if (activeFilter.value === 'Inactive') matchesFilter = !product.isActive;
    else if (activeFilter.value === 'On Sale') matchesFilter = product.isOnSale;
    else if (activeFilter.value === 'Pre-Order') matchesFilter = product.isPreOrder;
    else if (activeFilter.value === 'Wholesale') matchesFilter = product.wholesaleAvailable;
    else if (activeFilter.value === 'Limited') matchesFilter = product.status === 'limited';
    // New: Not Available / Unavailable filters
    else if (activeFilter.value === 'Not Available' || activeFilter.value === 'Unavailable') {
      matchesFilter = product.status === 'notAvailable';
    }
    
    return matchesSearch && matchesCategory && matchesFilter;
  });
});

// Category filter
const setActiveCategory = (categoryName) => {
  activeCategory.value = categoryName;
};

// Filter dropdown handlers
const toggleFilterDropdown = () => {
  showFilterDropdown.value = !showFilterDropdown.value;
};

const setFilter = (filter) => {
  activeFilter.value = filter;
  showFilterDropdown.value = false;
};

// Close dropdown if clicked outside
const clickOutside = (event) => {
  const filterDropdown = document.querySelector('.filter-dropdown');
  if (filterDropdown && !filterDropdown.contains(event.target)) {
    showFilterDropdown.value = false;
  }
};

const getAvailableUnits = (product) => {
  const units = [];
  if (product.pricePerKilo > 0) units.push('kg');
  if (product.pricePerSack > 0) units.push('sack');
  if (product.pricePerTali > 0) units.push('tali');
  if (product.pricePerKaing > 0) units.push('kaing');
  if (product.pricePerTray > 0) units.push('tray');
  if (product.pricePerPiece > 0) units.push('piece');
  if (product.pricePerBundle > 0) units.push('bundle');
  return units;
};

// Fetch products
const fetchProducts = async () => {
  const user = auth.currentUser;
  if (!user) {
    alert('You must be logged in to view products.');
    router.push('/login');
    return;
  }

  try {
    const q = query(fbCollection(db, 'products'), where('sellerId', '==', user.uid));
    const querySnapshot = await getDocs(q);
  products.value = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        productName: data.productName || 'No Name',
        category: data.category || 'No Category',
    status: data.status || 'available',
    // Treat admin deactivated products as inactive in UI
    isActive: (data.isActive !== undefined ? data.isActive : true) && (data.status !== 'inactive'),
        isOnSale: data.isOnSale || false,
        isPreOrder: data.isPreOrder || false,
        wholesaleAvailable: data.wholesaleAvailable || false,
        discountPercentage: data.discountPercentage || 0,
        pricePerKilo: Number(data.pricePerKilo) || 0,
        pricePerSack: Number(data.pricePerSack) || 0,
        pricePerTali: Number(data.pricePerTali) || 0,
        pricePerKaing: Number(data.pricePerKaing) || 0,
        pricePerTray: Number(data.pricePerTray) || 0,
        pricePerPiece: Number(data.pricePerPiece) || 0,        stockPerKilo: Number(data.stockPerKilo) || 0,
        stockPerSack: Number(data.stockPerSack) || 0,
        stockPerTali: Number(data.stockPerTali) || 0,
        stockPerKaing: Number(data.stockPerKaing) || 0,
        stockPerTray: Number(data.stockPerTray) || 0,
        stockPerPiece: Number(data.stockPerPiece) || 0,
        stock: Number(data.stock) || 0, // Main stock field
        sackWeight: Number(data.sackWeight) || 50,
        kaingWeight: Number(data.kaingWeight) || 12,
        itemsPerTali: Number(data.itemsPerTali) || 10,
        itemsPerTray: Number(data.itemsPerTray) || 30,
        profit: Number(data.profit) || 0,
        sales: Number(data.sales) || 0,
        rating: Number(data.rating) || 0,
        views: Number(data.views) || 0,
        sellerId: data.sellerId || user.uid,
        pricePerBundle: Number(data.pricePerBundle) || 0,
        stockPerBundle: Number(data.stockPerBundle) || 0,
        bundleWeight: Number(data.bundleWeight) || 12,
        ...data,
      };
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    alert('Failed to fetch products.');
  } finally {
    isLoading.value = false;
  }
};

// Fetch on mount
onMounted(() => {
  const db = getFirestore(getApp());
  getDocsCat(catCollection(db, 'categories')).then(snapshot => {
    categories.value = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().category
    }));
  });

  document.addEventListener('click', clickOutside);
  fetchProducts();
});

onBeforeUnmount(() => {
  document.removeEventListener('click', clickOutside);
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
  margin-left: 230px;
  width: calc(100% - 230px);
  overflow-y: auto;
  transition: all 0.3s ease;
}

.sidebar.collapsed + .main-content {
  margin-left: 70px;
  width: calc(100% - 70px);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 5px 0;
}

.page-title p {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
}

.product-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.search-container {
  flex: 1;
  min-width: 200px;
  max-width: 400px;
}

.search-box {
  display: flex;
  align-items: center;
  background-color: #fff;
  border-radius: 20px;
  padding: 8px 16px;
  width: 100%;
  border: 1px solid #e5e7eb;
}

.search-icon {
  color: #9ca3af;
  margin-right: 8px;
}

.search-box input {
  border: none;
  outline: none;
  width: 100%;
  font-size: 0.9rem;
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-dropdown {
  position: relative;
}

.filter-options {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 10;
}

.filter-options button {
  display: block;
  width: 100%;
  padding: 8px 16px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
}

.filter-options button:hover {
  background-color: #f3f4f6;
}

.filter-btn, .add-product-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn {
  background-color: #fff;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.filter-btn:hover {
  background-color: #f9fafb;
}

.add-product-btn {
  background-color: #2e5c31;
  color: #fff;
  border: none;
}

.add-product-btn:hover {
  background-color: #26492a;
}

.product-categories {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 10px;
}

.category-btn {
  padding: 8px 16px;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  font-size: 0.9rem;
  color: #6b7280;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.category-btn:hover {
  background-color: #f9fafb;
}

.category-btn.active {
  background-color: #2e5c31;
  color: #fff;
  border-color: #2e5c31;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.product-card {
  background-color: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  min-width: 0;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.product-image {
  height: 180px;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 8px;
  font-size: 0.7rem;
  font-weight: 500;
  border-radius: 4px;
  color: white;
}

.product-badge.sale {
  background-color: #ef4444;
}

.product-badge.pre-order {
  background-color: #f59e0b;
}

.product-badge.wholesale {
  background-color: #3b82f6;
}

.product-badge.limited {
  background-color: #8b5cf6;
}

.product-status {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 4px 8px;
  font-size: 0.7rem;
  font-weight: 500;
  border-radius: 4px;
}

.product-status.active {
  background-color: #10b981;
  color: #fff;
}

.product-status.inactive {
  background-color: #ef4444;
  color: #fff;
}

.product-details {
  padding: 15px;
}

.product-category {
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-name {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 10px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-stats {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  color: #6b7280;
}

.product-price {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.current-price {
  font-size: 1.1rem;
  font-weight: 700;
  color: #111827;
}

.profit {
  font-size: 0.8rem;
  color: #10b981;
}

.available-units {
  margin-bottom: 10px;
}

.units-label {
  font-size: 0.8rem;
  color: #6b7280;
  margin-right: 8px;
}

.unit-tags {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
}

.unit-tag {
  font-size: 0.7rem;
  padding: 3px 8px;
  background-color: #e5e7eb;
  border-radius: 12px;
  color: #4b5563;
}

/* Enhanced Stock Section with Dropdown */
.product-stock {
  margin-bottom: 15px;
  position: relative;
}

.stock-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.stock-label {
  font-size: 0.8rem;
  color: #6b7280;
}

.stock-dropdown {
  position: relative;
}

.stock-dropdown-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  transition: all 0.2s ease;
  color: #6b7280;
}

.stock-dropdown-btn:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.stock-dropdown-btn.active {
  transform: rotate(180deg);
  color: #2e5c31;
}

.main-stock-display {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stock-bar {
  flex: 1;
  height: 6px;
  background-color: #f3f4f6;
  border-radius: 3px;
  overflow: hidden;
}

.stock-progress {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.stock-progress.high {
  background-color: #2e5c31;
}

.stock-progress.medium {
  background-color: #f59e0b;
}

.stock-progress.low {
  background-color: #ef4444;
}

.stock-progress.out {
  background-color: #6b7280;
}

.stock-value {
  font-size: 0.8rem;
  color: #6b7280;
  min-width: 60px;
  text-align: right;
}

/* Stock Dropdown Content */
.stock-dropdown-content {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 20;
  padding: 8px;
  margin-top: 4px;
}

.stock-item {
  margin-bottom: 8px;
}

.stock-item:last-child {
  margin-bottom: 0;
}

.stock-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.stock-unit {
  font-size: 0.75rem;
  color: #374151;
  font-weight: 500;
}

.stock-quantity {
  font-size: 0.75rem;
  color: #6b7280;
}

.stock-item-bar {
  height: 4px;
  background-color: #f3f4f6;
  border-radius: 2px;
  overflow: hidden;
}

.product-actions {
  display: flex;
  gap: 10px;
}

.edit-btn, .delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-btn {
  background-color: #f3f4f6;
  color: #4b5563;
  border: none;
  flex: 1;
}

.edit-btn:hover {
  background-color: #e5e7eb;
}

.delete-btn {
  background-color: #fee2e2;
  color: #ef4444;
  border: none;
  width: 36px;
}

.delete-btn:hover {
  background-color: #fecaca;
}

.loading-state, .empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.empty-state .add-product-btn {
  margin-top: 20px;
  display: inline-flex;
}

@media (max-width: 1200px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}

@media (max-width: 992px) {
  .main-content {
    margin-left: 70px;
    width: calc(100% - 70px);
  }
  
  .sidebar.collapsed + .main-content {
    margin-left: 70px;
  }
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    width: 100%;
    padding: 15px;
    /* Prevent overlap with global top navigation/header on mobile */
    padding-top: 64px; /* approximate header height; adjust if your header height changes */
    padding-top: calc(64px + env(safe-area-inset-top));
  }
  
  .sidebar.collapsed + .main-content {
    margin-left: 0;
  }

  .product-actions {
    flex-direction: column;
    gap: 15px;
  }

  .search-container {
    max-width: 100%;
    width: 100%;
  }

  .action-buttons {
    width: 100%;
    justify-content: space-between;
  }

  .products-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
}

@media (max-width: 576px) {
  .products-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  
  .product-card {
    max-width: 100%;
  }

  /* Extra safety padding for very small screens */
  .main-content {
    padding-top: 70px; /* slightly larger on very small screens */
    padding-top: calc(70px + env(safe-area-inset-top));
  }

  /* Optimize mobile layout for 3 columns */
  .product-image {
    height: 120px;
  }

  .product-details {
    padding: 10px;
  }

  .product-name {
    font-size: 0.85rem;
    line-height: 1.2;
    margin-bottom: 8px;
  }

  .product-category {
    font-size: 0.7rem;
    margin-bottom: 4px;
  }

  .product-stats {
    gap: 8px;
    margin-bottom: 8px;
  }

  .stat {
    font-size: 0.7rem;
  }

  .product-price {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    margin-bottom: 8px;
  }

  .current-price {
    font-size: 0.9rem;
  }

  .profit {
    font-size: 0.7rem;
  }

  .available-units {
    margin-bottom: 8px;
  }

  .units-label {
    font-size: 0.7rem;
    display: block;
    margin-bottom: 4px;
  }

  .unit-tags {
    gap: 4px;
  }

  .unit-tag {
    font-size: 0.6rem;
    padding: 2px 6px;
  }

  .stock-label,
  .stock-value {
    font-size: 0.7rem;
  }

  .main-stock-display {
    gap: 6px;
  }

  .stock-value {
    min-width: 40px;
  }

  .product-actions {
    gap: 6px;
  }

  .edit-btn {
    padding: 6px 8px;
    font-size: 0.7rem;
  }

  .delete-btn {
    width: 28px;
    padding: 6px;
  }

  .product-badge {
    font-size: 0.6rem;
    padding: 2px 6px;
  }

  .product-status {
    font-size: 0.6rem;
    padding: 2px 6px;
  }
}

/* Very small screens - maintain 3 columns but further optimize */
@media (max-width: 480px) {
  .products-grid {
    gap: 6px;
  }

  .product-image {
    height: 100px;
  }

  .product-details {
    padding: 8px;
  }

  .product-name {
    font-size: 0.8rem;
  }

  .current-price {
    font-size: 0.85rem;
  }
}

/* Dark mode styles */
:global(.dark) .unit-tag {
  background-color: #374151;
  color: #d1d5db;
}

:global(.dark) .units-label {
  color: #9ca3af;
}

:global(.dark) .main-content {
  background-color: #111827;
}

:global(.dark) .page-title h1 {
  color: #f9fafb;
}

:global(.dark) .page-title p,
:global(.dark) .product-category,
:global(.dark) .stat,
:global(.dark) .stock-label,
:global(.dark) .stock-value {
  color: #9ca3af;
}

:global(.dark) .search-box,
:global(.dark) .filter-btn,
:global(.dark) .category-btn,
:global(.dark) .product-card,
:global(.dark) .product-image {
  background-color: #1f2937;
  border-color: #374151;
}

:global(.dark) .product-name,
:global(.dark) .current-price {
  color: #f9fafb;
}

:global(.dark) .stock-bar,
:global(.dark) .edit-btn {
  background-color: #374151;
}

:global(.dark) .filter-options {
  background-color: #1f2937;
  border-color: #374151;
}

:global(.dark) .filter-options button:hover {
  background-color: #374151;
}

:global(.dark) .profit {
  color: #34d399;
}

:global(.dark) .stock-dropdown-content {
  background-color: #1f2937;
  border-color: #374151;
}

:global(.dark) .stock-unit {
  color: #d1d5db;
}

:global(.dark) .stock-quantity {
  color: #9ca3af;
}

:global(.dark) .stock-item-bar {
  background-color: #374151;
}

:global(.dark) .stock-dropdown-btn:hover {
  background-color: #374151;
}
</style>