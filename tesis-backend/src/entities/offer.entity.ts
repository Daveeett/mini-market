import { Entity, Column } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity("offers")
export class Offer extends BaseEntity {
  @Column({ type: "varchar", length: 150 })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  badgeTag?: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  originalPrice?: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  offerPrice?: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  imageUrl?: string;

  @Column({ type: "boolean", default: true })
  active!: boolean;
}
