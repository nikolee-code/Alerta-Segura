import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAyL6viwVPvMptX0WkARZHahU6eFxayzJo",
  authDomain: "loginapp-8d281.firebaseapp.com",
  projectId: "loginapp-8d281",
  storageBucket: "loginapp-8d281.firebasestorage.app",
  messagingSenderId: "1004968535415",
  appId: "1:1004968535415:web:0fb40a74cd9756defe2d72",
  measurementId: "G-T98VZZWV1V"
};

const app = initializeApp(firebaseConfig);

// Authentication
const auth = getAuth(app);

// Firestore
const db = getFirestore(app);

export { auth, db };