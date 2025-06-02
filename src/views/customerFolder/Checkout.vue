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
      <button class="back-button" @click="$emit('navigate', 'ProductDetails')">
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
            <p>{{ selectedAddress.barangay }}, {{ selectedAddress.municipality }}, {{ selectedAddress.province }}</p>
            <p v-if="selectedAddress.locationNotes" class="location-notes">
              <small>Notes: {{ selectedAddress.locationNotes }}</small>
            </p>
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
                <span class="packaging">Packaging: {{ item.packagingType || 'N/A' }}</span>
              </div>
              
              <div class="price-quantity-controls">
                <div class="quantity-controls">
                  <button class="quantity-btn" @click="decreaseQuantity(item)">
                    <Minus size="16" />
                  </button>
                  <span class="quantity">{{ item.weight || 0 }} kg</span>
                  <button class="quantity-btn" @click="increaseQuantity(item)">
                    <Plus size="16" />
                  </button>
                </div>
                <span class="price">₱{{ item.price || 0 }}</span>
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
                <DollarSign size="18" />
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
          
          <div class="options-list">
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
                </div>
              </div>
              <span class="option-price">₱50</span>
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
                </div>
              </div>
              <span class="option-price">₱120</span>
            </label>
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
            <span>Total</span>
            <span>₱{{ total }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Bottom Action -->
    <div class="bottom-action">
      <button class="place-order-button" @click="placeOrder" :disabled="!selectedAddress">
        Place Order
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
      
      <h2>Order Placed Successfully!</h2>
      <p>Your order has been confirmed and will be processed shortly.</p>
      
      <div class="order-number">
        <p class="label">Order Code</p>
        <p class="value">#{{ orderNumber }}</p>
      </div>
      
      <!-- Add cancellation notice and countdown -->
      <div class="cancellation-notice" v-if="canCancel">
        <p>You can cancel your order before processing begins.</p>
        <p class="countdown">
          Time remaining: {{ Math.floor(countdown / 60) }}:{{ (countdown % 60).toString().padStart(2, '0') }}
        </p>
        <button class="cancel-order-button" @click="cancelOrder">
          Cancel Order
        </button>
      </div>
      <div v-else>
        <p>Your order is now being processed and cannot be cancelled.</p>
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
  DollarSign,
  Smartphone,
  CheckCircle,
  X
} from 'lucide-vue-next';
import { ref, computed, onMounted, onUnmounted } from 'vue';
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
  query,          // Add this
  where,          // Add this
  getDocs         // Add this
} from 'firebase/firestore';
import { db, auth } from '@/firebase/firebaseConfig';
import Notification from '@/components/Notification.vue';
import { getFunctions, httpsCallable } from 'firebase/functions';

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
    DollarSign,
    Smartphone,
    CheckCircle,
    X,
    Notification
  },
  props: {
    orderData: {
      type: Object,
      default: () => ({
        productId: '',
        productName: '',
        productImage: '',
        weight: 0,
        packagingType: '',
        totalPrice: 0,
        sellerId: '',
        pricePerKg: 0 
      })
    }
  },
  setup(props, { emit }) {
    const route = useRoute();
    const router = useRouter();
    
    // Initialize order data
    const orderItems = ref([]);
    const isBuyNow = ref(false);
    
        const countdown = ref(300); // 5 minutes in seconds
    const countdownInterval = ref(null);
    const canCancel = ref(true);
    // Parse items from route query with validation
    onMounted(() => {
      try {
        if (route.query.items) {
          const items = JSON.parse(route.query.items);
          orderItems.value = items.map(item => ({
            ...item,
            weight: Number(item.weight) || 0.5,
            pricePerKg: Number(item.pricePerKg) || Number(item.price) || 0,
            totalPrice: (Number(item.pricePerKg) || Number(item.price) || 0) * (Number(item.weight) || 0.5),
            packagingType: item.packagingType || 'N/A'
          }));
          isBuyNow.value = items[0]?.isBuyNow || false;
        }
      } catch (error) {
        console.error('Error parsing order items:', error);
        showNotificationMessage('Error loading order items', 'error');
      }
    });

        // Add this new method for the countdown
    const startCountdown = () => {
      countdownInterval.value = setInterval(() => {
        countdown.value -= 1;
        if (countdown.value <= 0) {
          clearInterval(countdownInterval.value);
          canCancel.value = false;
          // Optionally update the order status in Firestore here
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
    
    // Address data
    const addresses = ref([]);
    const selectedAddressIndex = ref(0);
    const selectedAddress = computed(() => addresses.value[selectedAddressIndex.value]);
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
    
    // Helper function to generate order code
    const generateOrderCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const randomLetter = chars.charAt(Math.floor(Math.random() * chars.length));
      const randomNumber = Math.floor(100000 + Math.random() * 900000);
      return `${randomLetter}${randomNumber}`;
    };

    // Quantity control methods
    const increaseQuantity = (item) => {
      item.weight = (parseFloat(item.weight) || 0) + 0.5;
      item.totalPrice = (item.pricePerKg || item.price || 0) * item.weight;
    };

    const decreaseQuantity = (item) => {
      const currentWeight = parseFloat(item.weight) || 0;
      if (currentWeight > 0.5) {
        item.weight = currentWeight - 0.5;
        item.totalPrice = (item.pricePerKg || item.price || 0) * item.weight;
      }
    };

    const placeholderImage = 'https://via.placeholder.com/150';
    
    // Update barangays when municipality changes
    const updateBarangays = () => {
      barangays.value = orientalMindoroData[newAddress.value.municipality] || [];
      newAddress.value.barangay = '';
    };
    
    // Fetch user addresses from Firestore
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
          addresses.value = userDoc.data().addresses || [];
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
      return orderItems.value.reduce((total, item) => {
        const price = Number(item.pricePerKg) || Number(item.price) || 0;
        const weight = Number(item.weight) || 0;
        return total + (price * weight);
      }, 0);
    });
    
    const deliveryFee = computed(() => {
      return deliveryOption.value === 'standard' ? 50 : 120;
    });
    
    const tax = computed(() => subtotal.value * 0.08);
    
    const total = computed(() => {
      const fee = paymentMethod.value === 'pickup' ? 0 : deliveryFee.value;
      return subtotal.value + fee + tax.value;
    });

    // Place order function for multiple items
    const functions = getFunctions();
    const createGcashPayment = httpsCallable(functions, 'createGcashPayment');

    const placeOrder = async () => {
      // Validation checks
      if (!selectedAddress.value) {
        showNotificationMessage('Please select a delivery address', 'error');
        return;
      }
      
      if (paymentMethod.value === 'gcash' && !gcashDetails.value.number) {
        showNotificationMessage('Please enter your GCash number', 'error');
        return;
      }

      // Validate all order items
      for (const item of orderItems.value) {
        if (!item.productId || !item.sellerId || !item.weight || (!item.pricePerKg && !item.price)) {
          showNotificationMessage('One or more items have incomplete information', 'error');
          return;
        }
      }

      try {
        if (!auth.currentUser) throw new Error('User not authenticated');

        // Generate order code
        const orderCode = generateOrderCode();
        orderNumber.value = orderCode;

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

        // PHASE 1: VALIDATION - Check all products first
        const productPromises = orderItems.value.map(item => 
          getDoc(doc(db, 'products', item.productId))
        );
        const productSnapshots = await Promise.all(productPromises);

        // Verify stock before transaction
        for (let i = 0; i < orderItems.value.length; i++) {
          const item = orderItems.value[i];
          const productDoc = productSnapshots[i];
          
          if (!productDoc.exists()) {
            throw new Error(`Product ${item.productName || item.productId} not found`);
          }
          
          const productData = productDoc.data();
          if (Number(productData.stock) < Number(item.weight)) {
            throw new Error(`Only ${productData.stock}kg available for ${item.productName || 'product'}`);
          }
        }

        // PHASE 2: TRANSACTION - Only writes here
        await runTransaction(db, async (transaction) => {
          // Process each item
          for (let i = 0; i < orderItems.value.length; i++) {
            const item = orderItems.value[i];
            const productRef = doc(db, 'products', item.productId);
            const productData = productSnapshots[i].data();
            
            // Update product stock
            transaction.update(productRef, {
              stock: increment(-Number(item.weight))
            });

            // Calculate all price components
            const pricePerKg = Number(item.pricePerKg) || Number(item.price) || 0;
            const weight = Number(item.weight) || 0;
            const itemPrice = pricePerKg * weight;
            const deliveryFeeValue = paymentMethod.value !== 'pickup' ? deliveryFee.value : 0;
            const taxValue = itemPrice * 0.08; // 8% tax
            const totalPrice = itemPrice + deliveryFeeValue + taxValue;

            // Create order document with complete financial information
            const orderRef = doc(collection(db, 'orders'));
            transaction.set(orderRef, {
              orderCode: orderCode,
              sellerId: item.sellerId,
              productId: item.productId,
              productName: item.productName,
              productImage: item.productImage || placeholderImage,
              pricePerKg: pricePerKg,
              itemPrice: itemPrice,
              weight: weight,
              packagingType: item.packagingType || 'N/A',
              paymentMethod: paymentMethod.value,
              gcashNumber: paymentMethod.value === 'gcash' ? gcashDetails.value.number : null,
              deliveryOption: paymentMethod.value !== 'pickup' ? deliveryOption.value : null,
              deliveryFee: deliveryFeeValue,
              tax: taxValue,
              totalPrice: totalPrice,
              Location: {
                province: selectedAddress.value.province,
                municipality: selectedAddress.value.municipality,
                barangay: selectedAddress.value.barangay,
                address: `${selectedAddress.value.barangay}, ${selectedAddress.value.municipality}, ${selectedAddress.value.province}`,
                notes: selectedAddress.value.locationNotes || ''
              },
              status: 'Processing',
              payStatus: 'unpaid',
              createdAt: serverTimestamp(),
              userId: auth.currentUser.uid,
              username: username,
              isBuyNow: isBuyNow.value
            });

            // Create sale record with accurate financial data
            const saleRef = doc(collection(db, 'sales'));
            transaction.set(saleRef, {
              productId: item.productId,
              productName: item.productName,
              category: productData.category || 'uncategorized',
              quantity: weight,
              price: pricePerKg,
              totalPrice: itemPrice,
              timestamp: serverTimestamp(),
              sellerId: item.sellerId,
              season: getCurrentSeason(),
              orderCode: orderCode,
              isBuyNow: isBuyNow.value,
              paymentStatus: 'unpaid'
            });
          }
        });

        // PHASE 3: CLEANUP - Delete cart items after successful transaction
        if (!isBuyNow.value && cartItemsToDelete.length > 0) {
          try {
            const deletePromises = cartItemsToDelete.map(cartItemId => 
              deleteDoc(doc(db, 'carts', cartItemId))
            );
            await Promise.all(deletePromises);
          } catch (error) {
            console.error('Error deleting cart items:', error);
            // Non-critical error, doesn't affect order success
          }
        }

        // PHASE 4: Handle Payment
        if (paymentMethod.value === 'gcash') {
          try {
            // Create GCash payment link
            const paymentResult = await createGcashPayment({
              amount: total.value,
              orderCode: orderCode,
              customerName: username,
              customerEmail: email
            });

            // Redirect to GCash payment page
            window.location.href = paymentResult.data.paymentUrl;
            return; // Exit function as we're redirecting
          } catch (error) {
            console.error('Error creating GCash payment:', error);
            showNotificationMessage('Failed to create GCash payment. Please try again.', 'error');
            return;
          }
        }
        
        // For cash on delivery, show success modal

      showSuccessModal.value = true;
      countdown.value = 300; // Reset to 5 minutes
      canCancel.value = true;
      startCountdown();
      showNotificationMessage('Order placed successfully!', 'success');

        
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
    
    // Update all orders with this order code to 'Cancelled'
    const ordersQuery = query(
      collection(db, 'orders'),
      where('orderCode', '==', orderNumber.value)
    );
    
    const querySnapshot = await getDocs(ordersQuery);
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
    
    // Stop the countdown
    clearInterval(countdownInterval.value);
    
    // Show success message
    showNotificationMessage('Order cancelled successfully', 'success');
    showSuccessModal.value = false;
  } catch (error) {
    console.error('Error cancelling order:', error);
    showNotificationMessage('Failed to cancel order', 'error');
  }
};

    
    // Clean up interval when component unmounts
    onUnmounted(() => {
      if (countdownInterval.value) {
        clearInterval(countdownInterval.value);
      }
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

    // Load addresses when component mounts
    onMounted(() => {
      fetchUserAddresses();
    });
    
   return {
  orderItems,
  isBuyNow,
  subtotal,
  deliveryFee,
  tax,
  total,
  placeOrder,
  placeholderImage,
  increaseQuantity,
  decreaseQuantity,
  
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
  
  // Methods
  confirmAddress,
  saveNewAddress,
  cancelNewAddress,
  continueShopping,
  showNotificationMessage, // <-- This line was missing a comma

  countdown,
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
  padding: 15px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
</style>