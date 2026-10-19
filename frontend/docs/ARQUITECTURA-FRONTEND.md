# Arquitectura del Frontend — CITio / Gestor de Servicios

> Documento de referencia del estado actual del frontend (`frontend/`).
> Describe decisiones tomadas, estructura, contrato con el backend, autenticación,
> y riesgos detectados. Última revisión: commit `b46a395` ("Se añadio Register, Home y layout").

---

## 1. Resumen ejecutivo

| Aspecto | Estado actual |
|---|---|
| Framework | React 19 + Vite 8 (JavaScript/JSX, sin TypeScript) |
| Routing | `react-router-dom` v7 con `BrowserRouter` y rutas anidadas |
| Estilos | Tailwind CSS v4 (motor CSS-first) + CSS plano para Login/Register |
| Cliente HTTP | `axios` con instancia única (`apiClient`) |
| Estado global | 1 contexto de React (`AuthContext`), sin librería externa |
| Autenticación | JWT en cookie `HttpOnly` (`SameSite=Strict`), sesión restaurada por `GET /api/profile` |
| Roles | `user` / `cit` / `admin`, resueltos **en el cliente** para ocultar UI |
| Lint | `oxlint` (8 warnings, 0 errores) |
| Tests | **No hay tests en frontend** |
| Build | `vite build` OK — 316 kB JS (99.9 kB gzip) |

El frontend es una SPA funcional que cubre: login, registro (con carga de documento para personal CIT),
home, servicios, solicitudes, publicaciones (+ detalle), propuestas y perfil.

---

## 2. Dependencias

### 2.1 Runtime (`dependencies`)

| Paquete | Versión | Uso real | Notas |
|---|---|---|---|
| `react` / `react-dom` | ^19.2.8 | Render de la SPA | React 19 con `StrictMode` |
| `react-router-dom` | ^7.18.4 | Routing | v7 con API `Routes/Route` clásica |
| `axios` | ^1.20.0 | Cliente HTTP | Se usa **solo** a través de `apiClient` |

### 2.2 Desarrollo (`devDependencies`)

| Paquete | Versión | Uso real | Notas |
|---|---|---|---|
| `vite` | ^8.2.2 | Dev server + build | — |
| `@vitejs/plugin-react` | ^6.1.0 | Transformación JSX / HMR | Usa Oxc, no SWC |
| `tailwindcss` + `@tailwindcss/vite` | ^4.3.3 | Estilos | v4 **no** usa `tailwind.config.js` |
| `oxlint` | ^1.79.0 | Lint | Sustituye a ESLint/Prettier |
| `postcss` | ^10.x (^8.5.28) | — | **Sin uso**: Tailwind v4 corre como plugin de Vite y no hay `postcss.config.js` |
| `autoprefixer` | ^10.5.5 | — | **Sin uso**: tampoco hay pipeline PostCSS configurado |
| `@types/react`, `@types/react-dom` | ^19.2.x | — | **Sin uso**: el proyecto es JS puro, no TS |

### 2.3 Dependencias declaradas pero sin uso

`postcss`, `autoprefixer`, `@types/react`, `@types/react-dom` están en `package.json` pero
ningún archivo las referencia. Se pueden quitar sin impacto funcional.

Además, `react-router-dom` incluye `@remix-run/router` como dependencia transitiva
(≈90 kB del bundle) que no se usa de forma explícita.

---

## 3. Estructura de carpetas

```
frontend/
├── .env.development          # VITE_API_URL=http://localhost:3000/api
├── .oxlintrc.json            # Reglas de lint
├── index.html                # Shell de la SPA
├── package.json
├── tailwind.config.js        # ⚠️ archivo muerto (ver §7.1)
├── vite.config.js            # plugins: react() + tailwindcss()
├── docs/
│   └── ARQUITECTURA-FRONTEND.md   # ← este documento
├── public/
│   ├── favicon.svg           # referenciado desde index.html
│   └── icons.svg             # ⚠️ no referenciado en ninguna parte
├── specs/
│   └── 001-authentication/
│       └── tasks.md          # Plan de 16 tareas de autenticación (ver §10)
└── src/
    ├── main.jsx              # Punto de entrada: BrowserRouter > AuthProvider > App
    ├── App.jsx               # Tabla de rutas
    ├── index.css             # @import "tailwindcss" + @theme (paleta CIT) + utility input-base
    ├── App.css               # ⚠️ archivo vacío y no importado
    ├── assets/
    │   ├── logo-CITio.png    # Usado (Login, Register, Layout, Home)
    │   ├── hero.png          # ⚠️ no referenciado
    │   ├── react.svg         # ⚠️ residuo del template de Vite
    │   └── vite.svg          # ⚠️ residuo del template de Vite
    ├── components/
    │   ├── Layout.jsx        # Sidebar + <Outlet/> (shell de la app autenticada)
    │   └── ProtectedRoute.jsx# Gate de sesión y (opcionalmente) de rol
    ├── context/
    │   └── AuthContext.jsx   # ÚNICO contexto global (estado de sesión)
    ├── contexts/             # ⚠️ directorio vacío (muerto)
    ├── hooks/                # ⚠️ directorio vacío (muerto)
    ├── layouts/              # ⚠️ directorio vacío (muerto)
    ├── pages/
    │   ├── auth/
    │   │   ├── Login.jsx + Login.css
    │   │   └── Register.jsx + Register.css
    │   ├── Home.jsx
    │   ├── Servicios.jsx
    │   ├── Solicitudes.jsx
    │   ├── Publicaciones.jsx
    │   ├── PublicacionDetalle.jsx
    │   ├── Propuestas.jsx
    │   └── Perfil.jsx
    └── services/
        ├── apiClient.js      # Instancia axios + interceptor 401 + getApiError()
        ├── authService.js
        ├── catalogosService.js
        ├── profileService.js
        ├── propuestasService.js
        ├── publicacionesService.js
        ├── serviciosService.js
        └── solicitudesService.js
```

### 3.1 Convenciones observadas

- **Carpetas en plural** para colecciones (`pages`, `services`, `components`), **en singular**
  para módulos de dominio (`context`, `auth`). `services` es un nombre que colisiona conceptualmente
  con "servicios del CIT" (el dominio de negocio), lo que puede generar confusión.
- Las páginas de negocio viven directamente en `pages/`; las de auth en `pages/auth/`.
- Los servicios son **named exports** (`export const getServicios = ...`), nunca default.
- `apiClient` es el **único** default export del proyecto.
- Las páginas de negocio usan `export default`; las de auth usan named export (`export const Login`).
- Comentarios en español, formato `// comentario` de una línea o bloque `/* */`.

---

## 4. Rutas

Definidas en `src/App.jsx` con `react-router-dom` v7.

| Ruta | Componente | Acceso | Layout |
|---|---|---|---|
| `/login` | `pages/auth/Login` | público | — (pantalla completa) |
| `/register` | `pages/auth/Register` | público | — (pantalla completa) |
| `/` (index) | `pages/Home` | autenticado | `Layout` |
| `/servicios` | `pages/Servicios` | autenticado | `Layout` |
| `/solicitudes` | `pages/Solicitudes` | autenticado | `Layout` |
| `/publicaciones` | `pages/Publicaciones` | autenticado | `Layout` |
| `/publicaciones/:id` | `pages/PublicacionDetalle` | autenticado | `Layout` |
| `/propuestas` | `pages/Propuestas` | autenticado | `Layout` |
| `/perfil` | `pages/Perfil` | autenticado | `Layout` |
| `*` | `Navigate to="/"` | — | — |

### 4.1 Composición

```
<Routes>
  <Route path="/login"    element={<Login />} />
  <Route path="/register" element={<Register />} />

  <Route element={<ProtectedRoute />}>      ← gate de sesión
    <Route element={<Layout />}>            ← shell visual
      <Route index        element={<Home />} />
      <Route path="servicios"   element={<Servicios />} />
      ...
    </Route>
  </Route>

  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

El patrón de **layout por ruta anidada** (`element` sin `path` + `<Outlet/>`) es correcto y
permite proteger y envolver todas las páginas con una sola declaración.

### 4.2 Observación importante sobre los roles

`ProtectedRoute` **acepta** un prop `roles` (`string[]`) que renderiza una pantalla 403 si el
usuario no tiene el rol, pero **ninguna ruta lo usa**. En la práctica el control por rol se
hace de forma ad-hoc dentro de cada página:

```js
const isCIT = user?.role === 'cit' || user?.role === 'admin';
```

Esa expresión está **duplicada en 4 páginas** (`Servicios`, `Solicitudes`, `Publicaciones`,
`Propuestas`). Consecuencias:

- Las rutas no están protegidas por rol: un usuario `user` puede entrar a `/publicaciones` y ver
  la UI (la API sí lo bloquea, pero la vista no).
- La lógica de "quién puede hacer qué" está duplicada y puede divergir.
- El prop `roles` de `ProtectedRoute` es código muerto que sugiere una capacidad inexistente.

> **Recomendación:** extraer `useIsCIT()` / `useHasRole(...)` a `src/hooks/` y aplicar
> `<ProtectedRoute roles={['cit','admin']}>` en las rutas que lo requieren, o un `<RoleGate>`
> que envuelva secciones de la UI.

---

## 5. Componentes

### 5.1 `components/Layout.jsx` — shell de la app autenticada

- Sidebar fijo de 240 px (`w-60`) con logo, navegación, badge de rol y botón "Cerrar sesión".
- `<main>` con `max-w-6xl` y `<Outlet />` para el contenido de la página.
- `NAV_LINKS` es un array constante: **`[{ to: '/', label: 'Inicio', end: true }]`**.

> **Hallazgo C1 (VERIFICADO):** la navegación solo contiene "Inicio". Las rutas `/servicios`,
> `/solicitudes`, `/publicaciones`, `/propuestas` y `/perfil` **existen y funcionan**, pero
> **no hay ningún enlace visible para llegar a ellas**. El usuario queda encerrado en la home
> salvo que escriba la URL a mano. Esto es un bug de UX funcional, no una decisión de diseño.
>
> **Reproducción verificada:** con una sesión autenticada mockeada, el árbol de accesibilidad del
> sidebar expone **un solo enlace** (`Inicio`); navegando directamente a `/servicios` la página
> renderiza correctamente (con el botón "+ Nuevo servicio" propio del rol CIT), confirmando que
> el problema es exclusivamente la ausencia de enlaces.

### 5.2 `components/ProtectedRoute.jsx` — gate de acceso

Tres estados:
1. `loading === true` → pantalla "Verificando sesión…".
2. `!user` → `<Navigate to="/login" replace />`.
3. `roles` presentes y el rol no está en la lista → pantalla 403.

Devuelve `<Outlet />` cuando corresponde. Implementación correcta del patrón de guard.

### 5.3 Páginas de negocio

Todas comparten el mismo esqueleto (copiado de archivo en archivo, sin componente compartido):

```
const [datos, setDatos] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [feedback, setFeedback] = useState('');   // solo algunas

const loadData = useCallback(async () => { ... }, []);
useEffect(() => { loadData(); }, [loadData]);
```

Elementos comunes:
- `loadData` con `useCallback` + `useEffect` — carga inicial.
- Mutaciones: `setError('')` → operación → `setFeedback(...)` → `loadData()` para refrescar.
- Formularios: estado controlado con un objeto `INITIAL_FORM` y `handleChange` genérico
  basado en `e.target.name`.
- Mensajes de error con el patrón `getApiError(err, 'fallback en español')`.
- Estilos Tailwind inline en el JSX: `rounded-2xl border border-cit-600/40 bg-cit-800 p-6`.

### 5.4 Páginas de auth (`Login`, `Register`)

- CSS **plano y dedicado** (`Login.css`, `Register.css`) importado desde el componente.
- `Register` reusa `Login.css` y añade `Register.css` con overrides.
- Fondo animado con 3 capas de estrellas (`#stars`, `#stars2`, `#stars3`) y `box-shadow`
  con 100+ posiciones hardcodeadas.
- `Register` usa un objeto de estado único (`form`) y `FormData` para enviar el multipart.
  El campo `document` solo se muestra y se exige cuando `role === 'cit'`.

> **Nota de consistencia:** existe un conflicto entre los dos sistemas de estilo. `Login`/`Register`
> usan clases semánticas (`form-card`, `input-field`) definidas en CSS plano, mientras que
> el resto de la app usa utilidades Tailwind. Además, `index.css` define un utility
> `@utility input-base` que las páginas de negocio usan, pero `Login`/`Register` **no** lo usan.
> El color de fondo de `Login` (`#171717` / `#0d2e0f`) está duplicado literal en el CSS,
> fuera del sistema de tokens `@theme` de Tailwind.

---

## 6. Manejo de estado

### 6.1 Decisión: un solo contexto, sin librería externa

No se usa Redux, Zustand, Jotai, TanStack Query ni Recoil. El estado se divide en:

| Tipo | Dónde vive | Ejemplos |
|---|---|---|
| Estado de sesión (global) | `context/AuthContext.jsx` | `user`, `loading` |
| Estado de servidor (página) | `useState` local en cada página | `servicios`, `publicaciones`, `sectores`, `estados` |
| Estado de formulario (página) | `useState` local | `form`, `decisiones` |
| Estado efímero (página) | `useState` local | `showForm`, `editing`, `saving`, `error`, `feedback` |

**Rational implícito:** el dominio es chico y el estado compartido real es únicamente la sesión.
Evitar una librería de estado global mantiene el bundle en 100 kB gzip.

### 6.2 `AuthContext` — API pública

```js
const { user, loading, login, register, logout, checkSession } = useAuth();
```

- `user` es un objeto **normalizado** (no la respuesta cruda del backend):

  ```js
  { userId, profileId, username, email, role, firstName, lastName, avatarUrl }
  ```

  La normalización vive en `normalizeProfile()` dentro del propio contexto.

- `loading` es `true` hasta que termina `checkSession()`; `ProtectedRoute` lo usa para no
  redirigir antes de tiempo (evita el "flash" de `/login` en recargas).

### 6.3 Consecuencias del modelo actual

1. **No hay caché ni invalidación de datos de servidor.** Cada página recarga su lista
   al montarse y vuelve a pedir todo tras cada mutación. No hay sharing entre páginas
   (p. ej. `Servicios` y `Solicitudes` no comparten estado).
2. **No hay control de concurrencia / race conditions.** `Solicitudes.loadData` depende de
   `isCIT`; si el usuario cambia de rol el efecto se re-dispara, pero las respuestas fuera de
   orden no se descartan.
3. **Los mensajes de feedback son locales y se pierden al navegar.** No hay toast global.
4. **El estado `error` no se limpia al cambiar de sección** en algunas páginas (p. ej.
   `Propuestas` mantiene el error visible aunque cambie de pestaña).

---

## 7. Autenticación

### 7.1 Decisión de diseño: JWT en cookie `HttpOnly`

Decisión documentada en los commits `5d379c2` ("La autenticación de CITio será JWT almacenado
en una cookie HttpOnly") y `b00a6a5` (CORS con cookies).

```
Backend  ──login──▶  Set-Cookie: token=<JWT>; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600
                       (secure=true solo en producción)
Frontend ──▶  GET /api/profile   (envía la cookie sola, con withCredentials: true)
```

Ventajas: el token **no es accesible desde JavaScript** → el XSS no puede exfiltrar la sesión.
El JWT tiene expiración de **1 h** (`backend/helper/jwt.js`).

### 7.2 Flujo de arranque de la app

```
main.jsx
 └─ BrowserRouter
     └─ AuthProvider            ← useState(user=null, loading=true)
         └─ App (Routes)

AuthProvider monta:
  1. useEffect → checkSession()
       └─ GET /api/profile
            ├─ 200 → normalizeProfile(data) → setUser(obj)
            └─ 401/err → catch → setUser(null)
       finally → setLoading(false)

ProtectedRoute:
  loading=true  → "Verificando sesión…"
  loading=false, user=null  → Navigate to /login
  loading=false, user!=null → Outlet
```

### 7.3 Login

`Login.jsx` → `authService.login()` → `POST /api/login {username, password}` → el backend setea
la cookie → el frontend llama `checkSession()` para obtener el perfil → `navigate('/')`.

El estado `error` se muestra en un `.error-badge` con el mensaje `msg` del backend.

### 7.4 Registro

`Register.jsx` → construye un `FormData` con los campos del formulario + `document` (si `role==='cit'`)
→ `POST /api/register` (multipart) → el backend valida el documento con `validateCITRegistration`
→ responde `200 {msg, document_url}` → la UI muestra la pantalla "Registro exitoso".

> **Nota:** el backend devuelve también el `token` en el body del login
> (`res.json({msg, token})`), aunque la decisión de arquitectura es que el token viva
> **solo** en la cookie. Es redundante y deja al frontend la puerta abierta a volver a guardar
> el token en `localStorage`; conviene eliminarlo del body de la respuesta.

### 7.5 Logout

`POST /api/logout` (protegido con `requireAuth`) → `res.clearCookie('token')` → el frontend
limpia el estado y navega a `/login` (en un `finally`, para que funcione incluso si la red falla).

### 7.6 Manejo global de 401

`apiClient.js` tiene un interceptor de respuesta:

```js
if (status === 401 && !isAuthAttempt) {
  window.dispatchEvent(new CustomEvent('cit:unauthorized'));
}
```

`AuthContext` escucha ese evento: limpia el usuario y redirige a `/login`
(salvo que ya esté en `/login`).

> **Hallazgo C2 (VERIFICADO):** el chequeo inicial de sesión (`GET /api/profile`) **siempre
> devuelve 401** para un usuario anónimo. Como `/profile` no está en la lista `isAuthAttempt`
> (`['/login', '/register']`), el interceptor dispara `cit:unauthorized` en **cada arranque en frío**
> de la app. El handler en `AuthContext` hace:
>
> ```js
> if (!window.location.pathname.startsWith('/login')) navigate('/login');
> ```
>
> Consecuencia: **un usuario anónimo que entre directo a `/register` (URL, refresh, o enlace
> compartido) es redirigido a `/login` antes de ver el formulario.** La página de registro
> solo es alcanzable clickeando "Registrarse" desde el login (navegación client-side, que no
> dispara un nuevo `checkSession`).
>
> **Reproducción verificada:** con `GET /api/profile` respondiendo 401 (como hace el backend
> real sin sesión), navegar a `http://localhost:5173/register` redirige a
> `http://localhost:5173/login`. El log del mock backend muestra el `GET /api/profile`
> disparado en cada arranque en frío.
>
> **Fix sugerido:** excluir el chequeo de sesión del evento, por ejemplo pasando un flag al
> cliente (`apiClient.get('/profile', { skipUnauthorizedEvent: true })`) y chequeándolo en el
> interceptor, o comparando contra un conjunto de rutas públicas (`/login`, `/register`) en el
> handler en lugar de solo `/login`.

### 7.7 Autorización: dos capas

| Capa | Dónde | Qué garantiza |
|---|---|---|
| Cliente (UI) | `isCIT` en cada página | Oculta botones y secciones por rol |
| Servidor (real) | `requireAuth`, `requireCIT`, `requireUser`, `requireRole`, `requireSelfOrRole` | **La seguridad real** |

> La protección efectiva la aplica el backend. La UI solo melhora la experiencia.
> Esto está bien implementado, pero el prop `roles` sin uso de `ProtectedRoute` (ver §4.2)
> crea la falsa impresión de que la UI también está protegida.

### 7.8 CORS

`backend/app.js` configura `cors` con `CORS_ORIGINS` (lista separada por comas). En desarrollo,
si no está definida, permite cualquier origen. En producción, si no está definida, **bloquea todo**.

> **Pendiente (spec #16):** confirmar que `CORS_ORIGINS` incluya el dominio real de la UI en
> producción.
>
> ### ⚠️ C3 (VERIFICADO): falta `credentials: true` — rompe la autenticación por cookie
>
> El `cors()` actual **no declara `credentials: true`**:
>
> ```js
> // backend/app.js:15-19
> app.use(cors({
>     origin: allowedOrigins.length > 0
>         ? allowedOrigins
>         : process.env.NODE_ENV === "production" ? false : true,
> }));
> ```
>
> Con `axios` configurado con `withCredentials: true`, el navegador exige que la respuesta
> incluya `Access-Control-Allow-Credentials: true`. Sin él, **la petición se bloquea
> completamente** y la cookie nunca se envía. Y esto afecta **también a desarrollo**
> (5173 → 3000 es cross-origin), no solo a producción.
>
> **Reproducción verificada** (servidor Express con la config exacta de `app.js`, puerto 3000;
> página servida en 5173 que hace `fetch(..., { credentials: 'include' })`):
>
> | Config | Resultado |
> |---|---|
> | `cors({ origin: true })` (actual) | `login ERROR: Failed to fetch` / `profile ERROR: Failed to fetch`; el servidor registra `cookie recibido: (NINGUNA)` |
> | `cors({ origin: true, credentials: true })` | `login status: 200`, `profile status: 200`, **`hasCookie: true`** |
>
> Headers de la respuesta con la config actual (vía `curl`):
>
> ```
> HTTP/1.1 200 OK
> Access-Control-Allow-Origin: http://localhost:5173
> Vary: Origin
> Set-Cookie: token=JWT-DE-PRUEBA; Path=/; HttpOnly; SameSite=Strict
>                                    <-- falta Access-Control-Allow-Credentials: true
> ```
>
> **Fix (una línea):**
>
> ```js
> app.use(cors({
>     origin: allowedOrigins.length > 0
>         ? allowedOrigins
>         : process.env.NODE_ENV === "production" ? false : true,
>     credentials: true,
> }));
> ```
>
> Con `credentials: true`, el valor de `origin` **no puede ser `*`** (el navegador lo rechaza),
> por lo que en producción hay que garantizar que `CORS_ORIGINS` liste los orígenes exactos
> (esquema + host + puerto, sin barra final).

### 7.9 Variables de entorno

| Variable | Dónde | Valor actual |
|---|---|---|
| `VITE_API_URL` | `frontend/.env.development` | `http://localhost:3000/api` |
| `CORS_ORIGINS` | `backend/.env` (⚠️ **no existe**) | — |
| `JWT_SECRET` | `backend/.env` (⚠️ **no existe**) | — |
| `DB_NAME` / `DB_USER` / `DB_HOST` | `backend/.env` (⚠️ **no existe**) | — |

> `frontend/.env.development` es la **única** piece de config de entorno del frontend, y ya está
> versionada en git (no es un secreto, pero conviene saber que está trackeada).
> **No existe `frontend/.env.production`** ni `.env.example`. Tampoco hay `.gitignore` en
> `frontend/` (el de `backend/` sí existe) → un `.env` con secretos de URL quedaría versionado.

---

## 8. Capa de servicios y contrato con la API

### 8.1 Patrón

Cada módulo de dominio expone funciones que envuelven una llamada a `apiClient` y devuelven
**el payload ya desenvuelto** (`data.data` cuando el backend usa el sobre `{count, data}`).

```
pages/*.jsx  →  services/<dominio>Service.js  →  apiClient (axios)  →  backend /api/*
```

### 8.2 Inventario de endpoints consumidos

| Servicio frontend | Método + ruta | Envuelve | Middleware backend |
|---|---|---|---|
| `authService.login` | `POST /login` | `data` | — |
| `authService.register` | `POST /register` (multipart) | `data` | multer + `validateCITRegistration` |
| `authService.logout` | `POST /logout` | `data` | `requireAuth` |
| `authService.getProfile` | `GET /profile` | `data` (crudo) | `requireAuth` |
| `catalogosService.getSectores` | `GET /sectores` | `data.data` | `requireAuth` |
| `catalogosService.getEstados` | `GET /estados` | `data.data` | `requireAuth` |
| `profileService.getProfileByUserId` | `GET /profile/:userId` | `data.data` | `requireAuth` + `requireSelfOrRole('admin')` |
| `profileService.updateProfile` | `PUT /profile/:userId` | `data` | `requireAuth` + `requireSelfOrRole('admin')` |
| `propuestasService.getPropuestasPendientes` | `GET /propuestas` | `data.data` | `requireAuth` + `requireCIT` |
| `propuestasService.crearPropuesta` | `POST /propuesta/crear` | `data` | `requireAuth` + `requireUser` |
| `propuestasService.dictaminarPropuesta` | `POST /propuestas/dictaminar/:id` | `data` | `requireAuth` + `requireCIT` |
| `publicacionesService.getPublicaciones` | `GET /publicaciones` | `data.data` | `requireAuth` |
| `publicacionesService.getPublicacionById` | `GET /publicacion/:id` | `data.data` | `requireAuth` |
| `publicacionesService.createPublicacion` | `POST /publicacion/crear` | `data` | `requireAuth` + `requireCIT` |
| `publicacionesService.updatePublicacion` | `PUT /publicacion/:id` | `data` | `requireAuth` + `requireCIT` |
| `publicacionesService.deletePublicacion` | `DELETE /publicacion/:id` | `data` | `requireAuth` + `requireCIT` |
| `serviciosService.getServicios` | `GET /servicios` | `data.data` | `requireAuth` |
| `serviciosService.createServicio` | `POST /servicios` | `data` | `requireAuth` + `requireCIT` |
| `solicitudesService.getSolicitudes` | `GET /solicitudes` | `data.data` | `requireAuth` |
| `solicitudesService.createSolicitud` | `POST /solicitudes` | `data` | `requireAuth` |
| `solicitudesService.updateSolicitudEstado` | `PATCH /solicitudes/:id/estado` | `data` | `requireAuth` + `requireRole('admin','cit')` |

### 8.3 Endpoints del backend **no consumidos** por el frontend

| Endpoint | Posible uso pendiente |
|---|---|
| `GET /api/profiles` | Listado de perfiles (solo admin) — no hay vista admin |
| `POST /api/sectores` / `POST /api/estados` | Alta de catálogos (admin) — no hay UI |
| `GET /api/publicacion/:id/archivos` | Listar archivos de una publicación (el detalle ya los trae embebidos) |
| `POST /api/publicacion/:id/archivos` | **Subir imagen/video a una publicación** — falta la UI |
| `DELETE /api/archivo/:id` | Eliminar un archivo adjunto — falta la UI |
| `GET /api/users`, `GET /api/user/:id`, `POST /api/user/create`, `PUT /api/user/:id`, `DELETE /api/user/:id` | Gestión de usuarios — sin UI |

> **Consecuencia funcional:** el caso de uso del README ("el personal CIT podrá agregar videos,
> imágenes y explicaciones") está **a medio implementar**: `PublicacionDetalle` *renderiza* los
> archivos adjuntos, pero **no hay ninguna forma de adjuntarlos** desde la UI.

### 8.4 Normalización de nombres de payload

El backend usa dos convenciones que conviven:

- **snake_case** para columnas de dominio (`servicio_nombre`, `tipo_contenido`, `sector_id`,
  `fecha_solicitud`, `archivo_url`).
- **camelCase / PascalCase** para las asociaciones de Sequelize (`Sector`, `Proveedor`,
  `Solicitante`, `Revisor`, `Autor`, `Archivo`, `Estado`) y para los timestamps
  (`createdAt`, `updatedAt`).

El frontend consume ambas tal cual, sin capa de traducción, salvo en el `AuthContext` donde
`normalizeProfile()` traduce el perfil a camelCase.

> **Riesgo de acoplamiento:** el frontend depende de los *alias de include* de Sequelize.
> Si un alias cambia en `backend/models/*`, el frontend rompe en silencio (ej.
> `servicio.Sector?.nombre` → `undefined` sin error visible, solo muestra "Sin sector").

### 8.5 Parametro `sector` vs `sector_id`

El backend acepta ambos (`findSector(requestedSector ?? sector)`), donde `sector` se busca por
**código** (string) o por **id** (número) según el tipo. El frontend siempre manda `sector` con el
**código** (viene de `<option value={sector.codigo}>`). Funciona, pero es una convención
implícita que conviene documentar en el contrato.

### 8.6 `getApiError()`

Helper centralizado en `apiClient.js`:

```js
export const getApiError = (error, fallback = 'Ocurrió un error inesperado.') =>
  error.response?.data?.msg || error.message || fallback;
```

Lee el campo `msg` que devuelve consistentemente el backend. Es el patrón correcto y está
aplicado de forma consistente en todas las páginas.

> **Detalle a revisar:** los errores de red (sin respuesta del backend) caen en
> `error.message` ("Network Error"), que no es un mensaje en español. Para esos casos
> convendría detectar `!error.response` y devolver algo como
> "No se pudo conectar con el servidor."

---

## 9. Configuración y estilos

### 9.1 Tailwind CSS v4 — configuración CSS-first

Tailwind v4 **no lee `tailwind.config.js`** salvo que se declare `@config "..."` en el CSS.
En este proyecto:

- `src/index.css` hace `@import "tailwindcss";`
- Los tokens de color están en un bloque `@theme`:

  ```css
  @theme {
    --color-cit-900: #090a0f;
    --color-cit-800: #0d2e0f;
    --color-cit-700: #14351a;
    --color-cit-600: #447232;
    --color-cit-500: #258f2a;
    --color-cit-neon: #0dfc19;
  }
  ```

  Esto genera las utilidades `bg-cit-800`, `text-cit-neon`, `border-cit-600/40`, etc.
- Se define además un `@utility input-base { ... }` para el estilo compartido de inputs.

> **⚠️ `tailwind.config.js` es un archivo muerto.** Contiene la sintaxis de Tailwind v3
> (`content`, `theme.extend`, `plugins`) que v4 ignora silenciosamente. No genera ningún error,
> por lo que puede dar la falsa impresión de que el tema se configura ahí. **Debe eliminarse**
> o migrarse a `@config` + sintaxis v4.

### 9.2 Paleta y sistema visual

- Fondo global: `--color-cit-900` (`#090a0f`), texto `#e5e7eb`.
- Verde institucional `--color-cit-600` (`#447232`) para acciones primaries.
- Verde neón `--color-cit-neon` (`#0dfc19`) para acentos y texto destacado.
- Tipografía: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
- Sin fuente personalizada (se usa la del sistema).

> **Paleta duplicada:** `Login.css` hardcodea `#0d2e0f`, `#171717`, `#36f107`, `#090a0f`,
> `#447232`, `#258f2a` — los mismos valores que existen como tokens en `@theme`. Si la marca
> cambia, hay que editar 2 lugares. La migración de `Login.css`/`Register.css` a utilidades
> Tailwind eliminaría esta divergencia.

### 9.3 Lint — `oxlint`

`.oxlintrc.json` activa 2 reglas:

```json
{
  "plugins": ["react", "oxc"],
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

`npm run lint` → **8 warnings, 0 errores**:

| Archivo | Regla | Causa |
|---|---|---|
| `AuthContext.jsx:40` | `set-state-in-effect` | `checkSession().finally(() => setLoading(false))` |
| `AuthContext.jsx:78` | `only-export-components` | `useAuth` exportado junto al provider |
| `Perfil.jsx:24` | `set-state-in-effect` | `setForm(...)` desde `useEffect([user])` |
| `PublicacionDetalle.jsx:16` | `set-state-in-effect` | `setLoading(true)` al cambiar `id` |
| `Publicaciones.jsx:52` | `set-state-in-effect` | `loadData()` en efecto |
| `Propuestas.jsx:45` | `set-state-in-effect` | `loadPendientes()` en efecto |
| `Servicios.jsx:46` | `set-state-in-effect` | `loadData()` en efecto |
| `Solicitudes.jsx:32` | `set-state-in-effect` | `loadData()` en efecto |

> Estos warnings son en su mayoría **react-lint siendo agresivo** con el patrón
> "cargar datos en un efecto" (que es el patrón idiomático para datos remotos sin
> librería de caching). No son bugs per se, pero el ruido dificulta ver los problemas reales.
> Un `react-hooks/exhaustive-deps` no está activado, y conviene activarlo: actualmente
> `Solicitudes.loadData` depende de `isCIT` pero no de `estados`, y hay `useEffect` con
> deps incompletas que no están marcados.

---

## 10. Specs de autenticación — estado de las tareas

`frontend/specs/001-authentication/tasks.md` define 16 tareas. Estado actual:

| # | Tarea | Estado |
|---|---|---|
| 1 | `cookieParser` en app | ✅ Hecho |
| 2 | Set-cookie en login | ✅ Hecho |
| 3 | `requireAuth` lee cookie | ✅ Hecho (con fallback a header) |
| 4 | `apiClient.js` | ✅ Hecho |
| 5 | Refactor `authService.js` | ✅ Hecho |
| 6 | `AuthContext` | ✅ Hecho |
| 7 | `AuthProvider` en `main.jsx` | ✅ Hecho |
| 8 | `ProtectedRoute` | ✅ Hecho (el prop `roles` no se usa) |
| 9 | Rutas protegidas | ✅ Hecho |
| 10 | Manejo global de 401 | ⚠️ Parcial (dispara en el check inicial de sesión) |
| 11 | UI Login/Register | ✅ Hecho |
| 12 | `docs/api-contract.md` | ❌ No existe |
| 13 | Tests backend (`auth.test.js`) | ❌ No existe (solo `cit-registration.test.js`) |
| 14 | Tests frontend (`__tests__/`) | ❌ No existe |
| 15 | `npm test` (frontend) | ❌ No hay script `test` en el frontend |
| 16 | Revisión de CORS | ⚠️ Parcial (`credentials` no configurado) |

---

## 11. Hallazgos y riesgos

### Críticos (bloquean funcionalidad)

| # | Hallazgo | Ubicación | Impacto | Verificado |
|---|---|---|---|---|
| C1 | **La navegación solo tiene "Inicio"**. No hay enlaces a servicios, solicitudes, publicaciones, propuestas ni perfil | `components/Layout.jsx:5` | 5 de 9 rutas son inalcanzables por UI | ✅ Reproducido en navegador |
| C2 | **`/register` redirige a `/login` para usuarios anónimos** (el 401 del check inicial dispara `cit:unauthorized`) | `context/AuthContext.jsx:45-50` + `services/apiClient.js:18` | El registro solo funciona clickeando el botón desde el login | ✅ Reproducido en navegador |
| C3 | **`cors()` sin `credentials: true`** | `backend/app.js:15-19` | La cookie **no viaja** y la petición se bloquea: el login falla en dev **y** en producción | ✅ Reproducido con servidor Express real |

### Altos

| # | Hallazgo | Ubicación | Impacto |
|---|---|---|---|
| A1 | No hay forma de **adjuntar archivos** (imágenes/videos) a una publicación desde la UI, pese a ser un caso de uso central del README | `pages/Publicaciones.jsx` | Funcionalidad incompleta |
| A2 | El control por rol se duplica en 4 páginas y el prop `roles` de `ProtectedRoute` está sin uso | `pages/*.jsx` + `components/ProtectedRoute.jsx` | Reglas de acceso inconsistentes y código muerto |
| A3 | **Sin tests en el frontend** (ni script `test`) | `frontend/package.json` | Sin red de seguridad para refactors |
| A4 | `frontend/.gitignore` no existe | `frontend/` | Un `.env` con secretos quedaría versionado |
| A5 | No hay `frontend/.env.example` ni `.env.production` | `frontend/` | Configuración opaca para el equipo y para CI/CD |

### Medios

| # | Hallazgo | Ubicación | Impacto |
|---|---|---|---|
| M1 | `tailwind.config.js` es config muerta de Tailwind v3 | `frontend/tailwind.config.js` | Confusión; cambios ahí no tienen efecto |
| M2 | `postcss`, `autoprefixer`, `@types/react`, `@types/react-dom` instalados y sin uso | `package.json` | Ruido / superficie de dependencias |
| M3 | Doble sistema de estilos (Tailwind vs CSS plano) con colores duplicados | `index.css` vs `Login.css` | Mantenimiento divergente |
| M4 | Sin caché ni deduplicación de requests; cada página recarga todo | todas las `pages/` | Requests redundantes, sin placeholders |
| M5 | `getApiError` no maneja errores de red en español | `services/apiClient.js:27` | Mensajes "Network Error" en pantalla |
| M6 | Archivos muertos: `App.css` (vacío), `hero.png`, `react.svg`, `vite.svg`, `icons.svg`, `src/contexts/`, `src/hooks/`, `src/layouts/` | varios | Ruido en el repo |
| M7 | `getProfileByUserId` no se usa en ninguna página | `services/profileService.js:3` | Código muerto |
| M8 | El backend devuelve el `token` en el body del login además de la cookie | `backend/controllers/auth.controllers.js` | Superficie de exposición innecesaria |
| M9 | `README.md` del frontend es el de la plantilla de Vite | `frontend/README.md` | No documenta el proyecto real |
| M10 | `index.html` tiene `lang="en"` | `index.html:2` | Accesibilidad / SEO incorrectos para una app en español |

---

## 12. Recomendaciones priorizadas

### Inmediato (Sprint actual)

1. **Agregar los enlaces de navegación** a `NAV_LINKS` en `Layout.jsx`, con `end` en `/`:
   ```js
   const NAV_LINKS = [
     { to: '/', label: 'Inicio', end: true },
     { to: '/servicios', label: 'Servicios' },
     { to: '/solicitudes', label: 'Solicitudes' },
     { to: '/publicaciones', label: 'Publicaciones' },
     { to: '/propuestas', label: 'Propuestas' },
     { to: '/perfil', label: 'Mi Perfil' },
   ];
   ```
2. **Arreglar el evento `cit:unauthorized`** para que no se dispare durante el check inicial de
   sesión ni en rutas públicas. Opción mínima: ampliar la guarda a
   `!['/login','/register'].includes(window.location.pathname)`. Opción robusta: añadir un flag
   `skipAuthRedirect` por request en `apiClient`.
3. **Configurar `credentials: true`** en el `cors()` del backend y definir `CORS_ORIGINS` con los
   orígenes exactos (nunca `*` cuando `credentials` está activo). Verificado en §7.8.

### Siguiente sprint

4. **Extraer `useIsCIT()` / `useHasRole()`** a `src/hooks/` y usar `<ProtectedRoute roles={[...]}>`
   en las rutas correspondientes, eliminando la duplicación.
5. **Implementar la carga de archivos** de publicaciones (`POST /api/publicacion/:id/archivos`)
   reutilizando el patrón `FormData` del registro.
6. **Agregar tests** con `vitest` + `@testing-library/react`: script `test` en el frontend y
   cobertura de `AuthContext`, `ProtectedRoute` y `apiClient`.
7. **Limpieza de dependencias y archivos muertos**: quitar `postcss`, `autoprefixer`, `@types/*`,
   `tailwind.config.js`, `App.css`, `react.svg`, `vite.svg`, `hero.png`, `icons.svg`, y los
   directorios `src/contexts/`, `src/hooks/`, `src/layouts/`.

### Backlog técnico

8. **Migrar `Login.css` / `Register.css` a utilidades Tailwind** con los tokens `@theme`,
   eliminando la duplicación de la paleta.
9. **Evaluar TanStack Query** si se necesita caché, deduplicación, revalidación e invalidación
   por mutación. A día de hoy no es imprescindible, pero el modelo "refrescar todo tras cada
   mutación" no escala.
10. **Documentar el contrato de API** (`frontend/docs/api-contract.md`) y
    **desacoplar el frontend de los alias de Sequelize** con una capa de DTOs en los servicios.
11. **Añadir `.gitignore` y `.env.example`** en `frontend/`.
12. **Unificar el manejo de errores**: `getApiError` con mensajes en español para errores de red,
    y un componente `Alert`/`Toast` compartido en lugar de los `div` de error/feedback duplicados
    en 6 páginas.
13. **Dividir las páginas grandes**: `Servicios.jsx` (228 líneas), `Publicaciones.jsx` (248) y
    `Propuestas.jsx` (239) podrían extraerse en componentes (`ServiceCard`, `PublicationForm`,
    `ProposalCard`) para facilitar los tests y la lectura.

---

## 13. Metodología de verificación

Los hallazgos marcados como **VERIFICADO** en §11 no se deducen solo de la lectura del código:
se reprodujeron ejecutando la app.

| Hallazgo | Cómo se verificó |
|---|---|
| C1 | Se levantó el dev server de Vite con un backend mock que devuelve un perfil válido (`role: 'cit'`), se navegó a `/` y se inspeccionó el árbol de accesibilidad del sidebar → un solo enlace. Luego se navegó a `/servicios` → la página renderiza (botón "+ Nuevo servicio"), confirmando que la ruta funciona y lo que falta es el enlace. |
| C2 | Backend mock que responde `401` en `GET /api/profile` (igual que el real sin sesión). Se navegó a `http://localhost:5173/register` → la URL final quedó en `http://localhost:5173/login`. El log del mock mostró el `GET /api/profile` disparado en cada arranque. |
| C3 | Se levantó un servidor Express con la **configuración CORS exacta de `backend/app.js`** (paquete `cors` real, rama de desarrollo `origin: true`), más una página servida en 5173 que hace `fetch(..., { credentials: 'include' })`. Sin `credentials: true` → `Failed to fetch` y el servidor registra `cookie recibido: (NINGUNA)`. Con `credentials: true` → `login 200`, `profile 200`, `hasCookie: true`. Los headers se inspeccionaron además con `curl -i`. |

Complementariamente:

- `npm run lint` → **8 warnings, 0 errores** (ver §9.3 para el detalle de cada warning).
- `npm run build` → **OK**, `dist/assets/index-*.js` 316.75 kB (99.92 kB gzip),
  `dist/assets/index-*.css` 20.34 kB (5.41 kB gzip).

> Nota: `backend/.env` **no existe** en el repositorio, por lo que el backend real no puede
> arrancar (`startServer()` exige `DB_NAME`, `DB_USER`, `DB_HOST` y `JWT_SECRET`). La
> verificación de C3 se hizo por eso contra una réplica de la config CORS, no contra el backend
> completo.

---

## 14. Comandos

```bash
cd frontend

npm run dev       # Vite dev server (HMR) en http://localhost:5173
npm run build     # build de producción en dist/
npm run preview   # sirve el build de dist/
npm run lint      # oxlint
```

> Requisito para que la app funcione: el backend debe estar corriendo en
> `http://localhost:3000` con un `.env` válido (`DB_*`, `JWT_SECRET`, `CORS_ORIGINS`).
> Actualmente **`backend/.env` no existe**, por lo que el backend no arranca
> (`startServer()` valida `DB_NAME`, `DB_USER`, `DB_HOST` y `JWT_SECRET`).
