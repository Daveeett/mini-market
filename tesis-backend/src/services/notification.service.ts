import { config } from "../config/environment";
import { NotificationChannel } from "../entities/enums/notification-channel.enum";
import { NotificationStatus } from "../entities/enums/notification-status.enum";
import { AppError } from "../utils/app-error.util";
import { StatementService } from "./statement.service";
import { CreditRepository } from "../repositories/credit.repository";
import { CreditAccountRepository } from "../repositories/credit-account.repository";
import { NotificationLogRepository } from "../repositories/notification-log.repository";

const formatPhoneForWhatsapp = (phone: string): string => {
  // Eliminar caracteres no numericos
  let cleaned = phone.replace(/\D/g, "");
  // Si ya tiene el codigo de pais 593 al inicio
  if (cleaned.startsWith("593")) {
    return cleaned;
  }
  // Si empieza con 0 (ej: 0999999999), remover el 0 inicial
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }
  return `593${cleaned}`;
};

export class NotificationService {
  private readonly creditRepo = new CreditRepository();
  private readonly accountRepo = new CreditAccountRepository();
  private readonly notificationRepo = new NotificationLogRepository();
  private readonly statementService = new StatementService();

  async createWhatsappReminder(creditId: string) {
    const credit = await this.creditRepo.findByIdWithAccountCustomer(creditId);
    if (!credit) throw new AppError("Credito no encontrado", 404, "CREDIT_NOT_FOUND");

    const customer = credit.creditAccount.customer;
    const tokenResult = await this.statementService.generateTokenByCustomer(customer.id);
    const statementUrl = `${config.server.frontendBaseUrl}/estado-cuenta/${tokenResult.token}`;
    const message = `Estimado cliente ${customer.fullName}, le recordamos cordialmente que tiene un valor pendiente de $${credit.amount} en el Mini Market Urbano. Revise su estado de cuenta aqui: ${statementUrl}`;
    const phoneFormatted = formatPhoneForWhatsapp(customer.phone);
    const waLink = `https://wa.me/${phoneFormatted}?text=${encodeURIComponent(message)}`;

    const log = this.notificationRepo.create({
      customer,
      credit,
      channel: NotificationChannel.WHATSAPP,
      message,
      waLink,
      status: NotificationStatus.SENT,
    });
    await this.notificationRepo.save(log);

    return { creditId, customer: customer.fullName, phone: customer.phone, message, waLink, statementUrl };
  }

  async createWhatsappReminderByCustomer(customerId: string) {
    const account = await this.accountRepo.findByCustomerWithCustomer(customerId);
    if (!account) throw new AppError("Cuenta de credito no encontrada", 404, "ACCOUNT_NOT_FOUND");

    const customer = account.customer;
    if (Number(account.totalDebt) <= 0 && Number(account.currentBalance) <= 0) {
      throw new AppError("El cliente no tiene deudas pendientes", 400, "NO_DEBT");
    }

    const tokenResult = await this.statementService.generateTokenByCustomer(customer.id);
    const statementUrl = `${config.server.frontendBaseUrl}/estado-cuenta/${tokenResult.token}`;
    const message = `Estimado cliente ${customer.fullName}, le recordamos cordialmente que tiene un valor pendiente total de $${account.currentBalance || account.totalDebt} en el Mini Market Urbano. Revise su estado de cuenta detallado aqui: ${statementUrl}`;
    const phoneFormatted = formatPhoneForWhatsapp(customer.phone);
    const waLink = `https://wa.me/${phoneFormatted}?text=${encodeURIComponent(message)}`;

    const log = this.notificationRepo.create({
      customer,
      credit: null,
      channel: NotificationChannel.WHATSAPP,
      message,
      waLink,
      status: NotificationStatus.SENT,
    });
    await this.notificationRepo.save(log);

    return { customerId, customer: customer.fullName, phone: customer.phone, message, waLink, statementUrl };
  }
}
