import { Component, inject, input, output, signal, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Contact } from '../../../../shared/models/contact.model';

@Component({
  selector: 'app-contact-form-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './contact-form-modal.component.html',
})
export class ContactFormModalComponent {
  private readonly fb = inject(FormBuilder);

  readonly contact = input<Contact | null>(null);
  readonly loading = input<boolean>(false);

  readonly save = output<Partial<Contact>>();
  readonly close = output<void>();

  readonly isOpen = signal(false);

  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    company: [''],
    role: [''],
    notes: [''],
  });

  constructor() {
    effect(() => {
      const c = this.contact();
      if (c) {
        this.form.patchValue({
          name: c.name,
          email: c.email,
          phone: c.phone || '',
          company: c.company || '',
          role: c.role || '',
          notes: c.notes || '',
        });
      } else {
        this.form.reset();
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.save.emit(this.form.value as Partial<Contact>);
  }
}
