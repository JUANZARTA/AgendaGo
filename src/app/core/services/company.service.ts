import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, doc, updateDoc, getDoc, query, where, getDocs, serverTimestamp, runTransaction, Timestamp,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { NotificationService } from './notification.service';
import { addMonthsClamped } from './subscription.service';
import { mergeAppConfig } from '../domain/app-config';
import { normalizeTrialEmail } from '../domain/trial-email';

/** Resultado del alta: trial = usó la prueba gratis; false = nació sin prueba (requiere pago). */
export interface CreatedCompany {
  id: string;
  trial: boolean;
}

export interface DaySchedule {
  key: string;
  label: string;
  enabled: boolean;
  ranges: { open: string; close: string }[];
}

export interface BlockedDate {
  id: string;
  date: string;
  reason: string;
}

export interface Company {
  id?: string;
  ownerId: string;
  name: string;
  slug: string;
  /** Valor de BUSINESS_CATEGORIES (core/domain/categories.ts). */
  category: string;
  description?: string;
  logoUrl?: string;
  logoIcon?: string;
  logoColor?: string;
  phone?: string;
  city?: string;
  address?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  isActive: boolean;
  isPublic: boolean;
  slotInterval: number;
  schedule: DaySchedule[];
  blockedDates?: BlockedDate[];
  disabledSlots?: Record<string, boolean>;
  autoConfirm?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private notifSvc = inject(NotificationService);

  /** Id nuevo para una empresa (el onboarding lo genera UNA vez y lo reusa en los reintentos). */
  newCompanyId(): string {
    return doc(collection(this.firestore, 'companies')).id;
  }

  /**
   * Alta de empresa ATÓMICA (sin Cloud Functions / plan Spark). En UNA transacción:
   *  - companies/{id}
   *  - subscriptions/{id}: trial si la persona nunca usó su prueba gratis (no existe trials/{uid}),
   *    si no { status: 'expired', currentPeriodEnd: ahora } → la empresa nace INACTIVA y tiene que pagar;
   *  - trials/{uid} y trialEmails/{correo normalizado} (marcadores "ya usó la prueba"), sólo en el caso
   *    trial: la prueba es una por uid Y por correo (cuenta borrada y recreada, alias de Gmail → sin trial).
   * Las reglas exigen exactamente esto: una empresa nunca existe sin suscripción (nunca vencería)
   * y la prueba gratis es una por persona, no una por empresa.
   * Idempotente con el mismo `companyId`: si ya existe (reintento tras un error de red con el commit
   * hecho) no crea nada y devuelve lo que hay.
   */
  async createCompany(data: Partial<Company>, companyId = this.newCompanyId()): Promise<CreatedCompany> {
    const uid      = this.auth.currentUser!.uid;
    const ref      = doc(this.firestore, 'companies', companyId);
    const subRef   = doc(this.firestore, 'subscriptions', companyId);
    const trialRef = doc(this.firestore, 'trials', uid);
    const cfgRef   = doc(this.firestore, 'config', 'app');

    // Reintento: la lectura de una empresa inexistente la deniegan las reglas; se consulta por dueño
    const mine = await this.getCompaniesByOwner(uid);
    const existing = mine.find(c => c.id === companyId);
    if (existing) return { id: companyId, trial: existing.isActive === true };

    // Marcador por correo (normalizado igual que en las reglas). Sin correo usable → sin trial.
    const emailId  = normalizeTrialEmail(this.auth.currentUser!.email);
    const emailRef = emailId ? doc(this.firestore, 'trialEmails', emailId) : null;

    const trial = await runTransaction(this.firestore, async (tx) => {
      const [trialSnap, cfgSnap, emailSnap] = await Promise.all([
        tx.get(trialRef), tx.get(cfgRef), emailRef ? tx.get(emailRef) : Promise.resolve(null),
      ]);
      // Prueba gratis UNA vez por persona: ni este uid ni este correo la usaron antes
      const withTrial = !trialSnap.exists() && !!emailSnap && !emailSnap.exists();

      tx.set(ref, {
        ...this._strip(data),
        ownerId:   uid,
        // Sin prueba disponible nace inactiva: no aparece en la búsqueda ni recibe reservas hasta pagar
        isActive:  withTrial,
        isPublic:  true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      if (withTrial) {
        // config/app en la misma transacción: las reglas topean trialEndDate con ese mismo valor
        const months = mergeAppConfig(cfgSnap.exists() ? cfgSnap.data() : null).trialMonths;
        tx.set(subRef, {
          companyId,
          status:         'trial',
          trialStartDate: serverTimestamp(),
          trialEndDate:   Timestamp.fromDate(addMonthsClamped(new Date(), months)),
        });
        tx.set(trialRef, { companyId, createdAt: serverTimestamp() });
        tx.set(emailRef!, { uid, companyId, createdAt: serverTimestamp() });
      } else {
        tx.set(subRef, { companyId, status: 'expired', currentPeriodEnd: serverTimestamp() });
      }
      return withTrial;
    });

    this.notifSvc.create({
      recipientId: 'admin',
      type: 'new_company',
      title: 'Nuevo negocio registrado',
      body: `${data.name ?? 'Sin nombre'} se registró${trial ? '' : ' (sin prueba gratis: ya la usó; tiene que pagar)'}`,
      link: '/admin/empresas',
    }).catch(() => {});
    return { id: companyId, trial };
  }

  async updateCompany(id: string, data: Partial<Company>): Promise<void> {
    await updateDoc(doc(this.firestore, 'companies', id), {
      ...this._strip(data),
      updatedAt: serverTimestamp(),
    });
  }

  private _strip<T extends object>(obj: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(obj).filter(([, v]) => v !== undefined)
    ) as Partial<T>;
  }

  async getCompany(id: string): Promise<Company | null> {
    const snap = await getDoc(doc(this.firestore, 'companies', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } as Company : null;
  }

  async getCompaniesByOwner(ownerId: string): Promise<Company[]> {
    const q = query(collection(this.firestore, 'companies'), where('ownerId', '==', ownerId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Company);
  }

  async searchCompanies(term: string, category?: string): Promise<Company[]> {
    let q = query(collection(this.firestore, 'companies'), where('isPublic', '==', true), where('isActive', '==', true));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Company)
      .filter((c) => {
        const matchName = c.name.toLowerCase().includes(term.toLowerCase());
        const matchCategory = category ? c.category === category : true;
        return matchName && matchCategory;
      });
  }
}
