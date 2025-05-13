<template>
    <div class="order-tracking">
      <div class="header">
        <button class="back-button" @click="$emit('back')">
          <ChevronLeft size="22" />
        </button>
        <h1>Track Order #{{ orderCode }}</h1>
      </div>
      
      <div class="content">
        <div class="tracking-status">
          <div class="status-timeline">
            <div class="timeline-item" :class="{ active: isStatusActive('Pending') }">
              <div class="status-icon">
                <Clock v-if="isStatusActive('Pending')" size="24" />
                <CheckCircle v-else size="24" />
              </div>
              <div class="status-info">
                <h3>Order Placed</h3>
                <p v-if="statusTimestamps.Pending">{{ formatDate(statusTimestamps.Pending) }}</p>
              </div>
            </div>
            
            <div class="timeline-connector" :class="{ active: isStatusActive('Processing') }"></div>
            
            <div class="timeline-item" :class="{ active: isStatusActive('Processing') }">
              <div class="status-icon">
                <Package v-if="isStatusActive('Processing')" size="24" />
                <CheckCircle v-else-if="currentStatusIndex > 1" size="24" />
                <Circle v-else size="24" />
              </div>
              <div class="status-info">
                <h3>Processing</h3>
                <p v-if="statusTimestamps.Processing">{{ formatDate(statusTimestamps.Processing) }}</p>
              </div>
            </div>
            
            <div class="timeline-connector" :class="{ active: isStatusActive('Shipped') }"></div>
            
            <div class="timeline-item" :class="{ active: isStatusActive('Shipped') }">
              <div class="status-icon">
                <Truck v-if="isStatusActive('Shipped')" size="24" />
                <CheckCircle v-else-if="currentStatusIndex > 2" size="24" />
                <Circle v-else size="24" />
              </div>
              <div class="status-info">
                <h3>On the Way</h3>
                <p v-if="statusTimestamps.Shipped">{{ formatDate(statusTimestamps.Shipped) }}</p>
                <p v-if="isStatusActive('Shipped') && estimatedDelivery" class="eta">
                  Estimated delivery: {{ formatDate(estimatedDelivery) }}
                </p>
              </div>
            </div>
            
            <div class="timeline-connector" :class="{ active: isStatusActive('Delivered') }"></div>
            
            <div class="timeline-item" :class="{ active: isStatusActive('Delivered') }">
              <div class="status-icon">
                <CheckCircle v-if="isStatusActive('Delivered')" size="24" />
                <Circle v-else size="24" />
              </div>
              <div class="status-info">
                <h3>Delivered</h3>
                <p v-if="statusTimestamps.Delivered">{{ formatDate(statusTimestamps.Delivered) }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="order-details-card">
          <h2>Order Details</h2>
          <div class="order-info">
            <div class="info-row">
              <span class="info-label">Order ID:</span>
              <span class="info-value">#{{ orderCode }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Product:</span>
              <span class="info-value">{{ productName }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Quantity:</span>
              <span class="info-value">{{ weight }} kg</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total:</span>
              <span class="info-value">₱{{ totalPrice.toFixed(2) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Delivery Address:</span>
              <span class="info-value">{{ deliveryAddress }}</span>
            </div>
          </div>
        </div>
        
        <!-- Delivery Photo Section (when delivered) -->
        <div v-if="isStatusActive('Delivered') && deliveryPhotoURL" class="delivery-photo-section">
          <h2>Delivery Confirmation</h2>
          <p class="delivery-photo-caption">Photo taken at delivery:</p>
          <div class="delivery-photo-container" @click="openFullScreenPhoto">
            <img :src="deliveryPhotoURL" alt="Delivery confirmation" class="delivery-photo" />
            <div class="photo-zoom-hint">
              <ZoomIn size="20" />
              <span>Tap to enlarge</span>
            </div>
          </div>
        </div>
        
        <div v-if="isStatusActive('Shipped')" class="seller-contact">
          <h2>Contact Seller</h2>
          <p>If you have questions about your delivery, contact the seller directly:</p>
          <button class="contact-btn" @click="contactSeller">
            <Phone size="16" />
            Contact Seller
          </button>
        </div>
        
        <div v-if="isStatusActive('Shipped') || isStatusActive('Delivered')" class="delivery-notes">
          <h2>Delivery Notes</h2>
          <div class="notes-content">
            <p v-if="sellerNotes">{{ sellerNotes }}</p>
            <p v-else>No additional notes from the seller.</p>
          </div>
        </div>
        
        <div v-if="isStatusActive('Delivered')" class="confirmation-section">
          <h2>Order Delivered</h2>
          <p>Your order has been delivered. Thank you for shopping with us!</p>
          <div v-if="!isConfirmed" class="confirm-delivery">
            <p>Please confirm that you've received your order:</p>
            <button class="confirm-btn" @click="confirmDelivery">
              <CheckCircle size="16" />
              Confirm Receipt
            </button>
          </div>
          <div v-else class="confirmed-message">
            <CheckCircle size="20" />
            <p>You've confirmed receipt of this order.</p>
          </div>
        </div>
      </div>
      
      <!-- Fullscreen Photo Modal -->
      <div v-if="showFullScreenPhoto" class="fullscreen-photo-modal" @click="closeFullScreenPhoto">
        <div class="fullscreen-photo-container">
          <img :src="deliveryPhotoURL" alt="Delivery confirmation" class="fullscreen-photo" />
          <button class="close-fullscreen-btn" @click.stop="closeFullScreenPhoto">
            <X size="24" />
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  import { 
    ChevronLeft, 
    Clock, 
    Package, 
    Truck, 
    CheckCircle, 
    Circle,
    Phone,
    ZoomIn,
    X
  } from 'lucide-vue-next';
  import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
  
  const props = defineProps({
    orderId: {
      type: String,
      required: true
    }
  });
  
  const emit = defineEmits(['back', 'confirmed']);
  
  // Order data
  const orderCode = ref('');
  const productName = ref('');
  const weight = ref('');
  const totalPrice = ref(0);
  const deliveryAddress = ref('');
  const currentStatus = ref('Pending');
  const sellerNotes = ref('');
  const sellerContact = ref('');
  const isConfirmed = ref(false);
  const estimatedDelivery = ref(null);
  const deliveryPhotoURL = ref(null);
  const showFullScreenPhoto = ref(false);
  
  // Status timestamps
  const statusTimestamps = ref({
    Pending: null,
    Processing: null,
    Shipped: null,
    Delivered: null
  });
  
  // Status order for tracking progress
  const statusOrder = ['Pending', 'Processing', 'Shipped', 'Delivered'];
  
  const currentStatusIndex = computed(() => {
    return statusOrder.indexOf(currentStatus.value);
  });
  
  // Check if a status is active (current) or completed
  const isStatusActive = (status) => {
    const statusIndex = statusOrder.indexOf(status);
    return statusIndex <= currentStatusIndex.value;
  };
  
  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    let date;
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };
  
  // Fetch order data
  const fetchOrderData = async () => {
    try {
      const db = getFirestore();
      const orderRef = doc(db, 'orders', props.orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (orderSnap.exists()) {
        const data = orderSnap.data();
        
        // Set basic order info
        orderCode.value = data.orderCode || data.id;
        productName.value = data.productName || 'Product';
        weight.value = data.weight || '1';
        totalPrice.value = data.totalPrice || 0;
        currentStatus.value = data.status || 'Pending';
        isConfirmed.value = data.customerConfirmed || false;
        
        // Set delivery address
        if (data.Location) {
          if (typeof data.Location === 'string') {
            deliveryAddress.value = data.Location;
          } else {
            deliveryAddress.value = data.Location.address || 'N/A';
          }
        }
        
        // Set seller notes and contact if available
        sellerNotes.value = data.deliveryNotes || '';
        sellerContact.value = data.sellerContact || '';
        
        // Set delivery photo URL if available
        deliveryPhotoURL.value = data.deliveryPhotoURL || null;
        
        // Set status timestamps
        if (data.statusTimestamps) {
          statusTimestamps.value = data.statusTimestamps;
        } else {
          // Fallback if no timestamps are stored
          statusTimestamps.value.Pending = data.createdAt || data.timestamp;
        }
        
        // Set estimated delivery time (4 hours after shipped)
        if (statusTimestamps.value.Shipped) {
          let shippedDate;
          if (typeof statusTimestamps.value.Shipped.toDate === 'function') {
            shippedDate = statusTimestamps.value.Shipped.toDate();
          } else {
            shippedDate = new Date(statusTimestamps.value.Shipped);
          }
          
          // If custom delivery hours are set, use those instead of default 4 hours
          const deliveryHours = data.estimatedDeliveryHours || 4;
          estimatedDelivery.value = new Date(shippedDate.getTime() + (deliveryHours * 60 * 60 * 1000));
        }
      }
    } catch (error) {
      console.error('Error fetching order data:', error);
    }
  };
  
  // Contact seller function
  const contactSeller = () => {
    if (sellerContact.value) {
      window.location.href = `tel:${sellerContact.value}`;
    } else {
      alert('Seller contact information is not available.');
    }
  };
  
  // Confirm delivery function
  const confirmDelivery = async () => {
    try {
      const db = getFirestore();
      const orderRef = doc(db, 'orders', props.orderId);
      
      await updateDoc(orderRef, {
        customerConfirmed: true,
        customerConfirmedAt: new Date()
      });
      
      isConfirmed.value = true;
      emit('confirmed', props.orderId);
    } catch (error) {
      console.error('Error confirming delivery:', error);
    }
  };
  
  // Photo fullscreen functions
  const openFullScreenPhoto = () => {
    if (deliveryPhotoURL.value) {
      showFullScreenPhoto.value = true;
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }
  };
  
  const closeFullScreenPhoto = () => {
    showFullScreenPhoto.value = false;
    // Restore body scrolling
    document.body.style.overflow = '';
  };
  
  onMounted(() => {
    fetchOrderData();
  });
  </script>
  
  <style scoped>
  .order-tracking {
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: #f5f5f5;
  }
  
  .header {
    display: flex;
    align-items: center;
    padding: 20px 15px;
    background-color: #2e5c31;
    color: white;
  }
  
  .back-button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    margin-right: 10px;
  }
  
  .header h1 {
    font-size: 18px;
    font-weight: 600;
  }
  
  .content {
    flex: 1;
    padding: 20px 15px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .tracking-status {
    background-color: white;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  }
  
  .status-timeline {
    display: flex;
    flex-direction: column;
  }
  
  .timeline-item {
    display: flex;
    align-items: flex-start;
    gap: 15px;
    position: relative;
    padding: 10px 0;
  }
  
  .timeline-item.active .status-icon {
    background-color: #e8f5e9;
    color: #2e5c31;
  }
  
  .timeline-item:not(.active) .status-icon {
    background-color: #f3f4f6;
    color: #9ca3af;
  }
  
  .status-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }
  
  .timeline-connector {
    width: 2px;
    height: 30px;
    background-color: #e5e7eb;
    margin-left: 23px;
  }
  
  .timeline-connector.active {
    background-color: #2e5c31;
  }
  
  .status-info {
    flex: 1;
    padding-top: 5px;
  }
  
  .status-info h3 {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 5px 0;
    color: #111827;
  }
  
  .status-info p {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
  }
  
  .status-info .eta {
    margin-top: 5px;
    font-weight: 500;
    color: #2e5c31;
  }
  
  .order-details-card {
    background-color: white;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  }
  
  .order-details-card h2 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 15px 0;
    color: #111827;
  }
  
  .order-info {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .info-row {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
  }
  
  .info-label {
    color: #6b7280;
  }
  
  .info-value {
    font-weight: 500;
    color: #111827;
  }
  
  /* Delivery Photo Styles */
  .delivery-photo-section {
    background-color: white;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  }
  
  .delivery-photo-section h2 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 15px 0;
    color: #111827;
  }
  
  .delivery-photo-caption {
    font-size: 14px;
    color: #6b7280;
    margin: 0 0 10px 0;
  }
  
  .delivery-photo-container {
    position: relative;
    width: 100%;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
  
  .delivery-photo {
    width: 100%;
    display: block;
  }
  
  .photo-zoom-hint {
    position: absolute;
    bottom: 10px;
    right: 10px;
    background-color: rgba(0, 0, 0, 0.6);
    color: white;
    padding: 6px 10px;
    border-radius: 20px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  /* Fullscreen Photo Modal */
  .fullscreen-photo-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.9);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .fullscreen-photo-container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .fullscreen-photo {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  
  .close-fullscreen-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
  }
  
  .seller-contact, .delivery-notes, .confirmation-section {
    background-color: white;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  }
  
  .seller-contact h2, .delivery-notes h2, .confirmation-section h2 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 15px 0;
    color: #111827;
  }
  
  .seller-contact p, .delivery-notes p, .confirmation-section p {
    font-size: 14px;
    color: #6b7280;
    margin: 0 0 15px 0;
  }
  
  .contact-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px;
    background-color: #e8f5e9;
    color: #2e5c31;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
  }
  
  .notes-content {
    background-color: #f9fafb;
    border-radius: 8px;
    padding: 15px;
  }
  
  .confirm-delivery {
    margin-top: 15px;
  }
  
  .confirm-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px;
    background-color: #2e5c31;
    color: white;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
  }
  
  .confirmed-message {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 15px;
    padding: 15px;
    background-color: #e8f5e9;
    border-radius: 8px;
    color: #2e5c31;
  }
  
  .confirmed-message p {
    margin: 0;
    color: #2e5c31;
  }
  </style>