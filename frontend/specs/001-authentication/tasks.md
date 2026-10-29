# Tareas de implementación de autenticación (frontend)

| # | Tarea | Archivos afectados | Objetivo | Criterio de validación |
|---|-------|--------------------|----------|------------------------|
| 1 | **Añadir `cookieParser` al app** | `backend/app.js` | Habilitar lectura de cookies. | `app.use(cookieParser())` presente y `npm start` sin errores. |
| 2 | **Set‑cookie en login** | `backend/controllers/auth.controllers.js` | Enviar JWT como cookie HttpOnly. | Respuesta `Set-Cookie: token=…; HttpOnly; SameSite=Strict`. |
| 3 | **Actualizar `requireAuth`** | `backend/middlewares/auth.middleware.js` | Leer token de cookie (fallback a header). | `req.user` poblado tanto si token viene en cookie como en header. |
| 4 | **Crear `apiClient.js`** | `frontend/src/services/apiClient.js` (nuevo) | Centralizar llamadas, habilitar `withCredentials`. | Instancia `axios` exportada; `axios.defaults.withCredentials === true`. |
| 5 | **Refactorizar `authService.js`** | `frontend/src/services/authService.js` | Usar `apiClient`, remover manejo manual de token. | Todas las funciones (`register`, `login`, `logout`, `getProfile`) llaman a `apiClient`. |
| 6 | **Implementar `AuthContext`** | `frontend/src/context/AuthContext.jsx` (nuevo) | Gestionar estado de autenticación global. | Contexto provee `user`, `login`, `logout`, `checkSession`. |
| 7 | **Integrar `AuthProvider` en la aplicación** | `frontend/src/main.jsx` | Envolver la app con el Provider. | App se renderiza sin error y `useContext(AuthContext)` funciona. |
| 8 | **Crear `ProtectedRoute`** | `frontend/src/components/ProtectedRoute.jsx` (nuevo) | Bloquear rutas sin sesión o sin rol. | Redirige a `/login` o muestra “No tienes permisos”. |
| 9 | **Actualizar routers de React** | `frontend/src/App.jsx` (o donde se definan rutas) | Reemplazar `<Route>` por `<ProtectedRoute>` donde corresponda. | Acceso a rutas protegidas requiere login. |
| 10 | **Agregar manejo global de 401** | `frontend/src/services/apiClient.js` (interceptor) | Logout automático y redirección. | Simular 401 → se llama `logout()` y se navega a `/login`. |
| 11 | **Actualizar UI de Login/Registro** | `frontend/src/pages/auth/Login.jsx`, `Register.jsx` | Mostrar mensajes de error precisos, redirigir tras éxito. | Tests UI verifican mensaje y redirección. |
| 12 | **Documentar cambios en `docs/api-contract.md`** | `docs/api-contract.md` | Anotar que `login` ahora envía cookie y que `logout` la borra. | Archivo actualizado y commit con mensaje descriptivo. |
| 13 | **Agregar pruebas unitarias backend** | `backend/tests/auth.test.js` | Verificar que login setea cookie y logout la borra. | `supertest` con `agent` mantiene cookies y los asserts pasan. |
| 14 | **Agregar pruebas unitarias frontend** | `frontend/src/__tests__/AuthProvider.test.jsx`, `ProtectedRoute.test.jsx` | Validar flujo de checkSession, protección de rutas. | Tests pasan con coverage >80 %. |
| 15 | **Ejecutar suite completa** | N/A | Garantizar que nada se rompe. | `npm test` (backend + frontend) exit code 0 y todos los tests pasan. |
| 16 | **Revisión de CORS** | `backend/app.js` y `.env` | Confirmar que `CORS_ORIGINS` contiene dominio de la UI en producción. | `curl` con origen distinto devuelve 200/allowed según configurado. |

> **Orden recomendado:** completar tareas **1‑4** antes de pasar a UI, luego **5‑10**, y finalmente **11‑16** (test y documentación).
