import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../shared/services/dashboard.service';
import { DashboardData } from '../../shared/models/dashboard.model';
import { KpiCardComponent } from './components/kpi-card/kpi-card.component';
import { PipelineChartComponent } from './components/pipeline-chart/pipeline-chart.component';
import { UpcomingDealsComponent } from './components/upcoming-deals/upcoming-deals.component';
import { RecentActivityComponent } from './components/recent-activity/recent-activity.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    RouterLink,
    KpiCardComponent,
    PipelineChartComponent,
    UpcomingDealsComponent,
    RecentActivityComponent,
    SkeletonLoaderComponent,
  ],
  templateUrl: './dashboard-page.component.html',
})
export class DashboardPageComponent {
  private readonly dashboardService = inject(DashboardService);

  readonly data = signal<DashboardData | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);
    this.dashboardService.getDashboard().subscribe({
      next: (result) => {
        this.data.set(result);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Error al cargar el dashboard');
        this.loading.set(false);
      },
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(value);
  }
}
