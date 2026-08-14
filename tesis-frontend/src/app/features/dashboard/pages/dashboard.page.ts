import { Component, OnInit, ViewChild, ElementRef, signal, DestroyRef, inject, ChangeDetectionStrategy, Injector, afterNextRender } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { DashboardService } from '../services/dashboard.service';
import { AuthService } from '@features/auth/services/auth.service';
import { Chart, DoughnutController, BarController, ArcElement, BarElement,
         CategoryScale, LinearScale, Legend, Tooltip } from 'chart.js';
import { NgIconComponent } from '@ng-icons/core';
import { DashboardAlert } from '../interfaces/request/dashboard-alert.interface';
import { DashboardStats } from '../interfaces/request/dashboard-stats.interface';

Chart.register(DoughnutController, BarController, ArcElement, BarElement,
               CategoryScale, LinearScale, Legend, Tooltip);

@Component({
    selector: 'app-dashboard-page',
    imports: [DatePipe, NgIconComponent],
    templateUrl: './dashboard.page.html',
    styleUrl: './dashboard.page.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit {
  @ViewChild('semaphoreChart') semaphoreChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cashChart') cashChartRef!: ElementRef<HTMLCanvasElement>;

  readonly alerts = signal<DashboardAlert[]>([]);
  readonly statsData = signal<DashboardStats | null>(null);

  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private semaphoreChartInstance: Chart | null = null;
  private cashChartInstance: Chart | null = null;

  get overdueTotal(): string {
    const total = this.alerts().reduce((acc, item) => acc + Number(item.amount), 0);
    return `$${total.toFixed(2)}`;
  }

  hasCashData(): boolean {
    const d = this.statsData();
    if (!d) return false;
    return d.cashChart.some(day => day.income > 0 || day.expense > 0);
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

    // Cash bar chart
    const cc = this.cashChartRef?.nativeElement;
    if (cc) {
      if (this.cashChartInstance) this.cashChartInstance.destroy();
      this.cashChartInstance = new Chart(cc, {
        type: 'bar',
        data: {
          labels: stats.cashChart.map(d => {
            const [,, day] = d.date.split('-');
            return `Día ${day}`;
          }),
          datasets: [
            {
              label: 'Ingresos',
              data: stats.cashChart.map(d => d.income),
              backgroundColor: 'rgba(5, 150, 105, 0.8)',
              borderRadius: 6,
            },
            {
              label: 'Egresos',
              data: stats.cashChart.map(d => d.expense),
              backgroundColor: 'rgba(220, 38, 38, 0.8)',
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top', labels: { font: { weight: 'bold' } } },
          },
          scales: {
            y: { beginAtZero: true, ticks: { callback: (v) => `$${v}` } },
          },
        },
      });
    }
  }
}
