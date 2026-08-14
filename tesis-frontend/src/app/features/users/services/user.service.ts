import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env';
import { ApiResponse } from '@shared/models/api.models';
import { AuthUser } from '../../auth/interfaces/requests/auth-user.interface';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private readonly http: HttpClient) {}

  createCajero(payload: { name: string; email: string; password: string }) {
    return this.http.post<ApiResponse<AuthUser>>(
      `${environment.apiBaseUrl}/auth/cajeros`,
      payload,
    );
  }
}
