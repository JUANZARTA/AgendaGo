export interface PendingStaff { name: string; phone: string; photoURL?: string }
export interface SocialState { enabled: boolean; handle: string }
export interface OnboardingForm { name: string; description: string; city: string; address: string; phone: string }
export interface StepNavigation { to: number; prev?: number }

export const DEFAULT_SCHEDULE = [
  { key: 'lun', label: 'Lunes',     enabled: true,  ranges: [{ open: '08:00', close: '18:00' }] },
  { key: 'mar', label: 'Martes',    enabled: true,  ranges: [{ open: '08:00', close: '18:00' }] },
  { key: 'mie', label: 'Miércoles', enabled: true,  ranges: [{ open: '08:00', close: '18:00' }] },
  { key: 'jue', label: 'Jueves',    enabled: true,  ranges: [{ open: '08:00', close: '18:00' }] },
  { key: 'vie', label: 'Viernes',   enabled: true,  ranges: [{ open: '08:00', close: '18:00' }] },
  { key: 'sab', label: 'Sábado',    enabled: true,  ranges: [{ open: '09:00', close: '16:00' }] },
  { key: 'dom', label: 'Domingo',   enabled: false, ranges: [{ open: '09:00', close: '14:00' }] },
];

export const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', color: '#E1306C', placeholder: '@tu_usuario',      letter: 'IG' },
  { key: 'facebook',  label: 'Facebook',  color: '#1877F2', placeholder: 'tu-pagina',        letter: 'FB' },
  { key: 'tiktok',    label: 'TikTok',    color: '#111111', placeholder: '@tu_usuario',      letter: 'TT' },
  { key: 'youtube',   label: 'YouTube',   color: '#FF0000', placeholder: 'URL del canal',    letter: 'YT' },
];

export const SLOT_OPTIONS = [
  { value: 15, label: '15 minutos' },
  { value: 20, label: '20 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '60 minutos (1 hora)' },
];
