import { Routes } from '@angular/router';
import { clientHomeGuard } from '../../core/guards/role.guard';

export const PUBLIC_ROUTES: Routes = [
  {
    path: '',
    canActivate: [clientHomeGuard],
    loadComponent: () => import('./search/search.component').then((m) => m.SearchComponent),
  },
  {
    path: 'negocio/:id',
    loadComponent: () => import('./company-profile/company-profile.component').then((m) => m.CompanyProfileComponent),
  },
  // Legales: públicas, sin guard (se linkean desde el registro, perfiles y Configuración)
  {
    path: 'terminos',
    data: { kind: 'terms' },
    loadComponent: () => import('./legal/legal-page.component').then((m) => m.LegalPageComponent),
  },
  {
    path: 'privacidad',
    data: { kind: 'privacy' },
    loadComponent: () => import('./legal/legal-page.component').then((m) => m.LegalPageComponent),
  },
  {
    path: 'negocio/:id/resenas',
    loadComponent: () => import('./company-reviews/company-reviews.component').then((m) => m.CompanyReviewsComponent),
  },
];
