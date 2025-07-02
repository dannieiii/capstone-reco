<template>
  <div class="dashboard-card sellers-overview">
    <div class="card-header">
      <h3>Seller Overview</h3>
      <button class="view-all-btn" @click="navigateToSellers">View All</button>
    </div>
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading sellers data...</p>
    </div>
    <table v-else class="data-table">
      <thead>
        <tr>
          <th>Seller</th>
          <th>Farm Type</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="seller in topSellers" :key="seller.id">
          <td>
            <div class="seller-info">
              <div class="seller-avatar">
                <User size="20" class="profile-icon" />
              </div>
              <div>
                <div class="seller-name">{{ seller.personalInfo?.firstName }} {{ seller.personalInfo?.lastName }}</div>
                <div class="seller-location">{{ seller.farmDetails?.farmAddress || seller.personalInfo?.address || 'No address' }}</div>
              </div>
            </div>
          </td>
          <td>{{ seller.farmDetails?.farmType || 'Not specified' }}</td>
          <td>
            <span class="status-badge" :class="getStatusClass(seller)">
              {{ getStatusLabel(seller) }}
            </span>
          </td>
        </tr>
        <tr v-if="topSellers.length === 0">
          <td colspan="3" class="no-data">No sellers found</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { User } from 'lucide-vue-next';
import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs, query, limit, orderBy } from "firebase/firestore";

const router = useRouter();
const sellers = ref([]);
const loading = ref(true);

// Get only the top 4 sellers for the overview
const topSellers = computed(() => {
  return sellers.value.slice(0, 4);
});

const fetchSellers = async () => {
  try {
    loading.value = true;
    // Create a query to get the most recent sellers first, limited to a reasonable number
    const sellersQuery = query(
      collection(db, "sellers"),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    
    const querySnapshot = await getDocs(sellersQuery);
    sellers.value = querySnapshot.docs.map(doc => {
      return { 
        id: doc.id,
        ...doc.data()
      };
    });
  } catch (error) {
    console.error("Error fetching sellers:", error);
  } finally {
    loading.value = false;
  }
};

const getStatusClass = (seller) => {
  if (seller.personalInfo?.status === 'Active' || seller.verificationStatus === 'Verified') {
    return 'active';
  } else if (seller.personalInfo?.registrationStatus === 'Pending' || seller.verificationStatus === 'Pending') {
    return 'pending';
  } else {
    return 'inactive';
  }
};

const getStatusLabel = (seller) => {
  if (seller.personalInfo?.status === 'Active' || seller.verificationStatus === 'Verified') {
    return 'Active';
  } else if (seller.personalInfo?.registrationStatus === 'Pending' || seller.verificationStatus === 'Pending') {
    return 'Pending';
  } else {
    return 'Inactive';
  }
};

const navigateToSellers = () => {
  router.push('/admin/sellers');
};

onMounted(() => {
  fetchSellers();
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
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-icon {
  color: #6b7280;
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

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
  color: #6b7280;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

.no-data {
  text-align: center;
  color: #6b7280;
  padding: 20px 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>