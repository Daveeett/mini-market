import { EntityManager, Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Offer } from "../entities/offer.entity";

export class OfferRepository {
  private readonly repo: Repository<Offer>;

  constructor(manager?: EntityManager) {
    this.repo = (manager ?? AppDataSource).getRepository(Offer);
  }

  findAll() {
    return this.repo.find({
      order: { createdAt: "DESC" },
    });
  }

  findActive() {
    return this.repo.find({
      where: { active: true },
      order: { createdAt: "DESC" },
    });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<Offer>) {
    return this.repo.create(data);
  }

  save(offer: Offer) {
    return this.repo.save(offer);
  }

  async delete(id: string) {
    await this.repo.delete(id);
  }
}
