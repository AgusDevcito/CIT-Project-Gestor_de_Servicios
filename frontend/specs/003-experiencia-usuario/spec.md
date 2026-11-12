# Spec 003 — Experiencia de Usuario, Gestión Personal y Notificaciones

**Estado**: En planificación – pendiente de revisión y aprobación del usuario.
**Ubicación**: `frontend/specs/003-experiencia-usuario/spec.md`

---

## 1. Objetivo
Crear una experiencia de usuario coherente y segura que centralice la gestión personal, mantenga la trazabilidad institucional y añada un sistema de notificaciones interno.

---

## 2. Requisitos funcionales y reglas de negocio

### 2.1 Navegación y Home (Fase A)
| RF‑A01 | La barra lateral debe contener los siguientes ítems, visibles según rol: **Inicio**, **Servicios**, **Publicaciones**, **Proponer**, **Mis Servicios**, **Notificaciones**, **Perfil**, **Ajustes**; y **Solicitudes** solo para `cit`/`admin`. |
| RF‑A02 | En el `TopHeader` debe aparecer una campanilla que muestra el número de notificaciones no leídas y enlaza a `/notificaciones`. |
| RF‑A03 | El Home institucional debe mostrar solo contenido estático (bienvenida, descripción institucional). Los bloques de *Servicios destacados*, *Capacitaciones* y *Formación y actividades* deben eliminarse. |
| RF‑A04 | Los usuarios anónimos pueden acceder a `/`, `/servicios`, `/publicaciones` y sus detalles. Acceso a rutas protegidas redirige a `/login`. |

### 2.2 Ajustes (`/ajustes`) – B.1 a B.4 (Fase B)
#### B.1 Mi Perfil
| RF‑B01 | Permitir edición de nombre, apellido, bio, URL de avatar y cambio de contraseña. Correo, nombre de usuario y rol son solo lectura. |
| RF‑B02 | La actualización de contraseña requiere revalidación de la contraseña actual y debe cumplir la política mínima (8 caracteres, al menos una letra y un número). |
| RF‑B03 | El rol del usuario es inmutable desde la UI y el endpoint correspondiente. |
#### B.2 Propuestas
| RF‑B04 | Listar **solo** las propuestas presentadas por el usuario autenticado, mostrando nombre, organismo, área, fecha, estado y observaciones públicas del CIT. |
| RF‑B05 | Cancelación de propuesta está **pendiente de decisión**. Se identifican como posible alternativa: (a) permitir cancelación en estado `PENDIENTE` mediante endpoint `PATCH /api/propuestas/:id/cancelar`; (b) mantener la propuesta inalterable. |
#### B.3 Notificaciones
| RF‑B06 | Permitir al usuario activar/desactivar cada una de las cinco categorías de notificación (ver sección 2.7). Las preferencias se persisten en la base de datos y se aplican en tiempo de generación de notificaciones. |
#### B.4 Mi Cuenta
| RF‑B07 | El flujo de eliminación de cuenta debe: (i) solicitar confirmación escrita (`ELIMINAR`), (ii) validar la contraseña actual, (iii) ejecutar una **desactivación + anonimización** de datos personales dentro de una transacción, (iv) **no** eliminar automáticamente propuestas o solicitudes pendientes – esa política queda pendiente de decisión. |

### 2.3 Mis Servicios (`/mis-servicios`) – C.1 y C.2 (Fase C)
| RF‑C01 | Mostrar una lista de **Servicios contratados** (solicitudes) del usuario con: nombre del servicio, sector, fecha, estado actual y botón *Ver detalle* que enlaza a `/servicios/:id`. Si el estado es `PENDIENTE` se muestra botón *Cancelar solicitud* que activa `PATCH /api/solicitudes/:id/cancelar`. |
| RF‑C02 | Mostrar una lista de **Capacitaciones** en que el usuario está inscrito (`InscripcionCapacitacion`). Cada ítem muestra título, resumen, sector, fecha de inscripción y enlace a la publicación original. |
| RF‑C03 | No se incluyen propuestas organizacionales en esta sección. |

### 2.4 Proponer (`/proponer`) – D (Fase D)
| RF‑D01 | La página muestra únicamente el formulario de presentación de propuesta organizacional (8 campos, validaciones y carga de adjuntos). |
| RF‑D02 | No se muestra listado de propuestas enviadas. Después del envío exitoso se muestra un mensaje con enlace **«Ver tus propuestas»** que dirige a `Ajustes → Propuestas` (`/ajustes?seccion=propuestas`). |
| RF‑D03 | Mantener redirección desde la ruta anterior `/propuestas` a `/proponer` para compatibilidad. |

### 2.5 Seguimiento y gestión de Solicitudes – E.1 a E.5 (Fase E)
| RF‑E01 | Los enlaces *Ver seguimiento* en `Servicios.tsx` y `ServicioDetalle.tsx` deben apuntar a `/mis-servicios` (o a un ancla que abra el detalle de la solicitud). |
| RF‑E02 | En la vista de seguimiento (parte de Mis Servicios) se muestra: nombre del servicio, sector, fecha de solicitud, **estado actual**, observaciones públicas del CIT (`observaciones_cit`) y, si corresponde, información de cancelación. |
| RF‑E03 | **Cancelación de solicitud**: el usuario puede cancelar su propia solicitud sólo mientras está en estado `PENDIENTE`. Se llama a `PATCH /api/solicitudes/:id/cancelar`, el backend verifica propiedad y estado, actualiza a `CANCELADA`, registra `cancelado_por_id` y `fecha_cancelacion`. La operación es atómica y no elimina el registro. |
| RF‑E04 | **Observaciones CIT**: el modelo `Solicitud` contiene `observaciones_cit` (visibles al usuario) y `observaciones_internas` (visibles solo a `cit`/`admin`). El backend filtra `observaciones_internas` cuando el rol es `user`. |
| RF‑E05 | En la página `/solicitudes` (acceso exclusivo `cit`/`admin`) se añaden dos pestañas: **Propuestas de Organizaciones** (funcionalidad existente) y **Solicitudes de Servicios**. En esta segunda pestaña se permite a CIT/Admin cambiar el estado, añadir observaciones cit/internas y ejecutar transiciones válidas. |

### 2.6 Gestión del ciclo de vida de Servicios – F (Fase F)
| RF‑F01 | Cada registro `Servicio` tiene un campo `estado_servicio` con valores `'ACTIVO'`, `'ARCHIVADO'`, `'CANCELADO'`. |
| RF‑F02 | **Archivado** (`ARCHIVADO`): Oculta el servicio del catálogo público, mantiene datos y solicitudes históricas. Solo CIT/Admin pueden archivar mediante `PATCH /api/servicios/:id/estado-catalogo`. |
| RF‑F03 | **Cancelación** (`CANCELADO`): Impide nuevas contrataciones. Al cancelar un servicio, el sistema debe identificar **todas** las solicitudes asociadas que estén en estado `PENDIENTE` y pasarlas automáticamente a `CANCELADA`, registrando `fecha_cancelacion` y `cancelado_por_id`. Cada usuario afectado recibe una notificación persistente (`NUEVO_SERVICIO`‑tipo *cancelación*). Las solicitudes ya resueltas no se modifican. El servicio y las solicitudes permanecen en la base de datos para mantener el historial. La operación debe ser atómica (transacción). |

### 2.7 Sistema de Notificaciones – G (Fase G)
| RF‑G01 | Cinco tipos de notificación: 
- `NUEVA_PUBLICACION` (nuevas publicaciones institucionales)
- `CAMBIO_ESTADO_PROPUESTA` (cambio de estado de propuestas)
- `NUEVO_SERVICIO` (publicación de nuevo servicio activo **o** disponibilidad de un servicio previamente solicitado)
- `ACTUALIZACION_PLATAFORMA` (avisos generales del CIT)
- `ACTIVIDAD_USUARIO` (cambios de estado o observaciones en sus solicitudes, o inscripción a capacitaciones). |
| RF‑G02 | Cada tipo se genera en respuesta a un evento específico (ver tabla 2.7.1) y se envía al `user_id` correspondiente siempre que la preferencia del usuario para ese tipo esté activada. |
| RF‑G03 | Las notificaciones se persisten en PostgreSQL en la tabla `Notificaciones`. |
| RF‑G04 | La campanilla muestra el contador de notificaciones no leídas. Al hacer clic se navega a `/notificaciones`. |
| RF‑G05 | En `/notificaciones` el usuario puede filtrar por *Todas* / *No leídas*, marcar individualmente o masivamente como leídas, y acceder al recurso mediante el enlace almacenado. |
| RF‑G06 | Las preferencias de notificación se guardan en la tabla `PreferenciasNotificaciones` (una fila por usuario). |
| RF‑G07 | Las notificaciones no deben bloquear acceso a información esencial; si una preferencia está desactivada la notificación simplemente no se crea, pero la información relacionada sigue siendo accesible mediante sus propias rutas. |

---

## 3. Matriz de permisos por rol (resumen)
| Módulo | Visitante | `user` | `cit` | `admin` |
|---|---|---|---|---|
| Inicio (`/`) | ✔️ | ✔️ | ✔️ | ✔️ |
| Servicios (`/servicios`) – solo `ACTIVO` | ✔️ | ✔️ | ✔️ | ✔️ |
| Servicios – `ARCHIVADO`/`CANCELADO` |  |  | ✔️ | ✔️ |
| Publicaciones (`/publicaciones`) | ✔️ | ✔️ | ✔️ | ✔️ |
| Proponer (`/proponer`) |  | ✔️ |  |  |
| Mis Servicios (`/mis-servicios`) – contratos y capacitaciones |  | ✔️ (propias) | ✔️ (propias) | ✔️ (propias) |
| Cancelar solicitud |  | ✔️ (solo `PENDIENTE`) |  |  |
| Solicitudes (gestión CIT) |  |  | ✔️ | ✔️ |
| Notificaciones (`/notificaciones`) |  | ✔️ | ✔️ | ✔️ |
| Ajustes – Mi Perfil |  | ✔️ | ✔️ | ✔️ |
| Ajustes – Propuestas |  | ✔️ (solo propias) |  |  |
| Ajustes – Notificaciones |  | ✔️ | ✔️ | ✔️ |
| Ajustes – Mi Cuenta |  | ✔️ | ✔️ | ✔️ |

---

## 4. Criterios de aceptación verificables (CA)
| CA | Descripción |
|---|---|
| CA‑A | Navegación, Home sin bloques numéricos, campanilla visible y funcional (0 → hidden, 1‑99 → número, ≥100 → `99+`). |
| CA‑B | Ajustes muestra 4 secciones con los comportamientos descritos en RF‑B01 a RF‑B07. |
| CA‑C | Mis Servicios muestra dos listas separadas (Servicios contratados, Capacitaciones) con enlaces correctos y botón cancelar disponible solo en estado `PENDIENTE`. |
| CA‑D | Proponer muestra solo el formulario y el enlace a Ajustes → Propuestas. |
| CA‑E | Enlaces de seguimiento redirigen a Mis Servicios, cancelación de solicitud funciona bajo reglas de RF‑E03, observaciones internas no aparecen para usuarios `user`. |
| CA‑F | Archivado y cancelación de servicios cumplen RF‑F02 y RF‑F03. Al cancelar un servicio, todas las solicitudes `PENDIENTE` pasan a `CANCELADA` y se genera la notificación correspondiente. |
| CA‑G | Notificaciones aparecen en campanilla, se persisten, respetan preferencias, pueden marcarse como leídas y el enlace abre el recurso correcto. Desactivar una categoría no impide el acceso al contenido asociado. |

---

## 5. Decisiones pendientes (pendientes de confirmación del usuario)
1. **Cancelación de propuestas propias** – si se permite, se usaría `PATCH /api/propuestas/:id/cancelar` en estado `PENDIENTE`; si no, la opción no será implementada.

---

## 6. Riesgos técnicos que requieren confirmación
- **Integridad referencial** al cancelar servicios: necesita transacción que actualice solicitudes pendientes sin romper FK.
- **Duplicación de notificaciones**: requerirá lógica idempotente en los servicios de generación.
- **Filtrado de `observaciones_internas`**: el backend debe asegurar que nunca se incluyan en respuestas a usuarios `user`.
- **Persistencia de preferencias**: debe crear tabla `PreferenciasNotificaciones` sin conflicto con migraciones existentes.

---

## 7. Dependencias entre fases
1. **Bloque 0** – Creación de columnas/estado `Cancelada` y tablas de notificaciones (base requerida por Fases F y G).  
2. **Fase A** – Cambios de UI y navegación (requiere que la ruta `/ajustes` exista).  
3. **Fase B** – Depende de Bloque 0 (para eliminar cuenta) y de la existencia de la ruta `/ajustes`.  
4. **Fase C** – Depende de Bloque 0 (para campos de `Solicitud`).  
5. **Fase D** – Depende de la ruta `/proponer` y de la redirección desde `/propuestas`.  
6. **Fase E** – Depende de Bloque 0 y de la existencia de los endpoints de solicitud.  
7. **Fase F** – Depende de Bloque 0 (campo `estado_servicio`) y de la lógica de cancelación automática implementada en RF‑F03.  
8. **Fase G** – Depende de Bloque 0 (tablas de notificaciones) y de la campanilla introducida en Fase A.

---

## 8. Orden recomendado de implementación
1. **Bloque 0** – Migraciones y modelos (estado `Cancelada`, tablas de notificaciones, campos en `Solicitud` y `Servicio`).
2. **Fase A** – Navegación y Home.
3. **Fase B** – Ajustes (Mi Perfil, Notificaciones, Mi Cuenta). La tabla de preferencias se crea en Bloque 0.
4. **Fase C** – Mis Servicios (listado de solicitudes y capacitaciones).
5. **Fase D** – Proponer (formulario y redirección).
6. **Fase E** – Seguimiento y gestión de solicitudes (incluye página `/solicitudes` con pestañas).
7. **Fase F** – Gestión del ciclo de vida de servicios (archivar y cancelar, incluyendo cancelación automática de solicitudes pendientes).
8. **Fase G** – Sistema de notificaciones (campanilla, centro, generación).
9. **Pruebas e integración** – Validar criterios de aceptación y riesgos pendientes.

---

## 9. Confirmación de cumplimiento de restricciones
No se ha modificado ningún archivo de código fuente, modelo Sequelize, esquema de base de datos ni se han ejecutado migraciones. No se han realizado operaciones Git ni instalación de dependencias. La única acción realizada ha sido la actualización de los documentos de planificación ubicados en `frontend/specs/003-experiencia-usuario/`.