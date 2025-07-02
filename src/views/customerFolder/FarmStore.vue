<template>
    <div class="farm-store">
      <!-- Header with back button -->
      <div class="store-header">
        <div class="header-container">
          <button class="back-btn" @click="router.back()">
            <ChevronLeft size="20" />
          </button>
          <h1>{{ farmName }}</h1>
          <button class="icon-btn">
            <Share2 size="18" />
          </button>
        </div>
      </div>
  
      <!-- Profile Banner -->
      <div class="banner-container">
        <img :src="bannerImage" alt="Farm banner" class="banner-img" />
        <div class="banner-overlay"></div>
      </div>
  
      <!-- Main Content Container -->
      <div class="main-container">
        <!-- Profile Info Card -->
        <div class="profile-card">
          <div class="profile-header">
            <div class="profile-avatar">
              <img :src="profileImage" alt="Profile picture" />
              <div v-if="isVerified" class="verified-badge">
                <CheckCircle size="16" />
              </div>
            </div>
            <div class="profile-details">
              <h2>{{ farmName }}</h2>
              <div class="rating">
                <Star 
                  v-for="i in 5" 
                  :key="i" 
                  size="16" 
                  :fill="i <= averageRating ? '#FFD700' : '#E0E0E0'"
                  :color="i <= averageRating ? '#FFD700' : '#E0E0E0'"
                />
                <span class="rating-text">{{ averageRating.toFixed(1) }} ({{ totalReviews }} reviews)</span>
              </div>
            </div>
          </div>
  
          <!-- Store Info Cards -->
          <div class="store-info-grid">
            <div class="info-card">
              <div class="info-card-icon">
                <MapPin size="20" />
              </div>
              <div class="info-card-content">
                <h4>Farm Location</h4>
                <p>{{ farmAddress }}</p>
              </div>
            </div>
            
            <div class="info-card">
              <div class="info-card-icon">
                <Truck size="20" />
              </div>
              <div class="info-card-content">
                <h4>Delivery</h4>
                <p>{{ deliveryMethod }}</p>
              </div>
            </div>
            
            <div class="info-card">
              <div class="info-card-icon">
                <Clock size="20" />
              </div>
              <div class="info-card-content">
                <h4>Operating Hours</h4>
                <p>{{ operatingHours }}</p>
              </div>
            </div>
            
            <div class="info-card">
              <div class="info-card-icon">
                <CreditCard size="20" />
              </div>
              <div class="info-card-content">
                <h4>Payment</h4>
                <p>{{ paymentMethod }}</p>
              </div>
            </div>
          </div>
  
          <div class="contact-section">
            <div class="contact-header">
              <Phone size="18" />
              <h4>Contact Information</h4>
            </div>
            <div class="contact-details">
              <p><strong>Phone:</strong> {{ contact }}</p>
              <p v-if="email"><strong>Email:</strong> {{ email }}</p>
              <p v-if="socialMedia"><strong>Social Media:</strong> {{ socialMedia }}</p>
            </div>
          </div>
        </div>
  
        <!-- Products Section -->
        <div class="products-section">
          <div class="section-header">
            <div class="section-title">
              <h3>Products</h3>
              <span class="product-count">{{ products.length }} items</span>
            </div>
          </div>
          
          <!-- Categories -->
          <div class="categories-container">
            <button 
              class="category-pill" 
              :class="{ active: selectedCategory === '' }"
              @click="selectedCategory = ''"
            >
              All
            </button>
            <button 
              v-for="category in categories" 
              :key="category"
              class="category-pill"
              :class="{ active: selectedCategory === category }"
              @click="selectedCategory = category"
            >
              {{ category }}
            </button>
          </div>
          
          <div v-if="loading" class="loading-container">
            <div class="loading-spinner"></div>
            <p>Loading products...</p>
          </div>
          
          <div v-else-if="filteredProducts.length === 0" class="empty-state">
            <div class="empty-icon">
              <PackageOpen size="40" />
            </div>
            <h4>No products found</h4>
            <p v-if="selectedCategory">No products in the "{{ selectedCategory }}" category</p>
            <p v-else>This farm store has no products available</p>
          </div>
          
          <div v-else class="products-grid">
            <div 
              v-for="product in filteredProducts" 
              :key="product.id" 
              class="product-card"
              @click="viewProduct(product)"
            >
              <div class="product-image">
                <img :src="getProductImage(product)" alt="Product image" />
                <div class="stock-badge" :class="{ 'low-stock': getProductStock(product) < 10, 'out-of-stock': getProductStock(product) <= 0 }">
                  {{ getProductStock(product) > 0 ? 'In Stock' : 'Out of Stock' }}
                </div>
                <!-- Product badges -->
                <div v-if="product.isOrganic" class="product-badge organic">Organic</div>
                <div v-if="product.isTrending" class="product-badge trending">
                  <TrendingUp size="12" />
                  Trending
                </div>
              </div>
              <div class="product-info">
                <h4>{{ product.name || product.productName || 'Untitled Product' }}</h4>
                <div class="product-meta">
                  <p class="product-price">₱{{ getProductPrice(product) }}</p>
                  <p class="product-unit">/ {{ getProductUnit(product) }}</p>
                </div>
                <div class="product-stats">
                  <div class="stat">
                    <Eye size="12" />
                    <span>{{ product.views || 0 }}</span>
                  </div>
                  <div class="stat">
                    <ShoppingBag size="12" />
                    <span>{{ product.sold || 0 }}</span>
                  </div>
                </div>
                <div class="stock-info" :class="{ 'low-stock': getProductStock(product) < 10, 'out-of-stock': getProductStock(product) <= 0 }">
                  <Package size="14" />
                  <span>{{ getProductStock(product) }} left</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, watch } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { 
    ChevronLeft, Star, MapPin, Clock, PackageOpen, 
    Package, Share2, Truck, CreditCard, Phone,
    CheckCircle, Eye, ShoppingBag, TrendingUp
  } from 'lucide-vue-next';
  import { 
    doc, getDoc, collection, query, where, getDocs 
  } from 'firebase/firestore';
  import { db } from '@/firebase/firebaseConfig';
  
  const router = useRouter();
  const route = useRoute();
  
  // Get sellerId from route params
  const sellerId = ref(route.params.sellerId);
  
  // Default images
  const defaultImages = {
    banner: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZmFybXxlbnwwfHwwfHx8MA%3D%3D&w=1200&q=80',
    profile: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cGVyc29ufGVufDB8fDB8fHww&w=400&q=80',
    product: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8Zm9vZCUyMHByb2R1Y3R8ZW58MHx8MHx8fDA%3D&w=400&q=80'
  };
  
  // Seller data
  const farmName = ref('Loading...');
  const farmAddress = ref('Loading...');
  const operatingHours = ref('Loading...');
  const deliveryMethod = ref('Loading...');
  const paymentMethod = ref('Loading...');
  const contact = ref('Loading...');
  const email = ref('');
  const socialMedia = ref('');
  const isVerified = ref(false);
  const profileImage = ref(defaultImages.profile);
  const bannerImage = ref(defaultImages.banner);
  
  // Stats
  const averageRating = ref(4.0);
  const totalReviews = ref(0);
  
  // Products and categories
  const products = ref([]);
  const loading = ref(true);
  const selectedCategory = ref('');
  const categories = ref([]);
  
  // Computed property for filtered products
  const filteredProducts = computed(() => {
    if (!selectedCategory.value) {
      return products.value;
    }
    return products.value.filter(product => 
      product.category === selectedCategory.value
    );
  });
  
  // Helper function to get product image
  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    if (product.image) {
      return product.image;
    }
    if (product.imageUrl) {
      return product.imageUrl;
    }
    return defaultImages.product;
  };
  
  // Helper function to get product price
  const getProductPrice = (product) => {
    if (product.pricePerKilo > 0) return product.pricePerKilo.toFixed(2);
    if (product.pricePerSack > 0) return product.pricePerSack.toFixed(2);
    if (product.pricePerTali > 0) return product.pricePerTali.toFixed(2);
    if (product.pricePerKaing > 0) return product.pricePerKaing.toFixed(2);
    if (product.pricePerBundle > 0) return product.pricePerBundle.toFixed(2);
    if (product.pricePerTray > 0) return product.pricePerTray.toFixed(2);
    if (product.pricePerPiece > 0) return product.pricePerPiece.toFixed(2);
    if (product.price) return product.price.toFixed(2);
    return '0.00';
  };
  
  // Helper function to get product unit
  const getProductUnit = (product) => {
    if (product.pricePerKilo > 0) return 'kg';
    if (product.pricePerSack > 0) return 'sack';
    if (product.pricePerTali > 0) return 'tali';
    if (product.pricePerKaing > 0) return 'kaing';
    if (product.pricePerBundle > 0) return 'bundle';
    if (product.pricePerTray > 0) return 'tray';
    if (product.pricePerPiece > 0) return 'piece';
    if (product.unit) return product.unit;
    return 'unit';
  };
  
  // Helper function to get product stock
  const getProductStock = (product) => {
    if (product.stockPerKilo > 0) return product.stockPerKilo;
    if (product.stockPerSack > 0) return product.stockPerSack;
    if (product.stockPerTali > 0) return product.stockPerTali;
    if (product.stockPerKaing > 0) return product.stockPerKaing;
    if (product.stockPerBundle > 0) return product.stockPerBundle;
    if (product.stockPerTray > 0) return product.stockPerTray;
    if (product.stockPerPiece > 0) return product.stockPerPiece;
    if (product.stock) return product.stock;
    return 0;
  };
  
  // Extract unique categories from products
  const extractCategories = (products) => {
    const categorySet = new Set();
    products.forEach(product => {
      if (product.category) {
        categorySet.add(product.category);
      }
    });
    return Array.from(categorySet);
  };
  
  // Fetch seller profile data
  const fetchProfileData = async (userId) => {
    try {
      console.log('Fetching seller profile for userId:', userId);
      
      // Query the sellers collection where userId field matches
      const sellersQuery = query(
        collection(db, 'sellers'), 
        where('userId', '==', userId)
      );
      
      const sellersSnapshot = await getDocs(sellersQuery);
      
      if (sellersSnapshot.empty) {
        console.error('No seller found with userId:', userId);
        farmName.value = 'Seller not found';
        return;
      }
      
      // Get the first matching seller document
      const sellerDoc = sellersSnapshot.docs[0];
      const data = sellerDoc.data();
      console.log('Seller data found:', data);
      
      // Extract farm name from farmDetails map
      if (data.farmDetails && data.farmDetails.farmName) {
        farmName.value = data.farmDetails.farmName;
      } else {
        // Fallback to personal info
        const firstName = data.personalInfo?.firstName || '';
        const lastName = data.personalInfo?.lastName || '';
        farmName.value = firstName && lastName ? `${firstName} ${lastName}'s Farm` : 'Farm Store';
      }
      
      // Extract farm address
      if (data.farmDetails && data.farmDetails.farmAddress) {
        farmAddress.value = data.farmDetails.farmAddress;
      } else if (data.address) {
        farmAddress.value = data.address;
      } else {
        farmAddress.value = 'Address not provided';
      }
      
      // Extract delivery information
      if (data.deliveryInfo) {
        if (data.deliveryInfo.areasCovered && Array.isArray(data.deliveryInfo.areasCovered)) {
          deliveryMethod.value = `Available in ${data.deliveryInfo.areasCovered.join(', ')}`;
        } else {
          deliveryMethod.value = 'Delivery areas not specified';
        }
      } else {
        deliveryMethod.value = 'Delivery info not available';
      }
      
      // Extract operating hours
      if (data.farmDetails && data.farmDetails.operatingHours) {
        operatingHours.value = data.farmDetails.operatingHours;
      } else {
        operatingHours.value = 'Not specified';
      }
      
      // Extract payment methods
      if (data.paymentMethods && Array.isArray(data.paymentMethods)) {
        paymentMethod.value = data.paymentMethods.join(', ');
      } else {
        paymentMethod.value = 'Cash on Delivery';
      }
      
      // Extract contact information
      if (data.personalInfo && data.personalInfo.phoneNumber) {
        contact.value = data.personalInfo.phoneNumber;
      } else if (data.contact) {
        contact.value = data.contact;
      } else {
        contact.value = 'No contact provided';
      }
      
      // Extract email
      if (data.personalInfo && data.personalInfo.email) {
        email.value = data.personalInfo.email;
      } else if (data.email) {
        email.value = data.email;
      }
      
      // Social media (if available)
      socialMedia.value = data.socialMedia || '';
      
      // Verification status
      isVerified.value = data.verificationStatus === 'Verified' || data.isVerified === true;
      
      // Profile image
      if (data.personalInfo && data.personalInfo.photoUrl && data.personalInfo.photoUrl.trim() !== '') {
        profileImage.value = data.personalInfo.photoUrl;
      } else if (data.photoUrl && data.photoUrl.trim() !== '') {
        profileImage.value = data.photoUrl;
      }
      
      // Stats (you can implement this based on reviews collection)
      averageRating.value = data.averageRating || 4.0;
      totalReviews.value = data.reviewCount || 0;
      
    } catch (error) {
      console.error("Error fetching seller profile:", error);
      farmName.value = 'Error loading seller info';
    }
  };
  
  // Fetch seller products
  const fetchProducts = async (userId) => {
    try {
      console.log('Fetching products for sellerId:', userId);
      
      const q = query(
        collection(db, 'products'),
        where('sellerId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      console.log('Found products:', querySnapshot.docs.length);
      
      products.value = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Calculate if trending based on views and sales
        const views = parseInt(data.views || 0);
        const sold = parseInt(data.sold || 0);
        const isTrending = views > 50 || sold > 20;
        
        return {
          id: doc.id,
          name: data.name || data.productName || 'Untitled Product',
          productName: data.productName || data.name || 'Untitled Product',
          category: data.category || 'Uncategorized',
          
          // Price fields
          pricePerKilo: Number(data.pricePerKilo) || 0,
          pricePerSack: Number(data.pricePerSack) || 0,
          pricePerTali: Number(data.pricePerTali) || 0,
          pricePerKaing: Number(data.pricePerKaing) || 0,
          pricePerBundle: Number(data.pricePerBundle) || 0,
          pricePerTray: Number(data.pricePerTray) || 0,
          pricePerPiece: Number(data.pricePerPiece) || 0,
          price: Number(data.price) || 0,
          
          // Stock fields
          stockPerKilo: Number(data.stockPerKilo) || 0,
          stockPerSack: Number(data.stockPerSack) || 0,
          stockPerTali: Number(data.stockPerTali) || 0,
          stockPerKaing: Number(data.stockPerKaing) || 0,
          stockPerBundle: Number(data.stockPerBundle) || 0,
          stockPerTray: Number(data.stockPerTray) || 0,
          stockPerPiece: Number(data.stockPerPiece) || 0,
          stock: Number(data.stock) || 0,
          
          // Image fields
          images: data.images || [],
          image: data.image || null,
          imageUrl: data.imageUrl || null,
          
          // Additional fields
          unit: data.unit || 'unit',
          views: data.views || 0,
          sold: data.sold || 0,
          isOrganic: data.isOrganic || false,
          isTrending: isTrending,
          description: data.description || '',
          
          ...data
        };
      });
      
      // Extract categories after products are loaded
      categories.value = extractCategories(products.value);
      console.log('Extracted categories:', categories.value);
      
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      loading.value = false;
    }
  };
  
  // Navigate to product details
  const viewProduct = (product) => {
    router.push(`/product/${product.id}`);
  };
  
  // Watch for route changes
  watch(() => route.params.sellerId, (newSellerId) => {
    if (newSellerId) {
      sellerId.value = newSellerId;
      loading.value = true;
      fetchProfileData(newSellerId);
      fetchProducts(newSellerId);
    }
  });
  
  onMounted(async () => {
    if (sellerId.value) {
      console.log('Mounting FarmStore with sellerId:', sellerId.value);
      await fetchProfileData(sellerId.value);
      await fetchProducts(sellerId.value);
    } else {
      console.error('No sellerId provided in route params');
      farmName.value = 'Seller ID not provided';
      loading.value = false;
    }
  });
  </script>
  
  <style scoped>
  /* Global styles */
  .farm-store {
    width: 100%;
    margin: 0 auto;
    padding-bottom: 80px;
    background-color: #f9f9f9;
    min-height: 100vh;
    color: #333;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  /* Main Container for responsive content */
  .main-container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 16px;
    box-sizing: border-box;
  }
  
  @media (min-width: 768px) {
    .main-container {
      padding: 0 24px;
    }
  }
  
  @media (min-width: 1024px) {
    .main-container {
      padding: 0 32px;
    }
  }
  
  /* Header - Redesigned with edge-to-edge buttons */
  .store-header {
    background-color: #2e5c31;
    color: white;
    position: sticky;
    top: 0;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    width: 100%;
  }
  
  .header-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0;
    max-width: 1200px;
    margin: 0 auto;
    height: 56px;
  }
  
  @media (min-width: 768px) {
    .header-container {
      height: 64px;
    }
  }
  
  .back-btn {
    width: 48px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: background 0.2s ease;
    color: white;
    border-radius: 0;
    margin: 0;
    padding: 0;
  }
  
  .back-btn:hover, .back-btn:active {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .store-header h1 {
    font-size: 1.1rem;
    margin: 0;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
    flex: 1;
    padding: 0 8px;
  }
  
  @media (min-width: 768px) {
    .store-header h1 {
      font-size: 1.3rem;
    }
  }
  
  .icon-btn {
    width: 48px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: background 0.2s ease;
    color: white;
    border-radius: 0;
    margin: 0;
    padding: 0;
  }
  
  .icon-btn:hover, .icon-btn:active {
    background: rgba(255, 255, 255, 0.1);
  }
  
  /* Banner */
  .banner-container {
    position: relative;
    height: 180px;
    overflow: hidden;
    width: 100%;
  }
  
  @media (min-width: 768px) {
    .banner-container {
      height: 240px;
    }
  }
  
  @media (min-width: 1024px) {
    .banner-container {
      height: 300px;
    }
  }
  
  .banner-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .banner-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.4));
  }
  
  /* Profile Card */
  .profile-card {
    margin: -30px auto 24px;
    padding: 20px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    position: relative;
    max-width: 1200px;
    box-sizing: border-box;
  }
  
  @media (min-width: 768px) {
    .profile-card {
      margin-top: -40px;
      padding: 24px;
    }
  }
  
  .profile-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
  }
  
  .profile-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 4px solid white;
    overflow: hidden;
    background: #f0f0f0;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    flex-shrink: 0;
    position: relative;
  }
  
  @media (min-width: 768px) {
    .profile-avatar {
      width: 100px;
      height: 100px;
    }
  }
  
  .profile-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .verified-badge {
    position: absolute;
    bottom: 0;
    right: 0;
    background-color: #2e5c31;
    color: white;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
  }
  
  @media (min-width: 768px) {
    .verified-badge {
      width: 28px;
      height: 28px;
    }
  }
  
  .profile-details {
    flex: 1;
    min-width: 0; /* Ensures text truncation works properly */
  }
  
  .profile-details h2 {
    margin: 0 0 8px;
    font-size: 1.4rem;
    font-weight: 700;
    color: #2e5c31;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  @media (min-width: 768px) {
    .profile-details h2 {
      font-size: 1.8rem;
    }
  }
  
  .rating {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: nowrap;
  }
  
  .rating-text {
    margin-left: 4px;
    font-size: 0.9rem;
    color: #666;
    white-space: nowrap;
  }
  
  /* Store Info Grid */
  .store-info-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 20px;
  }
  
  @media (min-width: 500px) {
    .store-info-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (min-width: 1024px) {
    .store-info-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  
  .info-card {
    background-color: #f8f8f8;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    transition: transform 0.2s ease;
  }
  
  .info-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.05);
  }
  
  .info-card-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background-color: rgba(46, 92, 49, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #2e5c31;
    flex-shrink: 0;
  }
  
  .info-card-content {
    flex: 1;
    min-width: 0; /* Ensures text truncation works properly */
  }
  
  .info-card-content h4 {
    font-size: 0.9rem;
    font-weight: 600;
    margin: 0 0 4px;
    color: #333;
  }
  
  @media (min-width: 768px) {
    .info-card-content h4 {
      font-size: 1rem;
    }
  }
  
  .info-card-content p {
    font-size: 0.85rem;
    color: #666;
    margin: 0;
    line-height: 1.4;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  
  @media (min-width: 768px) {
    .info-card-content p {
      font-size: 0.9rem;
    }
  }
  
  /* Contact Section */
  .contact-section {
    background-color: #f8f8f8;
    border-radius: 12px;
    padding: 16px;
    margin-top: 12px;
  }
  
  @media (min-width: 768px) {
    .contact-section {
      padding: 20px;
    }
  }
  
  .contact-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    color: #2e5c31;
  }
  
  .contact-header h4 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
  }
  
  @media (min-width: 768px) {
    .contact-header h4 {
      font-size: 1.1rem;
    }
  }
  
  .contact-details p {
    font-size: 0.9rem;
    margin: 0 0 8px;
    color: #555;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  
  @media (min-width: 768px) {
    .contact-details p {
      font-size: 1rem;
    }
  }
  
  .contact-details p:last-child {
    margin-bottom: 0;
  }
  
  /* Products Section */
  .products-section {
    background: white;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    margin-bottom: 24px;
    box-sizing: border-box;
  }
  
  @media (min-width: 768px) {
    .products-section {
      padding: 24px;
    }
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  @media (min-width: 768px) {
    .section-header {
      flex-wrap: nowrap;
    }
  }
  
  .section-title {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  
  .section-title h3 {
    font-size: 1.2rem;
    font-weight: 600;
    margin: 0;
    color: #2e5c31;
  }
  
  @media (min-width: 768px) {
    .section-title h3 {
      font-size: 1.4rem;
    }
  }
  
  .product-count {
    font-size: 0.9rem;
    color: #666;
  }
  
  /* Categories */
  .categories-container {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    overflow-x: auto;
    padding-bottom: 8px;
    -ms-overflow-style: none;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
  }
  
  .categories-container::-webkit-scrollbar {
    display: none;
  }
  
  .category-pill {
    background-color: #f0f0f0;
    border: none;
    border-radius: 20px;
    padding: 8px 16px;
    font-size: 0.9rem;
    color: #555;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    flex-shrink: 0;
  }
  
  .category-pill:hover {
    background-color: #e0e0e0;
  }
  
  .category-pill.active {
    background-color: #2e5c31;
    color: white;
  }
  
  /* Loading State */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
    color: #666;
  }
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #2e5c31;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
    text-align: center;
  }
  
  .empty-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background-color: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    color: #2e5c31;
  }
  
  .empty-state h4 {
    font-size: 1.1rem;
    margin: 0 0 8px;
    color: #333;
  }
  
  .empty-state p {
    font-size: 0.9rem;
    color: #666;
    margin: 0 0 20px;
  }
  
  /* Products Grid */
  .products-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  @media (min-width: 640px) {
    .products-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
  }
  
  @media (min-width: 768px) {
    .products-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  
  @media (min-width: 1024px) {
    .products-grid {
      grid-template-columns: repeat(5, 1fr);
    }
  }
  
  @media (min-width: 1280px) {
    .products-grid {
      grid-template-columns: repeat(6, 1fr);
    }
  }
  
  .product-card {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    border: 1px solid #eee;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    position: relative;
  }
  
  .product-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
  }
  
  .product-image {
    height: 120px;
    position: relative;
    overflow: hidden;
  }
  
  @media (min-width: 768px) {
    .product-image {
      height: 140px;
    }
  }
  
  .product-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  
  .product-card:hover .product-image img {
    transform: scale(1.05);
  }
  
  .stock-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background-color: rgba(76, 175, 80, 0.9);
    color: white;
    font-size: 0.65rem;
    padding: 3px 6px;
    border-radius: 10px;
    font-weight: 500;
  }
  
  .stock-badge.low-stock {
    background-color: rgba(255, 152, 0, 0.9);
  }
  
  .product-info {
    padding: 12px;
  }
  
  .product-info h4 {
    font-size: 0.9rem;
    font-weight: 600;
    margin: 0 0 8px;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .product-meta {
    display: flex;
    align-items: baseline;
    margin-bottom: 8px;
  }
  
  .product-price {
    font-size: 1rem;
    font-weight: 700;
    color: #2e5c31;
    margin: 0;
  }
  
  .product-unit {
    font-size: 0.8rem;
    color: #666;
    margin: 0 0 0 2px;
  }
  
  .stock-info {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.8rem;
    color: #4caf50;
  }
  
  .stock-info.low-stock {
    color: #ff9800;
  }
  
  /* Product badges */
  .product-badge {
    position: absolute;
    top: 8px;
    left: 8px;
    background-color: rgba(255, 255, 255, 0.9);
    color: #333;
    font-size: 0.7rem;
    padding: 4px 8px;
    border-radius: 12px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .product-badge.organic {
    background-color: rgba(76, 175, 80, 0.9);
    color: white;
  }
  
  .product-badge.trending {
    background-color: rgba(255, 152, 0, 0.9);
    color: white;
  }
  
  .edit-btn {
    position: absolute;
    bottom: 12px;
    right: 12px;
    background-color: #f5f5f5;
    border: none;
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    transition: background 0.2s ease;
    color: #555;
  }
  
  .edit-btn:hover {
    background-color: #e0e0e0;
  }
  </style>