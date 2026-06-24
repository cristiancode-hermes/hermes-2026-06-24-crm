import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ContactsService } from '../../shared/services/contacts.service';
import { DealsService } from '../../shared/services/deals.service';
import { ActivitiesService } from '../../shared/services/activities.service';
import { ToastService } from '../../shared/services/toast.service';
import { Contact } from '../../shared/models/contact.model';
import { Deal } from '../../shared/models/deal.model';
import { Activity } from '../../shared/models/activity.model';
import { ContactInfoComponent } from './components/contact-info/contact-info.component';
import { DealsListComponent } from './components/deals-list/deals-list.component';
import { ActivityTimelineComponent } from './components/activity-timeline/activity-timeline.component';
import { ActivityFormModalComponent } from './components/activity-form-modal/activity-form-modal.component';
import { ContactFormModalComponent } from '../contacts/components/contact-form-modal/contact-form-modal.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-contact-detail-page',
  imports: [
    RouterLink,
    ContactInfoComponent,
    DealsListComponent,
    ActivityTimelineComponent,
    ActivityFormModalComponent,
    ContactFormModalComponent,
    SkeletonLoaderComponent,
  ],
  templateUrl: './contact-detail-page.component.html',
})
export class ContactDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly contactsService = inject(ContactsService);
  private readonly dealsService = inject(DealsService);
  private readonly activitiesService = inject(ActivitiesService);
  private readonly toastService = inject(ToastService);

  readonly contact = signal<Contact | null>(null);
  readonly deals = signal<Deal[]>([]);
  readonly activities = signal<Activity[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly formLoading = signal(false);

  readonly showEditForm = signal(false);
  readonly showActivityForm = signal(false);

  private contactId = 0;

  constructor() {
    this.contactId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadContact();
  }

  loadContact(): void {
    this.loading.set(true);
    this.error.set(null);
    this.contactsService.getById(this.contactId).subscribe({
      next: (contact) => {
        this.contact.set(contact);
        this.deals.set(contact.deals || []);
        this.activities.set(contact.activities || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Error al cargar contacto');
        this.loading.set(false);
      },
    });
  }

  onEditContact(data: Partial<Contact>): void {
    this.formLoading.set(true);
    this.contactsService.update(this.contactId, data).subscribe({
      next: () => {
        this.toastService.success('Contacto actualizado correctamente');
        this.formLoading.set(false);
        this.showEditForm.set(false);
        this.loadContact();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Error al actualizar contacto');
        this.formLoading.set(false);
      },
    });
  }

  onNewDeal(): void {
    window.open(`/pipeline?contactId=${this.contactId}`, '_self');
  }

  onNewActivity(data: { type: string; description: string; date: string }): void {
    this.formLoading.set(true);
    this.activitiesService.create({
      type: data.type as Activity['type'],
      description: data.description,
      date: new Date(data.date),
      contactId: this.contactId,
    }).subscribe({
      next: () => {
        this.toastService.success('Actividad registrada correctamente');
        this.formLoading.set(false);
        this.showActivityForm.set(false);
        this.loadContact();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Error al registrar actividad');
        this.formLoading.set(false);
      },
    });
  }
}
