import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env';
import { ApiResponse } from '@shared/models/api.models';
import { CashSession } from '../interfaces/requests/cash-session.interface';
import { CashHistoryEntry } from '../interfaces/requests/cash-history-entry.interface';

@Injectable({ providedIn: 'root' })
export class CashService {
  constructor(private readonly http: HttpClient) {}

  getOpenCash() {
    return this.http.get<ApiResponse<CashSession | null>>(`${environment.apiBaseUrl}/cash/status`);
  }

  openCash(openingBalance: number) {
    return this.http.post<ApiResponse<CashSession>>(`${environment.apiBaseUrl}/cash/open`, {
      openingBalance,
    });
  }

  addCashMovement(request: {
    movementType: 'INCOME' | 'EXPENSE';
    amount: number;
    concept: string;
  }) {
    return this.http.post<ApiResponse<CashSession>>(
      `${environment.apiBaseUrl}/cash/movements`,
      request,
    );
  }

  closeCash(closingBalance: number) {
    return this.http.post<ApiResponse<CashSession>>(`${environment.apiBaseUrl}/cash/close`, {
      closingBalance,
    });
  }

  getCashHistory() {
    return this.http.get<ApiResponse<CashHistoryEntry[]>>(`${environment.apiBaseUrl}/cash/history`);
  }
}