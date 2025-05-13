<template>
    <div class="dashboard-card product-categories">
      <div class="card-header">
        <h3>Product Categories</h3>
        <button class="add-btn" @click="navigateToAddCategory">
          <Plus size="16" />
          Add Category
        </button>
      </div>
      <div class="categories-grid">
        <div v-for="(category, index) in categories" :key="index" class="category-card">
          <div class="category-icon" :style="{ backgroundColor: getCategoryColor(index) }">
            <component :is="getCategoryIcon(index)" size="24" color="white" />
          </div>
          <div class="category-info">
            <h4>{{ category.categoryName }}</h4>
            <p>{{ category.productCount || 0 }} Products</p>
          </div>
          <div class="category-actions">
            <button class="action-btn" @click="editCategory(category)">
              <Edit size="16" />
            </button>
            <button class="action-btn" @click="confirmDeleteCategory(category)">
              <Trash size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { Plus, Edit, Trash, Sprout, Apple, Wheat, Leaf } from 'lucide-vue-next';
  
  const router = useRouter();
  
  const categories = ref([
    { categoryName: 'Vegetables', productCount: 120 },
    { categoryName: 'Fruits', productCount: 85 },
    { categoryName: 'Grains', productCount: 60 },
    { categoryName: 'Dairy', productCount: 45 }
  ]);
  
  const getCategoryIcon = (index) => {
    const icons = [Sprout, Apple, Wheat, Leaf];
    return icons[index % icons.length];
  };
  
  const getCategoryColor = (index) => {
    const colors = ['#4a8f4d', '#e05d44', '#f0b429', '#3b82f6'];
    return colors[index % colors.length];
  };
  
  const navigateToAddCategory = () => {
    router.push('/add-category');
  };
  
  const editCategory = (category) => {
    router.push(`/add-category?id=${category.id}`);
  };
  
  const confirmDeleteCategory = (category) => {
    console.log('Confirm delete category:', category);
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
  
  .add-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .add-btn:hover {
    background-color: #2980b9;
  }
  
  .categories-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
  
  .category-card {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
    border-radius: 8px;
    background-color: #f9fafb;
    position: relative;
  }
  
  .category-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .category-info {
    flex: 1;
  }
  
  .category-info h4 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 5px 0;
    color: #111827;
  }
  
  .category-info p {
    font-size: 0.8rem;
    color: #6b7280;
    margin: 0;
  }
  
  .category-actions {
    display: flex;
    gap: 5px;
  }
  
  .action-btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .action-btn:hover {
    background-color: #e5e7eb;
    color: #111827;
  }
  </style>