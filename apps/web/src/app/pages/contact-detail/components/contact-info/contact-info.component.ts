import { Component, input, output } from '@angular/core';
import { Contact } from '../../../../shared/models/contact.model';

@Component({
  selector: 'app-contact-info',
  imports: [],
  templateUrl: './contact-info.component.html',
})
export class ContactInfoComponent {
  readonly contact = input.required<Contact>();
  readonly edit = output<void>();
}
