import { Injectable, signal } from '@angular/core';

export type Theme = 'azul' | 'violeta' | 'dorado' | 'oceano';

export const THEMES: { id: Theme; label: string; gradient: string }[] = [
  { id: 'azul',    label: 'Azul',    gradient: 'linear-gradient(135deg,#2563eb,#6366f1)' },
  { id: 'violeta', label: 'Violeta', gradient: 'linear-gradient(135deg,#7c3aed,#f43f5e)' },
  { id: 'dorado',  label: 'Dorado',  gradient: 'linear-gradient(135deg,#d97706,#ea580c)' },
  { id: 'oceano',  label: 'Océano',  gradient: 'linear-gradient(135deg,#0891b2,#4f46e5)' },
];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly KEY = 'agenda_theme';

  current = signal<Theme>(this._load());

  init(): void {
    document.documentElement.setAttribute('data-theme', this.current());
  }

  apply(theme: Theme): void {
    this.current.set(theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.KEY, theme);
  }

  private _load(): Theme {
    return (localStorage.getItem(this.KEY) as Theme) ?? 'azul';
  }
}
