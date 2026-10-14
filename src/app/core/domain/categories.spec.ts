import { BUSINESS_CATEGORIES, CATEGORY_GROUPS, categoriesOfGroup, categoryMeta } from './categories';

describe('categories', () => {
  it('los valores son únicos', () => {
    const values = BUSINESS_CATEGORIES.map(c => c.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it('los rubros históricos siguen existiendo (empresas ya registradas)', () => {
    for (const v of ['salon', 'barberia', 'spa', 'peluqueria']) {
      expect(categoryMeta(v).value).toBe(v);
    }
  });

  it('todo rubro pertenece a un grupo existente y todo grupo tiene rubros', () => {
    const groups = new Set(CATEGORY_GROUPS.map(g => g.key));
    expect(BUSINESS_CATEGORIES.every(c => groups.has(c.group))).toBe(true);
    expect(CATEGORY_GROUPS.every(g => categoriesOfGroup(g.key).length > 0)).toBe(true);
  });

  it('valores desconocidos o vacíos caen en "Otro"', () => {
    expect(categoryMeta('inexistente').value).toBe('otro');
    expect(categoryMeta(undefined).value).toBe('otro');
  });
});
