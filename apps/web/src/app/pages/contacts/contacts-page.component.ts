import { Component, inject, signal } from '@angular/core';
import { ContactsService } from '../../shared/services/contacts.service';
import { ToastService } from '../../shared/services/toast.service';
import { Contact } from '../../shared/models/contact.model';
import { ContactSearchComponent } from './components/contact-search/contact-search.component';
import { ContactTableComponent } from './components/contact-table/contact-table.component';
import { ContactFormModalComponent } from './components/contact-form-modal/contact-form-modal.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-contacts-page',
  imports: [
    ContactSearchComponent,
    ContactTableComponent,
    ContactFormModalComponent,
    PaginationComponent,
    ConfirmModalComponent,
    SkeletonLoaderComponent,
  ],
  templateUrl: './contacts-page.component.html',
})
export class ContactsPageComponent {
  private readonly contactsService = inject(ContactsService);
  private readonly toastService = inject(ToastService);

  readonly contacts = signal<Contact[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly total = signal(0);
  readonly searchQuery = signal('');
  readonly formLoading = signal(false);

  readonly showForm = signal(false);
  readonly editingContact = signal<Contact | null>(null);

  readonly showDeleteConfirm = signal(false);
  readonly deletingContact = signal<Contact | null>(null);

  constructor() {
    this.loadContacts();
  }

  loadContacts(): void {
    this.loading.set(true);
    this.error.set(null);
    this.contactsService.getAll({
      page: this.page(),
      limit: 10,
      q: this.searchQuery() || undefined,
    }).subscribe({
      next: (result) => {
        this.contacts.set(result.data);
        this.total.set(result.total);
        this.totalPages.set(result.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Error al cargar contactos');
        this.loading.set(false);
      },
    });
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.page.set(1);
    this.loadContacts();
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadContacts();
  }

  openCreateForm(): void {
    this.editingContact.set(null);
    this.showForm.set(true);
  }

  openEditForm(contact: Contact): void {
    this.editingContact.set(contact);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingContact.set(null);
  }

  onSave(data: Partial<Contact>): void {
    this.formLoading.set(true);
    const contact = this.editingContact();

    if (contact) {
      this.contactsService.update(contact.id, data).subscribe({
        next: () => {
          this.toastService.success('Contacto actualizado correctamente');
          this.formLoading.set(false);
          this.closeForm();
          this.loadContacts();
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Error al actualizar contacto');
          this.formLoading.set(false);
        },
      });
    } else {
      this.contactsService.create(data).subscribe({
        next: () => {
          this.toastService.success('Contacto creado correctamente');
          this.formLoading.set(false);
          this.closeForm();
          this.loadContacts();
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Error al crear contacto');
          this.formLoading.set(false);
        },
      });
    }
  }

  confirmDelete(contact: Contact): void {
    this.deletingContact.set(contact);
    this.showDeleteConfirm.set(true);
  }

  onDelete(): void {
    const contact = this.deletingContact();
    if (!contact) return;

    this.formLoading.set(true);
    this.contactsService.delete(contact.id).subscribe({
      next: () => {
        this.toastService.success('Contacto eliminado correctamente');
        this.formLoading.set(false);
        this.showDeleteConfirm.set(false);
        this.deletingContact.set(null);
        this.loadContacts();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Error al eliminar contacto');
        this.formLoading.set(false);
      },
    });
  }
}
