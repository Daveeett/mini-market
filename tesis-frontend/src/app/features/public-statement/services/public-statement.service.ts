import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env';
import { ApiResponse } from '@shared/models/api.models';
import { PublicStatementResponse } from '../interfaces/responses/public-statement-response.interface';

@Injectable({ providedIn: 'root' })
export class PublicStatementService {
  constructor(private readonly http: HttpClient) {}

  getPublicStatement(token: string) {
    return this.http.get<ApiResponse<PublicStatementResponse>>(
      `${environment.apiBaseUrl}/public/statements/${token}`
    );
  }
}