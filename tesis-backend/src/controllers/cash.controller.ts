import { Request, Response } from "express";
import { ok } from "../utils/response.util";
import { CashService } from "../services/cash.service";
import { openSchema, movementSchema, closeSchema } from "../entities/schemas/cash.constants";

class CashController {
  private readonly cashService = new CashService();

  status = async (_req: Request, res: Response): Promise<void> => {
    const session = await this.cashService.getOpenSession();
    res.status(200).json(ok("Estado de caja", session));
  };

  history = async (_req: Request, res: Response): Promise<void> => {
    const history = await this.cashService.getSessionHistory();
    res.status(200).json(ok("Historial de caja", history));
  };

  open = async (req: Request, res: Response): Promise<void> => {
    const {openingBalance } = openSchema.parse(req.body);
    const session = await this.cashService.openCash({ openingBalance, userId: req.auth!.userId });
    res.status(201).json(ok("Caja abierta", session));
  };

  addMovement = async (req: Request, res: Response): Promise<void> => {
    const { movementType, amount, concept } = movementSchema.parse(req.body);
    const movement = await this.cashService.addMovement({
      movementType,
      amount,
      concept,
      userId: req.auth!.userId,
    });
    res.status(201).json(ok("Movimiento registrado", movement));
  };

  close = async (req: Request, res: Response): Promise<void> => {
    const { closingBalance } = closeSchema.parse(req.body);
    const session = await this.cashService.closeCash(closingBalance, req.auth!.userId);
    res.status(200).json(ok("Caja cerrada", session));
  };
  steroidsSummary = async (_req: Request, res: Response): Promise<void> => {
    const summary = await this.cashService.getSteroidsSummary();
    res.status(200).json(ok("Resumen de caja inteligente obtenido", summary));
  };
}

export const cashController = new CashController();
