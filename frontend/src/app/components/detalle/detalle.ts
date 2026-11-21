import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MoodboardService } from '../../services/moodboard';

interface ObraSecundaria {
  tipo: 'pelicula' | 'libro';
  titulo: string;
  anio?: number | null;
  coverUrl?: string | null;
}

interface FichaObraDetalle {
  tipo: 'pelicula' | 'libro';
  titulo: string;
  anio?: number | null;
  sinopsis: string;
  meta?: string;
}

@Component({
  selector: 'app-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './detalle.html',
  styleUrl: './detalle.css'
})
export class Detalle implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private moodboardService = inject(MoodboardService);

  private readonly TMDB_API_KEY = 'b93383600bce5987b0f438644ab56604';

  moodboard = signal<any | null>(null);
  obraSecundaria = signal<ObraSecundaria | null>(null);
  fichaActiva = signal<FichaObraDetalle | null>(null);
  cargandoFicha = signal<boolean>(false);

  cargando = signal<boolean>(true);
  errorMsg = signal<string>('');
  copiadoHex = signal<string>('');
  guardado = signal<boolean>(false);

  private audio = new Audio();
  currentTrackIndex = signal<number>(0);
  isPlaying = signal<boolean>(false);
  progressPercent = signal<number>(0);
  currentTimeLabel = signal<string>('0:00');
  durationLabel = signal<string>('0:30');
  audioErrorMsg = signal<string>('');

  paletteColors = computed(() => {
    const mb = this.moodboard();
    if (!mb?.paleta) return ['#0f172a', '#1e1b4b', '#312e81', '#4c1d95', '#020617'];
    try {
      const parsed = typeof mb.paleta === 'string' ? JSON.parse(mb.paleta) : mb.paleta;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : ['#0f172a', '#1e1b4b', '#312e81'];
    } catch {
      return ['#0f172a', '#1e1b4b', '#312e81'];
    }
  });

  backgroundGradient = computed(() => {
    const c = this.paletteColors();
    const c1 = c[0] || '#0f172a';
    const c2 = c[1] || '#1e1b4b';
    const c3 = c[2] || c1;
    return `
      radial-gradient(circle at 18% 20%, ${c1}cc 0%, transparent 55%),
      radial-gradient(circle at 82% 28%, ${c2}aa 0%, transparent 60%),
      linear-gradient(160deg, ${c1}dd 0%, #020617f5 68%, ${c3}99 100%)
    `;
  });

  descripcionLimpia = computed(() => {
    const desc: string = this.moodboard()?.descripcion || '';
    return desc
      .replace(/\s*—?\s*(Libro vinculado|Película vinculada|Maridaje literario|Maridaje cinematográfico):\s*.+?(?=(\s*—|$))/gi, '')
      .trim();
  });

  activeTrack = computed(() => {
    const tracks = this.moodboard()?.tracks || [];
    return tracks[this.currentTrackIndex()] || null;
  });

  ngOnInit(): void {
    this.configurarEventosAudio();
    const id = this.route.snapshot.paramMap.get('id');
    const autoplay = this.route.snapshot.queryParamMap.get('autoplay') === '1';

    if (!id) {
      this.errorMsg.set('No se indicó ningún moodboard.');
      this.cargando.set(false);
      return;
    }

    this.moodboardService.getMoodboardById(id).subscribe({
      next: (data) => {
        this.moodboard.set(data);
        const yaGuardado = (data.savedByUsers || []).some((u: any) => u.idUsuario === 1);
        this.guardado.set(yaGuardado);
        this.resolverObraSecundaria(data);
        this.cargando.set(false);

        if (data.tracks?.length > 0) {
          this.cargarPista(0, autoplay);
        }
      },
      error: () => {
        this.errorMsg.set('No se pudo cargar este moodboard.');
        this.cargando.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.audio.pause();
    this.audio.removeAttribute('src');
  }

  abrirDetallesObraPrincipal(): void {
    const mb = this.moodboard();
    if (!mb) return;

    const tipo: 'pelicula' | 'libro' = mb.mediaType === 'libro' ? 'libro' : 'pelicula';
    this.cargarDetallesObra(tipo, mb.mediaTitle, mb.mediaYear, mb.mediaExternalId);
  }

  abrirDetallesObraSecundaria(): void {
    const sec = this.obraSecundaria();
    if (!sec) return;

    this.cargarDetallesObra(sec.tipo, sec.titulo, sec.anio, null);
  }

  private cargarDetallesObra(
    tipo: 'pelicula' | 'libro',
    titulo: string,
    anio?: number | null,
    externalId?: string | null
  ): void {
    this.fichaActiva.set({
      tipo,
      titulo,
      anio,
      sinopsis: 'Cargando detalles...',
      meta: ''
    });
    this.cargandoFicha.set(true);

    if (tipo === 'pelicula') {
      const buscarPorId = (movieId: string) => {
        const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${this.TMDB_API_KEY}&language=es-ES`;
        this.http.get<any>(url).subscribe({
          next: (res) => {
            const nota = res.vote_average ? `★ ${Number(res.vote_average).toFixed(1)}/10` : '';
            const duracion = res.runtime ? `${res.runtime} min` : '';
            const generos = (res.genres || []).slice(0, 3).map((g: any) => g.name).join(', ');
            this.fichaActiva.set({
              tipo: 'pelicula',
              titulo: res.title || titulo,
              anio: res.release_date ? Number(res.release_date.slice(0, 4)) : anio,
              sinopsis: res.overview || 'Sinopsis no disponible.',
              meta: [nota, duracion, generos].filter(Boolean).join(' • ')
            });
            this.cargandoFicha.set(false);
          },
          error: () => {
            this.fichaActiva.update((prev) =>
              prev ? { ...prev, sinopsis: 'No se pudo cargar la sinopsis de la película.' } : null
            );
            this.cargandoFicha.set(false);
          }
        });
      };

      if (externalId) {
        buscarPorId(externalId);
      } else {
        const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${this.TMDB_API_KEY}&query=${encodeURIComponent(titulo)}&language=es-ES`;
        this.http.get<any>(searchUrl).subscribe({
          next: (res) => {
            const movie = res?.results?.[0];
            if (movie?.id) {
              buscarPorId(String(movie.id));
            } else {
              this.fichaActiva.update((prev) =>
                prev ? { ...prev, sinopsis: 'Sinopsis no disponible.' } : null
              );
              this.cargandoFicha.set(false);
            }
          },
          error: () => this.cargandoFicha.set(false)
        });
      }
    } else {
      const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(titulo)}&limit=1`;
      this.http.get<any>(searchUrl).subscribe({
        next: (res) => {
          const doc = res?.docs?.[0];
          const autor = doc?.author_name?.[0] ? `Autor: ${doc.author_name[0]}` : '';
          const paginas = doc?.number_of_pages_median ? `${doc.number_of_pages_median} págs.` : '';
          const anioLibro = doc?.first_publish_year || anio;
          const metaBase = [autor, paginas].filter(Boolean).join(' • ');

          const mostrarSinopsisEnEspanol = (textoOriginal: string) => {
            const limpio = textoOriginal.trim();
            if (!limpio) {
              this.fichaActiva.set({
                tipo: 'libro',
                titulo,
                anio: anioLibro,
                sinopsis: 'Sinopsis no disponible para este libro.',
                meta: metaBase
              });
              this.cargandoFicha.set(false);
              return;
            }

            const pareceEspanol =
              /[áéíóúñ¿¡]/i.test(limpio) ||
              /\b(el|la|los|las|de|del|en|una|uno|con|por|para|historia|novela)\b/i.test(limpio);

            if (pareceEspanol) {
              this.fichaActiva.set({
                tipo: 'libro',
                titulo,
                anio: anioLibro,
                sinopsis: limpio,
                meta: metaBase
              });
              this.cargandoFicha.set(false);
              return;
            }

            const fragmento = limpio.slice(0, 450);
            const translateUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(fragmento)}&langpair=en|es`;
            this.http.get<any>(translateUrl).subscribe({
              next: (tr) => {
                const traducido = tr?.responseData?.translatedText?.trim();
                const textoFinal =
                  traducido && !traducido.toUpperCase().includes('MYMEMORY WARNING')
                    ? traducido + (limpio.length > 450 ? '...' : '')
                    : limpio;

                this.fichaActiva.set({
                  tipo: 'libro',
                  titulo,
                  anio: anioLibro,
                  sinopsis: textoFinal,
                  meta: metaBase
                });
                this.cargandoFicha.set(false);
              },
              error: () => {
                this.fichaActiva.set({
                  tipo: 'libro',
                  titulo,
                  anio: anioLibro,
                  sinopsis: limpio,
                  meta: metaBase
                });
                this.cargandoFicha.set(false);
              }
            });
          };

          const workKey: string | undefined = doc?.key;
          if (workKey) {
            this.http.get<any>(`https://openlibrary.org${workKey}.json`).subscribe({
              next: (workData) => {
                const rawDesc =
                  typeof workData?.description === 'string'
                    ? workData.description
                    : workData?.description?.value || '';
                const primerParrafo = rawDesc.split('\r\n\r\n')[0].split('\n\n')[0].trim();
                mostrarSinopsisEnEspanol(primerParrafo);
              },
              error: () => mostrarSinopsisEnEspanol('')
            });
          } else {
            mostrarSinopsisEnEspanol('');
          }
        },
        error: () => {
          this.fichaActiva.update((prev) =>
            prev ? { ...prev, sinopsis: 'No se pudieron cargar los detalles del libro.' } : null
          );
          this.cargandoFicha.set(false);
        }
      });
    }
  }

  cerrarFichaObra(): void {
    this.fichaActiva.set(null);
  }

  private resolverObraSecundaria(mb: any): void {
    this.obraSecundaria.set(null);
    const desc: string = mb?.descripcion || '';

    const matchLibro = desc.match(/(?:Libro vinculado|Maridaje literario):\s*(.+?)(?:\s*\((\d{4})\))?(?:\s*—|$)/i);
    const matchPeli = desc.match(/(?:Película vinculada|Maridaje cinematográfico):\s*(.+?)(?:\s*\((\d{4})\))?(?:\s*—|$)/i);

    if (matchLibro) {
      const titulo = matchLibro[1].trim();
      const anio = matchLibro[2] ? Number(matchLibro[2]) : null;
      this.obraSecundaria.set({ tipo: 'libro', titulo, anio, coverUrl: null });
      this.buscarPortadaSecundaria('libro', titulo);
    } else if (matchPeli) {
      const titulo = matchPeli[1].trim();
      const anio = matchPeli[2] ? Number(matchPeli[2]) : null;
      this.obraSecundaria.set({ tipo: 'pelicula', titulo, anio, coverUrl: null });
      this.buscarPortadaSecundaria('pelicula', titulo);
    }
  }

  private buscarPortadaSecundaria(tipo: 'pelicula' | 'libro', titulo: string): void {
    if (tipo === 'libro') {
      const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(titulo)}&limit=1`;
      this.http.get<any>(url).subscribe({
        next: (res) => {
          const doc = res?.docs?.[0];
          if (doc?.cover_i) {
            this.obraSecundaria.update((prev) =>
              prev ? { ...prev, coverUrl: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` } : null
            );
          }
        }
      });
    } else {
      const url = `https://api.themoviedb.org/3/search/movie?api_key=${this.TMDB_API_KEY}&query=${encodeURIComponent(titulo)}&language=es-ES`;
      this.http.get<any>(url).subscribe({
        next: (res) => {
          const movie = res?.results?.[0];
          if (movie?.poster_path) {
            this.obraSecundaria.update((prev) =>
              prev ? { ...prev, coverUrl: `https://image.tmdb.org/t/p/w500${movie.poster_path}` } : null
            );
          }
        }
      });
    }
  }

  private configurarEventosAudio(): void {
    this.audio.addEventListener('timeupdate', () => {
      if (!this.audio.duration) return;
      this.progressPercent.set((this.audio.currentTime / this.audio.duration) * 100);
      this.currentTimeLabel.set(this.formatearSegundos(this.audio.currentTime));
      this.durationLabel.set(this.formatearSegundos(this.audio.duration));
    });

    this.audio.addEventListener('ended', () => {
      const tracks = this.moodboard()?.tracks || [];
      if (this.currentTrackIndex() + 1 < tracks.length) {
        this.cargarPista(this.currentTrackIndex() + 1, true);
      } else {
        this.cargarPista(0, false);
      }
    });

    this.audio.addEventListener('error', () => {
      this.isPlaying.set(false);
      this.audioErrorMsg.set('La vista previa de esta canción no está disponible o ha caducado.');
    });
  }

  cargarPista(index: number, reproducir: boolean): void {
    const tracks = this.moodboard()?.tracks || [];
    const track = tracks[index];
    if (!track) return;

    this.currentTrackIndex.set(index);
    this.progressPercent.set(0);
    this.currentTimeLabel.set('0:00');
    this.audioErrorMsg.set('');

    const url = (track.previewMp3Url || '').trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.isPlaying.set(false);
      this.audioErrorMsg.set('Esta canción no dispone de fragmento de audio en Deezer.');
      return;
    }

    this.audio.pause();
    this.audio.src = url;
    this.audio.load();

    if (reproducir) {
      this.audio.play().then(() => {
        this.isPlaying.set(true);
      }).catch(() => {
        this.isPlaying.set(false);
        this.audioErrorMsg.set('No se pudo reproducir la vista previa de esta pista.');
      });
    } else {
      this.isPlaying.set(false);
    }
  }

  togglePlayPause(): void {
    const url = (this.activeTrack()?.previewMp3Url || '').trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      this.audioErrorMsg.set('Esta canción no dispone de fragmento de audio en Deezer.');
      return;
    }

    if (this.audio.paused) {
      this.audio.play().then(() => {
        this.isPlaying.set(true);
        this.audioErrorMsg.set('');
      }).catch(() => {
        this.isPlaying.set(false);
        this.audioErrorMsg.set('No se pudo reproducir la vista previa de esta pista.');
      });
    } else {
      this.audio.pause();
      this.isPlaying.set(false);
    }
  }

  siguientePista(): void {
    const tracks = this.moodboard()?.tracks || [];
    if (tracks.length === 0) return;
    this.cargarPista((this.currentTrackIndex() + 1) % tracks.length, true);
  }

  anteriorPista(): void {
    const tracks = this.moodboard()?.tracks || [];
    if (tracks.length === 0) return;
    this.cargarPista((this.currentTrackIndex() - 1 + tracks.length) % tracks.length, true);
  }

  buscarEnBarra(event: Event): void {
    if (!this.audio.duration) return;
    const valor = Number((event.target as HTMLInputElement).value);
    this.audio.currentTime = (valor / 100) * this.audio.duration;
    this.progressPercent.set(valor);
  }

  copiarColor(hex: string): void {
    navigator.clipboard?.writeText(hex);
    this.copiadoHex.set(`Copiado ${hex}`);
    setTimeout(() => this.copiadoHex.set(''), 1400);
  }

  alternarGuardado(): void {
    const mb = this.moodboard();
    if (!mb) return;
    this.moodboardService.toggleSave(mb.idMoodboard, 1).subscribe({
      next: (res) => {
        this.guardado.set(res.includes('Guardado'));
      }
    });
  }

  private formatearSegundos(segundos: number): string {
    const min = Math.floor(segundos / 60);
    const seg = Math.floor(segundos % 60).toString().padStart(2, '0');
    return `${min}:${seg}`;
  }
}