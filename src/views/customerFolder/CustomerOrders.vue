<template>
  <div class="orders-page">
    <div class="header">
      <button class="back-button" @click="$router.push('/')">
        <ChevronLeft size="22" />
      </button>
      <h1>My Orders</h1>
      <div class="header-spacer"></div>
    </div>

    <div class="content">
      <div class="tabs">
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'active' }"
          @click="activeTab = 'active'"
        >
          Active
        </button>
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'completed' }"
          @click="activeTab = 'completed'"
        >
          Completed
        </button>
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'cancelled' }"
          @click="activeTab = 'cancelled'"
        >
          Cancelled
        </button>
      </div>
      
      <div v-if="loading" class="loading-state">
        <p>Loading your orders...</p>
      </div>
      <div v-else-if="!sortedFilteredOrders || sortedFilteredOrders.length === 0" class="empty-state">
        <div class="empty-icon">
          <Package size="60" />
        </div>
        <h2>No {{ activeTab }} orders</h2>
        <p>Your {{ activeTab }} orders will appear here</p>
        <button v-if="activeTab === 'active'" class="shop-now-btn" @click="$emit('navigate', 'HomePage')">Shop Now</button>
      </div>
      
      <div v-else class="orders-list">
        <div class="order-card" v-for="(order, index) in sortedFilteredOrders" :key="index">
          <div class="order-header">
            <div>
              <h3>Order #{{ order.orderCode }}</h3>
              <p class="order-date">{{ formatDate(order.createdAt) }}</p>
            </div>
            <div class="order-status" :class="order.status.toLowerCase()">
              {{ order.status }}
            </div>
          </div>
          
          <div class="order-items">
            <div class="order-item">
              <div class="item-image">
                <img :src="order.productImage" :alt="order.productName">
              </div>
              <div class="item-details">
                <h4>{{ order.productName }}</h4>
                <p class="item-quantity">{{ displayQuantity(order) }} x ₱{{ formatUnitPrice(order.unitPrice) }}</p>
              </div>
              <p class="item-total">₱{{ order.totalPrice.toFixed(2) }}</p>
            </div>
          </div>
          
          <div class="order-footer">
            <div class="order-total">
              <span>Total:</span>
              <span class="total-amount">₱{{ order.totalPrice.toFixed(2) }}</span>
            </div>
            
            <div class="order-actions">
              <!-- Pay/Paid button for manual GCash: green when proof uploaded, orange otherwise -->
              <button 
                v-if="order.paymentMethod === 'gcash_manual' && order.paymentStatus !== 'paid' && (order.paymentStatus === 'unpaid' || order.paymentStatus === 'availing' || order.paymentStatus === 'paying' || order.status === 'Pending')"
                :class="['pay-btn', order.paymentProofUrl ? 'pay-btn-green' : '']"
                @click="payOrder(order)"
              >
                <ShoppingCart size="14" />
                {{ order.paymentProofUrl ? 'Paid' : 'Pay Order' }}
              </button>
              <button 
                v-if="order.status === 'Processing' || order.status === 'Shipped'" 
                class="track-btn"
                @click="trackOrder(order.id)"
              >
                <MapPin size="14" />
                Track Order
              </button>

              <!-- Show "Refund Order" button only for "Delivered" status -->
              <button 
                v-if="order.status === 'Delivered'" 
                class="refund-btn"
                @click="openRefundForm(order)"
              >
                <RotateCcw size="14" />
                Refund Order
              </button>
              
              <!-- Show "Refund Detail" button for "Refund Processing" status -->
              <button 
                v-if="order.status === 'Refund Processing'" 
                class="refund-detail-btn"
                @click="openRefundDetail(order)"
              >
                <FileText size="14" />
                Refund Detail
              </button>
              
              <!-- Show "Order Received" button only for "Delivered" status (hide when refund processing) -->
              <button 
                v-if="order.status === 'Delivered'" 
                class="receive-btn"
                @click="markAsReceived(order)"
              >
                <CheckCircle size="14" />
                Order Received
              </button>
              
              <!-- View/Print Receipt (available for any status) -->
              <button 
                class="reorder-btn"
                :disabled="receiptPreviewLoading && receiptPreviewTargetId === order.id"
                @click="openReceiptPreview(order)"
              >
                <FileText size="14" />
                <span v-if="receiptPreviewLoading && receiptPreviewTargetId === order.id">Preparing...</span>
                <span v-else>Order Receipt</span>
              </button>
              
             
              
              <button 
                v-if="order.status === 'Order Received' && !hasReviewed(order.id) && order.sellerId" 
                class="review-btn"
                @click="openReviewForm(order)"
              >
                <MessageSquare size="14" />
                Review
              </button>
              <button 
                v-if="order.status === 'Order Received' && hasReviewed(order.id)" 
                class="reviewed-btn"
                disabled
              >
                <CheckCircle size="14" />
                Reviewed
              </button>

              <div v-if="order.status === 'Pending'" class="cancel-section">
                <button 
                  class="cancel-btn"
                  @click="showCancelConfirmation(order)"
                >
                  <X size="14" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <bottom-navigation active-tab="orders" @navigate="$emit('navigate', $event)" />
    
    <!-- Order Tracking View -->
    <div v-if="showTracking" class="tracking-overlay">
      <CustomerOrderTracking 
        :orderId="trackingOrderId" 
        @back="closeTracking"
        @confirmed="handleOrderConfirmed"
      />
    </div>
    
    <!-- Review Form Modal -->
    <div v-if="showReviewForm" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h3>Review Your Purchase</h3>
          <button class="close-modal" @click="closeReviewForm">
            <X size="18" />
          </button>
        </div>
        <div class="modal-content">
          <div class="product-preview">
            <img :src="selectedOrder?.productImage" :alt="selectedOrder?.productName">
            <div>
              <h4>{{ selectedOrder?.productName }}</h4>
              <p style="font-size: 12px; color: #666;" v-if="selectedOrder?.sellerId">
                Seller ID: {{ selectedOrder.sellerId }}
              </p>
              <p style="font-size: 12px; color: #e53935;" v-else>
                Warning: No seller ID found
              </p>
            </div>
          </div>
          
          <ReviewForm
            v-if="selectedOrder"
            :productId="selectedOrder.productId"
            :orderId="selectedOrder.id"
            :userId="userId"
            :username="username"
            :productName="selectedOrder.productName"
            :productImage="selectedOrder.productImage"
            @success="handleReviewSuccess"
            @error="handleReviewError"
            @cancel="closeReviewForm"
          />
        </div>
      </div>
    </div>
    
    <!-- Notification -->
    <div v-if="notification.show" class="notification" :class="notification.type">
      <div class="notification-content">
        <CheckCircle v-if="notification.type === 'success'" size="18" />
        <AlertCircle v-else size="18" />
        <p>{{ notification.message }}</p>
      </div>
      <button class="close-notification" @click="notification.show = false">
        <X size="14" />
      </button>
    </div>
    
    <!-- Cancel Order Confirmation Modal -->
    <ConfirmModalOrder
      :isVisible="showCancelModal"
      @confirm="confirmCancelOrder"
      @cancel="closeCancelModal"
    />
    
    <!-- Refund Order Modal -->
    <RefundOrder
      :isVisible="showRefundForm"
      :order="selectedRefundOrder"
      @back="closeRefundForm"
      @cancel="closeRefundForm"
      @success="handleRefundSuccess"
      @error="handleRefundError"
    />
    
    <!-- Refund Detail Modal -->
    <div v-if="showRefundDetail" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h3>Refund Details</h3>
          <button class="close-modal" @click="closeRefundDetail">
            <X size="18" />
          </button>
        </div>
        <div class="modal-content">
          <div v-if="selectedRefundDetail" class="refund-detail-content">
            <!-- Order Information -->
            <div class="detail-section">
              <h4>Order Information</h4>
              <div class="info-row">
                <span class="label">Order Code:</span>
                <span class="value">{{ selectedRefundDetail.orderCode }}</span>
              </div>
              <div class="info-row">
                <span class="label">Product:</span>
                <span class="value">{{ selectedRefundDetail.productName }}</span>
              </div>
              <div class="info-row">
                <span class="label">Refund Amount:</span>
                <span class="value">₱{{ selectedRefundDetail.refundAmount }}</span>
              </div>
            </div>
            
            <!-- Refund Information -->
            <div class="detail-section">
              <h4>Refund Request</h4>
              <div class="info-row">
                <span class="label">Reason:</span>
                <span class="value">{{ selectedRefundDetail.refundTitle }}</span>
              </div>
              <div class="info-row">
                <span class="label">Status:</span>
                <span class="value status-badge" :class="selectedRefundDetail.status.toLowerCase()">
                  {{ selectedRefundDetail.status }}
                </span>
              </div>
              <div class="info-row">
                <span class="label">Submitted:</span>
                <span class="value">{{ formatRefundDate(selectedRefundDetail.createdAt) }}</span>
              </div>
            </div>
            
            <!-- Description -->
            <div class="detail-section" v-if="selectedRefundDetail.reason">
              <h4>Description</h4>
              <p class="description-text">{{ selectedRefundDetail.reason }}</p>
            </div>
            
            <!-- Evidence Images -->
            <div class="detail-section" v-if="selectedRefundDetail.evidence && selectedRefundDetail.evidence.length > 0">
              <h4>Evidence</h4>
              <div class="evidence-grid">
                <div v-for="(image, index) in selectedRefundDetail.evidence" :key="index" class="evidence-image">
                  <img :src="image.data" :alt="`Evidence ${index + 1}`" @click="openImageModal(image.data)" />
                </div>
              </div>
            </div>
            
            <!-- Contact Information -->
            <div class="detail-section">
              <h4>Contact Information</h4>
              <div class="info-row">
                <span class="label">Email:</span>
                <span class="value">{{ selectedRefundDetail.contactEmail }}</span>
              </div>
            </div>
          </div>
          
          <div v-else class="loading-detail">
            <p>Loading refund details...</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Image Modal -->
    <div v-if="showImageModal" class="image-modal-overlay" @click="closeImageModal">
      <div class="image-modal-content">
        <img :src="selectedImage" alt="Evidence" />
        <button class="close-image-modal" @click.stop="closeImageModal">
          <X size="24" />
        </button>
      </div>
    </div>

    <teleport to="body">
      <CustomerReceiptOrderPreview
        v-if="showReceiptPreview"
        v-model="showReceiptPreview"
        :receipt="receiptPreviewData"
        :loading="receiptPreviewLoading"
      />
    </teleport>
  </div>
</template>

<script>
import BottomNavigation from '@/components/BottomNavigation.vue';
import ReviewForm from '@/components/ReviewForm.vue';
import ConfirmModalOrder from '@/components/sellerside/ConfirmModalOrder.vue';
import RefundOrder from '@/components/refundorders/RefundOrder.vue';
import CustomerReceiptOrderPreview from '@/components/previewpdf/CustomerReceiptOrderPreview.vue';

import { 
  ChevronLeft, 
  ShoppingCart, 
  Package, 
  MapPin, 
  RefreshCw, 
  X,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  FileText
} from 'lucide-vue-next';
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getFirestore, collection, query, where, getDocs, getDoc, doc, onSnapshot } from 'firebase/firestore';
import { serverTimestamp, updateDoc, runTransaction, increment } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import CustomerOrderTracking from '@/components/CustomerOrderTracking.vue';

export default {
  components: {
    BottomNavigation,
    ConfirmModalOrder,
    RefundOrder,
    ChevronLeft,
    ShoppingCart,
    Package,
    MapPin,
    RefreshCw,
    X,
    CustomerOrderTracking,
    ReviewForm,
    MessageSquare,
    CheckCircle,
    AlertCircle,
    RotateCcw,
    FileText,
    CustomerReceiptOrderPreview,
  },
  setup() {
  const router = useRouter();
    const loading = ref(true);
    const activeTab = ref('active');
    const orders = ref([]);
    const db = getFirestore();
    const auth = getAuth();
    
    const trackingOrderId = ref(null);
    const showTracking = ref(false);
    
    const showReviewForm = ref(false);
    const selectedOrder = ref(null);
    const orderToCancel = ref(null);
    const showCancelModal = ref(false);
    const showRefundForm = ref(false);
    const selectedRefundOrder = ref(null);
    const showRefundDetail = ref(false);
    const selectedRefundDetail = ref(null);
    const showImageModal = ref(false);
    const selectedImage = ref('');
    const showReceiptPreview = ref(false);
    const receiptPreviewData = ref(null);
    const receiptPreviewLoading = ref(false);
    const receiptPreviewTargetId = ref(null);
    const userId = ref('');
    const username = ref('');
    const userReviews = ref([]);

    watch(showReceiptPreview, (isOpen) => {
      if (!isOpen) {
        receiptPreviewData.value = null;
        receiptPreviewTargetId.value = null;
        receiptPreviewLoading.value = false;
      }
    });

    // Unit helpers for display
    const unitDisplayMap = {
      kg: 'kg',
      kilogram: 'kg',
      kilo: 'kg',
      perKilo: 'kg',
      perkilo: 'kg',
      sack: 'sack',
      perSack: 'sack',
      tali: 'tali',
      perTali: 'tali',
      kaing: 'kaing',
      perKaing: 'kaing',
      bundle: 'bundle',
      perBundle: 'bundle',
      tray: 'tray',
      perTray: 'tray',
      piece: 'piece',
      perPiece: 'piece'
    };

    const resolveUnit = (order) => {
      const raw = (order?.unit || order?.packagingType || order?.selectedUnit || 'kg');
      if (!raw) return 'kg';
      const key = typeof raw === 'string' ? raw : String(raw);
      return unitDisplayMap[key] || unitDisplayMap[key.toLowerCase?.()] || key;
    };

    const displayQuantity = (order) => {
      const qty = Number(order?.weight ?? order?.quantity ?? 1) || 1;
      return `${qty} ${resolveUnit(order)}`;
    };

    const formatUnitPrice = (price) => {
      const p = Number(price) || 0;
      return p.toFixed(2);
    };
    
    // Helpers for receipt generation
    const getUnitPrice = (order) => {
      const p1 = Number(order?.unitPrice);
      if (p1 && p1 > 0) return p1;
      const p2 = Number(order?.pricePerKg);
      if (p2 && p2 > 0) return p2;
      const qty = Number(order?.quantity);
      const total = Number(order?.totalPrice);
      if (total && qty) return total / qty;
      return 0;
    };

    const getAddressDisplay = (location) => {
      if (!location) return 'N/A';
      if (typeof location === 'string') return location;
      if (typeof location.address === 'string' && location.address) return location.address;
      const parts = [];
      if (location.street) parts.push(location.street);
      if (location.barangay) parts.push(location.barangay);
      if (location.city) parts.push(location.city);
      if (location.municipality) parts.push(location.municipality);
      if (location.province) parts.push(location.province);
      if (location.region) parts.push(location.region);
      if (location.zip || location.postalCode) parts.push(location.zip || location.postalCode);
      return parts.length ? parts.join(', ') : 'N/A';
    };

    const formatDateTimeLong = (ts) => {
      if (!ts) return '';
      let d;
      if (typeof ts?.toDate === 'function') d = ts.toDate();
      else if (ts instanceof Date) d = ts;
      else d = new Date(ts);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });
    };

    // Lightweight caches to avoid repeated Firestore reads
    const sellerIdCache = new Map();
    const sellerDetailsCache = new Map();
    const productCache = new Map();
    const userCache = new Map();

    // Helper to resolve seller name and address from sellerId/users/products (cached and quiet)
    const fetchSellerDetails = async ({ sellerId, productId }) => {
      const buildNameFromParts = (source) => {
        if (!source) return null;
        const parts = ['firstName', 'middleName', 'lastName']
          .map((key) => (source[key] ? String(source[key]).trim() : ''))
          .filter(Boolean);
        if (parts.length) return parts.join(' ').trim();
        const altKeys = ['fullName', 'name', 'storeName', 'shopName', 'businessName'];
        for (const key of altKeys) {
          if (source[key]) return source[key];
        }
        return null;
      };

      const pickName = (obj) => {
        if (!obj) return null;
        const fromPersonal = buildNameFromParts(obj.personalInfo) || obj.personalInfo?.storeName;
        if (fromPersonal) return fromPersonal;
        const fromFarm = obj.farmDetails?.farmName || buildNameFromParts(obj.farmDetails);
        if (fromFarm) return fromFarm;
        const fromSelf = buildNameFromParts(obj);
        if (fromSelf) return fromSelf;
        const keys = ['businessName','farmName','sellerName','storeName','shopName','name','ownerName','fullName','username','displayName'];
        for (const k of keys) {
          if (obj[k]) return obj[k];
          if (obj.personalInfo?.[k]) return obj.personalInfo[k];
          if (obj.farmDetails?.[k]) return obj.farmDetails[k];
        }
        return null;
      };

      const deriveAddressFromObject = (source) => {
        if (!source) return null;
        if (typeof source === 'string') return source;
        const direct = source.address || source.fullAddress || source.addressLine1 || source.businessAddress;
        if (typeof direct === 'string' && direct.trim()) return direct;
        if (direct && typeof direct === 'object') return getAddressDisplay(direct);
        const locationCandidate = source.location || source.addressLine2;
        if (typeof locationCandidate === 'string' && locationCandidate.trim()) return locationCandidate;
        if (locationCandidate && typeof locationCandidate === 'object') return getAddressDisplay(locationCandidate);
        const hasAddressHints = ['street','barangay','city','municipality','province','region','zip','postalCode'].some((key) => source[key]);
        if (hasAddressHints) return getAddressDisplay(source);
        return null;
      };

      const composeAddr = (obj) => {
        if (!obj) return null;
        const personalAddr = deriveAddressFromObject(obj.personalInfo?.address) || deriveAddressFromObject(obj.personalInfo?.location) || deriveAddressFromObject(obj.personalInfo);
        if (personalAddr) return personalAddr;
        const farmAddr = deriveAddressFromObject(obj.farmDetails?.farmAddress) || deriveAddressFromObject(obj.farmDetails?.address) || deriveAddressFromObject(obj.farmDetails?.location) || deriveAddressFromObject(obj.farmDetails);
        if (farmAddr) return farmAddr;
        return deriveAddressFromObject(obj.businessAddress) || deriveAddressFromObject(obj.address) || deriveAddressFromObject(obj.location);
      };

      // Try cache by sellerId first
      if (sellerId && sellerDetailsCache.has(sellerId)) return sellerDetailsCache.get(sellerId);

      let name = null;
      let address = null;
      try {
        if (sellerId) {
          // Try sellers/{id}
          let sDoc = await getDoc(doc(db, 'sellers', sellerId));
          if (!sDoc.exists()) {
            // Try sellers where userId or sellerId equals sellerId
            let sSnap = await getDocs(query(collection(db, 'sellers'), where('userId', '==', sellerId)));
            if (sSnap.empty) {
              sSnap = await getDocs(query(collection(db, 'sellers'), where('sellerId', '==', sellerId)));
            }
            if (!sSnap.empty) sDoc = sSnap.docs[0];
          }
          if (sDoc && (sDoc.exists?.() || sDoc.data)) {
            const s = sDoc.data ? sDoc.data() : sDoc;
            name = pickName(s) || name;
            address = composeAddr(s) || address;
          }
          // Fallback to users
          if (!name || !address) {
            let uDoc;
            if (userCache.has(sellerId)) uDoc = { exists: () => true, data: () => userCache.get(sellerId) };
            else {
              const docSnap = await getDoc(doc(db, 'users', sellerId));
              if (docSnap.exists()) userCache.set(sellerId, docSnap.data());
              uDoc = docSnap;
            }
            if (uDoc?.exists?.()) {
              const u = uDoc.data();
              name = pickName(u) || name;
              address = composeAddr(u) || address;
            }
          }
        }
        // Fallback to product
        if ((!name || !address) && productId) {
          let pDoc;
          if (productCache.has(productId)) pDoc = { exists: () => true, data: () => productCache.get(productId) };
          else {
            const docSnap = await getDoc(doc(db, 'products', productId));
            if (docSnap.exists()) productCache.set(productId, docSnap.data());
            pDoc = docSnap;
          }
          if (pDoc?.exists?.()) {
            const p = pDoc.data();
            name = pickName(p) || name;
            address = composeAddr(p?.sellerAddress || p?.address || p?.location || p) || address;
          }
        }
      } catch (e) {
        // fail quietly
      }
      const result = { name: name || 'N/A', address: address || 'N/A' };
      if (sellerId) sellerDetailsCache.set(sellerId, result);
      return result;
    };

    

    const formatPaymentStatusLabel = (status) => {
      const raw = (status || 'unpaid').toString().toLowerCase();
      if (raw === 'availing') return 'Availing';
      if (raw === 'paying') return 'Paying';
      if (raw === 'paid') return 'Paid';
      return 'Unpaid';
    };

    const formatPaymentMethodLabel = (method) => {
      if (!method) return 'Cash on Delivery';
      const normalized = String(method).toLowerCase();
      if (normalized.includes('gcash')) return 'GCash';
      if (normalized.includes('cod') || normalized.includes('cash')) return 'Cash on Delivery';
      return method;
    };

    const buildReceiptDetails = async (order) => {
      if (!order) return null;
      const unitLabel = resolveUnit(order) || 'unit';
      const unitDisplay = unitLabel.charAt(0).toUpperCase() + unitLabel.slice(1);
      const unitPrice = getUnitPrice(order);
      const qty = Number(order.quantity) || Number(order.weight) || 0;
      const itemSubtotal = (Number(unitPrice) || 0) * qty;
      const deliveryFee = Number(order.deliveryFee || 0);
      const tax = Number(order.tax || 0);
      const total = Number(order.totalPrice || (itemSubtotal + deliveryFee + tax) || 0);
      const code = order.orderCode || (order.id ? order.id.substring(0, 6) : '');

      let sellerName = order.sellerName || 'N/A';
      let sellerAddress = order.sellerAddress || 'N/A';
      if (sellerName === 'N/A' || sellerAddress === 'N/A') {
        try {
          const ensuredSellerId = order.sellerId || await fetchSellerIdForOrder({ productId: order.productId, orderCode: order.orderCode, ...order }, order.id);
          const details = await fetchSellerDetails({ sellerId: ensuredSellerId, productId: order.productId });
          sellerName = details.name || sellerName;
          sellerAddress = details.address || sellerAddress;
        } catch (error) {
          console.error('Failed to fetch seller details for receipt preview:', error);
        }
      }

      const orderAddress = getAddressDisplay(
        order.Location || order.address || order.deliveryAddress || order.shippingAddress || order.location
      );
      let finalShippingAddress = orderAddress && orderAddress !== 'N/A' ? orderAddress : null;
      if (!finalShippingAddress) {
        const fetched = await fetchUserAddress(order.userId);
        finalShippingAddress = fetched || 'N/A';
      }

      return {
        orderCode: code,
        orderDate: formatDateTimeLong(order.createdAt || order.timestamp),
        sellerName,
        sellerAddress,
        shippingAddress: finalShippingAddress || 'N/A',
        instructions: order?.Location?.instructions || order?.instructions || order?.deliveryInstructions || '',
        deliveryLabel: order?.deliveryOption || order?.delivery || order?.deliveryType || '',
        status: order.status || 'N/A',
        paymentMethod: formatPaymentMethodLabel(order.paymentMethod),
        paymentStatus: formatPaymentStatusLabel(order.paymentStatus || order.payStatus),
        total,
        deliveryFee,
        tax,
        customerName: order.username || order.customerName || '',
        items: [
          {
            name: order.productName || 'N/A',
            unit: unitDisplay,
            quantity: qty,
            unitPrice: unitPrice || 0,
            subtotal: itemSubtotal || 0
          }
        ]
      };
    };

    const openReceiptPreview = async (order) => {
      if (!order) return;

      receiptPreviewTargetId.value = order.id || null;
      receiptPreviewLoading.value = true;
      receiptPreviewData.value = null;
      showReceiptPreview.value = true;

      try {
        const details = await buildReceiptDetails(order);
        if (!details) {
          throw new Error('Missing receipt details');
        }

        if (!showReceiptPreview.value) {
          return;
        }

        receiptPreviewData.value = details;
      } catch (error) {
        console.error('Failed to open receipt preview:', error);
        showNotification('Unable to open the receipt preview. Please try again.', 'error');
        showReceiptPreview.value = false;
      } finally {
        receiptPreviewLoading.value = false;
        receiptPreviewTargetId.value = null;
      }
    };
    
  // Real-time listener
    let unsubscribeOrders = null;
    
    const notification = ref({
      show: false,
      message: '',
      type: 'success'
    });

    const formatDate = (timestamp) => {
      if (!timestamp) return '';
      const date = typeof timestamp?.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };
    
    // Helper function to fetch sellerId for an order (quiet + cached)
    const fetchSellerIdForOrder = async (orderData, orderId) => {
      if (!orderData) return null;
      // Cache key: prefer sellerId/productId/orderCode combo
      const key = orderData.sellerId || `${orderData.productId || ''}|${orderData.orderCode || ''}`;
      if (key && sellerIdCache.has(key)) return sellerIdCache.get(key);

      // 1) Direct from order
      if (orderData.sellerId) {
        sellerIdCache.set(key, orderData.sellerId);
        return orderData.sellerId;
      }

      // 2) From product
      if (orderData.productId) {
        let pSnap;
        if (productCache.has(orderData.productId)) pSnap = { exists: () => true, data: () => productCache.get(orderData.productId) };
        else {
          const docSnap = await getDoc(doc(db, 'products', orderData.productId));
          if (docSnap.exists()) productCache.set(orderData.productId, docSnap.data());
          pSnap = docSnap;
        }
        if (pSnap?.exists?.()) {
          const p = pSnap.data();
          const sid = p.sellerId || p.userId || null;
          if (sid) {
            sellerIdCache.set(key, sid);
            return sid;
          }
        }
      }

      // 3) From sales by orderCode
      if (orderData.orderCode) {
        const salesSnap = await getDocs(query(collection(db, 'sales'), where('orderCode', '==', orderData.orderCode)));
        if (!salesSnap.empty) {
          const data = salesSnap.docs[0].data();
          const sid = data.sellerId || data.userId || null;
          if (sid) {
            sellerIdCache.set(key, sid);
            return sid;
          }
        }
      }
      return null;
    };

    // Fetch best-effort shipping address from user's profile (cached)
    const fetchUserAddress = async (uid) => {
      if (!uid) return null;
      if (userCache.has(uid)) {
        const u = userCache.get(uid);
        const addr = u?.shippingAddress || u?.defaultAddress || u?.address || u?.location;
        return typeof addr === 'string' ? addr : getAddressDisplay(addr);
      }
      const uSnap = await getDoc(doc(db, 'users', uid));
      if (!uSnap.exists()) return null;
      const u = uSnap.data();
      userCache.set(uid, u);
      const addr = u?.shippingAddress || u?.defaultAddress || u?.address || u?.location;
      return typeof addr === 'string' ? addr : getAddressDisplay(addr);
    };

    const fetchOrders = async () => {
      try {
        loading.value = true;
        const currentUserId = auth.currentUser?.uid;
        if (!currentUserId) return;

        const q = query(collection(db, 'orders'), where('userId', '==', currentUserId));
        const querySnapshot = await getDocs(q);

        // Build in parallel for speed
        const mapped = await Promise.all(querySnapshot.docs.map(async (orderDoc) => {
          const data = orderDoc.data();
          const sellerId = await fetchSellerIdForOrder(data, orderDoc.id);
          const sellerDetails = await fetchSellerDetails({ sellerId, productId: data.productId });
          return {
            id: orderDoc.id,
            orderCode: data.orderCode,
            groupOrderCode: data.groupOrderCode,
            productId: data.productId,
            productImage: data.productImage,
            productName: data.productName,
            quantity: data.quantity,
            unit: data.unit,
            unitPrice: data.unitPrice,
            totalPrice: data.totalPrice,
            status: data.status,
            paymentMethod: data.paymentMethod || data.payment_type || null,
            paymentStatus: data.paymentStatus || data.payStatus || null,
            paymentProofUrl: data.paymentProofUrl || null,
            createdAt: data.createdAt,
            userId: data.userId,
            sellerId: sellerId,
            sellerName: sellerDetails.name,
            sellerAddress: sellerDetails.address,
            type: data.status === 'Order Received' ? 'completed' :
                  data.status === 'Cancelled' ? 'cancelled' : 'active'
          };
        }));

        orders.value = mapped;
      } catch (error) {
        console.error('Error fetching orders:', error);
        showNotification('Failed to load orders. Please try again.', 'error');
      } finally {
        loading.value = false;
      }
    };

    // Set up real-time listener for order status changes
    const setupOrderListener = () => {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) return;

      const q = query(collection(db, 'orders'), where('userId', '==', currentUserId));
      
      unsubscribeOrders = onSnapshot(q, async (snapshot) => {
        const currentOrders = orders.value.map(order => ({ ...order }));

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const newData = change.doc.data();
            const orderId = change.doc.id;
            
            // Find the existing order to compare status
            const existingOrder = currentOrders.find(order => order.id === orderId);
            
            if (existingOrder && existingOrder.status !== newData.status) {
              // Status has changed, show notification
              const statusMessage = getStatusMessage(newData.status);
              showNotification(statusMessage, 'success');
            }
          }
        });

        // Update orders array with new data including sellerId (parallel)
        const ordersData = await Promise.all(snapshot.docs.map(async (d) => {
          const data = d.data();
          const sellerId = await fetchSellerIdForOrder(data, d.id);
          const sellerDetails = await fetchSellerDetails({ sellerId, productId: data.productId });
          return {
            id: d.id,
            orderCode: data.orderCode,
            groupOrderCode: data.groupOrderCode,
            productId: data.productId,
            productImage: data.productImage,
            productName: data.productName,
            quantity: data.quantity,
            unit: data.unit,
            unitPrice: data.unitPrice,
            totalPrice: data.totalPrice,
            status: data.status,
            paymentMethod: data.paymentMethod || data.payment_type || null,
            paymentStatus: data.paymentStatus || data.payStatus || null,
            paymentProofUrl: data.paymentProofUrl || null,
            createdAt: data.createdAt,
            userId: data.userId,
            sellerId,
            sellerName: sellerDetails.name,
            sellerAddress: sellerDetails.address,
            type: data.status === 'Order Received' ? 'completed' :
                  data.status === 'Cancelled' ? 'cancelled' : 'active'
          };
        }));

        orders.value = ordersData;
      });
    };

    const payOrder = (order) => {
      const code = order.groupOrderCode || order.orderCode;
      if (!code) return;
      router.push({ path: '/payment/upload', query: { order: code } });
    };

    const getStatusMessage = (status) => {
      switch (status) {
        case 'Shipped':
          return 'The Order has been Shipped';
        case 'Delivered':
          return 'The Order has been Delivered';
        case 'Order Received':
          return 'The Order has been Order Received';
        case 'Cancelled':
          return 'The Order has been Cancelled';
        case 'Processing':
          return 'The Order has been Processing';
        default:
          return `The Order status has been updated to ${status}`;
      }
    };
    
    const fetchUserInfo = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        
        userId.value = user.uid;
        
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          username.value = userDoc.data().username || 'User';
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };
    
    const fetchUserReviews = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        
        const q = query(collection(db, 'reviews'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        userReviews.value = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error('Error fetching user reviews:', error);
      }
    };

    const hasReviewed = (orderId) => {
      return userReviews.value.some(review => review.orderId === orderId);
    };
    
    const openReviewForm = async (order) => {
      selectedOrder.value = order;
      showReviewForm.value = true;
    };
    
    const closeReviewForm = () => {
      showReviewForm.value = false;
      selectedOrder.value = null;
    };
    
    const handleReviewSuccess = (review) => {
      userReviews.value.push(review);
      closeReviewForm();
      showNotification('Your review has been submitted successfully!', 'success');
    };
    
    const handleReviewError = (errorMessage) => {
      showNotification(errorMessage || 'Failed to submit review. Please try again.', 'error');
    };
    
    const openRefundForm = (order) => {
      selectedRefundOrder.value = order;
      showRefundForm.value = true;
    };
    
    const closeRefundForm = () => {
      showRefundForm.value = false;
      selectedRefundOrder.value = null;
    };
    
    const handleRefundSuccess = (refund) => {
      closeRefundForm();
      showNotification('Your refund request has been submitted successfully! We will review it within 2-3 business days.', 'success');
    };
    
    const handleRefundError = (errorMessage) => {
      showNotification(errorMessage || 'Failed to submit refund request. Please try again.', 'error');
    };
    
    const openRefundDetail = async (order) => {
      showRefundDetail.value = true;
      selectedRefundDetail.value = null; // Show loading state
      
      try {
        // Query refunds collection to get refund details for this order
        const refundsQuery = query(
          collection(db, 'refunds'), 
          where('orderId', '==', order.id)
        );
        const refundSnapshot = await getDocs(refundsQuery);
        
        if (!refundSnapshot.empty) {
          const refundDoc = refundSnapshot.docs[0];
          selectedRefundDetail.value = {
            id: refundDoc.id,
            ...refundDoc.data()
          };
        } else {
          // Fallback: create a basic refund detail from order info
          selectedRefundDetail.value = {
            orderCode: order.orderCode,
            productName: order.productName,
            refundAmount: order.totalPrice,
            refundTitle: 'Refund Processing',
            status: 'Pending',
            reason: 'Refund request submitted',
            contactEmail: 'N/A',
            evidence: [],
            createdAt: order.createdAt || new Date()
          };
        }
      } catch (error) {
        console.error('Error fetching refund details:', error);
        showNotification('Failed to load refund details', 'error');
        closeRefundDetail();
      }
    };
    
    const closeRefundDetail = () => {
      showRefundDetail.value = false;
      selectedRefundDetail.value = null;
    };
    
    const openImageModal = (imageUrl) => {
      selectedImage.value = imageUrl;
      showImageModal.value = true;
    };
    
    const closeImageModal = () => {
      showImageModal.value = false;
      selectedImage.value = '';
    };
    
    const formatRefundDate = (timestamp) => {
      if (!timestamp) return 'N/A';
      
      // Handle Firestore timestamp
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    const showNotification = (message, type = 'success') => {
      notification.value = {
        show: true,
        message,
        type
      };
      
      setTimeout(() => {
        notification.value.show = false;
      }, 5000);
    };

    const trackOrder = (orderId) => {
      trackingOrderId.value = orderId;
      showTracking.value = true;
    };

    const closeTracking = () => {
      showTracking.value = false;
      trackingOrderId.value = null;
    };

    const handleOrderConfirmed = (orderId) => {
      fetchOrders();
      closeTracking();
    };
    
    const sortedFilteredOrders = computed(() => {
      if (!orders.value) return [];
      
      const filtered = orders.value.filter(order => {
        if (activeTab.value === 'active') {
          return order.status === 'Pending' || 
                 order.status === 'Processing' || 
                 order.status === 'Shipped' || 
                 order.status === 'Delivered' ||
                 order.status === 'Refund Processing'; // Add this status to active tab
        } else if (activeTab.value === 'completed') {
          return order.status === 'Order Received';
        } else if (activeTab.value === 'cancelled') {
          return order.status === 'Cancelled';
        }
        return true;
      });

      return filtered.sort((a, b) => {
        const dateA = a.createdAt?.toDate()?.getTime() || 0;
        const dateB = b.createdAt?.toDate()?.getTime() || 0;
        return dateB - dateA;
      });
    });

    const showCancelConfirmation = (order) => {
      orderToCancel.value = order;
      showCancelModal.value = true;
    };

    const closeCancelModal = () => {
      showCancelModal.value = false;
      orderToCancel.value = null;
    };

    const confirmCancelOrder = async () => {
      if (orderToCancel.value) {
        await cancelOrder(orderToCancel.value);
        closeCancelModal();
      }
    };

    const markAsReceived = async (order) => {
      try {
        if (!auth.currentUser) throw new Error('User not authenticated');
        
        const orderRef = doc(db, 'orders', order.id);
        await updateDoc(orderRef, {
          status: 'Order Received',
          receivedAt: serverTimestamp()
        });
        
        await fetchOrders();
        showNotification('Order marked as received successfully', 'success');
      } catch (error) {
        console.error('Error marking order as received:', error);
        showNotification('Failed to mark order as received', 'error');
      }
    };

    const cancelOrder = async (order) => {
      try {
        if (!auth.currentUser) throw new Error('User not authenticated');
        
        // Check if order is still in a cancellable state (only Pending orders can be cancelled)
        if (order.status !== 'Pending') {
          showNotification('Order cannot be cancelled. Only pending orders can be cancelled.', 'error');
          return;
        }
        
        const orderRef = doc(db, 'orders', order.id);
        await updateDoc(orderRef, {
          status: 'Cancelled',
          cancelledAt: serverTimestamp()
        });
        
        const productRef = doc(db, 'products', order.productId);
        await runTransaction(db, async (transaction) => {
          const productDoc = await transaction.get(productRef);
          if (productDoc.exists()) {
            // Determine which stock field to update based on unit
            let stockField;
            switch(order.unit) {
              case 'kg': stockField = 'stockPerKilo'; break;
              case 'sack': stockField = 'stockPerSack'; break;
              case 'tali': stockField = 'stockPerTali'; break;
              case 'kaing': stockField = 'stockPerKaing'; break;
              case 'bundle': stockField = 'stockPerBundle'; break;
              case 'tray': stockField = 'stockPerTray'; break;
              case 'piece': stockField = 'stockPerPiece'; break;
              default: stockField = 'stockPerPiece';
            }
            
            transaction.update(productRef, {
              [stockField]: increment(order.quantity)
            });
          }
        });
        
        const salesQuery = query(
          collection(db, 'sales'),
          where('orderCode', '==', order.orderCode)
        );
        const salesSnapshot = await getDocs(salesQuery);
        salesSnapshot.forEach(async (doc) => {
          await updateDoc(doc.ref, {
            paymentStatus: 'cancelled'
          });
        });
        
        await fetchOrders();
        showNotification('Order cancelled successfully', 'success');
      } catch (error) {
        console.error('Error cancelling order:', error);
        showNotification('Failed to cancel order', 'error');
      }
    };

    const submitReview = async () => {
      let imageUrl = null;

      // 1. Upload image to Firebase Storage (if selected)
      if (selectedFile.value) {
        imageUrl = await uploadImage(selectedFile.value);
        // Images saved to: 'review_images/{userId}_{timestamp}_{fileName}'
      }

      // 2. Create review data object
      const reviewData = {
        productId: props.productId,
        orderId: props.orderId,
        userId: props.userId,
        username: props.username,
        productName: props.productName,
        productImage: props.productImage,
        rating: rating.value,           // ⭐ Star rating (1-5)
        review: reviewText.value.trim(), // 📝 Review text
        createdAt: serverTimestamp(),
        ...(imageUrl && { imageUrl })   // 🖼️ Image URL (if uploaded)
      };

      // 3. Save to Firestore 'reviews' collection
      const docRef = await addDoc(collection(db, 'reviews'), reviewData);

      // 4. Mark order as reviewed
      const orderRef = doc(db, 'orders', props.orderId);
      await updateDoc(orderRef, {
        isReviewed: true
      });
    };

    onMounted(async () => {
      await fetchUserInfo();
      await fetchOrders();
      await fetchUserReviews();
      setupOrderListener();
    });
    
    onUnmounted(() => {
      if (unsubscribeOrders) {
        unsubscribeOrders();
      }
    });
    
    return {
      loading,
      activeTab,
      orders,
      sortedFilteredOrders,
      formatDate,
      trackingOrderId,
      showTracking,
      trackOrder,
      closeTracking,
      handleOrderConfirmed,
      showReviewForm,
      selectedOrder,
      openReviewForm,
      closeReviewForm,
      handleReviewSuccess,
      handleReviewError,
      showRefundForm,
      selectedRefundOrder,
      openRefundForm,
      closeRefundForm,
      handleRefundSuccess,
      handleRefundError,
      openRefundDetail,
      closeRefundDetail,
      showRefundDetail,
      selectedRefundDetail,
      showImageModal,
      selectedImage,
      openImageModal,
      closeImageModal,
      formatRefundDate,
      hasReviewed,
      userId,
      username,
      notification,
      showCancelConfirmation,
      showCancelModal,
      closeCancelModal,
      confirmCancelOrder,
      markAsReceived,
      cancelOrder,
      submitReview,
      // quantity/unit helpers
      displayQuantity,
      formatUnitPrice,
      openReceiptPreview,
      showReceiptPreview,
      receiptPreviewData,
      receiptPreviewLoading,
      receiptPreviewTargetId,
      payOrder
    };
  }
}
</script>

<style scoped>
/* All the styles remain exactly the same as in your original file */
.cancel-section {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.countdown-notice {
  font-size: 10px;
  color: #e53935;
  text-align: center;
  padding: 2px 5px;
  background-color: rgba(229, 57, 53, 0.1);
  border-radius: 4px;
}

.countdown-notice p {
  margin: 0;
}

.cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.loading-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.loading-state p {
  margin: 0;
  font-size: 16px;
}
.orders-page {
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
  background: none;
  border: none;
  padding: 0;
}

.header h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.header-buttons {
  display: flex;
  gap: 8px;
}
.header-spacer {
  width: 40px;
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

.shop-now-btn {
  padding: 12px 30px;
  background-color: #2e5c31;
  color: white;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 3px 8px rgba(46, 92, 49, 0.3);
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.order-card {
  background-color: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.order-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 5px;
  color: #333;
}

.order-date {
  font-size: 12px;
  color: #666;
}

.order-status {
  font-size: 12px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 15px;
}

.order-status.pending {
  background-color: #fff3e0;
  color: #ef6c00;
}

.order-status.processing {
  background-color: #fff8e1;
  color: #ffa000;
}

.order-status.shipped {
  background-color: #e1f5fe;
  color: #0288d1;
}

.order-status.delivered {
  background-color: #e8f5e9;
  color: #2e5c31;
}

.order-status.order-received {
  background-color: #e8f5e9;
  color: #2e5c31;
}

.order-status.cancelled {
  background-color: #ffebee;
  color: #e53935;
}

.order-status.refund-processing {
  background-color: #fff3e0;
  color: #f57722;
}

.order-items {
  padding: 15px;
}

.order-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.order-item:last-child {
  margin-bottom: 0;
}

.item-image {
  width: 60px;
  height: 60px;
  background-color: #f9f9f9;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  overflow: hidden;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-details {
  flex: 1;
}

.item-details h4 {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 2px;
  color: #333;
}

.item-quantity {
  font-size: 12px;
  color: #666;
}

.item-total {
  font-size: 14px;
  font-weight: 600;
  color: #2e5c31;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #f9f9f9;
  border-top: 1px solid #eee;
}

.order-total {
  font-size: 14px;
  color: #666;
}

.total-amount {
  font-size: 16px;
  font-weight: 700;
  color: #2e5c31;
  margin-left: 5px;
}

.order-actions {
  display: flex;
  gap: 10px;
}

.pay-btn {
  background-color: #fff3e0;
  color: #f57722;
  border: 1px solid #f57722;
}

.pay-btn-green {
  background-color: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #2e7d32;
}

.track-btn, .reorder-btn, .cancel-btn, .review-btn, .reviewed-btn, .receive-btn, .refund-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 600;
}

.track-btn {
  background-color: #e1f5fe;
  color: #0288d1;
}

.receive-btn {
  background-color: #e8f5e9;
  color: #2e5c31;
}

.reorder-btn {
  background-color: #e8f5e9;
  color: #2e5c31;
}

.cancel-btn {
  background-color: #ffebee;
  color: #e53935;
}

.review-btn {
  background-color: #f0f4c3;
  color: #afb42b;
}

.reviewed-btn {
  background-color: #e0e0e0;
  color: #757575;
  cursor: default;
}

.refund-btn {
  background-color: #fff3e0;
  color: #f57722;
  border: 1px solid #f57722;
  transition: all 0.2s ease;
}

.refund-btn:hover {
  background-color: #f57722;
  color: white;
}

.refund-detail-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 600;
  background-color: #e3f2fd;
  color: #1976d2;
  border: 1px solid #1976d2;
  transition: all 0.2s ease;
}

.refund-detail-btn:hover {
  background-color: #1976d2;
  color: white;
}

.tracking-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #f5f5f5;
  z-index: 100;
  overflow-y: auto;
}

/* Modal Styles */
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
  padding: 20px;
}

.modal-container {
  background-color: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
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
  color: #666;
  cursor: pointer;
  padding: 5px;
}

.modal-content {
  padding: 20px;
}

.product-preview {
  display: flex;
  align-items: center;
  gap: 15px;
  padding-bottom: 15px;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.product-preview img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
}

.product-preview h4 {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

/* Notification Styles */
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: white;
  border-radius: 10px;
  padding: 12px 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 90%;
  max-width: 350px;
  z-index: 1000;
}

.notification.success {
  border-left: 4px solid #4caf50;
}

.notification.error {
  border-left: 4px solid #f44336;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.notification-content p {
  margin: 0;
  font-size: 14px;
  color: #333;
}

.notification.success .notification-content svg {
  color: #4caf50;
}

.notification.error .notification-content svg {
  color: #f44336;
}

.close-notification {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 5px;
}

/* Refund Detail Modal Styles */
.refund-detail-content {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.detail-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.detail-section h4 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 15px 0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 8px 0;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row .label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.info-row .value {
  font-size: 14px;
  color: #333;
  font-weight: 600;
  text-align: right;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.pending {
  background-color: #fff3e0;
  color: #f57722;
}

.status-badge.approved {
  background-color: #e8f5e9;
  color: #2e5c31;
}

.status-badge.rejected {
  background-color: #ffebee;
  color: #e53935;
}

.description-text {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  margin: 0;
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border-left: 3px solid #2e5c31;
}

.evidence-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.evidence-image {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.evidence-image:hover {
  transform: scale(1.05);
}

.evidence-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.loading-detail {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

/* Image Modal Styles */
.image-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.image-modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.image-modal-content img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.close-image-modal {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.close-image-modal:hover {
  background: rgba(0, 0, 0, 0.9);
}
</style>