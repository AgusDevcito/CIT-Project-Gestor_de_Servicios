# Spec — 001-autenticación

> **Feature**: Autenticación de la plataforma CITio (Gestor de Servicios)
> **Línea de trabajo**: A — Autenticación
> **Fases**: A (Autenticación) → B (Estado global y rutas) → C (Interfaz, docs y pruebas)
> **Estado**: `spec.md` v1.1 — Completada (2026-11-11)
> **Stack**: React 19 + Vite 8 + TypeScript + react-router-dom v7 + axios + Tailwind v4

---

## 1. Contexto y problema

La interfaz de login y registro (`src/pages/auth/Login.tsx`, `src/pages/auth/Register.tsx`)
y el árbol de navegación autenticado (`AuthContext`, `ProtectedRoute`, `PublicOnlyRoute`)
se conectan contra el backend TypeScript (arquitectura SOA) mediante **token JWT Bearer en el
header `Authorization`** (sin cookies).

**Regla de negocio del registro público:** un usuario que crea una cuenta desde la plataforma
se registra e inicia sesión **siempre como usuario (`user`)**. La pantalla de registro público
**no** incluye selector de rol ni carga de documento, ya que los empleados de CIT (`cit`) y
administradores (`admin`) son registrados manualmente por la administración.

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
| **B — Estado global y rutas** | `AuthContext` como única fuente de verdad de la sesión. `ProtectedRoute` y `PublicOnlyRoute` que protegen el árbol de rutas. Redirección a `/login` y a `/` tras autenticar. |
| **C — Interfaz, docs y pruebas** | Login/registro conectados al servicio real, aviso de expiración de sesión, documentación del contrato (`docs/api-contract.md`) y pruebas automatizadas con Vitest + Testing Library. |

### 3.2 Fuera de alcance (esta línea de trabajo)

- Recuperación y cambio de contraseña, 2FA, OAuth/social login.
- Gestión de sesiones desde el backend (refresh token / revocación en servidor).
- Panel de administración para el alta manual de personal CIT y gestión de usuarios.
- Migración visual/funcional del resto de las páginas de negocio (se abordarán en las siguientes specs).

---

## 4. Usuarios y roles

| Rol | Puede | Alta |
|---|---|---|
| `user` (Usuario) | Solicitar servicios, crear propuestas, ver publicaciones y su perfil | Registro público (`POST /api/register`) |
| `cit` (Personal CIT) | Todo lo anterior + crear/editar/eliminar publicaciones, dictaminar propuestas, crear servicios, gestionar estados de solicitudes | Registrado manualmente por administración |
| `admin` (Administrador) | Permisos de gestión técnica (`requireCIT` admite `cit` y `admin`) + administración de usuarios y catálogos | Registrado manualmente por administración |

Definidos en `backend/src/constants/roles.ts` y `frontend/src/domain/roles.ts` como `ROLES = ["user", "cit", "admin"]`.

> El rol es una decisión del backend, no del frontend. El frontend solo lo **lee** y lo usa
> para condicionar la UI. La **autorización real** está en los middlewares del backend.

---

## 5. Contrato de API (fuente de verdad: backend)

> Documentado en detalle en [`frontend/docs/api-contract.md`](../../docs/api-contract.md).
> Todas las rutas se montan bajo el prefijo `/api` (`app.use("/api", routes)`).

### 5.1 Mecanismo de autenticación

**Bearer token en el header `Authorization`. No se utilizan cookies.**

```http
Authorization: Bearer <jwt>
```

- `login` devuelve el token en el body de la respuesta (`{ msg, token }`).
- `requireAuth` lee exclusivamente el header `Authorization`.
- El JWT expira según `JWT_EXPIRES_IN` (por defecto `1h`) y su payload es `{ id, email, role }`.

### 5.2 Endpoints

| Método | Ruta | Body | Respuesta | Errores |
|---|---|---|---|---|
| `POST` | `/api/register` | `multipart/form-data`: `first_name`, `last_name`, `username`, `email`, `password` (el backend asigna siempre `role = "user"`) | `200` `{ msg, document_url }` | `400` validación · `500` |
| `POST` | `/api/login` | `application/json`: `{ username, password }` | `200` `{ msg, token }` | `400` campos vacíos · `401` credenciales inválidas / cuenta inactiva · `500` |
| `GET` | `/api/profile` | — (header `Authorization`) | `200` perfil con `User` anidado (ver §5.3) | `401` sin token / token inválido o expirado · `404` perfil inexistente |
| `POST` | `/api/logout` | — (header `Authorization`) | `200` `{ msg }` | `401` sin token |

### 5.3 Forma de la respuesta de `GET /api/profile`

```json
{
  "id": 7,
  "user_id": 7,
  "first_name": "Ana",
  "last_name": "Gomez",
  "avatar_url": null,
  "User": { "id": 7, "username": "ana", "email": "ana@cit.com", "role": "user" }
}
```

El alias `User` queda aislado en `src/repositories/auth.repository.ts`.

### 5.4 Formato de error

```json
{ "msg": "Contraseña Incorrecta", "code": "UNAUTHORIZED" }
```

---

## 6. Requisitos

### 6.1 Funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| **FR-1** | El usuario puede registrarse con nombre, apellido, username, email y contraseña (siempre con rol `user`). | Alta |
| **FR-2** | El formulario de registro público no expone selector de rol ni solicita documentos de personal CIT. | Alta |
| **FR-3** | El usuario puede iniciar sesión con username y contraseña. | Alta |
| **FR-4** | Tras un login exitoso, la aplicación navega a `Home` (`/`) y la sesión queda activa. | Alta |
| **FR-5** | Tras un registro exitoso, la aplicación muestra confirmación y permite ir a iniciar sesión. | Alta |
| **FR-6** | La aplicación persiste el token y lo envía automáticamente en **toda** petición autenticada al backend. | Alta |
| **FR-7** | La aplicación restaura la sesión al cargar (recarga de página) consultando `GET /api/profile`. | Alta |
| **FR-8** | Un `401` en cualquier petición autenticada limpia la sesión local, redirige a `/login` y muestra el aviso de sesión expirada. | Alta |
| **FR-9** | Las rutas privadas son inaccesibles sin sesión; `ProtectedRoute` redirige a `/login`. | Alta |
| **FR-10** | Las rutas públicas (`/login`, `/register`) son inaccesibles con sesión activa; redirigen a `/`. | Media |
| **FR-11** | El usuario puede cerrar sesión; el token local se elimina y se vuelve a `/login`. | Alta |
| **FR-12** | Los errores del backend se muestran con el mensaje `msg` en la interfaz. | Alta |
| **FR-13** | Los roles se exponen al frontend para condicionar la UI (sin ser la frontera de seguridad). | Media |

### 6.2 No funcionales

| ID | Requisito | Criterio |
|---|---|---|
| **NFR-1** | **TypeScript estricto** en el frontend: `strict: true`, sin `any` implícitos, `tsc --noEmit` sin errores. | Script `typecheck` en verde |
| **NFR-2** | **Tipado del contrato**: los tipos del contrato de API están declarados y son la única fuente para el mapeo a modelos de dominio. | Cero `any` en la capa de datos |
| **NFR-3** | **Una sola instancia de cliente HTTP** en toda la app, con el header y la política de 401 centralizados. | Un único `http.ts` importado por los repositorios |
| **NFR-4** | **El dominio no depende de React ni del transporte**: los tipos y reglas de negocio son importables y testeables de forma aislada. | Tests de dominio sin DOM |
| **NFR-5** | **Manejo de errores unificado**: un único punto traduce errores de axios a un tipo de error de dominio. | `src/domain/errors.ts` |
| **NFR-6** | **Tests automatizados** del flujo de autenticación: dominio, repositorio, servicio, `AuthContext` y `ProtectedRoute`. | `npm test` en verde |
| **NFR-7** | **Sin secretos en el cliente**: el frontend no expone ni valida la firma del JWT; solo lo transporta. | — |
| **NFR-8** | **La UI no filtra datos sensibles**: el token no se renderiza ni se registra en la consola. | — |
| **NFR-9** | **Documentación del contrato** de auth en `frontend/docs/api-contract.md`. | Documento publicado |

---

## 7. Criterios de aceptación

- **CA-1** Con datos válidos, el registro público se completa como `user` y la UI confirma el alta.
- **CA-2** El formulario de registro público no permite elegir rol ni adjuntar documento.
- **CA-3** Con un username o email ya existente o campos inválidos, se muestra el error devuelto por el backend.
- **CA-4** Con credenciales correctas en login, se obtiene `200`, se persiste el token, se consulta el perfil y se navega a `/`.
- **CA-5** Con credenciales incorrectas, se muestra el mensaje del backend y **no** se persiste ningún token.
- **CA-6** El botón de envío se deshabilita mientras la petición está en curso.
- **CA-7** Tras recargar la página en una ruta privada, la sesión se restaura y la ruta sigue accesible.
- **CA-8** Tras recargar la página en una ruta privada **sin** sesión, se redirige a `/login`.
- **CA-9** Al acceder a `/login` con sesión activa, se redirige a `/`.
- **CA-10** Una petición que devuelve `401` limpia la sesión, redirige a `/login` y muestra el aviso de sesión expirada.
- **CA-11** Cerrar sesión elimina el token local y la UI vuelve al estado deslogueado.
- **CA-12** Ninguna petición autenticada al backend se emite sin el header `Authorization` cuando hay sesión activa.
- **CA-13** `npm run typecheck` termina sin errores.
- **CA-14** `npm run lint` no reporta errores.
- **CA-15** `npm test` pasa en verde.
