import { Component, computed, inject, input } from '@angular/core';
import { AppConfigService } from '../../core/services/app-config.service';
import { mailtoLink, whatsappLink } from '../../core/domain/app-config';

/**
 * Contacto de soporte configurado por el admin (config/app.support): WhatsApp y/o email.
 * Si no hay ninguno configurado no muestra NADA.
 */
@Component({
  selector: 'app-support-contact',
  standalone: true,
  styles: [`
    :host { display: contents; }
    .sc { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 6px 10px; font-size: 13px; color: #666; }
    .sc--left { justify-content: flex-start; }
    .lnk {
      display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 999px;
      font-size: 12px; font-weight: 700; text-decoration: none; white-space: nowrap;
    }
    .lnk--wa   { background: #dcfce7; color: #15803d; }
    .lnk--mail { background: #ede9fe; color: #6d28d9; }
  `],
  template: `
    @if (wa() || mail()) {
      <div class="sc" [class.sc--left]="align() === 'left'">
        @if (text()) { <span>{{ text() }}</span> }
        @if (wa(); as href) {
          <a class="lnk lnk--wa" [href]="href" target="_blank" rel="noopener">WhatsApp</a>
        }
        @if (mail(); as href) {
          <a class="lnk lnk--mail" [href]="href">{{ email() }}</a>
        }
      </div>
    }
  `,
})
export class SupportContactComponent {
  private appConfig = inject(AppConfigService);

  /** Texto antes de los links (ej. "¿Dudas? Escribinos:"). */
  readonly text  = input('¿Necesitás ayuda? Escribinos:');
  readonly align = input<'center' | 'left'>('center');

  readonly email = computed(() => this.appConfig.config().support.email.trim());
  readonly wa    = computed(() => whatsappLink(this.appConfig.config().support.whatsapp));
  readonly mail  = computed(() => mailtoLink(this.email()));
}
