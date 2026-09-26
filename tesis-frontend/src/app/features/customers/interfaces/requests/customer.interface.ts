import { SemaphoreStatus } from "@shared/models/semaphore.model";

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  docType: string;
  docNumber: string;
  email?: string;
  address?: string;
  description?: string;
  maxCredit: number;
  walletBalance?: string;
  semaphore?: {
    status: SemaphoreStatus;
    reason: string;
    daysToDue?: number;
  };
}