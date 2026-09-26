export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: 0 | 15; // 0% or 15% IVA
  totalPrice: number;
}

export interface ElectronicInvoice {
  id: string;
  invoiceNumber: string; // e.g. 001-001-000000124
  accessKey: string; // 49-digit SRI Access Key
  documentType: 'FACTURA' | 'NOTA_CREDITO' | 'COMPROBANTE_VENTA';
  customerId: string;
  customerName: string;
  customerDoc: string; // Cédula/RUC
  customerEmail: string;
  customerAddress: string;
  issueDate: string;
  subtotalZero: number;
  subtotalTaxed: number;
  taxAmount: number; // IVA 15%
  totalAmount: number;
  status: 'AUTORIZADO' | 'PENDIENTE' | 'RECHAZADO';
  authorizationDate: string;
  environment: 'PRUEBAS' | 'PRODUCCION';
  items: InvoiceItem[];
}

export interface CreateInvoiceRequest {
  documentType: 'FACTURA' | 'NOTA_CREDITO' | 'COMPROBANTE_VENTA';
  customerId: string;
  customerName: string;
  customerDoc: string;
  customerEmail: string;
  customerAddress: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: 0 | 15;
  }[];
}
