import { categoryMeta } from './categories';
import { companyLogo, PRESET_LOGO_ICONS } from './company-logo';

const star = PRESET_LOGO_ICONS.find(i => i.key === 'star')!.path;

describe('companyLogo', () => {
  it('prioriza la imagen subida', () => {
    const l = companyLogo({ category: 'spa', logoUrl: 'https://x/logo.png', logoIcon: 'star', logoColor: '#f43f5e' });
    expect(l.url).toBe('https://x/logo.png');
  });

  it('sin imagen usa el ícono y color elegidos por el negocio', () => {
    const l = companyLogo({ category: 'barberia', logoIcon: 'star', logoColor: '#10b981' });
    expect(l).toEqual({ url: null, iconPath: star, color: '#10b981' });
  });

  it('ícono elegido sin color: usa el color del rubro', () => {
    const l = companyLogo({ category: 'spa', logoIcon: 'star' });
    expect(l.iconPath).toBe(star);
    expect(l.color).toBe(categoryMeta('spa').color);
  });

  it('sin nada elegido (o ícono desconocido) cae al ícono del rubro', () => {
    const cat = categoryMeta('spa');
    expect(companyLogo({ category: 'spa' })).toEqual({ url: null, iconPath: cat.icon, color: cat.color });
    expect(companyLogo({ category: 'spa', logoIcon: 'nope', logoColor: '#000000' }).iconPath).toBe(cat.icon);
  });
});
