import { PublicStatementItem } from './public-statement-item.interface';

export interface PublicStatementCredit {
  id: string;
  createdAt: string;
  dueDate: string;
  amount: string;
  baseAmount?: number | string;
  surchargePercent?: number | string;
  surchargeAmount?: number | string;
  status: string;
  items: PublicStatementItem[];
}
