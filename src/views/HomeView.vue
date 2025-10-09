<template>
  <div class="home-page">
    <!-- Global Offline Status Banner -->
    <OfflineBanner />
    <!-- Notification toast -->
    <Notification 
      v-if="showNotification"
      :message="notificationMessage"
      :type="notificationType"
      :visible="showNotification"
      @close="showNotification = false"
    />
    
    <!-- Login Required Modal (style aligned with ProductDetails.vue) -->
    <div v-if="showLoginModal" class="modal-overlay">
      <div class="login-modal" @click.stop>
        <div class="login-header">
          <button class="close-button" @click="closeLoginModal">&times;</button>
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
                <input type="email" placeholder="Email address" class="login-input" v-model="loginEmail" />
              </div>
            </div>
            <div class="input-group">
              <div class="input-wrapper">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="input-icon">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <circle cx="12" cy="16" r="1"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input :type="showPassword ? 'text' : 'password'" placeholder="Password" class="login-input" v-model="loginPassword" />
                <button type="button" class="password-toggle" @click="showPassword = !showPassword">
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
              <a href="#" class="forgot-password" @click.prevent="goToForgotPassword">Forgot Password?</a>
            </div>
            <button class="login-button" @click="handleInlineEmailLogin" :disabled="isLoggingIn">
              {{ isLoggingIn ? 'Logging in...' : 'Login' }}
            </button>
            <div class="login-divider"><span>or</span></div>
           
            <p class="signup-text">Don't have an account? <a href="#" @click.prevent="goToSignup" class="signup-link">Create an account</a></p>
          </div>
        </div>
      </div>
    </div>
    <div class="header">
      <div class="search-container">
        
        <button class="filter-button" @click="toggleFilterMenu" ref="filterRef">
          <SlidersHorizontal size="18" />
        </button>
        
        
        <div class="filter-dropdown" v-if="showFilterMenu" ref="filterDropdownRef">
          <div class="filter-header">
            <h3>Filter Products</h3>
            <button class="close-filter" @click="toggleFilterMenu">
              <X size="16" />
            </button>
          </div>
          
          
          <div class="filter-section">
            <h4>Price Range </h4>
            <div class="price-range">
              <div class="price-inputs">
                <div class="price-input-group">
                  <label>Min Price (₱)</label>
                  <input 
                    type="number" 
                    v-model.number="minPrice" 
                    min="0" 
                    placeholder="0"
                    class="price-input"
                  >
                </div>
                <div class="price-input-group">
                  <label>Max Price (₱)</label>
                  <input 
                    type="number" 
                    v-model.number="maxPrice" 
                    min="0" 
                    placeholder="1000"
                    class="price-input"
                  >
                </div>
              </div>
            </div>
          </div>
          
          
          <div class="filter-section">
            <h4>Sort By</h4>
            <div class="sort-options">
              <label class="sort-option">
                <input type="radio" v-model="sortOption" value="default">
                <span>Default</span>
              </label>
              <label class="sort-option">
                <input type="radio" v-model="sortOption" value="price-low-high">
                <span>Price: Low to High</span>
              </label>
              <label class="sort-option">
                <input type="radio" v-model="sortOption" value="price-high-low">
                <span>Price: High to Low</span>
              </label>
              <label class="sort-option">
                <input type="radio" v-model="sortOption" value="rating">
                <span>Highest Rated</span>
              </label>
              <label class="sort-option">
                <input type="radio" v-model="sortOption" value="most-viewed">
                <span>Most Viewed</span>
              </label>
              <label class="sort-option">
                <input type="radio" v-model="sortOption" value="best-selling">
                <span>Best Selling</span>
              </label>
              <label class="sort-option">
                <input type="radio" v-model="sortOption" value="trending">
                <span>Trending</span>
              </label>
            </div>
          </div>
          
          <div class="filter-section">
            <h4>Product Type</h4>
            <div class="type-options">
              <label class="type-option">
                <input type="checkbox" v-model="typeFilter" value="organic">
                <span>Organic</span>
              </label>
              <label class="type-option">
                <input type="checkbox" v-model="typeFilter" value="new">
                <span>New Arrivals</span>
              </label>
              <label class="type-option">
                <input type="checkbox" v-model="typeFilter" value="sale">
                <span>On Sale</span>
              </label>
              <label class="type-option">
                <input type="checkbox" v-model="typeFilter" value="trending">
                <span>Trending</span>
              </label>
              <label class="type-option">
                <input type="checkbox" v-model="typeFilter" value="wholesale">
                <span>Wholesale</span>
              </label>
              <label class="type-option">
                <input type="checkbox" v-model="typeFilter" value="pre-order">
                <span>Pre-Order</span>
              </label>
            </div>
          </div>
          
          <div class="filter-actions">
            <button class="reset-filters" @click="resetFilters">Reset All</button>
            <button class="apply-filters" @click="applyFilters">Apply Filters</button>
          </div>
        </div>
        
        <div class="search-bar">
          <Search size="18" />
          <input 
            type="text" 
            placeholder='Search for "Farm Products"' 
            v-model="searchQuery"
            @input="applyFiltersImmediately"
          >
        </div>
<div class="header-buttons">
  <button class="icon-button" @click="navigateToPath('/cart')">
    <ShoppingCart size="18" />
    <span v-if="cartItems.length > 0" class="cart-badge">{{ cartItems.length }}</span>
  </button>
  <button class="icon-button profile-icon" @click="toggleProfileMenu" ref="profileRef">
    <div class="profile-icon-container">
      <img v-if="userPhotoURL" :src="userPhotoURL" alt="User avatar" class="profile-avatar-icon" />
      <User v-else size="18" class="default-profile-icon" />
    </div>
  </button>
          
          
          <div class="profile-dropdown" v-if="showProfileMenu">
            <div class="profile-header">
              <div class="profile-avatar">
                <img v-if="userPhotoURL" :src="userPhotoURL" alt="User avatar" />
                <User v-else size="40" class="default-avatar-icon" />
              </div>
              <div class="profile-user-info">
                <h3>{{ username }}</h3> 
                <p>{{ userEmail }}</p>
              </div>
            </div>
            
            <div class="profile-actions">
              <!-- Show different buttons based on auth/seller status -->
              <button 
                v-if="!isLoggedIn" 
                class="become-supplier-btn" 
                @click="goToLogin"
              >
                <LogIn size="16" />
                Login / Register
              </button>
              <button 
                v-else-if="!userIsSeller && !userHasPendingApplication" 
                class="become-supplier-btn" 
                @click="navigateToPath('/register-seller')"
              >
                <Briefcase size="16" />
                Become a Farmer/Seller
              </button>
              
              <button 
                v-else-if="userHasPendingApplication && !userIsSeller" 
                class="become-supplier-btn pending" 
                disabled
              >
                <Briefcase size="16" />
                Application Pending
              </button>
              
              <button 
                v-else-if="userIsSeller && userIsVerified" 
                class="become-supplier-btn approved" 
                @click="navigateToPath('/seller-dashboard')"
              >
                <Briefcase size="16" />
                Seller Dashboard
              </button>
            </div>
            
            <div class="profile-menu">
              <button v-if="isLoggedIn" class="menu-item" @click="navigateToPath('/edit-profile')">
                <UserCog size="16" />
                Edit Profile
              </button>
              <button v-if="isLoggedIn" class="menu-item">
                <Settings size="16" />
                Account Settings
              </button>
              <button v-if="isLoggedIn" class="menu-item">
                <MapPin size="16" />
                Shipping Address
              </button>
              <button v-if="isLoggedIn" class="menu-item">
                <FileText size="16" />
                Terms and Conditions
              </button>
              <button v-if="isLoggedIn" class="menu-item">
                <Shield size="16" />
                Privacy Policy
              </button>
              <button class="menu-item">
                <Star size="16" />
                Rate this App
              </button>
              <button class="menu-item" @click="shareApp">
                <Share2 size="16" />
                Share this App
              </button>
              <button v-if="isLoggedIn" class="menu-item logout" @click="confirmLogout">
                <LogOut size="16" />
                Logout
              </button>
              <button v-else class="menu-item logout" @click="goToLogin">
                <LogIn size="16" />
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="location">
        <p>Current Location</p>
        <h3>{{ userLocation }} <MapPin size="14" /></h3>
      </div>
      
    <!-- Updated Categories Section -->
    <div class="categories">
      <div 
        class="category" 
        v-for="(category, index) in displayedCategories" 
        :key="category.id || `category-${index}`" 
        @click="category.isMoreButton ? openCategoriesModal() : filterByCategory(category.category)"
        :class="{ 
          active: selectedCategory === category.category,
          'more-button': category.isMoreButton 
        }"
      >
        <div class="category-icon">
          <img 
            v-if="!category.isMoreButton"
            :src="category.image || getCategoryFallbackImage(category.category)"
            :alt="category.category"
            @error="handleImageError($event, category)"
          >
          <MoreHorizontal 
            v-else 
            size="24" 
            class="more-icon"
          />
        </div>
        <span>{{ category.isMoreButton ? 'More' : category.category }}</span>
      </div>
    </div>

    <!-- Categories Modal -->
    <div v-if="showCategoriesModal" class="modal-overlay" @click="closeCategoriesModal">
      <div class="categories-modal" @click.stop>
        <div class="modal-header">
          <h3>All Categories ({{ remainingCategories.length }} more)</h3>
          <button class="close-modal" @click="closeCategoriesModal">
            <X size="20" />
          </button>
        </div>
        <div class="modal-categories">
          <div 
            class="modal-category" 
            v-for="category in remainingCategories" 
            :key="category.id"
            @click="selectCategoryFromModal(category)"
            :class="{ active: selectedCategory === category.category }"
          >
            <div class="modal-category-icon">
              <img 
                :src="category.image || getCategoryFallbackImage(category.category)"
                :alt="category.category"
                @error="handleImageError($event, category)"
              >
            </div>
            <span>{{ category.category }}</span>
          </div>
        </div>

      </div>
    </div>
    </div>
    
    <div class="content">
      
      <div class="delivery-options">
        <div class="delivery-card pre-order" @click="filterByPreOrder">
          <div class="delivery-content">
            <h3>Pre-Order</h3>
            <p>Reserve products in advance</p>
            <button class="shop-now-btn">Shop Now</button>
          </div>
          <img 
            src="https://cdn-icons-png.flaticon.com/512/2331/2331966.png" 
            alt="Pre-Order" 
            class="delivery-image"
            @error="$event.target.src = getCategoryFallbackImage('Pre-Order')"
          >
        </div>
        <div class="delivery-card wholesale" @click="filterByWholesale">
          <div class="delivery-content">
            <h3>Wholesale</h3>
            <p>Bulk orders at better prices</p>
            <button class="shop-now-btn">Shop Now</button>
          </div>
          <img 
            src="https://cdn-icons-png.flaticon.com/512/1532/1532688.png" 
            alt="Wholesale" 
            class="delivery-image"
            @error="$event.target.src = getCategoryFallbackImage('Wholesale')"
          >
        </div>
      </div>
      
      
      <div class="active-filters" v-if="hasActiveFilters">
        <div class="filter-tag" v-if="searchQuery">
          Search: "{{ searchQuery }}"
          <button class="clear-filter" @click="clearSearchFilter">
            <X size="12" />
          </button>
        </div>
        <div class="filter-tag" v-if="selectedCategory">
          Category: {{ selectedCategory }}
          <button class="clear-filter" @click="clearCategoryFilter">
            <X size="12" />
          </button>
        </div>
        <div class="filter-tag" v-if="isPriceFiltered">
          Price: ₱{{ minPrice }} - ₱{{ maxPrice }}
          <button class="clear-filter" @click="clearPriceFilter">
            <X size="12" />
          </button>
        </div>
        <div class="filter-tag" v-if="sortOption !== 'default'">
          Sort: {{ getSortLabel(sortOption) }}
          <button class="clear-filter" @click="clearSortFilter">
            <X size="12" />
          </button>
        </div>
        <div class="filter-tag" v-for="type in typeFilter" :key="`type-${type}`">
          {{ type.charAt(0).toUpperCase() + type.slice(1) }}
          <button class="clear-filter" @click="removeTypeFilter(type)">
            <X size="12" />
          </button>
        </div>
        <button class="clear-all-filters" @click="resetAllFilters">Clear All</button>
      </div>
      
  <div v-if="!showPreOrderSection && !showWholesaleSection" class="section-header">
        <h2>{{ selectedCategory || 'All Products' }}</h2>
        <div class="section-actions">
          <span class="product-count">{{ filteredProducts.length }} products</span>
          <a href="#" class="see-more" @click.prevent="clearCategoryFilter" v-if="selectedCategory">
            Show All
          </a>
        </div>
      </div>

      
      <div class="popular-products-banner" v-if="trendingProducts.length > 0 && !hasActiveFilters">
        <h3>
          <TrendingUp size="16" />
          Trending Products
        </h3>
        <div class="popular-products-slider">
          <div class="product-slide" v-for="(product, index) in trendingProducts" :key="`trending-${index}`" @click="viewProduct(product)">
            <div class="product-slide-image">
              <img 
                :src="product.image" 
                :alt="product.productName || product.name"
                @error="handleProductImageError($event, product)"
              >
              <!-- Applied same ribbon reorganization to featured products -->
              <div v-if="getTopPriorityRibbon(product)" :class="['product-ribbon', `ribbon-${getTopPriorityRibbon(product).type}`]">
                <span>{{ getTopPriorityRibbon(product).text }}</span>
              </div>
              <div :class="['pm-top-badges', { 'has-ribbon': !!getTopPriorityRibbon(product) }]">
              </div>
              
              <div class="bottom-badges">
                <div class="trending-badge" v-if="product.isTrending">
                  <TrendingUp size="12" />
                  Trending
                </div>
                <div class="hot-seller-badge" v-if="product.isHotSeller && !product.isTrending">
                  <Flame size="12" />
                  Hot Seller
                </div>
              </div>
            </div>
            <div class="product-slide-info">
              <h4>{{ product.productName || product.name }}</h4>
              <div class="slide-meta">
                <div class="slide-price">₱{{ formatPrice(product.price) }}</div>
                <div class="slide-stats">
                  <Eye size="10" />
                  <span>{{ product.views }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      
 <div v-if="!showPreOrderSection && !showWholesaleSection" class="products-grid">
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading products...</p>
      </div>
      <div v-else-if="filteredProducts.length === 0" class="no-products">
        <img src="https://cdn-icons-png.flaticon.com/512/5445/5445197.png" alt="No products" class="no-products-icon">
        <p>No products found with current filters.</p>
        <button class="browse-all-btn" @click="resetAllFilters">Reset All Filters</button>
      </div>
      <div v-else class="products-container">
        <div class="product-card" v-for="(product, index) in filteredProducts" :key="index" @click="viewProduct(product)">
          <div class="product-image">
            <img 
              :src="product.image" 
              :alt="product.productName || product.name"
              @error="handleProductImageError($event, product)"
            >
            <!-- Reorganized badge system to prevent overlapping -->
            <!-- Priority ribbon system: only show the most important ribbon -->
            <!-- Improved badge system to prevent overlapping by stacking badges vertically -->
            <div class="badge-container">
              <!-- Top ribbon (highest priority) -->
              <div v-if="getTopPriorityRibbon(product)" :class="['product-ribbon', `ribbon-${getTopPriorityRibbon(product).type}`]">
                <span>{{ getTopPriorityRibbon(product).text }}</span>
              </div>
              
              <!-- Second row badges (status and wholesale) -->
              <div class="secondary-badges">
              </div>
              
              <!-- Third row badges (trending/hot seller) -->
              <div class="tertiary-badges">
                <div class="trending-badge" v-if="product.isTrending">
                  <TrendingUp size="12" />
                  Trending
                </div>
                <div class="hot-seller-badge" v-if="product.isHotSeller && !product.isTrending">
                  <Flame size="12" />
                  Hot Seller
                </div>
              </div>
            </div>
          </div>
          <div class="product-info">
            <h3>{{ product.productName || product.name }}</h3>
            <div class="product-meta">
              <ProductRating :productId="product.id" />
              <div class="product-stats">
                <Eye size="12" />
                <span>{{ product.views || 0 }}</span>
              </div>
              <div class="product-stats">
                <ShoppingBag size="12" />
                <span>{{ product.sold || 0 }}</span>
              </div>
            </div>
            
            <!-- Display available unit prices -->
            <!-- Switched positions: discounted price first, then original price crossed out -->
            <div class="unit-prices">
              <div v-if="product.pricePerKilo > 0" class="price-tag">
                <div v-if="product.isOnSale" class="price-with-sale">
                  <span class="sale-price">₱{{ formatPrice(calculateSalePrice(product.pricePerKilo, product.discountPercentage)) }}</span>
                  <span class="original-price">₱{{ formatPrice(product.pricePerKilo) }}</span>
                </div>
                <div v-else>
                  <span class="price">₱{{ formatPrice(product.pricePerKilo) }}</span>
                </div>
                <span class="unit">/kg</span>
              </div>
              <div v-if="product.pricePerSack > 0" class="price-tag">
                <div v-if="product.isOnSale" class="price-with-sale">
                  <span class="sale-price">₱{{ formatPrice(calculateSalePrice(product.pricePerSack, product.discountPercentage)) }}</span>
                  <span class="original-price">₱{{ formatPrice(product.pricePerSack) }}</span>
                </div>
                <div v-else>
                  <span class="price">₱{{ formatPrice(product.pricePerSack) }}</span>
                </div>
                <span class="unit">/sack</span>
              </div>
              <div v-if="product.pricePerTali > 0" class="price-tag">
                <div v-if="product.isOnSale" class="price-with-sale">
                  <span class="sale-price">₱{{ formatPrice(calculateSalePrice(product.pricePerTali, product.discountPercentage)) }}</span>
                  <span class="original-price">₱{{ formatPrice(product.pricePerTali) }}</span>
                </div>
                <div v-else>
                  <span class="price">₱{{ formatPrice(product.pricePerTali) }}</span>
                </div>
                <span class="unit">/tali</span>
              </div>
              <div v-if="product.pricePerKaing > 0" class="price-tag">
                <div v-if="product.isOnSale" class="price-with-sale">
                  <span class="sale-price">₱{{ formatPrice(calculateSalePrice(product.pricePerKaing, product.discountPercentage)) }}</span>
                  <span class="original-price">₱{{ formatPrice(product.pricePerKaing) }}</span>
                </div>
                <div v-else>
                  <span class="price">₱{{ formatPrice(product.pricePerKaing) }}</span>
                </div>
                <span class="unit">/kaing</span>
              </div>
              <div v-if="product.pricePerBundle > 0" class="price-tag">
                <div v-if="product.isOnSale" class="price-with-sale">
                  <span class="sale-price">₱{{ formatPrice(calculateSalePrice(product.pricePerBundle, product.discountPercentage)) }}</span>
                  <span class="original-price">₱{{ formatPrice(product.pricePerBundle) }}</span>
                </div>
                <div v-else>
                  <span class="price">₱{{ formatPrice(product.pricePerBundle) }}</span>
                </div>
                <span class="unit">/bundle</span>
              </div>
              <div v-if="product.pricePerTray > 0" class="price-tag">
                <div v-if="product.isOnSale" class="price-with-sale">
                  <span class="sale-price">₱{{ formatPrice(calculateSalePrice(product.pricePerTray, product.discountPercentage)) }}</span>
                  <span class="original-price">₱{{ formatPrice(product.pricePerTray) }}</span>
                </div>
                <div v-else>
                  <span class="price">₱{{ formatPrice(product.pricePerTray) }}</span>
                </div>
                <span class="unit">/tray</span>
              </div>
              <div v-if="product.pricePerPiece > 0" class="price-tag">
                <div v-if="product.isOnSale" class="price-with-sale">
                  <span class="sale-price">₱{{ formatPrice(calculateSalePrice(product.pricePerPiece, product.discountPercentage)) }}</span>
                  <span class="original-price">₱{{ formatPrice(product.pricePerPiece) }}</span>
                </div>
                <div v-else>
                  <span class="price">₱{{ formatPrice(product.pricePerPiece) }}</span>
                </div>
                <span class="unit">/piece</span>
              </div>
            </div>
          </div>
          <button class="add-to-cart-button" @click.stop="addToCart(product)" :disabled="!hasAvailableStock(product)">
            <ShoppingCart size="14" />
            <span class="add-text">Add</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Wholesale Products Section -->
    <div class="wholesale-section" v-if="showWholesaleSection">
      <div class="section-header">
        <h2>Wholesale Products</h2>
        <div class="section-actions">
          <span class="product-count">{{ wholesaleProducts.length }} products</span>
        </div>
      </div>
      
      <div class="wholesale-info">
        <div class="info-card">
          <Package size="24" />
          <h3>Bulk Orders</h3>
          <p>Get better prices when you order in bulk</p>
        </div>
        <div class="info-card">
          <Truck size="24" />
          <h3>Free Delivery</h3>
          <p>Free delivery for wholesale orders</p>
        </div>
        <div class="info-card">
          <Percent size="24" />
          <h3>Special Discounts</h3>
          <p>Additional discounts for large orders</p>
        </div>
      </div>

      <div class="products-grid">
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading wholesale products...</p>
        </div>
        <div v-else-if="wholesaleProducts.length === 0" class="no-products">
          <img src="https://cdn-icons-png.flaticon.com/512/5445/5445197.png" alt="No products" class="no-products-icon">
          <p>No wholesale products available.</p>
        </div>
        <div v-else class="products-container">
          <div class="product-card" v-for="(product, index) in wholesaleProducts" :key="index" @click="viewProduct(product)">
            <div class="product-image">
              <img 
                :src="product.image" 
                :alt="product.productName || product.name"
                @error="handleProductImageError($event, product)"
              >
              <div v-if="getTopPriorityRibbon(product)" :class="['product-ribbon', `ribbon-${getTopPriorityRibbon(product).type}`]">
                <span>{{ getTopPriorityRibbon(product).text }}</span>
              </div>
              <div :class="['pm-top-badges', { 'has-ribbon': !!getTopPriorityRibbon(product) }]">
              </div>
              
              <div class="bottom-badges">
                <div class="trending-badge" v-if="product.isTrending">
                  <TrendingUp size="12" />
                  Trending
                </div>
                <div class="hot-seller-badge" v-if="product.isHotSeller && !product.isTrending">
                  <Flame size="12" />
                  Hot Seller
                </div>
              </div>
            </div>
            <div class="product-info">
              <h3>{{ product.productName || product.name }}</h3>
              <div class="product-meta">
                <ProductRating :productId="product.id" />
                <div class="product-stats">
                  <Eye size="12" />
                  <span>{{ product.views || 0 }}</span>
                </div>
                <div class="product-stats">
                  <ShoppingBag size="12" />
                  <span>{{ product.sold || 0 }}</span>
                </div>
              </div>
              <div class="price">
                <span v-if="product.wholesalePrice && product.wholesaleAvailable">₱{{ formatPrice(product.wholesalePrice) }}</span>
                <span v-else>₱{{ formatPrice(product.price) }}</span>
                <span v-if="product.whominWholesaleQty && product.wholesaleAvailable" class="min-order">
                  Min: {{ product.whominWholesaleQty }} units
                </span>
                <span class="unit">/kg</span>
              </div>
            </div>
            <button class="add-to-cart-button" @click.stop="addToCart(product)" :disabled="product.stock <= 0">
              <ShoppingCart size="14" />
              <span class="add-text">Add</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Pre-Order Products Section -->
    <div class="pre-order-section" v-if="showPreOrderSection">
      <div class="section-header">
        <h2>Pre-Order Products</h2>
        <div class="section-actions">
          <span class="product-count">{{ preOrderProducts.length }} products</span>
        </div>
      </div>
      
      <div class="pre-order-info">
        <div class="info-card">
          <Calendar size="24" />
          <h3>Reserve Now</h3>
          <p>Reserve products before they're available</p>
        </div>
        <div class="info-card">
          <Percent size="24" />
          <h3>Special Price</h3>
          <p>Get exclusive pricing for pre-orders</p>
        </div>
        <div class="info-card">
          <Package size="24" />
          <h3>Guaranteed Stock</h3>
          <p>Secure your items before others</p>
        </div>
      </div>

      <div class="products-grid">
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading pre-order products...</p>
        </div>
        <div v-else-if="preOrderProducts.length === 0" class="no-products">
          <img src="https://cdn-icons-png.flaticon.com/512/5445/5445197.png" alt="No products" class="no-products-icon">
          <p>No pre-order products available.</p>
        </div>
        <div v-else class="products-container">
          <div class="product-card" v-for="(product, index) in preOrderProducts" :key="index" @click="viewProduct(product)">
            <div class="product-image">
              <img 
                :src="product.image" 
                :alt="product.productName || product.name"
                @error="handleProductImageError($event, product)"
              >
              <div v-if="getTopPriorityRibbon(product)" :class="['product-ribbon', `ribbon-${getTopPriorityRibbon(product).type}`]">
                <span>{{ getTopPriorityRibbon(product).text }}</span>
              </div>
              <div :class="['pm-top-badges', { 'has-ribbon': !!getTopPriorityRibbon(product) }]">
              </div>
              
              <div class="bottom-badges">
                <div class="trending-badge" v-if="product.isTrending">
                  <TrendingUp size="12" />
                  Trending
                </div>
                <div class="hot-seller-badge" v-if="product.isHotSeller && !product.isTrending">
                  <Flame size="12" />
                  Hot Seller
                </div>
              </div>
            </div>
            <div class="product-info">
              <h3>{{ product.productName || product.name }}</h3>
              <div class="product-meta">
                <ProductRating :productId="product.id" />
                <div class="product-stats">
                  <Eye size="12" />
                  <span>{{ product.views || 0 }}</span>
                </div>
                <div class="product-stats">
                  <ShoppingBag size="12" />
                  <span>{{ product.sold || 0 }}</span>
                </div>
              </div>
              <div class="price">
                <span>₱{{ formatPrice(getPreOrderDisplayPrice(product)) }}</span>
                <span v-if="product.preOrderMessage && product.preOrders" class="pre-order-message">
                  {{ product.preOrderMessage }}
                </span>
                <span v-if="product.preorderDays && product.preOrders" class="pre-order-days">
                  Available in {{ product.preorderDays }} days
                </span>
                <span v-if="product.preOrderLimit && product.preOrders" class="pre-order-limit">
                  Limit: {{ product.preOrderLimit }} units
                </span>
                <span class="unit">/kg</span>
              </div>
            </div>
            <button class="add-to-cart-button" @click.stop="addToCart(product)" :disabled="product.stock <= 0">
              <ShoppingCart size="14" />
              <span class="add-text">Add</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
    
  <bottom-navigation active-tab="/" @navigate="handleBottomNavigation" @auth-required="handleAuthRequired" />
  </div>
</template>

<script>
import BottomNavigation from '@/components/BottomNavigation.vue';
import ProductRating from '@/components/ProductRating.vue';
import Notification from '@/components/Notification.vue';
import OfflineBanner from '@/components/OfflineBanner.vue';
import { 
  Search, 
  ShoppingCart, 
  MapPin, 
  User, 
  Star, 
  UserCog, 
  Settings, 
  FileText, 
  Shield, 
  Share2, 
  LogOut,
  LogIn,
  Briefcase,
  Eye,
  ShoppingBag,
  SlidersHorizontal,
  X,
  TrendingUp,
  Flame,
  Package,
  Truck,
  Percent,
  Calendar,
  MoreHorizontal
} from 'lucide-vue-next';
import { onMounted, onUnmounted, ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/firebase/firebaseConfig';
import { collection, getDocs, doc, getDoc, query, orderBy, limit, where, addDoc, updateDoc } from 'firebase/firestore';

export default {
  components: {
    BottomNavigation,
    ProductRating,
  Notification,
  OfflineBanner,
    Search,
    ShoppingCart,
    MapPin,
    User,
    Star,
    UserCog,
    Settings,
    FileText,
    Shield,
    Share2,
    LogOut,
  LogIn,
    Briefcase,
    Eye,
    ShoppingBag,
    SlidersHorizontal,
    X,
    TrendingUp,
    Flame,
    Package,
    Truck,
    Percent,
    Calendar,
    MoreHorizontal
  },
  setup() {
    const router = useRouter();
    const showProfileMenu = ref(false);
    const showFilterMenu = ref(false);
    const showCategoriesModal = ref(false);
    const profileRef = ref(null);
    const filterRef = ref(null);
    const filterDropdownRef = ref(null);
    const cartItems = ref([]);
    const isLoading = ref(true);
    const products = ref([]);
    const trendingProducts = ref([]);
    const selectedCategory = ref('');
    const searchQuery = ref('');
    const minPrice = ref(0);
    const maxPrice = ref(1000);
    const typeFilter = ref([]);
    const isPriceFiltered = ref(false);
    const sortOption = ref('default');
    const categories = ref([]);
    const showWholesaleSection = ref(false);
    const showPreOrderSection = ref(false);

    // Fallback images for categories
    const categoryFallbackImages = {
      'default': 'https://cdn-icons-png.flaticon.com/512/1147/1147805.png'
    };

    const hasAvailableStock = (product) => {
      // Check if any of the unit stocks are available
      return (product.stockPerKilo > 0) || 
             (product.stockPerSack > 0) || 
             (product.stockPerTali > 0) || 
             (product.stockPerKaing > 0) || 
             (product.stockPerBundle > 0) || 
             (product.stockPerTray > 0) || 
             (product.stockPerPiece > 0);
    };

    // Computed property for displayed categories (max 8, with "More" button if needed)
    const displayedCategories = computed(() => {
      console.log('Computing displayedCategories, total categories:', categories.value.length);
      const visibleCount = 7; // Show 7 categories + More button
      
      if (categories.value.length <= visibleCount) {
        console.log('Showing all categories (≤7)');
        return categories.value;
      }
      
      const result = [...categories.value.slice(0, visibleCount), {
        id: 'more-categories',
        category: 'More',
        isMoreButton: true
      }];
      
      console.log('Showing 7 categories + More button');
      return result;
    });

    const remainingCategories = computed(() => {
      const visibleCount = 7;
      const remaining = categories.value.slice(visibleCount);
      console.log('Computing remainingCategories:', remaining.length, 'categories');
      return remaining;
    });

    // Modal functions
    const openCategoriesModal = () => {
      console.log('Opening categories modal, remaining categories:', remainingCategories.value.length);
      showCategoriesModal.value = true;
      document.body.style.overflow = 'hidden';
    };

    const closeCategoriesModal = () => {
      showCategoriesModal.value = false;
      document.body.style.overflow = ''; // Restore scrolling
    };

    const selectCategoryFromModal = (category) => {
      filterByCategory(category.category);
      closeCategoriesModal();
    };

    // Fetch categories from Firestore with better error handling
    const fetchCategories = async () => {
      try {
        console.log('Fetching categories from Firestore...');
        const querySnapshot = await getDocs(collection(db, 'categories'));
        
        const fetchedCategories = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            category: data.name || data.category || 'Unknown Category',
            image: data.image || getCategoryFallbackImage(data.name || data.category)
          };
        });
        
        console.log('Fetched categories:', fetchedCategories.length, fetchedCategories);
        categories.value = fetchedCategories;
        
        // Add some test categories if none exist (for testing)
        if (categories.value.length === 0) {
          console.log('No categories found, adding test categories');
          categories.value = [
            { id: '1', category: 'Vegetables', image: getCategoryFallbackImage('Vegetables') },
            { id: '2', category: 'Fruits', image: getCategoryFallbackImage('Fruits') },
            { id: '3', category: 'Grains', image: getCategoryFallbackImage('Grains') },
            { id: '4', category: 'Dairy', image: getCategoryFallbackImage('Dairy') },
            { id: '5', category: 'Meat', image: getCategoryFallbackImage('Meat') },
            { id: '6', category: 'Seafood', image: getCategoryFallbackImage('Seafood') },
            { id: '7', category: 'Herbs', image: getCategoryFallbackImage('Herbs') },
            { id: '8', category: 'Spices', image: getCategoryFallbackImage('Spices') },
            { id: '9', category: 'Nuts', image: getCategoryFallbackImage('Nuts') },
            { id: '10', category: 'Seeds', image: getCategoryFallbackImage('Seeds') },
          ];
        }
        
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback categories for testing
        categories.value = [
          { id: '1', category: 'Vegetables', image: getCategoryFallbackImage('Vegetables') },
          { id: '2', category: 'Fruits', image: getCategoryFallbackImage('Fruits') },
          { id: '3', category: 'Grains', image: getCategoryFallbackImage('Grains') },
          { id: '4', category: 'Dairy', image: getCategoryFallbackImage('Dairy') },
          { id: '5', category: 'Meat', image: getCategoryFallbackImage('Meat') },
          { id: '6', category: 'Seafood', image: getCategoryFallbackImage('Seafood') },
          { id: '7', category: 'Herbs', image: getCategoryFallbackImage('Herbs') },
          { id: '8', category: 'Spices', image: getCategoryFallbackImage('Spices') },
          { id: '9', category: 'Nuts', image: getCategoryFallbackImage('Nuts') },
          { id: '10', category: 'Seeds', image: getCategoryFallbackImage('Seeds') },
        ];
      }
    };

    // Handle image loading errors for categories
    const handleImageError = (event, category) => {
      event.target.src = getCategoryFallbackImage(category.category);
    };

    const getCategoryFallbackImage = (categoryName) => {
      // Add your fallback image logic here
      return 'https://cdn-icons-png.flaticon.com/512/1147/1147805.png'; // Example
    };

    const filterByCategory = (categoryName) => {
      // Simple toggle logic - no need to modify categories array
      selectedCategory.value = selectedCategory.value === categoryName ? '' : categoryName;
    };

const filteredProducts = computed(() => {
  let result = [...products.value];

  // Exclude products deactivated by Admin
  result = result.filter(p => p.status !== 'inactive' && p.isActive !== false);
  
  // Apply category filter (exact match with category.category)
  if (selectedCategory.value) {
    result = result.filter(product => 
      product.category === selectedCategory.value
    );
  }
      
      // Apply search filter
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(product => 
          (product.productName && product.productName.toLowerCase().includes(query)) || 
          (product.name && product.name.toLowerCase().includes(query)) ||
          (product.category && product.category.toLowerCase().includes(query)) ||
          (product.description && product.description.toLowerCase().includes(query))
        );
      }
      
      // Apply price filter
      if (isPriceFiltered.value) {
        result = result.filter(product => {
          const price = parseFloat(product.price);
          return price >= minPrice.value && price <= maxPrice.value;
        });
      }
      
      // Apply type filter
      if (typeFilter.value.length > 0) {
        result = result.filter(product => {
          const isPreOrder = product.preOrders === true || product.isPreOrder === true;
          return (
            (typeFilter.value.includes('organic') && product.isOrganic) ||
            (typeFilter.value.includes('new') && product.ribbon === 'new') ||
            (typeFilter.value.includes('sale') && product.ribbon === 'sale') ||
            (typeFilter.value.includes('trending') && product.isTrending) ||
            (typeFilter.value.includes('wholesale') && product.wholesaleAvailable) ||
            (typeFilter.value.includes('pre-order') && isPreOrder)
          );
        });
      }
      
      // Apply sorting
      if (sortOption.value !== 'default') {
        if (sortOption.value === 'price-low-high') {
          result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        } else if (sortOption.value === 'price-high-low') {
          result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        } else if (sortOption.value === 'rating') {
          result.sort((a, b) => {
            const ratingA = parseFloat(a.rating || 0);
            const ratingB = parseFloat(b.rating || 0);
            return ratingB - ratingA;
          });
        } else if (sortOption.value === 'most-viewed') {
          result.sort((a, b) => {
            const viewsA = parseInt(a.views || 0);
            const viewsB = parseInt(b.views || 0);
            return viewsB - viewsA;
          });
        } else if (sortOption.value === 'best-selling') {
          result.sort((a, b) => {
            const soldA = parseInt(a.sold || 0);
            const soldB = parseInt(b.sold || 0);
            return soldB - soldA;
          });
        } else if (sortOption.value === 'trending') {
          result.sort((a, b) => {
            const scoreA = calculatePopularityScore(a);
            const scoreB = calculatePopularityScore(b);
            return scoreB - scoreA;
          });
        }
      }
  
  result.sort((a, b) => {
    const aHasStock = hasAvailableStock(a);
    const bHasStock = hasAvailableStock(b);
    
    // If both have stock or both are sold out, maintain current order
    if (aHasStock === bHasStock) return 0;
    
    // Products with stock come first (return -1), sold out products come last (return 1)
    return aHasStock ? -1 : 1;
  });
  
  return result;
});

    // Calculate popularity score based on views, sales, and recency
    const calculatePopularityScore = (product) => {
      const views = parseInt(product.views || 0);
      const sold = parseInt(product.sold || 0);
      // Higher weight for sales than views
      return (views * 0.2) + (sold * 0.8);
    };

    // Check if any filters are active
    const hasActiveFilters = computed(() => {
      return selectedCategory.value || 
             searchQuery.value || 
             isPriceFiltered.value || 
             typeFilter.value.length > 0 ||
             sortOption.value !== 'default';
    });

    // Watch for price changes to validate min/max relationship
    watch(maxPrice, (newValue) => {
      if (newValue < minPrice.value) {
        minPrice.value = newValue;
      }
    });

    const handleProductImageError = (event, product) => {
      // Use category-specific product image or default
      const category = product.category || 'default';
      event.target.src = getCategoryFallbackImage(category);
    };

    // Clear individual filters
    const clearCategoryFilter = () => {
      selectedCategory.value = '';
    };

    const clearSearchFilter = () => {
      searchQuery.value = '';
    };

    const clearPriceFilter = () => {
      minPrice.value = 0;
      maxPrice.value = 1000;
      isPriceFiltered.value = false;
    };

    const clearSortFilter = () => {
      sortOption.value = 'default';
    };

    const removeTypeFilter = (type) => {
      typeFilter.value = typeFilter.value.filter(t => t !== type);
    };

    // Get sort label for display
    const getSortLabel = (option) => {
      switch(option) {
        case 'price-low-high': return 'Price: Low to High';
        case 'price-high-low': return 'Price: High to Low';
        case 'rating': return 'Highest Rated';
        case 'most-viewed': return 'Most Viewed';
        case 'best-selling': return 'Best Selling';
        case 'trending': return 'Trending';
        default: return 'Default';
      }
    };

    // Filter menu toggle
    const toggleFilterMenu = () => {
      showFilterMenu.value = !showFilterMenu.value;
      if (showFilterMenu.value) {
        showProfileMenu.value = false; // Close profile menu if open
      }
    };

    // Reset all filters
    const resetFilters = () => {
      // Don't reset filters immediately, wait for apply button
      minPrice.value = 0;
      maxPrice.value = 1000;
      typeFilter.value = [];
      sortOption.value = 'default';
    };

    // Reset all filters and apply immediately
    const resetAllFilters = () => {
      searchQuery.value = '';
      selectedCategory.value = '';
      minPrice.value = 0;
      maxPrice.value = 1000;
      typeFilter.value = [];
      isPriceFiltered.value = false;
      sortOption.value = 'default';
      showFilterMenu.value = false;
    };

    // Apply filters
    const applyFilters = () => {
      isPriceFiltered.value = true;
      showFilterMenu.value = false;
    };

    // Apply filters immediately (for search)
    const applyFiltersImmediately = () => {
      // This function is called when search input changes
      // No need to do anything as the computed property will update automatically
    };

    // Toggle profile menu
    const toggleProfileMenu = () => {
      showProfileMenu.value = !showProfileMenu.value;
      if (showProfileMenu.value) {
        showFilterMenu.value = false; // Close filter menu if open
      }
    };

    // Handle click outside
    const handleClickOutside = (event) => {
      // Check if click is outside both the filter button and filter dropdown
      const isOutsideFilter = filterRef.value && !filterRef.value.contains(event.target) && 
                              filterDropdownRef.value && !filterDropdownRef.value.contains(event.target);
      
      // Check if click is outside profile button
      const isOutsideProfile = profileRef.value && !profileRef.value.contains(event.target);
      
      // Only close menus if click is outside their respective areas
      if (isOutsideFilter && showFilterMenu.value) {
        showFilterMenu.value = false;
      }
      
      if (isOutsideProfile && showProfileMenu.value) {
        showProfileMenu.value = false;
      }
    };

    onMounted(() => {
      document.addEventListener('click', handleClickOutside);
      fetchCategories(); // Fetch categories when component mounts
    });

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside);
      // Restore body scroll when component unmounts
      document.body.style.overflow = '';
    });

    // Fetch trending products based on popularity
  const fetchTrendingProducts = async () => {
      try {
        // Get products with high sold counts
        const querySnapshot = await getDocs(
          query(collection(db, 'products'), 
          orderBy('sold', 'desc'), 
          limit(5))
        );
        
    trendingProducts.value = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
      ...data,
      status: data.status || 'available',
      isActive: data.isActive !== undefined ? data.isActive : true,
            isTrending: true
          };
    }).filter(p => p.status !== 'inactive' && p.isActive !== false);
      } catch (error) {
        console.error('Error fetching trending products:', error);
      }
    };

const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        
        const allProducts = querySnapshot.docs.map((doc) => {
          const productData = doc.data();
          // Normalize pre-order flag across possible field names
          const preOrderFlag = productData.preOrders === true || productData.isPreOrder === true || productData['pre-order'] === true;
          
          // Calculate if this is a trending product
          const views = parseInt(productData.views || 0);
          const sold = parseInt(productData.sold || 0);
          const isTrending = sold > 15;
          const isHotSeller = sold > 10 && sold <= 15;
          
          // Generate a random ribbon type for products without explicit data
          const hasExistingRibbon = productData.ribbon;
          let ribbon = productData.ribbon;
          
          if (!hasExistingRibbon) {
            // Prefer a meaningful ribbon when flags exist
            if (preOrderFlag) {
              ribbon = 'pre-order';
            } else if (productData.isOnSale) {
              ribbon = 'sale';
            } else if (productData.isOrganic) {
              ribbon = 'organic';
            } else {
              const ribbonTypes = ['new', 'limited', null, null];
              ribbon = ribbonTypes[Math.floor(Math.random() * ribbonTypes.length)];
            }
          }
          
          return {
            id: doc.id,
            ...productData,
            productName: productData.productName || productData.name,
            name: productData.name,
            isOrganic: productData.isOrganic || Math.random() > 0.7,
            rating: productData.rating || 0,
            views: productData.views || 0,
            sold: productData.sold || 0,
            ribbon: ribbon,
            isTrending,
            isHotSeller,
            status: productData.status || 'available',
            isActive: productData.isActive !== undefined ? productData.isActive : true,
            // Ensure all unit price fields are set
            pricePerKilo: productData.pricePerKilo || 0,
            pricePerSack: productData.pricePerSack || 0,
            pricePerTali: productData.pricePerTali || 0,
            pricePerKaing: productData.pricePerKaing || 0,
            pricePerBundle: productData.pricePerBundle || 0,
            pricePerTray: productData.pricePerTray || 0,
            pricePerPiece: productData.pricePerPiece || 0,
            stockPerKilo: productData.stockPerKilo || 0,
            stockPerSack: productData.stockPerSack || 0,
            stockPerTali: productData.stockPerTali || 0,
            stockPerKaing: productData.stockPerKaing || 0,
            stockPerBundle: productData.stockPerBundle || 0,
            stockPerTray: productData.stockPerTray || 0,
            stockPerPiece: productData.stockPerPiece || 0,
            discountPercentage: productData.discountPercentage || 0,
            isOnSale: productData.isOnSale || false,
            // Wholesale fields
            wholesaleAvailable: productData.wholesaleAvailable || false,
            wholesalePrice: productData.wholesalePrice || 0,
            whominWholesaleQty: productData.whominWholesaleQty || 0,
            // Pre-order fields (normalized)
            preOrders: preOrderFlag,
            isPreOrder: preOrderFlag,
            preorderDays: productData.preorderDays || 0,
            preOrderMessage: productData.preOrderMessage || '',
            preOrderLimit: productData.preOrderLimit || 0
          };
        });
        
        products.value = allProducts;
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        isLoading.value = false;
      }
    };

    // Add computed property for wholesale products
    const wholesaleProducts = computed(() => {
      return products.value.filter(product => product.wholesaleAvailable === true && product.status !== 'inactive' && product.isActive !== false);
    });

    // Add computed property for pre-order products
    const preOrderProducts = computed(() => {
      return products.value.filter(product => (product.preOrders === true || product.isPreOrder === true) && product.status !== 'inactive' && product.isActive !== false);
    });

    // Add method to filter by wholesale
    const filterByWholesale = () => {
      showWholesaleSection.value = true;
      showPreOrderSection.value = false;
      typeFilter.value = ['wholesale'];
      selectedCategory.value = '';
      searchQuery.value = '';
      isPriceFiltered.value = false;
      sortOption.value = 'default';
    };

    // Add method to filter by pre-order
    const filterByPreOrder = () => {
      showPreOrderSection.value = true;
      showWholesaleSection.value = false;
      typeFilter.value = ['pre-order'];
      selectedCategory.value = '';
      searchQuery.value = '';
      isPriceFiltered.value = false;
      sortOption.value = 'default';
    };

    // Reset sections when filters change
    watch([selectedCategory, searchQuery, typeFilter], ([cat, search, type]) => {
      if (!(type && type.includes('wholesale'))) {
        showWholesaleSection.value = false;
      }
      if (!(type && type.includes('pre-order'))) {
        showPreOrderSection.value = false;
      }
    });

    const getTopPriorityRibbon = (product) => {
      // Priority order: sale > limited > pre-order > new (organic disabled)
      if (product.ribbon === 'sale') {
        return { type: 'sale', text: `${product.discountPercentage || product.discount}% OFF` };
      }
      if (product.ribbon === 'limited') {
        return { type: 'limited', text: 'LIMITED' };
      }
      if (product.ribbon === 'pre-order') {
  return { type: 'pre-order', text: 'Available' };
      }
      if (product.ribbon === 'new') {
        return { type: 'new', text: 'NEW' };
      }
      return null;
    };

    return {
      router,
      showProfileMenu,
      showFilterMenu,
      showCategoriesModal,
      profileRef,
      filterRef,
      filterDropdownRef,
      toggleProfileMenu,
      toggleFilterMenu,
      openCategoriesModal,
      closeCategoriesModal,
      selectCategoryFromModal,
      cartItems,
      isLoading,
      products,
      trendingProducts,
      categories,
      displayedCategories,
      remainingCategories,
      selectedCategory,
      filteredProducts,
      filterByCategory,
      clearCategoryFilter,
      searchQuery,
      minPrice,
      maxPrice,
      typeFilter,
      isPriceFiltered,
      sortOption,
      hasActiveFilters,
      resetFilters,
      resetAllFilters,
      clearSearchFilter,
      clearPriceFilter,
      clearSortFilter,
      removeTypeFilter,
      applyFilters,
      applyFiltersImmediately,
      getSortLabel,
      handleImageError,
      getCategoryFallbackImage,
      handleProductImageError,
      fetchProducts,
      fetchTrendingProducts,
      calculatePopularityScore,
      showWholesaleSection,
      wholesaleProducts,
      filterByWholesale,
      showPreOrderSection,
      preOrderProducts,
      filterByPreOrder,
      getTopPriorityRibbon,
      hasAvailableStock // Added hasAvailableStock to return statement
    };
  },
  data() {
    return {
      userPhotoURL: '',
      username: '',
      userEmail: '',
      userLocation: 'Oriental Mindoro', // Default location
      userIsSeller: false, // Track if user is already a seller
      userIsVerified: false, // Track if user is verified
      userHasPendingApplication: false, // Track if user has pending seller application
  isLoggedIn: false,
  showNotification: false,
  notificationMessage: '',
  notificationType: 'info',
  showLoginModal: false,
  loginEmail: '',
  loginPassword: '',
  showPassword: false,
  rememberMe: false,
  isLoggingIn: false,
  notificationTimer: null,
    };
  },
  methods: {
    // Dynamic text for the green badge on product cards
  // Priority: product.badgeText -> product.statusText -> 'Available' if active -> ''
    getBadgeText(product) {
      if (!product) return '';
      const txt = (product.badgeText || product.statusText || '').toString().trim();
      if (txt) return txt;
      if (product.isActive === true || product.active === true || product.status === 'Active') {
        return 'Available';
      }
      return '';
    },
    formatPrice(price) {
      return parseFloat(price).toFixed(2);
    },
    handleAuthRequired({ label }) {
      const name = label || 'this section';
      this.notificationMessage = `You cannot open ${name}. Please log in first.`;
      this.notificationType = 'error';
      this.showNotification = true;
      this.showLoginModal = true;
      // Auto-dismiss the notification after ~6 seconds
      if (this.notificationTimer) {
        clearTimeout(this.notificationTimer);
      }
      this.notificationTimer = setTimeout(() => {
        this.showNotification = false;
        this.notificationTimer = null;
      }, 6000);
    },
    closeLoginModal() { this.showLoginModal = false; },
    async handleInlineEmailLogin() { this.$router.push('/login'); },
    async loginWithGoogleInline() { this.$router.push('/login'); },
    goToForgotPassword() { this.$router.push('/resetpassword'); },
    goToSignup() {
      this.showLoginModal = false;
      this.$router.push('/registration');
    },

    // Share app link via Web Share API or clipboard fallback
    async shareApp() {
      const shareUrl = 'https://farmxpress-965bb.web.app/';
      const shareData = {
        title: 'FarmXpress',
        text: 'Check out FarmXpress – fresh farm products delivered! ',
        url: shareUrl
      };
      try {
        if (navigator.share) {
          await navigator.share(shareData);
          this.notificationMessage = 'Thanks for sharing!';
          this.notificationType = 'success';
          this.showNotification = true;
        } else if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(shareUrl);
          this.notificationMessage = 'Link copied to clipboard!';
          this.notificationType = 'success';
          this.showNotification = true;
        } else {
          // Fallback for non-secure contexts: create a temporary input
          const input = document.createElement('input');
          input.value = shareUrl;
          document.body.appendChild(input);
          input.select();
          document.execCommand('copy');
          document.body.removeChild(input);
          this.notificationMessage = 'Link copied to clipboard!';
          this.notificationType = 'success';
          this.showNotification = true;
        }
      } catch (err) {
        console.error('Share failed:', err);
        this.notificationMessage = 'Unable to share right now. Link copied instead.';
        this.notificationType = 'warning';
        this.showNotification = true;
        try { await navigator.clipboard.writeText(shareUrl); } catch {}
      }
    },

    // Compute the display price for pre-order products (prefer per-unit pre-order, then generic)
    getPreOrderDisplayPrice(product) {
      const unitCandidates = [
        product.preOrderPricePerKilo, product.preorderPricePerKilo,
        product.preOrderPricePerSack, product.preorderPricePerSack,
        product.preOrderPricePerTali, product.preorderPricePerTali,
        product.preOrderPricePerKaing, product.preorderPricePerKaing,
        product.preOrderPricePerBundle, product.preorderPricePerBundle,
        product.preOrderPricePerTray, product.preorderPricePerTray,
        product.preOrderPricePerPiece, product.preorderPricePerPiece
      ];
      for (const val of unitCandidates) {
        const n = Number(val);
        if (!isNaN(n) && n > 0) return n;
      }
      const generic = [Number(product.preOrderPrice), Number(product.preorderPrice), Number(product.price)]
        .find(v => !isNaN(v) && v > 0);
      return generic || 0;
    },

    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    },

        calculateSalePrice(originalPrice, discountPercentage) {
      if (!discountPercentage || discountPercentage <= 0) return originalPrice;
      return originalPrice * (1 - discountPercentage / 100);
    },

    async fetchUserInfo() {
      const user = auth.currentUser;
      if (user) {
        this.userEmail = user.email;

        // Fetch user details from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            this.username = userData.username || `${userData.firstName} ${userData.lastName}`.trim();
            
            // Get profile image URL from Firestore
            this.userPhotoURL = userData.profileImageUrl || '';
            
            // Set the location if address exists in the document
            if (userData.address) {
              this.userLocation = userData.address;
            }

            // Check seller status with better logic
            this.userIsSeller = userData.isSeller || false;
            this.userIsVerified = userData.isVerified || false;
            
            console.log('🔍 Raw user data from Firestore:', {
              isSeller: userData.isSeller,
              isVerified: userData.isVerified,
              role: userData.role
            });
              // Check if user has pending application by looking at sellers collection
            await this.checkPendingSellerApplication(user.uid);
            
            console.log('📊 Final seller status:', {
              isSeller: this.userIsSeller,
              isVerified: this.userIsVerified,
              hasPendingApplication: this.userHasPendingApplication
            });
          } else {
            console.log('No user document found');
          }
        } catch (error) {
          console.error('Error fetching user info:', error);
        }
      }
    },
    async confirmLogout() {
      try {
        localStorage.clear();
        sessionStorage.clear();
        await signOut(auth);
        this.$router.push('/login');
      } catch (error) {
        console.error('Error logging out:', error);
      }
    },
    goToLogin() {
      this.showProfileMenu = false;
      this.$router.push('/login');
    },
    showLoginRequired(message = 'You cannot open this. Please log in first.') {
      this.notificationMessage = message;
      this.notificationType = 'error';
      this.showNotification = true;
    },
    viewProduct(product) {
      const productId = product.id || product.productId;
      if (!productId) {
        console.error('Product ID is undefined. Cannot navigate to product details.');
        return;
      }
      const query = {};
      if (this.showWholesaleSection) query.mode = 'wholesale';
      if (this.showPreOrderSection) query.mode = 'preorder';
      this.$router.push({ path: `/product/${productId}`, query });
    },
    handleTabChange(tab) {
      console.log(`Changed to tab: ${tab}`);
    },
    async addToCart(product) {
      try {
        // Require login to add to cart (cart is stored per-user in Firestore)
        if (!auth.currentUser) {
          this.$router.push('/login');
          return;
        }

        const userId = auth.currentUser.uid;

        // Pick a sensible default unit based on available prices (order mirrors UI)
        const unitCandidates = [
          { key: 'kg', priceField: 'pricePerKilo', stockField: 'stockPerKilo' },
          { key: 'sack', priceField: 'pricePerSack', stockField: 'stockPerSack' },
          { key: 'tali', priceField: 'pricePerTali', stockField: 'stockPerTali' },
          { key: 'kaing', priceField: 'pricePerKaing', stockField: 'stockPerKaing' },
          { key: 'bundle', priceField: 'pricePerBundle', stockField: 'stockPerBundle' },
          { key: 'tray', priceField: 'pricePerTray', stockField: 'stockPerTray' },
          { key: 'piece', priceField: 'pricePerPiece', stockField: 'stockPerPiece' },
        ];

        const chosen = unitCandidates.find(u => Number(product[u.priceField]) > 0 && Number(product[u.stockField]) > 0)
          || unitCandidates.find(u => Number(product[u.priceField]) > 0)
          || unitCandidates[0];

        const basePrice = Number(product[chosen.priceField] || 0);
        const price = product.isOnSale ? this.calculateSalePrice(basePrice, product.discountPercentage || product.discount) : basePrice;

        // Derive per-unit weight when applicable
        let weight = 0;
        if (chosen.key === 'kg') weight = 1;
        else if (chosen.key === 'sack') weight = Number(product.sackWeight || 0) || 0;
        else if (chosen.key === 'kaing') weight = Number(product.kaingWeight || 0) || 0;
        else if (chosen.key === 'bundle') weight = Number(product.bundleWeight || 0) || 0;

        const productId = product.id || product.productId;
        const productName = product.productName || product.name || 'Product';
        const productImage = product.image || product.photoUrl || '';
        const farmName = product.farmName || product.sellerName || product.shopName || product.storeName || '';
        const sellerId = product.sellerId || product.ownerId || product.userId || '';

        // If item with same product + unit already exists, increase quantity instead of adding duplicate
        const existingQuery = query(
          collection(db, 'carts'),
          where('userId', '==', userId),
          where('productId', '==', productId)
        );
        const existingSnap = await getDocs(existingQuery);
        const existing = existingSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .find(it => (it.packagingType || it.unit) === chosen.key && it.cartStatus !== true);

        if (existing) {
          await updateDoc(doc(db, 'carts', existing.id), {
            quantity: (existing.quantity || 1) + 1
          });
        } else {
          const cartDoc = {
            userId,
            sellerId,
            productId,
            productName,
            productImage,
            farmName,
            quantity: 1,
            price: Number(price) || 0,
            unitPrice: Number(price) || 0,
            packagingType: chosen.key,
            weight, // kg per unit when applicable (0 for non-weighted units)
            selected: true,
            cartStatus: false
          };
          await addDoc(collection(db, 'carts'), cartDoc);
          // Update local badge count optimistically
          this.cartItems.push({ ...cartDoc });
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
      }
    },
    navigateToPath(path, query = null) {
      console.log('🔄 Navigating to:', path);
      console.log('👤 Current user status:', {
        userIsSeller: this.userIsSeller,
        userIsVerified: this.userIsVerified,
        userHasPendingApplication: this.userHasPendingApplication
      });
      
      this.showProfileMenu = false;
      this.showFilterMenu = false;

      // Block opening Messages when not logged in
      if (!this.isLoggedIn && path === '/messages') {
        this.showLoginRequired('You cannot open Messages. Please log in first.');
        return;
      }
      
      if (query) {
        this.router.push({ path, query });
      } else {
        this.router.push(path);
      }
    },
    handleBottomNavigation(path) {
      // Block opening Messages when not logged in via bottom navigation
      if (!this.isLoggedIn && path === '/messages') {
        this.showLoginRequired('You cannot open Messages. Please log in first.');
        return;
      }
      this.router.push(path);
    },
    
    // Method to refresh user data (can be called when returning from other pages)
    async refreshUserData() {
      if (auth.currentUser) {
        console.log('🔄 Refreshing user data...');
        await this.fetchUserInfo();
      }
    },
    
    // Test method to check seller dashboard access
    async testSellerAccess() {
      console.log('🧪 Testing seller dashboard access...');
      const user = auth.currentUser;
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('👤 Current user data:', userData);
            console.log('🔐 Seller access check:', {
              isSeller: userData.isSeller,
              isSellerPending: userData.isSellerPending,
              sellerStatus: userData.sellerStatus,
              canAccess: userData.isSeller && !userData.isSellerPending
            });
          }
        } catch (error) {
          console.error('Error checking user data:', error);
        }
      }
    },
    
    // Check if user has pending seller application
    async checkPendingSellerApplication(userId) {
      try {
        const sellersQuery = query(
          collection(db, "sellers"),
          where("userId", "==", userId)
        );
        const sellersSnapshot = await getDocs(sellersQuery);
        
        if (!sellersSnapshot.empty) {
          const sellerDoc = sellersSnapshot.docs[0];
          const sellerData = sellerDoc.data();
          
          // Check if application is pending
          this.userHasPendingApplication = (
            sellerData.registrationStatus === 'Pending' || 
            sellerData.status === 'Pending' ||
            (!sellerData.isVerified && !this.userIsSeller)
          );
          
          console.log('🔍 Seller application status:', {
            registrationStatus: sellerData.registrationStatus,
            status: sellerData.status,
            isVerified: sellerData.isVerified,
            hasPendingApplication: this.userHasPendingApplication
          });
        } else {
          this.userHasPendingApplication = false;
          console.log('📝 No seller application found');
        }
      } catch (error) {
        console.error('Error checking pending seller application:', error);
        this.userHasPen
        console.error('Error checking pending seller application:', error);
        this.userHasPendingApplication = false;
      }
    },
  },
  mounted() {
  // Always fetch products regardless of auth state
  this.fetchProducts();
  this.fetchTrendingProducts();
  
  // Only fetch user info if logged in
  onAuthStateChanged(auth, (user) => {
  this.isLoggedIn = !!user;
    if (user) {
      this.fetchUserInfo();
    } else {
      // Reset all user data when logged out
      this.userPhotoURL = '';
      this.username = '';
      this.userEmail = '';
      this.userLocation = 'Oriental Mindoro'; // Reset to default
      this.userIsSeller = false;
      this.userIsVerified = false;
      this.userHasPendingApplication = false;
    }
  });
},

// Watch for route changes to refresh user data if needed
watch: {
  '$route'(to, from) {
    // If user comes from seller registration page, refresh user data
    if (from.path === '/register-seller' && to.path === '/' && auth.currentUser) {
      console.log('User returned from seller registration, refreshing data...');
      this.refreshUserData();
    }
  }
}
};
</script>

<style scoped>
/* All existing styles remain the same */
/* Base Styles */
.home-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding-bottom: 80px;
  background-color: #f8f9fa;
  width: 100%;
  margin: 0;
  box-sizing: border-box;
  overflow-x: hidden;
}

/* Header Styles */
.header {
  background: linear-gradient(135deg, #2e5c31, #1e3e21);
  padding: 15px;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  width: 100%;
  box-sizing: border-box;
  }

.search-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  width: 100%;
  box-sizing: border-box;
}

/* Filter Button Styles */
.filter-button {
  width: 40px;
  height: 40px;
  background-color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
}

.filter-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* Filter Dropdown Styles */
.filter-dropdown {
  position: absolute;
  top: 45px;
  left: 0;
  width: 280px;
  background-color: white;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
  z-index: 100;
  overflow: hidden;
  max-width: calc(100vw - 20px);
}

.filter-header {
  padding: 15px;
  background-color: #f8f8f8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eee;
}

.filter-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.close-filter {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  padding: 5px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.close-filter:hover {
  background-color: #e9ecef;
}

.filter-section {
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.filter-section h4 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 10px 0;
  color: #333;
}

/* Price Range Inputs */
.price-range {
  margin-top: 10px;
}

.price-inputs {
  display: flex;
  gap: 10px;
  align-items: center;
}

.price-input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.price-input-group label {
  font-size: 12px;
  color: #666;
}

.price-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
}

/* Sort Options */
.sort-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sort-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
}

.sort-option input {
  margin: 0;
}

.type-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.type-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
}

.filter-actions {
  padding: 15px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.reset-filters, .apply-filters {
  padding: 10px 15px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  flex: 1;
}

.reset-filters {
  background-color: #f5f5f5;
  color: #666;
}

.apply-filters {
  background-color: #2e5c31;
  color: white;
}

/* Active Filters */
.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
}

.filter-tag {
  background-color: #e9f7e9;
  color: #2e5c31;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.clear-filter {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: #2e5c31;
}

.clear-all-filters {
  background-color: #f5f5f5;
  color: #666;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 20px;
  border: none;
  cursor: pointer;
}

.search-bar {
  flex: 1;
  min-width: 0;
  background-color: white;
  border-radius: 20px;
  display: flex;
  align-items: center;
  padding: 0 15px;
  height: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-bar svg {
  color: #9e9e9e;
  margin-right: 10px;
  flex-shrink: 0;
}

.search-bar input {
  border: none;
  outline: none;
  flex: 1;
  font-size: 14px;
  min-width: 0;
  width: 100%;
}

.header-buttons {
  display: flex;
  gap: 8px;
  position: relative;
  flex-shrink: 0;
}

.icon-button {
  width: 40px;
  height: 40px;
  background-color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  overflow: hidden;
  position: relative;
  border: none;
  cursor: pointer;
}

.icon-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.cart-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #e74c3c;
  color: white;
  font-size: 10px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.profile-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.profile-icon {
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-icon-container {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
}

.profile-avatar-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-profile-icon {
  color: #666;
}
/* Profile Dropdown Menu */
.profile-dropdown {
  position: absolute;
  top: 45px;
  right: 0;
  width: 280px;
  background-color: white;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
  z-index: 100;
  overflow: hidden;
}

.profile-header {
  padding: 20px;
  background-color: #f8f8f8;
  display: flex;
  align-items: center;
  gap: 15px;
}

.profile-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #2e5c31;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e9f5e9;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-user-info h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 5px 0;
  color: #333;
}

.profile-user-info p {
  font-size: 12px;
  color: #666;
  margin: 0;
}

.profile-actions {
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.become-supplier-btn {
  width: 100%;
  padding: 10px;
  background-color: #2e5c31;
  color: white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.become-supplier-btn:hover:not(:disabled) {
  background-color: #26492a;
}

/* Pending application state */
.become-supplier-btn.pending {
  background-color: #f39c12;
  cursor: not-allowed;
  opacity: 0.8;
}

.become-supplier-btn.pending:hover {
  background-color: #f39c12;
  transform: none;
}

/* Approved seller state */
.become-supplier-btn.approved {
  background-color: #27ae60;
}

.become-supplier-btn.approved:hover {
  background-color: #219a52;
}

/* Disabled state */
.become-supplier-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.profile-menu {
  padding: 10px;
  }

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 15px;
  background: none;
  border: none;
  text-align: left;
  font-size: 14px;
  color: #333;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.menu-item:hover {
  background-color: #f5f5f5;
}

.menu-item.logout {
  color: #e74c3c;
}

.menu-item.logout:hover {
  background-color: #fee2e2;
}

.location {
  color: white;
  margin-bottom: 20px;
}

.location p {
  font-size: 12px;
  opacity: 0.8;
  margin: 0 0 4px 0;
}

.location h3 {
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0;
}

/* Updated Categories Styling - Fixed 4x2 Grid Layout */
.categories {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 8px;
  padding: 0;
  margin-top: 10px;
  width: 100%;
  box-sizing: border-box;
  max-height: 140px; /* Fixed height to ensure 2 rows */
}

.category {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.category-icon {
  width: 50px;
  height: 50px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.2s ease;
}

.category:hover .category-icon {
  transform: scale(1.1);
}

.category.active .category-icon {
  border-color: #ffcc00;
  box-shadow: 0 4px 15px rgba(255, 204, 0, 0.4);
  transform: scale(1.1);
}

.category.more-button .category-icon {
  background-color: rgba(255, 255, 255, 0.3);
  border: 2px dashed rgba(255, 255, 255, 0.5);
}

.category.more-button:hover .category-icon {
  background-color: rgba(255, 255, 255, 0.4);
  border-color: rgba(255, 255, 255, 0.7);
}

.more-icon {
  color: white;
  opacity: 0.8;
}

.category-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category span {
  color: white;
  font-size: 12px;
  font-weight: 500;
  margin-top: 2px;
  text-align: center;
  display: block;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category.active span {
  color: #ffcc00;
  font-weight: 700;
}

/* Categories Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.categories-modal {
  background-color: white;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 500px;
  max-height: 70vh;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f8f9fa;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.close-modal {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  padding: 5px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.close-modal:hover {
  background-color: #e9ecef;
}

.modal-categories {
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  max-height: 50vh;
  overflow-y: auto;
}

.modal-category {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 15px 10px;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.modal-category:hover {
  background-color: #f8f9fa;
  transform: translateY(-2px);
}

.modal-category.active {
  background-color: #e9f7e9;
  border: 2px solid #2e5c31;
}

.modal-category-icon {
  width: 60px;
  height: 60px;
  background-color: #f8f9fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2px solid #e9ecef;
  transition: all 0.2s ease;
}

.modal-category:hover .modal-category-icon {
  border-color: #2e5c31;
  transform: scale(1.05);
}

.modal-category.active .modal-category-icon {
  border-color: #2e5c31;
  background-color: #e9f7e9;
}

.modal-category-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.modal-category span {
  color: #333;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.modal-category.active span {
  color: #2e5c31;
  font-weight: 600;
}

/* Debug info styling */
.debug-info {
  background: #f0f0f0;
  padding: 10px;
  font-size: 12px;
  color: #666;
  border-top: 1px solid #ddd;
}

.debug-info p {
  margin: 2px 0;
}

.content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  width: 100%;
  box-sizing: border-box;
}

/* Delivery Options */
.delivery-options {
  display: flex;
  flex-direction: row;
  gap: 12px;
  margin-bottom: 20px;
  width: 100%;
}

.delivery-card {
  padding: 15px;
  border-radius: 15px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  min-height: 130px; /* allow content to breathe and keep buttons visible */
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  box-sizing: border-box;
  flex: 1;
}

.delivery-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.delivery-card.farm-fresh {
  background: linear-gradient(135deg, #e9f7e9, #c8e6c9);
}

.delivery-card.wholesale {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
}

.delivery-card.pre-order {
  background: linear-gradient(135deg, #f3e5f5, #e1bee7);
}

.delivery-content {
  display: flex;
  flex-direction: column;
  justify-content: flex-start; /* keep content at top */
  align-items: flex-start;
  flex: 1;
  height: 100%; /* so button can pin to the bottom */
}

.delivery-card h3 {
  font-size: 18px;
  margin: 0 0 8px 0;
  color: #333;
  font-weight: 700;
}

.delivery-card p {
  font-size: 13px;
  margin: 0 0 5px 0;
  color: #555;
  flex-grow: 1; /* fill remaining space so the button sits at bottom */
}

.delivery-card .free {
  font-size: 12px;
  color: #666;
  margin-bottom: 15px;
}

.shop-now-btn {
  background-color: #2e5c31;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
  width: fit-content;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  margin-top: auto; /* align to bottom across cards */
  white-space: nowrap; /* keep label on one line */
}

.shop-now-btn:hover {
  background-color: #26492a;
}

.delivery-image {
  width: 70px;
  height: 70px;
  opacity: 0.9;
  align-self: center;
}

/* Section Headers */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0 15px 0;
  width: 100%;
}

.section-header h2 {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  position: relative;
  margin: 0;
}

.section-header h2::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 40px;
  height: 3px;
  background-color: #2e5c31;
  border-radius: 3px;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.product-count {
  font-size: 13px;
  color: #666;
}

.see-more {
  color: #2e5c31;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  transition: color 0.2s ease;
}

.see-more:hover {
  color: #26492a;
  text-decoration: underline;
}

/* Popular Products Banner */
.popular-products-banner {
  margin-bottom: 20px;
  width: 100%;
  background-color: white;
  border-radius: 15px;
  padding: 15px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
}

.popular-products-banner h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  gap: 5px;
}

.popular-products-slider {
  display: flex;
  overflow-x: auto;
  gap: 12px;
  padding: 5px 0;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
}

.popular-products-slider::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.product-slide {
  min-width: 140px;
  max-width: 140px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease;
  cursor: pointer;
  position: relative;
  background-color: white;
}

.product-slide:hover {
  transform: translateY(-5px);
}

.product-slide-image {
  height: 100px;
  position: relative;
  overflow: hidden;
}

.product-slide-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-slide-info {
  padding: 10px;
}

.product-slide-info h4 {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 5px 0;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.slide-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.slide-price {
  font-size: 14px;
  font-weight: 700;
  color: #2e5c31;
}

.slide-stats {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: #666;
}

/* Trending Badge */
.trending-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(233, 30, 99, 0.9);
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 3px 6px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 3px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 2;
}

/* Hot Seller Badge */
.hot-seller-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(255, 87, 34, 0.9);
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 3px 6px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 3px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 2;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(46, 92, 49, 0.1);
  border-radius: 50%;
  border-top-color: #2e5c31;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* No Products State */
.no-products {
  text-align: center;
  padding: 30px 0;
  color: #666;
  font-size: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.no-products-icon {
  width: 80px;
  height: 80px;
  opacity: 0.7;
}

.browse-all-btn {
  background-color: #2e5c31;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-top: 10px;
}

.browse-all-btn:hover {
  background-color: #26492a;
}

/* Products Grid */
.products-grid {
  margin: 0;
  width: 100%;
}

.products-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  width: 100%;
}

/* Product Card Styling */
.product-card {
  background-color: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.3s ease;
  cursor: pointer;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.product-image {
  height: 140px;
  width: 100%;
  position: relative;
  overflow: hidden;
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

/* ProductManagement-style top badges row */
.pm-top-badges {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 2;
}
.pm-top-badges.has-ribbon {
  top: 32px; /* push down when ribbon is present */
}

/* Elegant pill badges (match ProductManagement look) */
.product-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  box-shadow: 0 4px 10px rgba(0,0,0,0.10);
  backdrop-filter: saturate(1.2);
}
.product-status.active {
  background-color: #10b981; /* emerald */
}
.product-status.inactive {
  background-color: #ef4444; /* red */
}

.product-badge.wholesale {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background-color: #3b82f6; /* blue */
  box-shadow: 0 4px 10px rgba(0,0,0,0.10);
}

.product-ribbon {
  position: absolute;
  top: 0;
  right: 0;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: white;
  z-index: 2;
}

.ribbon-new {
  background-color: #3498db;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 10% 50%);
  padding-left: 15px;
}

.ribbon-sale {
  background-color: #e74c3c;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 10% 50%);
  padding-left: 15px;
}

.ribbon-pre-order {
  background-color: #9b59b6;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 10% 50%);
  padding-left: 15px;
}

.ribbon-organic {
  background-color: #2ecc71;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 10% 50%);
  padding-left: 15px;
}

.ribbon-limited {
  background-color: #f39c12;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 10% 50%);
  padding-left: 15px;
}

.product-info {
  padding: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.product-info h3 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  border-bottom: 2px solid #2e5c31; /* Changed from yellow to green */
  -webkit-box-orient: vertical;
  line-clamp: 1;
  -webkit-line-clamp: 1; /* Prevent multi-line repetition */
  line-height: 1.3;
  min-height: 36px;
}

.unit-prices {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.price-tag {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 13px;
  line-height: 1.2;
}
.price {
  font-weight: 700;
  color: #2e5c31;
}
.unit {
  color: #666;
  font-size: 11px;
}

.price-with-sale {
  /* Changed from vertical to horizontal layout for prices side by side */
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 8px;
}

.original-price {
  /* Changed original price color to red and kept strikethrough */
  color: #e74c3c;
  font-size: 11px;
  text-decoration: line-through;
  line-height: 1.2;
}

.sale-price {
  /* Changed discounted price color to green and removed strikethrough */
  color: #10b981;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
}

.product-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.product-rating, .product-stats {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #666;
}

.price {
  font-size: 16px;
  font-weight: 700;
  color: #2e5c31;
  margin: 5px 0 0 0;
  display: flex;
  align-items: baseline;
}

.unit {
  font-size: 12px;
  color: #666;
  font-weight: normal;
  margin-left: 2px;
}

.add-to-cart-button {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background-color: #2e5c31;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 3px 8px rgba(46, 92, 49, 0.3);
}

.add-to-cart-button:hover:not(:disabled) {
  background-color: #26492a;
  transform: translateY(-2px);
  box-shadow: 0 5px 12px rgba(46, 92, 49, 0.4);
}

.add-to-cart-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  box-shadow: none;
}

.default-avatar-icon {
  color: #2e5c31;
}

/* Responsive Design */
@media (max-width: 320px) {
  .category span {
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    margin-top: 1px;
    text-align: center;
    display: inline-block;
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .delivery-card {
    height: 110px;
    padding: 12px;
  }
  
  .delivery-card h3 {
    font-size: 16px;
  }
  
  .delivery-image {
    width: 60px;
    height: 60px;
  }
  
  .product-info h3 {
    font-size: 13px;
  }
  
  .filter-dropdown {
    width: 260px;
  }
  
  .price-inputs {
    flex-direction: column;
  }

  .modal-categories {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 375px) {
  .categories {
    gap: 10px;
  }
  
  .category-icon {
    width: 55px;
    height: 55px;
  }
  
  .product-image {
    height: 150px;
  }
  
  .delivery-card h3 {
    font-size: 19px;
  }
}

@media (min-width: 414px) {
  .delivery-card {
    height: 130px;
  }
  
  .products-container {
    gap: 14px;
  }
  
  .product-image {
    height: 160px;
  }
}

@media (min-width: 480px) {
  .categories {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .delivery-image {
    width: 80px;
    height: 80px;
  }

  .modal-categories {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 640px) {
  .products-container {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .categories {
    grid-template-columns: repeat(8, 1fr);
    gap: 10px;
  }
  
  .header {
    padding: 20px;
  }
  
  .search-bar {
    height: 45px;
  }
  
  .filter-dropdown {
    width: 320px;
  }

  .categories-modal {
    border-radius: 20px;
    max-height: 80vh;
    align-self: center;
  }

  .modal-overlay {
    align-items: center;
  }
}

@media (min-width: 768px) {
  .products-container {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
  
  .product-image {
    height: 180px;
  }
  
  .content {
    padding: 20px;
  }
  
  .delivery-card {
    height: 150px;
    padding: 20px;
  }
  
  .delivery-card h3 {
    font-size: 22px;
  }
  
  .delivery-image {
    width: 90px;
    height: 90px;
  }

  .modal-categories {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (min-width: 1024px) {
  .products-container {
    grid-template-columns: repeat(5, 1fr);
  }
  
  .content {
    padding: 25px;
  }
  
  .header {
    border-bottom-left-radius: 25px;
    border-bottom-right-radius: 25px;
  }

  .modal-categories {
    grid-template-columns: repeat(6, 1fr);
  }
}

/* Hide "Add" text on mobile screens */
@media (max-width: 767px) {
  .add-to-cart-button .add-text {
    display: none;
  }
  
  .add-to-cart-button {
    width: 32px;
    height: 32px;
    padding: 0;
    justify-content: center;
  }
}

/* Prevent text size adjustment */
html {
  -webkit-text-size-adjust: 100%;
  -moz-text-size-adjust: 100%;
  -ms-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

/* Ensure all elements use border-box sizing */
*,
*::before,
*::after {
  box-sizing: border-box;
}

/* Disable zooming on mobile */
@viewport {
  width: device-width;
  zoom: 1.0;
  min-zoom: 1.0;
  max-zoom: 1.0;
  user-zoom: fixed;
}

.wholesale-section {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
  margin: 1rem 0;
}

.wholesale-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.info-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: transform 0.2s;
}

.info-card:hover {
  transform: translateY(-2px);
}

.info-card h3 {
  margin: 0.5rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.info-card p {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

.wholesale-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #4CAF50;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 4px;
}

.min-order {
  font-size: 0.8rem;
  color: #666;
  margin-left: 0.5rem;
}

@media (max-width: 768px) {
  .wholesale-info {
    grid-template-columns: 1fr;
  }
  
  .info-card {
    padding: 1rem;
  }
}

/* Pre-Order Section Styles */
.pre-order-section {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
  margin: 1rem 0;
}

.pre-order-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.pre-order-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #9C27B0;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 4px;
}

.pre-order-message {
  font-size: 0.8rem;
  color: #9C27B0;
  margin-left: 0.5rem;
  display: block;
  font-style: italic;
}

.pre-order-days {
  font-size: 0.8rem;
  color: #666;
  margin-left: 0.5rem;
  display: block;
}

.pre-order-limit {
  font-size: 0.8rem;
  color: #e74c3c;
  margin-left: 0.5rem;
  display: block;
  font-weight: 600;
}

.available-date {
  font-size: 0.8rem;
  color: #666;
  margin-left: 0.5rem;
  display: block;
}

@media (max-width: 768px) {
  .pre-order-info {
    grid-template-columns: 1fr;
  }
}

/* Mobile Styles */
@media (max-width: 767px) {
  .hero-section {
    height: 250px;
  padding: 0 15px;
  }
  
  .content {
  padding-left: 8px; /* further reduce side padding on small screens */
  padding-right: 8px;
  }
  
  .hero-content h1 {
    font-size: 24px;
    margin-bottom: 8px;
  }
  
  .hero-content p {
    font-size: 14px;
    margin-bottom: 15px;
  }
  
  .search-container {
    max-width: 100%;
    margin: 0 15px;
  }
  
  .categories {
    gap: 8px;
    padding: 0 10px;
  }
  
  .category-icon {
    width: 50px;
    height: 50px;
  }
  
  .category-name {
    font-size: 11px;
  }
  
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px; /* tighter gap for small screens */
    padding: 0 6px; /* reduce side padding */
  }
  
  .products-container {
    gap: 8px; /* reduce inner grid gap from 12px */
  }
  
  .product-card {
    padding: 8px;
  }
  
  .product-image {
    height: 120px;
  }
  
  .hero-overlay {
    background: rgba(0,0,0,0.35); /* improve readability in app mode */
    text-shadow: 0 1px 2px rgba(0,0,0,0.45);
  }
  
  .delivery-card {
    min-height: 130px; /* consistent min-height so buttons align */
    padding: 12px;
    display: flex;
    justify-content: space-between;
    align-items: stretch;
  }
  
  .delivery-content {
    display: flex;
    flex-direction: column;
    justify-content: flex-start; /* let content stack and button pin to bottom */
    flex: 1;
    min-height: 100%;
    padding-right: 8px;
  }
  
  .delivery-card h3 {
    font-size: 16px;
    margin: 0 0 4px 0;
  }
  
  .delivery-card p {
    font-size: 12px;
    margin: 0 0 auto 0;
    flex-grow: 1;
  }
  
  .shop-now-btn {
    margin-top: auto;
    align-self: flex-start;
  }
  
  .delivery-image {
    width: 60px;
    height: 60px;
    flex-shrink: 0;
    align-self: center;
  }
  
  .product-info h3 {
    font-size: 13px;
  }
  
  .filter-dropdown {
    width: 260px;
  }
  
  .price-inputs {
    flex-direction: column;
  }

  .modal-categories {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 767px) {
  .category span {
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    margin-top: 1px;
    text-align: center;
    display: inline-block;
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

/* Repositioned trending and hot seller badges to bottom-right */
.bottom-badges {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 2;
}

.trending-badge {
  background-color: rgba(233, 30, 99, 0.9);
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 3px 6px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 3px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

/* Hot Seller Badge */
.hot-seller-badge {
  background-color: rgba(255, 87, 34, 0.9);
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 3px 6px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 3px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

/* Updated CSS for new badge container system */
.badge-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  pointer-events: none;
}

.product-ribbon {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 15;
}

.secondary-badges {
  position: absolute;
  top: 32px;
  left: 8px;
  right: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 12;
}

.tertiary-badges {
  position: absolute;
  top: 60px;
  right: 8px;
  display: flex;
  gap: 4px;
  z-index: 11;
}

/* Fixed pricing styles to properly show original price crossed out */
.price-with-sale {
  /* Changed from vertical to horizontal layout for prices side by side */
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 8px;
}

.original-price {
  /* Changed original price color to red and kept strikethrough */
  color: #e74c3c;
  font-size: 11px;
  text-decoration: line-through;
  line-height: 1.2;
}

.sale-price {
  /* Changed discounted price color to green and removed strikethrough */
  color: #10b981;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
}

/* Login Modal Styles (aligned with ProductDetails.vue) */
.login-modal {
  background: linear-gradient(135deg, #e8f5e8, #f0f9f0);
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 400px;
  animation: slideUpModal 0.3s ease-out;
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
}

@keyframes slideUpModal {
  from { transform: translateX(-50%) translateY(100%); }
  to { transform: translateX(-50%) translateY(0); }
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

.app-branding { margin-bottom: 40px; }
.logo { width: 60px; height: 60px; margin-bottom: 15px; }
.app-title { font-size: 2rem; font-weight: 700; color: #2e5c31; margin: 0 0 5px; letter-spacing: -0.5px; }
.app-subtitle { font-size: 1rem; color: #2e5c31; margin: 0; font-weight: 400; letter-spacing: 1px; }

.login-form { max-width: 320px; margin: 0 auto; }
.input-group { margin-bottom: 20px; }
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
.input-wrapper:focus-within { border-color: #2e5c31; box-shadow: 0 0 0 4px rgba(46, 92, 49, 0.08); }
.input-icon { color: #7a8b7c; }

.login-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  padding: 14px 10px;
  font-size: 0.95rem;
  color: #1f2937;
}
.login-input::placeholder { color: #9aa7a0; }

.password-toggle { background: transparent; border: none; cursor: pointer; padding: 6px; color: #6b7280; }

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  font-size: 0.9rem;
}
.remember-me { display: flex; align-items: center; cursor: pointer; color: #2e5c31; font-weight: 500; }
.remember-me input[type="checkbox"] { width: 16px; height: 16px; margin-right: 8px; accent-color: #2e5c31; }
.checkmark { display: none; }
.forgot-password { color: #2e5c31; text-decoration: none; font-weight: 500; }
.forgot-password:hover { text-decoration: underline; }

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
.login-button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(46, 92, 49, 0.3); }
.login-button:disabled { opacity: 0.7; cursor: not-allowed; }

.login-divider { position: relative; margin: 20px 0; text-align: center; }
.login-divider::before { content: ''; position: absolute; top: 50%; left: 0; right: 0; height: 1px; background-color: #e0e0e0; }
.login-divider span { background: linear-gradient(135deg, #e8f5e8, #f0f9f0); padding: 0 15px; color: #666; font-size: 0.9rem; }

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
.google-login-btn:hover { background-color: #f9f9f9; transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }

.signup-text { font-size: 0.9rem; color: #666; margin: 0; }
.signup-link { color: #2e5c31; text-decoration: none; font-weight: 600; }
.signup-link:hover { text-decoration: underline; }

/* Align overlay for login modal */
.modal-overlay:has(.login-modal) { align-items: flex-end; }

@media (max-width: 480px) {
  .login-modal { width: 100%; border-radius: 20px 20px 0 0; }
  .login-content { padding: 15px 20px 30px; }
  .login-form { max-width: 100%; }
  .app-title { font-size: 1.8rem; }
  .input-wrapper { padding: 0 15px; }
  .login-input { padding: 12px 0; font-size: 0.95rem; }
}
</style>
