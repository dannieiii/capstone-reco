<template>
    <div class="dashboard-card sellers-overview">
      <div class="card-header">
        <h3>Seller Overview</h3>
        <button class="view-all-btn" @click="navigateToSellers">View All</button>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Seller</th>
            <th>Products</th>
            <th>Revenue</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(seller, index) in topSellers" :key="index">
            <td>
              <div class="seller-info">
                <div class="seller-avatar">
                  <img :src="seller.avatar || '/placeholder.svg?height=40&width=40'" alt="Seller avatar" />
                </div>
                <div>
                  <div class="seller-name">{{ seller.name }}</div>
                  <div class="seller-location">{{ seller.location }}</div>
                </div>
              </div>
            </td>
            <td>{{ seller.products }}</td>
            <td>${{ seller.revenue.toLocaleString() }}</td>
            <td>
              <span class="status-badge" :class="seller.status.toLowerCase()">
                {{ seller.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  
  const router = useRouter();
  
  const topSellers = ref([
    {
      name: 'Green Harvest Farm',
      location: 'California',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      products: 48,
      revenue: 12450,
      status: 'Active'
    },
    {
      name: 'Sunshine Organics',
      location: 'Florida',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      products: 36,
      revenue: 9870,
      status: 'Active'
    },
    {
      name: 'Valley Fresh Produce',
      location: 'Oregon',
      avatar: 'https://randomuser.me/api/portraits/men/68.jpg',
      products: 24,
      revenue: 7650,
      status: 'Pending'
    },
    {
      name: 'Mountain View Farms',
      location: 'Colorado',
      avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
      products: 18,
      revenue: 5430,
      status: 'Inactive'
    }
  ]);
  
  const navigateToSellers = () => {
    router.push('/admin/sellers');
  };
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
  
  .view-all-btn {
    background: none;
    border: none;
    color: #3498db;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
  }
  
  .data-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .data-table th {
    text-align: left;
    padding: 12px 16px;
    font-size: 0.85rem;
    font-weight: 500;
    color: #6b7280;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .data-table td {
    padding: 12px 16px;
    font-size: 0.9rem;
    color: #111827;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .seller-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .seller-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    overflow: hidden;
  }
  
  .seller-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .seller-name {
    font-weight: 500;
  }
  
  .seller-location {
    font-size: 0.8rem;
    color: #6b7280;
  }
  
  .status-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
  }
  
  .status-badge.active {
    background-color: #dcfce7;
    color: #16a34a;
  }
  
  .status-badge.pending {
    background-color: #fef3c7;
    color: #d97706;
  }
  
  .status-badge.inactive {
    background-color: #f3f4f6;
    color: #6b7280;
  }
  </style>