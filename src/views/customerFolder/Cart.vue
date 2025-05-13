<template>
  <div class="cart-page">
    <div class="header">
      <button class="back-button" @click="goBack">
        <ChevronLeft size="22" />
      </button>
      <h1>My Cart</h1>
      <div class="header-buttons">
        <button class="icon-button profile-icon">
          <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Profile" />
        </button>
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
    
    <bottom-navigation active-tab="cart" @navigate="$emit('navigate', $event)" />
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

    const fetchCartItems = async () => {
      try {
        if (auth.currentUser) {
          const userId = auth.currentUser.uid;
          const q = query(
            collection(db, "carts"), 
            where("userId", "==", userId)
          );
          
          const querySnapshot = await getDocs(q);
          cartItems.value = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
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

    const removeItem = async (index) => {
      try {
        const item = cartItems.value[index];
        
        // Delete from Firestore
        await deleteDoc(doc(db, 'carts', item.id));
        
        // Update local state
        cartItems.value.splice(index, 1);
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

    const proceedToCheckout = () => {
      const selectedItems = cartItems.value.filter(item => item.selected);
      router.push({
        name: 'Checkout',
        query: {
          items: JSON.stringify(selectedItems)
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
      goBack,
      increaseQuantity,
      decreaseQuantity,
      removeItem,
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
  flex-direction: column;
  align-items: flex-end;
  margin-right: 10px;
}

.quantity-controls {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.quantity-btn {
  width: 24px;
  height: 24px;
  border-radius: 5px;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
}

.quantity {
  width: 30px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
}

.item-price {
  font-size: 14px;
  font-weight: 700;
  color: #2e5c31;
}

.remove-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  color: #e74c3c;
  background: none;
  border: none;
  padding: 5px;
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
</style>