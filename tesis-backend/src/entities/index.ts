import { User } from "./user.entity";
import { Customer } from "./customer.entity";
import { Product } from "./product.entity";
import { Sale } from "./sale.entity";
import { SaleItem } from "./sale-item.entity";
import { CashSession } from "./cash-session.entity";
import { CashMovement } from "./cash-movement.entity";
import { CreditAccount } from "./credit-account.entity";
import { Credit } from "./credit.entity";
import { CreditItem } from "./credit-item.entity";
import { Payment } from "./payment.entity";
import { AccountStatement } from "./account-statement.entity";
import { NotificationLog } from "./notification-log.entity";
import { Offer } from "./offer.entity";
import { WalletMovement } from "./wallet-movement.entity";
import { ProductCrossSell } from "./product-cross-sell.entity";

export const entities = [
  User,
  Customer,
  Product,
  Sale,
  SaleItem,
  CashSession,
  CashMovement,
  CreditAccount,
  Credit,
  CreditItem,
  Payment,
  AccountStatement,
  NotificationLog,
  Offer,
  WalletMovement,
  ProductCrossSell,
];
