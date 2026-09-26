import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ElectronicInvoice, CreateInvoiceRequest } from '../interfaces/invoice.interface';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  // Preset Mock Invoices generated under standard SRI specifications
  private readonly mockInvoices: ElectronicInvoice[] = [
    {
      id: 'inv-001',
      invoiceNumber: '001-001-000000142',
      accessKey: '2609202601179204567800120010010000001421234567814',
      documentType: 'FACTURA',
      customerId: 'cust-1',
      customerName: 'Carlos Mendoza',
      customerDoc: '1724589012',
      customerEmail: 'carlos.mendoza@email.com',
      customerAddress: 'Av. Gran Colombia y 12 de Octubre',
      issueDate: '2026-09-26T08:30:00.000Z',
      subtotalZero: 5.00,
      subtotalTaxed: 40.00,
      taxAmount: 6.00, // 15% IVA
      totalAmount: 51.00,
      status: 'AUTORIZADO',
      authorizationDate: '2026-09-26T08:30:12.000Z',
      environment: 'PRODUCCION',
      items: [
        { id: 'it-1', description: 'Aceite Vegetal 1L', quantity: 2, unitPrice: 2.50, taxRate: 0, totalPrice: 5.00 },
        { id: 'it-2', description: 'Pack Cervezas Pilsen 6x330ml', quantity: 4, unitPrice: 10.00, taxRate: 15, totalPrice: 40.00 }
      ]
    },
    {
      id: 'inv-002',
      invoiceNumber: '001-001-000000143',
      accessKey: '2609202601179204567800120010010000001439876543211',
      documentType: 'FACTURA',
      customerId: 'cust-2',
      customerName: 'María Fernanda Ríos',
      customerDoc: '1718904567',
      customerEmail: 'maria.rios@email.com',
      customerAddress: 'Calle Los Alisos y 6 de Diciembre',
      issueDate: '2026-09-25T16:15:00.000Z',
      subtotalZero: 12.50,
      subtotalTaxed: 20.00,
      taxAmount: 3.00,
      totalAmount: 35.50,
      status: 'AUTORIZADO',
      authorizationDate: '2026-09-25T16:15:05.000Z',
      environment: 'PRODUCCION',
      items: [
        { id: 'it-3', description: 'Pan Baguette Artesanal x5', quantity: 1, unitPrice: 2.50, taxRate: 0, totalPrice: 2.50 },
        { id: 'it-4', description: 'Queso Fresco 500g', quantity: 2, unitPrice: 5.00, taxRate: 0, totalPrice: 10.00 },
        { id: 'it-5', description: 'Detergente Líquido 2L', quantity: 2, unitPrice: 10.00, taxRate: 15, totalPrice: 20.00 }
      ]
    },
    {
      id: 'inv-003',
      invoiceNumber: '001-001-000000144',
      accessKey: '2609202601179204567800120010010000001445555444319',
      documentType: 'COMPROBANTE_VENTA',
      customerId: 'cust-3',
      customerName: 'Juan Pablo Salazar',
      customerDoc: '1709123456',
      customerEmail: 'juan.salazar@email.com',
      customerAddress: 'Barrio La Carolina, Calle N34',
      issueDate: '2026-09-24T11:20:00.000Z',
      subtotalZero: 15.00,
      subtotalTaxed: 0.00,
      taxAmount: 0.00,
      totalAmount: 15.00,
      status: 'AUTORIZADO',
      authorizationDate: '2026-09-24T11:20:02.000Z',
      environment: 'PRODUCCION',
      items: [
        { id: 'it-6', description: 'Crédito Fiado Abarrotes Varios', quantity: 1, unitPrice: 15.00, taxRate: 0, totalPrice: 15.00 }
      ]
    }
  ];

  readonly invoices = signal<ElectronicInvoice[]>(this.mockInvoices);

  getInvoices(): Observable<ElectronicInvoice[]> {
    return of(this.invoices());
  }

  // Generate 49-digit SRI Access Key
  generateSriAccessKey(date: Date, invoiceNumStr: string, ruc: string = '1792045678001'): string {
    const d = date.toISOString().slice(0, 10).replace(/-/g, '');
    const dateFormatted = `${d.slice(6, 8)}${d.slice(4, 6)}${d.slice(0, 4)}`; // DDMMYYYY
    const typeCode = '01'; // 01 Factura
    const rucStr = ruc.padStart(13, '0');
    const env = '2'; // 1 Pruebas, 2 Producción
    const series = '001001';
    const seq = invoiceNumStr.replace(/-/g, '').slice(-9).padStart(9, '0');
    const numericCode = Math.floor(10000000 + Math.random() * 90000000).toString();
    const emissionType = '1'; // 1 Normal

    const raw = `${dateFormatted}${typeCode}${rucStr}${env}${series}${seq}${numericCode}${emissionType}`;
    
    // Calculate Modulo 11 check digit
    let factor = 2;
    let sum = 0;
    for (let i = raw.length - 1; i >= 0; i--) {
      sum += parseInt(raw[i], 10) * factor;
      factor = factor === 7 ? 2 : factor + 1;
    }
    const checkDigit = 11 - (sum % 11);
    const mod11Digit = checkDigit === 11 ? '0' : checkDigit === 10 ? '1' : checkDigit.toString();

    return `${raw}${mod11Digit}`;
  }

  createInvoice(req: CreateInvoiceRequest): Observable<ElectronicInvoice> {
    const nextSeq = this.invoices().length + 143;
    const seqStr = `001-001-${nextSeq.toString().padStart(9, '0')}`;
    const now = new Date();
    const accessKey = this.generateSriAccessKey(now, seqStr);

    let subtotalZero = 0;
    let subtotalTaxed = 0;
    let taxAmount = 0;

    const items = req.items.map((item, idx) => {
      const lineTotal = Number((item.quantity * item.unitPrice).toFixed(2));
      if (item.taxRate === 15) {
        subtotalTaxed += lineTotal;
        taxAmount += Number((lineTotal * 0.15).toFixed(2));
      } else {
        subtotalZero += lineTotal;
      }

      return {
        id: `it-${Date.now()}-${idx}`,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        totalPrice: lineTotal,
      };
    });

    const totalAmount = Number((subtotalZero + subtotalTaxed + taxAmount).toFixed(2));

    const newInvoice: ElectronicInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: seqStr,
      accessKey,
      documentType: req.documentType,
      customerId: req.customerId,
      customerName: req.customerName,
      customerDoc: req.customerDoc,
      customerEmail: req.customerEmail,
      customerAddress: req.customerAddress,
      issueDate: now.toISOString(),
      subtotalZero: Number(subtotalZero.toFixed(2)),
      subtotalTaxed: Number(subtotalTaxed.toFixed(2)),
      taxAmount: Number(taxAmount.toFixed(2)),
      totalAmount,
      status: 'AUTORIZADO',
      authorizationDate: new Date(now.getTime() + 2000).toISOString(),
      environment: 'PRODUCCION',
      items,
    };

    this.invoices.update((current) => [newInvoice, ...current]);
    return of(newInvoice);
  }
}
