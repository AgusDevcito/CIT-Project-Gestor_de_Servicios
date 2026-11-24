# Spec 003 — Experiencia de Usuario, Gestión Personal, Trazabilidad y Notificaciones (5 Niveles)

**Estado**: Implementado y verificado (Niveles 1 a 5 completados)  
**Ubicación**: `frontend/specs/003-experiencia-usuario/spec.md`

---

## 1. Objetivo

Evolucionar la experiencia de usuario de **CITio** hacia una plataforma centrada en el productor agropecuario, las entidades/cooperativas y el personal del **CIT Formosa**, organizando las mejoras en **5 niveles incrementales** que abarcan navegación intuitiva, sección de capacitaciones, seguimiento visual por línea de tiempo, centro de ajustes, entrega digital de resultados, métricas de impacto, perfil de entidad/cooperativa y notificaciones multicanal (plataforma, correo y WhatsApp).

---

## 2. División por Niveles y Requisitos Funcionales

### Nivel 1 — Navegación UX, Capacitaciones, `Mis Servicios`, `Proponer`, `Ajustes/Propuestas` y Línea de Seguimiento Visual
| ID | Requisito Funcional |
|---|---|
| **RF-N1-01** | **Sección `Capacitaciones` (`/capacitaciones`)**: Catálogo dedicado de actividades formativas del CIT (`capacitacion`, `jornada`, `inscripcion`), con filtro por sector/búsqueda, inscripción en 1 clic para usuarios autenticados, indicador de estado (`INSCRIPTO`, `EN_CURSO`, `FINALIZADO`) y panel para que el personal `cit`/`admin` gestione el estado de los inscriptos (`GET /api/capacitaciones/:publicacionId/inscriptos`, `PATCH /api/capacitaciones/inscripciones/:id/estado`). |
| **RF-N1-02** | **Apartado `Mis Servicios` (`/mis-servicios`)**: Panel unificado del usuario autenticado que lista: (1) **Servicios contratados/solicitados** (con estado, enlace al servicio, línea de tiempo y opción de cancelar si está `PENDIENTE` o eliminar) y (2) **Capacitaciones inscriptas** (con estado formativo, observaciones y acceso a la capacitación). |
| **RF-N1-03** | **Renombrar `Propuestas` a `Proponer` (`/proponer`)**: La sección de menú pasa a llamarse **Proponer** y muestra el formulario de presentación de propuestas sin listar debajo todas las propuestas enviadas. Incluye un botón/enlace **«Ver tus propuestas»** que dirige a `/ajustes/propuestas`. Se mantiene redirección desde `/propuestas` hacia `/proponer` por retrocompatibilidad. |
| **RF-N1-04** | **Apartado `Ajustes` con ícono de tuerquita ⚙️ (`/ajustes/*`) y subsección `Ajustes/Propuestas` (`/ajustes/propuestas`)**: Acceso en la barra superior (ícono de tuerquita ⚙️) y navegación lateral. En `/ajustes/propuestas` se listan las propuestas del usuario con sus detalles, dictamen/revisión del CIT, línea visual de seguimiento, opción de **Cancelar propuesta** (`PATCH /api/propuestas/:id/cancelar` mientras esté en estado `PENDIENTE` o `EN_REVISION`) y eliminación. |
| **RF-N1-05** | **Línea visual de seguimiento (`StatusTimeline`)**: Componente visual reutilizable que representa los hitos de progreso (`Enviada/Pendiente` → `En Revisión` → `Dictamen / Aprobada / Rechazada / Finalizada / Cancelada`) con fechas y responsable, integrado tanto en **Mis Servicios** como en **Ajustes/Propuestas**. |

---

### Nivel 2 — Entrega Digital de Resultados (Informes PDF en Solicitudes)
| ID | Requisito Funcional |
|---|---|
| **RF-N2-01** | Extender `Solicitud` con `resultado_archivo_url`, `resultado_nombre`, `resultado_observaciones` y `fecha_entrega_resultado`. |
| **RF-N2-02** | Permitir a `cit`/`admin` adjuntar un informe o certificado oficial (PDF/PNG/JPG validado) al actualizar/finalizar una solicitud. |
| **RF-N2-03** | Habilitar la descarga protegida del resultado oficial desde **Mis Servicios** y reflejar el hito de entrega en `StatusTimeline`. |

---

### Nivel 3 — Limpieza de `Inicio` + Panel Visual de Métricas
| ID | Requisito Funcional |
|---|---|
| **RF-N3-01** | Eliminar de `Home.tsx` las secciones de *Servicios destacados* y *Capacitaciones, formación y actividades*. |
| **RF-N3-02** | Exponer `GET /api/metricas/resumen` con indicadores reales de impacto provincial y operativo. |
| **RF-N3-03** | Renderizar en `Home.tsx` el **Panel Visual de Métricas** (KPIs de servicios activos, solicitudes por estado, propuestas convertidas en servicios, capacitaciones e índice de satisfacción). |

---

### Nivel 4 — `Ajustes/Perfil`, `Ajustes/Mi Cuenta` y Perfil de Entidad / Cooperativa
| ID | Requisito Funcional |
|---|---|
| **RF-N4-01** | En `/perfil`, mostrar vista resumen limpia con botón **«Editar perfil»** que lleva a `/ajustes/perfil`. |
| **RF-N4-02** | En `/ajustes/perfil`, centralizar actualización de datos personales, URL del avatar, cambio de contraseña y datos de **Entidad / Cooperativa** (`tipo_perfil`, `razon_social`, `cuit`, `localidad`, `telefono_whatsapp`). |
| **RF-N4-03** | En `/ajustes/mi-cuenta`, permitir la baja/eliminación segura de cuenta con validación de contraseña y confirmación explícita. |
| **RF-N4-04** | Permitir a cuentas de tipo `ENTIDAD_COOPERATIVA` presentar solicitudes y propuestas en representación de un productor asociado. |

---

### Nivel 5 — Centro de Notificaciones (Campanilla 🔔 + `Ajustes/Notificaciones` + WhatsApp)
| ID | Requisito Funcional |
|---|---|
| **RF-N5-01** | Incorporar campanilla 🔔 en la barra superior (al lado del perfil y la tuerquita de Ajustes) con contador de no leídas y vista `/notificaciones`. |
| **RF-N5-02** | Generar notificaciones ante nuevas publicaciones, cambios de estado de propuestas, nuevos servicios, actividad de solicitudes/capacitaciones y anuncios de plataforma. |
| **RF-N5-03** | En `/ajustes/notificaciones`, permitir elegir qué avisos recibir y por qué canales (`PLATAFORMA`, `EMAIL`, `WHATSAPP`). |
| **RF-N5-04** | Integrar proveedor de notificaciones vía **WhatsApp** conectado al patrón `OutboxNotification` con modo sandbox para demos. |

---

## 3. Matriz de Permisos del Nivel 1

| Ruta / Acción | Visitante | `user` | `cit` | `admin` |
|---|---|---|---|---|
| `/capacitaciones` (explorar catálogo) | ✔️ | ✔️ | ✔️ | ✔️ |
| Inscribirse a capacitación | | ✔️ | ✔️ | ✔️ |
| Gestionar estado de inscriptos en capacitación | | | ✔️ | ✔️ |
| `/mis-servicios` (servicios contratados + mis capacitaciones) | | ✔️ | ✔️ | ✔️ |
| Cancelar solicitud propia (`PENDIENTE`) | | ✔️ | | |
| `/proponer` (formulario de propuesta + acceso a `/ajustes/propuestas`) | | ✔️ | 👁️ (vista informativa) | 👁️ (vista informativa) |
| `/ajustes` y `/ajustes/propuestas` | | ✔️ | ✔️ | ✔️ |
| Cancelar propuesta propia (`PENDIENTE` / `EN_REVISION`) | | ✔️ | | |

---

## 4. Criterios de Aceptación del Nivel 1 (CA-N1)

- **CA-N1-1 (`StatusTimeline`)**: Renderiza los pasos de una solicitud o propuesta indicando visualmente los pasos completados, el paso actual (o estado rechazado/cancelado), fechas y metadatos del dictamen.
- **CA-N1-2 (`Capacitaciones`)**: Lista las publicaciones formativas (`capacitacion`, `jornada`, `inscripcion`), permite inscribirse sin salir de la página, refleja si el usuario ya está inscripto con su estado (`Inscripto`, `En curso`, `Finalizado`) y permite al personal CIT actualizar dicho estado.
- **CA-N1-3 (`Mis Servicios`)**: Muestra en `/mis-servicios` los servicios solicitados/contratados por el usuario (con `StatusTimeline` y opción de cancelar en estado `PENDIENTE`) y las capacitaciones en las que está inscripto.
- **CA-N1-4 (`Proponer`)**: El menú lateral muestra **Proponer** (`/proponer`), presenta directamente el formulario de propuesta sin el listado inferior de propuestas enviadas, y ofrece el botón **«Ver tus propuestas»** hacia `/ajustes/propuestas`. La ruta `/propuestas` redirige a `/proponer`.
- **CA-N1-5 (`Ajustes` ⚙️ y `Ajustes/Propuestas`)**: La barra superior incluye el botón de tuerquita ⚙️ hacia `/ajustes`. En `/ajustes/propuestas` el usuario ve el listado de sus propuestas, su detalle/dictamen con `StatusTimeline` y puede cancelar propuestas propias en estado `PENDIENTE` (`PATCH /api/propuestas/:id/cancelar`).
