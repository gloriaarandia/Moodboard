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
}