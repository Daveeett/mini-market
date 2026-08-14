import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env';
import { ApiResponse } from '@shared/models/api.models';
import { Customer } from '../interfaces/requests/customer.interface';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  constructor(private readonly http: HttpClient) {}

  getCustomers() {
    return this.http.get<ApiResponse<Customer[]>>(`${environment.apiBaseUrl}/customers`);
  }

  createCustomer(payload: {
    docType: string;
    docNumber: string;
    fullName: string;
    phone: string;
    email?: string;
    description?: string;
    maxCredit: number;
  }) {
    return this.http.post<ApiResponse<Customer>>(`${environment.apiBaseUrl}/customers`, payload);
  }
}