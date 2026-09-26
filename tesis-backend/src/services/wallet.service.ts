import { AppDataSource } from "../config/data-source";
import { Customer } from "../entities/customer.entity";
import { WalletMovement } from "../entities/wallet-movement.entity";
import { PaymentType } from "../entities/enums/payment-type.enum";
import { CashSession } from "../entities/cash-session.entity";
import { CashMovement } from "../entities/cash-movement.entity";
import { CashMovementType } from "../entities/enums/cash-movement-type.enum";
import { CashSessionStatus } from "../entities/enums/cash-session-status.enum";
import { User } from "../entities/user.entity";
import { AppError } from "../utils/app-error.util";

export class WalletService {
  private readonly customerRepo = AppDataSource.getRepository(Customer);
  private readonly walletRepo = AppDataSource.getRepository(WalletMovement);
  private readonly cashSessionRepo = AppDataSource.getRepository(CashSession);
  private readonly cashMovementRepo = AppDataSource.getRepository(CashMovement);
  private readonly userRepo = AppDataSource.getRepository(User);

  async getWalletDetails(customerId: string) {
    const customer = await this.customerRepo.findOne({ where: { id: customerId } });
    if (!customer) throw new AppError("Cliente no encontrado", 404, "CUSTOMER_NOT_FOUND");

    const movements = await this.walletRepo.find({
      where: { customer: { id: customerId } },
      order: { createdAt: "DESC" },
      take: 20,
    });

    return {
      customerId: customer.id,
      customerName: customer.fullName,
      walletBalance: customer.walletBalance || "0.00",
      movements,
    };
  }

  async rechargeWallet(input: {
    customerId: string;
    amount: number;
    bonusPercent?: number;
    method?: PaymentType;
    userId: string;
  }) {
    if (input.amount <= 0) throw new AppError("Monto de recarga inválido", 400, "INVALID_AMOUNT");

    const customer = await this.customerRepo.findOne({ where: { id: input.customerId } });
    if (!customer) throw new AppError("Cliente no encontrado", 404, "CUSTOMER_NOT_FOUND");

    const user = await this.userRepo.findOne({ where: { id: input.userId } });
    if (!user) throw new AppError("Usuario no encontrado", 404, "USER_NOT_FOUND");

    const bonusPct = Number(input.bonusPercent ?? 3);
    const bonusAmt = Number(((input.amount * bonusPct) / 100).toFixed(2));
    const totalCredited = Number((input.amount + bonusAmt).toFixed(2));
    const method = input.method || PaymentType.CASH;

    const newBalance = (Number(customer.walletBalance || 0) + totalCredited).toFixed(2);
    customer.walletBalance = newBalance;
    await this.customerRepo.save(customer);

    const movement = this.walletRepo.create({
      customer,
      type: "RECHARGE",
      amount: input.amount.toFixed(2),
      bonusAmount: bonusAmt.toFixed(2),
      totalCredited: totalCredited.toFixed(2),
      concept: `Recarga Wallet (+${bonusPct}% bono)`,
      method,
    });
    await this.walletRepo.save(movement);

    // If cash method, record in open cash session if exists
    if (method === PaymentType.CASH) {
      const openSession = await this.cashSessionRepo.findOne({
        where: { status: CashSessionStatus.OPEN },
      });
      if (openSession) {
        const cashMv = this.cashMovementRepo.create({
          cashSession: openSession,
          movementType: CashMovementType.INCOME,
          amount: input.amount.toFixed(2),
          concept: `Recarga Wallet Cliente: ${customer.fullName}`,
          user,
        });
        await this.cashMovementRepo.save(cashMv);
      }
    }

    return {
      walletBalance: customer.walletBalance,
      credited: totalCredited.toFixed(2),
      bonus: bonusAmt.toFixed(2),
      movement,
    };
  }

  async payWithWallet(input: {
    customerId: string;
    amount: number;
    concept?: string;
  }) {
    if (input.amount <= 0) throw new AppError("Monto de cobro inválido", 400, "INVALID_AMOUNT");

    const customer = await this.customerRepo.findOne({ where: { id: input.customerId } });
    if (!customer) throw new AppError("Cliente no encontrado", 404, "CUSTOMER_NOT_FOUND");

    const currentBalance = Number(customer.walletBalance || 0);
    if (currentBalance < input.amount) {
      throw new AppError(
        `Saldo insuficiente en Wallet. Disponible: $${currentBalance.toFixed(2)}`,
        400,
        "INSUFFICIENT_WALLET_BALANCE"
      );
    }

    const newBalance = (currentBalance - input.amount).toFixed(2);
    customer.walletBalance = newBalance;
    await this.customerRepo.save(customer);

    const movement = this.walletRepo.create({
      customer,
      type: "PAYMENT",
      amount: input.amount.toFixed(2),
      bonusAmount: "0.00",
      totalCredited: (-input.amount).toFixed(2),
      concept: input.concept || "Consumo con Saldo Wallet",
      method: PaymentType.CASH,
    });
    await this.walletRepo.save(movement);

    return {
      walletBalance: customer.walletBalance,
      debited: input.amount.toFixed(2),
      movement,
    };
  }
}
