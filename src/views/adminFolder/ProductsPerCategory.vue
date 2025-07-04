<template>
<div class="dashboard-container">
  <AdminSidebar />
  <div class="main-content">
    <div class="header-section">
      <div>
        <h1 class="page-title">{{ categoryName }} Products</h1>
        <p class="page-description">View all products in the {{ categoryName }} category from all sellers.</p>
      </div>
      <div class="action-buttons">
        <button class="secondary-btn" @click="goBack">
          <i class="fas fa-arrow-left"></i> Back to Categories
        </button>
        <button class="secondary-btn" @click="exportProducts">
          <i class="fas fa-download"></i> Export Products
        </button>
      </div>
    </div>

    <div class="products-stats">
      <div class="stat-card">
        <h3>Total Products</h3>
        <p class="stat-value">{{ products.length }}</p>
      </div>
      <div class="stat-card">
        <h3>Available Products</h3>
        <p class="stat-value">{{ availableProducts }}</p>
      </div>
      <div class="stat-card">
        <h3>Total Sellers</h3>
        <p class="stat-value">{{ uniqueSellers }}</p>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <i class="fas fa-spinner fa-spin"></i> Loading products...
    </div>
    
    <div v-else-if="error" class="error-message">
      <i class="fas fa-exclamation-triangle"></i> {{ error }}
    </div>
    
    <div v-else-if="products.length === 0" class="empty-state">
      <i class="fas fa-box-open"></i>
      <p>No products found in this category.</p>
      <p class="empty-description">Products will appear here when sellers add them to the {{ categoryName }} category.</p>
    </div>
    
    <div v-else class="products-grid">
      <div v-for="product in products" :key="product.id" class="product-card">
        <div class="product-image-container">
          <img 
            :src="getProductImage(product)" 
            :alt="product.productName" 
            class="product-image"
            @error="handleImageError"
          >
          <div class="product-status" :class="product.status">
            {{ product.status }}
          </div>
        </div>
        
        <div class="product-info">
          <h3 class="product-name">{{ product.productName }}</h3>
          <p v-if="product.variety && product.variety !== 'Normal'" class="product-variety">{{ product.variety }}</p>
          
          <div class="farm-name">
            <i class="fas fa-store"></i> 
            {{ product.farmName || 'Unknown Farm' }}
          </div>
          
          <div class="price-info">
            <div class="price-range">
              <span class="price-label">Price Range:</span>
              <span class="price-value">₱{{ formatPrice(product.minPrice) }} - ₱{{ formatPrice(product.maxPrice) }}</span>
            </div>
            <div class="unit-info">
              <span class="unit-label">Unit:</span>
              <span class="unit-value">{{ product.unit || 'N/A' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Notification Element -->
  <div v-if="notification.show" class="notification" :class="notification.type">
    {{ notification.message }}
    <button class="notification-close" @click="closeNotification">&times;</button>
  </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import AdminSidebar from '@/components/AdminSidebar.vue';
import { db } from '@/firebase/firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc
} from 'firebase/firestore';

const router = useRouter();
const route = useRoute();
const products = ref([]);
const loading = ref(true);
const error = ref(null);
const unsubscribe = ref(null);
const categoryName = ref('');
const notification = ref({
  show: false,
  message: '',
  type: 'success'
});

// Get category name from route params
const categoryId = route.params.id;
const categoryNameFromQuery = route.query.name || 'Unknown Category';
categoryName.value = categoryNameFromQuery;

// Computed properties for stats
const availableProducts = computed(() => {
  return products.value.filter(product => product.status === 'available').length;
});

const uniqueSellers = computed(() => {
  const sellerIds = new Set(products.value.map(product => product.sellerId));
  return sellerIds.size;
});

// Handle image loading errors
const handleImageError = (event) => {
  event.target.src = '/placeholder.svg?height=200&width=300';
};

// Get product image with fallback
const getProductImage = (product) => {
  if (product.image && product.image.startsWith('data:image')) {
    return product.image;
  }
  return '/placeholder.svg?height=200&width=300';
};

// Format price with proper number formatting
const formatPrice = (price) => {
  if (!price) return '0.00';
  return parseFloat(price).toFixed(2);
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

// Fetch products for the category
const fetchProducts = async () => {
  loading.value = true;
  error.value = null;

  try {
    console.log('Fetching products for category:', categoryName.value);
    
    // Query products collection for the specific category
    const productsQuery = query(
      collection(db, 'products'),
      where('category', '==', categoryName.value)
    );

    // Listen for real-time updates
    unsubscribe.value = onSnapshot(productsQuery, async (snapshot) => {
      console.log(`Received ${snapshot.docs.length} products from Firestore`);
      
      const productsData = await Promise.all(
        snapshot.docs.map(async (productDoc) => {
          const productData = productDoc.data();
          
          // Fetch seller information
          let farmName = 'Unknown Farm';
          if (productData.sellerId) {
            try {
              const sellerDoc = await getDoc(doc(db, 'sellers', productData.sellerId));
              if (sellerDoc.exists()) {
                const sellerData = sellerDoc.data();
                farmName = sellerData.farmDetails?.farmName || 
                          `${sellerData.personalInfo?.firstName || ''} ${sellerData.personalInfo?.lastName || ''}`.trim() ||
                          'Unknown Farm';
              }
            } catch (err) {
              console.error('Error fetching seller data:', err);
            }
          }
          
          return {
            id: productDoc.id,
            ...productData,
            farmName
          };
        })
      );
      
      products.value = productsData;
      loading.value = false;
    }, (err) => {
      console.error("Error fetching products:", err);
      error.value = "Failed to load products. Please try again.";
      loading.value = false;
    });
  } catch (err) {
    console.error("Error setting up products listener:", err);
    error.value = "Failed to connect to the database. Please try again.";
    loading.value = false;
  }
};

// Navigation functions
const goBack = () => {
  router.push('/admin/categories');
};

// Export products
const exportProducts = () => {
  const headers = [
    'Product Name', 'Variety', 'Farm Name', 'Category', 'Status', 
    'Min Price', 'Max Price', 'Unit'
  ];
  const csvContent = [headers.join(',')];

  products.value.forEach(product => {
    const row = [
      `"${product.productName || ''}"`,
      `"${product.variety || ''}"`,
      `"${product.farmName || ''}"`,
      `"${product.category || ''}"`,
      `"${product.status || ''}"`,
      product.minPrice || 0,
      product.maxPrice || 0,
      `"${product.unit || ''}"`,
    ];
    csvContent.push(row.join(','));
  });

  const blob = new Blob([csvContent.join('\n')], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${categoryName.value}_products_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);

  showNotification('Products exported successfully');
};

onMounted(() => {
  console.log('ProductPerCategory component mounted');
  console.log('Category ID:', categoryId);
  console.log('Category Name:', categoryName.value);
  fetchProducts();
});

onUnmounted(() => {
  if (unsubscribe.value) {
    console.log('Cleaning up products listener');
    unsubscribe.value();
  }
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

.secondary-btn {
  padding: 0.75rem 1.25rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  background-color: #f8f9fa;
  color: #2c3e50;
}

.secondary-btn:hover {
  background-color: #e9ecef;
}

.products-stats {
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
  margin-bottom: 0.5rem;
}

.empty-description {
  font-size: 0.9rem;
  color: #9ca3af;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.product-card {
  background-color: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;
}

.product-card:hover {
  transform: translateY(-5px);
}

.product-image-container {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-image {
  transform: scale(1.05);
}

.product-status {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.product-status.available {
  background-color: #d4edda;
  color: #155724;
}

.product-status.unavailable {
  background-color: #f8d7da;
  color: #721c24;
}

.product-info {
  padding: 1.25rem;
}

.product-name {
  font-size: 1.25rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.product-variety {
  font-size: 0.9rem;
  color: #6c757d;
  margin: 0 0 0.75rem 0;
  font-style: italic;
}

.farm-name {
  font-size: 0.95rem;
  color: #2e5c31;
  margin: 0 0 1rem 0;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.price-info {
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.price-range, .unit-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.price-range:last-child, .unit-info:last-child {
  margin-bottom: 0;
}

.price-label, .unit-label {
  font-size: 0.85rem;
  color: #6c757d;
  font-weight: 500;
}

.price-value, .unit-value {
  font-size: 0.85rem;
  color: #2c3e50;
  font-weight: 600;
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
}

.notification.success {
  background-color: #2ecc71;
}

.notification.error {
  background-color: #e74c3c;
}

.notification.info {
  background-color: #3498db;
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

/* Responsive styles */
@media (max-width: 1400px) {
  .products-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1024px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

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

  .products-stats {
    flex-direction: column;
  }

  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style>
