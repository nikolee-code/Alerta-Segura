// ── login.js ──

import { auth } from "./firebase.js";

import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

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

    await signInWithEmailAndPassword(
      auth,
      correo,
      password
    );

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
    }

  } finally {

    submitBtn.disabled = false;

    submitBtn.innerHTML = `
      <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
      </svg>
      Ingresar
    `;
  }
});