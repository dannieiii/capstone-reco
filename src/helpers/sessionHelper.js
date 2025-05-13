import CryptoJS from 'crypto-js';

// Use an environment variable for security (never hardcode secret keys)
const SECRET_KEY = process.env.REACT_APP_SECRET_KEY || 'default_secret_key';

// Function to encrypt data
function encryptData(data) {
  try {
    return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
  } catch (error) {
    console.error('❌ Error encrypting data:', error);
    return null;
  }
}

// Function to decrypt data
function decryptData(encryptedData) {
  if (!encryptedData) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    return decryptedData ? JSON.parse(decryptedData) : null;
  } catch (error) {
    console.error('❌ Error decrypting data:', error);
    return null;
  }
}

// ==========================
// ✅ Session Storage Functions
// ==========================

export function setSession(user) {
  const encryptedData = encryptData(user);
  if (encryptedData) sessionStorage.setItem('session', encryptedData);
}

export function getSession() {
  return decryptData(sessionStorage.getItem('session'));
}

export function clearSession() {
  sessionStorage.removeItem('session');
}

// ==========================
// ✅ Local Storage Functions
// ==========================

export function setLocalUser(user) {
  const encryptedData = encryptData(user);
  if (encryptedData) localStorage.setItem('user', encryptedData);
}

export function getLocalUser() {
  return decryptData(localStorage.getItem('user'));
}

export function clearLocalUser() {
  localStorage.removeItem('user');
}
