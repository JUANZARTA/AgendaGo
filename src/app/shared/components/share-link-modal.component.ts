import { Component, computed, input, output, signal } from '@angular/core';

/** Modal "Tu página pública": muestra el link de reserva del negocio y lo copia al portapapeles. */
@Component({
  selector: 'app-share-link-modal',
  standalone: true,
  template: `
    <div class="sl-overlay" (click)="closed.emit()">
      <div class="sl-modal" role="dialog" aria-modal="true" aria-labelledby="sl-title" (click)="$event.stopPropagation()">
        <button type="button" class="sl-close" title="Cerrar" aria-label="Cerrar" (click)="closed.emit()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <div class="sl-title" id="sl-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          Tu página pública
        </div>
        <p class="sl-text">Comparte este link con tus clientes para que agenden directamente, sin pasar por la búsqueda.</p>

        <div class="sl-row">
          <input #urlInput class="sl-url" [value]="url()" readonly (focus)="urlInput.select()" aria-label="Link de tu página" />
          <button type="button" class="sl-copy" [class.sl-copy--done]="copied()" (click)="copy(urlInput)">
            @if (copied()) {
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              ¡Copiado!
            } @else {
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copiar link
            }
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sl-overlay {
      position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,.45);
      display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .sl-modal {
      position: relative; width: 100%; max-width: 560px; background: white; border-radius: 18px;
      padding: 24px; box-shadow: 0 16px 48px rgba(0,0,0,.18);
      background-image: linear-gradient(135deg, var(--btn-secondary-bg) 0%, white 100%);
    }
    .sl-close {
      position: absolute; top: 14px; right: 14px; width: 32px; height: 32px; border-radius: 8px;
      border: none; background: none; color: #9ca3af; cursor: pointer;
      display: flex; align-items: center; justify-content: center; transition: background .15s, color .15s;
    }
    .sl-close:hover { background: rgba(0,0,0,.06); color: #374151; }
    .sl-title { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 15px; color: #1a1a2e; margin-bottom: 10px; }
    .sl-title svg { color: var(--purple); }
    .sl-text { font-size: 13px; color: #666; margin: 0 0 16px; padding-right: 24px; }
    .sl-row { display: flex; gap: 8px; align-items: center; }
    .sl-url {
      flex: 1; min-width: 0; background: white; border: 1.5px solid #e5e7eb; border-radius: 10px;
      padding: 10px 12px; font-size: 13px; color: #555; font-family: inherit; outline: none;
    }
    .sl-url:focus { border-color: var(--purple); }
    .sl-copy {
      flex-shrink: 0; padding: 10px 16px; border-radius: 10px; border: none; cursor: pointer;
      font-size: 13px; font-weight: 700; font-family: inherit; display: flex; align-items: center; gap: 6px;
      background: var(--gradient); color: white; transition: background .15s, color .15s;
    }
    .sl-copy--done { background: #d1fae5; color: #065f46; }
    @media (max-width: 480px) {
      .sl-row { flex-direction: column; align-items: stretch; }
      .sl-copy { justify-content: center; }
    }
  `],
})
export class ShareLinkModalComponent {
  readonly companyId = input.required<string>();
  readonly closed    = output<void>();

  readonly url    = computed(() => `${window.location.origin}/negocio/${this.companyId()}`);
  readonly copied = signal(false);

  async copy(field: HTMLInputElement): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.url());
    } catch {
      // Sin Clipboard API (http o permisos): copia desde el input seleccionado
      field.select();
      document.execCommand('copy');
    }
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2500);
  }
}
