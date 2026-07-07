// ── dashboard.js ──

import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ═══════════════════════════════════════════
// 1. SESIÓN
// ═══════════════════════════════════════════
const session = JSON.parse(sessionStorage.getItem('alertasegura_session') || 'null');

if (!session) {
  window.location.href = 'login.html';
}

document.getElementById('userName').textContent   = `${session.nombres} ${session.apellidos}`;
document.getElementById('userDistrict').textContent = session.distrito;
document.getElementById('userAvatar').textContent  = session.nombres.charAt(0).toUpperCase();

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
// 4. ALERTAS DESDE FIRESTORE
// ═══════════════════════════════════════════
const ALERTAS_COLLECTION = "Alertas";
let reportsCache = [];

async function fetchReports() {
  try {
    const q = query(collection(db, ALERTAS_COLLECTION), orderBy("fecha", "desc"));
    const snapshot = await getDocs(q);
    reportsCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return reportsCache;
  } catch (error) {
    console.error("Error al traer alertas de Firestore:", error);
    return [];
  }
}

async function addReport(newReport) {
  try {
    await addDoc(collection(db, ALERTAS_COLLECTION), {
      ...newReport,
      creadoPor: session.correo || session.nombres,
      timestamp: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error al guardar la alerta en Firestore:", error);
    alert("No se pudo guardar la alerta. Intenta de nuevo.");
    return false;
  }
}

// ═══════════════════════════════════════════
// 5. ESTADÍSTICAS
// ═══════════════════════════════════════════
function updateStats(reports) {
  const now = new Date();

  document.getElementById('statTotal').textContent    = reports.length;
  document.getElementById('statRobos').textContent    = reports.filter(r => r.tipo === 'Robo').length;
  document.getElementById('statAsaltos').textContent  = reports.filter(r => r.tipo === 'Asalto').length;
  document.getElementById('statVandalismo').textContent = reports.filter(r => r.tipo === 'Vandalismo').length;

  const mesActual = reports.filter(r => {
    if (!r.fecha) return false;
    const d = new Date(r.fecha);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  document.getElementById('statMes').textContent = mesActual.length;
}

// ═══════════════════════════════════════════
// 6. MAPA LEAFLET
// ═══════════════════════════════════════════
const mapInstance = L.map('map').setView([-12.0464, -77.0428], 14);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19,
}).addTo(mapInstance);

window.addEventListener('load', () => {
  setTimeout(() => {
    mapInstance.invalidateSize();
  }, 200);
});
window.addEventListener('resize', () => {
  mapInstance.invalidateSize();
});

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

function renderMapMarkers(reports) {
  mapInstance.eachLayer(layer => {
    if (layer instanceof L.Marker && !layer._isSelectionMarker) {
      mapInstance.removeLayer(layer);
    }
  });

  reports.forEach((r) => {
    const lat = r.lat ?? -12.0464;
    const lng = r.lng ?? -77.0428;
    const color = iconColors[r.tipo] || 'gray';
    L.marker([lat, lng], { icon: createMarkerIcon(color) })
      .addTo(mapInstance)
      .bindPopup(`<b>${r.tipo}</b><br>${r.zona}<br><small>${r.hora}</small>`);
  });
}

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
// 6.1 SELECCIÓN DE UBICACIÓN EN EL MAPA (para el formulario)
// ═══════════════════════════════════════════
let selectedCoords = null;
let selectionMarker = null;

const selectionIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:30px;height:30px;border-radius:50% 50% 50% 0;
    background:#3D7EAA;border:3px solid #fff;
    box-shadow:0 3px 10px rgba(0,0,0,.4);
    transform:rotate(-45deg)">
  </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

function placeSelectionMarker(lat, lng) {
  if (selectionMarker) {
    selectionMarker.setLatLng([lat, lng]);
  } else {
    selectionMarker = L.marker([lat, lng], { icon: selectionIcon }).addTo(mapInstance);
    selectionMarker._isSelectionMarker = true;
  }
  selectionMarker.bindPopup("📍 Ubicación de tu reporte").openPopup();
  selectedCoords = { lat, lng };
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
    const data = await res.json();
    return data.display_name || `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
  } catch {
    return `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
  }
}

mapInstance.on('click', async (e) => {
  const { lat, lng } = e.latlng;
  placeSelectionMarker(lat, lng);

  const zonaInput = document.getElementById('zona');
  zonaInput.placeholder = "Buscando dirección...";
  const direccion = await reverseGeocode(lat, lng);
  zonaInput.value = direccion;
});

document.getElementById('useMyLocationBtn').addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert("Tu navegador no soporta geolocalización.");
    return;
  }

  const btn = document.getElementById('useMyLocationBtn');
  btn.disabled = true;
  btn.textContent = "📍 Buscando tu ubicación...";

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      mapInstance.setView([lat, lng], 16);
      placeSelectionMarker(lat, lng);

      const zonaInput = document.getElementById('zona');
      zonaInput.placeholder = "Buscando dirección...";
      const direccion = await reverseGeocode(lat, lng);
      zonaInput.value = direccion;

      btn.disabled = false;
      btn.textContent = "📍 Usar mi ubicación actual";
    },
    () => {
      alert("No se pudo obtener tu ubicación. Verifica los permisos de tu navegador.");
      btn.disabled = false;
      btn.textContent = "📍 Usar mi ubicación actual";
    }
  );
});

// ═══════════════════════════════════════════
// 7. FORMULARIO DE ALERTA
// ═══════════════════════════════════════════
document.getElementById('alertForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const zona      = document.getElementById('zona').value.trim();
  const tipo      = document.getElementById('tipoIncidente').value;
  const riesgo    = document.getElementById('riesgo').value;
  const comentario= document.getElementById('comentario').value.trim();

  if (!zona || !tipo || !riesgo || !comentario) {
    return alert('Por favor, completa todos los campos del formulario.');
  }

  if (!selectedCoords) {
    return alert('Por favor, marca la ubicación exacta en el mapa (haz click en el mapa o usa tu ubicación actual).');
  }

  const now    = new Date();
  const hora   = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  const fecha  = now.toISOString();

  const newReport = {
    tipo, zona, riesgo, comentario, hora, fecha,
    lat: selectedCoords.lat,
    lng: selectedCoords.lng
  };

  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  const success = await addReport(newReport);

  submitBtn.disabled = false;

  if (success) {
    e.target.reset();

    if (selectionMarker) {
      mapInstance.removeLayer(selectionMarker);
      selectionMarker = null;
    }
    selectedCoords = null;
    document.getElementById('zona').placeholder = "Ej: Jr. Las Flores 420, o selecciona en el mapa";

    await cargarYActualizarTodo();

    alert(`✅ Alerta de "${tipo}" registrada correctamente a las ${hora}.`);
  }
});

// ═══════════════════════════════════════════
// 8. LISTA DE ALERTAS CON FILTROS
// ═══════════════════════════════════════════
const riskColors = { alta: '#E8192C', media: '#F5A623', baja: '#22C55E' };

function renderAlertList(reports, filter) {
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

let currentFilter = 'Todos';
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderAlertList(reportsCache, currentFilter);
  });
});

// ═══════════════════════════════════════════
// 9. COMENTARIOS CIUDADANOS (reales, desde Firestore)
// ═══════════════════════════════════════════
const COMENTARIOS_COLLECTION = "Comentarios";

async function fetchComments() {
  try {
    const q = query(collection(db, COMENTARIOS_COLLECTION), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error al traer comentarios:", error);
    return [];
  }
}

async function addComment(texto) {
  await addDoc(collection(db, COMENTARIOS_COLLECTION), {
    autor: `${session.nombres} ${session.apellidos}`,
    texto: texto,
    creadoPor: session.correo || session.nombres,
    timestamp: serverTimestamp()
  });
}

function timeAgo(timestamp) {
  if (!timestamp || !timestamp.toDate) return "Justo ahora";
  const date = timestamp.toDate();
  const diffMs  = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1)  return "Justo ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;

  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `Hace ${diffHrs} ${diffHrs === 1 ? 'hora' : 'horas'}`;

  const diffDias = Math.floor(diffHrs / 24);
  return `Hace ${diffDias} ${diffDias === 1 ? 'día' : 'días'}`;
}

function renderComments(comments) {
  const container = document.getElementById('commentsList');

  if (comments.length === 0) {
    container.innerHTML = `<p style="color:var(--gray-500);font-size:.88rem;padding:16px 0;">Aún no hay comentarios. ¡Sé el primero en compartir algo con tu comunidad!</p>`;
    return;
  }

  container.innerHTML = comments.map(c => `
    <div class="comment-item">
      <div class="comment-header">
        <div class="comment-avatar">${c.autor.charAt(0)}</div>
        <span class="comment-author">${c.autor}</span>
        <span class="comment-time">${timeAgo(c.timestamp)}</span>
      </div>
      <p class="comment-text">${c.texto}</p>
    </div>
  `).join('');
}

document.getElementById('submitCommentBtn').addEventListener('click', async () => {
  const textarea = document.getElementById('newCommentText');
  const texto = textarea.value.trim();

  if (!texto) {
    alert('Escribe algo antes de publicar.');
    return;
  }

  const btn = document.getElementById('submitCommentBtn');
  btn.disabled = true;
  btn.textContent = "Publicando...";

  try {
    await addComment(texto);
    textarea.value = '';
    const comments = await fetchComments();
    renderComments(comments);
  } catch (error) {
    console.error(error);
    alert('No se pudo publicar el comentario. Intenta de nuevo.');
  }

  btn.disabled = false;
  btn.textContent = "Publicar";
});

// ═══════════════════════════════════════════
// 10. CERRAR SESIÓN
// ═══════════════════════════════════════════
document.getElementById('logoutBtn').addEventListener('click', () => {
  if (confirm('¿Seguro que deseas cerrar sesión?')) {
    sessionStorage.removeItem('alertasegura_session');
    window.location.href = 'login.html';
  }
});

// ═══════════════════════════════════════════
// 11. CARGA INICIAL DE TODO
// ═══════════════════════════════════════════
async function cargarYActualizarTodo() {
  const reports = await fetchReports();
  updateStats(reports);
  renderMapMarkers(reports);
  renderAlertList(reports, currentFilter);

  const comments = await fetchComments();
  renderComments(comments);
}

cargarYActualizarTodo();