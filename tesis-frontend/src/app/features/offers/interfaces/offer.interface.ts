export interface Offer {
  id: string;
  title: string;
  description: string;
  badgeTag?: string;
  originalPrice?: string;
  offerPrice?: string;
  imageUrl?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOfferRequest {
  title: string;
  description: string;
  badgeTag?: string;
  originalPrice?: string;
  offerPrice?: string;
  imageUrl?: string;
  active?: boolean;
}
