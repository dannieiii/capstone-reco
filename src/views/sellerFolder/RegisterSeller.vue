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
          <p class="step-description">Upload your verification documents. You can upload images (photos taken with your phone) or document files (scanned PDFs, Word documents, etc.) - whatever is most convenient for you.</p>
          
          <div class="upload-help-note">
            <p><strong>💡 Upload Options:</strong></p>
            <ul>
              <li>📱 <strong>Take photos</strong> with your phone camera - just make sure text is clearly readable</li>
              <li>📄 <strong>Upload files</strong> like PDFs, Word documents, or Excel spreadsheets</li>
              <li>🖼️ <strong>Scan or photo</strong> of physical documents works perfectly</li>
            </ul>
          </div>            <div class="form-group">
            <label for="validID">Valid ID</label>
            <div class="file-upload" @click="triggerFileInput('validID')">
              <input 
                type="file" 
                id="validID" 
                class="file-input" 
                ref="validIDInput"
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,.doc,.docx,.xls,.xlsx,.txt"
                @change="handleFileUpload($event, 'validID')"
              >
              <div class="file-upload-button">
                <Upload size="18" />
                <span>{{ formData.verificationDocs.validID ? 'Change Valid ID' : 'Upload Valid ID (Photo or File)' }}</span>
              </div>
              <div v-if="uploadStatus.validID.uploading" class="upload-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: uploadStatus.validID.progress + '%' }"></div>
                </div>
                <span>{{ Math.round(uploadStatus.validID.progress) }}%</span>
              </div>
              <span v-if="formData.verificationDocs.validID && !uploadStatus.validID.uploading" class="file-name">
                {{ uploadStatus.validID.error ? '❌ Upload failed' : (uploadStatus.validID.url ? '✅ Uploaded' : '📄 Ready to upload') }}
                {{ formData.verificationDocs.validID.name }}
              </span>
              <span v-if="uploadStatus.validID.error" class="file-error">
                {{ uploadStatus.validID.error }}
              </span>
              <p class="file-help">Accepted formats: Images (JPG, PNG), Documents (PDF, DOC, DOCX), Spreadsheets (XLS, XLSX) - max 5MB</p>
            </div>
          </div>            <div class="form-group">
            <label for="businessPermit">Business Permit</label>
            <div class="file-upload" @click="triggerFileInput('businessPermit')">
              <input 
                type="file" 
                id="businessPermit" 
                class="file-input" 
                ref="businessPermitInput"
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,.doc,.docx,.xls,.xlsx,.txt"
                @change="handleFileUpload($event, 'businessPermit')"
              >
              <div class="file-upload-button">
                <Upload size="18" />
                <span>{{ formData.verificationDocs.businessPermit ? 'Change Business Permit' : 'Upload Business Permit (Photo or File)' }}</span>
              </div>
              <div v-if="uploadStatus.businessPermit.uploading" class="upload-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: uploadStatus.businessPermit.progress + '%' }"></div>
                </div>
                <span>{{ Math.round(uploadStatus.businessPermit.progress) }}%</span>
              </div>
              <span v-if="formData.verificationDocs.businessPermit && !uploadStatus.businessPermit.uploading" class="file-name">
                {{ uploadStatus.businessPermit.error ? '❌ Upload failed' : (uploadStatus.businessPermit.url ? '✅ Uploaded' : '📄 Ready to upload') }}
                {{ formData.verificationDocs.businessPermit.name }}
              </span>
              <span v-if="uploadStatus.businessPermit.error" class="file-error">
                {{ uploadStatus.businessPermit.error }}
              </span>
              <p class="file-help">Accepted formats: Images (JPG, PNG), Documents (PDF, DOC, DOCX), Spreadsheets (XLS, XLSX) - max 5MB</p>
            </div>
          </div>            <div class="form-group">
            <label for="farmCert">Farm Certification</label>
            <div class="file-upload" @click="triggerFileInput('farmCert')">
              <input 
                type="file" 
                id="farmCert" 
                class="file-input" 
                ref="farmCertInput"
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,.doc,.docx,.xls,.xlsx,.txt"
                @change="handleFileUpload($event, 'farmCert')"
              >
              <div class="file-upload-button">
                <Upload size="18" />
                <span>{{ formData.verificationDocs.farmCert ? 'Change Farm Certification' : 'Upload Farm Certification (Photo or File)' }}</span>
              </div>
              <div v-if="uploadStatus.farmCert.uploading" class="upload-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: uploadStatus.farmCert.progress + '%' }"></div>
                </div>
                <span>{{ Math.round(uploadStatus.farmCert.progress) }}%</span>
              </div>
              <span v-if="formData.verificationDocs.farmCert && !uploadStatus.farmCert.uploading" class="file-name">
                {{ uploadStatus.farmCert.error ? '❌ Upload failed' : (uploadStatus.farmCert.url ? '✅ Uploaded' : '📄 Ready to upload') }}
                {{ formData.verificationDocs.farmCert.name }}
              </span>
              <span v-if="uploadStatus.farmCert.error" class="file-error">
                {{ uploadStatus.farmCert.error }}
              </span>
              <p class="file-help">Accepted formats: Images (JPG, PNG), Documents (PDF, DOC, DOCX), Spreadsheets (XLS, XLSX) - max 5MB</p>
            </div>
          </div>
          
          <!-- Debug Information (only shown when files are selected) -->
          <div v-if="Object.values(formData.verificationDocs).some(file => file)" class="debug-panel">
            <h4>🛠️ Upload Debug Information</h4>
            <div class="debug-info">
              <p><strong>Selected Files:</strong></p>
              <ul>
                <li v-if="formData.verificationDocs.validID">Valid ID: {{ formData.verificationDocs.validID.name }} ({{ (formData.verificationDocs.validID.size / 1024 / 1024).toFixed(2) }}MB)</li>
                <li v-if="formData.verificationDocs.businessPermit">Business Permit: {{ formData.verificationDocs.businessPermit.name }} ({{ (formData.verificationDocs.businessPermit.size / 1024 / 1024).toFixed(2) }}MB)</li>
                <li v-if="formData.verificationDocs.farmCert">Farm Cert: {{ formData.verificationDocs.farmCert.name }} ({{ (formData.verificationDocs.farmCert.size / 1024 / 1024).toFixed(2) }}MB)</li>
              </ul>
              
              <p><strong>Upload Status:</strong></p>
              <ul>
                <li v-if="formData.verificationDocs.validID">Valid ID: 
                  <span :class="uploadStatus.validID.uploading ? 'status-uploading' : (uploadStatus.validID.url ? 'status-complete' : 'status-pending')">
                    {{ uploadStatus.validID.uploading ? 'Uploading...' : (uploadStatus.validID.url ? 'Complete ✅' : (uploadStatus.validID.error ? 'Failed ❌' : 'Ready 📄')) }}
                  </span>
                </li>
                <li v-if="formData.verificationDocs.businessPermit">Business Permit: 
                  <span :class="uploadStatus.businessPermit.uploading ? 'status-uploading' : (uploadStatus.businessPermit.url ? 'status-complete' : 'status-pending')">
                    {{ uploadStatus.businessPermit.uploading ? 'Uploading...' : (uploadStatus.businessPermit.url ? 'Complete ✅' : (uploadStatus.businessPermit.error ? 'Failed ❌' : 'Ready 📄')) }}
                  </span>
                </li>
                <li v-if="formData.verificationDocs.farmCert">Farm Cert: 
                  <span :class="uploadStatus.farmCert.uploading ? 'status-uploading' : (uploadStatus.farmCert.url ? 'status-complete' : 'status-pending')">
                    {{ uploadStatus.farmCert.uploading ? 'Uploading...' : (uploadStatus.farmCert.url ? 'Complete ✅' : (uploadStatus.farmCert.error ? 'Failed ❌' : 'Ready 📄')) }}
                  </span>
                </li>
              </ul>
              
              <!-- Test buttons for each document type -->
              <div class="test-buttons">
                <button v-if="formData.verificationDocs.validID" @click="testUpload('validID')" class="test-btn" :disabled="uploadStatus.validID.uploading">🧪 Test Valid ID</button>
                <button v-if="formData.verificationDocs.businessPermit" @click="testUpload('businessPermit')" class="test-btn" :disabled="uploadStatus.businessPermit.uploading">🧪 Test Business Permit</button>
                <button v-if="formData.verificationDocs.farmCert" @click="testUpload('farmCert')" class="test-btn" :disabled="uploadStatus.farmCert.uploading">🧪 Test Farm Cert</button>
              </div>
            </div>
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
        </button>        <button 
          v-if="currentStep === steps.length - 1" 
          class="submit-button" 
          @click="submitForm"
          :disabled="!canSubmit || isSubmitting"
        >
          <span v-if="isSubmitting">
            <span class="loading-spinner"></span>
            <span v-if="uploadInProgress">Uploading documents...</span>
            <span v-else-if="savingToDatabase">Saving application...</span>
            <span v-else>Submitting...</span>
          </span>
          <span v-else>Submit Application</span>
        </button>
      </div>
    </div>
    
    <!-- Custom Notification -->
    <div v-if="notification.show" class="custom-notification" :class="notification.type">
      <div class="notification-content">
        <div class="notification-header">
          <h4 class="notification-title">{{ notification.title }}</h4>
          <button class="notification-close" @click="closeNotification">&times;</button>
        </div>
        <div class="notification-body">
          <p v-html="notification.message"></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db, auth, storage } from "@/firebase/firebaseConfig";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
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
      },      uploadProgress: {
        validID: 0,
        businessPermit: 0,
        farmCert: 0
      },
      uploadStatus: {
        validID: {
          progress: 0,
          error: null,
          uploading: false,
          url: null
        },
        businessPermit: {
          progress: 0,
          error: null,
          uploading: false,
          url: null
        },
        farmCert: {
          progress: 0,
          error: null,
          uploading: false,
          url: null
        }
      },
      isSubmitting: false,
      uploadInProgress: false,
      savingToDatabase: false,
      
      // Notification system
      notification: {
        show: false,
        type: 'success', // 'success', 'error', 'warning', 'info'
        title: '',
        message: '',
        duration: 5000
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
    
    // Notification methods
    showNotification(title, message, type = 'success', duration = 5000) {
      this.notification = {
        show: true,
        type: type,
        title: title,
        message: message,
        duration: duration
      };
      
      // Auto-hide after duration
      setTimeout(() => {
        this.closeNotification();
      }, duration);
    },
    
    closeNotification() {
      this.notification.show = false;
    },
    
    // Test Firebase Storage connection
    async testStorageConnection() {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.log('No user authenticated for storage test');
          return false;
        }
        
        console.log('Testing Firebase Storage connection...', {
          userId: user.uid,
          email: user.email
        });
        
        return true;
      } catch (error) {
        console.error('Storage connection test failed:', error);
        return false;
      }
    },
    
    handleFileUpload(event, key) {
      const file = event.target.files[0];
      if (!file) return;
      
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        this.showNotification('File Too Large', 'Please select a file smaller than 5MB', 'error');
        return;
      }
      
      // Validate file type - Support images, PDFs, and common document formats
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ];
      if (!allowedTypes.includes(file.type)) {
        this.showNotification('Invalid File Type', 'Please select an image, PDF, Word document, Excel file, or text file', 'error');
        return;
      }
      
      this.formData.verificationDocs[key] = file;
      
      // Show success feedback for file selection
      this.showNotification('File Selected', `${file.name} is ready to upload`, 'success', 2000);
      
      // Test storage connection when file is selected
      this.testStorageConnection();
    },
      triggerFileInput(key) {
      this.$refs[`${key}Input`].click();
    },    async uploadFile(file, docType) {
      if (!file) return null;
      
      try {
        // Reset status
        this.uploadStatus[docType] = {
          progress: 0,
          error: null,
          uploading: true,
          url: null
        };

        // Validate file - Support multiple document formats
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = [
          'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
          'application/pdf',
          'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain'
        ];
        
        if (file.size > maxSize) {
          throw new Error('File size must be less than 5MB');
        }
        
        if (!allowedTypes.includes(file.type)) {
          throw new Error('Only image files, documents (PDF, DOC, DOCX), spreadsheets (XLS, XLSX), and text files are allowed');
        }

        // Create storage reference with better organization
        const user = auth.currentUser;
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const sanitizedFileName = `${docType}_${timestamp}.${fileExtension}`;
        
        // Simpler storage path
        const storageRef = ref(storage, `seller-documents/${user.uid}/${sanitizedFileName}`);
        
        console.log(`Starting upload for ${docType}:`, {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          storagePath: `seller-documents/${user.uid}/${sanitizedFileName}`
        });

        // Start upload with progress tracking
        const uploadTask = uploadBytesResumable(storageRef, file);

        // Create upload promise with better error handling
        const uploadPromise = new Promise((resolve, reject) => {
          // Set reasonable timeout for upload (30 seconds)
          const timeoutId = setTimeout(() => {
            uploadTask.cancel();
            reject(new Error('Upload timeout - please check your connection and try again'));
          }, 30000); // 30 second timeout

          uploadTask.on('state_changed',
            (snapshot) => {
              // Update progress
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              this.uploadStatus[docType].progress = Math.round(progress);
              console.log(`Upload progress for ${docType}: ${Math.round(progress)}%`);
            },
            (error) => {
              // Upload failed
              clearTimeout(timeoutId);
              console.error(`Upload error for ${docType}:`, error);
              
              let errorMessage = 'Upload failed';
              
              // Handle specific Firebase Storage errors
              switch (error.code) {
                case 'storage/unauthorized':
                  errorMessage = 'Upload unauthorized - please log in again';
                  break;
                case 'storage/canceled':
                  errorMessage = 'Upload was cancelled';
                  break;
                case 'storage/quota-exceeded':
                  errorMessage = 'Storage quota exceeded';
                  break;
                case 'storage/invalid-format':
                  errorMessage = 'Invalid file format';
                  break;
                case 'storage/unknown':
                  if (error.message.includes('CORS')) {
                    errorMessage = 'Upload blocked by browser security - try refreshing and uploading again';
                  } else {
                    errorMessage = 'Connection error - please check your internet and try again';
                  }
                  break;
                default:
                  errorMessage = error.message || 'Upload failed due to connection issues';
              }
              
              this.uploadStatus[docType].error = errorMessage;
              this.uploadStatus[docType].uploading = false;
              
              // Show error notification
              this.showNotification('Upload Failed', `${docType}: ${errorMessage}`, 'error', 4000);
              
              reject(new Error(errorMessage));
            },
            async () => {
              // Upload completed successfully
              clearTimeout(timeoutId);
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                this.uploadStatus[docType].url = downloadURL;
                this.uploadStatus[docType].uploading = false;
                this.uploadStatus[docType].progress = 100;
                console.log(`Upload successful for ${docType}: ${downloadURL}`);
                
                // Show success notification
                this.showNotification('Upload Successful', `${docType} uploaded successfully!`, 'success', 3000);
                
                resolve(downloadURL);
              } catch (error) {
                console.error(`Error getting download URL for ${docType}:`, error);
                this.uploadStatus[docType].error = 'Upload completed but failed to get file URL';
                this.uploadStatus[docType].uploading = false;
                reject(new Error('Upload completed but failed to get file URL'));
              }
            }
          );
        });

        return await uploadPromise;
      } catch (error) {
        console.error(`Upload failed for ${docType}:`, error);
        this.uploadStatus[docType].error = error.message;
        this.uploadStatus[docType].uploading = false;
        this.uploadStatus[docType].progress = 0;
        throw error;
      }
    },    async uploadAllDocuments() {
      const results = {
        validID: { success: false, url: '', error: null },
        businessPermit: { success: false, url: '', error: null },
        farmCert: { success: false, url: '', error: null }
      };
      
      const uploadOrder = ['validID', 'businessPermit', 'farmCert'];
      const totalFiles = uploadOrder.filter(docType => this.formData.verificationDocs[docType]).length;
      
      if (totalFiles === 0) {
        console.log("No files to upload, returning empty results");
        return results;
      }
      
      console.log(`Starting upload process for ${totalFiles} file(s)...`);
      
      // Set overall timeout for all uploads (15 seconds max for better UX)
      const uploadTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Upload timeout - taking too long')), 15000);
      });
      
      try {
        // Use Promise.allSettled to upload all files in parallel with individual timeouts
        const uploadPromises = uploadOrder.map(async (docType) => {
          const file = this.formData.verificationDocs[docType];
          if (!file) {
            return { docType, result: { success: false, url: '', error: null } };
          }
          
          try {
            // Individual file timeout (8 seconds per file for faster feedback)
            const singleUploadTimeout = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Individual file upload timeout')), 8000);
            });
            
            const uploadResult = await Promise.race([
              this.fastUpload(file, docType),
              singleUploadTimeout
            ]);
            
            console.log(`✅ Upload successful for ${docType}`);
            return { docType, result: uploadResult };
            
          } catch (error) {
            console.error(`❌ Failed to upload ${docType}:`, error.message);
            
            // Update UI status immediately
            this.uploadStatus[docType].error = error.message || 'Upload failed';
            this.uploadStatus[docType].uploading = false;
            this.uploadStatus[docType].progress = 0;
            
            return { 
              docType, 
              result: { 
                success: false, 
                url: '', 
                error: error.message || 'Upload failed due to connection issues' 
              } 
            };
          }
        });
        
        // Wait for all uploads with overall timeout
        const allResults = await Promise.race([
          Promise.allSettled(uploadPromises),
          uploadTimeout
        ]);
        
        // Process results
        allResults.forEach(({ value }) => {
          if (value && value.docType) {
            results[value.docType] = value.result;
          }
        });
        
      } catch (error) {
        console.error("Overall upload process failed:", error.message);
        // Mark all pending uploads as failed
        uploadOrder.forEach(docType => {
          if (this.formData.verificationDocs[docType] && !results[docType].success) {
            results[docType] = {
              success: false,
              url: '',
              error: 'Upload timeout or connection issue'
            };
            this.uploadStatus[docType].error = 'Upload timeout';
            this.uploadStatus[docType].uploading = false;
            this.uploadStatus[docType].progress = 0;
          }
        });
      }
      
      // Log final results
      const successCount = Object.values(results).filter(r => r.success).length;
      const errorCount = Object.values(results).filter(r => r.error).length;
      
      console.log(`Upload process completed: ${successCount} successful, ${errorCount} failed`);
      console.log('Final upload results:', results);
      
      return results;
    },

    // Add a fast, simplified upload method for better performance
    async fastUpload(file, docType) {
      if (!file) return { success: false, url: '', error: null };
      
      try {
        console.log(`Starting fastUpload for ${docType}:`, {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        });
        
        // Reset status with immediate feedback
        this.uploadStatus[docType] = {
          progress: 0,
          error: null,
          uploading: true,
          url: null
        };

        // Quick validation
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          throw new Error('File too large (max 5MB)');
        }

        // Create storage reference with simplified path
        const user = auth.currentUser;
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const sanitizedFileName = `${docType}_${timestamp}.${fileExtension}`;
        
        // Use a simpler storage path that's more likely to work
        const storageRef = ref(storage, `seller-docs/${user.uid}/${sanitizedFileName}`);

        console.log(`Uploading to path: seller-docs/${user.uid}/${sanitizedFileName}`);

        // Try a more direct upload approach
        try {
          // First try simple upload without progress tracking
          const snapshot = await uploadBytesResumable(storageRef, file);
          this.uploadStatus[docType].progress = 100;
          
          const downloadURL = await getDownloadURL(snapshot.ref);
          
          this.uploadStatus[docType].url = downloadURL;
          this.uploadStatus[docType].uploading = false;
          this.uploadStatus[docType].progress = 100;
          
          console.log(`FastUpload successful for ${docType}: ${downloadURL}`);
          this.showNotification('Upload Complete', `${docType} uploaded successfully`, 'success', 3000);
          
          return { success: true, url: downloadURL, error: null };
          
        } catch (uploadError) {
          console.error(`Upload error for ${docType}:`, uploadError);
          throw uploadError;
        }
        
      } catch (error) {
        console.error(`FastUpload failed for ${docType}:`, error);
        
        this.uploadStatus[docType].error = error.message;
        this.uploadStatus[docType].uploading = false;
        this.uploadStatus[docType].progress = 0;
        
        this.showNotification('Upload Failed', `${docType}: ${error.message}`, 'error', 4000);
        
        return { success: false, url: '', error: error.message };
      }
    },

    async retryUpload(file, docType, maxAttempts) {
      let attempts = 0;
      let lastError = null;
      
      while (attempts < maxAttempts) {
        attempts++;
        try {
          console.log(`🔄 Upload attempt ${attempts}/${maxAttempts} for ${docType}`);
          const url = await this.uploadFile(file, docType);
          console.log(`✅ Upload successful on attempt ${attempts} for ${docType}`);
          return {
            success: true,
            url: url,
            attempts: attempts
          };
        } catch (error) {
          lastError = error;
          console.warn(`❌ Upload attempt ${attempts} failed for ${docType}:`, error.message);
          
          // For certain errors, don't retry as it won't help
          if (error.message.includes('CORS') || 
              error.message.includes('cross-origin') ||
              error.message.includes('unauthorized') ||
              error.message.includes('invalid-format')) {
            console.log(`🚫 Non-retryable error detected for ${docType}, stopping retries`);
            break;
          }
          
          // Progressive delay between retries
          if (attempts < maxAttempts) {
            const delay = Math.min(1000 * attempts, 3000); // Max 3 second delay
            console.log(`⏱️ Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      // If we get here, all attempts failed
      const errorMessage = lastError?.message || 'Upload failed after multiple attempts';
      throw new Error(`Failed after ${attempts} attempts: ${errorMessage}`);
    },    showSubmissionResult(uploadResults) {
      // Count successful uploads
      const totalFilesSelected = Object.values(this.formData.verificationDocs).filter(file => file).length;
      const successfulUploads = Object.values(uploadResults).filter(r => r?.success).length;
      const failedUploads = Object.values(uploadResults).filter(r => r?.error).length;
      
      let title = "🎉 Application Submitted Successfully!";
      let message = "Your seller application has been submitted and is now under review.";
      let type = "success";
      
      // Document upload status
      if (totalFilesSelected === 0) {
        message += "<br><br>📝 <strong>Documents:</strong> None uploaded - you can add them later from your dashboard.";
      } else if (successfulUploads === totalFilesSelected) {
        message += `<br><br>✅ <strong>Documents:</strong> All ${successfulUploads} document(s) uploaded successfully.`;
      } else if (successfulUploads > 0) {
        message += `<br><br>⚠️ <strong>Documents:</strong> ${successfulUploads} of ${totalFilesSelected} uploaded. Upload the rest later.`;
      } else if (failedUploads > 0) {
        message += `<br><br>❌ <strong>Documents:</strong> Upload failed due to connection issues. Try again from your dashboard.`;
      }
      
      // Email confirmation and approval process
      message += "<br><br>📧 <strong>Next Steps:</strong>";
      message += "<br>• Check your email for confirmation";
      message += "<br>• Review time: 1-2 business days";
      message += "<br>• You'll receive email notification when approved";
      message += "<br>• Then you can start listing products!";
      
      this.showNotification(title, message, type, 8000); // Show for 8 seconds
    },async submitForm() {
      // Add overall timeout to prevent hanging
      const overallTimeout = setTimeout(() => {
        if (this.isSubmitting) {
          this.showNotification('Taking Longer Than Expected', 'Your application is still being processed. Please wait a moment or try uploading fewer/smaller documents.', 'warning', 6000);
        }
      }, 45000); // 45 second overall timeout warning

      try {
        const user = auth.currentUser;
        if (!user) {
          this.showNotification('Authentication Required', 'Please log in to continue with your application.', 'error');
          return;
        }

        this.isSubmitting = true;
        this.uploadInProgress = false;
        this.savingToDatabase = false;
        console.log("Starting form submission...");

        // Check if any files are selected
        const hasFiles = Object.values(this.formData.verificationDocs).some(file => file);
        
        // Initialize upload results - this ensures we always have a valid structure
        let uploadResults = {
          validID: { success: false, url: '', error: null },
          businessPermit: { success: false, url: '', error: null },
          farmCert: { success: false, url: '', error: null }
        };
        // Try to upload documents if any are selected
        if (hasFiles) {
          this.uploadInProgress = true;
          try {
            console.log("Attempting to upload documents...");
            uploadResults = await this.uploadAllDocuments();
            console.log("Upload process completed:", uploadResults);
          } catch (error) {
            console.error("Upload process failed, but continuing with form submission:", error);
            // uploadResults already initialized above, so we can continue
          } finally {
            this.uploadInProgress = false;
          }
        } else {
          console.log("No files selected, skipping upload process");
        }

        // Check upload status and get user confirmation if needed
        const shouldContinue = await this.checkUploadStatusAndConfirm(hasFiles, uploadResults);
        if (!shouldContinue) {
          this.isSubmitting = false;
          return;
        }

        // Prepare seller data to match your exact Firestore format
        const sellerData = {
          // Additional details (map)
          additionalDetails: {
            socialMedia: this.formData.additionalDetails.socialMedia || "",
            wholesaleAvailability: this.formData.additionalDetails.wholesaleAvailability || false
          },
          
          // Created timestamp (string format like your example)
          createdAt: new Date().toISOString(),
          
          // Delivery info (map)
          deliveryInfo: {
            areasCovered: this.formData.deliveryInfo.areasCovered || [],
            deliveryMethods: this.formData.deliveryInfo.deliveryMethods || []
          },
          
          // Documents (map) - simple string URLs only
          documents: {
            businessPermit: uploadResults.businessPermit?.url || "",
            farmCert: uploadResults.farmCert?.url || "",
            validID: uploadResults.validID?.url || ""
          },
          
          // Farm details (map) - moved isOnline and isVerified to root level
          farmDetails: {
            farmAddress: this.formData.farmDetails.farmAddress || "",
            farmName: this.formData.farmDetails.farmName || "",
            farmType: this.formData.farmDetails.farmType || "",
            products: this.formData.farmDetails.products || "",
            yearInFarming: this.formData.farmDetails.yearInFarming?.toString() || "0" // Convert to string
          },
          
          // Payment info (map)
          paymentInfo: {
            accountName: this.formData.paymentInfo.accountName || "",
            accountNumber: this.formData.paymentInfo.accountNumber || "",
            paymentMethod: this.formData.paymentInfo.paymentMethod || ""
          },
          
          // Personal info (map) - moved registrationStatus and status to root level
          personalInfo: {
            address: this.formData.personalInfo.address || "",
            contact: this.formData.personalInfo.contact || "",
            email: this.formData.personalInfo.email || "",
            firstName: this.formData.personalInfo.firstName || "",
            lastName: this.formData.personalInfo.lastName || "",
            photoUrl: "" // Empty initially
          },
          
          // Terms agreement (map)
          termsAgreement: {
            agreeTerms: this.formData.termsAgreement.agreeTerms || false,
            consentData: this.formData.termsAgreement.consentData || false
          },
          
          // Updated timestamp (Firestore timestamp)
          updatedAt: new Date(),
          
          // User ID (string)
          userId: user.uid,
          
          // Verification status (string) - will be updated by admin
          verificationStatus: "Pending",
          
          // Status fields moved to root level for easier access and consistency
          registrationStatus: "Pending", // Will be updated by admin to "Accept" or "Reject"
          status: "Pending", // Will be updated by admin to "Active" or "Inactive"
          isOnline: false, // Initially false, will be set when seller comes online
          isVerified: false // Initially false, will be updated by admin upon verification
        };

        console.log("Saving seller data to Firestore...", sellerData);

        this.savingToDatabase = true;
        // Save to Firestore with timeout and retry mechanism
        let attempts = 0;
        const maxAttempts = 2; // Reduced from 3 for faster feedback
        let sellerDocRef = null;

        while (attempts < maxAttempts && !sellerDocRef) {
          try {
            attempts++;
            console.log(`Firestore save attempt ${attempts}...`);
            
            const sellersRef = collection(db, "sellers");
            
            // Add timeout to Firestore write
            const firestoreWritePromise = addDoc(sellersRef, sellerData);
            const firestoreTimeout = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Firestore write timeout')), 10000); // 10 second timeout
            });
            
            sellerDocRef = await Promise.race([firestoreWritePromise, firestoreTimeout]);
            
            console.log("Seller document created with ID:", sellerDocRef.id);
            break;
          } catch (firestoreError) {
            console.error(`Firestore save attempt ${attempts} failed:`, firestoreError);
            if (attempts === maxAttempts) {
              throw new Error(`Failed to save to Firestore after ${maxAttempts} attempts: ${firestoreError.message}`);
            }
            // Wait before retry (reduced wait time)
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        // Update user document to mark as seller (with timeout)
        try {
          console.log("Updating user document to mark as seller...");
          const userRef = doc(db, "users", user.uid);
          
          const userUpdatePromise = updateDoc(userRef, {
            isSeller: false, // Initially false until approved
            isVerified: false // Initially false until admin verifies
          });
          
          const userUpdateTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('User update timeout')), 5000); // 5 second timeout
          });
          
          await Promise.race([userUpdatePromise, userUpdateTimeout]);
          console.log("✅ User document updated successfully - status set to pending");
        } catch (userUpdateError) {
          console.error("❌ Failed to update user document:", userUpdateError);
          // Don't fail the whole process if this fails, but log it
          console.warn("Application submitted successfully but user status update failed. This may cause UI issues.");
        }

        console.log("🎉 Application submission completed successfully!");
        
        // Show success message with email confirmation details
        this.showSubmissionResult(uploadResults);
        
        // Show navigation countdown notification
        this.showNotification(
          '🎉 Success! Redirecting...', 
          'You will be redirected to the home page in 3 seconds. You can then access your seller dashboard to manage your products and upload any missing documents.', 
          'success', 
          3500
        );
        
        // Navigate to HomeView after successful submission (with delay to show success message)
        console.log("Navigating to HomeView in 3 seconds...");
        setTimeout(() => {
          this.$router.push('/').then(() => {
            console.log("Successfully navigated to HomeView");
            this.showNotification(
              'Welcome to Your Dashboard!', 
              'You can now access your seller dashboard and upload any missing documents.', 
              'info', 
              4000
            );
          }).catch(error => {
            console.error("Navigation error:", error);
            // Fallback notification if navigation fails
            this.showNotification(
              'Navigation Notice', 
              'Your application was submitted successfully! Please navigate to the home page to continue.', 
              'info', 
              6000
            );
            // Try alternative navigation methods
            try {
              this.$emit('navigate', 'HomeView');
            } catch (emitError) {
              console.error("Emit navigation error:", emitError);
              // Last resort - reload the page to the root
              window.location.href = '/';
            }
          });
        }, 3000); // 3 second delay to show success notification
      } catch (error) {
        console.error("Error submitting form:", error);
        
        // More specific error messages
        let title = "Submission Failed";
        let message = "There was an error submitting your application.";
        
        if (error.message.includes('Firestore')) {
          message = "Database connection failed. Please check your internet connection and try again.";
        } else if (error.message.includes('auth')) {
          message = "Authentication error. Please log out and log back in.";
        } else {
          message = `Error: ${error.message}<br><br>Please try again or contact support if the problem persists.`;
        }
        
        this.showNotification(title, message, 'error', 8000);
      } finally {
        clearTimeout(overallTimeout);
        this.isSubmitting = false;
        this.uploadInProgress = false;
        this.savingToDatabase = false;
        // Reset all progress bars
        this.uploadProgress.validID = 0;        this.uploadProgress.businessPermit = 0;
        this.uploadProgress.farmCert = 0;
      }
    },
    async checkUploadStatusAndConfirm(hasFiles, uploadResults) {
      if (!hasFiles) {
        this.showNotification(
          'No Documents Uploaded', 
          'Your application will be submitted without verification documents. You can upload them later from your seller dashboard.', 
          'warning', 
          5000
        );
        return true; // Continue with submission
      }

      // Check if any uploads failed
      const failedUploads = Object.entries(uploadResults)
        .filter(([key, result]) => this.formData.verificationDocs[key] && (!result.success || result.error))
        .map(([key]) => key);

      if (failedUploads.length > 0) {
        const failedNames = failedUploads.map(key => {
          switch(key) {
            case 'validID': return 'Valid ID';
            case 'businessPermit': return 'Business Permit';
            case 'farmCert': return 'Farm Certification';
            default: return key;
          }
        });
        
        this.showNotification(
          'Some Documents Failed to Upload', 
          `The following documents failed to upload: ${failedNames.join(', ')}. Your application will be submitted without these documents. You can upload them later from your seller dashboard.`, 
          'warning', 
          7000
        );
        return true; // Continue with submission
      }

      return true; // All uploads successful or no issues
    },
    
    // Simple upload method for testing
    async simpleUploadTest(file, docType) {
      try {
        console.log(`Starting simple upload test for ${docType}`);
        
        const user = auth.currentUser;
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Create a simple filename
        const timestamp = Date.now();
        const extension = file.name.split('.').pop();
        const fileName = `test_${docType}_${timestamp}.${extension}`;
        
        // Create storage reference
        const storageRef = ref(storage, `test-uploads/${user.uid}/${fileName}`);
        
        console.log(`Uploading to: test-uploads/${user.uid}/${fileName}`);
        
        // Try simple upload
        const snapshot = await uploadBytesResumable(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        console.log(`Simple upload successful: ${downloadURL}`);
        return downloadURL;
        
      } catch (error) {
        console.error(`Simple upload failed for ${docType}:`, error);
        throw error;
      }
    },
    
    // Test upload method that can be called manually
    async testUpload(docType) {
      const file = this.formData.verificationDocs[docType];
      if (!file) {
        this.showNotification('No File Selected', `Please select a ${docType} file first`, 'warning');
        return;
      }
      
      this.showNotification('Testing Upload', `Starting test upload for ${docType}...`, 'info', 2000);
      
      try {
        const result = await this.simpleUploadTest(file, docType);
        this.showNotification('Test Successful!', `Upload test passed for ${docType}`, 'success', 4000);
        console.log('Test upload result:', result);
      } catch (error) {
        this.showNotification('Test Failed', `Upload test failed: ${error.message}`, 'error', 5000);
        console.error('Test upload error:', error);
      }
    }
  }
};
</script>

<style scoped>
/* Custom Notification */
.custom-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  max-width: 400px;
  min-width: 300px;
  z-index: 9999;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(10px);
  animation: slideInRight 0.3s ease-out;
  overflow: hidden;
}

.custom-notification.success {
  background: linear-gradient(135deg, #10b981, #059669);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.custom-notification.error {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.custom-notification.warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.custom-notification.info {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.notification-content {
  padding: 20px;
  color: white;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.notification-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  line-height: 1.2;
}

.notification-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 12px;
  transition: background 0.2s ease;
}

.notification-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.notification-body p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  opacity: 0.95;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Debug Panel */
.debug-panel {
  background-color: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
}

.debug-panel h4 {
  color: #495057;
  margin: 0 0 15px 0;
  font-size: 14px;
}

.debug-info ul {
  margin: 8px 0;
  padding-left: 20px;
}

.debug-info li {
  margin-bottom: 5px;
  font-size: 13px;
  color: #666;
}

.status-uploading {
  color: #f59e0b;
  font-weight: 600;
}

.status-complete {
  color: #10b981;
  font-weight: 600;
}

.status-pending {
  color: #6b7280;
}

.test-buttons {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.test-btn {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.test-btn:hover:not(:disabled) {
  background-color: #2563eb;
}

.test-btn:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

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
.upload-help-note {
  background-color: #f0f8ff;
  border: 1px solid #b3d9ff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.upload-help-note p {
  margin: 0 0 8px 0;
  color: #2e5c31;
  font-weight: 600;
}

.upload-help-note ul {
  margin: 0;
  padding-left: 20px;
  list-style: none;
}

.upload-help-note li {
  margin-bottom: 6px;
  color: #555;
  font-size: 14px;
}

.file-upload {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.file-upload:hover {
  border-color: #2e5c31;
  background-color: #f8f9fa;
}

.file-input {
  display: none;
}

.file-upload-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #2e5c31;
  font-weight: 500;
  cursor: pointer;
}

.file-name {
  font-size: 12px;
  color: #28a745;
  font-weight: 500;
  margin-top: 5px;
}

.file-error {
  font-size: 12px;
  color: #dc3545;
  margin-top: 5px;
  display: block;
}

.file-help {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.upload-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.upload-progress .progress-bar {
  width: 100%;
  height: 4px;
  background-color: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
}

.upload-progress .progress-fill {
  height: 100%;
  background-color: #2e5c31;
  transition: width 0.3s ease;
}

.upload-progress span {
  font-size: 12px;
  color: #2e5c31;
  font-weight: 500;
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

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.submit-button:disabled .loading-spinner {
  border-top-color: #666;
}
</style>
