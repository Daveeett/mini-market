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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #2b3a4a;">Hola ${data.customerName},</h2>
        <p>Se te ha otorgado un nuevo microcrédito en el <strong>Mini Market Urbano</strong>.</p>
        <ul style="background: #f4f7f6; padding: 15px 30px; border-radius: 8px;">
          <li><strong>Monto:</strong> $${data.amount}</li>
          <li><strong>Vencimiento:</strong> ${data.dueDate}</li>
        </ul>
        <p>Puedes revisar tu estado de cuenta en cualquier momento:</p>
        <p style="text-align: center;">
          <a href="${data.statementUrl}" style="background-color: #0d8365; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ver Estado de Cuenta</a>
        </p>
        <hr style="border: none; border-top: 1px solid #ddd; margin-top: 30px;" />
        <p style="color: #666; font-size: 12px; text-align: center;">Mini Market Urbano - Cobranza Automática</p>
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
      throw new AppError("Error al enviar el correo electrónico. Verifique su EMAIL_PASS.", 500, "EMAIL_ERROR");
    }
  }
}
