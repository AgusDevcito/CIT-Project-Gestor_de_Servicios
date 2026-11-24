# Tareas de Implementación — Spec-003: Experiencia de Usuario en 5 Niveles

- **Especificación**: `frontend/specs/003-experiencia-usuario/spec.md`
- **Plan Técnico**: `frontend/specs/003-experiencia-usuario/plan.md`
- **Estado**: Niveles 1, 2, 3, 4 y 5 completados (100%)

---

## Nivel 1 — Navegación UX, Capacitaciones, `Mis Servicios`, `Proponer`, `Ajustes/Propuestas` y Timeline

- [x] **T101 (Backend)** — Implementar `PATCH /api/propuestas/:id/cancelar` en `propuesta.service.ts`, `propuesta.controller.ts` y `propuestas.routes.ts` permitiendo al autor cancelar propuestas propias en estado `PENDIENTE` o `EN_REVISION`.
- [x] **T102 (Backend)** — Implementar `PATCH /api/solicitudes/:id/cancelar` en `solicitud.service.ts`, `solicitud.controller.ts` y `solicitudes.routes.ts` permitiendo al titular cancelar solicitudes propias en estado `PENDIENTE`.
- [x] **T103 (Backend)** — Implementar endpoints de gestión de capacitaciones para `cit`/`admin` en `profile.service.ts` y `profile.routes.ts`: `GET /api/capacitaciones/:publicacionId/inscriptos` y `PATCH /api/capacitaciones/inscripciones/:id/estado`.
- [x] **T104 (Frontend UI)** — Crear componente reutilizable `StatusTimeline` en `frontend/src/components/ui/StatusTimeline.tsx` (y exportarlo en `components/ui/index.ts`) con constructores de pasos para `Solicitud` y `Propuesta`.
- [x] **T105 (Frontend Servicios)** — Extender `propuestas.repository.ts` / `propuestasService.ts`, `solicitudes.repository.ts` / `solicitudesService.ts` y `perfil.repository.ts` / `profileService.ts` con `cancelarPropuesta`, `cancelarSolicitud`, `getInscriptosCapacitacion` y `updateEstadoInscripcionCapacitacion`.
- [x] **T106 (Frontend Página)** — Crear `frontend/src/pages/Capacitaciones.tsx` con catálogo de capacitaciones, filtros, inscripción en 1 clic, estado de cursada del usuario y modal para que el personal CIT gestione el estado de los inscriptos.
- [x] **T107 (Frontend Página)** — Crear `frontend/src/pages/MisServicios.tsx` unificando **Servicios contratados** (con `StatusTimeline` y cancelación de pendientes) y **Mis Capacitaciones inscriptas** (con barra de progreso formativo).
- [x] **T108 (Frontend Página)** — Actualizar `frontend/src/pages/Propuestas.tsx` al flujo **Proponer** (`/proponer`): mostrar el formulario sin el listado inferior de propuestas presentadas e incluir el botón/enlace **«Ver tus propuestas»** hacia `/ajustes/propuestas`.
- [x] **T109 (Frontend Página)** — Crear `frontend/src/pages/Ajustes.tsx` con navegación de Ajustes y la sección funcional **`Ajustes / Propuestas`** (`/ajustes/propuestas`) con listado, modal/detalle de revisión, `StatusTimeline` y acción **Cancelar propuesta**.
- [x] **T110 (Frontend Navegación)** — Actualizar `frontend/src/components/Layout.tsx` (tuerquita ⚙️ de Ajustes en barra superior, ítems `Capacitaciones`, `Mis Servicios` y `Proponer` en barra lateral) y `frontend/src/App.tsx` (nuevas rutas y redirección `/propuestas` → `/proponer`).
- [x] **T111 (Tests & Verificación)** — Actualizar y agregar pruebas automatizadas en `frontend/src/__tests__/` y verificar compilación limpia (`tsc --noEmit` en backend y frontend + `vitest run`).

---

## Nivel 2 — Entrega Digital de Resultados (Informes PDF en Solicitudes)

- [x] **T201 (Backend)** — Extender modelo `Solicitud` con `resultado_archivo_url`, `resultado_nombre`, `resultado_observaciones` y `fecha_entrega_resultado` + migración aditiva `004_spec003_nivel2_resultados.sql`.
- [x] **T202 (Backend)** — Crear endpoint `POST/PATCH /api/solicitudes/:id/resultado` para que `cit`/`admin` adjunte el informe PDF/imagen validado al resolver una solicitud y endpoint de descarga protegida `GET /api/solicitudes/:id/resultado` (además de control de acceso en `/api/uploads/:filename`).
- [x] **T203 (Frontend)** — Integrar pestaña de Solicitudes de Servicios y modal de subida de informe en `Solicitudes.tsx` (vista CIT), botón **«Descargar Resultado Oficial (PDF)»** en `MisServicios.tsx` + hito `3. Resultado Oficial Entregado` en `StatusTimeline.tsx` y pruebas automatizadas en `Nivel2.test.tsx`.

---

## Nivel 3 — Limpieza de `Inicio` + Panel Visual de Métricas

- [x] **T301 (Frontend)** — Eliminar de `Home.tsx` las secciones de *Servicios destacados / Servicios Tecnológicos y Diagnósticos del CIT* y *Capacitaciones, Formación y Actividades*.
- [x] **T302 (Backend)** — Implementar `GET /api/metricas/resumen` (`metricas.service.ts`, `metricas.controller.ts`, `metricas.routes.ts`) con indicadores reales de servicios, solicitudes, resultados digitales entregados, propuestas convertidas, capacitaciones y reseñas.
- [x] **T303 (Frontend)** — Incorporar el **Panel Visual de Métricas e Impacto** en `Home.tsx`, actualizar los accesos rápidos (`/capacitaciones` y `/proponer`) y validar con pruebas automatizadas en `Home.test.tsx`.

---

## Nivel 4 — `Ajustes/Perfil`, `Ajustes/Mi Cuenta` y Perfil de Entidad / Cooperativa

- [x] **T401 (Backend)** — Extender `Profile`, `Solicitud` y `Propuesta` para soportar cuentas `ENTIDAD_COOPERATIVA`, `telefono_whatsapp` y trámites en representación de productores asociados, más endpoint seguro de baja de cuenta `POST /api/profile/eliminar-cuenta` y migración SQL `005_spec003_nivel4_entidad_cuenta.sql`.
- [x] **T402 (Frontend)** — Incorporar botón **«Editar perfil»** en `Perfil.tsx` → `/ajustes/perfil` (datos personales, avatar, contraseña, datos de Entidad/Cooperativa y WhatsApp) y completar `/ajustes/mi-cuenta` (eliminar cuenta con confirmación segura).
- [x] **T403 (Frontend)** — Agregar opción de carga en representación de productor asociado en `Proponer` (`Propuestas.tsx`), visualización en `MisServicios.tsx` y `Ajustes.tsx`, y pruebas automatizadas en `Nivel4.test.tsx`.

---

## Nivel 5 — Centro de Notificaciones (Campanilla 🔔 + `Ajustes/Notificaciones` + WhatsApp)

- [x] **T501 (Backend)** — Implementar endpoints de `/api/notificaciones`, preferencias (`canal_whatsapp`), disparadores automáticos en publicaciones/propuestas/servicios/solicitudes, proveedor `whatsapp.provider.ts` integrado a `OutboxNotification` y migración SQL `006_spec003_nivel5_notificaciones_whatsapp.sql`.
- [x] **T502 (Frontend)** — Agregar campanilla 🔔 (`NotificationBell.tsx`) en `Layout.tsx`, página `/notificaciones` (`Notificaciones.tsx`), subsección `/ajustes/notificaciones` en `Ajustes.tsx` y pruebas automatizadas en `Nivel5.test.tsx`.
