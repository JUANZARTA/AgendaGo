import { Component, effect, inject, OnInit } from '@angular/core';
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
  private auth = inject(AuthService);
  private push = inject(PushService);

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        this.push.initialize(user.uid);
      }
    });
  }

  ngOnInit(): void {
    this.themeService.init();
  }
}
