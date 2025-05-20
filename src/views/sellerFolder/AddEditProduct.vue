<template>
  <div class="dashboard-container" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
    <Sidebar 
      :initialActiveItem="isEditing ? 'Farm Products' : 'Add Product'" 
      @sidebarToggle="handleSidebarToggle"
    />
    
    <div class="main-content" :class="{ 'expanded': sidebarCollapsed }">
      <NotifProduct ref="notifProduct" />
      <header class="header">
        <div class="page-title">
          <h1>{{ isEditing ? 'Edit Product' : 'Add New Product' }}</h1>
          <p>{{ isEditing ? 'Update product details' : 'Create a new farm product' }}</p>
        </div>
      </header>
      
      <form @submit.prevent="saveProduct" class="product-form">
        <div class="form-grid">
          <!-- Basic Information Section -->
          <div class="form-section">
            <h2>Basic Information</h2>
            <div class="form-group">
              <label for="productName">Product Name *</label>
              <input 
                type="text" 
                id="productName" 
                v-model="product.productName" 
                required
                placeholder="Enter product name"
              >
            </div>
            
            <div class="form-group">
              <label for="description">Description</label>
              <textarea 
                id="description" 
                v-model="product.description" 
                rows="3"
                placeholder="Enter product description"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label for="category">Category *</label>
              
<select id="category" v-model="product.category" required>
  <option value="" disabled>Select a category</option>
  <option v-for="cat in categories" :key="cat.id" :value="cat.category">
    {{ cat.category }}
  </option>
</select>

            </div>
            
            <div class="form-group">
              <label for="code">Product Code</label>
              <input 
                type="text" 
                id="code" 
                v-model="product.code"
                placeholder="Enter product code"
              >
            </div>
          </div>
          
          <!-- Pricing & Stock Section -->
          <div class="form-section">
            <h2>Pricing & Stock</h2>
            <div class="form-group">
              <label for="price">Price *</label>
              <div class="input-group">
                <span class="input-group-text">$</span>
                <input 
                  type="number" 
                  id="price" 
                  v-model="product.price" 
                  step="0.01" 
                  min="0"
                  @input="calculateProfit"
                  required
                  placeholder="0.00"
                >
              </div>
            </div>
            
            <div class="form-group">
              <label for="cost">Cost *</label>
              <div class="input-group">
                <span class="input-group-text">$</span>
                <input 
                  type="number" 
                  id="cost" 
                  v-model="product.cost" 
                  step="0.01" 
                  min="0"
                  @input="calculateProfit"
                  required
                  placeholder="0.00"
                >
              </div>
            </div>
            
            <div class="form-group">
              <label for="profit">Profit</label>
              <div class="input-group">
                <span class="input-group-text">$</span>
                <input 
                  type="number" 
                  id="profit" 
                  v-model="product.profit" 
                  step="0.01" 
                  readonly
                  placeholder="Auto-calculated"
                >
              </div>
            </div>
            
            <div class="form-group">
              <label for="stock">Stock *</label>
              <input 
                type="number" 
                id="stock" 
                v-model="product.stock" 
                min="0"
                required
                placeholder="Enter available quantity"
              >
            </div>
          </div>
          
          <!-- Product Details Section -->
          <div class="form-section">
            <h2>Product Details</h2>
            <div class="form-group">
              <label for="weight">Weight</label>
              <div class="input-group">
                <input 
                  type="number" 
                  id="weight" 
                  v-model="product.weight" 
                  step="0.01" 
                  min="0"
                  placeholder="Enter weight"
                >
                <select id="unit" v-model="product.unit">
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                  <option value="g">g</option>
                  <option value="oz">oz</option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label for="packagingType">Packaging Type</label>
              <select id="packagingType" v-model="product.packagingType">
                <option value="box">Box</option>
                <option value="bag">Bag</option>
                <option value="crate">Crate</option>
                <option value="bunch">Bunch</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="quantityPerPackage">Quantity per Package</label>
              <input 
                type="number" 
                id="quantityPerPackage" 
                v-model="product.quantityPerPackage" 
                min="1"
                placeholder="Enter quantity"
              >
            </div>
          </div>
          
          <!-- Images Section -->
          <div class="form-section">
            <h2>Images</h2>
            <div class="form-group">
              <label for="productImage">Upload Product Image</label>
              <input 
                type="file" 
                id="productImage" 
                @change="uploadImage" 
                accept="image/*"
                class="image-upload-input"
              >
            </div>
            <div class="image-preview">
              <div v-if="product.image" class="image-item">
                <img 
                  :src="product.image" 
                  class="product-image" 
                  alt="Product image"
                >
                <button @click="removeImage" class="remove-image" type="button">
                  ×
                </button>
              </div>
              <div v-else class="empty-state">
                <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPgogIDx0ZXh0IHg9IjUwIiB5PSI1MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2FhYSI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPg==" class="empty-image" alt="No image uploaded">
                <p>No image uploaded yet</p>
              </div>
            </div>
          </div>
          
          <!-- Marketing & Availability Section -->
          <div class="form-section">
            <h2>Marketing & Availability</h2>
            <div class="form-group">
              <label for="ribbon">Ribbon</label>
              <input 
                type="text" 
                id="ribbon" 
                v-model="product.ribbon"
                placeholder="e.g., 'Organic', 'Sale'"
              >
            </div>
            
            <div class="form-group">
              <label for="status">Status *</label>
              <select id="status" v-model="product.status" required>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Scheduled">Scheduled</option>
              </select>
            </div>
            
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" id="preorder" v-model="product.preorder">
                Available for Preorder
              </label>
            </div>
            
            <div class="form-group" v-if="product.preorder">
              <label for="preorderLimit">Preorder Limit</label>
              <input 
                type="number" 
                id="preorderLimit" 
                v-model="product.preorderLimit" 
                min="0"
                placeholder="Enter maximum preorders"
              >
            </div>
            
            <div class="form-group" v-if="product.preorder">
              <label for="preorderMessage">Preorder Message</label>
              <textarea 
                id="preorderMessage" 
                v-model="product.preorderMessage" 
                rows="2"
                placeholder="Special instructions for preorders"
              ></textarea>
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button 
            type="button" 
            class="cancel-btn" 
            @click="cancelEdit"
            :disabled="isSaving"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            class="save-btn" 
            :disabled="isSaving"
          >
            <span v-if="isSaving">Saving...</span>
            <span v-else>{{ isEditing ? 'Update' : 'Save' }} Product</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>


<script setup>

import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db } from '@/firebase/firebaseConfig';
import { collection, addDoc, doc, getDoc, updateDoc, getDocs, increment } from 'firebase/firestore'; // ✅ correct


import { getAuth } from 'firebase/auth';
import Sidebar from '@/components/Sidebar.vue';
import NotifProduct from '@/components/NotifProduct.vue';

const route = useRoute();
const router = useRouter();
const auth = getAuth();
const notifProduct = ref(null);

const isEditing = computed(() => route.name === 'EditProduct');
const isSaving = ref(false);
const sidebarCollapsed = ref(false);

const product = ref({
  productName: '',
  description: '',
  ribbon: '',
  category: '',
  price: null,
  cost: null,
  profit: null,
  stock: null,
  code: '',
  weight: null,
  unit: 'kg',
  packagingType: 'box',
  quantityPerPackage: null,
  image: '',
  preorder: false,
  preorderLimit: null,
  preorderMessage: '',
  status: 'Active',
  sellerId: '',
  productId: ''
});

// Helper function for notifications
const showNotification = (message, type = 'success') => {
  notifProduct.value?.showNotification(message, type);
};

const handleSidebarToggle = (collapsed) => {
  sidebarCollapsed.value = collapsed;
};

const uploadImage = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    product.value.image = e.target.result;
  };
  reader.readAsDataURL(file);
};

const removeImage = () => {
  product.value.image = '';
};

const calculateProfit = () => {
  if (product.value.price && product.value.cost) {
    product.value.profit = (product.value.price - product.value.cost).toFixed(2);
  } else {
    product.value.profit = null;
  }
};

const validateForm = () => {
  if (!product.value.productName) {
    showNotification('Product name is required', 'warning');
    return false;
  }
  if (!product.value.category) {
    showNotification('Category is required', 'warning');
    return false;
  }
  if (!product.value.price) {
    showNotification('Price is required', 'warning');
    return false;
  }
  if (!product.value.stock && product.value.stock !== 0) {
    showNotification('Stock quantity is required', 'warning');
    return false;
  }
  if (!product.value.status) {
    showNotification('Status is required', 'warning');
    return false;
  }
  return true;
};

const fetchProduct = async (productId) => {
  try {
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);

    if (productSnap.exists()) {
      const data = productSnap.data();
      product.value = { 
        ...data,
        id: productSnap.id,
        productId: productSnap.id
      };
    } else {
      showNotification('Product not found', 'error');
      router.push('/products');
    }
  } catch (error) {
    console.error('Error fetching product:', error);
    showNotification('Failed to load product details', 'error');
  }
};

const saveProduct = async () => {
  if (!validateForm()) return;

  const user = auth.currentUser;
  if (!user) {
    showNotification('You must be logged in to save a product.', 'error');
    return;
  }

  isSaving.value = true;

  try {
    const productData = {
      ...product.value,
      sellerId: user.uid,
      updatedAt: new Date()
    };

    const { id, ...dataToSave } = productData;

    if (isEditing.value) {
      await updateDoc(doc(db, 'products', id), dataToSave);
      showNotification('Product updated successfully!', 'success');
      setTimeout(() => router.push('/products'), 1500);
    } else {
      const docRef = await addDoc(collection(db, 'products'), {
        ...dataToSave,
        createdAt: new Date()
      });
      // Increment productCount in the selected category
      const categorySnapshot = await getDocs(collection(db, 'categories'));
      const matchedCategory = categorySnapshot.docs.find(doc => doc.data().category === product.value.category);
      if (matchedCategory) {
        await updateDoc(matchedCategory.ref, { productCount: increment(1) });
      }
    
      product.value.productId = docRef.id;
      await updateDoc(docRef, { productId: docRef.id });
      showNotification('Product saved successfully!', 'success');
      setTimeout(() => router.push('/products'), 1500);
    }
  } catch (error) {
    console.error('Error saving product:', error);
    showNotification('Failed to save product. Please try again.', 'error');
  } finally {
    isSaving.value = false;
  }
};

const cancelEdit = () => {
  showNotification('Cancelled editing. Changes were not saved.', 'warning');
  setTimeout(() => router.push('/products'), 1500);
};


const categories = ref([]);

// Fetch category options from Firestore
onMounted(async () => {
  const snapshot = await getDocs(collection(db, 'categories'));
  categories.value = snapshot.docs.map(doc => ({
    id: doc.id,
    category: doc.data().category
  }));
});

onMounted(() => {
  // Test notification to verify component is working
  setTimeout(() => {
    showNotification('Product form loaded successfully', 'success');
  }, 1000);

  const savedSidebarState = localStorage.getItem('sidebar-collapsed');
  if (savedSidebarState === 'true') {
    sidebarCollapsed.value = true;
  }
  
  if (isEditing.value && route.params.id) {
    fetchProduct(route.params.id);
  } else {
    const user = auth.currentUser;
    if (user) {
      product.value.sellerId = user.uid;
    }
  }
});
</script>

<script setup>

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
  transition: margin-left 0.3s ease;
  overflow-y: auto;
}

.main-content.expanded {
  margin-left: 60px;
}

.header {
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

.product-form {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.form-section {
  background-color: #f9fafb;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e5e7eb;
}

.form-section h2 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
  margin-top: 0;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 5px;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group input[type="file"],
.form-group select,
.form-group textarea {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #111827;
  transition: border-color 0.2s;
}

.form-group input[type="text"]:focus,
.form-group input[type="number"]:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #2e5c31;
  box-shadow: 0 0 0 2px rgba(46, 92, 49, 0.1);
}

.input-group {
  display: flex;
  align-items: center;
}

.input-group-text {
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-right: none;
  padding: 8px 12px;
  border-radius: 4px 0 0 4px;
  color: #6b7280;
  font-size: 0.9rem;
}

.input-group input {
  border-radius: 0 4px 4px 0;
  flex-grow: 1;
}

.checkbox-group {
  flex-direction: row;
  align-items: center;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.image-upload-input {
  width: 100%;
  padding: 8px;
  border: 1px dashed #d1d5db;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.image-upload-input:hover {
  border-color: #2e5c31;
  background-color: #f0fdf4;
}

.upload-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 4px;
}

.image-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
}

.image-item {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image {
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.remove-image:hover {
  opacity: 1;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  background-color: #f3f4f6;
  border: 1px dashed #d1d5db;
}

.empty-image {
  width: 50px;
  height: 50px;
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 0.75rem;
  color: #6b7280;
  text-align: center;
  margin: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn,
.save-btn {
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 0.9rem;
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
  color: #fff;
  border: none;
}

.save-btn:hover:not(:disabled) {
  background-color: #26492a;
}

.save-btn:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

/* Responsive styles */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding: 15px;
  }
  
  .main-content.expanded {
    margin-left: 0;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-section {
    padding: 15px;
  }
  
  .sidebar-collapsed .main-content {
    margin-left: 0;
  }
}

@media (max-width: 480px) {
  .product-form {
    padding: 15px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .cancel-btn,
  .save-btn {
    width: 100%;
  }
}
</style>
