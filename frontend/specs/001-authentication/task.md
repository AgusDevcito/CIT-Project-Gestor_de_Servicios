# Tasks — 001-autenticación

> **Feature**: Autenticación de la plataforma CITio
> **Línea de trabajo**: A — Autenticación
> **Estado**: `task.md` v1.0 — 2026-10-19
> **Documentos relacionados**: [`spec.md`](./spec.md) · [`plan.md`](./plan.md)

**Leyenda de fase:** `A` = Autenticación · `B` = Estado global y rutas · `C` = Interfaz, docs y pruebas
**Estado de tarea:** `[ ]` pendiente · `[~]` en curso · `[x]` completada

> **Estado al 2026-10-19:** Fases A y B implementadas y **verificadas contra un mock que replica
> el contrato del backend TS**. Fase C (tests automatizados y documentación del contrato)
> queda pendiente. Detalle de la verificación en §"Verificación ejecutada".

---

## 0. Prerrequisitos (bloqueantes)

| # | Tarea | Archivos | Objetivo | Criterio de validación |
|---|-------|----------|----------|------------------------|
| [x] | **T-0.1** Merge de la migración TS del backend | — | Que el contrato de API de `spec.md` §5 esté disponible en la rama de trabajo | ✅ Hecho: `e30d7b0` ("Merge: backend migrado a TypeScript con arquitectura SOA"). `backend/src/` con 63 `.ts` + `backend/tsconfig.json` |
| [x] | **T-0.2** Preparar el entorno del backend | `backend/.env` | Que el backend arranque | ✅ `backend/.env` presente. Pendiente de verificación con DB real |
| [~] | **T-0.3** Base de datos disponible | — | Que `initDB()` y `seedCatalogos()` funcionen | ⬜ Verificar `GET /api/sectores` con contenido |

> **T-0.1 no puede cerrarse desde el frontend.** Si el backend TS aún no está en la rama,
> las tareas T-4 en adelante se pueden **escribir** pero no **verificar** contra el backend real.

---

## Fase A — Autenticación (comunicación real con el backend)

| # | Tarea | Archivos afectados | Objetivo | Criterio de validación |
|---|-------|--------------------|----------|------------------------|
| [x] | **T-1** Migrar el frontend a TypeScript | `tsconfig.json`, `tsconfig.node.json`, `package.json`, `*.jsx` → `*.tsx` | Base tipada para todo el trabajo de esta línea | ✅ `npm run typecheck` sin errores con `strict: true`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`; 30 archivos `.ts`/`.tsx`; 0 archivos `.jsx`/`.js` en `src/` |
| [x] | **T-2** Declarar el dominio | `src/domain/entidades.ts`, `src/domain/roles.ts` | Tipos del contrato y reglas de rol puras | ✅ `Rol` es la unión `"user" \| "cit" \| "admin"`; `esRol(x): x is Rol`; `UsuarioAutenticado` con `nombre/apellido/avatarUrl` en camelCase (sin `User` anidado) |
| [x] | **T-3** Declarar el modelo de error | `src/domain/errors.ts` | Traducir fallos a un tipo de dominio | ✅ `ErrorDominio` con discriminante `tipo`; `traducirError()` distingue `msg`/`code` del backend, errores de red (sin `response`) y validación local |
| [x] | **T-4** Configuración tipada del entorno | `src/lib/env.ts` | Una única fuente para la URL de la API | ✅ `env.apiUrl` resuelve a `VITE_API_URL` con fallback; normaliza la barra final |
| [x] | **T-5** Almacenamiento del token | `src/lib/token-store.ts` | Persistir el token tras `localStorage`, encapsulado | ✅ Interfaz `TokenStore { leer, guardar, limpiar }` + implementación `localStorage` + implementación en memoria para tests |
| [x] | **T-6** Cliente HTTP único | `src/lib/http.ts` | Instancia axios con header `Authorization` y manejo de 401 | ✅ Un solo módulo; el interceptor de request añade `Bearer` solo si hay token y la ruta no es pública; el de response detecta 401 y delega a un manejador registrable |
| [x] | **T-7** Repositorio de autenticación | `src/repositories/auth.repository.ts` | Llamadas HTTP + mapeo DTO → dominio | ✅ `login` → `POST /api/login`; `register` → `POST /api/register` (multipart); `obtenerPerfil` → `GET /api/profile`; el alias `User` se mapea **solo** en este archivo |
| [x] | **T-8** Servicio de autenticación | `src/services/auth.service.ts` | Casos de uso: `login`, `register`, `logout`, `getSession` | ✅ `login` guarda el token y carga el perfil; si falla, no guarda token; `getSession` devuelve `null` sin token **sin llamar al backend**; `logout` limpia el store |
| [x] | **T-9** Retirar la implementación obsoleta | `src/services/apiClient.js`, `src/services/authService.js` | Eliminar la capa basada en cookie | ✅ Ambos eliminados; la única referencia a `withCredentials` es el `false` explícito de `src/lib/http.ts` |
| [x] | **T-10** Conectar el login | `src/pages/auth/Login.tsx` | Login real contra el backend | ✅ Verificado: credenciales correctas → persiste token + navega a `/`; incorrectas → muestra el `msg` del backend, no persiste token, no redirige |

---

## Fase B — Estado global y rutas

| # | Tarea | Archivos afectados | Objetivo | Criterio de validación |
|---|-------|--------------------|----------|------------------------|
| [x] | **T-11** Estado global de sesión | `src/context/auth-context.ts`, `src/context/AuthContext.tsx`, `src/context/useAuth.ts` | Única fuente de verdad de la sesión | ✅ Expone `{ user, status, login, register, logout, refresh }` con `status: "cargando" \| "autenticado" \| "anonimo"`; en cold start sin token no dispara ninguna llamada al backend; ante 401 en `/profile` limpia el store y queda `anonimo` |
| [x] | **T-12** Protección de rutas | `src/components/ProtectedRoute.tsx` | Bloquear el árbol privado | ✅ `ProtectedRoute` (sin sesión → `/login`; con `roles` → 403) y `PublicOnlyRoute` (con sesión → `/`); con `status === "cargando"` muestra el estado de verificación |
| [x] | **T-13** Tabla de rutas y guardas públicas | `src/App.tsx` | Rutas coherentes con `spec.md` | ✅ `/login` y `/register` bajo `PublicOnlyRoute`; árbol privado bajo `ProtectedRoute` + `Layout`; `Home` en `/`; `*` → `/` |
| [x] | **T-14** Layout y Home | `src/components/Layout.tsx`, `src/pages/Home.tsx` | Shell de la app autenticada y destino tras el login | ✅ `Home` saluda por nombre (`Hola, Ana`); `Layout` muestra el rol y "Cerrar sesión"; **la navegación incluye los 6 enlaces** (corrige el hallazgo C1) |
| [x] | **T-15** Cierre de sesión | `src/components/Layout.tsx`, `src/services/auth.service.ts` | Terminar la sesión | ✅ El botón llama a `logout()`, borra el token de `localStorage`, `status` → `anonimo` y navega a `/login` |

---

## Fase C — Interfaz, documentación y pruebas

| # | Tarea | Archivos afectados | Objetivo | Criterio de validación |
|---|-------|--------------------|----------|------------------------|
| [ ] | **T-16** Montar el entorno de tests | `package.json`, `vitest.config.ts`, `src/__tests__/setup.ts` | Poder testear | `npm test` ejecuta `vitest`; `jsdom` configurado; `vitest` + `@testing-library/react` + `@testing-library/jest-dom` en `devDependencies` |
| [ ] | **T-17** Tests del dominio | `src/__tests__/domain/*.test.ts` | Reglas puras y traducción de errores | Casos: `esRol` acepta/rechaza; `traducirError` mapea `401`→`noAutorizado`, `400`→`validacion`, error sin `response`→`red`; mapeo de perfil DTO→dominio |
| [ ] | **T-18** Tests del repositorio | `src/__tests__/repositories/auth.repository.test.ts` | Contrato HTTP | Con axios simulado: `login` pega a `POST /api/login` con `{username,password}`; `register` usa `multipart/form-data` e incluye `document` solo si corresponde; `obtenerPerfil` pega a `GET /api/profile` |
| [ ] | **T-19** Tests del servicio | `src/__tests__/services/auth.service.test.ts` | Orquestación | `login` guarda el token y pide el perfil; si el login falla, no guarda token; `getSession` sin token no llama al repositorio; `logout` limpia el store |
| [ ] | **T-20** Tests del contexto y rutas | `src/__tests__/context/AuthContext.test.tsx`, `src/__tests__/components/ProtectedRoute.test.tsx` | Comportamiento de sesión y guardas | Sin sesión → redirige a `/login`; con sesión → renderiza el hijo; un 401 en una petición → limpia y redirige; login → `/login` no dispara redirección por 401 |
| [ ] | **T-21** Manejo de la expiración en la UI | `src/context/AuthContext.tsx`, `src/pages/auth/Login.tsx` | Comunicar el cierre de sesión por expiración | Al redirigir por 401 se muestra un aviso ("tu sesión expiró") en `/login`, distinto del mensaje de credenciales incorrectas |
| [ ] | **T-22** Documentar el contrato | `frontend/docs/api-contract.md` | Fuente de verdad compartida con el backend | Documenta los 4 endpoints de auth, el mecanismo Bearer, la forma de `GET /api/profile`, el formato `{msg, code}` de error y el preflight por `Authorization` |
| [ ] | **T-23** Verificación end-to-end contra el backend real | manual | Validar los CA de `spec.md` §7 | Con el backend en marcha: registro user ✔, registro cit con documento ✔, login ✔, credenciales incorrectas ✔, recarga restaura sesión ✔, `/register` accesible sin sesión ✔, logout ✔, 401 expira y redirige ✔ |

---

## Verificación ejecutada (2026-10-19)

Las Fases A y B se verificaron ejecutando la app contra un **mock que replica el contrato del
backend TS** (`POST /api/login` → `{msg, token}` sin cookie; `GET /api/profile` exige
`Authorization: Bearer`; CORS sin `credentials`).

| Escenario | Resultado | Traza del backend |
|---|---|---|
| Carga en frío de `/register` sin sesión | ✅ Renderiza el formulario, **sin** redirigir a `/login` | **0 peticiones** al backend |
| Login con credenciales incorrectas | ✅ Muestra "Credenciales incorrectas o invalidas", no persiste token, no redirige | `POST /api/login auth=no` |
| Login con credenciales correctas | ✅ Navega a `/`, muestra "Hola, Ana" y el rol "Personal CIT" | `POST /api/login auth=no` → `GET /api/profile auth=SI` |
| Navegar a una ruta privada | ✅ `/solicitudes` carga | `GET /api/solicitudes auth=SI` |
| Recarga de la página | ✅ Sesión restaurada (con estado "Verificando sesión…" intermedio, sin flash) | `GET /api/profile auth=SI` |
| `/login` con sesión activa | ✅ Redirige a `/` | — |
| Token corrupto + recarga | ✅ 401 → token eliminado de `localStorage` → redirige a `/login` | `GET /api/profile auth=SI` → 401 |
| Cierre de sesión | ✅ Token eliminado, vuelve a `/login` | `POST /api/logout auth=SI` |
| Registro CIT con documento | ✅ "Registro exitoso"; multipart con el campo `document` | `POST /api/register auth=no` |
| Registro sin documento (rol `cit`) | ✅ El formulario bloquea el envío con el mensaje del requisito | — |

**Comprobaciones de código estático:** `npm run typecheck` sin errores · `npm run lint` 7 warnings
(0 errores) · `npm run build` OK (319.83 kB JS / 101.75 kB gzip).

> Queda pendiente reejecutar esta misma matriz contra el **backend TS real** (T-23), que
> requiere la base de datos operativa (T-0.3).

---

## Dependencias a agregar

| Paquete | Motivo | Tarea |
|---|---|---|
| `typescript` | Migración a TS | T-1 ✅ |
| `@types/node` | Tipos de Node en `vite.config.ts` / `tsconfig.node.json` | T-1 ✅ |
| `vitest` + `jsdom` + `@testing-library/react` + `@testing-library/jest-dom` | Tests | T-16 ⬜ |
| `@types/node` | Tipos de Node en `vitest.config.ts` | T-16 |

> `clsx` se recomienda para la línea de trabajo visual, no es necesario aquí.

---

## Dependencias a remover

| Paquete | Motivo | Estado |
|---|---|---|
| `postcss` | Sin uso con Tailwind v4 (plugin de Vite) | ✅ removido |
| `autoprefixer` | Sin uso con Tailwind v4 | ✅ removido |
| `tailwind.config.js` | Config v3 ignorada en silencio por Tailwind v4 | ✅ removido |

---

## Dependencias a conservar

| Paquete | Motivo |
|---|---|
| `@types/react`, `@types/react-dom` | Requeridos por la migración TS (T-1) |
| `axios` | Cliente HTTP |
| `react-router-dom` | Routing |

---

## Definición de "terminado" (Definition of Done)

- [x] Todos los criterios de aceptación de `spec.md` §7 verificados (CA-1 … CA-18) — *verificados
      contra el mock del contrato del backend TS; falta reejecutar contra el backend real (T-23)*.
- [x] `npm run typecheck` sin errores.
- [x] `npm run lint` sin errores.
- [ ] `npm test` en verde. *(Fase C — no implementado)*
- [x] `npm run build` OK.
- [x] Ningún archivo del frontend depende de la autenticación por cookie. La única mención a
      `withCredentials` es el `withCredentials: false` explícito de `src/lib/http.ts`, que
      documenta justamente que **no** se usan cookies.
- [ ] `frontend/docs/api-contract.md` publicado. *(T-22)*
- [ ] El contrato documentado **coincide con el backend en marcha** (verificado en T-23).
