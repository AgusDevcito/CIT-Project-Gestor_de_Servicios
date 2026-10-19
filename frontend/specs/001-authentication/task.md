# Tasks — 001-autenticación

> **Feature**: Autenticación de la plataforma CITio
> **Línea de trabajo**: A — Autenticación
> **Estado**: `task.md` v1.0 — 2026-10-19
> **Documentos relacionados**: [`spec.md`](./spec.md) · [`plan.md`](./plan.md)

**Leyenda de fase:** `A` = Autenticación · `B` = Estado global y rutas · `C` = Interfaz, docs y pruebas
**Estado de tarea:** `[ ]` pendiente · `[~]` en curso · `[x]` completada

---

## 0. Prerrequisitos (bloqueantes)

| # | Tarea | Archivos | Objetivo | Criterio de validación |
|---|-------|----------|----------|------------------------|
| [ ] | **T-0.1** Merge de la migración TS del backend | — | Que el contrato de API de `spec.md` §5 esté disponible en la rama de trabajo | `git merge-base --is-ancestor 051c7f3 HEAD` devuelve 0 y `backend/src/` existe con `tsconfig.json` |
| [ ] | **T-0.2** Preparar el entorno del backend | `backend/.env` | Que el backend arranque | `npm start` en `backend/` levanta y loguea "Escuchando el puerto http://localhost:3000"; `curl localhost:3000/api` responde `{"ok":true}` |
| [ ] | **T-0.3** Base de datos disponible | — | Que `initDB()` y `seedCatalogos()` funcionen | `GET /api/sectores` responde `{ count, data }` con contenido |

> **T-0.1 no puede cerrarse desde el frontend.** Si el backend TS aún no está en la rama,
> las tareas T-4 en adelante se pueden **escribir** pero no **verificar** contra el backend real.

---

## Fase A — Autenticación (comunicación real con el backend)

| # | Tarea | Archivos afectados | Objetivo | Criterio de validación |
|---|-------|--------------------|----------|------------------------|
| [ ] | **T-1** Migrar el frontend a TypeScript | `tsconfig.json`, `package.json`, `*.jsx` → `*.tsx` | Base tipada para todo el trabajo de esta línea | `npm run typecheck` (`tsc --noEmit`) termina sin errores; `strict: true` activo; `allowJs` en `true` solo para las páginas de negocio no migradas |
| [ ] | **T-2** Declarar el dominio | `src/domain/auth.types.ts`, `src/domain/roles.ts` | Tipos del contrato y reglas de rol puras | `Rol` es la unión `"user" \| "cit" \| "admin"`; `esRol(x): x is Rol`; `UsuarioAutenticado` con `nombre/apellido/avatarUrl` en camelCase (sin `User` anidado) |
| [ ] | **T-3** Declarar el modelo de error | `src/domain/errors.ts` | Traducir fallos a un tipo de dominio | `AuthError` es unión discriminada por `tipo`; `traducirError(error: unknown): AuthError` distingue `msg` del backend, `code`, errores de red (sin `response`) y otros |
| [ ] | **T-4** Configuración tipada del entorno | `src/lib/env.ts`, `.env.example` | Una única fuente para la URL de la API | `env.apiUrl` resuelve a `VITE_API_URL`; existe `frontend/.env.example` con `VITE_API_URL=http://localhost:3000/api` |
| [ ] | **T-5** Almacenamiento del token | `src/lib/token-store.ts` | Persistir el token tras `localStorage`, encapsulado | Exporta la interfaz `TokenStore { leer, guardar, limpiar }` y la implementación `localStorage`; los tests pueden inyectar un store en memoria |
| [ ] | **T-6** Cliente HTTP único | `src/lib/http.ts` | Instancia axios con header `Authorization` y manejo de 401 | Un solo módulo exporta la instancia; el interceptor de request añade `Authorization: Bearer` solo si hay token y la petición no es `login`/`register`/`OPTIONS`; el de response detecta 401 y delega a un manejador registrable |
| [ ] | **T-7** Repositorio de autenticación | `src/repositories/auth.repository.ts` | Llamadas HTTP + mapeo DTO → dominio | `login()` → `POST /api/login`; `register()` → `POST /api/register` (multipart); `obtenerPerfil()` → `GET /api/profile`; el mapeo del alias `User` ocurre **solo** en este archivo |
| [ ] | **T-8** Servicio de autenticación | `src/services/auth.service.ts` | Casos de uso: `login`, `register`, `logout`, `getSession` | `login` guarda el token y luego carga el perfil; si falla, **no** guarda token; `getSession` devuelve `null` si no hay token **sin llamar al backend**; `logout` limpia el store |
| [ ] | **T-9** Retirar la implementación obsoleta | `src/services/apiClient.js`, `src/services/authService.js` | Eliminar la capa basada en cookie | `grep -rn "withCredentials\|apiClient" src/` sin resultados; ningún archivo importa los módulos eliminados |
| [ ] | **T-10** Conectar el login | `src/pages/auth/Login.tsx` | Login real contra el backend | Al enviar credenciales correctas: se persiste el token, se navega a `/`; con incorrectas: se muestra el `msg` del backend, sin persistir token, y **no** se redirige fuera del login |

---

## Fase B — Estado global y rutas

| # | Tarea | Archivos afectados | Objetivo | Criterio de validación |
|---|-------|--------------------|----------|------------------------|
| [ ] | **T-11** Estado global de sesión | `src/context/AuthContext.tsx` | Única fuente de verdad de la sesión | Expone `{ user, status, login, register, logout, refresh }` con `status: "cargando" \| "autenticado" \| "anonimo"`; en cold start sin token no dispara ninguna llamada al backend; ante 401 en `/profile` limpia el store y queda `anonimo` **sin** redirigir |
| [ ] | **T-12** Protección de rutas | `src/components/ProtectedRoute.tsx` | Bloquear el árbol privado | Sin sesión → `<Navigate to="/login" replace />`; con `roles` y rol no autorizado → pantalla 403; con sesión → `<Outlet />`; durante `status === "cargando"` muestra el estado de verificación |
| [ ] | **T-13** Tabla de rutas y guardas públicas | `src/App.tsx` | Rutas coherentes con `spec.md` | `/login` y `/register` redirigen a `/` si hay sesión; el árbol privado está envuelto en `ProtectedRoute`; `*` redirige a `/`; `Home` en `/` |
| [ ] | **T-14** Layout y Home | `src/components/Layout.tsx`, `src/pages/Home.tsx` | Shell de la app autenticada y destino tras el login | `Home` saluda al usuario por nombre; `Layout` muestra el rol y el botón de cerrar sesión; **la navegación incluye enlaces a todas las rutas privadas** (hoy solo tiene "Inicio" — corrige el hallazgo C1 de `frontend/docs/ARQUITECTURA-FRONTEND.md`) |
| [ ] | **T-15** Cierre de sesión | `src/components/Layout.tsx` | Terminar la sesión | El botón llama a `logout()`, limpia el token, `status` pasa a `anonimo` y se navega a `/login` |

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

## Dependencias a agregar

| Paquete | Motivo | Tarea |
|---|---|---|
| `typescript` | Migración a TS | T-1 |
| `vitest` + `jsdom` + `@testing-library/react` + `@testing-library/jest-dom` | Tests | T-16 |
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

- [ ] Todos los criterios de aceptación de `spec.md` §7 verificados (CA-1 … CA-18).
- [ ] `npm run typecheck` sin errores.
- [ ] `npm run lint` sin errores.
- [ ] `npm test` en verde.
- [ ] `npm run build` OK.
- [ ] Ningún archivo del frontend depende de la autenticación por cookie.
- [ ] `grep -rn "withCredentials" frontend/src` sin resultados.
- [ ] `frontend/docs/api-contract.md` publicado.
- [ ] El contrato documentado **coincide con el backend en marcha** (verificado en T-23).
