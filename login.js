// ── login.js ──

const form        = document.getElementById('loginForm');
const errorBanner = document.getElementById('errorBanner');
const errorMsg    = document.getElementById('errorMsg');
const submitBtn   = document.getElementById('submitBtn');
const eyeBtn      = document.getElementById('eyeBtn');
const passwordInput = document.getElementById('password');

// Toggle eye
eyeBtn.addEventListener('click', () => {
  passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
});

function showError(msg) {
  errorMsg.textContent = msg;
  errorBanner.classList.add('show');
}

function hideError() {
  errorBanner.classList.remove('show');
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  hideError();

  const correo   = document.getElementById('correo').value.trim();
  const password = passwordInput.value;

  if (!correo || !password) {
    showError('Por favor, completa todos los campos.');
    return;
  }

  // Loading
  submitBtn.classList.add('loading');
  submitBtn.textContent = 'Verificando...';

  setTimeout(() => {
    const users = JSON.parse(localStorage.getItem('alertasegura_users') || '[]');
    const user  = users.find(u => u.correo === correo && u.password === password);

    if (!user) {
      showError('Correo o contraseña incorrectos. Verifica tus datos.');
      submitBtn.classList.remove('loading');
      submitBtn.innerHTML = `
        <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
        </svg>
        Ingresar
      `;
      return;
    }

    // Guardar sesión
    sessionStorage.setItem('alertasegura_session', JSON.stringify(user));

    // Redirigir al dashboard
    window.location.href = 'dashboard.html';
  }, 900);
});