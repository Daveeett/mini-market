import { Component, signal, OnInit, DestroyRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { NgIconComponent } from '@ng-icons/core';
import { CashService } from '../services/cash.service';
import { ToastService } from '@shared/services/toast.service';
import { CashSession } from '../interfaces/requests/cash-session.interface';
import { CashMovement } from '../interfaces/requests/cash-movement.interfaces';
import { CashHistoryEntry } from '../interfaces/requests/cash-history-entry.interface';

@Component({
    selector: 'app-cash-page',
    imports: [FormsModule, DatePipe, DecimalPipe, NgClass, NgIconComponent],
    templateUrl: './cash.page.html',
    styleUrl: './cash.page.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CashPage implements OnInit {
  readonly status = signal('Cargando estado de caja...');
  readonly currentSession = signal<CashSession | null>(null);
  readonly sessionHistory = signal<CashHistoryEntry[]>([]);

  openingBalance = 0;
  movementType: 'INCOME' | 'EXPENSE' = 'INCOME';
  movementAmount = 0;
  movementConcept = '';
  closingBalance = 0;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly cashService: CashService,
    private readonly toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.checkSession();
    this.loadHistory();
  }

  loadHistory(): void {
    this.cashService.getCashHistory()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => this.sessionHistory.set(r.data),
        error: () => {},
      });
  }

  checkSession(): void {
    this.cashService.getOpenCash()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.currentSession.set(response.data);
            this.status.set('Caja abierta actualmente.');
          } else {
            this.currentSession.set(null);
            this.status.set('No hay caja abierta.');
          }
        },
        error: () => this.status.set('Error al comprobar caja.'),
      });
  }

  get currentCalculatedBalance(): number {
    const session = this.currentSession();
    if (!session) return 0;

    let total = Number(session.openingBalance);
    if (session.movements) {
      for (const m of session.movements) {
        if (m.movementType === 'INCOME') total += Number(m.amount);
        else total -= Number(m.amount);
      }
    }
    return total;
  }

  get totalIncomes(): number {
    const session = this.currentSession();
    if (!session || !session.movements) return 0;
    return session.movements
      .filter((m: CashMovement) => m.movementType === 'INCOME')
      .reduce((acc: number, m: CashMovement) => acc + Number(m.amount), 0);
  }

  get totalExpenses(): number {
    const session = this.currentSession();
    if (!session || !session.movements) return 0;
    return session.movements
      .filter((m: CashMovement) => m.movementType === 'EXPENSE')
      .reduce((acc: number, m: CashMovement) => acc + Number(m.amount), 0);
  }

  calculateHistoryIncome(session: CashHistoryEntry | any): number {
    if (session.movements && Array.isArray(session.movements)) {
      return session.movements
        .filter((m: any) => m.movementType === 'INCOME')
        .reduce((acc: number, m: any) => acc + Number(m.amount), 0);
    }
    return Number(session.totalIncomes) || 0;
  }

  calculateHistoryExpense(session: CashHistoryEntry | any): number {
    if (session.movements && Array.isArray(session.movements)) {
      return session.movements
        .filter((m: any) => m.movementType === 'EXPENSE')
        .reduce((acc: number, m: any) => acc + Number(m.amount), 0);
    }
    return Number(session.totalExpenses) || 0;
  }

  openCash(): void {
    this.cashService.openCash(this.openingBalance)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.openingBalance = 0;
          this.toast.success('Caja abierta exitosamente.');
          this.checkSession();
          this.loadHistory();
        },
        error: (e: Error) => this.toast.error(e.message),
      });
  }

  addMovement(): void {
    this.cashService
      .addCashMovement({
        movementType: this.movementType,
        amount: this.movementAmount,
        concept: this.movementConcept,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const typeLabel = this.movementType === 'INCOME' ? 'Ingreso' : 'Egreso';
          const amountSaved = this.movementAmount;

          this.movementAmount = 0;
          this.movementConcept = '';

          this.toast.success(`${typeLabel} registrado: $${amountSaved}`);

          this.checkSession();
          this.loadHistory();
        },
        error: (e: Error) => this.toast.error(e.message),
      });
  }

  closeCash(): void {
    this.cashService.closeCash(this.closingBalance)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.closingBalance = 0;
          this.toast.success('Caja cerrada correctamente. Que tengas buen día!');
          this.checkSession();
          this.loadHistory();
        },
        error: (e: Error) => this.toast.error(e.message),
      });
  }
}
