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
    <div class="main-content" :class="{ 'collapsed': isCollapsed }">
      <h2>Seller List</h2>
      <p v-if="loading">Loading sellers...</p>
      <table v-else>
        <thead>
          <tr>
            <th v-for="(key, index) in Object.keys(sellers[0] || {})" :key="index">{{ key }}</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(seller, index) in sellers" :key="seller.id">
            <td v-for="(value, key) in seller" :key="key">{{ value }}</td>
            <td>
              <button class="accept" @click="acceptSeller(seller.userId, index)" v-if="seller.status !== 'Accepted'">Accept</button>
              <button class="decline" @click="declineSeller(index)" v-if="seller.status !== 'Declined'">Decline</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { db } from '../../firebase/firebaseConfig';
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

export default {
data() {
  return {
    isCollapsed: window.innerWidth < 768,
    sellers: [],
    loading: true
  };
},
async created() {
  await this.fetchSellers();
},
methods: {
  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
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

  // Fetch all sellers from Firestore
  async fetchSellers() {
    try {
      const querySnapshot = await getDocs(collection(db, "sellers"));
      this.sellers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching sellers:", error);
    } finally {
      this.loading = false;
    }
  },

  // Accept seller: update Firestore and UI
  async acceptSeller(userId, index) {
    if (!userId) {
      console.error("No userId found for this seller.");
      return;
    }
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { role: "seller", isSeller: true });
      this.sellers[index].status = "Accepted";
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  },

  // Decline seller
  declineSeller(index) {
    this.sellers[index].status = "Declined";
  }
}
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
  font-size: 16px;
  color: white;
  transition: all 0.3s;
  width: 100%;
}

button:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Accept Button */
button.accept {
  background: #28a745; /* Green */
  color: white;
}

button.accept:hover {
  background: #218838;
}

/* Decline Button */
button.decline {
  background: #dc3545; /* Red */
  color: white;
}

button.decline:hover {
  background: #c82333;
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
.main-content.collapsed {
  margin-left: 60px;
}

/* Status Styles */
.status-accepted {
  color: #28a745;
  font-weight: bold;
}
.status-declined {
  color: #dc3545;
  font-weight: bold;
}
.status-pending {
  color: #ffc107;
  font-weight: bold;
}
</style>