<template>
    <div class="admin-layout">
      <AdminSidebar />
      
      <div class="content-container">
        <div class="content-wrapper">
          <div class="page-header">
            <h1>Add New Admin</h1>
            <p>Create a new administrator account for the FarmXpress platform</p>
          </div>
          
          <div class="form-container">
            <div class="form-card">
              <div v-if="showAlert" class="alert" :class="alertType">
                <AlertCircle v-if="alertType === 'error'" size="18" />
                <CheckCircle v-else size="18" />
                <span>{{ alertMessage }}</span>
                <button class="close-btn" @click="showAlert = false">
                  <X size="16" />
                </button>
              </div>
              
              <form @submit.prevent="handleSubmit">
                <div class="form-section">
                  <h3>Personal Information</h3>
                  
                  <div class="form-row">
                    <div class="form-group">
                      <label for="firstName">First Name</label>
                      <input 
                        type="text" 
                        id="firstName" 
                        v-model="formData.firstName" 
                        required
                        placeholder="Enter first name"
                      />
                    </div>
                    
                    <div class="form-group">
                      <label for="lastName">Last Name</label>
                      <input 
                        type="text" 
                        id="lastName" 
                        v-model="formData.lastName" 
                        required
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label for="address">Address</label>
                    <input 
                      type="text" 
                      id="address" 
                      v-model="formData.address" 
                      required
                      placeholder="Enter complete address"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label for="contactNumber">Contact Number</label>
                    <input 
                      type="text" 
                      id="contactNumber" 
                      v-model="formData.contactNumber" 
                      required
                      placeholder="Enter contact number"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label for="position">Position</label>
                    <input 
                      type="text" 
                      id="position" 
                      v-model="formData.position" 
                      required
                      placeholder="Enter position (e.g. HR, Manager)"
                    />
                  </div>
                </div>
                
                <div class="form-section">
                  <h3>Account Information</h3>
                  
                  <div class="form-group">
                    <label for="email">Email Address</label>
                    <input 
                      type="email" 
                      id="email" 
                      v-model="formData.email" 
                      required
                      placeholder="Enter email address"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label for="username">Username</label>
                    <input 
                      type="text" 
                      id="username" 
                      v-model="formData.username" 
                      required
                      placeholder="Enter username"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label for="password">Password</label>
                    <div class="password-input">
                      <input 
                        :type="showPassword ? 'text' : 'password'" 
                        id="password" 
                        v-model="formData.password" 
                        required
                        placeholder="Enter password"
                      />
                      <button 
                        type="button" 
                        class="toggle-password" 
                        @click="showPassword = !showPassword"
                      >
                        <Eye v-if="!showPassword" size="18" />
                        <EyeOff v-else size="18" />
                      </button>
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label for="confirmPassword">Confirm Password</label>
                    <div class="password-input">
                      <input 
                        :type="showConfirmPassword ? 'text' : 'password'" 
                        id="confirmPassword" 
                        v-model="formData.confirmPassword" 
                        required
                        placeholder="Confirm password"
                      />
                      <button 
                        type="button" 
                        class="toggle-password" 
                        @click="showConfirmPassword = !showConfirmPassword"
                      >
                        <Eye v-if="!showConfirmPassword" size="18" />
                        <EyeOff v-else size="18" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div class="form-actions">
                  <button type="button" class="cancel-btn" @click="resetForm">Cancel</button>
                  <button type="submit" class="submit-btn" :disabled="loading">
                    <Loader v-if="loading" size="16" class="spinner" />
                    <span v-else>Create Admin Account</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { 
    Eye, 
    EyeOff, 
    AlertCircle, 
    CheckCircle, 
    X, 
    Loader 
  } from 'lucide-vue-next';
  import AdminSidebar from '@/components/AdminSidebar.vue';
  import { createUserWithEmailAndPassword } from 'firebase/auth';
  import { doc, setDoc } from 'firebase/firestore';
  import { auth, db } from '@/firebase/firebaseConfig';
  
  const router = useRouter();
  const loading = ref(false);
  const showPassword = ref(false);
  const showConfirmPassword = ref(false);
  const showAlert = ref(false);
  const alertMessage = ref('');
  const alertType = ref(''); // Initialize with an empty string
  
  const formData = reactive({
    firstName: '',
    lastName: '',
    address: '',
    contactNumber: '',
    position: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  
  const resetForm = () => {
    Object.keys(formData).forEach(key => {
      formData[key] = '';
    });
    showAlert.value = false;
  };
  
  const handleSubmit = async () => {
    try {
      // Validate form
      if (formData.password !== formData.confirmPassword) {
        alertType.value = 'error';
        alertMessage.value = 'Passwords do not match';
        showAlert.value = true;
        return;
      }
      
      if (formData.password.length < 6) {
        alertType.value = 'error';
        alertMessage.value = 'Password must be at least 6 characters';
        showAlert.value = true;
        return;
      }
      
      loading.value = true;
      
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      
      const userId = userCredential.user.uid;
      
      // Create admin document in Firestore
      await setDoc(doc(db, 'admins', userId), {
        firstName: formData.firstName.toUpperCase(),
        lastName: formData.lastName.toUpperCase(),
        address: formData.address.toUpperCase(),
        contactNumber: formData.contactNumber,
        position: formData.position.toUpperCase(),
        email: formData.email.toLowerCase(),
        username: formData.username,
        role: 'admin',
        isVerified: true,
        userId: userId
      });
      
      // Show success message
      alertType.value = 'success';
      alertMessage.value = 'Admin account created successfully';
      showAlert.value = true;
      
      // Reset form
      resetForm();
      
      // Redirect to admin management after a delay
      setTimeout(() => {
        router.push('/admin/');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating admin account:', error);
      alertType.value = 'error';
      alertMessage.value = error.message || 'Failed to create admin account';
      showAlert.value = true;
    } finally {
      loading.value = false;
    }
  };
  </script>
  
  <style scoped>
  .admin-layout {
    display: flex;
    min-height: 100vh;
    background-color: #f5f5f5;
  }
  
  .content-container {
    flex: 1;
    margin-left: 260px; /* Width of the sidebar */
    padding: 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    align-items: center; /* Center content horizontally */
  }
  
  .content-wrapper {
    width: 100%;
    max-width: 800px; /* Control the maximum width of the content */
  }
  
  .page-header {
    margin-bottom: 24px;
    text-align: center; /* Center the header text */
  }
  
  .page-header h1 {
    font-size: 1.8rem;
    font-weight: 700;
    color: #2e5c31;
    margin: 0 0 8px 0;
  }
  
  .page-header p {
    font-size: 1rem;
    color: #666;
    margin: 0;
  }
  
  .form-container {
    width: 100%;
  }
  
  .form-card {
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    padding: 24px;
    margin-bottom: 24px;
  }
  
  .form-section {
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid #eee;
  }
  
  .form-section:last-child {
    border-bottom: none;
  }
  
  .form-section h3 {
    font-size: 1.2rem;
    font-weight: 600;
    color: #2e5c31;
    margin: 0 0 16px 0;
  }
  
  .form-row {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
  }
  
  @media (max-width: 768px) {
    .form-row {
      flex-direction: column;
      gap: 0;
    }
    
    .content-container {
      padding: 16px;
    }
    
    .form-card {
      padding: 16px;
    }
  }
  
  .form-group {
    margin-bottom: 16px;
    flex: 1;
  }
  
  .form-group label {
    display: block;
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 6px;
    color: #444;
  }
  
  .form-group input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.95rem;
    transition: border-color 0.2s ease;
  }
  
  .form-group input:focus {
    outline: none;
    border-color: #2e5c31;
  }
  
  .password-input {
    position: relative;
  }
  
  .toggle-password {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #777;
    cursor: pointer;
    padding: 0;
  }
  
  .form-actions {
    display: flex;
    justify-content: center; /* Center the buttons */
    gap: 12px;
    margin-top: 24px;
  }
  
  .cancel-btn {
    padding: 10px 16px;
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.95rem;
    font-weight: 500;
    color: #555;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .cancel-btn:hover {
    background-color: #eee;
  }
  
  .submit-btn {
    padding: 10px 20px;
    background-color: #2e5c31;
    border: none;
    border-radius: 6px;
    font-size: 0.95rem;
    font-weight: 500;
    color: white;
    cursor: pointer;
    transition: background-color 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 180px;
  }
  
  .submit-btn:hover {
    background-color: #234424;
  }
  
  .submit-btn:disabled {
    background-color: #88b88a;
    cursor: not-allowed;
  }
  
  .spinner {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .alert {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-radius: 6px;
    margin-bottom: 20px;
    gap: 8px;
  }
  
  .alert.success {
    background-color: rgba(46, 92, 49, 0.1);
    color: #2e5c31;
  }
  
  .alert.error {
    background-color: rgba(220, 53, 69, 0.1);
    color: #dc3545;
  }
  
  .close-btn {
    margin-left: auto;
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* Responsive adjustments for smaller screens */
  @media (max-width: 600px) {
    .content-container {
      margin-left: 0;
      padding-top: 60px; /* Add space for a mobile header if needed */
    }
    
    .admin-layout {
      flex-direction: column;
    }
  }
  
  /* Dark mode support */
  :global(body.dark) .content-container {
    background-color: #1a1a1a;
  }
  
  :global(body.dark) .form-card {
    background-color: #222;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  }
  
  :global(body.dark) .page-header h1 {
    color: #4caf50;
  }
  
  :global(body.dark) .page-header p {
    color: #aaa;
  }
  
  :global(body.dark) .form-section {
    border-bottom-color: #333;
  }
  
  :global(body.dark) .form-section h3 {
    color: #4caf50;
  }
  
  :global(body.dark) .form-group label {
    color: #ccc;
  }
  
  :global(body.dark) .form-group input {
    background-color: #333;
    border-color: #444;
    color: #eee;
  }
  
  :global(body.dark) .form-group input:focus {
    border-color: #4caf50;
  }
  
  :global(body.dark) .cancel-btn {
    background-color: #333;
    border-color: #444;
    color: #ccc;
  }
  
  :global(body.dark) .cancel-btn:hover {
    background-color: #3a3a3a;
  }
  
  :global(body.dark) .toggle-password {
    color: #aaa;
  }
  </style>