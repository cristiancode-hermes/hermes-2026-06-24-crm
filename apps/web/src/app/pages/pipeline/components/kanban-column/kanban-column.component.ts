import { Component, input } from '@angular/core';
import { Deal } from '../../../../shared/models/deal.model';
import { DealCardComponent } from '../deal-card/deal-card.component';

@Component({
  selector: 'app-kanban-column',
  imports: [DealCardComponent],
  templateUrl: './kanban-column.component.html',
})
export class KanbanColumnComponent {
  readonly title = input.required<string>();
  readonly stage = input.required<string>();
  readonly deals = input<Deal[]>([]);
  readonly colorClass = input<string>('bg-neutral-500');

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    const el = event.currentTarget as HTMLElement;
    el.classList.add('bg-neutral-100', 'dark:bg-neutral-700/50');
  }

  onDragLeave(event: DragEvent): void {
    const el = event.currentTarget as HTMLElement;
    el.classList.remove('bg-neutral-100', 'dark:bg-neutral-700/50');
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const el = event.currentTarget as HTMLElement;
    el.classList.remove('bg-neutral-100', 'dark:bg-neutral-700/50');
    const dealId = event.dataTransfer?.getData('text/plain');
    if (dealId) {
      // Dispatch custom event for the board to handle
      window.dispatchEvent(new CustomEvent('deal-dropped', {
        detail: { dealId: Number(dealId), stage: this.stage() },
      }));
    }
  }
}
