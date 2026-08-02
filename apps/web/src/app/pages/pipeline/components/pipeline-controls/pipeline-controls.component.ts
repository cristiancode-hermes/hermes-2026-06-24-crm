import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pipeline-controls',
  imports: [],
  templateUrl: './pipeline-controls.component.html',
})
export class PipelineControlsComponent {
  readonly totalDeals = input<number>(0);
  readonly newDeal = output<void>();
  readonly exportDeals = output<void>();
}
