import { Component, input, output, signal } from '@angular/core';
import { Deal } from '../../../../shared/models/deal.model';
import { KanbanColumnComponent } from '../kanban-column/kanban-column.component';

export interface ColumnConfig {
  stage: string;
  title: string;
  color: string;
}

@Component({
  selector: 'app-kanban-board',
  imports: [KanbanColumnComponent],
  templateUrl: './kanban-board.component.html',
})
export class KanbanBoardComponent {
  readonly deals = input<Deal[]>([]);
  readonly stageChanged = output<{ dealId: number; stage: string }>();

  readonly columns: ColumnConfig[] = [
    { stage: 'Nuevo', title: 'Nuevo', color: 'bg-neutral-400' },
    { stage: 'Calificado', title: 'Calificado', color: 'bg-primary-400' },
    { stage: 'Propuesta', title: 'Propuesta', color: 'bg-secondary-400' },
    { stage: 'Negociación', title: 'Negociación', color: 'bg-accent-500' },
    { stage: 'Cerrado Ganado', title: 'Cerrado Ganado', color: 'bg-success-500' },
    { stage: 'Cerrado Perdido', title: 'Cerrado Perdido', color: 'bg-warning-500' },
  ];

  getDealsForStage(stage: string): Deal[] {
    return this.deals().filter((d) => d.stage === stage);
  }

  constructor() {
    window.addEventListener('deal-dropped', this.handleDrop.bind(this) as EventListener);
  }

  private handleDrop(event: CustomEvent): void {
    const { dealId, stage } = event.detail;
    this.stageChanged.emit({ dealId, stage });
  }
}
