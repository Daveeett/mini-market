import { EntityManager, Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Customer } from "../entities/customer.entity";

export class CustomerRepository {
  private readonly repo: Repository<Customer>;

  constructor(manager?: EntityManager) {
    this.repo = (manager ?? AppDataSource).getRepository(Customer);
  }

  findByDoc(docType: string, docNumber: string) {
    return this.repo.findOne({ where: { docType, docNumber } });
  }

  findById(customerId: string) {
    return this.repo.findOne({ where: { id: customerId } });
  }

  findByIdWithAccount(customerId: string) {
    return this.repo.findOne({
      where: { id: customerId },
      relations: { creditAccount: true },
    });
  }

  findByIdWithAccountAndCredits(customerId: string) {
    return this.repo.findOne({
      where: { id: customerId },
      relations: { creditAccount: { credits: true } },
    });
  }

  findAllWithAccount() {
    return this.repo.find({
      order: { createdAt: "DESC" },
      relations: { creditAccount: true },
    });
  }

  findAllWithAccountAndCredits() {
    return this.repo.find({
      order: { createdAt: "DESC" },
      relations: { creditAccount: { credits: true } },
    });
  }

  create(data: Partial<Customer>) {
    return this.repo.create(data);
  }

  save(customer: Customer) {
    return this.repo.save(customer);
  }
}
