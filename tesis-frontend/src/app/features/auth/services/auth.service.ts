import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '@env';
import { ApiResponse } from '@shared/models/api.models';
import { Login } from '../interfaces/requests/login.interface';
import { AuthUser } from '../interfaces/requests/auth-user.interface';
import { LoginData } from '../interfaces/requests/login-data.interface';



@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'mmu_token';
  private readonly userKey = 'mmu_user';
  private readonly userSignal = signal<AuthUser | null>(this.loadUser());
  private readonly authSignal = computed(() => !!this.userSignal());
  private readonly router = inject(Router);

  constructor(private readonly http: HttpClient) {}

  isAuthenticated() {
    return this.authSignal;
  }

  getCurrentUser() {
    return this.userSignal.asReadonly();
  }

  isAdmin(): boolean {
    return this.userSignal()?.role === 'ADMIN';
  }

  getRole(): 'ADMIN' | 'CAJERO' | null {
    return this.userSignal()?.role ?? null;
  }

  login(request: Login) {
    return this.http
      .post<ApiResponse<LoginData>>(`${environment.apiBaseUrl}/auth/login`, request)
      .pipe(
        tap((response) => {
          localStorage.setItem(this.tokenKey, response.data.token);
          localStorage.setItem(this.userKey, JSON.stringify(response.data.user));
          this.userSignal.set(response.data.user);
        }),
      );
  }

  logout(): void {
    const token = this.getToken();
    const clearStorage = () => {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
      this.userSignal.set(null);
      void this.router.navigateByUrl('/login');
    };

    if (token) {
      this.http.post(`${environment.apiBaseUrl}/auth/logout`, {}).subscribe({
        next: () => clearStorage(),
        error: () => clearStorage(),
      });
    } else {
      clearStorage();
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private loadUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(this.userKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id && parsed.email && parsed.role) {
        return parsed as AuthUser;
      }
      return null;
    } catch {
      localStorage.removeItem(this.userKey);
      return null;
    }
  }
}
