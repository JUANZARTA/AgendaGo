import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  { path: '', redirectTo: 'empresas', pathMatch: 'full' },
  {
    path: 'empresas',
    loadComponent: () => import('./companies/companies.component').then((m) => m.CompaniesComponent),
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./users/users.component').then((m) => m.UsersComponent),
  },
  {
    path: 'metricas',
    loadComponent: () => import('./metrics/metrics.component').then((m) => m.MetricsComponent),
  },
];
