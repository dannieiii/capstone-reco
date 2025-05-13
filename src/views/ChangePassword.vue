<template>
    <div>
      <h2>Change Your Password</h2>
      <input type="password" v-model="newPassword" placeholder="New Password" />
      <button @click="changePassword">Change Password</button>
    </div>
  </template>
  
  <script>
  import { auth } from '../firebase/firebaseConfig';
  import { confirmPasswordReset } from 'firebase/auth';
  
  export default {
    data() {
      return {
        newPassword: '',
        oobCode: '', // This will hold the reset code from the URL
      };
    },
    created() {
      // Get the reset code (oobCode) from the URL query parameter
      const urlParams = new URLSearchParams(window.location.search);
      this.oobCode = urlParams.get('oobCode');
    },
    methods: {
      // Change password method
      async changePassword() {
        try {
          if (this.oobCode && this.newPassword) {
            // Use the oobCode to confirm the password reset
            await confirmPasswordReset(auth, this.oobCode, this.newPassword);
            alert('Your password has been successfully changed!');
            this.$router.push('/login');
          } else {
            alert('Please enter a valid password.');
          }
        } catch (error) {
          console.error('Error changing password:', error);
          alert('Error changing password. Please try again.');
        }
      },
    },
  };
  </script>
  