import { Column, Entity, Index, OneToMany, OneToOne, Unique } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Sale } from "./sale.entity";
import { CreditAccount } from "./credit-account.entity";
import { NotificationLog } from "./notification-log.entity";

@Entity("customers")
@Unique(["docType", "docNumber"])
export class Customer extends BaseEntity {
  @Column({ name: "doc_type", length: 20 })
  docType!: string;

  @Index()
  @Column({ name: "doc_number", length: 40 })
  docNumber!: string;

  @Column({ name: "full_name", length: 180 })
  fullName!: string;

  @Column({ length: 30 })
  phone!: string;

  @Column({ length: 180, nullable: true })
  email!: string;

  @Column({ name: "description", length: 250, nullable: true })
  description!: string;

  @Column({ name: "max_credit", default: 10 })
  maxCredit!: number;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  @OneToMany(() => Sale, (sale) => sale.customer)
  sales!: Sale[];

  @OneToOne(() => CreditAccount, (creditAccount) => creditAccount.customer)
  creditAccount!: CreditAccount;

  @OneToMany(() => NotificationLog, (notification) => notification.customer)
  notifications!: NotificationLog[];
}
