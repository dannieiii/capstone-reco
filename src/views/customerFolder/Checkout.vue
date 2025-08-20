<template>
  <div class="checkout">
    <!-- Notification Component -->
    <Notification 
      v-if="showNotification"
      :message="notificationMessage"
      :type="notificationType"
      :visible="showNotification"
      @close="showNotification = false"
    />
    
    <!-- Header -->
    <div class="header">
      <button class="back-button" @click="navigateToProductDetails">
        <ChevronLeft size="22" />
      </button>
      <h1>Checkout</h1>
    </div>
    
    <!-- Main Content -->
    <div class="checkout-content">
      <!-- Delivery Address -->
      <div class="checkout-section">
        <div class="section-header">
          <h2>Delivery Address</h2>
          <button class="change-button" @click="showAddressModal = true">Change</button>
        </div>
        
        <div class="address-item" v-if="selectedAddress">
          <div class="address-icon">
            <MapPin size="18" />
          </div>
          <div class="address-details">
            <h3>{{ selectedAddress.name }}</h3>
            <p>{{ getAddressDisplay(selectedAddress) }}</p>
            <p v-if="selectedAddress.locationNotes" class="location-notes">
              <small>Notes: {{ selectedAddress.locationNotes }}</small>
            </p>
            <!-- Distance and delivery fee info -->
            <div v-if="deliveryDistance && deliveryDistance > 0" class="delivery-info">
              <small>Distance: {{ deliveryDistance.toFixed(1) }} km</small>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Order Summary -->
      <div class="checkout-section">
        <h2>Order Summary</h2>
        
        <div class="order-items">
          <div class="product-item" v-for="(item, index) in orderItems" :key="index">
            <div class="product-image">
              <img :src="item.productImage || placeholderImage" :alt="item.productName">
            </div>
            
            <div class="product-details">
              <div class="product-header">
                <h3>{{ item.productName || 'Unnamed Product' }}</h3>
                <span class="unit">Unit: {{ item.unit }}</span>
              </div>
              
              <div class="price-quantity-controls">
                <div class="quantity-controls">
                  <button class="quantity-btn" @click="decreaseQuantity(item)">
                    <Minus size="16" />
                  </button>
                  <span class="quantity">{{ item.quantity }}</span>
                  <button class="quantity-btn" @click="increaseQuantity(item)">
                    <Plus size="16" />
                  </button>
                </div>
                <span class="price">₱{{ (item.unitPrice * item.quantity).toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Payment Method -->
      <div class="checkout-section">
        <h2>Payment Method</h2>
        
        <div class="options-list">
          <label class="option-item" :class="{ active: paymentMethod === 'gcash' }">
            <input 
              type="radio" 
              name="paymentMethod" 
              value="gcash" 
              v-model="paymentMethod"
              class="radio-input"
            >
            <div class="option-content">
              <div class="option-icon gcash">
                <Smartphone size="18" />
              </div>
              <span class="option-title">GCash</span>
            </div>
          </label>
          
          <label class="option-item" :class="{ active: paymentMethod === 'cash' }">
            <input 
              type="radio" 
              name="paymentMethod" 
              value="cash" 
              v-model="paymentMethod"
              class="radio-input"
            >
            <div class="option-content">
              <div class="option-icon">
                <span class="peso-icon">₱</span>
              </div>
              <span class="option-title">Cash on Delivery</span>
            </div>
          </label>
        </div>
        
        <!-- GCash Details Form -->
        <div class="gcash-details" v-if="paymentMethod === 'gcash'">
          <div class="form-group">
            <label for="gcashNumber">GCash Number</label>
            <input 
              type="text" 
              id="gcashNumber" 
              v-model="gcashDetails.number"
              placeholder="09XX XXX XXXX"
            >
          </div>
          
          <div class="form-group">
            <label class="checkbox-container">
              <input type="checkbox" v-model="saveGcash">
              <span class="checkmark"></span>
              Save GCash number for future payments
            </label>
          </div>
        </div>
      </div>
      
      <!-- Delivery Options -->
      <div class="checkout-section" v-if="paymentMethod !== 'pickup'">
        <div class="delivery-options">
          <h3>Delivery Options</h3>
          
          <!-- Loading state for delivery calculation -->
          <div v-if="calculatingDelivery" class="delivery-loading">
            <p>Calculating delivery fees...</p>
          </div>
          
          <div v-else class="options-list">
            <label class="option-item" :class="{ active: deliveryOption === 'standard' }">
              <input 
                type="radio" 
                name="deliveryOption" 
                value="standard" 
                v-model="deliveryOption"
                class="radio-input"
              >
              <div class="option-content">
                <div class="option-icon">
                  <Truck size="18" />
                </div>
                <div class="option-details">
                  <p class="option-title">Standard Delivery</p>
                  <p class="option-subtitle">Delivery in 2-3 days</p>
                  <p v-if="deliveryDistance" class="distance-info">
                    Distance: {{ deliveryDistance.toFixed(1) }} km
                  </p>
                </div>
              </div>
              <span class="option-price">₱{{ standardDeliveryFee.toFixed(2) }}</span>
            </label>
            
            <label class="option-item" :class="{ active: deliveryOption === 'express' }">
              <input 
                type="radio" 
                name="deliveryOption" 
                value="express" 
                v-model="deliveryOption"
                class="radio-input"
              >
              <div class="option-content">
                <div class="option-icon express">
                  <Clock size="18" />
                </div>
                <div class="option-details">
                  <p class="option-title">Express Delivery</p>
                  <p class="option-subtitle">Delivery in 24 hours</p>
                  <p v-if="deliveryDistance" class="distance-info">
                    Distance: {{ deliveryDistance.toFixed(1) }} km
                  </p>
                </div>
              </div>
              <span class="option-price">₱{{ expressDeliveryFee.toFixed(2) }}</span>
            </label>
          </div>
          
          <!-- Error message if distance calculation fails -->
          <div v-if="deliveryError" class="delivery-error">
            <p>{{ deliveryError }}</p>
            <p>Using default delivery rates.</p>
          </div>
        </div>
      </div>
      
      <!-- Order Total -->
      <div class="checkout-section">
        <h2>Order Total</h2>
        
        <div class="total-breakdown">
          <div class="total-row">
            <span>Subtotal</span>
            <span>₱{{ subtotal }}</span>
          </div>
          <div class="total-row" v-if="paymentMethod !== 'pickup'">
            <span>Delivery Fee</span>
            <span>₱{{ deliveryFee }}</span>
          </div>
          <div class="total-row">
            <span>Tax</span>
            <span>₱{{ tax }}</span>
          </div>
          
          <div class="separator"></div>
          
          <div class="total-row final">
            <span>{{ (hasPreOrderItems && !hasMixedPreOrder) ? 'Total due now' : 'Total' }}</span>
            <span>₱{{ (hasPreOrderItems && !hasMixedPreOrder) ? totalDueNow.toFixed(2) : total.toFixed(2) }}</span>
          </div>
          <div v-if="hasPreOrderItems && !hasMixedPreOrder" class="deposit-note">
            Pre-order deposit due now. Remaining balance will be collected when your order is ready.
          </div>
        </div>
      </div>
    </div>
      <!-- Bottom Action -->
    <div class="bottom-action">
      <button 
        class="place-order-button" 
        @click="placeOrder" 
        :disabled="!selectedAddress || calculatingDelivery || sendingEmail"
      >
        <span v-if="sendingEmail">Processing & Sending Email...</span>
        <span v-else-if="calculatingDelivery">Calculating...</span>
        <span v-else>Place Order</span>
      </button>
    </div>
    
    <!-- Address Modal -->
    <div class="modal" v-if="showAddressModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Select Delivery Address</h2>
          <button class="close-button" @click="showAddressModal = false">
            <X size="20" />
          </button>
        </div>
        
        <div class="address-list">
          <div v-if="loadingAddresses" class="loading-addresses">
            <p>Loading addresses...</p>
          </div>
          
          <div v-else>
            <!-- Registration Address Option -->
            <label 
              class="address-option"
              :class="{ active: selectedAddressIndex === -1 }"
            >
              <input 
                type="radio" 
                name="address" 
                :value="-1" 
                v-model="selectedAddressIndex"
                class="radio-input"
                @change="onAddressChange"
              >
              <div class="address-option-content">
                <div class="address-option-icon">
                  <MapPin size="18" />
                </div>
                <div class="address-option-details">
                  <h3>Registration Address</h3>
                  <p>{{ userRegistrationAddress }}</p>
                </div>
              </div>
            </label>
            
            <!-- Additional Addresses -->
            <label 
              v-for="(address, index) in addresses" 
              :key="index"
              class="address-option"
              :class="{ active: selectedAddressIndex === index }"
            >
              <input 
                type="radio" 
                name="address" 
                :value="index" 
                v-model="selectedAddressIndex"
                class="radio-input"
                @change="onAddressChange"
              >
              <div class="address-option-content">
                <div class="address-option-icon">
                  <MapPin size="18" />
                </div>
                <div class="address-option-details">
                  <h3>{{ address.name }}</h3>
                  <p>{{ address.barangay }}, {{ address.municipality }}, {{ address.province }}</p>
                  <p v-if="address.locationNotes" class="location-notes">
                    <small>Notes: {{ address.locationNotes }}</small>
                  </p>
                </div>
              </div>
            </label>
            
            <!-- New Address Form -->
            <div class="new-address-form" v-if="showNewAddressForm">
              <h3>Add New Address</h3>
              <div class="form-group">
                <label>Address Name (e.g. Home, Work)</label>
                <input type="text" v-model="newAddress.name" placeholder="Home, Work, etc." required>
              </div>
              
              <div class="form-group">
                <label>Province</label>
                <select v-model="newAddress.province" disabled>
                  <option value="Oriental Mindoro">Oriental Mindoro</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Municipality/City</label>
                <select v-model="newAddress.municipality" @change="updateBarangays" required>
                  <option value="" disabled selected>Select Municipality/City</option>
                  <option v-for="municipality in municipalities" :value="municipality" :key="municipality">
                    {{ municipality }}
                  </option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Barangay</label>
                <select v-model="newAddress.barangay" required>
                  <option value="" disabled selected>Select Barangay</option>
                  <option v-for="barangay in barangays" :value="barangay" :key="barangay">
                    {{ barangay }}
                  </option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Location Notes (Optional)</label>
                <textarea v-model="newAddress.locationNotes" placeholder="Landmarks, special instructions, etc."></textarea>
              </div>
              
              <div class="form-actions">
                <button class="cancel-button" @click="cancelNewAddress">Cancel</button>
                <button class="confirm-button" @click="saveNewAddress">Save Address</button>
              </div>
            </div>
            
            <button 
              class="add-address-button" 
              @click="showNewAddressForm = true"
              v-if="!showNewAddressForm"
            >
              <Plus size="18" />
              Add New Address
            </button>
          </div>
        </div>
        
        <div class="modal-actions" v-if="!showNewAddressForm && !loadingAddresses">
          <button class="cancel-button" @click="showAddressModal = false">Cancel</button>
          <button class="confirm-button" @click="confirmAddress">Confirm</button>
        </div>
      </div>
    </div>
    
    <!-- Order Success Modal -->
    <div class="modal" v-if="showSuccessModal">
      <div class="modal-content success-modal">
        <div class="success-icon">
          <CheckCircle size="40" />
        </div>
        <h2>Order{{ multipleOrderCodes.length > 1 ? 's' : '' }} Placed Successfully!</h2>
        <p v-if="multipleOrderCodes.length === 1">Your order has been confirmed and will be processed shortly.</p>
        <p v-else>Your {{ multipleOrderCodes.length }} orders have been confirmed. Each seller will process their items separately.</p>
        <p><small>Confirmation email{{ multipleOrderCodes.length > 1 ? 's have' : ' has' }} been sent to your email address.</small></p>
        
        <!-- Single order display -->
        <div v-if="multipleOrderCodes.length === 1" class="order-number">
          <p class="label">Order Code</p>
          <p class="value">#{{ orderNumber }}</p>
        </div>
        
        <!-- Multiple orders display -->
        <div v-else class="multiple-orders">
          <p class="label">Order Codes</p>
          <div class="order-codes-list">
            <div v-for="(code, index) in multipleOrderCodes" :key="code" class="order-code-item">
              <span class="order-code">#{{ code }}</span>
              <small class="order-note">Seller {{ index + 1 }}</small>
            </div>
          </div>
        </div>
        
        <!-- Add cancellation notice -->
        <div class="cancellation-notice" v-if="canCancel">
          <p>You can cancel your order while it's still pending.</p>
          <button class="cancel-order-button" @click="cancelOrder">
            Cancel Order
          </button>
        </div>
        <div v-else>
          <p>Your order is being processed and cannot be cancelled.</p>
        </div>
        
        <div class="modal-actions">
          <button class="continue-button" @click="continueShopping">Continue Shopping</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { 
  ChevronLeft, 
  MapPin, 
  Minus, 
  Plus, 
  Truck, 
  Clock, 
  CheckCircle,
  X,
  Smartphone
} from 'lucide-vue-next';
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc,
  serverTimestamp,
  arrayUnion,
  runTransaction,
  deleteDoc,
  increment,
  query,
  where,
  getDocs,
  setDoc 
} from 'firebase/firestore';
import { db, auth } from '@/firebase/firebaseConfig';
import Notification from '@/components/Notification.vue';
import { getFunctions, httpsCallable } from 'firebase/functions';
import emailService from '@/services/emailService';

// Oriental Mindoro data from Register.vue
const orientalMindoroData = {
 "Baco": ["Alag", "Bangkatan", "Burbuli", "Catwiran I", "Catwiran II", "Dulangan I", "Dulangan II", "Lumangbayan", "Malapad", "Mangangan I", "Mangangan II", "Mayabig", "Pambisan", "Poblacion", "Pulang-Tubig", "Putican-Cabulo", "San Andres", "San Ignacio", "Santa Cruz", "Santa Rosa I", "Santa Rosa II", "Tabon-Tabon", "Tagumpay", "Water"],
  "Bansud": ["Alcate", "Bato", "Buenavista", "Burgos", "Cambunang", "Canaan", "Daguit", "Marfrancisco", "Pag-asa", "Poblacion", "Proper Bansud", "Proper Tiguisan", "Rosacara", "Salcedo", "Sumagui", "Villa Pag-asa"],
  "Bongabong": ["Anilao", "Aplaya", "Bagong Bayan I", "Bagong Bayan II", "Batangan", "Bukal", "Camantigue", "Carmen", "Cawayan", "Dayhagan", "Formon", "Hagan", "Hagupit", "Ilasan", "Kaligtasan", "Labasan", "Mag-asawang Tubig", "Malitbog", "Mapang", "Masaguisi", "Morente", "Ogbot", "Orconuma", "Poblacion", "Polusahi", "Sagana", "San Isidro", "San Jose", "San Juan", "Santa Cruz", "Sinanlaban", "Tawas", "Villa M. Principe"],
  "Bulalacao": ["Bagong Sikat", "Balatasan", "Benli", "Cabugao", "Cambunang", "Camilmil", "Giagan", "Maasin", "Maujao", "Milagrosa", "Nasukob", "Poblacion", "San Francisco", "San Isidro", "San Juan", "San Roque", "Siguian"],
  "Calapan": ["Balingayan", "Balite", "Baruyan", "Batino", "Bayanan I", "Bayanan II", "Bulusan", "Comunal", "Guinobatan", "Gutad", "Ibaba East", "Ibaba West", "Ilaya", "Lalud", "Lazareto", "Libis", "Lumangbayan", "Mahabang Parang", "Maidlang", "Malad", "Malamig", "Managpi", "Masipit", "Nag-Iba I", "Nag-Iba II", "Navotas", "Pachoca", "Palhi", "Panggalaan", "Parang", "Patas", "Puting Tubig", "San Antonio", "San Vicente Central", "San Vicente East", "San Vicente North", "San Vicente South", "San Vicente West", "Sta. Cruz", "Sta. Isabel", "Sta. Maria Village", "Sto. Niño", "Sapul", "Silonay", "Sta. Rita", "Sucol", "Suqui", "Tawagan", "Tawiran", "Tibag", "Wawa"],
  "Gloria": ["Agos", "Agustin", "Andres Bonifacio", "Balete", "Banus", "Banutan", "Buong Lupa", "Bulaklakan", "Gaudencio Antonio", "Guimbonan", "Kawit", "Lucio Laurel", "Macario Adriatico", "Malabo", "Maligaya", "Malubay", "Manguyang", "Maragooc", "Mirayan", "Narra", "Papandungin", "San Antonio", "Santa Maria", "Santo Niño", "Talaban", "Tambong", "Tigbao", "Villa Hermosa", "Villahermosa", "Villarico"],
  "Mansalay": ["B. Del Mundo", "Balugo", "Bonbon", "Budburan", "Cabdangan", "Caflanan", "Don Pedro", "Maliwanag", "Manaul", "Panaytayan", "Poblacion", "Roma", "Santa Brigida", "Santa Maria", "Villa Celestial", "Wasig"],
  "Naujan": ["Adrialuna", "Antipolo", "Apitong", "Arangin", "Aurora", "Bacungan", "Bagong Buhay", "Bancuro", "Barcenaga", "Bayani", "Buhangin", "Concepcion", "Dao", "Del Pilar", "Estrella", "Evangelista", "Gamao", "General Esco", "Herera", "Inarawan", "Kalinisan", "Laguna", "Andres Ilagan", "Mabini", "Andres Bonifacio", "Maharika", "Malaya", "Malinao", "Malvar", "Masagana", "Masaguing", "Melgar A", "Melgar B", "Metolza", "Montelago", "Montemayor", "Motoderazo", "Mulawin", "Nag-Iba I", "Nag-Iba II", "Pagkakaisa", "Paniquian", "Pinagsabangan I", "Pinagsabangan II", "Poblacion I", "Poblacion II", "Poblacion III", "Sampaguita", "San Agustin I", "San Agustin II", "San Andres", "San Antonio", "San Carlos", "San Isidro", "San Jose", "San Luis", "San Nicolas", "San Pedro", "Santa Cruz", "Santa Isabel", "Santa Maria", "Santiago", "Santo Niño", "Tagumpay", "Tigkan"],
  "Pinamalayan": ["Anoling", "Bacungan", "Bangbang", "Banus", "Buli", "Caguray", "Calingag", "Del Razon", "Guinhawa", "Inclanay", "Lumambayan", "Malaya", "Maliangcog", "Maningcol", "Marayos", "Marfrancisco", "Nabuslot", "Pagalagala", "Palayan", "Pambisan", "Panikihan", "Pili", "Quinabigan", "Ranzo", "Rosario", "Sabang", "Santa Isabel", "Santa Maria", "Santa Rita", "Santo Niño", "Wawa"],
  "Pola": ["Bacawan", "Bacungan", "Batuhan", "Bayanan", "Biga", "Buhay Na Tubig", "Calima", "Casiligan", "Malibago", "Maluanluan", "Matulatula", "Munting Mapino", "Pahilahan", "Panikihan", "Poblacion", "Pula", "Puting Cacao", "Tagbakin", "Tiguihan"],
  "Puerto Galera": ["Aninuan", "Balanoy", "Balatero", "Dulangan", "Palangan", "Sabang", "San Antonio", "San Isidro", "Santo Niño", "Tabinay", "Villaflor"],
  "Roxas": ["Bagumbayan", "Barangay I", "Barangay II", "Barangay III", "Barangay IV", "Barangay V", "Barangay VI", "Barangay VII", "Barangay VIII", "Barangay IX", "Barangay X", "Barangay XI", "Barangay XII", "Cantil", "Dangay", "Happy Valley", "Libertad", "Libtong", "Lumangbayan", "Malaga", "Maraska", "Odiong", "Paclasan", "San Aquilino", "San Isidro", "San Jose", "San Mariano", "San Miguel", "San Rafael", "San Vicente", "Sta. Cruz", "Sta. Elena", "Sta. Maria", "Sto. Niño", "Wawa"],
  "San Teodoro": ["Bigaan", "Caagutayan", "Calangatan", "Calsapa", "Ilag", "Lumangbayan", "Poblacion", "Tacligan"],
  "Socorro": ["Bato", "Bayuin", "Bugtong Na Tuog", "Calocmay", "Catiningan", "F. Tantoco", "Happy Valley", "Leuteboro", "Lumangbayan", "Matungao", "Monteverde", "Poblacion I", "Poblacion II", "Poblacion III", "Poblacion IV", "Poblacion V", "Poblacion VI", "Poblacion VII", "Poblacion VIII", "Santo Domingo", "Villaflor"],
  "Victoria": ["Alcate", "Antipolo", "Bacungan", "Bagong Buhay", "Bambanin", "Bethel", "Canaan", "Concepcion", "Duongan", "Loyal", "Mabini", "Macatoc", "Malabo", "Mercedes", "Ogbot", "Orion", "San Antonio", "San Cristobal", "San Gabriel", "San Gelacio", "San Isidro", "San Juan", "San Narciso", "Urdaneta"]
};

export default {
  components: {
    ChevronLeft,
    MapPin,
    Minus,
    Plus,
    Truck,
    Clock,
    CheckCircle,
    X,
    Notification,
    Smartphone
  },
  setup(props, { emit }) {
    const route = useRoute();
    const router = useRouter();
    
  // Initialize order data
  const orderItems = ref([]);
  const isBuyNow = ref(false);

  // Pre-order deposit defaults (can be overridden per product)
  const DEFAULT_DEPOSIT_PERCENT = 0.2; // 20%
  const MIN_DEPOSIT = 50; // PHP minimum deposit
    
    const canCancel = ref(true);
    
    // Delivery distance calculation
    const deliveryDistance = ref(0);
    const calculatingDelivery = ref(false);
    const deliveryError = ref('');
    
    // User registration address
    const userRegistrationAddress = ref('');
    
    // Validate seller delivery areas against user's delivery municipality
    const validateSellerDeliveryArea = async (sellerId, deliveryMunicipality) => {
      try {
        console.log(`🔍 Validating delivery area for seller ${sellerId} and municipality "${deliveryMunicipality}"`);
        
        // Get seller document
        const sellerDocRef = doc(db, 'sellers', sellerId);
        const sellerDoc = await getDoc(sellerDocRef);
        
        if (!sellerDoc.exists()) {
          console.error(`Seller document not found for ID: ${sellerId}`);
          return { isValid: false, reason: 'Seller not found' };
        }
        
        const sellerData = sellerDoc.data();
        const areasCovered = sellerData.deliveryInfo?.areasCovered || [];
        
        console.log('📍 Seller areas covered:', areasCovered);
        console.log('📍 Customer delivery municipality:', deliveryMunicipality);
        
        // Enhanced matching logic - check exact match and normalize text
        const normalizedDeliveryMunicipality = deliveryMunicipality.toLowerCase().trim();
        
        // Check if user's delivery municipality is in seller's covered areas
        const isValidArea = areasCovered.some(area => {
          const normalizedArea = area.toLowerCase().trim();
          
          // Exact match
          if (normalizedArea === normalizedDeliveryMunicipality) {
            console.log(`✅ Exact match found: "${area}" matches "${deliveryMunicipality}"`);
            return true;
          }
          
          // Handle common variations (e.g., "Calapan City" vs "Calapan")
          if (normalizedArea.includes(normalizedDeliveryMunicipality) || 
              normalizedDeliveryMunicipality.includes(normalizedArea)) {
            console.log(`✅ Partial match found: "${area}" matches "${deliveryMunicipality}"`);
            return true;
          }
          
          return false;
        });
        
        if (!isValidArea) {
          console.log(`❌ No match found for "${deliveryMunicipality}" in areas: [${areasCovered.join(', ')}]`);
          return {
            isValid: false,
            reason: `Seller does not deliver to ${deliveryMunicipality}`,
            areasCovered: areasCovered,
            farmName: sellerData.farmDetails?.farmName || 'Unknown Farm'
          };
        }
        
        console.log(`✅ Delivery area validation passed for "${deliveryMunicipality}"`);
        return { isValid: true };
        
      } catch (error) {
        console.error('Error validating seller delivery area:', error);
        return { isValid: false, reason: 'Error validating delivery area' };
      }
    };
    
    // Helper function to extract municipality from address string
    const extractMunicipalityFromAddress = (addressString) => {
      if (!addressString) return null;
      
      const knownMunicipalities = Object.keys(orientalMindoroData);
      
      // First, try comma-separated format
      const addressParts = addressString.split(',');
      if (addressParts.length >= 2) {
        const potentialMunicipality = addressParts[1].trim();
        
        // Check if it matches any known municipality
        for (const municipality of knownMunicipalities) {
          if (potentialMunicipality.toLowerCase().includes(municipality.toLowerCase()) ||
              municipality.toLowerCase().includes(potentialMunicipality.toLowerCase())) {
            return municipality;
          }
        }
      }
      
      // If comma separation doesn't work, search for any known municipality in the address
      for (const municipality of knownMunicipalities) {
        if (addressString.toLowerCase().includes(municipality.toLowerCase())) {
          return municipality;
        }
      }
      
      return null;
    };
    
    // Enhanced seller validation function
    const validateSellerExists = async (sellerId) => {
      try {
        console.log(`Validating seller existence for ID: ${sellerId}`);
        
        // First, try to get the seller document
        const sellerDocRef = doc(db, 'sellers', sellerId);
        const sellerDoc = await getDoc(sellerDocRef);
        
        if (sellerDoc.exists()) {
          const sellerData = sellerDoc.data();
          console.log('Seller found:', {
            id: sellerId,
            status: sellerData.status,
            farmName: sellerData.farmDetails?.farmName,
            hasAddress: !!sellerData.farmDetails?.farmAddress,
            userId: sellerData.userId || sellerData.uid, // This is the ID we need for Orders.vue
            note: 'Document ID vs User ID - Document ID is for validation, User ID is for orders'
          });
          
          return {
            exists: true,
            data: sellerData,
            hasAddress: !!sellerData.farmDetails?.farmAddress
          };
        } else {
          console.error(`Seller document not found for ID: ${sellerId}`);
          
          // Try to find seller in different possible collections or with different ID format
          const alternativeQueries = [
            query(collection(db, 'users'), where('role', '==', 'seller'), where('uid', '==', sellerId)),
            query(collection(db, 'sellers'), where('userId', '==', sellerId))
          ];
          
          for (const altQuery of alternativeQueries) {
            try {
              const querySnapshot = await getDocs(altQuery);
              if (!querySnapshot.empty) {
                const foundDoc = querySnapshot.docs[0];
                console.log('Found seller in alternative location:', foundDoc.id);
                return {
                  exists: true,
                  data: foundDoc.data(),
                  alternativeId: foundDoc.id,
                  hasAddress: !!foundDoc.data().farmDetails?.farmAddress
                };
              }
            } catch (error) {
              console.log('Alternative query failed:', error);
            }
          }
          
          return { exists: false };
        }
      } catch (error) {
        console.error('Error validating seller:', error);
        return { exists: false, error: error.message };
      }
    };    // Enhanced debug function
    const debugOrderItems = async () => {
      console.log('=== ENHANCED ORDER ITEMS DEBUG ===');
      
      for (let i = 0; i < orderItems.value.length; i++) {
        const item = orderItems.value[i];
        console.log(`Item ${i + 1}:`, {
          productId: item.productId,
          sellerId: item.sellerId,
          productName: item.productName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          unit: item.unit,
          totalPrice: item.totalPrice,
          calculatedTotal: (item.unitPrice * item.quantity),
          sellerIdType: typeof item.sellerId,
          sellerIdLength: item.sellerId?.length
        });
        
        // Validate each seller
        if (item.sellerId) {
          const validation = await validateSellerExists(item.sellerId);
          console.log(`Seller validation for ${item.sellerId}:`, validation);
          
          if (!validation.exists) {
            console.error(`❌ Seller ${item.sellerId} does not exist!`);
          } else {
            console.log(`✅ Seller ${item.sellerId} exists`);
          }
        } else {
          console.error(`❌ Item ${i + 1} has no sellerId!`);
        }
      }
      console.log('=== END ENHANCED DEBUG ===');
    };

    // Parse items from route query with enhanced validation
    onMounted(async () => {
      try {
        if (route.query.items) {
          const items = JSON.parse(route.query.items);
          
          // Validate all items have required fields
          const validatedItems = [];
          const invalidItems = [];
          
          for (const item of items) {
            if (!item.sellerId) {
              console.error('Item missing sellerId:', item);
              invalidItems.push(item.productName || item.productId || 'Unknown item');
              continue;
            }
            
            // Validate seller exists
            const sellerValidation = await validateSellerExists(item.sellerId);
            if (!sellerValidation.exists) {
              console.error('Seller does not exist for item:', item);
              invalidItems.push(`${item.productName || item.productId} (seller not found)`);
              continue;
            }
              const unitPrice = Number(item.unitPrice) || Number(item.price) || Number(item.pricePerKg) || 0;
              // Preserve orderType if provided from ProductDetails/Cart; fallback later if needed
              const orderType = typeof item.orderType === 'string' ? item.orderType : undefined;
            
            validatedItems.push({
              productId: item.productId,
              sellerId: sellerValidation.alternativeId || item.sellerId, // Use alternative ID if found
              productName: item.productName,
              productImage: item.productImage || item.image || 'https://via.placeholder.com/200',
              unitPrice: unitPrice,
              quantity: Number(item.quantity) || 1,
              unit: item.unit || item.packagingType || 'piece',
              totalPrice: unitPrice * (Number(item.quantity) || 1),
              cartItemId: item.cartItemId,
              orderType
            });
          }
          
          if (invalidItems.length > 0) {
            const errorMessage = `The following items have invalid seller information: ${invalidItems.join(', ')}. Please try adding them to cart again.`;
            showNotificationMessage(errorMessage, 'error');
            
            // If all items are invalid, redirect back
            if (validatedItems.length === 0) {
              setTimeout(() => router.push('/'), 3000);
              return;
            }
          }
          
          orderItems.value = validatedItems;
          isBuyNow.value = items[0]?.isBuyNow || false;
          
          // Debug the validated items
          await debugOrderItems();

          // Augment items with pre-order flags from product docs
          try {
            const productSnaps = await Promise.all(
              orderItems.value.map(it => getDoc(doc(db, 'products', it.productId)))
            );
            orderItems.value = orderItems.value.map((it, idx) => {
              const snap = productSnaps[idx];
              const pdata = snap?.exists() ? snap.data() : {};
              const isPreOrder = !!(pdata?.preOrders === true || pdata?.preOrder === true);
              const depositType = typeof pdata?.depositType === 'string' ? pdata.depositType : 'percent';
              const depositValue = typeof pdata?.depositValue === 'number' ? pdata.depositValue : DEFAULT_DEPOSIT_PERCENT;
              // Infer orderType if not provided
              let inferredType = it.orderType;
              if (!inferredType) {
                if (isPreOrder) inferredType = 'preorder';
                // Simple wholesale heuristic: check for wholesale flags/fields on product
                else if (pdata?.wholesaleAvailable === true || Number(pdata?.wholesalePrice) > 0) inferredType = 'wholesale';
                else inferredType = 'normal';
              }
              return { ...it, isPreOrder, depositType, depositValue, orderType: inferredType };
            });
          } catch (augmentErr) {
            console.warn('Pre-order flag augmentation skipped:', augmentErr?.message || augmentErr);
          }
        }
      } catch (error) {
        console.error('Error parsing order items:', error);
        showNotificationMessage(error.message || 'Error loading order items', 'error');
        router.push('/');
      }
      
      fetchUserAddresses();
    });

    const startCountdown = () => {
      countdownInterval.value = setInterval(() => {
        countdown.value -= 1;
        if (countdown.value <= 0) {
          clearInterval(countdownInterval.value);
          canCancel.value = false;
        }
      }, 1000);
    };

    // Notification state
    const showNotification = ref(false);
    const notificationMessage = ref('');
    const notificationType = ref('success');
    let notificationTimeout = null;
    
    // Order number for success modal
    const orderNumber = ref('');
    const multipleOrderCodes = ref([]); // Store all order codes for multi-seller orders
    
    // Address data
    const addresses = ref([]);
    const selectedAddressIndex = ref(-1); // Start with registration address (-1)
    const selectedAddress = computed(() => {
      if (selectedAddressIndex.value === -1) {
        // Return registration address
        return {
          name: 'Registration Address',
          address: userRegistrationAddress.value,
          isRegistrationAddress: true
        };
      }
      return addresses.value[selectedAddressIndex.value];
    });
    const showAddressModal = ref(false);
    const showNewAddressForm = ref(false);
    const loadingAddresses = ref(false);
    
    // Location data
    const municipalities = ref(Object.keys(orientalMindoroData));
    const barangays = ref([]);
    
    const newAddress = ref({
      name: '',
      province: 'Oriental Mindoro',
      municipality: '',
      barangay: '',
      locationNotes: ''
    });
    
    // Payment data
    const paymentMethod = ref('gcash');
    const gcashDetails = ref({ number: '' });
    const saveGcash = ref(false);
    
    // Delivery options
    const deliveryOption = ref('standard');
      // Order success
    const showSuccessModal = ref(false);
    
    // Email sending state
    const sendingEmail = ref(false);
    
    // Helper function to get address display
    const getAddressDisplay = (address) => {
      if (address.isRegistrationAddress) {
        return address.address;
      }
      return `${address.barangay}, ${address.municipality}, ${address.province}`;
    };
    
    // Distance calculation functions
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Radius of the Earth in kilometers
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c; // Distance in kilometers
      return distance;
    };

    const geocodeAddress = async (address) => {
      try {
        // Try multiple geocoding strategies for Philippine addresses
        const strategies = [
          // Strategy 1: Full address with Philippines
          `${address}, Philippines`,
          // Strategy 2: Just the municipality and province
          address.includes(',') ? address.split(',').slice(-2).join(',') + ', Philippines' : `${address}, Philippines`,
          // Strategy 3: Just the province
          'Oriental Mindoro, Philippines'
        ];

        for (const searchAddress of strategies) {
          try {
            const encodedAddress = encodeURIComponent(searchAddress);
            const response = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=ph`
            );
            const data = await response.json();
            
            if (data && data.length > 0) {
              console.log(`Geocoding successful for: ${searchAddress}`);
              return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
              };
            }
          } catch (error) {
            console.log(`Geocoding strategy failed for: ${searchAddress}`);
            continue;
          }
        }
        
        // If all strategies fail, return approximate coordinates for Oriental Mindoro
        console.log('Using fallback coordinates for Oriental Mindoro');
        return {
          lat: 13.4077, // Approximate center of Oriental Mindoro
          lng: 121.1791
        };
      } catch (error) {
        console.error('Geocoding error:', error);
        // Return fallback coordinates
        return {
          lat: 13.4077,
          lng: 121.1791
        };
      }
    };

    const calculateDeliveryDistance = async () => {
      if (!selectedAddress.value || !orderItems.value.length) {
        console.log('No address or items selected');
        return;
      }

      calculatingDelivery.value = true;
      deliveryError.value = '';

      try {
        // Get seller information from the first item
        const sellerId = orderItems.value[0].sellerId;
        console.log('=== DELIVERY CALCULATION DEBUG ===');
        console.log('Calculating delivery for seller ID:', sellerId);
        
        if (!sellerId) {
          throw new Error('Seller ID is missing from order items');
        }
        
        // Validate seller exists first
        const sellerValidation = await validateSellerExists(sellerId);
        if (!sellerValidation.exists) {
          console.error('Seller validation failed:', sellerValidation);
          deliveryDistance.value = 15; // Default 15km for reasonable calculation
          deliveryError.value = 'Seller information not available. Using estimated delivery rates.';
          return;
        }
        
        const sellerData = sellerValidation.data;
        console.log('Seller data retrieved for delivery calculation');
        
        // Check if farmDetails exists and has farmAddress
        if (!sellerData.farmDetails?.farmAddress) {
          console.warn('Farm address not available in seller data');
          deliveryDistance.value = 12; // Default 12km
          deliveryError.value = 'Farm address not available. Using estimated delivery rates.';
          return;
        }
        
        const farmAddress = sellerData.farmDetails.farmAddress;
        console.log('Farm address found:', farmAddress);

        // Create full addresses for geocoding
        let customerAddress;
        if (selectedAddress.value.isRegistrationAddress) {
          customerAddress = userRegistrationAddress.value;
        } else {
          customerAddress = `${selectedAddress.value.barangay}, ${selectedAddress.value.municipality}, ${selectedAddress.value.province}`;
        }
        
        console.log('Geocoding addresses...');
        console.log('Customer Address:', customerAddress);
        console.log('Seller Address:', farmAddress);

        // Geocode both addresses with improved error handling
        try {
          const [customerCoords, sellerCoords] = await Promise.all([
            geocodeAddress(customerAddress),
            geocodeAddress(farmAddress)
          ]);

          console.log('Geocoding successful:');
          console.log('Customer Coords:', customerCoords);
          console.log('Seller Coords:', sellerCoords);

          // Calculate distance
          const distance = calculateDistance(
            sellerCoords.lat,
            sellerCoords.lng,
            customerCoords.lat,
            customerCoords.lng
          );

          deliveryDistance.value = Math.max(distance, 1); // Minimum 1km
          console.log('Calculated Distance:', deliveryDistance.value, 'km');
          
          // If distance is very small (same area), set a reasonable minimum
          if (deliveryDistance.value < 5) {
            deliveryDistance.value = 8; // Minimum 8km for local delivery
          }
          
          console.log('Final Distance:', deliveryDistance.value.toFixed(1), 'km');
          console.log('=== END DELIVERY CALCULATION DEBUG ===');
        } catch (geocodingError) {
          console.warn('Geocoding failed, using estimated distance:', geocodingError);
          deliveryDistance.value = 10; // Default 10km
          deliveryError.value = 'Using estimated delivery rates based on location.';
        }
        
      } catch (error) {
        console.error('Error calculating delivery distance:', error);
        
        // Set reasonable default values instead of showing error
        deliveryDistance.value = 10; // Default 10km for reasonable delivery calculation
        deliveryError.value = 'Using estimated delivery rates. Exact distance calculation unavailable.';
      } finally {
        calculatingDelivery.value = false;
      }
    };

    // Watch for address changes to recalculate delivery
    watch(selectedAddress, () => {
      if (selectedAddress.value) {
        calculateDeliveryDistance();
      }
    });

    // Address change handler
    const onAddressChange = () => {
      calculateDeliveryDistance();
    };

    // Delivery fee calculations based on distance
    const standardDeliveryFee = computed(() => {
      if (deliveryDistance.value > 0) {
        // 8 pesos per kilometer for standard delivery, minimum 60 pesos
        const fee = Math.max(deliveryDistance.value * 8, 60);
        return Math.round(fee); // Round to whole number
      }
      return 80; // Default fallback increased from 50
    });

    const expressDeliveryFee = computed(() => {
      if (deliveryDistance.value > 0) {
        // 12 pesos per kilometer for express delivery, minimum 100 pesos
        const fee = Math.max(deliveryDistance.value * 12, 100);
        return Math.round(fee); // Round to whole number
      }
      return 200; // Default fallback increased from 120
    });
    
    // Helper function to generate order code
    const generateOrderCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const randomLetter = chars.charAt(Math.floor(Math.random() * chars.length));
      const randomNumber = Math.floor(100000 + Math.random() * 900000);
      return `${randomLetter}${randomNumber}`;
    };

    // Quantity control methods
    const increaseQuantity = (item) => {
      item.quantity = (parseInt(item.quantity) || 0) + 1;
      item.totalPrice = (item.unitPrice || 0) * item.quantity;
    };

    const decreaseQuantity = (item) => {
      const currentQuantity = parseInt(item.quantity) || 0;
      if (currentQuantity > 1) {
        item.quantity = currentQuantity - 1;
        item.totalPrice = (item.unitPrice || 0) * item.quantity;
      }
    };

    const placeholderImage = 'https://via.placeholder.com/150';
    
    // Update barangays when municipality changes
    const updateBarangays = () => {
      barangays.value = orientalMindoroData[newAddress.value.municipality] || [];
      newAddress.value.barangay = '';
    };
    
    const fetchUserAddresses = async () => {
      try {
        if (!auth.currentUser) {
          showNotificationMessage('Please sign in to manage addresses', 'error');
          return;
        }
        
        loadingAddresses.value = true;
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          addresses.value = userData.addresses || [];
          
          // Get the registration address
          userRegistrationAddress.value = userData.address || '';
          
          // Calculate delivery distance for the default selected address (registration address)
          if (userRegistrationAddress.value) {
            calculateDeliveryDistance();
          }
        } else {
          await setDoc(userDocRef, { addresses: [] });
          addresses.value = [];
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
        showNotificationMessage('Failed to load addresses', 'error');
      } finally {
        loadingAddresses.value = false;
      }
    };
    
    // Save new address to user's addresses in Firestore
    const saveNewAddress = async () => {
      if (!newAddress.value.name || !newAddress.value.municipality || !newAddress.value.barangay) {
        showNotificationMessage('Please fill in all required fields', 'error');
        return;
      }
      
      try {
        if (!auth.currentUser) throw new Error('User not authenticated');
        
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const newAddressData = {
          name: newAddress.value.name,
          province: newAddress.value.province,
          municipality: newAddress.value.municipality,
          barangay: newAddress.value.barangay,
          locationNotes: newAddress.value.locationNotes || '',
          address: `${newAddress.value.barangay}, ${newAddress.value.municipality}, ${newAddress.value.province}`
        };
        
        await updateDoc(userDocRef, {
          addresses: arrayUnion(newAddressData)
        });
        
        await fetchUserAddresses();
        selectedAddressIndex.value = addresses.value.length - 1;
        resetNewAddressForm();
        showNotificationMessage('Address added successfully');
      } catch (error) {
        console.error('Error saving address:', error);
        showNotificationMessage('Failed to save address', 'error');
      }
    };

    const resetNewAddressForm = () => {
      newAddress.value = {
        name: '',
        province: 'Oriental Mindoro',
        municipality: '',
        barangay: '',
        locationNotes: ''
      };
      showNewAddressForm.value = false;
    };

    const cancelNewAddress = () => {
      resetNewAddressForm();
    };

    const confirmAddress = () => {
      showAddressModal.value = false;
    };

    // Show notification function
    const showNotificationMessage = (message, type = 'success') => {
      notificationMessage.value = message;
      notificationType.value = type;
      showNotification.value = true;
      
      clearTimeout(notificationTimeout);
      notificationTimeout = setTimeout(() => {
        showNotification.value = false;
      }, 5000);
    };

    // Calculations for multiple items
    const subtotal = computed(() => {
      const sum = orderItems.value.reduce((total, item) => {
        const price = Number(item.unitPrice) || 0;
        const quantity = Number(item.quantity) || 0;
        return total + (price * quantity);
      }, 0);
      return parseFloat(sum.toFixed(2));
    });
    
    const deliveryFee = computed(() => {
      if (paymentMethod.value === 'pickup') return 0;
      const fee = deliveryOption.value === 'standard' ? standardDeliveryFee.value : expressDeliveryFee.value;
      return Math.round(fee); // Ensure it's a whole number
    });
    
    const tax = computed(() => {
      const taxAmount = subtotal.value * 0.08;
      return parseFloat(taxAmount.toFixed(2));
    });
    
    const total = computed(() => {
      const totalAmount = subtotal.value + deliveryFee.value + tax.value;
      return Math.round(totalAmount * 100) / 100; // Round to exactly 2 decimal places
    });

    // Pre-order helpers and totals
    const hasPreOrderItems = computed(() => orderItems.value.some(i => i.isPreOrder));
    const hasMixedPreOrder = computed(() => hasPreOrderItems.value && orderItems.value.some(i => !i.isPreOrder));
    const computeItemDeposit = (item) => {
      if (!item?.isPreOrder) return 0;
      const itemTotal = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0);
      if (item.depositType === 'fixed') {
        return Math.max(Number(item.depositValue) || 0, MIN_DEPOSIT);
      }
      const pct = typeof item.depositValue === 'number' ? item.depositValue : DEFAULT_DEPOSIT_PERCENT;
      return Math.max(Math.round(itemTotal * pct), MIN_DEPOSIT);
    };
    const depositTotal = computed(() => orderItems.value.reduce((sum, it) => sum + computeItemDeposit(it), 0));
    const totalDueNow = computed(() => (hasPreOrderItems.value && !hasMixedPreOrder.value) ? depositTotal.value : total.value);

    // Enhanced place order function with better validation
    const functions = getFunctions();
    const createGcashPayment = httpsCallable(functions, 'createGcashPayment');

    const placeOrder = async () => {
      // Enhanced validation checks
      if (!selectedAddress.value) {
        showNotificationMessage('Please select a delivery address', 'error');
        return;
      }
      
      if (calculatingDelivery.value) {
        showNotificationMessage('Please wait for delivery calculation to complete', 'error');
        return;
      }
      
      // Block mixed carts (pre-order + regular) to simplify deposit handling
      if (hasMixedPreOrder.value) {
        showNotificationMessage('Please checkout pre-order items separately from regular items so we can collect the deposit correctly.', 'error');
        return;
      }

      // Enforce GCash for pre-orders
      if (hasPreOrderItems.value && paymentMethod.value !== 'gcash') {
        showNotificationMessage('Pre-order requires an initial payment via GCash. Please select GCash.', 'error');
        return;
      }

      if (paymentMethod.value === 'gcash' && !gcashDetails.value.number) {
        showNotificationMessage('Please enter your GCash number', 'error');
        return;
      }

      // Enhanced validation for all order items
      console.log('🔍 STARTING DELIVERY AREA VALIDATION FOR ALL ITEMS');
      
      for (const item of orderItems.value) {
        if (!item.productId) {
          showNotificationMessage(`Product ID missing for ${item.productName || 'an item'}`, 'error');
          return;
        }
        if (!item.sellerId) {
          showNotificationMessage(`Seller information missing for ${item.productName || 'an item'}. Please try adding to cart again.`, 'error');
          return;
        }
        if (!item.quantity || item.quantity <= 0) {
          showNotificationMessage(`Invalid quantity for ${item.productName || 'an item'}`, 'error');
          return;
        }
        if (!item.unitPrice || item.unitPrice <= 0) {
          showNotificationMessage(`Invalid price for ${item.productName || 'an item'}`, 'error');
          return;
        }
        
        // Validate seller exists before proceeding
        const sellerValidation = await validateSellerExists(item.sellerId);
        if (!sellerValidation.exists) {
          showNotificationMessage(`Seller for ${item.productName || 'an item'} is no longer available. Please refresh and try again.`, 'error');
          return;
        }
        
        // ✅ CRITICAL: DELIVERY AREA VALIDATION - Check specific selected delivery address
        // This validation ensures the customer's selected delivery municipality matches
        // the seller's covered delivery areas EXACTLY
        let deliveryMunicipality = null;
        
        if (selectedAddress.value.isRegistrationAddress) {
          // For registration address, extract municipality from the address string
          deliveryMunicipality = extractMunicipalityFromAddress(userRegistrationAddress.value);
          
          if (!deliveryMunicipality) {
            showNotificationMessage('Could not determine your municipality from registration address. Please add a specific delivery address with complete municipality information.', 'error');
            return;
          }
        } else {
          // For selected address, use the specific municipality - THIS IS THE KEY VALIDATION
          deliveryMunicipality = selectedAddress.value.municipality;
        }
        
        console.log('=== DELIVERY VALIDATION DEBUG ===');
        console.log('Selected address:', selectedAddress.value);
        console.log('Is registration address:', selectedAddress.value.isRegistrationAddress);
        console.log('Final delivery municipality:', deliveryMunicipality);
        console.log('Item seller ID:', item.sellerId);
        console.log('Item product name:', item.productName);
        
        if (deliveryMunicipality) {
          const deliveryValidation = await validateSellerDeliveryArea(item.sellerId, deliveryMunicipality);
          console.log('Delivery validation result:', deliveryValidation);
          
          if (!deliveryValidation.isValid) {
            const farmName = deliveryValidation.farmName || 'Unknown Farm';
            let errorMessage = `🚫 Cannot place order!\n\n${farmName} does not deliver to ${deliveryMunicipality}.`;
            
            if (deliveryValidation.areasCovered && deliveryValidation.areasCovered.length > 0) {
              errorMessage += `\n\n📍 Available delivery areas:\n${deliveryValidation.areasCovered.join(', ')}.`;
              errorMessage += `\n\n💡 Solution: Change your delivery address to one of the available areas above.`;
            }
            
            console.log('🛑 DELIVERY VALIDATION FAILED - BLOCKING ORDER');
            console.log('Expected municipality:', deliveryMunicipality);
            console.log('Seller areas covered:', deliveryValidation.areasCovered);
            
            showNotificationMessage(errorMessage, 'error');
            return;
          } else {
            console.log(`✅ Delivery validation passed for ${deliveryMunicipality}`);
          }
        } else {
          console.log('🛑 NO DELIVERY MUNICIPALITY FOUND - BLOCKING ORDER');
          showNotificationMessage('Could not determine your delivery municipality. Please select a complete address with municipality information.', 'error');
          return;
        }
      }
      
      console.log('✅ ALL DELIVERY AREA VALIDATIONS PASSED - PROCEEDING WITH ORDER');
      
      try {
        if (!auth.currentUser) throw new Error('User not authenticated');

        // Group items by seller for separate payments
        const itemsBySeller = {};
        orderItems.value.forEach(item => {
          const sellerId = item.sellerId;
          if (!itemsBySeller[sellerId]) {
            itemsBySeller[sellerId] = [];
          }
          itemsBySeller[sellerId].push(item);
        });

        console.log('=== GROUPED ITEMS BY SELLER ===');
        console.log('Number of different sellers:', Object.keys(itemsBySeller).length);
        Object.keys(itemsBySeller).forEach(sellerId => {
          console.log(`Seller ${sellerId}: ${itemsBySeller[sellerId].length} items`);
        });

        // Handle multiple sellers by creating separate orders for each seller
        const sellerIds = Object.keys(itemsBySeller);
        console.log(`Processing orders for ${sellerIds.length} seller(s)`);
        
        // If multiple sellers, show informative message
        if (sellerIds.length > 1) {
          showNotificationMessage(
            `Processing ${sellerIds.length} separate orders for different sellers. Each seller will receive their own order.`,
            'info'
          );
        }

  // Process orders for each seller separately
        const allOrderCodes = [];
        const successfulOrders = [];
        
        // Get user data
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const username = userData.username || '';
        const email = userData.email || '';

        // Collect cart items to delete (if not buy now)
        const cartItemsToDelete = [];
        if (!isBuyNow.value) {
          orderItems.value.forEach(item => {
            if (item.cartItemId) {
              cartItemsToDelete.push(item.cartItemId);
            }
          });
        }
        
        // Generate a single group code to link all seller orders in this checkout
        const groupOrderCode = generateOrderCode();

        for (const sellerId of sellerIds) {
          const sellerItems = itemsBySeller[sellerId];
          const orderCode = generateOrderCode();
          allOrderCodes.push(orderCode);
          
          console.log(`Processing order ${orderCode} for seller ${sellerId} with ${sellerItems.length} items`);
          
          try {
            // PHASE 1: VALIDATION - Check products exist for this seller
            const productPromises = sellerItems.map(item => 
              getDoc(doc(db, 'products', item.productId))
            );
            const productSnapshots = await Promise.all(productPromises);

            // Verify products exist
            for (let i = 0; i < sellerItems.length; i++) {
              const item = sellerItems[i];
              const productDoc = productSnapshots[i];
              
              if (!productDoc.exists()) {
                throw new Error(`Product ${item.productName || item.productId} not found`);
              }
            }
            
            console.log(`✅ Products validated for seller ${sellerId}`);

            // PHASE 2: TRANSACTION - Create order for this seller
            await runTransaction(db, async (transaction) => {
              // Process each item for this seller
              for (let i = 0; i < sellerItems.length; i++) {
                const item = sellerItems[i];
                const productData = productSnapshots[i].data();

                // Calculate all price components
                const itemPrice = item.unitPrice * item.quantity;
                const deliveryFeeValue = paymentMethod.value !== 'pickup' ? deliveryFee.value : 0;
                const taxValue = itemPrice * 0.08; // 8% tax
                const totalPrice = itemPrice + deliveryFeeValue + taxValue;

                // Prepare location data based on address type
                let locationData;
                if (selectedAddress.value.isRegistrationAddress) {
                  locationData = {
                    address: userRegistrationAddress.value,
                    notes: 'Registration Address'
                  };
                } else {
                  locationData = {
                    province: selectedAddress.value.province,
                    municipality: selectedAddress.value.municipality,
                    barangay: selectedAddress.value.barangay,
                    address: `${selectedAddress.value.barangay}, ${selectedAddress.value.municipality}, ${selectedAddress.value.province}`,
                    notes: selectedAddress.value.locationNotes || ''
                  };
                }

                // Pre-order deposit computation
                const productIsPreOrder = !!(productData?.preOrders === true || productData?.preOrder === true);
                const prodDepositType = typeof productData?.depositType === 'string' ? productData.depositType : 'percent';
                const prodDepositValue = typeof productData?.depositValue === 'number' ? productData.depositValue : DEFAULT_DEPOSIT_PERCENT;
                const depositAmount = productIsPreOrder
                  ? (prodDepositType === 'fixed' ? Math.max(Number(prodDepositValue) || 0, MIN_DEPOSIT) : Math.max(Math.round(itemPrice * (prodDepositValue || DEFAULT_DEPOSIT_PERCENT)), MIN_DEPOSIT))
                  : 0;

                // Create order document with complete financial information
                const orderRef = doc(collection(db, 'orders'));
                
                console.log(`🔍 Creating order for seller:`, {
                  sellerId: item.sellerId,
                  sellerIdType: typeof item.sellerId,
                  productId: item.productId,
                  productName: item.productName,
                  orderCode: orderCode
                });
                
                transaction.set(orderRef, {
                  orderCode: orderCode,
                  groupOrderCode: groupOrderCode,
                  sellerId: item.sellerId, // ✅ SELLER DOCUMENT ID (for seller identification)
                  productId: item.productId,
                  productName: item.productName,
                  productImage: item.productImage || placeholderImage,
                  unitPrice: item.unitPrice,
                  quantity: item.quantity,
                  unit: item.unit,
                  // Explicit order type for seller visibility
                  orderType: item.orderType || (productIsPreOrder ? 'preorder' : 'normal'),
                  itemPrice: itemPrice,
                  paymentMethod: paymentMethod.value,
                  gcashNumber: paymentMethod.value === 'gcash' ? gcashDetails.value.number : null,
                  deliveryOption: paymentMethod.value !== 'pickup' ? deliveryOption.value : null,
                  deliveryFee: deliveryFeeValue,
                  deliveryDistance: deliveryDistance.value || 0,
                  estimatedDeliveryHours: deliveryOption.value === 'express' ? 24 : 48,
                  tax: taxValue,
                  totalPrice: totalPrice,
                  Location: locationData,
                  status: 'Pending', // Explicitly set to Pending
                  payStatus: 'unpaid',
                  paymentStatus: 'unpaid',
                  // Pre-order fields
                  isPreOrder: productIsPreOrder,
                  depositRequired: productIsPreOrder,
                  depositType: prodDepositType,
                  depositValue: prodDepositValue,
                  depositAmount: depositAmount,
                  depositStatus: productIsPreOrder ? 'unpaid' : null,
                  createdAt: serverTimestamp(),
                  lastUpdated: serverTimestamp(),
                  userId: auth.currentUser.uid,
                  username: username,
                  isBuyNow: isBuyNow.value,
                  refundId: null,
                  refundrequestdAt: null,
                  sellerContact: null, // Will be populated later if needed
                  // Multi-seller order metadata
                  isMultiSellerOrder: sellerIds.length > 1,
                  totalSellersCount: sellerIds.length,
                  relatedOrderCodes: allOrderCodes.filter(code => code !== orderCode) // Other order codes for this customer
                });

                // Create sale record with accurate financial data
                const saleRef = doc(collection(db, 'sales'));
                transaction.set(saleRef, {
                  productId: item.productId,
                  productName: item.productName,
                  category: productData.category || 'uncategorized',
                  quantity: item.quantity,
                  unit: item.unit,
                  price: item.unitPrice,
                  totalPrice: itemPrice,
                  timestamp: serverTimestamp(),
                  sellerId: item.sellerId, // ✅ SELLER DOCUMENT ID (for seller identification)
                  season: getCurrentSeason(),
                  orderCode: orderCode,
                  groupOrderCode: groupOrderCode,
                  isBuyNow: isBuyNow.value,
                  paymentStatus: 'unpaid',
                  // Pre-order fields
                  isPreOrder: productIsPreOrder,
                  depositAmount: depositAmount,
                  depositStatus: productIsPreOrder ? 'unpaid' : null,
                  // Order type for reporting
                  orderType: item.orderType || (productIsPreOrder ? 'preorder' : 'normal'),
                  // Multi-seller order metadata
                  isMultiSellerOrder: sellerIds.length > 1,
                  totalSellersCount: sellerIds.length
                });
              }
            });

            successfulOrders.push({
              sellerId: sellerId,
              orderCode: orderCode,
              itemCount: sellerItems.length
            });
            
            console.log(`✅ Order ${orderCode} created successfully for seller ${sellerId}`);
            
          } catch (error) {
            console.error(`❌ Failed to create order for seller ${sellerId}:`, error);
            throw new Error(`Failed to create order for seller ${sellerId}: ${error.message}`);
          }
        }
        
        console.log('=== ALL ORDERS CREATED SUCCESSFULLY ===');
        console.log(`Total orders created: ${successfulOrders.length}`);
        successfulOrders.forEach(order => {
          console.log(`Order ${order.orderCode}: Seller ${order.sellerId} (${order.itemCount} items)`);
        });

  // Set the primary order number for success modal/group tracking
  orderNumber.value = groupOrderCode;
        multipleOrderCodes.value = allOrderCodes;

        // PHASE 3: CLEANUP - Update cart items status after successful transaction
        if (!isBuyNow.value && cartItemsToDelete.length > 0) {
          try {
            console.log('=== UPDATING CART STATUS ===');
            console.log(`Cart items to update: ${cartItemsToDelete.length}`);
            console.log('Cart item IDs:', cartItemsToDelete);
            
            const updatePromises = cartItemsToDelete.map(cartItemId => {
              console.log(`Updating cart item ${cartItemId} to purchased status`);
              return updateDoc(doc(db, 'carts', cartItemId), { cartStatus: true });
            });
            
            await Promise.all(updatePromises);
            console.log(`✅ Successfully updated ${cartItemsToDelete.length} cart items to purchased status`);
          } catch (error) {
            console.error('❌ Error updating cart items status:', error);
            // Non-critical error, doesn't affect order success
          }
        } else {
          console.log('=== CART STATUS UPDATE SKIPPED ===');
          console.log(`isBuyNow: ${isBuyNow.value}, cartItemsToDelete.length: ${cartItemsToDelete.length}`);
        }

        // PHASE 4: Handle Payment
        if (paymentMethod.value === 'gcash') {
          try {
            const amountToCharge = totalDueNow.value;
            const isDeposit = hasPreOrderItems.value && !hasMixedPreOrder.value;
            console.log('Creating GCash payment with:', {
              amount: amountToCharge,
              orderCode: groupOrderCode,
              customerName: username,
              customerEmail: email
            });

            let paymentResult;
            
            // Try Firebase Callable function first
            try {
              paymentResult = await createGcashPayment({
                amount: amountToCharge,
                orderCode: groupOrderCode,
                customerName: username,
                customerEmail: email,
                bypassAuth: true, // Temporary bypass for authentication issues
                paymentType: isDeposit ? 'preorder_deposit' : 'full_payment',
                metadata: { type: isDeposit ? 'preorder_deposit' : 'full_payment' }
              });
              console.log('Callable function success:', paymentResult);
            } catch (callableError) {
              console.warn('Callable function failed, trying HTTP endpoint:', callableError);
              
              // Try the new public GCash payment endpoint
              try {
        const response = await fetch('https://us-central1-farmxpress-965bb.cloudfunctions.net/createGcashPaymentPublic', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
          amount: amountToCharge,
                    orderCode: groupOrderCode,
                    customerName: username,
          customerEmail: email,
          paymentType: isDeposit ? 'preorder_deposit' : 'full_payment',
          metadata: { type: isDeposit ? 'preorder_deposit' : 'full_payment' },
                    items: orderItems.value.map(item => ({
                      name: item.productName,
                      quantity: item.quantity,
                      price: item.unitPrice,
                      category: 'Agricultural Product'
                    }))
                  })
                });

                if (!response.ok) {
                  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const httpResult = await response.json();
                paymentResult = { data: httpResult };
                console.log('Public GCash endpoint success:', paymentResult);
              } catch (publicError) {
                console.warn('Public GCash endpoint failed, trying test endpoint:', publicError);
                
                // Final fallback to test endpoint
        const response = await fetch('https://us-central1-farmxpress-965bb.cloudfunctions.net/testGcashPayment', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
          amount: amountToCharge,
                    orderCode: groupOrderCode,
                    customerName: username,
                    customerEmail: email
                  })
                });

                if (!response.ok) {
                  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const httpResult = await response.json();
                paymentResult = { data: httpResult };
                console.log('Test endpoint fallback success:', paymentResult);
              }
            }

            console.log('GCash payment result:', paymentResult);

            // Check if payment creation was successful
            if (paymentResult.data && paymentResult.data.success && paymentResult.data.paymentUrl) {
              // Check if it's development mode
              if (paymentResult.data.isDevelopmentMode) {
                // Show development mode message
                showNotificationMessage('🧪 Development Mode: Payment simulation ready!', 'info');
                
                // Give user option to simulate payment or proceed to demo page
                const userChoice = confirm(
                  `🧪 DEVELOPMENT MODE\n\n` +
                  `This is a payment simulation. Choose:\n\n` +
                  `• OK: Simulate successful payment and stay here\n` +
                  `• Cancel: Go to demo payment page\n\n` +
      `Order: ${groupOrderCode}\nAmount: ₱${amountToCharge}`
                );
                
                if (userChoice) {
                  // Simulate successful payment by calling the function again with simulate flag
                  try {
                    const simulateResponse = await fetch('https://us-central1-farmxpress-965bb.cloudfunctions.net/createGcashPaymentPublic', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
        amount: amountToCharge,
        orderCode: groupOrderCode,
                        customerName: username,
                        customerEmail: email,
        simulate: true,
        paymentType: isDeposit ? 'preorder_deposit' : 'full_payment',
        metadata: { type: isDeposit ? 'preorder_deposit' : 'full_payment' },
                        items: orderItems.value.map(item => ({
                          name: item.productName,
                          quantity: item.quantity,
                          price: item.unitPrice,
                          category: 'Agricultural Product'
                        }))
                      })
                    });

                    const simulateResult = await simulateResponse.json();
                    if (simulateResult.success && simulateResult.isSimulated) {
                      showNotificationMessage('✅ Payment simulation successful! Order has been placed.', 'success');
                      showSuccessModal.value = true;
                      canCancel.value = true;
                      return;
                    } else {
                      throw new Error('Simulation failed');
                    }
                  } catch (simError) {
                    console.error('Simulation error:', simError);
                    // Fallback to success modal anyway for demo
                    showNotificationMessage('✅ Payment simulation successful! Order has been placed.', 'success');
                    showSuccessModal.value = true;
                    canCancel.value = true;
                    return;
                  }
                } else {
                  // Redirect to demo page
                  showNotificationMessage('Redirecting to payment demo...', 'info');
                  setTimeout(() => {
                    window.location.href = paymentResult.data.paymentUrl;
                  }, 1000);
                  return;
                }
              } else {
                // Production mode - redirect to real Xendit
                showNotificationMessage('Redirecting to GCash payment...', 'info');
                setTimeout(() => {
                  window.location.href = paymentResult.data.paymentUrl;
                }, 1000);
                return;
              }
            } else {
              throw new Error('Invalid payment response from server');
            }
          } catch (error) {
            console.error('Error creating GCash payment:', error);
            let errorMessage = 'Failed to create GCash payment. Please try again.';
            
            if (error.message) {
              if (error.message.includes('CORS')) {
                errorMessage = 'Network error. Please check your internet connection and try again.';
              } else if (error.message.includes('unauthenticated')) {
                errorMessage = 'Please sign in again and try your order.';
              } else if (error.message.includes('invalid-argument')) {
                errorMessage = 'Invalid order information. Please refresh and try again.';
              } else {
                errorMessage = `Payment Error: ${error.message}`;
              }
            }
            
            showNotificationMessage(errorMessage, 'error');
            return;
          }
        }
        
        // PHASE 4: SEND EMAIL CONFIRMATION (for Cash on Delivery)
        try {
          sendingEmail.value = true;
          
          // Prepare email data
          const emailData = {
            customerEmail: email,
            customerName: username || 'Valued Customer',
            orderCode: orderCode,
            orderDate: new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            deliveryAddress: getAddressDisplay(selectedAddress.value),
            paymentMethod: paymentMethod.value === 'gcash' ? 'GCash' : 'Cash on Delivery',
            deliveryOption: deliveryOption.value === 'express' ? 'Express Delivery (24 hours)' : 'Standard Delivery (2-3 days)',
            items: orderItems.value.map(item => ({
              productName: item.productName,
              quantity: item.quantity,
              unit: item.unit,
              totalPrice: ((item.unitPrice || item.price || 0) * item.quantity).toFixed(2)
            })),
            subtotal: subtotal.value.toFixed(2),
            deliveryFee: (paymentMethod.value !== 'pickup' ? deliveryFee.value : 0).toFixed(2),
            tax: tax.value.toFixed(2),
            total: total.value.toFixed(2),
            estimatedDelivery: emailService.calculateEstimatedDelivery(deliveryOption.value)
          };

          const emailResult = await emailService.sendOrderConfirmation(emailData);
          
          if (emailResult.success) {
            console.log('Order confirmation email sent successfully');
          } else {
            console.error('Failed to send order confirmation email:', emailResult.error);
            // Don't show error to user as order was successful
          }
        } catch (emailError) {
          console.error('Email service error:', emailError);
          // Don't show error to user as order was successful
        } finally {
          sendingEmail.value = false;
        }
        
        // For cash on delivery, show success modal
        showSuccessModal.value = true;
        canCancel.value = true;
        
        // Create success message based on number of orders
        let successMessage;
        if (successfulOrders.length === 1) {
          successMessage = 'Order placed successfully! Check your email for confirmation.';
        } else {
          successMessage = `${successfulOrders.length} orders placed successfully! Each seller will process their items separately. Check your email for confirmations.`;
        }
        
        showNotificationMessage(successMessage, 'success');

        // Save GCash number if requested
        if (paymentMethod.value === 'gcash' && saveGcash.value) {
          try {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
              savedGcashNumber: gcashDetails.value.number
            });
          } catch (error) {
            console.error('Error saving GCash number:', error);
            // Non-critical error
          }
        }
        
      } catch (error) {
        console.error('Order placement error:', error);
        showNotificationMessage(
          error.message || 'Failed to place order. Please try again.',
          'error'
        );
      }
    };

    const cancelOrder = async () => {
      try {
        if (!auth.currentUser) throw new Error('User not authenticated');
        
        // First check if the order is still pending
        const ordersQuery = query(
          collection(db, 'orders'),
          where('orderCode', '==', orderNumber.value)
        );
        
        const querySnapshot = await getDocs(ordersQuery);
        let canStillCancel = false;
        
        // Check if any order with this code is still pending
        querySnapshot.forEach((doc) => {
          const orderData = doc.data();
          if (orderData.status === 'Pending') {
            canStillCancel = true;
          }
        });
        
        if (!canStillCancel) {
          showNotificationMessage('Order cannot be cancelled as it is no longer pending', 'error');
          canCancel.value = false;
          return;
        }
        
        // Update all orders with this order code to 'Cancelled'
        const updatePromises = [];
        
        querySnapshot.forEach((doc) => {
          updatePromises.push(updateDoc(doc.ref, {
            status: 'Cancelled',
            cancelledAt: serverTimestamp()
          }));
        });
        
        await Promise.all(updatePromises);
        
        // Also update sales records
        const salesQuery = query(
          collection(db, 'sales'),
          where('orderCode', '==', orderNumber.value)
        );
        
        const salesSnapshot = await getDocs(salesQuery);
        const salesUpdates = [];
        
        salesSnapshot.forEach((doc) => {
          salesUpdates.push(updateDoc(doc.ref, {
            paymentStatus: 'cancelled'
          }));
        });
        
        await Promise.all(salesUpdates);
        
        // Show success message
        showNotificationMessage('Order cancelled successfully', 'success');
        showSuccessModal.value = false;
      } catch (error) {
        console.error('Error cancelling order:', error);
        showNotificationMessage('Failed to cancel order', 'error');
      }
    };
    
    // Clean up when component unmounts
    onUnmounted(() => {
      // Clean up any remaining timeouts or intervals if needed
    });

    function getCurrentSeason() {
      const month = new Date().getMonth() + 1;
      if (month >= 3 && month <= 5) return 'spring';
      if (month >= 6 && month <= 8) return 'summer';
      if (month >= 9 && month <= 11) return 'fall';
      return 'winter';
    }
        
    const continueShopping = () => {
      showSuccessModal.value = false;
      router.push('/');
    };

    const navigateToProductDetails = () => {
      // Get the first product's ID from order items
      if (orderItems.value.length > 0 && orderItems.value[0].productId) {
        router.push(`/product/${orderItems.value[0].productId}`);
      } else {
        // Fallback to home if no product ID is available
        router.push('/');
      }
    };
    
    return {
      orderItems,
      isBuyNow,
      subtotal,
      deliveryFee,
      standardDeliveryFee,
      expressDeliveryFee,
      tax,
      total,
  totalDueNow,
  hasPreOrderItems,
  hasMixedPreOrder,
  depositTotal,
      placeOrder,
      placeholderImage,
      increaseQuantity,
      decreaseQuantity,
      
      // Distance calculation
      deliveryDistance,
      calculatingDelivery,
      deliveryError,
      onAddressChange,
      
      // Address
      addresses,
      selectedAddressIndex,
      selectedAddress,
      showAddressModal,
      showNewAddressForm,
      newAddress,
      loadingAddresses,
      municipalities,
      barangays,
      updateBarangays,
      userRegistrationAddress,
      getAddressDisplay,
      
      // Payment
      paymentMethod,
      gcashDetails,
      saveGcash,
      
      // Delivery
      deliveryOption,
      
      // Notification
      showNotification,
           notificationMessage,
      notificationType,
        // Order success
      showSuccessModal,
      orderNumber,
      multipleOrderCodes,
      
      // Email sending
      sendingEmail,
      
      // Methods
      confirmAddress,
      saveNewAddress,
      cancelNewAddress,
      continueShopping,
      navigateToProductDetails,
      showNotificationMessage,
      canCancel,
      cancelOrder,
    };
  }
}
</script>

<style scoped>
/* Base styles */
.product-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.product-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-header h3 {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

.packaging {
  font-size: 12px;
  color: #666;
}

.price-quantity-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quantity-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  border: none;
  cursor: pointer;
}

.quantity-btn:hover {
  background-color: #e0e0e0;
}

.quantity {
  font-size: 14px;
  min-width: 40px;
  text-align: center;
}

.price {
  font-size: 18px;
  font-weight: 600;
  color: #2e5c31;
}

/* Remove the seller-id style as we're hiding it */
.seller-id {
  display: none;
}

/* Adjust product-item layout */
.product-item {
  flex-direction: column;
  gap: 12px;
}

.product-image {
  width: 100%;
  height: 150px;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.checkout {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding-bottom: 80px;
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
  background: none;
  border: none;
  cursor: pointer;
}

.header h1 {
  font-size: 18px;
  font-weight: 600;
  margin-left: 15px;
}

.checkout-content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.checkout-section {
  background-color: white;
  border-radius: 15px;
  padding: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.checkout-section h2 {
  font-size: 18px;
  font-weight: 600;
  color: #2e5c31;
  margin-bottom: 15px;
}

.change-button {
  color: #2e5c31;
  font-size: 14px;
  font-weight: 500;
  background: none;
  border: none;
  cursor: pointer;
}

/* Delivery info styles */
.delivery-info {
  margin-top: 5px;
  color: #666;
  font-size: 12px;
}

.delivery-loading {
  padding: 20px;
  text-align: center;
  color: #666;
}

.delivery-error {
  padding: 10px;
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 5px;
  color: #856404;
  font-size: 12px;
  margin-top: 10px;
}

.distance-info {
  font-size: 11px;
  color: #888;
  margin-top: 2px;
}

/* Loading and error states */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 100;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2e5c31;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  padding: 20px;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 8px;
  margin: 15px;
  text-align: center;
}

.error-message button {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #2e5c31;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  padding: 20px;
}

.empty-state button {
  margin-top: 10px;
  padding: 10px 20px;
  background-color: #2e5c31;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Address styles */
.address-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.address-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #f0e6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7b61ff;
  flex-shrink: 0;
}

.address-details h3 {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 5px;
}

.address-details p {
  font-size: 14px;
  color: #666;
}

/* Product item styles */
.order-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.product-item {
  display: flex;
  gap: 15px;
  padding: 0;
  background-color: transparent;
  border-radius: 0;
  box-shadow: none;
}

.product-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f5f5f5;
  flex-shrink: 0;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-details {
  flex: 1;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 5px;
}

.product-header h3 {
  font-size: 16px;
  font-weight: 500;
}

.seller-id {
  font-size: 12px;
  color: #666;
}

.weight {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.product-price-quantity {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  font-size: 18px;
  font-weight: 600;
  color: #2e5c31;
}

.product-id {
  font-size: 12px;
  color: #666;
}

/* Payment method styles */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-item.active {
  border-color: #2e5c31;
  background-color: rgba(46, 92, 49, 0.05);
}

.radio-input {
  display: none;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.option-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgba(46, 92, 49, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2e5c31;
}

.option-icon.express {
  background-color: #f0e6ff;
  color: #7b61ff;
}

.option-icon.gcash {
  background-color: #e6f0ff;
  color: #3498db;
}

.option-icon.pickup {
  background-color: #fff4e6;
  color: #e67e22;
}

/* Peso icon for Cash on Delivery */
.peso-icon {
  font-size: 18px;
  font-weight: bold;
  color: #3498db;
}

.option-title {
  font-size: 14px;
  font-weight: 500;
}

.gcash-details {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 5px;
  color: #333;
}

.form-group input[type="text"] {
  width: 100%;
  height: 45px;
  padding: 0 15px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-size: 14px;
  box-sizing: border-box;
}

.checkbox-container {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
}

.checkbox-container input {
  width: 18px;
  height: 18px;
}

/* Delivery options */
.delivery-options h3, .pickup-options h3 {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
}

.option-details {
  display: flex;
  flex-direction: column;
}

.option-subtitle {
  font-size: 12px;
  color: #666;
}

.option-price {
  font-size: 14px;
  font-weight: 500;
  color: #2e5c31;
}

/* Order total styles */
.total-breakdown {
  display: flex;
  flex-direction: column;
}

.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.total-row.final {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.total-row.final span:last-child {
  color: #2e5c31;
}

.separator {
  height: 1px;
  background-color: #eee;
  margin: 15px 0;
}

/* Bottom action */
.bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 15px;
  background-color: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.place-order-button {
  width: 100%;
  height: 50px;
  background-color: #2e5c31;
  color: white;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 3px 8px rgba(46, 92, 49, 0.3);
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.place-order-button:hover {
  background-color: #26492a;
}

.place-order-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* Modal Styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  width: 90%;
  max-width: 400px;
  background-color: white;
  border-radius: 15px;
  overflow: hidden;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 600;
}

.close-button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  background-color: #f5f5f5;
  border: none;
  cursor: pointer;
}

.address-list {
  padding: 15px;
  overflow-y: auto;
  max-height: 300px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.address-option {
  display: flex;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.address-option.active {
  border-color: #2e5c31;
  background-color: rgba(46, 92, 49, 0.05);
}

.address-option-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.address-option-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #f0e6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7b61ff;
  flex-shrink: 0;
}

.address-option-details h3 {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 5px;
}

.address-option-details p {
  font-size: 14px;
  color: #666;
}

.add-address-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  border: 1px dashed #2e5c31;
  border-radius: 10px;
  color: #2e5c31;
  font-weight: 500;
  margin-top: 5px;
  background: none;
  cursor: pointer;
}

.modal-actions {
  display: flex;
  gap: 10px;
  padding: 15px;
  border-top: 1px solid #eee;
}

.cancel-button {
  flex: 1;
  height: 45px;
  background-color: #f5f5f5;
  color: #333;
  border-radius: 10px;
  font-weight: 500;
  border: none;
  cursor: pointer;
}

.confirm-button {
  flex: 1;
  height: 45px;
  background-color: #2e5c31;
  color: white;
  border-radius: 10px;
  font-weight: 500;
  border: none;
  cursor: pointer;
}

/* Success Modal */
.success-modal {
  padding: 25px 20px;
  text-align: center;
}

.success-icon {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background-color: #e6f7e6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2e5c31;
  margin: 0 auto 20px;
}

.success-modal h2 {
  font-size: 20px;
  font-weight: 600;
  color: #2e5c31;
  margin-bottom: 10px;
}

.success-modal p {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}

.order-number {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
}

.order-number .label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.order-number .value {
  font-size: 18px;
  font-weight: 600;
  color: #2e5c31;
}

.multiple-orders {
  text-align: left;
  width: 100%;
  margin: 20px 0;
}

.multiple-orders .label {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
  text-align: center;
}

.order-codes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.order-code-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #2e5c31;
}

.order-code {
  font-size: 16px;
  font-weight: 700;
  color: #2e5c31;
}

.order-note {
  font-size: 12px;
  color: #666;
  background-color: #e9ecef;
  padding: 2px 8px;
  border-radius: 4px;
}

.continue-button {
  width: 100%;
  height: 45px;
  background-color: #2e5c31;
  color: white;
  border-radius: 10px;
  font-weight: 500;
  border: none;
  cursor: pointer;
}

.new-address-form {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 15px;
}

.new-address-form h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #2e5c31;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 5px;
  color: #333;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  height: 45px;
  padding: 0 15px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group textarea {
  height: 80px;
  padding: 15px;
  resize: vertical;
  font-family: inherit;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.location-notes {
  font-size: 12px;
  color: #666;
  margin-top: 3px;
}

.cancellation-notice {
  background-color: #fff3cd;
  padding: 15px;
  border-radius: 10px;
  margin: 20px 0;
  text-align: center;
}

.cancellation-notice p {
  font-size: 13px;
  color: #856404;
  margin-bottom: 10px;
}

.cancel-order-button {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.cancel-order-button:hover {
  background-color: #c82333;
}

.unit {
  font-size: 12px;
  color: #666;
}

.loading-addresses {
  text-align: center;
  padding: 20px;
  color: #666;
}

.quantity {
  font-size: 14px;
  min-width: 40px;
  text-align: center;
}

.price {
  font-size: 18px;
  font-weight: 600;
  color: #2e5c31;
}

/* Remove the seller-id style as we're hiding it */
.seller-id {
  display: none;
}

/* Adjust product-item layout */
.product-item {
  flex-direction: column;
  gap: 12px;
}

.product-image {
  width: 100%;
  height: 150px;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.checkout {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding-bottom: 80px;
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
}

.header h1 {
  font-size: 18px;
  font-weight: 600;
  margin-left: 15px;
}

.checkout-content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.checkout-section {
  background-color: white;
  border-radius: 15px;
  padding: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.checkout-section h2 {
  font-size: 18px;
  font-weight: 600;
  color: #2e5c31;
  margin-bottom: 15px;
}

.change-button {
  color: #2e5c31;
  font-size: 14px;
  font-weight: 500;
}

/* Delivery info styles */
.delivery-info {
  margin-top: 5px;
  color: #666;
  font-size: 12px;
}

.delivery-loading {
  padding: 20px;
  text-align: center;
  color: #666;
}

.delivery-error {
  padding: 10px;
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 5px;
  color: #856404;
  font-size: 12px;
  margin-top: 10px;
}

.distance-info {
  font-size: 11px;
  color: #888;
  margin-top: 2px;
}

/* Loading and error states */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 100;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2e5c31;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  padding: 20px;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 8px;
  margin: 15px;
  text-align: center;
}

.error-message button {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #2e5c31;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  padding: 20px;
}

.empty-state button {
  margin-top: 10px;
  padding: 10px 20px;
  background-color: #2e5c31;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Address styles */
.address-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.address-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #f0e6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7b61ff;
  flex-shrink: 0;
}

.address-details h3 {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 5px;
}

.address-details p {
  font-size: 14px;
  color: #666;
}

/* Product item styles */
.order-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.product-item {
  display: flex;
  gap: 15px;
  padding: 0;
  background-color: transparent;
  border-radius: 0;
  box-shadow: none;
}

.product-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f5f5f5;
  flex-shrink: 0;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-details {
  flex: 1;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 5px;
}

.product-header h3 {
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-item.active {
  border-color: #2e5c31;
  background-color: rgba(46, 92, 49, 0.05);
}

.radio-input {
  display: none;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.option-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgba(46, 92, 49, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2e5c31;
}

.option-icon.express {
  background-color: #f0e6ff;
  color: #7b61ff;
}

.option-icon.gcash {
  background-color: #e6f0ff;
  color: #3498db;
}

.option-icon.pickup {
  background-color: #fff4e6;
  color: #e67e22;
}

/* Peso icon for Cash on Delivery */
.peso-icon {
  font-size: 18px;
  font-weight: bold;
  color: #3498db;
}

.option-title {
  font-size: 14px;
  font-weight: 500;
}

.gcash-details {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 5px;
  color: #333;
}

.form-group input[type="text"] {
  width: 100%;
  height: 45px;
  padding: 0 15px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-size: 14px;
}

.checkbox-container {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
}

.checkbox-container input {
  width: 18px;
  height: 18px;
}

/* Delivery options */
.delivery-options h3, .pickup-options h3 {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
}

.option-details {
  display: flex;
  flex-direction: column;
}

.option-subtitle {
  font-size: 12px;
  color: #666;
}

.option-price {
  font-size: 14px;
  font-weight: 500;
  color: #2e5c31;
}

/* Order total styles */
.total-breakdown {
  display: flex;
  flex-direction: column;
}

.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.total-row.final {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.total-row.final span:last-child {
  color: #2e5c31;
}

.separator {
  height: 1px;
  background-color: #eee;
  margin: 15px 0;
}

/* Bottom action */
.bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 15px;
  background-color: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.place-order-button {
  width: 100%;
  height: 50px;
  background-color: #2e5c31;
  color: white;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 3px 8px rgba(46, 92, 49, 0.3);
  transition: all 0.2s ease;
}

.place-order-button:hover {
  background-color: #26492a;
}

.place-order-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* Modal Styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  width: 90%;
  max-width: 400px;
  background-color: white;
  border-radius: 15px;
  overflow: hidden;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 600;
}

.close-button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  background-color: #f5f5f5;
}

.address-list {
  padding: 15px;
  overflow-y: auto;
  max-height: 300px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.address-option {
  display: flex;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.address-option.active {
  border-color: #2e5c31;
  background-color: rgba(46, 92, 49, 0.05);
}

.address-option-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.address-option-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #f0e6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7b61ff;
  flex-shrink: 0;
}

.address-option-details h3 {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 5px;
}

.address-option-details p {
  font-size: 14px;
  color: #666;
}

.add-address-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  border: 1px dashed #2e5c31;
  border-radius: 10px;
  color: #2e5c31;
  font-weight: 500;
  margin-top: 5px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  padding: 15px;
  border-top: 1px solid #eee;
}

.cancel-button {
  flex: 1;
  height: 45px;
  background-color: #f5f5f5;
  color: #333;
  border-radius: 10px;
  font-weight: 500;
}

.confirm-button {
  flex: 1;
  height: 45px;
  background-color: #2e5c31;
  color: white;
  border-radius: 10px;
  font-weight: 500;
}

/* Success Modal */
.success-modal {
  padding: 25px 20px;
  text-align: center;
}

.success-icon {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background-color: #e6f7e6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2e5c31;
  margin: 0 auto 20px;
}

.success-modal h2 {
  font-size: 20px;
  font-weight: 600;
  color: #2e5c31;
  margin-bottom: 10px;
}

.success-modal p {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}

.order-number {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
}

.order-number .label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.order-number .value {
  font-size: 18px;
  font-weight: 600;
  color: #2e5c31;
}

.multiple-orders {
  text-align: left;
  width: 100%;
  margin: 20px 0;
}

.multiple-orders .label {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
  text-align: center;
}

.order-codes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.order-code-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #2e5c31;
}

.order-code {
  font-size: 16px;
  font-weight: 700;
  color: #2e5c31;
}

.order-note {
  font-size: 12px;
  color: #666;
  background-color: #e9ecef;
  padding: 2px 8px;
  border-radius: 4px;
}

.track-button {
  flex: 1;
  height: 45px;
  background-color: #f5f5f5;
  color: #2e5c31;
  border: 1px solid #2e5c31;
  border-radius: 10px;
  font-weight: 500;
}

.continue-button {
  flex: 1;
  height: 45px;
  background-color: #2e5c31;
  color: white;
  border-radius: 10px;
  font-weight: 500;
}

.new-address-form {
  padding: 15px;
  border: 1px dashed #2e5c31;
  border-radius: 10px;
  margin-top: 15px;
}

.new-address-form h3 {
  margin-top: 0;
  color: #2e5c31;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.form-group textarea {
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.location-notes {
  color: #666;
  font-size: 0.8em;
  margin-top: 5px;
}

/* Location select styles */
.location-select {
  position: relative;
  margin-bottom: 15px;
}

.location-select select {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-size: 14px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-color: white;
}

.location-select::after {
  content: '\f078';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  pointer-events: none;
}

.cancellation-notice {
  background-color: #fff8e6;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
  text-align: center;
}

.cancellation-notice p {
  margin: 0 0 10px;
  font-size: 14px;
}

.countdown {
  font-weight: 600;
  color: #2e5c31;
  font-size: 16px;
}

.cancel-order-button {
  width: 100%;
  padding: 10px;
  background-color: #ffebee;
  color: #c62828;
  border: 1px solid #c62828;
  border-radius: 8px;
  font-weight: 500;
  margin-top: 10px;
}

.cancel-order-button:hover {
  background-color: #ffcdd2;
}

.unit {
  font-size: 12px;
  color: #666;
}
</style>
