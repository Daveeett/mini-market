import { Component, signal, DestroyRef, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { CustomerService } from '@features/customers/services/customer.service';
import { Customer } from '@features/customers/interfaces/requests/customer.interface';
import { ToastService } from '@shared/services/toast.service';
import { NgIconComponent } from '@ng-icons/core';
import { WalletService, WalletMovement } from '@features/credits/services/wallet.service';

@Component({
  selector: 'app-wallet-page',
  standalone: true,
  imports: [FormsModule, DatePipe, NgIconComponent],
  templateUrl: './wallet.page.html',
  styleUrl: './wallet.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WalletPage {
  readonly customers = signal<Customer[]>([]);
  readonly selectedCustomerId = signal<string>('');
  readonly walletBalance = signal<string>('0.00');
  readonly walletMovements = signal<WalletMovement[]>([]);
  readonly isLoading = signal(false);

  // Recharge Form
  showRechargeModal = signal(false);
  rechargeAmount: number | null = null;
  rechargeBonusPercent = signal<number>(5);
  rechargeMethod: 'CASH' | 'TRANSFER' = 'CASH';
  isRecharging = signal(false);

  readonly presetBonuses = [0, 3, 5, 10];

  private readonly destroyRef = inject(DestroyRef);

  readonly selectedCustomer = computed(() => {
    return this.customers().find((c) => c.id === this.selectedCustomerId()) || null;
  });

  readonly totalWalletCapital = computed(() => {
    return this.customers().reduce((sum, c) => sum + Number(c.walletBalance || 0), 0);
  });

  readonly customersWithWalletCount = computed(() => {
    return this.customers().filter((c) => Number(c.walletBalance || 0) > 0).length;
  });

  constructor(
    private readonly customerService: CustomerService,
    private readonly walletService: WalletService,
    private readonly toast: ToastService
  ) {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.customerService
      .getCustomers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.customers.set(res.data);
          if (res.data.length > 0 && !this.selectedCustomerId()) {
            this.selectCustomer(res.data[0].id);
          }
        },
      });
  }

  selectCustomer(customerId: string): void {
    this.selectedCustomerId.set(customerId);
    if (!customerId) {
      this.walletBalance.set('0.00');
      this.walletMovements.set([]);
      return;
    }

    this.isLoading.set(true);
    this.walletService.getWallet(customerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.walletBalance.set(res.data.walletBalance);
          this.walletMovements.set(res.data.movements);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  openRechargeModal(): void {
    if (!this.selectedCustomerId()) {
      this.toast.show('Seleccione un cliente primero', 'warning');
      return;
    }
    this.rechargeAmount = 20;
    this.showRechargeModal.set(true);
  }

  closeRechargeModal(): void {
    this.showRechargeModal.set(false);
  }

  setBonus(percent: number): void {
    this.rechargeBonusPercent.set(percent);
  }

  get calculatedBonus(): number {
    const amt = Number(this.rechargeAmount || 0);
    if (amt <= 0) return 0;
    return Number(((amt * this.rechargeBonusPercent()) / 100).toFixed(2));
  }

  get calculatedTotalCredited(): number {
    return Number((Number(this.rechargeAmount || 0) + this.calculatedBonus).toFixed(2));
  }

  processRecharge(): void {
    const customerId = this.selectedCustomerId();
    const amount = Number(this.rechargeAmount || 0);

    if (!customerId) {
      this.toast.show('Seleccione un cliente', 'warning');
      return;
    }

    if (amount <= 0) {
      this.toast.show('Ingrese un monto válido de recarga', 'warning');
      return;
    }

    this.isRecharging.set(true);
    this.walletService.rechargeWallet({
      customerId,
      amount,
      bonusPercent: this.rechargeBonusPercent(),
      method: this.rechargeMethod,
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (res) => {
        this.isRecharging.set(false);
        this.closeRechargeModal();
        this.toast.show(`¡Recarga exitosa! $${res.data.credited} cargados a la billetera de ${res.data.customerName}`, 'success');
        this.loadCustomers();
        this.selectCustomer(customerId);
      },
      error: (err) => {
        this.isRecharging.set(false);
        this.toast.show(err.error?.message || 'Error al procesar la recarga', 'error');
      },
    });
  }

  parseNum(val: any): number {
    return Number(val || 0);
  }

  getMovType(mov: WalletMovement): string {
    return mov.movementType || mov.type || 'RECHARGE';
  }

  getMovDesc(mov: WalletMovement): string {
    return mov.description || mov.concept || 'Movimiento de Wallet';
  }

  getMovBalanceAfter(mov: WalletMovement): string {
    return mov.balanceAfter || mov.totalCredited || mov.amount;
  }
}
