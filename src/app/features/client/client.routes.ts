import { Routes } from '@angular/router';

export const CLIENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./client-shell.component').then(m => m.ClientShellComponent),
    children: [
      { path: '', redirectTo: 'citas', pathMatch: 'full' },
      {
        path: 'citas',
        loadComponent: () => import('./appointments/appointments.component').then(m => m.AppointmentsComponent),
      },
      {
        path: 'perfil',
        loadComponent: () => import('./profile/client-profile.component').then(m => m.ClientProfileComponent),
      },
    ],
  },
];
