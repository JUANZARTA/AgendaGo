import { Component, computed, input, model, output } from '@angular/core';
import { CATEGORY_GROUPS, CategoryGroupKey, categoriesOfGroup } from '../../../../core/domain/categories';
import { OB_SHARED_STYLES } from '../onboarding.styles';

@Component({
  selector: 'app-onboarding-category-step',
  standalone: true,
  styles: [OB_SHARED_STYLES, `
    :host { display: block; }
    .cat-groups { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
    .cat-group {
      border: 1.5px solid #f0e8ff; background: white; color: #555; border-radius: 99px;
      padding: 7px 14px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
      transition: background .15s, color .15s, border-color .15s;
    }
    .cat-group:hover { border-color: var(--purple); color: var(--purple); }
    .cat-group.active { background: var(--gradient); color: white; border-color: transparent; }
    .cat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .cat-card {
      border: 2px solid #f0e8ff; border-radius: 16px; padding: 20px 16px;
      cursor: pointer; background: white; text-align: left;
      transition: border-color .18s, background .18s, transform .18s, box-shadow .18s;
      width: 100%; display: flex; flex-direction: column; gap: 8px;
    }
    .cat-card:hover { border-color: var(--purple); background: var(--btn-secondary-bg); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(var(--primary-rgb),.12); }
    .cat-card.selected { background: var(--btn-secondary-bg); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(var(--primary-rgb),.18); }
    .cat-icon-wrap { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .cat-label { font-weight: 700; font-size: 14px; color: #1a1a2e; }
    .cat-desc  { font-size: 12px; color: #888; line-height: 1.4; }
    @media (max-width: 500px) {
      .cat-grid { grid-template-columns: 1fr; }
    }
  `],
  template: `
        <div class="anim">
          <div class="ob-step-label">Paso 1 de 4 — Tipo de negocio</div>
          <h1 class="ob-title">¿Qué tipo de negocio tienes?</h1>
          <p class="ob-subtitle">Elige la categoría que mejor te describe</p>

          <div class="cat-groups">
            @for (g of categoryGroups; track g.key) {
              <button type="button" class="cat-group" [class.active]="catGroup() === g.key" (click)="catGroup.set(g.key)">
                {{ g.label }}
              </button>
            }
          </div>

          <div class="cat-grid">
            @for (cat of visibleCats(); track cat.value) {
              <button class="cat-card" [class.selected]="selectedCat() === cat.value"
                      [style.borderColor]="selectedCat() === cat.value ? cat.color : ''"
                      (click)="picked.emit(cat.value)">
                <div class="cat-icon-wrap"
                     [style.background]="cat.color + '18'"
                     [style.color]="cat.color">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path [attr.d]="cat.icon"/>
                  </svg>
                </div>
                <div class="cat-label">{{ cat.label }}</div>
                <div class="cat-desc">{{ cat.desc }}</div>
              </button>
            }
          </div>
        </div>
  `,
})
export class OnboardingCategoryStepComponent {
  readonly categoryGroups = CATEGORY_GROUPS;
  readonly catGroup = model<CategoryGroupKey>('belleza');
  readonly selectedCat = input<string>('');
  readonly picked = output<string>();

  readonly visibleCats = computed(() => categoriesOfGroup(this.catGroup()));
}
