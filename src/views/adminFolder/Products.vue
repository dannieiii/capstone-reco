<template>
    <div class="dashboard-container">
      <AdminSidebar />
      <div class="main-content">
        <h1 class="page-title">Products Management</h1>
        <div class="products-stats">
          <div class="stat-card">
            <h3>Total Products</h3>
            <p class="stat-value">1,286</p>
          </div>
          <div class="stat-card">
            <h3>Active Products</h3>
            <p class="stat-value">1,180</p>
          </div>
          <div class="stat-card">
            <h3>Out of Stock</h3>
            <p class="stat-value">24</p>
          </div>
        </div>
        <div class="products-grid">
          <div v-for="product in products" :key="product.id" class="product-card">
            <img :src="product.image" :alt="product.name" class="product-image">
            <div class="product-info">
              <h3>{{ product.name }}</h3>
              <p class="product-category">{{ product.category }}</p>
              <p class="product-price">${{ product.price.toFixed(2) }}</p>
              <p class="product-stock">Stock: {{ product.stock }}</p>
              <span :class="['status', product.status.toLowerCase().replace(' ', '-')]">
                {{ product.status }}
              </span>
            </div>
            <div class="product-actions">
              <button class="action-btn view">View</button>
              <button class="action-btn edit">Edit</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import AdminSidebar from '@/components/AdminSidebar.vue';
  
  const products = ref([
    { id: 'P001', name: 'Organic Tomatoes', category: 'Vegetables', price: 2.99, stock: 500, status: 'Active', image: 'https://source.unsplash.com/featured/?tomato' },
    { id: 'P002', name: 'Fresh Apples', category: 'Fruits', price: 1.50, stock: 1000, status: 'Active', image: 'https://source.unsplash.com/featured/?apple' },
    { id: 'P003', name: 'Whole Grain Bread', category: 'Grains', price: 3.50, stock: 200, status: 'Active', image: 'https://source.unsplash.com/featured/?bread' },
    { id: 'P004', name: 'Organic Milk', category: 'Dairy', price: 4.99, stock: 150, status: 'Active', image: 'https://source.unsplash.com/featured/?milk' },
    { id: 'P005', name: 'Free-range Eggs', category: 'Dairy', price: 5.99, stock: 0, status: 'Out of Stock', image: 'https://source.unsplash.com/featured/?eggs' },
    { id: 'P006', name: 'Fresh Spinach', category: 'Vegetables', price: 2.49, stock: 300, status: 'Active', image: 'https://source.unsplash.com/featured/?spinach' },
  ]);
  </script>
  
  <style scoped>
  .dashboard-container {
    display: flex;
    min-height: 100vh;
    background-color: #f0f4f8;
  }
  
  .main-content {
    flex: 1;
    padding: 2rem;
  }
  
  .page-title {
    font-size: 2rem;
    color: #2e5c31;
    margin-bottom: 1.5rem;
  }
  
  .products-stats {
    display: flex;
    justify-content: space-between;
    margin-bottom: 2rem;
  }
  
  .stat-card {
    background-color: #ffffff;
    border-radius: 8px;
    padding: 1.5rem;
    width: 30%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .stat-card h3 {
    font-size: 1rem;
    color: #4a5568;
    margin-bottom: 0.5rem;
  }
  
  .stat-value {
    font-size: 2rem;
    font-weight: bold;
    color: #2e5c31;
    margin: 0;
  }
  
  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 2rem;
  }
  
  .product-card {
    background-color: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s;
  }
  
  .product-card:hover {
    transform: translateY(-5px);
  }
  
  .product-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }
  
  .product-info {
    padding: 1rem;
  }
  
  .product-info h3 {
    font-size: 1.25rem;
    color: #2d3748;
    margin-bottom: 0.5rem;
  }
  
  .product-category {
    font-size: 0.875rem;
    color: #718096;
    margin-bottom: 0.5rem;
  }
  
  .product-price {
    font-size: 1.25rem;
    font-weight: bold;
    color: #2e5c31;
    margin-bottom: 0.5rem;
  }
  
  .product-stock {
    font-size: 0.875rem;
    color: #718096;
    margin-bottom: 0.5rem;
  }
  
  .status {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .status.active {
    background-color: #c6f6d5;
    color: #2f855a;
  }
  
  .status.out-of-stock {
    background-color: #fed7d7;
    color: #9b2c2c;
  }
  
  .product-actions {
    display: flex;
    padding: 1rem;
    background-color: #f8fafc;
  }
  
  .action-btn {
    flex: 1;
    padding: 0.5rem;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .action-btn.view {
    background-color: #4299e1;
    color: white;
    margin-right: 0.5rem;
  }
  
  .action-btn.edit {
    background-color: #48bb78;
    color: white;
  }
  
  .action-btn:hover {
    opacity: 0.9;
  }
  </style>
  
  