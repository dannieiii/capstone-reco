<template>
  <div class="dashboard-container">
    <AdminSidebar />
    
    <div class="main-content">
      <header class="header">
        <div class="page-title">
          <h1>Seller Management</h1>
          <p>Manage your seller information and track their performance</p>
        </div>
        <button class="theme-toggle">
          <i class="i-lucide-moon"></i>
        </button>
      </header>

      <div class="content-wrapper">
        <!-- Stats Section -->
        <div class="sellers-stats">
          <div class="stat-card">
            <h3>Total Sellers</h3>
            <p class="stat-value">{{ allSellers.length }}</p>
          </div>
          <div class="stat-card">
            <h3>Active Sellers</h3>
            <p class="stat-value">{{ activeSellers }}</p>
          </div>
          <div class="stat-card">
            <h3>Pending Sellers</h3>
            <p class="stat-value">{{ pendingSellers }}</p>
          </div>
        </div>

        <!-- Test Email Button (for debugging) -->
        

        <div class="actions-bar">
          <div class="search-and-filter">
            <div class="search-box">
              <i class="i-lucide-search search-icon"></i>
              <input type="text" placeholder="Search sellers..." v-model="searchQuery" @input="handleSearch" />
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

        <table class="sellers-table">
          <thead>
            <tr>
              <th>Seller</th>
              <th>Contact</th>
              <th>Farm Details</th>
              <th>Total Sales</th>
              <th>Registration Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="seller in paginatedSellers" :key="seller.id">
              <td>
                <div class="seller-cell">
                  <div class="seller-avatar" :style="{ backgroundColor: getAvatarColor(seller.personalInfo?.email) }">
                    {{ getInitials(seller.personalInfo?.firstName, seller.personalInfo?.lastName) }}
                  </div>
                  <div class="seller-info">
                    <div class="seller-name">{{ seller.personalInfo?.firstName || 'N/A' }} {{ seller.personalInfo?.lastName || 'N/A' }}</div>
                    <div class="seller-email">{{ seller.personalInfo?.email || 'N/A' }}</div>
                  </div>
                </div>
              </td>
              <td>
                <div class="contact-cell">
                  <div class="phone-number">
                    <i class="i-lucide-phone contact-icon"></i>
                    {{ seller.personalInfo?.contact || 'N/A' }}
                  </div>
                  <div class="address">
                    <i class="i-lucide-map-pin contact-icon"></i>
                    {{ seller.personalInfo?.address || 'N/A' }}
                  </div>
                </div>
              </td>
              <td>
                <div class="farm-cell">
                  <div class="farm-name">
                    <i class="i-lucide-home contact-icon"></i>
                    {{ seller.farmDetails?.farmName || 'N/A' }}
                  </div>
                  <div class="farm-type">
                    <i class="i-lucide-leaf contact-icon"></i>
                    {{ seller.farmDetails?.farmType || 'N/A' }}
                  </div>
                </div>
              </td>
              <td>
                <div class="sales-cell">
                  <div class="sales-amount">₱{{ formatNumber(seller.totalSales || 0) }}</div>
                  <div class="sales-orders">{{ seller.totalOrders || 0 }} orders</div>
                </div>
              </td>
              <td>
                <div class="status-container">
                  <!-- Show dropdown only if not verified -->
                  <div v-if="!seller.isVerified" class="custom-dropdown">
                    <select 
                      v-model="seller.registrationStatus" 
                      @change="updateRegistrationStatus(seller)"
                      class="status-dropdown"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Accept">Accept</option>
                      <option value="Decline">Decline</option>
                    </select>
                    <i class="fas fa-chevron-down dropdown-icon"></i>
                  </div>
                  <!-- Show verified badge if already verified -->
                  <span v-else :class="['status-badge', 'verified']">
                    Verified
                  </span>
                </div>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="action-btn view-btn" @click="viewSellerDetails(seller)" title="View Details">
                    <Eye :size="16" />
                  </button>
                  <button class="action-btn delete-btn" @click="deleteSeller(seller)" title="Delete Seller">
                    <Trash2 :size="16" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="paginatedSellers.length === 0">
              <td colspan="6" class="empty-state">
                <div class="empty-message">
                  <i class="i-lucide-search-x empty-icon"></i>
                  <p>No sellers found</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="pagination-container" v-if="totalPages > 1">
          <div class="pagination-info">
            Showing {{ startIndex + 1 }} to {{ Math.min(endIndex, filteredSellers.length) }} of {{ filteredSellers.length }} sellers
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
    
    <!-- Custom Notification -->
    <div v-if="notification.show" class="custom-notification" :class="notification.type">
      <div class="notification-content">
        <div class="notification-header">
          <h4 class="notification-title">{{ notification.title }}</h4>
          <button class="notification-close" @click="closeNotification">&times;</button>
        </div>
        <div class="notification-body">
          <p v-html="notification.message"></p>
        </div>
      </div>
    </div>
    
    <!-- Custom Confirm Dialog -->
    <div v-if="confirmDialog.show" class="custom-confirmation-overlay">
      <div class="custom-confirmation-dialog">
        <div class="confirmation-header">
          <h4>{{ confirmDialog.title }}</h4>
        </div>
        <div class="confirmation-body">
          <p>{{ confirmDialog.message }}</p>
        </div>
        <div class="confirmation-actions">
          <button class="confirm-cancel-btn" @click="cancelConfirmDialog">Cancel</button>
          <button class="confirm-ok-btn" @click="proceedConfirmDialog">{{ confirmDialog.confirmText || 'Confirm' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AdminSidebar from '@/components/AdminSidebar.vue';
import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs, doc, deleteDoc, updateDoc, query, where } from "firebase/firestore";
import { Eye, Trash2 } from 'lucide-vue-next';
import emailService from '@/services/emailService';

const router = useRouter();
const allSellers = ref([]);
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;

// Notification system
const notification = ref({
  show: false,
  type: 'success', // 'success', 'error', 'warning', 'info'
  title: '',
  message: '',
  duration: 5000
});

// Confirmation dialog system
const confirmDialog = ref({
  show: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  onConfirm: null
});

// Notification methods
const showNotification = (title, message, type = 'success', duration = 5000) => {
  notification.value = {
    show: true,
    type,
    title,
    message,
    duration
  };
  
  // Auto-hide notification after duration
  setTimeout(() => {
    closeNotification();
  }, duration);
};

const closeNotification = () => {
  notification.value.show = false;
};

// Confirmation dialog methods
const showConfirmDialog = (title, message, onConfirm, confirmText = 'Confirm') => {
  return new Promise((resolve) => {
    confirmDialog.value = {
      show: true,
      title,
      message,
      confirmText,
      onConfirm: () => {
        resolve(true);
        confirmDialog.value.show = false;
      }
    };
  });
};

const cancelConfirmDialog = () => {
  confirmDialog.value.show = false;
};

const proceedConfirmDialog = () => {
  if (confirmDialog.value.onConfirm) {
    confirmDialog.value.onConfirm();
  }
};

// Computed properties
const filteredSellers = computed(() => {
  if (!searchQuery.value) {
    return allSellers.value;
  }
  
  const query = searchQuery.value.toLowerCase();
  return allSellers.value.filter(seller => {
    const fullName = `${seller.personalInfo?.firstName || ''} ${seller.personalInfo?.lastName || ''}`.toLowerCase();
    const email = (seller.personalInfo?.email || '').toLowerCase();
    const contact = (seller.personalInfo?.contact || '').toLowerCase();
    const farmName = (seller.farmDetails?.farmName || '').toLowerCase();
    const farmType = (seller.farmDetails?.farmType || '').toLowerCase();
    
    return fullName.includes(query) || 
           email.includes(query) || 
           contact.includes(query) ||
           farmName.includes(query) || 
           farmType.includes(query);
  });
});

const totalPages = computed(() => Math.ceil(filteredSellers.value.length / itemsPerPage));

const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage);
const endIndex = computed(() => startIndex.value + itemsPerPage);

const paginatedSellers = computed(() => {
  return filteredSellers.value.slice(startIndex.value, endIndex.value);
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

const activeSellers = computed(() => allSellers.value.filter(s => s.registrationStatus === 'Accept' || s.isVerified).length);
const pendingSellers = computed(() => allSellers.value.filter(s => s.registrationStatus === 'Pending' && !s.isVerified).length);

// Methods
const fetchSellers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "sellers"));
    const sellersList = [];
    
    for (const docSnapshot of querySnapshot.docs) {
      const sellerData = docSnapshot.data();
      const seller = { 
        id: docSnapshot.id, 
        registrationStatus: sellerData.registrationStatus || 'Pending',
        verificationStatus: sellerData.verificationStatus || (sellerData.isVerified ? 'Verified' : 'Pending'),
        isVerified: sellerData.isVerified || false,
        ...sellerData 
      };
      
      // Fetch sales data for this seller
      const salesData = await fetchSellerSalesData(seller.userId || docSnapshot.id);
      seller.totalSales = salesData.totalSales;
      seller.totalOrders = salesData.totalOrders;
      
      sellersList.push(seller);
    }
    
    allSellers.value = sellersList;
    
  } catch (error) {
    console.error("Error fetching sellers:", error);
  }
};

const fetchSellerSalesData = async (sellerId) => {
  try {
    const ordersQuery = query(
      collection(db, "orders"),
      where("sellerId", "==", sellerId)
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    let totalSales = 0;
    let totalOrders = 0;
    
    ordersSnapshot.forEach((doc) => {
      const orderData = doc.data();
      const itemPrice = orderData.itemPrice || (orderData.unitPrice * orderData.quantity) || orderData.totalPrice || 0;
      totalSales += itemPrice;
      totalOrders++;
    });
    
    return { totalSales, totalOrders };
  } catch (error) {
    console.error("Error fetching seller sales data:", error);
    return { totalSales: 0, totalOrders: 0 };
  }
};

const updateRegistrationStatus = async (seller) => {
  try {
    // Show processing notification
    showNotification(
      'Processing...',
      `Updating ${seller.personalInfo?.firstName || 'seller'}'s status...`,
      'info',
      3000
    );

    // Update the seller's status in the sellers collection
    const sellerRef = doc(db, "sellers", seller.id);
    const updateData = { 
      registrationStatus: seller.registrationStatus,
      status: seller.registrationStatus === 'Accept' ? 'Active' : seller.registrationStatus,
      updatedAt: new Date()
    };

    // If accepting the seller, also update verification status
    if (seller.registrationStatus === 'Accept') {
      updateData.isVerified = true;
      updateData.verificationStatus = 'Verified';
      seller.isVerified = true;
      seller.verificationStatus = 'Verified';
    }

    await updateDoc(sellerRef, updateData);

    // Update the user's role and isSeller status in the users collection if accepting
    if (seller.registrationStatus === 'Accept' && seller.userId) {
      const userRef = doc(db, "users", seller.userId);
      await updateDoc(userRef, { 
        role: "seller", 
        isSeller: true,
        isVerified: true
      });
    }

    // Update the local state to reflect the new status
    seller.status = seller.registrationStatus === 'Accept' ? 'Active' : seller.registrationStatus;

    // Send email notification based on status (following Checkout.vue pattern)
    try {
      console.log('🔍 Preparing to send seller email...');
      console.log('📧 EmailJS Service ID:', 'service_3q900le');
      console.log('📧 EmailJS Template ID:', 'template_lassd0o');
      
      const sellerData = {
        email: seller.personalInfo?.email || '',
        firstName: seller.personalInfo?.firstName || '',
        lastName: seller.personalInfo?.lastName || '',
        farmName: seller.farmDetails?.farmName || 'Your Farm'
      };
      
      console.log('📧 Seller data for email:', sellerData);
      console.log('🔍 Email validation:');
      console.log('  - Has email:', !!sellerData.email);
      console.log('  - Email value:', sellerData.email);
      console.log('  - Has firstName:', !!sellerData.firstName);
      console.log('  - Has lastName:', !!sellerData.lastName);
      console.log('  - Has farmName:', !!sellerData.farmName);
      console.log('🔍 Original seller object:', seller);
      
      // Validate email before sending
      if (!sellerData.email || sellerData.email === 'N/A') {
        console.warn('❌ No valid email address found for seller');
        showNotification(
          'Email Warning',
          'Seller status updated but no email sent - no valid email address found.',
          'warning',
          6000
        );
        return;
      }
      
      // Show sending notification (like Checkout.vue)
      showNotification(
        'Sending Email...',
        'Sending email notification to seller...',
        'info',
        3000
      );
      
      let emailResult;
      if (seller.registrationStatus === 'Accept') {
        emailResult = await emailService.sendSellerApprovalEmail(sellerData);
      } else if (seller.registrationStatus === 'Decline') {
        const rejectionReason = 'Application does not meet our current requirements. Please contact support for more details.';
        emailResult = await emailService.sendSellerRejectionEmail(sellerData, rejectionReason);
      }
      
      if (emailResult && emailResult.success) {
        console.log('✅ Email sent successfully:', emailResult);
        console.log('📬 Email delivery confirmed by EmailJS');
        console.log('🎯 Next steps: Check seller\'s email inbox (including spam folder)');
        showNotification(
          'Success!',
          `Seller ${seller.registrationStatus === 'Accept' ? 'approved' : 'updated'} and email sent successfully! The seller should receive an email notification.`,
          'success',
          8000
        );
      } else {
        console.error('❌ Email failed:', emailResult?.error);
        console.error('📧 Email failure details:', {
          error: emailResult?.error,
          sellerEmail: sellerData.email,
          timestamp: new Date().toISOString()
        });
        showNotification(
          'Partial Success',
          `Seller status updated but email failed to send. ${emailResult?.error?.message || 'Please check email configuration.'} Seller email: ${sellerData.email}`,
          'warning',
          10000
        );
      }
    } catch (emailError) {
      console.error("❌ Email service error:", emailError);
      showNotification(
        'Partial Success',
        `Seller status updated but email failed to send: ${emailError.message}`,
        'warning',
        8000
      );
    }

  } catch (error) {
    console.error("Error updating seller status:", error);
    showNotification(
      'Update Failed',
      'Failed to update seller status. Please try again.',
      'error',
      6000
    );
  }
};

// Test EmailJS configuration specifically (to debug 404 errors)
const testEmailJSConfig = async () => {
  showNotification('Testing EmailJS Configuration...', 'Checking service ID, template ID, and public key validity.', 'info', 3000);
  
  try {
    const result = await emailService.testEmailJSConfiguration();
    if (result.success) {
      showNotification(
        'EmailJS Configuration Valid!',
        'Service ID, Template ID, and Public Key are working correctly.',
        'success',
        8000
      );
    } else {
      if (result.error?.status === 404) {
        showNotification(
          'EmailJS Configuration Error (404)',
          'Service ID, Template ID, or Public Key is incorrect. Check console for detailed instructions.',
          'error',
          10000
        );
      } else {
        showNotification(
          'EmailJS Configuration Test Failed',
          `Configuration test failed: ${result.error?.message || 'Unknown error'}. Check console for details.`,
          'error',
          8000
        );
      }
    }
  } catch (error) {
    showNotification(
      'Configuration Test Error', 
      `Failed to test configuration: ${error.message}. Check console for details.`, 
      'error', 
      8000
    );
  }
};

// Test email functionality (like Checkout.vue and AdminSeller.vue)
const testSellerEmail = async () => {
  showNotification('Testing Email System...', 'Sending test seller approval email to verify EmailJS configuration.', 'info', 3000);
  
  try {
    const result = await emailService.testSellerApprovalEmail();
    if (result.success) {
      showNotification(
        'Email Test Successful!',
        'Test email sent successfully. Email system is working correctly.',
        'success',
        8000
      );
    } else {
      showNotification(
        'Email Test Failed',
        `Test email failed: ${result.error?.message || 'Unknown error'}`,
        'error',
        8000
      );
    }
  } catch (error) {
    showNotification(
      'Email Test Error', 
      `Failed to test email: ${error.message}`, 
      'error', 
      8000
    );
  }
};

// Debug email template functionality
const debugEmailTemplate = async () => {
  showNotification('Debug Email Test...', 'Sending comprehensive email template debug to test all variable combinations.', 'info', 3000);
  
  try {
    const result = await emailService.debugEmailTemplate();
    if (result.success) {
      showNotification(
        'Debug Email Sent!',
        `Debug email sent successfully with ${Object.keys(result.templateParams).length} template variables. Check your email inbox (including spam folder).`,
        'success',
        10000
      );
      console.log('🔬 Debug email results:', result);
    } else {
      showNotification(
        'Debug Email Failed',
        `Debug email failed: ${result.error?.message || 'Unknown error'}. Check console for details.`,
        'error',
        10000
      );
      console.error('🔬 Debug email failed:', result);
    }
  } catch (error) {
    showNotification(
      'Debug Email Error', 
      `Failed to send debug email: ${error.message}`, 
      'error', 
      10000
    );
    console.error('🔬 Debug email error:', error);
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

const viewSellerDetails = (seller) => {
  router.push(`/admin/sellers/${seller.id}`);
};

const deleteSeller = async (seller) => {
  const sellerName = `${seller.personalInfo?.firstName || ''} ${seller.personalInfo?.lastName || ''}`.trim() || 'this seller';
  
  // Use custom confirm dialog instead of browser confirm
  try {
    await showConfirmDialog(
      'Delete Seller',
      `Are you sure you want to delete ${sellerName}? This action cannot be undone.`,
      () => {}, // The actual deletion will happen after confirmation
      'Delete'
    );
    
    // If we reach here, user confirmed
    try {
      await deleteDoc(doc(db, "sellers", seller.id));
      await fetchSellers(); // Refresh the list
      
      // Adjust current page if necessary
      if (paginatedSellers.value.length === 0 && currentPage.value > 1) {
        currentPage.value = currentPage.value - 1;
      }
      
      console.log("Seller deleted successfully");
      showNotification(
        'Seller Deleted',
        `${sellerName} has been successfully deleted from the system.`,
        'success',
        5000
      );
    } catch (error) {
      console.error("Error deleting seller:", error);
      showNotification(
        'Delete Failed',
        'Failed to delete seller. Please try again.',
        'error',
        6000
      );
    }
  } catch (error) {
    // User cancelled or dialog error
    console.log("Delete operation cancelled");
  }
};

const exportData = (format) => {
  try {
    const dataToExport = filteredSellers.value; // Export filtered data
    
    if (format === 'csv') {
      const headers = ['Name', 'Email', 'Contact', 'Farm Name', 'Farm Type', 'Total Sales', 'Total Orders', 'Registration Status'];
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(seller => [
          `${seller.personalInfo?.firstName || ''} ${seller.personalInfo?.lastName || ''}`.trim() || 'N/A',
          seller.personalInfo?.email || 'N/A',
          seller.personalInfo?.contact || 'N/A',
          seller.farmDetails?.farmName || 'N/A',
          seller.farmDetails?.farmType || 'N/A',
          seller.totalSales || 0,
          seller.totalOrders || 0,
          seller.registrationStatus || 'N/A'
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `sellers_data_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'pdf') {
      const printWindow = window.open('', '_blank');
      
      let pdfContent = '<!DOCTYPE html>';
      pdfContent += '<html>';
      pdfContent += '<head>';
      pdfContent += '<title>Sellers Export</title>';
      pdfContent += '<style>';
      pdfContent += 'body { font-family: Arial, sans-serif; margin: 20px; }';
      pdfContent += 'h1 { color: #2e5c31; margin-bottom: 20px; }';
      pdfContent += 'table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }';
      pdfContent += 'th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }';
      pdfContent += 'th { background-color: #f2f2f2; font-weight: bold; }';
      pdfContent += 'tr:nth-child(even) { background-color: #f9f9f9; }';
      pdfContent += '.export-info { margin-top: 20px; font-size: 12px; color: #666; }';
      pdfContent += '.status-badge { display: inline-flex; align-items: center; justify-content: center; padding: 8px 12px; border-radius: 6px; font-size: 0.875rem; font-weight: 500; text-align: center; min-width: 100px; height: 36px; line-height: 1.2; }';
      pdfContent += '.status-verified { background-color: #d1fae5; color: #059669; }';
      pdfContent += '.status-pending { background-color: #fef3c7; color: #d97706; }';
      pdfContent += '</style>';
      pdfContent += '</head>';
      pdfContent += '<body>';
      pdfContent += '<h1>Sellers Export</h1>';
      pdfContent += '<table>';
      pdfContent += '<thead>';
      pdfContent += '<tr>';
      pdfContent += '<th>Name</th>';
      pdfContent += '<th>Email</th>';
      pdfContent += '<th>Contact</th>';
      pdfContent += '<th>Farm Name</th>';
      pdfContent += '<th>Farm Type</th>';
      pdfContent += '<th>Total Sales</th>';
      pdfContent += '<th>Total Orders</th>';
      pdfContent += '<th>Registration Status</th>';
      pdfContent += '</tr>';
      pdfContent += '</thead>';
      pdfContent += '<tbody>';
      
      dataToExport.forEach(seller => {
        const fullName = `${seller.personalInfo?.firstName || ''} ${seller.personalInfo?.lastName || ''}`.trim() || 'N/A';
        const statusClass = seller.isVerified ? 'status-verified' : 'status-pending';
        
        pdfContent += '<tr>';
        pdfContent += `<td>${escapeHtml(fullName)}</td>`;
        pdfContent += `<td>${escapeHtml(seller.personalInfo?.email || 'N/A')}</td>`;
        pdfContent += `<td>${escapeHtml(seller.personalInfo?.contact || 'N/A')}</td>`;
        pdfContent += `<td>${escapeHtml(seller.farmDetails?.farmName || 'N/A')}</td>`;
        pdfContent += `<td>${escapeHtml(seller.farmDetails?.farmType || 'N/A')}</td>`;
        pdfContent += `<td>₱${formatNumber(seller.totalSales || 0)}</td>`;
        pdfContent += `<td>${seller.totalOrders || 0}</td>`;
        pdfContent += `<td><span class="status-badge ${statusClass}">${escapeHtml(seller.registrationStatus || 'N/A')}</span></td>`;
        pdfContent += '</tr>';
      });
      
      pdfContent += '</tbody>';
      pdfContent += '</table>';
      pdfContent += '<div class="export-info">';
      pdfContent += `<p>Generated on: ${new Date().toLocaleString()}</p>`;
      pdfContent += `<p>Total Sellers: ${dataToExport.length}</p>`;
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
    showNotification(
      'Export Failed',
      `Failed to export sellers data as ${format.toUpperCase()}. Please try again.`,
      'error',
      6000
    );
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

const getAvatarColor = (email) => {
  if (!email) return '#2e5c31';
  
  const colors = [
    '#2e5c31', '#1e40af', '#9d174d', '#b45309', '#4c1d95',
    '#064e3b', '#7f1d1d', '#1e3a8a', '#3f6212', '#831843'
  ];
  
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash) + email.charCodeAt(i);
    hash = hash & hash;
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Format number with commas and two decimals for currency
const formatNumber = (num) => {
  return parseFloat(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

onMounted(() => {
  fetchSellers();
});
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

.sellers-stats {
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

.sellers-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.sellers-table th,
.sellers-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.sellers-table th {
  font-weight: 600;
  color: #4b5563;
  background-color: #f9fafb;
}

.sellers-table tbody tr:hover {
  background-color: #f9fafb;
}

.seller-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.seller-avatar {
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

.seller-name {
  font-weight: 500;
}

.seller-email {
  font-size: 0.75rem;
  color: #6b7280;
}

.contact-cell, .farm-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.9rem;
}

.phone-number, .address, .farm-name, .farm-type {
  display: flex;
  align-items: center;
  gap: 6px;
}

.contact-icon {
  color: #2e5c31;
  font-size: 0.9rem;
}

.sales-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sales-amount {
  font-weight: 600;
  color: #2e5c31;
  font-size: 0.95rem;
}

.sales-orders {
  font-size: 0.8rem;
  color: #6b7280;
}

.status-container {
  display: flex;
  align-items: center;
}

.custom-dropdown {
  position: relative;
  display: inline-block;
  width: 120px;
}

.status-dropdown {
  appearance: none;
  background-color: #f9fafb;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px 32px 8px 12px;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  width: 120px;
  height: 36px;
  line-height: 1.2;
}

.status-dropdown:focus {
  outline: none;
  border-color: #2e5c31;
  box-shadow: 0 0 0 2px rgba(46, 92, 49, 0.1);
}

.dropdown-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #6b7280;
  font-size: 0.75rem;
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

.status-badge.decline {
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

/* Configuration Test Button */
.config-test-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: #dc2626;
  color: white;
  margin-right: 8px;
}

.config-test-btn:hover {
  background-color: #b91c1c;
  transform: translateY(-1px);
}

/* Test Email Button */
.test-email-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: #3b82f6;
  color: white;
}

.test-email-btn:hover {
  background-color: #2563eb;
  transform: translateY(-1px);
}

.debug-section {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.debug-email-btn {
  background: linear-gradient(135deg, #9c27b0, #673ab7);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  margin-left: 10px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.debug-email-btn:hover {
  background: linear-gradient(135deg, #7b1fa2, #512da8);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(156, 39, 176, 0.3);
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
  
  .sellers-stats {
    grid-template-columns: 1fr;
  }
  
  .sellers-table {
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
}

/* Custom Notification Styles */
.custom-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 400px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: slideInRight 0.3s ease-out;
}

.custom-notification.success {
  background-color: #d1fae5;
  border-left: 4px solid #10b981;
}

.custom-notification.error {
  background-color: #fee2e2;
  border-left: 4px solid #ef4444;
}

.custom-notification.warning {
  background-color: #fef3c7;
  border-left: 4px solid #f59e0b;
}

.custom-notification.info {
  background-color: #dbeafe;
  border-left: 4px solid #3b82f6;
}

.notification-content {
  padding: 16px;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.notification-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.notification-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  opacity: 0.7;
}

.notification-close:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.1);
}

.notification-body p {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
}

.success .notification-title,
.success .notification-body {
  color: #065f46;
}

.error .notification-title,
.error .notification-body {
  color: #991b1b;
}

.warning .notification-title,
.warning .notification-body {
  color: #92400e;
}

.info .notification-title,
.info .notification-body {
  color: #1e40af;
}

/* Custom Confirmation Dialog Styles */
.custom-confirmation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  animation: fadeIn 0.3s ease-out;
}

.custom-confirmation-dialog {
  background-color: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  animation: scaleIn 0.3s ease-out;
}

.confirmation-header h4 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.confirmation-body p {
  margin: 0 0 24px 0;
  font-size: 14px;
  line-height: 1.5;
  color: #6b7280;
}

.confirmation-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.confirm-cancel-btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  background-color: white;
  color: #374151;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.confirm-cancel-btn:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.confirm-ok-btn {
  padding: 8px 16px;
  border: none;
  background-color: #dc2626;
  color: white;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.confirm-ok-btn:hover {
  background-color: #b91c1c;
}

/* Animations */
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

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
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>