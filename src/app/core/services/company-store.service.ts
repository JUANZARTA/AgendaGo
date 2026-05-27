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
        this._initialLoadDone = false;
        this.company.set(null);
        this.loading.set(false);
      }
    });
  }

  private _initialLoadDone = false;

  private async _load(uid: string): Promise<void> {
    if (!this._initialLoadDone) this.loading.set(true);
    try {
      const list = await this.svc.getCompaniesByOwner(uid);
      this.company.set(list[0] ?? null);
    } catch (err) {
      console.error('[CompanyStore] Error cargando empresa:', err);
      this.company.set(null);
    } finally {
      this.loading.set(false);
      this._initialLoadDone = true;
    }
  }

  async refresh(): Promise<void> {
    const uid = this.auth?.currentUser?.uid;
    if (uid) await this._load(uid);
  }
}
