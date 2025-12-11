<template>
  <div class="login-container">
    <div class="logo-container">
  <img src="@/assets/farmxpres-icon (green).png" alt="FarmXpress Logo" class="logo" />
      <h1 class="app-title">FarmXpress</h1>
      <h3 class="app-subtitle">MOBILE APP</h3>
    </div>

    <!-- Alert Box -->
    <div v-if="alertMessage" :class="['alert-box', alertType]">
      {{ alertMessage }}
    </div>

    <div class="login-box">
      <div class="input-container">
        <i class="fas fa-user icon"></i>
        <input type="email" v-model="email" placeholder="Email" />
      </div>
      <div class="input-container password-container">
        <i class="fas fa-lock icon"></i>
        <input :type="showPassword ? 'text' : 'password'" v-model="password" placeholder="Password" />
        <span class="eye-icon" @click="togglePassword">
          <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
        </span>
      </div>

      <div class="options">
        <label class="remember-me">
          <input type="checkbox" v-model="rememberMe" />
          <span class="checkmark"></span>
          Remember Me
        </label>
        <a @click="forgotPassword" href="#" class="forgot-password">Forgot Password?</a>
      </div>

      <button 
        class="login-button" 
        @click="login"
        :disabled="isLocked || isLoading"
        :class="{ 'locked': isLocked, 'loading': isLoading }"
      >
        <span v-if="isLoading" class="spinner" aria-hidden="true"></span>
        <span v-if="isLoading">Signing in…</span>
        <span v-else-if="!isLocked">Login</span>
        <span v-else>Locked - {{ formatTime(remainingTime) }}</span>
      </button>
      
      <p class="signup-text">Don't have an account? <a href="/registration" class="signup-link">Create an account</a></p>
    </div>
  </div>
</template>

<script>
// Script remains unchanged
import { auth, db, googleProvider } from '../firebase/firebaseConfig';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, setDoc, updateDoc } from 'firebase/firestore';

export default {
  data() {
    return {
      email: '',
      password: '',
      rememberMe: false,
      alertMessage: '',
      alertType: '',
      pendingVerificationEmail: '',
      showPassword: false,
      loginAttempts: 0,
      maxAttempts: 5,
      isLocked: false,
  isLoading: false,
      lockoutTime: 300000, // 5 minutes in milliseconds
      remainingTime: 0,
      countdownInterval: null,
    };
  },
    methods: {
      async login() {
        // Check if user is currently locked out
        if (this.isLocked || this.isLoading) {
          this.showAlert(`Too many failed attempts. Please wait ${this.formatTime(this.remainingTime)} before trying again.`, 'error');
          return;
        }

        if (!this.email || !this.password) {
          this.showAlert('Please enter both email and password.', 'warning');
          return;
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(this.email)) {
          this.showAlert('Please enter a valid email address.', 'warning');
          return;
        }
        
        try {
          this.isLoading = true;
          const userCredential = await signInWithEmailAndPassword(auth, this.email, this.password);
          const user = userCredential.user;

          if (!user.emailVerified) {
            // Sign out the user since they're not verified
            await auth.signOut();
            this.showAlert('Please verify your email before logging in. Check your inbox for the verification link.', 'warning');
            this.isLoading = false;
            return;
          }

          // Reset login attempts on successful login
          this.resetLoginAttempts();
          await this.processUserLogin(user);
        } catch (error) {
          console.error('Login Error:', error);
          
          // Increment failed login attempts
          this.incrementLoginAttempts();
          
          let errorMessage = 'Login failed! Check your credentials.';
          
          // Check specific error types and provide detailed feedback
          if (error.code === 'auth/user-not-found') {
            errorMessage = 'Email not found. Please check your email address or create an account.';
          } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password. Please double-check your password or use the eye icon to view it.';
          } else if (error.code === 'auth/invalid-credential') {
            // For invalid-credential, we need to check if email exists to give specific feedback
            const emailExists = await this.checkEmailExists(this.email);
            if (!emailExists) {
              errorMessage = 'Email not found. Please check your email address or create an account.';
            } else {
              errorMessage = 'Incorrect password. Please double-check your password or use the eye icon to view it.';
            }
          } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many failed login attempts. Please try again later.';
          } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email format. Please enter a valid email address.';
          }
          
          // Check if max attempts reached
          if (this.loginAttempts >= this.maxAttempts) {
            this.startLockout();
            this.showAlert(`Maximum login attempts reached. Please wait ${this.formatTime(this.lockoutTime)} before trying again.`, 'error');
          } else {
            // Show error message for failed attempts (but not remaining attempts count)
            this.showAlert(errorMessage, 'error');
          }
        } finally {
          this.isLoading = false;
        }
      },

    async loginWithGoogle() {
      // Check if user is currently locked out
      if (this.isLocked || this.isLoading) {
        this.showAlert(`Too many failed attempts. Please wait ${this.formatTime(this.remainingTime)} before trying again.`, 'error');
        return;
      }

      try {
        this.isLoading = true;
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        // Check if this user exists in Firestore
        const userQuery = query(collection(db, 'users'), where('email', '==', user.email));
        const userSnapshot = await getDocs(userQuery);
        
        // If user doesn't exist in Firestore, create a new user document
        if (userSnapshot.empty) {
          await setDoc(doc(db, 'users', user.uid), {
            userId: user.uid,
            firstName: user.displayName?.split(' ')[0] || '',
            lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
            username: user.email?.split('@')[0] || '',
            email: user.email,
            contactNumber: user.phoneNumber || '',
            photoURL: user.photoURL,
            address: '',
            province: 'Oriental Mindoro',
            municipality: '',
            barangay: '',
            role: 'customer',
            isVerified: true,
            isSeller: false,
            createdAt: new Date(),
            authProvider: 'google'
          });
          
          // Reset login attempts on successful registration/login
          this.resetLoginAttempts();
          this.showAlert('Account created successfully!', 'success');
          setTimeout(() => {
            this.$router.push('/');
          }, 1500);
          this.isLoading = false;
          return;
        }
        
        // User exists, proceed with login
        // Reset login attempts on successful login
        this.resetLoginAttempts();
        await this.processUserLogin(user);
      } catch (error) {
        console.error('Google Login Error:', error);
        let errorMessage = 'Google login failed. Please try again.';
        
        if (error.code === 'auth/operation-not-allowed') {
          errorMessage = 'Google login is not enabled. Contact support.';
        } else if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = 'Login popup was closed. Please try again.';
        }
        
        this.showAlert(errorMessage, 'error');
      } finally {
        this.isLoading = false;
      }
    },

    async processUserLogin(user) {
      let userData = null;
      let collectionName = '';
      let docRefToUpdate = null;

      // Check if user is an admin
      const adminQuery = query(collection(db, 'admins'), where('email', '==', user.email), where('role', '==', 'admin'));
      const adminSnapshot = await getDocs(adminQuery);

      if (!adminSnapshot.empty) {
        userData = adminSnapshot.docs[0].data();
        collectionName = 'admins';
        docRefToUpdate = adminSnapshot.docs[0].ref;
      } else {
        // Check if user is a customer or seller in the 'users' collection
        const userQuery = query(collection(db, 'users'), where('email', '==', user.email));
        const userSnapshot = await getDocs(userQuery);

        if (!userSnapshot.empty) {
          userData = userSnapshot.docs[0].data();
          collectionName = 'users';
          docRefToUpdate = userSnapshot.docs[0].ref;
        }
      }

      if (!userData) {
        this.showAlert('Invalid credentials or unauthorized access.', 'error');
        await auth.signOut();
        return;
      }

      // If Firestore says not verified but Auth email is verified now, auto-sync Firestore flag
      if (user.emailVerified && userData && docRefToUpdate && userData.isVerified === false) {
        try {
          await updateDoc(docRefToUpdate, { isVerified: true });
          userData.isVerified = true; // reflect update locally
        } catch (e) {
          console.warn('Failed to update isVerified flag in Firestore:', e);
        }
      }

      if (!userData.isVerified) {
        this.showAlert('Your account is not verified. Please verify your email or contact support.', 'warning');
        await auth.signOut();
        return;
      }

      try {
        await user.getIdToken(true);
      } catch (tokenError) {
        console.warn('Unable to refresh auth token before redirect:', tokenError);
      }

      // Only store minimal auth state, not user data
      if (this.rememberMe) {
        localStorage.setItem('authPersist', 'true');
        sessionStorage.removeItem('authPersist');
      } else {
        sessionStorage.setItem('authPersist', 'true');
        localStorage.removeItem('authPersist');
      }

      // Reset login attempts on successful login
      this.resetLoginAttempts();

      const role = (userData.role || '').toLowerCase();
      const roleRoutes = {
        admin: '/admin',
        customer: '/',
        seller: '/seller-dashboard'
      };
      const targetRoute = roleRoutes[role];

      if (!targetRoute) {
        this.showAlert('Invalid role assigned to user.', 'error');
        await auth.signOut();
        return;
      }

      this.showAlert('Login Successful!', 'success');
      try {
        await this.$router.push(targetRoute);
      } catch (navError) {
        if (!navError || navError.name !== 'NavigationDuplicated') {
          console.error('Navigation error after login:', navError);
        }
      }
    },
    
    
    togglePassword() {
    this.showPassword = !this.showPassword;
  },
    async checkStoredSession() {
      // Check if user is already authenticated via Firebase Auth
      const user = auth.currentUser;
      if (user) {
        // Check if email is verified for email/password users
        if (user.providerData[0].providerId === 'password' && !user.emailVerified) {
          this.pendingVerificationEmail = user.email;
          this.showAlert('Please verify your email before logging in.', 'warning');
          await auth.signOut();
          return;
        }
        
        // User is authenticated, fetch fresh data from server
        try {
          const userData = await this.fetchUserData(user.email);
          if (userData) {
            // Redirect based on role
            if (userData.role === 'admin') {
              this.$router.push('/admin');
            } else if (userData.role === 'customer') {
              this.$router.push('/');
            } else if (userData.role === 'seller') {
              this.$router.push('/seller-dashboard');
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    },

    async fetchUserData(email) {
      try {
        // Check admin collection first
        const adminQuery = query(collection(db, 'admins'), where('email', '==', email));
        const adminSnapshot = await getDocs(adminQuery);

        if (!adminSnapshot.empty) {
          return adminSnapshot.docs[0].data();
        }

        // Check users collection
        const userQuery = query(collection(db, 'users'), where('email', '==', email));
        const userSnapshot = await getDocs(userQuery);

        if (!userSnapshot.empty) {
          return userSnapshot.docs[0].data();
        }

        return null;
      } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
      }
    },

    async logout() {
      try {
        await auth.signOut();
        localStorage.removeItem("authPersist");
        sessionStorage.removeItem("authPersist");
        this.$router.push("/login");
      } catch (error) {
        console.error('Logout error:', error);
      }
    },

    forgotPassword() {
      this.$router.push('/reset-password');
    },
    
    showAlert(message, type) {
      this.alertMessage = message;
      this.alertType = type;
      setTimeout(() => {
        this.alertMessage = '';
      }, 7000); // Increased timeout to 7 seconds for better readability
    },

    // Login attempt management methods
    incrementLoginAttempts() {
      this.loginAttempts++;
      // Store in sessionStorage to persist during session
      sessionStorage.setItem('loginAttempts', this.loginAttempts.toString());
      sessionStorage.setItem('lastAttemptTime', Date.now().toString());
    },

    async checkEmailExists(email) {
      try {
        // Check in both admins and users collections
        const adminQuery = query(collection(db, 'admins'), where('email', '==', email));
        const adminSnapshot = await getDocs(adminQuery);
        
        if (!adminSnapshot.empty) {
          return true;
        }
        
        const userQuery = query(collection(db, 'users'), where('email', '==', email));
        const userSnapshot = await getDocs(userQuery);
        
        return !userSnapshot.empty;
      } catch (error) {
        console.error('Error checking email existence:', error);
        return false; // If there's an error, assume email doesn't exist
      }
    },

    resetLoginAttempts() {
      this.loginAttempts = 0;
      sessionStorage.removeItem('loginAttempts');
      sessionStorage.removeItem('lastAttemptTime');
      sessionStorage.removeItem('lockoutEndTime');
    },

    startLockout() {
      this.isLocked = true;
      this.remainingTime = this.lockoutTime;
      const lockoutEndTime = Date.now() + this.lockoutTime;
      
      // Store lockout end time in sessionStorage
      sessionStorage.setItem('lockoutEndTime', lockoutEndTime.toString());
      
      this.startCountdown();
    },

    startCountdown() {
      this.countdownInterval = setInterval(() => {
        this.remainingTime -= 1000;
        
        if (this.remainingTime <= 0) {
          this.endLockout();
        }
      }, 1000);
    },

    endLockout() {
      this.isLocked = false;
      this.remainingTime = 0;
      
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
      
      // Reset attempts after lockout
      this.resetLoginAttempts();
      this.showAlert('You can now try logging in again.', 'info');
    },

    formatTime(milliseconds) {
      const totalSeconds = Math.ceil(milliseconds / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },

    checkExistingLockout() {
      const lockoutEndTime = sessionStorage.getItem('lockoutEndTime');
      const storedAttempts = sessionStorage.getItem('loginAttempts');
      
      if (lockoutEndTime) {
        const endTime = parseInt(lockoutEndTime);
        const currentTime = Date.now();
        
        if (currentTime < endTime) {
          // Still locked out
          this.isLocked = true;
          this.remainingTime = endTime - currentTime;
          this.startCountdown();
          this.showAlert(`Account temporarily locked. Please wait ${this.formatTime(this.remainingTime)} before trying again.`, 'error');
        } else {
          // Lockout expired
          this.resetLoginAttempts();
        }
      } else if (storedAttempts) {
        // Restore attempt count if no lockout
        this.loginAttempts = parseInt(storedAttempts);
      }
    },
  },
  mounted() {
    // Check for existing lockout first
    this.checkExistingLockout();
    
    this.checkStoredSession();
    
    // Check if we were redirected from registration
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('registered') === 'true') {
      this.showAlert('Registration successful! Please check your email to verify your account before logging in.', 'success');
    }
  },

  beforeUnmount() {
    // Clean up countdown interval
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
};
</script>

<style scoped>
/* Main Container */

/* Specifically target the password input */
.password-container input {
  border: none;
  background: transparent;
  outline: none;
  flex: 1;
  font-size: 15px;
  color: #333;
  width: 100%;
}
.password-container {
  position: relative;
}

.eye-icon {
  position: absolute;
  right: 15px;
  color: #777;
  cursor: pointer;
  font-size: 15px;
  transition: color 0.3s;
}

.eye-icon:hover {
  color: #2e5c31;
}
.password-toggle {
  margin-left: 10px;
  color: #777;
  cursor: pointer;
  transition: color 0.3s;
}

.password-toggle:hover {
  color: #2e5c31;
}

.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  padding: 20px;
  font-family: 'Arial', sans-serif;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}



/* Logo Container */
.logo-container {
  text-align: center;
  margin-bottom: 15px;
  animation: fadeIn 1s ease-in-out;
}

.logo {
  width: 280px;
  max-width: 100%;
  height: auto;
  margin-bottom: 0;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

.app-title {
  color: #2e5c31;
  font-size: 38px;
  font-weight: bold;
  margin: 0;
  letter-spacing: 2px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

.app-subtitle {
  color: #2e5c31;
  font-size: 18px;
  margin: 0;
  letter-spacing: 4px;
  font-weight: 500;
}

/* Alert Box */
.alert-box {
  padding: 12px;
  margin-bottom: 15px;
  border-radius: 10px;
  text-align: center;
  font-size: 14px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  animation: slideDown 0.3s ease-out;
  transition: all 0.3s ease;
}

.success {
  background: #e6f2ea;
  color: #2e5c31;
  border-left: 5px solid #2e5c31;
}

.warning {
  background: #fff3cd;
  color: #856404;
  border-left: 5px solid #ffc107;
}

.error {
  background: #f8d7da;
  color: #721c24;
  border-left: 5px solid #dc3545;
}

.info {
  background: #d1ecf1;
  color: #0c5460;
  border-left: 5px solid #17a2b8;
}

/* Login Attempts Warning */
.attempts-warning {
  padding: 10px 15px;
  margin-bottom: 15px;
  border-radius: 8px;
  text-align: center;
  font-size: 13px;
  width: 90%;
  max-width: 450px;
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  animation: pulse 2s infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.attempts-warning i {
  color: #f39c12;
  font-size: 14px;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

/* Login Box */
.login-box {
  background: white;
  border-radius: 20px;
  padding: 30px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.5s ease-in-out;
  transition: transform 0.3s ease;
  margin-bottom: 15px;
}

.login-box:hover {
  transform: translateY(-5px);
}

/* Input Fields */
.input-container {
  display: flex;
  align-items: center;
  background: #f7f7f7;
  border-radius: 50px;
  padding: 14px 18px;
  margin-bottom: 15px;
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.input-container:focus-within {
  border-color: #2e5c31;
  background: #ffffff;
}
.password-container input:focus {
  outline: none !important;
  box-shadow: none !important;
  -webkit-box-shadow: none !important;
  -moz-box-shadow: none !important;
  -webkit-appearance: none !important;
  appearance: none !important;
}

.icon {
  margin-right: 15px;
  color: #2e5c31;
  font-size: 18px;
}

input[type="email"],
input[type="password"] {
  border: none;
  background: transparent;
  outline: none;
  flex: 1;
  font-size: 15px;
  color: #333;
  width: 100%;
}

input::placeholder {
  color: #999;
}

/* Options - Keep on same row */
.options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  margin-bottom: 20px;
  flex-wrap: nowrap; /* Prevent wrapping */
}

/* Custom Checkbox */
.remember-me {
  display: flex;
  align-items: center;
  position: relative;
  padding-left: 30px;
  cursor: pointer;
  user-select: none;
  white-space: nowrap; /* Prevent wrapping */
}

.remember-me input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  top: -2px; /* Adjusted from 0px to -2px to move it higher */
  left: 0;
  height: 20px;
  width: 20px;
  background-color: #f7f7f7;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.remember-me:hover input ~ .checkmark {
  background-color: #eee;
}

.remember-me input:checked ~ .checkmark {
  background-color: #2e5c31;
  border-color: #2e5c31;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.remember-me input:checked ~ .checkmark:after {
  display: block;
}

.remember-me .checkmark:after {
  left: 7px;
  top: 3px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.forgot-password {
  color: #2e5c31;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
  white-space: nowrap; /* Prevent wrapping */
}

.forgot-password:hover {
  color: #1e3e21;
  text-decoration: underline;
}

/* Login Button */
.login-button {
  background: linear-gradient(to right, #2e5c31, #3a7d3e);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 14px;
  width: 100%;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(46, 92, 49, 0.3);
  letter-spacing: 1px;
}

.login-button:hover {
  background: linear-gradient(to right, #26492a, #2e5c31);
  box-shadow: 0 6px 15px rgba(46, 92, 49, 0.4);
  transform: translateY(-2px);
}

.login-button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 5px rgba(46, 92, 49, 0.4);
}

/* Locked button state */
.login-button.locked {
  background: linear-gradient(to right, #dc3545, #c82333);
  cursor: not-allowed;
  opacity: 0.8;
}

.login-button.locked:hover {
  background: linear-gradient(to right, #dc3545, #c82333);
  transform: none;
  box-shadow: 0 4px 10px rgba(220, 53, 69, 0.3);
}

.login-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

/* Loading state */
.login-button.loading,
.google-button.loading {
  position: relative;
  pointer-events: none;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  display: inline-block;
  margin-right: 8px;
  animation: spin 0.8s linear infinite;
}

/* Dark spinner for light button */
.google-button.loading .spinner {
  border-color: rgba(0, 0, 0, 0.2);
  border-top-color: #333;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Social Login Divider */
.social-divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 20px 0;
}

.social-divider::before,
.social-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e0e0e0;
}

.social-divider span {
  padding: 0 15px;
  color: #777;
  font-size: 14px;
  background: white;
}

/* Google Button */
.google-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  color: #444;
  border: 1px solid #ddd;
  border-radius: 50px;
  padding: 12px;
  width: 100%;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.google-button:hover {
  background: #f8f8f8;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.google-button.locked {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
  opacity: 0.6;
}

.google-button.locked:hover {
  background: #f5f5f5;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.google-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.google-icon {
  width: 20px;
  height: 20px;
  margin-right: 10px;
}

/* Sign Up Text */
.signup-text {
  text-align: center;
  font-size: 14px;
  margin-top: 20px;
  margin-bottom: 0;
  color: #555;
}

.signup-link {
  color: #2e5c31;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s;
}

.signup-link:hover {
  color: #1e3e21;
  text-decoration: underline;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Responsive Design - Keep consistent layout */
@media (max-width: 768px) {
  .login-box {
    padding: 25px;
  }
  
  .app-title {
    font-size: 32px;
  }
  
  .app-subtitle {
    font-size: 16px;
  }
  
  .logo {
    width: 240px;
  }
  
  /* Keep options on same row */
  .options {
    font-size: 12px;
  }
  
  .remember-me {
    padding-left: 25px;
  }
  
  .checkmark {
    height: 18px;
    width: 18px;
  }
}

@media (max-height: 700px) {
  .logo {
    width: 200px;
  }
  
  .app-title {
    font-size: 30px;
  }
  
  .app-subtitle {
    font-size: 14px;
  }
  
  .login-box {
    padding: 20px;
  }
  
  .input-container {
    padding: 10px 15px;
    margin-bottom: 10px;
  }
  
  .options {
    margin-bottom: 15px;
  }
}

@media (max-width: 480px) {
  .login-box {
    padding: 20px;
  }
  
  .input-container {
    padding: 12px 15px;
  }
  
  /* Keep options on same row */
  .options {
    font-size: 11px;
  }
  
  .remember-me {
    padding-left: 22px;
  }
  
  .checkmark {
    height: 16px;
    width: 16px;
    top: 1px;
  }
  
  .app-title {
    font-size: 28px;
  }
  
  .app-subtitle {
    font-size: 14px;
  }
  
  .logo {
    width: 220px;
  }
  
  .attempts-warning {
    font-size: 12px;
    padding: 8px 12px;
  }
}

/* For very small screens */
@media (max-width: 360px) {
  .login-box {
    padding: 15px;
  }
  
  .options {
    font-size: 10px;
  }
  
  .remember-me {
    padding-left: 20px;
  }
  
  .checkmark {
    height: 14px;
    width: 14px;
  }
  
  .attempts-warning {
    font-size: 11px;
    padding: 6px 10px;
  }
}
</style>