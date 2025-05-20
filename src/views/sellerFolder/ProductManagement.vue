<template>
  <div class="dashboard-container">
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
              <div class="product-badge" v-if="product.ribbon">{{ product.ribbon }}</div>
              <div class="product-status" :class="product.status?.toLowerCase() || ''">{{ product.status || 'No Status' }}</div>
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
              <div class="product-price">
                <div class="current-price">₱{{ (Number(product.price) || 0).toFixed(2) }}/{{ product.unit }}</div>
                <div class="profit">Profit: ₱{{ (Number(product.profit) || 0).toFixed(2) }}</div>
              </div>
              <div class="product-stock">
                <div class="stock-label">Stock:</div>
                <div class="stock-bar">
                  <div 
                    class="stock-progress" 
                    :style="{ width: `${(product.stock / product.maxStock) * 100}%` }"
                    :class="getStockClass(product.stock, product.maxStock)"
                  ></div>
                </div>
                <div class="stock-value">{{ product.stock }} {{ product.unit }}</div>
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
import { collection as fbCollection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// ✅ Fixed Firestore imports for category fetching
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
const filterOptions = ['All', 'Active', 'Inactive', 'Scheduled'];

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
        status: data.status || 'No Status',
        price: Number(data.price) || 0,
        profit: Number(data.profit) || 0,
        stock: Number(data.stock) || 0,
        maxStock: Number(data.maxStock) || 0,
        unit: data.unit || 'unit',
        sellerId: data.sellerId || user.uid,
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

// Computed: filtered products
const filteredProducts = computed(() => {
  return products.value.filter(product => {
    const productName = product.productName?.toLowerCase() || '';
    const category = product.category?.toLowerCase() || '';
    const status = product.status?.toLowerCase() || '';

    const matchesSearch = productName.includes(searchQuery.value.toLowerCase());
    const matchesCategory = activeCategory.value === 'all' || category === activeCategory.value.toLowerCase();
    const matchesFilter = activeFilter.value === 'All' || status === activeFilter.value.toLowerCase();

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

// Stock visual
const getStockClass = (stock, maxStock) => {
  const percentage = (stock / maxStock) * 100;
  if (percentage < 20) return 'low';
  if (percentage < 50) return 'medium';
  return 'high';
};

// Close dropdown if clicked outside
const clickOutside = (event) => {
  const filterDropdown = document.querySelector('.filter-dropdown');
  if (filterDropdown && !filterDropdown.contains(event.target)) {
    showFilterDropdown.value = false;
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
}

.product-image img {
  max-width: 100%;
  max-height: 80%;
  object-fit: contain;
}

.product-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 8px;
  background-color: #2e5c31;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 500;
  border-radius: 4px;
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

.product-status.scheduled {
  background-color: #f59e0b;
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

.product-stock {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.stock-label {
  font-size: 0.8rem;
  color: #6b7280;
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

.stock-value {
  font-size: 0.8rem;
  color: #6b7280;
  min-width: 25px;
  text-align: right;
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
}

@media (max-width: 576px) {
  .products-grid {
    grid-template-columns: 1fr;
  }
  
  .product-card {
    max-width: 100%;
  }
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
</style>