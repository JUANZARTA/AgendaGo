import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode, EnvironmentProviders, Provider } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth, connectAuthEmulator } from '@angular/fire/auth';
import { provideFirestore, getFirestore, connectFirestoreEmulator } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideMessaging, getMessaging } from '@angular/fire/messaging';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

const firebaseConfigured = environment.firebase.apiKey !== 'YOUR_API_KEY';

const firebaseProviders: (Provider | EnvironmentProviders)[] = firebaseConfigured
  ? [
      provideFirebaseApp(() => initializeApp(environment.firebase)),
      provideAuth(() => {
        const auth = getAuth();
        if (environment.useEmulators) connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
        return auth;
      }),
      provideFirestore(() => {
        const fs = getFirestore();
        if (environment.useEmulators) connectFirestoreEmulator(fs, 'localhost', 8080);
        return fs;
      }),
      provideStorage(() => getStorage()),
      provideMessaging(() => getMessaging()),
    ]
  : [];

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    ...firebaseProviders,
  ],
};
