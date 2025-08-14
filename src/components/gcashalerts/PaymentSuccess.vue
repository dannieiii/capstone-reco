<template>
  <div class="payment-success">
    <!-- Header -->
    <div class="header">
      <button class="back-button" @click="$router.push('/')">
        <ChevronLeft size="22" />
      </button>
      <h1>Payment Successful</h1>
    </div>

    <!-- Main Content -->
    <div class="content">
      <div class="success-icon">
        <CheckCircle size="48" />
      </div>

      <h2>Payment Successful!</h2>
      <p class="message">Your payment has been processed successfully.</p>

      <div class="order-details" v-if="orderData">
        <div class="detail-item">
          <span class="label">Order Code</span>
          <span class="value">#{{ orderData.orderCode }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Amount Paid</span>
          <span class="value">₱{{ orderData.totalPrice }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Payment Method</span>
          <span class="value">{{ orderData.paymentMethod }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Date</span>
          <span class="value">{{ formatDate(orderData.createdAt) }}</span>
        </div>
      </div>

      <div class="actions">
        <button class="primary-button" @click="$router.push('/orders')">
          View Order
        </button>
        <button class="secondary-button" @click="$router.push('/')">
          Continue Shopping
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ChevronLeft, CheckCircle } from 'lucide-vue-next';
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

export default {
  name: 'PaymentSuccess',
  components: {
    ChevronLeft,
    CheckCircle
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const orderData = ref(null);

    const fetchOrderDetails = async () => {
      try {
  const orderCode = route.query.order;
        if (!orderCode) {
          router.push('/');
          return;
        }

        // Query by orderCode (multiple docs possible for multi-seller orders)
        // Try groupOrderCode first, then orderCode
        let qRef = query(collection(db, 'orders'), where('groupOrderCode', '==', orderCode));
        let snap = await getDocs(qRef);
        if (snap.empty) {
          qRef = query(collection(db, 'orders'), where('orderCode', '==', orderCode));
          snap = await getDocs(qRef);
        }
        if (snap.empty) {
          router.push('/');
          return;
        }

        // Aggregate details across all seller orders
        let totalPrice = 0;
        let paymentMethod = null;
        let createdAt = null;

        snap.forEach(d => {
          const data = d.data();
          const price = Number(data.totalPrice) || 0;
          totalPrice += price;
          // Prefer GCash if any is gcash
          if (!paymentMethod) paymentMethod = data.paymentMethod;
          if (data.paymentMethod === 'gcash') paymentMethod = 'gcash';
          // Use earliest createdAt
          const ts = data.createdAt;
          if (ts && typeof ts?.toDate === 'function') {
            const date = ts.toDate();
            if (!createdAt || date < createdAt) createdAt = date;
          }
        });

        orderData.value = {
          orderCode,
          totalPrice: totalPrice.toFixed(2),
          paymentMethod: paymentMethod === 'gcash' ? 'GCash' : (paymentMethod || 'N/A'),
          createdAt
        };
      } catch (error) {
        console.error('Error fetching order details:', error);
        router.push('/');
      }
    };

    const formatDate = (value) => {
      if (!value) return 'N/A';
      // Accept Firestore Timestamp or Date
      const date = typeof value?.toDate === 'function' ? value.toDate() : (value instanceof Date ? value : new Date(value));
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    onMounted(() => {
      fetchOrderDetails();
    });

    return {
      orderData,
      formatDate
    };
  }
};
</script>

<style scoped>
.payment-success {
  min-height: 100vh;
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

.content {
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.success-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #e6f7e6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2e5c31;
  margin-bottom: 20px;
}

h2 {
  font-size: 24px;
  font-weight: 600;
  color: #2e5c31;
  margin-bottom: 10px;
}

.message {
  font-size: 16px;
  color: #666;
  margin-bottom: 30px;
}

.order-details {
  width: 100%;
  max-width: 400px;
  background-color: white;
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.detail-item:last-child {
  border-bottom: none;
}

.label {
  color: #666;
  font-size: 14px;
}

.value {
  font-weight: 500;
  color: #333;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 400px;
}

.primary-button {
  width: 100%;
  height: 50px;
  background-color: #2e5c31;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.primary-button:hover {
  background-color: #26492a;
}

.secondary-button {
  width: 100%;
  height: 50px;
  background-color: white;
  color: #2e5c31;
  border: 1px solid #2e5c31;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.secondary-button:hover {
  background-color: #f5f5f5;
}
</style> 