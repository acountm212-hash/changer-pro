// 1. IMPORT FROM FIREBASE CDN (Browser ke liye direct links)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-analytics.js";
// Yahan sendPasswordResetEmail add kiya hai 🔥
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

// 2. Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC9OsCQnQ1Z9Z0a9DfqiMO7K6cz6CVdXK4",
  authDomain: "changer-pro.firebaseapp.com",
  projectId: "changer-pro",
  storageBucket: "changer-pro.firebasestorage.app",
  messagingSenderId: "771955121378",
  appId: "1:771955121378:web:1922a767c9c1abe27092bb",
  measurementId: "G-HKTPFY2208"
};

// 3. Initialize Firebase, Analytics, and Auth
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider(); // Google Provider create karo

console.log("🔥 CHANGER PRO: Firebase Backend is Successfully Connected!");

// ==========================================
// 4. SIGN UP FUNCTION
// ==========================================
export function signUpUser(email, password) {
  return createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log("Account successfully created for:", user.email);
      return user; 
    })
    .catch((error) => {
      console.error("Signup Error:", error.code, error.message);
      alert("Signup Error: " + error.message); 
    });
}

// ==========================================
// 5. LOGIN FUNCTION
// ==========================================
export function loginUser(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log("Logged in successfully:", user.email);
      return user;
    })
    .catch((error) => {
      console.error("Login Error:", error.code, error.message);
      alert("Login Error: Invalid Email or Password");
    });
}

// ==========================================
// 6. GOOGLE SIGN-IN FUNCTION
// ==========================================
export function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider)
    .then((result) => {
      const user = result.user;
      console.log("Google se Login ho gaya:", user.email);
      return user;
    }).catch((error) => {
      console.error("Google Login Error:", error.code, error.message);
      alert("Google Error: " + error.message);
    });
}

// ==========================================
// 7. LOGOUT FUNCTION & AUTH STATE
// ==========================================
export function logoutUser() {
  return signOut(auth).then(() => {
    console.log("Logged out successfully");
    window.location.reload(); // Logout hote hi page refresh hoga
  }).catch((error) => {
    console.error("Logout Error:", error);
  });
}

export { onAuthStateChanged };

// ==========================================
// 8. FORGOT PASSWORD FUNCTION 🔥
// ==========================================
export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email)
    .then(() => {
      console.log("Password reset email sent to:", email);
      return true;
    })
    .catch((error) => {
      console.error("Password Reset Error:", error.code, error.message);
      alert("Error: " + error.message);
      return false;
    });
}