# Tareas de Implementación — Spec-003: Experiencia de Usuario, Gestión Personal y Administración Completa

- **Especificación**: `frontend/specs/003-experiencia-usuario/spec.md`
- **Plan Técnico**: `frontend/specs/003-experiencia-usuario/plan.md`
- **Estado**: Pendiente de aprobación del usuario

---

## Bloque 0 — Base de Datos, Modelos y Contratos Core Backend

> **Objetivo**: Preparar las migraciones aditivas, el estado `Cancelada` y las extensiones de modelos que son requisito previo para las Fases B, D, E, F y G.

- [x] **T001** — Agregar constante `CANCELADA: "CANCELADA"` en `backend/src/constants/estados.ts` y registrar su seed idempotente en `backend/src/services/catalogSeed.service.ts`.
- [x] **T002** — Crear la migración SQL idempotente y no destructiva `backend/src/config/migrations/003_spec003_ux_management.sql` con:
  - Inserción condicional del estado `'CANCELADA'` (`'Cancelada'`) en `"Estados"`.
  - Nuevas columnas en `"Solicituds"` (`observaciones_cit`, `observaciones_internas`, `fecha_cancelacion`, `cancelado_por_id`).
  - Nuevas columnas en `"Servicios"` (`estado_servicio`, `motivo_cancelacion`, `fecha_cambio_estado`).
  - Nuevas tablas `"Notificaciones"` y `"PreferenciasNotificaciones"` con sus índices y claves foráneas.
- [x] **T003** — Extender `backend/src/models/solicitud.model.ts` y `backend/src/models/servicio.model.ts` con los nuevos atributos tipados en TypeScript.
- [x] **T004** — Crear los modelos `backend/src/models/notificacion.model.ts` y `backend/src/models/preferenciaNotificacion.model.ts` y registrar sus relaciones en `backend/src/models/index.ts`.
- [x] **T005** — Actualizar `seedCatalogos()` / `ensureCatalogSeed()` en `backend/src/services/catalogSeed.service.ts` para poblar de forma idempotente únicamente el catálogo funcional (`Sectores` y `Estados` incluyendo `'CANCELADA'`), sin ejecutar DDL ni migraciones en el arranque del servidor.

---

## Fase A — Simplificación del Home

> **Objetivo**: Retirar las tarjetas de estadísticas/contadores numéricos del Home institucional manteniendo una portada limpia y enfocada en el propósito de CITio.

- [x] **T006** — Modificar `frontend/src/pages/Home.tsx` y `frontend/src/pages/Home.module.css` para eliminar el bloque `statsStrip` (`+35 Servicios Técnicos`, `4 Áreas Estratégicas`, `100% Trazabilidad Digital`, `Abierto a Organizaciones`) y ajustar el espaciado entre el Hero institucional y la grilla de áreas de vinculación.
- [x] **T007** — Actualizar `frontend/src/test/Home.test.tsx` verificando que el Home institucional no renderice contadores numéricos ni porcentajes ficticios y mantenga los CTAs de navegación.

---

## Fase C — Renombrar Propuestas a Proponer

> **Objetivo**: Renombrar la sección de presentación de propuestas a **Proponer** (`/proponer`), enfocada en crear propuestas organizacionales y redirigiendo desde `/propuestas` para no romper enlaces previos.

- [ ] **T008** — Actualizar `frontend/src/components/Layout.tsx` para que el ítem de navegación visible para `user` se llame **Proponer** y apunte a `/proponer`.
- [ ] **T009** — Actualizar `frontend/src/App.tsx` registrando la ruta protegida `/proponer` (`roles={["user"]}`) y configurando `<Navigate to="/proponer" replace />` desde `/propuestas`.
- [ ] **T010** — Actualizar `frontend/src/pages/Propuestas.tsx` (y sus textos de cabecera) bajo la denominación **Proponer**, agregando en la confirmación de envío un acceso directo a `/mis-servicios?tab=propuestos`.
- [ ] **T011** — Actualizar las pruebas en `frontend/src/test/Propuestas.test.tsx` para validar el nuevo encabezado **Proponer** y la navegación hacia **Mis Servicios**.

---

## Fase D — Nuevo apartado Mis Servicios (Usuario) y Cancelación de Pendientes

> **Objetivo**: Centralizar en `/mis-servicios` los **Servicios propuestos** y los **Servicios solicitados** del usuario, permitiendo seguimiento detallado y cancelación cuando estén en estado `Pendiente`.

- [ ] **T012** — Implementar en `backend/src/services/propuesta.service.ts`, `backend/src/controllers/propuesta.controller.ts` y `backend/src/routes/propuestas.routes.ts` el endpoint `PATCH /api/propuestas/:id/cancelar` (restringido al autor cuando el estado es `PENDIENTE`).
- [ ] **T013** — Implementar en `backend/src/services/solicitud.service.ts`, `backend/src/controllers/solicitud.controller.ts` y `backend/src/routes/solicitudes.routes.ts` el endpoint `PATCH /api/solicitudes/:id/cancelar` (restringido al solicitante titular cuando el estado es `PENDIENTE`, registrando `fecha_cancelacion` y `cancelado_por_id`).
- [ ] **T014** — Extender `frontend/src/domain/propuestas.ts`, `frontend/src/domain/solicitudes.ts`, `frontend/src/repositories/propuestas.repository.ts`, `frontend/src/repositories/solicitudes.repository.ts` y sus servicios para soportar `cancelarPropuesta(id)` y `cancelarSolicitud(id)`, así como el estado `Cancelada`.
- [ ] **T015** — Crear la página `frontend/src/pages/MisServicios.tsx` y `frontend/src/pages/MisServicios.module.css` con dos pestañas principales:
  1. **Servicios propuestos**: listado de propuestas del usuario, estado con `Badge`, fecha, área, modal de detalle con respuesta/revisión CIT y botón **Cancelar propuesta** (con modal de confirmación) solo para estado `Pendiente`.
  2. **Servicios solicitados**: listado de solicitudes de servicios del usuario, estado con `Badge`, fechas, modal de seguimiento con `observaciones_cit`, acceso a la ficha del servicio (`/servicios/:id`) y botón **Cancelar solicitud** (con modal de confirmación) solo para estado `Pendiente`.
- [ ] **T016** — Registrar `/mis-servicios` en `frontend/src/App.tsx` y agregar el acceso **Mis Servicios** en `frontend/src/components/Layout.tsx`.
- [ ] **T017** — Corregir los enlaces `"Ver seguimiento"` / `"Ir a seguimiento"` en `frontend/src/pages/Servicios.tsx` (línea 220) y `frontend/src/pages/ServicioDetalle.tsx` (líneas 232 y 407) para que dirijan a `/mis-servicios?tab=solicitados` en lugar de `/solicitudes`.
- [ ] **T018** — Crear `frontend/src/test/MisServicios.test.tsx` verificando ambas pestañas, el modal de seguimiento y la acción de cancelación en estado `Pendiente`.

---

## Fase E — Seguimiento y Gestión de Servicios Solicitados por CIT / Admin

> **Objetivo**: Incorporar en la bandeja interna (`/solicitudes`) la gestión completa de solicitudes de contratación de servicios (`Solicitud`), separada en pestañas respecto de las propuestas organizacionales (`Propuesta`).

- [ ] **T019** — Extender `backend/src/services/solicitud.service.ts` y `backend/src/repositories/solicitud.repository.ts` para:
  - Permitir a `cit` y `admin` actualizar estado (`PENDIENTE`, `EN_REVISION`, `ACEPTADA`, `RECHAZADA`, `FINALIZADA`, `CANCELADA`) validando transiciones permitidas.
  - Guardar `observaciones_cit` (visibles al usuario) y `observaciones_internas` (visibles solo para `cit`/`admin`).
  - Omitir `observaciones_internas` cuando `GET /api/solicitudes` sea consultado por un usuario con rol `user`.
- [ ] **T020** — Actualizar `frontend/src/pages/Solicitudes.tsx` y `frontend/src/pages/Solicitudes.module.css` para incluir dos pestañas operativas:
  1. **Solicitudes de Servicios**: tabla/tarjetas con datos del usuario solicitante, servicio requerido, fecha, filtro por estado, modal de gestión de estado y campos de `Observaciones para el usuario` y `Notas internas CIT`.
  2. **Propuestas de Organizaciones**: flujo actual de revisión, aprobación con publicación en catálogo y rechazo con motivo.
- [ ] **T021** — Actualizar `frontend/src/test/Solicitudes.test.tsx` para cubrir el cambio de pestaña, filtrado y actualización de estado/observaciones de una solicitud de servicio por personal CIT.

---

## Fase F — Gestión Completa del Catálogo de Servicios por CIT / Admin

> **Objetivo**: Permitir al personal CIT y administradores archivar, cancelar (dar de baja) y reactivar servicios del catálogo sin perder historial de solicitudes ni reseñas.

- [ ] **T022** — Implementar en `backend/src/services/servicio.service.ts`, `backend/src/controllers/servicio.controller.ts` y `backend/src/routes/servicios.routes.ts`:
  - Nuevo endpoint `PATCH /api/servicios/:id/estado-catalogo` (`requireAuth`, `requireCitOrAdmin`) para cambiar `estado_servicio` (`'ACTIVO' | 'ARCHIVADO' | 'CANCELADO'`) y registrar `motivo_cancelacion` y `fecha_cambio_estado`.
  - Filtro en `GET /api/servicios` (con `optionalAuth`) para devolver solo servicios `ACTIVO` a visitantes y `user`, permitiendo a `cit`/`admin` consultar `ARCHIVADO`, `CANCELADO` o `TODOS`.
  - Validación en `POST /api/solicitudes` (`solicitud.service.ts`) para impedir nuevas contrataciones sobre servicios cuyo `estado_servicio !== 'ACTIVO'`.
- [ ] **T023** — Extender `frontend/src/domain/servicios.ts`, `frontend/src/repositories/servicios.repository.ts` y `frontend/src/services/serviciosService.ts` con `cambiarEstadoCatalogoServicio(id, payload)` y soporte de filtro por `estado_servicio`.
- [ ] **T024** — Actualizar `frontend/src/pages/Servicios.tsx` y `frontend/src/pages/ServicioDetalle.tsx` para mostrar:
  - Selector de filtro de estado de catálogo (`Activos`, `Archivados`, `Cancelados`, `Todos`) visible para `cit`/`admin`.
  - Botones de acción administrativa (**Archivar**, **Cancelar servicio** con modal de motivo, **Reactivar**) y badges de estado.
  - Bloqueo del botón de contratación en `ServicioDetalle.tsx` si el servicio no está `ACTIVO`.
- [ ] **T025** — Actualizar `frontend/src/test/Servicios.test.tsx` para probar el archivado, cancelación y reactivación de servicios por rol `cit`/`admin`.

---

## Fase B — Reemplazo de Mi Perfil por Ajustes (Perfil, Notificaciones, Tema y Eliminar Cuenta)

> **Objetivo**: Transformar `/perfil` en `/ajustes` con 4 subsecciones claras (`Perfil`, `Notificaciones`, `Preferencias visuales`, `Eliminar cuenta`), retirando las listas de propuestas y servicios que pasan a `/mis-servicios`.

- [ ] **T026** — Implementar en `backend/src/services/profile.service.ts`, `backend/src/controllers/profile.controller.ts` y `backend/src/routes/profile.routes.ts` el endpoint `POST /api/profile/eliminar-cuenta`:
  - Validar contraseña actual (`bcrypt.compare`) y palabra de confirmación `"ELIMINAR"`.
  - Impedir baja si el usuario es el único `admin` activo del sistema (`409 Conflict`).
  - Ejecutar transacción que cancele propuestas y solicitudes en estado `PENDIENTE`, anonimice datos personales (`Users` y `Profiles`) y marque `isActive = false`.
- [ ] **T027** — Crear `frontend/src/pages/Ajustes.tsx` y `frontend/src/pages/Ajustes.module.css` con navegación por subsecciones:
  1. **Perfil**: formulario de datos personales y acceso informativo a capacitaciones inscriptas; rol y email protegidos contra edición.
  2. **Notificaciones**: interruptores (`switches`) de preferencias de notificación por tipo de evento.
  3. **Preferencias visuales**: selector interactivo de tema Claro / Oscuro conectado a `ThemeContext`.
  4. **Eliminar cuenta**: panel de advertencia con modal de confirmación (contraseña actual + texto `"ELIMINAR"`), que al completarse ejecuta `logout()` y redirige a `/`.
- [ ] **T028** — Actualizar `frontend/src/App.tsx` y `frontend/src/components/Layout.tsx` para que la navegación principal muestre **Ajustes** (`/ajustes`) y que `/perfil` redirija automáticamente a `/ajustes`.
- [ ] **T029** — Crear `frontend/src/test/Ajustes.test.tsx` (y actualizar `Perfil.test.tsx` si aplica) validando las 4 subsecciones de **Ajustes**.

---

## Fase G — Sistema de Notificaciones en Plataforma

> **Objetivo**: Proveer notificaciones internas persistidas en base de datos, respetando las preferencias configuradas por cada usuario en **Ajustes**, con campana en el header y centro de notificaciones en `/notificaciones`.

- [ ] **T030** — Crear `backend/src/repositories/notificacion.repository.ts`, `backend/src/services/notificacion.service.ts`, `backend/src/controllers/notificacion.controller.ts` y `backend/src/routes/notificaciones.routes.ts` implementando:
  - `GET /api/notificaciones` (listado + `unreadCount`).
  - `PATCH /api/notificaciones/:id/leer` y `PATCH /api/notificaciones/leer-todas`.
  - `GET /api/notificaciones/preferencias` y `PUT /api/notificaciones/preferencias`.
  - `POST /api/notificaciones/anuncio` (`cit`/`admin` para avisos de `ACTUALIZACION_PLATAFORMA`).
  - Registrar el router en `backend/src/routes/index.ts`.
- [ ] **T031** — Integrar los disparadores automáticos de notificaciones (respetando `PreferenciasNotificaciones`) en:
  - `publicacion.service.ts` (`NUEVA_PUBLICACION` al publicar).
  - `propuesta.service.ts` (`CAMBIO_ESTADO_PROPUESTA` al aprobar/rechazar; `ACTIVIDAD_USUARIO` a CIT al recibir nueva propuesta).
  - `servicio.service.ts` (`NUEVO_SERVICIO` al publicar nuevo servicio activo).
  - `solicitud.service.ts` (`ACTIVIDAD_USUARIO` al usuario cuando cambia el estado de su solicitud, y a CIT cuando ingresa una nueva solicitud).
- [ ] **T032** — Crear `frontend/src/domain/notificaciones.ts`, `frontend/src/repositories/notificaciones.repository.ts` y `frontend/src/services/notificacionesService.ts`.
- [ ] **T033** — Crear el componente `frontend/src/components/NotificationBell.tsx` e integrarlo en `frontend/src/components/Layout.tsx` para usuarios autenticados, mostrando badge de no leídas y vista previa desplegable.
- [ ] **T034** — Crear la página `frontend/src/pages/Notificaciones.tsx` y `frontend/src/pages/Notificaciones.module.css` (con filtros `Todas`/`No leídas`, marcado de lectura, navegación al enlace asociado y modal de emisión de anuncio de plataforma para `cit`/`admin`) y registrar la ruta `/notificaciones` en `frontend/src/App.tsx`.
- [ ] **T035** — Crear pruebas unitarias en `frontend/src/test/Notificaciones.test.tsx` para `NotificationBell` y la vista `/notificaciones`.

---

## Fase de Integración, Pruebas End-to-End y Validación Final

- [ ] **T036** — Crear `backend/tests/spec003-integration.test.ts` validando todos los endpoints nuevos y modificados (cancelaciones por usuario, gestión CIT de solicitudes, privacidad de `observaciones_internas`, estados de catálogo de servicios, notificaciones con preferencias y baja segura de cuenta).
- [ ] **T037** — Ejecutar verificación completa de calidad en `backend` y `frontend`:
  - `npm run typecheck` (Frontend y Backend).
  - `npm run lint` (Frontend).
  - `npm test` (Suite completa de Vitest en Frontend + pruebas de integración en Backend).
  - `npm run build` (Frontend y Backend).
