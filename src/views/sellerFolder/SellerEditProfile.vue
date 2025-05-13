<template>
  <div class="edit-profile">
    <div class="header">
      <button class="back-button" @click="$emit('navigate', 'ViewProfile')">
        <ChevronLeft size="22" />
      </button>
      <h1>Edit Profile</h1>
      <div class="header-buttons">
       
      </div>
    </div>
    
    <div class="profile-content">
      <!-- Alert Box -->
      <div v-if="alertMessage" :class="['alert-box', alertType]">
        {{ alertMessage }}
      </div>

      <div v-if="loading" class="loading-container">
        <Loader size="32" class="spinner" />
        <p>Loading profile...</p>
      </div>
      
      <div v-else-if="error" class="error-container">
        <AlertCircle size="32" class="error-icon" />
        <p>{{ error }}</p>
        <button class="retry-button" @click="fetchSellerData">Retry</button>
      </div>
      
      <template v-else>
        <div class="profile-picture-section">
          <div class="profile-picture">
            <!-- Default profile icon or uploaded image -->
            <img 
              v-if="profileImageUrl" 
              :src="profileImageUrl" 
              alt="Profile picture" 
            />
            <User v-else size="64" class="default-icon" />
            <button class="change-photo-btn" @click="openFileInput">
              <Camera size="18" />
            </button>
            <!-- Hidden file input for image upload -->
            <input 
              type="file" 
              ref="fileInput" 
              accept="image/*" 
              style="display: none" 
              @change="handleFileUpload"
            />
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
          
          <div class="form-section" v-if="isSeller">
            <h3>Farm Information</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label for="farmName">Farm Name</label>
                <input 
                  type="text" 
                  id="farmName" 
                  v-model="farmName" 
                  placeholder="Enter farm name"
                />
              </div>
              
              <div class="form-group">
                <label for="farmType">Farm Type</label>
                <input 
                  type="text" 
                  id="farmType" 
                  v-model="farmType" 
                  placeholder="Enter farm type"
                />
              </div>
            </div>
            
            <div class="form-group">
              <label for="farmAddress">Farm Address</label>
              <textarea 
                id="farmAddress" 
                v-model="farmAddress" 
                placeholder="Enter farm address"
                rows="3"
              ></textarea>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="yearInFarming">Years in Farming</label>
                <input 
                  type="text" 
                  id="yearInFarming" 
                  v-model="yearInFarming" 
                  placeholder="Enter years in farming"
                />
              </div>
              
              <div class="form-group">
                <label for="areasCovered">Areas Covered</label>
                <input 
                  type="text" 
                  id="areasCovered" 
                  v-model="areasCovered" 
                  placeholder="Enter areas covered"
                />
              </div>
            </div>
            
            <div class="form-group">
              <label for="products">Products</label>
              <textarea 
                id="products" 
                v-model="products" 
                placeholder="Enter products (comma separated)"
                rows="3"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label for="operatingHours">Operating Hours</label>
              <input 
                type="text" 
                id="operatingHours" 
                v-model="operatingHours" 
                placeholder="Enter operating hours"
              />
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="paymentMethod">Payment Method</label>
                <input 
                  type="text" 
                  id="paymentMethod" 
                  v-model="paymentMethod" 
                  placeholder="Enter payment methods"
                />
              </div>
              
              <div class="form-group">
                <label for="deliveryMethod">Delivery Method</label>
                <input 
                  type="text" 
                  id="deliveryMethod" 
                  v-model="deliveryMethod" 
                  placeholder="Enter delivery methods"
                />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="accountName">Account Name</label>
                <input 
                  type="text" 
                  id="accountName" 
                  v-model="accountName" 
                  placeholder="Enter account name"
                />
              </div>
              
              <div class="form-group">
                <label for="accountNumber">Account Number</label>
                <input 
                  type="text" 
                  id="accountNumber" 
                  v-model="accountNumber" 
                  placeholder="Enter account number"
                />
              </div>
            </div>
            
            <div class="form-group">
              <label for="socialMedia">Social Media</label>
              <input 
                type="text" 
                id="socialMedia" 
                v-model="socialMedia" 
                placeholder="Enter social media links"
              />
            </div>
            
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="wholesaleAvailability"
                />
                <span>Wholesale Availability</span>
              </label>
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
            <button type="button" class="cancel-btn" @click="$emit('navigate', 'ViewProfile')">Cancel</button>
            <button type="submit" class="save-btn" :disabled="isLoading">
              {{ isLoading ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </template>
    </div>
  </div>
</template>

<script>
import { 
  ChevronLeft, 
  Camera, 
  Eye, 
  EyeOff,
  User,
  Loader,
  AlertCircle
} from 'lucide-vue-next';
import { ref, computed, onMounted } from 'vue';
import { auth, db, storage } from '@/firebase/firebaseConfig';
import { updateDoc, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

export default {
  components: {
    ChevronLeft,
    Camera,
    Eye,
    EyeOff,
    User,
    Loader,
    AlertCircle
  },
  setup() {
    // User data
    const firstName = ref("");
    const lastName = ref("");
    const email = ref("");
    const contactNumber = ref("");
    const address = ref("");
    const profileImageUrl = ref("");
    
    // Seller-specific data
    const farmName = ref("");
    const farmType = ref("");
    const farmAddress = ref("");
    const yearInFarming = ref("");
    const areasCovered = ref("");
    const products = ref("");
    const operatingHours = ref("");
    const paymentMethod = ref("");
    const deliveryMethod = ref("");
    const accountName = ref("");
    const accountNumber = ref("");
    const socialMedia = ref("");
    const wholesaleAvailability = ref(false);
    
    // UI state
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
    const loading = ref(true);
    const error = ref(null);
    
    // Store seller document ID if found
    const sellerDocId = ref(null);
    const userRole = ref('customer');
    
    const isSeller = computed(() => {
  // Consider the user a seller if they have a seller role or if seller data was found
  return userRole.value === 'seller' || sellerDocId.value !== null;
});

const fetchSellerData = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const user = auth.currentUser;
    if (!user) {
      error.value = "No user logged in.";
      loading.value = false;
      return;
    }
    
    // First, get the user data from users collection
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      error.value = "User profile not found.";
      loading.value = false;
      return;
    }
    
    const userData = userSnap.data();
    
    // Set user data
    firstName.value = userData.firstName || "";
    lastName.value = userData.lastName || "";
    email.value = userData.email || "";
    contactNumber.value = userData.contactNumber || "";
    address.value = userData.address || "";
    profileImageUrl.value = userData.profileImageUrl || "";
    userRole.value = userData.role || 'customer';
    
    console.log("User data loaded:", userData);
    
    // Get the seller data from sellers collection using the userId
    const sellersRef = collection(db, "sellers");
    const q = query(sellersRef, where("userId", "==", user.uid)); // Query by userId
    const sellerSnap = await getDocs(q);
    
    console.log("Seller query results:", sellerSnap.docs); // Debugging: Log the query results
    
    if (!sellerSnap.empty) {
      const sellerDoc = sellerSnap.docs[0];
      sellerDocId.value = sellerDoc.id;
      const sellerData = sellerDoc.data();
      
      console.log("Seller data loaded:", sellerData); // Debugging: Log the seller data
      
      // Set seller-specific data
      farmName.value = sellerData.farmName || "";
      farmType.value = sellerData.farmType || "";
      farmAddress.value = sellerData.farmAddress || "";
      yearInFarming.value = sellerData.yearInFarming || "";
      areasCovered.value = sellerData.areasCovered || "";
      products.value = sellerData.products || "";
      operatingHours.value = sellerData.operatingHours || "";
      paymentMethod.value = sellerData.paymentMethod || "";
      deliveryMethod.value = sellerData.deliveryMethod || "";
      accountName.value = sellerData.accountName || "";
      accountNumber.value = sellerData.accountNumber || "";
      socialMedia.value = sellerData.socialMedia || "";
      wholesaleAvailability.value = sellerData.wholesaleAvailability || false;
      
      // If contact number is not set from user data, try to get it from seller data
      if (!contactNumber.value && sellerData.contact) {
        contactNumber.value = sellerData.contact;
      }
      
      // Force the user to be recognized as a seller
      userRole.value = 'seller';
    } else {
      console.log("No seller data found for userId:", user.uid);
    }
    
    loading.value = false;
  } catch (err) {
    console.error("Error fetching seller data:", err);
    error.value = "Failed to load profile data. Please try again.";
    loading.value = false;
  }
};

    const openFileInput = () => {
      fileInput.value.click();
    };

    const handleFileUpload = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const user = auth.currentUser;
        if (!user) return;

        // Upload file to Firebase Storage
        const storageReference = storageRef(storage, `profile-pictures/${user.uid}/${file.name}`);
        await uploadBytes(storageReference, file);

        // Get download URL
        const downloadURL = await getDownloadURL(storageReference);

        // Update Firestore with the new profile image URL
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          profileImageUrl: downloadURL,
        });

        // Update local state
        profileImageUrl.value = downloadURL;
        showAlert("Profile picture updated successfully!", "success");
      } catch (error) {
        console.error("Error uploading profile picture:", error);
        showAlert("Failed to upload profile picture.", "error");
      }
    };

    const showAlert = (message, type) => {
      alertMessage.value = message;
      alertType.value = type;
      setTimeout(() => {
        alertMessage.value = "";
      }, 3000);
    };

    const updateProfile = async () => {
  isLoading.value = true;
  try {
    const user = auth.currentUser;
    if (!user) {
      showAlert("No user logged in.", "error");
      return;
    }
    
    if (newPassword.value || confirmNewPassword.value) {
      if (newPassword.value !== confirmNewPassword.value) {
        passwordMismatch.value = true;
        showAlert("Passwords do not match.", "error");
        return;
      } else {
        passwordMismatch.value = false;
      }
      
      // Password change logic would go here
      // This would require reauthentication and updatePassword from Firebase Auth
      showAlert("Password change not implemented in this demo.", "error");
    }
    
    // Update user data in users collection
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      firstName: firstName.value,
      lastName: lastName.value,
      contactNumber: contactNumber.value,
      address: address.value,
    });
    
    console.log("User data updated successfully");
    
    // If seller data exists, update it in sellers collection
    if (isSeller.value) {
      // First check if we have a seller document ID
      if (sellerDocId.value) {
        console.log("Updating existing seller document:", sellerDocId.value);
        const sellerRef = doc(db, "sellers", sellerDocId.value);
        await updateDoc(sellerRef, {
          firstName: firstName.value,
          lastName: lastName.value,
          contact: contactNumber.value,
          address: address.value,
          farmName: farmName.value,
          farmType: farmType.value,
          farmAddress: farmAddress.value,
          yearInFarming: yearInFarming.value,
          areasCovered: areasCovered.value,
          products: products.value,
          operatingHours: operatingHours.value,
          paymentMethod: paymentMethod.value,
          deliveryMethod: deliveryMethod.value,
          accountName: accountName.value,
          accountNumber: accountNumber.value,
          socialMedia: socialMedia.value,
          wholesaleAvailability: wholesaleAvailability.value,
        });
      } else {
        // If no seller document exists but user is a seller, we need to find it by email
        console.log("Looking for seller document by email");
        const sellersRef = collection(db, "sellers");
        const q = query(sellersRef, where("email", "==", email.value));
        const sellerSnap = await getDocs(q);
        
        if (!sellerSnap.empty) {
          const sellerDoc = sellerSnap.docs[0];
          sellerDocId.value = sellerDoc.id;
          console.log("Found seller document by email:", sellerDocId.value);
          
          const sellerRef = doc(db, "sellers", sellerDocId.value);
          await updateDoc(sellerRef, {
            firstName: firstName.value,
            lastName: lastName.value,
            contact: contactNumber.value,
            address: address.value,
            farmName: farmName.value,
            farmType: farmType.value,
            farmAddress: farmAddress.value,
            yearInFarming: yearInFarming.value,
            areasCovered: areasCovered.value,
            products: products.value,
            operatingHours: operatingHours.value,
            paymentMethod: paymentMethod.value,
            deliveryMethod: deliveryMethod.value,
            accountName: accountName.value,
            accountNumber: accountNumber.value,
            socialMedia: socialMedia.value,
            wholesaleAvailability: wholesaleAvailability.value,
          });
        } else {
          console.log("No seller document found for email:", email.value);
        }
      }
    }
    
    showAlert("Profile updated successfully!", "success");
  } catch (error) {
    console.error("Error updating profile:", error);
    showAlert("Failed to update profile: " + error.message, "error");
  } finally {
    isLoading.value = false;
  }
};

    onMounted(fetchSellerData);

    return {
      firstName,
      lastName,
      email,
      contactNumber,
      address,
      profileImageUrl,
      farmName,
      farmType,
      farmAddress,
      yearInFarming,
      areasCovered,
      products,
      operatingHours,
      paymentMethod,
      deliveryMethod,
      accountName,
      accountNumber,
      socialMedia,
      wholesaleAvailability,
      fileInput,
      alertMessage,
      alertType,
      showCurrentPassword,
      showNewPassword,
      showConfirmPassword,
      currentPassword,
      newPassword,
      confirmNewPassword,
      passwordMismatch,
      isLoading,
      loading,
      error,
      isSeller,
      openFileInput,
      handleFileUpload,
      updateProfile,
      fetchSellerData
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
  background: none;
  border: none;
  cursor: pointer;
}

.header h1 {
  font-size: 18px;
  font-weight: 600;
}

.header-buttons {
  display: flex;
  gap: 8px;
}

.profile-content {
  flex: 1;
  padding: 0 0 20px 0;
  background-color: #f5f5f5;
  overflow-y: auto;
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
  color: #666;
}

.spinner {
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  color: #e74c3c;
  margin-bottom: 15px;
}

.retry-button {
  margin-top: 15px;
  padding: 8px 20px;
  background-color: #2e5c31;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
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
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
}

.profile-picture img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-icon {
  color: #aaa;
}

.change-photo-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 32px;
  height: 32px;
  background-color: #2e5c31;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  border: none;
  cursor: pointer;
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

.checkbox-group {
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-label input {
  width: auto;
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
  border: none;
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

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.alert-box {
  padding: 12px 15px;
  margin-bottom: 15px;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
}

.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

@media (max-width: 600px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}
</style>

