import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MoodboardService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/moodboards';

  getMoodboards(tag?: string): Observable<any[]> {
    const url = tag ? `${this.apiUrl}?tag=${encodeURIComponent(tag)}` : this.apiUrl;
    return this.http.get<any[]>(url);
  }

  getMoodboardById(id: string | number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  crearMoodboard(nuevoMoodboard: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, nuevoMoodboard);
  }

  getRandomMoodboard(tag?: string): Observable<any> {
    const url = tag ? `${this.apiUrl}/random?tag=${encodeURIComponent(tag)}` : `${this.apiUrl}/random`;
    return this.http.get<any>(url);
  }

  toggleSave(idMoodboard: number, idUser: number = 1): Observable<string> {
    return this.http.post(`${this.apiUrl}/${idMoodboard}/save?idUser=${idUser}`, {}, {
      responseType: 'text'
    });
  }

  actualizarMoodboard(id: string | number, datos: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, datos);
  }

  eliminarMoodboard(id: string | number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      responseType: 'text'
    });
  }
}