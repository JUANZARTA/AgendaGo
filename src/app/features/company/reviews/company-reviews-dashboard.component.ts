import { Component, OnDestroy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CompanyStore } from '../../../core/services/company-store.service';
import { ReviewService, Review } from '../../../core/services/review.service';

@Component({
  selector: 'app-company-reviews-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    :host { display: block; }

    .page-header {
      background: var(--sidebar-bg);
      padding: 28px 32px 24px;
      border-bottom: 1px solid rgba(255,255,255,.06);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 24px;
      align-items: center;
    }

    .avg-circle {
      width: 100px; height: 100px;
      border-radius: 50%;
      background: var(--gradient);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 8px 24px rgba(124,58,237,.35);
    }

    .bar-track {
      background: rgba(255,255,255,.08);
      border-radius: 99px;
      height: 6px;
      flex: 1;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      border-radius: 99px;
      background: var(--gradient);
      transition: width .4s ease;
    }

    .review-card {
      background: var(--card-bg, white);
      border-radius: 16px;
      padding: 20px 22px;
      box-shadow: 0 2px 12px rgba(0,0,0,.06);
      transition: box-shadow .2s;
    }
    .review-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.1); }

    .reply-box {
      background: rgba(124,58,237,.06);
      border-left: 3px solid var(--purple);
      border-radius: 0 12px 12px 0;
      padding: 12px 16px;
      margin-top: 14px;
    }

    .reply-textarea {
      width: 100%; padding: 10px 13px;
      border: 1.5px solid rgba(124,58,237,.25);
      border-radius: 10px;
      font-size: 13px; font-family: inherit;
      resize: vertical; min-height: 68px;
      box-sizing: border-box; outline: none;
      background: rgba(124,58,237,.04);
      color: inherit;
      transition: border-color .18s;
    }
    .reply-textarea:focus { border-color: var(--purple); }

    .empty-state {
      text-align: center;
      padding: 64px 20px;
    }

    @media (max-width: 640px) {
      .page-header { padding: 20px 16px 18px; }
      .stats-grid { grid-template-columns: 1fr; }
      .avg-circle { display: none; }
    }
  `],
  template: `
    <!-- Header con stats -->
    <div class="page-header">
      <h2 style="font-size:1.2rem;font-weight:800;color:var(--sidebar-logo-gradient, white);margin:0 0 20px;
                 background:var(--sidebar-logo-gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">
        Reseñas
      </h2>

      @if (loading()) {
        <p style="color:#888;font-size:13px">Cargando...</p>
      } @else if (reviews().length === 0) {
        <p style="color:#a0a0b8;font-size:14px;margin:0">Todavía no tenés reseñas.</p>
      } @else {
        <div class="stats-grid">
          <!-- Promedio circular -->
          <div class="avg-circle">
            <span style="font-size:1.9rem;font-weight:900;color:white;line-height:1">{{ avgRating() }}</span>
            <span style="font-size:11px;color:rgba(255,255,255,.75);margin-top:2px">de 5</span>
          </div>

          <!-- Desglose por estrellas -->
          <div style="display:flex;flex-direction:column;gap:8px">
            @for (star of [5,4,3,2,1]; track star) {
              <div style="display:flex;align-items:center;gap:10px">
                <span style="font-size:12px;font-weight:700;color:#a0a0b8;width:8px;text-align:right">{{ star }}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <div class="bar-track">
                  <div class="bar-fill" [style.width.%]="barPercent(star)"></div>
                </div>
                <span style="font-size:12px;color:#a0a0b8;width:20px;text-align:right">{{ countByStar(star) }}</span>
              </div>
            }
            <p style="font-size:12px;color:#a0a0b8;margin:4px 0 0">
              {{ reviews().length }} reseña{{ reviews().length !== 1 ? 's' : '' }} en total
            </p>
          </div>
        </div>
      }
    </div>

    <!-- Lista -->
    <div style="padding:24px 32px 48px;max-width:760px">

      @if (loading()) {
        @for (i of [1,2,3]; track i) {
          <div style="background:var(--card-bg,white);border-radius:16px;height:100px;margin-bottom:16px;
                      animation:pulse 1.4s ease infinite;opacity:.5"></div>
        }
      } @else if (reviews().length === 0) {
        <div class="empty-state">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" stroke-width="1.2"
               stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:14px">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <h3 style="font-size:1rem;font-weight:700;color:#666;margin:0 0 6px">Sin reseñas aún</h3>
          <p style="font-size:13px;color:#aaa;margin:0">Cuando los clientes dejen reseñas aparecerán aquí.</p>
        </div>
      } @else {
        <div style="display:flex;flex-direction:column;gap:16px">
          @for (r of reviews(); track r.id) {
            <div class="review-card">

              <!-- Cabecera: avatar + nombre + estrellas + fecha -->
              <div style="display:flex;align-items:flex-start;gap:12px">
                <div style="width:40px;height:40px;border-radius:50%;background:var(--gradient);
                            display:flex;align-items:center;justify-content:center;
                            font-size:14px;font-weight:700;color:white;flex-shrink:0;overflow:hidden">
                  @if (r.clientPhotoUrl) {
                    <img [src]="r.clientPhotoUrl" style="width:100%;height:100%;object-fit:cover" alt="" />
                  } @else {
                    {{ r.clientName[0]?.toUpperCase() }}
                  }
                </div>

                <div style="flex:1;min-width:0">
                  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                    <span style="font-weight:700;font-size:14px">{{ r.clientName }}</span>
                    <div style="display:flex;gap:2px">
                      @for (i of starRange; track i) {
                        <svg width="13" height="13" viewBox="0 0 24 24"
                             [attr.fill]="i <= r.rating ? '#f59e0b' : '#e5e7eb'"
                             [attr.stroke]="i <= r.rating ? '#f59e0b' : '#d1d5db'"
                             stroke-width="1">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      }
                    </div>
                  </div>
                  <span style="font-size:11px;color:#bbb">{{ formatDate(r.createdAt) }}</span>
                </div>
              </div>

              <!-- Comentario -->
              @if (r.comment) {
                <p style="font-size:13px;color:#444;line-height:1.65;margin:12px 0 0">{{ r.comment }}</p>
              }

              <!-- Respuesta existente -->
              @if (r.reply) {
                <div class="reply-box">
                  <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2.5"
                         stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
                    </svg>
                    <span style="font-size:12px;font-weight:700;color:var(--purple)">Tu respuesta</span>
                    @if (r.replyAt) {
                      <span style="font-size:11px;color:#bbb">· {{ formatDate(r.replyAt) }}</span>
                    }
                  </div>
                  <p style="font-size:13px;color:#555;line-height:1.6;margin:0">{{ r.reply }}</p>
                  <button (click)="startEdit(r)"
                    style="background:none;border:none;padding:4px 0 0;cursor:pointer;font-size:11px;
                           color:var(--purple);font-weight:600;font-family:inherit;opacity:.7">
                    Editar respuesta
                  </button>
                </div>
              }

              <!-- Formulario de respuesta -->
              @if (replyingId() === r.id) {
                <div style="margin-top:14px">
                  <textarea class="reply-textarea"
                    [ngModel]="replyText()"
                    (ngModelChange)="replyText.set($event)"
                    placeholder="Escribí tu respuesta pública...">
                  </textarea>
                  @if (replyError()) {
                    <p style="font-size:12px;color:#ef4444;margin:4px 0 0">{{ replyError() }}</p>
                  }
                  <div style="display:flex;gap:8px;margin-top:8px">
                    <button class="btn btn-sm" style="background:rgba(0,0,0,.06);color:#666"
                            (click)="cancelReply()">Cancelar</button>
                    <button class="btn btn-primary btn-sm"
                            [disabled]="sendingReply()"
                            (click)="submitReply(r.id!)">
                      @if (sendingReply()) { Guardando... } @else { Publicar respuesta }
                    </button>
                  </div>
                </div>
              } @else if (!r.reply) {
                <button (click)="startReply(r.id!)"
                  style="display:inline-flex;align-items:center;gap:6px;background:none;border:1.5px solid rgba(124,58,237,.2);
                         border-radius:8px;padding:6px 12px;cursor:pointer;font-size:12px;font-weight:700;
                         color:var(--purple);margin-top:12px;font-family:inherit;transition:all .18s"
                  onmouseover="this.style.background='rgba(124,58,237,.07)'"
                  onmouseout="this.style.background='none'">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                       stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
                  </svg>
                  Responder
                </button>
              }

            </div>
          }
        </div>
      }
    </div>
  `,
})
export class CompanyReviewsDashboardComponent implements OnInit, OnDestroy {
  private companyStore = inject(CompanyStore);
  private reviewSvc    = inject(ReviewService);

  reviews    = signal<Review[]>([]);
  loading    = signal(true);
  replyingId = signal<string | null>(null);
  replyText  = signal('');
  sendingReply = signal(false);
  replyError   = signal('');

  readonly starRange = [1, 2, 3, 4, 5];

  avgRating = computed(() => {
    const list = this.reviews();
    if (!list.length) return 0;
    return Math.round(list.reduce((s, r) => s + r.rating, 0) / list.length * 10) / 10;
  });

  countByStar(star: number) {
    return this.reviews().filter(r => r.rating === star).length;
  }

  barPercent(star: number) {
    const total = this.reviews().length;
    return total ? (this.countByStar(star) / total) * 100 : 0;
  }

  private sub: Subscription | null = null;

  ngOnInit() {
    const id = this.companyStore.company()?.id;
    if (!id) return;
    this.sub = this.reviewSvc.getByCompany(id).subscribe({
      next: list => { this.reviews.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  startReply(id: string) {
    this.replyingId.set(id);
    this.replyText.set('');
    this.replyError.set('');
  }

  startEdit(r: Review) {
    this.replyingId.set(r.id!);
    this.replyText.set(r.reply ?? '');
    this.replyError.set('');
  }

  cancelReply() {
    this.replyingId.set(null);
    this.replyText.set('');
    this.replyError.set('');
  }

  async submitReply(reviewId: string) {
    const text = this.replyText().trim();
    if (!text) { this.replyError.set('Escribí algo antes de publicar.'); return; }
    this.sendingReply.set(true);
    this.replyError.set('');
    try {
      await this.reviewSvc.addReply(reviewId, text);
      this.cancelReply();
    } catch {
      this.replyError.set('Error al guardar. Intentá de nuevo.');
    } finally {
      this.sendingReply.set(false);
    }
  }

  formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
