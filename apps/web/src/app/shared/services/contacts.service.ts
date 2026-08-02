import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contact } from '../models/contact.model';
import { PaginatedResult } from '../models/paginated-result.model';

@Injectable({
  providedIn: 'root',
})
export class ContactsService {
  private readonly apiUrl = '/api/contacts';
  private readonly http = inject(HttpClient);

  getAll(params?: {
    page?: number;
    limit?: number;
    q?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Observable<PaginatedResult<Contact>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page);
      if (params.limit) httpParams = httpParams.set('limit', params.limit);
      if (params.q) httpParams = httpParams.set('q', params.q);
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
    }
    return this.http.get<PaginatedResult<Contact>>(this.apiUrl, { params: httpParams });
  }

  getById(id: number): Observable<Contact> {
    return this.http.get<Contact>(`${this.apiUrl}/${id}`);
  }

  create(dto: Partial<Contact>): Observable<Contact> {
    return this.http.post<Contact>(this.apiUrl, dto);
  }

  update(id: number, dto: Partial<Contact>): Observable<Contact> {
    return this.http.put<Contact>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  exportCsv(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export`, { responseType: 'blob' });
  }
}
