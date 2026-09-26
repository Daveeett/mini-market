import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { CreditAccount } from "./credit-account.entity";
import { Sale } from "./sale.entity";
import { CreditStatus } from "./enums/credit-status.enum";
import { CreditItem } from "./credit-item.entity";
import { Payment } from "./payment.entity";
import { NotificationLog } from "./notification-log.entity";

@Entity("credits")
export class Credit extends BaseEntity {
  @ManyToOne(() => CreditAccount, (account) => account.credits, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "credit_account_id" })
  creditAccount!: CreditAccount;

  @OneToOne(() => Sale, (sale) => sale.credit, { nullable: false })
  @JoinColumn({ name: "sale_id" })
  sale!: Sale;

  @Column({ name: "credit_date", type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  creditDate!: Date;

  @Index()
  @Column({ name: "due_date", type: "date" })
  dueDate!: string;

  @Column({ name: "base_amount", type: "decimal", precision: 12, scale: 2, nullable: true })
  baseAmount?: string;

  @Column({ name: "surcharge_percent", type: "decimal", precision: 5, scale: 2, default: 0 })
  surchargePercent!: string;

  @Column({ name: "surcharge_amount", type: "decimal", precision: 12, scale: 2, default: 0 })
  surchargeAmount!: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  amount!: string;

  @Column({
    type: "enum",
    enum: CreditStatus,
    default: CreditStatus.OPEN,
  })
  status!: CreditStatus;

  @OneToMany(() => CreditItem, (item) => item.credit, { cascade: true })
  items!: CreditItem[];

  @OneToMany(() => Payment, (payment) => payment.credit)
  payments!: Payment[];

  @OneToMany(() => NotificationLog, (notification) => notification.credit)
  notifications!: NotificationLog[];
}
