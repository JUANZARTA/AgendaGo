import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PublicNavComponent } from '../../../shared/components/public-nav.component';
import { CompanyService, Company } from '../../../core/services/company.service';
import { AuthService } from '../../../core/services/auth.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { ReviewService, Review } from '../../../core/services/review.service';

@Component({
  selector: 'app-company-reviews',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PublicNavComponent],
  styles: [`
    :host { display: block; }

    .reviews-body {
      background: #f0f7ff;
      min-height: calc(100vh - 64px);
      padding: 28px 20px 48px;
    }

    .inner { max-width: 640px; margin: 0 auto; }

    .star-btn {
      background: none; border: none; cursor: pointer;
      padding: 2px; line-height: 0;
      transition: transform .1s;
    }
    .star-btn:hover { transform: scale(1.15); }

    .review-card {
      background: white;
      border-radius: 14px;
      padding: 16px 18px;
      box-shadow: 0 2px 10px rgba(0,0,0,.05);
    }

    .review-textarea {
      width: 100%; padding: 12px 14px;
      border: 1.5px solid #e5e0ff; border-radius: 12px;
      font-size: 14px; font-family: inherit;
      resize: vertical; min-height: 80px;
      box-sizing: border-box; outline: none;
      color: inherit; background: white;
      transition: border-color .18s;
    }
    .review-textarea:focus { border-color: var(--purple); }

    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.45);
      display: flex; align-items: center; justify-content: center;
      z-index: 300; padding: 16px;
    }
    .modal-card {
      background: white; border-radius: 20px; padding: 28px;
      width: 100%; max-width: 380px;
      box-shadow: 0 20px 60px rgba(0,0,0,.25);
    }
  `],
  template: `
    <app-public-nav />

    <!-- Hero -->
    <div class="hero" style="padding:36px 20px 44px;margin-bottom:0">
      <div style="max-width:640px;margin:0 auto;position:relative;z-index:1">

        <!-- Volver al negocio -->
        <button (click)="goBack()"
           style="background:none;border:none;cursor:pointer;color:rgba(255,255,255,.82);font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;margin-bottom:20px;padding:0;font-family:inherit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Volver al buscador
        </button>

        <p style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;opacity:.72;margin:0 0 6px">Reseñas de</p>
        <h1 style="font-size:clamp(1.4rem,5vw,2rem);font-weight:800;margin:0 0 14px;line-height:1.2">
          {{ company()?.name ?? '...' }}
        </h1>

        @if (reviews().length > 0) {
          <div style="display:flex;align-items:center;gap:8px">
            <div style="display:flex;gap:3px">
              @for (i of starRange; track i) {
                <svg width="16" height="16" viewBox="0 0 24 24"
                     [attr.fill]="i <= avgRating() ? '#fbbf24' : 'rgba(255,255,255,.3)'"
                     [attr.stroke]="i <= avgRating() ? '#fbbf24' : 'rgba(255,255,255,.3)'"
                     stroke-width="1">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              }
            </div>
            <span style="font-size:15px;font-weight:800">{{ avgRating() }}</span>
            <span style="font-size:13px;opacity:.75">({{ reviews().length }} reseña{{ reviews().length !== 1 ? 's' : '' }})</span>
          </div>
        } @else if (!loadingReviews()) {
          <p style="opacity:.72;font-size:14px;margin:0">Todavía sin reseñas · ¡Sé el primero!</p>
        }
      </div>
    </div>

    <!-- Cuerpo -->
    <div class="reviews-body">
      <div class="inner">

        <!-- Estado del formulario -->
        @if (!authSvc.isLoggedIn()) {
          <div style="background:white;border-radius:14px;padding:18px 20px;margin-bottom:20px;box-shadow:0 2px 10px rgba(0,0,0,.05);text-align:center">
            <p style="color:#888;font-size:14px;margin:0 0 12px">Iniciá sesión para dejar una reseña.</p>
            <a routerLink="/auth/login" class="btn btn-primary btn-sm">Iniciar sesión</a>
          </div>
        } @else if (reviewSent()) {
          <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:14px;padding:16px 20px;margin-bottom:20px;font-size:14px;font-weight:700;color:#166534">
            ¡Gracias por tu reseña! Ya está publicada.
          </div>
        } @else if (alreadyReviewed()) {
          <div style="background:#f8f7ff;border-radius:14px;padding:16px 20px;margin-bottom:20px;font-size:14px;color:#888">
            Ya dejaste una reseña para este negocio.
          </div>
        } @else if (checkingEligibility()) {
          <div style="background:white;border-radius:14px;padding:18px 20px;margin-bottom:20px;font-size:13px;color:#aaa;box-shadow:0 2px 10px rgba(0,0,0,.04)">
            Verificando elegibilidad...
          </div>
        } @else if (!canReview()) {
          <div style="background:white;border-radius:14px;padding:18px 20px;margin-bottom:20px;box-shadow:0 2px 10px rgba(0,0,0,.05)">
            <p style="color:#888;font-size:14px;margin:0">Necesitás tener al menos una cita completada en este negocio para dejar una reseña.</p>
          </div>
        } @else {
          <div style="background:white;border-radius:14px;padding:20px;margin-bottom:20px;box-shadow:0 2px 10px rgba(0,0,0,.05)">
            <p style="font-size:13px;font-weight:700;color:var(--purple);margin:0 0 14px">Dejá tu reseña</p>

            <div style="display:flex;gap:4px;margin-bottom:14px">
              @for (i of starRange; track i) {
                <button type="button" class="star-btn"
                  (click)="reviewRating.set(i)"
                  (mouseover)="reviewHover.set(i)"
                  (mouseout)="reviewHover.set(0)">
                  <svg width="30" height="30" viewBox="0 0 24 24"
                       [attr.fill]="i <= (reviewHover() || reviewRating()) ? '#f59e0b' : '#e5e7eb'"
                       [attr.stroke]="i <= (reviewHover() || reviewRating()) ? '#f59e0b' : '#d1d5db'"
                       stroke-width="1" style="transition:fill .12s">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </button>
              }
            </div>

            <textarea class="review-textarea" [(ngModel)]="reviewComment"
                      placeholder="Contá tu experiencia...">
            </textarea>

            @if (reviewError()) {
              <p style="color:#ef4444;font-size:13px;margin-top:6px">{{ reviewError() }}</p>
            }

            <button class="btn btn-primary" style="margin-top:12px;width:100%"
                    [disabled]="submittingReview()"
                    (click)="askConfirm()">
              @if (submittingReview()) { Enviando... } @else { Publicar reseña }
            </button>
          </div>
        }

        <!-- Lista de reseñas -->
        <div style="display:flex;flex-direction:column;gap:12px">
          @if (loadingReviews()) {
            <p style="color:#aaa;font-size:13px;text-align:center;padding:24px 0">Cargando reseñas...</p>
          } @else if (reviews().length === 0) {
            <div style="background:white;border-radius:14px;padding:32px;text-align:center;box-shadow:0 2px 10px rgba(0,0,0,.05)">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:10px">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <p style="color:#aaa;margin:0">Todavía no hay reseñas.</p>
            </div>
          } @else {
            @for (r of reviews(); track r.id) {
              <div class="review-card">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
                  <div style="width:36px;height:36px;border-radius:50%;background:var(--gradient);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:white;flex-shrink:0;overflow:hidden">
                    @if (r.clientPhotoUrl) {
                      <img [src]="r.clientPhotoUrl" style="width:100%;height:100%;object-fit:cover" alt="" />
                    } @else {
                      {{ r.clientName[0]?.toUpperCase() }}
                    }
                  </div>
                  <div style="flex:1;min-width:0">
                    <div style="font-weight:700;font-size:14px">{{ r.clientName }}</div>
                    <div style="display:flex;gap:2px;margin-top:2px">
                      @for (i of starRange; track i) {
                        <svg width="12" height="12" viewBox="0 0 24 24"
                             [attr.fill]="i <= r.rating ? '#f59e0b' : '#e5e7eb'"
                             [attr.stroke]="i <= r.rating ? '#f59e0b' : '#d1d5db'"
                             stroke-width="1">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      }
                    </div>
                  </div>
                  <span style="font-size:11px;color:#bbb;flex-shrink:0">{{ formatDate(r.createdAt) }}</span>
                </div>
                @if (r.comment) {
                  <p style="font-size:13px;color:#444;line-height:1.65;margin:0">{{ r.comment }}</p>
                }
                @if (r.reply) {
                  <div style="background:rgba(124,58,237,.06);border-left:3px solid var(--purple);border-radius:0 10px 10px 0;padding:10px 14px;margin-top:12px">
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
                      </svg>
                      <span style="font-size:11px;font-weight:700;color:var(--purple)">Respuesta del negocio</span>
                    </div>
                    <p style="font-size:13px;color:#555;line-height:1.6;margin:0">{{ r.reply }}</p>
                  </div>
                }
              </div>
            }
          }
        </div>

      </div>
    </div>

    <!-- Modal confirmación -->
    @if (showConfirm()) {
      <div class="modal-overlay" (click)="showConfirm.set(false)">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <h3 style="font-size:1.05rem;font-weight:800;margin:0 0 6px">¿Publicar reseña?</h3>
          <p style="font-size:13px;color:#888;margin:0 0 18px">Una vez publicada no puede editarse.</p>

          <div style="display:flex;gap:3px;margin-bottom:10px">
            @for (i of starRange; track i) {
              <svg width="22" height="22" viewBox="0 0 24 24"
                   [attr.fill]="i <= reviewRating() ? '#f59e0b' : '#e5e7eb'"
                   [attr.stroke]="i <= reviewRating() ? '#f59e0b' : '#d1d5db'"
                   stroke-width="1">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            }
          </div>

          @if (reviewComment.trim()) {
            <p style="font-size:13px;color:#444;background:#f8f7ff;border-radius:10px;padding:10px 14px;margin:0 0 20px;line-height:1.6">
              "{{ reviewComment }}"
            </p>
          }

          <div style="display:flex;gap:10px">
            <button class="btn btn-secondary" style="flex:1" (click)="showConfirm.set(false)">Cancelar</button>
            <button class="btn btn-primary" style="flex:1" [disabled]="submittingReview()" (click)="submitReview()">
              @if (submittingReview()) { Enviando... } @else { Confirmar }
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class CompanyReviewsComponent implements OnInit, OnDestroy {
  private route      = inject(ActivatedRoute);
  private router     = inject(Router);
  private companySvc = inject(CompanyService);
  private aptSvc     = inject(AppointmentService);
  private reviewSvc  = inject(ReviewService);
  readonly authSvc   = inject(AuthService);

  companyId = signal('');
  company   = signal<Company | null>(null);
  reviews   = signal<Review[]>([]);

  loadingReviews      = signal(true);
  checkingEligibility = signal(true);
  canReview           = signal(false);
  alreadyReviewed     = signal(false);

  reviewRating     = signal(0);
  reviewHover      = signal(0);
  reviewComment    = '';
  submittingReview = signal(false);
  reviewSent       = signal(false);
  reviewError      = signal('');
  showConfirm      = signal(false);

  readonly starRange = [1, 2, 3, 4, 5];

  avgRating = computed(() => {
    const list = this.reviews();
    if (!list.length) return 0;
    return Math.round(list.reduce((s, r) => s + r.rating, 0) / list.length * 10) / 10;
  });

  // Siempre correcto: lee directo del snapshot, no depende del signal
  get backLink(): string[] {
    return ['/negocio', this.route.snapshot.paramMap.get('id') ?? ''];
  }

  private reviewSub: Subscription | null = null;

  constructor() {
    effect(() => {
      const uid = this.authSvc.profile()?.uid;
      const cid = this.companyId();
      if (!uid || !cid) return;
      this._checkEligibility(uid, cid);
    });
  }

  private _checked = false;

  private async _checkEligibility(uid: string, cid: string) {
    if (this._checked) return;
    this._checked = true;
    this.checkingEligibility.set(true);
    try {
      const already = this.reviews().some(r => r.clientId === uid);
      this.alreadyReviewed.set(already);
      if (!already) {
        const apts = await this.aptSvc.getByClient(uid);
        const hasCompleted = apts.some(a => a.companyId === cid && a.status === 'completed');
        this.canReview.set(hasCompleted);
      }
    } catch (e) { console.error('[Reviews] eligibility check failed:', e); }
    finally { this.checkingEligibility.set(false); }
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    if (!id) return;
    this.companyId.set(id);

    this.companySvc.getCompany(id)
      .then(c => this.company.set(c))
      .catch(() => {});

    this.reviewSub = this.reviewSvc.getByCompany(id).subscribe({
      next: (list) => {
        this.reviews.set(list);
        this.loadingReviews.set(false);
        const uid = this.authSvc.profile()?.uid;
        if (uid) this.alreadyReviewed.set(list.some(r => r.clientId === uid));
      },
      error: () => this.loadingReviews.set(false),
    });
  }

  ngOnDestroy() { this.reviewSub?.unsubscribe(); }

  askConfirm() {
    if (this.reviewRating() === 0) {
      this.reviewError.set('Seleccioná al menos una estrella.');
      return;
    }
    this.reviewError.set('');
    this.showConfirm.set(true);
  }

  async submitReview() {
    const uid  = this.authSvc.profile()?.uid;
    const name = this.authSvc.displayName() || 'Anónimo';
    if (!uid || !this.companyId()) return;
    this.showConfirm.set(false);
    this.submittingReview.set(true);
    try {
      await this.reviewSvc.addReview({
        companyId:      this.companyId(),
        clientId:       uid,
        clientName:     name,
        clientPhotoUrl: this.authSvc.profile()?.photoUrl,
        rating:         this.reviewRating(),
        comment:        this.reviewComment.trim(),
        createdAt:      Date.now(),
      }, this.reviews());
      this.reviewSent.set(true);
      this.canReview.set(false);
    } catch {
      this.reviewError.set('Error al publicar. Intentá de nuevo.');
    } finally {
      this.submittingReview.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }

  formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
