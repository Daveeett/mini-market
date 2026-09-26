import { Router } from "express";
import { telegramController } from "../controllers/telegram.controller";

const router = Router();

router.post("/message", telegramController.processMessage);

export default router;
