import { OfferRepository } from "../repositories/offer.repository";
import { AppError } from "../utils/app-error.util";

export interface CreateOfferInput {
  title: string;
  description: string;
  badgeTag?: string;
  originalPrice?: string;
  offerPrice?: string;
  imageUrl?: string;
  active?: boolean;
}

export class OfferService {
  private readonly offerRepo = new OfferRepository();

  async getAllOffers() {
    let offers = await this.offerRepo.findAll();
    if (offers.length === 0) {
      await this.seedInitialOffers();
      offers = await this.offerRepo.findAll();
    }
    return offers;
  }

  async getActiveOffers() {
    let offers = await this.offerRepo.findActive();
    if (offers.length === 0) {
      const all = await this.offerRepo.findAll();
      if (all.length === 0) {
        await this.seedInitialOffers();
        offers = await this.offerRepo.findActive();
      }
    }
    return offers;
  }

  async createOffer(input: CreateOfferInput) {
    if (!input.title || !input.description) {
      throw new AppError("El título y la descripción son requeridos", 400, "INVALID_OFFER_DATA");
    }

    const offer = this.offerRepo.create({
      title: input.title,
      description: input.description,
      badgeTag: input.badgeTag || "¡OFERTA!",
      originalPrice: input.originalPrice || undefined,
      offerPrice: input.offerPrice || undefined,
      imageUrl: input.imageUrl || "/assets/images/offer_combo_grocery.jpg",
      active: input.active !== undefined ? input.active : true,
    });

    return this.offerRepo.save(offer);
  }

  async updateOffer(id: string, input: Partial<CreateOfferInput>) {
    const offer = await this.offerRepo.findById(id);
    if (!offer) {
      throw new AppError("Oferta no encontrada", 404, "OFFER_NOT_FOUND");
    }

    if (input.title !== undefined) offer.title = input.title;
    if (input.description !== undefined) offer.description = input.description;
    if (input.badgeTag !== undefined) offer.badgeTag = input.badgeTag;
    if (input.originalPrice !== undefined) offer.originalPrice = input.originalPrice;
    if (input.offerPrice !== undefined) offer.offerPrice = input.offerPrice;
    if (input.imageUrl !== undefined) offer.imageUrl = input.imageUrl;
    if (input.active !== undefined) offer.active = input.active;

    return this.offerRepo.save(offer);
  }

  async toggleOfferActive(id: string) {
    const offer = await this.offerRepo.findById(id);
    if (!offer) {
      throw new AppError("Oferta no encontrada", 404, "OFFER_NOT_FOUND");
    }
    offer.active = !offer.active;
    return this.offerRepo.save(offer);
  }

  async deleteOffer(id: string) {
    const offer = await this.offerRepo.findById(id);
    if (!offer) {
      throw new AppError("Oferta no encontrada", 404, "OFFER_NOT_FOUND");
    }
    await this.offerRepo.delete(id);
  }

  private async seedInitialOffers() {
    const defaultOffers: CreateOfferInput[] = [
      {
        title: "¡Super Combo Familiar Mini Market!",
        description: "Lleva 1 Aceite Girasol 5L + 1 Saco de Arroz 5kg + Canasta de verduras frescas con un 25% de descuento directo.",
        badgeTag: "25% OFF",
        originalPrice: "32.99",
        offerPrice: "24.99",
        imageUrl: "/assets/images/offer_combo_grocery.jpg",
        active: true,
      },
      {
        title: "¡Mega Pack Desayuno Saludable 2x1!",
        description: "2 Leches inactivas en botella + Queso Maduro + Yogurt Griego al precio de 1. Exclusivo para clientes al día.",
        badgeTag: "2x1 PROMO",
        originalPrice: "12.50",
        offerPrice: "6.25",
        imageUrl: "/assets/images/offer_breakfast_pack.jpg",
        active: true,
      },
    ];

    for (const data of defaultOffers) {
      const offer = this.offerRepo.create(data);
      await this.offerRepo.save(offer);
    }
  }
}
