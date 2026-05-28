import { Routes } from '@angular/router';
import { subscriptionGuard } from '../../core/guards/subscription.guard';

export const COMPANY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./company-shell.component').then(m => m.CompanyShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',  canActivate: [subscriptionGuard], loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'servicios',  canActivate: [subscriptionGuard], loadComponent: () => import('./services/services.component').then(m => m.ServicesComponent) },
      { path: 'horarios',   canActivate: [subscriptionGuard], loadComponent: () => import('./schedule/schedule.component').then(m => m.ScheduleComponent) },
      { path: 'perfil',     canActivate: [subscriptionGuard], loadComponent: () => import('./profile/company-profile.component').then(m => m.CompanyProfileComponent) },
      { path: 'equipo',     canActivate: [subscriptionGuard], loadComponent: () => import('./staff/staff.component').then(m => m.StaffComponent) },
      { path: 'resenas',    canActivate: [subscriptionGuard], loadComponent: () => import('./reviews/company-reviews-dashboard.component').then(m => m.CompanyReviewsDashboardComponent) },
      { path: 'mensajes',     canActivate: [subscriptionGuard], loadComponent: () => import('./messages/messages.component').then(m => m.MessagesComponent) },
      { path: 'estadisticas', canActivate: [subscriptionGuard], loadComponent: () => import('./statistics/statistics.component').then(m => m.StatisticsComponent) },
      { path: 'facturacion', loadComponent: () => import('./billing/billing.component').then(m => m.BillingComponent) },
    ],
  },
];
