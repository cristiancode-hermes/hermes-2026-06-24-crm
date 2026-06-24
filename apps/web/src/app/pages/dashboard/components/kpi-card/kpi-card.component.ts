import { Component, input } from '@angular/core';

@Component({
  selector: 'app-kpi-card',
  imports: [],
  templateUrl: './kpi-card.component.html',
})
export class KpiCardComponent {
  readonly title = input.required<string>();
  readonly value = input.required<string | number>();
  readonly subtitle = input<string>('');
  readonly icon = input<string>(''); // 'deals' | 'pipeline' | 'won' | 'conversion'
  readonly color = input<string>('primary');
}
