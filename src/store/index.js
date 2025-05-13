import { createStore } from 'vuex';
import { auth, db } from '../firebase/firebaseConfig'; // Import auth and db
import { collection, doc, getDoc } from 'firebase/firestore'; // Import Firestore functions

export default createStore({
  state: {
    user: null, // Firebase auth user
    role: null, // User role (admin, seller, customer)
  },
  getters: {
    user: (state) => state.user,
    role: (state) => state.role,
    isAdmin: (state) => state.role === 'admin',
    isSeller: (state) => state.role === 'seller',
    isCustomer: (state) => state.role === 'customer',
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user;
    },
    SET_ROLE(state, role) {
      state.role = role;
    },
  },
  actions: {
    async fetchUserRole({ commit }, uid) {
      try {
        // Check if the user is an admin
        const adminDocRef = doc(db, 'admins', uid); // Use doc() for Firestore v9
        const adminDoc = await getDoc(adminDocRef);
        if (adminDoc.exists()) {
          commit('SET_ROLE', 'admin');
          return;
        }

        // Check if the user is a seller or customer in the `users` collection
        const userDocRef = doc(db, 'users', uid); // Use doc() for Firestore v9
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          commit('SET_ROLE', userDoc.data().role); // Assuming `role` field exists in `users` collection
        } else {
          commit('SET_ROLE', null); // No role found
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    },
    async login({ commit, dispatch }, { email, password }) {
      const { user } = await auth.signInWithEmailAndPassword(email, password);
      commit('SET_USER', user);
      await dispatch('fetchUserRole', user.uid); // Fetch role after login
    },
    async logout({ commit }) {
      await auth.signOut();
      commit('SET_USER', null);
      commit('SET_ROLE', null);
    },
  },
});