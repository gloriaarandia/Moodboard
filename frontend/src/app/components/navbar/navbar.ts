import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MoodboardService } from '../../services/moodboard';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {
  private router = inject(Router);
  private moodboardService = inject(MoodboardService);

  mostrarModalSorprendeme = signal<boolean>(false);
  cargandoSorprendeme = signal<boolean>(false);
  errorSorprendeme = signal<string>('');

  estadosAnimo = [
    { emoji: '🌧️', nombre: 'Melancólico' },
    { emoji: '⚡', nombre: 'Energético' },
    { emoji: '☕', nombre: 'Acogedor' },
    { emoji: '🌑', nombre: 'Oscuro' },
    { emoji: '🎞️', nombre: 'Nostálgico' },
    { emoji: '⚔️', nombre: 'Épico' },
    { emoji: '🌿', nombre: 'Relajante' },
    { emoji: '🕯️', nombre: 'Misterioso' }
  ];

  abrirModalSorprendeme(): void {
    this.errorSorprendeme.set('');
    this.mostrarModalSorprendeme.set(true);
  }

  cerrarModalSorprendeme(): void {
    this.mostrarModalSorprendeme.set(false);
  }

  elegirEstadoAnimo(tag?: string): void {
    this.errorSorprendeme.set('');
    this.cargandoSorprendeme.set(true);

    this.moodboardService.getRandomMoodboard(tag).subscribe({
      next: (mb) => {
        this.cargandoSorprendeme.set(false);
        this.mostrarModalSorprendeme.set(false);
        this.router.navigate(['/moodboard', mb.idMoodboard], {
          queryParams: { autoplay: '1' }
        });
      },
      error: () => {
        this.cargandoSorprendeme.set(false);
        this.errorSorprendeme.set(
          tag
            ? `No hay moodboards con "${tag}" todavía.`
            : 'No se encontró ningún moodboard aleatorio.'
        );
      }
    });
  }
}