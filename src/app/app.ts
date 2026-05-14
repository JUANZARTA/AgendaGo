import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DevNavComponent } from './shared/components/dev-nav.component';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, DevNavComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  devMode = !environment.production && environment.bypassAuth;
}
