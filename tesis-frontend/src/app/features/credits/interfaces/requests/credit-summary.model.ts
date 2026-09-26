export interface CreditSummary {
  id: string;
  dueDate: string;
  amount: string;
  baseAmount?: string;
  surchargePercent?: string;
  surchargeAmount?: string;
  status: string;
  createdAt?: string;
}