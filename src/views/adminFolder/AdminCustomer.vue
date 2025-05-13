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
          <button @click="goToCustomerPage" :class="{ active: currentPage === 'Customer' }">
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
      <main class="main-content">
        <h1>Users Data</h1>
        <table>
          <thead>
            <tr>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Contact Number</th>
              <th>Address</th>
              <th>Role</th>
              <th>User ID</th>
              <th>Verified</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.userId">
              <td>{{ user.firstName }}</td>
              <td>{{ user.lastName }}</td>
              <td>{{ user.username }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.contactNumber }}</td>
              <td>{{ user.address }}</td>
              <td>{{ user.role }}</td>
              <td>{{ user.userId }}</td>
              <td>{{ user.isVerified ? 'Yes' : 'No' }}</td>
            </tr>
          </tbody>
        </table>
      </main>
    </div>
  </template>
  
  <script>
  import { db } from "@/firebase/firebaseConfig";
  import { collection, getDocs } from "firebase/firestore";
  
  export default {
    data() {
      return {
        isCollapsed: false,
        currentPage: "Home",
        users: [],
      };
    },
    methods: {
      toggleSidebar() {
        this.isCollapsed = !this.isCollapsed;
      },
      navigate(page) {
        this.$router.push(`/${page}`);
        if (window.innerWidth < 768) this.isCollapsed = true; // Auto-collapse on mobile
      },
      goToCustomerPage() {
        this.$router.push('/admin-customer');
      },
      goToHomePage(){
        this.$router.push('/admin-dashboard');
      },
      goToSellerPage() {
        this.$router.push('/admin-seller');
      },
    },
    async created() {
      const querySnapshot = await getDocs(collection(db, "users"));
      this.users = querySnapshot.docs
        .map(doc => doc.data())
        .filter(user => user.role === "customer"); // Only show users with role "customer"
    }
  };
  </script>
  
  <style scoped>
  @import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css");
  
  .dashboard-container {
    display: flex;
    height: 100vh;
  }
  
  .sidebar {
    width: 200px;
    background: #2e5c31;
    padding: 15px;
    display: flex;
    flex-direction: column;
    position: fixed;
    height: 100%;
    transition: width 0.3s ease-in-out;
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
    align-items: center;
    font-size: 16px;
    color: white;
    transition: all 0.3s ease-in-out;
    width: 100%;
  }
  
  button i {
    font-size: 22px;
    margin-right: 10px;
  }
  
  .sidebar button span {
    display: block;
  }
  
  .sidebar.collapsed button span {
    display: none;
  }
  
  button:hover,
  button.active {
    background: rgba(255, 255, 255, 0.2);
  }
  
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
  
  .main-content {
    flex-grow: 1;
    padding: 20px;
    margin-left: 200px;
    transition: margin-left 0.3s;
  }
  
  .sidebar.collapsed ~ .main-content {
    margin-left: 60px;
  }
  
  /* Table Styles */
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }
  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }
  th {
    background-color: #2e5c31;
    color: white;
  }
  </style>
  