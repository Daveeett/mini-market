import { Request, Response } from "express";
import { CrossSellService } from "../services/cross-sell.service";
import { ok } from "../utils/response.util";

class CrossSellController {
  private readonly crossSellService = new CrossSellService();

  getRecommendations = async (req: Request, res: Response): Promise<void> => {
    const productId = req.query["productId"] as string | undefined;
    const recommendations = await this.crossSellService.getRecommendations(productId);
    res.status(200).json(ok("Recomendaciones de venta cruzada obtenidas", recommendations));
  };
}

export const crossSellController = new CrossSellController();
