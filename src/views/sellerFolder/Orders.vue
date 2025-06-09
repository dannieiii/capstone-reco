<template>
  <div class="dashboard-container">
    <Sidebar initialActiveItem="Orders" />
    
    <div class="main-content">
      <header class="header">
        <div class="page-title">
          <h1>Orders</h1>
          <p>Manage and track your customer orders</p>
        </div>
        <button class="theme-toggle" @click="toggleDarkMode">
          <i :class="isDarkMode ? 'i-lucide-sun' : 'i-lucide-moon'"></i>
        </button>
      </header>

      <!-- Order Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-icon pending-icon">
            <i class="i-lucide-clock"></i>
          </div>
          <div class="card-content">
            <h3>Pending</h3>
            <p class="card-value">{{ pendingOrdersCount }}</p>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="card-icon processing-icon">
            <i class="i-lucide-package"></i>
          </div>
          <div class="card-content">
            <h3>Processing</h3>
            <p class="card-value">{{ processingOrdersCount }}</p>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="card-icon shipped-icon">
            <i class="i-lucide-truck"></i>
          </div>
          <div class="card-content">
            <h3>Shipped</h3>
            <p class="card-value">{{ shippedOrdersCount }}</p>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="card-icon delivered-icon">
            <i class="i-lucide-check-circle"></i>
          </div>
          <div class="card-content">
            <h3>Delivered</h3>
            <p class="card-value">{{ deliveredOrdersCount }}</p>
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
                  v-model="selectedDate" 
                  @change="filterByDate"
                  class="minimal-date-input"
                />
                <input 
                  type="time" 
                  v-model="selectedTime" 
                  @change="filterByDate" 
                  v-if="selectedDate"
                  class="minimal-time-input"
                />
                <button 
                  v-if="selectedDate || selectedTime" 
                  @click="resetDateFilter" 
                  class="minimal-reset-btn"
                >
                  <i class="i-lucide-x"></i>
                </button>
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

        <table class="orders-table">
          <thead>
            <tr>
              <th>Order Code</th>
              <th>Customer</th>
              <th>Product</th>
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
                  <span v-if="!editingStatus[index]" :class="['status-badge', order.status.toLowerCase()]">
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
            <div class="order-info-section">
              <div class="info-group">
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> {{ selectedOrder.username }}</p>
                <p><strong>User ID:</strong> {{ selectedOrder.userId }}</p>
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
                  <span :class="['status-badge', selectedOrder.status.toLowerCase()]">
                    {{ selectedOrder.status }}
                  </span>
                </p>
                <p><strong>Payment Method:</strong> {{ selectedOrder.paymentMethod || 'Cash on Delivery' }}</p>
                <p v-if="selectedOrder.gcashNumber"><strong>GCash Number:</strong> {{ selectedOrder.gcashNumber }}</p>
                <p><strong>Payment Status:</strong> {{ selectedOrder.payStatus || 'Unpaid' }}</p>
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
                    <td>{{ selectedOrder.quantity }}</td>
                    <td>₱{{ selectedOrder.unitPrice ? selectedOrder.unitPrice.toFixed(2) : '0.00' }}</td>
                    <td>₱{{ selectedOrder.itemPrice ? selectedOrder.itemPrice.toFixed(2) : (selectedOrder.unitPrice * selectedOrder.quantity).toFixed(2) }}</td>
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
              @statusUpdated="handleStatusUpdated"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Sidebar from '@/components/Sidebar.vue';
import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import OrderStatusUpdate from '@/components/OrderStatusUpdate.vue';

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
const selectedDate = ref('');
const selectedTime = ref('');
const currentSellerId = ref('');
const showExportMenu = ref(false);

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

const initializeOrders = async () => {
  try {
    const auth = getAuth();
    currentSellerId.value = auth.currentUser?.uid;
    
    if (!currentSellerId.value) {
      console.error('No seller ID found');
      return;
    }

    const querySnapshot = await getDocs(collection(db, 'orders'));
    orders.value = querySnapshot.docs.map(doc => {
      const data = doc.data();
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
      
      return {
        id: doc.id,
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
  } catch (error) {
    console.error('Error fetching orders:', error);
  }
};

onMounted(() => {
  initializeOrders();
  document.addEventListener('click', closeExportMenu);
});

onUnmounted(() => {
  document.removeEventListener('click', closeExportMenu);
});

// Toggle dark mode
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  document.body.classList.toggle('dark', isDarkMode.value);
};

const filterOptions = ['All Orders', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const statusOptions = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

// Order summary stats
const pendingOrdersCount = computed(() => orders.value.filter(order => order.status === 'Pending').length);
const processingOrdersCount = computed(() => orders.value.filter(order => order.status === 'Processing').length);
const shippedOrdersCount = computed(() => orders.value.filter(order => order.status === 'Shipped').length);
const deliveredOrdersCount = computed(() => orders.value.filter(order => order.status === 'Delivered').length);

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
      
      const matchesDate = filterByDateCondition(order.timestamp);
      
      return matchesSearch && matchesFilter && matchesDate;
    })
    .sort((a, b) => {
      // Sort by timestamp descending (newest first)
      return b.timestamp - a.timestamp;
    });
});

// Date filtering logic
const filterByDateCondition = (orderDate) => {
  if (!selectedDate.value) return true;
  
  const orderDateObj = new Date(orderDate);
  const selectedDateObj = new Date(selectedDate.value);
  
  // Compare dates (ignoring time)
  if (!isSameDate(orderDateObj, selectedDateObj)) {
    return false;
  }
  
  // If time is selected, compare hours and minutes
  if (selectedTime.value) {
    const [hours, minutes] = selectedTime.value.split(':').map(Number);
    selectedDateObj.setHours(hours, minutes, 0, 0);
    
    // Compare hours and minutes
    return (
      orderDateObj.getHours() === hours &&
      orderDateObj.getMinutes() === minutes
    );
  }
  
  return true;
};

const isSameDate = (date1, date2) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const filterByDate = () => {
  currentPage.value = 1;
};

const resetDateFilter = () => {
  selectedDate.value = '';
  selectedTime.value = '';
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

const editOrder = (order) => {
  alert(`Edit order ${order.orderCode ? `#${order.orderCode}` : ''}`);
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
  
  // Show a success message
  alert(`Order status updated to ${updateData.status}`);
};

// Print receipt function
const printReceipt = () => {
  const order = selectedOrder.value;
  const receiptWindow = window.open('', '_blank');
  
  if (!receiptWindow) {
    alert('Please allow pop-ups to print receipts');
    return;
  }
  
  // Format the date for the receipt
  const orderDate = formatDateTime(order.timestamp || order.createdAt);
  
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
              <td>${order.quantity || 0}</td>
              <td>₱${order.unitPrice ? order.unitPrice.toFixed(2) : '0.00'}</td>
              <td>₱${order.itemPrice ? order.itemPrice.toFixed(2) : (order.unitPrice * order.quantity).toFixed(2)}</td>
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
  const headers = ['Order Code', 'Customer', 'Product', 'Unit', 'Quantity', 'Unit Price', 'Location', 'Date', 'Total', 'Status'];
  
  const csvContent = [
    headers.join(','),
    ...filteredOrders.value.map(order => [
      order.orderCode ? `#${order.orderCode}` : 'N/A',
      order.username || 'Unknown',
      order.productName || 'N/A',
      getUnitDisplay(order.unit),
      order.quantity || 0,
      order.unitPrice ? `₱${order.unitPrice.toFixed(2)}` : '₱0.00',
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
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
    alert('Please allow pop-ups to export as PDF');
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

.dashboard-container {
  display: flex;
  min-height: 100vh;
  background-color: #f9fafb;
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  margin-left: 230px; /* Match the sidebar width */
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

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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

/* Date Filter Styles */
.date-filter-container {
  display: flex;
  align-items: center;
}

.date-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 0 12px;
  border: 1px solid #e0e0e0;
  height: 40px;
}

.date-filter i {
  color: #888;
  font-size: 16px;
}

.minimal-date-input,
.minimal-time-input {
  border: none;
  background: transparent;
  padding: 8px 0;
  font-size: 14px;
  color: #333;
  outline: none;
  width: 120px;
  appearance: none;
  -webkit-appearance: none;
}

.minimal-time-input {
  width: 80px;
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

.orders-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.orders-table th,
.orders-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
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

.status-badge.cancelled {
  background-color: #fee2e2;
  color: #dc2626;
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

/* Modal Styles */
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

/* Dark mode styles */
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

:global(.dark) .summary-card {
  background-color: #1f2937;
}

:global(.dark) .card-value {
  color: #f9fafb;
}

:global(.dark) .search-box,
:global(.dark) .filter-btn,
:global(.dark) .date-filter {
  background-color: #374151;
  border-color: #4b5563;
  color: #e5e7eb;
}

:global(.dark) .search-box input,
:global(.dark) .minimal-date-input,
:global(.dark) .minimal-time-input {
  color: #e5e7eb;
}

:global(.dark) .filter-options {
  background-color: #1f2937;
  border-color: #4b5563;
}

:global(.dark) .filter-options button {
  color: #e5e7eb;
}

:global(.dark) .filter-options button:hover {
  background-color: #374151;
}

:global(.dark) .export-btn {
  background-color: #3b7a3f;
  color: white;
}

:global(.dark) .export-btn:hover {
  background-color: #2e5c31;
}

:global(.dark) .export-menu {
  background-color: #1f2937;
  border: 1px solid #4b5563;
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
  color: #e5e7eb;
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
  color: #e5e7eb;
}

:global(.dark) .modal-content {
  background-color: #1f2937;
}

:global(.dark) .modal-header {
  border-bottom-color: #4b5563;
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

/* Responsive styles */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding: 15px;
  }
  
  .summary-cards {
    grid-template-columns: 1fr;
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
    justify-content: space-between;
  }
  
  .minimal-date-input,
  .minimal-time-input {
    width: 100%;
  }
  
  .filter-actions {
    justify-content: space-between;
    width: 100%;
  }
  
  .order-info-section {
    grid-template-columns: 1fr;
  }
  
  .modal-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .print-receipt-btn {
    width: 100%;
    justify-content: center;
  }
  
  .orders-table {
    font-size: 0.8rem;
  }
  
  .orders-table th,
  .orders-table td {
    padding: 8px 4px;
  }
}
</style>