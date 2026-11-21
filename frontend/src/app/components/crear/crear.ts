import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Location } from '@angular/common';
import { MoodboardService } from '../../services/moodboard';

declare const ColorThief: any;

const DRAFT_STORAGE_KEY = 'soundframe_crear_borrador_v1';
const DEFAULT_PALETTE = ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8'];

@Component({
  selector: 'app-crear',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear.html',
  styleUrl: './crear.css'
})
export class Crear implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private moodboardService = inject(MoodboardService);
  private router = inject(Router);
  private location = inject(Location);

  private readonly TMDB_API_KEY = 'b93383600bce5987b0f438644ab56604';
  private colorThief = new ColorThief();
  private audioPlayer = new Audio();
  private mediaTimer: any;
  private secondaryMediaTimer: any;
  private deezerTimer: any;
  private publicadoConExito = false;

  // Paso 1A: Obra principal (Película o Libro) + Paleta
  mediaType = signal<'pelicula' | 'libro'>('pelicula');
  mediaQuery = '';
  mediaResults = signal<any[]>([]);
  selectedMedia = signal<any | null>(null);
  palette = signal<string[]>([...DEFAULT_PALETTE]);

  // Paso 1B: Obra complementaria opcional (el tipo opuesto para tener película Y libro juntos)
  secondaryType = signal<'libro' | 'pelicula'>('libro');
  secondaryQuery = '';
  secondaryResults = signal<any[]>([]);
  selectedSecondaryMedia = signal<any | null>(null);

  // Paso 2: Deezer (máx. 5)
  deezerQuery = '';
  deezerResults = signal<any[]>([]);
  selectedTracks = signal<any[]>([]);
  playingUrl = signal<string | null>(null);

  // Paso 3: Detalles y Etiquetas (máx. 3)
  titulo = '';
  descripcion = '';
  availableTags = [
    { idTag: 1, nombre: 'Melancólico' },
    { idTag: 2, nombre: 'Energético' },
    { idTag: 3, nombre: 'Acogedor' },
    { idTag: 4, nombre: 'Oscuro' },
    { idTag: 5, nombre: 'Nostálgico' },
    { idTag: 6, nombre: 'Épico' },
    { idTag: 7, nombre: 'Relajante' },
    { idTag: 8, nombre: 'Misterioso' }
  ];
  selectedTagIds = signal<number[]>([]);
  errorMessage = signal<string>('');
  draftNotice = signal<string>('');
  publicando = signal<boolean>(false);

  ngOnInit(): void {
    this.cargarBorradorSiExiste();
  }

  ngOnDestroy(): void {
    this.audioPlayer.pause();
    if (!this.publicadoConExito && this.tieneContenidoParaBorrador()) {
      this.guardarBorradorEnStorage();
    }
  }

  // --- BORRADOR Y NAVEGACIÓN (CANCELAR / ATRÁS) ---
  private tieneContenidoParaBorrador(): boolean {
    return Boolean(
      this.titulo.trim() ||
      this.descripcion.trim() ||
      this.selectedMedia() ||
      this.selectedSecondaryMedia() ||
      this.selectedTracks().length > 0 ||
      this.selectedTagIds().length > 0
    );
  }

  private guardarBorradorEnStorage(): void {
    const draft = {
      mediaType: this.mediaType(),
      selectedMedia: this.selectedMedia(),
      palette: this.palette(),
      secondaryType: this.secondaryType(),
      selectedSecondaryMedia: this.selectedSecondaryMedia(),
      selectedTracks: this.selectedTracks(),
      titulo: this.titulo,
      descripcion: this.descripcion,
      selectedTagIds: this.selectedTagIds(),
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }

  private cargarBorradorSiExiste(): void {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return;

    try {
      const draft = JSON.parse(raw);
      if (draft.mediaType) {
        this.mediaType.set(draft.mediaType);
        this.secondaryType.set(draft.mediaType === 'pelicula' ? 'libro' : 'pelicula');
      }
      if (draft.selectedMedia) {
        this.selectedMedia.set(draft.selectedMedia);
        this.mediaQuery = draft.selectedMedia.title || '';
      }
      if (Array.isArray(draft.palette) && draft.palette.length === 5) {
        this.palette.set(draft.palette);
      }
      if (draft.selectedSecondaryMedia) {
        this.selectedSecondaryMedia.set(draft.selectedSecondaryMedia);
        this.secondaryQuery = draft.selectedSecondaryMedia.title || '';
      }
      if (Array.isArray(draft.selectedTracks)) {
        this.selectedTracks.set(draft.selectedTracks);
      }
      this.titulo = draft.titulo || '';
      this.descripcion = draft.descripcion || '';
      if (Array.isArray(draft.selectedTagIds)) {
        this.selectedTagIds.set(draft.selectedTagIds);
      }
      this.draftNotice.set('Se recuperó tu borrador guardado automáticamente.');
    } catch {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }

  descartarBorrador(): void {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    this.draftNotice.set('');
    this.clearSelectedMedia();
    this.removeSecondaryMedia();
    this.selectedTracks.set([]);
    this.selectedTagIds.set([]);
    this.titulo = '';
    this.descripcion = '';
  }

  irAtrasYGuardarBorrador(): void {
    this.audioPlayer.pause();
    if (this.tieneContenidoParaBorrador()) {
      this.guardarBorradorEnStorage();
    }
    this.location.back();
  }

  cancelarCreacion(): void {
    this.audioPlayer.pause();
    if (this.tieneContenidoParaBorrador()) {
      const confirmar = confirm('¿Seguro que quieres cancelar la creación de este moodboard? Se descartará el borrador.');
      if (!confirmar) return;
    }
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    this.router.navigate(['/']);
  }

  // --- PASO 1A: OBRA PRINCIPAL (PELÍCULA O LIBRO) ---
  setMediaType(tipo: 'pelicula' | 'libro'): void {
    this.mediaType.set(tipo);
    this.secondaryType.set(tipo === 'pelicula' ? 'libro' : 'pelicula');

    // Limpiar la obra anterior (ej. si tenías Donnie Darko como película y cambias a Libro)
    this.selectedMedia.set(null);
    this.palette.set([...DEFAULT_PALETTE]);
    this.mediaQuery = '';
    this.mediaResults.set([]);

    this.removeSecondaryMedia();
    this.secondaryResults.set([]);
  }

  clearSelectedMedia(): void {
    this.selectedMedia.set(null);
    this.palette.set([...DEFAULT_PALETTE]);
    this.mediaQuery = '';
    this.mediaResults.set([]);
  }

  private buscarObraObservable(tipo: 'pelicula' | 'libro', query: string) {
    if (tipo === 'pelicula') {
      const url = `https://api.themoviedb.org/3/search/movie?api_key=${this.TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=es-ES`;
      return this.http.get<any>(url);
    } else {
      // Open Library evita el error 429 de cuota de Google Books sin necesitar API Key[cite: 8]
      const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`;
      return this.http.get<any>(url);
    }
  }

  private mapearResultados(tipo: 'pelicula' | 'libro', res: any): any[] {
    if (tipo === 'pelicula') {
      return (res.results || [])
        .filter((m: any) => m.poster_path)
        .slice(0, 6)
        .map((m: any) => ({
          type: 'pelicula',
          externalId: String(m.id),
          title: m.title,
          year: m.release_date ? parseInt(m.release_date.substring(0, 4)) : null,
          coverUrl: `https://image.tmdb.org/t/p/w500${m.poster_path}`,
          backdropUrl: m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : null
        }));
    } else {
      return (res.docs || [])
        .filter((b: any) => b.cover_i && b.title)
        .slice(0, 6)
        .map((b: any) => ({
          type: 'libro',
          externalId: String(b.key || b.cover_i),
          title: b.title,
          year: b.first_publish_year ? parseInt(String(b.first_publish_year)) : null,
          coverUrl: `https://covers.openlibrary.org/b/id/${b.cover_i}-L.jpg`,
          backdropUrl: null
        }));
    }
  }

  onMediaSearch(): void {
    clearTimeout(this.mediaTimer);
    const q = this.mediaQuery.trim();
    if (q.length < 2) {
      this.mediaResults.set([]);
      return;
    }

    const tipoActual = this.mediaType();
    this.mediaTimer = setTimeout(() => {
      this.buscarObraObservable(tipoActual, q).subscribe({
        next: res => this.mediaResults.set(this.mapearResultados(tipoActual, res)),
        error: () => this.mediaResults.set([])
      });
    }, 350);
  }

  selectMedia(item: any): void {
    this.selectedMedia.set(item);
    this.mediaQuery = item.title;
    this.mediaResults.set([]);
  }

  // --- PASO 1B: OBRA COMPLEMENTARIA OPCIONAL (PELÍCULA + LIBRO JUNTOS) ---
  onSecondaryMediaSearch(): void {
    clearTimeout(this.secondaryMediaTimer);
    const q = this.secondaryQuery.trim();
    if (q.length < 2) {
      this.secondaryResults.set([]);
      return;
    }

    const tipoSecundario = this.secondaryType();
    this.secondaryMediaTimer = setTimeout(() => {
      this.buscarObraObservable(tipoSecundario, q).subscribe({
        next: res => this.secondaryResults.set(this.mapearResultados(tipoSecundario, res)),
        error: () => this.secondaryResults.set([])
      });
    }, 350);
  }

  selectSecondaryMedia(item: any): void {
    this.selectedSecondaryMedia.set(item);
    this.secondaryQuery = item.title;
    this.secondaryResults.set([]);
  }

  removeSecondaryMedia(): void {
    this.selectedSecondaryMedia.set(null);
    this.secondaryQuery = '';
    this.secondaryResults.set([]);
  }

  // --- EXTRACCIÓN DE COLORES CON COLORTHIEF ---
  extractColors(imgElement: HTMLImageElement): void {
    try {
      const rgbList = this.colorThief.getPalette(imgElement, 5);
      const hexList = rgbList.map((rgb: number[]) =>
        '#' + rgb.map(x => x.toString(16).padStart(2, '0')).join('')
      );
      this.palette.set(hexList);
    } catch {
      this.palette.set(['#1e293b', '#4f46e5', '#ec4899', '#f59e0b', '#10b981']);
    }
  }

  updateColor(index: number, event: Event): void {
    const nuevoHex = (event.target as HTMLInputElement).value;
    const copia = [...this.palette()];
    copia[index] = nuevoHex;
    this.palette.set(copia);
  }

  // --- PASO 2: DEEZER (MÁX. 5) ---
  onDeezerSearch(): void {
    clearTimeout(this.deezerTimer);
    const q = this.deezerQuery.trim();
    if (q.length < 2) {
      this.deezerResults.set([]);
      return;
    }

    this.deezerTimer = setTimeout(() => {
      const cbName = 'dzCb_' + Date.now();
      const script = document.createElement('script');
      (window as any)[cbName] = (data: any) => {
        delete (window as any)[cbName];
        document.body.removeChild(script);
        this.deezerResults.set((data.data || []).slice(0, 6));
      };
      script.src = `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=6&output=jsonp&callback=${cbName}`;
      document.body.appendChild(script);
    }, 350);
  }

  togglePreview(url: string): void {
    if (this.playingUrl() === url && !this.audioPlayer.paused) {
      this.audioPlayer.pause();
      this.playingUrl.set(null);
      return;
    }
    this.audioPlayer.src = url;
    this.audioPlayer.play();
    this.playingUrl.set(url);
    this.audioPlayer.onended = () => this.playingUrl.set(null);
  }

  addTrack(dzTrack: any): void {
    if (this.selectedTracks().length >= 5) return;
    if (this.selectedTracks().some(t => t.deezerTrackId === String(dzTrack.id))) return;

    const nueva = {
      deezerTrackId: String(dzTrack.id),
      titulo: dzTrack.title,
      artista: dzTrack.artist.name,
      albumTitulo: dzTrack.album.title,
      albumCover: dzTrack.album.cover_medium,
      previewMp3Url: dzTrack.preview
    };
    this.selectedTracks.update(lista => [...lista, nueva]);
    this.deezerQuery = '';
    this.deezerResults.set([]);
  }

  removeTrack(index: number): void {
    this.selectedTracks.update(lista => lista.filter((_, i) => i !== index));
  }

  // --- PASO 3: ETIQUETAS Y PUBLICACIÓN ---
  toggleTag(idTag: number): void {
    const actuales = this.selectedTagIds();
    if (actuales.includes(idTag)) {
      this.selectedTagIds.set(actuales.filter(id => id !== idTag));
    } else if (actuales.length < 3) {
      this.selectedTagIds.set([...actuales, idTag]);
    }
  }

  publicar(): void {
    this.errorMessage.set('');

    if (!this.selectedMedia()) {
      this.errorMessage.set('Selecciona al menos una película o libro en el Paso 1.');
      return;
    }
    if (this.selectedTracks().length === 0) {
      this.errorMessage.set('Añade al menos 1 canción en el Paso 2.');
      return;
    }
    if (!this.titulo.trim() || this.selectedTagIds().length === 0) {
      this.errorMessage.set('Pon un título y elige entre 1 y 3 etiquetas en el Paso 3.');
      return;
    }

    const media = this.selectedMedia();
    const extraMedia = this.selectedSecondaryMedia();

    let descripcionFinal = this.descripcion.trim();
    if (extraMedia) {
      const etiquetaExtra = extraMedia.type === 'libro' ? 'Libro vinculado' : 'Película vinculada';
      const anioExtra = extraMedia.year ? ` (${extraMedia.year})` : '';
      const notaObra = `${etiquetaExtra}: ${extraMedia.title}${anioExtra}`;
      descripcionFinal = descripcionFinal ? `${descripcionFinal} — ${notaObra}` : notaObra;
    }

    const payload = {
      user: { idUsuario: 1 },
      titulo: this.titulo.trim(),
      descripcion: descripcionFinal || null,
      mediaType: this.mediaType(),
      mediaExternalId: media.externalId,
      mediaTitle: media.title,
      mediaYear: media.year,
      coverUrl: media.coverUrl,
      backdropUrl: media.backdropUrl,
      paleta: JSON.stringify(this.palette()),
      tags: this.selectedTagIds().map(id => ({ idTag: id })),
      tracks: this.selectedTracks()
    };

    this.publicando.set(true);
    this.moodboardService.crearMoodboard(payload).subscribe({
      next: () => {
        this.publicadoConExito = true;
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        this.audioPlayer.pause();
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set('Error al guardar en Spring Boot. Revisa Eclipse.');
        this.publicando.set(false);
      }
    });
  }
}