import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DealsService } from '../../shared/services/deals.service';
import { ActivitiesService } from '../../shared/services/activities.service';
import { ToastService } from '../../shared/services/toast.service';
import { Deal } from '../../shared/models/deal.model';
import { Activity } from '../../shared/models/activity.model';
import { DealInfoComponent } from './components/deal-info/deal-info.component';
import { DealStageSelectorComponent } from './components/deal-stage-selector/deal-stage-selector.component';
import { ActivityTimelineComponent } from '../contact-detail/components/activity-timeline/activity-timeline.component';
import { ActivityFormModalComponent } from '../contact-detail/components/activity-form-modal/activity-form-modal.component';
import { DealFormModalComponent } from '../pipeline/components/deal-form-modal/deal-form-modal.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-deal-detail-page',
  imports: [
    RouterLink,
    DealInfoComponent,
    DealStageSelectorComponent,
    ActivityTimelineComponent,
    ActivityFormModalComponent,
    DealFormModalComponent,
    SkeletonLoaderComponent,
  ],
  templateUrl: './deal-detail-page.component.html',
})
export class DealDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly dealsService = inject(DealsService);
  private readonly activitiesService = inject(ActivitiesService);
  private readonly toastService = inject(ToastService);

  readonly deal = signal<Deal | null>(null);
  readonly activities = signal<Activity[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly formLoading = signal(false);
  readonly stageChanging = signal(false);

  readonly showEditForm = signal(false);
  readonly showActivityForm = signal(false);

  private dealId = 0;

  constructor() {
    this.dealId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadDeal();
  }

  loadDeal(): void {
    this.loading.set(true);
    this.error.set(null);
    this.dealsService.getById(this.dealId).subscribe({
      next: (deal) => {
        this.deal.set(deal);
        this.activities.set(deal.activities || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Error al cargar deal');
        this.loading.set(false);
      },
    });
  }

  onStageChange(stage: string): void {
    this.stageChanging.set(true);
    this.dealsService.updateStatus(this.dealId, { stage, position: 0 }).subscribe({
      next: () => {
        this.toastService.success('Etapa actualizada correctamente');
        this.stageChanging.set(false);
        this.loadDeal();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Error al actualizar etapa');
        this.stageChanging.set(false);
      },
    });
  }

  onEditDeal(data: Partial<Deal>): void {
    this.formLoading.set(true);
    this.dealsService.update(this.dealId, data).subscribe({
      next: () => {
        this.toastService.success('Deal actualizado correctamente');
        this.formLoading.set(false);
        this.showEditForm.set(false);
        this.loadDeal();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Error al actualizar deal');
        this.formLoading.set(false);
      },
    });
  }

  onNewActivity(data: { type: string; description: string; date: string }): void {
    this.formLoading.set(true);
    this.activitiesService.create({
      type: data.type as Activity['type'],
      description: data.description,
      date: new Date(data.date),
      dealId: this.dealId,
    }).subscribe({
      next: () => {
        this.toastService.success('Actividad registrada correctamente');
        this.formLoading.set(false);
        this.showActivityForm.set(false);
        this.loadDeal();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Error al registrar actividad');
        this.formLoading.set(false);
      },
    });
  }
}
