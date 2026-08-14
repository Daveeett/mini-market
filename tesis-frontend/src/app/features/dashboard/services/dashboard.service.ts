import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env';
import { ApiResponse } from '@shared/models/api.models';
import { DashboardAlert } from '../interfaces/request/dashboard-alert.interface';
import { DashboardStats } from '../interfaces/request/dashboard-stats.interface';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private readonly http: HttpClient) {}

  getDashboardAlerts() {
    return this.http.get<ApiResponse<DashboardAlert[]>>(
      `${environment.apiBaseUrl}/dashboard/alerts/overdue`,
    );
  }

  getDashboardStats() {
    return this.http.get<ApiResponse<DashboardStats>>(
      `${environment.apiBaseUrl}/dashboard/stats`,
    );
  }
}