# Tasks — 001-autenticación

> **Feature**: Autenticación de la plataforma CITio
> **Línea de trabajo**: A — Autenticación
> **Estado**: `task.md` v1.1 — Completada (2026-11-11)
> **Documentos relacionados**: [`spec.md`](./spec.md) · [`plan.md`](./plan.md)

**Leyenda de fase:** `A` = Autenticación · `B` = Estado global y rutas · `C` = Interfaz, docs y pruebas
**Estado de tarea:** `[ ]` pendiente · `[~]` en curso · `[x]` completada

---

## 0. Prerrequisitos (bloqueantes)

| # | Tarea | Archivos | Objetivo | Criterio de validación |
|---|-------|----------|----------|------------------------|
| [x] | **T-0.1** Merge de la migración TS del backend | `backend/src/**` | Que el contrato de API de `spec.md` §5 esté disponible y compile sin errores | ✅ Conflictos y errores de sintaxis resueltos; `npx tsc --noEmit` en `backend/` con 0 errores |
| [x] | **T-0.2** Preparar el entorno del backend | `backend/.env` | Que el backend arranque | ✅ `backend/.env` presente y `env.ts` sin conflictos |
| [x] | **T-0.3** Base de datos disponible | — | Que `initDB()` y `seedCatalogos()` funcionen | ✅ Conectado con Supabase |

---

## Fase A — Autenticación (comunicación real con el backend)

| # | Tarea | Archivos afectados | Objetivo | Criterio de validación |
|---|-------|--------------------|----------|------------------------|
| [x] | **T-1** Migrar el frontend a TypeScript | `tsconfig.json`, `tsconfig.node.json`, `package.json`, `*.jsx` → `*.tsx` | Base tipada para todo el trabajo de esta línea | ✅ `npm run typecheck` sin errores con `strict: true`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax` |
| [x] | **T-2** Declarar el dominio | `src/domain/entidades.ts`, `src/domain/roles.ts` | Tipos del contrato y reglas de rol puras | ✅ `Rol` es la unión `"user" \| "cit" \| "admin"`; `esRol(x): x is Rol`; `UsuarioAutenticado` en camelCase |
| [x] | **T-3** Declarar el modelo de error | `src/domain/errors.ts` | Traducir fallos a un tipo de dominio | ✅ `ErrorDominio` con discriminante `tipo`; `traducirError()` distingue `msg`/`code` del backend, errores de red y validación local |
| [x] | **T-4** Configuración tipada del entorno | `src/lib/env.ts`, `.env.example` | Una única fuente para la URL de la API | ✅ `env.apiUrl` resuelve a `VITE_API_URL` con fallback; `.env.example` creado |
| [x] | **T-5** Almacenamiento del token | `src/lib/token-store.ts` | Persistir el token tras `localStorage`, encapsulado | ✅ Interfaz `TokenStore { leer, guardar, limpiar }` + implementación `localStorage` |
| [x] | **T-6** Cliente HTTP único | `src/lib/http.ts` | Instancia axios con header `Authorization` y manejo de 401 | ✅ Un solo módulo; interceptor de request añade `Bearer` solo si hay token y la ruta no es pública; el de response detecta 401 y delega al manejador |
| [x] | **T-7** Repositorio de autenticación | `src/repositories/auth.repository.ts` | Llamadas HTTP + mapeo DTO → dominio | ✅ `login` → `POST /api/login`; `register` → `POST /api/register`; `obtenerPerfil` → `GET /api/profile`; el alias `User` se mapea solo en este archivo |
| [x] | **T-8** Servicio de autenticación | `src/services/auth.service.ts` | Casos de uso: `login`, `register`, `logout`, `getSession` | ✅ `login` guarda el token y carga el perfil; si falla, no guarda token; `getSession` devuelve `null` sin token sin llamar al backend; `logout` limpia el store |
| [x] | **T-9** Retirar la implementación obsoleta | `src/services/apiClient.js`, `src/services/authService.js` | Eliminar la capa basada en cookie | ✅ Ambos eliminados; `withCredentials: false` explícito en `src/lib/http.ts` |
| [x] | **T-10** Conectar login y registro público | `src/pages/auth/Login.tsx`, `src/pages/auth/Register.tsx` | Login y registro de usuario (`user`) contra el backend | ✅ Login persiste token y navega a `/`; `Register.tsx` registra únicamente usuarios normales (sin selector de rol ni documento CIT) |

---

## Fase B — Estado global y rutas

| # | Tarea | Archivos afectados | Objetivo | Criterio de validación |
|---|-------|--------------------|----------|------------------------|
| [x] | **T-11** Estado global de sesión | `src/context/auth-context.ts`, `src/context/AuthContext.tsx`, `src/context/useAuth.ts` | Única fuente de verdad de la sesión | ✅ Expone `{ user, status, login, register, logout, refresh }` con `status: "cargando" \| "autenticado" \| "anonimo"` |
| [x] | **T-12** Protección de rutas | `src/components/ProtectedRoute.tsx` | Bloquear el árbol privado | ✅ `ProtectedRoute` (sin sesión → `/login`; con `roles` → 403) y `PublicOnlyRoute` (con sesión → `/`) |
| [x] | **T-13** Tabla de rutas y guardas públicas | `src/App.tsx` | Rutas coherentes con `spec.md` | ✅ `/login` y `/register` bajo `PublicOnlyRoute`; árbol privado bajo `ProtectedRoute` + `Layout` |
| [x] | **T-14** Layout y Home | `src/components/Layout.tsx`, `src/pages/Home.tsx` | Shell de la app autenticada y destino tras el login | ✅ `Home` saluda por nombre; `Layout` muestra el rol y "Cerrar sesión" |
| [x] | **T-15** Cierre de sesión | `src/components/Layout.tsx`, `src/services/auth.service.ts` | Terminar la sesión | ✅ Llama a `logout()`, borra el token de `localStorage`, `status` → `anonimo` y navega a `/login` |

---

## Fase C — Interfaz, documentación y pruebas

| # | Tarea | Archivos afectados | Objetivo | Criterio de validación |
|---|-------|--------------------|----------|------------------------|
| [x] | **T-16** Montar el entorno de tests | `package.json`, `vitest.config.ts`, `src/__tests__/setup.ts` | Poder testear con Vitest + Testing Library | ✅ `npm test` ejecuta `vitest run` con `jsdom` y cleanup automático |
| [x] | **T-17** Tests del dominio | `src/__tests__/domain/roles.test.ts`, `src/__tests__/domain/errors.test.ts` | Reglas puras y traducción de errores | ✅ 9 tests pasando |
| [x] | **T-18** Tests del repositorio | `src/__tests__/repositories/auth.repository.test.ts` | Contrato HTTP y mapeo de `PerfilDTO` | ✅ 4 tests pasando |
| [x] | **T-19** Tests del servicio | `src/__tests__/services/auth.service.test.ts` | Orquestación de login, sesión y logout | ✅ 6 tests pasando |
| [x] | **T-20** Tests del contexto y rutas | `src/__tests__/context/AuthContext.test.tsx`, `src/__tests__/components/ProtectedRoute.test.tsx` | Comportamiento de sesión y guardas | ✅ 7 tests pasando |
| [x] | **T-21** Manejo de la expiración en la UI | `src/context/AuthContext.tsx`, `src/pages/auth/Login.tsx` | Comunicar el cierre de sesión por expiración | ✅ Al redirigir por 401 se pasa `state: { sessionExpired: true }` y `Login.tsx` muestra el aviso "Tu sesión expiró. Por favor, iniciá sesión nuevamente." |
| [x] | **T-22** Documentar el contrato | `frontend/docs/api-contract.md` | Fuente de verdad compartida con el backend | ✅ Documento publicado y alineado con el backend |
| [x] | **T-23** Alineación backend-frontend | `backend/src/**`, `frontend/src/**` | Contrato Bearer unificado, `requireCIT` incluye `admin`, registro público exclusivo para `user` | ✅ Backend y frontend compilan sin errores (`tsc --noEmit`), lint sin errores y 26 tests en verde |

---

## Definición de "terminado" (Definition of Done)

- [x] Todos los criterios de aceptación de `spec.md` §7 verificados.
- [x] `npm run typecheck` sin errores (tanto en `frontend/` como en `backend/`).
- [x] `npm run lint` sin errores.
- [x] `npm test` en verde (6 suites, 26 tests pasando).
- [x] `npm run build` OK.
- [x] Ningún archivo del frontend ni del backend depende de la autenticación por cookie.
- [x] `frontend/docs/api-contract.md` publicado.
- [x] El contrato documentado coincide con el backend.
