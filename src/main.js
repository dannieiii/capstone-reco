import { createApp } from 'vue';
import App from './App.vue';
import './registerServiceWorker'; // Service worker setup
import router from './router';
import store from './store'; // Import the store
import { auth, db } from './firebase/firebaseConfig'; // Import auth and db
import { doc, updateDoc } from 'firebase/firestore'; // Import Firestore functions
import { onAuthStateChanged } from 'firebase/auth'; // Import auth functions
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'leaflet/dist/leaflet.css';

let app;

// Check if the user is logged in and email is verified
onAuthStateChanged(auth, async (user) => {
  if (user) {
    if (user.emailVerified) {
      const userDocRef = doc(db, 'users', user.uid); // Use doc() for Firestore v9
      try {
        await updateDoc(userDocRef, { isVerified: true });
        console.log('User email is verified, updated Firestore');
      } catch (error) {
        console.error('Error updating Firestore:', error);
      }
    }

    // Fetch the user's role and set it in the store
    await store.dispatch('fetchUserRole', user.uid);
    store.commit('SET_USER', user);
  } else {
    store.commit('SET_USER', null);
    store.commit('SET_ROLE', null);
  }

  if (!app) {
    app = createApp(App)
      .use(store)
      .use(router)
      .mount('#app');
  }
});