import { Component, OnInit, inject, signal } from '@angular/core';
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
export class Explorar implements OnInit {
  private moodboardService = inject(MoodboardService);

  // Usamos signals para que Angular actualice la pantalla al instante al llegar los datos
  moodboards = signal<any[]>([]);
  cargando = signal<boolean>(true);
  tagSeleccionado = signal<string>('Todos');
  urlSonando = signal<string | null>(null);

  tagsFiltro: string[] = ['Todos', 'Melancólico', 'Oscuro', 'Acogedor', 'Nostálgico', 'Épico', 'Relajante'];
  audioPlayer = new Audio();

  ngOnInit(): void {
    this.cargarMoodboards();
  }

  cargarMoodboards(tag?: string): void {
    this.cargando.set(true);
    const filtro = tag && tag !== 'Todos' ? tag : undefined;
    
    this.moodboardService.getMoodboards(filtro).subscribe({
      next: (datos) => {
        this.moodboards.set(datos);
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

  obtenerColores(paletaJson: string): string[] {
    if (!paletaJson) return ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8'];
    try {
      return JSON.parse(paletaJson);
    } catch {
      return ['#1e293b', '#334155', '#475569'];
    }
  }

  togglePlay(url: string): void {
    if (this.urlSonando() === url && !this.audioPlayer.paused) {
      this.audioPlayer.pause();
      this.urlSonando.set(null);
      return;
    }

    this.audioPlayer.src = url;
    this.audioPlayer.play();
    this.urlSonando.set(url);

    this.audioPlayer.onended = () => {
      this.urlSonando.set(null);
    };
  }
}