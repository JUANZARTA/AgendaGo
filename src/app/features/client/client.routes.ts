import { Routes } from '@angular/router';

export const CLIENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./appointments/appointments.component').then((m) => m.AppointmentsComponent),
  },
];
