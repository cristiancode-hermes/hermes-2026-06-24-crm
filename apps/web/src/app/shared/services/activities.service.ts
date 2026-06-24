import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Activity } from '../models/activity.model';
import { PaginatedResult } from '../models/paginated-result.model';

@Injectable({
  providedIn: 'root',
})
export class ActivitiesService {
  private readonly apiUrl = 'http://localhost:3000/api/activities';
  private readonly http = inject(HttpClient);

  getAll(params?: {
    contactId?: number;
    dealId?: number;
    page?: number;
    limit?: number;
  }): Observable<PaginatedResult<Activity>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.contactId) httpParams = httpParams.set('contactId', params.contactId);
      if (params.dealId) httpParams = httpParams.set('dealId', params.dealId);
      if (params.page) httpParams = httpParams.set('page', params.page);
      if (params.limit) httpParams = httpParams.set('limit', params.limit);
    }
    return this.http.get<PaginatedResult<Activity>>(this.apiUrl, { params: httpParams });
  }

  getById(id: number): Observable<Activity> {
    return this.http.get<Activity>(`${this.apiUrl}/${id}`);
  }

  create(dto: Partial<Activity>): Observable<Activity> {
    return this.http.post<Activity>(this.apiUrl, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
