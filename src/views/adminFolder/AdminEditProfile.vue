<template>
    <div class="edit-profile-container">
      <AdminSidebar initialActiveItem="Edit Profile" />
      
      <div class="main-content">
        <header class="header">
          <div class="search-container">
            <div class="search-box">
              <Search size="18" class="search-icon" />
              <input type="text" placeholder="Search..." />
            </div>
          </div>
          
          <div class="user-profile" @click="toggleProfileMenu" ref="profileRef">
            <div class="notification-icon">
              <Bell size="20" />
              <span class="notification-badge">5</span>
            </div>
            <div class="avatar">
              <img :src="adminData.profilePicture || 'https://randomuser.me/api/portraits/men/32.jpg'" alt="Admin avatar" />
            </div>
            <div class="user-info">
              <h3>{{ adminData ? `${adminData.firstName} ${adminData.lastName}` : 'Loading...' }}</h3>
              <p>{{ adminData ? adminData.email : 'Loading...' }}</p>
            </div>
          </div>
        </header>
        
        <div class="edit-profile-content">
          <h1>Edit Profile</h1>
          
          <!-- Profile Picture Upload -->
          <div class="profile-picture-section">
            <div class="profile-picture-container">
              <img :src="adminData.profilePicture || 'https://randomuser.me/api/portraits/men/32.jpg'" alt="Profile Picture" class="profile-picture" />
              <input type="file" @change="handleProfilePictureUpload" accept="image/*" class="profile-picture-input" />
              <button class="upload-btn" @click="triggerFileInput">Upload Photo</button>
            </div>
          </div>
          
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
  import { db, storage } from '@/firebase/firebaseConfig';
  import { doc, getDoc, updateDoc } from 'firebase/firestore';
  import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
  import AdminSidebar from '@/components/AdminSidebar.vue';
  import { Search, Bell } from 'lucide-vue-next';
  
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
    profilePicture: '',
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
  
  // Handle profile picture upload
  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const user = auth.currentUser;
        if (user) {
          const userId = user.uid;
          const fileRef = storageRef(storage, `profile-pictures/${userId}`);
          await uploadBytes(fileRef, file);
          const downloadURL = await getDownloadURL(fileRef);
          adminData.value.profilePicture = downloadURL;
          const adminRef = doc(db, "admins", userId);
          await updateDoc(adminRef, { profilePicture: downloadURL });
          alert('Profile picture updated successfully!');
        }
      } catch (error) {
        console.error("Error uploading profile picture:", error);
        alert('Failed to upload profile picture. Please try again.');
      }
    }
  };
  
  // Trigger file input
  const triggerFileInput = () => {
    document.querySelector('.profile-picture-input').click();
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
    margin-bottom: 20px;
  }
  
  .search-container {
    display: flex;
    align-items: center;
  }
  
  .search-box {
    display: flex;
    align-items: center;
    background-color: #e0e0e0;
    padding: 8px 12px;
    border-radius: 8px;
  }
  
  .search-icon {
    margin-right: 8px;
    color: #666;
  }
  
  .search-box input {
    border: none;
    background: none;
    outline: none;
    font-size: 14px;
  }
  
  .user-profile {
    display: flex;
    align-items: center;
    cursor: pointer;
  }
  
  .notification-icon {
    position: relative;
    margin-right: 20px;
  }
  
  .notification-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background-color: #ff4d4d;
    color: white;
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 50%;
  }
  
  .avatar img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 10px;
  }
  
  .user-info h3 {
    margin: 0;
    font-size: 16px;
    color: #333;
  }
  
  .user-info p {
    margin: 0;
    font-size: 14px;
    color: #666;
  }
  
  .edit-profile-content {
    max-width: 800px;
    margin: 0 auto;
  }
  
  .profile-picture-section {
    text-align: center;
    margin-bottom: 20px;
  }
  
  .profile-picture-container {
    position: relative;
    display: inline-block;
  }
  
  .profile-picture {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
  }
  
  .profile-picture-input {
    display: none;
  }
  
  .upload-btn {
    margin-top: 10px;
    padding: 8px 16px;
    background-color: #2e5c31;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
  }
  
  .edit-profile-form,
  .change-password-form {
    background-color: #ffffff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-size: 14px;
    color: #333;
  }
  
  .form-group input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
  }
  
  .save-btn,
  .change-password-btn {
    width: 100%;
    padding: 12px;
    background-color: #2e5c31;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
  }
  
  .save-btn:hover,
  .change-password-btn:hover {
    background-color: #1e3a1c;
  }
  </style>