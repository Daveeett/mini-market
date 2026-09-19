import { Request, Response } from "express";
import { OfferService } from "../services/offer.service";
import { ok } from "../utils/response.util";

class OfferController {
  private readonly offerService = new OfferService();

  getAllOffers = async (_req: Request, res: Response) => {
    const offers = await this.offerService.getAllOffers();
    res.status(200).json(ok("Lista de ofertas", offers));
  };

  getActiveOffers = async (_req: Request, res: Response) => {
    const offers = await this.offerService.getActiveOffers();
    res.status(200).json(ok("Ofertas activas", offers));
  };

  createOffer = async (req: Request, res: Response) => {
    const offer = await this.offerService.createOffer(req.body);
    res.status(201).json(ok("Oferta creada exitosamente", offer));
  };

  updateOffer = async (req: Request, res: Response) => {
    const { id } = req.params;
    const offer = await this.offerService.updateOffer(id!, req.body);
    res.status(200).json(ok("Oferta actualizada exitosamente", offer));
  };

  toggleOffer = async (req: Request, res: Response) => {
    const { id } = req.params;
    const offer = await this.offerService.toggleOfferActive(id!);
    res.status(200).json(ok("Estado de oferta actualizado", offer));
  };

  deleteOffer = async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.offerService.deleteOffer(id!);
    res.status(200).json(ok("Oferta eliminada correctamente", null));
  };
}

export const offerController = new OfferController();
