# Funcionalidades fuera del MVP

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
