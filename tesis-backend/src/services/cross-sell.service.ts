import { AppDataSource } from "../config/data-source";
import { ProductCrossSell } from "../entities/product-cross-sell.entity";
import { Product } from "../entities/product.entity";

export class CrossSellService {
  private readonly crossSellRepo = AppDataSource.getRepository(ProductCrossSell);
  private readonly productRepo = AppDataSource.getRepository(Product);

  async getRecommendations(productId?: string) {
    if (productId) {
      const explicit = await this.crossSellRepo.find({
        where: { product: { id: productId } },
        relations: ["suggestedProduct"],
      });

      if (explicit.length > 0) {
        return explicit.map((item) => ({
          suggestedProductId: item.suggestedProduct.id,
          name: item.suggestedProduct.name,
          unitPrice: item.suggestedProduct.unitPrice,
          recommendationText: item.recommendationText,
          estimatedExtraProfit: item.estimatedExtraProfit,
        }));
      }
    }

    // Default top cross-sell recommendations
    const products = await this.productRepo.find({ where: { isActive: true }, take: 4 });
    return products.map((p, idx) => ({
      suggestedProductId: p.id,
      name: p.name,
      unitPrice: p.unitPrice,
      recommendationText: idx % 2 === 0 ? "💡 Sugerir Hielo / Snacks (+ $2.50)" : "💡 Sugerir Bebida Fría (+ $1.50)",
      estimatedExtraProfit: idx % 2 === 0 ? "2.50" : "1.50",
    }));
  }
}
