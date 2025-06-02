<template>
  <div class="dashboard-container">
    <AdminSidebar />
    <div class="main-content">
      <div class="header-section">
        <h1 class="page-title">Sellers Management</h1>
        <div class="action-buttons">
          <button class="secondary-btn">
            <i class="fas fa-filter"></i> Filter
          </button>
          <div class="export-dropdown">
            <button class="secondary-btn">
              <i class="fas fa-download"></i> Export
            </button>
            <div class="export-dropdown-content">
              <button @click="exportData('csv')" class="export-option">
                <i class="fas fa-file-csv"></i> Export as CSV
              </button>
              <button @click="exportData('pdf')" class="export-option">
                <i class="fas fa-file-pdf"></i> Export as PDF
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Stats cards -->
      <div class="sellers-stats">
        <div class="stat-card">
          <h3>Total Sellers</h3>
          <p class="stat-value">{{ sellers.length }}</p>
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
      
      <!-- Sellers table -->
      <div class="sellers-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Farm Name</th>
              <th>Farm Address</th>
              <th>Farm Type</th>
              <th>Registration Status</th>
              <th>Verification Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="seller in sellers" :key="seller.id">
              <td>
                <div class="seller-info">
                  <div class="seller-name">{{ seller.firstName }} {{ seller.lastName }}</div>
                  <div class="seller-location">{{ seller.address }}</div>
                </div>
              </td>
              <td>{{ seller.email }}</td>
              <td>{{ seller.farmName || 'N/A' }}</td>
              <td>{{ seller.farmAddress || 'N/A' }}</td>
              <td>{{ seller.farmType || 'N/A' }}</td>
              <td>
                <div class="custom-dropdown">
                  <select 
                    v-model="seller.registrationStatus" 
                    @change="updateRegistrationStatus(seller)"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Accept">Accept</option>
                    <option value="Decline">Decline</option>
                  </select>
                  <i class="fas fa-chevron-down dropdown-icon"></i>
                </div>
              </td>
              <td>
                <span :class="['status-badge', seller.verificationStatus?.toLowerCase() || 'unknown']">
                  {{ seller.verificationStatus || 'Unknown' }}
                </span>
              </td>
              <td class="actions-cell">
                <button class="action-btn view" @click="navigateToSellerDetails(seller.id)">
                  <i class="fas fa-eye"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AdminSidebar from '@/components/AdminSidebar.vue';
import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

const router = useRouter();
const sellers = ref([]);

const activeSellers = computed(() => sellers.value.filter(s => s.registrationStatus === 'Accept').length);
const pendingSellers = computed(() => sellers.value.filter(s => s.registrationStatus === 'Pending').length);

const fetchSellers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "sellers"));
    sellers.value = querySnapshot.docs.map(doc => {
      const sellerData = doc.data();
      return { 
        id: doc.id, 
        registrationStatus: sellerData.registrationStatus || 'Pending', // Default registration status
        verificationStatus: sellerData.isSeller ? 'Verified' : 'Pending', // Default verification status
        ...sellerData 
      };
    });
  } catch (error) {
    console.error("Error fetching sellers:", error);
  }
};

const navigateToSellerDetails = (sellerId) => {
  router.push(`/admin/sellers/${sellerId}`);
};

const updateRegistrationStatus = async (seller) => {
  try {
    // Update the user's role and isSeller status in the users collection
    const userRef = doc(db, "users", seller.userId);
    await updateDoc(userRef, { 
      role: "seller", 
      isSeller: true 
    });

    // Update the seller's status, isVerified, and verificationStatus in the sellers collection
    const sellerRef = doc(db, "sellers", seller.id);
    await updateDoc(sellerRef, { 
      status: seller.registrationStatus,
      registrationStatus: seller.registrationStatus, // Update registration status
      isVerified: seller.registrationStatus === 'Accept', // Set isVerified to true if accepted
      verificationStatus: seller.registrationStatus === 'Accept' ? 'Verified' : 'Pending', // Set verificationStatus accordingly
    });

    // Update the local state to reflect the new status
    seller.status = seller.registrationStatus;
    seller.isVerified = seller.registrationStatus === 'Accept';

    alert("Seller status updated successfully!");
  } catch (error) {
    console.error("Error updating user role or seller status:", error);
    alert("Failed to update seller status. Please try again.");
  }
};

const exportData = (format) => {
  try {
    if (format === 'csv') {
      // CSV Export Logic
      const headers = ['Name', 'Email', 'Farm Name', 'Farm Address', 'Farm Type', 'Registration Status', 'Verification Status'];
      const csvContent = [
        headers.join(','),
        ...sellers.value.map(seller => [
          `${seller.firstName} ${seller.lastName}`,
          seller.email,
          seller.farmName || 'N/A',
          seller.farmAddress || 'N/A',
          seller.farmType || 'N/A',
          seller.registrationStatus || 'N/A',
          seller.verificationStatus || 'N/A'
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
      // Create a new window for PDF content
      const printWindow = window.open('', '_blank');
      
      // Create PDF content
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
      pdfContent += '.status-badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 12px; }';
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
      pdfContent += '<th>Farm Name</th>';
      pdfContent += '<th>Farm Address</th>';
      pdfContent += '<th>Farm Type</th>';
      pdfContent += '<th>Registration Status</th>';
      pdfContent += '<th>Verification Status</th>';
      pdfContent += '</tr>';
      pdfContent += '</thead>';
      pdfContent += '<tbody>';
      
      // Add seller rows
      sellers.value.forEach(seller => {
        const fullName = `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || 'N/A';
        const statusClass = seller.verificationStatus?.toLowerCase() === 'verified' ? 'status-verified' : 'status-pending';
        
        pdfContent += '<tr>';
        pdfContent += `<td>${escapeHtml(fullName)}</td>`;
        pdfContent += `<td>${escapeHtml(seller.email || 'N/A')}</td>`;
        pdfContent += `<td>${escapeHtml(seller.farmName || 'N/A')}</td>`;
        pdfContent += `<td>${escapeHtml(seller.farmAddress || 'N/A')}</td>`;
        pdfContent += `<td>${escapeHtml(seller.farmType || 'N/A')}</td>`;
        pdfContent += `<td>${escapeHtml(seller.registrationStatus || 'N/A')}</td>`;
        pdfContent += `<td><span class="status-badge ${statusClass}">${escapeHtml(seller.verificationStatus || 'Unknown')}</span></td>`;
        pdfContent += '</tr>';
      });
      
      pdfContent += '</tbody>';
      pdfContent += '</table>';
      pdfContent += '<div class="export-info">';
      pdfContent += `<p>Generated on: ${new Date().toLocaleString()}</p>`;
      pdfContent += `<p>Total Sellers: ${sellers.value.length}</p>`;
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
    }
  } catch (error) {
    console.error(`Error exporting ${format}:`, error);
    alert(`Failed to export as ${format.toUpperCase()}`);
  }
};

// Helper function to escape HTML
const escapeHtml = (text) => {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

onMounted(fetchSellers);
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css');

.dashboard-container {
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.main-content {
  flex: 1;
  padding: 2rem;
  margin-left: 260px; /* Adjust this value to match the width of the sidebar */
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  color: #2e5c31;
  margin: 0;
  font-weight: 700;
}

.action-buttons {
  display: flex;
  gap: 1rem;
}

.primary-btn, .secondary-btn {
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.primary-btn {
  background-color: #2e5c31;
  color: white;
}

.primary-btn:hover {
  background-color: #1a3a1c;
}

.secondary-btn {
  background-color: #f8f9fa;
  color: #2c3e50;
  border: 1px solid #e9ecef;
}

.secondary-btn:hover {
  background-color: #e9ecef;
}

.sellers-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 1.5rem;
}

.stat-card {
  background-color: #ffffff;
  border-radius: 10px;
  padding: 1.5rem;
  flex: 1;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-card h3 {
  font-size: 1rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #2e5c31;
  margin: 0;
}

.sellers-table {
  background-color: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

th, td {
  padding: 1rem;
  text-align: left;
}

th {
  background-color: #f8fafc;
  font-weight: 600;
  color: #4a5568;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

tr:nth-child(even) {
  background-color: #f8fafc;
}

tr:hover {
  background-color: #f0f7f0;
}

.seller-info {
  display: flex;
  flex-direction: column;
}

.seller-name {
  font-weight: 600;
  color: #2d3748;
}

.seller-location {
  font-size: 0.875rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn.view {
  background-color: #2e5c31;
  color: white;
}

.action-btn.view:hover {
  background-color: #1a3a1c;
}

.action-btn.edit {
  background-color: #2e5c31;
  color: white;
}

.action-btn.edit:hover {
  background-color: #1a3a1c;
}

.action-btn.delete {
  background-color: #e74c3c;
  color: white;
  width: 36px;
  height: 36px;
}

.action-btn.delete:hover {
  background-color: #c0392b;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
}

.status-badge.active, .status-badge.verified {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.inactive, .status-badge.unknown {
  background-color: #f8d7da;
  color: #721c24;
}

.status-badge.pending {
  background-color: #fff3cd;
  color: #856404;
}

@media (max-width: 1200px) {
  .sellers-table {
    overflow-x: auto;
  }
  
  .sellers-stats {
    flex-direction: column;
  }
  
  .stat-card {
    width: 100%;
  }
  
  .header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .action-buttons {
    width: 100%;
  }
}

.export-dropdown {
  position: relative;
  display: inline-block;
}

.export-dropdown-content {
  display: none;
  position: absolute;
  right: 0;
  background-color: white;
  min-width: 160px;
  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
  z-index: 1;
  border-radius: 6px;
  overflow: hidden;
}

.export-dropdown:hover .export-dropdown-content {
  display: block;
}

.export-option {
  color: #2c3e50;
  padding: 12px 16px;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
}

.export-option:hover {
  background-color: #f1f1f1;
}
</style>
