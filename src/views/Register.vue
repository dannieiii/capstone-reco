<template>
  <div class="register-container">
    <div class="logo-container">
      <img src="@/assets/logo.png" alt="FarmXpress Logo" class="logo" />
      <div class="title-container">
        <h1 class="app-title">FarmXpress</h1>
        <h3 class="app-subtitle">MOBILE APP</h3>
      </div>
    </div>

    <!-- Alert Box -->
    <div v-if="alertMessage" :class="['alert-box', alertType]">
      {{ alertMessage }}
    </div>

    <div class="register-box">
      <h2 class="register-title">Create Account</h2>
      
      <!-- Google Registration Button -->
      <button class="google-button" @click="registerWithGoogle">
        <img src="@/assets/google.png" alt="Google" class="google-icon" />
        Continue with Google
      </button>
      
      <div class="social-divider">
        <span>or register with email</span>
      </div>
      
      <div class="form-grid">
        <div class="input-container">
          <i class="fas fa-user icon"></i>
          <input type="text" v-model="firstName" placeholder="First Name" required />
        </div>
        
        <div class="input-container">
          <i class="fas fa-user icon"></i>
          <input type="text" v-model="lastName" placeholder="Last Name" required />
        </div>
        
        <div class="input-container">
          <i class="fas fa-at icon"></i>
          <input type="text" v-model="username" placeholder="Username" required />
        </div>
        
        <div class="input-container">
          <i class="fas fa-envelope icon"></i>
          <input type="email" v-model="email" placeholder="Email" required />
        </div>
        
        <div class="input-container">
          <i class="fas fa-phone icon"></i>
          <input type="text" v-model="contactNumber" placeholder="Contact Number" required />
        </div>
        
        <div class="input-container location-select">
          <i class="fas fa-map-marker-alt icon"></i>
          <select v-model="selectedProvince" disabled>
            <option value="Oriental Mindoro">Oriental Mindoro</option>
          </select>
        </div>
        
        <div class="input-container location-select">
          <i class="fas fa-city icon"></i>
          <select v-model="selectedMunicipality" @change="updateBarangays" required>
            <option value="" disabled selected>Select Municipality/City</option>
            <option v-for="municipality in municipalities" :value="municipality" :key="municipality">
              {{ municipality }}
            </option>
          </select>
        </div>
        
        <div class="input-container location-select">
          <i class="fas fa-map-pin icon"></i>
          <select v-model="selectedBarangay" required>
            <option value="" disabled selected>Select Barangay</option>
            <option v-for="barangay in barangays" :value="barangay" :key="barangay">
              {{ barangay }}
            </option>
          </select>
        </div>
      </div>
      
      <!-- Password fields in their own section for chronological order -->
      <div class="password-section">
        <div class="input-container password-container">
          <i class="fas fa-lock icon"></i>
          <input :type="showPassword ? 'text' : 'password'" v-model="password" placeholder="Password" required />
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
      </div>

      <button class="register-button" @click="register">Create Account</button>

      <p class="login-link">Already have an account? <a href="/login">Login here</a></p>
    </div>
  </div>
</template>

<script>
// Script remains unchanged
import { auth, db, googleProvider } from '../firebase/firebaseConfig';
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithPopup, GoogleAuthProvider, signOut, fetchSignInMethodsForEmail, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';

// Sample data for Oriental Mindoro municipalities and barangays
const orientalMindoroData = {
  "Baco": ["Alag", "Bangkatan", "Burbuli", "Catwiran I", "Catwiran II", "Dulangan I", "Dulangan II", "Lumangbayan", "Malapad", "Mangangan I", "Mangangan II", "Mayabig", "Pambisan", "Poblacion", "Pulang-Tubig", "Putican-Cabulo", "San Andres", "San Ignacio", "Santa Cruz", "Santa Rosa I", "Santa Rosa II", "Tabon-Tabon", "Tagumpay", "Water"],
  "Bansud": ["Alcate", "Bato", "Buenavista", "Burgos", "Cambunang", "Canaan", "Daguit", "Marfrancisco", "Pag-asa", "Poblacion", "Proper Bansud", "Proper Tiguisan", "Rosacara", "Salcedo", "Sumagui", "Villa Pag-asa"],
  "Bongabong": ["Anilao", "Aplaya", "Bagong Bayan I", "Bagong Bayan II", "Batangan", "Bukal", "Camantigue", "Carmen", "Cawayan", "Dayhagan", "Formon", "Hagan", "Hagupit", "Ilasan", "Kaligtasan", "Labasan", "Mag-asawang Tubig", "Malitbog", "Mapang", "Masaguisi", "Morente", "Ogbot", "Orconuma", "Poblacion", "Polusahi", "Sagana", "San Isidro", "San Jose", "San Juan", "Santa Cruz", "Sinanlaban", "Tawas", "Villa M. Principe"],
  "Bulalacao": ["Bagong Sikat", "Balatasan", "Benli", "Cabugao", "Cambunang", "Camilmil", "Giagan", "Maasin", "Maujao", "Milagrosa", "Nasukob", "Poblacion", "San Francisco", "San Isidro", "San Juan", "San Roque", "Siguian"],
  "Calapan": ["Balingayan", "Balite", "Baruyan", "Batino", "Bayanan I", "Bayanan II", "Bulusan", "Comunal", "Guinobatan", "Gutad", "Ibaba East", "Ibaba West", "Ilaya", "Lalud", "Lazareto", "Libis", "Lumangbayan", "Mahabang Parang", "Maidlang", "Malad", "Malamig", "Managpi", "Masipit", "Nag-Iba I", "Nag-Iba II", "Navotas", "Pachoca", "Palhi", "Panggalaan", "Parang", "Patas", "Puting Tubig", "San Antonio", "San Vicente Central", "San Vicente East", "San Vicente North", "San Vicente South", "San Vicente West", "Sta. Cruz", "Sta. Isabel", "Sta. Maria Village", "Sto. Niño", "Sapul", "Silonay", "Sta. Rita", "Sucol", "Suqui", "Tawagan", "Tawiran", "Tibag", "Wawa"],
  "Gloria": ["Agos", "Agustin", "Andres Bonifacio", "Balete", "Banus", "Banutan", "Buong Lupa", "Bulaklakan", "Gaudencio Antonio", "Guimbonan", "Kawit", "Lucio Laurel", "Macario Adriatico", "Malabo", "Maligaya", "Malubay", "Manguyang", "Maragooc", "Mirayan", "Narra", "Papandungin", "San Antonio", "Santa Maria", "Santo Niño", "Talaban", "Tambong", "Tigbao", "Villa Hermosa", "Villahermosa", "Villarico"],
  "Mansalay": ["B. Del Mundo", "Balugo", "Bonbon", "Budburan", "Cabdangan", "Caflanan", "Don Pedro", "Maliwanag", "Manaul", "Panaytayan", "Poblacion", "Roma", "Santa Brigida", "Santa Maria", "Villa Celestial", "Wasig"],
  "Naujan": ["Adrialuna", "Antipolo", "Apitong", "Arangin", "Aurora", "Bacungan", "Bagong Buhay", "Bancuro", "Barcenaga", "Bayani", "Buhangin", "Concepcion", "Dao", "Del Pilar", "Estrella", "Evangelista", "Gamao", "General Esco", "Herera", "Inarawan", "Kalinisan", "Laguna", "Andres Ilagan", "Mabini", "Andres Bonifacio", "Maharika", "Malaya", "Malinao", "Malvar", "Masagana", "Masaguing", "Melgar A", "Melgar B", "Metolza", "Montelago", "Montemayor", "Motoderazo", "Mulawin", "Nag-Iba I", "Nag-Iba II", "Pagkakaisa", "Paniquian", "Pinagsabangan I", "Pinagsabangan II", "Poblacion I", "Poblacion II", "Poblacion III", "Sampaguita", "San Agustin I", "San Agustin II", "San Andres", "San Antonio", "San Carlos", "San Isidro", "San Jose", "San Luis", "San Nicolas", "San Pedro", "Santa Cruz", "Santa Isabel", "Santa Maria", "Santiago", "Santo Niño", "Tagumpay", "Tigkan"],
  "Pinamalayan": ["Anoling", "Bacungan", "Bangbang", "Banus", "Buli", "Caguray", "Calingag", "Del Razon", "Guinhawa", "Inclanay", "Lumambayan", "Malaya", "Maliangcog", "Maningcol", "Marayos", "Marfrancisco", "Nabuslot", "Pagalagala", "Palayan", "Pambisan", "Panikihan", "Pili", "Quinabigan", "Ranzo", "Rosario", "Sabang", "Santa Isabel", "Santa Maria", "Santa Rita", "Santo Niño", "Wawa"],
  "Pola": ["Bacawan", "Bacungan", "Batuhan", "Bayanan", "Biga", "Buhay Na Tubig", "Calima", "Casiligan", "Malibago", "Maluanluan", "Matulatula", "Munting Mapino", "Pahilahan", "Panikihan", "Poblacion", "Pula", "Puting Cacao", "Tagbakin", "Tiguihan"],
  "Puerto Galera": ["Aninuan", "Balanoy", "Balatero", "Dulangan", "Palangan", "Sabang", "San Antonio", "San Isidro", "Santo Niño", "Tabinay", "Villaflor"],
  "Roxas": ["Bagumbayan", "Barangay I", "Barangay II", "Barangay III", "Barangay IV", "Barangay V", "Barangay VI", "Barangay VII", "Barangay VIII", "Barangay IX", "Barangay X", "Barangay XI", "Barangay XII", "Cantil", "Dangay", "Happy Valley", "Libertad", "Libtong", "Lumangbayan", "Malaga", "Maraska", "Odiong", "Paclasan", "San Aquilino", "San Isidro", "San Jose", "San Mariano", "San Miguel", "San Rafael", "San Vicente", "Sta. Cruz", "Sta. Elena", "Sta. Maria", "Sto. Niño", "Wawa"],
  "San Teodoro": ["Bigaan", "Caagutayan", "Calangatan", "Calsapa", "Ilag", "Lumangbayan", "Poblacion", "Tacligan"],
  "Socorro": ["Bato", "Bayuin", "Bugtong Na Tuog", "Calocmay", "Catiningan", "F. Tantoco", "Happy Valley", "Leuteboro", "Lumangbayan", "Matungao", "Monteverde", "Poblacion I", "Poblacion II", "Poblacion III", "Poblacion IV", "Poblacion V", "Poblacion VI", "Poblacion VII", "Poblacion VIII", "Santo Domingo", "Villaflor"],
  "Victoria": ["Alcate", "Antipolo", "Bacungan", "Bagong Buhay", "Bambanin", "Bethel", "Canaan", "Concepcion", "Duongan", "Loyal", "Mabini", "Macatoc", "Malabo", "Mercedes", "Ogbot", "Orion", "San Antonio", "San Cristobal", "San Gabriel", "San Gelacio", "San Isidro", "San Juan", "San Narciso", "Urdaneta"]
};

export default {
  data() {
    return {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      contactNumber: '',
      selectedProvince: 'Oriental Mindoro',
      selectedMunicipality: '',
      selectedBarangay: '',
      municipalities: Object.keys(orientalMindoroData),
      barangays: [],
      role: 'customer',
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
    updateBarangays() {
      this.barangays = orientalMindoroData[this.selectedMunicipality] || [];
      this.selectedBarangay = '';
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
      if (!this.firstName || !this.lastName || !this.username || !this.email || !this.contactNumber || !this.selectedMunicipality || !this.selectedBarangay) {
        this.showAlert('Please fill out all fields.', 'error');
        return;
      }

      try {
        // First check if email exists in Firebase Authentication
        try {
          // This attempts to fetch sign-in methods for the email
          const methods = await fetchSignInMethodsForEmail(auth, this.email);
          if (methods && methods.length > 0) {
            this.showAlert('This email is already registered. Please login instead.', 'error');
            return;
          }
        } catch (error) {
          // If there's an error checking, proceed (might be email doesn't exist)
          console.log('Email check:', error);
        }

        // Then check Firestore users collection
        const userQuery = query(collection(db, 'users'), where('email', '==', this.email));
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          this.showAlert('This email is already registered in our system. Please login instead.', 'error');
          return;
        }

        // If we get here, email is available in both systems
        const userCredential = await createUserWithEmailAndPassword(auth, this.email, this.password);
        const user = userCredential.user;
        
        console.log('User after registration:', userCredential.user);
        
        // Send verification email
        await sendEmailVerification(user);
        
        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          userId: user.uid,
          firstName: this.firstName,
          lastName: this.lastName,
          username: this.username,
          email: this.email,
          contactNumber: this.contactNumber,
          address: `${this.selectedBarangay}, ${this.selectedMunicipality}, Oriental Mindoro`,
          province: 'Oriental Mindoro',
          municipality: this.selectedMunicipality,
          barangay: this.selectedBarangay,
          role: this.role,
          isVerified: false,
          isSeller: false,
          authProvider: 'email',
          createdAt: new Date()
        });

        // Sign out the user to ensure they verify their email before logging in
        await signOut(auth);
        
        // Show success message and redirect to login page
        this.showAlert('Registration successful! Please check your email to verify your account before logging in.', 'success');
        
        setTimeout(() => {
          this.$router.push('/login');
        }, 3000);
      } catch (error) {
        console.error('Error during registration:', error);
        let errorMessage = 'Registration failed!';
        
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'Email already in use. Please login instead.';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'Password should be at least 6 characters.';
        }
        
        this.showAlert(errorMessage, 'error');
      }
    },
    
    async registerWithGoogle() {
      try {
        // First sign out any existing user to prevent automatic login
        await signOut(auth);
        
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        // Check if user already exists in Firestore
        const userQuery = query(collection(db, 'users'), where('email', '==', user.email));
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          this.showAlert('This email is already registered. Please login instead.', 'warning');
          // Sign out the user since we don't want them logged in yet
          await signOut(auth);
          setTimeout(() => {
            this.$router.push('/login');
          }, 2000);
          return;
        }
        
        // If email doesn't exist, populate the form with Google data
        this.email = user.email;
        const nameParts = user.displayName?.split(' ') || [];
        this.firstName = nameParts[0] || '';
        this.lastName = nameParts.slice(1).join(' ') || '';
        this.username = user.email?.split('@')[0] || '';
        
        // Sign out the user since we want them to complete the form
        await signOut(auth);
        
        this.showAlert('Please complete the registration form. Your email has been pre-filled.', 'success');
        
      } catch (error) {
        console.error('Google Registration Error:', error);
        let errorMessage = 'Google registration failed. Please try again.';
        
        if (error.code === 'auth/operation-not-allowed') {
          errorMessage = 'Google registration is not enabled. Contact support.';
        } else if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = 'Registration popup was closed. Please try again.';
        } else if (error.code === 'auth/account-exists-with-different-credential') {
          errorMessage = 'Account already exists with different method. Please login with email.';
        }
        
        this.showAlert(errorMessage, 'error');
      }
    }
  },
  mounted() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is authenticated
      }
    });
  }
};
</script>

<style scoped>
/* Main Container */
.register-container {
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
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  animation: fadeIn 1s ease-in-out;
}

.logo {
  width: 140px;
  height: auto;
  margin-right: 10px;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

.title-container {
  text-align: left;
}

.app-title {
  color: #2e5c31;
  font-size: 32px;
  font-weight: bold;
  margin: 0;
  letter-spacing: 2px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  line-height: 1;
}

.app-subtitle {
  color: #2e5c31;
  font-size: 14px;
  margin: 0;
  letter-spacing: 4px;
  font-weight: 500;
}

/* Alert Box */
.alert-box {
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 10px;
  text-align: center;
  font-size: 13px;
  width: 90%;
  max-width: 700px;
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

/* Register Box */
.register-box {
  background: white;
  border-radius: 20px;
  padding: 20px;
  width: 95%;
  max-width: 700px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.5s ease-in-out;
  transition: transform 0.3s ease;
  margin-bottom: 15px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.register-box:hover {
  transform: translateY(-5px);
}

.register-title {
  color: #2e5c31;
  text-align: center;
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 22px;
  font-weight: 600;
}

/* Form Grid for Desktop - 2 columns */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

/* Password Section - Separate from grid for chronological order */
.password-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 15px;
}

/* Input Fields */
.input-container {
  display: flex;
  align-items: center;
  background: #f7f7f7;
  border-radius: 50px;
  padding: 10px 15px;
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.input-container:focus-within {
  border-color: #2e5c31;
  box-shadow: 0 0 0 2px rgba(46, 92, 49, 0.2);
  background: #ffffff;
}

.icon {
  margin-right: 10px;
  color: #2e5c31;
  font-size: 15px;
}

input[type="email"],
input[type="text"],
input[type="password"] {
  border: none;
  background: transparent;
  outline: none;
  flex: 1;
  font-size: 14px;
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
  right: 15px;
  color: #777;
  cursor: pointer;
  font-size: 15px;
  transition: color 0.3s;
}

.eye-icon:hover {
  color: #2e5c31;
}

/* Location Select */
.location-select {
  position: relative;
}

.location-select select {
  width: 100%;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: #333;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding-right: 25px;
  cursor: pointer;
}

.location-select::after {
  content: '\f078';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  pointer-events: none;
  font-size: 12px;
}

/* Register Button */
.register-button {
  background: linear-gradient(to right, #2e5c31, #3a7d3e);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 12px;
  width: 100%;
  max-width: 300px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(46, 92, 49, 0.3);
  letter-spacing: 1px;
  margin: 0 auto;
  display: block;
}

.register-button:hover {
  background: linear-gradient(to right, #26492a, #2e5c31);
  box-shadow: 0 6px 15px rgba(46, 92, 49, 0.4);
  transform: translateY(-2px);
}

.register-button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 5px rgba(46, 92, 49, 0.4);
}

/* Social Login Divider */
.social-divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 15px 0;
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
  font-size: 13px;
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
  max-width: 300px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  margin: 0 auto;
}

.google-button:hover {
  background: #f8f8f8;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.google-icon {
  width: 18px;
  height: 18px;
  margin-right: 10px;
}

/* Login Link */
.login-link {
  text-align: center;
  font-size: 13px;
  margin-top: 15px;
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
  .register-box {
    padding: 15px;
  }
  
  .form-grid, .password-section {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .logo-container {
    flex-direction: column;
    text-align: center;
  }
  
  .logo {
    width: 120px;
    margin-right: 0;
    margin-bottom: 5px;
  }
  
  .title-container {
    text-align: center;
  }
  
  .app-title {
    font-size: 28px;
  }
  
  .app-subtitle {
    font-size: 12px;
  }
  
  /* Make buttons narrower on mobile */
  .google-button, .register-button {
    max-width: 100%;
  }
  
  .input-container {
    padding: 8px 12px;
  }
}

@media (max-height: 700px) {
  .register-box {
    padding: 15px;
    max-height: calc(100vh - 150px);
  }
  
  .logo {
    width: 100px;
  }
  
  .app-title {
    font-size: 26px;
  }
  
  .app-subtitle {
    font-size: 12px;
  }
  
  .register-title {
    font-size: 18px;
    margin-bottom: 8px;
  }
  
  .input-container {
    padding: 8px 12px;
  }
  
  .icon {
    font-size: 14px;
  }
  
  input[type="email"],
  input[type="text"],
  input[type="password"] {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .register-box {
    padding: 12px;
  }
  
  .input-container {
    padding: 8px 12px;
  }
  
  .app-title {
    font-size: 24px;
  }
  
  .app-subtitle {
    font-size: 11px;
  }
  
  .logo {
    width: 100px;
  }
}
</style>