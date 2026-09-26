import https from "node:https";
import TelegramBot from "node-telegram-bot-api";
import { CashService } from "./cash.service";
import { CreditService } from "./credit.service";
import { DashboardService } from "./dashboard.service";
import { CustomerService } from "./customer.service";
import { WalletService } from "./wallet.service";
import { OfferService } from "./offer.service";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/user.entity";
import { PaymentType } from "../entities/enums/payment-type.enum";
import { CreditStatus } from "../entities/enums/credit-status.enum";

export class TelegramBotService {
  private readonly cashService = new CashService();
  private readonly creditService = new CreditService();
  private readonly dashboardService = new DashboardService();
  private readonly customerService = new CustomerService();
  private readonly walletService = new WalletService();
  private readonly offerService = new OfferService();
  private readonly userRepo = AppDataSource.getRepository(User);
  private readonly token = process.env["TELEGRAM_BOT_TOKEN"] || "";
  private bot: any = null;

  constructor() {
    if (this.token && this.token !== "tu_token_aqui") {
      this.bot = new TelegramBot(this.token, { polling: true });
      
      this.bot.on("message", async (msg: any) => {
        const chatId = msg.chat.id;
        const text = msg.text || "";
        
        if (text) {
          const response = await this.processIncomingMessage(text, chatId);
          this.bot?.sendMessage(chatId, response.message, { parse_mode: "Markdown" });
        }
      });
      
      console.log("🤖 Telegram Bot real activado y escuchando mensajes...");
    }
  }

  async processIncomingMessage(text: string, chatId?: string | number) {
    const trimmed = text.trim();

    if (trimmed.startsWith("/start") || trimmed.startsWith("/help")) {
      return this.formatHelpResponse();
    }

    if (trimmed.toLowerCase().includes("resumen") || trimmed.startsWith("/resumen")) {
      return this.formatResumenResponse();
    }

    if (trimmed.toLowerCase().includes("moroso") || trimmed.toLowerCase().includes("deudores") || trimmed.startsWith("/morosos")) {
      return this.formatMorososResponse();
    }

    if (trimmed.startsWith("/gasto") || trimmed.toLowerCase().startsWith("gasto")) {
      return this.formatGastoResponse(trimmed);
    }

    if (trimmed.startsWith("/buscar")) {
      return this.formatBuscarResponse(trimmed);
    }

    if (trimmed.startsWith("/fiado")) {
      return this.formatFiadoResponse(trimmed);
    }

    if (trimmed.startsWith("/cobrar")) {
      return this.formatCobrarResponse(trimmed);
    }

    if (trimmed.startsWith("/recargar")) {
      return this.formatRecargarResponse(trimmed);
    }

    if (trimmed.startsWith("/promos") || trimmed.toLowerCase().includes("ofertas")) {
      return this.formatPromosResponse();
    }

    return {
      success: true,
      message: `🤖 *Bot Mini Market Urbano*\n` +
        `No entendí ese comando.\n` +
        `Prueba enviando /help o los botones rápidos:\n` +
        `• /resumen • /morosos • /buscar [cliente]\n` +
        `• /fiado [cliente] [monto] [concepto]\n` +
        `• /cobrar [cliente] [monto]\n` +
        `• /recargar [cliente] [monto]\n` +
        `• /gasto [monto] [concepto] • /promos`,
    };
  }

  private formatHelpResponse() {
    return {
      success: true,
      message: `🤖 *Bot Asistente Financiero - Mini Market Urbano*\n\n` +
        `¡Hola Tendero! Comandos disponibles:\n` +
        `📊 */resumen* - Resumen de ventas, saldo de caja y ganancia limpia hoy.\n` +
        `🚨 */morosos* - Ver deudores en semáforo ROJO.\n` +
        `🔍 */buscar [nombre]* - Consultar saldo, wallet y semáforo de un cliente.\n` +
        `📝 */fiado [nombre] [monto] [concepto]* - Otorgar un fiado/crédito desde el móvil.\n` +
        `💵 */cobrar [nombre] [monto]* - Registrar abono de deuda de un cliente.\n` +
        `💳 */recargar [nombre] [monto]* - Recargar saldo a la Wallet de un cliente.\n` +
        `💸 */gasto [monto] [concepto]* - Registrar un egreso de caja.\n` +
        `🏷️ */promos* - Ver ofertas activas en la comunidad.\n\n` +
        `*Ejemplo:* \`/fiado Juan 15.00 Aceite y Leche\``,
    };
  }

  private async formatResumenResponse() {
    const steroids = await this.cashService.getSteroidsSummary();
    return {
      success: true,
      message: `📊 *Resumen Financiero del Día - Mini Market Urbano*\n\n` +
        `🟢 *Estado de Caja:* ${steroids.isOpen ? "ABIERTA" : "CERRADA"}\n` +
        `💵 *Efectivo en Cajón:* $${steroids.currentCash}\n` +
        `🏆 *Utilidad Neta Estimada:* +$${steroids.netProfit}\n` +
        `🛡️ *Alerta de Bóveda:* ${steroids.vaultAlert ? "⚠️ REQUERIDO (" + steroids.recommendedDrop + ")" : "✅ Normal"}\n\n` +
        `_Generado automáticamente por Mini Market Urbano_`,
    };
  }

  private async formatMorososResponse() {
    const overdueAlerts = await this.dashboardService.getOverdueAlerts();
    if (overdueAlerts.length === 0) {
      return {
        success: true,
        message: `🎉 *¡Excelente noticia!*\nNo tienes clientes en mora en este momento.`,
      };
    }

    let msg = `🚨 *Lista de Clientes en Mora (Semáforo ROJO)*\n\n`;
    overdueAlerts.forEach((item, idx) => {
      msg += `${idx + 1}. *${item.customerName}*: $${item.amount} (${item.daysOverdue} días de mora)\n`;
    });
    msg += `\n💡 _Usa la plataforma para notificar por WhatsApp en 1 clic._`;

    return {
      success: true,
      message: msg,
    };
  }

  private async formatGastoResponse(text: string) {
    const parts = text.split(" ");
    const amount = parseFloat(parts[1] || "0");
    const concept = parts.slice(2).join(" ") || "Gasto general registrado por Telegram";

    if (isNaN(amount) || amount <= 0) {
      return {
        success: false,
        message: `❌ Monto inválido. Uso correcto: \`/gasto [monto] [concepto]\` (Ej: \`/gasto 15 Pago bolsas\`)`,
      };
    }

    try {
      const systemUser = await this.getSystemUser();
      await this.cashService.addMovement({
        movementType: "EXPENSE" as any,
        amount,
        concept: `[Telegram Bot] ${concept}`,
        userId: systemUser.id,
      });

      return {
        success: true,
        message: `💸 *Egreso Registrado en Caja*\n\n` +
          `• Monto: -$${amount.toFixed(2)}\n` +
          `• Concepto: ${concept}\n` +
          `✅ Movimiento impactado en vivo en la sesión activa.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `⚠️ No se pudo registrar: ${err.message || 'Abra una sesión de caja primero.'}`,
      };
    }
  }

  private async formatBuscarResponse(text: string) {
    const query = text.replace("/buscar", "").trim();
    if (!query) {
      return {
        success: false,
        message: `🔍 *Uso correcto:* \`/buscar [nombre del cliente]\` (Ej: \`/buscar Juan\`)`,
      };
    }

    const customers = await this.customerService.findAll();
    const matches = customers.filter(c => c.fullName.toLowerCase().includes(query.toLowerCase()));

    if (matches.length === 0) {
      return {
        success: false,
        message: `❌ No se encontró ningún cliente que coincida con "${query}".`,
      };
    }

    let msg = `🔍 *Resultados de Búsqueda de Clientes*\n\n`;
    matches.slice(0, 5).forEach((c, idx) => {
      const debt = c.creditAccount?.currentBalance || "0.00";
      const wallet = c.walletBalance || "0.00";
      const semBadge = c.semaphore?.status === "GREEN" ? "🟢" : c.semaphore?.status === "YELLOW" ? "🟡" : "🔴";

      msg += `${idx + 1}. ${semBadge} *${c.fullName}*\n` +
        `   • Deuda Actual: *$${debt}*\n` +
        `   • Wallet Prepago: *$${wallet}*\n` +
        `   • Límite Crédito: $${c.maxCredit}\n\n`;
    });

    return {
      success: true,
      message: msg,
    };
  }

  private async formatFiadoResponse(text: string) {
    const parts = text.split(" ");
    if (parts.length < 3) {
      return {
        success: false,
        message: `📝 *Uso correcto:* \`/fiado [cliente] [monto] [concepto]\` (Ej: \`/fiado Juan 15.00 Aceite\`)`,
      };
    }

    const customerQuery = parts[1];
    const amount = parseFloat(parts[2]);
    const concept = parts.slice(3).join(" ") || "Fiado registrado por Telegram";

    if (isNaN(amount) || amount <= 0) {
      return {
        success: false,
        message: `❌ Monto inválido. Ejemplo: \`/fiado Juan 15.00 Aceite\``,
      };
    }

    const customers = await this.customerService.findAll();
    const customer = customers.find(c => c.fullName.toLowerCase().includes(customerQuery.toLowerCase()));

    if (!customer) {
      return {
        success: false,
        message: `❌ No se encontró ningún cliente con el nombre "${customerQuery}". Usa /buscar para verificar.`,
      };
    }

    if (customer.semaphore?.status === "RED") {
      return {
        success: false,
        message: `🔴 *CRÉDITO BLOQUEADO*\n\nEl cliente *${customer.fullName}* se encuentra en semáforo ROJO por mora. No se puede otorgar un nuevo fiado hasta regularizar sus cuotas.`,
      };
    }

    try {
      const systemUser = await this.getSystemUser();
      const now = new Date();
      now.setDate(now.getDate() + 15); // Default 15 days due
      const dueDate = now.toISOString().split("T")[0];

      await this.creditService.createCredit({
        customerId: customer.id,
        userId: systemUser.id,
        email: customer.email || `${customer.id}@minimarket.com`,
        amount: amount,
        dueDate: dueDate,
      });

      return {
        success: true,
        message: `📝 *Nuevo Fiado Registrado con Éxito*\n\n` +
          `• Cliente: *${customer.fullName}*\n` +
          `• Monto Base: $${amount.toFixed(2)}\n` +
          `• Concepto: ${concept}\n` +
          `• Recargo por financiamiento (5%): +$${(amount * 0.05).toFixed(2)}\n` +
          `✅ Fiado cargado a la cuenta corriente del cliente.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `⚠️ No se pudo otorgar el crédito: ${err.message}`,
      };
    }
  }

  private async formatCobrarResponse(text: string) {
    const parts = text.split(" ");
    if (parts.length < 3) {
      return {
        success: false,
        message: `💵 *Uso correcto:* \`/cobrar [cliente] [monto]\` (Ej: \`/cobrar Juan 10.00\`)`,
      };
    }

    const customerQuery = parts[1];
    const amount = parseFloat(parts[2]);

    if (isNaN(amount) || amount <= 0) {
      return {
        success: false,
        message: `❌ Monto inválido. Ejemplo: \`/cobrar Juan 10.00\``,
      };
    }

    const customers = await this.customerService.findAll();
    const customer = customers.find(c => c.fullName.toLowerCase().includes(customerQuery.toLowerCase()));

    if (!customer) {
      return {
        success: false,
        message: `❌ No se encontró el cliente "${customerQuery}".`,
      };
    }

    const customerCredits = await this.creditService.findCustomerCredits(customer.id);
    const activeCredit = customerCredits.find(cr => cr.status === CreditStatus.OPEN || cr.status === CreditStatus.PARTIAL || cr.status === CreditStatus.OVERDUE);

    if (!activeCredit) {
      return {
        success: false,
        message: `ℹ️ El cliente *${customer.fullName}* no tiene créditos pendientes de pago.`,
      };
    }

    try {
      const systemUser = await this.getSystemUser();
      const res = await this.creditService.registerPayment({
        creditId: activeCredit.id,
        amount: amount,
        method: PaymentType.CASH,
        userId: systemUser.id,
        reference: "Abono registrado por Telegram",
      });

      return {
        success: true,
        message: `💵 *Abono de Deuda Registrado*\n\n` +
          `• Cliente: *${customer.fullName}*\n` +
          `• Monto Pagado: *$${amount.toFixed(2)}*\n` +
          `• Saldo Deudor Restante: *$${res.currentBalance}*\n` +
          `• Estado Crédito: ${res.creditStatus === CreditStatus.PAID ? '🎉 PAGADO TOTALMENTE' : 'PARCIAL'}\n` +
          `✅ Dinero ingresado a la caja activa.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `⚠️ No se pudo registrar el cobro: ${err.message}`,
      };
    }
  }

  private async formatRecargarResponse(text: string) {
    const parts = text.split(" ");
    if (parts.length < 3) {
      return {
        success: false,
        message: `💳 *Uso correcto:* \`/recargar [cliente] [monto]\` (Ej: \`/recargar Maria 20.00\`)`,
      };
    }

    const customerQuery = parts[1];
    const amount = parseFloat(parts[2]);

    if (isNaN(amount) || amount <= 0) {
      return {
        success: false,
        message: `❌ Monto de recarga inválido. Ejemplo: \`/recargar Maria 20.00\``,
      };
    }

    const customers = await this.customerService.findAll();
    const customer = customers.find(c => c.fullName.toLowerCase().includes(customerQuery.toLowerCase()));

    if (!customer) {
      return {
        success: false,
        message: `❌ No se encontró la cuenta del cliente "${customerQuery}".`,
      };
    }

    try {
      const systemUser = await this.getSystemUser();
      const res = await this.walletService.rechargeWallet({
        customerId: customer.id,
        amount: amount,
        bonusPercent: 5,
        userId: systemUser.id,
      });

      return {
        success: true,
        message: `💳 *Recarga de Wallet Prepago Exitosa*\n\n` +
          `• Cliente: *${customer.fullName}*\n` +
          `• Recarga: $${amount.toFixed(2)}\n` +
          `• Bonificación (5%): +$${(amount * 0.05).toFixed(2)}\n` +
          `• *Nuevo Saldo Wallet:* *$${res.walletBalance}*\n` +
          `✅ Saldo listo para compras futuras.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `⚠️ Error al recargar: ${err.message}`,
      };
    }
  }

  private async formatPromosResponse() {
    const activeOffers = await this.offerService.getActiveOffers();
    if (activeOffers.length === 0) {
      return {
        success: true,
        message: `🏷️ No hay ofertas comunitarias activas en este momento.`,
      };
    }

    let msg = `🏷️ *Ofertas Comunitarias Activas en Mini Market Urbano*\n\n`;
    activeOffers.forEach((o, idx) => {
      msg += `${idx + 1}. *${o.title}*\n` +
        `   • ${o.description}\n` +
        `   • Precio Normal: ~$${o.originalPrice}~ ➡️ *Oferta: $${o.offerPrice}*\n\n`;
    });

    return {
      success: true,
      message: msg,
    };
  }

  private async getSystemUser(): Promise<User> {
    const users = await this.userRepo.find({ take: 1 });
    if (users.length > 0) return users[0];
    return {
      id: "system",
      name: "Sistema Bot",
      email: "bot@minimarket.com",
    } as any;
  }
}

