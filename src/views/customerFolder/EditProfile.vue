<template>
  <div class="edit-profile">
    <div class="header">
      <button class="back-button" @click="goBack">
        <ChevronLeft size="22" />
      </button>
      <h1>Edit Profile</h1>
      <div class="header-buttons"></div>
    </div>
    
    <div class="profile-content">
      <div v-if="notification.show" class="notification" :class="notification.type">
        {{ notification.message }}
        <button class="notification-close" @click="notification.show = false">&times;</button>
      </div>
      <!-- Alert Box -->
      <div v-if="alertMessage" :class="['alert-box', alertType]">
        {{ alertMessage }}
      </div>

      <div class="profile-picture-section">
        <div class="image-upload-container">
          <div 
            class="image-preview" 
            :class="{ 'has-image': imagePreview }"
            @click="triggerFileInput"
          >
            <img v-if="imagePreview" :src="imagePreview" alt="Profile preview" />
            <div v-else class="upload-placeholder">
              <User size="64" class="default-icon" />
              <p>Click to upload image</p>
            </div>
          </div>
          <input 
            type="file" 
            ref="fileInput" 
            @change="handleImageUpload" 
            accept="image/*" 
            class="file-input"
          />
          <button class="change-photo-btn" @click="triggerFileInput">
            <Camera size="18" />
          </button>
        </div>
        <h2>{{ firstName }} {{ lastName }}</h2>
        <p>{{ email }}</p>
      </div>
   
      <form @submit.prevent="updateProfile" class="profile-form">
        <div class="form-section">
          <h3>Personal Information</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label for="firstName">First Name</label>
              <input 
                type="text" 
                id="firstName" 
                v-model="firstName" 
                placeholder="Enter first name"
              />
            </div>
            
            <div class="form-group">
              <label for="lastName">Last Name</label>
              <input 
                type="text" 
                id="lastName" 
                v-model="lastName" 
                placeholder="Enter last name"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label for="username">Username</label>
            <input 
              type="text" 
              id="username" 
              v-model="username" 
              placeholder="Enter username"
            />
          </div>
          
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              v-model="email" 
              placeholder="Enter email address"
              disabled
            />
          </div>
          
          <div class="form-group">
            <label for="contactNumber">Contact Number</label>
            <input 
              type="tel" 
              id="contactNumber" 
              v-model="contactNumber" 
              placeholder="Enter contact number"
            />
          </div>
          
          <div class="form-group">
            <label for="address">Address</label>
            <textarea 
              id="address" 
              v-model="address" 
              placeholder="Enter your address"
              rows="3"
            ></textarea>
          </div>
        </div>
        
        <div class="form-section">
          <h3>Change Password</h3>
          
          <div class="form-group">
            <label for="currentPassword">Current Password</label>
            <div class="password-input">
              <input 
                :type="showCurrentPassword ? 'text' : 'password'" 
                id="currentPassword" 
                v-model="currentPassword" 
                placeholder="Enter current password"
              />
              <button type="button" @click="showCurrentPassword = !showCurrentPassword" class="toggle-password">
                <Eye v-if="!showCurrentPassword" size="18" />
                <EyeOff v-else size="18" />
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label for="newPassword">New Password</label>
            <div class="password-input">
              <input 
                :type="showNewPassword ? 'text' : 'password'" 
                id="newPassword" 
                v-model="newPassword" 
                placeholder="Enter new password"
              />
              <button type="button" @click="showNewPassword = !showNewPassword" class="toggle-password">
                <Eye v-if="!showNewPassword" size="18" />
                <EyeOff v-else size="18" />
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label for="confirmNewPassword">Confirm New Password</label>
            <div class="password-input">
              <input 
                :type="showConfirmPassword ? 'text' : 'password'" 
                id="confirmNewPassword" 
                v-model="confirmNewPassword" 
                placeholder="Confirm new password"
              />
              <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="toggle-password">
                <Eye v-if="!showConfirmPassword" size="18" />
                <EyeOff v-else size="18" />
              </button>
            </div>
            <p v-if="passwordMismatch" class="error-message">Passwords do not match</p>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="cancel-btn" @click="$emit('navigate', 'HomePage')">Cancel</button>
          <button type="submit" class="save-btn" :disabled="isLoading">
            {{ isLoading ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
<script>
import { 
  ChevronLeft, 
  Camera, 
  Eye, 
  EyeOff,
  User 
} from 'lucide-vue-next';
import { ref, onMounted, reactive } from 'vue';
import { auth, db } from '@/firebase/firebaseConfig';
import { updateDoc, doc, getDoc } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

export default {
  components: {
    ChevronLeft,
    Camera,
    Eye,
    EyeOff,
    User,
  },
  setup() {
    const firstName = ref("");
    const lastName = ref("");
    const username = ref("");
    const email = ref("");
    const contactNumber = ref("");
    const address = ref("");
    const fileInput = ref(null);
    const alertMessage = ref("");
    const alertType = ref("");
    const showCurrentPassword = ref(false);
    const showNewPassword = ref(false);
    const showConfirmPassword = ref(false);
    const currentPassword = ref("");
    const newPassword = ref("");
    const confirmNewPassword = ref("");
    const passwordMismatch = ref(false);
    const isLoading = ref(false);
    const selectedFile = ref(null);
    const imagePreview = ref(""); // Added this line to fix the error


      const goBack = () => {
      window.history.back(); // Or use your preferred navigation method
    };
    // Notification system
    const notification = reactive({
      show: false,
      message: '',
      type: '' // 'success' or 'error'
    });

    const showNotification = (message, type = 'success') => {
      notification.show = true;
      notification.message = message;
      notification.type = type;
      setTimeout(() => {
        notification.show = false;
      }, 3000);
    };
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            firstName.value = userData.firstName;
            lastName.value = userData.lastName;
            username.value = userData.username;
            email.value = userData.email;
            contactNumber.value = userData.contactNumber;
            address.value = userData.address;
            imagePreview.value = userData.profileImageUrl || ""; // This will now be base64
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          showNotification("Failed to fetch user data.", "error");
        }
      }
    };

    const triggerFileInput = () => {
      fileInput.value.click();
    };

 const handleImageUpload = (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      // Validate file type
      if (!file.type.match('image.*')) {
        showNotification('Please select an image file', 'error');
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        showNotification('Image size should not exceed 2MB', 'error');
        return;
      }
      
      selectedFile.value = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.value = e.target.result;
      };
      reader.readAsDataURL(file);
    };

    const saveImageToFirestore = async () => {
      if (!selectedFile.value) return null;
      
      try {
        console.log('Converting image to base64...');
        // Convert the image to base64 string
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve(e.target.result);
          };
          reader.onerror = (e) => {
            console.error('Error reading file:', e);
            reject(new Error('Failed to read image file'));
          };
          reader.readAsDataURL(selectedFile.value);
        });
      } catch (error) {
        console.error("Error processing image:", error);
        throw new Error('Failed to process image');
      }
    };

    const updateProfile = async () => {
      isLoading.value = true;
      try {
        const user = auth.currentUser;
        if (!user) {
          showNotification("No user logged in.", "error");
          return;
        }
        
        // Process image if selected
        let profileImageUrl = imagePreview.value;
        if (selectedFile.value) {
          profileImageUrl = await saveImageToFirestore();
        }
        
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          firstName: firstName.value,
          lastName: lastName.value,
          username: username.value,
          contactNumber: contactNumber.value,
          address: address.value,
          profileImageUrl: profileImageUrl,
          lastUpdated: new Date().toISOString()
        });
        
        showNotification("Profile updated successfully!", "success");
        // Navigate back after successful update
        setTimeout(() => {
          window.history.back(); // Or use your preferred navigation method
        }, 1500); // Wait 1.5 seconds before navigating
      } catch (error) {
        console.error("Error updating profile:", error);
        showNotification(`Failed to update profile: ${error.message}`, "error");
      } finally {
        isLoading.value = false;
      }
    };

    onMounted(fetchUserData);

    return {
      firstName,
      lastName,
      username,
      email,
      contactNumber,
      address,
      fileInput,
      imagePreview,
      isLoading,
      notification,
      showCurrentPassword,
      showNewPassword,
      showConfirmPassword,
      currentPassword,
      newPassword,
      confirmNewPassword,
      passwordMismatch,
      triggerFileInput,
      handleImageUpload,
      updateProfile,
      alertMessage,
      alertType,
      goBack
    };
  }
}
</script>

<style scoped>
.edit-profile {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding-bottom: 80px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 15px;
  background-color: #2e5c31;
  color: white;
}

.back-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.header h1 {
  font-size: 18px;
  font-weight: 600;
}

.header-buttons {
  display: flex;
  gap: 8px;
}

.icon-button {
  width: 40px;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.profile-content {
  flex: 1;
  padding: 0 0 20px 0;
  background-color: #f5f5f5;
  overflow-y: auto;
}

.profile-picture-section {
  background-color: white;
  padding: 30px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.profile-picture {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 15px;
  border: 3px solid #2e5c31;
}

.profile-picture img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}


.change-photo-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 40px;
  height: 40px;
  background-color: #2e5c31;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.profile-picture-section h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 5px 0;
  color: #333;
}

.profile-picture-section p {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.profile-form {
  padding: 0 15px;
}

.form-section {
  background-color: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.form-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: #2e5c31;
}

.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.form-row .form-group {
  flex: 1;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 5px;
  color: #555;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #2e5c31;
  outline: none;
}

.password-input {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #777;
  cursor: pointer;
}

.error-message {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 5px;
}

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.cancel-btn,
.save-btn {
  flex: 1;
  padding: 14px 0;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn {
  background-color: #f1f1f1;
  color: #555;
}

.save-btn {
  background-color: #2e5c31;
  color: white;
  box-shadow: 0 3px 8px rgba(46, 92, 49, 0.3);
}

.cancel-btn:hover {
  background-color: #e5e5e5;
}

.save-btn:hover {
  background-color: #26492a;
}

.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 4px;
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 250px;
  animation: slideIn 0.3s ease-out;
}

.notification.success {
  background-color: #2ecc71;
}

.notification.error {
  background-color: #e74c3c;
}

.notification-close {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  margin-left: 15px;
  font-size: 1.2rem;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.image-upload-container {
  position: relative;
  width: 150px;
  height: 150px;
  margin: 0 auto 15px;
}

.image-preview {
  width: 100%;
  height: 100%;
  border: 2px dashed #e9ecef;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.2s ease;
}

.image-preview:hover {
  border-color: #3498db;
}

.image-preview.has-image {
  border-style: solid;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #6c757d;
  padding: 20px;
  text-align: center;
}

.upload-placeholder .default-icon {
  margin-bottom: 10px;
}

.upload-placeholder p {
  margin: 0;
  font-size: 14px;
}

.file-input {
  display: none;
}
</style>