import { CreditAccountStatus } from "../entities/enums/credit-account-status.enum";
import { AppError } from "../utils/app-error.util";
import { CustomerRepository } from "../repositories/customer.repository";
import { CreditAccountRepository } from "../repositories/credit-account.repository";
import { calculateSemaphore } from "../utils/semaphore.util";

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
    maxCredit: number;
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
    const customers = await this.customerRepo.findAllWithAccountAndCredits();
    return customers.map(customer => {
      const credits = customer.creditAccount?.credits || [];
      return {
        ...customer,
        semaphore: calculateSemaphore(credits, 7) // Assuming 7 days for "due soon"
      };
    });
  }

  async findById(customerId: string) {
    const customer = await this.customerRepo.findByIdWithAccountAndCredits(customerId);
    if (!customer) {
      throw new AppError("Cliente no encontrado", 404, "CUSTOMER_NOT_FOUND");
    }
    const credits = customer.creditAccount?.credits || [];
    return {
      ...customer,
      semaphore: calculateSemaphore(credits, 7)
    };
  }
}
