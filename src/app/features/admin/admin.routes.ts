import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-shell.component').then((m) => m.AdminShellComponent),
    children: [
      { path: '', redirectTo: 'metricas', pathMatch: 'full' },
      {
        path: 'metricas',
        loadComponent: () => import('./metrics/metrics.component').then((m) => m.MetricsComponent),
      },
      {
        path: 'empresas',
        loadComponent: () => import('./companies/companies.component').then((m) => m.CompaniesComponent),
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'facturacion',
        loadComponent: () => import('./billing/billing.component').then((m) => m.AdminBillingComponent),
      },
    ],
  },
];
