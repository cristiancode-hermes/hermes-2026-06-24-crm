import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard-page.component').then((m) => m.DashboardPageComponent),
  },
  {
    path: 'contacts',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/contacts/contacts-page.component').then((m) => m.ContactsPageComponent),
  },
  {
    path: 'contacts/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/contact-detail/contact-detail-page.component').then((m) => m.ContactDetailPageComponent),
  },
  {
    path: 'pipeline',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/pipeline/pipeline-page.component').then((m) => m.PipelinePageComponent),
  },
  {
    path: 'pipeline/deal/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/deal-detail/deal-detail-page.component').then((m) => m.DealDetailPageComponent),
  },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found-page.component').then((m) => m.NotFoundPageComponent),
  },
];
