import { Component, inject, input, output, signal, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Deal } from '../../../../shared/models/deal.model';

@Component({
  selector: 'app-deal-form-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './deal-form-modal.component.html',
})
export class DealFormModalComponent {
  private readonly fb = inject(FormBuilder);

  readonly deal = input<Deal | null>(null);
  readonly loading = input<boolean>(false);
  readonly contactId = input<number | null>(null);

  readonly save = output<Partial<Deal>>();
  readonly close = output<void>();

  form = this.fb.group({
    name: ['', Validators.required],
    value: [0, [Validators.required, Validators.min(1)]],
    stage: ['nuevo'],
    expectedCloseDate: [''],
    notes: [''],
    contactId: [0],
  });

  constructor() {
    effect(() => {
      const cid = this.contactId();
      if (cid) {
        this.form.patchValue({ contactId: cid });
      }
    });
    effect(() => {
      const d = this.deal();
      if (d) {
        this.form.patchValue({
          name: d.name,
          value: d.value,
          stage: d.stage,
          expectedCloseDate: d.expectedCloseDate ? new Date(d.expectedCloseDate).toISOString().slice(0, 10) : '',
          notes: d.notes || '',
          contactId: d.contactId,
        });
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const value = this.form.value;
    this.save.emit({
      name: value.name!,
      value: value.value!,
      stage: value.stage || 'nuevo',
      expectedCloseDate: value.expectedCloseDate ? new Date(value.expectedCloseDate) : undefined,
      notes: value.notes || undefined,
      contactId: value.contactId || undefined,
    });
  }
}
