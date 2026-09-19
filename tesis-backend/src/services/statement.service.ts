import { randomUUID } from "crypto";
import { AppError } from "../utils/app-error.util";
import { AccountStatementRepository } from "../repositories/account-statement.repository";
import { CreditAccountRepository } from "../repositories/credit-account.repository";
import { OfferService } from "./offer.service";

export class StatementService {
  private readonly statementRepo = new AccountStatementRepository();
  private readonly accountRepo = new CreditAccountRepository();
  private readonly offerService = new OfferService();

  async generateTokenByCustomer(customerId: string) {
    const account = await this.accountRepo.findByCustomerWithCustomer(customerId);
    if (!account) throw new AppError("Cuenta de credito no encontrada", 404, "ACCOUNT_NOT_FOUND");

    const token = randomUUID().replace(/-/g, "");
    const statement = this.statementRepo.create({
      creditAccount: account,
      publicToken: token,
      generatedAt: new Date(),
      active: true,
    });
    const saved = await this.statementRepo.save(statement);
    return { token: saved.publicToken, statementId: saved.id };
  }

  async getPublicStatement(token: string) {
    const statement = await this.statementRepo.findActiveByToken(token);
    if (!statement) throw new AppError("Estado de cuenta no encontrado", 404, "STATEMENT_NOT_FOUND");

    const account = statement.creditAccount;
    const offers = await this.offerService.getActiveOffers();

    return {
      customer: { name: account.customer.fullName, phone: account.customer.phone },
      totals: { totalDebt: account.totalDebt, totalPaid: account.totalPaid, pending: account.currentBalance },
      credits: account.credits,
      offers,
    };
  }
}
