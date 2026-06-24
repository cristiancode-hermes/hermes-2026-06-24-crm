import { Component, input, output } from '@angular/core';
import { Deal } from '../../../../shared/models/deal.model';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-deal-info',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './deal-info.component.html',
})
export class DealInfoComponent {
  readonly deal = input.required<Deal>();
  readonly edit = output<void>();
}
