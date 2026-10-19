# Plan — 001-autenticación

> **Feature**: Autenticación de la plataforma CITio
> **Línea de trabajo**: A — Autenticación
> **Estado**: `plan.md` v1.0 — 2026-10-19
> **Documentos relacionados**: [`spec.md`](./spec.md) · [`task.md`](./task.md)

---

## 1. Objetivo de la arquitectura

Sustituir el mecanismo de autenticación **obsoleto** (cookie `HttpOnly`, `withCredentials: true`)
por el que **el backend actual exige** (token Bearer en el header `Authorization`), sobre una
base de **TypeScript estricto** y una estructura de capas que **refleje la arquitectura SOA
del backend** (`routes → controllers → services → repositories → models`).

---

## 2. Punto de partida: qué está roto

El frontend actual fue construido contra la **versión JavaScript** del backend, que autenticaba
por cookie `HttpOnly`:

| Pieza actual | Espera | El backend TS hace | Compatible |
|---|---|---|---|
| `src/services/apiClient.js` → `withCredentials: true` | cookie `token` | **no lee cookies** | ❌ |
| `src/services/authService.js` → `login()` descarta el `token` del body | cookie | **devuelve el token en el body** | ❌ |
| `src/context/AuthContext.jsx` → `getProfile()` sin header | cookie | **exige `Authorization: Bearer`** | ❌ |
| `src/components/ProtectedRoute.jsx` | — | — | ✅ |
| `src/pages/auth/Login.tsx` / `Register.tsx` | — | — | ✅ |

> Conclusión: **la UI de login y registro es reutilizable tal cual**; lo que hay que rehacer
> es la **capa de transporte y estado**. Esa es la definición exacta del alcance de esta
> línea de trabajo.

---

## 3. Arquitectura objetivo

### 3.1 Capas

```
┌──────────────────────────────────────────────────────────────┐
│  pages/  components/          Presentación (React)          │
│  · Login.tsx  · Register.tsx  · Home.tsx  · ProtectedRoute  │
└───────────────────────────┬──────────────────────────────────┘
                            │  consume casos de uso
┌───────────────────────────▼──────────────────────────────────┐
│  context/                     Estado global (Fase B)         │
│  · AuthContext.tsx   { user, status, login, register, … }    │
└───────────────────────────┬──────────────────────────────────┘
                            │  orquesta
┌───────────────────────────▼──────────────────────────────────┐
│  services/                   Casos de uso de la aplicación  │
│  · auth.service.ts   login() register() logout() getSession()│
└───────────────────────────┬──────────────────────────────────┘
                            │  delega el acceso a datos
┌───────────────────────────▼──────────────────────────────────┐
│  repositories/               Acceso a datos + mapeo         │
│  · auth.repository.ts  HTTP → DTO → Modelo de dominio       │
└───────────────────────────┬──────────────────────────────────┘
                            │  usa
┌───────────────────────────▼──────────────────────────────────┐
│  lib/                        Utilidades de infraestructura  │
│  · http.ts          axios + interceptores (Auth, 401)       │
│  · token-store.ts   abstracción de persistencia del token   │
│  · env.ts           tipado de import.meta.env               │
└───────────────────────────┬──────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│  domain/                     Tipos y reglas puras            │
│  · auth.types.ts    Sesion, Usuario, Rol, DTOs              │
│  · roles.ts         ROL, esRol(), labels                    │
│  · errors.ts        AppError de dominio + traducción        │
└──────────────────────────────────────────────────────────────┘
```

**Regla de dependencia**: las flechas solo apuntan hacia abajo. `domain/` no importa nada del
proyecto; `lib/` no importa React; `repositories/` no conoce la UI; `services/` no conoce
axios. Esto permite testear cada capa de forma aislada y es el mismo criterio que aplica
en el backend TS.

### 3.2 Estructura de archivos objetivo

```
frontend/src/
├── domain/
│   ├── auth.types.ts          # Sesion, UsuarioAutenticado, Rol, LoginInput, RegisterInput
│   ├── roles.ts               # ROL, ROLES, esRol(), labelDeRol()
│   └── errors.ts              # AuthError + fromAxiosError()
├── lib/
│   ├── env.ts                 # API_URL tipado y validado
│   ├── http.ts                # instancia axios + interceptores
│   └── token-store.ts         # TokenStore (interfaz) + localStorage impl
├── repositories/
│   └── auth.repository.ts     # llamadas HTTP + mapeo DTO → dominio
├── services/
│   ├── auth.service.ts        # casos de uso
│   └── profile.service.ts     # (Fase B) perfil del usuario
├── context/
│   └── AuthContext.tsx        # estado global (Fase B)
├── components/
│   ├── ProtectedRoute.tsx
│   └── Layout.tsx
└── pages/
    └── auth/
        ├── Login.tsx
        └── Register.tsx
```

### 3.3 Modelo de dominio vs. DTO

El backend responde con **modelos de Sequelize** (alias `User`, `Sector`, `Proveedor`…).
Esos alias son un detalle de la capa de persistencia y no deben filtrar a la UI.

```ts
// domain/auth.types.ts — lo que la UI consume
export interface UsuarioAutenticado {
  id: number;
  username: string;
  email: string;
  rol: Rol;
  nombre: string;
  apellido: string;
  avatarUrl: string | null;
}

// repositories/auth.repository.ts — el mapeo, único punto que conoce el alias "User"
const mapearPerfil = (dto: PerfilDTO): UsuarioAutenticado => ({
  id: dto.User.id,
  username: dto.User.username,
  email: dto.User.email,
  rol: dto.User.role,
  nombre: dto.first_name,
  apellido: dto.last_name,
  avatarUrl: dto.avatar_url,
});
```

Consecuencia: si el backend cambia el alias `User` o la forma de la respuesta, **se toca un
archivo** (`auth.repository.ts`), no las 7 páginas.

---

## 4. Decisiones técnicas

### D-1 · Autenticación por token Bearer (no cookie)

**Decisión:** enviar el token en el header `Authorization: Bearer <jwt>`.

**Por qué:** es lo que el backend implementa y verifica. `requireAuth` lee **exclusivamente**
`req.headers.authorization`; no consulta cookies. Es dictated por el contrato, no una
preferencia del frontend.

**Alternativa descartada:** cookie `HttpOnly` (la del backend JS anterior). Requeriría
modificar el backend (re-añadir `cookie-parser`, `res.cookie` en login y lectura de
`req.cookies.token`). Ver D-2 para la variante futura.

### D-2 · Almacenamiento del token: abstracción sobre `localStorage`

**Decisión:** el token se guarda en `localStorage` detrás de una interfaz `TokenStore`.

```ts
// lib/token-store.ts
export interface TokenStore {
  leer(): string | null;
  guardar(token: string): void;
  limpiar(): void;
}
```

**Por qué una abstracción y no acceso directo:**

- Permite cambiar el mecanismo (cookie, `sessionStorage`, memoria) **sin tocar** el resto
  del código. Hoy el único consumidor real es el interceptor de axios.
- Permite **testear** el flujo sin `localStorage` (inyectando un store en memoria).
- Deja explícito el punto de decisión sobre seguridad.

**Trade-off asumido (ver DK-1 en `spec.md`):** `localStorage` es legible desde JavaScript,
por lo que un XSS podría exfiltrar el token. La alternativa más segura sería la cookie
`HttpOnly`, que **requiere un cambio en el backend**. Queda documentado como deuda con
mitigación concreta (cambiar un módulo).

**Por qué `localStorage` y no `sessionStorage`:** la sesión debe sobrevivir a la recarga de
la página (requisito FR-8). `sessionStorage` la perdería al cerrar la pestaña.

### D-3 · Inyección del header en un interceptor de request

**Decisión:** un único interceptor de request de axios adjunta el header.

```ts
http.interceptors.request.use((config) => {
  const token = tokenStore.leer();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

**Por qué:** cumple NFR-3 (una sola instancia de cliente HTTP) y garantiza que **ninguna**
petición se emite sin el header cuando hay sesión (CA-15). Un `fetch` manual en un
componente podría olvidarse.

**Detalle importante:** el interceptor de request **no** debe adjuntar el token a la
petición de `login` (no sirve y ensucia) ni al preflight `OPTIONS` (que no lleva credenciales
y cuyo `Access-Control-Request-Headers` ya lo declara). Se filtra por URL/método.

### D-4 · Manejo de 401: un único manejador, con guardas

**Decisión:** el interceptor de response detecta `401` y delega a un manejador registrado.

```ts
http.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401 && !esIntentoDeAuth(error.config?.url)) {
      manejadorDeNoAutorizado?.();
    }
    return Promise.reject(error);
  },
);
```

**Guardas obligatorias (evitan los bugs que tenía la versión anterior):**

1. **No disparar en `login`/`register`**: un `401` ahí significa "credenciales incorrectas",
   que la UI de login debe mostrar, no "sesión expirada" → no debe limpiar ni redirigir.
2. **No disparar durante el chequeo inicial de sesión**: `GET /api/profile` devuelve `401`
   legítimamente cuando no hay sesión. Ese `401` **es la respuesta esperada**, no un evento
   de expiración. Sin esta guarda, la app redirigía a `/login` y hacía imposible cargar
   `/register` directamente.
3. **No Encadenar redirecciones**: si ya estamos en `/login`, no volver a navegar.

**Por qué no `window.dispatchEvent`:** el enfoque anterior (un `CustomEvent` global)Acoplaba
el transporte con la navegación sin tipar. Con TypeScript, un callback registrado
(`manejadorDeNoAutorizado`) es explícito, tipado y testeable.

### D-5 · Estado de sesión: máquina de estados explícita

**Decisión:** `AuthContext` expone un `status` discreto en lugar de varios booleanos.

```ts
type EstadoSesion = "cargando" | "autenticado" | "anonimo";
```

**Por qué:** la versión anterior usaba `user: null` + `loading: boolean`, lo que produce
estados imposibles (`user` presente y `loading` activo) y condicionales ambiguos en cada
página. Un discriminante hace que los `switch` sean exhaustivos y que el compilador
detecte los casos no cubiertos.

### D-6 · Errores: un tipo de dominio, no errores de axios

**Decisión:** `domain/errors.ts` traduce cualquier fallo a un tipo propio.

```ts
export type AuthError =
  | { tipo: "validacion"; mensaje: string; codigo?: string }
  | { tipo: "noAutorizado"; mensaje: string }
  | { tipo: "prohibido"; mensaje: string }
  | { tipo: "conflicto"; mensaje: string }
  | { tipo: "red"; mensaje: string }
  | { tipo: "desconocido"; mensaje: string };
```

**Por qué:** las páginas no deberían conocer la forma de axios. Además resuelve NFR-5 y el
caso que la versión anterior no cubría: los errores **de red** (servidor caído, CORS) no
tienen `response.data.msg` y hoy muestran el texto inglés "Network Error".

La traducción usa el `code` del backend (`UNAUTHORIZED`, `VALIDATION_ERROR`, …) para
**decidir** y el `msg` solo para **mostrar**.

### D-7 · Migración a TypeScript como tarea previa

**Decisión:** la migración a TS es la **tarea T-1** de esta línea de trabajo, no un supuesto.

**Por qué:** el contrato de §5 de `spec.md` solo se puede expresar con tipos (DTOs de
perfil, `Rol` como unión, `AuthError` como unión discriminada). Migrar "después" implica
escribir los tipos dos veces.

**Alcance de la migración (front):**

- `tsconfig.json` con `strict: true`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`.
- `allowJs: false`; renombrar `.jsx` → `.tsx` y `.js` → `.ts` en las capas tocadas.
- `npm i -D typescript` + script `"typecheck": "tsc --noEmit"`.
- `oxlint` ya soporta TS; añadir la regla de type-aware si procede.

> Alcance acotado: la migración completa de las 7 páginas de negocio excede esta línea de
> trabajo. Se migran **completas** las capas `domain/`, `lib/`, `repositories/`, `services/`,
> `context/` y las páginas de auth + `ProtectedRoute` + `Layout`. Las páginas de negocio
> quedan en JS hasta su línea de trabajo y conviven vía `allowJs` **temporal**.

### D-8 · Variables de entorno tipadas

**Decisión:** `lib/env.ts` valida y expone `import.meta.env` con tipos.

```ts
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api",
};
```

**Por qué:** `import.meta.env` es `any` por defecto; sin este módulo, la URL de la API
queda implícita en 8 archivos. Además permite añadir `VITE_API_URL` a `.env.example`.

---

## 5. Flujos

### 5.1 Inicio de sesión

```
Usuario → Login.tsx
  → auth.service.login(username, password)
      → auth.repository.login()          HTTP POST /api/login
          → 200 { msg, token }
              → tokenStore.guardar(token)
  → auth.service.getSession()            HTTP GET /api/profile  (con Authorization)
      → 200 perfil DTO
          → mapearPerfil(dto) → UsuarioAutenticado
  → AuthContext: status = "autenticado", user = usuario
  → navigate("/")
```

Si `login` falla con `401` → `AuthError { tipo: "noAutorizado" }` → la UI de login muestra
el `msg`. **El token no se guarda** y el manejador global de 401 **no** se dispara (guarda
D-4.1).

### 5.2 Carga inicial de la app

```
AuthProvider monta
  → status = "cargando"
  → auth.service.getSession()
      → ¿hay token en tokenStore?
           NO → status = "anonimo"   (sin llamada al backend)
           SÍ → GET /api/profile
                  200 → status = "autenticado"
                  401 → tokenStore.limpiar(); status = "anonimo"
                        (el 401 de perfil NO dispara el manejador global: guarda D-4.2)
```

> **Optimización deliberada:** si no hay token, **no** se llama al backend. La versión
> anterior siempre hacía `GET /api/profile` al arrancar y por eso disparaba el evento
> `cit:unauthorized` en cada carga en frío.

### 5.3 Petición protegida que devuelve 401 (token expirado)

```
Petición con Authorization → 401
  → interceptor response detecta 401 (no es login/register)
  → manejadorDeNoAutorizado()
      → tokenStore.limpiar()
      → AuthContext: status = "anonimo", user = null
      → navigate("/login")   (si no estamos ya en /login)
```

### 5.4 Registro

```
Usuario → Register.tsx
  → construye FormData (campos + documento si rol = cit)
  → auth.service.register(formData)
      → POST /api/register (multipart)
          → 200 { msg, document_url }  → UI de confirmación
          → 400 DOCUMENT_REQUIRED / VALIDATION_ERROR → mensaje en el formulario
          → 413 (archivo > 5 MB) → mensaje en el formulario
```

> El registro **no** autentica: tras el alta, el usuario debe iniciar sesión
> (comportamiento actual de `Register.tsx`, alineado con el backend, que no devuelve token
> en el registro).

---

## 6. Estrategia de pruebas

| Capa | Qué se testea | Herramienta | Sin |
|---|---|---|---|
| `domain/` | `esRol()`, traducción de errores, mapeo de DTO | `vitest` | DOM, red |
| `repositories/` | Que se llame al endpoint correcto, con el body y el header correctos | `vitest` + `axios` simulado (`vi.mock`) | red real |
| `services/` | Orquestación: guarda token, no guarda si falla, limpia en logout | `vitest` + repositorio simulado | red, React |
| `context/` | `getSession` en cold start, login, logout, expiración | `@testing-library/react` | red |
| `ProtectedRoute` | Redirección sin sesión, bloqueo por rol, render con sesión | `@testing-library/react` | red |
| **Integración** | Login real contra el backend en marcha | `vitest` + `supertest`/fetch | — |

**Criterio:** se prueba la **frontera** con dobles (repository simulado para el servicio;
axios simulado para el repository), nunca la base de datos desde el frontend.

**Directorio:** `frontend/src/__tests__/` con `vitest` + `jsdom`.

---

## 7. Variables de entorno

| Variable | Entorno | Valor | Estado |
|---|---|---|---|
| `VITE_API_URL` | frontend | `http://localhost:3000/api` | ✅ existe (`.env.development`) |
| `VITE_API_URL` | frontend (`.env.example`) | — | ⬜ crear |
| `PORT` | backend | `3000` | ⬜ documentar |
| `JWT_SECRET` | backend | — | ⬜ requerido, no existe `.env` |
| `JWT_EXPIRES_IN` | backend | `1h` (default) | ⬜ documentar |
| `CORS_ORIGINS` | backend | `http://localhost:5173` | ⬜ documentar (no hace falta `credentials`) |

> Con el mecanismo Bearer **no** hace falta `credentials: true` en el `cors()` del backend
> (ya está así en la versión TS). Sí hace falta que `CORS_ORIGINS` incluya el origen del
> frontend cuando `NODE_ENV=production`.

---

## 8. Orden de ejecución

```
        Fase A ─────────────► Fase B ─────────────► Fase C
   (comunicación real)   (estado global)      (UI, docs, pruebas)

   T-1  Migración TS
   T-2  Dominio (tipos)
   T-3  lib/ (env, http, token-store)
   T-4  repositories/
   T-5  services/
   T-6  authService/apiClient   ── se elimina el obsoleto
   T-7  Integrar Login/Register
                            T-8  AuthContext (nuevo)
                            T-9  ProtectedRoute
                            T-10 Rutas + guards
                            T-11 Redux
                            T-12 Home
                                                  T-13 Tests
                                                  T-14 Docs
```

Detalle en [`task.md`](./task.md).

---

## 9. Riesgos

| # | Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|---|
| R-1 | El backend TS aún no está en la rama de trabajo | Alta | Bloquea la Fase A | T-0: mergear `origin/gonzadvlop` antes de empezar |
| R-2 | No hay `.env` ni base de datos disponible | Alta | No se pueden probar los flujos reales | T-0: preparar `.env` y una DB (docker) |
| R-3 | El contrato documentado no coincide con lo desplegado | Media | Fallos en la integración | La Fase C incluye una prueba de contrato real contra el backend en marcha |
| R-4 | La migración TS choca con el lint actual (`only-export-components`) | Media | Fricción de build | Separar `useAuth` a `domain/hooks/` o desactivar la regla para contexto |
| R-5 | El token en `localStorage` queda expuesto a XSS | Media | Secuestro de sesión | D-2 (abstracción) para migrar a cookie `HttpOnly` sin refactor |
| R-6 | La expiración a 1 h interrumpe al usuario sin avisar | Media | Mala experiencia | Mostrar aviso de sesión expirada al redirigir por 401 (T-10) |
