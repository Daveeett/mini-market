import { Request, Response } from "express";
import { TelegramBotService } from "../services/telegram-bot.service";
import { ok } from "../utils/response.util";

class TelegramController {
  private readonly botService = new TelegramBotService();

  processMessage = async (req: Request, res: Response): Promise<void> => {
    const text = (req.body.text || req.body.message || "").toString();
    const result = await this.botService.processIncomingMessage(text, req.body.chatId);
    res.status(200).json(ok("Respuesta de Bot obtenida", result));
  };
}

export const telegramController = new TelegramController();
