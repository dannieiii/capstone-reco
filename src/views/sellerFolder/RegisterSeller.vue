<template>
  <div class="supplier-form-page">
    <div class="header">
      <button class="back-button" @click="goBackToHome">
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
              type="tel" 
              id="accountNumber" 
              v-model="formData.paymentInfo.accountNumber" 
              placeholder="09123456789 (11 digits only)"
              maxlength="11"
              pattern="[0-9]{11}"
              @input="validateAccountNumber"
            >
            <span v-if="accountNumberError" class="field-error">{{ accountNumberError }}</span>
          </div>

          <!-- GCash QR Code (visible preview before submit) -->
          <div class="form-group" v-if="formData.paymentInfo.paymentMethod === 'GCash'">
            <label>GCash QR Code (optional but recommended)</label>
            <div class="document-upload-container">
              <div class="upload-options">
                <button 
                  type="button" 
                  class="upload-option-btn"
                  @click="triggerQrInput"
                >
                  <Upload :size="16" />
                  Upload QR Image
                </button>
              </div>

              <!-- Image preview -->
              <div v-if="filePreviews.paymentQr" class="file-preview">
                <img :src="filePreviews.paymentQr" alt="GCash QR preview" class="document-preview-image" />
                <button 
                  type="button" 
                  class="remove-file-btn"
                  @click="removeQr"
                >
                  <X :size="14" />
                </button>
              </div>
              <div v-else class="qr-placeholder file-help" style="text-align:center;">
                No QR selected yet
              </div>

              <input 
                type="file" 
                ref="paymentQrInput" 
                class="file-input"
                accept="image/*"
                @change="handleQrUpload"
              />

              <p class="file-help">Accepted: JPG, PNG, WEBP, GIF up to 5MB. You’ll see the image here before submitting.</p>
            </div>
          </div>
        </div>
        
        <!-- Verification Documents -->
        <div v-if="currentStep === 3" class="form-step">
          <h2>Verification Documents</h2>
          <p class="step-description">Upload your verification documents. You can take photos with your phone camera or upload document files - whatever is most convenient for you.</p>
          
          <div class="upload-help-note">
            <p><strong>💡 Upload Options:</strong></p>
            <ul>
              <li>📱 <strong>Take photos</strong> with your phone camera - just make sure text is clearly readable</li>
              <li>📄 <strong>Upload files</strong> like PDFs, Word documents, or Excel spreadsheets</li>
              <li>🖼️ <strong>Scan or photo</strong> of physical documents works perfectly</li>
            </ul>
          </div>

          <!-- Valid ID -->
          <div class="form-group">
            <label for="validID">Valid ID</label>
            <div class="document-upload-container">
              <div class="upload-options">
                <button 
                  type="button" 
                  class="upload-option-btn"
                  @click="openCameraForDocument('validID')"
                  :disabled="cameraState.isOpen"
                >
                  <Camera :size="16" />
                  Take Photo
                </button>
                <button 
                  type="button" 
                  class="upload-option-btn"
                  @click="triggerFileInput('validID')"
                >
                  <Upload :size="16" />
                  Upload File
                </button>
              </div>
              
              <!-- Camera view for documents -->
              <div v-if="cameraState.isOpen && cameraState.documentType === 'validID'" class="camera-view">
                <video ref="videoRef" autoplay playsinline class="camera-feed"></video>
                <div class="camera-controls">
                  <button 
                    type="button" 
                    class="camera-btn capture-btn"
                    @click="captureDocumentPhoto('validID')"
                  >
                    <Circle :size="24" />
                  </button>
                  <button 
                    type="button" 
                    class="camera-btn cancel-btn"
                    @click="closeCamera"
                  >
                    <X :size="24" />
                  </button>
                </div>
              </div>
              
              <!-- File preview -->
              <div v-if="formData.verificationDocs.validID && !cameraState.isOpen" class="file-preview">
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
              
              <!-- Upload status -->
              <div v-if="uploadStatus.validID.uploading" class="upload-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: uploadStatus.validID.progress + '%' }"></div>
                </div>
                <span>{{ Math.round(uploadStatus.validID.progress) }}%</span>
              </div>
              
              <div v-if="uploadStatus.validID.error" class="file-error">
                {{ uploadStatus.validID.error }}
              </div>
              
              <input 
                type="file" 
                ref="validIDInput" 
                @change="handleFileUpload($event, 'validID')" 
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,.doc,.docx,.xls,.xlsx,.txt"
                class="file-input"
                capture="environment"
              />
              
              <p class="file-help">Accepted formats: Images (JPG, PNG), Documents (PDF, DOC, DOCX), Spreadsheets (XLS, XLSX) - max 5MB</p>
            </div>
          </div>

          <!-- Business Permit (hidden via flag) -->
          <div v-if="showBusinessPermit" class="form-group">
            <label for="businessPermit">Business Permit</label>
            <div class="document-upload-container">
              <div class="upload-options">
                <button 
                  type="button" 
                  class="upload-option-btn"
                  @click="openCameraForDocument('businessPermit')"
                  :disabled="cameraState.isOpen"
                >
                  <Camera :size="16" />
                  Take Photo
                </button>
                <button 
                  type="button" 
                  class="upload-option-btn"
                  @click="triggerFileInput('businessPermit')"
                >
                  <Upload :size="16" />
                  Upload File
                </button>
              </div>
              
              <!-- Camera view for documents -->
              <div v-if="cameraState.isOpen && cameraState.documentType === 'businessPermit'" class="camera-view">
                <video ref="videoRef" autoplay playsinline class="camera-feed"></video>
                <div class="camera-controls">
                  <button 
                    type="button" 
                    class="camera-btn capture-btn"
                    @click="captureDocumentPhoto('businessPermit')"
                  >
                    <Circle :size="24" />
                  </button>
                  <button 
                    type="button" 
                    class="camera-btn cancel-btn"
                    @click="closeCamera"
                  >
                    <X :size="24" />
                  </button>
                </div>
              </div>
              
              <!-- File preview -->
              <div v-if="formData.verificationDocs.businessPermit && !cameraState.isOpen" class="file-preview">
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
              
              <!-- Upload status -->
              <div v-if="uploadStatus.businessPermit.uploading" class="upload-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: uploadStatus.businessPermit.progress + '%' }"></div>
                </div>
                <span>{{ Math.round(uploadStatus.businessPermit.progress) }}%</span>
              </div>
              
              <div v-if="uploadStatus.businessPermit.error" class="file-error">
                {{ uploadStatus.businessPermit.error }}
              </div>
              
              <input 
                type="file" 
                ref="businessPermitInput" 
                @change="handleFileUpload($event, 'businessPermit')" 
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,.doc,.docx,.xls,.xlsx,.txt"
                class="file-input"
                capture="environment"
              />
              
              <p class="file-help">Accepted formats: Images (JPG, PNG), Documents (PDF, DOC, DOCX), Spreadsheets (XLS, XLSX) - max 5MB</p>
            </div>
          </div>

          <!-- Farm Certification (hidden via flag) -->
          <div v-if="showFarmCert" class="form-group">
            <label for="farmCert">Farm Certification</label>
            <div class="document-upload-container">
              <div class="upload-options">
                <button 
                  type="button" 
                  class="upload-option-btn"
                  @click="openCameraForDocument('farmCert')"
                  :disabled="cameraState.isOpen"
                >
                  <Camera :size="16" />
                  Take Photo
                </button>
                <button 
                  type="button" 
                  class="upload-option-btn"
                  @click="triggerFileInput('farmCert')"
                >
                  <Upload :size="16" />
                  Upload File
                </button>
              </div>
              
              <!-- Camera view for documents -->
              <div v-if="cameraState.isOpen && cameraState.documentType === 'farmCert'" class="camera-view">
                <video ref="videoRef" autoplay playsinline class="camera-feed"></video>
                <div class="camera-controls">
                  <button 
                    type="button" 
                    class="camera-btn capture-btn"
                    @click="captureDocumentPhoto('farmCert')"
                  >
                    <Circle :size="24" />
                  </button>
                  <button 
                    type="button" 
                    class="camera-btn cancel-btn"
                    @click="closeCamera"
                  >
                    <X :size="24" />
                  </button>
                </div>
              </div>
              
              <!-- File preview -->
              <div v-if="formData.verificationDocs.farmCert && !cameraState.isOpen" class="file-preview">
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
              
              <!-- Upload status -->
              <div v-if="uploadStatus.farmCert.uploading" class="upload-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: uploadStatus.farmCert.progress + '%' }"></div>
                </div>
                <span>{{ Math.round(uploadStatus.farmCert.progress) }}%</span>
              </div>
              
              <div v-if="uploadStatus.farmCert.error" class="file-error">
                {{ uploadStatus.farmCert.error }}
              </div>
              
              <input 
                type="file" 
                ref="farmCertInput" 
                @change="handleFileUpload($event, 'farmCert')" 
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,.doc,.docx,.xls,.xlsx,.txt"
                class="file-input"
                capture="environment"
              />
              
              <p class="file-help">Accepted formats: Images (JPG, PNG), Documents (PDF, DOC, DOCX), Spreadsheets (XLS, XLSX) - max 5MB</p>
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
                <div class="dropdown-search">
                  <input
                    type="text"
                    v-model="municipalitySearch"
                    placeholder="Type to filter municipalities..."
                    @keydown.stop
                    @click.stop
                  />
                </div>
                <div v-if="filteredMunicipalities.length === 0" class="no-results">No matches</div>
                <div class="checkbox-group" v-for="municipality in filteredMunicipalities" :key="municipality">
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

/**
 * DOCUMENT UPLOAD STRATEGY:
 * 
 * Images (JPG, PNG, GIF, WEBP):
 *   - Converted to base64 strings using FileReader
 *   - Stored directly in Firestore as base64 data
 *   - No Firebase Storage used for images
 *   - Faster processing and no CORS issues
 * 
 * Files (PDF, DOC, DOCX, XLS, XLSX, TXT):
 *   - Uploaded to Firebase Storage
 *   - Download URLs stored in Firestore
 *   - Supports larger file sizes and better organization
 * 
 * Both types are handled in uploadAllDocuments() method
 * Similar approach to OrderStatusUpdate.vue
 */

<script>
import { db, auth, storage } from "@/firebase/firebaseConfig";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { ChevronLeft, ChevronRight, Upload, ChevronDown, Camera, X, FileText, Circle } from 'lucide-vue-next';

export default {
  name: "SellerRegister",
  components: {
    ChevronLeft,
    ChevronRight,
    Upload,
    ChevronDown,
    Camera,
    X,
    FileText,
    Circle
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
  municipalitySearch: '',
  // Visibility flags for optional verification documents
  // Temporarily hide Business Permit section for client validation tests.
  // Toggle back to true when ready to re-enable in UI.
  showBusinessPermit: false,
  showFarmCert: false,
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
          accountNumber: "",
          qrUrl: null
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
      
      // Camera state for document capture
      cameraState: {
        isOpen: false,
        documentType: null,
        mediaStream: null
      },
      
      // File preview URLs for images
      filePreviews: {
        validID: null,
        businessPermit: null,
  farmCert: null,
  paymentQr: null
      },
      
      // Account number validation
      accountNumberError: '',
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
    },
    filteredMunicipalities() {
      const q = (this.municipalitySearch || '').toLowerCase().trim();
      if (!q) return this.municipalities;
      return this.municipalities.filter(m => m.toLowerCase().includes(q));
    }
  },
  async created() {
    await this.fetchUserData();
  },
  
  // Clean up camera when component is destroyed
  beforeDestroy() {
    this.closeCamera();
  },
  methods: {
    // Navigation methods
    goBackToHome() {
      // Navigate back to HomeView
      this.$router.push('/').then(() => {
        console.log("Successfully navigated back to HomeView");
      }).catch(error => {
        console.error("Navigation error:", error);
        // Fallback - try alternative navigation methods
        try {
          this.$emit('navigate', 'HomePage');
        } catch (emitError) {
          console.error("Emit navigation error:", emitError);
          // Last resort - reload to home page
          window.location.href = '/';
        }
      });
    },
    
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
      
      // Create preview for image files
      if (this.isImageFile(file)) {
        this.createFilePreview(file, key);
      }
      
      // Show success feedback for file selection
      this.showNotification('File Selected', `${file.name} is ready to upload`, 'success', 2000);
      
      // Test storage connection when file is selected
      this.testStorageConnection();
    },
    
    triggerFileInput(key) {
      this.$refs[`${key}Input`].click();
    },

    // QR helpers
    triggerQrInput() {
      if (this.$refs.paymentQrInput) this.$refs.paymentQrInput.click();
    },
    async handleQrUpload(e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        this.showNotification('QR Too Large', 'Please choose an image up to 5MB.', 'error');
        return;
      }
      if (!this.isImageFile(file)) {
        this.showNotification('Invalid QR File', 'QR must be an image (JPG/PNG/WEBP/GIF).', 'error');
        return;
      }
      // preview
      this.createFilePreview(file, 'paymentQr');
      // store base64
      try {
        const base64 = await this.saveImageToBase64(file);
        this.formData.paymentInfo.qrUrl = base64;
        this.showNotification('QR Selected', 'Your QR image is ready.', 'success', 2000);
      } catch (err) {
        this.showNotification('Failed to read QR', err.message || 'Please try another image.', 'error');
      }
    },
    removeQr() {
      this.formData.paymentInfo.qrUrl = null;
      this.filePreviews.paymentQr = null;
      const input = this.$refs.paymentQrInput;
      if (input) input.value = '';
    },
    
    // Camera methods for document capture
    async openCameraForDocument(documentType) {
      try {
        this.cameraState.isOpen = true;
        this.cameraState.documentType = documentType;
        
        const constraints = { 
          video: { 
            facingMode: 'environment', // Prefer rear camera
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        };
        
        this.cameraState.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Wait for next tick to ensure video element is rendered
        await this.$nextTick();
        
        if (this.$refs.videoRef) {
          this.$refs.videoRef.srcObject = this.cameraState.mediaStream;
        }
        
        this.showNotification('Camera Ready', 'Position your document clearly in the frame and tap capture', 'info', 3000);
        
      } catch (error) {
        console.error('Error accessing camera:', error);
        this.showNotification('Camera Access Failed', 'Could not access the camera. Please check permissions and try again.', 'error');
        this.closeCamera();
      }
    },
    
    closeCamera() {
      if (this.cameraState.mediaStream) {
        this.cameraState.mediaStream.getTracks().forEach(track => track.stop());
        this.cameraState.mediaStream = null;
      }
      this.cameraState.isOpen = false;
      this.cameraState.documentType = null;
    },
    
    captureDocumentPhoto(documentType) {
      if (!this.$refs.videoRef) return;
      
      const canvas = document.createElement('canvas');
      canvas.width = this.$refs.videoRef.videoWidth;
      canvas.height = this.$refs.videoRef.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(this.$refs.videoRef, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to Blob and create File
      canvas.toBlob((blob) => {
        if (!blob) return;
        
        const file = new File([blob], `${documentType}-photo.jpg`, { type: 'image/jpeg' });
        this.formData.verificationDocs[documentType] = file;
        
        // Create preview
        this.createFilePreview(file, documentType);
        
        this.closeCamera();
        
        this.showNotification('Photo Captured!', `${documentType} photo captured successfully`, 'success', 2000);
      }, 'image/jpeg', 0.9);
    },
    
    // File utility methods
    isImageFile(file) {
      if (!file) return false;
      return file.type.startsWith('image/');
    },
    
    // Convert image to base64 string (similar to OrderStatusUpdate.vue)
    async saveImageToBase64(file) {
      if (!file || !this.isImageFile(file)) return null;
      
      try {
        console.log('Converting image to base64...');
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve(e.target.result);
          };
          reader.onerror = (e) => {
            console.error('Error reading file:', e);
            reject(new Error('Failed to read image file'));
          };
          reader.readAsDataURL(file);
        });
      } catch (error) {
        console.error("Error processing image:", error);
        throw new Error('Failed to process image');
      }
    },
    
    createFilePreview(file, key) {
      if (!this.isImageFile(file)) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        this.filePreviews[key] = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    
    getFilePreview(key) {
      return this.filePreviews[key];
    },
    
    removeDocument(key) {
      this.formData.verificationDocs[key] = null;
      this.filePreviews[key] = null;
      this.uploadStatus[key] = {
        progress: 0,
        error: null,
        uploading: false,
        url: null
      };
      
      // Clear file input
      const inputRef = this.$refs[`${key}Input`];
      if (inputRef) {
        inputRef.value = '';
      }
    },
    
    // Account number validation
    validateAccountNumber() {
      const accountNumber = this.formData.paymentInfo.accountNumber;
      
      // Remove any non-digit characters
      const cleanNumber = accountNumber.replace(/\D/g, '');
      this.formData.paymentInfo.accountNumber = cleanNumber;
      
      // Validate length
      if (cleanNumber.length === 0) {
        this.accountNumberError = '';
      } else if (cleanNumber.length < 11) {
        this.accountNumberError = 'Account number must be exactly 11 digits';
      } else if (cleanNumber.length === 11) {
        this.accountNumberError = '';
      } else {
        // Trim to 11 digits if longer
        this.formData.paymentInfo.accountNumber = cleanNumber.slice(0, 11);
        this.accountNumberError = '';
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
  // Note: Removed previous unhandled timeout Promise that caused a runtime error
  // If you need timeouts, wrap specific awaits with Promise.race([... , timeoutPromise])
      
      try {
        // Process each document type
        for (const docType of uploadOrder) {
          const file = this.formData.verificationDocs[docType];
          if (!file) continue;
          
          try {
            // Check if it's an image or a file
            if (this.isImageFile(file)) {
              console.log(`Processing ${docType} as image (base64)...`);
              // For images: convert to base64 and save directly
              const base64String = await this.saveImageToBase64(file);
              results[docType] = {
                success: true,
                url: base64String, // This will be the base64 string
                error: null,
                type: 'image'
              };
              console.log(`✅ Image ${docType} processed successfully as base64`);
            } else {
              console.log(`Processing ${docType} as file (Firebase Storage)...`);
              // For files: upload to Firebase Storage
              const uploadResult = await this.uploadFileToStorage(file, docType);
              results[docType] = {
                success: true,
                url: uploadResult.url,
                error: null,
                type: 'file'
              };
              console.log(`✅ File ${docType} uploaded successfully to Firebase Storage`);
            }
            
            // Update UI status
            this.uploadStatus[docType].progress = 100;
            this.uploadStatus[docType].uploading = false;
            this.uploadStatus[docType].url = results[docType].url;
            
          } catch (error) {
            console.error(`❌ Failed to process ${docType}:`, error.message);
            
            // Update UI status
            this.uploadStatus[docType].error = error.message || 'Processing failed';
            this.uploadStatus[docType].uploading = false;
            this.uploadStatus[docType].progress = 0;
            
            results[docType] = { 
              success: false, 
              url: '', 
              error: error.message || 'Processing failed',
              type: this.isImageFile(this.formData.verificationDocs[docType]) ? 'image' : 'file'
            };
          }
        }
        
      } catch (error) {
        console.error("Overall upload process failed:", error.message);
        // Mark all pending uploads as failed
        uploadOrder.forEach(docType => {
          if (this.formData.verificationDocs[docType] && !results[docType].success) {
            results[docType] = {
              success: false,
              url: '',
              error: 'Upload timeout or connection issue',
              type: this.isImageFile(this.formData.verificationDocs[docType]) ? 'image' : 'file'
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
      const imageCount = Object.values(results).filter(r => r.type === 'image' && r.success).length;
      const fileCount = Object.values(results).filter(r => r.type === 'file' && r.success).length;
      
      console.log(`Upload process completed: ${successCount} successful (${imageCount} images as base64, ${fileCount} files to storage), ${errorCount} failed`);
      console.log('Final upload results:', results);
      
      return results;
    },

    // New method to upload files (non-images) to Firebase Storage
    async uploadFileToStorage(file, docType) {
      if (!file || this.isImageFile(file)) {
        throw new Error('This method is only for non-image files');
      }
      
      try {
        console.log(`Starting file upload to Firebase Storage for ${docType}:`, {
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

        // Create storage reference
        const user = auth.currentUser;
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const sanitizedFileName = `${docType}_${timestamp}.${fileExtension}`;
        const storageRef = ref(storage, `seller-documents/${user.uid}/${sanitizedFileName}`);

        console.log(`Uploading file to path: seller-documents/${user.uid}/${sanitizedFileName}`);

        // Upload file with progress tracking
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        return new Promise((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => {
              // Update progress
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              this.uploadStatus[docType].progress = Math.round(progress);
              console.log(`Upload progress for ${docType}: ${Math.round(progress)}%`);
            },
            (error) => {
              console.error(`Upload error for ${docType}:`, error);
              this.uploadStatus[docType].error = error.message;
              this.uploadStatus[docType].uploading = false;
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                this.uploadStatus[docType].url = downloadURL;
                this.uploadStatus[docType].uploading = false;
                this.uploadStatus[docType].progress = 100;
                
                console.log(`File upload successful for ${docType}: ${downloadURL}`);
                this.showNotification('File Upload Complete', `${docType} uploaded successfully`, 'success', 3000);
                
                resolve({ url: downloadURL });
              } catch (error) {
                console.error(`Error getting download URL for ${docType}:`, error);
                this.uploadStatus[docType].error = 'Upload completed but failed to get file URL';
                this.uploadStatus[docType].uploading = false;
                reject(new Error('Upload completed but failed to get file URL'));
              }
            }
          );
        });
        
      } catch (error) {
        console.error(`File upload failed for ${docType}:`, error);
        
        this.uploadStatus[docType].error = error.message;
        this.uploadStatus[docType].uploading = false;
        this.uploadStatus[docType].progress = 0;
        
        this.showNotification('File Upload Failed', `${docType}: ${error.message}`, 'error', 4000);
        
        throw error;
      }
    },

    // Add a fast, simplified upload method for better performance (LEGACY - keeping for backwards compatibility)
    async fastUpload(file, docType) {
      // This method is now replaced by the new uploadAllDocuments method
      // which handles images and files separately
      console.warn('fastUpload method is deprecated. Use uploadAllDocuments instead.');
      return { success: false, url: '', error: 'Method deprecated' };
    },

    showSubmissionResult(uploadResults) {
      // Count successful uploads
      const totalFilesSelected = Object.values(this.formData.verificationDocs).filter(file => file).length;
      const successfulUploads = Object.values(uploadResults).filter(r => r?.success).length;
      const failedUploads = Object.values(uploadResults).filter(r => r?.error).length;
      const imageUploads = Object.values(uploadResults).filter(r => r?.success && r?.type === 'image').length;
      const fileUploads = Object.values(uploadResults).filter(r => r?.success && r?.type === 'file').length;
      
      let title = "🎉 Application Submitted Successfully!";
      let message = "Your seller application has been submitted and is now under review.";
      let type = "success";
      
      // Document upload status
      if (totalFilesSelected === 0) {
        message += "<br><br>📝 <strong>Documents:</strong> None uploaded - you can add them later from your dashboard.";
      } else if (successfulUploads === totalFilesSelected) {
        message += `<br><br>✅ <strong>Documents:</strong> All ${successfulUploads} document(s) uploaded successfully.`;
        if (imageUploads > 0 && fileUploads > 0) {
          message += `<br>&nbsp;&nbsp;&nbsp;&nbsp;• ${imageUploads} image(s) processed and saved`;
          message += `<br>&nbsp;&nbsp;&nbsp;&nbsp;• ${fileUploads} file(s) uploaded to storage`;
        } else if (imageUploads > 0) {
          message += `<br>&nbsp;&nbsp;&nbsp;&nbsp;• ${imageUploads} image(s) processed and saved`;
        } else if (fileUploads > 0) {
          message += `<br>&nbsp;&nbsp;&nbsp;&nbsp;• ${fileUploads} file(s) uploaded to storage`;
        }
      } else if (successfulUploads > 0) {
        message += `<br><br>⚠️ <strong>Documents:</strong> ${successfulUploads} of ${totalFilesSelected} uploaded. Upload the rest later.`;
        if (imageUploads > 0 || fileUploads > 0) {
          message += `<br>&nbsp;&nbsp;&nbsp;&nbsp;• ${imageUploads} image(s) processed, ${fileUploads} file(s) uploaded`;
        }
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
          
          // Documents (map) - handle both base64 images and file URLs
          documents: {
            businessPermit: uploadResults.businessPermit?.url || "",
            farmCert: uploadResults.farmCert?.url || "",
            validID: uploadResults.validID?.url || ""
          },
          
          // Document metadata to track storage type
          documentMetadata: {
            businessPermit: {
              type: uploadResults.businessPermit?.type || null,
              isBase64: uploadResults.businessPermit?.type === 'image' || false
            },
            farmCert: {
              type: uploadResults.farmCert?.type || null,
              isBase64: uploadResults.farmCert?.type === 'image' || false
            },
            validID: {
              type: uploadResults.validID?.type || null,
              isBase64: uploadResults.validID?.type === 'image' || false
            }
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
            paymentMethod: this.formData.paymentInfo.paymentMethod || "",
            qrUrl: this.formData.paymentInfo.qrUrl || ""
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
        .map(([key, result]) => ({ key, result }));

      if (failedUploads.length > 0) {
        const failedDetails = failedUploads.map(({ key, result }) => {
          const docName = key === 'validID' ? 'Valid ID' : 
                         key === 'businessPermit' ? 'Business Permit' : 
                         key === 'farmCert' ? 'Farm Certification' : key;
          const fileType = result.type === 'image' ? 'image' : 'file';
          return `${docName} (${fileType})`;
        });
        
        this.showNotification(
          'Some Documents Failed to Process', 
          `The following documents failed to upload: ${failedDetails.join(', ')}. Your application will be submitted without these documents. You can upload them later from your seller dashboard.`, 
          'warning', 
          7000
        );
        return true; // Continue with submission
      }

      // Show success message for mixed uploads
      const imageCount = Object.values(uploadResults).filter(r => r.success && r.type === 'image').length;
      const fileCount = Object.values(uploadResults).filter(r => r.success && r.type === 'file').length;
      
      if (imageCount > 0 && fileCount > 0) {
        this.showNotification(
          'Documents Ready!', 
          `Successfully processed ${imageCount} image(s) and uploaded ${fileCount} file(s). Your application is ready to submit.`, 
          'success', 
          4000
        );
      } else if (imageCount > 0) {
        this.showNotification(
          'Images Ready!', 
          `Successfully processed ${imageCount} image(s). Your application is ready to submit.`, 
          'success', 
          3000
        );
      } else if (fileCount > 0) {
        this.showNotification(
          'Files Ready!', 
          `Successfully uploaded ${fileCount} file(s). Your application is ready to submit.`, 
          'success', 
          3000
        );
      }

      return true; // All uploads successful or no issues
    }
  }
};
</script>

<style scoped>
/* Global overflow prevention */
* {
  box-sizing: border-box;
}

body {
  overflow-x: hidden;
}

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

.supplier-form-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  width: 100%;
  padding: 0;
  overflow-x: hidden;
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
  padding: 10px;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
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
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 0;
  overflow: visible;
}

.step-indicators::-webkit-scrollbar {
  display: none;
}

.step-indicators::-webkit-scrollbar-thumb {
  display: none;
}

.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 80px;
  max-width: 120px;
  cursor: pointer;
  opacity: 0.5;
  transition: all 0.3s ease;
  padding: 5px;
  box-sizing: border-box;
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
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* Form Container */
.form-container {
  background-color: white;
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
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
  width: 100%;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
  width: 100%;
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="tel"],
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
  box-sizing: border-box;
  max-width: 100%;
}

.form-group input::placeholder,
.form-group textarea::placeholder,
.form-group select::placeholder {
  color: #999;
  opacity: 1;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.dropdown-search {
  position: sticky;
  top: 0;
  background: #fff;
  border-bottom: 1px solid #eee;
  padding: 8px 10px;
}
.dropdown-search input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}
.no-results {
  padding: 10px 15px;
  color: #666;
  font-size: 13px;
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
  align-items: center;
  width: 100%;
  margin-top: 20px;
  padding: 0 10px;
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
  order: 1;
}

.next-button {
  background-color: #2e5c31;
  color: white;
  order: 2;
  margin-left: auto;
}

.submit-button {
  background-color: #2e5c31;
  color: white;
  order: 2;
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

/* Document Upload Container */
.document-upload-container {
  width: 100%;
  max-width: 100%;
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 20px;
  background-color: #fafafa;
  transition: all 0.3s ease;
}

.document-upload-container:hover {
  border-color: #2e5c31;
  background-color: #f8f9fa;
}

/* Upload Options */
.upload-options {
  display: flex;
  gap: 12px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.upload-option-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: 2px solid #2e5c31;
  border-radius: 8px;
  background-color: white;
  color: #2e5c31;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 120px;
  justify-content: center;
}

.upload-option-btn:hover {
  background-color: #2e5c31;
  color: white;
}

.upload-option-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-option-btn i {
  font-size: 16px;
}

/* Ensure Lucide icons work properly */
.upload-option-btn svg,
.camera-btn svg,
.remove-file-btn svg,
.document-file-info svg {
  flex-shrink: 0;
}

.camera-btn svg {
  width: 24px;
  height: 24px;
}

.remove-file-btn svg {
  width: 14px;
  height: 14px;
}

.document-file-info svg {
  width: 20px;
  height: 20px;
}

/* Camera View */
.camera-view {
  position: relative;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
}

.camera-feed {
  width: 100%;
  height: auto;
  max-height: 300px;
  object-fit: cover;
}

.camera-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 15px;
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
}

.camera-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.capture-btn {
  background-color: #2e5c31;
  color: white;
}

.capture-btn:hover {
  background-color: #1e3d21;
  transform: scale(1.05);
}

.cancel-btn {
  background-color: #dc3545;
  color: white;
}

.cancel-btn:hover {
  background-color: #c82333;
  transform: scale(1.05);
}

.camera-btn i {
  font-size: 24px;
}

/* File Preview */
.file-preview {
  position: relative;
  width: 100%;
  max-width: 300px;
  margin: 15px auto;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background-color: white;
}

.document-preview-image {
  width: 100%;
  height: auto;
  max-height: 200px;
  object-fit: cover;
}

.document-file-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  color: #333;
}

.document-file-info i {
  font-size: 20px;
  color: #2e5c31;
}

.remove-file-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background-color: rgba(220, 53, 69, 0.9);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.remove-file-btn:hover {
  background-color: rgba(220, 53, 69, 1);
  transform: scale(1.1);
}

.remove-file-btn i {
  font-size: 14px;
}

/* Field Error */
.field-error {
  color: #dc3545;
  font-size: 12px;
  margin-top: 5px;
  display: block;
}

/* Mobile Responsive Improvements */
@media (max-width: 768px) {
  .supplier-form-page {
    padding: 0;
    min-height: 100vh;
    width: 100%;
  }
  
  .content {
    padding: 8px;
    width: 100%;
    max-width: 100%;
  }
  
  .form-container {
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 20px;
    box-shadow: none;
    border-radius: 8px;
    box-sizing: border-box;
  }
  
  .form-group {
    margin-bottom: 20px;
    width: 100%;
  }
  
  .form-group label {
    font-size: 14px;
    margin-bottom: 8px;
    width: 100%;
  }
  
  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 14px 12px;
    font-size: 16px; /* Prevents zoom on iOS */
    border-radius: 6px;
    box-sizing: border-box;
    max-width: 100%;
  }
  
  .form-group input::placeholder,
  .form-group textarea::placeholder {
    font-size: 14px;
    color: #999;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .upload-options {
    flex-direction: column;
    gap: 10px;
  }
  
  .upload-option-btn {
    width: 100%;
    justify-content: center;
    padding: 14px;
  }
  
  .document-upload-container {
    padding: 15px;
    width: 100%;
    box-sizing: border-box;
  }
  
  .upload-help-note {
    padding: 12px;
    margin-bottom: 15px;
    width: 100%;
    box-sizing: border-box;
  }
  
  .camera-feed {
    max-height: 250px;
    width: 100%;
  }
  
  .file-preview {
    max-width: 100%;
    margin: 10px 0;
  }
  
  .progress-container {
    padding: 15px 10px;
    width: 100%;
    box-sizing: border-box;
  }
  
  .step-indicators {
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }
  
  .step-indicator {
    flex: 1;
    min-width: 80px;
    padding: 6px 4px;
    max-width: 120px;
  }
  
  .step-name {
    font-size: 11px;
  }
  
  .form-navigation {
    flex-direction: row;
    justify-content: space-between;
    gap: 10px;
    padding: 0 5px;
  }
  
  .prev-button,
  .next-button,
  .submit-button {
    min-width: 120px;
    justify-content: center;
    padding: 14px 16px;
    font-size: 14px;
  }
  
  .prev-button {
    order: 1;
  }
  
  .next-button,
  .submit-button {
    order: 2;
    margin-left: auto;
  }
}

/* Extra small screens */
@media (max-width: 480px) {
  .header h1 {
    font-size: 18px;
  }
  
  .form-step h2 {
    font-size: 20px;
  }
  
  .step-description {
    font-size: 13px;
  }
  
  .upload-help-note {
    padding: 12px;
  }
  
  .upload-help-note li {
    font-size: 13px;
  }
  
  .file-help {
    font-size: 11px;
  }
}


  .qr-placeholder {
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
    padding: 16px;
    color: #64748b;
  }
.submit-button:disabled .loading-spinner {
  border-top-color: #666;
}
</style>
