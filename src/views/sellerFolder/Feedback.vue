<template>
  <div class="app-layout">
    <Sidebar initialActiveItem="Feedback" />
    <div class="main-content" :style="mainContentStyles">
      <div class="feedbacks-container">
        <!-- Header -->
        <div class="page-header">
          <h1>Customer Feedbacks</h1>
          <div class="header-actions">
            <div class="header-stats">
              <div class="stat-item">
                <Star size="16" fill="#FFD700" stroke="#FFD700" />
                <span>{{ overallRating.toFixed(1) }} Average Rating</span>
              </div>
              <div class="stat-item">
                <MessageSquare size="16" />
                <span>{{ totalReviews }} Total Reviews</span>
              </div>
            </div>
            <button class="refresh-btn" @click="refreshReviews" :disabled="loading">
              <RotateCcw size="16" />
              {{ loading ? 'Loading...' : 'Refresh' }}
            </button>
            
          </div>
        </div>

        <!-- Filter Section -->
        <div class="filter-section">
          <div class="filter-group">
            <label>Filter by Product:</label>
            <select v-model="selectedProduct" @change="filterReviews">
              <option value="">All Products</option>
              <option v-for="product in products" :key="product.id" :value="product.id">
                {{ product.productName }}
              </option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>Filter by Rating:</label>
            <select v-model="selectedRating" @change="filterReviews">
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Sort by:</label>
            <select v-model="sortBy" @change="sortReviews">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        </div>

        <!-- Rating Overview -->
        <div class="rating-overview">
          <div class="rating-summary">
            <div class="overall-rating">
              <h2>{{ overallRating.toFixed(1) }}</h2>
              <div class="stars">
                <Star 
                  v-for="star in 5" 
                  :key="star"
                  size="20" 
                  :fill="star <= Math.round(overallRating) ? '#FFD700' : 'transparent'"
                  :stroke="star <= Math.round(overallRating) ? '#FFD700' : '#D1D5DB'"
                />
              </div>
              <p>Based on {{ totalReviews }} reviews</p>
            </div>
            
            <div class="rating-breakdown">
              <div v-for="rating in [5, 4, 3, 2, 1]" :key="rating" class="rating-row">
                <span>{{ rating }} star</span>
                <div class="rating-bar">
                  <div 
                    class="rating-fill" 
                    :style="{ width: getRatingPercentage(rating) + '%' }"
                  ></div>
                </div>
                <span class="rating-count">{{ getRatingCount(rating) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Reviews List -->
        <div class="reviews-section">
          <div class="section-header">
            <h3>Customer Reviews ({{ filteredReviews.length }})</h3>
          </div>

          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading reviews...</p>
          </div>

          <div v-else-if="filteredReviews.length === 0" class="empty-state">
            <MessageSquare size="48" />
            <h3>No reviews found</h3>
            <p>{{ selectedProduct || selectedRating ? 'Try adjusting your filters' : 'No customer reviews yet' }}</p>
          </div>

          <div v-else class="reviews-list">
            <div v-for="review in paginatedReviews" :key="review.id" class="review-card">
              <div class="review-header">
                <div class="customer-info">
                  <div class="customer-avatar">
                    <img v-if="review.customerPhoto" :src="review.customerPhoto" :alt="review.customerName">
                    <User v-else size="20" />
                  </div>
                  <div class="customer-details">
                    <h4>{{ review.customerName || 'Anonymous Customer' }}</h4>
                    <p class="review-date">{{ formatDate(review.createdAt) }}</p>
                  </div>
                </div>
                
                <div class="review-rating">
                  <div class="stars">
                    <Star 
                      v-for="star in 5" 
                      :key="star"
                      size="14" 
                      :fill="star <= review.rating ? '#FFD700' : 'transparent'"
                      :stroke="star <= review.rating ? '#FFD700' : '#D1D5DB'"
                    />
                  </div>
                  <span class="rating-text">{{ review.rating }}/5</span>
                </div>
              </div>

              <div class="product-info">
                <div class="product-details">
                  <img v-if="review.productImage" :src="review.productImage" :alt="review.productName" class="product-image">
                  <div class="product-text">
                    <h5>{{ review.productName }}</h5>
                    <p>{{ review.productCategory }}</p>
                  </div>
                </div>
              </div>

              <div class="review-content">
                <p>{{ review.review || review.comment || 'No review text' }}</p>
                
                <!-- Show review image if available -->
                <div v-if="review.imageUrl" class="review-image">
                  <img :src="review.imageUrl" alt="Review image" @click="showImageModal(review.imageUrl)">
                </div>
                
                <!-- Debug info (remove in production) -->
                <div v-if="showDebugInfo" class="debug-info">
                  <small>
                    <strong>Debug:</strong> 
                    ID: {{ review.id }}, 
                    ProductID: {{ review.productId }}, 
                    SellerID: {{ review.sellerId }}, 
                    UserID: {{ review.userId }}
                  </small>
                </div>
              </div>

              <div class="review-actions">
                <button class="action-btn" @click="replyToReview(review)">
                  <Reply size="14" />
                  Reply
                </button>
                <button class="action-btn" @click="markAsHelpful(review)">
                  <ThumbsUp size="14" />
                  Helpful
                </button>
                <button class="action-btn danger" @click="reportReview(review)">
                  <Flag size="14" />
                  Report
                </button>
              </div>

              <!-- Reply Section -->
              <div v-if="review.reply" class="reply-section">
                <div class="reply-header">
                  <div class="seller-avatar">
                    <Store size="16" />
                  </div>
                  <div class="reply-info">
                    <h6>{{ farmName }} (Seller)</h6>
                    <p class="reply-date">{{ formatDate(review.reply.createdAt) }}</p>
                  </div>
                </div>
                <div class="reply-content">
                  <p>{{ review.reply.message }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="pagination">
            <button 
              @click="currentPage--" 
              :disabled="currentPage === 1"
              class="page-btn"
            >
              <ChevronLeft size="16" />
              Previous
            </button>
            
            <div class="page-numbers">
              <button 
                v-for="page in visiblePages" 
                :key="page"
                @click="currentPage = page"
                :class="['page-number', { active: currentPage === page }]"
              >
                {{ page }}
              </button>
            </div>
            
            <button 
              @click="currentPage++" 
              :disabled="currentPage === totalPages"
              class="page-btn"
            >
              Next
              <ChevronRight size="16" />
            </button>
          </div>
        </div>

        <!-- Reply Modal -->
        <div v-if="showReplyModal" class="modal-overlay" @click="closeReplyModal">
          <div class="modal" @click.stop>
            <div class="modal-header">
              <h3>Reply to Review</h3>
              <button class="close-btn" @click="closeReplyModal">
                <X size="20" />
              </button>
            </div>
            <div class="modal-body">
              <div class="review-preview">
                <div class="customer-info">
                  <strong>{{ selectedReview?.customerName }}</strong>
                  <div class="stars">
                    <Star 
                      v-for="star in 5" 
                      :key="star"
                      size="12" 
                      :fill="star <= selectedReview?.rating ? '#FFD700' : 'transparent'"
                      :stroke="star <= selectedReview?.rating ? '#FFD700' : '#D1D5DB'"
                    />
                  </div>
                </div>
                <p>"{{ selectedReview?.review || selectedReview?.comment || 'No review text' }}"</p>
              </div>
              <div class="reply-form">
                <label>Your Reply:</label>
                <textarea 
                  v-model="replyMessage" 
                  placeholder="Write a professional response to this review..."
                  rows="4"
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="cancel-btn" @click="closeReplyModal">Cancel</button>
              <button class="submit-btn" @click="submitReply" :disabled="!replyMessage.trim()">
                Send Reply
              </button>
            </div>
          </div>
        </div>
        
        <!-- Image Modal -->
        <div v-if="showImageModal" class="modal-overlay" @click="closeImageModal">
          <div class="image-modal" @click.stop>
            <button class="close-btn" @click="closeImageModal">
              <X size="20" />
            </button>
            <img :src="selectedImage" alt="Review image" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import { useSidebarOffset } from '@/composables/useSidebarOffset'
import { 
  Star, 
  MessageSquare, 
  User, 
  Reply, 
  ThumbsUp, 
  Flag, 
  Store,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw
} from 'lucide-vue-next'
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase/firebaseConfig'
import { onAuthStateChanged } from 'firebase/auth'

// Reactive data
const { sidebarOffset, isMobileViewport, mobileTopOffset } = useSidebarOffset()
const mainContentStyles = computed(() => ({
  marginLeft: `${sidebarOffset.value}px`,
  paddingTop: isMobileViewport.value ? mobileTopOffset : ''
}))
const loading = ref(true)
const products = ref([])
const reviews = ref([])
const filteredReviews = ref([])
const selectedProduct = ref('')
const selectedRating = ref('')
const sortBy = ref('newest')
const currentPage = ref(1)
const reviewsPerPage = 10
const farmName = ref('Your Farm')
const currentUser = ref(null)
const sellerId = ref(null)
const showDebugInfo = ref(false) // Toggle for debug information

// Modal data
const showReplyModal = ref(false)
const selectedReview = ref(null)
const replyMessage = ref('')
const showImageModal = ref(false)
const selectedImage = ref('')

// Computed properties
const overallRating = computed(() => {
  if (reviews.value.length === 0) return 0
  const sum = reviews.value.reduce((acc, review) => acc + review.rating, 0)
  return sum / reviews.value.length
})

const totalReviews = computed(() => reviews.value.length)

const totalPages = computed(() => Math.ceil(filteredReviews.value.length / reviewsPerPage))

const paginatedReviews = computed(() => {
  const start = (currentPage.value - 1) * reviewsPerPage
  const end = start + reviewsPerPage
  return filteredReviews.value.slice(start, end)
})

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, start + 4)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// Methods
const getRatingCount = (rating) => {
  return reviews.value.filter(review => review.rating === rating).length
}

const getRatingPercentage = (rating) => {
  if (totalReviews.value === 0) return 0
  return (getRatingCount(rating) / totalReviews.value) * 100
}

const filterReviews = () => {
  let filtered = [...reviews.value]
  
  if (selectedProduct.value) {
    filtered = filtered.filter(review => review.productId === selectedProduct.value)
  }
  
  if (selectedRating.value) {
    filtered = filtered.filter(review => review.rating === parseInt(selectedRating.value))
  }
  
  filteredReviews.value = filtered
  sortReviews()
  currentPage.value = 1
}

const sortReviews = () => {
  switch (sortBy.value) {
    case 'newest':
      filteredReviews.value.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      break
    case 'oldest':
      filteredReviews.value.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      break
    case 'highest':
      filteredReviews.value.sort((a, b) => b.rating - a.rating)
      break
    case 'lowest':
      filteredReviews.value.sort((a, b) => a.rating - b.rating)
      break
  }
}

const refreshReviews = async () => {
  if (sellerId.value) {
    await loadReviews()
  }
}

// Add a computed property to handle loading states better
const hasReviews = computed(() => reviews.value.length > 0)
const hasFilteredReviews = computed(() => filteredReviews.value.length > 0)

// Helper function to safely format dates
const formatDate = (date) => {
  if (!date) return ''
  
  try {
    // Handle both Date objects and Firestore Timestamps
    const dateObj = date.toDate ? date.toDate() : new Date(date)
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    console.warn('Error formatting date:', error)
    return 'Unknown date'
  }
}

const replyToReview = (review) => {
  selectedReview.value = review
  replyMessage.value = ''
  showReplyModal.value = true
}

const closeReplyModal = () => {
  showReplyModal.value = false
  selectedReview.value = null
  replyMessage.value = ''
}

const submitReply = async () => {
  if (!replyMessage.value.trim()) return
  
  try {
    // Add reply to the review document in Firebase
    const reviewRef = doc(db, 'reviews', selectedReview.value.id)
    await updateDoc(reviewRef, {
      reply: {
        message: replyMessage.value.trim(),
        createdAt: serverTimestamp(),
        sellerId: sellerId.value
      }
    })
    
    // Update local data
    const reviewIndex = reviews.value.findIndex(r => r.id === selectedReview.value.id)
    if (reviewIndex !== -1) {
      reviews.value[reviewIndex].reply = {
        message: replyMessage.value.trim(),
        createdAt: new Date(),
        sellerId: sellerId.value
      }
    }
    
    closeReplyModal()
    filterReviews() // Refresh filtered reviews
    
    console.log('Reply submitted successfully')
  } catch (error) {
    console.error('Error submitting reply:', error)
    alert('Failed to submit reply. Please try again.')
  }
}

const markAsHelpful = async (review) => {
  try {
    // You can implement this functionality by adding a helpfulCount field to reviews
    console.log('Marking as helpful:', review.id)
    
    // Example implementation:
     const reviewRef = doc(db, 'reviews', review.id)
    await updateDoc(reviewRef, {
       helpfulCount: (review.helpfulCount || 0) + 1
    })
    
    // For now, just log it
    alert('Marked as helpful!')
  } catch (error) {
    console.error('Error marking as helpful:', error)
  }
}

const reportReview = async (review) => {
  try {
    // You can implement this by creating a reports collection
    console.log('Reporting review:', review.id)
    
    // Example implementation:
    // await addDoc(collection(db, 'reports'), {
    //   reviewId: review.id,
    //   reportedBy: sellerId.value,
    //   reason: 'inappropriate', // You might want to show a modal to select reason
    //   createdAt: serverTimestamp()
    // })
    
    // For now, just log it
    if (confirm('Are you sure you want to report this review?')) {
      alert('Review reported successfully!')
    }
  } catch (error) {
    console.error('Error reporting review:', error)
  }
}

const showImageModalFunc = (imageUrl) => {
  selectedImage.value = imageUrl
  showImageModal.value = true
}

const closeImageModal = () => {
  showImageModal.value = false
  selectedImage.value = ''
}

const toggleDebugInfo = () => {
  showDebugInfo.value = !showDebugInfo.value
}

const loadReviews = async () => {
  try {
    loading.value = true
    
    if (!sellerId.value) {
      console.log('No seller ID available')
      return
    }
    
    console.log('Loading reviews for seller:', sellerId.value)
    
    // Method 1: Direct approach - Get reviews by sellerId field
    console.log('🔍 Fetching reviews directly by sellerId field...')
    const directReviewsQuery = query(
      collection(db, 'reviews'),
      where('sellerId', '==', sellerId.value)
    )
    
    const directReviewsSnapshot = await getDocs(directReviewsQuery)
    console.log(`Found ${directReviewsSnapshot.size} reviews with direct sellerId match`)
    
    const reviewsData = []
    const productIds = new Set()
    
    // Process direct reviews
    for (const reviewDoc of directReviewsSnapshot.docs) {
      const reviewData = {
        id: reviewDoc.id,
        ...reviewDoc.data()
      }
      
      console.log('Processing direct review:', reviewData)
      
      // Convert Firestore timestamps to JavaScript dates
      if (reviewData.createdAt && reviewData.createdAt.toDate) {
        reviewData.createdAt = reviewData.createdAt.toDate()
      }
      
      if (reviewData.reply && reviewData.reply.createdAt && reviewData.reply.createdAt.toDate) {
        reviewData.reply.createdAt = reviewData.reply.createdAt.toDate()
      }
      
      // Set customer details
      reviewData.customerName = reviewData.username || 'Anonymous Customer'
      reviewData.customerPhoto = null
      
      // Fetch customer details if userId exists
      if (reviewData.userId) {
        try {
          const customerDoc = await getDoc(doc(db, 'users', reviewData.userId))
          if (customerDoc.exists()) {
            const customerData = customerDoc.data()
            reviewData.customerName = customerData.fullName || customerData.displayName || customerData.username || reviewData.username || 'Anonymous Customer'
            reviewData.customerPhoto = customerData.photoURL || null
          }
        } catch (customerError) {
          console.warn('Error fetching customer details:', customerError)
        }
      }
      
      // Fetch product details if productId exists
      if (reviewData.productId) {
        productIds.add(reviewData.productId)
        try {
          const productDoc = await getDoc(doc(db, 'products', reviewData.productId))
          if (productDoc.exists()) {
            const productData = productDoc.data()
            reviewData.productName = productData.productName || 'Unknown Product'
            reviewData.productCategory = productData.category || 'Unknown Category'
            reviewData.productImage = productData.productImage || (productData.images && productData.images[0]) || null
          } else {
            console.warn(`Product ${reviewData.productId} not found`)
            reviewData.productName = reviewData.productName || 'Unknown Product'
            reviewData.productCategory = 'Unknown Category'
            reviewData.productImage = reviewData.productImage || null
          }
        } catch (productError) {
          console.warn('Error fetching product details:', productError)
          reviewData.productName = reviewData.productName || 'Unknown Product'
          reviewData.productCategory = 'Unknown Category'
          reviewData.productImage = reviewData.productImage || null
        }
      } else {
        // Use data from review if no productId
        reviewData.productName = reviewData.productName || 'Unknown Product'
        reviewData.productCategory = 'Unknown Category'
        reviewData.productImage = reviewData.productImage || null
      }
      
      reviewsData.push(reviewData)
    }
    
    // Method 2: Fallback approach - Get reviews through products (in case some reviews don't have sellerId)
    console.log('🔍 Checking for additional reviews through products...')
    const sellerProductsQuery = query(
      collection(db, 'products'),
      where('userId', '==', sellerId.value)
    )
    
    const productsSnapshot = await getDocs(sellerProductsQuery)
    const sellerProductIds = []
    const productDetails = {}
    
    productsSnapshot.forEach(doc => {
      const productData = doc.data()
      sellerProductIds.push(doc.id)
      productDetails[doc.id] = productData
    })
    
    console.log('Found seller products:', sellerProductIds)
    
    // Get reviews for products that don't already have reviews with sellerId
    for (const productId of sellerProductIds) {
      if (!productIds.has(productId)) {
        try {
          const reviewsQuery = query(
            collection(db, 'reviews'),
            where('productId', '==', productId)
          )
          
          const reviewsSnapshot = await getDocs(reviewsQuery)
          console.log(`Found ${reviewsSnapshot.size} additional reviews for product ${productId}`)
          
          for (const reviewDoc of reviewsSnapshot.docs) {
            const reviewData = {
              id: reviewDoc.id,
              ...reviewDoc.data()
            }
            
            // Skip if we already have this review
            if (reviewsData.some(r => r.id === reviewData.id)) {
              continue
            }
            
            console.log('Processing additional review:', reviewData)
            
            // Convert timestamps
            if (reviewData.createdAt && reviewData.createdAt.toDate) {
              reviewData.createdAt = reviewData.createdAt.toDate()
            }
            
            if (reviewData.reply && reviewData.reply.createdAt && reviewData.reply.createdAt.toDate) {
              reviewData.reply.createdAt = reviewData.reply.createdAt.toDate()
            }
            
            // Add product details
            const productData = productDetails[productId]
            reviewData.productName = productData.productName || 'Unknown Product'
            reviewData.productCategory = productData.category || 'Unknown Category'
            reviewData.productImage = productData.productImage || (productData.images && productData.images[0]) || null
            
            // Set customer details
            reviewData.customerName = reviewData.username || 'Anonymous Customer'
            reviewData.customerPhoto = null
            
            // Fetch customer details
            if (reviewData.userId) {
              try {
                const customerDoc = await getDoc(doc(db, 'users', reviewData.userId))
                if (customerDoc.exists()) {
                  const customerData = customerDoc.data()
                  reviewData.customerName = customerData.fullName || customerData.displayName || customerData.username || reviewData.username || 'Anonymous Customer'
                  reviewData.customerPhoto = customerData.photoURL || null
                }
              } catch (customerError) {
                console.warn('Error fetching customer details:', customerError)
              }
            }
            
            reviewsData.push(reviewData)
          }
        } catch (error) {
          console.error(`Error fetching reviews for product ${productId}:`, error)
        }
      }
    }
    
    reviews.value = reviewsData
    filteredReviews.value = [...reviewsData]
    
    // Load unique products for filter dropdown
    const uniqueProducts = new Map()
    reviewsData.forEach(review => {
      if (review.productId && review.productName) {
        uniqueProducts.set(review.productId, {
          id: review.productId,
          productName: review.productName
        })
      }
    })
    products.value = Array.from(uniqueProducts.values())
    
    sortReviews()
    
    console.log(`✅ Loaded ${reviewsData.length} total reviews for seller ${sellerId.value}`)
    console.log('Reviews data:', reviewsData)
  } catch (error) {
    console.error('Error loading reviews:', error)
    // Set empty arrays on error
    reviews.value = []
    filteredReviews.value = []
    products.value = []
  } finally {
    loading.value = false
  }
}

const initializeAuth = () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser.value = user
      sellerId.value = user.uid
      
      console.log('Authenticated user:', user.uid)
      
      // Fetch seller/farm name
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          farmName.value = userData.farmName || userData.fullName || 'Your Farm'
          console.log('Seller data loaded:', userData)
        } else {
          console.log('User document not found')
        }
      } catch (error) {
        console.warn('Error fetching user details:', error)
      }
      
      // Run debug function first
      await debugFirebaseData()
      
      // Load reviews after getting seller ID
      await loadReviews()
    } else {
      console.log('No authenticated user')
      currentUser.value = null
      sellerId.value = null
      reviews.value = []
      filteredReviews.value = []
      products.value = []
      loading.value = false
    }
  })
}

onMounted(() => {
  initializeAuth()
})

// Debug function to check what data exists
const debugFirebaseData = async () => {
  console.log('=== DEBUG: Checking Firebase Data ===')
  
  // Check current user
  console.log('Current authenticated user:', auth.currentUser?.uid)
  console.log('Current sellerId:', sellerId.value)
  
  // Check reviews collection for this seller
  try {
    console.log('\n🔍 Checking reviews by sellerId...')
    const reviewsBySellerQuery = query(
      collection(db, 'reviews'),
      where('sellerId', '==', sellerId.value)
    )
    const reviewsBySellerSnapshot = await getDocs(reviewsBySellerQuery)
    console.log(`Found ${reviewsBySellerSnapshot.size} reviews with sellerId: ${sellerId.value}`)
    
    reviewsBySellerSnapshot.forEach(doc => {
      const data = doc.data()
      console.log(`Review ${doc.id}:`, {
        productId: data.productId,
        productName: data.productName,
        sellerId: data.sellerId,
        userId: data.userId,
        username: data.username,
        rating: data.rating,
        review: data.review
      })
    })
  } catch (error) {
    console.error('Error fetching reviews by sellerId:', error)
  }
  
  // Check products collection
  try {
    console.log('\n🔍 Checking products by userId...')
    const sellerProductsQuery = query(
      collection(db, 'products'),
      where('userId', '==', sellerId.value)
    )
    const productsSnapshot = await getDocs(sellerProductsQuery)
    console.log(`Found ${productsSnapshot.size} products with userId: ${sellerId.value}`)
    
    productsSnapshot.forEach(doc => {
      const data = doc.data()
      console.log(`Product ${doc.id}:`, {
        productName: data.productName,
        userId: data.userId,
        category: data.category
      })
    })
  } catch (error) {
    console.error('Error fetching products:', error)
  }
  
  // Check all reviews in database
  try {
    console.log('\n🔍 Checking all reviews in database...')
    const allReviewsSnapshot = await getDocs(collection(db, 'reviews'))
    console.log(`Total reviews in database: ${allReviewsSnapshot.size}`)
    
    allReviewsSnapshot.forEach(doc => {
      const data = doc.data()
      console.log(`Review ${doc.id}:`, {
        productId: data.productId,
        productName: data.productName,
        sellerId: data.sellerId,
        userId: data.userId,
        username: data.username,
        rating: data.rating,
        belongsToCurrentSeller: data.sellerId === sellerId.value
      })
    })
  } catch (error) {
    console.error('Error fetching all reviews:', error)
  }
  
  console.log('=== END DEBUG ===')
}
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  margin-left: 250px;
  transition: margin-left 0.3s ease;
}

/* Adjust for collapsed sidebar */
@media (min-width: 768px) {
  .main-content {
    margin-left: 250px;
  }
}

/* Mobile adjustments */
@media (max-width: 767px) {
  .main-content {
    margin-left: 0;
    padding-top: 56px; /* Account for mobile header */
  }
}

.feedbacks-container {
  padding: 20px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #2e5c31;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-weight: 500;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: #2e5c31;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background-color: #1e3d20;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.filter-section {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
}

.filter-group select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
}

.rating-overview {
  margin-bottom: 30px;
}

.rating-summary {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 40px;
  align-items: center;
}

.overall-rating {
  text-align: center;
}

.overall-rating h2 {
  font-size: 3rem;
  font-weight: 700;
  color: #2e5c31;
  margin: 0 0 10px 0;
}

.stars {
  display: flex;
  justify-content: center;
  gap: 2px;
  margin-bottom: 10px;
}

.overall-rating p {
  color: #6b7280;
  margin: 0;
}

.rating-breakdown {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rating-row {
  display: grid;
  grid-template-columns: 60px 1fr 40px;
  align-items: center;
  gap: 15px;
  font-size: 0.9rem;
}

.rating-bar {
  height: 8px;
  background-color: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.rating-fill {
  height: 100%;
  background-color: #ffd700;
  transition: width 0.3s ease;
}

.rating-count {
  text-align: right;
  color: #6b7280;
}

.reviews-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.section-header {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.section-header h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.loading-state, .empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #6b7280;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #2e5c31;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state h3 {
  margin: 20px 0 10px;
  color: #374151;
}

.reviews-list {
  display: flex;
  flex-direction: column;
}

.review-card {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.review-card:last-child {
  border-bottom: none;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.customer-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.customer-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.customer-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.customer-details h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 2px 0;
}

.review-date {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0;
}

.review-rating {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rating-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
}

.product-info {
  margin-bottom: 15px;
}

.product-details {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: #f9fafb;
  border-radius: 8px;
}

.product-image {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  object-fit: cover;
}

.product-text h5 {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 2px 0;
}

.product-text p {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0;
}

.review-content {
  margin-bottom: 15px;
}

.review-content p {
  color: #374151;
  line-height: 1.6;
  margin: 0;
}

.review-actions {
  display: flex;
  gap: 15px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background-color: #f9fafb;
  color: #374151;
}

.action-btn.danger:hover {
  color: #ef4444;
  border-color: #ef4444;
}

.reply-section {
  margin-top: 15px;
  padding: 15px;
  background-color: #f0f8f0;
  border-radius: 8px;
  border-left: 3px solid #2e5c31;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.seller-avatar {
  width: 30px;
  height: 30px;
  background-color: #2e5c31;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reply-info h6 {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
  color: #2e5c31;
}

.reply-date {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0;
}

.reply-content p {
  color: #374151;
  margin: 0;
  font-size: 0.9rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

.page-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background-color: #f9fafb;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 5px;
}

.page-number {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.page-number:hover {
  background-color: #f9fafb;
}

.page-number.active {
  background-color: #2e5c31;
  color: white;
  border-color: #2e5c31;
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
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
}

.modal-body {
  padding: 20px;
}

.review-preview {
  padding: 15px;
  background-color: #f9fafb;
  border-radius: 8px;
  margin-bottom: 20px;
}

.review-preview .customer-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.review-preview p {
  color: #6b7280;
  font-style: italic;
  margin: 0;
}

.reply-form label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
}

.reply-form textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  resize: vertical;
  min-height: 100px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn {
  padding: 10px 20px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #374151;
  cursor: pointer;
}

.submit-btn {
  padding: 10px 20px;
  background-color: #2e5c31;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.review-image {
  margin-top: 10px;
}

.review-image img {
  max-width: 200px;
  max-height: 150px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.review-image img:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.debug-info {
  margin-top: 10px;
  padding: 8px;
  background-color: #f3f4f6;
  border-radius: 4px;
  font-family: monospace;
  font-size: 10px;
  color: #6b7280;
}

.image-modal {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.image-modal img {
  width: 100%;
  height: auto;
  display: block;
}

.image-modal .close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.refresh-btn.active {
  background-color: #1e3d20;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    flex-direction: column;
    gap: 15px;
  }
  
  .header-stats {
    justify-content: space-between;
    width: 100%;
  }
  
  .filter-section {
    flex-direction: column;
    gap: 15px;
  }
  
  .rating-summary {
    grid-template-columns: 1fr;
    gap: 30px;
    text-align: center;
  }
  
  .review-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .review-actions {
    flex-wrap: wrap;
    gap: 10px;
  }
}
</style>