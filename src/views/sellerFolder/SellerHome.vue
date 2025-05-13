<template>
  <div class="seller-home">
    <!-- Header -->
    <div class="header">
      <h1 class="app-title">FarmXpress</h1>
      <div class="icons">
        <i class="fas fa-comments"></i>
        <i class="fas fa-user-circle"></i>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <h2>Welcome, Seller!</h2>
      <p>Manage your shop and track sales easily.</p>

      <div class="cards">
        <div class="card">
          <i class="fas fa-box"></i>
          <span>Add Products</span>
        </div>
        <div class="card">
          <i class="fas fa-shopping-cart"></i>
          <span>Orders</span>
        </div>
        <div class="card">
          <i class="fas fa-chart-line"></i>
          <span>Forecast Sales</span>
        </div>
        <div class="card">
          <i class="fas fa-bell"></i>
          <span>Notifications</span>
        </div>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <div class="bottom-nav">
      <router-link to="/seller-home">
        <i class="fas fa-home"></i>
      </router-link>
      <router-link to="/product-category">
        <i class="fas fa-plus-circle"></i>
      </router-link>
      <router-link to="/orders">
        <i class="fas fa-shopping-cart"></i>
      </router-link>
      <router-link to="/sales">
        <i class="fas fa-chart-line"></i>
      </router-link>
      <router-link to="/notifications">
        <i class="fas fa-bell"></i>
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: "SellerHome",
};
</script>

<style scoped>
.seller-home {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;
  background: #f2f2f2;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #2e5c31;
  color: white;
}

.icons i {
  font-size: 24px;
  margin-left: 15px;
}

.main-content {
  text-align: center;
  padding: 20px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-top: 20px;
}

.card {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.card i {
  font-size: 30px;
  color: #2e5c31;
}

.bottom-nav {
  display: flex;
  justify-content: space-around;
  padding: 10px;
  background: white;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
}

.bottom-nav a {
  text-decoration: none;
}

.bottom-nav i {
  font-size: 24px;
  color: #2e5c31;
}
</style>
