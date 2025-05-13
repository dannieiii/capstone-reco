<template>
  <div class="dashboard-container">
    <AdminSidebar />
    <div class="main-content">
      <h1 class="page-title">Sellers Management</h1>
      
      <!-- Action buttons above the table -->
      <div class="action-buttons">
        <button class="primary-btn">
          <i class="fas fa-plus"></i> Add New Seller
        </button>
        <button class="secondary-btn">
          <i class="fas fa-filter"></i> Filter
        </button>
        <button class="secondary-btn">
          <i class="fas fa-download"></i> Export
        </button>
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
              <th>Total Sales</th>
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
              <td>${{ seller.totalSales?.toLocaleString() || '0' }}</td>
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
                <button class="btn-info" @click="navigateToSellerDetails(seller.id)">
                  <i class="fas fa-info-circle"></i> Details
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

const activeSellers = computed(() => sellers.value.filter(s => s.registrationStatus === 'Active').length);
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
      status: "Active",
      registrationStatus: "Active", // Update registration status
      isVerified: true, // Set isVerified to true
      verificationStatus: "Verified", // Set verificationStatus to "Verified"
    });

    // Update the local state to reflect the new status
    seller.status = "Active";
    seller.registrationStatus = "Active";
    seller.isVerified = true;
    seller.verificationStatus = "Verified";

    alert("Seller approved and verified successfully!");
  } catch (error) {
    console.error("Error updating user role or seller status:", error);
    alert("Failed to approve seller. Please try again.");
  }
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

.page-title {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-weight: 700;
}

/* Action buttons above the table */
.action-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
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
  background-color: #3498db;
  color: white;
}

.primary-btn:hover {
  background-color: #2980b9;
}

.secondary-btn {
  background-color: #f8f9fa;
  color: #2c3e50;
  border: 1px solid #e9ecef;
}

.secondary-btn:hover {
  background-color: #e9ecef;
}

/* Stats cards */
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
  color: #3498db;
  margin: 0;
}

/* Table styles */
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
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
}

tr:nth-child(even) {
  background-color: #f8f9fa;
}

tr:hover {
  background-color: #f1f4f7;
}

/* Seller info styles */
.seller-info {
  display: flex;
  flex-direction: column;
}

.seller-name {
  font-weight: 600;
  color: #2c3e50;
}

.seller-location {
  font-size: 0.875rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

/* Custom dropdown styles */
.custom-dropdown {
  position: relative;
  display: inline-block;
  width: 100%;
}

.custom-dropdown select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 100%;
  padding: 0.5rem 2rem 0.5rem 1rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  background-color: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.custom-dropdown select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.custom-dropdown select:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.custom-dropdown .dropdown-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #6c757d;
}

/* Status badge styles */
.status-badge {
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  display: inline-block;
}

.status-badge.verified {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.pending {
  background-color: #fff3cd;
  color: #856404;
}

.status-badge.declined {
  background-color: #f8d7da;
  color: #721c24;
}

.status-badge.unknown {
  background-color: #e2e3e5;
  color: #383d41;
}

/* Action buttons in table */
.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.btn-info {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  background-color: #17a2b8;
  color: white;
}

.btn-info:hover {
  background-color: #138496;
}
</style>