import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000/api/auth';
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  readonly currentUser = signal<User | null>(null);

  constructor() {
    const token = this.getToken();
    if (token) {
      this.http.get<User>(`${this.apiUrl}/profile`).subscribe({
        next: (user) => this.currentUser.set(user),
        error: () => this.logout(),
      });
    }
  }

  login(email: string, password: string): Observable<{ token: string; user: User }> {
    return this.http.post<{ token: string; user: User }>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((res) => {
        localStorage.setItem('auth_token', res.token);
        this.currentUser.set(res.user);
      })
    );
  }

  register(orgName: string, userName: string, email: string, password: string): Observable<{ token: string; user: User }> {
    return this.http.post<{ token: string; user: User }>(`${this.apiUrl}/register`, { orgName, userName, email, password }).pipe(
      tap((res) => {
        localStorage.setItem('auth_token', res.token);
        this.currentUser.set(res.user);
      })
    );
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
