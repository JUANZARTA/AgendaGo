import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { BrandLogoComponent } from './shared/components/brand-logo.component';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';
import { PushService } from './core/services/push.service';
import { PwaInstallService } from './core/services/pwa-install.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, BrandLogoComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private themeService = inject(ThemeService);
  private auth         = inject(AuthService);
  private push         = inject(PushService);

  // Se inyecta acá (raíz) para capturar `beforeinstallprompt` apenas carga la app
  private pwa          = inject(PwaInstallService);

  private dismissed   = signal(typeof localStorage !== 'undefined' && !!localStorage.getItem('pwa-dismissed'));
  readonly isIos      = this.pwa.isIos;
  /** Aviso automático: iOS (instrucciones) o cuando el navegador ofrece instalar; nunca si ya la cerraron. */
  readonly showBanner = computed(() =>
    !this.dismissed() && !this.pwa.installed() && (this.pwa.isIos() || this.pwa.canPrompt()));

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user) this.push.initialize(user.uid);
    });

  }

  ngOnInit(): void {
    this.themeService.init();
  }

  async install() {
    await this.pwa.prompt();
  }

  dismiss() {
    this.dismissed.set(true);
    localStorage.setItem('pwa-dismissed', '1');
  }
}
