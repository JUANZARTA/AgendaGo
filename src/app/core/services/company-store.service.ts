import { Injectable, computed, inject, signal } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Company, CompanyService } from './company.service';

@Injectable({ providedIn: 'root' })
export class CompanyStore {
  private auth = inject(Auth, { optional: true });
  private svc  = inject(CompanyService);

  company   = signal<Company | null>(null);
  loading   = signal(true);
  companyId = computed(() => this.company()?.id ?? null);

  constructor() {
    if (!this.auth) {
      this.loading.set(false);
      return;
    }
    this.auth.onAuthStateChanged(user => {
      if (user) {
        this._load(user.uid);
      } else {
        this.company.set(null);
        this.loading.set(false);
      }
    });
  }

  private async _load(uid: string): Promise<void> {
    this.loading.set(true);
    try {
      const list = await this.svc.getCompaniesByOwner(uid);
      this.company.set(list[0] ?? null);
    } catch {
      this.company.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  async refresh(): Promise<void> {
    const uid = this.auth?.currentUser?.uid;
    if (uid) await this._load(uid);
  }
}
