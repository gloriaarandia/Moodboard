// ==========================================
// CONFIGURACIÓN Y ESTADO GLOBAL DEL CREADOR
// ==========================================
const TMDB_API_KEY = 'b93383600bce5987b0f438644ab56604'; // <-- PEGA AQUÍ TU CLAVE V3 DE TMDB
const BACKEND_URL = 'http://localhost:8080/api/moodboards';

const colorThief = new ColorThief();
const previewAudio = document.getElementById('preview-audio');

let state = {
  mediaType: 'pelicula', // 'pelicula' | 'libro'
  selectedMedia: null,   // { externalId, title, year, coverUrl, backdropUrl }
  palette: ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8'],
  tracks: [],            // Máximo 5 canciones
  selectedTagIds: []     // Máximo 3 IDs de etiqueta
};

let mediaSearchTimeout = null;
let deezerSearchTimeout = null;
let playingPreviewUrl = null;

// ==========================================
// PASO 1: SELECTOR PELÍCULA / LIBRO + TMDB / GOOGLE BOOKS
// ==========================================
function setMediaType(type) {
  state.mediaType = type;
  const btnMovie = document.getElementById('btn-type-movie');
  const btnBook = document.getElementById('btn-type-book');
  const input = document.getElementById('media-search-input');
  const dropdown = document.getElementById('media-results-dropdown');

  if (type === 'pelicula') {
    btnMovie.className = 'py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white transition cursor-pointer';
    btnBook.className = 'py-2 rounded-lg text-sm font-semibold text-slate-400 hover:text-white transition cursor-pointer';
    input.placeholder = 'Escribe el título de una película...';
  } else {
    btnBook.className = 'py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white transition cursor-pointer';
    btnMovie.className = 'py-2 rounded-lg text-sm font-semibold text-slate-400 hover:text-white transition cursor-pointer';
    input.placeholder = 'Escribe el título de un libro...';
  }

  input.value = '';
  dropdown.classList.add('hidden');
}

// Autocompletado con debounce al escribir en el buscador de obras
document.getElementById('media-search-input').addEventListener('input', (e) => {
  const query = e.target.value.trim();
  const dropdown = document.getElementById('media-results-dropdown');

  clearTimeout(mediaSearchTimeout);
  if (query.length < 2) {
    dropdown.classList.add('hidden');
    return;
  }

  mediaSearchTimeout = setTimeout(() => {
    if (state.mediaType === 'pelicula') {
      searchTMDB(query);
    } else {
      searchGoogleBooks(query);
    }
  }, 350);
});

async function searchTMDB(query) {
  const dropdown = document.getElementById('media-results-dropdown');
  try {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=es-ES`;
    const res = await fetch(url);
    const data = await res.json();

    const results = (data.results || []).filter(m => m.poster_path).slice(0, 6);
    renderMediaDropdown(results.map(m => ({
      externalId: String(m.id),
      title: m.title,
      year: m.release_date ? parseInt(m.release_date.substring(0, 4)) : null,
      coverUrl: `https://image.tmdb.org/t/p/w500${m.poster_path}`,
      backdropUrl: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : null
    })));
  } catch (err) {
    console.error('Error buscando en TMDB:', err);
    dropdown.innerHTML = `<p class="p-3 text-xs text-red-400">Error al consultar TMDB. Revisa tu API Key.</p>`;
    dropdown.classList.remove('hidden');
  }
}

async function searchGoogleBooks(query) {
  const dropdown = document.getElementById('media-results-dropdown');
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8`;
    const res = await fetch(url);
    const data = await res.json();

    const results = (data.items || [])
      .filter(b => b.volumeInfo && b.volumeInfo.imageLinks && b.volumeInfo.imageLinks.thumbnail)
      .slice(0, 6)
      .map(b => {
        const info = b.volumeInfo;
        // Forzar HTTPS en las portadas de Google Books para evitar bloqueos mixtos
        const secureCover = info.imageLinks.thumbnail.replace('http://', 'https://');
        return {
          externalId: b.id,
          title: info.title,
          year: info.publishedDate ? parseInt(info.publishedDate.substring(0, 4)) : null,
          coverUrl: secureCover,
          backdropUrl: null
        };
      });

    renderMediaDropdown(results);
  } catch (err) {
    console.error('Error buscando en Google Books:', err);
    dropdown.innerHTML = `<p class="p-3 text-xs text-red-400">Error al consultar Google Books.</p>`;
    dropdown.classList.remove('hidden');
  }
}

function renderMediaDropdown(items) {
  const dropdown = document.getElementById('media-results-dropdown');
  if (items.length === 0) {
    dropdown.innerHTML = `<p class="p-3 text-xs text-slate-400">No se encontraron resultados con portada.</p>`;
    dropdown.classList.remove('hidden');
    return;
  }

  dropdown.innerHTML = items.map((item, idx) => `
    <button type="button" onclick='selectMedia(${JSON.stringify(item).replace(/'/g, "&apos;")})'
      class="w-full flex items-center gap-3 p-2.5 hover:bg-slate-800 text-left transition cursor-pointer">
      <img src="${item.coverUrl}" alt="${item.title}" class="w-10 h-14 object-cover rounded bg-slate-800 shrink-0" />
      <div class="min-w-0">
        <p class="text-sm font-semibold text-white truncate">${item.title}</p>
        <p class="text-xs text-slate-400">${item.year || 'Año desconocido'}</p>
      </div>
    </button>
  `).join('');

  dropdown.classList.remove('hidden');
}

// ==========================================
// EXTRACCIÓN DE 5 COLORES CON COLORTHIEF
// ==========================================
function selectMedia(media) {
  state.selectedMedia = media;
  document.getElementById('media-results-dropdown').classList.add('hidden');
  document.getElementById('media-search-input').value = media.title;

  const card = document.getElementById('selected-media-card');
  const img = document.getElementById('selected-cover-img');
  document.getElementById('selected-media-badge').textContent = state.mediaType === 'libro' ? '📖 Libro' : '🎬 Película';
  document.getElementById('selected-media-title').textContent = media.title;
  document.getElementById('selected-media-year').textContent = media.year ? `Año: ${media.year}` : '';

  card.classList.remove('hidden');

  // Cargar imagen con atributo CORS para que ColorThief pueda leer los píxeles del canvas
  img.crossOrigin = 'Anonymous';
  // Añadir un parámetro neutro evita que el navegador use una versión cacheada sin cabeceras CORS
  const cacheBustUrl = media.coverUrl + (media.coverUrl.includes('?') ? '&' : '?') + 'not-from-cache-please';
  img.src = cacheBustUrl;

  img.onload = () => {
    try {
      const rgbPalette = colorThief.getPalette(img, 5); // Extrae 5 colores RGB
      state.palette = rgbPalette.map(rgb => rgbToHex(rgb[0], rgb[1], rgb[2]));
    } catch (e) {
      console.warn('No se pudo extraer paleta automática por CORS, cargando paleta base editable:', e);
      state.palette = ['#1e293b', '#4f46e5', '#ec4899', '#f59e0b', '#10b981'];
    }
    renderPaletteInputs();
  };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function renderPaletteInputs() {
  const container = document.getElementById('palette-container');
  container.innerHTML = state.palette.map((hex, index) => `
    <div class="flex flex-col items-center gap-1.5">
      <input 
        type="color" 
        value="${hex}" 
        onchange="updatePaletteColor(${index}, this.value)"
        title="Haz clic para cambiar este color"
        class="w-10 h-10 rounded-full cursor-pointer border-2 border-white/20 bg-transparent"
      />
      <span id="hex-label-${index}" class="text-[10px] font-mono text-slate-400 uppercase">${hex}</span>
    </div>
  `).join('');
}

function updatePaletteColor(index, newHex) {
  state.palette[index] = newHex;
  document.getElementById(`hex-label-${index}`).textContent = newHex;
}

// ==========================================
// PASO 2: BUSCADOR DEEZER + PRE-ESCUCHA (MÁX. 5)
// ==========================================
document.getElementById('deezer-search-input').addEventListener('input', (e) => {
  const query = e.target.value.trim();
  const dropdown = document.getElementById('deezer-results-dropdown');

  clearTimeout(deezerSearchTimeout);
  if (query.length < 2) {
    dropdown.classList.add('hidden');
    return;
  }

  deezerSearchTimeout = setTimeout(() => {
    searchDeezerJSONP(query);
  }, 350);
});

// Llamada JSONP a Deezer para evitar bloqueos CORS desde el navegador
function searchDeezerJSONP(query) {
  const callbackName = 'deezerCallback_' + Date.now();
  const script = document.createElement('script');

  window[callbackName] = function(response) {
    delete window[callbackName];
    document.body.removeChild(script);
    renderDeezerDropdown(response.data || []);
  };

  script.src = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=6&output=jsonp&callback=${callbackName}`;
  document.body.appendChild(script);
}

function renderDeezerDropdown(tracks) {
  const dropdown = document.getElementById('deezer-results-dropdown');
  if (tracks.length === 0) {
    dropdown.innerHTML = `<p class="p-3 text-xs text-slate-400">No se encontraron canciones.</p>`;
    dropdown.classList.remove('hidden');
    return;
  }

  dropdown.innerHTML = tracks.map(t => {
    const trackObj = {
      deezerTrackId: String(t.id),
      titulo: t.title,
      artista: t.artist.name,
      albumTitulo: t.album.title,
      albumCover: t.album.cover_medium,
      previewMp3Url: t.preview
    };
    const isPlaying = playingPreviewUrl === t.preview;

    return `
      <div class="flex items-center justify-between gap-3 p-2.5 hover:bg-slate-800/80 transition">
        <div class="flex items-center gap-3 min-w-0">
          <img src="${t.album.cover_small}" alt="${t.title}" class="w-10 h-10 rounded object-cover shrink-0" />
          <div class="min-w-0">
            <p class="text-sm font-semibold text-white truncate">${t.title}</p>
            <p class="text-xs text-slate-400 truncate">${t.artist.name}</p>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          ${t.preview ? `
            <button type="button" onclick="togglePreview('${t.preview}', this)"
              title="Pre-escuchar 30s"
              class="w-8 h-8 rounded-full bg-slate-800 hover:bg-indigo-600 text-xs flex items-center justify-center transition cursor-pointer">
              ${isPlaying ? '⏸' : '▶'}
            </button>
          ` : ''}
          <button type="button" onclick='addTrack(${JSON.stringify(trackObj).replace(/'/g, "&apos;")})'
            class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer">
            + Añadir
          </button>
        </div>
      </div>
    `;
  }).join('');

  dropdown.classList.remove('hidden');
}

function togglePreview(url, btnElement) {
  if (playingPreviewUrl === url && !previewAudio.paused) {
    previewAudio.pause();
    playingPreviewUrl = null;
    btnElement.textContent = '▶';
    return;
  }

  previewAudio.src = url;
  previewAudio.play();
  playingPreviewUrl = url;
  btnElement.textContent = '⏸';

  previewAudio.onended = () => {
    playingPreviewUrl = null;
    btnElement.textContent = '▶';
  };
}

function addTrack(track) {
  if (state.tracks.length >= 5) {
    alert('Has alcanzado el máximo de 5 canciones por moodboard.');
    return;
  }
  if (state.tracks.some(t => t.deezerTrackId === track.deezerTrackId)) {
    alert('Esta canción ya está en tu lista.');
    return;
  }

  state.tracks.push(track);
  document.getElementById('deezer-results-dropdown').classList.add('hidden');
  document.getElementById('deezer-search-input').value = '';
  renderSelectedTracks();
}

function removeTrack(index) {
  state.tracks.splice(index, 1);
  renderSelectedTracks();
}

function renderSelectedTracks() {
  const list = document.getElementById('selected-tracks-list');
  document.getElementById('tracks-counter').textContent = `${state.tracks.length} / 5 canciones`;

  if (state.tracks.length === 0) {
    list.innerHTML = `
      <p class="text-sm text-slate-500 text-center py-6 border border-dashed border-slate-800 rounded-xl">
        Aún no has añadido canciones. Busca arriba para pre-escuchar y añadir (máx. 5).
      </p>`;
    return;
  }

  list.innerHTML = state.tracks.map((t, idx) => `
    <div class="flex items-center justify-between gap-3 bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
      <div class="flex items-center gap-3 min-w-0">
        <span class="text-xs font-bold text-slate-500 w-4 text-center">${idx + 1}</span>
        <img src="${t.albumCover}" alt="${t.titulo}" class="w-10 h-10 rounded-lg object-cover shrink-0" />
        <div class="min-w-0">
          <p class="text-sm font-semibold text-white truncate">${t.titulo}</p>
          <p class="text-xs text-slate-400 truncate">${t.artista}</p>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button type="button" onclick="togglePreview('${t.previewMp3Url}', this)"
          class="w-8 h-8 rounded-full bg-slate-800 hover:bg-indigo-600 text-xs flex items-center justify-center transition cursor-pointer">
          ▶
        </button>
        <button type="button" onclick="removeTrack(${idx})"
          title="Quitar canción"
          class="w-8 h-8 rounded-full bg-slate-800 hover:bg-red-600/80 text-xs text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer">
          ✕
        </button>
      </div>
    </div>
  `).join('');
}

// ==========================================
// PASO 3: SELECTOR DE ETIQUETAS (MÁX. 3) + POST /api/moodboards
// ==========================================
document.querySelectorAll('.mood-tag-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = parseInt(btn.getAttribute('data-id'));
    const idx = state.selectedTagIds.indexOf(id);

    if (idx > -1) {
      // Deseleccionar
      state.selectedTagIds.splice(idx, 1);
      btn.classList.remove('bg-indigo-600', 'text-white', 'border-indigo-500');
      btn.classList.add('bg-slate-950', 'text-slate-300', 'border-slate-700');
    } else {
      // Seleccionar (máx. 3)
      if (state.selectedTagIds.length >= 3) {
        alert('Puedes elegir un máximo de 3 etiquetas de ánimo.');
        return;
      }
      state.selectedTagIds.push(id);
      btn.classList.remove('bg-slate-950', 'text-slate-300', 'border-slate-700');
      btn.classList.add('bg-indigo-600', 'text-white', 'border-indigo-500');
    }

    document.getElementById('tags-counter').textContent = `${state.selectedTagIds.length} / 3 seleccionadas`;
  });
});

async function publishMoodboard() {
  const titulo = document.getElementById('mb-title').value.trim();
  const descripcion = document.getElementById('mb-description').value.trim();
  const feedback = document.getElementById('form-feedback');
  const btnPublish = document.getElementById('btn-publish');

  // Validaciones previas
  if (!state.selectedMedia) {
    return showFeedback('Por favor, busca y selecciona una película o libro en el Paso 1.', 'error');
  }
  if (state.tracks.length === 0) {
    return showFeedback('Añade al menos 1 canción de Deezer en el Paso 2.', 'error');
  }
  if (!titulo) {
    return showFeedback('Escribe un título creativo para tu moodboard en el Paso 3.', 'error');
  }
  if (state.selectedTagIds.length === 0) {
    return showFeedback('Selecciona al menos 1 etiqueta de ánimo (máx. 3).', 'error');
  }

  // Construir el objeto Moodboard con la estructura de tus entidades JPA en Spring Boot
  const payload = {
    user: { idUsuario: 1 }, // Usuario Demo creado en el Finde 2
    titulo: titulo,
    descripcion: descripcion || null,
    mediaType: state.mediaType,
    mediaExternalId: state.selectedMedia.externalId,
    mediaTitle: state.selectedMedia.title,
    mediaYear: state.selectedMedia.year,
    coverUrl: state.selectedMedia.coverUrl,
    backdropUrl: state.selectedMedia.backdropUrl,
    paleta: JSON.stringify(state.palette), // Se guarda como String JSON en MySQL
    tags: state.selectedTagIds.map(id => ({ idTag: id })),
    tracks: state.tracks
  };

  try {
    btnPublish.disabled = true;
    btnPublish.textContent = 'Publicando...';

    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Error al guardar en Spring Boot');
    }

    showFeedback('¡Moodboard publicado con éxito! Redirigiendo al muro Explorar...', 'success');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1200);

  } catch (error) {
    console.error(error);
    showFeedback('No se pudo publicar. Comprueba que Spring Boot está arrancado en el puerto 8080.', 'error');
    btnPublish.disabled = false;
    btnPublish.textContent = '✨ Publicar Moodboard';
  }
}

function showFeedback(message, type) {
  const feedback = document.getElementById('form-feedback');
  feedback.textContent = message;
  feedback.classList.remove('hidden', 'bg-red-950/70', 'text-red-300', 'border-red-800', 'bg-emerald-950/70', 'text-emerald-300', 'border-emerald-800');
  
  if (type === 'error') {
    feedback.classList.add('bg-red-950/70', 'text-red-300', 'border', 'border-red-800');
  } else {
    feedback.classList.add('bg-emerald-950/70', 'text-emerald-300', 'border', 'border-emerald-800');
  }
}