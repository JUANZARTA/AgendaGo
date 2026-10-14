import { instagramUrl, isWompiCheckoutUrl, safeInternalPath } from './safe-links';

describe('safeInternalPath', () => {
  it('acepta rutas internas', () => {
    expect(safeInternalPath('/admin/facturacion')).toBe('/admin/facturacion');
    expect(safeInternalPath('/empresa/soporte?hilo=abc')).toBe('/empresa/soporte?hilo=abc');
  });

  it('rechaza externos, protocol-relative y esquemas', () => {
    for (const bad of ['https://evil.com', '//evil.com', '/\\evil.com', 'javascript:alert(1)', 'admin', '', null, '/\nx']) {
      expect(safeInternalPath(bad as string)).toBeNull();
    }
  });
});

describe('isWompiCheckoutUrl', () => {
  it('sólo checkout.wompi.co por https', () => {
    expect(isWompiCheckoutUrl('https://checkout.wompi.co/l/p5GJth')).toBe(true);
    expect(isWompiCheckoutUrl('https://checkout.wompi.co.evil.com/l/x')).toBe(false);
    expect(isWompiCheckoutUrl('https://checkout.wompi.co@evil.com/l/x')).toBe(false);
    expect(isWompiCheckoutUrl('http://checkout.wompi.co/l/x')).toBe(false);
    expect(isWompiCheckoutUrl('https://evil.com/?https://checkout.wompi.co/')).toBe(false);
    expect(isWompiCheckoutUrl('')).toBe(false);
  });
});

describe('instagramUrl', () => {
  it('normaliza @usuario, usuario y URLs de instagram', () => {
    expect(instagramUrl('@mi.barberia')).toBe('https://instagram.com/mi.barberia');
    expect(instagramUrl('mi_barberia')).toBe('https://instagram.com/mi_barberia');
    expect(instagramUrl('https://www.instagram.com/mi.barberia/')).toBe('https://instagram.com/mi.barberia');
    expect(instagramUrl('instagram.com/mi.barberia?hl=es')).toBe('https://instagram.com/mi.barberia');
  });

  it('descarta sitios ajenos y basura', () => {
    expect(instagramUrl('https://evil.com/phishing')).toBeNull();
    expect(instagramUrl('javascript:alert(1)')).toBeNull();
    expect(instagramUrl('https://instagram.com.evil.com/x')).toBeNull();
    expect(instagramUrl('')).toBeNull();
  });
});
