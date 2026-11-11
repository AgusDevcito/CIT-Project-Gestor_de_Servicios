# Contrato de API — Autenticación (Spec 001)

> **Fuente de verdad**: `backend/src/routes/auth.routes.ts`, `backend/src/controllers/auth.controller.ts`, `backend/src/services/auth.service.ts`, `backend/src/middlewares/auth.middleware.ts`.
> **Prefijo base**: `/api` (`VITE_API_URL`, por defecto `http://localhost:3000/api`).

---

## 1. Mecanismo de autenticación

La plataforma utiliza **JWT Bearer** en el header `Authorization`. No se utilizan cookies para mantener la sesión.

```http
Authorization: Bearer <jwt>
```

- `POST /api/login` devuelve el token en el cuerpo de la respuesta (`{ msg, token }`).
- `requireAuth` lee exclusivamente el header `Authorization: Bearer <jwt>`.
- El payload del JWT contiene `{ id, email, role }` y expira según `JWT_EXPIRES_IN` (por defecto `1h`).
- El frontend almacena el token mediante la abstracción `tokenStore` (`src/lib/token-store.ts`) y lo adjunta automáticamente en cada petición autenticada desde el interceptor de `src/lib/http.ts`.

---

## 2. Regla de negocio de roles y registro

Existen tres roles en el sistema (`user`, `cit`, `admin`):

1. **Registro público (`POST /api/register`)**: crea **siempre** cuentas con rol `user` (usuario normal). La interfaz de registro no ofrece selector de tipo de usuario ni carga de documento.
2. **Personal CIT (`cit`) y Administradores (`admin`)**: son registrados y gestionados por los administradores de la plataforma. En el backend, `requireCIT` permite tanto `cit` como `admin`, en concordancia con `esPersonalCIT()` en el frontend.

---

## 3. Endpoints de autenticación

### 3.1 `POST /api/register`
Registra un nuevo usuario con rol `user`.

- **Autenticación**: No requiere.
- **Content-Type**: `multipart/form-data` o `application/json`.
- **Campos requeridos**:
  - `first_name` (`string`)
  - `last_name` (`string`)
  - `username` (`string`)
  - `email` (`string`)
  - `password` (`string`)
- **Respuesta exitosa (`200 OK`)**:
  ```json
  {
    "msg": "Usuario Registrado",
    "document_url": null
  }
  ```
- **Errores**:
  - `400 Bad Request` (`VALIDATION_ERROR`): campos obligatorios faltantes.

### 3.2 `POST /api/login`
Autentica a un usuario con su nombre de usuario y contraseña.

- **Autenticación**: No requiere.
- **Content-Type**: `application/json`.
- **Body**:
  ```json
  {
    "username": "ana",
    "password": "MiPassword123"
  }
  ```
- **Respuesta exitosa (`200 OK`)**:
  ```json
  {
    "msg": "Usuario Logueado",
    "token": "<jwt>"
  }
  ```
- **Errores**:
  - `400 Bad Request` (`VALIDATION_ERROR`): usuario o contraseña vacíos.
  - `401 Unauthorized` (`UNAUTHORIZED`): credenciales inválidas, cuenta desactivada o pendiente de activación.

### 3.3 `GET /api/profile`
Devuelve el perfil del usuario autenticado junto con los datos de su cuenta anidados bajo `User`.

- **Autenticación**: `Authorization: Bearer <jwt>`.
- **Respuesta exitosa (`200 OK`)**:
  ```json
  {
    "id": 7,
    "user_id": 7,
    "first_name": "Ana",
    "last_name": "Gomez",
    "avatar_url": null,
    "User": {
      "id": 7,
      "username": "ana",
      "email": "ana@cit.com",
      "role": "user"
    }
  }
  ```
- **Mapeo en el frontend**: `src/repositories/auth.repository.ts` es el único módulo que conoce el alias `User` y lo transforma a `UsuarioAutenticado` (`{ id, username, email, rol, nombre, apellido, avatarUrl }`).
- **Errores**:
  - `401 Unauthorized`: token ausente, inválido o expirado.
  - `404 Not Found` (`NOT_FOUND`): perfil no encontrado.

### 3.4 `POST /api/logout`
Finaliza la sesión activa.

- **Autenticación**: `Authorization: Bearer <jwt>`.
- **Respuesta exitosa (`200 OK`)**:
  ```json
  {
    "msg": "Logout exitoso"
  }
  ```
- **Comportamiento en el cliente**: `auth.service.logout()` invoca el endpoint en modalidad *best-effort* y siempre elimina el JWT del `tokenStore` en el bloque `finally`.

---

## 4. Formato de errores y CORS

### 4.1 Estructura de error del backend
```json
{
  "msg": "Credenciales incorrectas o invalidas",
  "code": "UNAUTHORIZED"
}
```
`src/domain/errors.ts` (`traducirError`) utiliza `code` (y el código de estado HTTP como respaldo) para clasificar el error en un `ErrorDominio` (`validacion`, `noAutorizado`, `prohibido`, `noEncontrado`, `conflicto`, `tamanoArchivo`, `red`, `desconocido`) y expone `msg` para mostrar en la interfaz.

### 4.2 CORS y preflight
- El header `Authorization` dispara una petición preflight `OPTIONS` automática que el middleware `cors()` del backend responde sin requerir `credentials: true`.
- Cuando una petición autenticada recibe `401`, el interceptor de respuesta limpia el `tokenStore` y notifica a `AuthContext`, que redirige a `/login` mostrando el aviso de sesión expirada.
