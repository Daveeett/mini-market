import { CreditStatus } from "../entities/enums/credit-status.enum";
import { PaymentType } from "../entities/enums/payment-type.enum";
import { AppError } from "../utils/app-error.util";
import { calculateSemaphore } from "../utils/semaphore.util";
import { config } from "../config/environment";
import { EmailService } from "./email.service";
import { StatementService } from "./statement.service";
import { CreditRepository } from "../repositories/credit.repository";
import { CreditAccountRepository } from "../repositories/credit-account.repository";
import { PaymentRepository } from "../repositories/payment.repository";
import { UserRepository } from "../repositories/user.repository";
import { CustomerRepository } from "../repositories/customer.repository";
import { SaleRepository } from "../repositories/sale.repository";

export class CreditService {
  private readonly creditRepo = new CreditRepository();
  private readonly accountRepo = new CreditAccountRepository();
  private readonly paymentRepo = new PaymentRepository();
  private readonly userRepo = new UserRepository();
  private readonly customerRepo = new CustomerRepository();
  private readonly saleRepo = new SaleRepository();
  private readonly emailService = new EmailService();
  private readonly statementService = new StatementService();

  async getSemaphoreByCustomer(customerId: string) {
    const account = await this.accountRepo.findByCustomerWithCredits(customerId);
    if (!account) throw new AppError("Cuenta de credito no encontrada", 404, "ACCOUNT_NOT_FOUND");
    return calculateSemaphore(account.credits, config.app.dueSoonDays);
  }

  async assertCanCreateCredit(customerId: string) {
    const semaphore = await this.getSemaphoreByCustomer(customerId);
    if (semaphore.status === "RED") {
      throw new AppError(
        "Cliente bloqueado por mora. No se puede generar nuevo credito.",
        409,
        "CREDIT_BLOCKED_BY_SEMAPHORE",
      );
    }
  }

  async registerPayment(input: {
    creditId: string;
    amount: number;
    method: PaymentType;
    reference?: string;
    userId: string;
  }) {
    const credit = await this.creditRepo.findByIdWithAccount(input.creditId);
    if (!credit) throw new AppError("Credito no encontrado", 404, "CREDIT_NOT_FOUND");

    const user = await this.userRepo.findById(input.userId);
    if (!user) throw new AppError("Usuario no encontrado", 404, "USER_NOT_FOUND");

    const alreadyPaid = await this.paymentRepo.sumByCreditId(credit.id);
    const remaining = Number(credit.amount) - alreadyPaid;

    if (input.amount <= 0 || input.amount > remaining) {
      throw new AppError("Monto de abono invalido", 400, "INVALID_PAYMENT_AMOUNT");
    }

    const payment = this.paymentRepo.create({
      credit,
      amount: input.amount.toFixed(2),
      method: input.method,
      reference: input.reference,
      user,
    });
    await this.paymentRepo.save(payment);

    const newPaid = alreadyPaid + input.amount;
    const isPaid = newPaid >= Number(credit.amount);
    credit.status = isPaid ? CreditStatus.PAID : CreditStatus.PARTIAL;
    await this.creditRepo.save(credit);

    const account = credit.creditAccount;
    account.totalPaid = (Number(account.totalPaid) + input.amount).toFixed(2);
    account.currentBalance = (Number(account.totalDebt) - Number(account.totalPaid)).toFixed(2);
    account.lastActivityAt = new Date();
    await this.accountRepo.save(account);

    return { payment, currentBalance: account.currentBalance, creditStatus: credit.status };
  }

  async getOverdueCredits() {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return this.creditRepo.findOverdueCredits(today);
  }

  async markOverdueCredits() {
    const overdueCredits = await this.getOverdueCredits();
    await Promise.all(
      overdueCredits.map(async (credit) => {
        if (credit.status !== CreditStatus.OVERDUE) {
          credit.status = CreditStatus.OVERDUE;
          await this.creditRepo.save(credit);
        }
      }),
    );
    return overdueCredits;
  }

  async findCustomerCredits(customerId: string) {
    return this.creditRepo.findCustomerCredits(customerId);
  }

  async createCredit(input: {
    customerId: string;
    userId: string;
    email: string;
    amount: number;
    dueDate: string;
  }) {
    const customer = await this.customerRepo.findByIdWithAccount(input.customerId);
    if (!customer) throw new AppError("Cliente no encontrado", 404, "CUSTOMER_NOT_FOUND");
    if (!customer.creditAccount) throw new AppError("Cliente no tiene cuenta de credito", 400, "NO_CREDIT_ACCOUNT");

    const currentBalance = Number(customer.creditAccount.currentBalance);
    const maxCredit = Number(customer.maxCredit);
    const requestedAmount = Number(input.amount);

    if ((currentBalance + requestedAmount) > maxCredit) {
      const available = maxCredit - currentBalance;
      const availableMsg = available > 0 ? available.toFixed(2) : "0.00";
      throw new AppError(
        `El monto excede el límite de crédito del cliente. Crédito disponible: S/.${availableMsg}`,
        400,
        "CREDIT_LIMIT_EXCEEDED"
      );
    }

    await this.assertCanCreateCredit(input.customerId);

    const isValidDomain = await this.emailService.verifyEmailDomain(input.email);
    if (!isValidDomain) {
      throw new AppError(
        "El dominio del correo electronico proporcionado no es valido o no existe.",
        400,
        "INVALID_EMAIL_DOMAIN",
      );
    }

    customer.email = input.email;
    await this.customerRepo.save(customer);

    const user = await this.userRepo.findById(input.userId);
    if (!user) throw new AppError("Usuario no encontrado", 404, "USER_NOT_FOUND");

    const sale = this.saleRepo.create({
      totalAmount: input.amount.toFixed(2),
      paymentType: PaymentType.CREDIT,
      user,
      customer,
    });
    await this.saleRepo.save(sale);

    const credit = this.creditRepo.create({
      creditAccount: customer.creditAccount,
      sale,
      dueDate: input.dueDate,
      amount: input.amount.toFixed(2),
      status: CreditStatus.OPEN,
    });
    await this.creditRepo.save(credit);

    const account = customer.creditAccount;
    account.totalDebt = (Number(account.totalDebt) + input.amount).toFixed(2);
    account.currentBalance = (Number(account.totalDebt) - Number(account.totalPaid)).toFixed(2);
    await this.accountRepo.save(account);

    const tokenResult = await this.statementService.generateTokenByCustomer(customer.id);
    const statementUrl = `${config.server.frontendBaseUrl}/estado-cuenta/${tokenResult.token}`;

    await this.emailService.sendCreditNotification({
      to: input.email,
      customerName: customer.fullName,
      amount: input.amount.toFixed(2),
      dueDate: input.dueDate,
      statementUrl,
    });

    return { credit };
  }
}
