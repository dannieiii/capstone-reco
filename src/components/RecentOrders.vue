<template>
<div class="orders-container">
  <div class="orders-header">
    <h3>Recent Orders</h3>
    <div class="status-filter">
      <span>Status:</span>
      <button class="status-btn" @click="toggleStatusDropdown">
        {{ selectedStatus }}
        <ChevronDown size="16" />
      </button>
      <div v-if="showStatusDropdown" class="status-dropdown">
        <button 
          v-for="status in statusOptions" 
          :key="status" 
          @click="filterByStatus(status)"
          :class="{ active: selectedStatus === status }"
        >
          {{ status }}
        </button>
      </div>
    </div>
  </div>
  
  <table class="orders-table">
    <thead>
      <tr>
        <th>Order Date</th>
        <th>Product</th>
        <th>Invoice</th>
        <th>Price</th>
        <th>Quantity</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(order, index) in filteredOrders" :key="index">
        <td>
          <div class="order-date">
            <div>{{ order.date }}</div>
            <div class="order-time">{{ order.time }}</div>
          </div>
        </td>
        <td>
          <div class="product-cell">
            <div class="product-icon" :class="getCategoryClass(order.category)">
              <img :src="getProductIcon(order.category)" alt="Product icon" />
            </div>
            <div class="product-info">
              <div>{{ order.productName }}</div>
              <div class="product-category">{{ order.category }}</div>
            </div>
          </div>
        </td>
        <td>{{ order.invoice || `INV-${index + 1000}` }}</td>
        <td>{{ order.price }}</td>
        <td>{{ order.quantity || 1 }}</td>
        <td>
          <div class="status-badge" :class="getStatusClass(order.status)">
            <span :class="['status-dot', getStatusDotClass(order.status)]"></span>
            {{ order.status }}
          </div>
        </td>
        <td>
          <div class="action-buttons">
            <button class="action-btn view-btn" @click="viewOrderDetails(order)">
              <Eye size="14" />
            </button>
            <button class="action-btn edit-btn" @click="editOrder(order)">
              <Edit size="14" />
            </button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
  
  <div class="pagination">
    <div class="pagination-info">{{ paginationInfo }}</div>
    <div class="pagination-controls">
      <button 
        v-for="page in visiblePages" 
        :key="page" 
        class="page-btn" 
        :class="{ active: currentPage === page }"
        @click="setPage(page)">
        {{ page }}
      </button>
      <span v-if="showEllipsis" class="ellipsis">...</span>
      <button 
        v-for="page in lastPages" 
        :key="`last-${page}`" 
        class="page-btn"
        :class="{ active: currentPage === page }"
        @click="setPage(page)">
        {{ page }}
      </button>
      <button class="next-btn" @click="nextPage" :disabled="currentPage === totalPages">
        <ChevronRight size="16" />
      </button>
    </div>
  </div>
  
  <!-- Order Details Modal -->
  <div v-if="showOrderModal" class="order-modal-overlay" @click="closeModal">
    <div class="order-modal" @click.stop>
      <div class="modal-header">
        <h3>Order Details</h3>
        <button class="close-btn" @click="closeModal">×</button>
      </div>
      <div class="modal-content">
        <div class="order-details">
          <div class="detail-group">
            <h4>Order Information</h4>
            <div class="detail-row">
              <span>Invoice:</span>
              <span>{{ selectedOrder.invoice || 'N/A' }}</span>
            </div>
            <div class="detail-row">
              <span>Date:</span>
              <span>{{ selectedOrder.date }} at {{ selectedOrder.time }}</span>
            </div>
            <div class="detail-row">
              <span>Status:</span>
              <span :class="['status-badge', getStatusClass(selectedOrder.status)]">
                {{ selectedOrder.status }}
              </span>
            </div>
          </div>
          
          <div class="detail-group">
            <h4>Product Information</h4>
            <div class="detail-row">
              <span>Product:</span>
              <span>{{ selectedOrder.productName }}</span>
            </div>
            <div class="detail-row">
              <span>Category:</span>
              <span>{{ selectedOrder.category }}</span>
            </div>
            <div class="detail-row">
              <span>Price:</span>
              <span>{{ selectedOrder.price }}</span>
            </div>
            <div class="detail-row">
              <span>Quantity:</span>
              <span>{{ selectedOrder.quantity || 1 }}</span>
            </div>
          </div>
          
          <div class="detail-group">
            <h4>Customer Information</h4>
            <div class="detail-row">
              <span>Customer:</span>
              <span>{{ selectedOrder.customer }}</span>
            </div>
            <div class="detail-row">
              <span>Location:</span>
              <span>{{ selectedOrder.location }}</span>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="action-btn secondary" @click="closeModal">Close</button>
          <button class="action-btn primary" @click="editOrder(selectedOrder)">Edit Order</button>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { ChevronDown, ChevronRight, Eye, Edit } from 'lucide-vue-next';
import { useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps({
  orders: {
    type: Array,
    default: () => []
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: '$'
  }
});

// Pagination state
const currentPage = ref(1);
const itemsPerPage = 3;

// Status filter state
const showStatusDropdown = ref(false);
const selectedStatus = ref('All Status');
const statusOptions = ['All Status', 'New Order', 'Processing', 'On Deliver', 'Delivered', 'Cancelled'];

// Modal state
const showOrderModal = ref(false);
const selectedOrder = ref({});

// Filter orders by status
const filteredOrders = computed(() => {
  if (selectedStatus.value === 'All Status') {
    return props.orders;
  }
  return props.orders.filter(order => order.status === selectedStatus.value);
});

// Calculate total pages for pagination
const totalPages = computed(() => {
  return Math.max(1, Math.ceil(props.totalOrders / itemsPerPage));
});

// Determine which page numbers to show
const visiblePages = computed(() => {
  if (totalPages.value <= 3) return Array.from({ length: totalPages.value }, (_, i) => i + 1);
  return [1, 2, 3];
});

const lastPages = computed(() => {
  if (totalPages.value <= 3) return [];
  return [totalPages.value - 1, totalPages.value].filter(page => page > 3);
});

const showEllipsis = computed(() => {
  return totalPages.value > 3;
});

// Format pagination info text
const paginationInfo = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage + 1;
  const end = Math.min(start + itemsPerPage - 1, props.totalOrders);
  return `${start} - ${end} of ${props.totalOrders}`;
});

// Set current page
const setPage = (page) => {
  currentPage.value = page;
};

// Go to next page
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

// Toggle status dropdown
const toggleStatusDropdown = () => {
  showStatusDropdown.value = !showStatusDropdown.value;
};

// Filter by status
const filterByStatus = (status) => {
  selectedStatus.value = status;
  showStatusDropdown.value = false;
};

// Get product icon based on category
const getProductIcon = (category) => {
  const categoryLower = (category || '').toLowerCase();
  const icons = {
    'vegetables': 'https://cdn-icons-png.flaticon.com/512/2153/2153786.png',
    'fruits': 'https://cdn-icons-png.flaticon.com/512/3194/3194766.png',
    'grains': 'https://cdn-icons-png.flaticon.com/512/3082/3082051.png',
    'dairy': 'https://cdn-icons-png.flaticon.com/512/3050/3050158.png',
    'meat': 'https://cdn-icons-png.flaticon.com/512/776/776458.png',
    'shoes': 'https://cdn-icons-png.flaticon.com/512/2589/2589903.png',
    't-shirt': 'https://cdn-icons-png.flaticon.com/512/2503/2503380.png'
  };

  return icons[categoryLower] || 'https://cdn-icons-png.flaticon.com/512/1250/1250680.png';
};

// Get CSS class for category
const getCategoryClass = (category) => {
  return (category || '').toLowerCase().replace(/\s+/g, '-');
};

// Get CSS class for status
const getStatusClass = (status) => {
  return (status || '').toLowerCase().replace(/\s+/g, '-');
};

// Get CSS class for status dot
const getStatusDotClass = (status) => {
  const statusLower = (status || '').toLowerCase();
  if (statusLower.includes('new')) return 'new';
  if (statusLower.includes('cancel')) return 'cancelled';
  if (statusLower.includes('deliver')) return 'on-deliver';
  if (statusLower.includes('process')) return 'processing';
  if (statusLower.includes('complete') || statusLower.includes('delivered')) return 'delivered';
  return 'default';
};

// View order details
const viewOrderDetails = (order) => {
  selectedOrder.value = { ...order };
  showOrderModal.value = true;
  document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
};

// Close modal
const closeModal = () => {
  showOrderModal.value = false;
  document.body.style.overflow = ''; // Restore scrolling
};

// Edit order
const editOrder = (order) => {
  // In a real app, you would navigate to an edit page
  router.push(`/seller/edit-order/${order.id}`);
  closeModal();
};

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  if (showStatusDropdown.value) {
    showStatusDropdown.value = false;
  }
};

// Handle escape key press to close modal
const handleKeyDown = (e) => {
  if (e.key === 'Escape') {
    if (showOrderModal.value) {
      closeModal();
    }
    if (showStatusDropdown.value) {
      showStatusDropdown.value = false;
    }
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.orders-container {
  background-color: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.orders-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.orders-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.status-filter {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}

.status-filter span {
  font-size: 0.9rem;
  color: #6b7280;
}

.status-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #111827;
  cursor: pointer;
}

.status-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
  min-width: 150px;
  margin-top: 5px;
}

.status-dropdown button {
  display: block;
  width: 100%;
  padding: 8px 16px;
  text-align: left;
  background: none;
  border: none;
  font-size: 0.85rem;
  color: #111827;
  cursor: pointer;
}

.status-dropdown button:hover {
  background-color: #f3f4f6;
}

.status-dropdown button.active {
  background-color: #f3f4f6;
  color: #2e5c31;
  font-weight: 500;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
}

.orders-table th {
  text-align: left;
  padding: 12px 16px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #4b5563;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.orders-table tr:hover td {
  background-color: #f3f4f6;
}

.orders-table td {
  padding: 16px;
  font-size: 0.9rem;
  color: #111827;
  border-bottom: 1px solid #e5e7eb;
}

.order-date {
  font-weight: 500;
}

.order-time {
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 4px;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
}

.product-icon img {
  width: 24px;
  height: 24px;
}

.product-icon.vegetables {
  background-color: #e6f4e8;
}

.product-icon.fruits {
  background-color: #fef3c7;
}

.product-icon.grains {
  background-color: #f3e8d6;
}

.product-icon.dairy {
  background-color: #e0f2fe;
}

.product-icon.meat {
  background-color: #fee2e2;
}

.product-icon.shoes {
  background-color: #e6f4e8;
}

.product-icon.t-shirt {
  background-color: #d1e7d3;
}

.product-info {
  font-weight: 500;
}

.product-category {
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 4px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.new-order {
  background-color: #e6f4e8;
  color: #2e5c31;
}

.status-badge.cancelled {
  background-color: #fef2f2;
  color: #dc2626;
}

.status-badge.on-deliver {
  background-color: #fff7ed;
  color: #ea580c;
}

.status-badge.processing {
  background-color: #e0f2fe;
  color: #0284c7;
}

.status-badge.delivered {
  background-color: #d1fae5;
  color: #059669;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

.status-dot.new {
  background-color: #2e5c31;
}

.status-dot.cancelled {
  background-color: #dc2626;
}

.status-dot.on-deliver {
  background-color: #ea580c;
}

.status-dot.processing {
  background-color: #0284c7;
}

.status-dot.delivered {
  background-color: #059669;
}

.status-dot.default {
  background-color: #6b7280;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.view-btn {
  background-color: #e6f4e8;
  color: #2e5c31;
}

.view-btn:hover {
  background-color: #d1e7d3;
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
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

.pagination-info {
  font-size: 0.85rem;
  color: #6b7280;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 5px;
}

.page-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background-color: #fff;
  font-size: 0.85rem;
  color: #6b7280;
  cursor: pointer;
}

.page-btn.active {
  background-color: #2e5c31;
  color: #fff;
  border-color: #2e5c31;
}

.ellipsis {
  padding: 0 5px;
  color: #6b7280;
}

.next-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background-color: #fff;
  color: #6b7280;
  cursor: pointer;
}

.next-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Order Modal Styles */
.order-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.order-modal {
  background-color: #fff;
  border-radius: 10px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 1.2rem;
  margin: 0;
  color: #111827;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
}

.modal-content {
  padding: 20px;
}

.order-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.detail-group {
  margin-bottom: 20px;
}

.detail-group h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 10px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.detail-row span:first-child {
  font-weight: 500;
  color: #6b7280;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.modal-actions .action-btn {
  width: auto;
  height: auto;
  padding: 8px 16px;
  font-size: 0.9rem;
}

.modal-actions .secondary {
  background-color: #f3f4f6;
  color: #4b5563;
}

.modal-actions .primary {
  background-color: #2e5c31;
  color: #fff;
}

/* Dark mode styles */
:global(.dark) .orders-container {
  background-color: #1f2937;
  border-color: #374151;
}

:global(.dark) .orders-header h3 {
  color: #f9fafb;
}

:global(.dark) .status-filter span,
:global(.dark) .pagination-info {
  color: #9ca3af;
}

:global(.dark) .status-btn,
:global(.dark) .page-btn,
:global(.dark) .next-btn {
  background-color: #1f2937;
  border-color: #374151;
  color: #f9fafb;
}

:global(.dark) .status-dropdown {
  background-color: #1f2937;
  border-color: #374151;
}

:global(.dark) .status-dropdown button {
  color: #f9fafb;
}

:global(.dark) .status-dropdown button:hover {
  background-color: #374151;
}

:global(.dark) .status-dropdown button.active {
  background-color: #374151;
  color: #4a8f4d;
}

:global(.dark) .orders-table th,
:global(.dark) .orders-table td {
  border-color: #374151;
}

:global(.dark) .orders-table th {
  background-color: #111827;
  color: #9ca3af;
}

:global(.dark) .orders-table td {
  color: #f9fafb;
}

:global(.dark) .order-time,
:global(.dark) .product-category {
  color: #9ca3af;
}

:global(.dark) .product-icon {
  background-color: #374151;
}

:global(.dark) .product-icon.vegetables,
:global(.dark) .product-icon.fruits,
:global(.dark) .product-icon.grains,
:global(.dark) .product-icon.dairy,
:global(.dark) .product-icon.meat,
:global(.dark) .product-icon.shoes,
:global(.dark) .product-icon.t-shirt {
  background-color: #374151;
}

:global(.dark) .view-btn {
  background-color: rgba(46, 92, 49, 0.2);
}

:global(.dark) .view-btn:hover {
  background-color: rgba(46, 92, 49, 0.3);
}

:global(.dark) .edit-btn {
  background-color: #374151;
}

:global(.dark) .edit-btn:hover {
  background-color: #4b5563;
}

:global(.dark) .order-modal {
  background-color: #1f2937;
}

:global(.dark) .modal-header {
  border-bottom-color: #374151;
}

:global(.dark) .modal-header h3,
:global(.dark) .detail-group h4 {
  color: #f9fafb;
}

:global(.dark) .close-btn {
  color: #9ca3af;
}

:global(.dark) .detail-row span:first-child {
  color: #9ca3af;
}

:global(.dark) .detail-row span:last-child {
  color: #f9fafb;
}

:global(.dark) .detail-group h4 {
  border-bottom-color: #374151;
}

:global(.dark) .modal-actions {
  border-top-color: #374151;
}

:global(.dark) .modal-actions .secondary {
  background-color: #374151;
  color: #f9fafb;
}

:global(.dark) .modal-actions .primary {
  background-color: #4a8f4d;
  color: #f9fafb;
}

/* Responsive styles */
@media (max-width: 768px) {
  .orders-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .status-filter {
    width: 100%;
  }

  .status-btn {
    width: 100%;
    justify-content: space-between;
  }

  .status-dropdown {
    width: 100%;
  }

  .orders-table {
    display: block;
    overflow-x: auto;
  }

  .pagination {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .pagination-controls {
    width: 100%;
    justify-content: center;
  }

  .order-details {
    grid-template-columns: 1fr;
  }
}
</style>