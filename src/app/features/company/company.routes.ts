import { Routes } from '@angular/router';

export const COMPANY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./company-shell.component').then(m => m.CompanyShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'servicios',  loadComponent: () => import('./services/services.component').then(m => m.ServicesComponent) },
      { path: 'horarios',   loadComponent: () => import('./schedule/schedule.component').then(m => m.ScheduleComponent) },
      { path: 'perfil',       loadComponent: () => import('./profile/company-profile.component').then(m => m.CompanyProfileComponent) },
      { path: 'resenas',      loadComponent: () => import('./reviews/company-reviews-dashboard.component').then(m => m.CompanyReviewsDashboardComponent) },
      { path: 'facturacion',  loadComponent: () => import('./billing/billing.component').then(m => m.BillingComponent) },
    ],
  },
];
