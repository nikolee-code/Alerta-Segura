// ── login.js ──

import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const form = document.getElementById("loginForm");
const errorBanner = document.getElementById("errorBanner");
const errorMsg = document.getElementById("errorMsg");
const submitBtn = document.getElementById("submitBtn");
const eyeBtn = document.getElementById("eyeBtn");
const passwordInput = document.getElementById("password");

// Mostrar/Ocultar contraseña
eyeBtn.addEventListener("click", () => {
  passwordInput.type =
    passwordInput.type === "password" ? "text" : "password";
});

function showError(msg) {
  errorMsg.textContent = msg;
  errorBanner.classList.add("show");
}

function hideError() {
  errorBanner.classList.remove("show");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  hideError();

  const correo = document.getElementById("correo").value.trim();
  const password = passwordInput.value;

  if (!correo || !password) {
    showError("Completa todos los campos.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = "Verificando...";

  try {

    // 1. Iniciar sesión en Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(
      auth,
      correo,
      password
    );

    const uid = userCredential.user.uid;

    // 2. Buscar los datos del usuario en Firestore (nombre, apellidos, distrito, etc.)
    const userDocRef = doc(db, "Usuarios", uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      showError("No se encontraron los datos de tu cuenta. Contacta soporte.");
      submitBtn.disabled = false;
      submitBtn.innerHTML = `Ingresar`;
      return;
    }

    const datosUsuario = userDocSnap.data();

    // 3. Guardar la sesión en el navegador para que el Dashboard pueda usarla
    sessionStorage.setItem("alertasegura_session", JSON.stringify({
      uid: uid,
      nombres: datosUsuario.nombres,
      apellidos: datosUsuario.apellidos,
      distrito: datosUsuario.distrito,
      correo: datosUsuario.correo
    }));

    // 4. Ahora sí, ir al Dashboard
    window.location.href = "dashboard.html";

  } catch (error) {

    switch (error.code) {

      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        showError("Correo o contraseña incorrectos.");
        break;

      case "auth/invalid-email":
        showError("Correo inválido.");
        break;

      default:
        showError(error.message);
        console.error(error);
    }

    submitBtn.disabled = false;
    submitBtn.innerHTML = `
      <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
      </svg>
      Ingresar
    `;
  }
});