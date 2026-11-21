import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MoodboardService } from '../../services/moodboard';

@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './explorar.html',
  styleUrl: './explorar.css'
})
export class Explorar implements OnInit, OnDestroy {
  private moodboardService = inject(MoodboardService);

  moodboards = signal<any[]>([]);
  cargando = signal<boolean>(true);
  tagSeleccionado = signal<string>('Todos');
  busqueda = signal<string>('');
  urlSonando = signal<string | null>(null);

  tagsFiltro: string[] = [
    'Todos',
    'Melancólico',
    'Energético',
    'Acogedor',
    'Oscuro',
    'Nostálgico',
    'Épico',
    'Relajante',
    'Misterioso'
  ];

  audioPlayer = new Audio();

  ngOnInit(): void {
    this.cargarMoodboards();
  }

  ngOnDestroy(): void {
    this.detenerAudio();
  }

  cargarMoodboards(tag?: string): void {
    this.cargando.set(true);
    const filtro = tag && tag !== 'Todos' ? tag : undefined;

    this.moodboardService.getMoodboards(filtro).subscribe({
      next: (datos) => {
        this.moodboards.set(datos || []);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error conectando con Spring Boot:', err);
        this.cargando.set(false);
      }
    });
  }

  filtrarPorTag(tag: string): void {
    this.tagSeleccionado.set(tag);
    this.cargarMoodboards(tag);
  }

  moodboardsFiltrados(): any[] {
    const texto = this.busqueda().trim().toLowerCase();
    if (!texto) {
      return this.moodboards();
    }

    return this.moodboards().filter((mb) => {
      const enTitulo = (mb.titulo || '').toLowerCase().includes(texto);
      const enObra = (mb.mediaTitle || '').toLowerCase().includes(texto);
      const enLibro = (mb.bookTitle || '').toLowerCase().includes(texto);
      const enDescripcion = (mb.descripcion || '').toLowerCase().includes(texto);
      const enTags = (mb.tags || []).some((t: any) =>
        (t.nombre || '').toLowerCase().includes(texto)
      );

      return enTitulo || enObra || enLibro || enDescripcion || enTags;
    });
  }

  obtenerColores(paletaJson: any): string[] {
    if (!paletaJson) return ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8'];
    try {
      const parsed = typeof paletaJson === 'string' ? JSON.parse(paletaJson) : paletaJson;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : ['#1e293b', '#334155', '#475569'];
    } catch {
      return ['#1e293b', '#334155', '#475569'];
    }
  }

  tieneAudioValido(mb: any): boolean {
    const url = (mb?.tracks?.[0]?.previewMp3Url || '').trim();
    return url.startsWith('http://') || url.startsWith('https://');
  }

  togglePlay(url: string | undefined | null): void {
    const limpia = (url || '').trim();
    if (!limpia.startsWith('http://') && !limpia.startsWith('https://')) {
      this.detenerAudio();
      return;
    }

    if (this.urlSonando() === limpia && !this.audioPlayer.paused) {
      this.detenerAudio();
      return;
    }

    this.audioPlayer.pause();
    this.audioPlayer.src = limpia;
    this.audioPlayer.load();
    this.urlSonando.set(limpia);

    this.audioPlayer.onended = () => {
      this.urlSonando.set(null);
    };

    this.audioPlayer.onerror = () => {
      this.detenerAudio();
    };

    this.audioPlayer.play().catch(() => {
      this.detenerAudio();
    });
  }

  private detenerAudio(): void {
    this.audioPlayer.pause();
    this.audioPlayer.removeAttribute('src');
    this.urlSonando.set(null);
  }
}