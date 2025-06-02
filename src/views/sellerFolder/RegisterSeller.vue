<template>
  <div class="supplier-form-page">
    <div class="header">
      <button class="back-button" @click="$emit('navigate', 'HomePage')">
        <ChevronLeft size="22" />
      </button>
      <h1>Become a Farmer/Supplier</h1>
    </div>
    
    <div class="content">
      <!-- Progress Indicator -->
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressWidth + '%' }"></div>
        </div>
        <div class="step-indicators">
          <div 
            v-for="(step, index) in steps" 
            :key="index" 
            class="step-indicator" 
            :class="{ 
              'active': currentStep >= index, 
              'current': currentStep === index 
            }"
            @click="goToStep(index)"
          >
            <div class="step-number">{{ index + 1 }}</div>
            <span class="step-name">{{ step }}</span>
          </div>
        </div>
      </div>
      
      <!-- Form Content -->
      <div class="form-container">
        <!-- Personal Information -->
        <div v-if="currentStep === 0" class="form-step">
          <h2>Personal Information</h2>
          <p class="step-description">Please provide your basic contact information</p>
          
          <div class="form-group">
            <label for="firstName">First Name</label>
            <input 
              type="text" 
              id="firstName" 
              v-model="formData.personalInfo.firstName" 
              placeholder="Enter your first name"
            >
          </div>
          
          <div class="form-group">
            <label for="lastName">Last Name</label>
            <input 
              type="text" 
              id="lastName" 
              v-model="formData.personalInfo.lastName" 
              placeholder="Enter your last name"
            >
          </div>
          
          <div class="form-group">
            <label for="contact">Contact Number</label>
            <input 
              type="text" 
              id="contact" 
              v-model="formData.personalInfo.contact" 
              placeholder="Enter your contact number"
            >
          </div>
          
          <div class="form-group">
            <label for="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              v-model="formData.personalInfo.email" 
              placeholder="Enter your email address"
            >
          </div>
          
          <div class="form-group">
            <label for="address">Complete Address</label>
            <textarea 
              id="address" 
              v-model="formData.personalInfo.address" 
              placeholder="Enter your complete address"
              rows="3"
            ></textarea>
          </div>
        </div>
        
        <!-- Farm Details -->
        <div v-if="currentStep === 1" class="form-step">
          <h2>Farm Details</h2>
          <p class="step-description">Tell us about your farm and what you grow</p>
          
          <div class="form-group">
            <label for="farmName">Farm Name</label>
            <input 
              type="text" 
              id="farmName" 
              v-model="formData.farmDetails.farmName" 
              placeholder="Enter your farm name"
            >
          </div>
          
          <div class="form-group">
            <label for="farmAddress">Farm Address</label>
            <textarea 
              id="farmAddress" 
              v-model="formData.farmDetails.farmAddress" 
              placeholder="Enter your farm address"
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="farmType">Farm Type</label>
            <select id="farmType" v-model="formData.farmDetails.farmType">
              <option value="" disabled selected>Select farm type</option>
              <option value="Vegetable Farm">Vegetable Farm</option>
              <option value="Fruit Orchard">Fruit Orchard</option>
              <option value="Livestock Farm">Livestock Farm</option>
              <option value="Poultry Farm">Poultry Farm</option>
              <option value="Dairy Farm">Dairy Farm</option>
              <option value="Mixed Farm">Mixed Farm</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="products">Products to Sell</label>
            <textarea 
              id="products" 
              v-model="formData.farmDetails.products" 
              placeholder="List the products you plan to sell"
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="yearInFarming">Years in Farming</label>
            <input 
              type="number" 
              id="yearInFarming" 
              v-model="formData.farmDetails.yearInFarming" 
              placeholder="Enter years of experience"
              min="0"
            >
          </div>
        </div>
        
        <!-- Payment Information -->
        <div v-if="currentStep === 2" class="form-step">
          <h2>Payment Information</h2>
          <p class="step-description">How would you like to receive payments?</p>
          
          <div class="form-group">
            <label for="paymentMethod">Payment Method</label>
            <select id="paymentMethod" v-model="formData.paymentInfo.paymentMethod">
              <option value="" disabled selected>Select payment method</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="GCash">GCash</option>
              <option value="PayMaya">PayMaya</option>
              <option value="Cash on Delivery">Cash on Delivery</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="accountName">Account Name</label>
            <input 
              type="text" 
              id="accountName" 
              v-model="formData.paymentInfo.accountName" 
              placeholder="Enter account name"
            >
          </div>
          
          <div class="form-group">
            <label for="accountNumber">Account Number</label>
            <input 
              type="text" 
              id="accountNumber" 
              v-model="formData.paymentInfo.accountNumber" 
              placeholder="Enter account number"
            >
          </div>
        </div>
        
        <!-- Verification Documents -->
        <div v-if="currentStep === 3" class="form-step">
          <h2>Verification Documents</h2>
          <p class="step-description">Upload required documents to verify your identity and business</p>
          
          <div class="form-group">
            <label for="validID">Valid ID</label>
            <div class="file-upload">
              <input type="file" id="validID" class="file-input" @change="handleFileUpload($event, 'validID')">
              <div class="file-upload-button">
                <Upload size="18" />
                <span>Upload Valid ID</span>
              </div>
              <span class="file-name">{{ formData.verificationDocs.validID ? formData.verificationDocs.validID.name : '' }}</span>
            </div>
            <p class="file-help">Accepted formats: JPG, PNG, PDF (max 5MB)</p>
          </div>
          
          <div class="form-group">
            <label for="businessPermit">Business Permit</label>
            <div class="file-upload">
              <input type="file" id="businessPermit" class="file-input" @change="handleFileUpload($event, 'businessPermit')">
              <div class="file-upload-button">
                <Upload size="18" />
                <span>Upload Business Permit</span>
              </div>
              <span class="file-name">{{ formData.verificationDocs.businessPermit ? formData.verificationDocs.businessPermit.name : '' }}</span>
            </div>
            <p class="file-help">Accepted formats: JPG, PNG, PDF (max 5MB)</p>
          </div>
          
          <div class="form-group">
            <label for="farmCert">Farm Certification</label>
            <div class="file-upload">
              <input type="file" id="farmCert" class="file-input" @change="handleFileUpload($event, 'farmCert')">
              <div class="file-upload-button">
                <Upload size="18" />
                <span>Upload Farm Certification</span>
              </div>
              <span class="file-name">{{ formData.verificationDocs.farmCert ? formData.verificationDocs.farmCert.name : '' }}</span>
            </div>
            <p class="file-help">Accepted formats: JPG, PNG, PDF (max 5MB)</p>
          </div>
        </div>
        
        <!-- Delivery Information -->
        <div v-if="currentStep === 4" class="form-step">
          <h2>Delivery Information</h2>
          <p class="step-description">Tell us how you plan to deliver your products</p>
          
          <div class="form-group">
            <label>Delivery Method</label>
            <div class="dropdown-checkbox">
              <div class="dropdown-header" @click="toggleDeliveryDropdown">
                <span>{{ selectedDeliveryMethods.length ? `${selectedDeliveryMethods.length} selected` : 'Select delivery methods' }}</span>
                <ChevronDown :class="{'rotate-180': isDeliveryDropdownOpen}" />
              </div>
              <div class="dropdown-content" v-if="isDeliveryDropdownOpen">
                <div class="checkbox-group" v-for="method in deliveryMethods" :key="method.value">
                  <input 
                    type="checkbox" 
                    :id="method.value" 
                    :value="method.value" 
                    v-model="formData.deliveryInfo.deliveryMethods"
                  >
                  <label :for="method.value">{{ method.label }}</label>
                </div>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="operatingHours">Operating Hours</label>
            <input 
              type="text" 
              id="operatingHours" 
              v-model="formData.deliveryInfo.operatingHours" 
              placeholder="e.g., Mon-Fri: 8AM-5PM"
            >
          </div>
          
          <div class="form-group">
            <label>Areas Covered (Municipalities of Oriental Mindoro)</label>
            <div class="dropdown-checkbox">
              <div class="dropdown-header" @click="toggleMunicipalityDropdown">
                <span>{{ selectedMunicipalities.length ? `${selectedMunicipalities.length} selected` : 'Select municipalities' }}</span>
                <ChevronDown :class="{'rotate-180': isMunicipalityDropdownOpen}" />
              </div>
              <div class="dropdown-content" v-if="isMunicipalityDropdownOpen">
                <div class="checkbox-group" v-for="municipality in municipalities" :key="municipality">
                  <input 
                    type="checkbox" 
                    :id="municipality" 
                    :value="municipality" 
                    v-model="formData.deliveryInfo.areasCovered"
                  >
                  <label :for="municipality">{{ municipality }}</label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Additional Details -->
        <div v-if="currentStep === 5" class="form-step">
          <h2>Additional Details</h2>
          <p class="step-description">Provide additional information about your business</p>
          
          <div class="form-group">
            <label for="socialMedia">Social Media Links</label>
            <textarea 
              id="socialMedia" 
              v-model="formData.additionalDetails.socialMedia" 
              placeholder="Enter your social media links (Facebook, Instagram, etc.)"
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-group checkbox-group">
            <input 
              type="checkbox" 
              id="wholesaleAvailability" 
              v-model="formData.additionalDetails.wholesaleAvailability"
            >
            <label for="wholesaleAvailability">Available for wholesale orders</label>
          </div>
        </div>
        
        <!-- Terms Agreement -->
        <div v-if="currentStep === 6" class="form-step">
          <h2>Terms & Conditions</h2>
          <p class="step-description">Please review and agree to our terms</p>
          
          <div class="terms-container">
            <h3>Terms and Conditions</h3>
            <div class="terms-content">
              <p>Welcome to our Farm-to-Table Marketplace. By registering as a supplier, you agree to the following terms:</p>
              <ol>
                <li>You confirm that all information provided is accurate and complete.</li>
                <li>You agree to maintain the quality of products as described.</li>
                <li>You will comply with all applicable laws and regulations regarding food safety.</li>
                <li>You will fulfill orders in a timely manner as per the agreed schedule.</li>
                <li>You understand that a commission fee will be charged on each successful transaction.</li>
                <li>You agree to our payment processing schedule and terms.</li>
                <li>You will maintain professional communication with customers.</li>
                <li>You understand that repeated poor reviews may result in removal from the platform.</li>
              </ol>
              <p>These terms are subject to change with notice. By continuing to use our platform after changes, you accept the updated terms.</p>
            </div>
          </div>
          
          <div class="terms-container">
            <h3>Data Privacy Policy</h3>
            <div class="terms-content">
              <p>We value your privacy and are committed to protecting your personal data. Here's how we handle your information:</p>
              <ol>
                <li>We collect personal information solely for the purpose of operating our marketplace.</li>
                <li>Your information will be shared with customers only as necessary to facilitate transactions.</li>
                <li>We implement appropriate security measures to protect your data.</li>
                <li>We retain your data as long as you maintain an active account with us.</li>
                <li>You have the right to access, correct, or delete your personal information.</li>
                <li>We may use your contact information to send important updates about our service.</li>
              </ol>
              <p>For more details, please contact our data protection officer.</p>
            </div>
          </div>
          
          <div class="form-group checkbox-group">
            <input 
              type="checkbox" 
              id="agreeTerms" 
              v-model="formData.termsAgreement.agreeTerms"
            >
            <label for="agreeTerms">I agree to the Terms & Conditions</label>
          </div>
          
          <div class="form-group checkbox-group">
            <input 
              type="checkbox" 
              id="consentData" 
              v-model="formData.termsAgreement.consentData"
            >
            <label for="consentData">I consent to the Data Privacy Policy</label>
          </div>
        </div>
      </div>
      
      <!-- Navigation Buttons -->
      <div class="form-navigation">
        <button 
          v-if="currentStep > 0" 
          class="prev-button" 
          @click="prevStep"
        >
          <ChevronLeft size="18" />
          Previous
        </button>
        
        <button 
          v-if="currentStep < steps.length - 1" 
          class="next-button" 
          @click="nextStep"
        >
          Next
          <ChevronRight size="18" />
        </button>
        
        <button 
          v-if="currentStep === steps.length - 1" 
          class="submit-button" 
          @click="submitForm"
          :disabled="!canSubmit"
        >
          Submit Application
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { db, auth, storage } from "@/firebase/firebaseConfig";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ChevronLeft, ChevronRight, Upload, ChevronDown } from 'lucide-vue-next';

export default {
  name: "SellerRegister",
  components: {
    ChevronLeft,
    ChevronRight,
    Upload,
    ChevronDown
  },
  data() {
    return {
      currentStep: 0,
      steps: [
        "Personal Info",
        "Farm Details",
        "Payment Info",
        "Verification",
        "Delivery Info",
        "Additional Details",
        "Terms"
      ],
      isDeliveryDropdownOpen: false,
      isMunicipalityDropdownOpen: false,
      municipalities: [
        "Baco",
        "Bansud",
        "Bongabong",
        "Bulalacao",
        "Calapan City",
        "Gloria",
        "Mansalay",
        "Naujan",
        "Pinamalayan",
        "Pola",
        "Puerto Galera",
        "Roxas",
        "San Teodoro",
        "Socorro",
        "Victoria"
      ],
      deliveryMethods: [
        { label: "Own Delivery", value: "own_delivery" },
        { label: "Pickup Only", value: "pickup_only" }
      ],
      formData: {
        personalInfo: {
          firstName: "",
          lastName: "",
          contact: "",
          email: "",
          address: ""
        },
        farmDetails: {
          farmName: "",
          farmAddress: "",
          farmType: "",
          products: "",
          yearInFarming: 0
        },
        paymentInfo: {
          paymentMethod: "",
          accountName: "",
          accountNumber: ""
        },
        verificationDocs: {
          validID: null,
          businessPermit: null,
          farmCert: null
        },
        deliveryInfo: {
          deliveryMethods: [],
          operatingHours: "",
          areasCovered: []
        },
        additionalDetails: {
          socialMedia: "",
          wholesaleAvailability: false
        },
        termsAgreement: {
          agreeTerms: false,
          consentData: false
        }
      },
      uploadProgress: {
        validID: 0,
        businessPermit: 0,
        farmCert: 0
      }
    };
  },
  computed: {
    progressWidth() {
      return ((this.currentStep + 1) / this.steps.length) * 100;
    },
    canSubmit() {
      return this.formData.termsAgreement.agreeTerms && this.formData.termsAgreement.consentData;
    },
    selectedMunicipalities() {
      return this.formData.deliveryInfo.areasCovered || [];
    },
    selectedDeliveryMethods() {
      return this.formData.deliveryInfo.deliveryMethods || [];
    }
  },
  async created() {
    await this.fetchUserData();
  },
  methods: {
    toggleDeliveryDropdown() {
      this.isDeliveryDropdownOpen = !this.isDeliveryDropdownOpen;
      if (this.isDeliveryDropdownOpen) {
        this.isMunicipalityDropdownOpen = false;
      }
    },
    toggleMunicipalityDropdown() {
      this.isMunicipalityDropdownOpen = !this.isMunicipalityDropdownOpen;
      if (this.isMunicipalityDropdownOpen) {
        this.isDeliveryDropdownOpen = false;
      }
    },
    goToStep(index) {
      if (index <= this.currentStep) {
        this.currentStep = index;
      }
    },
    async fetchUserData() {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error("No authenticated user found.");
          return;
        }

        // Fetch user data from Firestore
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();

          // Populate personalInfo fields with user data
          this.formData.personalInfo = {
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            contact: userData.contactNumber || "",
            email: userData.email || "",
            address: userData.address || ""
          };
        } else {
          console.error("User document not found in Firestore.");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    },
    nextStep() {
      if (this.currentStep < this.steps.length - 1) {
        this.currentStep++;
      }
    },
    prevStep() {
      if (this.currentStep > 0) {
        this.currentStep--;
      }
    },
    handleFileUpload(event, key) {
      const file = event.target.files[0];
      if (!file) return;
      
      this.formData.verificationDocs[key] = file;
    },
    async uploadFile(file, path) {
      if (!file) return null;

      try {
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        const storageRef = ref(storage, `${path}/${fileName}`);
        
        // Upload the file
        const uploadTask = await uploadBytes(storageRef, file);
        
        // Get download URL
        const downloadURL = await getDownloadURL(uploadTask.ref);
        return downloadURL;
      } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
      }
    },
    async submitForm() {
      try {
        const user = auth.currentUser;
        if (!user) {
          alert("No authenticated user found. Please log in.");
          return;
        }

        // Upload files to Firebase Storage
        const validIDUrl = this.formData.verificationDocs.validID ? 
          await this.uploadFile(this.formData.verificationDocs.validID, `sellers/${user.uid}/documents`) : null;
        
        const businessPermitUrl = this.formData.verificationDocs.businessPermit ? 
          await this.uploadFile(this.formData.verificationDocs.businessPermit, `sellers/${user.uid}/documents`) : null;
        
        const farmCertUrl = this.formData.verificationDocs.farmCert ? 
          await this.uploadFile(this.formData.verificationDocs.farmCert, `sellers/${user.uid}/documents`) : null;

        // Prepare seller data for Firestore
        const sellerData = {
          userId: user.uid,
          personalInfo: this.formData.personalInfo,
          farmDetails: this.formData.farmDetails,
          paymentInfo: this.formData.paymentInfo,
          deliveryInfo: {
            deliveryMethods: this.formData.deliveryInfo.deliveryMethods,
            operatingHours: this.formData.deliveryInfo.operatingHours,
            areasCovered: this.formData.deliveryInfo.areasCovered
          },
          additionalDetails: this.formData.additionalDetails,
          documents: {
            validID: validIDUrl,
            businessPermit: businessPermitUrl,
            farmCert: farmCertUrl
          },
          termsAgreement: this.formData.termsAgreement,
          isVerified: false,
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Check if seller document already exists
        const sellersRef = collection(db, "sellers");
        const sellerDocRef = await addDoc(sellersRef, sellerData);

        // Update user document to mark as seller
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          isSeller: true,
          sellerDocId: sellerDocRef.id
        });

        alert("Your seller application has been submitted successfully!");
        this.$emit('navigate', 'HomePage');
      } catch (error) {
        console.error("Error submitting form:", error);
        alert("There was an error submitting your application. Please try again.");
      }
    }
  }
};
</script>

<style scoped>
.supplier-form-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
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
  margin-right: 10px;
  background: transparent;
  border: none;
}

.header h1 {
  font-size: 18px;
  font-weight: 600;
}

.content {
  flex: 1;
  padding: 20px 15px;
  overflow-y: auto;
}

/* Progress Bar */
.progress-container {
  margin-bottom: 25px;
}

.progress-bar {
  height: 6px;
  background-color: #e0e0e0;
  border-radius: 3px;
  margin-bottom: 15px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #2e5c31;
  transition: width 0.3s ease;
}

.step-indicators {
  display: flex;
  justify-content: space-between;
  overflow-x: auto;
  padding-bottom: 10px;
}

.step-indicators::-webkit-scrollbar {
  height: 4px;
}

.step-indicators::-webkit-scrollbar-thumb {
  background-color: #ccc;
  border-radius: 2px;
}

.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 70px;
  cursor: pointer;
  opacity: 0.5;
  transition: all 0.3s ease;
}

.step-indicator.active {
  opacity: 1;
}

.step-indicator.current {
  color: #2e5c31;
  font-weight: 600;
}

.step-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin-bottom: 5px;
  transition: all 0.3s ease;
}

.step-indicator.active .step-number {
  background-color: #2e5c31;
  color: white;
}

.step-name {
  font-size: 11px;
  text-align: center;
  white-space: nowrap;
}

/* Form Container */
.form-container {
  background-color: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.form-step h2 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.step-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
  position: relative;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="number"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s ease;
  background-color: white;
}

.form-group input::placeholder,
.form-group textarea::placeholder,
.form-group select::placeholder {
  color: #999;
  opacity: 1;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #2e5c31;
  outline: none;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.checkbox-group input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #2e5c31;
}

.checkbox-group label {
  margin-bottom: 0;
}

/* Dropdown with Checkboxes */
.dropdown-checkbox {
  position: relative;
  width: 100%;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: white;
  cursor: pointer;
  font-size: 14px;
}

.dropdown-header svg {
  transition: transform 0.3s ease;
}

.dropdown-header .rotate-180 {
  transform: rotate(180deg);
}

.dropdown-content {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 0 0 8px 8px;
  z-index: 10;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.dropdown-content .checkbox-group {
  padding: 10px 15px;
  border-bottom: 1px solid #eee;
}

.dropdown-content .checkbox-group:last-child {
  border-bottom: none;
}

/* File Upload */
.file-upload {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.file-input {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

.file-upload-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  background-color: #f0f0f0;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
}

.file-name {
  margin-left: 10px;
  font-size: 14px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.file-help {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

/* Terms Container */
.terms-container {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.terms-container h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.terms-content {
  max-height: 150px;
  overflow-y: auto;
  padding-right: 10px;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.terms-content p {
  margin-bottom: 10px;
}

.terms-content ol {
  padding-left: 20px;
  margin-bottom: 10px;
}

.terms-content li {
  margin-bottom: 5px;
}

/* Navigation Buttons */
.form-navigation {
  display: flex;
  justify-content: space-between;
}

.prev-button,
.next-button,
.submit-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.prev-button {
  background-color: #f0f0f0;
  color: #333;
}

.next-button {
  background-color: #2e5c31;
  color: white;
  margin-left: auto;
}

.submit-button {
  background-color: #2e5c31;
  color: white;
  margin-left: auto;
}

.submit-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
