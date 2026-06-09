import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

// Firebase config (EL TUYO)
const firebaseConfig = {
  apiKey: "AIzaSyAyL6viwVPvMptX0WkARZHahU6eFxayzJo",
  authDomain: "loginapp-8d281.firebaseapp.com",
  projectId: "loginapp-8d281",
  storageBucket: "loginapp-8d281.firebasestorage.app",
  messagingSenderId: "1004968535415",
  appId: "1:1004968535415:web:0fb40a74cd9756defe2d72",
  measurementId: "G-T98VZZWV1V"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// 🔥 AUTH (esto es lo que usas en registro.js)
export const auth = getAuth(app);