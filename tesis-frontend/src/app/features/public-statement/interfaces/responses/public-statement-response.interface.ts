import { PublicStatementCustomer } from './public-statement-customer.interface';
import { PublicStatementTotals } from './public-statement-totals.interface';
import { PublicStatementCredit } from './public-statement-credit.interface';

export interface PublicStatementResponse {
  customer: PublicStatementCustomer;
  totals: PublicStatementTotals;
  credits: PublicStatementCredit[];
}
