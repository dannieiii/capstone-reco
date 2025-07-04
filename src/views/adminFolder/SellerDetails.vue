<template>
    <div class="dashboard-container">
      <AdminSidebar />
      <div class="main-content">
        <div class="header-actions">
          <button class="back-btn" @click="goBack">
            <i class="fas fa-arrow-left"></i> Back to Sellers
          </button>
          <div class="action-buttons">
            <button 
              v-if="seller.registrationStatus === 'Pending'" 
              class="accept-btn" 
              @click="acceptSeller"
              :disabled="isProcessing"
            >
              <i class="fas fa-check" v-if="!isProcessing"></i>
              <i class="fas fa-spinner fa-spin" v-else></i>
              {{ isProcessing ? 'Processing...' : 'Accept' }}
            </button>
            <button class="edit-btn">
              <i class="fas fa-edit"></i>
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
              <h1>{{ seller.personalInfo.firstName }} {{ seller.personalInfo.lastName }}</h1>
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
                <span class="detail-value">{{ seller.personalInfo.firstName || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Last Name</span>
                <span class="detail-value">{{ seller.personalInfo.lastName || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Email</span>
                <span class="detail-value">{{ seller.personalInfo.email || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Contact</span>
                <span class="detail-value">{{ seller.personalInfo.contact || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Address</span>
                <span class="detail-value">{{ seller.personalInfo.address || 'N/A' }}</span>
              </div>
            </div>
          </div>
  
          <!-- Farm/Business Details Section -->
          <div class="details-section">
            <h2><i class="fas fa-store"></i> Farm/Business Details</h2>
            <div class="details-grid">
              <div class="detail-item">
                <span class="detail-label">Farm Name</span>
                <span class="detail-value">{{ seller.farmDetails.farmName || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Farm Address</span>
                <span class="detail-value">{{ seller.farmDetails.farmAddress || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Farm Type</span>
                <span class="detail-value">{{ seller.farmDetails.farmType || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Products</span>
                <span class="detail-value">{{ seller.farmDetails.products || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Years in Farming</span>
                <span class="detail-value">{{ seller.farmDetails.yearInFarming || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Is Online</span>
                <span class="detail-value">{{ seller.isOnline ? 'Yes' : 'No' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Is Verified</span>
                <span class="detail-value">{{ seller.isVerified ? 'Yes' : 'No' }}</span>
              </div>
            </div>
          </div>
  
          <!-- Payment & Banking Information Section -->
          <div class="details-section">
            <h2><i class="fas fa-credit-card"></i> Payment & Banking Information</h2>
            <div class="details-grid">
              <div class="detail-item">
                <span class="detail-label">Payment Method</span>
                <span class="detail-value">{{ seller.paymentInfo.paymentMethod || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Account Name</span>
                <span class="detail-value">{{ seller.paymentInfo.accountName || 'N/A' }}</span>
              </div>              <div class="detail-item">
                <span class="detail-label">Account Number</span>
                <span class="detail-value">{{ seller.paymentInfo.accountNumber || 'N/A' }}</span>
              </div>
            </div>
          </div>          <!-- Verification Documents Section -->
          <div class="details-section">
            <h2><i class="fas fa-file-alt"></i> Verification Documents</h2>
            <div class="documents-grid">
              <div class="document-item" v-if="seller.documents?.validID && seller.documents.validID.trim()">
                <h3>Valid ID</h3>
                <button @click="viewDocument('validID', seller.documents.validID)" class="document-button">
                  <i class="fas fa-eye"></i> View Document
                </button>
              </div>
              <div class="document-item" v-if="seller.documents?.businessPermit && seller.documents.businessPermit.trim()">
                <h3>Business Permit</h3>
                <button @click="viewDocument('businessPermit', seller.documents.businessPermit)" class="document-button">
                  <i class="fas fa-eye"></i> View Document
                </button>
              </div>
              <div class="document-item" v-if="seller.documents?.farmCert && seller.documents.farmCert.trim()">
                <h3>Farm Certification</h3>
                <button @click="viewDocument('farmCert', seller.documents.farmCert)" class="document-button">
                  <i class="fas fa-eye"></i> View Document
                </button>
              </div>
              <div v-if="(!seller.documents?.validID || !seller.documents.validID.trim()) && (!seller.documents?.businessPermit || !seller.documents.businessPermit.trim()) && (!seller.documents?.farmCert || !seller.documents.farmCert.trim())" class="document-item">
                <h3>No documents uploaded</h3>
              </div>
            </div>
          </div>
  
          <!-- Delivery & Logistics Section -->
          <div class="details-section">
            <h2><i class="fas fa-truck"></i> Delivery & Logistics</h2>
            <div class="details-grid">
              <div class="detail-item">
                <span class="detail-label">Delivery Methods</span>
                <span class="detail-value">
                  <span v-if="seller.deliveryInfo.deliveryMethods && seller.deliveryInfo.deliveryMethods.length">
                    {{ formatDeliveryMethods(seller.deliveryInfo.deliveryMethods) }}
                  </span>
                  <span v-else>N/A</span>
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Operating Hours</span>
                <span class="detail-value">{{ seller.deliveryInfo.operatingHours || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Areas Covered</span>
                <span class="detail-value">
                  <span v-if="seller.deliveryInfo.areasCovered && seller.deliveryInfo.areasCovered.length">
                    {{ seller.deliveryInfo.areasCovered.join(', ') }}
                  </span>
                  <span v-else>N/A</span>
                </span>
              </div>
            </div>
          </div>
  
          <!-- Additional Details Section -->
          <div class="details-section">
            <h2><i class="fas fa-info-circle"></i> Additional Details</h2>
            <div class="details-grid">
              <div class="detail-item">
                <span class="detail-label">Social Media</span>
                <span class="detail-value">{{ seller.additionalDetails.socialMedia || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Wholesale Availability</span>
                <span class="detail-value">{{ seller.additionalDetails.wholesaleAvailability ? 'Yes' : 'No' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Terms Agreed</span>
                <span class="detail-value">{{ seller.termsAgreement.agreeTerms ? 'Yes' : 'No' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Data Consent</span>
                <span class="detail-value">{{ seller.termsAgreement.consentData ? 'Yes' : 'No' }}</span>
              </div>
            </div>
          </div>        </div>
      </div>
    </div>

    <!-- Document Viewer Modal -->
    <div v-if="showDocumentViewer" class="document-viewer-overlay" @click="closeDocumentViewer">
      <div class="document-viewer-modal" @click.stop>
        <div class="document-viewer-header">
          <h3>{{ documentTitle }}</h3>
          <button @click="closeDocumentViewer" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="document-viewer-content">
          <img :src="currentDocument" :alt="documentTitle" class="document-image" />
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
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import AdminSidebar from '@/components/AdminSidebar.vue';
  import { db } from '@/firebase/firebaseConfig';
  import { doc, getDoc, updateDoc } from "firebase/firestore";
  import emailService from '@/services/emailService';
  
  const router = useRouter();
  const route = useRoute();
  
  // Notification system
  const notification = ref({
    show: false,
    type: 'success', // 'success', 'error', 'warning', 'info'
    title: '',
    message: '',
    duration: 5000
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
  const sellerId = route.params.id;
  const seller = ref({});
  const loading = ref(true);
  const error = ref(null);
  const showDocumentViewer = ref(false);
  const currentDocument = ref('');
  const documentTitle = ref('');
  const isProcessing = ref(false);
  
  const fetchSellerDetails = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const sellerDoc = await getDoc(doc(db, "sellers", sellerId));
      
      if (sellerDoc.exists()) {
        seller.value = { 
          id: sellerDoc.id, 
          ...sellerDoc.data(),
          // Ensure nested objects exist
          personalInfo: sellerDoc.data().personalInfo || {},
          farmDetails: sellerDoc.data().farmDetails || {},
          paymentInfo: sellerDoc.data().paymentInfo || {},
          deliveryInfo: sellerDoc.data().deliveryInfo || {},
          additionalDetails: sellerDoc.data().additionalDetails || {},
          termsAgreement: sellerDoc.data().termsAgreement || {},
          documents: sellerDoc.data().documents || {}
        };
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
      const date = dateString.toDate();
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  const formatDeliveryMethods = (methods) => {
    const methodMap = {
      'own_delivery': 'Own Delivery',
      'pickup_only': 'Pickup Only'
    };
    return methods.map(method => methodMap[method] || method).join(', ');
  };
    const toggleStatus = async () => {
    try {
      const newStatus = seller.value.status === 'Active' ? 'Inactive' : 'Active';
      await updateDoc(doc(db, "sellers", sellerId), { 
        status: newStatus,
        updatedAt: new Date()
      });
      seller.value.status = newStatus;
    } catch (err) {
      console.error("Error updating seller status:", err);
      showNotification(
        'Update Failed',
        'Failed to update seller status. Please try again.',
        'error',
        6000
      );
    }
  };

  const viewDocument = (type, url) => {
    const titles = {
      'validID': 'Valid ID',
      'businessPermit': 'Business Permit',
      'farmCert': 'Farm Certification'
    };
    
    currentDocument.value = url;
    documentTitle.value = titles[type] || 'Document';
    showDocumentViewer.value = true;
  };

  const closeDocumentViewer = () => {
    showDocumentViewer.value = false;
    currentDocument.value = '';
    documentTitle.value = '';
  };

  const acceptSeller = async () => {
    if (isProcessing.value) return;
    
    try {
      isProcessing.value = true;
      
      // Show processing notification
      showNotification(
        'Processing...',
        `Accepting ${seller.value.personalInfo?.firstName || 'seller'}'s application...`,
        'info',
        3000
      );

      // Update the seller's status in the sellers collection
      const sellerRef = doc(db, "sellers", sellerId);
      const updateData = { 
        registrationStatus: 'Accept',
        status: 'Active',
        isVerified: true,
        verificationStatus: 'Verified',
        updatedAt: new Date()
      };

      await updateDoc(sellerRef, updateData);

      // Update the user's role and isSeller status in the users collection
      if (seller.value.userId) {
        const userRef = doc(db, "users", seller.value.userId);
        await updateDoc(userRef, { 
          role: "seller", 
          isSeller: true,
          isVerified: true
        });
      }

      // Update the local state to reflect the new status
      seller.value.registrationStatus = 'Accept';
      seller.value.status = 'Active';
      seller.value.isVerified = true;
      seller.value.verificationStatus = 'Verified';

      // Send email notification
      try {
        console.log('🔍 Preparing to send seller acceptance email...');
        
        const sellerData = {
          email: seller.value.personalInfo?.email || '',
          firstName: seller.value.personalInfo?.firstName || '',
          lastName: seller.value.personalInfo?.lastName || '',
          farmName: seller.value.farmDetails?.farmName || 'Your Farm'
        };
        
        console.log('📧 Seller data for email:', sellerData);
        
        // Validate email before sending
        if (!sellerData.email || sellerData.email === 'N/A') {
          console.warn('❌ No valid email address found for seller');
          showNotification(
            'Email Warning',
            'Seller accepted successfully but no email sent - no valid email address found.',
            'warning',
            6000
          );
          return;
        }
        
        // Show sending notification
        showNotification(
          'Sending Email...',
          'Sending acceptance email notification to seller...',
          'info',
          3000
        );
        
        const emailResult = await emailService.sendSellerApprovalEmail(sellerData);
        
        if (emailResult && emailResult.success) {
          console.log('✅ Acceptance email sent successfully:', emailResult);
          showNotification(
            'Success!',
            `Seller approved and email sent successfully! ${sellerData.firstName} should receive an email notification at ${sellerData.email}.`,
            'success',
            8000
          );
        } else {
          console.error('❌ Email failed:', emailResult?.error);
          showNotification(
            'Partial Success',
            `Seller approved successfully but email failed to send. ${emailResult?.error?.message || 'Please check email configuration.'} Seller email: ${sellerData.email}`,
            'warning',
            10000
          );
        }
      } catch (emailError) {
        console.error("❌ Email service error:", emailError);
        showNotification(
          'Partial Success',
          `Seller approved successfully but failed to send email notification. Error: ${emailError.message}`,
          'warning',
          8000
        );
      }

    } catch (err) {
      console.error("Error accepting seller:", err);
      showNotification(
        'Accept Failed',
        'Failed to accept seller application. Please try again.',
        'error',
        6000
      );
    } finally {
      isProcessing.value = false;
    }
  };
  
  const goBack = () => {
    router.push('/admin/sellers');
  };
  
  onMounted(() => {
    fetchSellerDetails();
  });
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
    margin-left: 260px; /* Add this to prevent overlap with sidebar */
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
  
  .edit-btn, .status-btn, .accept-btn {
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
    background-color: #2e5c31;
    color: white;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }
  
  .edit-btn:hover {
    background-color: #1a3a1c;
  }

  .accept-btn {
    background-color: #28a745;
    color: white;
  }

  .accept-btn:hover:not(:disabled) {
    background-color: #218838;
  }

  .accept-btn:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
    opacity: 0.7;
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
    color: #2e5c31;
    text-decoration: none;
    font-weight: 600;
  }
  
  .document-link:hover {
    text-decoration: underline;
  }

  .document-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: white;
    background-color: #2e5c31;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .document-button:hover {
    background-color: #1a3a1c;
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

  /* Document Viewer Modal Styles */
  .document-viewer-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(5px);
  }

  .document-viewer-modal {
    background-color: white;
    border-radius: 12px;
    max-width: 90vw;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
  }

  .document-viewer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #e9ecef;
    background-color: #f8f9fa;
  }

  .document-viewer-header h3 {
    margin: 0;
    color: #2c3e50;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #6c757d;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    background-color: #e9ecef;
    color: #2c3e50;
  }

  .document-viewer-content {
    padding: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    max-height: calc(90vh - 120px);
    overflow: auto;
  }

  .document-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
    
    .edit-btn, .status-btn, .accept-btn {
      flex: 1;
      justify-content: center;
    }

    .edit-btn {
      width: auto;
      padding: 0.75rem 1.25rem;
    }
    
    .details-grid, .documents-grid {
      grid-template-columns: 1fr;
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
  </style>
