<template>
  <div class="performance-container">
    <h3>Farm Performance</h3>
    <div class="gauge-container">
      <canvas ref="gaugeChart"></canvas>
      <div class="gauge-value">
        <div class="value">{{ performanceScore }}</div>
        <div class="label">of 100 points</div>
      </div>
    </div>
    <div class="performance-info">
      <h3>{{ performanceMessage }}</h3>
      <p>Your sales performance score is better than {{ performanceScore }}% of other farmers</p>
      <div class="target-progress">
        <div class="target-header">
          <span>Monthly Target</span>
          <span>{{ Math.round((currentSales / targetSales) * 100) }}%</span>
        </div>
        <div class="progress-bar-container">
          <div 
            class="progress-bar" 
            :style="{ width: `${Math.min(100, (currentSales / targetSales) * 100)}%` }"
          ></div>
        </div>
        <div class="target-values">
          <span>{{ currency }}{{ formatNumber(currentSales) }}</span>
          <span>{{ currency }}{{ formatNumber(targetSales) }}</span>
        </div>
      </div>
      <button class="improve-btn" @click="showImprovementTips">Improve Performance</button>
    </div>
    
    <!-- Improvement Tips Modal -->
    <div v-if="showTipsModal" class="tips-modal-overlay" @click="closeTipsModal">
      <div class="tips-modal" @click.stop>
        <div class="tips-modal-header">
          <h3>Tips to Improve Your Farm Sales</h3>
          <button class="close-btn" @click="closeTipsModal">×</button>
        </div>
        <div class="tips-modal-content">
          <div v-for="(tip, index) in improvementTips" :key="index" class="tip-item">
            <div class="tip-number">{{ index + 1 }}</div>
            <div class="tip-content">
              <h4>{{ tip.title }}</h4>
              <p>{{ tip.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import Chart from 'chart.js/auto';
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const props = defineProps({
  performanceScore: {
    type: Number,
    default: 80
  },
  performanceMessage: {
    type: String,
    default: "You're doing great! 👍"
  },
  targetSales: {
    type: Number,
    default: 50000
  },
  currentSales: {
    type: Number,
    default: 32500
  },
  currency: {
    type: String,
    default: '₱'
  }
});

const gaugeChart = ref(null);
const showTipsModal = ref(false);
let chartInstance = null;
const db = getFirestore();

// Format number with commas
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Show improvement tips modal
const showImprovementTips = () => {
  showTipsModal.value = true;
  document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
};

// Close improvement tips modal
const closeTipsModal = () => {
  showTipsModal.value = false;
  document.body.style.overflow = ''; // Restore scrolling
};

// Improvement tips data
const improvementTips = [
  {
    title: "Optimize Your Product Listings",
    description: "Ensure your farm product descriptions are detailed, accurate, and highlight the benefits. Use high-quality images and consider adding videos to showcase your fresh produce."
  },
  {
    title: "Implement Seasonal Promotions",
    description: "Create special offers for seasonal farm products. Highlight the freshness and limited availability to create urgency and boost sales."
  },
  {
    title: "Engage with Customers",
    description: "Respond promptly to inquiries and reviews. Share farming stories and product information to build trust and loyalty with your customers."
  },
  {
    title: "Expand Your Product Range",
    description: "Consider adding complementary farm products or product bundles to increase average order value and provide more options for your customers."
  },
  {
    title: "Optimize Pricing Strategy",
    description: "Analyze your competitors' pricing and adjust yours accordingly. Consider volume discounts for bulk purchases to encourage larger orders of your farm products."
  }
];

// Create gradient for gauge chart
function createGradient(ctx, colors) {
  const gradient = ctx.createLinearGradient(0, 0, 200, 0);
  colors.forEach((color, index) => {
    gradient.addColorStop(index / (colors.length - 1), color);
  });
  return gradient;
}

// Initialize gauge chart
const initGaugeChart = () => {
  if (!gaugeChart.value) return;

  const ctx = gaugeChart.value.getContext('2d');

  // Create gradient based on performance score
  let gradientColors = ['#2e5c31', '#4a8f4d'];
  if (props.performanceScore < 50) {
    gradientColors = ['#ef4444', '#f97316'];
  } else if (props.performanceScore < 70) {
    gradientColors = ['#f97316', '#84cc16'];
  }

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [props.performanceScore, 100 - props.performanceScore],
        backgroundColor: [
          createGradient(ctx, gradientColors),
          '#f3f4f6'
        ],
        borderWidth: 0,
        circumference: 180,
        rotation: 270
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '75%',
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: false
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true
      }
    }
  });
};

// Calculate performance score based on sales data
const calculatePerformanceScore = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) return;
    
    // Get current month's start date
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Query orders for current month
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('sellerId', '==', user.uid),
      where('timestamp', '>=', startOfMonth),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    // Calculate total sales for current month
    let totalSales = 0;
    snapshot.forEach(doc => {
      const orderData = doc.data();
      totalSales += orderData.totalPrice || 0;
    });
    
    // Get products with low stock
    const productsRef = collection(db, 'products');
    const productsQuery = query(
      productsRef,
      where('sellerId', '==', user.uid),
      where('stock', '<=', 10),
      where('stock', '>', 0)
    );
    
    const productsSnapshot = await getDocs(productsQuery);
    const lowStockCount = productsSnapshot.size;
    
    // Update metrics in parent component if needed
    console.log('Current month sales:', totalSales);
    console.log('Low stock products:', lowStockCount);
    
  } catch (error) {
    console.error('Error calculating performance:', error);
  }
};

// Handle escape key press to close modal
const handleKeyDown = (e) => {
  if (e.key === 'Escape' && showTipsModal.value) {
    closeTipsModal();
  }
};

onMounted(() => {
  initGaugeChart();
  calculatePerformanceScore();
  document.addEventListener('keydown', handleKeyDown);

  // Handle dark mode changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class' && 
          document.body.classList.contains('dark') && 
          chartInstance) {
        // Update chart colors for dark mode
        chartInstance.data.datasets[0].backgroundColor[1] = '#374151';
        chartInstance.update();
      }
    });
  });

  observer.observe(document.body, { attributes: true });

  // Clean up on component unmount
  onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleKeyDown);
    observer.disconnect();
    if (chartInstance) {
      chartInstance.destroy();
    }
  });
});
</script>

<style scoped>
.performance-container {
  background-color: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.performance-container h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 20px 0;
}

.gauge-container {
  position: relative;
  height: 180px;
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.gauge-value {
  position: absolute;
  bottom: 0;
  text-align: center;
}

.gauge-value .value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #111827;
}

.gauge-value .label {
  font-size: 0.8rem;
  color: #6b7280;
}

.performance-info {
  text-align: center;
}

.performance-info h3 {
  font-size: 1.2rem;
  margin-bottom: 10px;
}

.performance-info p {
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 20px;
}

.target-progress {
  margin-bottom: 20px;
}

.target-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.progress-bar-container {
  height: 8px;
  background-color: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #2e5c31, #4a8f4d);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.target-values {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #6b7280;
}

.improve-btn {
  padding: 10px 20px;
  background-color: #2e5c31;
  border: none;
  border-radius: 20px;
  font-size: 0.9rem;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.improve-btn:hover {
  background-color: #26492a;
  transform: translateY(-2px);
}

/* Tips Modal Styles */
.tips-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.tips-modal {
  background-color: #fff;
  border-radius: 10px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.tips-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.tips-modal-header h3 {
  font-size: 1.2rem;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
}

.tips-modal-content {
  padding: 20px;
}

.tip-item {
  display: flex;
  margin-bottom: 20px;
}

.tip-number {
  width: 30px;
  height: 30px;
  background-color: #2e5c31;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 15px;
  flex-shrink: 0;
}

.tip-content {
  flex: 1;
}

.tip-content h4 {
  font-size: 1rem;
  margin: 0 0 8px 0;
  color: #111827;
}

.tip-content p {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
  text-align: left;
}

/* Dark mode styles */
:global(.dark) .performance-container {
  background-color: #1f2937;
  border-color: #374151;
}

:global(.dark) .performance-container h3,
:global(.dark) .performance-info h3 {
  color: #f9fafb;
}

:global(.dark) .gauge-value .value {
  color: #f9fafb;
}

:global(.dark) .gauge-value .label,
:global(.dark) .performance-info p,
:global(.dark) .target-values {
  color: #9ca3af;
}

:global(.dark) .progress-bar-container {
  background-color: #374151;
}

:global(.dark) .improve-btn {
  background-color: #4a8f4d;
}

:global(.dark) .improve-btn:hover {
  background-color: #3a7a3d;
}

:global(.dark) .tips-modal {
  background-color: #1f2937;
}

:global(.dark) .tips-modal-header {
  border-bottom-color: #374151;
}

:global(.dark) .tips-modal-header h3,
:global(.dark) .tip-content h4 {
  color: #f9fafb;
}

:global(.dark) .close-btn,
:global(.dark) .tip-content p {
  color: #9ca3af;
}

/* Responsive styles */
@media (max-width: 768px) {
  .gauge-container {
    height: 150px;
  }

  .gauge-value .value {
    font-size: 2rem;
  }

  .performance-info h3 {
    font-size: 1.1rem;
  }
}
</style>