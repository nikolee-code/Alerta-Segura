// ── login.js ──

import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail
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
const correoInput = document.getElementById("correo");
const forgotLink = document.getElementById("forgotPasswordLink");

// Mostrar/Ocultar contraseña
eyeBtn.addEventListener("click", () => {
  passwordInput.type =
    passwordInput.type === "password" ? "text" : "password";
});

function showError(msg) {
  errorMsg.textContent = msg;
  errorBanner.style.background = "rgba(232,25,44,.08)";
  errorBanner.style.borderColor = "rgba(232,25,44,.25)";
  errorBanner.style.color = "var(--red)";
  errorBanner.classList.add("show");
}

function showSuccess(msg) {
  errorMsg.textContent = msg;
  errorBanner.style.background = "rgba(34,197,94,.08)";
  errorBanner.style.borderColor = "rgba(34,197,94,.3)";
  errorBanner.style.color = "#15803d";
  errorBanner.classList.add("show");
}

function hideError() {
  errorBanner.classList.remove("show");
}

// ═══════════════════════════════════════════
// RECUPERAR CONTRASEÑA
// ═══════════════════════════════════════════
forgotLink.addEventListener("click", async (e) => {
  e.preventDefault();
  hideError();

  const correo = correoInput.value.trim();

  if (!correo) {
    showError("Primero escribe tu correo en el campo de arriba, luego haz click en este enlace.");
    correoInput.focus();
    return;
  }

  forgotLink.textContent = "Enviando...";

  try {
    await sendPasswordResetEmail(auth, correo);
    showSuccess(`Te enviamos un correo a ${correo} con instrucciones para restablecer tu contraseña.`);
  } catch (error) {
    switch (error.code) {
      case "auth/invalid-email":
        showError("Ese correo no es válido.");
        break;
      case "auth/user-not-found":
        showError("No encontramos una cuenta con ese correo.");
        break;
      default:
        showError("No se pudo enviar el correo. Intenta de nuevo.");
        console.error(error);
    }
  }

  forgotLink.textContent = "¿Olvidaste tu contraseña?";
});

// ═══════════════════════════════════════════
// INICIAR SESIÓN
// ═══════════════════════════════════════════
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  hideError();

  const correo = correoInput.value.trim();
  const password = passwordInput.value;

  if (!correo || !password) {
    showError("Completa todos los campos.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = "Verificando...";

  try {

    const userCredential = await signInWithEmailAndPassword(
      auth,
      correo,
      password
    );

    const uid = userCredential.user.uid;

    const userDocRef = doc(db, "Usuarios", uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      showError("No se encontraron los datos de tu cuenta. Contacta soporte.");
      submitBtn.disabled = false;
      submitBtn.innerHTML = `Ingresar`;
      return;
    }

    const datosUsuario = userDocSnap.data();

    sessionStorage.setItem("alertasegura_session", JSON.stringify({
      uid: uid,
      nombres: datosUsuario.nombres,
      apellidos: datosUsuario.apellidos,
      distrito: datosUsuario.distrito,
      correo: datosUsuario.correo
    }));

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