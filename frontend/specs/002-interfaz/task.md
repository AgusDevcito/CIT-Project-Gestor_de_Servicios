# Tareas de Implementación — Spec 002: Interfaz (Fases A–G)

- **Especificación**: `frontend/specs/002-interfaz/spec.md`
- **Plan técnico**: `frontend/specs/002-interfaz/plan.md`
- **Convención de estados**: `pendiente` | `en progreso` | `bloqueada` | `completada`

---

## Bloque 0 — Ajustes de Integración en Backend y Base de Datos

### T-002-B01 — Montar `serviciosRouter` y asegurar `requireCIT` en `POST /api/servicios`
- **Tipo**: Backend
- **Estado**: `completada`
- **Descripción**: Registrar `routes.use("/", serviciosRouter);` en el enrutador central del backend (actualmente importado pero no utilizado, causando `404`) y agregar el middleware `requireCIT` a la ruta `POST /api/servicios`.
- **Archivos involucrados**:
  - `backend/src/routes/index.ts`
  - `backend/src/routes/servicios.routes.ts`
- **Dependencias**: Ninguna
- **Criterios de finalización**:
  - `GET /api/servicios` responde `200 OK` para usuarios autenticados.
  - `POST /api/servicios` responde `403 Forbidden` si el rol es `user` y `201 Created` si es `cit` o `admin`.
- **Pruebas necesarias**: Verificación de tipos (`npm run typecheck` en `backend`) y prueba de endpoint.

### T-002-B02 — Incluir relación `Solicitante` (con `Profile`) en listado de Solicitudes
- **Tipo**: Backend
- **Estado**: `completada`
- **Descripción**: Actualizar `includes` en `solicitud.repository.ts` para incluir `{ model: User, as: "Solicitante", attributes: { exclude: ["password"] }, include: [{ model: Profile, as: "Profile" }] }` al consultar solicitudes, permitiendo que el personal CIT/Admin identifique al solicitante.
- **Archivos involucrados**:
  - `backend/src/repositories/solicitud.repository.ts`
- **Dependencias**: Ninguna
- **Criterios de finalización**:
  - `GET /api/solicitudes` devuelve el objeto `Solicitante` (con `username`, `email` y `Profile`) en cada solicitud.
- **Pruebas necesarias**: `npm run typecheck` en `backend`.

### T-002-B03 — Habilitar consulta de propuestas propias para `user` e historial completo para `cit`/`admin`
- **Tipo**: Backend
- **Estado**: `completada`
- **Descripción**: Actualizar `GET /api/propuestas` para usar `requireAuth`. Si el usuario autenticado tiene rol `user`, devolver sus propias propuestas (`where: { solicitante: req.user.id }`) en cualquier estado junto con la justificación y revisor del CIT; si tiene rol `cit` o `admin`, devolver todas las propuestas (pendientes y dictaminadas) para permitir filtrado por estado en la UI.
- **Archivos involucrados**:
  - `backend/src/routes/propuestas.routes.ts`
  - `backend/src/controllers/propuesta.controller.ts`
  - `backend/src/services/propuesta.service.ts`
  - `backend/src/repositories/propuesta.repository.ts`
- **Dependencias**: Ninguna
- **Criterios de finalización**:
  - Un usuario `user` recibe `200 OK` en `GET /api/propuestas` únicamente con sus propuestas enviadas.
  - Un usuario `cit` o `admin` recibe `200 OK` con todas las propuestas (tanto `PENDIENTE` como `APROBADO`/`RECHAZADO`).
- **Pruebas necesarias**: `npm run typecheck` en `backend`.

### T-002-B04 — Ampliar longitud máxima de `servicio_nombre` a 120 caracteres
- **Tipo**: Backend / Base de Datos
- **Estado**: `completada`
- **Descripción**: Cambiar `servicio_nombre` de `DataTypes.STRING(30)` a `DataTypes.STRING(120)` en `servicio.model.ts` para admitir los nombres completos del catálogo oficial del CIT (`Servicios.md`). Documentar la sentencia SQL `ALTER TABLE public.servicios ALTER COLUMN servicio_nombre TYPE VARCHAR(120);` para Supabase.
- **Archivos involucrados**:
  - `backend/src/models/servicio.model.ts`
- **Dependencias**: Ninguna
- **Criterios de finalización**:
  - El modelo Sequelize permite crear servicios con nombres de hasta 120 caracteres sin error de truncado.
- **Pruebas necesarias**: `npm run typecheck` en `backend`.

---

## Fase A — Identidad Visual y Navegación

### T-002-A01 — Definir sistema de tokens visuales GitHub Dark en `index.css`
- **Tipo**: Frontend (Estilos / UI)
- **Estado**: `completada`
- **Descripción**: Actualizar `frontend/src/index.css` con la paleta de colores inspirada en GitHub Dark (`#0d1117`, `#161b22`, `#21262d`, `#30363d`, `#e6edf3`, `#8b949e`, acento institucional `#238636` / `#2ea043` y colores semánticos de estados), manteniendo compatibilidad con clases existentes durante la transición.
- **Archivos involucrados**:
  - `frontend/src/index.css`
- **Dependencias**: Ninguna
- **Criterios de finalización**:
  - Variables `@theme` disponibles en Tailwind v4, scrollbars estilizados y tipografía base limpia con contraste WCAG AA.
- **Pruebas necesarias**: `npm run build` en `frontend`.

### T-002-A02 — Crear catálogo de componentes UI base (`src/components/ui/`) y utilidades de formato
- **Tipo**: Frontend (Componentes UI / Lib)
- **Estado**: `completada`
- **Descripción**: Implementar los componentes reutilizables del sistema de diseño y funciones de formateo/errores:
  - `src/lib/formatters.ts` (fechas legibles en español, moneda ARS o `"Consultar"` cuando el precio es `0`, iniciales de usuario).
  - `src/lib/errors.ts` (ampliar traducciones de errores de propuestas, perfil, publicaciones y servicios).
  - `src/components/ui/Button.tsx`
  - `src/components/ui/Badge.tsx` (mapeo semántico de estados, sectores y tipos de contenido)
  - `src/components/ui/Card.tsx`
  - `src/components/ui/PageHeader.tsx`
  - `src/components/ui/SearchFilterBar.tsx`
  - `src/components/ui/EmptyState.tsx`
  - `src/components/ui/Alert.tsx`
  - `src/components/ui/Skeleton.tsx`
  - `src/components/ui/Modal.tsx`
- **Archivos involucrados**:
  - `frontend/src/lib/formatters.ts`
  - `frontend/src/lib/errors.ts`
  - `frontend/src/components/ui/*.tsx`
- **Dependencias**: `T-002-A01`
- **Criterios de finalización**:
  - Todos los componentes compilan en modo `strict: true` sin `any` y soportan accesibilidad (`aria-*`, teclado).
- **Pruebas necesarias**: Tests unitarios de `formatters.ts`, `Badge.tsx` y `SearchFilterBar.tsx`.

### T-002-A03 — Rediseñar `Layout.tsx` (TopHeader ocultable + Sidebar responsivo estilo GitHub) y alinear `Login` / `Register`
- **Tipo**: Frontend (Navegación / Layout)
- **Estado**: `completada`
- **Descripción**:
  - Actualizar `Layout.tsx` con barra superior (`TopHeader`) que muestre logo CITio, título/breadcrumb de la sección activa, badge de rol (`labelDeRol`), avatar/iniciales del usuario y acceso a perfil/cerrar sesión.
  - Implementar `Sidebar` responsivo con íconos SVG, indicador de ruta activa y drawer móvil (`< md`).
  - Ajustar los estilos de `Login.css` y `Register.css` a la estética sobria de tarjetas GitHub Dark sin modificar la estructura DOM ni los textos validados por los tests de Spec-001.
- **Archivos involucrados**:
  - `frontend/src/components/Layout.tsx`
  - `frontend/src/pages/auth/Login.css`
  - `frontend/src/pages/auth/Register.css`
- **Dependencias**: `T-002-A01`, `T-002-A02`
- **Criterios de finalización**:
  - Navegación fluida en móvil y desktop, mostrando datos reales del usuario en sesión.
  - Los 26 tests existentes de Spec-001 siguen pasando al 100%.
- **Pruebas necesarias**: Test de componente `Layout.test.tsx` (verificando links, rol y menú móvil) + suite completa de Spec-001.

### T-002-A04 — Estandarizar capa `domain/` y `repositories/` para Catálogos y módulos de negocio
- **Tipo**: Frontend (Arquitectura / Datos)
- **Estado**: `completada`
- **Descripción**: Crear los contratos de dominio tipados en `src/domain/` (`catalogos.ts`, `servicios.ts`, `solicitudes.ts`, `publicaciones.ts`, `propuestas.ts`, `perfil.ts`) y los repositorios en `src/repositories/` con sus respectivos mapeadores DTO -> Dominio, actualizando `src/services/*Service.ts` para delegar en dichos repositorios.
- **Archivos involucrados**:
  - `frontend/src/domain/{catalogos,servicios,solicitudes,publicaciones,propuestas,perfil}.ts`
  - `frontend/src/repositories/{catalogos,servicios,solicitudes,publicaciones,propuestas,perfil}.repository.ts`
  - `frontend/src/services/{catalogosService,serviciosService,solicitudesService,publicacionesService,propuestasService,profileService}.ts`
- **Dependencias**: `T-002-A02`
- **Criterios de finalización**:
  - Todas las entidades expuestas a las páginas están fuertemente tipadas y normalizadas, manteniendo retrocompatibilidad.
- **Pruebas necesarias**: `npm run typecheck` y tests unitarios de mapeadores en `src/__tests__/repositories/`.

---

## Fase B — Home (Presentación Institucional y Panel de Inicio)

### T-002-B05 — Implementar Home institucional y dinámico en `Home.tsx`
- **Tipo**: Frontend (Página)
- **Estado**: `completada`
- **Descripción**: Transformar `Home.tsx` en la página de presentación institucional de CITio:
  - Mensaje de bienvenida personalizado con el nombre del usuario autenticado (`Hola, {displayName}`) o bienvenida general para usuarios anónimos (`Bienvenido a CITio`).
  - Sección institucional explicando qué es el CIT Formosa (CONICET - UNaF - Provincia de Formosa), a qué se dedica y qué actividades desarrolla, junto con la explicación de qué es CITio, su objetivo y qué problemas resuelve.
  - Ejemplos representativos de servicios diagnósticos oficiales (`Servicios.md`) y sincronización en vivo con `getServicios()`.
  - Ejemplos reales de capacitaciones, formación de recursos humanos y divulgación técnica, sincronizados con `getPublicaciones()`.
  - Accesos visuales directos a las 5 secciones principales (`Servicios`, `Solicitudes`, `Publicaciones`, `Propuestas`, `Mi Perfil`).
- **Archivos involucrados**:
  - `frontend/src/pages/Home.tsx`
- **Dependencias**: `T-002-A03`, `T-002-A04`, `T-002-B01`
- **Criterios de finalización**:
  - El dashboard muestra métricas reales, maneja estados vacíos/errores parciales sin romperse y diferencia las acciones entre `user` y `cit`/`admin`.
- **Pruebas necesarias**: `src/__tests__/pages/Home.test.tsx` (renderizado para `user` y para `cit`).

---

## Fase C — Servicios

### T-002-C01 — Implementar Catálogo (`Servicios.tsx`), Detalle (`ServicioDetalle.tsx`), Prevención de Solicitudes Duplicadas y Sistema de Calificaciones y Reseñas
- **Tipo**: Frontend + Backend + Base de Datos
- **Estado**: `completada`
- **Descripción**:
  - **Backend**:
    - Crear modelo `ResenaServicio` (`backend/src/models/resenaServicio.model.ts`) con restricción única `(servicio_id, user_id)` y validación de calificación (`1..5`) y comentario (`10..1000` caracteres).
    - Agregar endpoints `GET /api/servicios/:id` y `POST /api/servicios/:id/resenas` en `servicios.routes.ts`, validando en servidor que solo usuarios `user` que hayan solicitado el servicio puedan calificarlo y una sola vez.
    - En `solicitud.service.ts`, validar que no existan solicitudes activas duplicadas (`PENDIENTE`, `APROBADO`, `ACEPTADA`) del mismo usuario para el mismo servicio (`409 Conflict`).
  - **Frontend**:
    - Rediseñar `Servicios.tsx` con `PageHeader`, `SearchFilterBar` (búsqueda + filtro por sector), tarjetas con calificación promedio, prevención de solicitudes duplicadas (`"Ya solicitado"`) y alta de servicios para `cit`/`admin`.
    - Crear `ServicioDetalle.tsx` (`/servicios/:id`) con información detallada del servicio, condiciones de contratación, calificación promedio, listado de reseñas verificadas y formulario para calificar y reseñar.
- **Archivos involucrados**:
  - `backend/src/models/resenaServicio.model.ts`
  - `backend/src/models/servicio.model.ts`
  - `backend/src/models/index.ts`
  - `backend/src/repositories/servicio.repository.ts`
  - `backend/src/services/servicio.service.ts`
  - `backend/src/services/solicitud.service.ts`
  - `backend/src/controllers/servicio.controller.ts`
  - `backend/src/routes/servicios.routes.ts`
  - `frontend/src/domain/servicios.ts`
  - `frontend/src/repositories/servicios.repository.ts`
  - `frontend/src/services/serviciosService.ts`
  - `frontend/src/pages/Servicios.tsx`
  - `frontend/src/pages/ServicioDetalle.tsx`
  - `frontend/src/App.tsx`
- **Dependencias**: `T-002-B01`, `T-002-B04`, `T-002-A04`
- **Criterios de finalización**:
  - Catálogo con búsqueda y filtro por sector, vista de detalle individual, contratación con bloqueo de duplicados y sistema de calificaciones y reseñas validado en cliente y servidor.
- **Pruebas necesarias**: `src/__tests__/pages/Servicios.test.tsx` (catálogo, filtros, alta CIT, contratación sin duplicados, detalle y reseñas).

---

## Fase D — Solicitudes

### T-002-D01 — Implementar apartado interno `Solicitudes.tsx` para evaluación de propuestas de organismos y conversión en servicio
- **Tipo**: Full-Stack (Backend + Frontend)
- **Estado**: `completada`
- **Descripción**:
  - Restringir el acceso a `/solicitudes` exclusivamente a los roles `cit` y `admin` tanto en el frontend (`ProtectedRoute roles={["cit", "admin"]}`, barra lateral en `Layout.tsx` y accesos rápidos en `Home.tsx`) como en el backend (`requireAuth` + `requireCIT` en detalle de propuestas de otros organismos, toma en revisión y dictamen).
  - Extender el modelo `Propuesta` (`nombre_organismo`, `email_contacto`, `telefono_contacto`, `bienes_recursos`, `documento_url`, `documento_nombre`, `servicio_generado_id`) y `Servicio` (`propuesta_id`), incorporando sincronización automática de columnas (`ensureSchemaExtensions`) y el estado `EN_REVISION` en el catálogo.
  - Implementar listado de propuestas recibidas con resumen (organismo, propuesta, área, fecha de presentación, estado de revisión) + búsqueda, filtro por estado/área y ordenamiento (`recientes`, `antiguas`, `titulo`).
  - Implementar panel de detalle de propuesta con datos completos del organismo, correo, teléfono/WhatsApp, área, utilidad y funciones (`problematica`), bienes o recursos (`bienes_recursos`) y visualización/descarga de documentos adjuntos.
  - Implementar flujo de 4 estados (`PENDIENTE` → `EN_REVISION` → `ACEPTADA`/`APROBADO` o `RECHAZADO`) con registro de revisor y fecha (`PATCH /api/propuestas/:id/revision`), y conversión transaccional automática en un nuevo `Servicio` del catálogo al aceptar una propuesta (`POST /api/propuestas/dictaminar/:id` / `PATCH /api/propuesta/:id/dictamen`), preservando la trazabilidad (`servicio_generado_id` / `propuesta_id`) y evitando servicios duplicados (`409 Conflict`).
- **Archivos involucrados**:
  - `backend/src/constants/estados.ts`
  - `backend/src/services/catalogSeed.service.ts`
  - `backend/src/models/propuesta.model.ts`
  - `backend/src/models/servicio.model.ts`
  - `backend/src/models/index.ts`
  - `backend/src/repositories/propuesta.repository.ts`
  - `backend/src/services/propuesta.service.ts`
  - `backend/src/controllers/propuesta.controller.ts`
  - `backend/src/routes/propuestas.routes.ts`
  - `frontend/src/domain/propuestas.ts`
  - `frontend/src/repositories/propuestas.repository.ts`
  - `frontend/src/services/propuestasService.ts`
  - `frontend/src/pages/Solicitudes.tsx`
  - `frontend/src/App.tsx`
  - `frontend/src/components/Layout.tsx`
  - `frontend/src/pages/Home.tsx`
- **Dependencias**: `T-002-B02`, `T-002-B03`, `T-002-A04`, `T-002-C01`
- **Criterios de finalización**:
  - Rol `user` bloqueado en `/solicitudes` (`403`); personal `cit`/`admin` puede listar, filtrar, ordenar, inspeccionar propuestas y documentos, tomar en revisión, rechazar o aceptar generando automáticamente el servicio en el catálogo con trazabilidad.
- **Pruebas necesarias**: `src/__tests__/pages/Solicitudes.test.tsx` (bloqueo 403 para `user`, listado y detalle para `cit`/`admin`, toma en revisión, aceptación con creación de servicio y rechazo con justificación).

---

## Fase E — Publicaciones

### T-002-E01 — Rediseñar `Publicaciones.tsx` con categorías institucionales, estados publicada/borrador y ABM completo
- **Tipo**: Full-Stack (Backend + Frontend)
- **Estado**: `completada`
- **Descripción**:
  - Ampliar el modelo `Publicacion` y el esquema PostgreSQL (`ensureSchemaExtensions`) para soportar las categorías institucionales (`noticia`, `jornada`, `inscripcion`, `capacitacion`) además de las técnicas (`patologia`, `enfermedad`, `parasito`, `plaga`, `otro`), junto con el campo `publicado: boolean` y el endpoint `PATCH /api/publicacion/:id/estado` para publicar/despublicar.
  - Filtrar automáticamente borradores (`publicado = false`) para usuarios normales (`user`) y visitantes en `GET /api/publicaciones` y `GET /api/publicacion/:id`, permitiendo su visualización y administración únicamente a `cit` y `admin`.
  - Incorporar en `Publicaciones.tsx` `PageHeader`, pestañas rápidas de categoría (*Todas*, *Noticias*, *Jornadas*, *Inscripciones*, *Capacitaciones*), `SearchFilterBar` con búsqueda y filtros por categoría, área y estado de publicación.
  - Implementar formulario de creación/edición con soporte para imagen o recurso visual opcional (`imagen_url`, `archivo_tipo`, `archivo_nombre`), estado inicial (`publicado`) y acciones rápidas en cada tarjeta para **Editar**, **Publicar/Despublicar** y **Eliminar**.
- **Archivos involucrados**:
  - `backend/src/models/publicacion.model.ts`
  - `backend/src/services/catalogSeed.service.ts`
  - `backend/src/middlewares/auth.middleware.ts`
  - `backend/src/repositories/publicacion.repository.ts`
  - `backend/src/services/publicacion.service.ts`
  - `backend/src/controllers/publicacion.controller.ts`
  - `backend/src/routes/publicaciones.routes.ts`
  - `frontend/src/domain/publicaciones.ts`
  - `frontend/src/repositories/publicaciones.repository.ts`
  - `frontend/src/services/publicacionesService.ts`
  - `frontend/src/pages/Publicaciones.tsx`
- **Dependencias**: `T-002-A04`
- **Criterios de finalización**:
  - Listado público filtrable por categoría y sector, ocultamiento de borradores a `user`, y creación, edición, publicación/despublicación y eliminación funcionando para `cit`/`admin`.
- **Pruebas necesarias**: `src/__tests__/pages/Publicaciones.test.tsx` (visibilidad pública, filtros, creación, cambio de estado y eliminación).

### T-002-E02 — Rediseñar `PublicacionDetalle.tsx` e implementar galería y gestión de Recursos Visuales (`imagen`/`video`)
- **Tipo**: Frontend (Página)
- **Estado**: `completada`
- **Descripción**:
  - Presentar la publicación con diseño editorial limpio, badges de categoría y sector, nombre completo del autor (`Autor.Profile`), fecha formateada y control de estado (`Publicar ahora` / `Despublicar`) para `cit`/`admin`.
  - Renderizar adjuntos de tipo `imagen` con vista previa y modal de ampliación (`Modal`), y adjuntos de tipo `video` con acceso directo al recurso multimedia.
  - Implementar el panel **"Recursos visuales y archivos adjuntos"** para `cit`/`admin` que permite agregar un nuevo adjunto (`POST /api/publicacion/:publicacionId/archivos` con `tipo`, `archivo_nombre`, `archivo_url`, `orden`) y eliminar adjuntos existentes (`DELETE /api/archivo/:id`).
- **Archivos involucrados**:
  - `frontend/src/pages/PublicacionDetalle.tsx`
- **Dependencias**: `T-002-E01`
- **Criterios de finalización**:
  - `cit`/`admin` pueden adjuntar y eliminar imágenes/videos desde la interfaz de detalle, y todos los roles pueden visualizar las publicaciones publicadas y sus recursos.
- **Pruebas necesarias**: Test de integración en `src/__tests__/pages/Publicaciones.test.tsx` (detalle, alta y baja de adjunto).

---

## Fase F — Propuestas

### T-002-F01 — Implementar apartado `Propuestas.tsx` para organizaciones (`user`) con carga segura de documentación y seguimiento integrado con Fase D
- **Tipo**: Full-Stack (Backend + Frontend)
- **Estado**: `completada`
- **Descripción**:
  - Incorporar presentación institucional orientada a organizaciones productivas y agricultoras con botón **"Realizar propuesta"** que despliega el formulario de 8 campos: (1) Nombre del organismo, (2) Correo electrónico, (3) Número de teléfono, (4) Nombre de la propuesta, (5) Área orientada, (6) Información detallada sobre utilidad y funciones, (7) Bienes o recursos que propone y (8) Archivo adjunto para documentación.
  - Restringir el uso del formulario exclusivamente al rol `user` (ocultándolo para `cit`/`admin` con derivación a `/solicitudes`, e impidiendo el acceso anónimo).
  - Reutilizar `uploadDocument` (`multer`) y `file-type` en `POST /api/propuesta/crear` para validar tipo de archivo (PDF/PNG/JPG por extensión y firma binaria), tamaño máximo (5 MB), cantidad máxima (1 archivo) y acceso autenticado (`/api/uploads/:filename` con sanitización `path.basename` y cabecera `X-Content-Type-Options: nosniff`).
  - Prevenir envíos duplicados accidentales en cliente y servidor (`409 Conflict` si el usuario ya tiene una propuesta activa con el mismo nombre) y mostrar el listado de seguimiento con estado (`Pendiente`, `En revisión`, `Aceptada`, `Rechazada`), dictamen del CIT y enlace al servicio generado (`/servicios/:id`).
- **Archivos involucrados**:
  - `backend/src/middlewares/error.middleware.ts`
  - `backend/src/repositories/propuesta.repository.ts`
  - `backend/src/services/propuesta.service.ts`
  - `backend/src/controllers/propuesta.controller.ts`
  - `backend/src/routes/propuestas.routes.ts`
  - `frontend/src/domain/propuestas.ts`
  - `frontend/src/repositories/propuestas.repository.ts`
  - `frontend/src/pages/Propuestas.tsx`
- **Dependencias**: `T-002-B03`, `T-002-A04`, `T-002-D01`
- **Criterios de finalización**:
  - El usuario `user` puede presentar propuestas completas con documentación adjunta validada, evitando duplicados, que ingresan como `PENDIENTE` a la bandeja interna de Solicitudes (`cit`/`admin`) y muestran trazabilidad completa hacia el servicio creado.
- **Pruebas necesarias**: `src/__tests__/pages/Propuestas.test.tsx` (rechazo de anónimos, restricción para `cit`/`admin`, validaciones de archivo/formulario, envío y seguimiento para `user`).

---

## Fase G — Mi Perfil

### T-002-G01 — Implementar `Perfil.tsx` con edición de datos permitidos, seguridad y secciones Mis Propuestas, Mis Servicios y Mis Capacitaciones
- **Tipo**: Full-Stack (Backend + Frontend)
- **Estado**: `completada`
- **Descripción**:
  - Extender el modelo `Profile` con `bio` (`TEXT`) e incorporar el modelo `InscripcionCapacitacion` (`backend/src/models/inscripcionCapacitacion.model.ts`) y los endpoints `GET /api/profile/:userId/actividad` (`requireAuth`, `requireSelfOnly`), `GET /api/mis-capacitaciones` y `POST /api/capacitaciones/:publicacionId/inscribirse`.
  - Proteger estrictamente la información privada en el backend con `requireSelfOnly` (`403` ante cualquier intento de consultar o modificar otro `:userId`) y filtrar en `PUT /api/profile/:userId` únicamente `first_name`, `last_name`, `avatar_url` y `bio`, impidiendo que el usuario modifique su rol, permisos, correo electrónico o estado CIT.
  - Organizar `Perfil.tsx` con:
    - **Tarjeta de identidad y seguridad**: Avatar/iniciales, nombre completo, `@username`, `bio`, correo y rol (bloqueados como solo lectura), contadores de actividad y formulario de cambio de contraseña (`PUT /api/change-password`).
    - **Sección Información personal**: Edición de `first_name`, `last_name`, `bio` y `avatar_url` sincronizada con `AuthContext` (`refresh`).
    - **Sección Mis Propuestas**: Listado de propuestas presentadas (nombre, fecha, área, estado) con modal para consultar detalles y el resultado de la revisión del CIT.
    - **Sección Mis Servicios**: Listado de servicios contratados o activos (nombre, estado de contratación, fecha de solicitud e información de seguimiento).
    - **Sección Mis Capacitaciones**: Listado de capacitaciones en las que el usuario está inscripto (nombre, descripción, estado de inscripción, fechas y área).
- **Archivos involucrados**:
  - `backend/src/models/profile.model.ts`
  - `backend/src/models/inscripcionCapacitacion.model.ts`
  - `backend/src/models/index.ts`
  - `backend/src/services/catalogSeed.service.ts`
  - `backend/src/middlewares/profile.middleware.ts`
  - `backend/src/repositories/profile.repository.ts`
  - `backend/src/services/profile.service.ts`
  - `backend/src/routes/profile.routes.ts`
  - `frontend/src/domain/perfil.ts`
  - `frontend/src/repositories/perfil.repository.ts`
  - `frontend/src/services/profileService.ts`
  - `frontend/src/pages/Perfil.tsx`
  - `frontend/src/pages/PublicacionDetalle.tsx`
- **Dependencias**: `T-002-A04`, `T-002-C01`, `T-002-E01`, `T-002-F01`
- **Criterios de finalización**:
  - Edición de perfil sincronizada con `AuthContext`, bloqueo de modificación de rol/permisos y de acceso a cuentas ajenas (`403`), y visualización completa de Mis Propuestas, Mis Servicios y Mis Capacitaciones.
- **Pruebas necesarias**: `src/__tests__/pages/Perfil.test.tsx` (visualización de perfil, Mis Propuestas con modal de revisión, Mis Servicios, Mis Capacitaciones y edición de datos permitidos).

---

## Cierre y Verificación Integral

### T-002-V01 — Ejecución de suite completa de pruebas, verificación de tipos y build de producción
- **Tipo**: Pruebas / QA
- **Estado**: `completada`
- **Descripción**: Ejecutar `npm run typecheck`, `npm test` y `npm run build` tanto en `frontend/` como en `backend/`, verificando 0 errores de compilación y 100% de las suites de Vitest en verde para las Fases A–G.
- **Archivos involucrados**:
  - `frontend/specs/002-interfaz/spec.md`
  - `frontend/specs/002-interfaz/plan.md`
  - `frontend/specs/002-interfaz/task.md`
- **Dependencias**: Todas las tareas anteriores (`T-002-B01` a `T-002-G01`)
- **Criterios de finalización**:
  - `0` errores de TypeScript en `frontend` y `backend`.
  - 100% de las suites de Vitest pasando (Spec-001 + Spec-002 Fases A–G).
  - Build de Vite generado sin advertencias ni errores.
- **Pruebas necesarias**: `npm test`, `npm run typecheck`, `npm run build`.
