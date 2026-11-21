import { Routes } from '@angular/router';
import { Explorar } from './components/explorar/explorar'; // <-- Nombre real de tu archivo explorar.ts

export const routes: Routes = [
  { path: '', component: Explorar },
  { path: '**', redirectTo: '' }
];