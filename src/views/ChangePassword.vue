<template>
  <div class="change-password-container">
    <div class="logo-container">
      <img src="@/assets/logo.png" alt="FarmXpress Logo" class="logo" />
      <div class="title-container">
        <h1 class="app-title">FarmXpress</h1>
        <h3 class="app-subtitle">MOBILE APP</h3>
      </div>
    </div>

    <!-- Alert Box -->
    <div v-if="message" :class="['alert-box', messageType]">
      {{ message }}
    </div>

    <div class="change-password-box">
      <h2 class="change-password-title">Create New Password</h2>
      
      <div class="lock-icon-container">
        <i class="fas fa-key lock-icon"></i>
      </div>
      
      <p class="instruction-text">Please enter your new password below.</p>
      
      <div class="input-container password-container">
        <i class="fas fa-lock icon"></i>
        <input :type="showPassword ? 'text' : 'password'" v-model="newPassword" placeholder="New Password" required />
        <span class="eye-icon" @click="togglePassword">
          <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
        </span>
      </div>
      
      <div class="input-container password-container">
        <i class="fas fa-lock icon"></i>
        <input :type="showConfirmPassword ? 'text' : 'password'" v-model="confirmPassword" placeholder="Confirm Password" required />
        <span class="eye-icon" @click="toggleConfirmPassword">
          <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
        </span>
      </div>
      
      <button class="change-button" @click="changePassword">Change Password</button>
      
      <p class="login-link">Remember your password? <a href="/login">Back to Login</a></p>
    </div>
    <div class="bottom-space"></div>
  </div>
</template>

<script>
import { auth } from '../firebase/firebaseConfig';
import { confirmPasswordReset } from 'firebase/auth';

export default {
  data() {
    return {
      newPassword: '',
      confirmPassword: '',
      oobCode: '', // This will hold the reset code from the URL
      showPassword: false,
      showConfirmPassword: false,
      message: '',
      messageType: '',
    };
  },
  created() {
    // Get the reset code (oobCode) from the URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    this.oobCode = urlParams.get('oobCode');
    
    if (!this.oobCode) {
      this.message = 'Invalid or expired password reset link. Please request a new one.';
      this.messageType = 'error';
    }
  },
  methods: {
    togglePassword() {
      this.showPassword = !this.showPassword;
    },
    toggleConfirmPassword() {
      this.showConfirmPassword = !this.showConfirmPassword;
    },
    // Change password method
    async changePassword() {
      if (!this.oobCode) {
        this.message = 'Invalid or expired password reset link. Please request a new one.';
        this.messageType = 'error';
        return;
      }
      
      if (!this.newPassword) {
        this.message = 'Please enter a new password.';
        this.messageType = 'warning';
        return;
      }
      
      if (this.newPassword !== this.confirmPassword) {
        this.message = 'Passwords do not match.';
        this.messageType = 'error';
        return;
      }
      
      if (this.newPassword.length < 6) {
        this.message = 'Password should be at least 6 characters.';
        this.messageType = 'warning';
        return;
      }
      
      try {
        // Use the oobCode to confirm the password reset
        await confirmPasswordReset(auth, this.oobCode, this.newPassword);
        this.message = 'Your password has been successfully changed!';
        this.messageType = 'success';
        
        setTimeout(() => {
          this.$router.push('/login');
        }, 3000);
      } catch (error) {
        console.error('Error changing password:', error);
        
        let errorMessage = 'Error changing password. Please try again.';
        if (error.code === 'auth/expired-action-code') {
          errorMessage = 'This password reset link has expired. Please request a new one.';
        } else if (error.code === 'auth/invalid-action-code') {
          errorMessage = 'Invalid password reset link. Please request a new one.';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'Password should be at least 6 characters.';
        }
        
        this.message = errorMessage;
        this.messageType = 'error';
      }
    },
  },
};
</script>

<style scoped>
/* Main Container */
.change-password-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  padding: 20px;
  font-family: 'Arial', sans-serif;
  overflow-y: auto;
  position: relative;
}

/* Logo Container */
.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  animation: fadeIn 1s ease-in-out;
  margin-top: 30px; /* Added top margin */
}

.logo {
  width: 180px;
  height: auto;
  margin-right: 15px; /* Space between logo and text */
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

.title-container {
  text-align: left;
}

.app-title {
  color: #2e5c31;
  font-size: 38px;
  font-weight: bold;
  margin: 0;
  letter-spacing: 2px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  line-height: 1;
}

.app-subtitle {
  color: #2e5c31;
  font-size: 16px;
  margin: 0;
  letter-spacing: 4px;
  font-weight: 500;
}

/* Alert Box */
.alert-box {
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 10px;
  text-align: center;
  font-size: 14px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  animation: slideDown 0.3s ease-out;
  transition: all 0.3s ease;
}

.success {
  background: #d4edda;
  color: #155724;
  border-left: 5px solid #28a745;
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

/* Change Password Box */
.change-password-box {
  background: white;
  border-radius: 20px;
  padding: 35px 40px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.5s ease-in-out;
  transition: transform 0.3s ease;
  overflow: visible;
  margin-bottom: 30px;
}

.change-password-box:hover {
  transform: translateY(-5px);
}

.change-password-title {
  color: #2e5c31;
  text-align: center;
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 600;
}

/* Lock Icon */
.lock-icon-container {
  text-align: center;
  margin: 20px 0;
}

.lock-icon {
  font-size: 60px;
  color: #2e5c31;
  background: #e8f5e9;
  padding: 20px;
  border-radius: 50%;
  box-shadow: 0 4px 10px rgba(46, 92, 49, 0.2);
}

.instruction-text {
  text-align: center;
  font-size: 15px;
  color: #666;
  margin-bottom: 25px;
}

/* Input Fields */
.input-container {
  display: flex;
  align-items: center;
  background: #f7f7f7;
  border-radius: 50px;
  padding: 15px 20px;
  margin-bottom: 20px;
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.input-container:focus-within {
  border-color: #2e5c31;
  box-shadow: 0 0 0 2px rgba(46, 92, 49, 0.2);
  background: #ffffff;
}

.icon {
  margin-right: 15px;
  color: #2e5c31;
  font-size: 18px;
}

input[type="password"] {
  border: none;
  background: transparent;
  outline: none;
  flex: 1;
  font-size: 16px;
  color: #333;
  width: 100%;
}

input::placeholder {
  color: #999;
}

/* Password Container */
.password-container {
  position: relative;
}

.eye-icon {
  position: absolute;
  right: 20px;
  color: #777;
  cursor: pointer;
  font-size: 16px;
  transition: color 0.3s;
}

.eye-icon:hover {
  color: #2e5c31;
}

/* Change Button */
.change-button {
  background: linear-gradient(to right, #2e5c31, #3a7d3e);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 15px;
  width: 100%;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(46, 92, 49, 0.3);
  letter-spacing: 1px;
}

.change-button:hover {
  background: linear-gradient(to right, #26492a, #2e5c31);
  box-shadow: 0 6px 15px rgba(46, 92, 49, 0.4);
  transform: translateY(-2px);
}

.change-button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 5px rgba(46, 92, 49, 0.4);
}

/* Login Link */
.login-link {
  text-align: center;
  font-size: 14px;
  margin-top: 25px;
  margin-bottom: 0;
  color: #555;
}

.login-link a {
  color: #2e5c31;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s;
}

.login-link a:hover {
  color: #1e3e21;
  text-decoration: underline;
}

/* Bottom Space */
.bottom-space {
  height: 60px; /* Added extra space at the bottom */
  width: 100%;
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

/* Responsive Design */
@media (max-width: 768px) {
  .change-password-box {
    padding: 30px;
    width: 95%;
  }
  
  .app-title {
    font-size: 32px;
  }
  
  .app-subtitle {
    font-size: 16px;
  }
  
  .logo {
    width: 140px;
  }
  
  .logo-container {
    flex-direction: column;
    text-align: center;
  }
  
  .logo {
    margin-right: 0;
    margin-bottom: 10px;
  }
  
  .title-container {
    text-align: center;
  }
  
  .bottom-space {
    height: 40px;
  }
}

@media (max-width: 480px) {
  .change-password-box {
    padding: 25px;
  }
  
  .input-container {
    padding: 12px 15px;
  }
  
  .app-title {
    font-size: 28px;
  }
  
  .app-subtitle {
    font-size: 14px;
  }
  
  .logo {
    width: 120px;
  }
  
  .lock-icon {
    font-size: 50px;
    padding: 15px;
  }
}
</style>