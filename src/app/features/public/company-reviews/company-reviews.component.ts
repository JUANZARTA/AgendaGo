import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { PublicNavComponent } from '../../../shared/components/public-nav.component';
import { CompanyService, Company } from '../../../core/services/company.service';
import { AuthService } from '../../../core/services/auth.service';
import { AppointmentService, Appointment } from '../../../core/services/appointment.service';
import { ReviewService, Review } from '../../../core/services/review.service';
import { NotificationService } from '../../../core/services/notification.service';
import { averageRating } from './company-reviews.utils';
import { RatingSummaryComponent } from './components/rating-summary.component';
import { ReviewCardComponent } from './components/review-card.component';
import { NewReviewFormComponent } from './components/new-review-form.component';
import { EditReviewModalComponent } from './components/edit-review-modal.component';
import { PublishConfirmModalComponent } from './components/publish-confirm-modal.component';
import { DeleteReviewModalComponent } from './components/delete-review-modal.component';

@Component({
  selector: 'app-company-reviews',
  standalone: true,
  imports: [
    CommonModule, RouterLink, PublicNavComponent,
    RatingSummaryComponent, ReviewCardComponent, NewReviewFormComponent,
    EditReviewModalComponent, PublishConfirmModalComponent, DeleteReviewModalComponent,
  ],
  styles: [`
    :host { display: block; }

    .reviews-body {
      background: #f0f7ff;
      min-height: calc(100vh - 64px);
      padding: 28px 20px 48px;
    }

    .inner { max-width: 640px; margin: 0 auto; }
  `],
  template: `
    <app-public-nav />

    <!-- Hero -->
    <div class="hero" style="padding:36px 20px 44px;margin-bottom:0">
      <div style="max-width:640px;margin:0 auto;position:relative;z-index:1">

        <button (click)="goBack()"
           style="background:none;border:none;cursor:pointer;color:rgba(255,255,255,.82);font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;margin-bottom:20px;padding:0;font-family:inherit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Volver al buscador
        </button>

        <p style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;opacity:.72;margin:0 0 6px">Reseñas de</p>
        <h1 style="font-size:clamp(1.4rem,5vw,2rem);font-weight:800;margin:0 0 14px;line-height:1.2">
          {{ company()?.name ?? '...' }}
        </h1>

        <app-rating-summary [count]="reviews().length" [avgRating]="avgRating()" [loading]="loadingReviews()" />
      </div>
    </div>

    <!-- Cuerpo -->
    <div class="reviews-body">
      <div class="inner">

        <!-- Estado del formulario -->
        @if (!authSvc.isLoggedIn()) {
          <div style="background:white;border-radius:14px;padding:18px 20px;margin-bottom:20px;box-shadow:0 2px 10px rgba(0,0,0,.05);text-align:center">
            <p style="color:#888;font-size:14px;margin:0 0 12px">Inicia sesión para dejar una reseña.</p>
            <a routerLink="/auth/login" class="btn btn-primary btn-sm">Iniciar sesión</a>
          </div>
        } @else if (reviewSent()) {
          <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:14px;padding:16px 20px;margin-bottom:20px;font-size:14px;font-weight:700;color:#166534">
            ¡Gracias por tu reseña! Ya está publicada.
          </div>
        } @else if (checkingEligibility()) {
          <div style="background:white;border-radius:14px;padding:18px 20px;margin-bottom:20px;font-size:13px;color:#aaa;box-shadow:0 2px 10px rgba(0,0,0,.04)">
            Verificando elegibilidad...
          </div>
        } @else if (reviewableApts().length === 0 && myReviews().length === 0) {
          <div style="background:white;border-radius:14px;padding:18px 20px;margin-bottom:20px;box-shadow:0 2px 10px rgba(0,0,0,.05)">
            <p style="color:#888;font-size:14px;margin:0">Necesitas tener al menos una cita completada en este negocio para dejar una reseña.</p>
          </div>
        } @else if (reviewableApts().length === 0 && myReviews().length > 0) {
          <div style="background:#f8f7ff;border-radius:14px;padding:16px 20px;margin-bottom:20px;font-size:14px;color:#888">
            Ya dejaste reseña en todos tus turnos completados.
          </div>
        } @else {
          <app-new-review-form
            [reviewableApts]="reviewableApts()"
            [error]="reviewError()"
            [submitting]="submittingReview()"
            [(selectedAptId)]="selectedAptId"
            [(rating)]="reviewRating"
            [(comment)]="reviewComment"
            (publish)="askConfirm()" />
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
              <app-review-card
                [review]="r"
                [isOwn]="r.clientId === authSvc.profile()?.uid"
                (edit)="openEdit($event)"
                (remove)="showDeleteConfirm.set($event)" />
            }
          }
        </div>

      </div>
    </div>

    <!-- Modal: confirmar publicación -->
    @if (showConfirm()) {
      <app-publish-confirm-modal
        [rating]="reviewRating()"
        [comment]="reviewComment()"
        [submitting]="submittingReview()"
        (cancel)="showConfirm.set(false)"
        (confirm)="submitReview()" />
    }

    <!-- Modal: editar reseña -->
    @if (editingReview()) {
      <app-edit-review-modal
        [error]="editError()"
        [updating]="updatingReview()"
        [(rating)]="editRating"
        [(comment)]="editComment"
        (cancel)="editingReview.set(null)"
        (save)="submitEdit()" />
    }

    <!-- Modal: confirmar eliminación -->
    @if (showDeleteConfirm()) {
      <app-delete-review-modal
        [deleting]="deletingReview()"
        (cancel)="showDeleteConfirm.set(null)"
        (confirm)="confirmDelete()" />
    }
  `,
})
export class CompanyReviewsComponent implements OnInit, OnDestroy {
  private route      = inject(ActivatedRoute);
  private router     = inject(Router);
  private companySvc = inject(CompanyService);
  private aptSvc     = inject(AppointmentService);
  private reviewSvc  = inject(ReviewService);
  private notifSvc   = inject(NotificationService);
  readonly authSvc   = inject(AuthService);

  companyId = signal('');
  company   = signal<Company | null>(null);
  reviews   = signal<Review[]>([]);

  loadingReviews      = signal(true);
  checkingEligibility = signal(true);
  completedApts       = signal<Appointment[]>([]);

  // Turnos sin reseña del cliente actual
  reviewableApts = computed(() => {
    const uid = this.authSvc.profile()?.uid;
    if (!uid) return [];
    const reviewedAptIds = new Set(
      this.reviews()
        .filter(r => r.clientId === uid && r.appointmentId)
        .map(r => r.appointmentId!)
    );
    return this.completedApts().filter(a => a.id && !reviewedAptIds.has(a.id));
  });

  // Reseñas del cliente actual
  myReviews = computed(() => {
    const uid = this.authSvc.profile()?.uid;
    return uid ? this.reviews().filter(r => r.clientId === uid) : [];
  });

  selectedAptId    = signal('');
  reviewRating     = signal(0);
  reviewComment    = signal('');
  submittingReview = signal(false);
  reviewSent       = signal(false);
  reviewError      = signal('');
  showConfirm      = signal(false);

  editingReview  = signal<Review | null>(null);
  editRating     = signal(0);
  editComment    = signal('');
  editError      = signal('');
  updatingReview = signal(false);

  showDeleteConfirm = signal<Review | null>(null);
  deletingReview    = signal(false);

  avgRating = computed(() => averageRating(this.reviews().map(r => r.rating)));

  private reviewSub: Subscription | null = null;

  constructor() {
    // Auto-seleccionar turno si solo hay uno
    effect(() => {
      const apts = this.reviewableApts();
      if (apts.length === 1) this.selectedAptId.set(apts[0].id!);
      else if (apts.length === 0) this.selectedAptId.set('');
    });
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    if (!id) return;
    this.companyId.set(id);

    this.companySvc.getCompany(id).then(c => this.company.set(c)).catch(() => {});

    this.reviewSub = this.reviewSvc.getByCompany(id).subscribe({
      next: (list) => {
        this.reviews.set(list);
        this.loadingReviews.set(false);
      },
      error: () => this.loadingReviews.set(false),
    });

    // Cargar turnos completados del cliente en este negocio (esperar auth para que F5 funcione)
    try { await this.authSvc.waitForAuth(); } catch {}
    const uid = this.authSvc.profile()?.uid;
    if (uid) {
      try {
        const all = await this.aptSvc.getByClient(uid);
        this.completedApts.set(all.filter(a => a.companyId === id && a.status === 'completed'));
      } catch {}
      finally { this.checkingEligibility.set(false); }
    } else {
      this.checkingEligibility.set(false);
    }
  }

  ngOnDestroy() { this.reviewSub?.unsubscribe(); }

  askConfirm() {
    if (this.reviewRating() === 0) { this.reviewError.set('Selecciona al menos una estrella.'); return; }
    if (this.reviewableApts().length > 1 && !this.selectedAptId()) { this.reviewError.set('Selecciona el turno a reseñar.'); return; }
    this.reviewError.set('');
    this.showConfirm.set(true);
  }

  async submitReview() {
    const uid  = this.authSvc.profile()?.uid;
    const name = this.authSvc.displayName() || 'Anónimo';
    if (!uid || !this.companyId()) return;
    this.showConfirm.set(false);
    this.submittingReview.set(true);
    const rating = this.reviewRating(); // capturar antes de resetear
    try {
      await this.reviewSvc.addReview({
        companyId:      this.companyId(),
        clientId:       uid,
        clientName:     name,
        clientPhotoUrl: this.authSvc.profile()?.photoUrl,
        rating,
        comment:        this.reviewComment().trim(),
        createdAt:      Date.now(),
        appointmentId:  this.selectedAptId() || undefined,
      });
      this.reviewSent.set(true);
      this.reviewRating.set(0);
      this.reviewComment.set('');
      this.selectedAptId.set('');
      const owner = this.company()?.ownerId;
      if (owner) {
        this.notifSvc.create({
          recipientId: owner,
          type: 'new_review',
          title: 'Nueva reseña',
          body: `${name} dejó ${rating} ★`,
          link: '/empresa/resenas',
        }).catch(() => {});
      }
    } catch {
      this.reviewError.set('Error al publicar. Intenta de nuevo.');
    } finally {
      this.submittingReview.set(false);
    }
  }

  openEdit(review: Review) {
    this.editingReview.set(review);
    this.editRating.set(review.rating);
    this.editComment.set(review.comment);
    this.editError.set('');
  }

  async submitEdit() {
    const review = this.editingReview();
    if (!review?.id) return;
    if (this.editRating() === 0) { this.editError.set('Selecciona al menos una estrella.'); return; }
    this.updatingReview.set(true);
    try {
      await this.reviewSvc.updateReview(review.id, this.editRating(), this.editComment());
      this.editingReview.set(null);
    } catch {
      this.editError.set('Error al guardar. Intenta de nuevo.');
    } finally {
      this.updatingReview.set(false);
    }
  }

  async confirmDelete() {
    const review = this.showDeleteConfirm();
    if (!review?.id) return;
    this.deletingReview.set(true);
    try {
      await this.reviewSvc.deleteReview(review.id);
      this.showDeleteConfirm.set(null);
    } catch {
    } finally {
      this.deletingReview.set(false);
    }
  }

  goBack() { this.router.navigate(['/']); }
}
