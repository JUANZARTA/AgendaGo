import { categoryMeta } from './categories';

/**
 * Logo de un negocio: imagen subida, ícono preset + color elegidos en el perfil, o (si no eligió
 * nada) el ícono y color del rubro. Fuente única para buscador, "Mis negocios" y página pública.
 * `path` es el atributo `d` de un único <path> (viewBox 0 0 24 24, trazo, estilo Feather).
 */
export interface LogoIconOption {
  key: string;
  label: string;
  path: string;
}

export const PRESET_LOGO_ICONS: LogoIconOption[] = [
  { key: 'scissors', label: 'Tijeras',    path: 'M6 3v12M6 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 6a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9v12M18 3L6 15' },
  { key: 'star',     label: 'Estrella',   path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  { key: 'leaf',     label: 'Hoja/Spa',   path: 'M17 8C8 10 5.9 16.17 3.82 19c0 0 3-1 6-4 0 0-1.5 5 5 5 5 0 8-4 8-8 0-3-1-5-3-5-1 0-2 1-2 2z' },
  { key: 'sun',      label: 'Sol',        path: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42' },
  { key: 'heart',    label: 'Corazón',    path: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' },
  { key: 'zap',      label: 'Rayo',       path: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
  { key: 'smile',    label: 'Sonrisa',    path: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01' },
  { key: 'award',    label: 'Premio',     path: 'M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.21 13.89L7 23l5-3 5 3-1.21-9.12' },
];

export interface CompanyLogoSource {
  category?: string | null;
  logoUrl?: string | null;
  logoIcon?: string | null;
  logoColor?: string | null;
}

export interface CompanyLogo {
  /** Imagen subida por el negocio (tiene prioridad). */
  url: string | null;
  /** `d` del ícono a mostrar cuando no hay imagen. */
  iconPath: string;
  /** Color del ícono/fondo. */
  color: string;
}

export function companyLogo(c: CompanyLogoSource): CompanyLogo {
  const cat    = categoryMeta(c.category);
  const preset = c.logoIcon ? PRESET_LOGO_ICONS.find(i => i.key === c.logoIcon) : undefined;
  return {
    url:      c.logoUrl || null,
    iconPath: preset?.path ?? cat.icon,
    color:    c.logoColor || cat.color,
  };
}
