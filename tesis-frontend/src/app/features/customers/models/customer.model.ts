import { SemaphoreStatus } from '@shared/models/semaphore.model';

export { SemaphoreStatus };

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  docType: string;
  docNumber: string;
  email?: string;
  description?: string;
  maxCredit: number;
  semaphore?: {
    status: SemaphoreStatus;
    reason: string;
    daysToDue?: number;
  };
}