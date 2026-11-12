# Spec 002 — Rediseño de Interfaz y Fases Funcionales A–G (Línea de Trabajo C)

- **Estado**: Implementada y verificada (Fases A–G completadas — Pendiente de cierre final por el usuario)
- **Línea de trabajo**: C — Frontend (React + Vite + TypeScript + Tailwind CSS v4) + Integración Backend y Base de Datos
- **Rama de trabajo**: `frontend`
- **Dependencias previas**: `001-authentication` (Completada)
- **Referencia visual**: Experiencia de interfaz y navegación inspirada en GitHub Dark (`#0d1117` / `#161b22` / `#21262d`, bordes sutiles `1px` `#30363d`, tipografía limpia y acentos institucionales CIT en verde sobrio `#0d2e0f` / `#238636` / `#2ea043`).

---

## 1. Objetivo y Alcance

### 1.1 Objetivo General
Desarrollar una mejora integral del frontend de **CITio** (Gestor de Servicios del Centro de Innovación Tecnológica), modernizando su identidad visual bajo un sistema de diseño coherente inspirado en la claridad estructural de GitHub y completando las funcionalidades de las **Fases A a G** de la Línea de Trabajo C.

### 1.2 Alcance de la Especificación
Esta especificación abarca las 7 fases del bloque funcional de interfaz:

1. **Fase A — Identidad visual y navegación**: Sistema de tokens de diseño, componentes UI base reutilizables, layout responsivo con barra superior (`TopHeader`) y navegación lateral (`Sidebar`), indicadores de rol/usuario y páginas de autenticación integradas a la nueva estética.
2. **Fase B — Home (Panel de Inicio)**: Transformación de la pantalla de inicio en un panel contextualizado según el rol (`user`, `cit`, `admin`) con métricas rápidas, accesos directos y actividad reciente.
3. **Fase C — Servicios**: Catálogo de servicios del CIT con búsqueda, filtrado por sector, visualización clara de modalidad/arancel, solicitud con confirmación para `user` y alta de servicios para personal CIT (`cit` / `admin`).
4. **Fase D — Solicitudes**: Bandeja de seguimiento de solicitudes de servicios con badges semánticos por estado, filtros por estado y búsqueda, visualización del solicitante para personal CIT y transición controlada de estados.
5. **Fase E — Publicaciones**: Repositorio de divulgación científica/técnica con filtros por sector y tipo de contenido (`patologia`, `enfermedad`, `parasito`, `plaga`, `otro`), vista de detalle enriquecida, ABM completo para `cit`/`admin` y **gestión de archivos adjuntos (`imagen` / `video`)** en la interfaz.
6. **Fase F — Propuestas**: Canal de vinculación tecnológica donde el usuario `user` envía propuestas de problemáticas productivas y consulta el estado/dictamen de sus envíos, mientras el personal `cit`/`admin` revisa y emite dictamen (`APROBADO` / `RECHAZADO`) con justificación obligatoria.
7. **Fase G — Mi Perfil**: Gestión de datos personales (`nombre`, `apellido`, `avatarUrl`), visualización de credenciales y rol institucional, y **cambio de contraseña** integrado con el endpoint existente del backend.

---

## 2. Problemas Actuales Detectados en la Inspección

A partir del relevamiento exhaustivo del código actual (`frontend/` y `backend/`), se identificaron los siguientes problemas técnicos y de experiencia de usuario que Spec-002 debe resolver:

### 2.1 Problemas de Diseño UX/UI y Arquitectura Frontend
1. **Estética fragmentada y contraste agresivo**:
   - `frontend/src/index.css` utiliza un verde neón saturado (`#0dfc19`) sobre fondos verdes oscuros (`#0d2e0f`), mientras que `Login.css` y `Register.css` usan hojas de estilo separadas con animaciones espaciales que no guardan relación con el resto de la aplicación autenticada.
2. **Ausencia de componentes UI reutilizables**:
   - No existe una carpeta `src/components/ui/`. Botones, inputs, alertas, tablas, badges de estado y tarjetas se repiten inline en cada página con estilos dispares.
3. **Navegación (`Layout.tsx`) rígida e incompleta**:
   - El sidebar fijo (`w-60`) no es responsivo en pantallas móviles/tablets, carece de iconografía orientativa, no muestra el avatar ni el nombre del usuario en sesión, y no ofrece jerarquía visual estilo plataforma profesional.
4. **Arquitectura en capas incompleta fuera de `auth`**:
   - En Spec-001 se implementó la arquitectura limpia (`domain/` → `lib/` → `repositories/` → `services/`) únicamente para autenticación. Los 6 servicios restantes (`catalogosService.ts`, `serviciosService.ts`, `solicitudesService.ts`, `publicacionesService.ts`, `propuestasService.ts`, `profileService.ts`) consumen `http` directamente desde componentes y exponen alias crudos de Sequelize (`Sector`, `Proveedor`, `Solicitante`, `Estado`, `Autor`, `Archivo`) en `snake_case`.
5. **Funcionalidades de interfaz incompletas en páginas actuales**:
   - **Home (`Home.tsx`)**: Solo muestra un logo centrado y el texto `"Hola, {displayName}"`, sin resumen operativo ni accesos rápidos.
   - **Publicaciones (`Publicaciones.tsx` / `PublicacionDetalle.tsx`)**: Aunque `publicacionesService.ts` define `addArchivo()` y `deleteArchivo()`, **ninguna pantalla permite adjuntar o eliminar imágenes/videos** en una publicación.
   - **Propuestas (`Propuestas.tsx`)**: El usuario con rol `user` solo ve el formulario de envío; no puede ver el listado de sus propias propuestas enviadas ni conocer si fueron aprobadas o rechazadas ni leer la justificación del CIT.
   - **Mi Perfil (`Perfil.tsx`)**: No expone el formulario para cambiar contraseña a pesar de que el backend ya implementa `PUT /api/change-password`. Además, muestra el rol crudo (`user.rol`) sin usar `labelDeRol()`.

### 2.2 Bugs e Inconsistencias Críticas en el Backend
1. **`serviciosRouter` NO está montado en `backend/src/routes/index.ts`**:
   - En `backend/src/routes/index.ts` (línea 7) se importa `serviciosRouter`, pero **falta `routes.use("/", serviciosRouter);`**. Actualmente cualquier petición a `GET /api/servicios` o `POST /api/servicios` devuelve `404 Not Found`.
2. **Falta middleware `requireCIT` en `POST /api/servicios`**:
   - En `backend/src/routes/servicios.routes.ts`, `requireCIT` está importado pero no aplicado en `serviciosRouter.post("/servicios", requireAuth, createServicio);`, permitiendo que un usuario `user` cree servicios vía API.
3. **`GET /api/solicitudes` no incluye la relación `Solicitante`**:
   - En `backend/src/repositories/solicitud.repository.ts`, el arreglo `includes` solo carga `Servicio` y `Estado`, omitiendo `{ model: User, as: "Solicitante" }` (con `Profile`). Por ello, el personal CIT/Admin no puede ver qué usuario realizó cada solicitud.
4. **Visibilidad de Propuestas para el rol `user` y propuestas dictaminadas para `cit`/`admin`**:
   - `GET /api/propuestas` en `backend/src/routes/propuestas.routes.ts` exige `requireCIT` y el servicio `listPending` filtra únicamente `estado_id = PENDIENTE`. No existe forma de que el usuario `user` consulte sus propias propuestas ni de que el personal `cit`/`admin` consulte el historial de propuestas ya dictaminadas (`APROBADO` / `RECHAZADO`).
5. **Límite de longitud en `Servicio.servicio_nombre`**:
   - En `backend/src/models/servicio.model.ts`, `servicio_nombre` está definido como `DataTypes.STRING(30)`. Nombres reales del catálogo oficial (`Servicios.md`) como `"Análisis Coprológico Cuantitativo"` (33 caracteres) o `"Babesiosis Equina – Piroplasmosis"` (33 caracteres) superan ese límite.

---

## 3. Las Siete Fases de la Línea de Trabajo C (Requisitos Funcionales)

### Fase A — Identidad Visual y Navegación
- **RF-A01 (Tokens de diseño estilo GitHub Dark)**: Definir en `frontend/src/index.css` una paleta neutra oscura de alto contraste legible y descanso visual:
  - Canvas principal: `#0d1117`
  - Superficie secundaria (cards, sidebar, header): `#161b22`
  - Superficie elevada / hover / inputs: `#21262d`
  - Bordes estructurales (`1px solid`): `#30363d`
  - Texto primario: `#e6edf3`, texto secundario/muted: `#8b949e`
  - Acento primario CIT (botones primarios, estados activos): `#238636` (hover `#2ea043`)
  - Colores semánticos estandarizados para estados (`success`, `warning`, `danger`, `info`, `neutral`).
- **RF-A02 (Catálogo de componentes UI base)**: Proveer componentes reutilizables en `src/components/ui/`: `Button`, `Badge`, `Card`, `PageHeader`, `EmptyState`, `Alert`, `Skeleton`, `Modal` y `SearchFilterBar`.
- **RF-A03 (Shell de navegación estilo GitHub)**: Actualizar `Layout.tsx` con:
  - Barra superior (`TopHeader`) con identidad de marca CITio, indicador de sección actual (breadcrumb/título), badge de rol (`Usuario`, `Personal CIT`, `Administrador`), acceso directo a `Mi perfil` en la esquina superior (o botones de `Iniciar sesión` / `Registrarse` si no hay sesión) y opción para **ocultar y volver a mostrar la barra superior**.
  - Barra lateral (`Sidebar`) responsiva (colapsable mediante drawer en móvil `< 768px` y fija en desktop) con íconos SVG limpios, etiquetas contextuales por rol e indicador visual de ruta activa (`NavLink`).
- **RF-A04 (Alineación estética de Login y Registro)**: Integrar visualmente `Login.tsx` y `Register.tsx` a la estética de tarjetas sobrias estilo GitHub sin alterar su lógica ni los tests de Spec-001.

### Fase B — Home (Presentación Institucional y Panel de Inicio)
- **RF-B01 (Bienvenida personalizada o general)**:
  - Para usuarios autenticados: mostrar saludo con su nombre visible (`Hola, {Nombre}`) y badge de rol institucional.
  - Para usuarios anónimos: mostrar bienvenida general (`Bienvenido a CITio`) con accesos a inicio de sesión y registro.
- **RF-B02 (Sección institucional del CIT Formosa y de CITio)**:
  - Explicar qué es el **CIT Formosa** (Centro de Investigaciones y Transferencia de Formosa, unidad de triple dependencia CONICET - UNaF - Gobierno de la Provincia de Formosa), a qué se dedica y qué líneas de investigación y servicios tecnológicos desarrolla.
  - Explicar qué es **CITio**, cuál es su objetivo y qué problemas resuelve (acceso unificado al catálogo, trazabilidad de solicitudes y canal de propuestas productivas).
- **RF-B03 (Ejemplos representativos de servicios y capacitaciones)**:
  - Mostrar las áreas diagnósticas oficiales del documento `Servicios.md` (`Bioquímica Clínica`, `Parasitología y Ectoparásitos`, `Salud Equina`, `Enfermedades Venéreas y Serología`), las acciones reales de formación/transferencia/divulgación del CIT y sincronizar los servicios/publicaciones activos desde el backend.
- **RF-B04 (Accesos visuales a las secciones principales)**: Tarjetas de acceso directo a `Servicios`, `Solicitudes`, `Publicaciones`, `Propuestas` y `Mi Perfil`.

### Fase C — Servicios (Catálogo, Detalle, Contratación y Calificaciones/Reseñas)
- **RF-C01 (Exploración, búsqueda y filtro de Servicios)**: Listar el catálogo de servicios en tarjetas estructuradas que muestren: nombre del servicio, sector (`Badge`), descripción, arancel/modalidad (`$ X` o `"Consultar"` si el precio es `0`), proveedor, calificación promedio y acceso al detalle.
- **RF-C02 (Barra de filtrado en cliente)**: Permitir buscar servicios por texto (nombre, descripción o área) y filtrar por `Sector`.
- **RF-C03 (Creación de servicio por personal CIT/Admin)**: Formulario exclusivo para `cit`/`admin` con validación de campos (`nombre`, `sector`, `precio >= 0`, `descripcion`, `imagenUrl` opcional).
- **RF-C04 (Vista detallada `/servicios/:id`)**: Mostrar nombre, descripción, área/sector, arancel, profesional responsable, condiciones de contratación, imagen/documentación adjunta si existe, calificación promedio y listado de reseñas verificadas.
- **RF-C05 (Contratación con prevención de duplicados)**: El rol `user` puede solicitar/contratar un servicio (`POST /api/solicitudes`). Tanto el backend (`409 Conflict`) como el frontend bloquean solicitudes duplicadas si el usuario ya posee una solicitud en curso (`PENDIENTE`, `APROBADO`, `ACEPTADA`) para ese mismo servicio.
- **RF-C06 (Calificaciones y Reseñas verificadas)**:
  - Permitir a usuarios `user` calificar (`1` a `5` estrellas) y reseñar (`10` a `1000` caracteres) un servicio mediante `POST /api/servicios/:id/resenas`.
  - Restricción antifraude verificada en backend: solo usuarios `user` que hayan solicitado previamente el servicio (con estado distinto de `RECHAZADO`) pueden calificarlo (`403 Forbidden`), y solo se admite una única reseña por usuario y servicio (`409 Conflict` / índice único `(servicio_id, user_id)`).

### Fase D — Solicitudes (Bandeja Interna de Propuestas de Organismos)
- **RF-D01 (Visibilidad y Permisos Exclusivos `cit`/`admin`)**: El apartado `/solicitudes` está protegido en frontend (`ProtectedRoute roles={["cit", "admin"]}` y ocultamiento en `Layout`/`Home`) y en backend (`requireCIT` en lectura de propuestas de terceros, toma en revisión y dictamen). Los usuarios `user` no pueden acceder (`403`).
- **RF-D02 (Listado de Propuestas Recibidas con Búsqueda, Filtros y Ordenamiento)**: Mostrar lista de propuestas recibidas con nombre del organismo (`nombre_organismo`), nombre de la propuesta (`titulo`), área orientada (`Sector`), fecha de presentación y estado de revisión (`PENDIENTE`, `EN_REVISION`, `ACEPTADA`/`APROBADO`, `RECHAZADO`), permitiendo búsqueda textual, filtro por estado y área, y ordenamiento (`recientes`, `antiguas`, `titulo`).
- **RF-D03 (Detalle Completo de Propuesta y Documentación)**: Al seleccionar una propuesta, mostrar información del organismo, correo electrónico (`email_contacto`), número de teléfono o WhatsApp (`telefono_contacto`), nombre de la propuesta (`titulo`), área (`Sector`), descripción de utilidad y funciones (`problematica`), bienes o recursos propuestos (`bienes_recursos`) y archivos adjuntos (`documento_url`, `documento_nombre`) con opciones para visualizar y descargar.
- **RF-D04 (Flujo de Revisión de 4 Estados y Conversión Automática en Servicio)**:
  1. `PENDIENTE` (Pendiente)
  2. `EN_REVISION` (En revisión — acción `PATCH /api/propuestas/:id/revision` que registra revisor y fecha)
  3. `ACEPTADA` / `APROBADO` (Aceptada — acción transaccional que exige justificación, valida los datos del servicio y **crea automáticamente el servicio correspondiente en el catálogo `Servicios`** con trazabilidad bidireccional `servicio_generado_id` ↔ `propuesta_id`, evitando duplicados)
  4. `RECHAZADO` (Rechazada — registra justificación obligatoria, revisor y fecha).

### Fase E — Publicaciones
- **RF-E01 (Listado y Filtrado de Publicaciones Institucionales y Técnicas)**: Mostrar publicaciones contemplando categorías institucionales (`noticia`, `jornada`, `inscripcion`, `capacitacion`) y boletines técnicos (`patologia`, `enfermedad`, `parasito`, `plaga`, `otro`), badge de `Sector`, autor, fecha de publicación, imagen destacada opcional, extracto del contenido y contador de recursos adjuntos. Incluir pestañas rápidas de categoría, búsqueda textual y filtros por categoría, área y estado de publicación.
- **RF-E02 (Administración y Estados de Publicación para CIT/Admin)**: Permitir a `cit` y `admin` crear publicaciones (`POST /api/publicacion/crear` / `POST /api/publicacion`), editar (`PUT /api/publicacion/:id`), publicar o despublicar (`PATCH /api/publicacion/:id/estado` con campo `publicado: boolean`) y eliminar (`DELETE /api/publicacion/:id`). Los usuarios normales (`user`) y visitantes solo consultan las publicaciones publicadas (`publicado = true`).
- **RF-E03 (Vista de Detalle `PublicacionDetalle.tsx`)**: Presentar la publicación completa con diseño editorial limpio, metadatos de categoría, sector, autor y fecha, estado de publicación para CIT/Admin y galería de recursos visuales (`imagen` con modal de ampliación y `video` con acceso directo).
- **RF-E04 (Gestión de Recursos Visuales y Archivos Adjuntos)**: Permitir a `cit`/`admin` adjuntar recursos visuales al crear/editar la publicación o desde la vista de detalle (`POST /api/publicacion/:publicacionId/archivos` con `tipo: "imagen" | "video"`, `archivo_url`, `archivo_nombre`, `orden`) y eliminar adjuntos existentes (`DELETE /api/archivo/:id`).

### Fase F — Propuestas
- **RF-F01 (Presentación Institucional y Visibilidad por Rol)**: Disponible para usuarios normales (`user`) registrados; no permite que usuarios anónimos envíen propuestas ni que los roles `cit`/`admin` utilicen el formulario como usuarios externos (redirigiéndolos a `/solicitudes`). Incluye texto institucional explicando la convocatoria para organizaciones productivas (especialmente organizaciones agricultoras) y el botón visible **"Realizar propuesta"**.
- **RF-F02 (Formulario Completo de 8 Campos y Carga Segura de Documentación)**: Incluye (1) Nombre del organismo, (2) Correo electrónico, (3) Número de teléfono/WhatsApp, (4) Nombre de la propuesta, (5) Área orientada, (6) Información detallada sobre utilidad y funciones (mín. 20 caracteres), (7) Bienes o recursos que propone y (8) Archivo adjunto de documentación (`multipart/form-data`, máx. 1 archivo de hasta 5 MB en formato PDF/PNG/JPG, validado por extensión y firma binaria en servidor y servido mediante ruta autenticada `/api/uploads/:filename` con protección contra path traversal).
- **RF-F03 (Seguimiento, Prevención de Duplicados e Integración con Fase D)**: Asocia la propuesta al usuario autenticado con estado inicial `PENDIENTE`, evita envíos duplicados accidentales en cliente y servidor (`409 Conflict`), muestra al usuario el historial de sus propuestas con estado (`Pendiente`, `En revisión`, `Aceptada`, `Rechazada`), justificación técnica del CIT y enlace directo al servicio publicado (`/servicios/:id`) cuando es aceptada.

### Fase G — Mi Perfil
- **RF-G01 (Resumen de Cuenta, Rol y Protección de Atributos Administrativos)**: Mostrar tarjeta de identidad con avatar (imagen o iniciales), nombre completo, `@username`, biografía/descripción (`bio`), correo electrónico verificado, badge de rol (`labelDeRol`) y contadores de actividad. El correo electrónico, rol, permisos y estado de aprobación CIT se muestran bloqueados (`readOnly`/`disabled`) y el backend ignora/rechaza cualquier intento de modificarlos o de acceder a datos de otra cuenta (`requireSelfOnly` → `403`).
- **RF-G02 (Edición de Datos Personales y Seguridad)**: Formulario para actualizar `nombre` (`first_name`), `apellido` (`last_name`), `bio` (descripción personal) y `avatarUrl` (`avatar_url`) vía `PUT /api/profile/:userId`, sincronizando con `AuthContext` (`refresh`), más formulario de cambio de contraseña (`PUT /api/change-password`).
- **RF-G03 (Sección Mis Propuestas)**: Mostrar las propuestas presentadas por el usuario autenticado (nombre, fecha, área, estado) con modal para consultar sus detalles y el resultado de la revisión técnica del CIT (justificación, fecha de dictamen y enlace al servicio generado).
- **RF-G04 (Sección Mis Servicios)**: Mostrar los servicios contratados o activos del usuario autenticado (nombre del servicio, estado de contratación, fecha de solicitud e información de seguimiento).
- **RF-G05 (Sección Mis Capacitaciones)**: Mostrar las capacitaciones en las que el usuario está inscripto o participa (`InscripcionCapacitacion`, `GET /api/mis-capacitaciones`, `POST /api/capacitaciones/:publicacionId/inscribirse`), incluyendo nombre, descripción, estado de inscripción (`Inscripto`, `En curso`, `Finalizado`), fechas y área vinculada.

---

## 4. Requisitos No Funcionales (RNF)

- **RNF-01 (Arquitectura en Capas Consistente)**: Extender el patrón `domain/` → `lib/` → `repositories/` → `services/` → `pages/components` a todos los módulos de las Fases B–G, evitando que los componentes React dependan de nombres de columnas en `snake_case` o alias internos de Sequelize.
- **RNF-02 (Tipado Estricto)**: Cero uso de `any` (`tsconfig.json` con `strict: true`). Todos los contratos de entrada/salida deben estar tipados en `src/domain/`.
- **RNF-03 (Diseño Responsivo y Accesibilidad)**: Navegación y vistas adaptables desde `360px` (móvil) hasta `1440px+` (desktop). Uso correcto de etiquetas `<label>`, atributos `aria-*`, contraste mínimo WCAG AA y manejo de foco en modales/formularios.
- **RNF-04 (Feedback de Estados Asíncronos)**: Toda vista que consulte la API debe contemplar explícitamente 4 estados visuales: **Cargando** (`Skeleton` o spinner), **Error** (`Alert` con opción de reintentar), **Vacío** (`EmptyState` descriptivo) y **Con datos**.
- **RNF-05 (Pruebas Automatizadas)**: Pruebas unitarias y de integración con Vitest + React Testing Library para mapeadores/servicios, componentes UI base y flujos principales de las Fases A–G, manteniendo el 100% de las pruebas de Spec-001 en verde.

---

## 5. Reglas de Negocio y Matriz de Permisos por Rol

### 5.1 Reglas de Negocio Confirmadas
1. **Jerarquía de roles**:
   - `user`: Usuario externo / productor / cliente que consume información, solicita servicios y presenta propuestas de vinculación.
   - `cit`: Personal técnico/científico del Centro de Innovación Tecnológica.
   - `admin`: Administrador de la plataforma. Posee todos los permisos operativos de `cit` (`esPersonalCIT(rol)` devuelve `true` tanto para `cit` como para `admin` según `requireCIT` en backend y `src/domain/roles.ts` en frontend).
2. **Inmutabilidad del rol en registro público**: El registro público siempre asigna rol `user` (Spec-001).
3. **Dictamen de propuestas**:
   - Solo una propuesta en estado `PENDIENTE` puede ser dictaminada (`409 Conflict` si ya fue evaluada).
   - El dictamen solo admite los estados `APROBADO` o `RECHAZADO` y requiere obligatoriamente `cit_justificacion`.
4. **Autoría en ediciones**:
   - Las publicaciones pueden ser creadas, editadas y eliminadas por cualquier miembro con rol `cit` o `admin`.

### 5.2 Matriz de Permisos por Rol (Fases A–G)

| Módulo / Acción | `user` (Usuario) | `cit` (Personal CIT) | `admin` (Administrador) | Endpoint Backend Asociado |
| :--- | :---: | :---: | :---: | :--- |
| **Home**: Ver dashboard y actividad reciente | Sí (vista cliente) | Sí (vista gestión) | Sí (vista gestión) | `GET /api/servicios`, `/solicitudes`, `/publicaciones`, `/propuestas` |
| **Catálogos**: Listar sectores y estados | Sí | Sí | Sí | `GET /api/sectores`, `GET /api/estados` |
| **Servicios**: Listar y filtrar catálogo | Sí | Sí | Sí | `GET /api/servicios` |
| **Servicios**: Crear nuevo servicio | No | Sí | Sí | `POST /api/servicios` |
| **Servicios**: Solicitar un servicio | Sí | No | No | `POST /api/solicitudes` |
| **Solicitudes**: Ver mis solicitudes | Sí (propias) | No (ve todas) | No (ve todas) | `GET /api/solicitudes` |
| **Solicitudes**: Ver todas las solicitudes y cambiar estado | No | Sí | Sí | `GET /api/solicitudes`, `PATCH /api/solicitudes/:id/estado` |
| **Publicaciones**: Listar, filtrar y ver detalle + adjuntos | Sí | Sí | Sí | `GET /api/publicaciones`, `GET /api/publicacion/:id` |
| **Publicaciones**: Crear, editar y eliminar publicación | No | Sí | Sí | `POST /api/publicacion`, `PUT /api/publicacion/:id`, `DELETE /api/publicacion/:id` |
| **Publicaciones**: Adjuntar y eliminar archivos (`imagen`/`video`) | No | Sí | Sí | `POST /api/publicacion/:id/archivos`, `DELETE /api/archivo/:id` |
| **Propuestas**: Crear propuesta de problemática | Sí | No | No | `POST /api/propuesta/crear` |
| **Propuestas**: Ver mis propuestas enviadas y su dictamen | Sí *(requiere ajuste API)* | N/A | N/A | `GET /api/propuestas` *(ver Sección 8)* |
| **Propuestas**: Listar propuestas y emitir dictamen | No | Sí | Sí | `GET /api/propuestas`, `PATCH /api/propuesta/:id/dictamen` |
| **Mi Perfil**: Ver y editar nombre, apellido y avatar | Sí (propio) | Sí (propio) | Sí (propio) | `GET /api/profile`, `PUT /api/profile/:userId` |
| **Mi Perfil**: Cambiar contraseña | Sí | Sí | Sí | `PUT /api/change-password` |

---

## 6. Criterios de Aceptación por Fase

- **CA-Fase A**:
  1. Todas las vistas autenticadas utilizan la paleta de tokens oscuros inspirada en GitHub (`#0d1117`, `#161b22`, `#30363d`, `#238636`).
  2. El `Layout` muestra barra superior con usuario/rol/avatar y menú lateral responsivo funcional en móvil y desktop.
- **CA-Fase B**:
  1. `Home.tsx` muestra contadores reales obtenidos de la API, accesos directos diferenciados según `esPersonalCIT(user.rol)` y últimas publicaciones/solicitudes.
- **CA-Fase C**:
  1. `GET /api/servicios` responde `200 OK` tras montar `serviciosRouter` en el backend.
  2. El catálogo permite buscar por texto y filtrar por sector en tiempo real.
  3. `cit`/`admin` pueden crear servicios; `user` puede solicitarlos con confirmación visual.
- **CA-Fase D**:
  1. `Solicitudes.tsx` permite filtrar por estado y buscar por texto.
  2. `cit`/`admin` visualizan el nombre/usuario del solicitante en cada fila y pueden cambiar el estado con feedback inmediato.
- **CA-Fase E**:
  1. `Publicaciones.tsx` permite filtrar por sector, filtrar por tipo de contenido y buscar por título/contenido.
  2. En `PublicacionDetalle.tsx`, `cit`/`admin` pueden agregar y eliminar archivos adjuntos (`imagen`/`video`) y todos los roles pueden visualizarlos correctamente.
- **CA-Fase F**:
  1. `user` puede enviar una propuesta y consultar en la misma pantalla el listado de sus propuestas enviadas con su estado y la justificación del CIT cuando sea dictaminada.
  2. `cit`/`admin` pueden alternar entre propuestas pendientes e historial de dictaminadas, y aprobar/rechazar ingresando una justificación obligatoria.
- **CA-Fase G**:
  1. El usuario puede actualizar su nombre, apellido y URL de avatar viendo el cambio reflejado inmediatamente en el header sin recargar la página.
  2. El usuario puede cambiar su contraseña actual por una nueva mediante `PUT /api/change-password` con validación en cliente y servidor.

---

## 7. Restricciones y Funcionalidades Fuera de Alcance

### 7.1 Fuera de Alcance en Spec-002
- Panel exclusivo de Administración de Usuarios (`POST /api/users/cit`, `PATCH /api/users/:id/deactivate`, flujo de postulaciones CIT `citApplications` y activación por token `citActivation`), el cual corresponde a una especificación separada de Administración, salvo que el usuario indique incluir un enlace o vista adicional.
- Pasarela de pagos en línea o facturación electrónica para servicios arancelados.
- Notificaciones push en tiempo real (WebSockets).
- Modificación del mecanismo de autenticación JWT Bearer ya cerrado en Spec-001.

---

## 8. Requisitos Confirmados vs. Decisiones Pendientes de Validación

### 8.1 Requisitos Confirmados (Listos para implementar tras aprobación)
- Rediseño visual completo inspirado en GitHub Dark con Tailwind CSS v4.
- Implementación completa de las Fases A, B, C, D, E, F y G.
- Corrección de los bugs de integración en backend: montar `serviciosRouter` en `backend/src/routes/index.ts`, agregar `requireCIT` en `POST /api/servicios` e incluir `Solicitante` en `solicitud.repository.ts`.
- Integración del cambio de contraseña (`PUT /api/change-password`) en `Perfil.tsx`.
- Gestión de archivos adjuntos de publicaciones (`POST /api/publicacion/:publicacionId/archivos` y `DELETE /api/archivo/:id`) en el frontend.

### 8.2 Decisiones Validadas e Implementadas
1. **DEC-01 — Visibilidad de Propuestas para `user` e historial para `cit`/`admin` (Resuelta)**:
   - `GET /api/propuestas` permite `requireAuth`: si el rol es `user`, devuelve exclusivamente sus propias propuestas (`solicitante === user.id`) en todos los estados junto con el dictamen y el servicio generado; si es `cit` o `admin`, devuelve todas las propuestas para su revisión en `/solicitudes`.
2. **DEC-02 — Modalidad de carga de archivos en Publicaciones, Propuestas y Avatar (Resuelta)**:
   - En **Propuestas** (`POST /api/propuestas` / `POST /api/propuesta/crear`) se implementó carga `multipart/form-data` con `multer` y validación de firma binaria (`file-type`, PDF/PNG/JPG hasta 5 MB), servida bajo control de acceso por propietario o revisor CIT en `GET /api/uploads/:filename`.
   - En **Publicaciones**, **Servicios** y **Avatar** se mantiene soporte de recursos visuales con previsualización y fallback seguro ante errores de carga.
3. **DEC-03 — Longitud de `servicio_nombre` y catálogo oficial (`Servicios.md`) (Resuelta)**:
   - Se amplió `Servicio.servicio_nombre` a `VARCHAR(120)` y `Publicacion.titulo` a `VARCHAR(160)` de forma no destructiva mediante `ensureSchemaExtensions()` en `catalogSeed.service.ts`.

---

## 9. Registro de Implementación y Validación Final (Prompt 8)

### 9.1 Resumen de Funcionalidades Implementadas
- **Fase A (Identidad Visual y Navegación)**: Sistema de tokens oscuros en `index.css`, kit de 9 componentes UI (`Alert`, `Badge`, `Button`, `Card`, `EmptyState`, `Modal`, `PageHeader`, `SearchFilterBar`, `Skeleton`), `Layout.tsx` con barra superior y barra lateral institucional verde (`#0d2e0f`) ocultable en desktop y drawer en móvil, y preservación del diseño espacial original de `Login.css`/`Register.css`.
- **Fase B (Home Institucional)**: Portada institucional de CIT Formosa (CONICET - UNaF - Gobierno de Formosa) y explicación de CITio, saludo personalizado por usuario autenticado o bienvenida general para visitantes, ejemplos oficiales de servicios/capacitaciones y sincronización en vivo con el backend.
- **Fase C (Servicios)**: Catálogo con búsqueda y filtro por área, vista detallada `/servicios/:id`, solicitud/contratación con prevención de duplicados (`409 Conflict`) y sistema de calificaciones (`1..5`) y reseñas verificadas (`ResenaServicio`).
- **Fase D (Solicitudes CIT)**: Bandeja interna `/solicitudes` exclusiva para `cit` y `admin`, flujo de 4 estados (`PENDIENTE` → `EN_REVISION` → `ACEPTADA`/`APROBADO` o `RECHAZADO`), inspección/descarga protegida de documentación y creación transaccional automática del `Servicio` con trazabilidad (`servicio_generado_id` ↔ `propuesta_id`).
- **Fase E (Publicaciones)**: Soporte de categorías institucionales (`noticia`, `jornada`, `inscripcion`, `capacitacion`) y técnicas, estado `publicado` (`boolean`) con filtrado automático de borradores para `user`/visitantes, galería multimedia con lightbox y gestión de adjuntos (`imagen`/`video`).
- **Fase F (Propuestas)**: Presentación institucional para organizaciones productivas (`user`), botón `"Realizar propuesta"`, formulario de 8 campos con adjunto validado, selector de área con respaldo de catálogo oficial (`SECTORES_OFICIALES_CIT`), prevención de duplicados y seguimiento de dictamen.
- **Fase G (Mi Perfil)**: Edición de datos personales (`first_name`, `last_name`, `bio`, `avatar_url`), bloqueo de atributos administrativos (`email`, `rol`), cambio de contraseña (`PUT /api/change-password`) y secciones **Mis Propuestas**, **Mis Servicios** y **Mis Capacitaciones** (`InscripcionCapacitacion`).

### 9.2 Hallazgos de la Auditoría Independiente (Resueltos) y Limitaciones Conocidas
Durante la auditoría independiente de código se identificaron y corrigieron 5 hallazgos puntuales (`D-01` a `D-05`):

1. **Hallazgos de coherencia y seguridad corregidos (`D-01` a `D-05`)**:
   - **D-01 (`POST /api/solicitudes` con `requireUser` en backend — Corregido)**: Se agregó `requireUser` en `backend/src/routes/solicitudes.routes.ts` para alinear el backend con el frontend y la matriz de permisos (`403` si `cit` o `admin` intenta contratar un servicio).
   - **D-02 (Navegación anónima en `frontend/src/App.tsx` — Corregido)**: Se separaron las rutas públicas de lectura (`/`, `/servicios`, `/servicios/:id`, `/publicaciones`, `/publicaciones/:id`) dentro de `<Layout />`, manteniendo `<ProtectedRoute />` únicamente sobre `/propuestas`, `/perfil` y `/solicitudes` (`roles={["cit", "admin"]}`).
   - **D-03 (`GET /api/publicacion/:publicacionId/archivos` en borradores y validación de URL — Corregido)**: `archivo.controller.ts` y `archivo.service.ts` verifican ahora que si `publicacion.publicado === false` solo pueda consultarla personal `cit`/`admin` (`404` para el resto), y validan que `archivo_url` comience con `http://`, `https://` o `/` (`400` ante esquemas inválidos).
   - **D-04 (Validación de `tipo_contenido` en `inscribirCapacitacion` — Corregido)**: `profile.service.ts` valida que la publicación sea de tipo `'capacitacion'`, `'inscripcion'` o `'jornada'` antes de registrar la inscripción (`400` en caso contrario).
   - **D-05 (Validación simétrica de campos de organismo en `propuesta.service.ts` y `fileFilter` en `upload.ts` — Corregido)**: `propuesta.service.ts` exige en el servidor todos los datos obligatorios del organismo y bienes/recursos, y `backend/src/helpers/upload.ts` filtra extensiones y tipos MIME permitidos (`.pdf`, `.png`, `.jpg`, `.jpeg`).

2. **Estado real del módulo de Capacitaciones (Auditoría Sección 4)**:
   - No existe una entidad `Capacitacion` independiente con tabla propia de cursos; las capacitaciones se modelan como registros de `Publicacion` con `tipo_contenido` (`'capacitacion'`, `'inscripcion'`, `'jornada'`), y las inscripciones se registran en la tabla `InscripcionesCapacitaciones` (`InscripcionCapacitacion`).
   - **Implementado**: Prevención de inscripciones duplicadas (`409 Conflict` e índice único `(user_id, publicacion_id)`), estados `INSCRIPTO` / `EN_CURSO` / `FINALIZADO`, y listado en `Perfil.tsx` (**Mis Capacitaciones**).
   - **No implementado / Limitaciones del modelo actual**:
     - `inscribirCapacitacion` en `profile.service.ts` verifica que la publicación exista y esté publicada (`publicado !== false`), pero no restringe que `tipo_contenido` sea exclusivamente `'capacitacion' | 'inscripcion' | 'jornada'`.
     - No existe control de cupos máximos (`cupo`) ni fechas estructuradas de inicio/fin de cursada (`fecha_inicio`, `fecha_fin`) separadas de `createdAt`.
     - No existe endpoint para cancelar/dar de baja una inscripción (`CANCELADO`) ni interfaz para que el personal CIT cambie el estado de inscripción de un alumno a `EN_CURSO` o `FINALIZADO`.

3. **Limitaciones fuera de alcance de Spec-002**:
   - Panel de administración de usuarios (`/api/users`, `/api/cit-applications`).
   - Pasarela de pagos en línea para aranceles de servicios.
   - Notificaciones en tiempo real por WebSockets.
