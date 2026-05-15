import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, doc, addDoc, updateDoc, getDocs, deleteDoc,
  query, where, runTransaction, serverTimestamp, onSnapshot, orderBy,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

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
  status: 'pending' | 'scheduled' | 'cancelled' | 'completed';
  cancelledBy?: 'client' | 'company';
  source: 'app' | 'manual';
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private firestore = inject(Firestore);

  private toMin(t: string): number {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  private toTime(min: number): string {
    return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
  }

  /** Calcula slots disponibles según intervalo, duración real del servicio y cantidad de staff */
  calculateAvailableSlots(
    openTime: string,
    closeTime: string,
    slotInterval: number,
    serviceDuration: number,
    staffCount: number,
    existingAppointments: Appointment[]
  ): string[] {
    const slots: string[] = [];
    const open  = this.toMin(openTime);
    const close = this.toMin(closeTime);

    for (let cur = open; cur + serviceDuration <= close; cur += slotInterval) {
      const slotEnd = cur + serviceDuration;
      const overlapping = existingAppointments.filter(a => {
        const aStart = this.toMin(a.startTime);
        const aEnd   = this.toMin(a.endTime);
        return aStart < slotEnd && aEnd > cur;
      });
      if (overlapping.length < staffCount) {
        slots.push(this.toTime(cur));
      }
    }
    return slots;
  }

  /** Transacción: verifica disponibilidad por solapamiento real y staffCount */
  async bookAppointment(
    data: Omit<Appointment, 'id' | 'status'>,
    staffCount: number = 1
  ): Promise<string> {
    const ref = doc(collection(this.firestore, 'appointments'));
    await runTransaction(this.firestore, async (tx) => {
      const dayQuery = query(
        collection(this.firestore, 'appointments'),
        where('companyId', '==', data.companyId),
        where('date', '==', data.date),
        where('status', 'in', ['pending', 'scheduled'])
      );
      const snap = await getDocs(dayQuery);
      const newStart = this.toMin(data.startTime);
      const newEnd   = this.toMin(data.endTime);
      const overlapping = snap.docs.filter(d => {
        const a = d.data() as Appointment;
        return this.toMin(a.startTime) < newEnd && this.toMin(a.endTime) > newStart;
      });
      if (overlapping.length >= staffCount) throw new Error('SLOT_TAKEN');
      const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
      tx.set(ref, { ...clean, status: 'pending', createdAt: serverTimestamp() });
    });
    return ref.id;
  }

  async createManualAppointment(data: Omit<Appointment, 'id' | 'status'>): Promise<string> {
    const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    const ref = await addDoc(collection(this.firestore, 'appointments'), {
      ...clean, status: 'scheduled', source: 'manual', createdAt: serverTimestamp(),
    });
    return ref.id;
  }

  async confirmAppointment(id: string): Promise<void> {
    await updateDoc(doc(this.firestore, 'appointments', id), {
      status: 'scheduled', updatedAt: serverTimestamp(),
    });
  }

  async completeAppointment(id: string): Promise<void> {
    await updateDoc(doc(this.firestore, 'appointments', id), {
      status: 'completed', updatedAt: serverTimestamp(),
    });
  }

  async cancelAppointment(id: string, cancelledBy: 'client' | 'company'): Promise<void> {
    await updateDoc(doc(this.firestore, 'appointments', id), {
      status: 'cancelled', cancelledBy, updatedAt: serverTimestamp(),
    });
  }

  async deleteAppointment(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'appointments', id));
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

  async getByCompanyAndDate(companyId: string, date: string): Promise<Appointment[]> {
    const q = query(
      collection(this.firestore, 'appointments'),
      where('companyId', '==', companyId),
      where('date', '==', date),
      where('status', 'in', ['pending', 'scheduled'])
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Appointment);
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
