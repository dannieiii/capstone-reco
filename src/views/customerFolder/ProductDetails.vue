<template>
  <div class="product-details">
    <!-- Header Section -->
    <div class="header">
      <button class="back-button" @click="$router.push('/')">
        <ChevronLeft size="22" />
      </button>
      <h1>Product Details</h1>
      
      <div class="header-buttons">
        <button class="icon-button" @click="toggleCart">
          <ShoppingCart size="18" />
        </button>
      </div>
    </div>
    
    <!-- Product Image -->
    <div class="product-image-container">
      <img v-if="productImage" :src="productImage" alt="Product" class="product-image">
      <div v-else class="placeholder-image">No Image Available</div>
      
      <!-- Popularity Badges -->
      <div v-if="product && product.views > 50" class="popularity-badge views-badge">
        <Eye size="14" />
        <span>{{ product.views }}+ views</span>
      </div>
      <div v-if="product && product.sold > 20" class="popularity-badge sales-badge">
        <ShoppingBag size="14" />
        <span>{{ product.sold }}+ sold</span>
      </div>
      <div v-if="isTrending" class="popularity-badge trending-badge">
        <TrendingUp size="14" />
        <span>Trending</span>
      </div>
    </div>
  
    <!-- Product Information -->
    <div class="product-info">
      <div class="product-header">
        <div>
          <h2>{{ productName }}</h2>
          <p class="product-category">{{ product?.category || 'No Category' }}</p>
        </div>
        <button class="favorite-button">
          <Heart size="20" />
        </button>
      </div>
      
      <div class="price-section">
        <h3 class="price">₱{{ defaultPrice }}</h3>
        <p class="stock">Available: {{ defaultStock }} {{ defaultUnit }}</p>
      </div>
      
      <!-- Unit Selection -->
      <div class="unit-selection" v-if="availableUnits.length > 1">
        <div class="unit-options">
          <button 
            v-for="unit in availableUnits" 
            :key="unit"
            :class="['unit-btn', { active: selectedUnit === unit }]"
            @click="selectUnit(unit)"
          >
            {{ unit }}
          </button>
        </div>
      </div>
      
      <!-- Product Stats Info -->
      <div class="product-stats-container">
        <div class="stat-item">
          <Eye size="16" />
          <span>{{ product?.views || 0 }} Views</span>
        </div>
        <div class="stat-item">
          <ShoppingBag size="16" />
          <span>{{ product?.sold || 0 }} Sold</span>
        </div>
        <div v-if="averageRating > 0" class="stat-item">
          <Star size="16" fill="#FFD700" />
          <span>{{ averageRating.toFixed(1) }} Rating</span>
        </div>
      </div>
      
      <!-- Product Rating Summary -->
      <div class="product-rating">
        <RatingsSummary :productId="productId" @rating-updated="handleRatingUpdate" />
        <button class="see-reviews-btn" @click="toggleReviewsSection">
          {{ showReviewsSection ? 'Hide reviews' : 'See all reviews' }}
        </button>
      </div>
      
      <!-- Reviews Section -->
      <div v-if="showReviewsSection" class="reviews-section">
        <h3 class="section-title">Customer Reviews</h3>
        <ReviewsList :productId="productId" />
      </div>
      
      <div class="guarantee">
        <p>{{ productDescription }}</p>
      </div>
      
      <div class="quantity-section">
        <button class="quantity-button decrease" @click="decreaseQuantity">
          <Minus size="16" />
        </button>
        <span class="quantity">{{ quantity }}</span>
        <button class="quantity-button increase" @click="increaseQuantity">
          <Plus size="16" />
        </button>
        
        <button class="add-to-cart" @click="showAddToCartModal">
          <ShoppingCart size="16" />
          Add to cart
        </button>

        <button class="buy-now-button" @click="showBuyNowModal">
          Buy Now
        </button>
      </div>
      
      <!-- Farm Store Information -->
      <div class="farm-store-info">
          <div class="farm-details">
            <div class="farm-text">
              <h3>{{ farmName || 'Farm information not available' }}</h3>
              <div class="farm-location">
                <MapPin size="14" />
                <span v-if="areasCovered && areasCovered.length > 0">
                  Available in {{ areasCovered.join(', ') }}
                </span>
                <span v-else>
                  Delivery areas not specified
                </span>
              </div>
            </div>
          </div>
          <button 
            class="visit-store-btn" 
            @click="visitStore"
            :disabled="!sellerId"
          >
            <Store size="16" />
            Visit Store
          </button>
        </div>

      <!-- Related Products Section -->
      <div class="related-products">
        <div class="section-header">
          <h3>You might also like</h3>
        </div>
        
        <div class="related-products-grid">
          <div 
            class="related-product" 
            v-for="(product, index) in relatedProducts" 
            :key="index" 
            @click="viewProduct(product)"
          >
            <div class="related-product-image">
              <img :src="product.image || 'https://via.placeholder.com/180'" :alt="product.productName">
              <div v-if="product.isOnSale" class="related-badge sale">
                Sale {{ product.discountPercentage }}%
              </div>
            </div>
            <div class="related-product-info">
              <h4>{{ product.productName }}</h4>
              <p class="related-price">₱{{ getDisplayPrice(product) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <Notification 
      :message="notificationMessage"
      :type="notificationType"
      :visible="showNotification"
    />

    <!-- Add to Cart Modal -->
    <div v-if="showAddToCartModalVisible" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>Add to Cart</h3>
          <button class="close-button" @click="closeAddToCartModal">
            &times;
          </button>
        </div>
        <div class="modal-body">
          <div class="product-info">
            <img :src="productImage" alt="Product" class="modal-product-image">
            <h4>{{ productName }}</h4>
          </div>
          
          <div class="form-group">
            <label>Unit</label>
            <select v-model="modalSelectedUnit" class="form-control">
              <option v-for="unit in availableUnits" :key="unit" :value="unit">
                {{ unit }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Quantity</label>
            <div class="quantity-control">
              <button @click="decreaseModalQuantity" :disabled="modalQuantity <= 1">
                <Minus size="16" />
              </button>
              <input type="number" v-model="modalQuantity" min="1" :max="getMaxQuantity(modalSelectedUnit)">
              <button @click="increaseModalQuantity" :disabled="modalQuantity >= getMaxQuantity(modalSelectedUnit)">
                <Plus size="16" />
              </button>
            </div>
          </div>
          
          <div class="price-summary">
            <div class="price-row">
              <span>Price per {{ modalSelectedUnit }}:</span>
              <span>₱{{ getUnitPrice(modalSelectedUnit).toFixed(2) }}</span>
            </div>
            <div class="price-row total">
              <span>Total:</span>
              <span>₱{{ (getUnitPrice(modalSelectedUnit) * modalQuantity).toFixed(2) }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="confirm-button" @click="handleAddToCartConfirm">
            Add to Cart
          </button>
        </div>
      </div>
    </div>

    <!-- Buy Now Modal -->
    <div v-if="showBuyNowModalVisible" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>Buy Now</h3>
          <button class="close-button" @click="closeBuyNowModal">
            &times;
          </button>
        </div>
        <div class="modal-body">
          <div class="product-info">
            <img :src="productImage" alt="Product" class="modal-product-image">
            <h4>{{ productName }}</h4>
          </div>
          
          <div class="form-group">
            <label>Unit</label>
            <select v-model="modalSelectedUnit" class="form-control">
              <option v-for="unit in availableUnits" :key="unit" :value="unit">
                {{ unit }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Quantity</label>
            <div class="quantity-control">
              <button @click="decreaseModalQuantity" :disabled="modalQuantity <= 1">
                <Minus size="16" />
              </button>
              <input type="number" v-model="modalQuantity" min="1" :max="getMaxQuantity(modalSelectedUnit)">
              <button @click="increaseModalQuantity" :disabled="modalQuantity >= getMaxQuantity(modalSelectedUnit)">
                <Plus size="16" />
              </button>
            </div>
          </div>
          
          <div class="price-summary">
            <div class="price-row">
              <span>Price per {{ modalSelectedUnit }}:</span>
              <span>₱{{ getUnitPrice(modalSelectedUnit).toFixed(2) }}</span>
            </div>
            <div class="price-row total">
              <span>Total:</span>
              <span>₱{{ (getUnitPrice(modalSelectedUnit) * modalQuantity).toFixed(2) }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="confirm-button" @click="handleBuyNowConfirm">
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Notification from '@/components/Notification.vue'; 
import RatingsSummary from '@/components/RatingsSummary.vue';
import ReviewsList from '@/components/ReviewsList.vue';
import { 
  ChevronLeft, 
  ShoppingCart, 
  Heart, 
  Star, 
  Minus, 
  Plus, 
  MapPin,
  Store,
  Eye,
  ShoppingBag,
  TrendingUp
} from 'lucide-vue-next';
import { doc, getDoc, collection, getDocs, query, where, addDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { auth, db } from '@/firebase/firebaseConfig';
import { useRouter } from 'vue-router';
import { ref, computed } from 'vue';

export default {
  components: {
    Notification,
    RatingsSummary,
    ReviewsList,
    ChevronLeft,
    ShoppingCart,
    Heart,
    Star,
    Minus,
    Plus,
    MapPin,
    Store,
    Eye,
    ShoppingBag,
    TrendingUp
  },
  props: {
    productId: {
      type: String,
      required: true
    }
  },
  setup() {
    const router = useRouter();
    const showReviewsSection = ref(false);
    
    const toggleReviewsSection = () => {
      showReviewsSection.value = !showReviewsSection.value;
    };
    
    return { 
      router,
      showReviewsSection,
      toggleReviewsSection
    };
  },
  data() {
    return {
      farmName: 'Loading farm...',
      sellerId: '',
      areasCovered: [],
      showNotification: false,
      notificationMessage: '',
      notificationType: 'success',
      product: null,
      userId: '',
      relatedProducts: [],
      username: '',
      userEmail: '',
      userPhotoURL: '',
      quantity: 1,
      selectedUnit: null,
      availableUnits: [],
      showAddToCartModalVisible: false,
      showBuyNowModalVisible: false,
      modalSelectedUnit: '',
      modalQuantity: 1
    };
  },
  computed: {
    productName() {
      return this.product ? this.product.productName : 'Loading...';
    },
    productImage() {
      return this.product?.image || 'https://via.placeholder.com/200';
    },
    productDescription() {
      return this.product ? this.product.description : 'Loading...';
    },
    defaultUnit() {
      if (this.selectedUnit) return this.selectedUnit;
      if (this.product?.pricePerKilo > 0) return 'kg';
      if (this.product?.pricePerSack > 0) return 'sack';
      if (this.product?.pricePerTali > 0) return 'tali';
      if (this.product?.pricePerKaing > 0) return 'kaing';
      if (this.product?.pricePerBundle > 0) return 'bundle';
      if (this.product?.pricePerTray > 0) return 'tray';
      if (this.product?.pricePerPiece > 0) return 'piece';
      return '';
    },
    defaultPrice() {
      if (!this.product) return '0.00';
      
      let unitPrice = 0;
      switch(this.defaultUnit) {
        case 'kg': unitPrice = this.product.pricePerKilo; break;
        case 'sack': unitPrice = this.product.pricePerSack; break;
        case 'tali': unitPrice = this.product.pricePerTali; break;
        case 'kaing': unitPrice = this.product.pricePerKaing; break;
        case 'bundle': unitPrice = this.product.pricePerBundle; break;
        case 'tray': unitPrice = this.product.pricePerTray; break;
        case 'piece': unitPrice = this.product.pricePerPiece; break;
        default: unitPrice = 0;
      }
      
      return (unitPrice * this.quantity).toFixed(2);
    },
    defaultStock() {
      if (!this.product) return 0;
      
      switch(this.defaultUnit) {
        case 'kg': return this.product.stockPerKilo;
        case 'sack': return this.product.stockPerSack;
        case 'tali': return this.product.stockPerTali;
        case 'kaing': return this.product.stockPerKaing;
        case 'bundle': return this.product.stockPerBundle;
        case 'tray': return this.product.stockPerTray;
        case 'piece': return this.product.stockPerPiece;
        default: return 0;
      }
    },
    isTrending() {
      if (!this.product) return false;
      
      const views = parseInt(this.product.views || 0);
      const sold = parseInt(this.product.sold || 0);
      
      return views > 50 || sold > 20;
    },
    averageRating() {
      if (!this.product) return 0;
      return this.product.rating || 0;
    },
    deliveryAreasText() {
      if (!this.areasCovered || this.areasCovered.length === 0) {
        return 'No delivery areas available';
      }
      return `Available in ${this.areasCovered.join(', ')}`;
    }
  },
  methods: {
    getDisplayPrice(product) {
      if (product.pricePerKilo > 0) return product.pricePerKilo.toFixed(2) + '/kg';
      if (product.pricePerSack > 0) return product.pricePerSack.toFixed(2) + '/sack';
      if (product.pricePerTali > 0) return product.pricePerTali.toFixed(2) + '/tali';
      if (product.pricePerKaing > 0) return product.pricePerKaing.toFixed(2) + '/kaing';
      if (product.pricePerBundle > 0) return product.pricePerBundle.toFixed(2) + '/bundle';
      if (product.pricePerTray > 0) return product.pricePerTray.toFixed(2) + '/tray';
      if (product.pricePerPiece > 0) return product.pricePerPiece.toFixed(2) + '/piece';
      return '0.00';
    },
    selectUnit(unit) {
      this.selectedUnit = unit;
      this.quantity = 1;
    },
    increaseQuantity() {
      if (this.quantity < this.defaultStock) {
        this.quantity++;
      } else {
        this.showNotificationMessage(`Maximum available ${this.defaultUnit} reached`, 'error');
      }
    },
    decreaseQuantity() {
      if (this.quantity > 1) {
        this.quantity--;
      }
    },
    handleRatingUpdate(rating) {
      this.averageRating = rating;
    },
   async fetchProduct() {
  try {
    const productDocRef = doc(db, 'products', this.productId);
    const productDoc = await getDoc(productDocRef);
    
    if (productDoc.exists()) {
      this.product = productDoc.data();
      console.log('Product data:', this.product);
      
      // Check if sellerId exists and is valid
      this.sellerId = this.product.sellerId;
      if (!this.sellerId) {
        console.warn('Product has no sellerId field');
      } else if (typeof this.sellerId !== 'string') {
        console.warn('sellerId is not a string:', this.sellerId);
      }
      
      // Determine available units
      this.availableUnits = [];
      if (this.product.pricePerKilo > 0) this.availableUnits.push('kg');
      if (this.product.pricePerSack > 0) this.availableUnits.push('sack');
      if (this.product.pricePerTali > 0) this.availableUnits.push('tali');
      if (this.product.pricePerKaing > 0) this.availableUnits.push('kaing');
      if (this.product.pricePerBundle > 0) this.availableUnits.push('bundle');
      if (this.product.pricePerTray > 0) this.availableUnits.push('tray');
      if (this.product.pricePerPiece > 0) this.availableUnits.push('piece');
      
      // Set default unit
      this.selectedUnit = this.defaultUnit;
    } else {
      console.error('Product document does not exist');
      this.showNotificationMessage('Product not found', 'error');
    }
  } catch (error) {
    console.error('Error fetching product:', error);
    this.showNotificationMessage('Failed to load product details', 'error');
  }
},
    async fetchFarmDetails() {
  if (!this.sellerId) {
    console.log('No sellerId available');
    this.farmName = 'Farm not available';
    this.areasCovered = [];
    return;
  }

  try {
    console.log(`Fetching seller document with ID: ${this.sellerId}`);
    const sellerDocRef = doc(db, 'sellers', this.sellerId);
    const sellerDoc = await getDoc(sellerDocRef);

    if (!sellerDoc.exists()) {
      console.error('Seller document does not exist in sellers collection');
      // List all seller IDs for debugging
      const sellersQuery = query(collection(db, 'sellers'));
      const sellersSnapshot = await getDocs(sellersQuery);
      const allSellerIds = sellersSnapshot.docs.map(doc => doc.id);
      console.log('Existing seller IDs:', allSellerIds);
      
      this.farmName = 'Farm not available';
      this.areasCovered = [];
      return;
    }

    const sellerData = sellerDoc.data();
    console.log('Seller data found:', sellerData);
    
    // Ensure required fields exist
    if (!sellerData.farmName) {
      console.warn('Seller document exists but has no farmName field');
    }
    if (!sellerData.areasCovered) {
      console.warn('Seller document exists but has no areasCovered field');
    }

    this.farmName = sellerData.farmName || 'Farm not specified';
    this.areasCovered = sellerData.areasCovered || [];
    
  } catch (error) {
    console.error('Error fetching seller details:', error);
    this.farmName = 'Farm not available';
    this.areasCovered = [];
  }
},
    async fetchRelatedProducts() {
      try {
        let productsQuery;
        
        if (this.product && this.product.category) {
          productsQuery = query(
            collection(db, 'products'), 
            where('category', '==', this.product.category)
          );
        } else {
          productsQuery = collection(db, 'products');
        }
        
        const productsSnapshot = await getDocs(productsQuery);
        
        this.relatedProducts = productsSnapshot.docs
          .filter(doc => doc.id !== this.productId)
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              productName: data.productName || 'Product',
              pricePerKilo: Number(data.pricePerKilo) || 0,
              pricePerSack: Number(data.pricePerSack) || 0,
              pricePerTali: Number(data.pricePerTali) || 0,
              pricePerKaing: Number(data.pricePerKaing) || 0,
              pricePerBundle: Number(data.pricePerBundle) || 0,
              pricePerTray: Number(data.pricePerTray) || 0,
              pricePerPiece: Number(data.pricePerPiece) || 0,
              isOnSale: data.isOnSale || false,
              discountPercentage: data.discountPercentage || 0
            };
          })
          .slice(0, 4);
      } catch (error) {
        console.error('Failed to fetch related products:', error);
      }
    },
    getUnitPrice(unit) {
      switch(unit) {
        case 'kg': return this.product.pricePerKilo;
        case 'sack': return this.product.pricePerSack;
        case 'tali': return this.product.pricePerTali;
        case 'kaing': return this.product.pricePerKaing;
        case 'bundle': return this.product.pricePerBundle;
        case 'tray': return this.product.pricePerTray;
        case 'piece': return this.product.pricePerPiece;
        default: return 0;
      }
    },
    getMaxQuantity(unit) {
      switch(unit) {
        case 'kg': return this.product.stockPerKilo;
        case 'sack': return this.product.stockPerSack;
        case 'tali': return this.product.stockPerTali;
        case 'kaing': return this.product.stockPerKaing;
        case 'bundle': return this.product.stockPerBundle;
        case 'tray': return this.product.stockPerTray;
        case 'piece': return this.product.stockPerPiece;
        default: return 0;
      }
    },
    showAddToCartModal() {
      this.modalSelectedUnit = this.defaultUnit;
      this.modalQuantity = 1;
      this.showAddToCartModalVisible = true;
    },
    showBuyNowModal() {
      this.modalSelectedUnit = this.defaultUnit;
      this.modalQuantity = 1;
      this.showBuyNowModalVisible = true;
    },
    closeAddToCartModal() {
      this.showAddToCartModalVisible = false;
    },
    closeBuyNowModal() {
      this.showBuyNowModalVisible = false;
    },
    increaseModalQuantity() {
      if (this.modalQuantity < this.getMaxQuantity(this.modalSelectedUnit)) {
        this.modalQuantity++;
      } else {
        this.showNotificationMessage(`Maximum available ${this.modalSelectedUnit} reached`, 'error');
      }
    },
    decreaseModalQuantity() {
      if (this.modalQuantity > 1) {
        this.modalQuantity--;
      }
    },
    async handleAddToCartConfirm() {
      if (!auth.currentUser) {
        this.showNotificationMessage('Please sign in to add items to cart', 'error');
        return;
      }

      try {
        const cartItem = {
          userId: auth.currentUser.uid,
          productId: this.productId,
          productName: this.productName,
          productImage: this.productImage,
          unit: this.modalSelectedUnit,
          quantity: this.modalQuantity,
          unitPrice: this.getUnitPrice(this.modalSelectedUnit),
          totalPrice: this.getUnitPrice(this.modalSelectedUnit) * this.modalQuantity,
          farmName: this.farmName,
          sellerId: this.sellerId,
          createdAt: serverTimestamp()
        };

        await addDoc(collection(db, 'carts'), cartItem);
        this.closeAddToCartModal();
        this.showNotificationMessage('Item added to cart successfully', 'success');
      } catch (error) {
        console.error('Error adding to cart:', error);
        this.showNotificationMessage('Failed to add item to cart', 'error');
      }
    },
    handleBuyNowConfirm() {
      if (!this.sellerId) {
        this.showNotificationMessage('Seller information is missing', 'error');
        return;
      }

      const buyNowItem = {
        productId: this.productId,
        productName: this.productName,
        productImage: this.productImage,
        unit: this.modalSelectedUnit,
        quantity: this.modalQuantity,
        unitPrice: this.getUnitPrice(this.modalSelectedUnit),
        totalPrice: this.getUnitPrice(this.modalSelectedUnit) * this.modalQuantity,
        sellerId: this.sellerId,
        farmName: this.farmName || 'Unknown Farm',
        isBuyNow: true
      };

      this.closeBuyNowModal();
      this.router.push({
        name: 'Checkout',
        query: {
          items: JSON.stringify([buyNowItem])
        }
      });
    },
    visitStore() {
      if (this.sellerId) {
        this.router.push({
          name: 'farmStore',
          params: { sellerId: this.sellerId }
        });
      }
    },
    viewProduct(product) {
      this.router.push({ path: `/product/${product.id}` });
    },
    toggleCart() {
      this.router.push('/cart');
    },
    showNotificationMessage(message, type) {
      this.notificationMessage = message;
      this.notificationType = type;
      this.showNotification = true;
      
      setTimeout(() => {
        this.showNotification = false;
      }, 3000);
    },
    async incrementViewCount() {
      try {
        const productRef = doc(db, 'products', this.productId);
        await updateDoc(productRef, {
          views: increment(1)
        });
      } catch (error) {
        console.error('Error incrementing view count:', error);
      }
    }
  },
  async mounted() {
  console.log('Component mounted, productId:', this.productId);
  
  await this.fetchProduct();
  console.log('Product fetched. Seller ID:', this.sellerId);
  
  if (this.sellerId) {
    console.log('Fetching farm details for seller:', this.sellerId);
    await this.fetchFarmDetails();
  } else {
    console.warn('No sellerId found in product');
  }
  
  await this.fetchRelatedProducts();
  await this.incrementViewCount();

}
};
</script>

<style scoped>
.product-details {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
  padding-bottom: 80px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 15px;
  background-color: #2e5c31;
  color: white;
}

.back-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: none;
  border: none;
  cursor: pointer;
}

.header h1 {
  font-size: 18px;
  font-weight: 600;
}

.header-buttons {
  display: flex;
  gap: 8px;
  position: relative;
}

.icon-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.product-image-container {
  height: 250px;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.product-image {
  max-width: 80%;
  max-height: 80%;
  object-fit: contain;
}

/* Popularity badges */
.popularity-badge {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.views-badge {
  top: 15px;
  left: 15px;
  background-color: rgba(52, 152, 219, 0.9);
  color: white;
}

.sales-badge {
  top: 15px;
  right: 15px;
  background-color: rgba(46, 204, 113, 0.9);
  color: white;
}

.trending-badge {
  bottom: 15px;
  right: 15px;
  background-color: rgba(233, 30, 99, 0.9);
  color: white;
}

.product-info {
  padding: 20px 15px;
}

.product-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

.product-header h2 {
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.product-category {
  font-size: 0.9rem;
  color: #6b7280;
}

.favorite-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e74c3c;
  border: 1px solid #e0e0e0;
  background-color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.price-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.price {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2e5c31;
}

.stock {
  color: #666;
  font-size: 0.9rem;
}

/* Unit Selection */
.unit-selection {
  margin-bottom: 15px;
}

.unit-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.unit-btn {
  padding: 8px 12px;
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.unit-btn:hover {
  background-color: #e5e7eb;
}

.unit-btn.active {
  background-color: #2e5c31;
  color: white;
  border-color: #2e5c31;
}

/* Product Stats Container */
.product-stats-container {
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin: 10px 0 15px;
  padding: 12px;
  background-color: #f2f9f2;
  border-radius: 10px;
  gap: 5px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 70px;
  text-align: center;
}

.stat-item svg {
  color: #2e5c31;
}

.stat-item span {
  font-size: 12px;
  font-weight: 500;
  color: #444;
}

/* Product Rating */
.product-rating {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.see-reviews-btn {
  margin-left: auto;
  color: #2e5c31;
  font-size: 0.9rem;
  font-weight: 500;
  background: none;
  border: none;
  cursor: pointer;
}

/* Reviews Section */
.reviews-section {
  background-color: white;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 15px 0;
  color: #333;
}

.guarantee {
  background-color: white;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.guarantee p {
  color: #555;
  line-height: 1.5;
  font-size: 0.95rem;
}

/* Quantity Section */
.quantity-section {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 25px;
}

.quantity-button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border: 1px solid #e0e0e0;
  color: #2e5c31;
}

.quantity {
  font-size: 1.1rem;
  width: 30px;
  text-align: center;
}

.add-to-cart, .buy-now-button {
  flex: 1;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  gap: 8px;
}

.add-to-cart {
  background-color: white;
  color: #2e5c31;
  border: 1px solid #2e5c31;
}

.buy-now-button {
  background-color: #2e5c31;
  color: white;
}

/* Farm Store Info */
.farm-store-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: white;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.farm-details {
  display: flex;
  align-items: center;
  gap: 12px;
}

.farm-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.farm-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.farm-text h3 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.farm-location {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.farm-location span {
  display: inline-block;
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Button Styles */
.visit-store-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background-color: #f0f8f0;
  color: #2e5c31;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.visit-store-btn:hover {
  background-color: #e0f0e0;
}

/* Related Products */
.related-products {
  margin-top: 25px;
}

.section-header {
  margin-bottom: 15px;
}

.section-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.related-products-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.related-product {
  background-color: white;
  border-radius: 10px;
  overflow: hidden;
}
.related-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  color: white;
}

.related-badge.sale {
  background-color: #ef4444;
}

.related-product-info {
  padding: 10px;
}

.related-product-info h4 {
  font-size: 0.9rem;
  margin: 0 0 8px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.related-price {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2e5c31;
  margin: 0;
}

.modal-overlay {
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

.modal {
  background-color: white;
  border-radius: 10px;
  width: 90%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #2e5c31;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.modal-product-image {
  width: 100px;
  height: 100px;
  object-fit: contain;
  display: block;
  margin: 0 auto 15px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #444;
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
}

.quantity-control {
  display: flex;
  align-items: center;
}

.quantity-control button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border: 1px solid #e0e0e0;
  color: #2e5c31;
  cursor: pointer;
}

.quantity-control button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-control input {
  width: 50px;
  text-align: center;
  margin: 0 10px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.price-summary {
  margin-top: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 5px;
}

.price-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.price-row.total {
  font-weight: bold;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
}

.confirm-button {
  padding: 10px 20px;
  background-color: #2e5c31;
  color: white;
  border: none;
  border-radius: 5px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.confirm-button:hover {
  background-color: #1e4a21;
}

@media (max-width: 480px) {
  .quantity-section {
    flex-wrap: wrap;
  }
  
  .add-to-cart, .buy-now-button {
    flex: 0 0 100%;
    margin-top: 10px;
  }
  
  .product-stats-container {
    padding: 8px;
  }
  
  .stat-item {
    min-width: 60px;
  }
  
  .popularity-badge {
    font-size: 10px;
    padding: 4px 8px;
  }
}
</style>