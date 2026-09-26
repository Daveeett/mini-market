import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIconComponent } from '@ng-icons/core';
import { ToastComponent } from '../toast/toast.component';
import { AuthService } from '@features/auth/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-layout-shell',
    imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIconComponent, ToastComponent, FormsModule],
    templateUrl: './layout-shell.component.html',
    styleUrl: './layout-shell.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutShellComponent {
  readonly user = this.authService.getCurrentUser();
  readonly isAdmin = () => this.authService.isAdmin();

  showTelegramModal = signal(false);
  telegramInput = '';
  isSendingTelegram = signal(false);
  telegramMessages = signal<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: '🤖 *Bot Asistente Financiero - Mini Market Urbano*\n\n¡Hola Tendero! Comandos disponibles:\n📊 /resumen - Resumen de ventas y caja hoy.\n🚨 /morosos - Ver deudores en semáforo ROJO.\n💸 /gasto [monto] [concepto] - Registrar egreso.',
      time: 'Justo ahora',
    }
  ]);

  constructor(
    private readonly authService: AuthService,
    private readonly http: HttpClient,
  ) {}

  logout(): void {
    this.authService.logout();
  }

  toggleTelegramModal(): void {
    this.showTelegramModal.update(v => !v);
  }

  sendTelegramCommand(customText?: string): void {
    const textToSend = customText || this.telegramInput;
    if (!textToSend.trim()) return;

    const time = new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    this.telegramMessages.update(msgs => [...msgs, { sender: 'user', text: textToSend, time }]);
    this.telegramInput = '';
    this.isSendingTelegram.set(true);

    this.http.post<any>(`${environment.apiBaseUrl}/telegram/message`, { text: textToSend })
      .subscribe({
        next: (res) => {
          this.isSendingTelegram.set(false);
          const botText = res.data?.message || '🤖 Mensaje recibido.';
          this.telegramMessages.update(msgs => [...msgs, { sender: 'bot', text: botText, time }]);
        },
        error: (err) => {
          this.isSendingTelegram.set(false);
          const errorMsg = '⚠️ Error al comunicarse con el Bot de Telegram.';
          this.telegramMessages.update(msgs => [...msgs, { sender: 'bot', text: errorMsg, time }]);
        }
      });
  }
}
