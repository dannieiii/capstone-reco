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
        <div>
          <h3 class="price">₱{{ defaultPrice }}</h3>
          <div v-if="selectedPurchaseType !== 'normal'" class="price-mode-note">
            <small v-if="selectedPurchaseType === 'preorder'">Pre-Order Price</small>
            <small v-else-if="selectedPurchaseType === 'wholesale'">Wholesale Price</small>
          </div>
        </div>
        <p class="stock" :class="{ 'out-of-stock': isOutOfStock(defaultUnit) }">
          {{ isOutOfStock(defaultUnit) ? 'Out of Stock' : `Available: ${defaultStock} ${defaultUnit}` }}
        </p>
      </div>
      
  <!-- Purchase Type Selection removed as requested -->

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
        <button 
          class="quantity-button decrease" 
          @click="decreaseQuantity"
          :disabled="isOutOfStock(defaultUnit)"
        >
          <Minus size="16" />
        </button>
        <span class="quantity">{{ quantity }}</span>
        <button 
          class="quantity-button increase" 
          @click="increaseQuantity"
          :disabled="isOutOfStock(defaultUnit)"
        >
          <Plus size="16" />
        </button>
        
        <button 
          class="add-to-cart" 
          @click="showAddToCartModal"
          :disabled="isOutOfStock(defaultUnit)"
        >
          <ShoppingCart size="16" />
          {{ isOutOfStock(defaultUnit) ? 'Out of Stock' : 'Add to cart' }}
        </button>

        <button 
          class="buy-now-button" 
          @click="showBuyNowModal"
          :disabled="isOutOfStock(defaultUnit)"
        >
          {{ isOutOfStock(defaultUnit) ? 'Out of Stock' : 'Buy Now' }}
        </button>
      </div>

      <!-- Purchase Type Selection removed by request -->
      
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
              <button 
                @click="decreaseModalQuantity" 
                :disabled="modalQuantity <= 1"
              >
                <Minus size="16" />
              </button>
              <input 
                type="number" 
                v-model="modalQuantity" 
                min="1" 
                :max="getMaxQuantity(modalSelectedUnit)"
                @input="validateModalQuantity"
              >
              <button 
                @click="increaseModalQuantity" 
                :disabled="modalQuantity >= getMaxQuantity(modalSelectedUnit) || getMaxQuantity(modalSelectedUnit) === 0"
              >
                <Plus size="16" />
              </button>
            </div>
            <small v-if="getMaxQuantity(modalSelectedUnit) === 0" class="stock-warning">
              This item is currently out of stock
            </small>
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
          <button 
            class="confirm-button" 
            @click="handleAddToCartConfirm"
            :disabled="getMaxQuantity(modalSelectedUnit) === 0"
          >
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
              <button 
                @click="decreaseModalQuantity" 
                :disabled="modalQuantity <= 1"
              >
                <Minus size="16" />
              </button>
              <input 
                type="number" 
                v-model="modalQuantity" 
                min="1" 
                :max="getMaxQuantity(modalSelectedUnit)"
                @input="validateModalQuantity"
              >
              <button 
                @click="increaseModalQuantity" 
                :disabled="modalQuantity >= getMaxQuantity(modalSelectedUnit) || getMaxQuantity(modalSelectedUnit) === 0"
              >
                <Plus size="16" />
              </button>
            </div>
            <small v-if="getMaxQuantity(modalSelectedUnit) === 0" class="stock-warning">
              This item is currently out of stock
            </small>
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
          <button 
            class="confirm-button" 
            @click="handleBuyNowConfirm"
            :disabled="getMaxQuantity(modalSelectedUnit) === 0"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>

    <!-- Login Required Modal -->
    <div v-if="showLoginModal" class="modal-overlay">
      <div class="login-modal">
        <div class="login-header">
          <button class="close-button" @click="closeLoginModal">
            &times;
          </button>
        </div>
        
        <div class="login-content">
          <div class="app-branding">
            <img src="@/assets/logo.png" alt="FarmXpress Logo" class="logo" />
            <h1 class="app-title">FarmXpress</h1>
            <h3 class="app-subtitle">MOBILE APP</h3>
          </div>
          
          <div class="login-form">
            <div class="input-group">
              <div class="input-wrapper">
                <User size="18" class="input-icon" />
                <input 
                  type="email" 
                  placeholder="Email address" 
                  class="login-input"
                  autocomplete="email"
                  inputmode="email"
                  spellcheck="false"
                  aria-label="Email address"
                  v-model="loginEmail"
                />
              </div>
            </div>
            
            <div class="input-group">
              <div class="input-wrapper">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="input-icon">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <circle cx="12" cy="16" r="1"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input 
                  :type="showPassword ? 'text' : 'password'" 
                  placeholder="Password" 
                  class="login-input"
                  autocomplete="current-password"
                  aria-label="Password"
                  v-model="loginPassword"
                />
                <button 
                  type="button" 
                  class="password-toggle"
                  @click="togglePassword"
                >
                  <svg v-if="showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="form-options">
              <label class="remember-me">
                <input type="checkbox" v-model="rememberMe" />
                <span class="checkmark"></span>
                Remember Me
              </label>
              <a href="#" class="forgot-password" @click="goToForgotPassword">Forgot Password?</a>
            </div>
            
            <button class="login-button" @click="handleEmailLogin" :disabled="isLoggingIn">
              {{ isLoggingIn ? 'Logging in...' : 'Login' }}
            </button>
            
            <div class="login-divider">
              <span>or</span>
            </div>
            
            <button class="google-login-btn" @click="loginWithGoogle">
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.53H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                <path fill="#FBBC05" d="M4.5 10.49a4.8 4.8 0 0 1 0-3.07V5.35H1.83a8 8 0 0 0 0 7.17l2.67-2.03z"/>
                <path fill="#EA4335" d="M8.98 4.72c1.16 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.35L4.5 7.42c.64-1.9 2.26-3.2 4.48-3.2z"/>
              </svg>
              Continue with Google
            </button>
            
            <p class="signup-text">
              Don't have an account? 
              <a href="#" @click="goToSignup" class="signup-link">Create an account</a>
            </p>
          </div>
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
  TrendingUp,
  User // Add User icon import
} from 'lucide-vue-next';
import { 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  signInWithPopup,
  signInWithEmailAndPassword,
  OAuthProvider,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence
} from 'firebase/auth';
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
  TrendingUp,
  User
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
      sellerInfo: null, // Add this line
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
      modalQuantity: 1,
      showLoginModal: false,
      pendingAction: null, // 'cart' or 'buynow'
      loginEmail: '',
      loginPassword: '',
      rememberMe: false,
      showPassword: false,
      isLoggingIn: false,
      selectedPurchaseType: 'normal'
    };
  },
  computed: {
    forcedPurchaseType() {
      const mode = this.$route?.query?.mode;
      return mode === 'preorder' || mode === 'wholesale' ? mode : null;
    },
    showPurchaseTypeSelector() {
      return this.availablePurchaseTypes.length > 1 && !this.forcedPurchaseType;
    },
    isPreOrderProduct() {
      return this.product?.preOrders === true || this.product?.isPreOrder === true;
    },
    isWholesaleProduct() {
      return this.product?.wholesaleAvailable === true;
    },
    availablePurchaseTypes() {
      const types = ['normal'];
      if (this.isPreOrderProduct) types.push('preorder');
      if (this.isWholesaleProduct) types.push('wholesale');
      return types;
    },
    wholesaleMinQty() {
      // Support multiple possible field names
      const vals = [
        Number(this.product?.whominWholesaleQty), // as seen in HomeView
        Number(this.product?.minWholesaleQty),
        Number(this.product?.minimumWholesaleQty)
      ].filter(v => !isNaN(v) && v > 0);
      return vals.length ? vals[0] : 1;
    },
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
      const unitPrice = this.getUnitPrice(this.defaultUnit);
      return (Number(unitPrice || 0) * this.quantity).toFixed(2);
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
    increaseModalQuantity() {
      const maxQuantity = this.getMaxQuantity(this.modalSelectedUnit);
      if (this.modalQuantity < maxQuantity) {
        this.modalQuantity++;
      } else {
        this.showNotificationMessage(`Cannot add more items. Only ${maxQuantity} ${this.modalSelectedUnit} available in stock`, 'error');
      }
    },
    
    decreaseModalQuantity() {
      if (this.modalQuantity > 1) {
        this.modalQuantity--;
      }
    },
    getDisplayPrice(product) {
      // Prefer wholesale price for related cards when available
      if (product.wholesaleAvailable && Number(product.wholesalePrice) > 0) {
        return Number(product.wholesalePrice).toFixed(2) + '/kg';
      }
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
    selectPurchaseType(type) {
      this.selectedPurchaseType = type;
      // Adjust quantity for wholesale minimums
      if (type === 'wholesale') {
        if (this.quantity < this.wholesaleMinQty) this.quantity = this.wholesaleMinQty;
      }
    },
    increaseQuantity() {
      if (this.quantity < this.defaultStock) {
        this.quantity++;
      } else {
        this.showNotificationMessage(`Maximum available ${this.defaultUnit} reached`, 'error');
      }
    },
    decreaseQuantity() {
      if (this.selectedPurchaseType === 'wholesale') {
        if (this.quantity > this.wholesaleMinQty) {
          this.quantity--;
        } else {
          this.quantity = this.wholesaleMinQty;
        }
      } else if (this.quantity > 1) {
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
          console.log('Full product data:', this.product);
          
          // Check sellerId field specifically
          this.sellerId = this.product.sellerId;
          console.log('Raw sellerId from product:', this.sellerId);
          console.log('Type of sellerId:', typeof this.sellerId);
          console.log('sellerId length:', this.sellerId ? this.sellerId.length : 'undefined');
          
          if (!this.sellerId) {
            console.warn('Product has no sellerId field');
          } else {
            // Clean the sellerId (remove any whitespace)
            this.sellerId = this.sellerId.trim();
            console.log('Cleaned sellerId:', this.sellerId);
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
    this.farmName = 'Seller not found';
    this.areasCovered = [];
    return;
  }

  try {
    console.log(`Fetching farm details for seller: ${this.sellerId}`);
    
    // Query the sellers collection where userId field matches the sellerId
    const sellersQuery = query(
      collection(db, 'sellers'), 
      where('userId', '==', this.sellerId)
    );
    
    const sellersSnapshot = await getDocs(sellersQuery);
    
    if (sellersSnapshot.empty) {
      console.error('No seller found with userId:', this.sellerId);
      this.farmName = 'Seller not found';
      this.areasCovered = ['Contact seller for delivery info'];
      return;
    }
    
    // Get the first matching seller document
    const sellerDoc = sellersSnapshot.docs[0];
    const sellerData = sellerDoc.data();
    console.log('Seller document found:', sellerData);
    
    // Extract farm name from farmDetails map
    if (sellerData.farmDetails && sellerData.farmDetails.farmName) {
      this.farmName = sellerData.farmDetails.farmName;
      console.log('Farm name found:', this.farmName);
    } else {
      // Fallback to personal info
      const firstName = sellerData.personalInfo?.firstName || '';
      const lastName = sellerData.personalInfo?.lastName || '';
      this.farmName = firstName && lastName ? `${firstName} ${lastName}'s Farm` : 'Farm name not available';
      console.log('Using fallback farm name:', this.farmName);
    }
    
    // Extract areas covered from deliveryInfo map
    if (sellerData.deliveryInfo && sellerData.deliveryInfo.areasCovered && Array.isArray(sellerData.deliveryInfo.areasCovered)) {
      this.areasCovered = sellerData.deliveryInfo.areasCovered;
      console.log('Areas covered found:', this.areasCovered);
    } else {
      this.areasCovered = ['Area coverage not available'];
      console.log('No delivery areas found, using fallback');
    }
    
  } catch (error) {
    console.error('Error fetching farm details:', error);
    this.farmName = 'Error loading seller info';
    this.areasCovered = ['Contact seller for delivery info'];
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
      // Pre-Order mode
      if (this.selectedPurchaseType === 'preorder' && this.isPreOrderProduct) {
        const preOrderUnitMap = {
          kg: ['preOrderPricePerKilo', 'preorderPricePerKilo'],
          sack: ['preOrderPricePerSack', 'preorderPricePerSack'],
          tali: ['preOrderPricePerTali', 'preorderPricePerTali'],
          kaing: ['preOrderPricePerKaing', 'preorderPricePerKaing'],
          bundle: ['preOrderPricePerBundle', 'preorderPricePerBundle'],
          tray: ['preOrderPricePerTray', 'preorderPricePerTray'],
          piece: ['preOrderPricePerPiece', 'preorderPricePerPiece']
        };
        const specificKeys = preOrderUnitMap[unit] || [];
        for (const key of specificKeys) {
          const val = Number(this.product?.[key]);
          if (!isNaN(val) && val > 0) return val;
        }
        const genericPreOrder = [
          Number(this.product?.preOrderPrice),
          Number(this.product?.preorderPrice),
          Number(this.product?.price)
        ].find(v => !isNaN(v) && v > 0);
        if (genericPreOrder) return genericPreOrder;
      }

  // Wholesale mode
  if (this.selectedPurchaseType === 'wholesale' && this.isWholesaleProduct) {
        // Optional unit-specific wholesale fields (support if present)
        const wholesaleUnitMap = {
          kg: ['wholesalePricePerKilo', 'wholesalePricePerKg'],
          sack: ['wholesalePricePerSack'],
          tali: ['wholesalePricePerTali'],
          kaing: ['wholesalePricePerKaing'],
          bundle: ['wholesalePricePerBundle'],
          tray: ['wholesalePricePerTray'],
          piece: ['wholesalePricePerPiece']
        };
        const wKeys = wholesaleUnitMap[unit] || [];
        for (const key of wKeys) {
          const val = Number(this.product?.[key]);
          if (!isNaN(val) && val > 0) return val;
        }
        // Generic wholesale price (commonly per kg)
        const genericWholesale = Number(this.product?.wholesalePrice);
        if (!isNaN(genericWholesale) && genericWholesale > 0) {
          // If selected unit is kg or unit-specific not set, apply generic wholesale
          return genericWholesale;
        }
      }

      // Regular pricing per unit (fallback)
      switch(unit) {
        case 'kg': return Number(this.product.pricePerKilo) || 0;
        case 'sack': return Number(this.product.pricePerSack) || 0;
        case 'tali': return Number(this.product.pricePerTali) || 0;
        case 'kaing': return Number(this.product.pricePerKaing) || 0;
        case 'bundle': return Number(this.product.pricePerBundle) || 0;
        case 'tray': return Number(this.product.pricePerTray) || 0;
        case 'piece': return Number(this.product.pricePerPiece) || 0;
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
      if (!this.isUserAuthenticated()) {
        this.pendingAction = 'cart';
        this.showLoginModal = true;
        return;
      }
      
      this.modalSelectedUnit = this.defaultUnit;
  this.modalQuantity = this.selectedPurchaseType === 'wholesale' ? Math.max(1, this.wholesaleMinQty) : 1;
      this.showAddToCartModalVisible = true;
    },
    showBuyNowModal() {
      if (!this.isUserAuthenticated()) {
        this.pendingAction = 'buynow';
        this.showLoginModal = true;
        return;
      }
      
      this.modalSelectedUnit = this.defaultUnit;
  this.modalQuantity = this.selectedPurchaseType === 'wholesale' ? Math.max(1, this.wholesaleMinQty) : 1;
      this.showBuyNowModalVisible = true;
    },
    closeAddToCartModal() {
      this.showAddToCartModalVisible = false;
    },
    closeBuyNowModal() {
      this.showBuyNowModalVisible = false;
    },
    closeLoginModal() {
      this.showLoginModal = false;
      this.pendingAction = null;
      // Reset form
      this.loginEmail = '';
      this.loginPassword = '';
      this.rememberMe = false;
      this.showPassword = false;
      this.isLoggingIn = false;
    },
    continueWithPendingAction() {
      if (this.pendingAction === 'cart') {
        this.modalSelectedUnit = this.defaultUnit;
        this.modalQuantity = 1;
        this.showAddToCartModalVisible = true;
      } else if (this.pendingAction === 'buynow') {
        this.modalSelectedUnit = this.defaultUnit;
        this.modalQuantity = 1;
        this.showBuyNowModalVisible = true;
      }
      
      this.closeLoginModal();
    },
    togglePassword() {
      this.showPassword = !this.showPassword;
    },
    async handleEmailLogin() {
      if (!this.loginEmail || !this.loginPassword) {
        this.showNotificationMessage('Please enter both email and password', 'error');
        return;
      }
      
      this.isLoggingIn = true;
      
      try {
        // Set persistence based on remember me checkbox
        if (this.rememberMe) {
          await setPersistence(auth, browserLocalPersistence);
          localStorage.setItem("authPersist", "true");
          localStorage.setItem("rememberMe", "true");
        } else {
          await setPersistence(auth, browserSessionPersistence);
          sessionStorage.setItem("authPersist", "true");
          localStorage.removeItem("rememberMe");
        }
        
        // Sign in with email and password
        const userCredential = await signInWithEmailAndPassword(auth, this.loginEmail, this.loginPassword);
        const user = userCredential.user;
        
        // Check email verification for email/password users
        if (!user.emailVerified) {
          await auth.signOut();
          this.showNotificationMessage('Please verify your email before logging in', 'warning');
          this.isLoggingIn = false;
          return;
        }
        
        // Store user session data
        this.storeUserSession(user);
        
        this.showNotificationMessage('Successfully logged in!', 'success');
        this.continueWithPendingAction();
        
      } catch (error) {
        console.error('Email login error:', error);
        let errorMessage = 'Login failed';
        
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Invalid password';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed attempts. Please try again later';
            break;
          default:
            errorMessage = 'Invalid email or password';
        }
        
        this.showNotificationMessage(errorMessage, 'error');
      } finally {
        this.isLoggingIn = false;
      }
    },
    async loginWithGoogle() {
      try {
        // Set persistence based on remember me checkbox (if applicable)
        if (this.rememberMe) {
          await setPersistence(auth, browserLocalPersistence);
          localStorage.setItem("authPersist", "true");
          localStorage.setItem("rememberMe", "true");
        } else {
          await setPersistence(auth, browserSessionPersistence);
          sessionStorage.setItem("authPersist", "true");
          localStorage.removeItem("rememberMe");
        }
        
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Store user session data
        this.storeUserSession(user);
        
        this.showNotificationMessage('Successfully logged in with Google!', 'success');
        this.continueWithPendingAction();
        
      } catch (error) {
        console.error('Google login error:', error);
        this.showNotificationMessage('Failed to login with Google', 'error');
      }
    },
    async loginWithFacebook() {
      try {
        // Set persistence based on remember me checkbox
        if (this.rememberMe) {
          await setPersistence(auth, browserLocalPersistence);
          localStorage.setItem("authPersist", "true");
          localStorage.setItem("rememberMe", "true");
        } else {
          await setPersistence(auth, browserSessionPersistence);
          sessionStorage.setItem("authPersist", "true");
          localStorage.removeItem("rememberMe");
        }
        
        const provider = new FacebookAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Store user session data
        this.storeUserSession(user);
        
        this.showNotificationMessage('Successfully logged in with Facebook!', 'success');
        this.continueWithPendingAction();
        
      } catch (error) {
        console.error('Facebook login error:', error);
        this.showNotificationMessage('Failed to login with Facebook', 'error');
      }
    },
    async loginWithApple() {
      try {
        // Set persistence based on remember me checkbox
        if (this.rememberMe) {
          await setPersistence(auth, browserLocalPersistence);
          localStorage.setItem("authPersist", "true");
          localStorage.setItem("rememberMe", "true");
        } else {
          await setPersistence(auth, browserSessionPersistence);
          sessionStorage.setItem("authPersist", "true");
          localStorage.removeItem("rememberMe");
        }
        
        const provider = new OAuthProvider('apple.com');
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Store user session data
        this.storeUserSession(user);
        
        this.showNotificationMessage('Successfully logged in with Apple!', 'success');
        this.continueWithPendingAction();
        
      } catch (error) {
        console.error('Apple login error:', error);
        this.showNotificationMessage('Failed to login with Apple', 'error');
      }
    },
    
    // Store user session data
    storeUserSession(user) {
      const userSessionData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        loginTime: new Date().toISOString()
      };
      
      if (this.rememberMe) {
        // Store in localStorage for persistent login
        localStorage.setItem('userSession', JSON.stringify(userSessionData));
        localStorage.setItem('lastLoginMethod', 'email');
      } else {
        // Store in sessionStorage for session-only login
        sessionStorage.setItem('userSession', JSON.stringify(userSessionData));
        sessionStorage.setItem('lastLoginMethod', 'email');
      }
    },
    
    // Check for existing session on component mount
    checkExistingSession() {
      // Check localStorage first (persistent login)
      const localStorageSession = localStorage.getItem('userSession');
      const sessionStorageSession = sessionStorage.getItem('userSession');
      
      if (localStorageSession) {
        try {
          const userData = JSON.parse(localStorageSession);
          console.log('Found persistent user session:', userData.email);
          // Session exists, user is logged in
          return true;
        } catch (error) {
          console.error('Error parsing localStorage session:', error);
          localStorage.removeItem('userSession');
        }
      } else if (sessionStorageSession) {
        try {
          const userData = JSON.parse(sessionStorageSession);
          console.log('Found session user session:', userData.email);
          // Session exists, user is logged in
          return true;
        } catch (error) {
          console.error('Error parsing sessionStorage session:', error);
          sessionStorage.removeItem('userSession');
        }
      }
      
      return false;
    },
    
    // Clear session data on logout
    clearUserSession() {
      localStorage.removeItem('userSession');
      localStorage.removeItem('authPersist');
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('lastLoginMethod');
      sessionStorage.removeItem('userSession');
      sessionStorage.removeItem('authPersist');
      sessionStorage.removeItem('lastLoginMethod');
    },
    
    // Updated authentication check
    isUserAuthenticated() {
      // Check Firebase auth first
      if (auth.currentUser) {
        return true;
      }
      
      // Check stored session data
      return this.checkExistingSession();
    },
    closeLoginModal() {
      this.showLoginModal = false;
      this.pendingAction = null;
      // Reset form
      this.loginEmail = '';
      this.loginPassword = '';
      this.rememberMe = false;
      this.showPassword = false;
      this.isLoggingIn = false;
    },
    goToForgotPassword() {
      this.closeLoginModal();
      this.router.push('/forgot-password');
    },
    goToSignup() {
      this.closeLoginModal();
      this.router.push('/signup');
    },
    visitStore() {
      if (this.sellerId) {
        this.router.push({
          name: 'farmStore',
          params: { sellerId: this.sellerId }
        });
      } else {
        this.showNotificationMessage('Seller information not available', 'error');
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
    },

    // Add this method to get complete seller information
    async fetchSellerInfo() {
      if (!this.sellerId) return;

      try {
        // Query the sellers collection where userId field matches the sellerId
        const sellersQuery = query(
          collection(db, 'sellers'), 
          where('userId', '==', this.sellerId)
        );
        
        const sellersSnapshot = await getDocs(sellersQuery);
        
        if (!sellersSnapshot.empty) {
          const sellerDoc = sellersSnapshot.docs[0];
          const sellerData = sellerDoc.data();
          
          // Store additional seller info if needed
          this.sellerInfo = {
            farmName: sellerData.farmDetails?.farmName || 'Farm not specified',

            // Delivery info
            areasCovered: sellerData.deliveryInfo?.areasCovered || [],
            
     
          };
          
          console.log('Complete seller info:', this.sellerInfo);
        }
      } catch (error) {
        console.error('Error fetching seller info:', error);
      }
    },
    // Add method to get current user data
    getCurrentUserData() {
      // Check localStorage first (persistent login)
      const localStorageSession = localStorage.getItem('userSession');
      const sessionStorageSession = sessionStorage.getItem('userSession');
      
      if (localStorageSession) {
        try {
          return JSON.parse(localStorageSession);
        } catch (error) {
          console.error('Error parsing localStorage session:', error);
          localStorage.removeItem('userSession');
        }
      } else if (sessionStorageSession) {
        try {
          return JSON.parse(sessionStorageSession);
        } catch (error) {
          console.error('Error parsing sessionStorage session:', error);
          sessionStorage.removeItem('userSession');
        }
      }
      
      // Check Firebase auth as fallback
      if (auth.currentUser) {
        return {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          displayName: auth.currentUser.displayName
        };
      }
      
      return null;
    },

    async handleAddToCartConfirm() {
      try {
        // Get current user data from custom session storage
        const userData = this.getCurrentUserData();
        if (!userData) {
          this.showNotificationMessage('Please log in to add items to cart', 'error');
          return;
        }

        // Validate stock before adding to cart
        const stockValidation = this.validateStock(this.modalSelectedUnit, this.modalQuantity);
        if (!stockValidation.isValid) {
          this.showNotificationMessage(stockValidation.message, 'error');
          return;
        }

        const unitPrice = this.getUnitPrice(this.modalSelectedUnit);

        const cartItem = {
          userId: userData.uid,
          productId: this.productId,
          productName: this.productName,
          productImage: this.productImage,
          unit: this.modalSelectedUnit,
          quantity: this.modalQuantity,
          unitPrice: unitPrice,
          totalPrice: unitPrice * this.modalQuantity,
          pricePerKg: unitPrice,
          price: unitPrice,
          farmName: this.farmName,
          sellerId: this.sellerId,
          // Persist the intended order type so checkout/seller can identify it
          orderType: this.selectedPurchaseType || 'normal',
          cartStatus: false,
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
async handleBuyNowConfirm() {
    try {
      // Get current user data from custom session storage
      const userData = this.getCurrentUserData();
      if (!userData) {
        this.showNotificationMessage('Please log in to make a purchase', 'error');
        return;
      }

      if (!this.sellerId) {
        this.showNotificationMessage('Seller information is missing', 'error');
        return;
      }

      // Validate stock before proceeding to checkout
      const stockValidation = this.validateStock(this.modalSelectedUnit, this.modalQuantity);
      if (!stockValidation.isValid) {
        this.showNotificationMessage(stockValidation.message, 'error');
        return;
      }

      const unitPrice = this.getUnitPrice(this.modalSelectedUnit);
      const buyNowItem = {
        productId: this.productId,
        productName: this.productName,
        productImage: this.productImage,
        weight: this.modalQuantity,
        packagingType: this.modalSelectedUnit,
        totalPrice: unitPrice * this.modalQuantity,
        sellerId: this.sellerId,
        farmName: this.farmName || 'Unknown Farm',
        unitPrice: unitPrice,
        pricePerKg: unitPrice,
        price: unitPrice,
        unit: this.modalSelectedUnit,
        quantity: this.modalQuantity,
        // Pass along the intended purchase type to checkout
        orderType: this.selectedPurchaseType || 'normal',
        isBuyNow: true
      };

      console.log('Buy Now Item being sent to checkout:', buyNowItem);

      this.closeBuyNowModal();
      this.router.push({
        name: 'Checkout',
        query: {
          items: JSON.stringify([buyNowItem])
        }
      });
    } catch (error) {
      console.error('Error processing buy now:', error);
      this.showNotificationMessage('Failed to process order', 'error');
    }
  },
  // Add stock validation method
  validateStock(unit, quantity) {
    const availableStock = this.getMaxQuantity(unit);
    console.log(`Validating stock: Unit=${unit}, Requested=${quantity}, Available=${availableStock}`);
    
    if (availableStock === 0) {
      return {
        isValid: false,
        message: `This item is currently out of stock`
      };
    }
    // Enforce wholesale minimum
    if (this.selectedPurchaseType === 'wholesale' && quantity < this.wholesaleMinQty) {
      return {
        isValid: false,
        message: `Minimum wholesale order is ${this.wholesaleMinQty} ${unit}`
      };
    }
    
    if (quantity > availableStock) {
      return {
        isValid: false,
        message: `Cannot proceed. Only ${availableStock} ${unit} available in stock, but you're trying to order ${quantity} ${unit}`
      };
    }
    
    return { isValid: true };
  },

  // Add method to validate modal quantity input
  validateModalQuantity() {
    const maxStock = this.getMaxQuantity(this.modalSelectedUnit);
    // Wholesale minimums
    if (this.selectedPurchaseType === 'wholesale' && this.modalQuantity < this.wholesaleMinQty) {
      this.modalQuantity = this.wholesaleMinQty;
    }
    if (this.modalQuantity > maxStock) {
      this.modalQuantity = maxStock;
      this.showNotificationMessage(`Maximum available stock is ${maxStock} ${this.modalSelectedUnit}`, 'error');
    }
    if (this.modalQuantity < 1) {
      this.modalQuantity = 1;
    }
  },

  // Add method to check if product is out of stock
  isOutOfStock(unit) {
    return this.getMaxQuantity(unit) === 0;
  },
  },
  async mounted() {
  console.log('Component mounted, productId:', this.productId);
  
  // Check for existing session
  this.checkExistingSession();
  
  await this.fetchProduct();
  console.log('Product fetched. Seller ID:', this.sellerId);
  // Apply forced mode from route if valid
  const mode = this.$route?.query?.mode;
  if (mode === 'preorder' && this.isPreOrderProduct) {
    this.selectedPurchaseType = 'preorder';
  } else if (mode === 'wholesale' && this.isWholesaleProduct) {
    this.selectedPurchaseType = 'wholesale';
    if (this.quantity < this.wholesaleMinQty) this.quantity = this.wholesaleMinQty;
  }
  
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
  cursor: pointer;
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
  text-align: center;
}

.related-products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 0 5px;
}

.related-product {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.related-product:hover {
  transform: translateY(-2px);
}

.related-product-image {
  height: 80px;
  position: relative;
  overflow: hidden;
}

.related-product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.related-badge {
  position: absolute;
  top: 3px;
  right: 3px;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 8px;
  font-weight: 600;
  background-color: #ff4444;
  color: white;
  margin: 0;
}

.related-product-info {
  padding: 8px;
  text-align: center;
}

.related-product-info h4 {
  font-size: 0.75rem;
  margin: 0 0 4px 0;
  color: #333;
  font-weight: 600;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
  height: 2.4em;
}

.related-price {
  font-size: 0.7rem;
  font-weight: 600;
  color: #2e5c31;
  margin: 0;
}

/* Desktop/Web responsive adjustments for related products */
@media (min-width: 768px) {
  .related-products-grid {
    gap: 15px;
    padding: 0 10px;
  }
  
  .related-product {
    border-radius: 12px;
  }
  
  .related-product-image {
    height: 150px;
  }
  
  .related-product-info {
    padding: 12px;
  }
  
  .related-product-info h4 {
    font-size: 0.9rem;
    height: 2.7em;
  }
  
  .related-price {
    font-size: 0.85rem;
  }
  
  .related-badge {
    font-size: 10px;
    padding: 3px 6px;
    top: 5px;
    right: 5px;
  }
}

@media (min-width: 1024px) {
  .related-products-grid {
    gap: 20px;
    padding: 0 15px;
  }
  
  .related-product-image {
    height: 180px;
  }
  
  .related-product-info {
    padding: 15px;
  }
  
  .related-product_info h4 {
    font-size: 1rem;
    height: 3em;
  }
  
  .related-price {
    font-size: 0.9rem;
  }
  
  .section-header h3 {
    font-size: 1.3rem;
  }
}

@media (min-width: 1200px) {
  .related-products-grid {
    gap: 25px;
    padding: 0 20px;
  }
  
  .related-product-image {
    height: 200px;
  }
  
  .related-product-info {
    padding: 18px;
  }
  
  .related-product_info h4 {
    font-size: 1.1rem;
    height: 3.3em;
  }
  
  .related-price {
    font-size: 1rem;
  }
  
  .related-badge {
    font-size: 11px;
    padding: 4px 8px;
  }
}

/* Mobile responsive adjustments for related products */
@media (max-width: 480px) {
  .related-products-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    padding: 0 3px;
  }
  
  .related-product-image {
    height: 70px;
  }
  
  .related-product-info {
    padding: 6px;
  }
  
  .related-product-info h4 {
    font-size: 0.7rem;
    height: 2.1em;
  }
  
  .related-price {
    font-size: 0.65rem;
  }
  
  .related-badge {
    font-size: 7px;
    padding: 1px 3px;
  }
}

@media (max-width: 360px) {
  .related-products-grid {
    gap: 4px;
    padding: 0 2px;
  }
  
  .related-product-image {
    height: 60px;
  }
  
  .related-product-info h4 {
    font-size: 0.65rem;
  }
  
  .related-price {
    font-size: 0.6rem;
  }
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

/* Login Modal Styles - Fixed to match design */
.login-modal {
  background: linear-gradient(135deg, #e8f5e8, #f0f9f0);
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 400px;
  animation: slideUp 0.3s ease-out;
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
}

@keyframes slideUp {
  from {
    transform: translateX(-50%) translateY(100%);
  }
  to {
    transform: translateX(-50%) translateY(0);
  }
}

.login-header {
  display: flex;
  justify-content: flex-end;
  padding: 15px 20px 0;
}

.login-header .close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-content {
  padding: 20px 30px 40px;
  text-align: center;
}

.app-branding {
  margin-bottom: 40px;
}

.logo {
  width: 60px;
  height: 60px;
  margin-bottom: 15px;
}

.app-title {
  font-size: 2rem;
  font-weight: 700;
  color: #2e5c31;
  margin: 0 0 5px;
  letter-spacing: -0.5px;
}

.app-subtitle {
  font-size: 1rem;
  color: #2e5c31;
  margin: 0 0 0 0;
  font-weight: 400;
  letter-spacing: 1px;
}

.login-form {
  max-width: 320px;
  margin: 0 auto;
}

.input-group {
  margin-bottom: 20px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border-radius: 25px;
  border: 1px solid #e5e7eb;
  padding: 0 14px;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.input-wrapper:focus-within {
  border-color: #2e5c31;
  box-shadow: 0 0 0 4px rgba(46, 92, 49, 0.08);
}

.input-icon {
  color: #7a8b7c;
}

.login-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  padding: 14px 10px;
  font-size: 0.95rem;
  color: #1f2937;
}

.login-input::placeholder {
  color: #9aa7a0;
}

.password-toggle {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  color: #6b7280;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  font-size: 0.9rem;
}

.remember-me {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #2e5c31;
  font-weight: 500;
}

.remember-me input[type="checkbox"] {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  accent-color: #2e5c31;
}

.checkmark {
  display: none; /* Hide custom checkmark since we're using native checkbox */
}

.forgot-password {
  color: #2e5c31;
  text-decoration: none;
  font-weight: 500;
}

.forgot-password:hover {
  text-decoration: underline;
}

.login-button {
  width: 100%;
  padding: 15px;
  background: linear-gradient(135deg, #2e5c31, #1e4a21);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 20px;
  text-decoration: none;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(46, 92, 49, 0.3);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-divider {
  position: relative;
  margin: 20px 0;
  text-align: center;
}

.login-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background-color: #e0e0e0;
}

.login-divider span {
  background: linear-gradient(135deg, #e8f5e8, #f0f9f0);
  padding: 0 15px;
  color: #666;
  font-size: 0.9rem;
}

.google-login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 500;
  border: 1px solid #e0e0e0;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 20px;
}

.google-login-btn:hover {
  background-color: #f9f9f9;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.signup-text {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
}

.signup-link {
  color: #2e5c31;
  text-decoration: none;
  font-weight: 600;
}

.signup-link:hover {
  text-decoration: underline;
}

/* Override modal-overlay for login modal */
.modal-overlay:has(.login-modal) {
  align-items: flex-end;
}

/* Mobile responsive adjustments */
@media (max-width: 480px) {
  .login-modal {
    width: 100%;
    border-radius: 20px 20px 0 0;
  }
  
  .login-content {
    padding: 15px 20px 30px;
  }
  
  .login-form {
    max-width: 100%;
  }
  
  .app-title {
    font-size: 1.8rem;
  }
  
  .input-wrapper {
    padding: 0 15px;
  }
  
  .login-input {
    padding: 12px 0;
    font-size: 0.95rem;
  }
}
.out-of-stock {
  color: #e74c3c !important;
  font-weight: 600;
}

.add-to-cart:disabled,
.buy-now-button:disabled,
.quantity-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f5f5f5;
  color: #999;
}

.stock-warning {
  color: #e74c3c;
  font-size: 0.8rem;
  margin-top: 5px;
  display: block;
}

.modal-footer .confirm-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #ccc;
}
</style>