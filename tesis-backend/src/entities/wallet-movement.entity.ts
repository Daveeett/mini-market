import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Customer } from "./customer.entity";
import { PaymentType } from "./enums/payment-type.enum";

@Entity("wallet_movements")
export class WalletMovement extends BaseEntity {
  @ManyToOne(() => Customer, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "customer_id" })
  customer!: Customer;

  @Column({ type: "varchar", length: 20, default: "RECHARGE" })
  type!: "RECHARGE" | "PAYMENT";

  @Column({ type: "decimal", precision: 12, scale: 2 })
  amount!: string;

  @Column({ name: "bonus_amount", type: "decimal", precision: 12, scale: 2, default: 0 })
  bonusAmount!: string;

  @Column({ name: "total_credited", type: "decimal", precision: 12, scale: 2 })
  totalCredited!: string;

  @Column({ length: 250, nullable: true })
  concept!: string;

  @Column({ type: "enum", enum: PaymentType, default: PaymentType.CASH })
  method!: PaymentType;
}
