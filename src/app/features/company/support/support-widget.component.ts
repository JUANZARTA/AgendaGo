import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CompanyStore } from '../../../core/services/company-store.service';
import { SupportKind, SupportService, SupportThread } from '../../../core/services/support.service';
import { SupportChatComponent } from './support-chat.component';

/**
 * Botón flotante de soporte (tipo chatbot) de la página de Facturación.
 * Abre un panel con dos opciones (Consultas / Urgente); cada una es un hilo con el admin.
 * `?soporte=consulta|urgente` en la URL lo abre directo (link de la notificación de respuesta).
 */
@Component({
  selector: 'app-support-widget',
  standalone: true,
  imports: [SupportChatComponent],
  styles: [`
    /* Abajo a la izquierda del área de contenido: a la derecha del sidebar (220px) en desktop */
    .fab {
      position: fixed; right: 24px; bottom: 24px; z-index: 900;
      width: 58px; height: 58px; border-radius: 50%; border: none; cursor: pointer;
      background: var(--gradient); color: white;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 24px rgba(37, 99, 235, .35);
      transition: transform .15s ease, box-shadow .15s ease;
    }
    .fab:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(37, 99, 235, .42); }
    .fab-dot {
      position: absolute; top: 4px; right: 4px; width: 13px; height: 13px; border-radius: 50%;
      background: #f43f5e; border: 2px solid white;
    }

    @keyframes popIn {
      from { opacity: 0; transform: translateY(12px) scale(.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    .panel {
      position: fixed; right: 24px; bottom: 96px; z-index: 901;
      width: 360px; height: 520px; max-height: calc(100dvh - 120px);
      background: white; border-radius: 18px; overflow: hidden;
      box-shadow: 0 16px 48px rgba(0,0,0,.18);
      display: flex; flex-direction: column;
      animation: popIn .18s ease both;
    }
    .panel-header {
      display: flex; align-items: center; gap: 10px; padding: 14px 14px 14px 18px;
      background: var(--gradient); color: white; flex-shrink: 0;
    }
    .panel-title { flex: 1; min-width: 0; }
    .panel-title strong { display: block; font-size: 15px; font-weight: 800; }
    .panel-title span   { display: block; font-size: 12px; opacity: .85; }
    .icon-btn {
      width: 32px; height: 32px; border-radius: 50%; border: none; cursor: pointer; flex-shrink: 0;
      background: rgba(255,255,255,.18); color: white; display: flex; align-items: center; justify-content: center;
      font-size: 17px; font-family: inherit;
    }
    .icon-btn:hover { background: rgba(255,255,255,.3); }

    .home { flex: 1; overflow-y: auto; padding: 22px 18px; display: flex; flex-direction: column; gap: 12px; }
    .hello { font-size: 1.15rem; font-weight: 800; color: #1a1a2e; margin: 0 0 6px; }
    .option {
      display: flex; gap: 14px; align-items: flex-start; text-align: left; width: 100%;
      padding: 16px; border-radius: 14px; border: 1.5px solid #ede9fe; background: white;
      cursor: pointer; font-family: inherit; transition: border-color .15s, background .15s; position: relative;
    }
    .option:hover { border-color: var(--purple); background: #faf8ff; }
    .option.urgent:hover { border-color: #ef4444; background: #fff5f5; }
    .opt-icon { width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
    .opt-icon.brand  { background: var(--gradient); color: white; }
    .opt-icon.urgent { background: #ef4444; color: white; }
    .opt-title { font-size: 15px; font-weight: 800; color: #1a1a2e; margin-bottom: 3px; display: flex; align-items: center; gap: 8px; }
    .opt-desc  { font-size: 13px; color: #6b7280; line-height: 1.45; }
    .opt-dot   { width: 9px; height: 9px; border-radius: 50%; background: #f43f5e; }
    .opt-status { font-size: 11px; color: #9ca3af; margin-top: 6px; }

    /* Mobile: casi pantalla completa, respetando la bottom bar (64px + safe area) */
    @media (max-width: 768px) {
      .fab { right: 16px; bottom: calc(64px + env(safe-area-inset-bottom) + 16px); width: 54px; height: 54px; }
      .panel {
        left: 8px; right: 8px; width: auto;
        top: calc(8px + env(safe-area-inset-top));
        bottom: calc(64px + env(safe-area-inset-bottom) + 8px);
        height: auto; max-height: none;
      }
      .fab.open { display: none; }
    }
  `],
  template: `
    @if (open()) {
      <div class="panel" role="dialog" aria-label="Soporte AgendaCo">
        <div class="panel-header">
          @if (kind()) {
            <button class="icon-btn" (click)="kind.set(null)" aria-label="Volver">←</button>
          }
          <div class="panel-title">
            @switch (kind()) {
              @case ('consulta') { <strong>Consultas</strong><span>Te respondemos en el día</span> }
              @case ('urgente')  { <strong>Urgente</strong><span>Lo revisamos cuanto antes</span> }
              @default           { <strong>Soporte AgendaCo</strong><span>Estamos para ayudarte</span> }
            }
          </div>
          <button class="icon-btn" (click)="close()" aria-label="Cerrar">✕</button>
        </div>

        @if (kind(); as k) {
          <app-support-chat [kind]="k" [thread]="threadOf(k)" />
        } @else {
          <div class="home">
            <p class="hello">Hola 👋 ¿En qué te ayudamos?</p>

            <button class="option" (click)="kind.set('consulta')">
              <div class="opt-icon brand">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div>
                <div class="opt-title">Consultas @if (threadOf('consulta')?.unreadByCompany) { <span class="opt-dot" aria-label="Respuesta nueva"></span> }</div>
                <div class="opt-desc">Dudas, tutoriales y cómo usar AgendaCo. Te respondemos en el día.</div>
                @if (threadOf('consulta')?.status === 'resolved') { <div class="opt-status">Resuelta · puedes volver a escribir</div> }
              </div>
            </button>

            <button class="option urgent" (click)="kind.set('urgente')">
              <div class="opt-icon urgent">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div>
                <div class="opt-title">Urgente @if (threadOf('urgente')?.unreadByCompany) { <span class="opt-dot" aria-label="Respuesta nueva"></span> }</div>
                <div class="opt-desc">Algo no funciona, un pago no se activó o tu página no carga.</div>
                @if (threadOf('urgente')?.status === 'resolved') { <div class="opt-status">Resuelta · puedes volver a escribir</div> }
              </div>
            </button>
          </div>
        }
      </div>
    }

    <button class="fab" [class.open]="open()" (click)="toggle()"
            [attr.aria-label]="open() ? 'Cerrar soporte' : 'Abrir soporte'">
      @if (open()) {
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      } @else {
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
      }
      @if (hasUnread()) { <span class="fab-dot" aria-label="Respuesta nueva"></span> }
    </button>
  `,
})
export class SupportWidgetComponent {
  private store   = inject(CompanyStore);
  private support = inject(SupportService);
  private route   = inject(ActivatedRoute);

  open    = signal(false);
  kind    = signal<SupportKind | null>(null);
  threads = signal<SupportThread[]>([]);

  hasUnread = computed(() => this.threads().some(t => t.unreadByCompany));

  private requestedKind = toSignal(
    this.route.queryParamMap.pipe(map(p => p.get('soporte'))),
    { initialValue: null },
  );

  constructor() {
    effect(onCleanup => {
      const companyId = this.store.companyId();
      if (!companyId) return;
      const sub = this.support.watchCompanyThreads(companyId).subscribe({
        next: list => this.threads.set(list),
        error: err => console.error('[Soporte empresa] hilos:', err),
      });
      onCleanup(() => sub.unsubscribe());
    });

    // Link de la notificación "Soporte respondió…": abre el chat de ese hilo
    effect(() => {
      const k = this.requestedKind();
      if (k === 'consulta' || k === 'urgente') {
        this.open.set(true);
        this.kind.set(k);
      }
    });
  }

  threadOf(kind: SupportKind): SupportThread | undefined {
    return this.threads().find(t => t.kind === kind);
  }

  toggle(): void {
    if (this.open()) this.close();
    else this.open.set(true);
  }

  close(): void {
    this.open.set(false);
    this.kind.set(null);
  }
}
