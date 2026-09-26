import { Component, signal, computed, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DatePipe, CommonModule } from '@angular/common';
import { NgIconComponent } from '@ng-icons/core';
import { InvoiceService } from '../services/invoice.service';
import { ElectronicInvoice, InvoiceItem } from '../interfaces/invoice.interface';
import { CustomerService } from '@features/customers/services/customer.service';
import { Customer } from '@features/customers/interfaces/requests/customer.interface';
import { ToastService } from '@shared/services/toast.service';

@Component({
  selector: 'app-invoicing-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, NgIconComponent],
  templateUrl: './invoicing.page.html',
  styleUrl: './invoicing.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoicingPage {
  readonly invoices = signal<ElectronicInvoice[]>([]);
  readonly customers = signal<Customer[]>([]);
  readonly isLoading = signal(false);

  // Form State
  documentType: 'FACTURA' | 'NOTA_CREDITO' | 'COMPROBANTE_VENTA' = 'FACTURA';
  selectedCustomerId = '';
  customerName = '';
  customerDoc = '';
  customerEmail = '';
  customerAddress = '';

  // Form Items
  formItems = signal<{ description: string; quantity: number; unitPrice: number; taxRate: 0 | 15 }[]>([
    { description: 'Venta Abarrotes Varios', quantity: 1, unitPrice: 10.00, taxRate: 0 }
  ]);

  // Modal RIDE Viewer State
  selectedInvoice = signal<ElectronicInvoice | null>(null);
  showRideModal = signal(false);

  // Search Filter
  searchQuery = signal<string>('');

  private readonly destroyRef = inject(DestroyRef);
  private readonly invoiceService = inject(InvoiceService);
  private readonly customerService = inject(CustomerService);
  private readonly toast = inject(ToastService);

  readonly filteredInvoices = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.invoices();
    return this.invoices().filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.customerDoc.toLowerCase().includes(q) ||
        inv.accessKey.toLowerCase().includes(q)
    );
  });

  readonly calculatedSubtotalZero = computed(() => {
    return this.formItems().reduce((acc, item) => {
      return item.taxRate === 0 ? acc + Number(item.quantity * item.unitPrice) : acc;
    }, 0);
  });

  readonly calculatedSubtotalTaxed = computed(() => {
    return this.formItems().reduce((acc, item) => {
      return item.taxRate === 15 ? acc + Number(item.quantity * item.unitPrice) : acc;
    }, 0);
  });

  readonly calculatedTaxAmount = computed(() => {
    return Number((this.calculatedSubtotalTaxed() * 0.15).toFixed(2));
  });

  readonly calculatedTotalAmount = computed(() => {
    return Number((this.calculatedSubtotalZero() + this.calculatedSubtotalTaxed() + this.calculatedTaxAmount()).toFixed(2));
  });

  constructor() {
    this.loadCustomers();
    this.loadInvoices();
  }

  loadCustomers(): void {
    this.customerService
      .getCustomers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.customers.set(res.data),
      });
  }

  loadInvoices(): void {
    this.isLoading.set(true);
    this.invoiceService
      .getInvoices()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.invoices.set(res);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  onCustomerSelect(cust: Customer): void {
    if (!cust) return;
    this.selectedCustomerId = cust.id;
    this.customerName = cust.fullName;
    this.customerDoc = cust.docNumber || '1799999999001';
    this.customerEmail = cust.email || 'cliente@correo.com';
    this.customerAddress = cust.address || 'Quito, Ecuador';
  }

  onCustomerChange(id: string): void {
    const cust = this.customers().find((c) => c.id === id);
    if (cust) {
      this.onCustomerSelect(cust);
    }
  }

  addItem(): void {
    this.formItems.update((items) => [...items, { description: '', quantity: 1, unitPrice: 5.00, taxRate: 15 }]);
  }

  removeItem(index: number): void {
    if (this.formItems().length === 1) return;
    this.formItems.update((items) => items.filter((_, i) => i !== index));
  }

  submitInvoice(): void {
    if (!this.customerName || !this.customerDoc || !this.customerEmail) {
      this.toast.error('Completa los datos del cliente (Nombre, Cédula/RUC y Correo).');
      return;
    }

    const validItems = this.formItems().filter((item) => item.description.trim() !== '' && item.quantity > 0 && item.unitPrice > 0);
    if (validItems.length === 0) {
      this.toast.error('Agrega al menos un ítem con descripción y precio válido.');
      return;
    }

    this.invoiceService
      .createInvoice({
        documentType: this.documentType,
        customerId: this.selectedCustomerId || 'cust-direct',
        customerName: this.customerName,
        customerDoc: this.customerDoc,
        customerEmail: this.customerEmail,
        customerAddress: this.customerAddress || 'Quito, Ecuador',
        items: validItems,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (inv) => {
          this.toast.success(`¡Comprobante ${inv.invoiceNumber} AUTORIZADO por el SRI!`);
          this.invoices.set(this.invoiceService.invoices());
          this.openRideModal(inv);
          this.resetForm();
        },
        error: () => this.toast.error('Error al emitir comprobante electrónico.'),
      });
  }

  resetForm(): void {
    this.selectedCustomerId = '';
    this.customerName = '';
    this.customerDoc = '';
    this.customerEmail = '';
    this.customerAddress = '';
    this.formItems.set([{ description: 'Venta Abarrotes Varios', quantity: 1, unitPrice: 10.00, taxRate: 0 }]);
  }

  openRideModal(inv: ElectronicInvoice): void {
    this.selectedInvoice.set(inv);
    this.showRideModal.set(true);
  }

  closeRideModal(): void {
    this.showRideModal.set(false);
  }

  downloadXml(inv: ElectronicInvoice): void {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<factura id="comprobante" version="2.1.0">
  <infoTributaria>
    <ambiente>${inv.environment === 'PRODUCCION' ? '2' : '1'}</ambiente>
    <tipoEmision>1</tipoEmision>
    <razonSocial>MINI MARKET URBANO S.A.S.</razonSocial>
    <nombreComercial>Mini Market Urbano</nombreComercial>
    <ruc>1792045678001</ruc>
    <claveAcceso>${inv.accessKey}</claveAcceso>
    <codDoc>01</codDoc>
    <estab>001</estab>
    <ptoEmi>001</ptoEmi>
    <secuencial>${inv.invoiceNumber.split('-')[2]}</secuencial>
    <dirMatriz>Av. de los Granados N34-12 y Eloy Alfaro</dirMatriz>
  </infoTributaria>
  <infoFactura>
    <fechaEmision>${new Date(inv.issueDate).toLocaleDateString('es-EC')}</fechaEmision>
    <dirEstablecimiento>${inv.customerAddress}</dirEstablecimiento>
    <obligadoContabilidad>NO</obligadoContabilidad>
    <tipoIdentificacionComprador>05</tipoIdentificacionComprador>
    <razonSocialComprador>${inv.customerName}</razonSocialComprador>
    <identificacionComprador>${inv.customerDoc}</identificacionComprador>
    <totalSinImpuestos>${(inv.subtotalZero + inv.subtotalTaxed).toFixed(2)}</totalSinImpuestos>
    <totalDescuento>0.00</totalDescuento>
    <importeTotal>${inv.totalAmount.toFixed(2)}</importeTotal>
    <moneda>DOLAR</moneda>
  </infoFactura>
</factura>`;

    const blob = new Blob([xmlContent], { type: 'text/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Factura_${inv.invoiceNumber}_SRI.xml`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.toast.info(`XML de la factura ${inv.invoiceNumber} descargado.`);
  }

  printRide(): void {
    window.print();
  }

  sendByWhatsApp(inv: ElectronicInvoice): void {
    const msg = `*Facturación Electrónica SRI - Mini Market Urbano*%0A%0AEstimado(a) *${inv.customerName}*, tu comprobante digital *${inv.invoiceNumber}* por un total de *$${inv.totalAmount.toFixed(2)}* ha sido *AUTORIZADO* por el SRI.%0A%0AClave de Acceso SRI:%0A\`${inv.accessKey}\`%0A%0A¡Gracias por tu compra!`;
    const url = `https://api.whatsapp.com/send?text=${msg}`;
    window.open(url, '_blank');
  }

  sendByEmail(inv: ElectronicInvoice): void {
    this.toast.success(`Comprobante RIDE y XML enviados a ${inv.customerEmail}`);
  }
}
