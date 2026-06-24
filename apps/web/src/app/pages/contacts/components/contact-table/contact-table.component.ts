import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Contact } from '../../../../shared/models/contact.model';

@Component({
  selector: 'app-contact-table',
  imports: [RouterLink],
  templateUrl: './contact-table.component.html',
})
export class ContactTableComponent {
  readonly contacts = input<Contact[]>([]);
  readonly edit = output<Contact>();
  readonly delete = output<Contact>();
}
