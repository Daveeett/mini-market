import { Component, signal, DestroyRef, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DatePipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CreditService } from '../services/credit.service';
import { CustomerService } from '@features/customers/services/customer.service';
import { Customer } from '@features/customers/interfaces/requests/customer.interface';
import { SemaphoreStatus } from '@shared/models/semaphore.model';
import { SemaphoreBadgeComponent } from '@shared/components/semaphore-badge/semaphore-badge.component';
import { ToastService } from '@shared/services/toast.service';
import { NgIconComponent } from '@ng-icons/core';
import { CreditSummary } from '../interfaces/requests/credit-summary.model';

import { WalletService, WalletMovement } from '../services/wallet.service';

export interface CrossSellItem {
  id: string;
  name: string;
  price: number;
  reason: string;
  icon: string;
  category: string;
}

export interface CrossSellCategory {
  id: string;
  name: string;
  icon: string;
  items: CrossSellItem[];
}

@Component({
    selector: 'app-credits-page',
    imports: [FormsModule, DatePipe, NgClass, SemaphoreBadgeComponent, NgIconComponent, RouterLink],
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
  readonly walletBalance = signal<string>('0.00');
  readonly walletMovements = signal<WalletMovement[]>([]);

  selectedCustomerId = '';

  newCreditAmount: number | null = null;
  surchargePercent = signal<number>(5);
  readonly presetSurcharges = [0, 3, 5, 8, 10];
  newCreditDueDate = '';
  minDueDate = new Date().toISOString().split('T')[0];
  newCreditEmail = '';
  isCreating = signal(false);
  createMessage = signal('');

  // Cross-selling Interactive Assistant State
  readonly activeCategory = signal<string>('licores');
  readonly searchCrossSellQuery = signal<string>('');
  readonly addedCrossSellItems = signal<{ item: CrossSellItem; count: number }[]>([]);

  readonly crossSellCategories: CrossSellCategory[] = [
    {
      id: 'licores',
      name: 'Cervezas / Licores',
      icon: 'heroSparkles',
      items: [
        { id: 'cs-1', name: 'Bolsa de Hielo Grande', price: 2.50, reason: 'Enfría las bebidas rápido', icon: 'heroSparkles', category: 'licores' },
        { id: 'cs-2', name: 'Pack Limones & Piqueos', price: 1.50, reason: 'Acompañante #1 en reuniones', icon: 'heroShoppingBag', category: 'licores' },
        { id: 'cs-3', name: 'Gaseosa 2.25L Mezclador', price: 1.75, reason: 'Mezcla perfecta para licor', icon: 'heroTag', category: 'licores' },
        { id: 'cs-4', name: 'Papas Fritas Familiares', price: 2.00, reason: 'Snack de rápida rotación', icon: 'heroShoppingBag', category: 'licores' },
        { id: 'cs-4b', name: 'Cigarrillos Cajetilla 20s', price: 3.50, reason: 'Complemento tradicional', icon: 'heroTag', category: 'licores' },
        { id: 'cs-4c', name: 'Maní Salado / Tostado', price: 1.20, reason: 'Piqueo clásico para cerveza', icon: 'heroShoppingBag', category: 'licores' },
        { id: 'cs-4d', name: 'Vasos Desechables (Pack 12)', price: 1.00, reason: 'Accesorio infaltable en reuniones', icon: 'heroArchiveBox', category: 'licores' },
        { id: 'cs-4e', name: 'Bebida Energizante 500ml', price: 1.85, reason: 'Venta combinada en fiesta', icon: 'heroSparkles', category: 'licores' },
      ]
    },
    {
      id: 'desayuno',
      name: 'Pan / Desayuno',
      icon: 'heroBuildingStorefront',
      items: [
        { id: 'cs-5', name: 'Queso Fresco 250g', price: 2.25, reason: 'Complemento clásico para el pan', icon: 'heroShoppingBag', category: 'desayuno' },
        { id: 'cs-6', name: 'Café Instantáneo / Molido', price: 1.80, reason: 'Infaltable en desayunos', icon: 'heroTag', category: 'desayuno' },
        { id: 'cs-7', name: 'Mantequilla 200g', price: 1.25, reason: 'Venta rápida con pan caliente', icon: 'heroShoppingBag', category: 'desayuno' },
        { id: 'cs-8', name: 'Cubeta de Huevos (6 unid)', price: 1.30, reason: 'Aumenta ticket promedio', icon: 'heroArchiveBox', category: 'desayuno' },
        { id: 'cs-8b', name: 'Jamón de Cerdo / Pavo 150g', price: 1.75, reason: 'Para sándwiches mañaneros', icon: 'heroShoppingBag', category: 'desayuno' },
        { id: 'cs-8c', name: 'Mermelada de Frutas 200g', price: 1.40, reason: 'Acompañamiento dulce', icon: 'heroTag', category: 'desayuno' },
        { id: 'cs-8d', name: 'Leche Entera 1 Litro', price: 1.10, reason: 'Básico diario de desayuno', icon: 'heroArchiveBox', category: 'desayuno' },
        { id: 'cs-8e', name: 'Yogurt Probiótico 500ml', price: 1.35, reason: 'Opción saludable para niños', icon: 'heroSparkles', category: 'desayuno' },
      ]
    },
    {
      id: 'abarrotes',
      name: 'Arroz / Almuerzo',
      icon: 'heroArchiveBox',
      items: [
        { id: 'cs-9', name: 'Atún en Aceite de Oliva', price: 1.65, reason: 'Proteína lista para almuerzo', icon: 'heroShoppingBag', category: 'abarrotes' },
        { id: 'cs-10', name: 'Fideos Tallarín 400g', price: 0.85, reason: 'Acompañamiento rápido', icon: 'heroTag', category: 'abarrotes' },
        { id: 'cs-11', name: 'Sazonador / Sal Refinada', price: 0.70, reason: 'Condimento esencial', icon: 'heroSparkles', category: 'abarrotes' },
        { id: 'cs-12', name: 'Aliño de Ajo preparado', price: 1.10, reason: 'Sabor directo para guisos', icon: 'heroShoppingBag', category: 'abarrotes' },
        { id: 'cs-12b', name: 'Aceite Vegetal 500ml', price: 1.90, reason: 'Esencial de cocina', icon: 'heroTag', category: 'abarrotes' },
        { id: 'cs-12c', name: 'Salsa de Tomate 200g', price: 0.95, reason: 'Para guiso o fideos', icon: 'heroShoppingBag', category: 'abarrotes' },
        { id: 'cs-12d', name: 'Lenteja / Poroto 500g', price: 1.20, reason: 'Menestra de alto valor', icon: 'heroArchiveBox', category: 'abarrotes' },
        { id: 'cs-12e', name: 'Sardinas en Tomate', price: 1.45, reason: 'Proteína accesible', icon: 'heroTag', category: 'abarrotes' },
      ]
    },
    {
      id: 'embutidos',
      name: 'Embutidos & Lácteos',
      icon: 'heroShoppingBag',
      items: [
        { id: 'cs-emb1', name: 'Salchichas Vienesas 4-pack', price: 1.40, reason: 'Rápida preparación en casa', icon: 'heroShoppingBag', category: 'embutidos' },
        { id: 'cs-emb2', name: 'Queso Mozzarella Laminado', price: 2.50, reason: 'Ideal para derretir / pizzas', icon: 'heroTag', category: 'embutidos' },
        { id: 'cs-emb3', name: 'Mortadela Especial 150g', price: 1.20, reason: 'Fácil para sándwich o lonche', icon: 'heroShoppingBag', category: 'embutidos' },
        { id: 'cs-emb4', name: 'Crema de Leche 200ml', price: 1.15, reason: 'Para salsas y postres', icon: 'heroSparkles', category: 'embutidos' },
        { id: 'cs-emb5', name: 'Chorizo Parrillero x2', price: 2.10, reason: 'Sabor asado rápido', icon: 'heroTag', category: 'embutidos' },
      ]
    },
    {
      id: 'limpieza',
      name: 'Limpieza / Hogar',
      icon: 'heroShieldCheck',
      items: [
        { id: 'cs-13', name: 'Esponja Lavavajillas 2x1', price: 0.75, reason: 'Consumible frecuente de hogar', icon: 'heroSparkles', category: 'limpieza' },
        { id: 'cs-14', name: 'Suavizante de Ropa 500ml', price: 1.60, reason: 'Venta combinada con detergente', icon: 'heroTag', category: 'limpieza' },
        { id: 'cs-15', name: 'Papel Higiénico (Pack 4)', price: 1.85, reason: 'Básico infaltable del hogar', icon: 'heroArchiveBox', category: 'limpieza' },
        { id: 'cs-15b', name: 'Cloro / Desinfectante 1L', price: 1.25, reason: 'Limpieza profunda de superficies', icon: 'heroShieldCheck', category: 'limpieza' },
        { id: 'cs-15c', name: 'Jabón de Barra para Ropa', price: 0.90, reason: 'Lavado a mano rápido', icon: 'heroTag', category: 'limpieza' },
        { id: 'cs-15d', name: 'Lavavajillas en Crema', price: 1.10, reason: 'Para lavar platos diario', icon: 'heroSparkles', category: 'limpieza' },
        { id: 'cs-15e', name: 'Fundas para Basura x10', price: 1.20, reason: 'Higiene del hogar', icon: 'heroArchiveBox', category: 'limpieza' },
      ]
    },
    {
      id: 'snacks',
      name: 'Snacks / Golosinas',
      icon: 'heroTag',
      items: [
        { id: 'cs-16', name: 'Barra de Chocolate / Snack', price: 0.90, reason: 'Venta de impulso en caja', icon: 'heroSparkles', category: 'snacks' },
        { id: 'cs-17', name: 'Gaseosa Personal 500ml', price: 0.75, reason: 'Bebida de consumo rápido', icon: 'heroShoppingBag', category: 'snacks' },
        { id: 'cs-18', name: 'Caramelos / Chicles', price: 0.50, reason: 'Venta de vuelto rápido', icon: 'heroTag', category: 'snacks' },
        { id: 'cs-18b', name: 'Galletas Rellenas Choco', price: 0.65, reason: 'Golosina de tarde', icon: 'heroShoppingBag', category: 'snacks' },
        { id: 'cs-18c', name: 'Agua Mineral Sin Gas 1L', price: 0.70, reason: 'Hidratación económica', icon: 'heroArchiveBox', category: 'snacks' },
        { id: 'cs-18d', name: 'Nachos con Queso Dip', price: 1.80, reason: 'Piqueo salado popular', icon: 'heroSparkles', category: 'snacks' },
      ]
    }
  ];

  readonly currentCategoryObj = computed(() => {
    return this.crossSellCategories.find(c => c.id === this.activeCategory()) || this.crossSellCategories[0];
  });

  readonly displayedCrossSellItems = computed(() => {
    const q = this.searchCrossSellQuery().trim().toLowerCase();
    if (!q) {
      return this.currentCategoryObj().items;
    }
    const allItems = this.crossSellCategories.flatMap(c => c.items);
    return allItems.filter(i => i.name.toLowerCase().includes(q) || i.reason.toLowerCase().includes(q));
  });

  setCrossSellCategory(catId: string): void {
    this.searchCrossSellQuery.set('');
    this.activeCategory.set(catId);
  }

  addCrossSellItem(item: CrossSellItem): void {
    const currentAmt = Number(this.newCreditAmount || 0);
    this.newCreditAmount = Number((currentAmt + item.price).toFixed(2));

    this.addedCrossSellItems.update(items => {
      const existing = items.find(i => i.item.id === item.id);
      if (existing) {
        return items.map(i => i.item.id === item.id ? { ...i, count: i.count + 1 } : i);
      }
      return [...items, { item, count: 1 }];
    });

    this.toast.success(`+${item.name} ($${item.price.toFixed(2)}) añadido.`);
  }

  removeCrossSellItem(itemId: string): void {
    const target = this.addedCrossSellItems().find(i => i.item.id === itemId);
    if (!target) return;

    const currentAmt = Number(this.newCreditAmount || 0);
    const newAmt = Math.max(0, currentAmt - (target.item.price * target.count));
    this.newCreditAmount = Number(newAmt.toFixed(2));

    this.addedCrossSellItems.update(items => items.filter(i => i.item.id !== itemId));
    this.toast.info(`${target.item.name} removido de la cuenta.`);
  }

  // Wallet Recharge Form State
  showRechargeModal = signal(false);
  rechargeAmount: number | null = null;
  rechargeBonusPercent = signal<number>(3);
  rechargeMethod: 'CASH' | 'TRANSFER' = 'CASH';
  isRechargingWallet = signal(false);

  get baseAmount(): number {
    return Number(this.newCreditAmount || 0);
  }

  get surchargeAmount(): number {
    if (this.baseAmount <= 0) return 0;
    return Number(((this.baseAmount * this.surchargePercent()) / 100).toFixed(2));
  }

  get totalCreditAmount(): number {
    return Number((this.baseAmount + this.surchargeAmount).toFixed(2));
  }

  get totalExtraProfit(): number {
    return this.credits().reduce((acc, c) => acc + Number(c.surchargeAmount || 0), 0);
  }

  setSurcharge(percent: number): void {
    this.surchargePercent.set(percent);
  }

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly creditService: CreditService,
    private readonly customerService: CustomerService,
    private readonly walletService: WalletService,
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
      this.walletBalance.set('0.00');
      this.walletMovements.set([]);
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

    this.walletService.getWalletDetails(this.selectedCustomerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.walletBalance.set(res.data.walletBalance);
          this.walletMovements.set(res.data.movements || []);
        },
        error: () => {
          this.walletBalance.set('0.00');
          this.walletMovements.set([]);
        }
      });
  }

  openRechargeModal(): void {
    this.rechargeAmount = null;
    this.showRechargeModal.set(true);
  }

  closeRechargeModal(): void {
    this.showRechargeModal.set(false);
  }

  submitWalletRecharge(): void {
    if (!this.selectedCustomerId || !this.rechargeAmount || this.rechargeAmount <= 0) {
      this.toast.error('Por favor ingresa un monto válido de recarga.');
      return;
    }

    this.isRechargingWallet.set(true);

    this.walletService.rechargeWallet({
      customerId: this.selectedCustomerId,
      amount: Number(this.rechargeAmount),
      bonusPercent: this.rechargeBonusPercent(),
      method: this.rechargeMethod,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.isRechargingWallet.set(false);
          this.toast.success(`Wallet recargada exitosamente. Crédito total: +$${res.data.credited}`);
          this.closeRechargeModal();
          this.loadCredits();
        },
        error: (err) => {
          this.isRechargingWallet.set(false);
          const msg = err.error?.message || err.message || 'Error al recargar Wallet.';
          this.toast.error(msg);
        }
      });
  }

  submitCredit(): void {
    if (!this.selectedCustomerId || !this.newCreditAmount || !this.newCreditDueDate || !this.newCreditEmail) {
      this.createMessage.set('Por favor completa todos los campos (Monto base, Fecha, Correo).');
      return;
    }

    if (this.semaphore() === 'RED') {
      this.createMessage.set('No se puede crear crédito: Cliente en mora (ROJO).');
      return;
    }

    this.isCreating.set(true);
    this.createMessage.set('Procesando crédito con recargo de financiamiento...');

    this.creditService.createCredit(this.selectedCustomerId, {
      amount: this.baseAmount,
      baseAmount: this.baseAmount,
      surchargePercent: this.surchargePercent(),
      dueDate: this.newCreditDueDate,
      email: this.newCreditEmail,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isCreating.set(false);
          this.toast.success(`Crédito creado con +${this.surchargePercent()}% de recargo ($${this.surchargeAmount} ganancia extra).`);
          this.createMessage.set('Crédito creado exitosamente.');
          this.newCreditAmount = null;
          this.newCreditDueDate = '';
          this.loadCredits();
        },
        error: (err) => {
          this.isCreating.set(false);
          const msg = err.error?.message || err.message || 'Error al crear el crédito.';
          this.toast.error(msg);
          this.createMessage.set(msg);
        }
      });
  }

  selectedCreditForPayment = signal<CreditSummary | null>(null);
  paymentAmount: number | null = null;
  paymentMethod: 'CASH' | 'TRANSFER' = 'CASH';
  isProcessingPayment = signal(false);

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

  openPaymentModal(credit: CreditSummary): void {
    this.selectedCreditForPayment.set(credit);
    this.paymentAmount = Number(credit.amount);
    this.paymentMethod = 'CASH';
  }

  closePaymentModal(): void {
    this.selectedCreditForPayment.set(null);
    this.paymentAmount = null;
  }

  confirmPayment(): void {
    const credit = this.selectedCreditForPayment();
    if (!credit || !this.paymentAmount || this.paymentAmount <= 0) {
      this.toast.error('Por favor ingresa un monto de pago válido.');
      return;
    }

    this.isProcessingPayment.set(true);

    this.creditService.registerPayment({
      creditId: credit.id,
      amount: Number(this.paymentAmount),
      method: this.paymentMethod,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isProcessingPayment.set(false);
          this.toast.success('Pago registrado exitosamente. Deuda cancelada/actualizada.');
          this.closePaymentModal();
          this.loadCredits();
        },
        error: (err) => {
          this.isProcessingPayment.set(false);
          const msg = err.error?.message || err.message || 'Error al registrar pago.';
          this.toast.error(msg);
        }
      });
  }
}
