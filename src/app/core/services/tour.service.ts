import { Injectable } from '@angular/core';
import { driver, DriveStep } from 'driver.js';

const COMPANY_KEY = 'tour-company-done';
const CLIENT_KEY  = 'tour-client-done';

@Injectable({ providedIn: 'root' })
export class TourService {

  restartCompanyTour(): void {
    localStorage.removeItem(COMPANY_KEY);
    this._launchCompanyTour();
  }

  restartClientTour(): void {
    localStorage.removeItem(CLIENT_KEY);
    this._launchClientTour();
  }

  startCompanyTour(): void {
    if (localStorage.getItem(COMPANY_KEY)) return;
    this._launchCompanyTour();
  }

  startClientTour(): void {
    if (localStorage.getItem(CLIENT_KEY)) return;
    this._launchClientTour();
  }

  private _launchCompanyTour(): void {
    const isMobile = window.innerWidth <= 768;
    const d = driver({
      showProgress:  true,
      nextBtnText:   'Siguiente →',
      prevBtnText:   '← Anterior',
      doneBtnText:   '¡Entendido!',
      progressText:  '{{current}} de {{total}}',
      overlayColor:  'rgba(0,0,0,0.5)',
      onDestroyed:   () => localStorage.setItem(COMPANY_KEY, '1'),
      steps:         this._buildCompanySteps(isMobile),
    });
    setTimeout(() => d.drive(), 400);
  }

  private _launchClientTour(): void {
    const isMobile = window.innerWidth <= 768;
    const d = driver({
      showProgress:  true,
      nextBtnText:   'Siguiente →',
      prevBtnText:   '← Anterior',
      doneBtnText:   '¡Entendido!',
      progressText:  '{{current}} de {{total}}',
      overlayColor:  'rgba(0,0,0,0.5)',
      onDestroyed:   () => localStorage.setItem(CLIENT_KEY, '1'),
      steps:         this._buildClientSteps(isMobile),
    });
    setTimeout(() => d.drive(), 400);
  }

  private _buildCompanySteps(mobile: boolean): DriveStep[] {
    if (mobile) {
      return [
        { popover: { title: '👋 Bienvenido a AgendaCo', description: 'Te mostramos los puntos clave en menos de un minuto.', side: 'over' } },
        { element: '#cnav-m-grid',    popover: { title: 'Dashboard',  description: 'Tu agenda del día y métricas del negocio.', side: 'top' } },
        { element: '#cnav-m-list',    popover: { title: 'Servicios',  description: 'Define tus servicios, duración y precio.', side: 'top' } },
        { element: '#cnav-m-clock',   popover: { title: 'Horarios',   description: 'Configura días y horas de atención.', side: 'top' } },
        { element: '#cnav-m-message', popover: { title: 'Mensajes',   description: 'Chatea directamente con tus clientes.', side: 'top' } },
        { element: '#cnav-m-more',    popover: { title: 'Más opciones', description: 'Equipo, reseñas, estadísticas y facturación.', side: 'top' } },
      ];
    }
    return [
      { popover: { title: '👋 Bienvenido a AgendaCo', description: 'Te mostramos los puntos clave en menos de un minuto.', side: 'over' } },
      { element: '#cnav-grid',        popover: { title: 'Dashboard',    description: 'Tu agenda del día, métricas y resumen del negocio.', side: 'right' } },
      { element: '#cnav-list',        popover: { title: 'Servicios',    description: 'Define tus servicios, duración y precio.', side: 'right' } },
      { element: '#cnav-clock',       popover: { title: 'Horarios',     description: 'Configura los días y horas en que atiendes.', side: 'right' } },
      { element: '#cnav-users',       popover: { title: 'Equipo',       description: 'Agrega tu staff para que los clientes elijan con quién atenderse.', side: 'right' } },
      { element: '#cnav-message',     popover: { title: 'Mensajes',     description: 'Chatea directamente con tus clientes.', side: 'right' } },
      { element: '#cnav-star',        popover: { title: 'Reseñas',      description: 'Lee y responde las opiniones de tus clientes.', side: 'right' } },
      { element: '#cnav-credit-card', popover: { title: 'Facturación',  description: 'Gestiona tu plan y revisa el historial de pagos.', side: 'right' } },
    ];
  }

  private _buildClientSteps(mobile: boolean): DriveStep[] {
    if (mobile) {
      return [
        { popover: { title: '👋 Bienvenido a AgendaCo', description: 'Reserva tus turnos en segundos. Te mostramos cómo.', side: 'over' } },
        { element: '#ctour-brand',          popover: { title: 'AgendaCo', description: 'Desde aquí siempre puedes volver al inicio y buscar nuevos negocios.', side: 'bottom' } },
        { element: '#ctour-citas-mobile',   popover: { title: 'Mis citas',  description: 'Todas tus reservas activas e historial. Puedes cancelar si necesitas.', side: 'top' } },
        { element: '#ctour-mensajes-mobile',popover: { title: 'Mensajes',   description: 'Comunicación directa con el negocio antes y después del turno.', side: 'top' } },
        { element: '#ctour-perfil-mobile',  popover: { title: 'Tu perfil',  description: 'Actualiza tus datos de contacto y preferencias.', side: 'top' } },
        { element: '#ctour-notif',          popover: { title: 'Notificaciones', description: 'Te avisamos cuando tu turno es confirmado o cancelado, y cuando el negocio te escribe.', side: 'bottom' } },
      ];
    }
    return [
      { popover: { title: '👋 Bienvenido a AgendaCo', description: 'Reserva tus turnos en segundos. Te mostramos cómo.', side: 'over' } },
      { element: '#ctour-brand',           popover: { title: 'AgendaCo',  description: 'Desde aquí siempre puedes volver al inicio y buscar nuevos negocios.', side: 'bottom' } },
      { element: '#ctour-search-desktop',  popover: { title: 'Buscar',     description: 'Encuentra negocios con turnos: belleza, salud, bienestar y más. Puedes buscar por nombre o rubro.', side: 'bottom' } },
      { element: '#ctour-citas-desktop',   popover: { title: 'Mis citas',  description: 'Todas tus reservas activas e historial. Puedes cancelar si necesitas.', side: 'bottom' } },
      { element: '#ctour-mensajes-desktop',popover: { title: 'Mensajes',   description: 'Comunicación directa con el negocio antes y después del turno.', side: 'bottom' } },
      { element: '#ctour-notif',           popover: { title: 'Notificaciones', description: 'Te avisamos cuando tu turno es confirmado o cancelado, y cuando el negocio te escribe.', side: 'bottom' } },
      { element: '#ctour-avatar',          popover: { title: 'Tu perfil',  description: 'Actualiza tus datos de contacto y preferencias.', side: 'bottom' } },
    ];
  }
}
