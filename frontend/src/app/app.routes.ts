import { Routes } from '@angular/router';
import { Explorar } from './components/explorar/explorar'; // <-- Nombre real de tu archivo explorar.ts
import { Crear } from './components/crear/crear';

export const routes: Routes = [
  { path: '', component: Explorar },
  { path: 'crear', component: Crear },
  { path: '**', redirectTo: '' }
];