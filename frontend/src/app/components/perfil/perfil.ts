import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MoodboardService } from '../../services/moodboard';

interface TopMoodItem {
  nombre: string;
  porcentaje: number;
  color: string;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit {
  private moodboardService = inject(MoodboardService);
  private readonly DEMO_USER_ID = 1;

  creados = signal<any[]>([]);
  guardados = signal<any[]>([]);
  pestanaActiva = signal<'creados' | 'guardados'>('creados');
  cargando = signal<boolean>(true);
  topMoods = signal<TopMoodItem[]>([]);

  // Estado de edición y eliminación
  editandoMoodboard = signal<any | null>(null);
  guardandoEdicion = signal<boolean>(false);
  eliminandoId = signal<number | null>(null);
  mensajeFeedback = signal<string>('');

  editTitulo = '';
  editDescripcion = '';
  editPaleta = signal<string[]>(['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8']);
  editTagIds = signal<number[]>([]);
  editTracks = signal<any[]>([]);

  deezerQuery = '';
  deezerResults = signal<any[]>([]);
  private deezerTimer: any;

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

  galeriaActiva = computed(() =>
    this.pestanaActiva() === 'creados' ? this.creados() : this.guardados()
  );

  ngOnInit(): void {
    this.cargarPerfil();
  }

  cargarPerfil(): void {
    this.cargando.set(true);
    this.moodboardService.getMoodboards().subscribe({
      next: (todos) => {
        const listaCreados = (todos || []).filter(
          (mb) => mb.user && mb.user.idUsuario === this.DEMO_USER_ID
        );
        const listaGuardados = (todos || []).filter((mb) =>
          (mb.savedByUsers || []).some((u: any) => u.idUsuario === this.DEMO_USER_ID)
        );

        this.creados.set(listaCreados);
        this.guardados.set(listaGuardados);

        const mapaUnico = new Map<number, any>();
        [...listaCreados, ...listaGuardados].forEach((mb) =>
          mapaUnico.set(mb.idMoodboard, mb)
        );

        this.calcularPasaporte(Array.from(mapaUnico.values()));
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      }
    });
  }

  private calcularPasaporte(moodboards: any[]): void {
    const conteo: Record<string, number> = {};
    moodboards.forEach((mb) => {
      (mb.tags || []).forEach((t: any) => {
        conteo[t.nombre] = (conteo[t.nombre] || 0) + 1;
      });
    });

    const ordenados = Object.entries(conteo)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (ordenados.length === 0) {
      this.topMoods.set([]);
      return;
    }

    const total = ordenados.reduce((acc, item) => acc + item[1], 0);
    const coloresBarra = ['#6366f1', '#ec4899', '#f59e0b'];
    let acumulado = 0;

    const resultado: TopMoodItem[] = ordenados.map(([nombre, cant], idx) => {
      let pct = Math.round((cant / total) * 100);
      if (idx === ordenados.length - 1) {
        pct = 100 - acumulado;
      } else {
        acumulado += pct;
      }
      return { nombre, porcentaje: pct, color: coloresBarra[idx] };
    });

    this.topMoods.set(resultado);
  }

  cambiarPestana(tab: 'creados' | 'guardados'): void {
    this.pestanaActiva.set(tab);
  }

  obtenerColores(paleta: any): string[] {
    if (!paleta) return ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8'];
    try {
      const parsed = typeof paleta === 'string' ? JSON.parse(paleta) : paleta;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : ['#1e293b', '#334155', '#475569'];
    } catch {
      return ['#1e293b', '#334155', '#475569'];
    }
  }

  abrirEdicion(mb: any, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.mensajeFeedback.set('');
    this.editandoMoodboard.set(mb);
    this.editTitulo = mb.titulo || '';
    this.editDescripcion = mb.descripcion || '';
    this.editPaleta.set([...this.obtenerColores(mb.paleta)]);
    this.editTagIds.set((mb.tags || []).map((t: any) => t.idTag));
    this.editTracks.set((mb.tracks || []).map((tr: any) => ({ ...tr })));
    this.deezerQuery = '';
    this.deezerResults.set([]);
  }

  cerrarEdicion(): void {
    this.editandoMoodboard.set(null);
    this.deezerResults.set([]);
    this.mensajeFeedback.set('');
  }

  actualizarColor(index: number, event: Event): void {
    const hex = (event.target as HTMLInputElement).value;
    const copia = [...this.editPaleta()];
    copia[index] = hex;
    this.editPaleta.set(copia);
  }

  toggleTagEdicion(idTag: number): void {
    const actuales = this.editTagIds();
    if (actuales.includes(idTag)) {
      this.editTagIds.set(actuales.filter((id) => id !== idTag));
    } else if (actuales.length < 3) {
      this.editTagIds.set([...actuales, idTag]);
    }
  }

  onDeezerSearch(): void {
    clearTimeout(this.deezerTimer);
    const q = this.deezerQuery.trim();
    if (q.length < 2) {
      this.deezerResults.set([]);
      return;
    }

    this.deezerTimer = setTimeout(() => {
      const cbName = 'dzPerfilCb_' + Date.now();
      const script = document.createElement('script');
      (window as any)[cbName] = (data: any) => {
        delete (window as any)[cbName];
        if (script.parentNode) document.body.removeChild(script);
        this.deezerResults.set((data.data || []).slice(0, 5));
      };
      script.src = `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=5&output=jsonp&callback=${cbName}`;
      document.body.appendChild(script);
    }, 350);
  }

  addTrackEdicion(dzTrack: any): void {
    if (this.editTracks().length >= 5) return;
    if (this.editTracks().some((t) => t.deezerTrackId === String(dzTrack.id))) return;

    const nueva = {
      deezerTrackId: String(dzTrack.id),
      titulo: dzTrack.title,
      artista: dzTrack.artist?.name || '',
      albumTitulo: dzTrack.album?.title || '',
      albumCover: dzTrack.album?.cover_medium || '',
      previewMp3Url: dzTrack.preview || ''
    };
    this.editTracks.update((lista) => [...lista, nueva]);
    this.deezerQuery = '';
    this.deezerResults.set([]);
  }

  removeTrackEdicion(index: number): void {
    this.editTracks.update((lista) => lista.filter((_, i) => i !== index));
  }

  guardarCambios(): void {
    const mb = this.editandoMoodboard();
    if (!mb) return;

    if (!this.editTitulo.trim()) {
      this.mensajeFeedback.set('El título no puede estar vacío.');
      return;
    }
    if (this.editTagIds().length === 0) {
      this.mensajeFeedback.set('Selecciona al menos 1 etiqueta (máximo 3).');
      return;
    }

    this.guardandoEdicion.set(true);
    this.mensajeFeedback.set('');

    const tracksLimpios = this.editTracks().map((tr: any) => ({
      deezerTrackId: String(tr.deezerTrackId || ''),
      titulo: tr.titulo || '',
      artista: tr.artista || '',
      albumTitulo: tr.albumTitulo || '',
      albumCover: tr.albumCover || '',
      previewMp3Url: tr.previewMp3Url || ''
    }));

    const payload: any = {
      titulo: this.editTitulo.trim(),
      descripcion: this.editDescripcion.trim() || null,
      paleta: JSON.stringify(this.editPaleta()),
      tags: this.editTagIds().map((id) => ({ idTag: id }))
    };

    if (tracksLimpios.length > 0) {
      payload.tracks = tracksLimpios;
    }

    this.moodboardService.actualizarMoodboard(mb.idMoodboard, payload).subscribe({
      next: () => {
        this.guardandoEdicion.set(false);
        this.editandoMoodboard.set(null);
        this.cargarPerfil();
      },
      error: (err) => {
        console.error('Error al actualizar moodboard:', err);
        this.guardandoEdicion.set(false);
        const detalle = typeof err?.error === 'string' && err.error ? ` (${err.error})` : ` (HTTP ${err?.status || 'sin conexión'})`;
        this.mensajeFeedback.set('No se pudieron guardar los cambios en el servidor' + detalle);
      }
    });
  }

  eliminarMoodboard(mb: any, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const confirmar = confirm(`¿Seguro que quieres eliminar el moodboard "${mb.titulo}"? Esta acción no se puede deshacer.`);
    if (!confirmar) return;

    this.eliminandoId.set(mb.idMoodboard);
    this.moodboardService.eliminarMoodboard(mb.idMoodboard).subscribe({
      next: () => {
        if (this.editandoMoodboard()?.idMoodboard === mb.idMoodboard) {
          this.cerrarEdicion();
        }
        this.eliminandoId.set(null);
        this.cargarPerfil();
      },
      error: (err) => {
        console.error('Error al eliminar moodboard:', err);
        this.eliminandoId.set(null);
        alert('No se pudo eliminar el moodboard en el servidor.');
      }
    });
  }
}