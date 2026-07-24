import { CreditAccountStatus } from "../entities/enums/credit-account-status.enum";
import { AppError } from "../utils/app-error.util";
import { CustomerRepository } from "../repositories/customer.repository";
import { CreditAccountRepository } from "../repositories/credit-account.repository";

export class CustomerService {
  private readonly customerRepo = new CustomerRepository();
  private readonly creditAccountRepo = new CreditAccountRepository();

  async create(input: {
    docType: string;
    docNumber: string;
    fullName: string;
    phone: string;
    email?: string;
    description?: string;
  }) {
    const exists = await this.customerRepo.findByDoc(input.docType, input.docNumber);
    if (exists) {
      throw new AppError("Cliente ya registrado", 409, "CUSTOMER_ALREADY_EXISTS");
    }

    const customer = this.customerRepo.create(input);
    const savedCustomer = await this.customerRepo.save(customer);

    const account = this.creditAccountRepo.create({
      customer: savedCustomer,
      status: CreditAccountStatus.OPEN,
      totalDebt: "0.00",
      totalPaid: "0.00",
      currentBalance: "0.00",
      lastActivityAt: new Date(),
    });
    await this.creditAccountRepo.save(account);

    return savedCustomer;
  }

  async findAll() {
    return this.customerRepo.findAllWithAccount();
  }

  async findById(customerId: string) {
    const customer = await this.customerRepo.findByIdWithAccount(customerId);
    if (!customer) {
      throw new AppError("Cliente no encontrado", 404, "CUSTOMER_NOT_FOUND");
    }
    return customer;
  }
}
