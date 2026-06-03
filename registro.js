// ── registro.js ──

const form = document.getElementById('registerForm');
const passwordInput = document.getElementById('password');
const confirmInput  = document.getElementById('confirmPassword');
const strengthFill  = document.getElementById('strengthFill');
const strengthLabel = document.getElementById('strengthLabel');
const successModal  = document.getElementById('successModal');

// ── Toggle password visibility ──
function toggleEye(btnId, inputId) {
  const btn   = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  btn.addEventListener('click', () => {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
  });
}
toggleEye('eyeBtn1', 'password');
toggleEye('eyeBtn2', 'confirmPassword');

// ── Password strength ──
const levels = [
  { min: 0,  width: '0%',   color: 'transparent', label: '' },
  { min: 1,  width: '25%',  color: '#E8192C',      label: 'Muy débil' },
  { min: 4,  width: '50%',  color: '#F5A623',      label: 'Débil' },
  { min: 6,  width: '75%',  color: '#3B82F6',      label: 'Buena' },
  { min: 8,  width: '100%', color: '#22C55E',      label: 'Segura ✓' },
];

function getStrength(pw) {
  let score = 0;
  if (!pw) return 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

passwordInput.addEventListener('input', () => {
  const score = getStrength(passwordInput.value);
  const level = levels.find((l, i) => {
    const next = levels[i + 1];
    return next ? score >= l.min && score < next.min : score >= l.min;
  }) || levels[levels.length - 1];

  strengthFill.style.width      = level.width;
  strengthFill.style.background = level.color;
  strengthLabel.textContent     = level.label;
});

// ── DNI: solo números ──
document.getElementById('dni').addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g, '');
});

// ── Celular: solo números ──
document.getElementById('celular').addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g, '');
});

// ── Validación y submit ──
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const nombres  = document.getElementById('nombres').value.trim();
  const apellidos= document.getElementById('apellidos').value.trim();
  const dni      = document.getElementById('dni').value.trim();
  const celular  = document.getElementById('celular').value.trim();
  const distrito = document.getElementById('distrito').value;
  const correo   = document.getElementById('correo').value.trim();
  const password = passwordInput.value;
  const confirm  = confirmInput.value;
  const terminos = document.getElementById('terminos').checked;

  // Validaciones básicas
  if (!nombres || !apellidos) {
    return alert('Por favor, ingresa tus nombres y apellidos.');
  }
  if (!/^\d{8}$/.test(dni)) {
    return alert('El DNI debe tener exactamente 8 dígitos.');
  }
  if (!/^\d{9}$/.test(celular)) {
    return alert('El celular debe tener exactamente 9 dígitos.');
  }
  if (!distrito) {
    return alert('Por favor, selecciona tu distrito.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return alert('Por favor, ingresa un correo válido.');
  }
  if (password.length < 8) {
    return alert('La contraseña debe tener al menos 8 caracteres.');
  }
  if (password !== confirm) {
    return alert('Las contraseñas no coinciden.');
  }
  if (!terminos) {
    return alert('Debes aceptar los términos de servicio.');
  }

  // Guardar en localStorage
  const users = JSON.parse(localStorage.getItem('alertasegura_users') || '[]');

  const exists = users.find(u => u.correo === correo);
  if (exists) {
    return alert('Ya existe una cuenta con ese correo. Por favor, inicia sesión.');
  }

  const newUser = { nombres, apellidos, dni, celular, distrito, correo, password };
  users.push(newUser);
  localStorage.setItem('alertasegura_users', JSON.stringify(users));

  // Mostrar modal de éxito
  successModal.classList.add('active');
});