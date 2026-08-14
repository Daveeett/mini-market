import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env';
import { ApiResponse } from '@shared/models/api.models';
import { CreditDetail } from '../interfaces/requests/credit-detail.interface';
import { CreditSummary } from '../interfaces/requests/credit-summary.model';

@Injectable({ providedIn: 'root' })
export class CreditService {
  constructor(private readonly http: HttpClient) {}

  getCustomerCredits(customerId: string) {
    return this.http.get<ApiResponse<CreditSummary[]>>(
      `${environment.apiBaseUrl}/credits/customer/${customerId}`,
    );
  }

  createCredit(customerId: string, payload: { amount: number; dueDate: string; email: string }) {
    return this.http.post<ApiResponse<CreditDetail>>(
      `${environment.apiBaseUrl}/credits`,
      {
        customerId,
        ...payload,
      },
    );
  }

  getSemaphore(customerId: string) {
    return this.http.get<
      ApiResponse<{ status: 'GREEN' | 'YELLOW' | 'RED'; reason: string; daysToDue?: number }>
    >(`${environment.apiBaseUrl}/credits/customer/${customerId}/semaphore`);
  }

  createWhatsappReminder(creditId: string) {
    return this.http.post<
      ApiResponse<{ waLink: string; message: string; statementUrl: string }>
    >(`${environment.apiBaseUrl}/notifications/whatsapp/${creditId}`, {});
  }

  notifyGeneralDebt(customerId: string) {
    return this.http.post<
      ApiResponse<{ waLink: string; message: string; statementUrl: string }>
    >(`${environment.apiBaseUrl}/notifications/whatsapp/customer/${customerId}`, {});
  }
}