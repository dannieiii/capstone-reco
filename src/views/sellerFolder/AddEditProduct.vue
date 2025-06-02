<template>
  <div class="dashboard-container" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
    <Sidebar 
      :initialActiveItem="isEditing ? 'Farm Products' : 'Add Product'" 
      @sidebarToggle="handleSidebarToggle"
    />
    
    <div class="main-content" :class="{ 'expanded': sidebarCollapsed }">
      <NotifProduct ref="notifProduct" />
      
      <!-- Header -->
      <header class="header">
        <div class="page-title">
          <h1>{{ isEditing ? 'Edit Product' : 'Add New Product' }}</h1>
          <p>{{ isEditing ? 'Update product details' : 'Create a new farm product with detailed information' }}</p>
        </div>
      </header>

      <!-- Status Ribbons -->
      <div v-if="product.status === 'limited' || product.isOnSale || product.isPreOrder" class="status-ribbons">
        <div v-if="product.status === 'limited'" class="status-badge limited">
          <svg class="badge-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path>
          </svg>
          Limited Stock
        </div>
        <div v-if="product.isOnSale" class="status-badge sale">
          <svg class="badge-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clip-rule="evenodd"></path>
          </svg>
          On Sale - {{ product.discountPercentage }}% Off
        </div>
        <div v-if="product.isPreOrder" class="status-badge pre-order">
          Pre-Order Available
        </div>
      </div>

      <form @submit.prevent="saveProduct" class="product-form">
        <div class="form-grid">
          
          <!-- Basic Information -->
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
                placeholder="Short description of your product"
              ></textarea>
            </div>

            <div class="form-group">
              <label for="category">Category *</label>
              <select id="category" v-model="product.category" required>
                <option value="" disabled>Select category</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.category">
                  {{ cat.category }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Product Code</label>
              <input 
                type="text" 
                v-model="product.code" 
                readonly
                class="readonly-input"
              >
            </div>
          </div>

          <!-- Selling Units & Pricing -->
          <div class="form-section wide">
            <h2>Selling Options & Pricing</h2>
            
            <!-- Unit Selection -->
            <div class="unit-selection">
              <label class="with-tooltip">
                Selling Units *
                <div class="info-tooltip">
                  <div class="info-icon">i</div>
                  <div class="tooltip-content">
                    Select the units in which you want to sell this product
                  </div>
                </div>
              </label>
              <div class="unit-checkboxes">
                <label v-for="unit in availableUnits" :key="unit.value">
                  <input 
                    type="checkbox" 
                    v-model="selectedUnits" 
                    :value="unit.value"
                    @change="handleUnitSelection(unit.value)"
                  >
                  {{ unit.label }}
                </label>
              </div>
            </div>

            <!-- Dynamic Unit Fields -->
            <template v-for="unit in selectedUnits" :key="unit">
              <div class="unit-details">
                <h3>{{ getUnitLabel(unit) }}</h3>
                
                <!-- Per Kilo -->
                <div v-if="unit === 'perKilo'" class="form-group">
                  <label>Price per Kilo (₱)</label>
                  <input 
                    type="number" 
                    v-model="product.pricePerKilo" 
                    min="0"
                    step="0.01"
                    @input="calculateProfit"
                  >
                  <p v-if="product.isOnSale" class="sale-price">
                    Sale Price: ₱{{ calculateSalePrice(product.pricePerKilo).toFixed(2) }}
                  </p>
                  <label>Available Stock (kg)</label>
                  <input 
                    type="number" 
                    v-model="product.stockPerKilo" 
                    min="0"
                    @input="calculateProfit"
                  >
                </div>
                
                <!-- Per Sack -->
                <div v-if="unit === 'perSack'" class="form-group">
                  <label>Price per Sack (₱)</label>
                  <input 
                    type="number" 
                    v-model="product.pricePerSack" 
                    min="0"
                    step="0.01"
                    @input="calculateProfit"
                  >
                  <p v-if="product.isOnSale" class="sale-price">
                    Sale Price: ₱{{ calculateSalePrice(product.pricePerSack).toFixed(2) }}
                  </p>
                  <label>Sack Weight (kg)</label>
                  <input 
                    type="number" 
                    v-model="product.sackWeight" 
                    min="0"
                    @input="calculateProfit"
                  >
                  <label>Available Sacks</label>
                  <input 
                    type="number" 
                    v-model="product.stockPerSack" 
                    min="0"
                    @input="calculateProfit"
                  >
                </div>
                
                <!-- Per Tali -->
                <div v-if="unit === 'perTali'" class="form-group">
                  <label>Price per Tali (₱)</label>
                  <input 
                    type="number" 
                    v-model="product.pricePerTali" 
                    min="0"
                    step="0.01"
                    @input="calculateProfit"
                  >
                  <p v-if="product.isOnSale" class="sale-price">
                    Sale Price: ₱{{ calculateSalePrice(product.pricePerTali).toFixed(2) }}
                  </p>
                  <label>Bunches per Tali</label>
                  <input 
                    type="number" 
                    v-model="product.itemsPerTali" 
                    min="1"
                    @input="calculateProfit"
                  >
                  <label>Available Tali</label>
                  <input 
                    type="number" 
                    v-model="product.stockPerTali" 
                    min="0"
                    @input="calculateProfit"
                  >
                </div>
                
                <!-- Per Kaing -->
                <div v-if="unit === 'perKaing'" class="form-group">
                  <label>Price per Kaing (₱)</label>
                  <input 
                    type="number" 
                    v-model="product.pricePerKaing" 
                    min="0"
                    step="0.01"
                    @input="calculateProfit"
                  >
                  <p v-if="product.isOnSale" class="sale-price">
                    Sale Price: ₱{{ calculateSalePrice(product.pricePerKaing).toFixed(2) }}
                  </p>
                  <label>Weight per Kaing (kg)</label>
                  <input 
                    type="number" 
                    v-model="product.kaingWeight" 
                    min="0"
                    @input="calculateProfit"
                  >
                  <label>Available Kaing</label>
                  <input 
                    type="number" 
                    v-model="product.stockPerKaing" 
                    min="0"
                    @input="calculateProfit"
                  >
                </div>
                
                <!-- Per Tray -->
                <div v-if="unit === 'perTray'" class="form-group">
                  <label>Price per Tray (₱)</label>
                  <input 
                    type="number" 
                    v-model="product.pricePerTray" 
                    min="0"
                    step="0.01"
                    @input="calculateProfit"
                  >
                  <p v-if="product.isOnSale" class="sale-price">
                    Sale Price: ₱{{ calculateSalePrice(product.pricePerTray).toFixed(2) }}
                  </p>
                  <label>Items per Tray</label>
                  <input 
                    type="number" 
                    v-model="product.itemsPerTray" 
                    min="1"
                    @input="calculateProfit"
                  >
                  <label>Available Trays</label>
                  <input 
                    type="number" 
                    v-model="product.stockPerTray" 
                    min="0"
                    @input="calculateProfit"
                  >
                </div>
                
                <!-- Per Piece -->
                <div v-if="unit === 'perPiece'" class="form-group">
                  <label>Price per Piece (₱)</label>
                  <input 
                    type="number" 
                    v-model="product.pricePerPiece" 
                    min="0"
                    step="0.01"
                    @input="calculateProfit"
                  >
                  <p v-if="product.isOnSale" class="sale-price">
                    Sale Price: ₱{{ calculateSalePrice(product.pricePerPiece).toFixed(2) }}
                  </p>
                  <label>Available Pieces</label>
                  <input 
                    type="number" 
                    v-model="product.stockPerPiece" 
                    min="0"
                    @input="calculateProfit"
                  >
                </div>
              </div>
            </template>

            <!-- Cost & Profit -->
            <div class="cost-profit-section">
              <div class="form-group">
                <label class="with-tooltip">
                  Production Cost per Unit (₱)
                  <div class="info-tooltip">
                    <div class="info-icon">i</div>
                    <div class="tooltip-content">
                      Cost to produce one unit including materials and labor
                    </div>
                  </div>
                </label>
                <input 
                  type="number" 
                  v-model="product.cost" 
                  min="0"
                  step="0.01"
                  @input="calculateProfit"
                >
              </div>

              <div class="form-group">
                <label class="with-tooltip">
                  Estimated Profit (₱)
                  <div class="info-tooltip">
                    <div class="info-icon">i</div>
                    <div class="tooltip-content">
                      Calculated profit based on price minus cost
                    </div>
                  </div>
                </label>
                <input 
                  type="number" 
                  v-model="product.profit" 
                  readonly
                  class="readonly-input"
                >
              </div>
            </div>
          </div>

          <!-- Sale Settings -->
          <div class="form-section">
            <h2 class="with-tooltip">
              Sale Settings
              <div class="info-tooltip">
                <div class="info-icon">i</div>
                <div class="tooltip-content">
                  Configure sale pricing and discounts
                </div>
              </div>
            </h2>
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" v-model="product.isOnSale">
                Product is on sale
              </label>
            </div>

            <div v-if="product.isOnSale" class="form-group">
              <label>Discount Percentage (%)</label>
              <input 
                type="number" 
                v-model="product.discountPercentage" 
                min="0" 
                max="100"
                @input="calculateProfit"
              >
            </div>
          </div>

          <!-- Pre-order Settings -->
          <div class="form-section">
            <h2 class="with-tooltip">
              Pre-order Settings
              <div class="info-tooltip">
                <div class="info-icon">i</div>
                <div class="tooltip-content">
                  Configure pre-order options for future availability
                </div>
              </div>
            </h2>
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" v-model="product.isPreOrder">
                Enable pre-orders
              </label>
            </div>

            <template v-if="product.isPreOrder">
              <div class="form-group">
                <label>Pre-order Message</label>
                <input 
                  type="text"
                  v-model="product.preOrderMessage"
                  placeholder="e.g., Available for harvest in 2 weeks"
                >
              </div>

              <div class="form-group">
                <label>Pre-order Limit</label>
                <input 
                  type="number" 
                  v-model="product.preOrderLimit"
                  placeholder="Maximum pre-order quantity"
                >
              </div>

              <div class="form-group">
                <label>Lead Time (days)</label>
                <input 
                  type="number" 
                  v-model="product.preorderDays"
                >
              </div>
            </template>
          </div>

          <!-- Wholesale Settings -->
          <div class="form-section">
            <h2 class="with-tooltip">
              Wholesale Options
              <div class="info-tooltip">
                <div class="info-icon">i</div>
                <div class="tooltip-content">
                  Configure wholesale pricing for bulk orders
                </div>
              </div>
            </h2>
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" v-model="product.wholesaleAvailable">
                Available for wholesale
              </label>
            </div>

            <div v-if="product.wholesaleAvailable" class="form-group">
              <label>Minimum Wholesale Quantity</label>
              <input 
                type="number" 
                v-model="product.minWholesaleQty" 
                min="1"
              >
              <label>Wholesale Price (₱)</label>
              <input 
                type="number" 
                v-model="product.wholesalePrice" 
                min="0"
                step="0.01"
              >
            </div>
          </div>

          <!-- Product Details -->
          <div class="form-section">
            <h2>Product Details</h2>
            <div class="form-group">
              <label>Packaging Type</label>
              <select v-model="product.packagingType">
                <option value="none">None</option>
                <option value="plastic">Plastic Bag</option>
                <option value="kaing">Kaing (Basket)</option>
                <option value="sack">Sack</option>
                <option value="tray">Tray</option>
                <option value="bundle">Bundle</option>
                <option value="tali">Tied (Tali)</option>
              </select>
            </div>

            <div class="form-group">
              <label>Status *</label>
              <select v-model="product.status" required>
                <option value="available">Available</option>
                <option value="limited">Limited Stock</option>
                <option value="preorder">Pre-order Only</option>
              </select>
            </div>
          </div>

          <!-- Product Image -->
          <div class="form-section">
            <h2>Product Image</h2>
            <div class="form-group">
              <input 
                type="file" 
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
        </div>

        <!-- Pre-order and Sale Info Display -->
        <div v-if="product.isPreOrder || product.isOnSale" class="info-panel">
          <div class="info-content">
            <div v-if="product.isOnSale" class="info-row">
              <span class="info-label">Sale Information:</span>
              <span class="info-value">{{ product.discountPercentage }}% discount applied</span>
            </div>
            <div v-if="product.isPreOrder" class="info-row">
              <span class="info-label">Pre-order Message:</span>
              <span class="info-value">{{ product.preOrderMessage || 'Available for pre-order' }}</span>
            </div>
            <div v-if="product.isPreOrder" class="info-row">
              <span class="info-label">Pre-order Limit:</span>
              <span class="info-value">{{ product.preOrderLimit }} units</span>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button 
            type="button" 
            class="cancel-btn" 
            @click="cancelEdit"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            class="save-btn" 
            :disabled="isSaving"
          >
            {{ isSaving ? 'Saving...' : 'Save Product' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db } from '@/firebase/firebaseConfig';
import { collection, addDoc, doc, getDoc, updateDoc, getDocs, increment, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import Sidebar from '@/components/Sidebar.vue';
import NotifProduct from '@/components/NotifProduct.vue';

const route = useRoute();
const router = useRouter();
const auth = getAuth();
const notifProduct = ref(null);

// Configuration
const availableUnits = ref([
  { value: 'perKilo', label: 'Per Kilo' },
  { value: 'perSack', label: 'Per Sack' },
  { value: 'perTali', label: 'Per Tali' },
  { value: 'perKaing', label: 'Per Kaing' },
  { value: 'perTray', label: 'Per Tray' },
  { value: 'perPiece', label: 'Per Piece' }
]);

// Component state
const isEditing = computed(() => route.name === 'EditProduct');
const isSaving = ref(false);
const sidebarCollapsed = ref(false);
const selectedUnits = ref([]);
const categories = ref([]);

const product = ref({
  // Basic Info
  productName: '',
  description: '',
  category: '',
  code: '',
  
  // Pricing
  cost: 0,
  profit: 0,
  
  // Units
  pricePerKilo: 0,
  stockPerKilo: 0,
  pricePerSack: 0,
  sackWeight: 50,
  stockPerSack: 0,
  pricePerTali: 0,
  itemsPerTali: 10,
  stockPerTali: 0,
  pricePerKaing: 0,
  kaingWeight: 12,
  stockPerKaing: 0,
  pricePerTray: 0,
  itemsPerTray: 30,
  stockPerTray: 0,
  pricePerPiece: 0,
  stockPerPiece: 0,
  
  // Details
  packagingType: 'none',
  image: '',
  
  // Availability
  status: 'available',
  wholesaleAvailable: false,
  minWholesaleQty: 1,
  wholesalePrice: 0,
  preorderDays: 7,
  
  // Sale features
  isOnSale: false,
  discountPercentage: 0,
  
  // Pre-order features
  isPreOrder: false,
  preOrderMessage: '',
  preOrderLimit: 0,
  
  // Metadata
  sellerId: '',
  createdAt: null,
  updatedAt: null,
  availableUnits: []
});

// Methods
const generateProductCode = () => {
  if (!product.value.category || !product.value.productName) return;
  
  const categoryPrefix = product.value.category.substring(0, 3).toUpperCase();
  const namePrefix = product.value.productName.substring(0, 2).toUpperCase().replace(/[^A-Z]/g, '');
  const randomNum = Math.floor(100 + Math.random() * 900);
  const timestamp = Date.now().toString().slice(-3);
  
  product.value.code = `${categoryPrefix}${namePrefix}-${randomNum}${timestamp}`;
};

const calculateSalePrice = (originalPrice) => {
  if (!product.value.isOnSale || product.value.discountPercentage <= 0) return originalPrice;
  return originalPrice * (1 - product.value.discountPercentage / 100);
};

const calculateProfit = () => {
  let totalProfit = 0;
  
  selectedUnits.value.forEach(unit => {
    let unitProfit = 0;
    let price = 0;
    let stock = 0;
    let unitCost = 0;
    
    switch(unit) {
      case 'perKilo':
        price = product.value.isOnSale ? calculateSalePrice(product.value.pricePerKilo) : product.value.pricePerKilo;
        stock = product.value.stockPerKilo;
        unitCost = product.value.cost;
        unitProfit = (price - unitCost) * stock;
        break;
        
      case 'perSack':
        price = product.value.isOnSale ? calculateSalePrice(product.value.pricePerSack) : product.value.pricePerSack;
        stock = product.value.stockPerSack;
        // For sacks, the cost should be per sack, not per kg
        unitCost = product.value.cost;
        unitProfit = (price - unitCost) * stock;
        break;
        
      case 'perTali':
        price = product.value.isOnSale ? calculateSalePrice(product.value.pricePerTali) : product.value.pricePerTali;
        stock = product.value.stockPerTali;
        // For tali, the cost should be per tali, not per bunch
        unitCost = product.value.cost;
        unitProfit = (price - unitCost) * stock;
        break;
        
      case 'perKaing':
        price = product.value.isOnSale ? calculateSalePrice(product.value.pricePerKaing) : product.value.pricePerKaing;
        stock = product.value.stockPerKaing;
        unitCost = product.value.cost;
        unitProfit = (price - unitCost) * stock;
        break;
        
      case 'perTray':
        price = product.value.isOnSale ? calculateSalePrice(product.value.pricePerTray) : product.value.pricePerTray;
        stock = product.value.stockPerTray;
        // For trays, the cost should be per tray, not per item
        unitCost = product.value.cost;
        unitProfit = (price - unitCost) * stock;
        break;
        
      case 'perPiece':
        price = product.value.isOnSale ? calculateSalePrice(product.value.pricePerPiece) : product.value.pricePerPiece;
        stock = product.value.stockPerPiece;
        unitCost = product.value.cost;
        unitProfit = (price - unitCost) * stock;
        break;
    }
    
    totalProfit += unitProfit;
  });
  
  product.value.profit = parseFloat(totalProfit.toFixed(2));
};

const handleUnitSelection = (unit) => {
  if (selectedUnits.value.includes(unit)) {
    switch(unit) {
      case 'perSack':
        if (!product.value.sackWeight) product.value.sackWeight = 50;
        break;
      case 'perTali':
        if (!product.value.itemsPerTali) product.value.itemsPerTali = 10;
        break;
      case 'perKaing':
        if (!product.value.kaingWeight) product.value.kaingWeight = 12;
        break;
      case 'perTray':
        if (!product.value.itemsPerTray) product.value.itemsPerTray = 30;
        break;
    }
  }
  calculateProfit();
};

const getUnitLabel = (unit) => {
  const unitObj = availableUnits.value.find(u => u.value === unit);
  return unitObj ? unitObj.label : '';
};

const showNotification = (message, type = 'success') => {
  notifProduct.value?.showNotification(message, type);
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

const validateForm = () => {
  if (!product.value.productName) {
    showNotification('Product name is required', 'warning');
    return false;
  }
  if (!product.value.category) {
    showNotification('Category is required', 'warning');
    return false;
  }
  if (selectedUnits.value.length === 0) {
    showNotification('At least one selling unit is required', 'warning');
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
      selectedUnits.value = data.availableUnits || [];
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
      updatedAt: serverTimestamp(),
      availableUnits: selectedUnits.value
    };

    const { id, ...dataToSave } = productData;

    if (isEditing.value) {
      await updateDoc(doc(db, 'products', id), dataToSave);
      showNotification('Product updated successfully!', 'success');
    } else {
      dataToSave.createdAt = serverTimestamp();
      const docRef = await addDoc(collection(db, 'products'), dataToSave);
      
      // Increment product count in category
      const categorySnapshot = await getDocs(collection(db, 'categories'));
      const matchedCategory = categorySnapshot.docs.find(doc => doc.data().category === product.value.category);
      if (matchedCategory) {
        await updateDoc(matchedCategory.ref, { productCount: increment(1) });
      }
      
      product.value.productId = docRef.id;
      await updateDoc(docRef, { productId: docRef.id });
      showNotification('Product saved successfully!', 'success');
    }

    setTimeout(() => router.push('/products'), 1500);
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

const handleSidebarToggle = (collapsed) => {
  sidebarCollapsed.value = collapsed;
};

// Watch for changes to generate product code
watch([() => product.value.category, () => product.value.productName], () => {
  if (product.value.category && product.value.productName) {
    generateProductCode();
  }
}, { immediate: false });

// Initialize
onMounted(async () => {
  const user = auth.currentUser;
  if (user) product.value.sellerId = user.uid;

  // Fetch categories
  const snapshot = await getDocs(collection(db, 'categories'));
  categories.value = snapshot.docs.map(doc => ({
    id: doc.id,
    category: doc.data().category
  }));

  const savedSidebarState = localStorage.getItem('sidebar-collapsed');
  if (savedSidebarState === 'true') {
    sidebarCollapsed.value = true;
  }
  
  if (isEditing.value && route.params.id) {
    fetchProduct(route.params.id);
  } else {
    generateProductCode();
  }
});
</script>

<style scoped>
/* Dashboard Layout */
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

/* Header */
.header {
  margin-bottom: 20px;
}

.page-title h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.page-title p {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
}

/* Status Ribbons */
.status-ribbons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.limited {
  background-color: #fee2e2;
  color: #991b1b;
}

.status-badge.sale {
  background-color: #ef4444;
  color: white;
}

.status-badge.pre-order {
  background-color: #ffedd5;
  color: #9a3412;
  border: 1px solid #f97316;
}

.badge-icon {
  width: 0.75rem;
  height: 0.75rem;
  margin-right: 0.25rem;
}

/* Form Layout */
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

.form-section.wide {
  grid-column: span 1;
}

@media (min-width: 768px) {
  .form-section.wide {
    grid-column: span 2;
  }
}

.form-section h2 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin-top: 0;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
}

.form-section h3 {
  font-size: 1rem;
  font-weight: 500;
  color: #111827;
  margin: 0 0 1rem 0;
}

/* Form Fields */
.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 5px;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #111827;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #2e5c31;
  box-shadow: 0 0 0 2px rgba(46, 92, 49, 0.1);
}

.readonly-input {
  background-color: #f9fafb;
  cursor: not-allowed;
}

.sale-price {
  font-size: 0.875rem;
  color: #16a34a;
  margin-top: 0.25rem;
  margin-bottom: 0;
}

/* Checkbox Styles */
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

.unit-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.unit-checkboxes label {
  display: flex;
  align-items: center;
  gap: 5px;
  background: #f3f4f6;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
}

/* Unit Details */
.unit-selection {
  margin-bottom: 1.5rem;
}

.unit-details {
  background: white;
  padding: 15px;
  border-radius: 8px;
  margin-top: 10px;
  border: 1px solid #e5e7eb;
}

.cost-profit-section {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1rem;
  margin-top: 1.5rem;
}

@media (min-width: 768px) {
  .cost-profit-section {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Info Tooltip */
.with-tooltip {
  display: flex;
  align-items: center;
}

.info-tooltip {
  position: relative;
  margin-left: 0.5rem;
}

.info-icon {
  width: 1.25rem;
  height: 1.25rem;
  background-color: white;
  border: 2px solid #2e5c31;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
  color: #2e5c31;
  cursor: help;
}

.tooltip-content {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: #1f2937;
  color: white;
  font-size: 0.75rem;
  border-radius: 0.375rem;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;
  z-index: 10;
  width: max-content;
  max-width: 200px;
}

.info-tooltip:hover .tooltip-content {
  opacity: 1;
  visibility: visible;
}

/* Image Upload */
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

/* Info Panel */
.info-panel {
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-top: 1.5rem;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-weight: 500;
  color: #1e40af;
}

.info-value {
  color: #1e40af;
}

/* Form Actions */
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