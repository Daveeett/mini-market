import { PublicStatementCustomer } from './public-statement-customer.interface';
import { PublicStatementTotals } from './public-statement-totals.interface';
import { PublicStatementCredit } from './public-statement-credit.interface';
import { Offer } from '@features/offers/interfaces/offer.interface';

export interface PublicStatementResponse {
  customer: PublicStatementCustomer;
  totals: PublicStatementTotals;
  credits: PublicStatementCredit[];
  offers?: Offer[];
}
