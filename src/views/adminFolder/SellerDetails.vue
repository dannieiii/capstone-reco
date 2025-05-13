<template>
    <div class="dashboard-container">
      <AdminSidebar />
      <div class="main-content">
        <div class="header-actions">
          <button class="back-btn" @click="goBack">
            <i class="fas fa-arrow-left"></i> Back to Sellers
          </button>
          <div class="action-buttons">
            <button class="edit-btn">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="status-btn" :class="{ 'active': seller.status === 'Active' }" @click="toggleStatus">
              <i class="fas" :class="seller.status === 'Active' ? 'fa-toggle-on' : 'fa-toggle-off'"></i>
              {{ seller.status === 'Active' ? 'Active' : 'Inactive' }}
            </button>
          </div>
        </div>
  
        <div v-if="loading" class="loading">
          <i class="fas fa-spinner fa-spin"></i> Loading seller details...
        </div>
  
        <div v-else-if="error" class="error-message">
          <i class="fas fa-exclamation-triangle"></i> {{ error }}
        </div>
  
        <div v-else class="seller-details-container">
          <div class="seller-header">
            <div class="seller-title">
              <h1>{{ seller.firstName }} {{ seller.lastName }}</h1>
              <span :class="['status-badge', seller.status?.toLowerCase() || 'unknown']">
                {{ seller.status || 'Unknown' }}
              </span>
            </div>
            <div class="seller-meta">
              <div class="meta-item">
                <i class="fas fa-id-card"></i> ID: {{ seller.id }}
              </div>
              <div class="meta-item">
                <i class="fas fa-calendar-alt"></i> Joined: {{ formatDate(seller.createdAt) }}
              </div>
            </div>
          </div>
  
          <!-- Personal Information Section -->
          <div class="details-section">
            <h2><i class="fas fa-user"></i> Personal Information</h2>
            <div class="details-grid">
              <div class="detail-item">
                <span class="detail-label">First Name</span>
                <span class="detail-value">{{ seller.firstName || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Last Name</span>
                <span class="detail-value">{{ seller.lastName || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Email</span>
                <span class="detail-value">{{ seller.email || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Contact</span>
                <span class="detail-value">{{ seller.contact || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Address</span>
                <span class="detail-value">{{ seller.address || 'N/A' }}</span>
              </div>
            </div>
          </div>
  
          <!-- Farm/Business Details Section -->
          <div class="details-section">
            <h2><i class="fas fa-store"></i> Farm/Business Details</h2>
            <div class="details-grid">
              <div class="detail-item">
                <span class="detail-label">Farm Name</span>
                <span class="detail-value">{{ seller.farmName || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Farm Address</span>
                <span class="detail-value">{{ seller.farmAddress || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Farm Type</span>
                <span class="detail-value">{{ seller.farmType || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Products</span>
                <span class="detail-value">{{ seller.products || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Years in Farming</span>
                <span class="detail-value">{{ seller.yearInFarming || 'N/A' }}</span>
              </div>
            </div>
          </div>
  
          <!-- Payment & Banking Information Section -->
          <div class="details-section">
            <h2><i class="fas fa-credit-card"></i> Payment & Banking Information</h2>
            <div class="details-grid">
              <div class="detail-item">
                <span class="detail-label">Payment Method</span>
                <span class="detail-value">{{ seller.paymentMethod || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Account Name</span>
                <span class="detail-value">{{ seller.accountName || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Account Number</span>
                <span class="detail-value">{{ seller.accountNumber || 'N/A' }}</span>
              </div>
            </div>
          </div>
  
          <!-- Verification Documents Section -->
          <div class="details-section">
          <h2><i class="fas fa-file-alt"></i> Verification Documents</h2>
          <div class="documents-grid">
            <div class="document-item" v-if="seller.validID">
              <h3>Valid ID</h3>
              <a :href="seller.validID" target="_blank" class="document-link">
                <i class="fas fa-external-link-alt"></i> View Document
              </a>
            </div>
            <div class="document-item" v-if="seller.businessPermit">
              <h3>Business Permit</h3>
              <a :href="seller.businessPermit" target="_blank" class="document-link">
                <i class="fas fa-external-link-alt"></i> View Document
              </a>
            </div>
            <div class="document-item" v-if="seller.farmCert">
              <h3>Farm Certification</h3>
              <a :href="seller.farmCert" target="_blank" class="document-link">
                <i class="fas fa-external-link-alt"></i> View Document
              </a>
            </div>
          </div>
          </div>
  
          <!-- Delivery & Logistics Section -->
          <div class="details-section">
            <h2><i class="fas fa-truck"></i> Delivery & Logistics</h2>
            <div class="details-grid">
              <div class="detail-item">
                <span class="detail-label">Delivery Method</span>
                <span class="detail-value">{{ seller.deliveryMethod || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Operating Hours</span>
                <span class="detail-value">{{ seller.operatingHours || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Areas Covered</span>
                <span class="detail-value">{{ seller.areasCovered || 'N/A' }}</span>
              </div>
            </div>
          </div>
  
          <!-- Additional Details Section -->
          <div class="details-section">
            <h2><i class="fas fa-info-circle"></i> Additional Details</h2>
            <div class="details-grid">
              <div class="detail-item">
                <span class="detail-label">Social Media</span>
                <span class="detail-value">{{ seller.socialMedia || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Wholesale Availability</span>
                <span class="detail-value">{{ seller.wholesaleAvailability ? 'Yes' : 'No' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Is Available</span>
                <span class="detail-value">{{ seller.isAvail ? 'Yes' : 'No' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Is Verified</span>
                <span class="detail-value">{{ seller.isVerified ? 'Yes' : 'No' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import AdminSidebar from '@/components/AdminSidebar.vue';
  import { db } from '@/firebase/firebaseConfig';
  import { doc, getDoc, updateDoc } from "firebase/firestore";
  
  const router = useRouter();
  const route = useRoute();
  const sellerId = route.params.id;
  
  const seller = ref({});
  const loading = ref(true);
  const error = ref(null);
  
  const fetchSellerDetails = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const sellerDoc = await getDoc(doc(db, "sellers", sellerId));
      
      if (sellerDoc.exists()) {
        seller.value = { id: sellerDoc.id, ...sellerDoc.data() };
      } else {
        error.value = "Seller not found";
      }
    } catch (err) {
      console.error("Error fetching seller details:", err);
      error.value = "Failed to load seller details";
    } finally {
      loading.value = false;
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };
  
  const toggleStatus = async () => {
    try {
      const newStatus = seller.value.status === 'Active' ? 'Inactive' : 'Active';
      await updateDoc(doc(db, "sellers", sellerId), { status: newStatus });
      seller.value.status = newStatus;
    } catch (err) {
      console.error("Error updating seller status:", err);
      alert("Failed to update seller status");
    }
  };
  
  const goBack = () => {
    router.push('/admin/sellers');
  };
  
  onMounted(fetchSellerDetails);
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
  }
  
  .header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .back-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    background-color: #f8f9fa;
    color: #2c3e50;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .back-btn:hover {
    background-color: #e9ecef;
  }
  
  .action-buttons {
    display: flex;
    gap: 1rem;
  }
  
  .edit-btn, .status-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .edit-btn {
    background-color: #3498db;
    color: white;
  }
  
  .edit-btn:hover {
    background-color: #2980b9;
  }
  
  .status-btn {
    background-color: #6c757d;
    color: white;
  }
  
  .status-btn.active {
    background-color: #28a745;
  }
  
  .status-btn:hover {
    opacity: 0.9;
  }
  
  .loading, .error-message {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background-color: white;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    font-size: 1.25rem;
    color: #6c757d;
  }
  
  .loading i, .error-message i {
    margin-right: 0.5rem;
    font-size: 1.5rem;
  }
  
  .error-message {
    color: #dc3545;
  }
  
  .seller-details-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .seller-header {
    background-color: white;
    border-radius: 10px;
    padding: 2rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }
  
  .seller-title {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .seller-title h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #2c3e50;
    margin: 0;
  }
  
  .seller-meta {
    display: flex;
    gap: 2rem;
    color: #6c757d;
  }
  
  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .details-section {
    background-color: white;
    border-radius: 10px;
    padding: 2rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }
  
  .details-section h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #2c3e50;
    margin-top: 0;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  
  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .detail-label {
    font-size: 0.875rem;
    color: #6c757d;
    font-weight: 500;
  }
  
  .detail-value {
    font-size: 1rem;
    color: #2c3e50;
    font-weight: 500;
  }
  
  .documents-grid {
    display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
  }
  
  .document-item {
    background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  }
  
  .document-item h3 {
    font-size: 1rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  }
  
  .document-link {
    display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #3498db;
  text-decoration: none;
  font-weight: 600;
  }
  
  .document-link:hover {
    text-decoration: underline;
  }
  
  .status-badge {
    padding: 0.35rem 0.75rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .status-badge.active {
    background-color: #d4edda;
    color: #155724;
  }
  
  .status-badge.inactive {
    background-color: #f8d7da;
    color: #721c24;
  }
  
  .status-badge.pending {
    background-color: #fff3cd;
    color: #856404;
  }
  
  .status-badge.unknown {
    background-color: #e2e3e5;
    color: #383d41;
  }
  
  @media (max-width: 768px) {
    .header-actions {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
    
    .action-buttons {
      width: 100%;
    }
    
    .edit-btn, .status-btn {
      flex: 1;
      justify-content: center;
    }
    
    .details-grid, .documents-grid {
      grid-template-columns: 1fr;
    }
  }
  </style>