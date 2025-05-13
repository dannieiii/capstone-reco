<template>
  <div class="dashboard-container">
    <Sidebar initialActiveItem="Customers" />
    
    <div class="main-content">
      <header class="header">
        <div class="page-title">
          <h1>Customers</h1>
          <p>Manage your customer information</p>
        </div>
        <button class="theme-toggle" @click="toggleDarkMode">
          <i :class="isDarkMode ? 'i-lucide-sun' : 'i-lucide-moon'"></i>
        </button>
      </header>

      <div class="content-wrapper">
        <div class="actions-bar">
          <div class="search-and-filter">
            <div class="search-box">
              <i class="i-lucide-search search-icon"></i>
              <input type="text" placeholder="Search customers..." v-model="searchQuery" />
              <button v-if="searchQuery" class="clear-search" @click="searchQuery = ''">
                <i class="i-lucide-x"></i>
              </button>
            </div>
          </div>
          <div class="filter-actions">
            <div class="export-dropdown">
              <button class="export-btn" @click="toggleExportMenu">
                <i class="i-lucide-download"></i>
                Export
                <i class="i-lucide-chevron-down ml-1"></i>
              </button>
              <div class="export-menu" v-if="showExportMenu">
                <button class="export-option" @click="exportCustomers('csv')">
                  <i class="i-lucide-file-text"></i>
                  Export as CSV
                </button>
                <button class="export-option" @click="exportCustomers('pdf')">
                  <i class="i-lucide-file"></i>
                  Export as PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        <table class="customers-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th>Location</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(customer, index) in paginatedCustomers" :key="index">
              <td>
                <div class="customer-cell">
                  <div class="customer-avatar" :style="{ backgroundColor: getAvatarColor(customer.username) }">
                    {{ getInitials(customer.username) }}
                  </div>
                  <div class="customer-info">
                    <div class="customer-name">{{ customer.username }}</div>
                    <div class="customer-email">{{ customer.email || 'No email' }}</div>
                  </div>
                </div>
              </td>
              <td>
                <div class="contact-cell">
                  <div class="phone-number">
                    <i class="i-lucide-phone contact-icon"></i>
                    {{ customer.contactNumber || 'N/A' }}
                  </div>
                </div>
              </td>
              <td>
                <div class="location-cell">
                  <i class="i-lucide-map-pin location-icon"></i>
                  <span>{{ formatLocation(customer.address) }}</span>
                </div>
              </td>
              <td>{{ customer.orderCount || 0 }}</td>
              <td>₱{{ customer.totalSpent ? customer.totalSpent.toFixed(2) : '0.00' }}</td>
              <td>
                <span :class="['status-badge', customer.isVerified ? 'verified' : 'pending']">
                  {{ customer.isVerified ? 'Verified' : 'Pending' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="action-btn view-btn" @click="viewCustomerDetails(customer)">
                    <i class="i-lucide-eye"></i>
                    View
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="paginatedCustomers.length === 0">
              <td colspan="7" class="empty-state">
                <div class="empty-message">
                  <i class="i-lucide-search-x empty-icon"></i>
                  <p>No customers found</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="pagination">
          <button :disabled="currentPage === 1" @click="currentPage--">
            <i class="i-lucide-chevron-left"></i>
            Previous
          </button>
          <span>Page {{ currentPage }} of {{ totalPages }}</span>
          <button :disabled="currentPage === totalPages" @click="currentPage++">
            Next
            <i class="i-lucide-chevron-right"></i>
          </button>
        </div>
      </div>

      <!-- Customer Details Modal -->
      <div v-if="showCustomerModal" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>Customer Details</h2>
            <button class="close-btn" @click="closeModal">
              <i class="i-lucide-x"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="customer-profile">
              <div class="profile-avatar" :style="{ backgroundColor: getAvatarColor(selectedCustomer.username) }">
                {{ getInitials(selectedCustomer.username) }}
              </div>
              <div class="profile-info">
                <h3>{{ selectedCustomer.firstName }} {{ selectedCustomer.lastName }}</h3>
                <p class="customer-username">@{{ selectedCustomer.username }}</p>
              </div>
              <div class="verification-badge" :class="{ verified: selectedCustomer.isVerified }">
                {{ selectedCustomer.isVerified ? 'Verified' : 'Pending Verification' }}
              </div>
            </div>
            
            <div class="customer-info-section">
              <div class="info-group">
                <h3>Contact Information</h3>
                <div class="info-item">
                  <i class="i-lucide-mail"></i>
                  <span>{{ selectedCustomer.email || 'No email' }}</span>
                </div>
                <div class="info-item">
                  <i class="i-lucide-phone"></i>
                  <span>{{ selectedCustomer.contactNumber || 'No phone number' }}</span>
                </div>
                <div class="info-item">
                  <i class="i-lucide-user"></i>
                  <span><strong>Role:</strong> {{ selectedCustomer.role || 'Customer' }}</span>
                </div>
                <div class="info-item">
                  <i class="i-lucide-clock"></i>
                  <span><strong>Last Login:</strong> {{ formatDate(selectedCustomer.lastLogin) }}</span>
                </div>
              </div>
              
              <div class="info-group">
                <h3>Address Information</h3>
                <div class="info-item">
                  <i class="i-lucide-home"></i>
                  <span>{{ selectedCustomer.address || 'N/A' }}</span>
                </div>
                <div v-if="selectedCustomer.addresses && selectedCustomer.addresses.length > 0">
                  <div class="saved-addresses">
                    <h4>Saved Addresses</h4>
                    <div v-for="(address, index) in selectedCustomer.addresses" :key="index" class="saved-address-item">
                      <div class="address-name">{{ address.name || 'Address ' + (index + 1) }}</div>
                      <div class="address-details">{{ address.address }}</div>
                      <div v-if="address.locationNotes" class="address-notes">
                        <i class="i-lucide-info"></i> {{ address.locationNotes }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="info-group">
                <h3>Order Statistics</h3>
                <div class="info-item">
                  <i class="i-lucide-shopping-bag"></i>
                  <span><strong>Total Orders:</strong> {{ selectedCustomer.orderCount || 0 }}</span>
                </div>
                <div class="info-item">
                  <i class="i-lucide-credit-card"></i>
                  <span><strong>Total Spent:</strong> ₱{{ selectedCustomer.totalSpent ? selectedCustomer.totalSpent.toFixed(2) : '0.00' }}</span>
                </div>
                <div class="info-item">
                  <i class="i-lucide-log-in"></i>
                  <span><strong>Login Count:</strong> {{ selectedCustomer.loginCount || 0 }}</span>
                </div>
              </div>
            </div>
            
            <div class="customer-orders-section">
              <h3>Recent Orders</h3>
              <table class="orders-table">
                <thead>
                  <tr>
                    <th>Order Code</th>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="order in selectedCustomerOrders" :key="order.orderCode">
                    <td>#{{ order.orderCode || 'N/A' }}</td>
                    <td>{{ formatDateTime(order.createdAt) }}</td>
                    <td>
                      <div class="product-cell">
                        <div class="product-image" v-if="order.productImage">
                          <img :src="order.productImage" alt="Product" />
                        </div>
                        <span>{{ order.productName }}</span>
                      </div>
                    </td>
                    <td>₱{{ order.totalPrice.toFixed(2) }}</td>
                    <td>
                      <span :class="['status-badge', order.status.toLowerCase()]">
                        {{ order.status }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="selectedCustomerOrders.length === 0">
                    <td colspan="5" class="text-center">No orders found</td>
                  </tr>
                </tbody>
              </table>
            </div>
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
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// UI State
const isDarkMode = ref(false);
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;
const showCustomerModal = ref(false);
const selectedCustomer = ref({});
const selectedCustomerOrders = ref([]);
const customers = ref([]);
const orders = ref([]);
const usersData = ref({});
const currentSellerId = ref('');

// Initialize with empty customers
const initializeData = async () => {
  try {
    const auth = getAuth();
    currentSellerId.value = auth.currentUser?.uid;
    
    if (!currentSellerId.value) {
      console.error('No seller ID found');
      return;
    }

    // Fetch orders first to calculate customer stats
    const ordersQuery = query(collection(db, 'orders'), where('sellerId', '==', currentSellerId.value));
    const ordersSnapshot = await getDocs(ordersQuery);
    orders.value = ordersSnapshot.docs.map(doc => {
      const data = doc.data();
      let timestamp = data.createdAt || data.timestamp;
      
      if (timestamp && typeof timestamp.toDate === 'function') {
        timestamp = timestamp.toDate();
      } else if (typeof timestamp === 'string') {
        timestamp = new Date(timestamp);
      } else if (!timestamp) {
        timestamp = new Date();
      }
      
      return {
        id: doc.id,
        ...data,
        username: data.username || '',
        status: data.status || 'Pending',
        totalPrice: data.totalPrice || 0,
        createdAt: timestamp,
        sellerId: data.sellerId || '',
        orderCode: data.orderCode || '',
        userId: data.userId || '',
        productName: data.productName || ''
      };
    });

    // Process orders to create customer data\
    const customerMap = new Map();
    const userIds = new Set();
    
    orders.value.forEach(order => {
      if (!customerMap.has(order.userId)) {
        customerMap.set(order.userId, {
          userId: order.userId,
          username: order.username,
          orderCount: 0,
          totalSpent: 0
        });
        userIds.add(order.userId);
      }
      
      const customer = customerMap.get(order.userId);
      customer.orderCount++;
      customer.totalSpent += order.totalPrice;
    });

    // Fetch user data for all customers
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const usersMap = {};
    
    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      if (userData.userId && userIds.has(userData.userId)) {
        usersMap[userData.userId] = userData;
      }
    });
    
    usersData.value = usersMap;

    // Combine order stats with user data
    customers.value = Array.from(customerMap.values()).map(customer => {
      const userData = usersMap[customer.userId] || {};
      return {
        ...customer,
        ...userData
      };
    });
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

onMounted(() => {
  initializeData();
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

// Filter customers based on search query
const filteredCustomers = computed(() => {
  const searchTerm = searchQuery.value.toLowerCase();
  return customers.value.filter(customer => {
    return (
      (customer.username && customer.username.toLowerCase().includes(searchTerm)) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm)) ||
      (customer.firstName && customer.firstName.toLowerCase().includes(searchTerm)) ||
      (customer.lastName && customer.lastName.toLowerCase().includes(searchTerm)) ||
      (customer.contactNumber && customer.contactNumber.includes(searchTerm)) ||
      (customer.address && customer.address.toLowerCase().includes(searchTerm))
    );
  });
});

// Calculate total pages for pagination
const totalPages = computed(() => Math.max(1, Math.ceil(filteredCustomers.value.length / itemsPerPage)));

// Get paginated customers for current page
const paginatedCustomers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredCustomers.value.slice(start, end);
});

// Format date and time for display
const formatDateTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  let dateObj;
  
  if (timestamp instanceof Date) {
    dateObj = timestamp;
  } else if (typeof timestamp.toDate === 'function') {
    dateObj = timestamp.toDate();
  } else if (typeof timestamp === 'string') {
    dateObj = new Date(timestamp);
    if (isNaN(dateObj.getTime())) return 'N/A';
  } else if (typeof timestamp === 'number') {
    dateObj = new Date(timestamp);
  } else {
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

// Format date only
const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  let dateObj;
  
  if (timestamp instanceof Date) {
    dateObj = timestamp;
  } else if (typeof timestamp.toDate === 'function') {
    dateObj = timestamp.toDate();
  } else if (typeof timestamp === 'string') {
    dateObj = new Date(timestamp);
    if (isNaN(dateObj.getTime())) return 'N/A';
  } else if (typeof timestamp === 'number') {
    dateObj = new Date(timestamp);
  } else {
    return 'N/A';
  }
  
  return dateObj.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });
};

// Format location for display
const formatLocation = (location) => {
  if (!location) return 'N/A';
  return location;
};

// Get initials from name
const getInitials = (name) => {
  if (!name) return 'NA';
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Generate a consistent color based on username
const getAvatarColor = (username) => {
  if (!username) return '#2e5c31';
  
  const colors = [
    '#2e5c31', // Green
    '#1e40af', // Blue
    '#9d174d', // Pink
    '#b45309', // Amber
    '#4c1d95', // Purple
    '#064e3b', // Emerald
    '#7f1d1d', // Red
    '#1e3a8a', // Indigo
    '#3f6212', // Lime
    '#831843'  // Fuchsia
  ];
  
  // Simple hash function to get a consistent index
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = ((hash << 5) - hash) + username.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Use absolute value and modulo to get an index in our colors array
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Customer detail modal functions
const viewCustomerDetails = (customer) => {
  selectedCustomer.value = { ...customer };
  selectedCustomerOrders.value = orders.value
    .filter(order => order.userId === customer.userId)
    .sort((a, b) => {
      // Sort by date descending (newest first)
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB - dateA;
    });
    
  showCustomerModal.value = true;
};

const closeModal = () => {
  showCustomerModal.value = false;
};

// Export menu state
const showExportMenu = ref(false);

// Toggle export menu
const toggleExportMenu = (event) => {
  event.stopPropagation();
  showExportMenu.value = !showExportMenu.value;
};

// Close export menu when clicking outside
const closeExportMenu = (event) => {
  if (showExportMenu.value && !event.target.closest('.export-dropdown')) {
    showExportMenu.value = false;
  }
};

// Export function
const exportCustomers = (format) => {
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
  const headers = ['Username', 'Name', 'Email', 'Phone', 'Location', 'Orders', 'Total Spent', 'Status'];
  
  const csvContent = [
    headers.join(','),
    ...filteredCustomers.value.map(customer => [
      customer.username || 'Unknown',
      `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'N/A',
      customer.email || 'N/A',
      customer.contactNumber || 'N/A',
      customer.address || 'N/A',
      customer.orderCount || 0,
      (customer.totalSpent || 0).toFixed(2),
      customer.isVerified ? 'Verified' : 'Pending'
    ].join(','))
  ].join('\n');
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `customers_export_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export as PDF
const exportAsPDF = () => {
  // Create a new window for PDF content
  const printWindow = window.open('', '_blank');
  
  // Create PDF content - properly escaped for JavaScript string
  let pdfContent = '<!DOCTYPE html>';
  pdfContent += '<html>';
  pdfContent += '<head>';
  pdfContent += '<title>Customers Export</title>';
  pdfContent += '<style>';
  pdfContent += 'body { font-family: Arial, sans-serif; margin: 20px; }';
  pdfContent += 'h1 { color: #2e5c31; margin-bottom: 20px; }';
  pdfContent += 'table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }';
  pdfContent += 'th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }';
  pdfContent += 'th { background-color: #f2f2f2; font-weight: bold; }';
  pdfContent += 'tr:nth-child(even) { background-color: #f9f9f9; }';
  pdfContent += '.export-info { margin-top: 20px; font-size: 12px; color: #666; }';
  pdfContent += '.status-badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 12px; }';
  pdfContent += '.status-verified { background-color: #d1fae5; color: #059669; }';
  pdfContent += '.status-pending { background-color: #fef3c7; color: #d97706; }';
  pdfContent += '</style>';
  pdfContent += '</head>';
  pdfContent += '<body>';
  pdfContent += '<h1>Customers Export</h1>';
  pdfContent += '<table>';
  pdfContent += '<thead>';
  pdfContent += '<tr>';
  pdfContent += '<th>Username</th>';
  pdfContent += '<th>Name</th>';
  pdfContent += '<th>Email</th>';
  pdfContent += '<th>Phone</th>';
  pdfContent += '<th>Location</th>';
  pdfContent += '<th>Orders</th>';
  pdfContent += '<th>Total Spent</th>';
  pdfContent += '<th>Status</th>';
  pdfContent += '</tr>';
  pdfContent += '</thead>';
  pdfContent += '<tbody>';
  
  // Add customer rows
  filteredCustomers.value.forEach(customer => {
    const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'N/A';
    const statusClass = customer.isVerified ? 'status-verified' : 'status-pending';
    const statusText = customer.isVerified ? 'Verified' : 'Pending';
    
    pdfContent += '<tr>';
    pdfContent += `<td>${escapeHtml(customer.username || 'Unknown')}</td>`;
    pdfContent += `<td>${escapeHtml(fullName)}</td>`;
    pdfContent += `<td>${escapeHtml(customer.email || 'N/A')}</td>`;
    pdfContent += `<td>${escapeHtml(customer.contactNumber || 'N/A')}</td>`;
    pdfContent += `<td>${escapeHtml(customer.address || 'N/A')}</td>`;
    pdfContent += `<td>${customer.orderCount || 0}</td>`;
    pdfContent += `<td>₱${(customer.totalSpent || 0).toFixed(2)}</td>`;
    pdfContent += `<td><span class="status-badge ${statusClass}">${statusText}</span></td>`;
    pdfContent += '</tr>';
  });
  
  pdfContent += '</tbody>';
  pdfContent += '</table>';
  pdfContent += '<div class="export-info">';
  pdfContent += `<p>Generated on: ${new Date().toLocaleString()}</p>`;
  pdfContent += `<p>Total Customers: ${filteredCustomers.value.length}</p>`;
  pdfContent += '</div>';
  pdfContent += '<script>';
  pdfContent += 'window.onload = function() { window.print(); }';
  pdfContent += '<\/script>';
  pdfContent += '</body>';
  pdfContent += '</html>';
  
  // Write content to the new window
  printWindow.document.open();
  printWindow.document.write(pdfContent);
  printWindow.document.close();
};

// Helper function to escape HTML
const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};
</script>

<style scoped>
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
  border-color: #2e5c31;
  background-color: white;
  box-shadow: 0 0 0 2px rgba(46, 92, 49, 0.1);
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

.filter-actions {
  display: flex;
  align-items: center;
  gap: 10px;
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
  background-color: #f3f4f6;
  color: #4b5563;
  transition: all 0.2s;
}

.export-btn:hover {
  background-color: #e5e7eb;
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

.customers-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.customers-table th,
.customers-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.customers-table th {
  font-weight: 600;
  color: #4b5563;
  background-color: #f9fafb;
}

.customers-table tbody tr:hover {
  background-color: #f9fafb;
}

.customer-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.customer-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #2e5c31;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.8rem;
}

.customer-name {
  font-weight: 500;
}

.customer-email {
  font-size: 0.75rem;
  color: #6b7280;
}

.customer-username {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0;
}

.contact-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.9rem;
}

.phone-number {
  display: flex;
  align-items: center;
  gap: 6px;
}

.contact-icon {
  color: #2e5c31;
  font-size: 0.9rem;
}

.location-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.location-icon {
  color: #2e5c31;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.verified {
  background-color: #d1fae5;
  color: #059669;
}

.status-badge.pending {
  background-color: #fef3c7;
  color: #d97706;
}

.status-badge.processing {
  background-color: #dbeafe;
  color: #3b82f6;
}

.status-badge.shipped {
  background-color: #e0f2fe;
  color: #0284c7;
}

.status-badge.delivered {
  background-color: #dcfce7;
  color: #16a34a;
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

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
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
  transition: all 0.2s;
}

.pagination button:hover:not(:disabled) {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-state {
  padding: 40px 0;
}

.empty-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 10px;
  color: #9ca3af;
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

.close-btn {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 1.25rem;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.customer-profile {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 20px;
}

.profile-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #2e5c31;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.2rem;
}

.profile-info {
  flex: 1;
}

.profile-info h3 {
  margin: 0 0 4px 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.verification-badge {
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 500;
  background-color: #fef3c7;
  color: #d97706;
}

.verification-badge.verified {
  background-color: #d1fae5;
  color: #059669;
}

.customer-info-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.info-group h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 15px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.info-group h4 {
  font-size: 0.9rem;
  font-weight: 600;
  color: #4b5563;
  margin: 15px 0 10px 0;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 0.9rem;
  color: #4b5563;
}

.info-item i {
  color: #2e5c31;
  font-size: 1rem;
}

.saved-addresses {
  margin-top: 15px;
}

.saved-address-item {
  background-color: #f9fafb;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 10px;
}

.address-name {
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 4px;
}

.address-details {
  font-size: 0.85rem;
  margin-bottom: 4px;
}

.address-notes {
  font-size: 0.8rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 5px;
}

.customer-orders-section {
  margin-bottom: 30px;
}

.customer-orders-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 15px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
}

.orders-table th,
.orders-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.orders-table th {
  font-weight: 600;
  color: #4b5563;
  background-color: #f9fafb;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.product-image {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.text-center {
  text-align: center;
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

:global(.dark) .search-box input {
  background-color: #374151;
  border-color: #4b5563;
  color: #e5e7eb;
}

:global(.dark) .search-box input:focus {
  border-color: #6abe6e;
  box-shadow: 0 0 0 2px rgba(106, 190, 110, 0.2);
}

:global(.dark) .export-btn {
  background-color: #374151;
  color: #e5e7eb;
}

:global(.dark) .export-btn:hover {
  background-color: #4b5563;
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

:global(.dark) .customers-table th {
  background-color: #374151;
  color: #e5e7eb;
}

:global(.dark) .customers-table td,
:global(.dark) .customers-table th {
  border-color: #4b5563;
  color: #e5e7eb;
}

:global(.dark) .customers-table tbody tr:hover {
  background-color: #2d3748;
}

:global(.dark) .customer-email,
:global(.dark) .customer-username {
  color: #9ca3af;
}

:global(.dark) .contact-icon,
:global(.dark) .location-icon {
  color: #6abe6e;
}

:global(.dark) .pagination button {
  background-color: #374151;
  border-color: #4b5563;
  color: #e5e7eb;
}

:global(.dark) .pagination button:hover:not(:disabled) {
  background-color: #4b5563;
  border-color: #6b7280;
}

:global(.dark) .empty-message {
  color: #9ca3af;
}

:global(.dark) .empty-icon {
  color: #6b7280;
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

:global(.dark) .customer-profile {
  border-bottom-color: #4b5563;
}

:global(.dark) .profile-info h3 {
  color: #f9fafb;
}

:global(.dark) .info-group h3 {
  color: #f9fafb;
  border-bottom-color: #4b5563;
}

:global(.dark) .info-group h4 {
  color: #d1d5db;
}

:global(.dark) .info-item {
  color: #9ca3af;
}

:global(.dark) .info-item i {
  color: #6abe6e;
}

:global(.dark) .saved-address-item {
  background-color: #2d3748;
}

:global(.dark) .address-notes {
  color: #9ca3af;
}

:global(.dark) .customer-orders-section h3 {
  color: #f9fafb;
  border-bottom-color: #4b5563;
}

:global(.dark) .orders-table th {
  background-color: #374151;
  color: #e5e7eb;
}

:global(.dark) .orders-table td,
:global(.dark) .orders-table th {
  border-color: #4b5563;
}

/* Responsive styles */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding: 15px;
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
  
  .customer-info-section {
    grid-template-columns: 1fr;
  }
  
  .customers-table {
    display: block;
    overflow-x: auto;
  }
}
</style>
