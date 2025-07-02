<template>
  <div class="dashboard-container">
    <AdminSidebar />
    <div class="main-content">
      <div class="header-section">
        <div>
          <h1 class="page-title">Product Categories</h1>
          <p class="page-description">Manage and organize your farm product categories. </p>
        </div>
        <div class="action-buttons">
          <button class="primary-btn" @click="navigateToAddCategory">
            <i class="fas fa-plus"></i> Add New Category
          </button>
          <button class="secondary-btn">
            <i class="fas fa-filter"></i> Filter
          </button>
          <button class="secondary-btn">
            <i class="fas fa-download"></i> Export
          </button>
        </div>
      </div>

      <div class="categories-stats">
        <div class="stat-card">
          <h3>Total Categories</h3>
          <p class="stat-value">{{ categories.length }}</p>
        </div>
        <div class="stat-card">
          <h3>Active Categories</h3>
          <p class="stat-value">{{ activeCategories }}</p>
        </div>
        <div class="stat-card">
          <h3>Total Products</h3>
          <p class="stat-value">{{ totalProducts }}</p>
        </div>
      </div>

      <div v-if="loading" class="loading-container">
        <i class="fas fa-spinner fa-spin"></i> Loading categories...
      </div>
      
      <div v-else-if="error" class="error-message">
        <i class="fas fa-exclamation-triangle"></i> {{ error }}
      </div>
      
      <div v-else-if="categories.length === 0" class="empty-state">
        <i class="fas fa-folder-open"></i>
        <p>No categories found. Create your first category to get started.</p>
        <button class="primary-btn" @click="navigateToAddCategory">
          <i class="fas fa-plus"></i> Add Category
        </button>
      </div>
      
      <div v-else class="categories-grid">
        <div v-for="category in categories" :key="category.id" class="category-card">
          <div class="category-header">
            <h3 class="category-name">{{ category.categoryName || category.category }}</h3>
          </div>
          <div class="category-image-container">
            <img 
              :src="category.image || '/placeholder.svg?height=150&width=250'" 
              :alt="category.categoryName || category.category" 
              class="category-image"
              @error="handleImageError"
            >
          </div>
          <div class="category-info">
            <p class="product-count">{{ category.productCount || 0 }} Products</p>
            <p v-if="category.description" class="category-description">{{ category.description }}</p>
          </div>
          <div class="category-actions">
            <button class="action-btn edit" @click="editCategory(category)">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="action-btn view" @click="viewCategoryProducts(category)">
              <i class="fas fa-eye"></i> View Products
            </button>
            <button class="action-btn delete" @click="confirmDeleteCategory(category)">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteModal" class="modal-overlay">
        <div class="modal-container">
          <h3>Confirm Delete</h3>
          <p>Are you sure you want to delete the category "{{ categoryToDelete?.categoryName || categoryToDelete?.category }}"?</p>
          <p class="warning-text">This action cannot be undone.</p>
          <div class="modal-actions">
            <button class="cancel-btn" @click="showDeleteModal = false">Cancel</button>
            <button class="delete-btn" @click="deleteCategory">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AdminSidebar from '@/components/AdminSidebar.vue';
import { db } from '@/firebase/firebaseConfig';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';

const router = useRouter();
const categories = ref([]);
const loading = ref(true);
const error = ref(null);
const showDeleteModal = ref(false);
const categoryToDelete = ref(null);

// Computed properties for stats
const activeCategories = computed(() => {
  return categories.value.filter(cat => cat.isActive !== false).length;
});

const totalProducts = computed(() => {
  return categories.value.reduce((total, cat) => total + (cat.productCount || 0), 0);
});

// Handle image loading errors
const handleImageError = (event) => {
  event.target.src = '/placeholder.svg?height=150&width=250';
};

// Fetch categories from Firestore
const fetchCategories = () => {
  const categoryCollection = collection(db, 'categories');
  
  loading.value = true;
  error.value = null;
  
  console.log('Fetching categories from Firestore...');
  
  try {
    // Listen for real-time updates
    const unsubscribe = onSnapshot(categoryCollection, (snapshot) => {
      console.log(`Received ${snapshot.docs.length} categories from Firestore`);
      
      categories.value = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Category data:', { id: doc.id, ...data });
        return {
          id: doc.id,
          ...data
        };
      });
      
      loading.value = false;
    }, (err) => {
      console.error("Error fetching categories:", err);
      error.value = "Failed to load categories. Please try again.";
      loading.value = false;
    });
    
    // Return unsubscribe function to clean up the listener when component unmounts
    return unsubscribe;
  } catch (err) {
    console.error("Error setting up categories listener:", err);
    error.value = "Failed to connect to the database. Please try again.";
    loading.value = false;
    return () => {};
  }
};

// Navigation functions
const navigateToAddCategory = () => {
  console.log('Navigating to add category page');
  router.push('/add-category');
};

const editCategory = (category) => {
  router.push(`/add-category?id=${category.id}`);
};

const viewCategoryProducts = (category) => {
  router.push(`/category-products/${category.id}?name=${encodeURIComponent(category.categoryName || category.category)}`);
};

// Delete category functions
const confirmDeleteCategory = (category) => {
  categoryToDelete.value = category;
  showDeleteModal.value = true;
};

const deleteCategory = async () => {
  if (!categoryToDelete.value) return;
  
  try {
    await deleteDoc(doc(db, "categories", categoryToDelete.value.id));
    showDeleteModal.value = false;
    categoryToDelete.value = null;
  } catch (error) {
    console.error("Error deleting category:", error);
    alert("Failed to delete category. Please try again.");
  }
};

onMounted(() => {
  console.log('ProductCategories component mounted');
  const unsubscribe = fetchCategories();
  
  // Clean up the listener when component unmounts
  return () => {
    console.log('Cleaning up categories listener');
    unsubscribe();
  };
});
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css');

.dashboard-container {
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.main-content {
  flex: 1;
  padding: 2rem;
  margin-left: 260px;
  width: calc(100% - 260px);
  position: relative;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
}

.page-description {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
  max-width: 500px;
  line-height: 1.5;
}

.action-buttons {
  display: flex;
  gap: 1rem;
}

.primary-btn, .secondary-btn {
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.primary-btn {
  background-color: #2e5c31;
  color: white;
}

.primary-btn:hover {
  background-color: #1a3a1c;
}

.secondary-btn {
  background-color: #f8f9fa;
  color: #2c3e50;
  border: 1px solid #e9ecef;
}

.secondary-btn:hover {
  background-color: #e9ecef;
}

.categories-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 1.5rem;
}

.stat-card {
  background-color: #ffffff;
  border-radius: 10px;
  padding: 1.5rem;
  flex: 1;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-card h3 {
  font-size: 1rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #2e5c31;
  margin: 0;
}

.loading-container, .empty-state, .error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.loading-container i, .empty-state i, .error-message i {
  font-size: 3rem;
  color: #6c757d;
  margin-bottom: 1rem;
}

.error-message i {
  color: #e74c3c;
}

.error-message {
  color: #e74c3c;
}

.empty-state p {
  color: #6c757d;
  margin-bottom: 1.5rem;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.category-card {
  background-color: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;
}

.category-card:hover {
  transform: translateY(-5px);
}

.category-header {
  padding: 1rem 1.25rem 0.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.category-name {
  font-size: 1.25rem;
  color: #2c3e50;
  margin: 0;
  font-weight: 600;
}

.category-image-container {
  height: 180px;
  overflow: hidden;
}

.category-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.category-card:hover .category-image {
  transform: scale(1.05);
}

.category-info {
  padding: 1.25rem;
}

.product-count {
  font-size: 1rem;
  color: #2e5c31;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.category-description {
  font-size: 0.875rem;
  color: #6c757d;
  margin: 0;
  line-height: 1.4;
}

.category-actions {
  display: flex;
  padding: 1rem;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.action-btn {
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  font-size: 0.8rem;
}

.action-btn.edit {
  background-color: #2e5c31;
  color: white;
  margin-right: 0.5rem;
  flex: 1;
}

.action-btn.edit:hover {
  background-color: #1a3a1c;
}

.action-btn.view {
  background-color: #22c55e;
  color: white;
  flex: 1;
  margin-right: 0.5rem;
}

.action-btn.view:hover {
  background-color: #2e5c31;
}

.action-btn.delete {
  background-color: #e74c3c;
  color: white;
  width: 40px;
  justify-content: center;
}

.action-btn.delete:hover {
  background-color: #c0392b;
}

/* Modal styles */
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
}

.modal-container {
  background-color: white;
  border-radius: 10px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-container h3 {
  margin-top: 0;
  color: #2c3e50;
}

.warning-text {
  color: #e74c3c;
  font-weight: 500;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.cancel-btn, .delete-btn {
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.cancel-btn {
  background-color: #f8f9fa;
  color: #2c3e50;
  border: 1px solid #e9ecef;
}

.cancel-btn:hover {
  background-color: #e9ecef;
}

.delete-btn {
  background-color: #e74c3c;
  color: white;
}

.delete-btn:hover {
  background-color: #c0392b;
}

/* Responsive styles */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    width: 100%;
    padding: 1rem;
  }
  
  .header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .action-buttons {
    width: 100%;
    flex-wrap: wrap;
  }
  
  .categories-stats {
    flex-direction: column;
  }
  
  .categories-grid {
    grid-template-columns: 1fr;
  }
}
</style>