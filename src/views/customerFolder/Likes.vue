<template>
    <div class="likes-page">
      <div class="header">
        <button class="back-button" @click="$emit('navigate', 'HomePage')">
          <ChevronLeft size="22" />
        </button>
        <h1>My Favorites</h1>
        <div class="header-buttons">
          <button class="icon-button" @click="$emit('navigate', 'Cart')">
            <ShoppingCart size="18" />
          </button>
          <button class="icon-button profile-icon">
            <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Profile" />
          </button>
        </div>
      </div>
      
      <div class="content">
        <div class="tabs">
          <button 
            class="tab-button" 
            :class="{ active: activeTab === 'products' }"
            @click="activeTab = 'products'"
          >
            Products
          </button>
          <button 
            class="tab-button" 
            :class="{ active: activeTab === 'farms' }"
            @click="activeTab = 'farms'"
          >
            Farms
          </button>
        </div>
        
        <div v-if="activeTab === 'products'">
          <div v-if="likedProducts.length === 0" class="empty-state">
            <div class="empty-icon">
              <Heart size="60" />
            </div>
            <h2>No favorite products yet</h2>
            <p>Products you like will appear here</p>
            <button class="browse-btn" @click="$emit('navigate', 'HomePage')">Browse Products</button>
          </div>
          
          <div v-else class="products-grid">
            <div class="product-card" v-for="(product, index) in likedProducts" :key="index" @click="viewProduct(product)">
              <button class="like-button active">
                <Heart size="16" fill="#e74c3c" color="#e74c3c" />
              </button>
              <div class="product-image">
                <img :src="product.image" :alt="product.name">
              </div>
              <div class="product-info">
                <h3>{{ product.name }}</h3>
                <p class="shop-info">{{ product.shop }}</p>
                <div class="product-price">
                  <p class="price">₱{{ product.price }}</p>
                  <button class="add-button" @click.stop="addToCart(product)">
                    <Plus size="14" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="activeTab === 'farms'">
          <div v-if="likedFarms.length === 0" class="empty-state">
            <div class="empty-icon">
              <Warehouse size="60" />
            </div>
            <h2>No favorite farms yet</h2>
            <p>Farms you like will appear here</p>
            <button class="browse-btn" @click="$emit('navigate', 'HomePage')">Explore Farms</button>
          </div>
          
          <div v-else class="farms-list">
            <div class="farm-card" v-for="(farm, index) in likedFarms" :key="index">
              <button class="like-button active">
                <Heart size="16" fill="#e74c3c" color="#e74c3c" />
              </button>
              <div class="farm-image">
                <img :src="farm.image" :alt="farm.name">
              </div>
              <div class="farm-info">
                <h3>{{ farm.name }}</h3>
                <p class="farm-location">
                  <MapPin size="12" />
                  {{ farm.location }}
                </p>
                <div class="farm-rating">
                  <Star size="12" fill="#FFD700" color="#FFD700" />
                  <span>{{ farm.rating }}</span>
                  <span class="farm-distance">{{ farm.distance }} km away</span>
                </div>
                <button class="view-farm-btn">View Farm</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <bottom-navigation active-tab="likes" @navigate="$emit('navigate', $event)" />
    </div>
  </template>
  
  <script>
  import BottomNavigation from '@/components/BottomNavigation.vue';
  import { 
    ChevronLeft, 
    ShoppingCart, 
    Heart, 
    Plus, 
    Star, 
    MapPin,
    Warehouse
  } from 'lucide-vue-next';
  import { ref } from 'vue';
  
  export default {
    components: {
      BottomNavigation,
      ChevronLeft,
      ShoppingCart,
      Heart,
      Plus,
      Star,
      MapPin,
      Warehouse
    },
    setup() {
      const activeTab = ref('products');
      
      const likedProducts = ref([
        {
          id: 1,
          name: 'Organic Lettuce',
          shop: 'Tagaytay Farms',
          price: '65',
          image: 'https://cdn-icons-png.flaticon.com/512/5346/5346493.png'
        },
        {
          id: 2,
          name: 'Fresh Tomatoes',
          shop: 'Batangas Growers',
          price: '45',
          image: 'https://cdn-icons-png.flaticon.com/512/1202/1202125.png'
        },
        {
          id: 3,
          name: 'Organic Avocado',
          shop: 'Davao Growers',
          price: '75',
          image: 'https://cdn-icons-png.flaticon.com/512/1147/1147801.png'
        },
        {
          id: 4,
          name: 'Fresh Mangoes',
          shop: 'Guimaras Farms',
          price: '120',
          image: 'https://cdn-icons-png.flaticon.com/512/6866/6866569.png'
        }
      ]);
      
      const likedFarms = ref([
        {
          id: 1,
          name: 'Batangas Organic Farms',
          location: 'Lipa, Batangas',
          rating: 4.8,
          distance: 25,
          image: 'https://cdn-icons-png.flaticon.com/512/2276/2276931.png'
        },
        {
          id: 2,
          name: 'Baguio Fresh Produce',
          location: 'La Trinidad, Benguet',
          rating: 4.9,
          distance: 250,
          image: 'https://cdn-icons-png.flaticon.com/512/1532/1532688.png'
        }
      ]);
      
      const viewProduct = (product) => {
        console.log(`Viewing product: ${product.name}`);
        // Navigate to product details
      };
      
      const addToCart = (product) => {
        console.log(`Added ${product.name} to cart`);
        // Add to cart logic
      };
      
      return {
        activeTab,
        likedProducts,
        likedFarms,
        viewProduct,
        addToCart
      };
    }
  }
  </script>
  
  <style scoped>
  .likes-page {
    height: 100%;
    display: flex;
    flex-direction: column;
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
  }
  
  .header h1 {
    font-size: 18px;
    font-weight: 600;
  }
  
  .header-buttons {
    display: flex;
    gap: 8px;
  }
  
  .icon-button {
    width: 40px;
    height: 40px;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    overflow: hidden;
  }
  
  .profile-icon img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .content {
    flex: 1;
    padding: 20px 15px;
    background-color: #f5f5f5;
    overflow-y: auto;
  }
  
  .tabs {
    display: flex;
    background-color: white;
    border-radius: 10px;
    margin-bottom: 20px;
    overflow: hidden;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  }
  
  .tab-button {
    flex: 1;
    padding: 15px 0;
    text-align: center;
    font-size: 14px;
    font-weight: 600;
    color: #666;
    background: none;
    border: none;
    transition: all 0.2s ease;
  }
  
  .tab-button.active {
    color: #2e5c31;
    background-color: rgba(46, 92, 49, 0.1);
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 50px 20px;
  }
  
  .empty-icon {
    color: #ccc;
    margin-bottom: 20px;
  }
  
  .empty-state h2 {
    font-size: 18px;
    margin-bottom: 10px;
    color: #333;
  }
  
  .empty-state p {
    font-size: 14px;
    color: #666;
    margin-bottom: 30px;
  }
  
  .browse-btn {
    padding: 12px 30px;
    background-color: #2e5c31;
    color: white;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 600;
    box-shadow: 0 3px 8px rgba(46, 92, 49, 0.3);
  }
  
  .products-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
  
  .product-card {
    background-color: white;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    position: relative;
  }
  
  .like-button {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background-color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    z-index: 10;
  }
  
  .product-image {
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f9f9f9;
  }
  
  .product-image img {
    width: 80px;
    height: 80px;
  }
  
  .product-info {
    padding: 15px;
  }
  
  .product-info h3 {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 5px;
    color: #333;
  }
  
  .shop-info {
    font-size: 12px;
    color: #666;
    margin-bottom: 10px;
  }
  
  .product-price {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .price {
    font-weight: bold;
    font-size: 16px;
    color: #2e5c31;
  }
  
  .add-button {
    width: 28px;
    height: 28px;
    background-color: #f0f0f0;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  
  .add-button:hover {
    background-color: #2e5c31;
    color: white;
  }
  
  .farms-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .farm-card {
    background-color: white;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    position: relative;
    display: flex;
  }
  
  .farm-image {
    width: 100px;
    height: 100px;
    background-color: #f9f9f9;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .farm-image img {
    width: 60px;
    height: 60px;
  }
  
  .farm-info {
    flex: 1;
    padding: 15px;
    position: relative;
  }
  
  .farm-info h3 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 5px;
    color: #333;
  }
  
  .farm-location {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: #666;
    margin-bottom: 5px;
  }
  
  .farm-rating {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: #666;
    margin-bottom: 15px;
  }
  
  .farm-distance {
    margin-left: 10px;
    color: #999;
  }
  
  .view-farm-btn {
    padding: 8px 15px;
    background-color: #2e5c31;
    color: white;
    border-radius: 5px;
    font-size: 12px;
    font-weight: 500;
  }
  </style>