import { Request, Response } from "express";
import { WalletService } from "../services/wallet.service";
import { ok } from "../utils/response.util";
import z from "zod";
import { PaymentType } from "../entities/enums/payment-type.enum";

const rechargeWalletSchema = z.object({
  customerId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  bonusPercent: z.coerce.number().min(0).max(100).optional().default(3),
  method: z.nativeEnum(PaymentType).optional().default(PaymentType.CASH),
});

const payWalletSchema = z.object({
  customerId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  concept: z.string().optional(),
});

class WalletController {
  private readonly walletService = new WalletService();

  getWalletDetails = async (req: Request, res: Response): Promise<void> => {
    const details = await this.walletService.getWalletDetails(req.params["customerId"]!);
    res.status(200).json(ok("Detalles de Wallet obtenidos", details));
  };

  rechargeWallet = async (req: Request, res: Response): Promise<void> => {
    const input = rechargeWalletSchema.parse(req.body);
    const result = await this.walletService.rechargeWallet({
      ...input,
      userId: req.auth!.userId,
    });
    res.status(200).json(ok("Wallet recargada exitosamente", result));
  };

  payWithWallet = async (req: Request, res: Response): Promise<void> => {
    const input = payWalletSchema.parse(req.body);
    const result = await this.walletService.payWithWallet(input);
    res.status(200).json(ok("Pago realizado con Wallet", result));
  };
}

export const walletController = new WalletController();
