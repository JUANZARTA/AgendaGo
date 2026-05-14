import { Routes } from '@angular/router';

export const PUBLIC_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./search/search.component').then((m) => m.SearchComponent),
  },
  {
    path: 'negocio/:id',
    loadComponent: () => import('./company-profile/company-profile.component').then((m) => m.CompanyProfileComponent),
  },
];
