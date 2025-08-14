<template>
  <div class="payment-failed">
    <!-- Header -->
    <div class="header">
      <button class="back-button" @click="$router.push('/')">
        <ChevronLeft size="22" />
      </button>
      <h1>Payment Failed</h1>
    </div>

    <!-- Main Content -->
    <div class="content">
      <div class="error-icon">
        <XCircle size="48" />
      </div>

      <h2>Payment Failed</h2>
      <p class="message">We couldn't process your payment. Please try again.</p>

      <div class="order-details" v-if="orderData">
        <div class="detail-item">
          <span class="label">Order Code</span>
          <span class="value">#{{ orderData.orderCode }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Amount</span>
          <span class="value">₱{{ orderData.totalPrice }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Payment Method</span>
          <span class="value">{{ orderData.paymentMethod }}</span>
        </div>
      </div>

      <div class="error-message" v-if="errorMessage">
        <p>{{ errorMessage }}</p>
      </div>

      <div class="actions">
        <button class="primary-button" @click="retryPayment" :disabled="isRetrying">
          {{ isRetrying ? 'Processing...' : 'Retry Payment' }}
        </button>
        <button class="secondary-button" @click="$router.push('/')">
          Back to Home
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ChevronLeft, XCircle } from 'lucide-vue-next';
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default {
  name: 'PaymentFailed',
  components: {
    ChevronLeft,
    XCircle
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const orderData = ref(null);
    const errorMessage = ref('');
    const isRetrying = ref(false);
    const functions = getFunctions();
    const createGcashPayment = httpsCallable(functions, 'createGcashPayment');

    const fetchOrderDetails = async () => {
      try {
        const orderCode = route.query.order;
        if (!orderCode) {
          router.push('/');
          return;
        }

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

        let totalPrice = 0;
        let paymentMethod = null;

        snap.forEach(d => {
          const data = d.data();
          totalPrice += Number(data.totalPrice) || 0;
          if (!paymentMethod) paymentMethod = data.paymentMethod;
          if (data.paymentMethod === 'gcash') paymentMethod = 'gcash';
        });

        orderData.value = {
          orderCode,
          totalPrice: totalPrice.toFixed(2),
          paymentMethod: paymentMethod || 'gcash'
        };
      } catch (error) {
        console.error('Error fetching order details:', error);
        router.push('/');
      }
    };

    const retryPayment = async () => {
      if (!orderData.value || isRetrying.value) return;

      try {
        isRetrying.value = true;
        errorMessage.value = '';

        const paymentResult = await createGcashPayment({
          amount: orderData.value.totalPrice,
          orderCode: orderData.value.orderCode,
          customerName: orderData.value.username,
          customerEmail: orderData.value.email
        });

        // Redirect to GCash payment page
        window.location.href = paymentResult.data.paymentUrl;
      } catch (error) {
        console.error('Error retrying payment:', error);
        errorMessage.value = 'Failed to create payment. Please try again later.';
      } finally {
        isRetrying.value = false;
      }
    };

    onMounted(() => {
      fetchOrderDetails();
    });

    return {
      orderData,
      errorMessage,
      isRetrying,
      retryPayment
    };
  }
};
</script>

<style scoped>
.payment-failed {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  padding: 20px 15px;
  background-color: #c62828;
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

.error-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #ffebee;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c62828;
  margin-bottom: 20px;
}

h2 {
  font-size: 24px;
  font-weight: 600;
  color: #c62828;
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

.error-message {
  width: 100%;
  max-width: 400px;
  background-color: #ffebee;
  color: #c62828;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 14px;
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
  background-color: #c62828;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.primary-button:hover:not(:disabled) {
  background-color: #b71c1c;
}

.primary-button:disabled {
  background-color: #e57373;
  cursor: not-allowed;
}

.secondary-button {
  width: 100%;
  height: 50px;
  background-color: white;
  color: #c62828;
  border: 1px solid #c62828;
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