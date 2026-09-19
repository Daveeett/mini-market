import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env';
import { ApiResponse } from '@shared/models/api.models';
import { Offer, CreateOfferRequest } from '../interfaces/offer.interface';

@Injectable({
  providedIn: 'root',
})
export class OfferService {
  constructor(private readonly http: HttpClient) {}

  getAllOffers() {
    return this.http.get<ApiResponse<Offer[]>>(`${environment.apiBaseUrl}/offers`);
  }

  getActiveOffers() {
    return this.http.get<ApiResponse<Offer[]>>(`${environment.apiBaseUrl}/offers/active`);
  }

  createOffer(data: CreateOfferRequest) {
    return this.http.post<ApiResponse<Offer>>(`${environment.apiBaseUrl}/offers`, data);
  }

  updateOffer(id: string, data: Partial<CreateOfferRequest>) {
    return this.http.put<ApiResponse<Offer>>(`${environment.apiBaseUrl}/offers/${id}`, data);
  }

  toggleOffer(id: string) {
    return this.http.patch<ApiResponse<Offer>>(`${environment.apiBaseUrl}/offers/${id}/toggle`, {});
  }

  deleteOffer(id: string) {
    return this.http.delete<ApiResponse<null>>(`${environment.apiBaseUrl}/offers/${id}`);
  }
}
