# CITio — Gestor de Servicios

Plataforma web para conectar a productores y entidades del sector agropecuario con el Centro de Investigación y Transacciones de Formosa (CIT). El objetivo es facilitar la consulta y solicitud de servicios, la presentación de problemáticas y propuestas, y la publicación de información y recursos de interés para el sector.

> **Estado del proyecto:** este documento resume el código y la documentación presentes en el repositorio. La existencia de una funcionalidad o de una prueba no significa por sí sola que se haya validado en el entorno actual. Antes de desplegar, revisá las notas sobre diferencias entre configuraciones al final de este README.

## Contenido

- [Alcance y funcionalidades](#alcance-y-funcionalidades)
- [Arquitectura](#arquitectura)
- [Tecnologías](#tecnologías)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Ejecución local](#ejecución-local)
- [Pruebas y comandos](#pruebas-y-comandos)
- [Documentación y operación](#documentación-y-operación)
- [Estado y observaciones](#estado-y-observaciones)

## Alcance y funcionalidades

### Usuarios, autenticación y perfiles

- Registro público de usuarios con rol `user`; el registro no debe permitir asignarse roles privilegiados.
- Inicio y cierre de sesión con JWT, admitido mediante cookie y/o encabezado HTTP de autorización, según el flujo.
- Recuperación y cambio de contraseña.
- Consulta y actualización de perfil, con controles de acceso para el propio usuario y administración.
- Consulta y administración de usuarios y roles desde rutas protegidas.
- Roles definidos en el backend: `user`, `cit` y `admin`.

Las rutas principales están en [`backend/src/routes/auth.routes.ts`](backend/src/routes/auth.routes.ts), [`backend/src/routes/profile.routes.ts`](backend/src/routes/profile.routes.ts) y [`backend/src/routes/user.routes.ts`](backend/src/routes/user.routes.ts). El estado de autenticación de la aplicación web se administra desde [`frontend/src/context/AuthContext.jsx`](frontend/src/context/AuthContext.jsx).

### Servicios, solicitudes y propuestas

- Catálogos de sectores y estados.
- Consulta y creación de servicios ofrecidos por el CIT.
- Creación y consulta de solicitudes de servicios, con asociación entre solicitante, servicio y estado.
- Presentación y revisión de propuestas de problemáticas.

Las rutas correspondientes están en [`backend/src/routes/catalogos.routes.ts`](backend/src/routes/catalogos.routes.ts), [`backend/src/routes/servicios.routes.ts`](backend/src/routes/servicios.routes.ts), [`backend/src/routes/solicitudes.routes.ts`](backend/src/routes/solicitudes.routes.ts) y [`backend/src/routes/propuestas.routes.ts`](backend/src/routes/propuestas.routes.ts).

### Publicaciones y archivos

- Consulta de publicaciones y de su detalle.
- Creación, modificación y eliminación de publicaciones por personal CIT.
- Asociación de publicaciones con autor, sector y archivos adjuntos.

La lógica de rutas está en [`backend/src/routes/publicaciones.routes.ts`](backend/src/routes/publicaciones.routes.ts); las entidades relacionadas se encuentran en [`backend/src/models/`](backend/src/models/).

### Incorporación y activación de personal CIT

El proyecto incluye un flujo para solicitar la incorporación de personal CIT:

- Recepción de datos personales y fotografías del frente y dorso del DNI.
- Validaciones documentadas de DNI duplicado, archivos obligatorios, tamaño máximo y firma real del archivo.
- Estados de solicitud `PENDING`, `APPROVED` y `REJECTED`.
- Revisión administrativa con registro de quién revisó, fecha y motivo de rechazo.
- Aprobación que crea una cuenta CIT y genera un token de activación.
- Activación de la cuenta mediante token con vencimiento y uso único.
- Almacenamiento privado de documentos y endpoint protegido para su consulta.

La solicitud de incorporación no equivale al registro público: la asignación del rol CIT forma parte del proceso de revisión. La lógica está en [`backend/src/services/citApplication.service.ts`](backend/src/services/citApplication.service.ts), [`backend/src/services/activation.service.ts`](backend/src/services/activation.service.ts) y las rutas de [`backend/src/routes/citApplications.routes.ts`](backend/src/routes/citApplications.routes.ts) y [`backend/src/routes/citActivation.routes.ts`](backend/src/routes/citActivation.routes.ts).

### Notificaciones Outbox

El backend incluye un modelo y repositorio de notificaciones Outbox y un worker que procesa mensajes pendientes. [`FUNCIONALIDADES.md`](FUNCIONALIDADES.md) documenta el envío de avisos a administradores y de activaciones, el registro de intentos y los reintentos ante errores. El worker está en [`backend/src/workers/outboxWorker.ts`](backend/src/workers/outboxWorker.ts).

### Interfaz web

La aplicación React dispone de vistas para:

- Inicio.
- Servicios.
- Solicitudes.
- Propuestas.
- Listado y detalle de publicaciones.
- Perfil.
- Registro e inicio de sesión.

Las rutas se configuran en [`frontend/src/App.jsx`](frontend/src/App.jsx). Los servicios HTTP del cliente están en [`frontend/src/services/`](frontend/src/services/), y [`frontend/src/components/ProtectedRoute.jsx`](frontend/src/components/ProtectedRoute.jsx) protege las rutas autenticadas.

## Arquitectura

```text
Navegador (React / Vite)
        │ HTTP
        ▼
API REST (Node.js / Express / TypeScript)
        │ Sequelize
        ▼
PostgreSQL

API ──► correo / worker Outbox
API ──► endpoint de métricas Prometheus (/metrics)
```

El backend organiza el código en rutas, controladores, servicios, repositorios y modelos. Las asociaciones entre las entidades principales se centralizan en [`backend/src/models/index.ts`](backend/src/models/index.ts). La inicialización de la aplicación Express está en [`backend/src/app.ts`](backend/src/app.ts), y las rutas API se montan bajo `/api`.

## Tecnologías

Las dependencias declaradas actualmente incluyen:

- **Backend:** Node.js, TypeScript, Express, Sequelize, PostgreSQL (`pg`), JWT (`jsonwebtoken`), bcrypt, Multer, `file-type`, CORS, `cookie-parser` y `dotenv`.
- **Frontend:** React, React DOM, React Router DOM, Vite, Axios y Tailwind CSS.
- **Pruebas y calidad:** pruebas del backend con el ejecutor de pruebas de Node mediante `tsx`; `oxlint` en el frontend.
- **Operación:** Docker Compose, Nginx y Prometheus. También hay archivos de despliegue/documentación para Grafana, CI y tareas de mantenimiento.

Para más detalle sobre las tecnologías planeadas y su uso, consultá [`TECNOLOGIAS.md`](TECNOLOGIAS.md). Las dependencias instaladas y los scripts están declarados en [`backend/package.json`](backend/package.json) y [`frontend/package.json`](frontend/package.json).

## Estructura del repositorio

```text
backend/
  src/
    config/         Configuración de entorno y base de datos
    constants/      Roles y estados
    controllers/    Adaptadores HTTP
    helpers/        Autenticación, JWT, contraseñas y cargas
    middlewares/    Autenticación, autorización y errores
    migrations/     Migraciones de base de datos
    models/         Entidades y asociaciones Sequelize
    repositories/   Acceso a datos
    routes/         Endpoints REST
    services/       Lógica de negocio
    workers/        Procesamiento Outbox
  tests/            Pruebas automatizadas del backend
frontend/
  src/
    components/     Layout y rutas protegidas
    context/        Estado de autenticación
    pages/          Vistas de la aplicación
    services/       Cliente y servicios HTTP
docs/               Guías operativas y arquitectura
scripts/            Backup, restore y certificados de desarrollo
```

## Ejecución local

### Requisitos

- Node.js y npm compatibles con las dependencias del proyecto.
- Docker Desktop con Docker Compose, para levantar PostgreSQL y el backend en contenedores.
- Variables de entorno configuradas para base de datos, JWT y, si corresponde, correo.

### Backend y base de datos con Docker Compose

En la raíz del repositorio, configurá las variables que requiere [`compose.yaml`](compose.yaml), incluyendo `DB_PASSWORD` y `JWT_SECRET`. Luego ejecutá:

```powershell
docker compose --env-file backend/.env -f compose.yaml up --build
```

El servicio backend publica el puerto configurado (por defecto `3000`) y PostgreSQL el `5432`. El endpoint raíz `http://localhost:3000/` está definido para responder `{"ok":true}`. Los datos de PostgreSQL y los archivos subidos se conservan en volúmenes de Docker.

Para detener los servicios:

```powershell
docker compose --env-file backend/.env -f compose.yaml down
```

`docker compose down -v` elimina también los volúmenes persistentes y, por lo tanto, los datos; usalo solo cuando realmente quieras borrarlos.

### Desarrollo con npm

Instalá las dependencias en cada aplicación y ejecutá sus servidores de desarrollo desde sus respectivas carpetas:

```powershell
cd backend
npm install
npm run dev
```

```powershell
cd frontend
npm install
npm run dev
```

El frontend usa Vite; configurá la URL de la API de acuerdo con el entorno local antes de iniciar la aplicación.

## Pruebas y comandos

Desde `backend/`:

```powershell
npm test
npm run typecheck
npm run build
```

Desde `frontend/`:

```powershell
npm run lint
npm run build
```

El backend contiene pruebas relacionadas con autenticación, usuarios, perfiles, roles, validación de archivos, solicitudes CIT y activación. Que existan no implica que se hayan ejecutado en cada cambio: corré los comandos anteriores para validar el estado actual.

## Documentación y operación

- [`FUNCIONALIDADES.md`](FUNCIONALIDADES.md): resumen del flujo CIT y de las funciones documentadas.
- [`FASES.md`](FASES.md): informes de fases y avances históricos.
- [`TECNOLOGIAS.md`](TECNOLOGIAS.md): catálogo tecnológico y arquitectura planteada.
- [`docs/architecture.md`](docs/architecture.md): documentación de arquitectura.
- [`docs/sla.md`](docs/sla.md): información sobre SLA.
- [`docs/secret-rotation.md`](docs/secret-rotation.md) y [`docs/secret-rotation-procedure.md`](docs/secret-rotation-procedure.md): rotación de secretos.
- [`docs/backup-restore.md`](docs/backup-restore.md), [`scripts/backup.sh`](scripts/backup.sh) y [`scripts/restore.sh`](scripts/restore.sh): procedimientos y scripts de respaldo.
- [`prometheus.yml`](prometheus.yml) y [`backend/src/metrics.ts`](backend/src/metrics.ts): configuración de recolección de métricas.
- [`.github/workflows/`](.github/workflows): automatización de GitHub Actions presente en el repositorio.

## Estado y observaciones

- [`FASES.md`](FASES.md) registra fases completadas de autenticación, autorización, integración, despliegue y mantenimiento; también conserva la fase de perfiles como “en curso”. Es un historial de avances y puede contener información desactualizada.
- Hay dos archivos Compose con propósitos y servicios distintos. [`compose.yaml`](compose.yaml) declara PostgreSQL y backend; [`docker-compose.yml`](docker-compose.yml) declara API, Prometheus y Grafana, y referencia un servicio `db` que no está definido en ese mismo archivo. Revisá cuál configuración corresponde mantener antes de usar la segunda para despliegue.
- [`TECNOLOGIAS.md`](TECNOLOGIAS.md) describe componentes y herramientas que no necesariamente coinciden con las dependencias o los servicios definidos hoy. Tomá los manifiestos y archivos de configuración como referencia del estado implementado.
- En las capas de seguridad, `FUNCIONALIDADES.md` indica que rate limiting y sanitización no aparecen explícitamente implementados. Revisá esa cobertura antes de exponer la API públicamente.
- El repositorio puede contener cambios locales todavía no incorporados al último commit. Antes de preparar una entrega, revisá `git status` y ejecutá las pruebas y compilaciones correspondientes.

Este proyecto está en evolución. Actualizá este README y la documentación específica cuando cambien las funcionalidades, los comandos o la configuración de despliegue.
