<template>
  <div class="community-page">
    <div class="header">
      <div class="search-container">
        <div class="search-bar">
          <Search :size="18" />
          <input 
            type="text" 
            placeholder="Search community posts..." 
            v-model="searchQuery"
          >
        </div>
        <div class="header-buttons">
          <button class="icon-button" @click="navigateToPath('/cart')">
            <ShoppingCart :size="18" />
            <span v-if="cartItems.length > 0" class="cart-badge">{{ cartItems.length }}</span>
          </button>
          <button class="icon-button profile-icon" @click="toggleProfileMenu" ref="profileRef">
            <User :size="18" />
          </button>
          
          <div class="profile-dropdown" v-if="showProfileMenu">
            <div class="dropdown-header">
              <div class="user-avatar">
                <img v-if="currentUser?.photoURL" :src="currentUser.photoURL" alt="User avatar">
                <User v-else :size="24" />
              </div>
              <div class="user-info">
                <h4>{{ currentUser?.displayName || 'Anonymous' }}</h4>
                <p>{{ currentUser?.email }}</p>
              </div>
            </div>
            <div class="dropdown-menu">
              <button @click="navigateToPath('/profile')">
                <User :size="16" />
                <span>My Profile</span>
              </button>
              <button @click="navigateToPath('/my-posts')" v-if="currentUser">
                <FileText :size="16" />
                <span>My Posts</span>
              </button>
              <button @click="signOut">
                <LogOut :size="16" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="community-header">
        <h2>Community Forum</h2>
        <p>Share updates, ask about products, and connect with other farmers</p>
      </div>
    </div>
    
    <div class="content">
      <!-- Create New Post Section -->
      <div class="create-post-section">
        <div class="post-composer" @click="openNewPostModal">
          <div class="composer-avatar">
            <img v-if="currentUser?.photoURL" :src="currentUser.photoURL" alt="Your avatar">
            <User v-else :size="20" />
          </div>
          <div class="composer-input">
            <span>What's on your mind? Ask about products or share updates...</span>
          </div>
          <div class="composer-actions">
            <Image :size="20" class="action-icon" />
          </div>
        </div>
      </div>
      
      <!-- Active Filters -->
      <div class="active-filters" v-if="hasActiveFilters">
        <div class="filter-tag" v-if="searchQuery">
          Search: "{{ searchQuery }}"
          <button class="clear-filter" @click="clearSearch">
            <X :size="12" />
          </button>
        </div>
        <button class="clear-all-filters" @click="clearAllFilters">
          Clear All
        </button>
      </div>
      
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading community posts...</p>
      </div>
      
      <!-- Empty State -->
      <div v-else-if="filteredPosts.length === 0" class="no-posts">
        <div class="no-posts-icon">📝</div>
        <h3>No posts yet</h3>
        <p v-if="hasActiveFilters">Try adjusting your search</p>
        <p v-else>Be the first to share something with the community!</p>
        <button class="create-post-btn" @click="openNewPostModal">
          Create First Post
        </button>
      </div>
      
      <!-- Posts List -->
      <div v-else class="posts-list">
        <div 
          class="post-card" 
          v-for="post in filteredPosts" 
          :key="post.id"
        >
          <div class="post-header">
            <div class="user-info">
              <div class="avatar">
                <img v-if="post.userPhoto && !post.isAnonymous" :src="post.userPhoto" alt="User avatar">
                <User v-else :size="24" class="default-avatar" />
              </div>
              <div class="user-details">
                <h4>{{ post.isAnonymous ? 'Anonymous Farmer' : post.userName }}</h4>
                <p class="post-time">{{ formatTime(post.createdAt) }}</p>
                <div v-if="post.productId" class="product-tag">
                  <Package :size="12" />
                  <span>Asked about: {{ post.productName }}</span>
                </div>
              </div>
            </div>
            <div class="post-menu">
              <button class="menu-button" @click="togglePostMenu(post.id)">
                <MoreHorizontal :size="16" />
              </button>
              <div class="post-dropdown" v-if="activePostMenu === post.id">
                <button @click="reportPost(post.id)">Report Post</button>
                <button v-if="post.userId === currentUser?.uid" @click="deletePost(post.id)">Delete Post</button>
              </div>
            </div>
          </div>
          
          <div class="post-content">
            <p class="post-text">{{ post.content }}</p>
            
            <!-- Product Reference Card -->
            <div v-if="post.productId && post.productData" class="product-reference-card" @click="viewProduct(post.productData)">
              <div class="product-ref-image">
                <img :src="post.productData.image || '/placeholder.svg?height=60&width=60'" alt="Product">
              </div>
              <div class="product-ref-info">
                <h4>{{ post.productData.productName }}</h4>
                <p class="product-ref-price">₱{{ getProductPrice(post.productData) }}</p>
                <span class="view-product-btn">View Product →</span>
              </div>
            </div>
            
            <div v-if="post.image" class="post-image">
              <img :src="post.image" alt="Post image" @error="handleImageError">
            </div>
          </div>
          
          <div class="post-engagement">
            <!-- Reaction Summary -->
            <div class="reaction-summary" v-if="getTotalReactions(post) > 0">
              <div class="reaction-icons">
                <span v-if="post.likeCount > 0" class="reaction-emoji">👍</span>
                <span v-if="post.loveCount > 0" class="reaction-emoji">❤️</span>
                <span v-if="post.laughCount > 0" class="reaction-emoji">😂</span>
                <span v-if="post.wowCount > 0" class="reaction-emoji">😮</span>
                <span v-if="post.sadCount > 0" class="reaction-emoji">😢</span>
                <span v-if="post.angryCount > 0" class="reaction-emoji">😠</span>
              </div>
              <span class="reaction-count">{{ getTotalReactions(post) }}</span>
              <span class="comment-count" v-if="post.replyCount > 0">
                {{ post.replyCount }} {{ post.replyCount === 1 ? 'comment' : 'comments' }}
              </span>
            </div>
            
            <!-- Action Buttons -->
            <div class="post-actions">
              <div class="action-button reaction-button" @click.stop="toggleReactionMenu(post.id)">
                <ThumbsUp 
                  :size="16" 
                  :class="{ 'reacted': getUserReaction(post.id) }"
                  :fill="getUserReaction(post.id) ? getReactionColor(getUserReaction(post.id)) : 'none'"
                  :color="getUserReaction(post.id) ? getReactionColor(getUserReaction(post.id)) : 'currentColor'"
                />
                <span 
                  :class="{ 'reacted': getUserReaction(post.id) }" 
                  :style="{ color: getUserReaction(post.id) ? getReactionColor(getUserReaction(post.id)) : '' }"
                >
                  {{ getUserReaction(post.id) ? getReactionLabel(getUserReaction(post.id)) : 'Like' }}
                </span>
                
                <!-- Reaction Menu - Fixed for Mobile -->
                <div class="reaction-menu" v-if="activeReactionMenu === post.id" @click.stop>
                  <button @click="addReaction(post.id, 'like')" class="reaction-option">
                    <span class="reaction-emoji">👍</span>
                    <span class="reaction-label">Like</span>
                  </button>
                  <button @click="addReaction(post.id, 'love')" class="reaction-option">
                    <span class="reaction-emoji">❤️</span>
                    <span class="reaction-label">Love</span>
                  </button>
                  <button @click="addReaction(post.id, 'laugh')" class="reaction-option">
                    <span class="reaction-emoji">😂</span>
                    <span class="reaction-label">Haha</span>
                  </button>
                  <button @click="addReaction(post.id, 'wow')" class="reaction-option">
                    <span class="reaction-emoji">😮</span>
                    <span class="reaction-label">Wow</span>
                  </button>
                  <button @click="addReaction(post.id, 'sad')" class="reaction-option">
                    <span class="reaction-emoji">😢</span>
                    <span class="reaction-label">Sad</span>
                  </button>
                  <button @click="addReaction(post.id, 'angry')" class="reaction-option">
                    <span class="reaction-emoji">😠</span>
                    <span class="reaction-label">Angry</span>
                  </button>
                </div>
              </div>
              
              <div class="action-button" @click.stop="toggleComments(post.id)">
                <MessageSquare :size="16" />
                <span>Comment</span>
              </div>
              
              <div class="action-button" @click.stop="sharePost(post.id)">
                <Share2 :size="16" />
                <span>Share</span>
              </div>
            </div>
            
            <!-- Comments Section -->
            <div class="comments-section" v-if="expandedComments.includes(post.id)">
              <div class="comment-composer">
                <div class="comment-avatar">
                  <img v-if="currentUser?.photoURL" :src="currentUser.photoURL" alt="Your avatar">
                  <User v-else :size="16" />
                </div>
                <div class="comment-input-container">
                  <input 
                    type="text" 
                    v-model="commentTexts[post.id]"
                    :placeholder="`Comment as ${currentUser?.displayName || 'Anonymous'}...`"
                    @keyup.enter="submitComment(post.id)"
                    class="comment-input"
                  >
                  <button 
                    v-if="commentTexts[post.id]?.trim()"
                    @click="submitComment(post.id)"
                    class="send-comment-btn"
                  >
                    <Send :size="14" />
                  </button>
                </div>
              </div>
              
              <div class="comments-list" v-if="post.replies && post.replies.length > 0">
                <div 
                  class="comment-item" 
                  v-for="(comment, index) in post.replies.slice().reverse()" 
                  :key="index"
                >
                  <div class="comment-avatar">
                    <img v-if="comment.userPhoto" :src="comment.userPhoto" alt="Commenter avatar">
                    <User v-else :size="16" />
                  </div>
                  <div class="comment-content">
                    <div class="comment-bubble">
                      <div class="comment-author">{{ comment.userName }}</div>
                      <div class="comment-text">{{ comment.content }}</div>
                    </div>
                    <div class="comment-actions">
                      <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
                      <button class="comment-action">Like</button>
                      <button class="comment-action">Reply</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- New Post Modal -->
    <div class="modal-overlay" v-if="showNewPostModal" @click="closeNewPostModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Create Post</h3>
          <button class="close-modal" @click="closeNewPostModal">
            <X :size="20" />
          </button>
        </div>
        
        <div class="modal-body">
          <div class="post-author">
            <div class="author-avatar">
              <img v-if="currentUser?.photoURL && !newPost.isAnonymous" :src="currentUser.photoURL" alt="Your avatar">
              <User v-else :size="24" />
            </div>
            <div class="author-info">
              <div class="author-name">
                {{ newPost.isAnonymous ? 'Anonymous Farmer' : (currentUser?.displayName || 'Anonymous') }}
              </div>
              <div class="privacy-selector">
                <Globe :size="12" />
                <span>Public</span>
              </div>
            </div>
          </div>
          
          <!-- Anonymous Toggle -->
          <div class="anonymous-toggle">
            <label>Post as:</label>
            <div class="toggle-options">
              <button 
                :class="{ active: !newPost.isAnonymous }"
                @click="newPost.isAnonymous = false"
              >
                <User :size="14" />
                <span>{{ currentUser?.displayName || 'My Name' }}</span>
              </button>
              <button 
                :class="{ active: newPost.isAnonymous }"
                @click="newPost.isAnonymous = true"
              >
                <EyeOff :size="14" />
                <span>Anonymous</span>
              </button>
            </div>
          </div>
          
          <!-- Product Reference Section -->
          <div class="product-reference-section" v-if="selectedProduct">
            <div class="product-ref-header">
              <Package :size="16" />
              <span>Asking about this product:</span>
              <button @click="removeProductReference" class="remove-product-btn">
                <X :size="14" />
              </button>
            </div>
            <div class="selected-product-card">
              <img :src="selectedProduct.image || '/placeholder.svg?height=50&width=50'" alt="Product">
              <div class="selected-product-info">
                <h4>{{ selectedProduct.productName }}</h4>
                <p>₱{{ getProductPrice(selectedProduct) }}</p>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <textarea 
              v-model="newPost.content" 
              :placeholder="selectedProduct ? 'Ask your question about this product...' : 'What\'s on your mind? Share updates, ask about products, or start a discussion...'"
              rows="4"
              class="post-textarea"
            ></textarea>
          </div>
          
          <div class="form-group" v-if="newPost.image">
            <div class="image-preview-container">
              <img :src="newPost.image" alt="Post preview" class="image-preview" />
              <button class="remove-image" @click="removeImage">
                <X :size="16" />
              </button>
            </div>
          </div>
          
          <div class="post-options">
            <div class="option-label">Add to your post</div>
            <div class="post-actions-row">
              <button class="post-option" @click="triggerFileInput">
                <Image :size="20" color="#45bd62" />
                <span>Photo</span>
              </button>
              <button class="post-option" @click="openProductSelector">
                <Package :size="20" color="#e74c3c" />
                <span>Product</span>
              </button>
              <input 
                type="file" 
                ref="fileInput" 
                @change="handleImageUpload" 
                accept="image/*" 
                class="file-input"
              />
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button 
            class="submit-btn" 
            @click="submitPost"
            :disabled="!isValidPost"
            :class="{ 'disabled': !isValidPost }"
          >
            Post
          </button>
        </div>
      </div>
    </div>
    
    <!-- Product Selector Modal -->
    <div class="modal-overlay" v-if="showProductSelector" @click="closeProductSelector">
      <div class="modal-content product-selector-modal" @click.stop>
        <div class="modal-header">
          <h3>Select a Product</h3>
          <button class="close-modal" @click="closeProductSelector">
            <X :size="20" />
          </button>
        </div>
        
        <div class="modal-body">
          <div class="product-search">
            <Search :size="16" />
            <input 
              type="text" 
              v-model="productSearchQuery"
              placeholder="Search products..."
              class="product-search-input"
            >
          </div>
          
          <div class="products-grid" v-if="filteredProducts.length > 0">
            <div 
              class="product-item" 
              v-for="product in filteredProducts" 
              :key="product.id"
              @click="selectProduct(product)"
            >
              <img :src="product.image || '/placeholder.svg?height=60&width=60'" alt="Product">
              <div class="product-item-info">
                <h4>{{ product.productName }}</h4>
                <p>₱{{ getProductPrice(product) }}</p>
              </div>
            </div>
          </div>
          
          <div v-else class="no-products">
            <Package :size="48" />
            <p>No products found</p>
          </div>
        </div>
      </div>
    </div>
    
    <BottomNavigation active-tab="/community" @navigate="handleBottomNavigation" />
  </div>
</template>

<script setup>
import BottomNavigation from '@/components/BottomNavigation.vue';
import { 
  Search, 
  ShoppingCart, 
  User, 
  X, 
  MessageSquare, 
  ThumbsUp, 
  Image,
  LogOut,
  FileText,
  MoreHorizontal,
  Share2,
  Send,
  Globe,
  EyeOff,
  Package
} from 'lucide-vue-next';
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { auth, db } from '@/firebase/firebaseConfig';
import { 
  collection, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  query, 
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  increment,
  arrayUnion,
  arrayRemove,
  getDoc
} from 'firebase/firestore';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';

const router = useRouter();
const route = useRoute();
const showProfileMenu = ref(false);
const profileRef = ref(null);
const cartItems = ref([]);
const isLoading = ref(true);
const posts = ref([]);
const searchQuery = ref('');
const showNewPostModal = ref(false);
const fileInput = ref(null);
const currentUser = ref(null);
const activeReactionMenu = ref(null);
const activePostMenu = ref(null);
const expandedComments = ref([]);
const commentTexts = reactive({});
const showProductSelector = ref(false);
const productSearchQuery = ref('');
const availableProducts = ref([]);
const selectedProduct = ref(null);

const newPost = ref({
  content: '',
  image: null,
  imageFile: null,
  isAnonymous: false,
  productId: null,
  productName: null
});

const isValidPost = computed(() => {
  return newPost.value.content.trim().length > 0;
});

const filteredPosts = computed(() => {
  let result = [...posts.value];
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(post => 
      post.content.toLowerCase().includes(query) ||
      (post.userName && post.userName.toLowerCase().includes(query)) ||
      (post.productName && post.productName.toLowerCase().includes(query))
    );
  }
  
  return result.sort((a, b) => {
    const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
    const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
    return bTime - aTime;
  });
});

const filteredProducts = computed(() => {
  if (!productSearchQuery.value) return availableProducts.value.slice(0, 20);
  
  const query = productSearchQuery.value.toLowerCase();
  return availableProducts.value.filter(product =>
    product.productName.toLowerCase().includes(query) ||
    (product.category && product.category.toLowerCase().includes(query))
  ).slice(0, 20);
});

const hasActiveFilters = computed(() => {
  return searchQuery.value;
});

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    let date;
    
    if (typeof timestamp === 'object' && timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      return '';
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString();
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return '';
  }
};

const getTotalReactions = (post) => {
  return (post.likeCount || 0) + (post.loveCount || 0) + (post.laughCount || 0) + 
         (post.wowCount || 0) + (post.sadCount || 0) + (post.angryCount || 0);
};

const getReactionLabel = (reactionType) => {
  const labels = {
    like: 'Like',
    love: 'Love',
    laugh: 'Haha',
    wow: 'Wow',
    sad: 'Sad',
    angry: 'Angry'
  };
  return labels[reactionType] || 'Like';
};

const getReactionColor = (reactionType) => {
  const colors = {
    like: '#4a90e2',
    love: '#e74c3c',
    laugh: '#f39c12',
    wow: '#f39c12',
    sad: '#3498db',
    angry: '#e74c3c'
  };
  return colors[reactionType] || '#4a90e2';
};

const getProductPrice = (product) => {
  if (product.pricePerKilo > 0) return product.pricePerKilo.toFixed(2) + '/kg';
  if (product.pricePerSack > 0) return product.pricePerSack.toFixed(2) + '/sack';
  if (product.pricePerTali > 0) return product.pricePerTali.toFixed(2) + '/tali';
  if (product.pricePerKaing > 0) return product.pricePerKaing.toFixed(2) + '/kaing';
  if (product.pricePerBundle > 0) return product.pricePerBundle.toFixed(2) + '/bundle';
  if (product.pricePerTray > 0) return product.pricePerTray.toFixed(2) + '/tray';
  if (product.pricePerPiece > 0) return product.pricePerPiece.toFixed(2) + '/piece';
  return '0.00';
};

const fetchAvailableProducts = async () => {
  try {
    const productsSnapshot = await getDocs(collection(db, 'products'));
    availableProducts.value = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
  }
};

const openProductSelector = () => {
  showProductSelector.value = true;
  if (availableProducts.value.length === 0) {
    fetchAvailableProducts();
  }
};

const closeProductSelector = () => {
  showProductSelector.value = false;
  productSearchQuery.value = '';
};

const selectProduct = (product) => {
  selectedProduct.value = product;
  closeProductSelector();
};

const removeProductReference = () => {
  selectedProduct.value = null;
};

const viewProduct = (product) => {
  router.push(`/product/${product.id}`);
};

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!file.type.match('image.*')) {
    alert('Please select an image file');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    alert('Image size should not exceed 5MB');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    newPost.value.image = e.target.result;
  };
  reader.readAsDataURL(file);
};

const removeImage = () => {
  newPost.value.image = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const handleImageError = (event) => {
  event.target.style.display = 'none';
};

const clearSearch = () => {
  searchQuery.value = '';
};

const clearAllFilters = () => {
  searchQuery.value = '';
};

const openNewPostModal = () => {
  if (!currentUser.value) {
    router.push('/login');
    return;
  }
  showNewPostModal.value = true;
};

const closeNewPostModal = () => {
  showNewPostModal.value = false;
  newPost.value = {
    content: '',
    image: null,
    imageFile: null,
    isAnonymous: false,
    productId: null,
    productName: null
  };
  selectedProduct.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const submitPost = async () => {
  if (!isValidPost.value) return;
  
  const user = auth.currentUser;
  if (!user) {
    alert('Please sign in to post');
    return;
  }
  
  try {
    const postData = {
      content: newPost.value.content,
      userId: user.uid,
      userName: newPost.value.isAnonymous ? 'Anonymous Farmer' : (user.displayName || 'Anonymous Farmer'),
      userPhoto: newPost.value.isAnonymous ? null : (user.photoURL || null),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      image: newPost.value.image,
      isAnonymous: newPost.value.isAnonymous,
      replyCount: 0,
      likeCount: 0,
      loveCount: 0,
      laughCount: 0,
      wowCount: 0,
      sadCount: 0,
      angryCount: 0,
      viewCount: 0,
      reactions: [],
      replies: []
    };
    
    // Add product reference if selected
    if (selectedProduct.value) {
      postData.productId = selectedProduct.value.id;
      postData.productName = selectedProduct.value.productName;
      postData.productData = selectedProduct.value;
    }
    
    await addDoc(collection(db, 'communityPosts'), postData);
    closeNewPostModal();
  } catch (error) {
    console.error('Error creating post:', error);
    alert('Error creating post. Please try again.');
  }
};

const toggleReactionMenu = (postId) => {
  if (!currentUser.value) {
    router.push('/login');
    return;
  }
  activeReactionMenu.value = activeReactionMenu.value === postId ? null : postId;
};

const togglePostMenu = (postId) => {
  activePostMenu.value = activePostMenu.value === postId ? null : postId;
};

const addReaction = async (postId, reactionType) => {
  if (!currentUser.value) {
    router.push('/login');
    return;
  }
  
  try {
    const postRef = doc(db, 'communityPosts', postId);
    const post = posts.value.find(p => p.id === postId);
    
    if (!post) return;
    
    const existingReactionIndex = post.reactions?.findIndex(
      r => r.userId === currentUser.value.uid
    ) ?? -1;
    
    if (existingReactionIndex >= 0) {
      const existingReaction = post.reactions[existingReactionIndex];
      await updateDoc(postRef, {
        reactions: arrayRemove(existingReaction),
        [`${existingReaction.reactionType}Count`]: increment(-1)
      });
      
      if (existingReaction.reactionType === reactionType) {
        activeReactionMenu.value = null;
        return;
      }
    }
    
    const newReaction = {
      userId: currentUser.value.uid,
      reactionType,
      timestamp: Date.now()
    };
    
    await updateDoc(postRef, {
      reactions: arrayUnion(newReaction),
      [`${reactionType}Count`]: increment(1)
    });
    
    activeReactionMenu.value = null;
  } catch (error) {
    console.error('Error adding reaction:', error);
  }
};

const toggleComments = (postId) => {
  if (!currentUser.value) {
    router.push('/login');
    return;
  }
  
  const index = expandedComments.value.indexOf(postId);
  if (index > -1) {
    expandedComments.value.splice(index, 1);
  } else {
    expandedComments.value.push(postId);
  }
};

const submitComment = async (postId) => {
  const commentText = commentTexts[postId];
  if (!commentText?.trim()) return;
  
  try {
    const user = auth.currentUser;
    const commentData = {
      content: commentText,
      userId: user.uid,
      userName: user.displayName || 'Anonymous Farmer',
      userPhoto: user.photoURL || null,
      createdAt: Date.now()
    };
    
    const postRef = doc(db, 'communityPosts', postId);
    await updateDoc(postRef, {
      replies: arrayUnion(commentData),
      replyCount: increment(1)
    });
    
    commentTexts[postId] = '';
  } catch (error) {
    console.error('Error submitting comment:', error);
    alert('Failed to submit comment. Please try again.');
  }
};

const sharePost = (postId) => {
  if (navigator.share) {
    navigator.share({
      title: 'Community Post',
      text: 'Check out this post from our farming community!',
      url: window.location.href
    });
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  }
};

const reportPost = (postId) => {
  alert('Post reported. Thank you for helping keep our community safe.');
};

const deletePost = async (postId) => {
  if (confirm('Are you sure you want to delete this post?')) {
    try {
      await deleteDoc(doc(db, 'communityPosts', postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post.');
    }
  }
};

const getUserReaction = (postId) => {
  if (!currentUser.value) return null;
  const post = posts.value.find(p => p.id === postId);
  if (!post || !post.reactions) return null;
  return post.reactions.find(r => r.userId === currentUser.value.uid)?.reactionType || null;
};

const navigateToPath = (path) => {
  showProfileMenu.value = false;
  router.push(path);
};

const toggleProfileMenu = () => {
  showProfileMenu.value = !showProfileMenu.value;
};

const handleBottomNavigation = (path) => {
  router.push(path);
};

const handleClickOutside = (event) => {
  if (profileRef.value && !profileRef.value.contains(event.target)) {
    showProfileMenu.value = false;
  }
  if (!event.target.closest('.reaction-button')) {
    activeReactionMenu.value = null;
  }
  if (!event.target.closest('.post-menu')) {
    activePostMenu.value = null;
  }
};

const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    router.push('/login');
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

const fetchPosts = async () => {
  try {
    isLoading.value = true;
    
    const q = query(collection(db, 'communityPosts'));
    const unsubscribePosts = onSnapshot(q, (querySnapshot) => {
      const allPosts = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt || serverTimestamp(),
          replies: data.replies || [],
          likeCount: data.likeCount || 0,
          loveCount: data.loveCount || 0,
          laughCount: data.laughCount || 0,
          wowCount: data.wowCount || 0,
          sadCount: data.sadCount || 0,
          angryCount: data.angryCount || 0,
          replyCount: data.replyCount || 0,
          viewCount: data.viewCount || 0,
          reactions: data.reactions || [],
          isAnonymous: data.isAnonymous || false,
          productId: data.productId || null,
          productName: data.productName || null,
          productData: data.productData || null
        };
      });
      
      posts.value = allPosts;
      isLoading.value = false;
    });
    
    onAuthStateChanged(auth, (user) => {
      currentUser.value = user;
    });
    
    return unsubscribePosts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    isLoading.value = false;
  }
};

const fetchProductForReference = async (productId) => {
  try {
    const productDoc = await getDoc(doc(db, 'products', productId));
    if (productDoc.exists()) {
      selectedProduct.value = { id: productDoc.id, ...productDoc.data() };
      showNewPostModal.value = true;
    }
  } catch (error) {
    console.error('Error fetching product for reference:', error);
  }
};

let unsubscribePosts = null;

onMounted(async () => {
  document.addEventListener('click', handleClickOutside);
  unsubscribePosts = await fetchPosts();
  
  // Check for product reference from route params
  if (route.query.productId) {
    fetchProductForReference(route.query.productId);
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  if (unsubscribePosts) unsubscribePosts();
});
</script>

<style scoped>
.community-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding-bottom: 80px;
  background-color: #f0f2f5;
  overflow-x: hidden;
}

/* Header Styles */
.header {
  background: linear-gradient(135deg, #2e5c31, #1e3e21);
  padding: 15px;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.search-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.search-bar {
  flex: 1;
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
}

.search-bar input {
  border: none;
  outline: none;
  flex: 1;
  font-size: 14px;
}

.header-buttons {
  display: flex;
  gap: 8px;
  position: relative;
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
  border: none;
  cursor: pointer;
  position: relative;
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

.dropdown-header {
  padding: 15px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info h4 {
  margin: 0 0 2px 0;
  font-size: 14px;
  font-weight: 600;
}

.user-info p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.dropdown-menu {
  padding: 10px 0;
}

.dropdown-menu button {
  width: 100%;
  padding: 10px 15px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.dropdown-menu button:hover {
  background-color: #f5f5f5;
}

.community-header {
  color: white;
  padding: 0 5px 10px;
}

.community-header h2 {
  font-size: 20px;
  margin: 0 0 5px 0;
}

.community-header p {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
}

/* Content Styles - Responsive Container */
.content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
}

/* Create Post Section */
.create-post-section {
  margin-bottom: 20px;
  width: 100%;
}

.post-composer {
  background-color: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
}

.post-composer:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.composer-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.composer-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.composer-input {
  flex: 1;
  padding: 12px 16px;
  background-color: #f0f2f5;
  border-radius: 20px;
  color: #65676b;
  font-size: 15px;
}

.composer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-icon {
  color: #42b883;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.action-icon:hover {
  background-color: #f0f2f5;
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

/* No Posts State */
.no-posts {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.no-posts-icon {
  font-size: 48px;
  opacity: 0.7;
}

.no-posts h3 {
  font-size: 18px;
  margin: 0;
  color: #333;
}

.create-post-btn {
  background-color: #2e5c31;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.create-post-btn:hover {
  background-color: #26492a;
}

/* Posts List - Responsive */
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

.post-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  width: 100%;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 15px 15px 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-avatar {
  color: #2e5c31;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-details h4 {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 2px 0;
  color: #050505;
  word-wrap: break-word;
}

.post-time {
  font-size: 13px;
  color: #65676b;
  margin: 0 0 4px 0;
}

.product-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #e74c3c;
  background-color: #ffeaea;
  padding: 2px 6px;
  border-radius: 10px;
  width: fit-content;
  margin-top: 4px;
}

.post-menu {
  position: relative;
  flex-shrink: 0;
}

.menu-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  color: #65676b;
  transition: background-color 0.2s ease;
}

.menu-button:hover {
  background-color: #f0f2f5;
}

.post-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
  min-width: 120px;
}

.post-dropdown button {
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.post-dropdown button:hover {
  background-color: #f0f2f5;
}

.post-content {
  padding: 15px;
}

.post-text {
  font-size: 15px;
  color: #050505;
  margin: 0 0 15px 0;
  line-height: 1.4;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* Product Reference Card - Responsive */
.product-reference-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin: 15px 0;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
}

.product-reference-card:hover {
  background-color: #e9ecef;
  transform: translateY(-1px);
}

.product-ref-image {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.product-ref-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-ref-info {
  flex: 1;
  min-width: 0;
}

.product-ref-info h4 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #333;
  word-wrap: break-word;
}

.product-ref-price {
  font-size: 13px;
  color: #2e5c31;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.view-product-btn {
  font-size: 12px;
  color: #4a90e2;
  font-weight: 500;
}

.post-image {
  margin-top: 15px;
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
}

.post-image img {
  width: 100%;
  height: auto;
  display: block;
}

/* Post Engagement */
.post-engagement {
  border-top: 1px solid #e4e6ea;
}

.reaction-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 15px;
  font-size: 13px;
  color: #65676b;
}

.reaction-icons {
  display: flex;
  align-items: center;
  gap: 2px;
}

.reaction-emoji {
  font-size: 16px;
}

.reaction-count {
  margin-left: 6px;
}

.comment-count {
  margin-left: auto;
}

.post-actions {
  display: flex;
  border-top: 1px solid #e4e6ea;
  position: relative;
}

.action-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #65676b;
  transition: background-color 0.2s ease;
  position: relative;
}

.action-button:hover {
  background-color: #f0f2f5;
}

.action-button.reacted,
.action-button .reacted {
  color: #4a90e2;
}

.reaction-button {
  position: relative;
}

/* Reaction Menu - Responsive */
.reaction-menu {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: white;
  border-radius: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: row;
  padding: 8px;
  gap: 4px;
  z-index: 20;
  margin-bottom: 8px;
  min-width: 300px;
}

.reaction-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 6px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.2s ease;
  font-size: 11px;
  color: #65676b;
  min-width: 45px;
  flex: 1;
}

.reaction-option:hover {
  background-color: #f0f2f5;
  transform: scale(1.1);
}

.reaction-option .reaction-emoji {
  font-size: 24px;
  transition: transform 0.2s ease;
}

.reaction-option:hover .reaction-emoji {
  transform: scale(1.2);
}

.reaction-label {
  font-size: 10px;
  white-space: nowrap;
}

/* Comments Section */
.comments-section {
  border-top: 1px solid #e4e6ea;
  padding: 12px 15px;
}

.comment-composer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.comment-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.comment-input-container {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: #f0f2f5;
  border-radius: 20px;
  padding: 8px 12px;
}

.comment-input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: 14px;
  color: #050505;
}

.send-comment-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #4a90e2;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.send-comment-btn:hover {
  background-color: rgba(74, 144, 226, 0.1);
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comment-item {
  display: flex;
  gap: 8px;
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-bubble {
  background-color: #f0f2f5;
  border-radius: 16px;
  padding: 8px 12px;
  display: inline-block;
  max-width: 100%;
  word-wrap: break-word;
}

.comment-author {
  font-size: 13px;
  font-weight: 600;
  color: #050505;
  margin-bottom: 2px;
}

.comment-text {
  font-size: 14px;
  color: #050505;
  line-height: 1.3;
  word-wrap: break-word;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
  padding-left: 12px;
}

.comment-time {
  font-size: 12px;
  color: #65676b;
}

.comment-action {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: #65676b;
  padding: 0;
  transition: color 0.2s ease;
}

.comment-action:hover {
  color: #4a90e2;
}

/* Modal Styles - Responsive */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background-color: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: modalFadeIn 0.3s ease;
}

.product-selector-modal {
  max-width: 600px;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e4e6ea;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: #050505;
}

.close-modal {
  background-color: #f0f2f5;
  border: none;
  cursor: pointer;
  color: #65676b;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.close-modal:hover {
  background-color: #e4e6ea;
}

.modal-body {
  padding: 20px;
}

.post-author {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.author-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.author-info {
  flex: 1;
}

.author-name {
  font-size: 15px;
  font-weight: 600;
  color: #050505;
  margin-bottom: 2px;
}

.privacy-selector {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #65676b;
}

/* Anonymous Toggle - Responsive */
.anonymous-toggle {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.anonymous-toggle label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #050505;
  margin-bottom: 8px;
}

.toggle-options {
  display: flex;
  gap: 8px;
}

.toggle-options button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #e4e6ea;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  flex: 1;
  justify-content: center;
}

.toggle-options button.active {
  background: #e3f2fd;
  border-color: #4a90e2;
  color: #4a90e2;
}

.toggle-options button:hover:not(.active) {
  background-color: #f0f2f5;
}

/* Product Reference Section */
.product-reference-section {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.product-ref-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #e74c3c;
}

.remove-product-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #65676b;
  padding: 4px;
  border-radius: 50%;
  margin-left: auto;
  transition: background-color 0.2s ease;
}

.remove-product-btn:hover {
  background-color: #e4e6ea;
}

.selected-product-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background-color: white;
  border-radius: 8px;
}

.selected-product-card img {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  object-fit: cover;
}

.selected-product-info h4 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #333;
}

.selected-product-info p {
  font-size: 13px;
  color: #2e5c31;
  font-weight: 600;
  margin: 0;
}

.form-group {
  margin-bottom: 16px;
}

.post-textarea {
  width: 100%;
  border: none;
  outline: none;
  font-size: 16px;
  color: #050505;
  resize: none;
  font-family: inherit;
  line-height: 1.4;
}

.post-textarea::placeholder {
  color: #65676b;
}

.image-preview-container {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.image-preview {
  width: 100%;
  height: auto;
  display: block;
}

.remove-image {
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.6);
  border: none;
  cursor: pointer;
  color: white;
  padding: 6px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.remove-image:hover {
  background-color: rgba(0, 0, 0, 0.8);
}

.post-options {
  border: 1px solid #e4e6ea;
  border-radius: 8px;
  padding: 12px;
}

.option-label {
  font-size: 14px;
  font-weight: 600;
  color: #050505;
  margin-bottom: 8px;
}

.post-actions-row {
  display: flex;
  gap: 8px;
}

.post-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #65676b;
  transition: background-color 0.2s ease;
  flex: 1;
  justify-content: center;
}

.post-option:hover {
  background-color: #f0f2f5;
}

.file-input {
  display: none;
}

/* Product Selector Modal */
.product-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background-color: #f0f2f5;
  border-radius: 8px;
  margin-bottom: 16px;
}

.product-search-input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: 14px;
  color: #050505;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.product-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e4e6ea;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.product-item:hover {
  background-color: #f0f2f5;
  border-color: #4a90e2;
}

.product-item img {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.product-item-info {
  flex: 1;
  min-width: 0;
}

.product-item-info h4 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-item-info p {
  font-size: 13px;
  color: #2e5c31;
  font-weight: 600;
  margin: 0;
}

.no-products {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #65676b;
  text-align: center;
}

.no-products svg {
  margin-bottom: 12px;
  opacity: 0.5;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #e4e6ea;
  display: flex;
  justify-content: flex-end;
}

.submit-btn {
  padding: 8px 24px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.submit-btn:hover:not(.disabled) {
  background-color: #357abd;
}

.submit-btn.disabled {
  background-color: #e4e6ea;
  color: #bcc0c4;
  cursor: not-allowed;
}

/* ===== RESPONSIVE DESIGN ===== */

/* Mobile First - Small screens (320px - 480px) */
@media (max-width: 480px) {
  .community-page {
    padding-bottom: 70px;
  }
  
  .header {
    padding: 12px;
    border-radius: 0 0 15px 15px;
  }
  
  .search-container {
    margin-bottom: 12px;
  }
  
  .search-bar {
    height: 36px;
    padding: 0 12px;
  }
  
  .community-header h2 {
    font-size: 18px;
  }
  
  .community-header p {
    font-size: 13px;
  }
  
  .content {
    padding: 10px;
  }
  
  .post-card {
    margin: 0 -5px;
    border-radius: 8px;
  }
  
  .post-composer {
    padding: 12px;
    gap: 10px;
  }
  
  .composer-avatar {
    width: 36px;
    height: 36px;
  }
  
  .composer-input {
    padding: 10px 14px;
    font-size: 14px;
  }
  
  .avatar {
    width: 36px;
    height: 36px;
  }
  
  .user-details h4 {
    font-size: 14px;
  }
  
  .post-time {
    font-size: 12px;
  }
  
  .product-tag {
    font-size: 11px;
    padding: 1px 4px;
  }
  
  .post-text {
    font-size: 14px;
  }
  
  .product-reference-card {
    gap: 10px;
    padding: 10px;
  }
  
  .product-ref-image {
    width: 50px;
    height: 50px;
  }
  
  .product-ref-info h4 {
    font-size: 13px;
  }
  
  .product-ref-price {
    font-size: 12px;
  }
  
  .view-product-btn {
    font-size: 11px;
  }
  
  .reaction-menu {
    min-width: 280px;
    max-width: 90vw;
    padding: 6px;
    gap: 2px;
  }
  
  .reaction-option {
    min-width: 40px;
    padding: 6px 4px;
  }
  
  .reaction-option .reaction-emoji {
    font-size: 20px;
  }
  
  .reaction-label {
    font-size: 9px;
  }
  
  .comment-avatar {
    width: 28px;
  }
}
</style>