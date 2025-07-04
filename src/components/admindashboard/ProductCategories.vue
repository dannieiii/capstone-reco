<template>
  <div class="dashboard-card product-categories">
    <div class="card-header">
      <h3>Product Categories</h3>
      <button class="add-btn" @click="navigateToAddCategory">
        <Plus size="16" />
        Add Category
      </button>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading categories...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      <AlertCircle size="20" />
      <p>{{ error }}</p>
    </div>
    
    <div v-else-if="categories.length === 0" class="empty-state">
      <FolderOpen size="48" />
      <p>No categories found</p>
      <button class="add-btn" @click="navigateToAddCategory">
        <Plus size="16" />
        Add First Category
      </button>
    </div>
    
    <div v-else class="categories-grid">
      <div v-for="(category, index) in categories" :key="category.id" class="category-card">
        <div class="category-icon" :style="{ backgroundColor: getCategoryColor(index) }">
          <!-- Show image if available, otherwise show icon -->
          <img 
            v-if="category.image && !imageErrors[category.id]" 
            :src="category.image" 
            :alt="category.categoryName || category.category"
            class="category-image"
            @error="handleImageError(category.id)"
            @load="handleImageLoad(category.id)"
          />
          <component 
            v-else 
            :is="getCategoryIcon(index)" 
            size="24" 
            color="white" 
          />
        </div>
        <div class="category-info">
          <h4>{{ category.categoryName || category.category }}</h4>
          <p>{{ category.productCount || 0 }} Products</p>
        </div>
        <div class="category-actions">
          <button class="action-btn" @click="editCategory(category)" title="Edit Category">
            <Edit size="16" />
          </button>
          <button class="action-btn" @click="confirmDeleteCategory(category)" title="Delete Category">
            <Trash size="16" />
          </button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Category Modal -->
    <div v-if="showCategoryModal" class="modal-overlay" @click="closeCategoryModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>{{ isEditingCategory ? 'Edit Category' : 'Add New Category' }}</h3>
          <button class="close-btn" @click="closeCategoryModal">
            <X size="20" />
          </button>
        </div>
        <form @submit.prevent="saveCategory">
          <div class="form-group">
            <label for="categoryName">Category Name *</label>
            <input 
              type="text" 
              id="categoryName" 
              v-model="currentCategory.categoryName" 
              required
              placeholder="Enter category name"
            />
          </div>
          <div class="form-group">
            <label for="description">Description</label>
            <textarea 
              id="description" 
              v-model="currentCategory.description" 
              placeholder="Enter category description"
              rows="3"
            ></textarea>
          </div>
          <div class="form-group">
            <label for="imageUrl">Image URL</label>
            <input 
              type="url" 
              id="imageUrl" 
              v-model="currentCategory.image" 
              placeholder="Enter image URL"
              @input="previewImage"
            />
            <!-- Image Preview -->
            <div v-if="currentCategory.image && !previewError" class="image-preview">
              <img 
                :src="currentCategory.image" 
                alt="Preview"
                @error="previewError = true"
                @load="previewError = false"
              />
            </div>
            <div v-else-if="previewError" class="preview-error">
              <AlertCircle size="16" />
              <span>Invalid image URL</span>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="cancel-btn" @click="closeCategoryModal">Cancel</button>
            <button type="submit" class="save-btn" :disabled="isSaving">
              <span v-if="isSaving">Saving...</span>
              <span v-else>{{ isEditingCategory ? 'Update' : 'Save' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>Confirm Delete</h3>
          <button class="close-btn" @click="showDeleteModal = false">
            <X size="20" />
          </button>
        </div>
        <div class="modal-body">
          <AlertTriangle size="48" color="#e74c3c" />
          <p>Are you sure you want to delete the category "{{ categoryToDelete?.categoryName || categoryToDelete?.category }}"?</p>
          <p class="warning-text">This action cannot be undone and will affect all products in this category.</p>
        </div>
        <div class="modal-actions">
          <button class="cancel-btn" @click="showDeleteModal = false">Cancel</button>
          <button class="delete-btn" @click="deleteCategory" :disabled="isDeleting">
            <span v-if="isDeleting">Deleting...</span>
            <span v-else>Delete</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Notification -->
    <div v-if="notification.show" class="notification" :class="notification.type">
      {{ notification.message }}
      <button class="notification-close" @click="closeNotification">×</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  Plus, 
  Edit, 
  Trash, 
  X,
  AlertCircle,
  AlertTriangle,
  FolderOpen,
  Sprout, 
  Apple, 
  Wheat, 
  Leaf,
  Carrot,
  Cherry
} from 'lucide-vue-next';
import { db } from '@/firebase/firebaseConfig';
import { 
  collection, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  addDoc, 
  updateDoc, 
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';

const router = useRouter();
const categories = ref([]);
const loading = ref(true);
const error = ref(null);
const showDeleteModal = ref(false);
const showCategoryModal = ref(false);
const categoryToDelete = ref(null);
const isDeleting = ref(false);
const isSaving = ref(false);
const isEditingCategory = ref(false);
const unsubscribe = ref(null);
const imageErrors = ref({});
const previewError = ref(false);

const notification = ref({
  show: false,
  message: '',
  type: 'success'
});

const currentCategory = ref({
  categoryName: '',
  description: '',
  image: '',
  productCount: 0
});

// Category icons mapping
const getCategoryIcon = (index) => {
  const icons = [Sprout, Apple, Wheat, Leaf, Carrot, Cherry];
  return icons[index % icons.length];
};

// Category colors mapping
const getCategoryColor = (index) => {
  const colors = ['#4a8f4d', '#e05d44', '#f0b429', '#3b82f6', '#8b5a2b', '#9333ea'];
  return colors[index % colors.length];
};

// Handle image loading errors
const handleImageError = (categoryId) => {
  imageErrors.value[categoryId] = true;
};

const handleImageLoad = (categoryId) => {
  imageErrors.value[categoryId] = false;
};

// Preview image in modal
const previewImage = () => {
  previewError.value = false;
};

// Show notification
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

const closeNotification = () => {
  notification.value.show = false;
};

// Fetch categories from Firestore with product count
const fetchCategories = () => {
  const categoryCollection = collection(db, 'categories');
  
  loading.value = true;
  error.value = null;
  
  try {
    // Listen for real-time updates
    unsubscribe.value = onSnapshot(categoryCollection, async (snapshot) => {
      const categoriesData = await Promise.all(
        snapshot.docs.map(async (categoryDoc) => {
          const data = categoryDoc.data();
          
          // Count products in this category
          try {
            const productsQuery = query(
              collection(db, 'products'), 
              where('category', '==', data.categoryName || data.category)
            );
            const productsSnapshot = await getDocs(productsQuery);
            const productCount = productsSnapshot.size;
            
            return {
              id: categoryDoc.id,
              ...data,
              productCount
            };
          } catch (err) {
            console.error('Error counting products for category:', data.categoryName || data.category, err);
            return {
              id: categoryDoc.id,
              ...data,
              productCount: 0
            };
          }
        })
      );
      
      categories.value = categoriesData;
      loading.value = false;
    }, (err) => {
      console.error("Error fetching categories:", err);
      error.value = "Failed to load categories. Please try again.";
      loading.value = false;
    });
  } catch (err) {
    console.error("Error setting up categories listener:", err);
    error.value = "Failed to connect to the database. Please try again.";
    loading.value = false;
  }
};

// Navigation and modal functions
const navigateToAddCategory = () => {
  isEditingCategory.value = false;
  currentCategory.value = {
    categoryName: '',
    description: '',
    image: '',
    productCount: 0
  };
  previewError.value = false;
  showCategoryModal.value = true;
};

const editCategory = (category) => {
  isEditingCategory.value = true;
  currentCategory.value = {
    id: category.id,
    categoryName: category.categoryName || category.category,
    description: category.description || '',
    image: category.image || '',
    productCount: category.productCount || 0
  };
  previewError.value = false;
  showCategoryModal.value = true;
};

const closeCategoryModal = () => {
  showCategoryModal.value = false;
  currentCategory.value = {
    categoryName: '',
    description: '',
    image: '',
    productCount: 0
  };
  previewError.value = false;
};

const saveCategory = async () => {
  if (!currentCategory.value.categoryName.trim()) {
    showNotification('Category name is required', 'error');
    return;
  }

  isSaving.value = true;

  try {
    const categoryData = {
      categoryName: currentCategory.value.categoryName.trim(),
      category: currentCategory.value.categoryName.trim(),
      description: currentCategory.value.description.trim(),
      image: currentCategory.value.image.trim(),
      updatedAt: serverTimestamp()
    };

    if (isEditingCategory.value && currentCategory.value.id) {
      await updateDoc(doc(db, 'categories', currentCategory.value.id), categoryData);
      showNotification('Category updated successfully');
    } else {
      categoryData.createdAt = serverTimestamp();
      categoryData.isActive = true;
      await addDoc(collection(db, 'categories'), categoryData);
      showNotification('Category added successfully');
    }

    closeCategoryModal();
  } catch (error) {
    console.error('Error saving category:', error);
    showNotification('Failed to save category', 'error');
  } finally {
    isSaving.value = false;
  }
};

const confirmDeleteCategory = (category) => {
  categoryToDelete.value = category;
  showDeleteModal.value = true;
};

const deleteCategory = async () => {
  if (!categoryToDelete.value) return;
  
  isDeleting.value = true;
  
  try {
    await deleteDoc(doc(db, "categories", categoryToDelete.value.id));
    showNotification('Category deleted successfully');
    showDeleteModal.value = false;
    categoryToDelete.value = null;
  } catch (error) {
    console.error("Error deleting category:", error);
    showNotification('Failed to delete category', 'error');
  } finally {
    isDeleting.value = false;
  }
};

onMounted(() => {
  fetchCategories();
});

onUnmounted(() => {
  if (unsubscribe.value) {
    unsubscribe.value();
  }
});
</script>

<style scoped>
.dashboard-card {
  background-color: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-btn:hover {
  background-color: #2980b9;
}

.loading-container, .empty-state, .error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #6b7280;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: #ef4444;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.category-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border-radius: 8px;
  background-color: #f9fafb;
  position: relative;
  transition: all 0.2s ease;
}

.category-card:hover {
  background-color: #f3f4f6;
  transform: translateY(-1px);
}

.category-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.category-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.category-info {
  flex: 1;
}

.category-info h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 5px 0;
  color: #111827;
}

.category-info p {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0;
}

.category-actions {
  display: flex;
  gap: 5px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background-color: #e5e7eb;
  color: #111827;
}

/* Modal Styles */
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
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 0;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 24px;
}

.modal-header h3 {
  margin: 0;
  color: #111827;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.modal-body {
  padding: 0 24px;
  text-align: center;
}

.modal-body p {
  margin: 16px 0;
  color: #374151;
}

.warning-text {
  color: #ef4444;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 20px;
  padding: 0 24px;
}

.form-group label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: border-color 0.2s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

/* Image Preview Styles */
.image-preview {
  margin-top: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  width: 80px;
  height: 80px;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-error {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ef4444;
  font-size: 0.8rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid #e5e7eb;
  margin-top: 24px;
}

.cancel-btn, .delete-btn, .save-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn {
  background-color: #f3f4f6;
  color: #374151;
}

.cancel-btn:hover {
  background-color: #e5e7eb;
}

.delete-btn {
  background-color: #ef4444;
  color: white;
}

.delete-btn:hover:not(:disabled) {
  background-color: #dc2626;
}

.save-btn {
  background-color: #3498db;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background-color: #2980b9;
}

.save-btn:disabled,
.delete-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Notification */
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 16px 20px;
  border-radius: 8px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 300px;
  animation: slideIn 0.3s ease-out;
}

.notification.success {
  background-color: #22c55e;
}

.notification.error {
  background-color: #ef4444;
}

.notification-close {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  margin-left: 15px;
  font-size: 1.2rem;
  padding: 0;
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

/* Responsive */
@media (max-width: 768px) {
  .categories-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-container {
    width: 95%;
    margin: 20px;
  }
}
</style>