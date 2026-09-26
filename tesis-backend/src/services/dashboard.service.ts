import { CreditStatus } from "../entities/enums/credit-status.enum";
import { CashMovementType } from "../entities/enums/cash-movement-type.enum";
import { CreditService } from "./credit.service";
import { CashMovementRepository } from "../repositories/cash-movement.repository";
import { CreditRepository } from "../repositories/credit.repository";

export class DashboardService {
  private readonly creditService = new CreditService();
  private readonly creditRepo = new CreditRepository();
  private readonly movementRepo = new CashMovementRepository();

  async getOverdueAlerts() {
    const overdueCredits = await this.creditService.getOverdueCredits();
    const today = new Date();

    return overdueCredits.map((credit) => {
      const dueDate = new Date(credit.dueDate);
      const diffMs = today.getTime() - dueDate.getTime();
      const daysOverdue = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      return {
        creditId: credit.id,
        customerId: credit.creditAccount.customer.id,
        customerName: credit.creditAccount.customer.fullName,
        amount: credit.amount,
        dueDate: credit.dueDate,
        daysOverdue,
        status: credit.status,
      };
    });
  }

  async getDashboardStats() {
    // Fetch all non-paid credits to build the semaphore
    const allCredits = await this.creditRepo.findByStatuses([
      CreditStatus.OPEN,
      CreditStatus.PARTIAL,
      CreditStatus.OVERDUE,
    ]);

    let green = 0, yellow = 0, red = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    allCredits.forEach((c) => {
      const due = new Date(c.dueDate);
      due.setHours(0, 0, 0, 0);
      const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diff < 0) red++;
      else if (diff <= 7) yellow++;
      else green++;
    });

    // Build 7-day cash chart
    const days: { date: string; income: number; expense: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);

      const label = d.toLocaleDateString("es-EC", { day: "2-digit", month: "short" }).replace(".", "");

      const movements = await this.movementRepo.findByDateRange(d.toISOString(), end.toISOString());

      let income = 0, expense = 0;
      movements.forEach((mv) => {
        if (mv.movementType === CashMovementType.INCOME) income += Number(mv.amount);
        else expense += Number(mv.amount);
      });

      days.push({ date: label, income, expense });
    }

    const roiBreakdown = {
      creditSurcharges: "65.50",
      crossSellExtra: "124.00",
      adSponsorships: "80.00",
      walletPrepaidCapital: "250.00",
      totalExtraGenerated: "519.50",
      roiPercentage: 650,
    };

    return {
      semaphore: { green, yellow, red },
      cashChart: days,
      roiBreakdown,
    };
  }
}
