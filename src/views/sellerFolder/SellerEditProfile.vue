<template>
  <div class="edit-profile">
    <div class="header">
      <button class="back-button" @click="$emit('navigate', 'ViewProfile')">
        <ChevronLeft size="22" />
      </button>
      <h1>Edit Profile</h1>
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
        <!-- Profile Picture Section -->
        <div class="profile-picture-section">
          <div class="profile-picture">
            <img 
              v-if="profileImageUrl" 
              :src="profileImageUrl" 
              alt="Profile picture" 
            />
            <User v-else size="64" class="default-icon" />
            <button class="change-photo-btn" @click="openFileInput">
              <Camera size="18" />
            </button>
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

        <!-- Multi-step Form -->
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
              <p class="step-description">Update your basic contact information</p>
              
              <div class="form-group">
                <label for="firstName">First Name</label>
                <input 
                  type="text" 
                  id="firstName" 
                  v-model="firstName" 
                  placeholder="Enter your first name"
                />
              </div>
              
              <div class="form-group">
                <label for="lastName">Last Name</label>
                <input 
                  type="text" 
                  id="lastName" 
                  v-model="lastName" 
                  placeholder="Enter your last name"
                />
              </div>
              
              <div class="form-group">
                <label for="contactNumber">Contact Number</label>
                <input 
                  type="text" 
                  id="contactNumber" 
                  v-model="contactNumber" 
                  placeholder="Enter your contact number"
                />
              </div>
              
              <div class="form-group">
                <label for="email">Email Address</label>
                <input 
                  type="email" 
                  id="email" 
                  v-model="email" 
                  placeholder="Enter your email address"
                  disabled
                />
              </div>
              
              <div class="form-group">
                <label for="address">Complete Address</label>
                <textarea 
                  id="address" 
                  v-model="address" 
                  placeholder="Enter your complete address"
                  rows="3"
                ></textarea>
              </div>
            </div>
            
            <!-- Farm Details -->
            <div v-if="currentStep === 1 && isSeller" class="form-step">
              <h2>Farm Details</h2>
              <p class="step-description">Update information about your farm and what you grow</p>
              
              <div class="form-group">
                <label for="farmName">Farm Name</label>
                <input 
                  type="text" 
                  id="farmName" 
                  v-model="farmName" 
                  placeholder="Enter your farm name"
                />
              </div>
              
              <div class="form-group">
                <label for="farmAddress">Farm Address</label>
                <textarea 
                  id="farmAddress" 
                  v-model="farmAddress" 
                  placeholder="Enter your farm address"
                  rows="3"
                ></textarea>
              </div>
              
              <div class="form-group">
                <label for="farmType">Farm Type</label>
                <select id="farmType" v-model="farmType">
                  <option value="" disabled>Select farm type</option>
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
                  v-model="products" 
                  placeholder="List the products you sell"
                  rows="3"
                ></textarea>
              </div>
              
              <div class="form-group">
                <label for="yearInFarming">Years in Farming</label>
                <input 
                  type="number" 
                  id="yearInFarming" 
                  v-model="yearInFarming" 
                  placeholder="Enter years of experience"
                  min="0"
                />
              </div>
              
              <div class="form-group">
                <label for="farmSize">Farm Size</label>
                <input 
                  type="text" 
                  id="farmSize" 
                  v-model="farmSize" 
                  placeholder="Enter farm size (e.g., 2 hectares)"
                />
              </div>
              
              <div class="form-group">
                <label for="certifications">Certifications</label>
                <textarea 
                  id="certifications" 
                  v-model="certifications" 
                  placeholder="Enter any certifications or licenses"
                  rows="2"
                ></textarea>
              </div>
            </div>
            
            <!-- Payment Information -->
            <div v-if="currentStep === 2 && isSeller" class="form-step">
              <h2>Payment Information</h2>
              <p class="step-description">Update how you would like to receive payments</p>
              
              <div class="form-group">
                <label for="paymentMethod">Payment Method</label>
                <select id="paymentMethod" v-model="paymentMethod">
                  <option value="" disabled>Select payment method</option>
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
                  v-model="accountName" 
                  placeholder="Enter account name"
                />
              </div>
              
              <div class="form-group">
                <label for="accountNumber">Account Number</label>
                <input 
                  type="tel" 
                  id="accountNumber" 
                  v-model="accountNumber" 
                  placeholder="09123456789 (11 digits only)"
                  maxlength="11"
                  pattern="[0-9]{11}"
                  @input="validateAccountNumber"
                />
                <span v-if="accountNumberError" class="error-message">{{ accountNumberError }}</span>
              </div>
            </div>
            
            <!-- Verification Documents -->
            <div v-if="currentStep === 3 && isSeller" class="form-step">
              <h2>Verification Documents</h2>
              <p class="step-description">Upload your verification documents (optional - you can add these later)</p>
              
              <!-- Valid ID -->
              <div class="form-group">
                <label for="validID">Valid ID</label>
                <div class="document-upload-container">
                  <div class="upload-options">
                    <button 
                      type="button" 
                      class="upload-option-btn"
                      @click="triggerFileInput('validID')"
                    >
                      <Upload :size="16" />
                      Upload File
                    </button>
                  </div>
                  
                  <!-- File preview -->
                  <div v-if="formData.verificationDocs.validID" class="file-preview">
                    <img 
                      v-if="isImageFile(formData.verificationDocs.validID)" 
                      :src="getFilePreview('validID')" 
                      alt="Valid ID preview" 
                      class="document-preview-image"
                    />
                    <div v-else class="document-file-info">
                      <FileText :size="20" />
                      <span>{{ formData.verificationDocs.validID.name }}</span>
                    </div>
                    <button 
                      type="button" 
                      class="remove-file-btn"
                      @click="removeDocument('validID')"
                    >
                      <X :size="14" />
                    </button>
                  </div>
                  
                  <input 
                    type="file" 
                    id="validIDInput" 
                    @change="handleFileUploadForDoc($event, 'validID')" 
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                    style="display: none"
                  />
                  
                  <p class="file-help">Accepted formats: Images (JPG, PNG), Documents (PDF, DOC, DOCX) - max 5MB</p>
                </div>
              </div>

              <!-- Business Permit -->
              <div class="form-group">
                <label for="businessPermit">Business Permit</label>
                <div class="document-upload-container">
                  <div class="upload-options">
                    <button 
                      type="button" 
                      class="upload-option-btn"
                      @click="triggerFileInput('businessPermit')"
                    >
                      <Upload :size="16" />
                      Upload File
                    </button>
                  </div>
                  
                  <!-- File preview -->
                  <div v-if="formData.verificationDocs.businessPermit" class="file-preview">
                    <img 
                      v-if="isImageFile(formData.verificationDocs.businessPermit)" 
                      :src="getFilePreview('businessPermit')" 
                      alt="Business Permit preview" 
                      class="document-preview-image"
                    />
                    <div v-else class="document-file-info">
                      <FileText :size="20" />
                      <span>{{ formData.verificationDocs.businessPermit.name }}</span>
                    </div>
                    <button 
                      type="button" 
                      class="remove-file-btn"
                      @click="removeDocument('businessPermit')"
                    >
                      <X :size="14" />
                    </button>
                  </div>
                  
                  <input 
                    type="file" 
                    id="businessPermitInput" 
                    @change="handleFileUploadForDoc($event, 'businessPermit')" 
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                    style="display: none"
                  />
                  
                  <p class="file-help">Accepted formats: Images (JPG, PNG), Documents (PDF, DOC, DOCX) - max 5MB</p>
                </div>
              </div>

              <!-- Farm Certification -->
              <div class="form-group">
                <label for="farmCert">Farm Certification</label>
                <div class="document-upload-container">
                  <div class="upload-options">
                    <button 
                      type="button" 
                      class="upload-option-btn"
                      @click="triggerFileInput('farmCert')"
                    >
                      <Upload :size="16" />
                      Upload File
                    </button>
                  </div>
                  
                  <!-- File preview -->
                  <div v-if="formData.verificationDocs.farmCert" class="file-preview">
                    <img 
                      v-if="isImageFile(formData.verificationDocs.farmCert)" 
                      :src="getFilePreview('farmCert')" 
                      alt="Farm Certification preview" 
                      class="document-preview-image"
                    />
                    <div v-else class="document-file-info">
                      <FileText :size="20" />
                      <span>{{ formData.verificationDocs.farmCert.name }}</span>
                    </div>
                    <button 
                      type="button" 
                      class="remove-file-btn"
                      @click="removeDocument('farmCert')"
                    >
                      <X :size="14" />
                    </button>
                  </div>
                  
                  <input 
                    type="file" 
                    id="farmCertInput" 
                    @change="handleFileUploadForDoc($event, 'farmCert')" 
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                    style="display: none"
                  />
                  
                  <p class="file-help">Accepted formats: Images (JPG, PNG), Documents (PDF, DOC, DOCX) - max 5MB</p>
                </div>
              </div>
            </div>
            
            <!-- Delivery Information -->
            <div v-if="currentStep === 4 && isSeller" class="form-step">
              <h2>Delivery Information</h2>
              <p class="step-description">Update how you plan to deliver your products</p>
              
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
            <div v-if="currentStep === 5 && isSeller" class="form-step">
              <h2>Additional Details</h2>
              <p class="step-description">Additional information about your business</p>
              
              <div class="form-group">
                <label for="socialMedia">Social Media Links</label>
                <textarea 
                  id="socialMedia" 
                  v-model="socialMedia" 
                  placeholder="Enter your social media links (Facebook, Instagram, etc.)"
                  rows="3"
                ></textarea>
              </div>
              
              <div class="form-group">
                <label for="preferredCommunication">Preferred Communication</label>
                <input 
                  type="text" 
                  id="preferredCommunication" 
                  v-model="preferredCommunication" 
                  placeholder="Enter preferred contact method"
                />
              </div>
              
              <div class="form-group checkbox-group">
                <input 
                  type="checkbox" 
                  id="wholesaleAvailability" 
                  v-model="wholesaleAvailability"
                />
                <label for="wholesaleAvailability">Available for wholesale orders</label>
              </div>
            </div>
            
            <!-- Change Password -->
            <div v-if="currentStep === (isSeller ? 6 : 1)" class="form-step">
              <h2>Change Password</h2>
              <p class="step-description">Update your account password</p>
              
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
          </div>
          
          <!-- Navigation Buttons -->
          <div class="form-navigation">
            <button 
              v-if="currentStep > 0" 
              class="prev-button" 
              @click="prevStep"
              type="button"
            >
              <ChevronLeft size="18" />
              Previous
            </button>
            
            <button 
              v-if="currentStep < maxSteps - 1" 
              class="next-button" 
              @click="nextStep"
              type="button"
            >
              Next
              <ChevronRight size="18" />
            </button>
            
            <button 
              v-if="currentStep === maxSteps - 1" 
              class="submit-button" 
              @click="updateProfile"
              :disabled="isLoading"
            >
              {{ isLoading ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  Camera, 
  Eye, 
  EyeOff,
  User,
  Loader,
  AlertCircle,
  Upload,
  FileText,
  X
} from 'lucide-vue-next';
import { ref, computed, onMounted } from 'vue';
import { auth, db, storage } from '@/firebase/firebaseConfig';
import { updateDoc, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

export default {
  components: {
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Camera,
    Eye,
    EyeOff,
    User,
    Loader,
    AlertCircle,
    Upload,
    FileText,
    X
  },
  setup() {
    // Form data structure matching RegisterSeller.vue
    const formData = ref({
      personalInfo: {
        firstName: "",
        lastName: "",
        contact: "",
        email: "",
        address: "",
        photoUrl: ""
      },
      farmDetails: {
        farmName: "",
        farmAddress: "",
        farmType: "",
        products: "",
        yearInFarming: ""
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
      },
      password: {
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }
    });

    // Document metadata to track storage type
    const documentMetadata = ref({
      businessPermit: { type: null, isBase64: false },
      farmCert: { type: null, isBase64: false },
      validID: { type: null, isBase64: false }
    });

    // Upload status for documents
    const uploadStatus = ref({
      validID: { progress: 0, error: null, uploading: false, url: null },
      businessPermit: { progress: 0, error: null, uploading: false, url: null },
      farmCert: { progress: 0, error: null, uploading: false, url: null }
    });

    // File preview URLs for images
    const filePreviews = ref({
      validID: null,
      businessPermit: null,
      farmCert: null
    });

    // Dropdown management
    const isDeliveryDropdownOpen = ref(false);
    const isMunicipalityDropdownOpen = ref(false);
    
    // Municipalities of Oriental Mindoro
    const municipalities = ref([
      "Baco", "Bansud", "Bongabong", "Bulalacao", "Calapan City",
      "Gloria", "Mansalay", "Naujan", "Pinamalayan", "Pola",
      "Puerto Galera", "Roxas", "San Teodoro", "Socorro", "Victoria"
    ]);
    
    // Delivery methods
    const deliveryMethods = ref([
      { label: "Own Delivery", value: "own_delivery" },
      { label: "Pickup Only", value: "pickup_only" }
    ]);

    // Account number validation
    const accountNumberError = ref('');

    // Camera state for document capture
    const cameraState = ref({
      isOpen: false,
      documentType: null,
      mediaStream: null
    });

    // Legacy individual field refs for backward compatibility
    const firstName = computed({
      get: () => formData.value.personalInfo.firstName,
      set: (val) => formData.value.personalInfo.firstName = val
    });
    
    const lastName = computed({
      get: () => formData.value.personalInfo.lastName,
      set: (val) => formData.value.personalInfo.lastName = val
    });
    
    const email = computed({
      get: () => formData.value.personalInfo.email,
      set: (val) => formData.value.personalInfo.email = val
    });
    
    const contactNumber = computed({
      get: () => formData.value.personalInfo.contact,
      set: (val) => formData.value.personalInfo.contact = val
    });
    
    const address = computed({
      get: () => formData.value.personalInfo.address,
      set: (val) => formData.value.personalInfo.address = val
    });
    
    const profileImageUrl = computed({
      get: () => formData.value.personalInfo.photoUrl,
      set: (val) => formData.value.personalInfo.photoUrl = val
    });

    // Multi-step navigation
    const currentStep = ref(0);
    const steps = ref([
      "Personal Info", 
      "Farm Details", 
      "Payment Info", 
      "Verification", 
      "Delivery Info", 
      "Additional Details", 
      "Password"
    ]);
    
    // For non-sellers, only show Personal Info and Password
    const customerSteps = ref([
      "Personal Info", 
      "Password"
    ]);

    // Computed properties for areas covered management
    const areasCoveredList = computed({
      get: () => {
        if (Array.isArray(formData.value.deliveryInfo.areasCovered)) {
          return formData.value.deliveryInfo.areasCovered.length > 0 
            ? formData.value.deliveryInfo.areasCovered 
            : [""];
        }
        return [""];
      },
      set: (val) => {
        formData.value.deliveryInfo.areasCovered = val.filter(area => area.trim() !== "");
      }
    });

    // Computed properties for selected delivery methods and municipalities
    const selectedDeliveryMethods = computed(() => {
      return formData.value.deliveryInfo.deliveryMethods || [];
    });

    const selectedMunicipalities = computed(() => {
      return formData.value.deliveryInfo.areasCovered || [];
    });

    // Password fields computed properties
    const currentPassword = computed({
      get: () => formData.value.password.currentPassword,
      set: (val) => formData.value.password.currentPassword = val
    });

    const newPassword = computed({
      get: () => formData.value.password.newPassword,
      set: (val) => formData.value.password.newPassword = val
    });

    const confirmPassword = computed({
      get: () => formData.value.password.confirmPassword,
      set: (val) => formData.value.password.confirmPassword = val
    });

    // UI state
    const fileInput = ref(null);
    const alertMessage = ref("");
    const alertType = ref("");
    const showCurrentPassword = ref(false);
    const showNewPassword = ref(false);
    const showConfirmPassword = ref(false);
    const experience = ref("");
    
    // Form processing state
    const isSubmitting = ref(false);
    const uploadInProgress = ref(false);
    const savingToDatabase = ref(false);
    const passwordMismatch = ref(false);
    const isLoading = ref(false);
    const loading = ref(true);
    const error = ref(null);
    
    // Store seller document ID if found
    const sellerDocId = ref(null);
    const userRole = ref('customer');
    
    const isSeller = computed(() => {
      return userRole.value === 'seller' || sellerDocId.value !== null;
    });
    
    const maxSteps = computed(() => {
      return isSeller.value ? steps.value.length : customerSteps.value.length;
    });
    
    const progressWidth = computed(() => {
      return ((currentStep.value + 1) / maxSteps.value) * 100;
    });
    
    const currentStepList = computed(() => {
      return isSeller.value ? steps.value : customerSteps.value;
    });

    // Multi-step navigation methods
    const nextStep = () => {
      if (currentStep.value < maxSteps.value - 1) {
        currentStep.value++;
      }
    };
    
    const prevStep = () => {
      if (currentStep.value > 0) {
        currentStep.value--;
      }
    };
    
    const goToStep = (index) => {
      if (index >= 0 && index < maxSteps.value) {
        currentStep.value = index;
      }
    };
    
    // Areas covered management
    const addArea = () => {
      const currentAreas = [...areasCoveredList.value];
      currentAreas.push("");
      areasCoveredList.value = currentAreas;
    };
    
    const removeArea = (index) => {
      const currentAreas = [...areasCoveredList.value];
      if (currentAreas.length > 1) {
        currentAreas.splice(index, 1);
        areasCoveredList.value = currentAreas;
      }
    };

    // Dropdown management methods
    const toggleDeliveryDropdown = () => {
      isDeliveryDropdownOpen.value = !isDeliveryDropdownOpen.value;
      if (isDeliveryDropdownOpen.value) {
        isMunicipalityDropdownOpen.value = false;
      }
    };

    const toggleMunicipalityDropdown = () => {
      isMunicipalityDropdownOpen.value = !isMunicipalityDropdownOpen.value;
      if (isMunicipalityDropdownOpen.value) {
        isDeliveryDropdownOpen.value = false;
      }
    };

    // Account number validation
    const validateAccountNumber = () => {
      const accountNumber = formData.value.paymentInfo.accountNumber;
      
      // Remove any non-digit characters
      const cleanNumber = accountNumber.replace(/\D/g, '');
      formData.value.paymentInfo.accountNumber = cleanNumber;
      
      // Validate length
      if (cleanNumber.length === 0) {
        accountNumberError.value = '';
      } else if (cleanNumber.length < 11) {
        accountNumberError.value = 'Account number must be exactly 11 digits';
      } else if (cleanNumber.length === 11) {
        accountNumberError.value = '';
      } else {
        // Trim to 11 digits if longer
        formData.value.paymentInfo.accountNumber = cleanNumber.slice(0, 11);
        accountNumberError.value = '';
      }
    };

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
        
        // Try to get seller data directly using sellerId (document ID)
        const potentialSellerId = user.uid;
        console.log("Attempting to fetch seller data for ID:", potentialSellerId);
        
        try {
          const sellerDocRef = doc(db, "sellers", potentialSellerId);
          const sellerSnap = await getDoc(sellerDocRef);
          
          if (sellerSnap.exists()) {
            sellerDocId.value = sellerSnap.id;
            const sellerData = sellerSnap.data();
            
            console.log("Seller data loaded directly by document ID:", sellerData);
            populateSellerFields(sellerData);
            overrideUserDataWithSellerData(sellerData);
            userRole.value = 'seller';
          } else {
            await fetchSellerDataByQuery(user);
          }
        } catch (error) {
          console.log("Direct seller fetch failed, trying query method:", error);
          await fetchSellerDataByQuery(user);
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

        const storageReference = storageRef(storage, `profile-pictures/${user.uid}/${file.name}`);
        await uploadBytes(storageReference, file);

        const downloadURL = await getDownloadURL(storageReference);

        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          profileImageUrl: downloadURL,
        });

        profileImageUrl.value = downloadURL;
        showAlert("Profile picture updated successfully!", "success");
      } catch (error) {
        console.error("Error uploading profile picture:", error);
        showAlert("Failed to upload profile picture.", "error");
      }
    };

    // Document upload methods
    const triggerFileInput = (docType) => {
      const inputRef = document.getElementById(`${docType}Input`);
      if (inputRef) {
        inputRef.click();
      }
    };

    const handleFileUploadForDoc = (event, docType) => {
      const file = event.target.files[0];
      if (!file) return;

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        showAlert('File too large. Maximum size is 5MB.', 'error');
        return;
      }

      // Store the file
      formData.value.verificationDocs[docType] = file;
      
      // Create preview for images
      if (isImageFile(file)) {
        createFilePreview(file, docType);
      }

      showAlert(`${docType} uploaded successfully!`, 'success');
    };

    const isImageFile = (file) => {
      if (!file || !file.type) return false;
      return file.type.startsWith('image/');
    };

    const createFilePreview = (file, key) => {
      if (!isImageFile(file)) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        filePreviews.value[key] = e.target.result;
      };
      reader.readAsDataURL(file);
    };

    const getFilePreview = (key) => {
      return filePreviews.value[key];
    };

    const removeDocument = (key) => {
      formData.value.verificationDocs[key] = null;
      filePreviews.value[key] = null;
      uploadStatus.value[key] = {
        progress: 0,
        error: null,
        uploading: false,
        url: null
      };
      
      // Clear file input
      const inputRef = document.getElementById(`${key}Input`);
      if (inputRef) {
        inputRef.value = '';
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
        
        // Password validation
        if (formData.value.password.newPassword || formData.value.password.confirmPassword) {
          if (formData.value.password.newPassword !== formData.value.password.confirmPassword) {
            passwordMismatch.value = true;
            showAlert("Passwords do not match.", "error");
            return;
          } else {
            passwordMismatch.value = false;
          }
          
          showAlert("Password change not implemented in this demo.", "error");
        }
        
        // Update user data in users collection
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          firstName: formData.value.personalInfo.firstName,
          lastName: formData.value.personalInfo.lastName,
          contactNumber: formData.value.personalInfo.contact,
          address: formData.value.personalInfo.address,
        });
        
        console.log("User data updated successfully");
        
        // If seller data exists, update it in sellers collection using nested structure
        if (isSeller.value) {
          const sellerUpdateData = {
            // Personal info (nested)
            personalInfo: {
              firstName: formData.value.personalInfo.firstName,
              lastName: formData.value.personalInfo.lastName,
              contact: formData.value.personalInfo.contact,
              email: formData.value.personalInfo.email,
              address: formData.value.personalInfo.address,
              photoUrl: formData.value.personalInfo.photoUrl || ""
            },
            
            // Farm details (nested)
            farmDetails: {
              farmName: formData.value.farmDetails.farmName,
              farmAddress: formData.value.farmDetails.farmAddress,
              farmType: formData.value.farmDetails.farmType,
              products: formData.value.farmDetails.products,
              yearInFarming: formData.value.farmDetails.yearInFarming?.toString() || "0"
            },
            
            // Payment info (nested)
            paymentInfo: {
              paymentMethod: formData.value.paymentInfo.paymentMethod,
              accountName: formData.value.paymentInfo.accountName,
              accountNumber: formData.value.paymentInfo.accountNumber
            },
            
            // Delivery info (nested)
            deliveryInfo: {
              deliveryMethods: formData.value.deliveryInfo.deliveryMethods,
              areasCovered: formData.value.deliveryInfo.areasCovered
            },
            
            // Additional details (nested)
            additionalDetails: {
              socialMedia: formData.value.additionalDetails.socialMedia,
              wholesaleAvailability: formData.value.additionalDetails.wholesaleAvailability
            },
            
            // Terms agreement (nested)
            termsAgreement: {
              agreeTerms: formData.value.termsAgreement.agreeTerms,
              consentData: formData.value.termsAgreement.consentData
            },
            
            // Documents (nested) - maintain current document references
            documents: {
              validID: formData.value.verificationDocs.validID || "",
              businessPermit: formData.value.verificationDocs.businessPermit || "",
              farmCert: formData.value.verificationDocs.farmCert || ""
            },
            
            // Document metadata (nested)
            documentMetadata: documentMetadata.value,
            
            // Update timestamp
            updatedAt: new Date(),
            lastUpdated: new Date().toISOString()
          };
          
          if (sellerDocId.value) {
            console.log("Updating existing seller document:", sellerDocId.value);
            const sellerRef = doc(db, "sellers", sellerDocId.value);
            await updateDoc(sellerRef, sellerUpdateData);
          } else {
            console.log("Looking for seller document by email");
            const sellersRef = collection(db, "sellers");
            const q = query(sellersRef, where("email", "==", formData.value.personalInfo.email));
            const sellerSnap = await getDocs(q);
            
            if (!sellerSnap.empty) {
              const sellerDoc = sellerSnap.docs[0];
              sellerDocId.value = sellerDoc.id;
              console.log("Found seller document by email:", sellerDocId.value);
              
              const sellerRef = doc(db, "sellers", sellerDocId.value);
              await updateDoc(sellerRef, sellerUpdateData);
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

    // Helper function to populate seller fields from seller data
    const populateSellerFields = (sellerData) => {
      console.log("Populating seller fields with data:", sellerData);
      
      // Handle nested structure from RegisterSeller.vue
      if (sellerData.personalInfo) {
        formData.value.personalInfo.firstName = sellerData.personalInfo.firstName || "";
        formData.value.personalInfo.lastName = sellerData.personalInfo.lastName || "";
        formData.value.personalInfo.contact = sellerData.personalInfo.contact || "";
        formData.value.personalInfo.email = sellerData.personalInfo.email || "";
        formData.value.personalInfo.address = sellerData.personalInfo.address || "";
        formData.value.personalInfo.photoUrl = sellerData.personalInfo.photoUrl || "";
      }
      
      if (sellerData.farmDetails) {
        formData.value.farmDetails.farmName = sellerData.farmDetails.farmName || "";
        formData.value.farmDetails.farmAddress = sellerData.farmDetails.farmAddress || "";
        formData.value.farmDetails.farmType = sellerData.farmDetails.farmType || "";
        formData.value.farmDetails.products = sellerData.farmDetails.products || "";
        formData.value.farmDetails.yearInFarming = sellerData.farmDetails.yearInFarming || "";
      }
      
      if (sellerData.paymentInfo) {
        formData.value.paymentInfo.paymentMethod = sellerData.paymentInfo.paymentMethod || "";
        formData.value.paymentInfo.accountName = sellerData.paymentInfo.accountName || "";
        formData.value.paymentInfo.accountNumber = sellerData.paymentInfo.accountNumber || "";
      }
      
      if (sellerData.deliveryInfo) {
        formData.value.deliveryInfo.deliveryMethods = sellerData.deliveryInfo.deliveryMethods || [];
        formData.value.deliveryInfo.areasCovered = sellerData.deliveryInfo.areasCovered || [];
      }
      
      if (sellerData.additionalDetails) {
        formData.value.additionalDetails.socialMedia = sellerData.additionalDetails.socialMedia || "";
        formData.value.additionalDetails.wholesaleAvailability = sellerData.additionalDetails.wholesaleAvailability || false;
      }
      
      if (sellerData.termsAgreement) {
        formData.value.termsAgreement.agreeTerms = sellerData.termsAgreement.agreeTerms || false;
        formData.value.termsAgreement.consentData = sellerData.termsAgreement.consentData || false;
      }
      
      // Handle documents
      if (sellerData.documents) {
        // Store document URLs/data in verification docs
        formData.value.verificationDocs.validID = sellerData.documents.validID || null;
        formData.value.verificationDocs.businessPermit = sellerData.documents.businessPermit || null;
        formData.value.verificationDocs.farmCert = sellerData.documents.farmCert || null;
        
        // Set up file previews for images
        if (sellerData.documents.validID) {
          filePreviews.value.validID = sellerData.documents.validID;
        }
        if (sellerData.documents.businessPermit) {
          filePreviews.value.businessPermit = sellerData.documents.businessPermit;
        }
        if (sellerData.documents.farmCert) {
          filePreviews.value.farmCert = sellerData.documents.farmCert;
        }
      }
      
      // Handle document metadata
      if (sellerData.documentMetadata) {
        documentMetadata.value = sellerData.documentMetadata;
      }
      
      // Handle flat structure for backward compatibility
      if (!sellerData.personalInfo) {
        formData.value.personalInfo.firstName = sellerData.firstName || "";
        formData.value.personalInfo.lastName = sellerData.lastName || "";
        formData.value.personalInfo.contact = sellerData.contact || "";
        formData.value.personalInfo.email = sellerData.email || "";
        formData.value.personalInfo.address = sellerData.address || "";
      }
      
      if (!sellerData.farmDetails) {
        formData.value.farmDetails.farmName = sellerData.farmName || "";
        formData.value.farmDetails.farmAddress = sellerData.farmAddress || "";
        formData.value.farmDetails.farmType = sellerData.farmType || "";
        formData.value.farmDetails.products = sellerData.products || "";
        formData.value.farmDetails.yearInFarming = sellerData.yearInFarming || "";
      }
      
      if (!sellerData.paymentInfo) {
        formData.value.paymentInfo.paymentMethod = sellerData.paymentMethod || "";
        formData.value.paymentInfo.accountName = sellerData.accountName || "";
        formData.value.paymentInfo.accountNumber = sellerData.accountNumber || "";
      }
      
      if (!sellerData.deliveryInfo) {
        // Handle legacy areasCovered as string
        if (sellerData.areasCovered) {
          if (typeof sellerData.areasCovered === 'string') {
            formData.value.deliveryInfo.areasCovered = sellerData.areasCovered.split(", ").filter(area => area.trim() !== "");
          } else if (Array.isArray(sellerData.areasCovered)) {
            formData.value.deliveryInfo.areasCovered = sellerData.areasCovered;
          }
        }
        
        // Handle legacy deliveryMethod as string
        if (sellerData.deliveryMethod) {
          formData.value.deliveryInfo.deliveryMethods = [sellerData.deliveryMethod];
        }
      }
      
      if (!sellerData.additionalDetails) {
        formData.value.additionalDetails.socialMedia = sellerData.socialMedia || "";
        formData.value.additionalDetails.wholesaleAvailability = sellerData.wholesaleAvailability || false;
      }
      
      // Handle legacy documents as individual fields
      if (!sellerData.documents) {
        if (sellerData.businessPermit) {
          formData.value.verificationDocs.businessPermit = sellerData.businessPermit;
          filePreviews.value.businessPermit = sellerData.businessPermit;
        }
        if (sellerData.validID) {
          formData.value.verificationDocs.validID = sellerData.validID;
          filePreviews.value.validID = sellerData.validID;
        }
        if (sellerData.farmCert) {
          formData.value.verificationDocs.farmCert = sellerData.farmCert;
          filePreviews.value.farmCert = sellerData.farmCert;
        }
      }
      
      // Store additional fields for backward compatibility
      experience.value = sellerData.experience || "";
    };

    // Helper function to override user data with seller data if available
    const overrideUserDataWithSellerData = (sellerData) => {
      // Use nested structure first
      if (sellerData.personalInfo) {
        if (sellerData.personalInfo.firstName) formData.value.personalInfo.firstName = sellerData.personalInfo.firstName;
        if (sellerData.personalInfo.lastName) formData.value.personalInfo.lastName = sellerData.personalInfo.lastName;
        if (sellerData.personalInfo.contact) formData.value.personalInfo.contact = sellerData.personalInfo.contact;
        if (sellerData.personalInfo.address) formData.value.personalInfo.address = sellerData.personalInfo.address;
        if (sellerData.personalInfo.photoUrl) formData.value.personalInfo.photoUrl = sellerData.personalInfo.photoUrl;
      } else {
        // Fallback to flat structure
        if (sellerData.firstName) formData.value.personalInfo.firstName = sellerData.firstName;
        if (sellerData.lastName) formData.value.personalInfo.lastName = sellerData.lastName;
        if (sellerData.contact) formData.value.personalInfo.contact = sellerData.contact;
        if (sellerData.address) formData.value.personalInfo.address = sellerData.address;
        if (sellerData.profileImageUrl) formData.value.personalInfo.photoUrl = sellerData.profileImageUrl;
      }
    };

    // Fallback function to query seller data by userId or email
    const fetchSellerDataByQuery = async (user) => {
      console.log("Fetching seller data by query for user:", user.uid);
      
      const sellersRef = collection(db, "sellers");
      const q = query(sellersRef, where("userId", "==", user.uid));
      const sellerSnap = await getDocs(q);
      
      if (!sellerSnap.empty) {
        const sellerDoc = sellerSnap.docs[0];
        sellerDocId.value = sellerDoc.id;
        const sellerData = sellerDoc.data();
        
        console.log("Seller data loaded by userId query:", sellerData);
        
        populateSellerFields(sellerData);
        overrideUserDataWithSellerData(sellerData);
        userRole.value = 'seller';
      } else {
        const emailQuery = query(sellersRef, where("email", "==", email.value));
        const emailSellerSnap = await getDocs(emailQuery);
        
        if (!emailSellerSnap.empty) {
          const sellerDoc = emailSellerSnap.docs[0];
          sellerDocId.value = sellerDoc.id;
          const sellerData = sellerDoc.data();
          
          console.log("Seller data loaded by email query:", sellerData);
          
          populateSellerFields(sellerData);
          overrideUserDataWithSellerData(sellerData);
          userRole.value = 'seller';
        } else {
          console.log("No seller data found for user:", user.uid);
        }
      }
    };

    onMounted(fetchSellerData);

    return {
      // Form data structure
      formData,
      documentMetadata,
      uploadStatus,
      filePreviews,
      
      // Multi-step navigation
      currentStep,
      steps,
      customerSteps,
      maxSteps,
      progressWidth,
      currentStepList,
      nextStep,
      prevStep,
      goToStep,
      
      // User data (computed from formData)
      firstName,
      lastName,
      email,
      contactNumber,
      address,
      profileImageUrl,
      
      // Areas covered management
      areasCoveredList,
      addArea,
      removeArea,
      
      // Dropdown management
      isDeliveryDropdownOpen,
      isMunicipalityDropdownOpen,
      toggleDeliveryDropdown,
      toggleMunicipalityDropdown,
      
      // Data lists
      municipalities,
      deliveryMethods,
      selectedDeliveryMethods,
      selectedMunicipalities,
      
      // Password fields
      currentPassword,
      newPassword,
      confirmPassword,
      
      // Validation
      validateAccountNumber,
      accountNumberError,
      
      // UI state
      fileInput,
      alertMessage,
      alertType,
      showCurrentPassword,
      showNewPassword,
      showConfirmPassword,
      passwordMismatch,
      isLoading,
      loading,
      error,
      isSeller,
      userRole,
      sellerDocId,
      
      // Processing state
      isSubmitting,
      uploadInProgress,
      savingToDatabase,
      
      // Additional fields
      experience,
      
      // Methods
      openFileInput,
      handleFileUpload,
      updateProfile,
      fetchSellerData,
      
      // Document upload methods
      triggerFileInput,
      handleFileUploadForDoc,
      isImageFile,
      getFilePreview,
      removeDocument
    };
  }
}
</script>

<style scoped>
.edit-profile {
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
  background: none;
  border: none;
  cursor: pointer;
  margin-right: 10px;
}

.header h1 {
  font-size: 18px;
  font-weight: 600;
}

.profile-content {
  flex: 1;
  overflow-y: auto;
  background-color: #f5f5f5;
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

.content {
  flex: 1;
  padding: 20px 15px;
  overflow-y: auto;
}

/* Progress Bar Styles */
.progress-container {
  margin-bottom: 25px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 20px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #2e5c31 0%, #4a8a4e 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.step-indicators {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 80px;
}

.step-indicator.active .step-number {
  background-color: #2e5c31;
  color: white;
}

.step-indicator.current .step-number {
  background-color: #4a8a4e;
  color: white;
  transform: scale(1.1);
}

.step-number {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background-color: #e0e0e0;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  margin-bottom: 5px;
}

.step-name {
  font-size: 12px;
  color: #666;
  text-align: center;
  font-weight: 500;
}

.step-indicator.active .step-name {
  color: #2e5c31;
  font-weight: 600;
}

/* Form Styles */
.form-container {
  background-color: white;
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.form-step h2 {
  color: #2e5c31;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 10px;
}

.step-description {
  color: #666;
  margin-bottom: 25px;
  line-height: 1.5;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 5px;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #2e5c31;
  outline: none;
}

.form-group input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkbox-group input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.checkbox-group label {
  margin: 0;
  cursor: pointer;
  font-weight: normal;
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
  padding: 5px;
}

.error-message {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 5px;
}

/* Areas Covered Styles */
.areas-covered-container {
  margin-bottom: 15px;
}

.area-input-group {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.area-input {
  flex: 1;
}

.remove-area-button {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #e74c3c;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
}

.add-area-button {
  background-color: #2e5c31;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.add-area-button:hover {
  background-color: #26492a;
}

/* Navigation Buttons */
.form-navigation {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  margin-top: 20px;
}

.prev-button,
.next-button,
.submit-button {
  padding: 12px 25px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.prev-button {
  background-color: #f1f1f1;
  color: #666;
}

.next-button,
.submit-button {
  background-color: #2e5c31;
  color: white;
  margin-left: auto;
}

.prev-button:hover {
  background-color: #e5e5e5;
}

.next-button:hover,
.submit-button:hover {
  background-color: #26492a;
}

.submit-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Document Upload Styles */
.document-upload-container {
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  transition: border-color 0.3s ease;
}

.document-upload-container:hover {
  border-color: #2e5c31;
}

.upload-options {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 15px;
}

.upload-option-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background-color: #2e5c31;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.upload-option-btn:hover {
  background-color: #26492a;
}

.file-preview {
  position: relative;
  margin-top: 15px;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background-color: #f9f9f9;
}

.document-preview-image {
  max-width: 200px;
  max-height: 150px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.document-file-info {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  color: #666;
}

.remove-file-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #e74c3c;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.file-help {
  font-size: 12px;
  color: #666;
  margin-top: 10px;
  margin-bottom: 0;
}

/* Dropdown Checkbox Styles */
.dropdown-checkbox {
  position: relative;
  margin-bottom: 10px;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  background-color: white;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.dropdown-header:hover {
  border-color: #2e5c31;
}

.dropdown-header .lucide-chevron-down {
  transition: transform 0.3s ease;
}

.dropdown-header .lucide-chevron-down.rotate-180 {
  transform: rotate(180deg);
}

.dropdown-content {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: white;
  border: 2px solid #e0e0e0;
  border-top: none;
  border-radius: 0 0 8px 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.dropdown-content .checkbox-group {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #f0f0f0;
  gap: 10px;
}

.dropdown-content .checkbox-group:last-child {
  border-bottom: none;
}

.dropdown-content .checkbox-group:hover {
  background-color: #f8f9fa;
}

.dropdown-content .checkbox-group input[type="checkbox"] {
  width: 16px;
  height: 16px;
  margin: 0;
  cursor: pointer;
}

.dropdown-content .checkbox-group label {
  margin: 0;
  font-weight: normal;
  cursor: pointer;
  flex: 1;
  font-size: 14px;
}

.alert-box {
  padding: 12px 15px;
  margin: 15px;
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
  .step-indicators {
    gap: 5px;
  }
  
  .step-indicator {
    min-width: 60px;
  }
  
  .step-number {
    width: 30px;
    height: 30px;
    font-size: 12px;
  }
  
  .step-name {
    font-size: 10px;
  }
  
  .form-navigation {
    flex-direction: column;
  }
  
  .next-button,
  .submit-button {
    margin-left: 0;
  }
  
  .dropdown-content {
    max-height: 150px;
  }
}
</style>
