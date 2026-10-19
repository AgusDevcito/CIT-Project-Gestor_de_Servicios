# Spec — 001-autenticación

> **Feature**: Autenticación de la plataforma CITio (Gestor de Servicios)
> **Línea de trabajo**: A — Autenticación
> **Fases**: A (Autenticación) → B (Estado global y rutas) → C (Interfaz, docs y pruebas)
> **Estado**: `spec.md` v1.0 — 2026-10-19
> **Stack**: React 19 + Vite 8 + TypeScript + react-router-dom v7 + axios + Tailwind v4

---

## 1. Contexto y problema

La interfaz de login y registro ya está construida (`src/pages/auth/Login.tsx`,
`src/pages/auth/Register.tsx`) y el frontend ya tiene un `AuthContext` con un
`ProtectedRoute`. Sin embargo, **la comunicación real con el backend no está establecida**:

- El cliente HTTP actual (`src/services/apiClient.js`) fue diseñado para la versión
  **anterior** del backend, que autenticaba con **cookie `HttpOnly`**.
- La versión **actual** del backend (arquitectura SOA en TypeScript) **revirtió a
  autenticación por token Bearer en el header `Authorization`** y ya no lee cookies.
- En consecuencia, hoy el login **no puede funcionar** contra el backend real: la cookie
  nunca se envía, el backend responde `401` y el frontend no reintenta con el header.

Además, el frontend **aún no es TypeScript** (0 archivos `.ts`/`.tsx`, sin `tsconfig.json`)
y la migración a TypeScript del backend **no ha llegado a la rama de trabajo**.

**Resultado buscado:** un usuario puede registrarse, iniciar sesión y **mantener una sesión
válida** durante toda la navegación de la plataforma, con el estado de autenticación
compartido por toda la aplicación.

---

## 2. Objetivo

> **Como usuario de la plataforma, quiero registrarme e iniciar sesión para acceder a las
> funcionalidades del Gestor de Servicios, y quiero que mi sesión se mantenga válida entre
> navegaciones, de modo que no tenga que autenticarme repetidamente.**

---

## 3. Alcance

### 3.1 Incluido (Línea de trabajo A)

| Fase | Alcance |
|---|---|
| **A — Autenticación** | Comunicación real con el backend: `register`, `login`, `logout`, `profile`. Persistencia del token, envío automático del header `Authorization`, manejo de expiración y errores. |
| **B — Estado global y rutas** | `AuthContext` como única fuente de verdad de la sesión. `ProtectedRoute` que protege el árbol privado. Redirección a `/login` y a `/` tras autenticar. |
| **C — Interfaz, docs y pruebas** | Login/registro conectados al servicio real, estados de carga/error, documentación del contrato y pruebas automatizadas del flujo de autenticación. |

### 3.2 Fuera de alcance (esta línea de trabajo)

- Recuperación de contraseña, verificación de email, 2FA, OAuth/social login.
- Gestión de sesiones desde el backend (listado de sesiones activas, cerrar sesión en
  otros dispositivos). **El backend no expone refresh token**, por lo que la sesión es
  estrictamente stateless (ver §6).
- Verificación/revisión automática del documento CIT por parte de un administrador.
  Hoy el backend **acepta** el rol `cit` si se adjunta el documento; la **revisión
  humana** del documento no existe todavía.
- Panel de administración de usuarios y de catálogos (`/api/users`, `/api/profiles`,
  `POST /api/sectores`).
- Migración del resto de las páginas (Servicios, Solicitudes, Publicaciones, Propuestas,
  Perfil) al nuevo contrato tipado. Se hará en líneas de trabajo posteriores.

### 3.3 Dependencias externas (bloqueantes)

| # | Dependencia | Estado | Impacto |
|---|---|---|---|
| D-1 | Migración TS del backend presente en la rama de trabajo | **Pendiente** — está en `origin/gonzadvlop` (`051c7f3`), no es ancestro de la rama actual | El contrato de API documentado en §5 no está disponible en la rama actual |
| D-2 | `backend/.env` con `DB_*`, `JWT_SECRET` (y `CORS_ORIGINS` opcional) | **Ausente** | El backend no arranca: `assertEnvironment()` lanza error |
| D-3 | Base de datos PostgreSQL accesible | **Por confirmar** | Sin DB no hay `initDB()` ni seed de catálogos |
| D-4 | Migración del frontend a TypeScript | **Pendiente** | Requisito de esta línea de trabajo (ver T-1) |

---

## 4. Usuarios y roles

| Rol | Puede | Registro |
|---|---|---|
| `user` (Usuario) | Solicitar servicios, crear propuestas, ver publicaciones y su perfil | Sin documento |
| `cit` (Personal CIT) | Todo lo anterior + crear/editar/eliminar publicaciones, dictaminar propuestas, crear servicios, gestionar estados de solicitudes | **Obligatorio** adjuntar documento (PDF/JPG/PNG, máx. 5 MB) |
| `admin` (Administrador) | Gestión de catálogos (`sectores`, `estados`) y listados globales | — |

Definidos en `backend/src/constants/roles.ts` como `ROLES = ["user", "cit", "admin"]`.

> El rol es una decisión del backend, no del frontend. El frontend solo lo **lee** y lo usa
> para condicionar la UI. La **autorización real** está en los middlewares del backend.

---

## 5. Contrato de API (fuente de verdad: backend)

> Verificado contra `origin/gonzadvlop @ 051c7f3` → `backend/src/routes/auth.routes.ts`,
> `controllers/auth.controller.ts`, `services/auth.service.ts`, `middlewares/auth.middleware.ts`,
> `helpers/jwt.ts`, `helpers/upload.ts`, `middlewares/error.middleware.ts`.
> Todas las rutas se montan bajo el prefijo `/api` (`app.use("/api", routes)`).

### 5.1 Mecanismo de autenticación

**Bearer token en el header `Authorization`. No hay cookies.**

```http
Authorization: Bearer <jwt>
```

- `login` **devuelve el token en el body** de la respuesta.
- `requireAuth` **solo** lee el header `Authorization` (verificado: `getTokenFromRequest`
  no consulta `req.cookies`).
- El backend **no** usa `cookie-parser` ni `res.cookie` en el flujo de login.
  (`logout` ejecuta `res.clearCookie("token")`, una línea inerte que queda de la versión anterior).
- **No existe refresh token.** El JWT expira según `JWT_EXPIRES_IN` (por defecto `1h`) y su
  payload es `{ id, email, role }`.

> **Consecuencia directa:** el frontend **debe** almacenar el token y enviarlo en cada
> petición. La estrategia actual (`withCredentials: true` + cookie `HttpOnly`) es
> **incompatible** con este backend y debe ser reemplazada.

### 5.2 Endpoints

| Método | Ruta | Body | Respuesta | Errores |
|---|---|---|---|---|
| `POST` | `/api/register` | `multipart/form-data`: `first_name`, `last_name`, `username`, `email`, `password`, `role` (`user`\|`cit`), y `document` (archivo, **solo si `role = cit`**) | `200` `{ msg, document_url }` | `400` validación / rol inválido / documento faltante (`DOCUMENT_REQUIRED`) · `413` archivo > 5 MB · `500` |
| `POST` | `/api/login` | `application/json`: `{ username, password }` | `200` `{ msg, token }` | `400` campos vacíos · `401` credenciales inválidas · `500` |
| `GET` | `/api/profile` | — (header `Authorization`) | `200` perfil con `User` anidado (ver §5.3) | `401` sin token / token inválido o expirado · `404` perfil inexistente |
| `POST` | `/api/logout` | — (header `Authorization`) | `200` `{ msg }` | `401` sin token |

### 5.3 Forma de la respuesta de `GET /api/profile`

Respuesta **cruda** (sin envoltorio `{ data }`), con el usuario anidado bajo el alias
`User` (Sequelize `include`):

```json
{
  "id": 7,
  "user_id": 7,
  "first_name": "Ana",
  "last_name": "Gomez",
  "avatar_url": null,
  "User": { "id": 7, "username": "ana", "email": "ana@cit.com", "role": "cit" }
}
```

El alias `User` es **estable en la implementación actual**, pero es un detalle de
Sequelize. El frontend debe aislarlo en la capa de repositorio (ver `plan.md` §3) y no
consumirlo directamente desde los componentes.

### 5.4 Formato de error

Todas las respuestas de error del backend usan la misma forma:

```json
{ "msg": "Contraseña Incorrecta", "code": "UNAUTHORIZED" }
```

- `msg` → mensaje en español, apto para mostrar al usuario.
- `code` → identificador estable de máquina (`VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT`,
  `UNAUTHORIZED`, `FORBIDDEN`, `CATALOG_NOT_SEEDED`, `DOCUMENT_REQUIRED`, `INTERNAL_ERROR`).
  El frontend debe **usar `code` para decidir**, y `msg` solo para mostrar.

Los errores de red (servidor caído, CORS, timeout) **no** tienen esta forma: llegan como
error de axios sin `response`. El frontend debe contemplarlos explícitamente.

### 5.5 CORS

El backend TS configuja `cors()` **sin** `credentials: true`. Esto es **correcto** para el
enfoque Bearer: no hay cookies que enviar.

Pero el header `Authorization` no es un header *simple*, por lo que **toda** petición
autenticada dispara un **preflight `OPTIONS`** previo. El paquete `cors` lo responde
automáticamente, y sin `allowedHeaders` explícito refleja el `Access-Control-Request-Headers`
(referente a `authorization`). El frontend debe estar preparado para ese primer `OPTIONS`
— que no lleva el header `Authorization` y por lo tanto **no debe** disparar la lógica de
"sesión expirada".

### 5.6 Variables de entorno del backend relevantes

| Variable | Default | Efecto en el frontend |
|---|---|---|
| `PORT` | `3000` | Base de la URL de la API |
| `JWT_SECRET` | — | **Requerida**; el backend no arranca sin ella |
| `JWT_EXPIRES_IN` | `1h` | Define la duración de la sesión en el cliente |
| `CORS_ORIGINS` | vacío | Lista de orígenes permitidos (separados por `,`). Vacío + `NODE_ENV=production` ⇒ **bloquea todo** |

---

## 6. Requisitos

### 6.1 Funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| **FR-1** | El usuario puede registrarse con nombre, apellido, username, email, contraseña y rol. | Alta |
| **FR-2** | Si el rol es `cit`, el formulario exige un documento (PDF/JPG/PNG, máx. 5 MB) y no habilita el envío sin él. | Alta |
| **FR-3** | El registro envía `multipart/form-data` con el documento cuando corresponde. | Alta |
| **FR-4** | El usuario puede iniciar sesión con username y contraseña. | Alta |
| **FR-5** | Tras un login exitoso, la aplicación navega a `Home` (`/`) y la sesión queda activa. | Alta |
| **FR-6** | Tras un registro exitoso, la aplicación muestra confirmación y permite ir a iniciar sesión. | Alta |
| **FR-7** | La aplicación persiste el token y lo envía automáticamente en **toda** petición al backend. | Alta |
| **FR-8** | La aplicación restaura la sesión al cargar (recarga de página) consultando `GET /api/profile`. | Alta |
| **FR-9** | Un `401` en cualquier petición limpia la sesión local y redirige a `/login`. | Alta |
| **FR-10** | Las rutas privadas son inaccesibles sin sesión; `ProtectedRoute` redirige a `/login`. | Alta |
| **FR-11** | Las rutas públicas (`/login`, `/register`) son inaccesibles con sesión activa; redirigen a `/`. | Media |
| **FR-12** | El usuario puede cerrar sesión; el token local se elimina y se vuelve a `/login`. | Alta |
| **FR-13** | Los errores del backend se muestran con el mensaje `msg` en la interfaz. | Alta |
| **FR-14** | Los roles se exponen al frontend para condicionar la UI (sin ser la frontera de seguridad). | Media |

### 6.2 No funcionales

| ID | Requisito | Criterio |
|---|---|---|
| **NFR-1** | **TypeScript estricto** en el frontend: `strict: true`, sin `any` implícitos, `tsc --noEmit` sin errores. | Script `typecheck` en verde |
| **NFR-2** | **Tipado del contrato**: los tipos del contrato de API están declarados y son la única fuente para el mapeo a modelos de dominio. | Cero `any` en la capa de datos |
| **NFR-3** | **Una sola instancia de cliente HTTP** en toda la app, con el header y la política de 401 centralizados. | Un único `http.ts` importado por los repositorios |
| **NFR-4** | **El dominio no depende de React ni del transporte**: los tipos y reglas de negocio son importables y testeables de forma aislada. | Tests de dominio sin DOM |
| **NFR-5** | **Manejo de errores unificado**: un único punto traduce errores de axios a un tipo de error de dominio, distinguiendo `AppError` del backend, errores de red y errores de validación de formulario. | Un solo helper, usado por todos los servicios |
| **NFR-6** | **Tests automatizados** del flujo de autenticación: repositorio (con `axios` simulado), servicio, `AuthContext` y `ProtectedRoute`. | Cobertura de las ramas críticas |
| **NFR-7** | **Sin secretos en el cliente**: el frontend no expone ni valida la firma del JWT; solo lo transporta. | — |
| **NFR-8** | **La UI no filtra datos sensibles**: el token no se renderiza ni se registra en la consola. | — |
| **NFR-9** | **Documentación del contrato** de auth en `frontend/docs/` para que el backend y el frontend compartan la misma fuente de verdad. | Documento publicado |

---

## 7. Criterios de aceptación

### 7.1 Registro

- **CA-1** Con credenciales válidas y rol `user`, el registro se completa y la UI confirma el alta.
- **CA-2** Con rol `cit` **sin** documento, el formulario bloquea el envío y explica el requisito.
- **CA-3** Con rol `cit` **con** documento válido (PDF/JPG/PNG, ≤ 5 MB), el registro se completa.
- **CA-4** Con un archivo de tipo no permitido (ej. `.exe`), el backend responde `400` y la UI muestra el mensaje.
- **CA-5** Con un archivo de > 5 MB, el backend responde `413` y la UI muestra el mensaje.
- **CA-6** Con un username o email ya existente, se muestra el error devuelto por el backend.

### 7.2 Login

- **CA-7** Con credenciales correctas, se obtiene `200`, se persiste el token, se consulta el perfil y se navega a `/`.
- **CA-8** Con credenciales incorrectas, se muestra el mensaje del backend y **no** se persiste ningún token.
- **CA-9** El botón de envío se deshabilita mientras la petición está en curso (prevención de doble envío).

### 7.3 Sesión

- **CA-10** Tras recargar la página en una ruta privada, la sesión se restaura y la ruta sigue accesible.
- **CA-11** Tras recargar la página en una ruta privada **sin** sesión, se redirige a `/login`.
- **CA-12** Al acceder a `/login` con sesión activa, se redirige a `/`.
- **CA-13** Una petición que devuelve `401` (por expiración) limpia la sesión y redirige a `/login`.
- **CA-14** Cerrar sesión elimina el token local y la UI vuelve al estado deslogueado.
- **CA-15** Ninguna petición al backend se emite sin el header `Authorization` cuando hay sesión activa.

### 7.4 Calidad

- **CA-16** `npm run typecheck` termina sin errores.
- **CA-17** `npm run lint` no reporta errores.
- **CA-18** `npm test` pasa con cobertura de los flujos de CA-7 a CA-15.

---

## 8. Fuera de alcance del contrato actual (deuda conocida)

| # | Deuda | Consecuencia | Mitigación |
|---|---|---|---|
| DK-1 | El token vive en almacenamiento del navegador (accesible a JS) | Un XSS podría exfiltrar la sesión | La capa de almacenamiento es una abstracción: migrar a cookie `HttpOnly` es cambiar **un** módulo. Requiere acuerdo con backend (ver `plan.md` §4, D-1) |
| DK-2 | No hay refresh token | La sesión muere a los 60 min y hay que volver a loguearse | Aceptado para esta línea de trabajo. Requiere endpoint de refresh en el backend |
| DK-3 | `logout` del backend es inerte (no invalida el JWT) | El token sigue siendo válido hasta expirar, aun si el usuario "cierra sesión" | El frontend borra el token local (contención del lado cliente). La invalidación real requiere lista de revocación en backend |
| DK-4 | El backend acepta `role: admin` en el registro | Un usuario podría auto-asignarse admin si el frontend lo permitiera | El frontend **solo** ofrece `user` y `cit` en el selector. La validación real debe estar en el backend (hoy `ROLES` incluye `admin`) |

---

## 9. Trazabilidad

| Objetivo (§2) | Requisitos | Criterios |
|---|---|---|
| Registrarse | FR-1, FR-2, FR-3, FR-6, FR-13 | CA-1 … CA-6 |
| Iniciar sesión | FR-4, FR-5, FR-13 | CA-7, CA-8, CA-9 |
| Mantener la sesión válida | FR-7, FR-8, FR-9, FR-10, FR-11, FR-12, FR-14 | CA-10 … CA-15 |
| Calidad técnica | NFR-1 … NFR-9 | CA-16 … CA-18 |

---

## 10. Referencias

- Contrato verificado en `origin/gonzadvlop @ 051c7f3` → `backend/src/`
- Análisis del estado previo del frontend: `frontend/docs/ARQUITECTURA-FRONTEND.md`
- Plan de implementación: `frontend/specs/001-authentication/plan.md`
- Tareas: `frontend/specs/001-authentication/task.md`
