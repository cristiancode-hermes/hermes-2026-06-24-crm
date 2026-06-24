import { Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact-search',
  imports: [FormsModule],
  templateUrl: './contact-search.component.html',
})
export class ContactSearchComponent {
  readonly searchQuery = signal('');
  readonly searchChange = output<string>();
  readonly createNew = output<void>();

  onSearch(value: string): void {
    this.searchQuery.set(value);
    this.searchChange.emit(value);
  }
}
