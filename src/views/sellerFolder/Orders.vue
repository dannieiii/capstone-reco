<template>
  <div class="dashboard-container">
    <OfflineBanner />
    <Sidebar initialActiveItem="Orders" />
    
    <div class="main-content">
      <header class="header">
        <div class="page-title">
          <h1>Orders</h1>
          <p>Manage and track customer orders for your products</p>
        </div>
        <button class="theme-toggle" @click="toggleDarkMode">
          <i :class="isDarkMode ? 'i-lucide-sun' : 'i-lucide-moon'"></i>
        </button>
      </header>

      <!-- Order Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-icon pending-icon">
            <Clock :size="18" />
          </div>
          <div class="card-content">
            <h3>Pending</h3>
            <p class="card-value">{{ pendingOrdersCount }}</p>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="card-icon processing-icon">
            <Package :size="18" />
          </div>
          <div class="card-content">
            <h3>Processing</h3>
            <p class="card-value">{{ processingOrdersCount }}</p>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="card-icon shipped-icon">
            <Truck :size="18" />
          </div>
          <div class="card-content">
            <h3>Shipped</h3>
            <p class="card-value">{{ shippedOrdersCount }}</p>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="card-icon delivered-icon">
            <CheckCircle :size="18" />
          </div>
          <div class="card-content">
            <h3>Delivered</h3>
            <p class="card-value">{{ deliveredOrdersCount }}</p>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="card-icon received-icon">
            <PackageCheck :size="18" />
          </div>
          <div class="card-content">
            <h3>Order Received</h3>
            <p class="card-value">{{ orderReceivedCount }}</p>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="card-icon refund-icon">
            <RotateCcw :size="18" />
          </div>
          <div class="card-content">
            <h3>Refund Processing</h3>
            <p class="card-value">{{ refundProcessingCount }}</p>
          </div>
        </div>
      </div>

      <div class="content-wrapper">
        <div class="actions-bar">
          <div class="search-and-filter">
            <div class="search-box">
              <i class="i-lucide-search search-icon"></i>
              <input type="text" placeholder="Search orders..." v-model="searchQuery"/>
              <button v-if="searchQuery" class="clear-search" @click="searchQuery = ''">
                <i class="i-lucide-x"></i>
              </button>
            </div>
            
            <div class="date-filter-container">
              <div class="date-filter">
                <i class="i-lucide-calendar"></i>
                <input 
                  type="date" 
                  v-model="startDate" 
                  @change="filterByDateRange"
                  class="minimal-date-input"
                  placeholder="Select Date"
                />
                <span v-if="startDate" class="date-separator">to</span>
                <input 
                  v-if="startDate"
                  type="date" 
                  v-model="endDate" 
                  @change="filterByDateRange"
                  class="minimal-date-input"
                  placeholder="End Date (Optional)"
                />
                <button 
                  v-if="startDate" 
                  @click="resetDateFilter" 
                  class="date-clear-btn"
                  title="Clear date filter"
                >
                  <i class="i-lucide-x"></i>
                </button>
              </div>
              <div v-if="startDate" class="date-filter-info">
                <span v-if="!endDate" class="filter-text">
                  Showing orders from: {{ formatDate(startDate) }}
                </span>
                <span v-else class="filter-text">
                  Showing orders from: {{ formatDate(startDate) }} to {{ formatDate(endDate) }}
                </span>
              </div>
            </div>
          </div>
          <div class="filter-actions">
            <div class="filter-dropdown">
              <button class="filter-btn" @click="toggleFilterDropdown">
                <i class="i-lucide-filter"></i>
                {{ activeFilter }}
                <i class="i-lucide-chevron-down"></i>
              </button>
              <div v-show="showFilterDropdown" class="filter-options">
                <button v-for="filter in filterOptions" :key="filter" @click="setFilter(filter)">
                  {{ filter }}
                </button>
              </div>
            </div>
            <div class="export-dropdown">
              <button class="export-btn" @click="toggleExportMenu">
                <i class="i-lucide-download"></i>
                Export
                <i class="i-lucide-chevron-down ml-1"></i>
              </button>
              <div class="export-menu" v-if="showExportMenu">
                <button class="export-option" @click="exportOrders('csv')">
                  <i class="i-lucide-file-text"></i>
                  Export as CSV
                </button>
                <button class="export-option" @click="exportOrders('pdf')">
                  <i class="i-lucide-file"></i>
                  Export as PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="table-container">
          <table class="orders-table">
            <thead>
              <tr>
                <th>Order Code</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Type</th>
                <th>Unit & Quantity</th>
                <th>Location</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(order, index) in paginatedOrders" :key="order.id">
                <td class="order-id">#{{ order.orderCode || 'N/A' }}</td>
                <td>{{ order.username }}</td>
                <td>
                  <div class="product-info">
                    <span class="product-name">{{ order.productName }}</span>
                  </div>
                </td>
                <td>
                  <span :class="['type-badge', orderTypeClass(order.orderType, order.isPreOrder)]">{{ orderTypeLabel(order.orderType, order.isPreOrder) }}</span>
                </td>
                <td>
                  <div class="unit-quantity">
                    <span class="quantity">{{ order.quantity }}</span>
                    <span class="unit">{{ getUnitDisplay(order.unit) }}</span>
                  </div>
                </td>
                <td>
                  <div class="location-cell">
                    <i class="i-lucide-map-pin location-icon"></i>
                    <span>{{ getAddressDisplay(order.Location) }}</span>
                  </div>
                </td>
                <td>{{ formatDateTime(order.timestamp || order.createdAt) }}</td>
                <td>₱{{ order.totalPrice.toFixed(2) }}</td>
                <td>
                  <div class="status-cell">
                    <span v-if="!editingStatus[index]" :class="['status-badge', normalizeStatusClass(order.status)]">
                      {{ order.status }}
                      <button class="edit-status-btn" @click="startEditingStatus(index)">
                        <i class="i-lucide-edit-2"></i>
                      </button>
                    </span>
                    <div v-else class="status-dropdown">
                      <select v-model="order.status" @change="finishEditingStatus(index, order)" class="status-select">
                        <option v-for="status in statusOptions" :key="status" :value="status">
                          {{ status }}
                        </option>
                      </select>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="action-buttons">
                    <button class="action-btn view-btn" @click="viewOrderDetails(order)">
                      <i class="i-lucide-eye"></i>
                      View
                    </button>
                    <button class="action-btn edit-btn" @click="editOrder(order)">
                      <i class="i-lucide-edit"></i>
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <button :disabled="currentPage === 1" @click="currentPage--">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Previous
          </button>
          <span>Page {{ currentPage }} of {{ totalPages }}</span>
          <button :disabled="currentPage === totalPages" @click="currentPage++">
            Next
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <!-- Order Details Modal -->
      <div v-if="showOrderModal" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>Order {{ selectedOrder.orderCode ? `#${selectedOrder.orderCode}` : '' }}</h2>
            <div class="modal-actions">
              <button class="print-receipt-btn" @click="printReceipt">
                <i class="i-lucide-printer"></i>
                Print Receipt
              </button>
              <button class="close-btn" @click="closeModal">
                <i class="i-lucide-x"></i>
              </button>
            </div>
          </div>
          <div class="modal-body">
            <div class="order-details-grid">
              <div class="details-left">
                <div class="info-group">
                  <h3>Customer Information</h3>
                  <p><strong>Name:</strong> {{ selectedOrder.username }}</p>
                </div>
                
                <div class="info-group">
                  <h3>Delivery Information</h3>
                  <p><strong>Address:</strong> {{ selectedOrder.Location?.address || getAddressDisplay(selectedOrder.Location) }}</p>
                  <p v-if="selectedOrder.Location?.name"><strong>Name/Alias:</strong> {{ selectedOrder.Location.name }}</p>
                  <p v-if="selectedOrder.Location?.locationNotes || selectedOrder.Location?.notes">
                    <strong>Instructions:</strong> {{ selectedOrder.Location.locationNotes || selectedOrder.Location.notes }}
                  </p>
                  <p v-if="selectedOrder.deliveryOption"><strong>Delivery Option:</strong> {{ selectedOrder.deliveryOption }}</p>
                  <p v-if="selectedOrder.deliveryFee"><strong>Delivery Fee:</strong> ₱{{ selectedOrder.deliveryFee.toFixed(2) }}</p>
                </div>
                
                <div class="info-group">
                  <h3>Order Details</h3>
                  <p><strong>Date:</strong> {{ formatDateTime(selectedOrder.timestamp || selectedOrder.createdAt) }}</p>
                  <p><strong>Status:</strong> 
                    <span :class="['status-badge', normalizeStatusClass(selectedOrder.status)]">
                      {{ selectedOrder.status }}
                    </span>
                  </p>
                  <p><strong>Payment Method:</strong> {{ selectedOrder.paymentMethod || 'Cash on Delivery' }}</p>
                  <p v-if="selectedOrder.gcashNumber"><strong>GCash Number:</strong> {{ selectedOrder.gcashNumber }}</p>
                  <p><strong>Payment Status:</strong> {{ selectedOrder.payStatus || 'Unpaid' }}</p>
                </div>
              </div>
              
              <div class="details-right" v-if="selectedOrder.paymentProofUrl || selectedOrder.paymentProofNote">
                <div class="info-group">
                  <h3>Payment Proof</h3>
                  <div v-if="selectedOrder.paymentProofUrl" class="proof-block">
                    <p v-if="selectedOrder.paymentSenderName" class="proof-sender">
                      <strong>Name of Sender:</strong> {{ selectedOrder.paymentSenderName }}
                    </p>
                    <strong>Reference Image:</strong>
                    <div class="proof-image">
                      <img :src="selectedOrder.paymentProofUrl" alt="Payment proof" />
                    </div>
                    <a :href="selectedOrder.paymentProofUrl" target="_blank" rel="noopener" class="view-link">Open full image</a>
                  </div>
                  <p v-if="selectedOrder.paymentProofNote" class="proof-note">Note: {{ selectedOrder.paymentProofNote }}</p>
                </div>
              </div>
            </div>
            
            <div class="order-items-section">
              <h3>Order Items</h3>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Unit</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div class="item-details">
                        <span class="item-name">{{ selectedOrder.productName }}</span>
                      </div>
                    </td>
                    <td>{{ getUnitDisplay(selectedOrder.unit) }}</td>
                    <td>{{ selectedOrder.quantity }}</td>                    <td>₱{{ getUnitPrice(selectedOrder).toFixed(2) }}</td>
                    <td>₱{{ (selectedOrder.itemPrice || (getUnitPrice(selectedOrder) * selectedOrder.quantity)).toFixed(2) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr v-if="selectedOrder.deliveryFee">
                    <td colspan="4" class="text-right"><strong>Delivery Fee</strong></td>
                    <td class="fee-cell">₱{{ selectedOrder.deliveryFee.toFixed(2) }}</td>
                  </tr>
                  <tr v-if="selectedOrder.tax">
                    <td colspan="4" class="text-right"><strong>Tax</strong></td>
                    <td class="fee-cell">₱{{ selectedOrder.tax.toFixed(2) }}</td>
                  </tr>
                  <tr>
                    <td colspan="4" class="text-right"><strong>Total</strong></td>
                    <td class="total-cell">₱{{ selectedOrder.totalPrice.toFixed(2) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
              <OrderStatusUpdate 
              :orderId="selectedOrder.id" 
              :currentStatus="selectedOrder.status"
              :orderData="selectedOrder"
              @statusUpdated="handleStatusUpdated"
            />          </div>
        </div>
      </div>
    </div>

    <!-- Order Notification -->
    <OrderNotif
      v-if="showNotification"
      :title="notificationTitle"
      :message="notificationMessage"
      :type="notificationType"
      @close="showNotification = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Sidebar from '@/components/Sidebar.vue';
import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs, doc, updateDoc, query, where, onSnapshot, runTransaction, increment, serverTimestamp, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import OrderStatusUpdate from '@/components/sellerside/OrderStatusUpdate.vue';
import OrderNotif from '@/components/sellerside/OrderNotif.vue';
import OfflineBanner from '@/components/OfflineBanner.vue';
import { Clock, Package, Truck, CheckCircle, PackageCheck, RotateCcw } from 'lucide-vue-next';

// UI State
const isDarkMode = ref(false);
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;
const showFilterDropdown = ref(false);
const activeFilter = ref('All Orders');
const editingStatus = ref({});
const showOrderModal = ref(false);
const selectedOrder = ref({});
const orders = ref([]);
const startDate = ref('');
const endDate = ref('');
const currentSellerId = ref('');
const showExportMenu = ref(false);

// Notification state
const showNotification = ref(false);
const notificationTitle = ref('');
const notificationMessage = ref('');
const notificationType = ref('success');

// Unit display mapping
const unitDisplayMap = {
  'kg': 'Kilogram',
  'sack': 'Sack',
  'tali': 'Tali',
  'kaing': 'Kaing',
  'bundle': 'Bundle',
  'tray': 'Tray',
  'piece': 'Piece',
  'perKilo': 'Kilogram',
  'perSack': 'Sack',
  'perTali': 'Tali',
  'perKaing': 'Kaing',
  'perBundle': 'Bundle',
  'perTray': 'Tray',
  'perPiece': 'Piece'
};

// Helper function to get unit display name
const getUnitDisplay = (unit) => {
  return unitDisplayMap[unit] || unit || 'Unit';
};

// Helper function to normalize status for CSS classes
const normalizeStatusClass = (status) => {
  return status.toLowerCase().replace(/\s+/g, '-');
};

// Helper function to get display address
const getAddressDisplay = (location) => {
  if (!location) return 'N/A';
  if (typeof location === 'string') return location;
  if (location.address) return location.address;
  
  // Construct address from components
  const parts = [];
  if (location.barangay) parts.push(location.barangay);
  if (location.municipality) parts.push(location.municipality);
  if (location.province) parts.push(location.province);
  
  return parts.length > 0 ? parts.join(', ') : 'N/A';
};

// Helper function to calculate unit price
const getUnitPrice = (order) => {
  // Priority: unitPrice -> pricePerKg -> calculated from total
  if (order.unitPrice && order.unitPrice > 0) {
    return order.unitPrice;
  }
  if (order.pricePerKg && order.pricePerKg > 0) {
    return order.pricePerKg;
  }
  if (order.totalPrice && order.quantity && order.quantity > 0) {
    return order.totalPrice / order.quantity;
  }
  return 0;
};

// Order type helpers
const orderTypeLabel = (type, isPreOrderFlag) => {
  const t = (type || '').toLowerCase();
  if (t === 'preorder' || isPreOrderFlag) return 'Pre-Order';
  if (t === 'wholesale') return 'Wholesale';
  return 'Normal';
};
const orderTypeClass = (type, isPreOrderFlag) => {
  const t = (type || '').toLowerCase();
  if (t === 'preorder' || isPreOrderFlag) return 'type-preorder';
  if (t === 'wholesale') return 'type-wholesale';
  return 'type-normal';
};

// Real-time orders listener
let unsubscribeOrders = null;

const initializeOrders = async () => {
  try {
    const auth = getAuth();
    const currentUserId = auth.currentUser?.uid;
    
    if (!currentUserId) {
      console.error('No user ID found');
      return;
    }

    console.log('Finding seller document for user:', currentUserId);

    // Find the seller document that belongs to this user
    const sellersQuery = query(
      collection(db, 'sellers'),
      where('userId', '==', currentUserId)
    );
    
    const sellersSnapshot = await getDocs(sellersQuery);
    
    if (sellersSnapshot.empty) {
      console.error('No seller document found for user:', currentUserId);
      console.log('Trying alternative seller lookup...');
      
      // Alternative: Check if the user IS the seller (userId as sellerId)
      console.log('Trying to use user ID directly as seller ID...');
      currentSellerId.value = currentUserId;
      console.log('Using user ID as seller ID:', currentSellerId.value);
    } else {
      // Get the seller document ID (this is what we store in orders)
      const sellerDoc = sellersSnapshot.docs[0];
      const sellerData = sellerDoc.data();
      currentSellerId.value = sellerDoc.id; // This is the seller document ID
      
      console.log('Found seller document:', {
        documentId: sellerDoc.id,
        userId: sellerData.userId,
        farmName: sellerData.farmDetails?.farmName || 'No farm name',
        status: sellerData.status || 'No status'
      });
      
      console.log('Using seller document ID:', currentSellerId.value);
    }
    console.log('Setting up real-time orders listener for seller:', currentSellerId.value);

    // Clean up existing listener
    if (unsubscribeOrders) {
      unsubscribeOrders();
    }

    // Try multiple queries to find orders - seller document ID or user ID
    const queries = [];
    
    // Primary query: using seller document ID
    if (currentSellerId.value !== currentUserId) {
      queries.push({
        query: query(collection(db, 'orders'), where('sellerId', '==', currentSellerId.value)),
        description: 'Seller Document ID'
      });
    }
    
    // Fallback query: using user ID as seller ID
    queries.push({
      query: query(collection(db, 'orders'), where('sellerId', '==', currentUserId)),
      description: 'User ID as Seller ID'
    });

    console.log(`Setting up ${queries.length} queries to find orders...`);

    // Use the first query initially, but we'll combine results from both
    const ordersQuery = queries[0].query;

    // Set up real-time listener for orders
    unsubscribeOrders = onSnapshot(ordersQuery, async (querySnapshot) => {
      let allOrders = [];
      const orderCount = querySnapshot.size;
      console.log(`Primary query found ${orderCount} orders for seller ${currentSellerId.value}`);
      
      // Add orders from primary query
      querySnapshot.forEach(doc => {
        allOrders.push({
          id: doc.id,
          ...doc.data(),
          source: queries[0].description
        });
      });

      // If we have multiple queries, check the fallback query too
      if (queries.length > 1) {
        try {
          const fallbackSnapshot = await getDocs(queries[1].query);
          console.log(`Fallback query found ${fallbackSnapshot.size} orders for user ${currentUserId}`);
          
          fallbackSnapshot.forEach(doc => {
            // Avoid duplicates
            if (!allOrders.find(order => order.id === doc.id)) {
              allOrders.push({
                id: doc.id,
                ...doc.data(),
                source: queries[1].description
              });
            }
          });
        } catch (error) {
          console.error('Error in fallback query:', error);
        }
      }
      
      console.log(`Total orders found: ${allOrders.length}`);
      
      // Debug: Log the query being used
      console.log('Query details:', {
        primarySellerId: currentSellerId.value,
        fallbackUserId: currentUserId,
        totalFound: allOrders.length
      });

      if (allOrders.length === 0) {
        orders.value = [];
        console.log('No orders found for this seller');
        
        // Debug: Let's check if there are any orders in the collection at all
        console.log('Debugging: Checking if any orders exist...');
        getDocs(collection(db, 'orders')).then(allOrdersSnapshot => {
          console.log(`Total orders in collection: ${allOrdersSnapshot.size}`);
          const potentialOrders = [];
          allOrdersSnapshot.forEach(doc => {
            const data = doc.data();
            console.log('Order found:', {
              id: doc.id,
              sellerId: data.sellerId,
              orderCode: data.orderCode,
              productName: data.productName,
              timestamp: data.createdAt || data.timestamp,
              status: data.status
            });
            
            // Check if this order might belong to current user by any chance
            if (data.sellerId === currentSellerId.value || data.sellerId === currentUserId) {
              potentialOrders.push(data);
            }
          });
          
          console.log(`Found ${potentialOrders.length} potential orders for current seller`);
          
          if (potentialOrders.length > 0) {
            console.log('🚨 WARNING: Found orders but they are not being returned by the query!');
            console.log('Potential orders:', potentialOrders);
          }
        });
        return;
      }

      orders.value = allOrders.map(orderData => {
        const data = orderData;
        let timestamp = data.createdAt || data.timestamp;
        
        // Convert to Date if it's a Firestore Timestamp
        if (timestamp && typeof timestamp.toDate === 'function') {
          timestamp = timestamp.toDate();
        }
        // Convert to Date if it's a string
        else if (typeof timestamp === 'string') {
          timestamp = new Date(timestamp);
        }
        // If it's missing, use current date
        else if (!timestamp) {
          timestamp = new Date();
        }
        
        // Ensure Location is properly structured
        const location = typeof data.Location === 'string' 
          ? { address: data.Location } 
          : (data.Location || {});
        
        // Debug log for each order
        console.log(`Processing order ${data.id}:`, {
          orderCode: data.orderCode,
          sellerId: data.sellerId,
          productName: data.productName,
          status: data.status,
          source: data.source,
          timestamp: timestamp
        });
        
        return {
          id: data.id,
          ...data,
          username: data.username || '',
          status: data.status || 'Pending', // Default status is now 'Pending'
          Location: location,
          totalPrice: data.totalPrice || 0,
          timestamp: timestamp,
          sellerId: data.sellerId || '',
          orderCode: data.orderCode || '',
          // New fields for multi-unit support
          unit: data.unit || 'piece',
          quantity: data.quantity || 1,
          unitPrice: data.unitPrice || 0,
          itemPrice: data.itemPrice || 0,
          deliveryFee: data.deliveryFee || 0,
          tax: data.tax || 0,
          paymentMethod: data.paymentMethod || 'Cash on Delivery',
          gcashNumber: data.gcashNumber || '',
          deliveryOption: data.deliveryOption || '',
          payStatus: data.payStatus || 'unpaid'
        };
      });

      console.log('Orders processed and updated:', orders.value.length);
      console.log('Order details:', orders.value.map(o => ({
        code: o.orderCode,
        product: o.productName,
        status: o.status,
        timestamp: o.timestamp
      })));
      
      // Show success message on first load if orders found
      if (orders.value.length > 0) {
        console.log(`Successfully loaded ${orders.value.length} orders for your products`);
      }
    }, (error) => {
      console.error('Error in orders listener:', error);
    });

  } catch (error) {
    console.error('Error setting up orders listener:', error);
  }
};

onMounted(() => {
  initializeOrders();
  document.addEventListener('click', closeExportMenu);
});

onUnmounted(() => {
  document.removeEventListener('click', closeExportMenu);
  // Clean up orders listener
  if (unsubscribeOrders) {
    unsubscribeOrders();
  }
});

// Toggle dark mode
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  document.body.classList.toggle('dark', isDarkMode.value);
};

const filterOptions = ['All Orders', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Order Received', 'Refund Processing', 'Cancelled'];
const statusOptions = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Order Received', 'Refund Processing', 'Cancelled'];

// Order summary stats
const pendingOrdersCount = computed(() => orders.value.filter(order => order.status === 'Pending').length);
const processingOrdersCount = computed(() => orders.value.filter(order => order.status === 'Processing').length);
const shippedOrdersCount = computed(() => orders.value.filter(order => order.status === 'Shipped').length);
const deliveredOrdersCount = computed(() => orders.value.filter(order => order.status === 'Delivered').length);
const orderReceivedCount = computed(() => orders.value.filter(order => order.status === 'Order Received').length);
const refundProcessingCount = computed(() => orders.value.filter(order => order.status === 'Refund Processing').length);

// Filter orders based on search query, active filter, and date
const filteredOrders = computed(() => {
  const searchTerm = searchQuery.value.toLowerCase();
  return [...orders.value]
    .filter(order => {
      const matchesSearch = 
        (order.orderCode && order.orderCode.toLowerCase().includes(searchTerm)) ||
        (order.username && order.username.toLowerCase().includes(searchTerm)) ||
        (order.productName && order.productName.toLowerCase().includes(searchTerm));
      
      const matchesFilter = 
        activeFilter.value === 'All Orders' || 
        order.status === activeFilter.value;
      
      // Re-enable date filtering with proper debugging
      const matchesDate = filterByDateCondition(order.timestamp);
      
      // Debug logging for date filtering
      if (startDate.value) {
        console.log('Date filtering order:', {
          orderCode: order.orderCode,
          orderDate: order.timestamp,
          orderDateFormatted: order.timestamp ? new Date(order.timestamp).toLocaleDateString() : 'Invalid Date',
          filterDate: startDate.value,
          filterDateFormatted: new Date(startDate.value).toLocaleDateString(),
          matchesDate: matchesDate
        });
      }
      
      return matchesSearch && matchesFilter && matchesDate;
    })
    .sort((a, b) => {
      // First priority: Pending orders always at the top
      if (a.status === 'Pending' && b.status !== 'Pending') return -1;
      if (b.status === 'Pending' && a.status !== 'Pending') return 1;
      
      // Second priority: Sort by timestamp descending (newest first)
      return b.timestamp - a.timestamp;
    });
});

// Date range filtering logic
const filterByDateCondition = (orderDate) => {
  if (!startDate.value) return true;
  
  // Ensure we have a valid date
  if (!orderDate) {
    console.log('Order has no date, excluding from filter');
    return false;
  }
  
  let orderDateObj;
  
  // Convert order date to Date object
  if (orderDate instanceof Date) {
    orderDateObj = orderDate;
  } else if (typeof orderDate.toDate === 'function') {
    orderDateObj = orderDate.toDate();
  } else if (typeof orderDate === 'string') {
    orderDateObj = new Date(orderDate);
  } else if (typeof orderDate === 'number') {
    orderDateObj = new Date(orderDate);
  } else {
    console.log('Invalid order date format:', orderDate);
    return false;
  }
  
  // Validate the converted date
  if (isNaN(orderDateObj.getTime())) {
    console.log('Invalid order date after conversion:', orderDate);
    return false;
  }
  
  const startDateObj = new Date(startDate.value);
  
  // Set time to start of day for start date
  startDateObj.setHours(0, 0, 0, 0);
  
  if (!endDate.value) {
    // Exact date filtering - only show orders from the selected start date
    const endOfStartDate = new Date(startDate.value);
    endOfStartDate.setHours(23, 59, 59, 999);
    
    const isInRange = orderDateObj >= startDateObj && orderDateObj <= endOfStartDate;
    
    console.log('Date filtering (single date):', {
      orderDate: orderDateObj.toLocaleDateString(),
      filterDate: startDateObj.toLocaleDateString(),
      orderDateTime: orderDateObj.getTime(),
      startDateTime: startDateObj.getTime(),
      endDateTime: endOfStartDate.getTime(),
      isInRange: isInRange
    });
    
    return isInRange;
  } else {
    // Range date filtering - show orders between start and end dates
    const endDateObj = new Date(endDate.value);
    endDateObj.setHours(23, 59, 59, 999);
    
    const isInRange = orderDateObj >= startDateObj && orderDateObj <= endDateObj;
    
    console.log('Date filtering (date range):', {
      orderDate: orderDateObj.toLocaleDateString(),
      startDate: startDateObj.toLocaleDateString(),
      endDate: endDateObj.toLocaleDateString(),
      isInRange: isInRange
    });
    
    return isInRange;
  }
};

// Helper function to format date for display
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const filterByDateRange = () => {
  currentPage.value = 1;
};

const resetDateFilter = () => {
  startDate.value = '';
  endDate.value = '';
  currentPage.value = 1;
};

// Calculate total pages for pagination
const totalPages = computed(() => Math.max(1, Math.ceil(filteredOrders.value.length / itemsPerPage)));

// Get paginated orders for current page
const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredOrders.value.slice(start, end);
});

// Filter dropdown functions
const toggleFilterDropdown = () => {
  showFilterDropdown.value = !showFilterDropdown.value;
};

const setFilter = (filter) => {
  activeFilter.value = filter;
  currentPage.value = 1;
  showFilterDropdown.value = false;
};

// Status editing functions
const startEditingStatus = (index) => {
  editingStatus.value = { ...editingStatus.value, [index]: true };
};

const finishEditingStatus = async (index, order) => {
  editingStatus.value = { ...editingStatus.value, [index]: false };
  try {
    const orderRef = doc(db, 'orders', order.id);
    await updateDoc(orderRef, {
      status: order.status
    });

    // If status moved to Delivered or Order Received, increment product.sold once
    if (order.status === 'Delivered' || order.status === 'Order Received') {
      try {
        await runTransaction(db, async (transaction) => {
          const freshOrderSnap = await transaction.get(orderRef);
          if (!freshOrderSnap.exists()) return;
          const odata = freshOrderSnap.data() || {};
          if (odata.soldCountApplied === true) return; // already applied
          const productId = odata.productId;
          if (!productId) return;
          const productRef = doc(db, 'products', productId);
          const qty = Number(odata.quantity);
          const incBy = !isNaN(qty) && qty > 0 ? qty : 1;
          transaction.update(productRef, {
            sold: increment(incBy),
            lastSoldAt: serverTimestamp()
          });
          transaction.update(orderRef, { soldCountApplied: true });
        });
      } catch (e) {
        console.error('Failed to apply sold counter (inline status):', e);
      }
    }

    // If status moved to Cancelled and previously applied, rollback sold count
    if (order.status === 'Cancelled') {
      try {
        await runTransaction(db, async (transaction) => {
          const freshOrderSnap = await transaction.get(orderRef);
          if (!freshOrderSnap.exists()) return;
          const odata = freshOrderSnap.data() || {};
          if (odata.soldCountApplied !== true) return; // nothing to rollback
          const productId = odata.productId;
          if (!productId) return;
          const productRef = doc(db, 'products', productId);
          const qty = Number(odata.quantity);
          const decBy = !isNaN(qty) && qty > 0 ? qty : 1;
          transaction.update(productRef, {
            sold: increment(-decBy)
          });
          transaction.update(orderRef, { soldCountApplied: false });
        });
      } catch (e) {
        console.error('Failed to rollback sold counter (inline status):', e);
      }
    }

    // Create a persistent customer notification about the status change
    try {
      const customerId = order.userId;
      if (customerId) {
        const code = order.orderCode || (order.id ? order.id.substring(0, 6) : '');
        const phrases = {
          'Pending': `We've received your order #${code}. It's now pending confirmation.`,
          'Processing': `Order #${code} is already On Processing.`,
          'On Processing': `Order #${code} is already On Processing.`,
          'Shipped': `Order #${code} is on the way. You'll be notified upon arrival.`,
          'Delivered': `Order #${code} has been delivered. Please verify your items.`,
          'Order Received': `Thanks! We've marked order #${code} as received.`,
          'Refund Processing': `Your refund request for order #${code} is being processed.`,
          'Cancelled': `Order #${code} has been cancelled.`
        };
        await addDoc(collection(db, 'notifications'), {
          type: 'order_update',
          recipientType: 'customer',
          customerId,
          userId: customerId,
          sellerId: order.sellerId || null,
          title: `Order update: ${order.status}`,
          message: phrases[order.status] || `Order #${code} status updated to ${order.status}.`,
          orderDetails: {
            orderId: order.id,
            orderCode: order.orderCode || code,
            amount: Number(order.totalPrice || 0)
          },
          status: order.status,
          read: false,
          createdAt: serverTimestamp(),
          timestamp: serverTimestamp()
        });
      }
    } catch (e) {
      console.error('Failed to create customer notification:', e);
    }
  } catch (error) {
    console.error('Error updating order status:', error);
  }
};

// Format date and time for display
const formatDateTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  let dateObj;
  
  // If it's already a Date object
  if (timestamp instanceof Date) {
    dateObj = timestamp;
  }
  // If it's a Firestore Timestamp
  else if (typeof timestamp.toDate === 'function') {
    dateObj = timestamp.toDate();
  }
  // If it's a string that can be converted to a date
  else if (typeof timestamp === 'string') {
    dateObj = new Date(timestamp);
    if (isNaN(dateObj.getTime())) return 'N/A';
  }
  // If it's a number (milliseconds since epoch)
  else if (typeof timestamp === 'number') {
    dateObj = new Date(timestamp);
  }
  else {
    return 'N/A';
  }
  
  return dateObj.toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// Order detail modal functions
const viewOrderDetails = (order) => {
  selectedOrder.value = { 
    ...order,
    Location: typeof order.Location === 'string' 
      ? { address: order.Location } 
      : (order.Location || {})
  };
  showOrderModal.value = true;
};

const closeModal = () => {
  showOrderModal.value = false;
};

// Notification helper function
const showOrderNotification = (title, message, type = 'success', duration = null) => {
  // Clear any existing notification first
  showNotification.value = false;
  
  // Small delay to ensure the previous notification is cleared
  setTimeout(() => {
    notificationTitle.value = title;
    notificationMessage.value = message;
    notificationType.value = type;
    showNotification.value = true;
    
    // Auto-hide after specified duration or default based on type
    const timeout = duration || (type === 'error' ? 5000 : type === 'info' ? 4000 : 3000);
    setTimeout(() => {
      showNotification.value = false;
    }, timeout);
  }, 100);
};

const editOrder = (order) => {
  showOrderNotification(
    'Edit Order',
    `Editing order ${order.orderCode ? `#${order.orderCode}` : 'details'}`,
    'info'
  );
};

const handleStatusUpdated = (updateData) => {
  // Update local state
  const orderIndex = orders.value.findIndex(o => o.id === selectedOrder.value.id);
  if (orderIndex !== -1) {
    orders.value[orderIndex].status = updateData.status;
    selectedOrder.value.status = updateData.status;
    
    // If there's additional data, update it as well
    if (updateData.additionalData) {
      // You can add more properties here if needed
    }
  }
  
  // Note: OrderStatusUpdate component handles the status update notification
  // No need for duplicate notification here
};

// Print receipt function
const printReceipt = () => {
  const order = selectedOrder.value;
  const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) {
    showOrderNotification(
      'Print Failed',
      'Please allow pop-ups to print receipts',
      'error'
    );
    return;
  }
  
  // Format the date for the receipt
  const orderDate = formatDateTime(order.timestamp || order.createdAt);
  
  // Determine payment status label for receipt
  const paymentStatusDisplay = (() => {
    const raw = (order.payStatus && order.payStatus !== 'unpaid') ? order.payStatus : (order.paymentStatus || 'unpaid');
    if (!raw) return 'Unpaid';
    const v = ('' + raw).toLowerCase();
    if (v === 'availing') return 'Availing';
    if (v === 'paying') return 'Paying';
    return v.charAt(0).toUpperCase() + v.slice(1);
  })();

  // Create receipt HTML content with escaped closing tags
  const receiptContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Order Receipt #${order.orderCode || order.id.substring(0, 6)}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
        .receipt { max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; }
        .receipt-header { text-align: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #4a8f4d; }
        .receipt-header h1 { color: #2e5c31; margin: 0; font-size: 24px; }
        .receipt-header p { margin: 5px 0; color: #666; }
        .receipt-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .info-group { flex: 1; }
        .info-group h3 { margin-top: 0; color: #2e5c31; font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        .info-group p { margin: 5px 0; font-size: 14px; }
        .info-group strong { display: inline-block; min-width: 100px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
        th { background-color: #f9f9f9; font-weight: bold; }
        .total-row td { font-weight: bold; border-top: 2px solid #ddd; }
        .text-right { text-align: right; }
        .receipt-footer { text-align: center; margin-top: 30px; padding-top: 10px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
        .status-badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 12px; background-color: #f3f4f6; color: #4b5563; }
        .status-pending { background-color: #fef3c7; color: #d97706; }
        .status-processing { background-color: #e0f2fe; color: #0284c7; }
        .status-shipped { background-color: #dbeafe; color: #2563eb; }
        .status-delivered { background-color: #d1fae5; color: #059669; }
        .status-cancelled { background-color: #fee2e2; color: #dc2626; }
        
        @media print {
          body { padding: 0; margin: 0; }
          .receipt { border: none; padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="receipt-header">
          <h1>FarmXpress</h1>
          <p>Order Receipt</p>
          <p>Order #${order.orderCode || order.id.substring(0, 6)}</p>
          <p>${orderDate}</p>
        </div>
        
        <div class="receipt-info">
          <div class="info-group">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${order.username || 'N/A'}</p>
          </div>
          
          <div class="info-group">
            <h3>Delivery Information</h3>
            <p><strong>Address:</strong> ${getAddressDisplay(order.Location)}</p>
            ${order.Location?.name ? `<p><strong>Name/Alias:</strong> ${order.Location.name}</p>` : ''}
            ${order.Location?.locationNotes || order.Location?.notes ? `<p><strong>Instructions:</strong> ${order.Location.locationNotes || order.Location.notes}</p>` : ''}
            ${order.deliveryOption ? `<p><strong>Delivery:</strong> ${order.deliveryOption}</p>` : ''}
          </div>
          
          <div class="info-group">
            <h3>Order Details</h3>
            <p><strong>Status:</strong> <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></p>
            <p><strong>Payment:</strong> ${order.paymentMethod || 'Cash on Delivery'}</p>
            <p><strong>Payment Status:</strong> ${paymentStatusDisplay}</p>
            <p><strong>Order ID:</strong> ${order.id}</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Unit</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${order.productName || 'N/A'}</td>
              <td>${getUnitDisplay(order.unit)}</td>
              <td>${order.quantity || 0}</td>              <td>₱${getUnitPrice(order).toFixed(2)}</td>
              <td>₱${(order.itemPrice || (getUnitPrice(order) * order.quantity)).toFixed(2)}</td>
            </tr>
          </tbody>
          <tfoot>
            ${order.deliveryFee ? `
            <tr>
              <td colspan="4" class="text-right">Delivery Fee</td>
              <td>₱${order.deliveryFee.toFixed(2)}</td>
            </tr>` : ''}
            ${order.tax ? `
            <tr>
              <td colspan="4" class="text-right">Tax</td>
              <td>₱${order.tax.toFixed(2)}</td>
            </tr>` : ''}
            <tr class="total-row">
              <td colspan="4" class="text-right">Total</td>
              <td>₱${order.totalPrice ? order.totalPrice.toFixed(2) : '0.00'}</td>
            </tr>
          </tfoot>
        </table>
        
        <div class="receipt-footer">
          <p>Thank you for your order!</p>
          <p>For any questions, please contact our customer support.</p>
          <p class="no-print">
            <button onclick="window.print();" style="padding: 8px 16px; background-color: #4a8f4d; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Print Receipt
            </button>
          </p>
        </div>
      </div>
      
      <script>
        // Auto-print when the page loads
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      <\\/script>
    <\\/body>
    <\\/html>
  `;
  
  // Write to the new window
  receiptWindow.document.open();
  receiptWindow.document.write(receiptContent);
  receiptWindow.document.close();
};

// Export menu functions
const toggleExportMenu = (event) => {
  if (event) event.stopPropagation();
  showExportMenu.value = !showExportMenu.value;
};

// Close export menu when clicking outside
const closeExportMenu = (event) => {
  if (showExportMenu.value && !event.target.closest('.export-dropdown')) {
    showExportMenu.value = false;
  }
};

// Export function
const exportOrders = (format) => {
  showExportMenu.value = false;
  
  if (format === 'csv') {
    exportAsCSV();
  } else if (format === 'pdf') {
    exportAsPDF();
  }
};

// Export as CSV
const exportAsCSV = () => {
  // Create CSV content
  const headers = ['Order Code', 'Customer', 'Product', 'Type', 'Unit', 'Quantity', 'Unit Price', 'Location', 'Date', 'Total', 'Status'];
  
  const csvContent = [
    headers.join(','),
    ...filteredOrders.value.map(order => [
      order.orderCode ? `#${order.orderCode}` : 'N/A',
      order.username || 'Unknown',
      order.productName || 'N/A',
      orderTypeLabel(order.orderType, order.isPreOrder),
      getUnitDisplay(order.unit),
      order.quantity || 0,
      `₱${getUnitPrice(order).toFixed(2)}`,
      getAddressDisplay(order.Location),
      formatDateTime(order.timestamp || order.createdAt),
      `₱${order.totalPrice.toFixed(2)}`,
      order.status
    ].join(','))
  ].join('\n');
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `orders_export_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);  link.click();
  document.body.removeChild(link);
  
  // Show success notification
  showOrderNotification(
    'Export Successful',
    'Orders exported to CSV successfully',
    'success'
  );
};

// Helper function to escape HTML
const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// Export as PDF
const exportAsPDF = () => {
  // Create a new window for PDF content
  const printWindow = window.open('', '_blank');
    if (!printWindow) {
    showOrderNotification(
      'Export Failed',
      'Please allow pop-ups to export as PDF',
      'error'
    );
    return;
  }
  
  // Create PDF content with escaped closing tags
  const pdfContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Orders Export</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #2e5c31; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .export-info { margin-top: 20px; font-size: 12px; color: #666; }
        .status-badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 12px; }
        .status-pending { background-color: #fef3c7; color: #d97706; }
        .status-processing { background-color: #e0f2fe; color: #0284c7; }
        .status-shipped { background-color: #dbeafe; color: #2563eb; }
        .status-delivered { background-color: #d1fae5; color: #059669; }
        .status-cancelled { background-color: #fee2e2; color: #dc2626; }
      </style>
    </head>
    <body>
      <h1>Orders Export</h1>
      <table>
        <thead>
          <tr>
            <th>Order Code</th>
            <th>Customer</th>
            <th>Product</th>
            <th>Type</th>
            <th>Unit & Qty</th>
            <th>Location</th>
            <th>Date</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${filteredOrders.value.map(order => {
            const statusClass = `status-${order.status.toLowerCase()}`;
            return `
              <tr>
                <td>${escapeHtml(order.orderCode ? `#${order.orderCode}` : 'N/A')}</td>
                <td>${escapeHtml(order.username || 'Unknown')}</td>
                <td>${escapeHtml(order.productName || 'N/A')}</td>
                <td>${escapeHtml(orderTypeLabel(order.orderType, order.isPreOrder))}</td>
                <td>${order.quantity || 0} ${getUnitDisplay(order.unit)}</td>
                <td>${escapeHtml(getAddressDisplay(order.Location))}</td>
                <td>${escapeHtml(formatDateTime(order.timestamp || order.createdAt))}</td>
                <td>₱${order.totalPrice.toFixed(2)}</td>
                <td><span class="status-badge ${statusClass}">${order.status}</span></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      <div class="export-info">
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>Total Orders: ${filteredOrders.value.length}</p>
        <p>Filter: ${activeFilter.value}</p>
      </div>
      <script>
        window.onload = function() { window.print(); };
      <\\/script>
    <\\/body>
    <\\/html>
  `;
    // Write content to the new window
  printWindow.document.open();
  printWindow.document.write(pdfContent);
  printWindow.document.close();
  
  // Show success notification
  showOrderNotification(
    'Export Successful',
    'Orders exported to PDF successfully',
    'success'
  );
};
</script>
<style scoped>
.info-group p {
  margin: 8px 0;
  line-height: 1.5;
}

.info-group strong {
  display: inline-block;
  min-width: 100px;
  color: #4b5563;
}

.location-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.location-icon {
  color: #2e5c31;
  flex-shrink: 0;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.product-name {
  font-weight: 500;
}

.unit-quantity {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.quantity {
  font-weight: 600;
  font-size: 16px;
}

.unit {
  font-size: 12px;
  color: #666;
  text-transform: capitalize;
}

.item-details {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-name {
  font-weight: 500;
}

.fee-cell {
  color: #666;
  font-weight: 500;
}

/* Payment proof block */
.proof-block { margin-top: 8px; }
.proof-sender { margin: 0 0 6px 0; font-size: 13px; color: #374151; }
.proof-image { margin-top: 6px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #fafafa; }
.proof-image img { display: block; width: 100%; max-width: 360px; max-height: 280px; object-fit: contain; }
.view-link { display: inline-block; margin-top: 6px; color: #2e5c31; text-decoration: underline; font-size: 13px; }
.proof-note { margin-top: 4px; font-size: 12px; color: #4b5563; }

/* Order type badges */
.type-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}
.type-preorder { background-color: #e0f2fe; color: #0369a1; }
.type-wholesale { background-color: #ede9fe; color: #5b21b6; }
.type-normal { background-color: #f3f4f6; color: #374151; }

.dashboard-container {
  display: flex;
  min-height: 100vh;
  background-color: #f9fafb;
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  margin-left: 230px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 5px 0;
}

.page-title p {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
}

.theme-toggle {
  background: none;
  border: none;
  color: #111827;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
}

.theme-toggle:hover {
  background: rgba(0,0,0,0.05);
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* Exactly 3 cards per row */
  gap: 20px;
  margin-bottom: 20px;
}

.summary-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  min-height: 80px; /* Consistent height */
}

.card-content {
  flex: 1;
  min-width: 0; /* Prevents overflow issues */
}

.card-icon {
  padding: 12px;
  border-radius: 8px;
  margin-right: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.pending-icon {
  background-color: #fef3c7;
  color: #d97706;
}

.processing-icon {
  background-color: #e0f2fe;
  color: #0284c7;
}

.shipped-icon {
  background-color: #dbeafe;
  color: #2563eb;
}

.delivered-icon {
  background-color: #d1fae5;
  color: #059669;
}

.received-icon {
  background-color: #ecfdf5;
  color: #047857;
}

.refund-icon {
  background-color: #fff7ed;
  color: #ea580c;
}

.card-content h3 {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0 0 5px 0;
}

.card-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.content-wrapper {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.search-and-filter {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-grow: 1;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  flex-grow: 1;
  max-width: 400px;
}

.search-box input {
  width: 100%;
  padding: 10px 16px 10px 40px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
  background-color: #f9f9f9;
}

.search-box input:focus {
  outline: none;
  border-color: #888;
  background-color: white;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #888;
}

.clear-search {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 0;
}

.date-filter-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.date-filter {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  min-height: 40px;
  width: fit-content;
  max-width: 100%;
  overflow: hidden;
  transition: all 0.3s ease;
}

.date-filter:hover {
  background-color: #f0f0f0;
  border-color: #d0d0d0;
}

.date-filter:focus-within {
  background-color: white;
  border-color: #888;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
}

.date-filter i {
  color: #888;
  font-size: 16px;
  flex-shrink: 0;
}

.date-separator {
  color: #666;
  font-size: 12px;
  margin: 0 2px;
  white-space: nowrap;
  flex-shrink: 0;
  font-weight: 500;
}

.minimal-date-input {
  border: none;
  background: transparent;
  padding: 4px 6px;
  font-size: 13px;
  color: #333;
  outline: none;
  width: 95px;
  max-width: 95px;
  flex-shrink: 0;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  text-overflow: ellipsis;
}

.minimal-date-input::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.6;
  filter: invert(0.5);
  width: 14px;
  height: 14px;
  margin-left: 2px;
}

.minimal-date-input::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
  filter: invert(0.3);
}

.minimal-date-input:focus {
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
}

.date-clear-btn {
  background: #f0f0f0;
  border: 1px solid #ddd;
  color: #333;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  transition: all 0.2s;
  flex-shrink: 0;
  margin-left: 4px;
  font-size: 12px;
}

.date-clear-btn:hover {
  background-color: #dc2626;
  color: white;
  border-color: #dc2626;
  transform: scale(1.1);
}

.date-clear-btn i {
  font-size: 10px;
  font-weight: bold;
  line-height: 1;
}

.date-filter-info {
  margin-top: 5px;
  padding: 4px 8px;
  background-color: #e8f5e9;
  border-radius: 4px;
  border: 1px solid #c8e6c9;
  white-space: nowrap;
}

.filter-text {
  font-size: 12px;
  color: #2e7d32;
  font-weight: 500;
}

.minimal-reset-btn {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.minimal-reset-btn:hover {
  background-color: #f0f0f0;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-dropdown {
  position: relative;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #f3f4f6;
  border: none;
  border-radius: 20px;
  font-size: 0.9rem;
  color: #4b5563;
  cursor: pointer;
}

.filter-options {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 10;
  min-width: 150px;
}

.filter-options button {
  display: block;
  width: 100%;
  padding: 8px 16px;
  text-align: left;
  background: none;
  border: none;
  font-size: 0.9rem;
  color: #4b5563;
  cursor: pointer;
}

.filter-options button:hover {
  background-color: #f3f4f6;
}

.export-dropdown {
  position: relative;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  cursor: pointer;
  border: none;
  background-color: #2e5c31;
  color: white;
}

.export-btn:hover {
  background-color: #234425;
}

.export-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 5px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 10;
  min-width: 180px;
  overflow: hidden;
}

.export-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  width: 100%;
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.9rem;
  color: #4b5563;
  transition: background-color 0.2s;
}

.export-option:hover {
  background-color: #f9fafb;
}

.ml-1 {
  margin-left: 4px;
}

.table-container {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background-color: white;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  min-width: 800px; /* Ensure table has minimum width */
}

.orders-table th,
.orders-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap; /* Prevent text wrapping */
}

.orders-table th {
  font-weight: 600;
  color: #4b5563;
  background-color: #f9fafb;
}

.order-id {
  font-weight: 600;
  color: #2e5c31;
}

.status-cell {
  position: relative;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.edit-status-btn {
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

.status-badge:hover .edit-status-btn {
  opacity: 1;
}

.status-dropdown {
  display: inline-block;
}

.status-select {
  padding: 4px 8px;
  border-radius: 9999px;
  border: 1px solid #e5e7eb;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: white;
}

.status-badge.pending {
  background-color: #fef3c7;
  color: #d97706;
}

.status-badge.processing {
  background-color: #e0f2fe;
  color: #0284c7;
}

.status-badge.shipped {
  background-color: #dbeafe;
  color: #2563eb;
}

.status-badge.delivered {
  background-color: #d1fae5;
  color: #059669;
}

.status-badge.order-received,
.status-badge.orderreceived,
.status-badge[class*="order received"],
.status-badge[class*="order-received"] {
  background-color: #065f46;
  color: #ffffff;
}

.status-badge.cancelled {
  background-color: #fee2e2;
  color: #dc2626;
}

.status-badge.refund-processing,
.status-badge[class*="refund processing"],
.status-badge[class*="refund-processing"] {
  background-color: #fff7ed;
  color: #ea580c;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.view-btn {
  background-color: #e0f2fe;
  color: #0284c7;
}

.view-btn:hover {
  background-color: #bae6fd;
}

.edit-btn {
  background-color: #f3f4f6;
  color: #4b5563;
}

.edit-btn:hover {
  background-color: #e5e7eb;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
}

.pagination button {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 16px;
  background-color: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.modal-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.print-receipt-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background-color: #2e5c31;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.print-receipt-btn:hover {
  background-color: #234425;
}

.close-btn {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 1.25rem;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: #f3f4f6;
}

.modal-body {
  padding: 20px;
}

.order-details-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 24px;
}

.details-left, .details-right { min-width: 0; }
.details-right { align-self: start; }

.order-info-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.info-group h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 10px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.info-group p {
  margin: 8px 0;
  font-size: 0.9rem;
  color: #4b5563;
}

.order-items-section {
  margin-bottom: 30px;
}

.order-items-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 15px 0;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th,
.items-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.items-table th {
  font-weight: 600;
  color: #4b5563;
  background-color: #f9fafb;
}

.items-table tfoot td {
  padding: 10px;
  text-align: right;
}

.text-right {
  text-align: right;
}

.total-cell {
  font-weight: 700;
  color: #2e5c31;
  font-size: 1.1rem;
}

:global(.dark) .main-content {
  background-color: #111827;
}

:global(.dark) .theme-toggle {
  color: #f9fafb;
}

:global(.dark) .theme-toggle:hover {
  background: rgba(255,255,255,0.1);
}

:global(.dark) .content-wrapper {
  background-color: #1f2937;
}

:global(.dark) .page-title h1 {
  color: #f9fafb;
}

:global(.dark) .page-title p {
  color: #9ca3af;
}

:global(.dark) .card-value {
  color: #f9fafb;
}

:global(.dark) .search-box,
:global(.dark) .date-filter {
  background-color: #1f2937;
  border-color: #374151;
  color: #e5e7eb;
}

:global(.dark) .search-box input,
:global(.dark) .minimal-date-input,
:global(.dark) .minimal-time-input {
  background-color: #1f2937;
  color: #e5e7eb;
}

:global(.dark) .minimal-date-input::-webkit-calendar-picker-indicator {
  filter: invert(0.8);
}

:global(.dark) .minimal-date-input:focus {
  background-color: #374151;
}

:global(.dark) .filter-options {
  background-color: #1f2937;
  border-color: #374151;
}

:global(.dark) .filter-options button {
  color: #e5e7eb;
}

:global(.dark) .filter-options button:hover {
  background-color: #374151;
}

:global(.dark) .export-btn {
  background-color: #3b7a3f;
}

:global(.dark) .export-btn:hover {
  background-color: #2e5c31;
}

:global(.dark) .export-menu {
  background-color: #1f2937;
  border-color: #374151;
}

:global(.dark) .export-option {
  color: #e5e7eb;
}

:global(.dark) .export-option:hover {
  background-color: #374151;
}

:global(.dark) .orders-table th {
  background-color: #374151;
  color: #e5e7eb;
}

:global(.dark) .orders-table td {
  border-color: #4b5563;
}

:global(.dark) .order-id {
  color: #6abe6e;
}

:global(.dark) .location-icon {
  color: #6abe6e;
}

:global(.dark) .pagination button {
  background-color: #374151;
  border-color: #4b5563;
}

:global(.dark) .modal-content {
  background-color: #1f2937;
}

:global(.dark) .modal-header {
  border-bottom-color: #4b5563;
}

:global(.dark) .modal-header h2 {
  color: #f9fafb;
}

:global(.dark) .close-btn {
  color: #9ca3af;
}

:global(.dark) .close-btn:hover {
  background-color: #374151;
}

:global(.dark) .print-receipt-btn {
  background-color: #3b7a3f;
}

:global(.dark) .print-receipt-btn:hover {
  background-color: #2e5c31;
}

:global(.dark) .info-group h3 {
  color: #f9fafb;
  border-bottom-color: #4b5563;
}

:global(.dark) .info-group p {
  color: #9ca3af;
}

:global(.dark) .items-table th {
  background-color: #374151;
  color: #e5e7eb;
}

:global(.dark) .items-table td,
:global(.dark) .items-table th {
  border-color: #4b5563;
}

:global(.dark) .total-cell {
  color: #6abe6e;
}

:global(.dark) .table-container {
  background-color: #1f2937;
  border-color: #374151;
}

:global(.dark) .orders-table th {
  background-color: #374151;
  color: #e5e7eb;
}

:global(.dark) .orders-table td {
  border-color: #4b5563;
  color: #e5e7eb;
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding: 15px;
    /* Prevent global header from overlapping content on mobile */
    padding-top: calc(64px + env(safe-area-inset-top));
  }
  
  .summary-cards {
    grid-template-columns: repeat(2, 1fr); /* 2 columns on mobile as requested */
    gap: 12px;
  }

  .summary-card {
    padding: 14px;
    min-height: 72px;
  }

  .card-icon :deep(svg) {
    width: 18px;
    height: 18px;
    stroke-width: 2.25;
  }

  .card-content h3 {
    font-size: 0.8rem;
    margin-bottom: 4px;
  }

  .card-value {
    font-size: 1.2rem;
  }
  
  .actions-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-and-filter {
    flex-direction: column;
    gap: 12px;
  }
  
  .search-box {
    max-width: none;
  }
  
  .date-filter {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
    min-height: 36px;
    padding: 6px 10px;
  }
  
  .minimal-date-input,
  .minimal-time-input {
    width: 100px;
    max-width: 100px;
    padding: 6px 4px;
    background-color: white;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    font-size: 12px;
  }
  
  .minimal-date-input::-webkit-calendar-picker-indicator {
    opacity: 1;
    filter: invert(0.5);
    width: 12px;
    height: 12px;
  }
  
  .date-separator {
    font-size: 11px;
    margin: 0 4px;
  }
  
  .date-clear-btn {
    width: 18px;
    height: 18px;
    font-size: 10px;
    margin-left: 4px;
  }
  
  .filter-actions {
    justify-content: space-between;
    width: 100%;
  }
  
  .order-details-grid { grid-template-columns: 1fr; }
  .order-info-section { grid-template-columns: 1fr; }
  
  .modal-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .print-receipt-btn {
    width: 100%;
    justify-content: center;
  }
  
  .table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
    border-radius: 8px;
    box-shadow: inset 0 0 0 1px #e5e7eb;
    margin-bottom: 20px;
  }
  
  .orders-table {
    min-width: 900px; /* Ensure table is wide enough to show all data */
    font-size: 14px; /* Slightly smaller font on mobile */
    margin-bottom: 0; /* Remove margin since container handles spacing */
  }
  
  .orders-table th,
  .orders-table td {
    padding: 8px 6px; /* Reduce padding for mobile */
    font-size: 12px; /* Smaller font size */
  }
  
  .order-id {
    min-width: 80px;
  }
  
  .location-cell {
    max-width: 150px;
  }
  
  .location-cell span {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 4px;
    min-width: 70px;
  }
  
  .action-btn {
    font-size: 11px;
    padding: 3px 6px;
  }
  
  .status-badge {
    font-size: 10px;
    padding: 2px 6px;
  }
  
  .unit-quantity {
    min-width: 80px;
  }
  
  .pagination {
    flex-direction: column;
    gap: 10px;
  }
  
  .pagination button {
    width: 100%;
  }
}

/* Slightly larger top padding for very small screens */
@media (max-width: 576px) {
  .main-content {
    /* Account for taller header on very small devices and safe area inset */
    padding-top: calc(70px + env(safe-area-inset-top));
  }
  .summary-cards {
    grid-template-columns: repeat(2, 1fr); /* keep 2 columns on very small screens */
    gap: 10px;
  }
}
</style>