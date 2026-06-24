import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  imports: [],
  templateUrl: './confirm-modal.component.html',
})
export class ConfirmModalComponent {
  readonly title = input<string>('Confirmar');
  readonly message = input<string>('¿Estás seguro?');
  readonly confirmText = input<string>('Confirmar');
  readonly cancelText = input<string>('Cancelar');
  readonly loading = input<boolean>(false);

  readonly confirm = output<void>();
  readonly cancel = output<void>();
}
