<template>
  <div class="cart-page">
    <div class="header">
      <button class="back-button" @click="goBack">
        <ChevronLeft size="22" />
      </button>
      <h1>My Cart</h1>
      <div class="header-buttons">
      </div>
    </div>
    
    <div class="content">
      <div v-if="cartItems.length === 0" class="empty-cart">
        <div class="empty-cart-icon">
          <ShoppingCart size="60" />
        </div>
        <h2>Your cart is empty</h2>
        <p>Browse our farm-fresh products and add items to your cart</p>
        <button class="shop-now-btn" @click="$emit('navigate', 'HomePage')">Shop Now</button>
      </div>
      
      <template v-else>
        <div class="cart-items">
          <div class="cart-item" v-for="(item, index) in cartItems" :key="item.productId">
            <div class="item-checkbox">
              <input 
                type="checkbox" 
                :checked="item.selected"
                @change="toggleItemSelection(index)"
              >
            </div>
            <div class="item-image">
              <img :src="item.productImage" :alt="item.productName">
            </div>
            <div class="item-details">
              <h3>{{ item.productName }}</h3>
              <p class="item-shop">{{ item.farmName }}</p>
              <p class="item-weight">{{ item.weight }}kg - {{ item.packagingType }}</p>
            </div>
            <div class="item-actions">
              <div class="quantity-controls">
                <button @click="decreaseQuantity(index)" class="quantity-btn">
                  <Minus size="14" />
                </button>
                <span class="quantity">{{ item.quantity || 1 }}</span>
                <button @click="increaseQuantity(index)" class="quantity-btn">
                  <Plus size="14" />
                </button>
              </div>
              <p class="item-price">₱{{ (item.price * (item.quantity || 1)).toFixed(2) }}</p>
            </div>
            <button class="remove-btn" @click="removeItem(index)">
              <Trash2 size="16" />
            </button>
          </div>
        </div>
        
        <div class="cart-summary">
          <div class="summary-row">
            <span>Subtotal</span>
            <span>₱{{ calculateSubtotal().toFixed(2) }}</span>
          </div>
          <div class="summary-row">
            <span>Delivery Fee</span>
            <span>₱{{ deliveryFee.toFixed(2) }}</span>
          </div>
          <div class="summary-row discount" v-if="discount > 0">
            <span>Discount</span>
            <span>-₱{{ discount.toFixed(2) }}</span>
          </div>
          <div class="summary-row total">
            <span>Total</span>
            <span>₱{{ calculateTotal().toFixed(2) }}</span>
          </div>
        </div>
        
        <div class="promo-code">
          <input type="text" placeholder="Enter promo code" v-model="promoCode">
          <button @click="applyPromoCode">Apply</button>
        </div>
        
        <div class="checkout-section">
          <button 
            class="checkout-btn" 
            :disabled="!hasSelectedItems"
            @click="proceedToCheckout"
          >
            Proceed to Checkout ({{ selectedItemsCount }} items)
          </button>
        </div>
      </template>
    </div>
    
    <bottom-navigation active-tab="/cart" @navigate="$emit('navigate', $event)" />
    
    <!-- Remove Item Confirmation Modal -->
    <div v-if="showRemoveModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>Remove Item</h3>
        </div>
        <div class="modal-body">
          <p>Do you want to remove this item from your cart?</p>
          <div class="item-preview" v-if="itemToRemove">
            <img :src="itemToRemove.productImage" :alt="itemToRemove.productName" class="preview-image">
            <div class="preview-details">
              <h4>{{ itemToRemove.productName }}</h4>
              <p>{{ itemToRemove.farmName }}</p>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="cancel-btn" @click="cancelRemove">Cancel</button>
          <button class="confirm-btn" @click="confirmRemove">Remove</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import BottomNavigation from '@/components/BottomNavigation.vue';
import { 
  ChevronLeft, 
  ShoppingCart, 
  Minus, 
  Plus, 
  Trash2 
} from 'lucide-vue-next';
import { ref, onMounted, computed } from 'vue';
import { db } from '@/firebase/firebaseConfig';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useRouter } from 'vue-router';

export default {
  components: {
    BottomNavigation,
    ChevronLeft,
    ShoppingCart,
    Minus,
    Plus,
    Trash2
  },
  setup() {
    const cartItems = ref([]);
    const promoCode = ref('');
    const discount = ref(0);
    const deliveryFee = ref(50);
    const auth = getAuth();
    const router = useRouter();
    const showRemoveModal = ref(false);
    const itemToRemove = ref(null);
    const itemToRemoveIndex = ref(-1);

    const fetchCartItems = async () => {
      try {
        if (auth.currentUser) {
          const userId = auth.currentUser.uid;
          
          // Fetch all cart items for the user
          const q = query(
            collection(db, "carts"), 
            where("userId", "==", userId)
          );
          
          const querySnapshot = await getDocs(q);
          
          // Filter client-side to include items with cartStatus = false or undefined (backward compatibility)
          cartItems.value = querySnapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            .filter(item => item.cartStatus !== true); // Show items that are not purchased
        }
      } catch (error) {
        console.error("Error fetching cart items:", error);
      }
    };

    const toggleItemSelection = async (index) => {
      try {
        const item = cartItems.value[index];
        const newSelectedState = !item.selected;
        
        // Update in Firestore
        const cartItemRef = doc(db, 'carts', item.id);
        await updateDoc(cartItemRef, {
          selected: newSelectedState
        });
        
        // Update local state
        cartItems.value[index].selected = newSelectedState;
      } catch (error) {
        console.error('Error updating item selection:', error);
      }
    };

    const increaseQuantity = async (index) => {
      try {
        const item = cartItems.value[index];
        const newQuantity = (item.quantity || 1) + 1;
        
        // Update in Firestore
        const cartItemRef = doc(db, 'carts', item.id);
        await updateDoc(cartItemRef, {
          quantity: newQuantity
        });
        
        // Update local state
        cartItems.value[index].quantity = newQuantity;
      } catch (error) {
        console.error('Error updating quantity:', error);
      }
    };

    const decreaseQuantity = async (index) => {
      try {
        const item = cartItems.value[index];
        if (item.quantity > 1) {
          const newQuantity = item.quantity - 1;
          
          // Update in Firestore
          const cartItemRef = doc(db, 'carts', item.id);
          await updateDoc(cartItemRef, {
            quantity: newQuantity
          });
          
          // Update local state
          cartItems.value[index].quantity = newQuantity;
        }
      } catch (error) {
        console.error('Error updating quantity:', error);
      }
    };

    const removeItem = (index) => {
      itemToRemove.value = cartItems.value[index];
      itemToRemoveIndex.value = index;
      showRemoveModal.value = true;
    };

    const cancelRemove = () => {
      showRemoveModal.value = false;
      itemToRemove.value = null;
      itemToRemoveIndex.value = -1;
    };

    const confirmRemove = async () => {
      try {
        if (itemToRemoveIndex.value >= 0 && itemToRemove.value) {
          // Delete from Firestore
          await deleteDoc(doc(db, 'carts', itemToRemove.value.id));
          
          // Update local state
          cartItems.value.splice(itemToRemoveIndex.value, 1);
          
          // Close modal
          cancelRemove();
        }
      } catch (error) {
        console.error('Error removing item:', error);
      }
    };

    const calculateSubtotal = () => {
      return cartItems.value
        .filter(item => item.selected)
        .reduce((total, item) => {
          return total + (item.price * (item.quantity || 1));
        }, 0);
    };

    const calculateTotal = () => {
      return calculateSubtotal() + deliveryFee.value - discount.value;
    };

    const selectedItemsCount = computed(() => {
      return cartItems.value.filter(item => item.selected).length;
    });

    const hasSelectedItems = computed(() => {
      return selectedItemsCount.value > 0;
    });

    // Multi-seller detection
    const uniqueSellers = computed(() => {
      const sellers = new Set();
      cartItems.value.forEach(item => {
        if (item.sellerId) {
          sellers.add(item.sellerId);
        }
      });
      return Array.from(sellers);
    });

    const uniqueSellersCount = computed(() => {
      return uniqueSellers.value.length;
    });

    const hasMultipleSellers = computed(() => {
      return uniqueSellersCount.value > 1;
    });    const proceedToCheckout = () => {
      const selectedItems = cartItems.value.filter(item => item.selected);
      
      // Log multi-seller information
      const sellerIds = [...new Set(selectedItems.map(item => item.sellerId))];
      console.log('=== CART CHECKOUT DEBUG ===');
      console.log(`Selected items: ${selectedItems.length}`);
      console.log(`Unique sellers: ${sellerIds.length}`);
      sellerIds.forEach(sellerId => {
        const sellerItems = selectedItems.filter(item => item.sellerId === sellerId);
        console.log(`Seller ${sellerId}: ${sellerItems.length} items`);
      });
      
      // Transform cart items to match checkout expectations
      const checkoutItems = selectedItems.map(item => ({
        ...item,
        cartItemId: item.id, // Map the Firestore document ID to cartItemId for checkout
        unitPrice: item.price || item.unitPrice || 0, // Ensure unitPrice field exists
        productImage: item.image || item.productImage, // Handle different image field names
        // Pass along any stored orderType to checkout (if cart captured it)
        orderType: item.orderType
      }));
      
      console.log('Cart items being sent to checkout:', checkoutItems);
      console.log('Cart item IDs for status update:', checkoutItems.map(item => ({ productName: item.productName, cartItemId: item.cartItemId })));
      
      router.push({
        name: 'Checkout',
        query: {
          items: JSON.stringify(checkoutItems)
        }
      });
    };

    const goBack = () => {
      window.history.back();
    };
    
    const applyPromoCode = () => {
      if (promoCode.value.toLowerCase() === 'farm10') {
        discount.value = calculateSubtotal() * 0.1;
        alert('Promo code applied! 10% discount');
      } else if (promoCode.value.toLowerCase() === 'freeship') {
        discount.value = deliveryFee.value;
        alert('Promo code applied! Free shipping');
      } else {
        alert('Invalid promo code');
        discount.value = 0;
      }
      promoCode.value = '';
    };

    onMounted(() => {
      fetchCartItems();
    });
    
    return {
      cartItems,
      promoCode,
      discount,
      deliveryFee,
      selectedItemsCount,
      hasSelectedItems,
      uniqueSellersCount,
      hasMultipleSellers,
      showRemoveModal,
      itemToRemove,
      goBack,
      increaseQuantity,
      decreaseQuantity,
      removeItem,
      cancelRemove,
      confirmRemove,
      calculateSubtotal,
      calculateTotal,
      applyPromoCode,
      toggleItemSelection,
      proceedToCheckout
    };
  }
}
</script>


<style scoped>
.cart-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding-bottom: 80px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
}

.header-buttons {
  display: flex;
  gap: 8px;
}

.icon-button {
  width: 40px;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  overflow: hidden;
}

.profile-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.content {
  flex: 1;
  padding: 20px 15px;
  background-color: #f5f5f5;
  overflow-y: auto;
}

.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  padding: 0 20px;
}

.empty-cart-icon {
  color: #ccc;
  margin-bottom: 20px;
}

.empty-cart h2 {
  font-size: 20px;
  margin-bottom: 10px;
  color: #333;
}

.empty-cart p {
  font-size: 14px;
  color: #666;
  margin-bottom: 30px;
}

.shop-now-btn {
  padding: 12px 30px;
  background-color: #2e5c31;
  color: white;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 3px 8px rgba(46, 92, 49, 0.3);
}

.cart-items {
  margin-bottom: 20px;
}

.cart-item {
  display: flex;
  align-items: center;
  background-color: white;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  position: relative;
}

.item-checkbox {
  margin-right: 10px;
}

.item-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.item-image {
  width: 60px;
  height: 60px;
  background-color: #f9f9f9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.item-image img {
  width: 40px;
  height: 40px;
}

.item-details {
  flex: 1;
}

.item-details h3 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
  color: #333;
}

.item-shop {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.item-weight {
  font-size: 12px;
  color: #999;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: 50px; /* Space for delete button */
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quantity-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  border: 1px solid #e0e0e0;
  transition: all 0.2s ease;
}

.quantity-btn:hover {
  background-color: #e0e0e0;
  border-color: #ccc;
}

.quantity {
  min-width: 25px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
}

.item-price {
  font-size: 14px;
  font-weight: 700;
  color: #2e5c31;
  min-width: 60px;
  text-align: right;
}

.remove-btn {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  color: #e74c3c;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e74c3c;
  border-radius: 50%;
  padding: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.remove-btn:hover {
  background-color: #e74c3c;
  color: white;
  transform: scale(1.1);
}

.cart-summary {
  background-color: white;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
  color: #666;
}

.summary-row.discount {
  color: #e74c3c;
}

.summary-row.total {
  font-size: 16px;
  font-weight: 700;
  color: #333;
  border-top: 1px solid #eee;
  padding-top: 12px;
  margin-top: 5px;
}

.promo-code {
  display: flex;
  margin-bottom: 20px;
}

.promo-code input {
  flex: 1;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 10px 0 0 10px;
  font-size: 14px;
}

.promo-code button {
  padding: 0 20px;
  background-color: #2e5c31;
  color: white;
  border-radius: 0 10px 10px 0;
  font-weight: 600;
}

.checkout-section {
  margin-top: 20px;
}

.checkout-btn {
  width: 100%;
  padding: 15px 0;
  background-color: #2e5c31;
  color: white;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 3px 8px rgba(46, 92, 49, 0.3);
}

.checkout-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background-color: white;
  border-radius: 15px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  padding: 20px 20px 0;
  text-align: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.modal-body {
  padding: 20px;
  text-align: center;
}

.modal-body p {
  margin: 0 0 15px;
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.item-preview {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 10px;
  margin-top: 15px;
}

.preview-image {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 12px;
}

.preview-details {
  flex: 1;
  text-align: left;
}

.preview-details h4 {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.preview-details p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.modal-actions {
  padding: 0 20px 20px;
  display: flex;
  gap: 10px;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #e0e0e0;
}

.cancel-btn:hover {
  background-color: #e9e9e9;
  border-color: #ccc;
}

.confirm-btn {
  background-color: #e74c3c;
  color: white;
  border: 1px solid #e74c3c;
}

.confirm-btn:hover {
  background-color: #c0392b;
  border-color: #c0392b;
}
</style>