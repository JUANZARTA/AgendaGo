import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, doc, getDoc, getDocs,
  query, where, runTransaction, serverTimestamp, onSnapshot, orderBy,
  Transaction, DocumentReference,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { DAY_KEYS, TimedAppointment, hasCapacity, toMin, toTime } from '../domain/scheduling';
import { parseLocalDate, toLocalDateKey } from '../utils/date.utils';

export interface Appointment {
  id?: string;
  companyId: string;
  companyName: string;
  serviceId: string;
  serviceName: string;
  serviceDuration: number;
  clientId?: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  isGuestClient: boolean;
  date: string;
  startTime: string;
  endTime: string;
  price?: number;
  clientNote?: string;
  staffId?: string;
  staffName?: string;
  status: 'pending' | 'scheduled' | 'cancelled' | 'completed';
  cancelledBy?: 'client' | 'company';
  source: 'app' | 'manual';
  /** El cliente la ocultó de su historial (no se borra: alimenta estadísticas de la empresa). */
  hiddenByClient?: boolean;
}

/** Opciones de reserva: grilla de la empresa y restricciones de agenda. */
export interface BookingOptions {
  slotInterval?: number;
  blockedDates?: { date: string }[];
  disabledSlots?: Record<string, boolean>;
}

/**
 * Ocupación pública SIN datos personales. Un doc por empresa y día:
 * `slotLocks/{companyId}_{date}` = { companyId, date, entries: SlotLockEntry[], updatedAt }.
 * Las reglas exigen que cada entry nueva corresponda a una cita creada en la MISMA transacción
 * y sólo permiten quitar entries de citas canceladas o eliminadas.
 */
export interface SlotLockEntry {
  aptId: string;
  staffId: string | null;
  startTime: string;
  endTime: string;
}

/** Tope de entries por día (debe coincidir con firestore.rules). */
export const MAX_LOCK_ENTRIES = 300;

export function slotLockId(companyId: string, date: string): string {
  return `${companyId}_${date}`;
}

type LockUpdate = { ref: DocumentReference; entries: SlotLockEntry[] };

/**
 * Si dos transacciones modifican el mismo lock a la vez, las reglas evalúan la segunda contra el
 * lock YA modificado y la rechazan con permission-denied (antes que el conflicto de concurrencia),
 * así que el SDK no reintenta solo. Reintentamos: la nueva lectura ve el estado real
 * (p.ej. el slot ya tomado → SLOT_TAKEN). Un permission-denied genuino se propaga tras los reintentos.
 */
async function withLockRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e: any) {
      if (e?.code !== 'permission-denied' || i >= attempts) throw e;
    }
  }
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private firestore = inject(Firestore);

  private toMin(t: string): number { return toMin(t); }
  private toTime(min: number): string { return toTime(min); }

  private lockRef(companyId: string, date: string): DocumentReference {
    return doc(this.firestore, 'slotLocks', slotLockId(companyId, date));
  }

  /**
   * Calcula slots disponibles según intervalo, duración real del servicio y cantidad de staff.
   * Si se pasa `staffId`, se valida la disponibilidad de ese profesional (las citas sin staff
   * asignado también consumen capacidad).
   */
  calculateAvailableSlots(
    openTime: string,
    closeTime: string,
    slotInterval: number,
    serviceDuration: number,
    staffCount: number,
    existingAppointments: TimedAppointment[],
    staffId?: string | null
  ): string[] {
    const slots: string[] = [];
    const open  = this.toMin(openTime);
    const close = this.toMin(closeTime);

    for (let cur = open; cur + serviceDuration <= close; cur += slotInterval) {
      if (hasCapacity(existingAppointments, cur, cur + serviceDuration, staffId, staffCount)) {
        slots.push(this.toTime(cur));
      }
    }
    return slots;
  }

  /**
   * Ocupación pública del día (sin PII) leída de `slotLocks`. La reserva pública la usa
   * en lugar de leer `appointments` (que ya no son legibles por terceros).
   */
  async getDayOccupancy(companyId: string, date: string): Promise<SlotLockEntry[]> {
    const snap = await getDoc(this.lockRef(companyId, date));
    return snap.exists() ? (((snap.data() as any).entries ?? []) as SlotLockEntry[]) : [];
  }

  /**
   * Transacción: lee el lock del día (`slotLocks/{companyId}_{date}`), verifica solapamiento
   * y capacidad contra sus entries, y escribe cita + entry de forma atómica.
   * Dos reservas concurrentes del mismo día compiten por el mismo doc: una reintenta y ve a la otra.
   * `staffCount` es la capacidad TOTAL del servicio (también cuando se elige un profesional).
   */
  async bookAppointment(
    data: Omit<Appointment, 'id' | 'status'>,
    staffCount: number = 1,
    autoConfirm: boolean = false,
    opts: BookingOptions = {}
  ): Promise<string> {
    this.assertBookable(data, opts);
    return withLockRetry(() => this.bookInTransaction(data, staffCount, autoConfirm ? 'scheduled' : 'pending'));
  }

  /** Cita manual del dueño: mismo chequeo de conflictos, siempre 'scheduled'. */
  async createManualAppointment(
    data: Omit<Appointment, 'id' | 'status'>,
    staffCount: number = 1,
    _opts: BookingOptions = {}
  ): Promise<string> {
    return withLockRetry(() => this.bookInTransaction({ ...data, source: 'manual' }, staffCount, 'scheduled'));
  }

  /** Rechaza fechas bloqueadas y slots deshabilitados por la empresa. */
  private assertBookable(data: Pick<Appointment, 'date' | 'startTime'>, opts: BookingOptions) {
    if (opts.blockedDates?.some(b => b.date === data.date)) throw new Error('DATE_BLOCKED');
    if (opts.disabledSlots) {
      const dayKey = DAY_KEYS[parseLocalDate(data.date).getDay()];
      if (opts.disabledSlots[`${dayKey}-${data.startTime}`]) throw new Error('SLOT_DISABLED');
    }
  }

  private async bookInTransaction(
    data: Omit<Appointment, 'id' | 'status'>,
    staffCount: number,
    status: 'pending' | 'scheduled'
  ): Promise<string> {
    const ref     = doc(collection(this.firestore, 'appointments'));
    const lockRef = this.lockRef(data.companyId, data.date);
    const newStart = this.toMin(data.startTime);
    const newEnd   = this.toMin(data.endTime);

    await runTransaction(this.firestore, async (tx) => {
      const lockSnap = await tx.get(lockRef);
      const entries = (lockSnap.exists() ? ((lockSnap.data() as any).entries ?? []) : []) as SlotLockEntry[];

      if (!hasCapacity(entries, newStart, newEnd, data.staffId, staffCount)) throw new Error('SLOT_TAKEN');
      if (entries.length >= MAX_LOCK_ENTRIES) throw new Error('SLOT_TAKEN');

      const entry: SlotLockEntry = {
        aptId: ref.id,
        staffId: data.staffId ?? null,
        startTime: data.startTime,
        endTime: data.endTime,
      };
      tx.set(lockRef, {
        companyId: data.companyId,
        date: data.date,
        entries: [...entries, entry],
        updatedAt: serverTimestamp(),
      });
      const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
      tx.set(ref, { ...clean, status, createdAt: serverTimestamp() });
    });
    return ref.id;
  }

  /** Lee (tx.get) el lock del día y devuelve las entries sin `aptId`, o null si no hay nada que quitar. */
  private async readLockWithout(tx: Transaction, apt: Appointment, aptId: string): Promise<LockUpdate | null> {
    if (!apt.companyId || !apt.date) return null;
    const ref  = this.lockRef(apt.companyId, apt.date);
    const snap = await tx.get(ref);
    if (!snap.exists()) return null; // cita legacy sin lock
    const entries = ((snap.data() as any).entries ?? []) as SlotLockEntry[];
    const remaining = entries.filter(e => e.aptId !== aptId);
    return remaining.length === entries.length ? null : { ref, entries: remaining };
  }

  private writeLock(tx: Transaction, apt: Appointment, lock: LockUpdate) {
    tx.set(lock.ref, {
      companyId: apt.companyId,
      date: apt.date,
      entries: lock.entries,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Cambio de estado validado dentro de una transacción.
   * Si el nuevo estado libera el horario (cancelled) se quita la entry del lock en la MISMA transacción.
   */
  private async transition(
    id: string,
    resolve: (current: Appointment) => Partial<Appointment> | null
  ): Promise<void> {
    const ref = doc(this.firestore, 'appointments', id);
    await withLockRetry(() => runTransaction(this.firestore, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('NOT_FOUND');
      const apt = snap.data() as Appointment;
      const patch = resolve(apt);
      if (!patch) return; // ya está en el estado destino: idempotente
      // Todas las lecturas antes de cualquier escritura
      const lock = patch.status === 'cancelled' ? await this.readLockWithout(tx, apt, id) : null;
      tx.update(ref, { ...patch, updatedAt: serverTimestamp() });
      if (lock) this.writeLock(tx, apt, lock);
    }));
  }

  async confirmAppointment(id: string): Promise<void> {
    await this.transition(id, (a) => {
      if (a.status === 'scheduled') return null;
      if (a.status !== 'pending') throw new Error('INVALID_TRANSITION');
      return { status: 'scheduled' };
    });
  }

  async completeAppointment(id: string): Promise<void> {
    await this.transition(id, (a) => {
      if (a.status === 'completed') return null;
      if (a.status !== 'scheduled' && a.status !== 'pending') throw new Error('INVALID_TRANSITION');
      // Sólo se bloquea si la fecha es claramente futura (día posterior a hoy)
      if (a.date > toLocalDateKey()) throw new Error('FUTURE_APPOINTMENT');
      return { status: 'completed' };
    });
  }

  async cancelAppointment(id: string, cancelledBy: 'client' | 'company'): Promise<void> {
    await this.transition(id, (a) => {
      if (a.status === 'cancelled') return null;
      if (a.status !== 'pending' && a.status !== 'scheduled') throw new Error('INVALID_TRANSITION');
      return { status: 'cancelled', cancelledBy };
    });
  }

  /** Borra la cita y libera su entry del lock en la misma transacción. */
  async deleteAppointment(id: string): Promise<void> {
    const ref = doc(this.firestore, 'appointments', id);
    await withLockRetry(() => runTransaction(this.firestore, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const apt  = snap.data() as Appointment;
      const lock = await this.readLockWithout(tx, apt, id);
      tx.delete(ref);
      if (lock) this.writeLock(tx, apt, lock);
    }));
  }

  /**
   * El cliente oculta una cita completada/cancelada de su historial.
   * No se borra: las completadas alimentan ingresos/estadísticas de la empresa.
   */
  async hideForClient(id: string): Promise<void> {
    await runTransaction(this.firestore, async (tx) => {
      const ref  = doc(this.firestore, 'appointments', id);
      const snap = await tx.get(ref);
      if (!snap.exists() || (snap.data() as Appointment).hiddenByClient) return;
      tx.update(ref, { hiddenByClient: true, updatedAt: serverTimestamp() });
    });
  }

  /** Stream en tiempo real para el dashboard de empresa */
  watchByCompanyAndDate(companyId: string, date: string): Observable<Appointment[]> {
    return new Observable((observer) => {
      const q = query(
        collection(this.firestore, 'appointments'),
        where('companyId', '==', companyId),
        where('date', '==', date),
        orderBy('startTime')
      );
      const unsub = onSnapshot(
        q,
        (snap) => observer.next(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Appointment)),
        (err)  => observer.error(err)
      );
      return unsub;
    });
  }

  async getByClient(clientId: string): Promise<Appointment[]> {
    const q = query(
      collection(this.firestore, 'appointments'),
      where('clientId', '==', clientId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Appointment);
  }

  /** Stream en tiempo real de citas del cliente (no requiere índice compuesto) */
  watchByClient(clientId: string): Observable<Appointment[]> {
    return new Observable((observer) => {
      const q = query(
        collection(this.firestore, 'appointments'),
        where('clientId', '==', clientId)
      );
      const unsub = onSnapshot(
        q,
        (snap) => {
          const apts = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Appointment);
          apts.sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));
          observer.next(apts);
        },
        (err) => { console.error('[Appointments] snapshot error:', err); observer.error(err); }
      );
      return unsub;
    });
  }
}
