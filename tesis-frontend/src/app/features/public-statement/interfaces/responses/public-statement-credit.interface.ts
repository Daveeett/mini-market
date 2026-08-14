import { PublicStatementItem } from './public-statement-item.interface';

export interface PublicStatementCredit {
  id: string;
  createdAt: string;
  dueDate: string;
  amount: string;
  status: string;
  items: PublicStatementItem[];
}
