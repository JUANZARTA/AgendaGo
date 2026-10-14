/**
 * Catálogo ÚNICO de rubros. Onboarding, perfil de la empresa, buscador, perfil público y admin
 * leen de acá: sumar un rubro es agregar una línea.
 * `icon` es el atributo `d` de un único <path> (viewBox 0 0 24 24, trazo, estilo Feather).
 */

export type CategoryGroupKey = 'belleza' | 'salud' | 'bienestar' | 'mascotas' | 'profesionales' | 'otros';

export interface CategoryGroup {
  key: CategoryGroupKey;
  label: string;
}

export interface BusinessCategory {
  value: string;
  label: string;
  /** Plural para los filtros del buscador. */
  plural: string;
  desc: string;
  group: CategoryGroupKey;
  color: string;
  icon: string;
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  { key: 'belleza',       label: 'Belleza' },
  { key: 'salud',         label: 'Salud' },
  { key: 'bienestar',     label: 'Bienestar' },
  { key: 'mascotas',      label: 'Mascotas' },
  { key: 'profesionales', label: 'Profesionales' },
  { key: 'otros',         label: 'Otros' },
];

const ICON = {
  scissors:   'M6 3v12M6 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 6a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9v12M18 3L6 15',
  heart:      'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
  leaf:       'M17 8C8 10 5.9 16.17 3.82 19c0 0 3-1 6-4 0 0-1.5 5 5 5 5 0 8-4 8-8 0-3-1-5-3-5-1 0-2 1-2 2z',
  star:       'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z',
  eye:        'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  pen:        'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z',
  droplet:    'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z',
  smile:      'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01',
  wind:       'M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2',
  sun:        'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42',
  tooth:      'M7 3C4.5 3 3 5 3 7.5c0 3 1.5 4.5 2 7.5.5 3 1 6 2.5 6s1.5-4 2.5-6c.5-1 1.5-1 2 0 1 2 1 6 2.5 6s2-3 2.5-6c.5-3 2-4.5 2-7.5C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3z',
  chat:       'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z',
  pie:        'M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z',
  pulse:      'M22 12h-4l-3 9L9 3l-3 9H2',
  glasses:    'M2 14a4 4 0 1 0 8 0 4 4 0 0 0-8 0zM14 14a4 4 0 1 0 8 0 4 4 0 0 0-8 0zM10 14h4M2 14l2-7M22 14l-2-7',
  foot:       'M8 3C6 3 5 6 5 9s1 5 1 7a3 3 0 0 0 6 0c0-2-1-4-1-6 0-3-1-7-3-7zM16 7c-2 0-3 3-3 5s1 3 1 5a2.5 2.5 0 0 0 5 0c0-2-1-3-1-5s0-5-2-5z',
  medical:    'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM12 8v8M8 12h8',
  dumbbell:   'M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12',
  person:     'M12 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM4 13l8-2 8 2M12 11v5l-4 6M12 16l4 6',
  crosshair:  'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM22 12h-4M6 12H2M12 6V2M12 22v-4',
  spine:      'M12 2v20M8 5h8M7 9h10M8 13h8M7 17h10',
  paw:        'M5 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM9.5 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM14.5 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM19 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 11c-3 0-6 4-6 7a3 3 0 0 0 3 3c1.2 0 2-.5 3-.5s1.8.5 3 .5a3 3 0 0 0 3-3c0-3-3-7-6-7z',
  scale:      'M12 3v18M5 21h14M3 7h18M6 7l-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0z',
  calculator: 'M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM8 6h8v4H8zM8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01',
  briefcase:  'M4 7h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16',
  target:     'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  book:       'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
  penTool:    'M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.586 7.586M11 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  car:        'M5 17h14M5 17a2 2 0 1 0 4 0M15 17a2 2 0 1 0 4 0M3 17v-5l2-5h14l2 5v5M3 12h18',
  wrench:     'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
  camera:     'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  grid:       'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
};

export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  // Belleza
  { value: 'barberia',          label: 'Barbería',            plural: 'Barberías',           group: 'belleza',       color: '#7c3aed', icon: ICON.scissors,   desc: 'Cortes, barba y servicios masculinos' },
  { value: 'salon',             label: 'Salón de belleza',    plural: 'Salones',             group: 'belleza',       color: '#f43f5e', icon: ICON.heart,      desc: 'Cabello, uñas, maquillaje y más' },
  { value: 'peluqueria',        label: 'Peluquería',          plural: 'Peluquerías',         group: 'belleza',       color: '#f59e0b', icon: ICON.scissors,   desc: 'Cortes y peinados para todos' },
  { value: 'spa',               label: 'Spa / Estética',      plural: 'Spas',                group: 'belleza',       color: '#10b981', icon: ICON.leaf,       desc: 'Masajes, faciales y relajación' },
  { value: 'unas',              label: 'Uñas y manicura',     plural: 'Uñas',                group: 'belleza',       color: '#ec4899', icon: ICON.star,       desc: 'Manicura, pedicura y nail art' },
  { value: 'cejas',             label: 'Cejas y pestañas',    plural: 'Cejas y pestañas',    group: 'belleza',       color: '#a855f7', icon: ICON.eye,        desc: 'Diseño de cejas, lifting y extensiones' },
  { value: 'maquillaje',        label: 'Maquillaje',          plural: 'Maquillaje',          group: 'belleza',       color: '#e11d48', icon: ICON.pen,        desc: 'Maquillaje social y para eventos' },
  { value: 'depilacion',        label: 'Depilación',          plural: 'Depilación',          group: 'belleza',       color: '#0ea5e9', icon: ICON.droplet,    desc: 'Cera, láser y descartable' },
  { value: 'estetica',          label: 'Estética facial',     plural: 'Estética facial',     group: 'belleza',       color: '#14b8a6', icon: ICON.smile,      desc: 'Limpiezas, peelings y tratamientos' },
  { value: 'masajes',           label: 'Masajes',             plural: 'Masajes',             group: 'belleza',       color: '#059669', icon: ICON.wind,       desc: 'Relajantes, descontracturantes y más' },
  { value: 'bronceado',         label: 'Bronceado',           plural: 'Bronceado',           group: 'belleza',       color: '#ea580c', icon: ICON.sun,        desc: 'Cámara solar y bronceado en spray' },
  // Salud
  { value: 'odontologia',       label: 'Odontología',         plural: 'Odontología',         group: 'salud',         color: '#0284c7', icon: ICON.tooth,      desc: 'Consultas, limpiezas y tratamientos' },
  { value: 'psicologia',        label: 'Psicología',          plural: 'Psicología',          group: 'salud',         color: '#6366f1', icon: ICON.chat,       desc: 'Terapia individual, pareja y familia' },
  { value: 'nutricion',         label: 'Nutrición',           plural: 'Nutrición',           group: 'salud',         color: '#65a30d', icon: ICON.pie,        desc: 'Planes de alimentación y controles' },
  { value: 'fisioterapia',      label: 'Fisioterapia',        plural: 'Fisioterapia',        group: 'salud',         color: '#0d9488', icon: ICON.pulse,      desc: 'Kinesiología y rehabilitación' },
  { value: 'optometria',        label: 'Optometría',          plural: 'Optometría',          group: 'salud',         color: '#2563eb', icon: ICON.glasses,    desc: 'Exámenes visuales y lentes' },
  { value: 'podologia',         label: 'Podología',           plural: 'Podología',           group: 'salud',         color: '#b45309', icon: ICON.foot,       desc: 'Cuidado y tratamiento de los pies' },
  { value: 'medicina',          label: 'Consultorio médico',  plural: 'Consultorios',        group: 'salud',         color: '#dc2626', icon: ICON.medical,    desc: 'Medicina general y especialidades' },
  // Bienestar
  { value: 'entrenador',        label: 'Entrenador personal', plural: 'Entrenadores',        group: 'bienestar',     color: '#f97316', icon: ICON.dumbbell,   desc: 'Entrenamiento uno a uno' },
  { value: 'yoga',              label: 'Yoga y pilates',      plural: 'Yoga y pilates',      group: 'bienestar',     color: '#8b5cf6', icon: ICON.person,     desc: 'Sesiones individuales' },
  { value: 'acupuntura',        label: 'Acupuntura',          plural: 'Acupuntura',          group: 'bienestar',     color: '#16a34a', icon: ICON.crosshair,  desc: 'Medicina tradicional china' },
  { value: 'quiropractica',     label: 'Quiropráctica',       plural: 'Quiropráctica',       group: 'bienestar',     color: '#0891b2', icon: ICON.spine,      desc: 'Ajustes y salud de la columna' },
  // Mascotas
  { value: 'veterinaria',       label: 'Veterinaria',         plural: 'Veterinarias',        group: 'mascotas',      color: '#ca8a04', icon: ICON.paw,        desc: 'Consultas, vacunas y controles' },
  { value: 'peluqueria_canina', label: 'Peluquería canina',   plural: 'Peluquería canina',   group: 'mascotas',      color: '#d97706', icon: ICON.paw,        desc: 'Baño, corte y estética para mascotas' },
  // Profesionales
  { value: 'abogados',          label: 'Abogados',            plural: 'Abogados',            group: 'profesionales', color: '#475569', icon: ICON.scale,      desc: 'Consultas y asesoría legal' },
  { value: 'contadores',        label: 'Contadores',          plural: 'Contadores',          group: 'profesionales', color: '#334155', icon: ICON.calculator, desc: 'Impuestos, contabilidad y trámites' },
  { value: 'asesorias',         label: 'Asesorías',           plural: 'Asesorías',           group: 'profesionales', color: '#1e40af', icon: ICON.briefcase,  desc: 'Consultoría y asesoría profesional' },
  { value: 'coaching',          label: 'Coaching',            plural: 'Coaching',            group: 'profesionales', color: '#9333ea', icon: ICON.target,     desc: 'Coaching personal y profesional' },
  { value: 'clases',            label: 'Clases particulares', plural: 'Clases',              group: 'profesionales', color: '#0369a1', icon: ICON.book,       desc: 'Idiomas, música, tutorías y más' },
  // Otros
  { value: 'tatuajes',          label: 'Tatuajes y piercing', plural: 'Tatuajes',            group: 'otros',         color: '#18181b', icon: ICON.penTool,    desc: 'Tatuajes, piercing y diseño' },
  { value: 'lavadero',          label: 'Lavadero de autos',   plural: 'Lavaderos',           group: 'otros',         color: '#0284c7', icon: ICON.car,        desc: 'Lavado, encerado y detailing' },
  { value: 'taller',            label: 'Taller mecánico',     plural: 'Talleres',            group: 'otros',         color: '#57534e', icon: ICON.wrench,     desc: 'Revisiones, aceite y mantenimiento' },
  { value: 'fotografia',        label: 'Fotografía',          plural: 'Fotografía',          group: 'otros',         color: '#be185d', icon: ICON.camera,     desc: 'Sesiones de fotos y estudio' },
  { value: 'otro',              label: 'Otro',                plural: 'Otros',               group: 'otros',         color: '#6b7280', icon: ICON.grid,       desc: 'Otro tipo de negocio con turnos' },
];

const BY_VALUE = new Map(BUSINESS_CATEGORIES.map(c => [c.value, c]));
const FALLBACK = BY_VALUE.get('otro')!;

/** Metadatos del rubro; valores desconocidos (o vacíos) caen en "Otro". */
export function categoryMeta(value: string | null | undefined): BusinessCategory {
  return (value && BY_VALUE.get(value)) || FALLBACK;
}

export function categoriesOfGroup(group: CategoryGroupKey): BusinessCategory[] {
  return BUSINESS_CATEGORIES.filter(c => c.group === group);
}
