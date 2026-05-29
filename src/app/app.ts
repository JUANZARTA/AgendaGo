import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';
import { PushService } from './core/services/push.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private themeService = inject(ThemeService);
  private auth         = inject(AuthService);
  private push         = inject(PushService);

  showBanner  = signal(false);
  isIos       = signal(false);
  private deferredPrompt: any = null;

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user) this.push.initialize(user.uid);
    });

    if (typeof window === 'undefined') return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (localStorage.getItem('pwa-dismissed')) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (ios) {
      this.isIos.set(true);
      this.showBanner.set(true);
      return;
    }

    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showBanner.set(true);
    });
  }

  ngOnInit(): void {
    this.themeService.init();
  }

  async install() {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    if (outcome === 'accepted') this.showBanner.set(false);
    this.deferredPrompt = null;
  }

  dismiss() {
    this.showBanner.set(false);
    localStorage.setItem('pwa-dismissed', '1');
  }
}
