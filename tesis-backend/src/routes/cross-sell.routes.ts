import { Router } from "express";
import { crossSellController } from "../controllers/cross-sell.controller";

const router = Router();

router.get("/recommendations", crossSellController.getRecommendations);

export default router;
