import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Deal } from '../../../../shared/models/deal.model';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-upcoming-deals',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './upcoming-deals.component.html',
})
export class UpcomingDealsComponent {
  readonly deals = input<Deal[]>([]);
}
