<template>
  <div class="dashboard-container">
    <!-- Sidebar -->
    <div :class="['sidebar', { 'collapsed': isCollapsed }]">
      <button class="toggle-btn" @click="toggleSidebar">
        <i class="fas fa-bars"></i>
      </button>
      <div class="menu-items">
        <button @click="goToHomePage">
          <i class="fas fa-home"></i>
          <span v-if="!isCollapsed">Home</span>
        </button>
        <button @click="goToCustomerPage">
          <i class="fas fa-user"></i>
          <span v-if="!isCollapsed">Customer</span>
        </button>
        <button @click="goToSellerPage">
          <i class="fas fa-store"></i>
          <span v-if="!isCollapsed">Seller</span>
        </button>
        <button @click="navigate('supplier')">
          <i class="fas fa-truck"></i>
          <span v-if="!isCollapsed">Supplier</span>
        </button>
        <button @click="navigate('admin')">
          <i class="fas fa-user-cog"></i>
          <span v-if="!isCollapsed">Admin</span>
        </button>
        <button @click="navigate('analytics')">
          <i class="fas fa-chart-line"></i>
          <span v-if="!isCollapsed">Analytics</span>
        </button>
        <button @click="navigate('settings')">
          <i class="fas fa-cog"></i>
          <span v-if="!isCollapsed">Settings</span>
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Chart Container -->
      <div class="chart-container">
        <canvas ref="lineChart"></canvas>
      </div>

      <!-- Add Category Button -->
      <div class="add-category-button">
        <button @click="goToCategoryPage">
          <i class="fas fa-plus"></i> Add Category
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, ref } from 'vue';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { Chart, registerables } from 'chart.js';

export default {
  setup() {
    const lineChart = ref(null);
    const db = getFirestore();
    let chartInstance = null;

    // Register Chart.js components
    Chart.register(...registerables);

    // Fetch data from Firestore and update the chart
    const fetchData = () => {
      const customersData = [];
      const sellersData = [];
      const labels = [];

      // Fetch customers data
      onSnapshot(collection(db, 'users'), (snapshot) => {
        customersData.push(snapshot.size);
        labels.push(new Date().toLocaleDateString());
        updateChart();
      });

      // Fetch sellers data
      onSnapshot(collection(db, 'sellers'), (snapshot) => {
        sellersData.push(snapshot.size);
        updateChart();
      });

      // Update the chart with new data
      const updateChart = () => {
        if (chartInstance) {
          chartInstance.destroy();
        }

        const ctx = lineChart.value.getContext('2d');
        chartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Customers',
                data: customersData,
                borderColor: 'rgba(75, 192, 192, 1)',
                fill: false,
              },
              {
                label: 'Sellers',
                data: sellersData,
                borderColor: 'rgba(153, 102, 255, 1)',
                fill: false,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                display: true,
                title: {
                  display: true,
                  text: 'Date',
                },
              },
              y: {
                display: true,
                title: {
                  display: true,
                  text: 'Number of Users',
                },
                beginAtZero: true,
              },
            },
          },
        });
      };
    };

    onMounted(() => {
      fetchData();
    });

    return {
      lineChart,
    };
  },
  data() {
    return {
      isCollapsed: window.innerWidth < 768,
    };
  },
  methods: {
    toggleSidebar() {
      this.isCollapsed = !this.isCollapsed;
    },
    navigate(page) {
      this.$router.push(`/${page}`);
      if (window.innerWidth < 768) this.isCollapsed = true;
    },
    goToCustomerPage() {
      this.$router.push('/admin-customer');
    },
    goToHomePage() {
      this.$router.push('/admin-dashboard');
    },
    goToSellerPage() {
      this.$router.push('/admin-seller');
    },
    goToCategoryPage() {
      this.$router.push('/category'); // Navigate to the category page
    },
  },
  mounted() {
    window.addEventListener('resize', () => {
      this.isCollapsed = window.innerWidth < 768;
    });
  },
};
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css');

.dashboard-container {
  display: flex;
  height: 100vh;
  transition: all 0.3s;
}

.sidebar {
  width: 200px;
  background: #2e5c31;
  padding: 15px;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease-in-out;
  position: fixed;
  height: 100%;
  z-index: 1000;
  left: 0;
}

.sidebar.collapsed {
  width: 60px;
}

.menu-items {
  margin-top: 10px;
}

button {
  background: transparent;
  border: none;
  padding: 12px;
  cursor: pointer;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: white;
  transition: all 0.3s ease-in-out;
  width: 100%;
}

button i {
  font-size: 22px;
}

button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

/* Toggle Button */
.toggle-btn {
  background: #ffcc00;
  font-size: 20px;
  padding: 10px;
  color: black;
  border-radius: 50%;
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

/* Main Content */
.main-content {
  flex-grow: 1;
  padding: 20px;
  margin-left: 200px;
  transition: margin-left 0.3s;
}

/* Chart Container */
.chart-container {
  max-width: 800px;
  margin: 0 auto;
  height: 400px;
}

/* Add Category Button */
.add-category-button {
  text-align: center;
  margin-top: 20px;
}

.add-category-button button {
  background: #2e5c31;
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.add-category-button button:hover {
  background: #1e3a1f;
}

/* Adjust layout for small screens */
@media (max-width: 768px) {
  .sidebar {
    width: 60px;
  }

  .sidebar.collapsed {
    width: 200px;
  }

  .main-content {
    margin-left: 60px;
  }

  .sidebar.collapsed ~ .main-content {
    margin-left: 200px;
  }
}
</style>