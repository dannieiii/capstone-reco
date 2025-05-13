<template>
  <div class="register-container">
    <!-- Alert Box -->
    <div v-if="alertMessage" :class="['alert-box', alertType]">
      {{ alertMessage }}
    </div>

    <div class="header">
      <span class="back-icon"><a href="/login">←</a></span>
      <h2>CREATE ADMIN ACCOUNT</h2>
    </div>

    <div class="register-box">
      <input type="text" v-model="firstName" placeholder="First Name" required />
      <input type="text" v-model="lastName" placeholder="Last Name" required />
      <input type="text" v-model="username" placeholder="Username" required />
      <input type="email" v-model="email" placeholder="Email" required />
      <input type="text" v-model="contactNumber" placeholder="Contact Number" required />
      <input type="text" v-model="address" placeholder="Address" required />
      <input type="text" v-model="position" placeholder="Position" required />

      <div class="input-container">
        <input :type="showPassword ? 'text' : 'password'" v-model="password" placeholder="Password" required />
        <span class="eye-icon" @click="togglePassword">
          <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
        </span>
      </div>
      <div class="input-container">
        <input :type="showConfirmPassword ? 'text' : 'password'" v-model="confirmPassword" placeholder="Confirm Password" required />
        <span class="eye-icon" @click="toggleConfirmPassword">
          <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
        </span>
      </div>

      <button class="register-button" @click="register">Create Admin Account</button>
    </div>
  </div>
</template>

<script>
import { auth, db } from '../../firebase/firebaseConfig';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default {
  data() {
    return {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      contactNumber: '',
      address: '',
      position: '',
      role: 'admin', // Role is fixed as "admin"
      password: '',
      confirmPassword: '',
      showPassword: false,
      showConfirmPassword: false,
      alertMessage: '',
      alertType: ''
    };
  },
  methods: {
    togglePassword() {
      this.showPassword = !this.showPassword;
    },
    toggleConfirmPassword() {
      this.showConfirmPassword = !this.showConfirmPassword;
    },
    showAlert(message, type) {
      this.alertMessage = message;
      this.alertType = type;
      setTimeout(() => {
        this.alertMessage = '';
      }, 3000);
    },
    async register() {
      if (this.password !== this.confirmPassword) {
        this.showAlert('Passwords do not match!', 'error');
        return;
      }
      if (!this.firstName || !this.lastName || !this.username || !this.email || !this.contactNumber || !this.address || !this.position) {
        this.showAlert('Please fill out all fields.', 'error');
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, this.email, this.password);
        const user = userCredential.user;
        await sendEmailVerification(user);
        this.showAlert('Verification email sent! Please check your inbox.', 'success');

        // Store in the "admins" collection instead of "users"
        await setDoc(doc(db, 'admins', user.uid), {
          userId: user.uid,
          firstName: this.firstName,
          lastName: this.lastName,
          username: this.username,
          email: this.email,
          contactNumber: this.contactNumber,
          address: this.address,
          position: this.position,
          role: this.role, // Always "admin"
          isVerified: false
        });

        setTimeout(() => {
          this.$router.push('/login');
        }, 2000);
      } catch (error) {
        console.error('Error during registration:', error);
        this.showAlert('Registration failed! Check console for details.', 'error');
      }
    }
  }
};
</script>

<style scoped>
.register-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f4f4f9;
  padding: 20px;
}

.header {
  background: #2e5c31;
  width: 100%;
  max-width: 380px;
  padding: 10px;
  text-align: center;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.back-icon {
  position: absolute;
  left: 15px;
  top: 10px;
  color: white;
  cursor: pointer;
  font-size: 20px;
}

h2 {
  color: white;
  font-size: 22px;
  margin: 0;
}

.alert-box {
  width: 100%;
  max-width: 380px;
  padding: 10px;
  margin-top: 10px;
  border-radius: 10px;
  text-align: center;
  font-size: 14px;
  font-weight: bold;
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

.register-box {
  background: white;
  border-radius: 20px;
  padding: 20px;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-top: 10px;
}

input[type="email"],
input[type="text"],
input[type="password"],
select {
  width: 100%;
  padding: 10px 15px;
  margin: 8px 0;
  border-radius: 25px;
  border: 1px solid #ccc;
  outline: none;
  font-size: 14px;
  box-sizing: border-box;
}

.input-container {
  position: relative;
}

.eye-icon {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #999;
}

.register-button {
  background: #2e5c31;
  color: white;
  border: none;
  border-radius: 25px;
  padding: 10px;
  width: 100%;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s;
  margin-top: 10px;
}

.register-button:hover {
  background: #26492a;
}
</style>
