import { auth, db } from './firebaseConfig';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { setSession, clearSession } from '../helpers/sessionHelper';

export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user.emailVerified) {
      throw new Error('Please verify your email before logging in.');
    }

    // Fetch user data from Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      throw new Error('User data not found.');
    }

    const userData = userDoc.data();

    // Store session securely
    setSession({
      uid: user.uid,
      email: user.email,
      role: userData.role,
    });

    return userData.role; // Return user role to handle redirection
  } catch (error) {
    console.error('Login Error:', error);
    throw error;
  }
}

export function logoutUser() {
  signOut(auth);
  clearSession();
}
