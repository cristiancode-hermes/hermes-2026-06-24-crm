import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Deal } from '../../../../shared/models/deal.model';

@Component({
  selector: 'app-deal-stage-selector',
  imports: [FormsModule],
  templateUrl: './deal-stage-selector.component.html',
})
export class DealStageSelectorComponent {
  readonly deal = input.required<Deal>();
  readonly stageChange = output<string>();

  readonly stages = [
    { value: 'nuevo', label: 'Nuevo' },
    { value: 'calificado', label: 'Calificado' },
    { value: 'propuesta', label: 'Propuesta' },
    { value: 'negociacion', label: 'Negociación' },
    { value: 'cerrado_ganado', label: 'Cerrado Ganado' },
    { value: 'cerrado_perdido', label: 'Cerrado Perdido' },
  ];

  onStageChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.stageChange.emit(select.value);
  }
}
