<template>
  <div class="supplier-form-page">
    <div class="header">
      <button class="back-button" @click="goBack">
        <ChevronLeft size="22" />
      </button>
      <h1>Edit Seller Profile</h1>
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
            :class="{ 'active': currentStep >= index, 'current': currentStep === index }"
            @click="goToStep(index)"
          >
            <div class="step-number">{{ index + 1 }}</div>
            <span class="step-name">{{ step }}</span>
          </div>
        </div>
      </div>

      <!-- Form Content -->
      <div class="form-container">
        <!-- Loading and error states -->
        <div v-if="loading" class="loading-container">
          <Loader size="32" class="spinner" />
          <p>Loading profile...</p>
        </div>
        <div v-else-if="error" class="error-container">
          <AlertCircle size="32" class="error-icon" />
          <p>{{ error }}</p>
          <button class="prev-button" @click="fetchAll">Retry</button>
        </div>

        <template v-else>
          <!-- Personal Information -->
          <div v-if="currentStep === 0" class="form-step">
            <h2>Personal Information</h2>
            <p class="step-description">Update your basic contact information</p>

            <div class="form-group">
              <label for="firstName">First Name</label>
              <input type="text" id="firstName" v-model="formData.personalInfo.firstName" placeholder="Enter your first name" />
            </div>

            <div class="form-group">
              <label for="lastName">Last Name</label>
              <input type="text" id="lastName" v-model="formData.personalInfo.lastName" placeholder="Enter your last name" />
            </div>

            <div class="form-group">
              <label for="contact">Contact Number</label>
              <input type="text" id="contact" v-model="formData.personalInfo.contact" placeholder="Enter your contact number" />
            </div>

            <div class="form-group">
              <label for="email">Email Address</label>
              <input type="email" id="email" v-model="formData.personalInfo.email" placeholder="Enter your email address" />
            </div>

            <div class="form-group">
              <label for="address">Complete Address</label>
              <textarea id="address" v-model="formData.personalInfo.address" placeholder="Enter your complete address" rows="3"></textarea>
            </div>
          </div>

          <!-- Farm Details -->
          <div v-if="currentStep === 1" class="form-step">
            <h2>Farm Details</h2>
            <p class="step-description">Tell us about your farm and what you grow</p>

            <div class="form-group">
              <label for="farmName">Farm Name</label>
              <input type="text" id="farmName" v-model="formData.farmDetails.farmName" placeholder="Enter your farm name" />
            </div>

            <div class="form-group">
              <label for="farmAddress">Farm Address</label>
              <textarea id="farmAddress" v-model="formData.farmDetails.farmAddress" placeholder="Enter your farm address" rows="3"></textarea>
            </div>

            <div class="form-group">
              <label for="farmType">Farm Type</label>
              <select id="farmType" v-model="formData.farmDetails.farmType">
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
              <textarea id="products" v-model="formData.farmDetails.products" placeholder="List the products you plan to sell" rows="3"></textarea>
            </div>

            <div class="form-group">
              <label for="yearInFarming">Years in Farming</label>
              <input type="number" id="yearInFarming" v-model="formData.farmDetails.yearInFarming" placeholder="Enter years of experience" min="0" />
            </div>
          </div>

          <!-- Payment Information -->
          <div v-if="currentStep === 2" class="form-step">
            <h2>Payment Information</h2>
            <p class="step-description">How would you like to receive payments?</p>

            <div class="form-group">
              <label for="paymentMethod">Payment Method</label>
              <select id="paymentMethod" v-model="formData.paymentInfo.paymentMethod">
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
              <input type="text" id="accountName" v-model="formData.paymentInfo.accountName" placeholder="Enter account name" />
            </div>

            <div class="form-group">
              <label for="accountNumber">Account Number</label>
              <input type="tel" id="accountNumber" v-model="formData.paymentInfo.accountNumber" placeholder="09123456789 (11 digits only)" maxlength="11" pattern="[0-9]{11}" @input="validateAccountNumber" />
              <span v-if="accountNumberError" class="field-error">{{ accountNumberError }}</span>
            </div>

            <!-- GCash QR Code -->
            <div class="form-group" v-if="formData.paymentInfo.paymentMethod === 'GCash'">
              <label>GCash QR Code (optional)</label>
              <div class="document-upload-container">
                <div class="upload-options">
                  <button type="button" class="upload-option-btn" @click="triggerQrInput">
                    <Upload :size="16" />
                    Upload QR Image
                  </button>
                </div>

                <div v-if="filePreviews.paymentQr || formData.paymentInfo.qrUrl" class="file-preview">
                  <img :src="filePreviews.paymentQr || formData.paymentInfo.qrUrl" alt="GCash QR preview" class="document-preview-image" />
                  <button type="button" class="remove-file-btn" @click="removeQr">
                    <X :size="14" />
                  </button>
                </div>
                <div v-else class="qr-placeholder file-help" style="text-align:center;">No QR selected yet</div>

                <input type="file" ref="paymentQrInput" class="file-input" accept="image/*" @change="handleQrUpload" />
                <p class="file-help">Accepted: JPG, PNG, WEBP, GIF up to 5MB.</p>
              </div>
            </div>
          </div>

          <!-- Verification Documents -->
          <div v-if="currentStep === 3" class="form-step">
            <h2>Verification Documents</h2>
            <p class="step-description">Upload or replace your verification documents.</p>

            <!-- Valid ID -->
            <div class="form-group">
              <label for="validID">Valid ID</label>
              <div class="document-upload-container">
                <div class="upload-options">
                  <button type="button" class="upload-option-btn" @click="triggerFileInput('validID')">
                    <Upload :size="16" />
                    Upload File
                  </button>
                </div>

                <!-- Existing preview or newly selected -->
                <div v-if="formData.verificationDocs.validID || filePreviews.validID" class="file-preview">
                  <img v-if="isCurrentPreviewImage('validID')" :src="currentPreview('validID')" alt="Valid ID preview" class="document-preview-image" />
                  <div v-else class="document-file-info">
                    <FileText :size="20" />
                    <span>Existing document</span>
                  </div>
                  <button type="button" class="remove-file-btn" @click="removeDocument('validID')">
                    <X :size="14" />
                  </button>
                </div>

                <input type="file" ref="validIDInput" @change="handleFileUpload($event, 'validID')" accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,.doc,.docx,.xls,.xlsx,.txt" class="file-input" />
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
                    <input type="checkbox" :id="method.value" :value="method.value" v-model="formData.deliveryInfo.deliveryMethods" />
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
                    <input type="checkbox" :id="municipality" :value="municipality" v-model="formData.deliveryInfo.areasCovered" />
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
              <textarea id="socialMedia" v-model="formData.additionalDetails.socialMedia" placeholder="Enter your social media links (Facebook, Instagram, etc.)" rows="3"></textarea>
            </div>

            <div class="form-group checkbox-group">
              <input type="checkbox" id="wholesaleAvailability" v-model="formData.additionalDetails.wholesaleAvailability" />
              <label for="wholesaleAvailability">Available for wholesale orders</label>
            </div>
          </div>
        </template>
      </div>

      <!-- Navigation Buttons -->
      <div class="form-navigation">
        <button v-if="currentStep > 0" class="prev-button" @click="prevStep">
          <ChevronLeft size="18" />
          Previous
        </button>

        <button v-if="currentStep < steps.length - 1" class="next-button" @click="nextStep">
          Next
          <ChevronRight size="18" />
        </button>

        <button v-if="currentStep === steps.length - 1" class="submit-button" @click="saveChanges" :disabled="isSubmitting">
          <span v-if="isSubmitting"><span class="loading-spinner"></span>Saving...</span>
          <span v-else>Save Changes</span>
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
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { ChevronLeft, ChevronRight, Upload, ChevronDown, X, FileText, Loader, AlertCircle } from 'lucide-vue-next';

export default {
  name: 'SellerEditProfile',
  components: { ChevronLeft, ChevronRight, Upload, ChevronDown, X, FileText, Loader, AlertCircle },
  data() {
    return {
      currentStep: 0,
      steps: [
        "Personal Info",
        "Farm Details",
        "Payment Info",
        "Verification",
        "Delivery Info",
        "Additional Details"
      ],
      isDeliveryDropdownOpen: false,
      isMunicipalityDropdownOpen: false,
      municipalities: [
        "Baco","Bansud","Bongabong","Bulalacao","Calapan City",
        "Gloria","Mansalay","Naujan","Pinamalayan","Pola",
        "Puerto Galera","Roxas","San Teodoro","Socorro","Victoria"
      ],
      deliveryMethods: [
        { label: "Own Delivery", value: "own_delivery" },
        { label: "Pickup Only", value: "pickup_only" }
      ],
      formData: {
        personalInfo: { firstName: '', lastName: '', contact: '', email: '', address: '' },
        farmDetails: { farmName: '', farmAddress: '', farmType: '', products: '', yearInFarming: 0 },
        paymentInfo: { paymentMethod: '', accountName: '', accountNumber: '', qrUrl: null },
        verificationDocs: { validID: null },
        deliveryInfo: { deliveryMethods: [], areasCovered: [] },
        additionalDetails: { socialMedia: '', wholesaleAvailability: false }
      },
      uploadStatus: {
        validID: { progress: 0, error: null, uploading: false, url: null }
      },
      filePreviews: { validID: null, paymentQr: null },
      accountNumberError: '',
      isSubmitting: false,
      loading: true,
      error: null,
      sellerDocId: null,
      // Keep originals to preserve if user doesn't replace
      loadedSellerData: null,

      // Notification system
      notification: { show: false, type: 'success', title: '', message: '', duration: 5000 }
    };
  },
  computed: {
    progressWidth() { return ((this.currentStep + 1) / this.steps.length) * 100; },
    selectedMunicipalities() { return this.formData.deliveryInfo.areasCovered || []; },
    selectedDeliveryMethods() { return this.formData.deliveryInfo.deliveryMethods || []; }
  },
  async created() {
    await this.fetchAll();
  },
  methods: {
    goBack() {
      if (window.history.length > 1) return this.$router.back();
      this.$router.push('/seller-dashboard').catch(() => {});
    },
    toggleDeliveryDropdown() {
      this.isDeliveryDropdownOpen = !this.isDeliveryDropdownOpen;
      if (this.isDeliveryDropdownOpen) this.isMunicipalityDropdownOpen = false;
    },
    toggleMunicipalityDropdown() {
      this.isMunicipalityDropdownOpen = !this.isMunicipalityDropdownOpen;
      if (this.isMunicipalityDropdownOpen) this.isDeliveryDropdownOpen = false;
    },
    goToStep(index) { if (index <= this.currentStep) this.currentStep = index; },
    nextStep() { if (this.currentStep < this.steps.length - 1) this.currentStep++; },
    prevStep() { if (this.currentStep > 0) this.currentStep--; },

    showNotification(title, message, type = 'success', duration = 5000) {
      this.notification = { show: true, type, title, message, duration };
      setTimeout(() => this.closeNotification(), duration);
    },
    closeNotification() { this.notification.show = false; },

    // Fetch user and seller data (by route id or current user)
    async fetchAll() {
      this.loading = true;
      this.error = null;
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('No authenticated user.');

        // Load base user profile
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (userSnap.exists()) {
          const u = userSnap.data();
          this.formData.personalInfo.firstName = u.firstName || '';
          this.formData.personalInfo.lastName = u.lastName || '';
          this.formData.personalInfo.email = u.email || user.email || '';
          this.formData.personalInfo.contact = u.contactNumber || '';
          this.formData.personalInfo.address = u.address || '';
        }

        // Determine seller document id from route or user mapping
        const routeSellerId = this.$route.params.id || this.$route.query.sellerId || null;
        let sellerDocRef = routeSellerId ? doc(db, 'sellers', routeSellerId) : doc(db, 'sellers', user.uid);
        let sellerSnap = await getDoc(sellerDocRef);

        if (!sellerSnap.exists()) {
          // fallback: query by userId
          const snap = await getDocs(query(collection(db, 'sellers'), where('userId', '==', user.uid)));
          if (!snap.empty) {
            sellerSnap = snap.docs[0];
          } else {
            // fallback: by email
            const snapByEmail = await getDocs(query(collection(db, 'sellers'), where('personalInfo.email', '==', this.formData.personalInfo.email)));
            if (!snapByEmail.empty) sellerSnap = snapByEmail.docs[0];
          }
        }

        if (sellerSnap && sellerSnap.exists()) {
          this.sellerDocId = sellerSnap.id;
          const s = sellerSnap.data();
          this.loadedSellerData = s;
          // Map nested data
          if (s.personalInfo) Object.assign(this.formData.personalInfo, s.personalInfo);
          if (s.farmDetails) Object.assign(this.formData.farmDetails, {
            farmName: s.farmDetails.farmName || '',
            farmAddress: s.farmDetails.farmAddress || '',
            farmType: s.farmDetails.farmType || '',
            products: s.farmDetails.products || '',
            yearInFarming: isNaN(Number(s.farmDetails.yearInFarming)) ? 0 : Number(s.farmDetails.yearInFarming)
          });
          if (s.paymentInfo) Object.assign(this.formData.paymentInfo, s.paymentInfo);
          if (s.deliveryInfo) Object.assign(this.formData.deliveryInfo, s.deliveryInfo);
          if (s.additionalDetails) Object.assign(this.formData.additionalDetails, s.additionalDetails);
          if (s.documents) {
            this.filePreviews.validID = s.documents.validID || null;
          }
        }
      } catch (e) {
        console.error('Failed to load profile:', e);
        this.error = e?.message || 'Failed to load profile data';
      } finally {
        this.loading = false;
      }
    },

    // File helpers
    isImageFile(file) { return !!file && file.type?.startsWith('image/'); },
    createFilePreview(file, key) {
      if (!this.isImageFile(file)) return;
      const reader = new FileReader();
      reader.onload = (e) => { this.filePreviews[key] = e.target.result; };
      reader.readAsDataURL(file);
    },
    currentPreview(key) {
      return this.filePreviews[key];
    },
    isCurrentPreviewImage(key) {
      const val = this.formData.verificationDocs[key];
      if (val instanceof File) return this.isImageFile(val);
      const existing = this.filePreviews[key];
      return typeof existing === 'string' && existing.startsWith('data:image');
    },
    handleFileUpload(event, key) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) { this.showNotification('File Too Large', 'Please select a file smaller than 5MB', 'error'); return; }
      const allowedTypes = [
        'image/jpeg','image/jpg','image/png','image/gif','image/webp',
        'application/pdf',
        'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain'
      ];
      if (!allowedTypes.includes(file.type)) { this.showNotification('Invalid File Type', 'Please select an image, PDF, Word, Excel, or text file', 'error'); return; }
      this.formData.verificationDocs[key] = file;
      if (this.isImageFile(file)) this.createFilePreview(file, key);
      this.showNotification('File Selected', `${file.name} ready to upload`, 'success', 2000);
    },
    triggerFileInput(key) { this.$refs[`${key}Input`]?.click(); },
    removeDocument(key) {
      this.formData.verificationDocs[key] = null;
      this.filePreviews[key] = null;
      const ref = this.$refs[`${key}Input`]; if (ref) ref.value = '';
      this.uploadStatus[key] = { progress: 0, error: null, uploading: false, url: null };
    },

    // QR helpers
    triggerQrInput() { this.$refs.paymentQrInput?.click(); },
    async handleQrUpload(e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) { this.showNotification('QR Too Large', 'Please choose an image up to 5MB.', 'error'); return; }
      if (!this.isImageFile(file)) { this.showNotification('Invalid QR File', 'QR must be an image.', 'error'); return; }
      this.createFilePreview(file, 'paymentQr');
      const base64 = await this.saveImageToBase64(file);
      this.formData.paymentInfo.qrUrl = base64;
      this.showNotification('QR Selected', 'Your QR image is ready.', 'success', 2000);
    },
    removeQr() {
      this.formData.paymentInfo.qrUrl = null;
      this.filePreviews.paymentQr = null;
      const input = this.$refs.paymentQrInput; if (input) input.value = '';
    },

    async saveImageToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      });
    },

    validateAccountNumber() {
      const clean = (this.formData.paymentInfo.accountNumber || '').replace(/\D/g, '');
      this.formData.paymentInfo.accountNumber = clean.slice(0, 11);
      this.accountNumberError = clean.length > 0 && clean.length < 11 ? 'Account number must be exactly 11 digits' : '';
    },

    async uploadFileToStorage(file, docType) {
      if (!file || this.isImageFile(file)) throw new Error('Only non-image files here');
      const user = auth.currentUser; if (!user) throw new Error('User not authenticated');
      this.uploadStatus[docType] = { progress: 0, error: null, uploading: true, url: null };
      const timestamp = Date.now();
      const ext = file.name.split('.').pop();
      const path = `seller-documents/${user.uid}/${docType}_${timestamp}.${ext}`;
      const sRef = storageRef(storage, path);
      const task = uploadBytesResumable(sRef, file);
      return new Promise((resolve, reject) => {
        task.on('state_changed', snap => {
          const progress = (snap.bytesTransferred / snap.totalBytes) * 100;
          this.uploadStatus[docType].progress = Math.round(progress);
        }, err => {
          this.uploadStatus[docType].error = err.message; this.uploadStatus[docType].uploading = false; reject(err);
        }, async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          this.uploadStatus[docType].url = url; this.uploadStatus[docType].uploading = false; this.uploadStatus[docType].progress = 100;
          resolve({ url });
        });
      });
    },

    async uploadAllDocuments() {
      const results = { validID: { success: false, url: '', type: null } };
      const order = ['validID'];
      for (const key of order) {
        const file = this.formData.verificationDocs[key];
        if (!file) continue;
        try {
          if (this.isImageFile(file)) {
            const base64 = await this.saveImageToBase64(file);
            results[key] = { success: true, url: base64, type: 'image' };
          } else {
            const { url } = await this.uploadFileToStorage(file, key);
            results[key] = { success: true, url, type: 'file' };
          }
        } catch (e) {
          results[key] = { success: false, url: '', type: this.isImageFile(file) ? 'image' : 'file', error: e?.message };
        }
      }
      return results;
    },

    async saveChanges() {
      try {
        const user = auth.currentUser; if (!user) { this.showNotification('Auth required', 'Please log in.', 'error'); return; }
        this.isSubmitting = true;

        const uploadResults = await this.uploadAllDocuments();

        const docs = {
          validID: uploadResults.validID?.success ? uploadResults.validID.url : (this.loadedSellerData?.documents?.validID || '')
        };

        const sellerUpdate = {
          personalInfo: { ...this.formData.personalInfo, photoUrl: this.loadedSellerData?.personalInfo?.photoUrl || '' },
          farmDetails: { ...this.formData.farmDetails, yearInFarming: String(this.formData.farmDetails.yearInFarming || 0) },
          paymentInfo: { ...this.formData.paymentInfo },
          deliveryInfo: { ...this.formData.deliveryInfo },
          additionalDetails: { ...this.formData.additionalDetails },
          documents: docs,
          documentMetadata: {
            validID: { type: uploadResults.validID?.type || this.loadedSellerData?.documentMetadata?.validID?.type || null, isBase64: (uploadResults.validID?.type === 'image') || this.loadedSellerData?.documentMetadata?.validID?.isBase64 || false }
          },
          updatedAt: new Date()
        };

        let targetId = this.sellerDocId || user.uid;
        const tryDoc = await getDoc(doc(db, 'sellers', targetId));
        if (!tryDoc.exists() && this.sellerDocId && this.sellerDocId !== user.uid) {
          targetId = this.sellerDocId;
        }
        await updateDoc(doc(db, 'sellers', targetId), sellerUpdate);

        await updateDoc(doc(db, 'users', user.uid), {
          firstName: this.formData.personalInfo.firstName,
          lastName: this.formData.personalInfo.lastName,
          contactNumber: this.formData.personalInfo.contact,
          address: this.formData.personalInfo.address
        });

        this.showNotification('Profile Updated', 'Your seller profile has been saved.', 'success', 4000);
      } catch (e) {
        console.error('Save failed:', e);
        this.showNotification('Save Failed', e?.message || 'Please try again.', 'error', 6000);
      } finally {
        this.isSubmitting = false;
      }
    }
  }
};
</script>

<style scoped>
* { box-sizing: border-box; }
body { overflow-x: hidden; }

.loading-container, .error-container {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: #666;
}
.spinner { animation: spin 1s linear infinite; }
@keyframes spin { 0%{transform:rotate(0)}100%{transform:rotate(360deg)} }
.error-icon { color: #ef4444; }

.custom-notification { position: fixed; top: 20px; right: 20px; max-width: 400px; min-width: 300px; z-index: 9999; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,.12); backdrop-filter: blur(10px); animation: slideInRight .3s ease-out; overflow: hidden; }
.custom-notification.success { background: linear-gradient(135deg,#10b981,#059669); border:1px solid rgba(16,185,129,.3); }
.custom-notification.error { background: linear-gradient(135deg,#ef4444,#dc2626); border:1px solid rgba(239,68,68,.3); }
.custom-notification.warning { background: linear-gradient(135deg,#f59e0b,#d97706); border:1px solid rgba(245,158,11,.3); }
.custom-notification.info { background: linear-gradient(135deg,#3b82f6,#2563eb); border:1px solid rgba(59,130,246,.3); }
.notification-content { padding: 20px; color: white; }
.notification-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
.notification-title { font-size:16px; font-weight:600; margin:0; line-height:1.2; }
.notification-close { background: rgba(255,255,255,.2); border:none; color:white; width:24px; height:24px; border-radius:50%; cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center; margin-left:12px; transition: background .2s ease; }
.notification-close:hover { background: rgba(255,255,255,.3); }
.notification-body p { margin:0; font-size:14px; line-height:1.5; opacity:.95; }
@keyframes slideInRight { from { transform: translateX(100%); opacity:0;} to { transform: translateX(0); opacity:1;} }

.supplier-form-page { min-height: 100vh; display: flex; flex-direction: column; background-color: #f5f5f5; width: 100%; padding: 0; overflow-x: hidden; }
.header { display:flex; align-items:center; padding:20px 15px; background-color:#2e5c31; color:white; }
.back-button { width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; margin-right:10px; background: transparent; border: none; }
.header h1 { font-size:18px; font-weight:600; }
.content { flex:1; padding:10px; overflow-y:auto; overflow-x:hidden; width:100%; max-width:800px; margin:0 auto; }

.progress-container { margin-bottom:25px; }
.progress-bar { height:6px; background-color:#e0e0e0; border-radius:3px; margin-bottom:15px; overflow:hidden; }
.progress-fill { height:100%; background-color:#2e5c31; transition: width .3s ease; }
.step-indicators { display:flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; padding:10px 0; overflow:visible; }
.step-indicator { display:flex; flex-direction:column; align-items:center; flex:1; min-width:80px; max-width:120px; cursor:pointer; opacity:.5; transition: all .3s ease; padding:5px; }
.step-indicator.active { opacity:1; }
.step-indicator.current { color:#2e5c31; font-weight:600; }
.step-number { width:24px; height:24px; border-radius:50%; background:#e0e0e0; display:flex; align-items:center; justify-content:center; font-size:12px; margin-bottom:5px; transition: all .3s ease; }
.step-indicator.active .step-number { background:#2e5c31; color:#fff; }
.step-name { font-size:11px; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }

.form-container { background:#fff; border-radius:10px; padding:25px; box-shadow:0 2px 8px rgba(0,0,0,.05); margin-bottom:20px; width:100%; max-width:100%; box-sizing: border-box; }
.form-step h2 { font-size:20px; font-weight:600; color:#333; margin-bottom:5px; }
.step-description { font-size:14px; color:#666; margin-bottom:20px; }
.form-group { margin-bottom:20px; position:relative; width:100%; }
.form-group label { display:block; font-size:14px; font-weight:500; color:#333; margin-bottom:8px; width:100%; }
.form-group input[type="text"], .form-group input[type="email"], .form-group input[type="tel"], .form-group input[type="number"], .form-group select, .form-group textarea { width:100%; padding:12px 15px; border:1px solid #ddd; border-radius:8px; font-size:14px; transition:border-color .3s ease; background:#fff; box-sizing: border-box; max-width:100%; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color:#2e5c31; outline:none; }
.checkbox-group { display:flex; align-items:center; gap:10px; }
.checkbox-group input[type="checkbox"] { width:18px; height:18px; accent-color:#2e5c31; }
.dropdown-checkbox { position:relative; width:100%; }
.dropdown-header { display:flex; justify-content:space-between; align-items:center; padding:12px 15px; border:1px solid #ddd; border-radius:8px; background:#fff; cursor:pointer; font-size:14px; }
.dropdown-header .rotate-180 { transform: rotate(180deg); }
.dropdown-content { position:absolute; top:100%; left:0; width:100%; max-height:200px; overflow-y:auto; background:#fff; border:1px solid #ddd; border-radius:0 0 8px 8px; z-index:10; box-shadow: 0 4px 8px rgba(0,0,0,.1); }
.dropdown-content .checkbox-group { padding:10px 15px; border-bottom:1px solid #eee; }
.dropdown-content .checkbox-group:last-child { border-bottom:none; }

.document-upload-container { width:100%; max-width:100%; border:2px dashed #ddd; border-radius:8px; padding:20px; background:#fafafa; transition: all .3s ease; }
.document-upload-container:hover { border-color:#2e5c31; background:#f8f9fa; }
.upload-options { display:flex; gap:12px; margin-bottom:15px; flex-wrap:wrap; }
.upload-option-btn { display:flex; align-items:center; gap:8px; padding:12px 16px; border:2px solid #2e5c31; border-radius:8px; background:#fff; color:#2e5c31; font-weight:500; cursor:pointer; transition: all .2s ease; flex:1; min-width:120px; justify-content:center; }
.upload-option-btn:hover { background:#2e5c31; color:#fff; }
.file-input { display:none; }
.file-preview { position:relative; width:100%; max-width:300px; margin:15px 0; border:1px solid #ddd; border-radius:8px; overflow:hidden; background:#fff; }
.document-preview-image { width:100%; height:auto; max-height:200px; object-fit:cover; }
.document-file-info { display:flex; align-items:center; gap:10px; padding:15px; color:#333; }
.remove-file-btn { position:absolute; top:5px; right:5px; width:30px; height:30px; border-radius:50%; border:none; background:rgba(220,53,69,.9); color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; transition: all .2s ease; }
.remove-file-btn:hover { background: rgba(220,53,69,1); transform: scale(1.1); }
.file-help { font-size:12px; color:#999; margin-top:5px; }
.qr-placeholder { border:1px dashed #cbd5e1; border-radius:8px; padding:16px; color:#64748b; }

.form-navigation { display:flex; justify-content:space-between; align-items:center; width:100%; margin-top:20px; padding:0 10px; }
.prev-button, .next-button, .submit-button { display:flex; align-items:center; gap:8px; padding:12px 20px; border-radius:8px; font-size:14px; font-weight:600; transition: all .2s ease; border:none; cursor:pointer; }
.prev-button { background:#f0f0f0; color:#333; }
.next-button, .submit-button { background:#2e5c31; color:#fff; margin-left:auto; }
.submit-button:disabled { background:#ccc; cursor:not-allowed; }
.loading-spinner { display:inline-block; width:16px; height:16px; border:2px solid transparent; border-top:2px solid currentColor; border-radius:50%; animation: spin 1s linear infinite; margin-right:8px; }

@media (max-width: 768px) {
  .content { padding:8px; max-width:100%; }
  .form-container { padding:20px; box-shadow:none; border-radius:8px; }
  .upload-options { flex-direction:column; gap:10px; }
  .upload-option-btn { width:100%; justify-content:center; padding:14px; }
  .file-preview { max-width:100%; }
}
</style>
