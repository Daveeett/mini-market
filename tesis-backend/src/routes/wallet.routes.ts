import { Router } from "express";
import { walletController } from "../controllers/wallet.controller";

const router = Router();

router.get("/customer/:customerId", walletController.getWalletDetails);
router.post("/recharge", walletController.rechargeWallet);
router.post("/pay", walletController.payWithWallet);

export default router;
