import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, doc, addDoc, updateDoc, getDocs,
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
  status: 'scheduled' | 'cancelled' | 'completed';
  cancelledBy?: 'client' | 'company';
  source: 'app' | 'manual';
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private firestore = inject(Firestore);

  /** Calcula slots disponibles dado el horario de la empresa y citas existentes */
  calculateAvailableSlots(
    date: string,
    openTime: string,
    closeTime: string,
    slotDuration: number,
    existingAppointments: Appointment[]
  ): string[] {
    const slots: string[] = [];
    const [openH, openM] = openTime.split(':').map(Number);
    const [closeH, closeM] = closeTime.split(':').map(Number);
    let current = openH * 60 + openM;
    const end = closeH * 60 + closeM;

    const occupied = new Set(existingAppointments.map((a) => a.startTime));

    while (current + slotDuration <= end) {
      const hh = String(Math.floor(current / 60)).padStart(2, '0');
      const mm = String(current % 60).padStart(2, '0');
      const slot = `${hh}:${mm}`;
      if (!occupied.has(slot)) slots.push(slot);
      current += slotDuration;
    }
    return slots;
  }

  /** Transacción: verifica disponibilidad y crea la cita atómicamente */
  async bookAppointment(data: Omit<Appointment, 'id' | 'status'>): Promise<string> {
    const ref = doc(collection(this.firestore, 'appointments'));
    await runTransaction(this.firestore, async (tx) => {
      const conflictQuery = query(
        collection(this.firestore, 'appointments'),
        where('companyId', '==', data.companyId),
        where('date', '==', data.date),
        where('startTime', '==', data.startTime),
        where('status', '==', 'scheduled')
      );
      const existing = await getDocs(conflictQuery);
      if (!existing.empty) throw new Error('SLOT_TAKEN');
      tx.set(ref, { ...data, status: 'scheduled', source: 'app', createdAt: serverTimestamp() });
    });
    return ref.id;
  }

  async createManualAppointment(data: Omit<Appointment, 'id' | 'status'>): Promise<string> {
    const ref = await addDoc(collection(this.firestore, 'appointments'), {
      ...data, status: 'scheduled', source: 'manual', createdAt: serverTimestamp(),
    });
    return ref.id;
  }

  async cancelAppointment(id: string, cancelledBy: 'client' | 'company'): Promise<void> {
    await updateDoc(doc(this.firestore, 'appointments', id), {
      status: 'cancelled', cancelledBy, updatedAt: serverTimestamp(),
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
      return onSnapshot(q, (snap) =>
        observer.next(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Appointment))
      );
    });
  }

  async getByCompanyAndDate(companyId: string, date: string): Promise<Appointment[]> {
    const q = query(
      collection(this.firestore, 'appointments'),
      where('companyId', '==', companyId),
      where('date', '==', date),
      where('status', '==', 'scheduled')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Appointment);
  }

  async getByClient(clientId: string): Promise<Appointment[]> {
    const q = query(
      collection(this.firestore, 'appointments'),
      where('clientId', '==', clientId),
      orderBy('date', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Appointment);
  }
}
