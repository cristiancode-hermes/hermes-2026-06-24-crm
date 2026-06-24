import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-activity-form-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './activity-form-modal.component.html',
})
export class ActivityFormModalComponent {
  private readonly fb = inject(FormBuilder);

  readonly loading = input<boolean>(false);
  readonly save = output<{ type: string; description: string; date: string }>();
  readonly close = output<void>();

  form = this.fb.group({
    type: ['note', Validators.required],
    description: ['', Validators.required],
    date: [new Date().toISOString().slice(0, 10), Validators.required],
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.save.emit(this.form.value as { type: string; description: string; date: string });
  }
}
