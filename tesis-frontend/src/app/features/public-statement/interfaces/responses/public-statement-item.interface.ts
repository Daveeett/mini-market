import { PublicStatementProduct } from './public-statement-product.interface';

export interface PublicStatementItem {
  qty: number;
  unitPrice: string;
  subtotal: string;
  product: PublicStatementProduct;
}
