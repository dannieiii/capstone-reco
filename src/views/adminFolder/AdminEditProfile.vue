<template>
    <div class="edit-profile-container">
      <AdminSidebar initialActiveItem="Edit Profile" />
      
      <div class="main-content">
        <header class="header">
          <div class="header-title">
            <h2>Edit Profile</h2>
          </div>
          
          <div class="user-profile">
            <div class="notification-icon">
              <Bell size="20" />
              <span class="notification-badge">5</span>
            </div>
            <div class="avatar">
              <UserCircle size="32" class="profile-icon" />
            </div>
          </div>
        </header>
        
        <div class="edit-profile-content">
          <!-- Edit Profile Form -->
          <form @submit.prevent="updateProfile" class="edit-profile-form">
            <div class="form-group">
              <label for="firstName">First Name</label>
              <input type="text" id="firstName" v-model="adminData.firstName" required />
            </div>
            
            <div class="form-group">
              <label for="lastName">Last Name</label>
              <input type="text" id="lastName" v-model="adminData.lastName" required />
            </div>
            
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" v-model="adminData.email" required />
            </div>
            
            <div class="form-group">
              <label for="contactNumber">Contact Number</label>
              <input type="tel" id="contactNumber" v-model="adminData.contactNumber" required />
            </div>
            
            <div class="form-group">
              <label for="address">Address</label>
              <input type="text" id="address" v-model="adminData.address" required />
            </div>
            
            <div class="form-group">
              <label for="username">Username</label>
              <input type="text" id="username" v-model="adminData.username" required />
            </div>
            
            <button type="submit" class="save-btn">Save Changes</button>
          </form>
          
          <!-- Change Password Section -->
          <div class="change-password-section">
            <h2>Change Password</h2>
            <form @submit.prevent="changePassword" class="change-password-form">
              <div class="form-group">
                <label for="currentPassword">Current Password</label>
                <input type="password" id="currentPassword" v-model="password.currentPassword" required />
              </div>
              
              <div class="form-group">
                <label for="newPassword">New Password</label>
                <input type="password" id="newPassword" v-model="password.newPassword" required />
              </div>
              
              <div class="form-group">
                <label for="confirmPassword">Confirm New Password</label>
                <input type="password" id="confirmPassword" v-model="password.confirmPassword" required />
              </div>
              
              <button type="submit" class="change-password-btn">Change Password</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
  import { db } from '@/firebase/firebaseConfig';
  import { doc, getDoc, updateDoc } from 'firebase/firestore';
  import AdminSidebar from '@/components/AdminSidebar.vue';
  import { Bell, UserCircle } from 'lucide-vue-next';
  
  // Firebase Auth
  const auth = getAuth();
  
  // Admin data
  const adminData = ref({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    address: '',
    username: '',
  });
  
  // Password fields
  const password = ref({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Fetch admin data
  const fetchAdminData = async () => {
    try {
      const user = auth.currentUser; // Get the currently logged-in user
      if (user) {
        const userId = user.uid; // Get the user ID
        const adminRef = doc(db, "admins", userId); // Reference to the admin document
        const adminSnapshot = await getDoc(adminRef); // Fetch the document
        if (adminSnapshot.exists()) {
          adminData.value = adminSnapshot.data(); // Set the admin data
        }
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
  };
  
  // Update profile
  const updateProfile = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userId = user.uid;
        const adminRef = doc(db, "admins", userId);
        await updateDoc(adminRef, {
          firstName: adminData.value.firstName,
          lastName: adminData.value.lastName,
          email: adminData.value.email,
          contactNumber: adminData.value.contactNumber,
          address: adminData.value.address,
          username: adminData.value.username,
        });
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert('Failed to update profile. Please try again.');
    }
  };
  
  // Change password
  const changePassword = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        // Verify current password
        const credential = EmailAuthProvider.credential(user.email, password.value.currentPassword);
        await reauthenticateWithCredential(user, credential);
  
        // Check if new passwords match
        if (password.value.newPassword !== password.value.confirmPassword) {
          alert('New passwords do not match!');
          return;
        }
  
        // Update password
        await updatePassword(user, password.value.newPassword);
        alert('Password changed successfully!');
        password.value = { currentPassword: '', newPassword: '', confirmPassword: '' }; // Clear the form
      }
    } catch (error) {
      console.error("Error changing password:", error);
      alert('Failed to change password. Please check your current password and try again.');
    }
  };
  
  onMounted(() => {
    fetchAdminData(); // Fetch admin data when the component is mounted
  });
  </script>
  
  <style scoped>
  .edit-profile-container {
    display: flex;
    background-color: #f5f5f5;
    min-height: 100vh;
  }
  
  .main-content {
    flex: 1;
    padding: 20px;
    background-color: #ffffff;
    margin-left: 260px; /* Adjust based on sidebar width */
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .header-title h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: #111827;
  }
  
  .user-profile {
    display: flex;
    align-items: center;
    gap: 15px;
  }
  
  .notification-icon {
    position: relative;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    cursor: pointer;
    border: 1px solid #e5e7eb;
  }
  
  .notification-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background-color: #ef4444;
    color: white;
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    border: 1px solid #e5e7eb;
  }
  
  .profile-icon {
    color: #6b7280;
  }
  
  .edit-profile-content {
    max-width: 800px;
    margin: 0 auto;
  }
  
  .edit-profile-form,
  .change-password-form {
    background-color: #ffffff;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
    border: 1px solid #e5e7eb;
  }
  
  .change-password-section h2 {
    margin: 0 0 20px 0;
    font-size: 20px;
    font-weight: 600;
    color: #111827;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
  }
  
  .form-group input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    transition: border-color 0.2s ease;
    box-sizing: border-box;
  }
  
  .form-group input:focus {
    outline: none;
    border-color: #2e5c31;
    box-shadow: 0 0 0 3px rgba(46, 92, 49, 0.1);
  }
  
  .save-btn,
  .change-password-btn {
    width: 100%;
    padding: 12px 24px;
    background-color: #2e5c31;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .save-btn:hover,
  .change-password-btn:hover {
    background-color: #1e3a1c;
  }
  
  .save-btn:active,
  .change-password-btn:active {
    transform: translateY(1px);
  }
  </style>