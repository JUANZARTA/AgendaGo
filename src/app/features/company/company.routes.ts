import { Routes } from '@angular/router';

export const COMPANY_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'perfil',
    loadComponent: () => import('./profile/company-profile.component').then((m) => m.CompanyProfileComponent),
  },
  {
    path: 'servicios',
    loadComponent: () => import('./services/services.component').then((m) => m.ServicesComponent),
  },
  {
    path: 'horarios',
    loadComponent: () => import('./schedule/schedule.component').then((m) => m.ScheduleComponent),
  },
];
