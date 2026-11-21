import { Routes } from '@angular/router';
import { Explorar } from './components/explorar/explorar';
import { Crear } from './components/crear/crear';
import { Detalle } from './components/detalle/detalle';
import { Perfil } from './components/perfil/perfil';

export const routes: Routes = [
  { path: '', component: Explorar },
  { path: 'crear', component: Crear },
  { path: 'moodboard/:id', component: Detalle },
  { path: 'perfil', component: Perfil },
  { path: '**', redirectTo: '' }
];