export interface ChangelogEntry {
  version: string;
  fecha: string;
  cambios: string[];
}

/** Notas de versión de AgendaCo, de la más nueva a la más vieja. Solo cambios notorios para el usuario. */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2.2.0',
    fecha: '14/10/2026',
    cambios: [
      'La app ahora se llama AgendaCo.',
      'Avisos de vencimiento del plan, 5 días de gracia y confirmación al renovar.',
      'Términos y condiciones y Política de privacidad, con aceptación al registrarse.',
      'Al cancelar una cita se puede indicar el motivo, y se ve en la cita.',
      'Anuncios generales del equipo de AgendaCo en el panel de la empresa.',
      'Perfil de la empresa más amplio, en dos columnas.',
    ],
  },
  {
    version: '2.1.0',
    fecha: '14/10/2026',
    cambios: [
      'Punto de novedades en el Dashboard, Mis citas y Mensajes, para ver qué hay nuevo.',
      'Arreglo: la capacidad de un turno ahora se calcula según los profesionales asignados al servicio.',
    ],
  },
  {
    version: '2.0.0',
    fecha: '12/10/2026',
    cambios: [
      'Suscripciones y planes con período de prueba y vencimientos automáticos.',
      'Citas privadas: mayor seguridad en los datos de cada reserva.',
      'Disponibilidad real del staff al validar horarios de citas.',
      'La foto del cliente ahora se ve en el detalle de la cita, desde el Dashboard.',
    ],
  },
  {
    version: '1.2.0',
    fecha: '27/07/2026',
    cambios: [
      'La app se renombra de "Agenda Co" a "AgendaZco".',
      'Período de prueba automático al registrar una empresa, ahora de 2 meses.',
      'Acceso directo desde el Dashboard a la fecha de una cita.',
      'Mejoras en la animación de inicio de sesión y en el buscador.',
    ],
  },
  {
    version: '1.1.0',
    fecha: '28/05/2026',
    cambios: [
      'Panel de administrador: gestión de empresas, empleados, cuentas y facturación.',
      'Notificaciones y mensajes de chat entre cliente y empresa.',
      'App instalable (PWA) en Android y iPhone.',
      'Tour guiado para conocer la app.',
    ],
  },
  {
    version: '1.0.0',
    fecha: '16/05/2026',
    cambios: [
      'Primera versión de AgendaCo: cuentas de cliente y empresa, cada una con su propia vista.',
      'Sistema de citas: reservá turnos con empresas desde la vista de cliente.',
      'Buscador de empresas y reseñas de clientes.',
    ],
  },
];
