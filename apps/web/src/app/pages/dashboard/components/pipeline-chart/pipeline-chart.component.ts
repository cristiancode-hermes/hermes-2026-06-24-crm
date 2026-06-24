import { Component, computed, input } from '@angular/core';
import { StageValue } from '../../../../shared/models/dashboard.model';

@Component({
  selector: 'app-pipeline-chart',
  imports: [],
  templateUrl: './pipeline-chart.component.html',
})
export class PipelineChartComponent {
  readonly data = input<StageValue[]>([]);

  readonly maxValue = computed(() => {
    const values = this.data().map((d) => d.value);
    return values.length ? Math.max(...values) : 1;
  });

  readonly barHeight = computed(() => 200);
  readonly svgWidth = computed(() => Math.max(600, this.data().length * 90));

  readonly stageLabels: Record<string, string> = {
    nuevo: 'Nuevo',
    calificado: 'Calificado',
    propuesta: 'Propuesta',
    negociacion: 'Negociación',
    cerrado_ganado: 'Ganado',
    cerrado_perdido: 'Perdido',
  };

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(value);
  }

  getBarHeight(value: number): number {
    return (value / this.maxValue()) * this.barHeight();
  }

  getLabel(stage: string): string {
    return this.stageLabels[stage] || stage;
  }
}
