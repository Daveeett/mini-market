import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env';
import { ApiResponse } from '@shared/models/api.models';

export interface WalletMovement {
  id: string;
  type?: 'RECHARGE' | 'PAYMENT' | 'BONUS' | string;
  movementType?: 'RECHARGE' | 'PAYMENT' | 'BONUS' | string;
  amount: string;
  bonusAmount?: string;
  totalCredited?: string;
  concept?: string;
  description?: string;
  balanceAfter?: string;
  method: string;
  createdAt: string;
}

export interface WalletDetails {
  customerId: string;
  customerName: string;
  walletBalance: string;
  movements: WalletMovement[];
}

@Injectable({ providedIn: 'root' })
export class WalletService {
  constructor(private readonly http: HttpClient) {}

  getWallet(customerId: string) {
    return this.getWalletDetails(customerId);
  }

  getWalletDetails(customerId: string) {
    return this.http.get<ApiResponse<WalletDetails>>(
      `${environment.apiBaseUrl}/wallet/customer/${customerId}`,
    );
  }

  rechargeWallet(payload: {
    customerId: string;
    amount: number;
    bonusPercent?: number;
    method?: 'CASH' | 'TRANSFER';
  }) {
    return this.http.post<ApiResponse<any>>(
      `${environment.apiBaseUrl}/wallet/recharge`,
      payload,
    );
  }

  payWithWallet(payload: {
    customerId: string;
    amount: number;
    concept?: string;
  }) {
    return this.http.post<ApiResponse<any>>(
      `${environment.apiBaseUrl}/wallet/pay`,
      payload,
    );
  }
}
