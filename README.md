# AgendaZco

PWA de agendamiento de turnos para negocios de belleza en Colombia. Clientes reservan citas en segundos; negocios gestionan su agenda en tiempo real.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Angular 21 (Standalone, Signals) |
| Backend | Firebase (Auth, Firestore, Functions, FCM) |
| Estilos | SCSS global + inline styles (sin framework CSS) |
| Iconos | SVG inline (estilo Feather) |
| PWA | Angular Service Worker |
| Deploy | Firebase Hosting (pendiente) |

## Roles

| Rol | Ruta | Acceso |
|-----|------|--------|
| Público | `/` `/buscar` `/empresa/:id` | Sin login |
| Cliente | `/cliente/*` | Auth + role `client` |
| Empresa | `/empresa/*` | Auth + role `company` |
| Superadmin | `/admin/*` | Auth + role `superadmin` |

## Levantar en desarrollo

```bash
npm install --legacy-peer-deps
ng serve
```

> La app corre en `http://localhost:4200`

## Modo dev (bypassAuth)

`environment.ts` tiene el flag `bypassAuth: true` durante desarrollo. Esto desactiva todos los guards y muestra la barra de navegación DEV arriba con acceso directo a cada vista.

**Antes de producción:** cambiar a `bypassAuth: false`.

## Variables de entorno

`src/environments/environment.ts` — desarrollo  
`src/environments/environment.prod.ts` — producción

Ambos usan el proyecto Firebase `agendago-b8ea6`. Completar `vapidKey` en Firebase Console → Cloud Messaging → Web Push certificates.

## Firestore — reglas mínimas

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## Estructura de carpetas

```
src/app/
├── core/
│   ├── guards/          auth.guard, role.guard
│   └── services/        auth.service
├── shared/
│   └── components/      public-nav, dev-nav
└── features/
    ├── public/          landing, search, company-profile
    ├── auth/            login, register, forgot-password
    ├── client/          appointments
    ├── company/         dashboard, profile, services, schedule
    └── admin/           companies, users, metrics
```

## Documentación

| Archivo | Contenido |
|---------|-----------|
| `docs/PRD.md` | Product Requirements Document |
| `docs/ARCHITECTURE.md` | Decisiones técnicas y arquitectura |
| `docs/FIREBASE.md` | Setup y configuración Firebase |
