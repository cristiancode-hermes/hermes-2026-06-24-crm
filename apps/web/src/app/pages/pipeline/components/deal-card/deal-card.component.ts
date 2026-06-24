import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { Deal } from '../../../../shared/models/deal.model';

@Component({
  selector: 'app-deal-card',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './deal-card.component.html',
})
export class DealCardComponent {
  readonly deal = input.required<Deal>();

  onDragStart(event: DragEvent): void {
    event.dataTransfer?.setData('text/plain', String(this.deal().id));
    event.dataTransfer!.effectAllowed = 'move';
  }
}
