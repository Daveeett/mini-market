import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Product } from "./product.entity";

@Entity("product_cross_sells")
export class ProductCrossSell extends BaseEntity {
  @ManyToOne(() => Product, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product!: Product;

  @ManyToOne(() => Product, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "suggested_product_id" })
  suggestedProduct!: Product;

  @Column({ name: "recommendation_text", length: 250, default: "Sugerir producto complementario" })
  recommendationText!: string;

  @Column({ name: "estimated_extra_profit", type: "decimal", precision: 10, scale: 2, default: 0 })
  estimatedExtraProfit!: string;
}
