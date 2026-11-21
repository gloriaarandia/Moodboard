import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {
  abrirRuleta() {
    alert('Aquí abriremos la Ruleta de Mood el Fin de Semana 5');
  }
}