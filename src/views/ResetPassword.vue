<template>
  <div class="reset-container">
    <div class="alert-box" v-if="message" :class="messageType">
      {{ message }}
    </div>

    <div class="reset-box">
      <div class="header">
        <span class="back-icon" @click="$router.push('/login')">&larr;</span>
        <h2>FORGOT PASSWORD</h2>
        <span class="menu-icon">&#9776;</span>
      </div>

      <img src="@/assets/lock.png" alt="Lock Icon" class="lock-icon" />
      <h3>Trouble Logging in?</h3>
      <p>Enter your email and we'll send you a link to reset your password.</p>
      <input type="email" v-model="email" placeholder="Email" />
      <button class="reset-button" @click="sendResetLink">Reset Password</button>

      <div class="footer" @click="$router.push('/login')">
        Return to Login Page
      </div>
    </div>
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
      this.message = ''; // Reset message before attempting

      try {
        await sendPasswordResetEmail(auth, this.email);
        this.message = 'Password reset email sent! Please check your inbox for instructions.';
        this.messageType = 'success';

        setTimeout(() => {
          this.$router.push('/login');
        }, 3000);
      } catch (error) {
        console.error('Error sending reset email:', error);
        this.message = 'Please enter a valid email address.';
        this.messageType = 'error';
      }
    },
  },
};
</script>

<style scoped>
.reset-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background: #e0e0e0;
  padding: 20px;
}

.alert-box {
  width: 100%;
  max-width: 400px;
  text-align: center;
  padding: 10px;
  margin-bottom: 15px;
  border-radius: 5px;
  font-weight: bold;
}

.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.reset-box {
  background: white;
  border-radius: 20px;
  padding: 20px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  text-align: center;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #2e5c31;
  color: white;
  padding: 15px;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
}

h2 {
  font-size: 20px;
  margin: 0;
  flex: 1;
  text-align: center;
}

.back-icon,
.menu-icon {
  cursor: pointer;
  font-size: 20px;
}

.lock-icon {
  width: 80px;
  margin: 20px 0;
}

h3 {
  font-size: 18px;
  color: #333;
  font-weight: bold;
}

p {
  font-size: 14px;
  color: #777;
}

input[type="email"] {
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border-radius: 50px;
  border: 1px solid #ccc;
  font-size: 14px;
  outline: none;
}

.reset-button {
  background: #2e5c31;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 10px;
  width: 100%;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
  margin-top: 10px;
}

.reset-button:hover {
  background: #26492a;
}

.footer {
  background: #2e5c31;
  color: white;
  padding: 15px;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  cursor: pointer;
  margin-top: 20px;
}

@media (max-width: 480px) {
  .reset-box {
    padding: 15px;
  }
  h2 {
    font-size: 18px;
  }
  .reset-button {
    font-size: 14px;
  }
  input[type="email"] {
    font-size: 12px;
  }
}
</style>
