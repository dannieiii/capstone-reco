<template>
  <div class="dashboard-container">
    <AdminSidebar />
    
    <div class="main-content">
      <header class="header">
        <div class="page-title">
          <h1>Customer Management</h1>
          <p>Manage your customer information</p>
        </div>
        <button class="theme-toggle">
          <i class="i-lucide-moon"></i>
        </button>
      </header>

      <div class="content-wrapper">
        <!-- Stats Section -->
        <div class="customers-stats">
          <div class="stat-card">
            <h3>Total Customers</h3>
            <p class="stat-value">{{ allCustomers.length }}</p>
          </div>
          <div class="stat-card">
            <h3>Verified Customers</h3>
            <p class="stat-value">{{ verifiedCustomers }}</p>
          </div>
          <div class="stat-card">
            <h3>New Customers (This Month)</h3>
            <p class="stat-value">{{ newCustomers }}</p>
          </div>
        </div>

        <div class="actions-bar">
          <div class="search-and-filter">
            <div class="search-box">
              <i class="i-lucide-search search-icon"></i>
              <input type="text" placeholder="Search customers..." v-model="searchQuery" @input="handleSearch" />
            </div>
          </div>
          <div class="filter-actions">
            <div class="export-dropdown">
              <button class="export-btn">
                <i class="fas fa-download"></i>
                Export
                <i class="fas fa-chevron-down ml-1"></i>
              </button>
              <div class="export-menu">
                <button class="export-option" @click="exportData('csv')">
                  <i class="fas fa-file-csv"></i>
                  Export as CSV
                </button>
                <button class="export-option" @click="exportData('pdf')">
                  <i class="fas fa-file-pdf"></i>
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
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="customer in paginatedCustomers" :key="customer.userId">
              <td>
                <div class="customer-cell">
                  <div class="customer-avatar" :style="{ backgroundColor: getAvatarColor(customer.username) }">
                    {{ getInitials(customer.firstName, customer.lastName) }}
                  </div>
                  <div class="customer-info">
                    <div class="customer-name">{{ customer.firstName }} {{ customer.lastName }}</div>
                    <div class="customer-email">{{ customer.username }}</div>
                  </div>
                </div>
              </td>
              <td>
                <div class="contact-cell">
                  <div class="email-address">
                    <i class="i-lucide-mail contact-icon"></i>
                    {{ customer.email }}
                  </div>
                  <div class="phone-number">
                    <i class="i-lucide-phone contact-icon"></i>
                    {{ customer.contactNumber || 'N/A' }}
                  </div>
                </div>
              </td>
              <td>
                <div class="location-cell">
                  <i class="i-lucide-map-pin location-icon"></i>
                  <span>{{ customer.address || 'N/A' }}</span>
                </div>
              </td>
              <td>
                <div class="status-container">
                  <span :class="['status-badge', customer.isVerified ? 'verified' : 'pending']">
                    {{ customer.isVerified ? 'Verified' : 'Not Verified' }}
                  </span>
                </div>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="action-btn view-btn" @click="viewMoreInfo(customer)" title="View Details">
                    <Eye :size="16" />
                  </button>
                  <button class="action-btn delete-btn" @click="deleteCustomer(customer)" title="Delete Customer">
                    <Trash2 :size="16" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="paginatedCustomers.length === 0">
              <td colspan="5" class="empty-state">
                <div class="empty-message">
                  <i class="i-lucide-search-x empty-icon"></i>
                  <p>No customers found</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="pagination-container" v-if="totalPages > 1">
          <div class="pagination-info">
            Showing {{ startIndex + 1 }} to {{ Math.min(endIndex, filteredCustomers.length) }} of {{ filteredCustomers.length }} customers
          </div>
          <div class="pagination-controls">
            <button 
              class="pagination-btn" 
              @click="goToPage(currentPage - 1)" 
              :disabled="currentPage === 1"
              title="Previous Page"
            >
              <i class="i-lucide-chevron-left"></i>
            </button>
            
            <button 
              v-for="page in visiblePages" 
              :key="page"
              class="pagination-btn page-number"
              :class="{ active: page === currentPage }"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
            
            <button 
              class="pagination-btn" 
              @click="goToPage(currentPage + 1)" 
              :disabled="currentPage === totalPages"
              title="Next Page"
            >
              <i class="i-lucide-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Customer Details Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Customer Details</h3>
          <button class="modal-close" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body" v-if="selectedCustomer">
          <!-- Customer Profile Header -->
          <div class="customer-profile-header">
            <div class="profile-avatar-large" :style="{ backgroundColor: getAvatarColor(selectedCustomer.username) }">
              {{ getInitials(selectedCustomer.firstName, selectedCustomer.lastName) }}
            </div>
            <div class="profile-main-info">
              <h2>{{ selectedCustomer.firstName }} {{ selectedCustomer.lastName }}</h2>
              <p class="username-display">@{{ selectedCustomer.username }}</p>
              <div class="verification-status">
                <span :class="['status-badge-large', selectedCustomer.isVerified ? 'verified' : 'pending']">
                  <i :class="selectedCustomer.isVerified ? 'fas fa-check-circle' : 'fas fa-clock'"></i>
                  {{ selectedCustomer.isVerified ? 'Verified Customer' : 'Pending Verification' }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Contact Information Section -->
          <div class="info-section">
            <div class="section-header">
              <i class="fas fa-address-book"></i>
              <h4>Contact Information</h4>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-icon">
                  <i class="fas fa-envelope"></i>
                </div>
                <div class="info-content">
                  <label>Email Address</label>
                  <span>{{ selectedCustomer.email || 'Not provided' }}</span>
                </div>
              </div>
              <div class="info-item">
                <div class="info-icon">
                  <i class="fas fa-phone"></i>
                </div>
                <div class="info-content">
                  <label>Phone Number</label>
                  <span>{{ selectedCustomer.contactNumber || 'Not provided' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Location Information Section -->
          <div class="info-section">
            <div class="section-header">
              <i class="fas fa-map-marker-alt"></i>
              <h4>Primary Address</h4>
            </div>
            <div class="address-display">
              <div class="address-main">
                <i class="fas fa-home"></i>
                <span>{{ selectedCustomer.address || 'No address provided' }}</span>
              </div>
              <div class="address-details" v-if="selectedCustomer.barangay || selectedCustomer.municipality || selectedCustomer.province">
                <div class="address-part" v-if="selectedCustomer.barangay">
                  <small>Barangay:</small>
                  <span>{{ selectedCustomer.barangay }}</span>
                </div>
                <div class="address-part" v-if="selectedCustomer.municipality">
                  <small>Municipality:</small>
                  <span>{{ selectedCustomer.municipality }}</span>
                </div>
                <div class="address-part" v-if="selectedCustomer.province">
                  <small>Province:</small>
                  <span>{{ selectedCustomer.province }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Delivery Addresses Section -->
          <div v-if="selectedCustomer.addresses && selectedCustomer.addresses.length > 0" class="info-section">
            <div class="section-header">
              <i class="fas fa-shipping-fast"></i>
              <h4>Delivery Addresses</h4>
              <span class="address-count">{{ selectedCustomer.addresses.length }} saved</span>
            </div>
            <div class="delivery-addresses">
              <div v-for="(address, index) in selectedCustomer.addresses" :key="index" class="delivery-address-card">
                <div class="address-card-header">
                  <div class="address-name">
                    <i class="fas fa-map-pin"></i>
                    <strong>{{ address.name || `Address ${index + 1}` }}</strong>
                  </div>
                </div>
                <div class="address-card-body">
                  <div class="address-line">
                    <i class="fas fa-location-arrow"></i>
                    <span>{{ address.address }}</span>
                  </div>
                  <div class="address-location">
                    <i class="fas fa-building"></i>
                    <span>{{ address.barangay }}, {{ address.municipality }}, {{ address.province }}</span>
                  </div>
                  <div v-if="address.locationNotes" class="address-notes">
                    <i class="fas fa-sticky-note"></i>
                    <span>{{ address.locationNotes }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- No Delivery Addresses Message -->
          <div v-else class="info-section">
            <div class="section-header">
              <i class="fas fa-shipping-fast"></i>
              <h4>Delivery Addresses</h4>
            </div>
            <div class="no-addresses">
              <i class="fas fa-map-marked-alt"></i>
              <p>No delivery addresses saved</p>
              <small>Customer hasn't added any delivery addresses yet</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import AdminSidebar from '@/components/AdminSidebar.vue';
import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs, doc, deleteDoc, query, where } from "firebase/firestore";
import { Eye, Trash2 } from 'lucide-vue-next';

const allCustomers = ref([]);
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;
const showModal = ref(false);
const selectedCustomer = ref(null);

// Computed properties
const filteredCustomers = computed(() => {
  if (!searchQuery.value) {
    return allCustomers.value;
  }
  
  const query = searchQuery.value.toLowerCase();
  return allCustomers.value.filter(customer => {
    const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.toLowerCase();
    const email = (customer.email || '').toLowerCase();
    const username = (customer.username || '').toLowerCase();
    const address = (customer.address || '').toLowerCase();
    
    return fullName.includes(query) || 
           email.includes(query) || 
           username.includes(query) || 
           address.includes(query);
  });
});

const totalPages = computed(() => Math.ceil(filteredCustomers.value.length / itemsPerPage));

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage);
const endIndex = computed(() => startIndex.value + itemsPerPage);

const paginatedCustomers = computed(() => {
  return filteredCustomers.value.slice(startIndex.value, endIndex.value);
});

const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages.value, start + maxVisible - 1);
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  return pages;
});

const verifiedCustomers = computed(() => allCustomers.value.filter(c => c.isVerified).length);

const newCustomers = computed(() => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  return allCustomers.value.filter(c => new Date(c.lastUpdated || c.createdAt) > oneMonthAgo).length;
});

// Methods
const fetchCustomers = async () => {
  try {
    const usersQuery = query(
      collection(db, "users"),
      where("role", "==", "customer")
    );
    const querySnapshot = await getDocs(usersQuery);
    allCustomers.value = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
  } catch (error) {
    console.error("Error fetching customers:", error);
  }
};

const handleSearch = () => {
  currentPage.value = 1; // Reset to first page when searching
};

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const viewMoreInfo = (customer) => {
  selectedCustomer.value = customer;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  selectedCustomer.value = null;
};

const deleteCustomer = async (customer) => {
  if (confirm(`Are you sure you want to delete ${customer.firstName} ${customer.lastName}?`)) {
    try {
      await deleteDoc(doc(db, "users", customer.id));
      await fetchCustomers(); // Refresh the list
      
      // Adjust current page if necessary
      if (paginatedCustomers.value.length === 0 && currentPage.value > 1) {
        currentPage.value = currentPage.value - 1;
      }
      
      console.log("Customer deleted successfully");
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("Failed to delete customer. Please try again.");
    }
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'Not available';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

const exportData = (format) => {
  try {
    const dataToExport = filteredCustomers.value; // Export filtered data
    
    if (format === 'csv') {
      const headers = ['Name', 'Username', 'Email', 'Contact Number', 'Address', 'Verified'];
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(customer => [
          `${customer.firstName} ${customer.lastName}`,
          customer.username,
          customer.email,
          customer.contactNumber || 'N/A',
          customer.address || 'N/A',
          customer.isVerified ? 'Verified' : 'Not Verified'
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `customers_data_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'pdf') {
      const printWindow = window.open('', '_blank');
      
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
      pdfContent += '<th>Name</th>';
      pdfContent += '<th>Username</th>';
      pdfContent += '<th>Email</th>';
      pdfContent += '<th>Contact Number</th>';
      pdfContent += '<th>Address</th>';
      pdfContent += '<th>Verified</th>';
      pdfContent += '</tr>';
      pdfContent += '</thead>';
      pdfContent += '<tbody>';
      
      dataToExport.forEach(customer => {
        const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'N/A';
        const statusClass = customer.isVerified ? 'status-verified' : 'status-pending';
        const statusText = customer.isVerified ? 'Verified' : 'Not Verified';
        
        pdfContent += '<tr>';
        pdfContent += `<td>${escapeHtml(fullName)}</td>`;
        pdfContent += `<td>${escapeHtml(customer.username || 'N/A')}</td>`;
        pdfContent += `<td>${escapeHtml(customer.email || 'N/A')}</td>`;
        pdfContent += `<td>${escapeHtml(customer.contactNumber || 'N/A')}</td>`;
        pdfContent += `<td>${escapeHtml(customer.address || 'N/A')}</td>`;
        pdfContent += `<td><span class="status-badge ${statusClass}">${statusText}</span></td>`;
        pdfContent += '</tr>';
      });
      
      pdfContent += '</tbody>';
      pdfContent += '</table>';
      pdfContent += '<div class="export-info">';
      pdfContent += `<p>Generated on: ${new Date().toLocaleString()}</p>`;
      pdfContent += `<p>Total Customers: ${dataToExport.length}</p>`;
      pdfContent += '</div>';
      pdfContent += '<script>';
      pdfContent += 'window.onload = function() { window.print(); }';
      pdfContent += '<\/script>';
      pdfContent += '</body>';
      pdfContent += '</html>';
      
      printWindow.document.open();
      printWindow.document.write(pdfContent);
      printWindow.document.close();
    }
  } catch (error) {
    console.error(`Error exporting ${format}:`, error);
    alert(`Failed to export as ${format.toUpperCase()}`);
  }
};

const escapeHtml = (text) => {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// Helper functions for styling
const getInitials = (firstName, lastName) => {
  const first = firstName ? firstName.charAt(0) : '';
  const last = lastName ? lastName.charAt(0) : '';
  return (first + last).toUpperCase() || 'NA';
};

const getAvatarColor = (username) => {
  if (!username) return '#2e5c31';
  
  const colors = [
    '#2e5c31', '#1e40af', '#9d174d', '#b45309', '#4c1d95',
    '#064e3b', '#7f1d1d', '#1e3a8a', '#3f6212', '#831843'
  ];
  
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = ((hash << 5) - hash) + username.charCodeAt(i);
    hash = hash & hash;
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

onMounted(fetchCustomers);
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css');

.dashboard-container {
  display: flex;
  min-height: 100vh;
  background-color: #f9fafb;
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  margin-left: 260px;
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

.customers-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background-color: #ffffff;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;
  border: 1px solid #e5e7eb;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card h3 {
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #2e5c31;
  margin: 0;
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

.filter-actions {
  display: flex;
  align-items: center;
  gap: 10px;
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
  background-color: #1f4e23;
  color: white;
  transition: all 0.2s;
}

.export-btn:hover {
  background-color: #0f2419;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(31, 78, 35, 0.3);
}

.export-dropdown {
  position: relative;
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
  display: none;
}

.export-dropdown:hover .export-menu {
  display: block;
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

.contact-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.9rem;
}

.email-address, .phone-number {
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

.status-container {
  display: flex;
  align-items: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
  width: 120px;
  height: 36px;
  line-height: 1.2;
  box-sizing: border-box;
}

.status-badge.verified {
  background-color: #d1fae5;
  color: #059669;
}

.status-badge.pending {
  background-color: #fef3c7;
  color: #d97706;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.view-btn {
  background-color: #e0f2fe;
  color: #0284c7;
}

.view-btn:hover {
  background-color: #bae6fd;
  transform: scale(1.05);
}

.delete-btn {
  background-color: #fee2e2;
  color: #dc2626;
}

.delete-btn:hover {
  background-color: #fecaca;
  transform: scale(1.05);
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

/* Enhanced Modal Styles */
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
  animation: fadeIn 0.3s ease-out;
  backdrop-filter: blur(4px);
}

.modal-content {
  background-color: white;
  border-radius: 16px;
  max-width: 700px;
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: scaleIn 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px 16px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  padding: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: #6b7280;
  transition: all 0.2s;
}

.modal-close:hover {
  background-color: #f3f4f6;
  color: #374151;
  transform: scale(1.1);
}

.modal-body {
  padding: 32px;
}

/* Customer Profile Header */
.customer-profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
  padding: 24px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 12px;
  border: 1px solid #bae6fd;
}

.profile-avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #2e5c31;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.profile-main-info h2 {
  margin: 0 0 8px 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
}

.username-display {
  margin: 0 0 16px 0;
  color: #6b7280;
  font-size: 1rem;
  font-weight: 500;
}

.verification-status {
  display: flex;
  align-items: center;
}

.status-badge-large {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge-large.verified {
  background-color: #d1fae5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.status-badge-large.pending {
  background-color: #fef3c7;
  color: #d97706;
  border: 1px solid #fde68a;
}

/* Information Sections */
.info-section {
  margin-bottom: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background-color: #fafafa;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  background-color: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.section-header i {
  color: #2e5c31;
  font-size: 1.125rem;
}

.section-header h4 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  flex-grow: 1;
}

.address-count {
  background-color: #2e5c31;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  padding: 24px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.info-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: #f0f9ff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-icon i {
  color: #2e5c31;
  font-size: 1rem;
}

.info-content {
  flex-grow: 1;
}

.info-content label {
  display: block;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-content span {
  color: #1f2937;
  font-size: 1rem;
  line-height: 1.5;
}

/* Address Display */
.address-display {
  padding: 24px;
}

.address-main {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 16px;
}

.address-main i {
  color: #2e5c31;
  font-size: 1.125rem;
}

.address-main span {
  font-size: 1rem;
  color: #1f2937;
  font-weight: 500;
}

.address-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.address-part {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background-color: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.address-part small {
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.address-part span {
  color: #1f2937;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Delivery Addresses */
.delivery-addresses {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.delivery-address-card {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s;
}

.delivery-address-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.address-card-header {
  padding: 16px 20px;
  background-color: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.address-name {
  display: flex;
  align-items: center;
  gap: 10px;
}

.address-name i {
  color: #2e5c31;
  font-size: 1rem;
}

.address-name strong {
  color: #1f2937;
  font-size: 1rem;
}

.address-card-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.address-line,
.address-location,
.address-notes {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 0.875rem;
}

.address-line i,
.address-location i,
.address-notes i {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 2px;
  flex-shrink: 0;
}

.address-line span {
  color: #1f2937;
  font-weight: 500;
}

.address-location span,
.address-notes span {
  color: #6b7280;
}

/* No Addresses Message */
.no-addresses {
  padding: 40px 24px;
  text-align: center;
  color: #6b7280;
}

.no-addresses i {
  font-size: 3rem;
  color: #d1d5db;
  margin-bottom: 16px;
}

.no-addresses p {
  margin: 0 0 8px 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
}

.no-addresses small {
  font-size: 0.875rem;
  color: #9ca3af;
}

/* Pagination Styles */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.pagination-info {
  font-size: 0.875rem;
  color: #6b7280;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #e5e7eb;
  background-color: white;
  color: #6b7280;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #f9fafb;
  border-color: #2e5c31;
  color: #2e5c31;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-btn.active {
  background-color: #2e5c31;
  border-color: #2e5c31;
  color: white;
}

.pagination-btn.page-number {
  font-weight: 500;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
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
  
  .customers-stats {
    grid-template-columns: 1fr;
  }
  
  .customers-table {
    display: block;
    overflow-x: auto;
  }
  
  .pagination-container {
    flex-direction: column;
    gap: 16px;
    align-items: center;
  }
  
  .pagination-controls {
    flex-wrap: wrap;
    justify-content: center;
  }

  .modal-content {
    width: 95%;
    margin: 10px;
    max-height: 95vh;
  }

  .modal-header {
    padding: 20px 24px;
  }

  .modal-body {
    padding: 24px 20px;
  }

  .customer-profile-header {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }

  .profile-avatar-large {
    width: 70px;
    height: 70px;
    font-size: 1.5rem;
  }

  .profile-main-info h2 {
    font-size: 1.5rem;
  }

  .address-details {
    grid-template-columns: 1fr;
  }

  .info-grid {
    padding: 20px;
  }

  .delivery-addresses {
    padding: 20px;
  }
}

/* Remove the Account Information section CSS */
</style>