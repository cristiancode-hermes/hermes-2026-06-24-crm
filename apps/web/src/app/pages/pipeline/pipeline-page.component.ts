import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DealsService } from '../../shared/services/deals.service';
import { ToastService } from '../../shared/services/toast.service';
import { Deal } from '../../shared/models/deal.model';
import { StageValue } from '../../shared/models/dashboard.model';
import { PipelineControlsComponent } from './components/pipeline-controls/pipeline-controls.component';
import { KanbanBoardComponent } from './components/kanban-board/kanban-board.component';
import { PipelineValueBarComponent } from './components/pipeline-value-bar/pipeline-value-bar.component';
import { DealFormModalComponent } from './components/deal-form-modal/deal-form-modal.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-pipeline-page',
  imports: [
    PipelineControlsComponent,
    KanbanBoardComponent,
    PipelineValueBarComponent,
    DealFormModalComponent,
    SkeletonLoaderComponent,
  ],
  templateUrl: './pipeline-page.component.html',
})
export class PipelinePageComponent {
  private readonly dealsService = inject(DealsService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  readonly deals = signal<Deal[]>([]);
  readonly stageValues = signal<StageValue[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly formLoading = signal(false);

  readonly showForm = signal(false);
  readonly editingDeal = signal<Deal | null>(null);
  readonly contactIdFromRoute = signal<number | null>(null);

  constructor() {
    const cid = this.route.snapshot.queryParamMap.get('contactId');
    if (cid) this.contactIdFromRoute.set(Number(cid));
    this.loadDealsInternal();
    this.loadStageValues();
  }

  loadDeals(): void {
    this.loadDealsInternal();
  }

  private loadDealsInternal(): void {
    this.loading.set(true);
    this.error.set(null);
    const params: { contactId?: number } = {};
    const cid = this.contactIdFromRoute();
    if (cid) params.contactId = cid;

    this.dealsService.getAll(params).subscribe({
      next: (deals) => {
        this.deals.set(deals);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Error al cargar pipeline');
        this.loading.set(false);
      },
    });
  }

  private loadStageValues(): void {
    this.dealsService.getKpi().subscribe({
      next: (kpi) => {
        this.stageValues.set(kpi.stageValues || []);
      },
      error: () => {},
    });
  }

  onStageChange(event: { dealId: number; stage: string }): void {
    const deal = this.deals().find((d) => d.id === event.dealId);
    if (!deal) return;

    const oldStage = deal.stage;
    this.deals.update((deals) =>
      deals.map((d) => (d.id === event.dealId ? { ...d, stage: event.stage } : d))
    );

    this.dealsService.updateStatus(event.dealId, { stage: event.stage, position: 0 }).subscribe({
      error: () => {
        this.deals.update((deals) =>
          deals.map((d) => (d.id === event.dealId ? { ...d, stage: oldStage } : d))
        );
        this.toastService.error('Error al actualizar la etapa del deal');
      },
    });
  }

  openCreateForm(): void {
    this.showForm.set(true);
  }

  onSave(data: Partial<Deal>): void {
    this.formLoading.set(true);

    const payload = { ...data };
    const cid = this.contactIdFromRoute();
    if (!payload.contactId && cid) {
      payload.contactId = cid;
    }

    this.dealsService.create(payload).subscribe({
      next: () => {
        this.toastService.success('Deal creado correctamente');
        this.formLoading.set(false);
        this.showForm.set(false);
        this.loadDealsInternal();
        this.loadStageValues();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Error al crear deal');
        this.formLoading.set(false);
      },
    });
  }

  closeForm(): void {
    this.showForm.set(false);
  }
}
