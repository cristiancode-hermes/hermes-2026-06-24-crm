import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Deal } from '../../../../shared/models/deal.model';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-deals-list',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './deals-list.component.html',
})
export class DealsListComponent {
  readonly deals = input<Deal[]>([]);
  readonly newDeal = output<void>();
}
