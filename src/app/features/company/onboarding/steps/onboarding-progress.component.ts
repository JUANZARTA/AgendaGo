import { Component, input } from '@angular/core';

@Component({
  selector: 'app-onboarding-progress',
  standalone: true,
  styles: [`
    :host { display: block; }
    .ob-progress { display: flex; gap: 6px; margin-bottom: 28px; }
    .ob-progress-bar { height: 4px; flex: 1; border-radius: 4px; transition: background .3s ease; }
    .ob-progress-bar.active   { background: var(--gradient); }
    .ob-progress-bar.done     { background: var(--purple); }
    .ob-progress-bar.inactive { background: #f0e8ff; }
  `],
  template: `
    <!-- Progress bars (3: tipo / datos / horarios) -->
    <div class="ob-progress">
      @for (bar of bars(); track $index) {
        <div class="ob-progress-bar" [class]="bar"></div>
      }
    </div>
  `,
})
export class OnboardingProgressComponent {
  /** Clase de cada barra: 'done' | 'active' | 'inactive' */
  readonly bars = input.required<string[]>();
}
