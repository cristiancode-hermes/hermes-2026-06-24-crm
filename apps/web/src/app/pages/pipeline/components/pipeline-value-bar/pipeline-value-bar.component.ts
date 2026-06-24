import { Component, computed, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { StageValue } from '../../../../shared/models/dashboard.model';

@Component({
  selector: 'app-pipeline-value-bar',
  imports: [CurrencyPipe],
  templateUrl: './pipeline-value-bar.component.html',
})
export class PipelineValueBarComponent {
  readonly stageValues = input<StageValue[]>([]);

  readonly totalValue = computed(() => {
    return this.stageValues().reduce((sum, sv) => sum + sv.value, 0);
  });

  readonly wonValue = computed(() => {
    const won = this.stageValues().find((sv) => sv.stage === 'cerrado_ganado');
    return won?.value || 0;
  });
}
