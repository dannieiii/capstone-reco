<template>
    <div class="dashboard-card forecasting">
      <div class="card-header">
        <h3>Harvest Forecasting</h3>
        <select class="product-select">
          <option>Rice</option>
          <option>Corn</option>
          <option>Vegetables</option>
          <option>Fruits</option>
        </select>
      </div>
      <div class="chart-container">
        <canvas ref="forecastChart"></canvas>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import Chart from 'chart.js/auto';
  
  const forecastChart = ref(null);
  
  onMounted(() => {
    if (forecastChart.value) {
      const ctx = forecastChart.value.getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
          datasets: [
            {
              label: 'Predicted Harvest (tons)',
              data: [120, 145, 135, 110, 95, 130],
              backgroundColor: '#4a8f4d',
            },
            {
              label: 'Actual Harvest (tons)',
              data: [125, 150, 130, 105, null, null],
              backgroundColor: '#f0b429',
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
              beginAtZero: true,
              title: {
                display: true,
                text: 'Harvest Volume (tons)'
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
  
  .product-select {
    padding: 6px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 0.9rem;
    color: #6b7280;
    background-color: #fff;
    outline: none;
  }
  
  .chart-container {
    height: 250px;
    position: relative;
  }
  </style>