# Funcionalidades fuera del MVP

---

## Dominio personalizado (no comprado)

**Opciones evaluadas**

| Dominio | Precio año 1 | Renovación anual | Estado |
|---------|-------------|-----------------|--------|
| agendaco.online | CO$ 4.900 | ~CO$ 150.900 | Recomendado |
| agendaco.site | CO$ 3.900 | ~CO$ 141.900 | Alternativa |
| agendaco.xyz | CO$ 7.900 | ~CO$ 68.900 | Descartado (mala reputación) |

**Notas**
- Registrar evaluado: GoDaddy
- Para conectar: Firebase Console → Hosting → "Add custom domain" → cargar 2 registros DNS en el registrar → activo en ~24h con HTTPS automático
- Sin contrato de permanencia: si no se renueva, el dominio expira sin penalidades

---

Features evaluadas y documentadas, pendientes de implementación post-lanzamiento.

---

## Tour de bienvenida (onboarding interactivo)

**Descripción**
Guía paso a paso que se muestra al usuario la primera vez que entra a la app, resaltando los elementos clave de la interfaz con tooltips superpuestos.

**Motivación**
Reducir la fricción de los nuevos usuarios sin necesidad de documentación externa ni soporte.

**Librería recomendada**
[Driver.js](https://driverjs.com/) — vanilla JS, sin dependencias de framework, ~5KB gzip. Compatible con Angular sin adaptadores.

**Alcance propuesto**

| Tour | Pasos |
|------|-------|
| Cliente | Buscar negocios → Mis citas → Mensajes → Notificaciones → Perfil |
| Empresa | Panel → Citas del día → Servicios → Staff → Mensajes → Configuración |

**Condición de disparo**
- Primera vez: flag `tourCompleted` en `localStorage` (o en el perfil de Firestore si se quiere persistir entre dispositivos).
- Re-lanzar: botón "?" o "Ver tour" en el perfil/configuración.

**Complejidad estimada**

| Alcance | Estimación |
|---------|-----------|
| Solo navbar del cliente (elementos estáticos) | 2–3 horas |
| Tour cliente con navegación entre rutas | 1–2 días |
| Tour cliente + empresa completo | 2–3 días |

**Puntos complejos a resolver**
1. **Routing entre pasos**: Driver.js no maneja Angular Router. Hay que combinar `Router.navigate()` + esperar que el DOM cargue antes de avanzar al siguiente paso (usar `afterNextRender` o delay con polling).
2. **Elementos dinámicos**: algunos elementos aparecen después de que Firestore devuelve datos. El tour debe esperar que existan en el DOM antes de resaltarlos.
3. **Dos flujos distintos**: cliente y empresa tienen shells separados → dos tours independientes.

**Notas de implementación**
```
npm install driver.js
```
Crear un `TourService` que encapsule los pasos y sea invocado desde cada shell component (`ClientShellComponent`, `CompanyShellComponent`) en el primer login.

---

## Expiración de citas pendientes sin confirmar

**Problema**
Si una cita queda en estado `pending` y llega o pasa la hora acordada sin que la empresa la confirme, el estado queda inconsistente — la cita "ocurrió" pero nunca fue gestionada.

**Decisión actual (MVP)**
No se cancela automáticamente. Las citas vencidas se muestran visualmente diferenciadas (badge "Vencida" o grisadas) pero el estado en Firestore no cambia. Implementación: comparar `appointment.date + appointment.time` con `Date.now()` al renderizar.

**Solución post-MVP recomendada: Ventana de confirmación (Opción B)**
Dar a la empresa un plazo para confirmar (ej. hasta 1h antes del turno). Si no confirma, una Cloud Function con cron cancela la cita automáticamente y notifica al cliente.

**Opciones evaluadas**

| Opción | Descripción | Requiere |
|--------|-------------|----------|
| A — Expirar automáticamente | Cron revisa cada X min y cancela pendientes pasadas | Cloud Functions deployadas |
| B — Ventana de confirmación | Cancela si no confirman X horas antes | Cloud Functions + config por empresa |
| C — Visual únicamente *(elegida para MVP)* | Badge "Vencida" en UI, sin tocar Firestore | Solo frontend |

**Condición para activar Opción B**
- Cloud Functions deployadas y estables en producción
- Definir ventana por empresa (campo `confirmationWindowHours` en Firestore)
- Notificación al cliente: "Tu cita no fue confirmada a tiempo y fue cancelada automáticamente"
