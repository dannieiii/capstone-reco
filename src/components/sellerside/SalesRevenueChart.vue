<template>
  <div class="chart-card">    <div class="chart-header">
      <h2>Sales Revenue</h2>
      <div class="header-controls">
        <button 
          @click="createSampleOrders" 
          class="sample-data-btn"
          title="Create sample data for testing"
        >
          📊 Generate Sample Data
        </button>
        <div class="period-selector">
          <button 
            v-for="period in timePeriods" 
            :key="period.value"
            :class="{ 'active': activePeriod === period.value }"
            @click="$emit('setActivePeriod', period.value)"
          >
            {{ period.label }}
          </button>
        </div>
      </div>
    </div>
    
    <div class="revenue-stats">
      <div class="stat-card">
        <div class="stat-icon total-revenue-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Revenue</span>
          <span class="stat-value">{{ currency }}{{ formatNumber(totalRevenue) }}</span>
          <div class="stat-change positive">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
            <span>+{{ revenueGrowth }}% from last period</span>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon total-orders-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Orders</span>
          <span class="stat-value">{{ totalOrders }}</span>
          <div class="stat-change positive">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
            <span>+{{ ordersGrowth }}% from last period</span>
          </div>
        </div>
      </div>        <div class="stat-card">
        <div class="stat-icon avg-order-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v20m8-10H4"></path>
            <path d="M12 2L8 6l4 4 4-4-4-4z"></path>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">Profit Margin</span>
          <span class="stat-value">{{ profitMargin }}%</span>
          <div class="stat-change" :class="profitMargin >= 15 ? 'positive' : 'negative'">
            <svg v-if="profitMargin >= 15" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
              <polyline points="17 18 23 18 23 12"></polyline>
            </svg>
            <span v-if="profitMargin >= 15">Healthy margin</span>
            <span v-else>Below target (15%)</span>
          </div>
          <div class="additional-info">
            <small>Stock: {{ formatNumber(totalStock) }} items</small>
          </div>
        </div>
      </div>
    </div>
    
    <div class="chart-wrapper">
      <canvas ref="salesChart"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import Chart from 'chart.js/auto';
import { getFirestore, collection, query, where, getDocs, orderBy, addDoc, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const props = defineProps({
  totalRevenue: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: '₱'
  },
  timePeriods: {
    type: Array,
    default: () => []
  },
  activePeriod: {
    type: String,
    default: '1m'
  }
});

defineEmits(['setActivePeriod']);

const salesChart = ref(null);
let chartInstance = null;
const db = getFirestore();

// Stats data with default values
const totalRevenue = ref(0); // Local reactive total revenue
const totalOrders = ref(0);
const avgOrderValue = ref(0);
const totalStock = ref(0);
const lowStockProducts = ref(0);
const profitMargin = ref(0);
const revenueGrowth = ref(12);
const ordersGrowth = ref(8);
const avgOrderDecline = ref(3);

// Format number with commas
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Generate sample data for testing (remove this in production)
const generateSampleData = (labels) => {
  const revenueData = [];
  const ordersData = [];
  
  // Generate realistic sample data based on period
  for (let i = 0; i < labels.length; i++) {
    // Generate random but realistic revenue (between 1000-5000)
    const baseRevenue = Math.random() * 4000 + 1000;
    const revenue = Math.round(baseRevenue);
    
    // Generate orders (between 1-15)
    const orders = Math.floor(Math.random() * 14) + 1;
    
    revenueData.push(revenue);
    ordersData.push(orders);
  }
  
  return { revenueData, ordersData };
};

// Create sample orders in Firestore (call this once to populate data)
const createSampleOrders = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    console.error('User not authenticated');
    return;
  }
  
  try {
    const ordersRef = collection(db, 'orders');
    const now = new Date();
    
    // Create 10 sample orders over the last 30 days
    for (let i = 0; i < 10; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const orderDate = new Date(now);
      orderDate.setDate(orderDate.getDate() - daysAgo);
      
      const sampleOrder = {
        sellerId: user.uid,
        timestamp: Timestamp.fromDate(orderDate),
        totalPrice: Math.floor(Math.random() * 3000) + 500, // 500-3500
        status: 'completed',
        buyerId: 'sample_buyer_' + i,
        items: [
          {
            productId: 'sample_product_' + (i % 3), // Rotate between 3 products
            quantity: Math.floor(Math.random() * 5) + 1,
            price: Math.floor(Math.random() * 200) + 50
          }
        ]
      };
      
      await addDoc(ordersRef, sampleOrder);
      console.log(`Created sample order ${i + 1}`);
    }
    
    console.log('Sample orders created successfully!');
  } catch (error) {
    console.error('Error creating sample orders:', error);
  }
};



// Calculate profit margin and growth metrics
const calculateAdvancedMetrics = (revenueData, ordersData) => {
  const totalRev = revenueData.reduce((sum, val) => sum + val, 0);
  const totalOrd = ordersData.reduce((sum, val) => sum + val, 0);
  
  // Calculate average profit margin (simulated based on order value)
  if (totalOrd > 0) {
    const avgOrderVal = totalRev / totalOrd;
    // Simulate profit margin: higher order value = better margin
    const calculatedMargin = Math.min(Math.max((avgOrderVal / 100) * 15, 5), 25);
    profitMargin.value = parseFloat(calculatedMargin.toFixed(1));
  } else {
    profitMargin.value = 0;
  }
  
  // Calculate growth rates (compare recent vs earlier periods)
  const midPoint = Math.floor(revenueData.length / 2);
  const firstHalf = revenueData.slice(0, midPoint);
  const secondHalf = revenueData.slice(midPoint);
  
  const firstHalfSum = firstHalf.reduce((sum, val) => sum + val, 0);
  const secondHalfSum = secondHalf.reduce((sum, val) => sum + val, 0);
  
  if (firstHalfSum > 0) {
    const growth = ((secondHalfSum - firstHalfSum) / firstHalfSum) * 100;
    revenueGrowth.value = Math.round(Math.abs(growth));
  }
};

// Fetch and count total orders for the current seller
const fetchTotalOrdersCount = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    console.error('User not authenticated');
    totalOrders.value = 0;
    return 0;
  }
  
  try {
    const ordersRef = collection(db, 'orders');
    const ordersQuery = query(
      ordersRef,
      where('sellerId', '==', user.uid)
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    const orderCount = ordersSnapshot.size;
    
    console.log(`Total orders for seller ${user.uid}:`, orderCount);
    
    // Log some sample order data for debugging
    if (orderCount > 0) {
      console.log('Sample orders:');
      ordersSnapshot.docs.slice(0, 3).forEach((doc, index) => {
        const orderData = doc.data();
        console.log(`Order ${index + 1}:`, {
          id: doc.id,
          sellerId: orderData.sellerId,
          totalPrice: orderData.totalPrice || orderData.total || orderData.amount || 'N/A',
          timestamp: orderData.timestamp?.toDate?.() || orderData.createdAt?.toDate?.() || 'No timestamp',
          status: orderData.status || 'No status',
          itemCount: orderData.items?.length || 'No items'
        });
      });
    } else {
      console.log('No orders found for this seller. You may need to generate sample data.');
    }
    
    // Update the reactive total orders value
    totalOrders.value = orderCount;
    
    return orderCount;
  } catch (error) {
    console.error('Error fetching total orders count:', error);
    totalOrders.value = 0;
    return 0;
  }
};

// Fetch stock information
const fetchStockInfo = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    console.error('User not authenticated');
    return;
  }
  
  try {
    const productsRef = collection(db, 'products');
    const productsQuery = query(
      productsRef,
      where('sellerId', '==', user.uid)
    );
    
    const productsSnapshot = await getDocs(productsQuery);
    let stockCount = 0;
    let lowStockCount = 0;
    
    productsSnapshot.forEach((doc) => {
      const productData = doc.data();
      const stock = productData.stock || productData.quantity || 0;
      stockCount += stock;
      
      // Consider low stock if less than 10 items
      if (stock < 10 && stock > 0) {
        lowStockCount++;
      }
    });
    
    totalStock.value = stockCount;
    lowStockProducts.value = lowStockCount;
    
    console.log('Total Stock:', stockCount, 'Low Stock Products:', lowStockCount);
  } catch (error) {
    console.error('Error fetching stock info:', error);
  }
};

// Initialize sales chart with data
const initSalesChart = async () => {
  if (!salesChart.value) return;
  
  const ctx = salesChart.value.getContext('2d');
  
  if (chartInstance) {
    chartInstance.destroy();
  }
  
  // Fetch chart data based on active period
  const { labels, revenueData, ordersData } = await fetchChartData();
  
  // Fetch stock information
  await fetchStockInfo();
  
  // Fetch total orders count for accurate statistics
  await fetchTotalOrdersCount();
  
  // Calculate stats
  if (revenueData.length > 0 && ordersData.length > 0) {
    const totalRev = revenueData.reduce((sum, val) => sum + val, 0);
    const totalOrd = ordersData.reduce((sum, val) => sum + val, 0);
    
    totalRevenue.value = totalRev; // Update local total revenue
    // Note: totalOrders.value is updated by fetchTotalOrdersCount()
    avgOrderValue.value = totalOrders.value > 0 ? Math.round(totalRev / totalOrders.value) : 0;
    
    // Calculate advanced metrics
    calculateAdvancedMetrics(revenueData, ordersData);
  } else {
    // Reset stats if no data
    totalRevenue.value = 0;
    // totalOrders.value is handled by fetchTotalOrdersCount()
    avgOrderValue.value = 0;
  }
  
  // Debug: Log final data being used for chart
  console.log('Final chart data:', {
    labels,
    revenueData,
    ordersData,
    totalRevenue: totalRevenue.value,
    totalOrders: totalOrders.value
  });
  
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Sales Revenue',
          data: revenueData,
          backgroundColor: '#2e5c31',
          borderColor: '#2e5c31',
          borderWidth: 1,
          type: 'bar',
          yAxisID: 'y',
          order: 3
        },
        {
          label: 'Order Volume',
          data: ordersData.map(val => val * 50), // Scale orders for visual comparison
          backgroundColor: '#84cc16',
          borderColor: '#84cc16',
          borderWidth: 1,
          type: 'bar',
          yAxisID: 'y',
          order: 2
        },
        {
          label: 'Profitability Trend',
          data: revenueData.map((revenue, index) => {
            // Calculate profit margin based on revenue (simulated)
            const orders = ordersData[index];
            if (orders === 0) return 0;
            const avgOrderValue = revenue / orders;
            return Math.min(Math.max((avgOrderValue / 100) * 15, 0), 12); // Scale to 0-12 range
          }),
          borderColor: '#dc2626',
          backgroundColor: 'transparent',
          borderWidth: 3,
          type: 'line',
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#dc2626',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          yAxisID: 'y1',
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            boxWidth: 8,
            padding: 20,
            font: {
              size: window.innerWidth < 768 ? 11 : 12,
              weight: '500'
            },
            generateLabels: function(chart) {
              const original = Chart.defaults.plugins.legend.labels.generateLabels;
              const labels = original.call(this, chart);
              
              // Customize legend items
              labels.forEach((label, index) => {
                if (index === 2) { // Profitability line
                  label.pointStyle = 'line';
                  label.lineWidth = 3;
                }
              });
              
              return labels;
            }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#374151',
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            title: function(context) {
              return `Period: ${context[0].label}`;
            },
            label: function(context) {
              const label = context.dataset.label || '';
              if (label === 'Sales Revenue') {
                return `${label}: ${props.currency}${formatNumber(context.raw)}`;
              } else if (label === 'Order Volume') {
                return `Orders: ${Math.round(context.raw / 50)}`; // Convert back to actual orders
              } else if (label === 'Profitability Trend') {
                return `Profit Margin: ${context.raw.toFixed(1)}%`;
              }
              return `${label}: ${context.raw}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#6b7280',
            font: {
              size: window.innerWidth < 768 ? 10 : 11,
              weight: '500'
            },
            maxTicksLimit: window.innerWidth < 768 ? 6 : 12
          },
          border: {
            color: '#e5e7eb'
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Revenue & Volume',
            color: '#6b7280',
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          ticks: {
            color: '#6b7280',
            callback: function(value) {
              if (value >= 1000) {
                return props.currency + (value / 1000).toFixed(0) + 'K';
              }
              return props.currency + formatNumber(value);
            },
            font: {
              size: window.innerWidth < 768 ? 10 : 11
            }
          },
          grid: {
            color: '#f3f4f6',
            borderDash: [2, 4]
          },
          border: {
            color: '#e5e7eb'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          beginAtZero: true,
          max: 12,
          title: {
            display: true,
            text: 'Profit Margin (%)',
            color: '#dc2626',
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          ticks: {
            color: '#dc2626',
            callback: function(value) {
              return value.toFixed(1) + '%';
            },
            font: {
              size: window.innerWidth < 768 ? 10 : 11
            },
            stepSize: 2
          },
          grid: {
            drawOnChartArea: false,
            color: '#fca5a5'
          },
          border: {
            color: '#dc2626'
          }
        }
      },
      elements: {
        bar: {
          borderRadius: 2,
          borderSkipped: false,
        }
      }
    }
  });
};

// Fetch chart data from Firestore based on active period
const fetchChartData = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    console.error('User not authenticated');
    return { labels: [], revenueData: [], ordersData: [] };
  }
  
  // Determine date range based on active period
  const now = new Date();
  let startDate = new Date();
  let labels = [];
  
  switch (props.activePeriod) {
    case '1d': // Today
      startDate.setHours(0, 0, 0, 0);
      labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
      break;
    case '7d': // This Week
      startDate.setDate(now.getDate() - 7);
      labels = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - 6 + i);
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      });
      break;
    case '1m': // This Month
      startDate.setMonth(now.getMonth(), 1); // First day of current month
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
      break;
    case '1y': // This Year
      startDate.setMonth(0, 1); // January 1st of current year
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      break;
    default:
      startDate.setMonth(now.getMonth(), 1); // Default to month
      const defaultDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      labels = Array.from({ length: defaultDaysInMonth }, (_, i) => `${i + 1}`);
  }
  
  try {
    // Fetch products data to get product details and stock info
    const productsRef = collection(db, 'products');
    const productsQuery = query(
      productsRef,
      where('sellerId', '==', user.uid)
    );
    
    const productsSnapshot = await getDocs(productsQuery);
    const products = {};
      productsSnapshot.forEach((doc) => {
      const productData = doc.data();
      products[doc.id] = {
        ...productData,
        id: doc.id,
        price: productData.price || 0,
        stock: productData.stock || productData.quantity || 0
      };
    });
    
    console.log('Fetched products data:', products); // Debug log
    console.log('Products summary:', Object.values(products).map(p => ({
      id: p.id,
      name: p.name || p.title || 'No Name',
      price: p.price,
      stock: p.stock
    }))); // Summary with names
      // Fetch orders data - Remove orderBy to avoid index requirement
    const ordersRef = collection(db, 'orders');
    const ordersQuery = query(
      ordersRef,
      where('sellerId', '==', user.uid),
      where('timestamp', '>=', startDate)
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    const orders = ordersSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      timestamp: doc.data().timestamp?.toDate?.() || doc.data().createdAt?.toDate?.() || new Date()
    }));
    
    // Sort orders manually by timestamp
    orders.sort((a, b) => a.timestamp - b.timestamp);
    
    console.log('Fetched orders data:', orders); // Debug log
    
    // Initialize data arrays
    let revenueData = Array(labels.length).fill(0);
    let ordersData = Array(labels.length).fill(0);
      // Process orders based on active period
    orders.forEach((order, orderIndex) => {
      let index = 0;
      
      if (props.activePeriod === '1d') {
        // For today, group by hour
        index = order.timestamp.getHours();
      } else if (props.activePeriod === '7d') {
        // For week, group by day
        const dayDiff = Math.floor((order.timestamp - startDate) / (1000 * 60 * 60 * 24));
        index = Math.min(Math.max(dayDiff, 0), 6);
      } else if (props.activePeriod === '1m') {
        // For month, group by day of month
        index = order.timestamp.getDate() - 1;
      } else if (props.activePeriod === '1y') {
        // For year, group by month
        index = order.timestamp.getMonth();
      }
      
      if (index >= 0 && index < labels.length) {
        // Calculate revenue from order items
        let orderRevenue = 0;
        let orderProducts = []; // Track product names for logging
        
        if (order.items && Array.isArray(order.items)) {
          // If order has items array
          order.items.forEach(item => {
            const product = products[item.productId];
            if (product) {
              const itemPrice = item.price || product.price || 0;
              const itemQuantity = item.quantity || 1;
              const itemRevenue = itemPrice * itemQuantity;
              orderRevenue += itemRevenue;
              
              orderProducts.push({
                name: product.name || product.title || 'Unknown Product',
                price: itemPrice,
                quantity: itemQuantity,
                revenue: itemRevenue
              });
            }
          });
        } else if (order.totalPrice || order.total || order.amount) {
          // If order has direct total
          orderRevenue = order.totalPrice || order.total || order.amount || 0;
          orderProducts.push({
            name: 'Direct Order Total',
            revenue: orderRevenue
          });
        } else if (order.productId && products[order.productId]) {
          // If single product order
          const product = products[order.productId];
          const orderPrice = order.price || product.price || 0;
          const orderQuantity = order.quantity || 1;
          orderRevenue = orderPrice * orderQuantity;
          
          orderProducts.push({
            name: product.name || product.title || 'Unknown Product',
            price: orderPrice,
            quantity: orderQuantity,
            revenue: orderRevenue
          });
        }
        
        // Log order details with product information
        if (orderRevenue > 0) {
          console.log(`Order ${orderIndex + 1} (${order.timestamp.toLocaleDateString()}):`, {
            orderId: order.id,
            totalRevenue: orderRevenue,
            products: orderProducts,
            timeIndex: index,
            period: labels[index]
          });
        }
        
        revenueData[index] += orderRevenue;
        ordersData[index] += 1; // Count each order
      }
    });
      console.log('Processed revenue data:', revenueData); // Debug log
    console.log('Processed orders data:', ordersData); // Debug log
    
    // Calculate total revenue by product for summary
    const productRevenueSummary = {};
    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const product = products[item.productId];
          if (product) {
            const productName = product.name || product.title || 'Unknown Product';
            const itemRevenue = (item.price || product.price || 0) * (item.quantity || 1);
            
            if (!productRevenueSummary[productName]) {
              productRevenueSummary[productName] = 0;
            }
            productRevenueSummary[productName] += itemRevenue;
          }
        });
      } else if (order.productId && products[order.productId]) {
        const product = products[order.productId];
        const productName = product.name || product.title || 'Unknown Product';
        const orderRevenue = (order.price || product.price || 0) * (order.quantity || 1);
        
        if (!productRevenueSummary[productName]) {
          productRevenueSummary[productName] = 0;
        }
        productRevenueSummary[productName] += orderRevenue;
      }
    });
      console.log('Revenue by Product:', productRevenueSummary);
    
    // If no real data found, use sample data for demonstration
    const hasRealData = revenueData.some(val => val > 0) || ordersData.some(val => val > 0);
    
    if (!hasRealData) {
      console.log('No real data found, generating sample data for demonstration...');
      const sampleData = generateSampleData(labels);
      return { 
        labels, 
        revenueData: sampleData.revenueData, 
        ordersData: sampleData.ordersData 
      };
    }
    
    return { labels, revenueData, ordersData };
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return { 
      labels, 
      revenueData: Array(labels.length).fill(0), 
      ordersData: Array(labels.length).fill(0) 
    };
  }
};

// Watch for changes in active period and update chart
watch(() => props.activePeriod, () => {
  initSalesChart();
});

// Initialize chart when component is mounted
onMounted(() => {
  initSalesChart();
  
  // Handle dark mode
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class' && 
          document.body.classList.contains('dark') && 
          chartInstance) {
        // Update chart text colors for dark mode
        chartInstance.options.scales.x.ticks.color = '#9ca3af';
        chartInstance.options.scales.y.ticks.color = '#9ca3af';
        chartInstance.options.scales.y1.ticks.color = '#9ca3af';
        chartInstance.options.plugins.legend.labels.color = '#9ca3af';
        chartInstance.update();
      } else if (mutation.attributeName === 'class' && 
                !document.body.classList.contains('dark') && 
                chartInstance) {
        // Update chart text colors for light mode
        chartInstance.options.scales.x.ticks.color = '#6b7280';
        chartInstance.options.scales.y.ticks.color = '#6b7280';
        chartInstance.options.scales.y1.ticks.color = '#6b7280';
        chartInstance.options.plugins.legend.labels.color = '#6b7280';
        chartInstance.update();
      }
    });
  });
  
  observer.observe(document.body, { attributes: true });
  
  // Clean up
  onBeforeUnmount(() => {
    if (chartInstance) {
      chartInstance.destroy();
    }
    observer.disconnect();
  });
});
</script>

<style scoped>
.chart-card {
  background-color: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.sample-data-btn {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.sample-data-btn:hover {
  background: linear-gradient(135deg, #1d4ed8, #1e40af);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.chart-header h2 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.period-selector {
  display: flex;
  align-items: center;
  background-color: #f3f4f6;
  border-radius: 6px;
  padding: 2px;
  font-size: 0.8rem;
}

.period-selector button {
  background: none;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  color: #6b7280;
}

.period-selector button.active {
  background-color: #fff;
  color: #111827;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.revenue-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  background-color: #f9fafb;
  border-radius: 8px;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.total-revenue-icon {
  background-color: #2e5c31;
}

.total-orders-icon {
  background-color: #4a8f4d;
}

.avg-order-icon {
  background-color: #f59e0b;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.8rem;
  color: #6b7280;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: #111827;
  margin: 2px 0;
}

.stat-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
}

.stat-change.positive {
  color: #10b981;
}

.stat-change.negative {
  color: #ef4444;
}

.additional-info {
  margin-top: 4px;
}

.additional-info small {
  color: #9ca3af;
  font-size: 0.7rem;
}

.chart-wrapper {
  position: relative;
  flex-grow: 1;
  min-height: 300px;
}

/* Dark mode styles */
:global(.dark) .chart-card {
  background-color: #1f2937;
}

:global(.dark) .chart-header h2,
:global(.dark) .stat-value {
  color: #f9fafb;
}

:global(.dark) .stat-label {
  color: #9ca3af;
}

:global(.dark) .period-selector {
  background-color: #374151;
}

:global(.dark) .period-selector button {
  color: #9ca3af;
}

:global(.dark) .period-selector button.active {
  background-color: #1f2937;
  color: #f9fafb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

:global(.dark) .stat-card {
  background-color: #111827;
}

:global(.dark) .additional-info small {
  color: #6b7280;
}

/* Responsive styles */
@media (max-width: 992px) {
  .revenue-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .chart-wrapper {
    min-height: 350px;
  }
}

@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .header-controls {
    width: 100%;
    justify-content: space-between;
  }
  
  .period-selector {
    font-size: 0.75rem;
  }
  
  .period-selector button {
    padding: 4px 8px;
  }
  
  .sample-data-btn {
    font-size: 0.75rem;
    padding: 5px 10px;
  }
  
  .revenue-stats {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  
  .stat-card {
    padding: 10px;
    gap: 8px;
  }
  
  .stat-icon {
    width: 32px;
    height: 32px;
  }
  
  .stat-label {
    font-size: 0.7rem;
  }
  
  .stat-value {
    font-size: 1rem;
  }
  
  .stat-change {
    font-size: 0.65rem;
  }
  
  .stat-change svg {
    width: 12px;
    height: 12px;
  }
  
  .chart-wrapper {
    min-height: 400px;
  }
}

@media (max-width: 576px) {
  .chart-wrapper {
    min-height: 450px;
  }
  
  .revenue-stats {
    gap: 6px;
  }
  
  .stat-card {
    padding: 8px;
    gap: 6px;
  }
  
  .stat-icon {
    width: 28px;
    height: 28px;
  }
  
  .stat-label {
    font-size: 0.65rem;
  }
  
  .stat-value {
    font-size: 0.9rem;
  }
  
  .stat-change {
    font-size: 0.6rem;
  }
}
</style>