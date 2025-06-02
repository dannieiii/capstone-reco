<template>
  <div class="dashboard-container">
    <AdminSidebar />
    <div class="main-content">
      <div class="header-section">
        <h1 class="page-title">Customer Management</h1>
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
      
      <div class="customers-stats">
        <div class="stat-card">
          <h3>Total Customers</h3>
          <p class="stat-value">{{ customers.length }}</p>
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
      
      <div class="customers-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Contact Number</th>
              <th>Address</th>
              <th>Verified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="customer in customers" :key="customer.userId">
              
              <td>
                <div class="customer-name">{{ customer.firstName }} {{ customer.lastName }}</div>
              </td>
              <td>{{ customer.username }}</td>
              <td>{{ customer.email }}</td>
              <td>{{ customer.contactNumber }}</td>
              <td>{{ customer.address }}</td>
              <td>
                <span :class="['status-badge', customer.isVerified ? 'active' : 'inactive']">
                  {{ customer.isVerified ? 'Verified' : 'Not Verified' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="action-btn view" @click="viewMoreInfo(customer)">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="action-btn edit" @click="editCustomer(customer)">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="action-btn delete">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
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
import AdminSidebar from '@/components/AdminSidebar.vue';
import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs } from "firebase/firestore";

const customers = ref([]);

const verifiedCustomers = computed(() => customers.value.filter(c => c.isVerified).length);
const newCustomers = computed(() => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  return customers.value.filter(c => new Date(c.createdAt) > oneMonthAgo).length;
});

const fetchCustomers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    customers.value = querySnapshot.docs
      .map(doc => doc.data())
      .filter(user => user.role === "customer");
  } catch (error) {
    console.error("Error fetching customers:", error);
  }
};

const viewMoreInfo = (customer) => {
  // Implement a modal or navigate to a detailed view
  console.log("View more info for:", customer);
};

const editCustomer = (customer) => {
  // Implement edit functionality
  console.log("Edit customer:", customer);
};

const exportData = (format) => {
  try {
    if (format === 'csv') {
      // CSV Export Logic
      const headers = ['Name', 'Username', 'Email', 'Contact Number', 'Address', 'Verified'];
      const csvContent = [
        headers.join(','),
        ...customers.value.map(customer => [
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
      // Create a new window for PDF content
      const printWindow = window.open('', '_blank');
      
      // Create PDF content
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
      
      // Add customer rows
      customers.value.forEach(customer => {
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
      pdfContent += `<p>Total Customers: ${customers.value.length}</p>`;
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

onMounted(fetchCustomers);
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

.customers-stats {
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

.customers-table {
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
  background-color: #f0f7ff;
}

.customer-name {
  font-weight: 600;
  color: #2d3748;
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

.status-badge.active {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.inactive {
  background-color: #f8d7da;
  color: #721c24;
}

@media (max-width: 1200px) {
  .customers-table {
    overflow-x: auto;
  }
  
  .customers-stats {
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
