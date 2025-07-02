<template>
  <div class="payment-demo">
    <div class="demo-container">
      <div class="demo-header">
        <h1>🧪 Development Mode - Payment Demo</h1>
        <p class="demo-subtitle">This is a simulation of the GCash payment process</p>
      </div>

      <div class="payment-info">
        <h2>Payment Details</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>Order Code:</label>
            <span>{{ orderCode }}</span>
          </div>
          <div class="info-item">
            <label>Amount:</label>
            <span>₱{{ amount }}</span>
          </div>
          <div class="info-item">
            <label>Payment Method:</label>
            <span>GCash (Demo)</span>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h3>🚀 What happens in production:</h3>
        <ul>
          <li>✅ You would be redirected to the real Xendit GCash checkout page</li>
          <li>✅ Customer enters their GCash details securely</li>
          <li>✅ Payment is processed through GCash</li>
          <li>✅ Customer is redirected back to your app</li>
          <li>✅ Order status is automatically updated</li>
        </ul>
      </div>

      <div class="demo-actions">
        <h3>Simulate Payment Result:</h3>
        <div class="button-group">
          <button @click="simulateSuccess" class="success-btn">
            ✅ Simulate Successful Payment
          </button>
          <button @click="simulateFailure" class="failure-btn">
            ❌ Simulate Failed Payment
          </button>
          <button @click="goBack" class="back-btn">
            ← Go Back to Checkout
          </button>
        </div>
      </div>

      <div class="demo-note">
        <h4>🔧 For Production:</h4>
        <p>To enable real GCash payments:</p>
        <ol>
          <li>Sign up for a <a href="https://dashboard.xendit.co" target="_blank">Xendit account</a></li>
          <li>Get your live API key from the Xendit dashboard</li>
          <li>Update the Firebase Functions secret with your real API key</li>
          <li>The system will automatically switch to real payments</li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export default {
  name: 'PaymentDemo',
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    const orderCode = ref('')
    const amount = ref('')
    
    onMounted(() => {
      orderCode.value = route.query.order || 'UNKNOWN'
      amount.value = route.query.amount || '0'
    })

    const simulateSuccess = () => {
      // Simulate successful payment by redirecting to success page
      router.push(`/payment/success?order=${orderCode.value}&demo=true`)
    }

    const simulateFailure = () => {
      // Simulate failed payment by redirecting to failure page
      router.push(`/payment/failed?order=${orderCode.value}&demo=true`)
    }

    const goBack = () => {
      router.back()
    }

    return {
      orderCode,
      amount,
      simulateSuccess,
      simulateFailure,
      goBack
    }
  }
}
</script>

<style scoped>
.payment-demo {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.demo-container {
  background: white;
  border-radius: 15px;
  padding: 30px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.demo-header {
  text-align: center;
  margin-bottom: 30px;
}

.demo-header h1 {
  color: #333;
  margin: 0 0 10px 0;
  font-size: 24px;
}

.demo-subtitle {
  color: #666;
  margin: 0;
  font-size: 16px;
}

.payment-info {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 25px;
}

.payment-info h2 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
}

.info-grid {
  display: grid;
  gap: 10px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item label {
  font-weight: bold;
  color: #555;
}

.info-item span {
  color: #333;
}

.demo-section {
  margin-bottom: 25px;
}

.demo-section h3 {
  color: #333;
  margin: 0 0 15px 0;
  font-size: 16px;
}

.demo-section ul {
  margin: 0;
  padding-left: 20px;
}

.demo-section li {
  margin-bottom: 8px;
  color: #555;
}

.demo-actions {
  margin-bottom: 25px;
}

.demo-actions h3 {
  color: #333;
  margin: 0 0 15px 0;
  font-size: 16px;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.success-btn, .failure-btn, .back-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.success-btn {
  background: #28a745;
  color: white;
}

.success-btn:hover {
  background: #218838;
}

.failure-btn {
  background: #dc3545;
  color: white;
}

.failure-btn:hover {
  background: #c82333;
}

.back-btn {
  background: #6c757d;
  color: white;
}

.back-btn:hover {
  background: #5a6268;
}

.demo-note {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 20px;
}

.demo-note h4 {
  margin: 0 0 10px 0;
  color: #856404;
}

.demo-note p {
  margin: 0 0 10px 0;
  color: #856404;
}

.demo-note ol {
  margin: 0;
  padding-left: 20px;
  color: #856404;
}

.demo-note li {
  margin-bottom: 5px;
}

.demo-note a {
  color: #007bff;
  text-decoration: none;
}

.demo-note a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .payment-demo {
    padding: 10px;
  }
  
  .demo-container {
    padding: 20px;
  }
  
  .button-group {
    flex-direction: column;
  }
}
</style>
