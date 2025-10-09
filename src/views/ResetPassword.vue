<template>
  <div class="reset-container">
    <div class="logo-container">
  <img src="@/assets/farmxpres-icon (green).png" alt="FarmXpress Logo" class="logo" />
      <div class="title-container">
        <h1 class="app-title">FarmXpress</h1>
        <h3 class="app-subtitle">MOBILE APP</h3>
      </div>
    </div>

    <!-- Alert Box -->
    <div v-if="message" :class="['alert-box', messageType]">
      {{ message }}
    </div>

    <div class="reset-box">
      <h2 class="reset-title">Reset Password</h2>
      
      <div class="lock-icon-container">
        <i class="fas fa-lock lock-icon"></i>
      </div>
      
      <h3 class="trouble-text">Trouble Logging In?</h3>
      <p class="instruction-text">Enter your email and we'll send you a link to reset your password.</p>
      
      <div class="input-container">
        <i class="fas fa-envelope icon"></i>
        <input type="email" v-model="email" placeholder="Email" />
      </div>
      
      <button class="reset-button" @click="sendResetLink">Send Reset Link</button>
      
      <p class="login-link">Remember your password? <a href="/login">Back to Login</a></p>
    </div>
    <div class="bottom-space"></div>
  </div>
</template>

<script>
import { auth } from '../firebase/firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';

export default {
  data() {
    return {
      email: '',
      message: '',
      messageType: '', // success or error
    };
  },
  methods: {
    async sendResetLink() {
      if (!this.email) {
        this.message = 'Please enter your email address.';
        this.messageType = 'warning';
        return;
      }
      
      try {
        await sendPasswordResetEmail(auth, this.email);
        this.message = 'Password reset email sent! Please check your inbox for instructions.';
        this.messageType = 'success';

        setTimeout(() => {
          this.$router.push('/login');
        }, 5000);
      } catch (error) {
        console.error('Error sending reset email:', error);
        
        let errorMessage = 'Failed to send reset email. Please try again.';
        if (error.code === 'auth/user-not-found') {
          errorMessage = 'No account found with this email address.';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Please enter a valid email address.';
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
.reset-container {
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

/* Reset Box */
.reset-box {
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

.reset-box:hover {
  transform: translateY(-5px);
}

.reset-title {
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

.trouble-text {
  text-align: center;
  font-size: 20px;
  color: #333;
  margin-bottom: 10px;
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
  margin-bottom: 25px;
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

input[type="email"] {
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

/* Reset Button */
.reset-button {
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

.reset-button:hover {
  background: linear-gradient(to right, #26492a, #2e5c31);
  box-shadow: 0 6px 15px rgba(46, 92, 49, 0.4);
  transform: translateY(-2px);
}

.reset-button:active {
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
  .reset-box {
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
  .reset-box {
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