// ── dashboard.js ──

// ═══════════════════════════════════════════
// 1. SESIÓN
// ═══════════════════════════════════════════
const session = JSON.parse(sessionStorage.getItem('alertasegura_session') || 'null');

if (!session) {
  // No hay sesión → redirigir al login
  window.location.href = 'login.html';
}

// Mostrar info del usuario
document.getElementById('userName').textContent   = `${session.nombres} ${session.apellidos}`;
document.getElementById('userDistrict').textContent = session.distrito;
document.getElementById('userAvatar').textContent  = session.nombres.charAt(0).toUpperCase();

// Serenazgo por distrito (números ilustrativos)
const serenazgoNums = {
  'Miraflores':  '617-7575',  'San Isidro':  '264-4848',
  'Surco':       '448-0400',  'La Molina':   '349-1111',
  'San Borja':   '475-5070',  'Barranco':    '247-5000',
  'Magdalena':   '461-0222',  'Jesús María': '463-2299',
};
const numSerenazgo = serenazgoNums[session.distrito] || 'Consultar municipio';
document.getElementById('serenazgoNum').textContent = numSerenazgo;
document.getElementById('serenazgoBtn').addEventListener('click', () => {
  alert(`Serenazgo de ${session.distrito}: ${numSerenazgo}`);
});

// ═══════════════════════════════════════════
// 2. RELOJ
// ═══════════════════════════════════════════
function updateClocks() {
  const now = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  document.getElementById('currentTime').textContent = now;
  document.getElementById('autoTime').textContent    = now;
}
updateClocks();
setInterval(updateClocks, 1000);

// ═══════════════════════════════════════════
// 3. MODO OSCURO
// ═══════════════════════════════════════════
const darkToggle = document.getElementById('darkToggle');
const body = document.body;

if (localStorage.getItem('alertasegura_dark') === '1') {
  body.classList.add('dark');
  darkToggle.classList.add('active');
}

darkToggle.addEventListener('click', () => {
  body.classList.toggle('dark');
  const isDark = body.classList.contains('dark');
  darkToggle.classList.toggle('active', isDark);
  localStorage.setItem('alertasegura_dark', isDark ? '1' : '0');
});

// ═══════════════════════════════════════════
// 4. DATOS (localStorage)
// ═══════════════════════════════════════════
const STORAGE_KEY = 'alertasegura_reports';

function getReports() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveReports(reports) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

// Seed de ejemplo si no hay datos
const seedData = [
  { tipo: 'Robo',       zona: 'Av. Principal 320',    riesgo: 'alta',  comentario: 'Arrebato de celular a señora mayor.',    hora: '08:15', fecha: new Date().toISOString() },
  { tipo: 'Asalto',     zona: 'Jr. Las Flores 420',   riesgo: 'alta',  comentario: 'Dos personas en moto amenazaron a peatones.', hora: '10:42', fecha: new Date().toISOString() },
  { tipo: 'Vandalismo', zona: 'Parque Central',        riesgo: 'media', comentario: 'Paredes del parque pintadas con grafiti.',hora: '13:00', fecha: new Date().toISOString() },
  { tipo: 'Drogas',     zona: 'Ca. Los Pinos s/n',     riesgo: 'media', comentario: 'Personas consumiendo sustancias.', hora: '15:30', fecha: new Date().toISOString() },
  { tipo: 'Acoso',      zona: 'Paradero El Carmen',    riesgo: 'baja',  comentario: 'Acoso verbal a pasajeras.',        hora: '17:10', fecha: new Date().toISOString() },
];

if (getReports().length === 0) {
  saveReports(seedData);
}

// ═══════════════════════════════════════════
// 5. ESTADÍSTICAS
// ═══════════════════════════════════════════
function updateStats() {
  const reports = getReports();
  const now     = new Date();

  document.getElementById('statTotal').textContent    = reports.length;
  document.getElementById('statRobos').textContent    = reports.filter(r => r.tipo === 'Robo').length;
  document.getElementById('statAsaltos').textContent  = reports.filter(r => r.tipo === 'Asalto').length;
  document.getElementById('statVandalismo').textContent = reports.filter(r => r.tipo === 'Vandalismo').length;

  const mesActual = reports.filter(r => {
    const d = new Date(r.fecha);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  document.getElementById('statMes').textContent = mesActual.length;
}

updateStats();

// ═══════════════════════════════════════════
// 6. MAPA LEAFLET
// ═══════════════════════════════════════════
// Coordenadas por defecto: Lima, Perú
const mapInstance = L.map('map').setView([-12.0464, -77.0428], 14);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19,
}).addTo(mapInstance);

// Íconos según tipo
const iconColors = {
  Robo:       'red',    Asalto:   'red',
  Vandalismo: 'orange', Drogas:   'purple',
  Acoso:      'blue',   Sospechoso:'gray', Otro: 'gray',
};

function createMarkerIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:24px;height:24px;border-radius:50% 50% 50% 0;
      background:${color};border:3px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,.3);
      transform:rotate(-45deg)">
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });
}

// Posiciones ficticias cerca de Lima para los seeds
const seedPositions = [
  [-12.0450, -77.0420], [-12.0470, -77.0450],
  [-12.0480, -77.0400], [-12.0430, -77.0460],
  [-12.0490, -77.0430],
];

function renderMapMarkers() {
  // Limpiar marcadores anteriores (no el mapa base)
  mapInstance.eachLayer(layer => {
    if (layer instanceof L.Marker) mapInstance.removeLayer(layer);
  });

  getReports().forEach((r, i) => {
    const pos   = seedPositions[i % seedPositions.length];
    const color = iconColors[r.tipo] || 'gray';
    L.marker(pos, { icon: createMarkerIcon(color) })
      .addTo(mapInstance)
      .bindPopup(`<b>${r.tipo}</b><br>${r.zona}<br><small>${r.hora}</small>`);
  });
}

renderMapMarkers();

// Búsqueda en mapa (Nominatim)
window.searchOnMap = async function () {
  const q = document.getElementById('mapSearch').value.trim();
  if (!q) return;

  try {
    const res  = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + ', Lima, Peru')}&limit=1`);
    const data = await res.json();
    if (data.length > 0) {
      const { lat, lon, display_name } = data[0];
      mapInstance.setView([parseFloat(lat), parseFloat(lon)], 16);
      L.marker([parseFloat(lat), parseFloat(lon)])
        .addTo(mapInstance)
        .bindPopup(display_name)
        .openPopup();
    } else {
      alert('No se encontró la ubicación. Intenta con otro término.');
    }
  } catch {
    alert('Error al buscar. Verifica tu conexión.');
  }
};

// ═══════════════════════════════════════════
// 7. FORMULARIO DE ALERTA
// ═══════════════════════════════════════════
document.getElementById('alertForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const zona      = document.getElementById('zona').value.trim();
  const tipo      = document.getElementById('tipoIncidente').value;
  const riesgo    = document.getElementById('riesgo').value;
  const comentario= document.getElementById('comentario').value.trim();

  if (!zona || !tipo || !riesgo || !comentario) {
    return alert('Por favor, completa todos los campos del formulario.');
  }

  const now    = new Date();
  const hora   = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  const fecha  = now.toISOString();

  const newReport = { tipo, zona, riesgo, comentario, hora, fecha };
  const reports   = getReports();
  reports.unshift(newReport);
  saveReports(reports);

  // Reset
  e.target.reset();

  // Actualizar UI
  updateStats();
  renderAlertList('Todos');
  renderMapMarkers();

  alert(`✅ Alerta de "${tipo}" registrada correctamente a las ${hora}.`);
});

// ═══════════════════════════════════════════
// 8. LISTA DE ALERTAS CON FILTROS
// ═══════════════════════════════════════════
const riskColors = { alta: '#E8192C', media: '#F5A623', baja: '#22C55E' };

function renderAlertList(filter) {
  const reports = getReports();
  const filtered = filter === 'Todos' ? reports : reports.filter(r => r.tipo === filter);
  const container = document.getElementById('alertList');

  if (filtered.length === 0) {
    container.innerHTML = `<p style="color:var(--gray-500);font-size:.88rem;padding:16px 0;">No hay alertas de este tipo.</p>`;
    return;
  }

  container.innerHTML = filtered.slice(0, 10).map(r => `
    <div class="alert-row">
      <div class="alert-dot" style="background:${riskColors[r.riesgo]}"></div>
      <div class="alert-info">
        <div class="alert-type">${r.tipo}</div>
        <div class="alert-meta">${r.zona} · ${r.comentario.slice(0, 60)}${r.comentario.length > 60 ? '…' : ''}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;min-width:80px">
        <span class="risk-pill risk-${r.riesgo}">${r.riesgo}</span>
        <span class="alert-time">${r.hora}</span>
      </div>
    </div>
  `).join('');
}

renderAlertList('Todos');

// Filtros
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderAlertList(btn.dataset.filter);
  });
});

// ═══════════════════════════════════════════
// 9. COMENTARIOS CIUDADANOS
// ═══════════════════════════════════════════
const seedComments = [
  { autor: 'María Gómez',     texto: 'Se observó poca iluminación en el parque central. Es peligroso de noche.', tiempo: 'Hace 20 min' },
  { autor: 'Carlos Ruiz',     texto: 'Hubo presencia de personas sospechosas rondando el mercado.', tiempo: 'Hace 1 hora' },
  { autor: 'Ana Delgado',     texto: 'El serenazgo respondió rápido cuando reporté el incidente. Buen trabajo.', tiempo: 'Hace 2 horas' },
  { autor: 'Jorge Mendoza',   texto: 'Recomiendo activar cámaras en la esquina de Jr. Lima con Av. Grau.', tiempo: 'Hace 3 horas' },
];

function renderComments() {
  const container = document.getElementById('commentsList');
  container.innerHTML = seedComments.map(c => `
    <div class="comment-item">
      <div class="comment-header">
        <div class="comment-avatar">${c.autor.charAt(0)}</div>
        <span class="comment-author">${c.autor}</span>
        <span class="comment-time">${c.tiempo}</span>
      </div>
      <p class="comment-text">${c.texto}</p>
    </div>
  `).join('');
}

renderComments();

// ═══════════════════════════════════════════
// 10. CERRAR SESIÓN
// ═══════════════════════════════════════════
document.getElementById('logoutBtn').addEventListener('click', () => {
  if (confirm('¿Seguro que deseas cerrar sesión?')) {
    sessionStorage.removeItem('alertasegura_session');
    window.location.href = 'login.html';
  }
});