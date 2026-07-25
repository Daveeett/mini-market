import { Component, signal, DestroyRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DatePipe, NgClass } from '@angular/common';
import { CreditService } from '../services/credit.service';
import { CustomerService } from '@features/customers/services/customer.service';
import { CreditSummary } from '../models/credit.model';
import { Customer } from '@features/customers/models/customer.model';
import { SemaphoreStatus } from '@shared/models/semaphore.model';
import { SemaphoreBadgeComponent } from '@shared/components/semaphore-badge/semaphore-badge.component';
import { ToastService } from '@shared/services/toast.service';
import { NgIconComponent } from '@ng-icons/core';

@Component({
    selector: 'app-credits-page',
    imports: [FormsModule, DatePipe, NgClass, SemaphoreBadgeComponent, NgIconComponent],
    templateUrl: './credits.page.html',
    styleUrl: './credits.page.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreditsPage {
  readonly customers = signal<Customer[]>([]);
  readonly credits = signal<CreditSummary[]>([]);
  readonly semaphore = signal<SemaphoreStatus | null>(null);
  readonly waLink = signal('');
  readonly waMessage = signal('');

  selectedCustomerId = '';

  newCreditAmount: number | null = null;
  newCreditDueDate = '';
  minDueDate = new Date().toISOString().split('T')[0];
  newCreditEmail = '';
  isCreating = signal(false);
  createMessage = signal('');

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly creditService: CreditService,
    private readonly customerService: CustomerService,
    private readonly toast: ToastService,
  ) {
    this.customerService.getCustomers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.customers.set(response.data),
      });
  }

  loadCredits(): void {
    this.createMessage.set('');

    if (!this.selectedCustomerId) {
      this.credits.set([]);
      this.semaphore.set(null);
      this.newCreditEmail = '';
      return;
    }

    const cust = this.customers().find(c => c.id === this.selectedCustomerId);
    this.newCreditEmail = cust?.email || '';

    this.creditService.getCustomerCredits(this.selectedCustomerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.credits.set(response.data),
        error: () => this.credits.set([]),
      });

    this.creditService.getSemaphore(this.selectedCustomerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.semaphore.set(response.data.status),
        error: () => this.semaphore.set(null),
      });
  }

  submitCredit(): void {
    if (!this.selectedCustomerId || !this.newCreditAmount || !this.newCreditDueDate || !this.newCreditEmail) {
      this.createMessage.set('Por favor completa todos los campos (Monto, Fecha, Correo).');
      return;
    }

    const customer = this.customers().find(c => c.id === this.selectedCustomerId);

    if (this.semaphore() === 'RED') {
      this.createMessage.set('No se puede crear credito: Cliente en mora (ROJO).');
      return;
    }

    this.isCreating.set(true);
    this.createMessage.set('Procesando y enviando correo, por favor espere...');

     this.creditService.createCredit(this.selectedCustomerId, {
      amount: this.newCreditAmount,
      dueDate: this.newCreditDueDate,
      email: this.newCreditEmail
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isCreating.set(false);
          this.toast.success('Crédito creado y notificado exitosamente por email.');
          this.createMessage.set('Crédito creado exitosamente.');
          this.newCreditAmount = null;
          this.newCreditDueDate = '';
          this.loadCredits();
        },
        error: (err) => {
          this.isCreating.set(false);
          const msg = err.message || 'Error al crear el crédito.';
          this.toast.error(msg);
          this.createMessage.set(msg);
        }
      });
  }

  sendGeneralReminder(): void {
    if (!this.selectedCustomerId) return;
     this.creditService.notifyGeneralDebt(this.selectedCustomerId)
       .pipe(takeUntilDestroyed(this.destroyRef))
       .subscribe({
         next: (response) => {
           this.waLink.set(response.data.waLink);
           this.waMessage.set(response.data.message);
         },
         error: (err) => {
           this.toast.error(err.error?.message || 'Error al notificar deuda.');
         }
       });
  }
}
