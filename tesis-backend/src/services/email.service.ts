import * as nodemailer from "nodemailer";
import dns from "node:dns";
import { promisify } from "node:util";
import { config } from "../config/environment";
import { AppError } from "../utils/app-error.util";

const resolveMx = promisify(dns.resolveMx);

interface CreditNotificationData {
  to: string;
  customerName: string;
  amount: string;
  dueDate: string;
  statementUrl: string;
  baseAmount?: string;
  surchargePercent?: string;
  surchargeAmount?: string;
}

export class EmailService {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.email.user || process.env["EMAIL_USER"],
        pass: config.email.pass || process.env["EMAIL_PASS"],
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async verifyEmailDomain(email: string): Promise<boolean> {
    const domain = email.split("@")[1];
    if (!domain) return false;

    if (
      domain === "test.com" ||
      domain.endsWith(".local") ||
      domain === "example.com" ||
      domain === "tecsu.edu.ec"
    ) {
      return true;
    }

    try {
      const addresses = await resolveMx(domain);
      return addresses && addresses.length > 0;
    } catch {
      if (process.env["NODE_ENV"] === "development" || !process.env["NODE_ENV"]) return true;
      return false;
    }
  }

  async sendCreditNotification(data: CreditNotificationData): Promise<void> {
    if (!config.email.user && !process.env["EMAIL_USER"]) {
      console.warn("Emails not configured - skipping notification.");
      return;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <div style="background-color: #002A5C; color: #ffffff; padding: 20px; text-align: center;">
          <h1 style="color: #FFDD00; margin: 0; font-size: 22px;">Mini Market Urbano</h1>
          <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Comprobante de Microcrédito Otorgado</p>
        </div>
        <div style="padding: 24px;">
          <h2 style="color: #1e293b; margin-top: 0;">Hola ${data.customerName},</h2>
          <p style="color: #475569; line-height: 1.5;">Se ha registrado exitosamente un nuevo crédito a tu cuenta en <strong>Mini Market Urbano</strong>.</p>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
            ${data.baseAmount ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #64748b; font-size: 14px;">
              <span>Monto Base (Precio Contado):</span>
              <strong style="color: #334155;">$${data.baseAmount}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #64748b; font-size: 14px;">
              <span>Recargo Financiamiento Crédito (+${data.surchargePercent || '5'}%):</span>
              <strong style="color: #0d8365;">+$${data.surchargeAmount || '0.00'}</strong>
            </div>
            <hr style="border: none; border-top: 1px dashed #cbd5e1; margin: 10px 0;" />
            ` : ''}
            <div style="display: flex; justify-content: space-between; color: #0f172a; font-size: 16px;">
              <span><strong>Total a Pagar a Crédito:</strong></span>
              <strong style="color: #002A5C; font-size: 18px;">$${data.amount}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 8px; color: #dc2626; font-size: 14px;">
              <span>Fecha Límite de Pago:</span>
              <strong>${data.dueDate}</strong>
            </div>
          </div>

          <p style="color: #475569; font-size: 14px;">Puedes consultar tu estado de cuenta en vivo y promociones activas desde el siguiente botón:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${data.statementUrl}" style="background-color: #0d8365; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Ver Estado de Cuenta en Línea</a>
          </div>
        </div>
        <div style="background-color: #f1f5f9; padding: 12px; text-align: center; font-size: 12px; color: #64748b;">
          Mini Market Urbano &bull; Sistema de Gestión y Microcréditos
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"Mini Market Urbano" <${config.email.user || process.env["EMAIL_USER"] || "no-reply@minimarket.local"}>`,
        to: data.to,
        subject: "Nuevo Microcrédito - Mini Market Urbano",
        html,
      });
      console.log(`Email enviado a ${data.to}`);
      console.warn("\n============================================================");
      console.warn(" ENLACE DEL ESTADO DE CUENTA GENERADO PARA PRUEBAS:");
      console.warn(" HAZ CLIC AQUI: " + data.statementUrl);
      console.warn("============================================================\n");
    } catch (error) {
      console.error("Error al enviar el email normal, intentando Ethereal...");
      if (process.env["NODE_ENV"] === "development" || !process.env["NODE_ENV"]) {
        try {
          const testAccount = await nodemailer.createTestAccount();
          const testTransporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: { user: testAccount.user, pass: testAccount.pass },
            tls: {
              rejectUnauthorized: false,
            },
          });
          const info = await testTransporter.sendMail({
            from: '"Mini Market Test" <test@ethereal.email>',
            to: data.to,
            subject: "Nuevo Microcrédito (PREVIEW) - Mini Market Urbano",
            html,
          });
          const etherealUrl = nodemailer.getTestMessageUrl(info);
          console.warn("\n============================================================");
          console.warn(" CORREO ETHEREAL ENVIADO!");
          console.warn(" HAZ CLIC AQUI: " + etherealUrl);
          console.warn("============================================================\n");
          return;
        } catch (testError) {
          console.error("Tambien fallo Ethereal:", testError);
        }
      }
      throw new AppError(`Error al enviar el correo electrónico. Verifique su EMAIL_PASS. Detalle técnico: ${error instanceof Error ? error.message : String(error)}`, 500, "EMAIL_ERROR");
    }
  }
}
