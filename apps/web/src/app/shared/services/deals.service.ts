import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Deal, DealStatusUpdate } from '../models/deal.model';

@Injectable({
  providedIn: 'root',
})
export class DealsService {
  private readonly apiUrl = '/api/deals';
  private readonly http = inject(HttpClient);

  getAll(params?: { stage?: string; contactId?: number }): Observable<Deal[]> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.stage) httpParams = httpParams.set('stage', params.stage);
      if (params.contactId) httpParams = httpParams.set('contactId', params.contactId);
    }
    return this.http.get<Deal[]>(this.apiUrl, { params: httpParams });
  }

  getById(id: number): Observable<Deal> {
    return this.http.get<Deal>(`${this.apiUrl}/${id}`);
  }

  create(dto: Partial<Deal>): Observable<Deal> {
    return this.http.post<Deal>(this.apiUrl, dto);
  }

  update(id: number, dto: Partial<Deal>): Observable<Deal> {
    return this.http.put<Deal>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateStatus(id: number, dto: DealStatusUpdate): Observable<Deal> {
    return this.http.patch<Deal>(`${this.apiUrl}/${id}/status`, dto);
  }

  getKpi(): Observable<{ totalDeals: number; pipelineValue: number; wonValue: number; conversionRate: number; stageValues: { stage: string; value: number; count: number }[] }> {
    return this.http.get<{ totalDeals: number; pipelineValue: number; wonValue: number; conversionRate: number; stageValues: { stage: string; value: number; count: number }[] }>(`${this.apiUrl}/kpi`);
  }

  getUpcoming(): Observable<Deal[]> {
    return this.http.get<Deal[]>(`${this.apiUrl}/upcoming`);
  }
}
