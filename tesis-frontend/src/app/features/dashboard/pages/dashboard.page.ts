import { Component, OnInit, ViewChild, ElementRef, signal, DestroyRef, inject, ChangeDetectionStrategy, Injector, afterNextRender } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { DashboardService } from '../services/dashboard.service';
import { AuthService } from '@features/auth/services/auth.service';
import { Chart, DoughnutController, ArcElement, Legend, Tooltip } from 'chart.js';
import { NgIconComponent } from '@ng-icons/core';
import { DashboardAlert } from '../interfaces/request/dashboard-alert.interface';
import { DashboardStats } from '../interfaces/request/dashboard-stats.interface';

Chart.register(DoughnutController, ArcElement, Legend, Tooltip);

@Component({
    selector: 'app-dashboard-page',
    imports: [DatePipe, NgIconComponent],
    templateUrl: './dashboard.page.html',
    styleUrl: './dashboard.page.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit {
  @ViewChild('semaphoreChart') semaphoreChartRef!: ElementRef<HTMLCanvasElement>;

  readonly alerts = signal<DashboardAlert[]>([]);
  readonly statsData = signal<DashboardStats | null>(null);

  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private semaphoreChartInstance: Chart | null = null;

  get overdueTotal(): string {
    const total = this.alerts().reduce((acc, item) => acc + Number(item.amount), 0);
    return `$${total.toFixed(2)}`;
  }

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly authService: AuthService
  ) {}

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    if (!this.isAdmin) return;

     this.dashboardService.getDashboardAlerts()
       .pipe(takeUntilDestroyed(this.destroyRef))
       .subscribe({
         next: (response) => this.alerts.set(response.data),
         error: () => this.alerts.set([]),
       });

     this.dashboardService.getDashboardStats()
       .pipe(takeUntilDestroyed(this.destroyRef))
       .subscribe({
         next: (response) => {
           this.statsData.set(response.data);
           afterNextRender(() => this.renderCharts(), { injector: this.injector });
         },
         error: () => {},
       });
  }

  private renderCharts(): void {
    const stats = this.statsData();
    if (!stats) return;

    // Semaphore doughnut
    const sc = this.semaphoreChartRef?.nativeElement;
    if (sc) {
      if (this.semaphoreChartInstance) this.semaphoreChartInstance.destroy();
      this.semaphoreChartInstance = new Chart(sc, {
        type: 'doughnut',
        data: {
          labels: ['Al día (Verde)', 'Por vencer (Amarillo)', 'En mora (Rojo)'],
          datasets: [{
            data: [stats.semaphore.green, stats.semaphore.yellow, stats.semaphore.red],
            backgroundColor: ['#059669', '#F59E0B', '#DC2626'],
            borderWidth: 0,
            hoverOffset: 6,
          }],
        },
        options: {
          responsive: true,
          cutout: '65%',
          plugins: {
            legend: { position: 'bottom', labels: { padding: 16, font: { weight: 'bold' } } },
          },
        },
      });
    }
  }
}
