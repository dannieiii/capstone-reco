<template>
    <div class="dashboard-card price-monitoring">
      <div class="card-header">
        <h3>Price Monitoring</h3>
        <div class="time-filters">
          <button v-for="(period, index) in timePeriods" 
                  :key="index" 
                  :class="{ active: activePeriod === period.value }"
                  @click="setActivePeriod(period.value)">
            {{ period.label }}
          </button>
        </div>
      </div>
      <div class="chart-container">
        <canvas ref="priceChart"></canvas>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import Chart from 'chart.js/auto';
  
  const timePeriods = [
    { label: '1W', value: '1w' },
    { label: '1M', value: '1m' },
    { label: '3M', value: '3m' },
    { label: '6M', value: '6m' },
    { label: '1Y', value: '1y' }
  ];
  
  const activePeriod = ref('1m');
  const priceChart = ref(null);
  
  const setActivePeriod = (period) => {
    activePeriod.value = period;
  };
  
  onMounted(() => {
    if (priceChart.value) {
      const ctx = priceChart.value.getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
          datasets: [
            {
              label: 'Rice',
              data: [45, 47, 50, 48, 52, 55, 53, 58, 60],
              borderColor: '#4a8f4d',
              backgroundColor: 'rgba(74, 143, 77, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'Vegetables',
              data: [30, 32, 35, 38, 36, 40, 42, 45, 43],
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'Fruits',
              data: [25, 28, 30, 32, 35, 34, 38, 40, 42],
              borderColor: '#e05d44',
              backgroundColor: 'rgba(224, 93, 68, 0.1)',
              tension: 0.4,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
            },
            tooltip: {
              mode: 'index',
              intersect: false
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              title: {
                display: true,
                text: 'Price (USD)'
              }
            }
          }
        }
      });
    }
  });
  </script>
  
  <style scoped>
  .dashboard-card {
    background-color: #fff;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .card-header h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }
  
  .time-filters {
    display: flex;
    background-color: #f3f4f6;
    border-radius: 8px;
    padding: 4px;
  }
  
  .time-filters button {
    padding: 6px 12px;
    border: none;
    background: none;
    border-radius: 6px;
    font-size: 0.8rem;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .time-filters button.active {
    background-color: #fff;
    color: #3498db;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .chart-container {
    height: 250px;
    position: relative;
  }
  </style>