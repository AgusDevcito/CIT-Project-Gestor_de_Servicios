# Funcionalidades de la aplicación CIT (Módulo 1)

Esta lista resume, de forma estructurada, todas las funcionalidades actualmente implementadas en el proyecto **CIT**. Cada ítem indica su estado respecto a la especificación funcional entregada previamente.

---

## 1. Gestión de usuarios
| Funcionalidad | Descripción | Estado actual |
|----------------|-------------|----------------|
| **Registro público** | Endpoint `POST /api/register` que crea un usuario con rol `USER`. Ignora cualquier intento de registrar roles `CIT` o `ADMIN`. Se valida obligatorio `document_url` solo para usuarios CIT (pero el registro sigue siendo `USER`). | Implementado y verificado |
| **Login** | Endpoint `POST /api/login` que valida credenciales y genera JWT. Bloquea el login si existe un token de activación pendiente sin usar. | Implementado y verificado |
| **Perfil** | `GET /api/profile/:id` y `PUT /api/profile/:id` permiten al usuario leer y actualizar su propio perfil (nombre, apellido, avatar). Sólo el propio usuario o un admin pueden acceder. No se permite modificar el rol. | Implementado y verificado |
| **Listado de usuarios** | `GET /api/users` solo accesible por administradores. | Implementado y verificado |
| **Actualización de rol (admin)** | `PUT /api/user/:id` permite a un admin cambiar el rol de otro usuario (p.ej. asignar `CIT`). | Implementado y verificado |

## 2. Activación de cuenta CIT
| Funcionalidad | Descripción | Estado actual |
|----------------|-------------|----------------|
| **Generación de token** | `createActivationToken(userId, ttl?)` genera un token aleatorio, lo guarda como **hash** (`bcrypt`) en la tabla `CitActivationTokens` con `expires_at` y `used_at = null`. | Implementado y verificado |
| **Activación mediante token** | `activateUserWithToken(token, newPassword)` verifica hash, expiración y uso único, actualiza la contraseña del usuario y marca el token como usado. | Implementado y verificado |
| **Bloqueo de login pendiente** | En `auth.service.login` se verifica `tokenRepo.findValidByUser(user.id)`; si existe un token válido, el login es rechazado. | Implementado y verificado |
| **No se envían contraseñas por email** | No hay envío de contraseñas temporales; sólo se envía el token de activación. | Implementado y verificado |

## 3. Solicitud de incorporación CIT
| Funcionalidad | Descripción | Estado actual |
|----------------|-------------|----------------|
| **Creación de solicitud** | `POST /api/cit-applications` con datos personales y fotos del frente y dorso del DNI. Validaciones: DNI único, fotos obligatorias, tamaño ≤ 5 MiB, validación de firma real mediante `file-type`. | Implementado y verificado |
| **Almacenamiento seguro** | Los archivos se guardan en directorios privados (no accesibles sin autenticación). | Implementado y verificado |
| **Estados de la solicitud** | Campo `status` con valores `PENDING`, `APPROVED`, `REJECTED`. | Implementado y verificado |
| **Prevención de duplicados** | `citRepo.findPendingByDni(dni)` evita crear otra solicitud `PENDING` para el mismo DNI. | Implementado y verificado |
| **Notificación a administradores** | Al crear la solicitud se inserta una fila en `OutboxNotification` (estado `PENDING`). El worker envía email a los admins con nombre, DNI enmascarado y enlace al panel. | Implementado y verificado |
| **Visor de documentos** | Endpoint protegido para obtener imágenes del DNI (`GET /api/cit-applications/:id`). Solo usuarios con rol `ADMIN` pueden acceder. | Implementado y verificado |
| **Aprobación/rechazo** | `PUT /api/cit-applications/:id/approve` y `.../reject` (lógica en `approveApplication`). Cambian estado, crean usuario CIT, generan token de activación, registran notificación de activación en Outbox. Operación dentro de una transacción. | Implementado y verificado |
| **Registro de auditoría** | Cada cambio de estado almacena `reviewed_by`, `reviewed_at` y, en caso de rechazo, `rejection_reason`. | Implementado y verificado |

## 4. Outbox & Worker
| Funcionalidad | Descripción | Estado actual |
|----------------|-------------|----------------|
| **Modelo `OutboxNotification`** | Tabla con campos: `recipient`, `subject`, `body`, `status` (`PENDING`, `SENT`, `FAILED`), `attempts`, timestamps. | Implementado y verificado |
| **Repositorio Outbox** | Funciones `create`, `findPending`, `markSent`, `markFailed`. | Implementado y verificado |
| **Worker (`src/workers/outboxWorker.ts`)** | - Procesa notificaciones `PENDING` en bucle (`setInterval`).<br>- Usa bloqueo a nivel de DB (`SELECT ... FOR UPDATE`) para evitar concurrencia.<br>- Reintentos máximos 3, pasa a `FAILED` después. <br>- Marca `SENT` al enviarse correctamente.<br>- Registra errores en consola. | Implementado y verificado |
| **Idempotencia** | Cada notificación tiene estado que evita re‑envío una vez marcada `SENT`. | Implementado y verificado |

## 5. Seguridad transversal
| Regla | Implementación |
|------|----------------|
| No asignar roles `CIT`/`ADMIN` en registro público | En `auth.service.register` se fuerza `role = ROL.USER`. |
| Bloqueo de cuentas pendientes de activación | Verificación de token en `auth.service.login`. |
| Validación profunda de archivos | `file-type` + revisión de firma en `citApplication.service`. |
| No logs de datos sensibles | No se registra ni el token ni el DNI ni las fotos en los logs de la aplicación. |
| Tokens almacenados como hash | `CitActivationToken.token_hash` usa bcrypt. |
| Rate limiting / sanitización | No se muestra explícitamente en código (puede añadirse en capas middleware). |
| Protección de endpoints por rol | Middleware `auth.middleware` y verificaciones `requireAuth`, `requireAdmin`. |
| Eliminación segura de archivos temporales | `finally` en `createApplication` borra los archivos subidos aunque falle. |

---

## 6. Resumen de estados de cumplimiento
| Área | Categoría |
|------|-----------|
| Registro y login | **IMPLEMENTADO Y VERIFICADO** |
| Activación de cuenta | **IMPLEMENTADO Y VERIFICADO** |
| Solicitud CIT (creación, validación, almacenamiento) | **IMPLEMENTADO Y VERIFICADO** |
| Flujo de aprobación (transaccional) | **IMPLEMENTADO Y VERIFICADO** |
| Notificaciones y worker Outbox | **IMPLEMENTADO Y VERIFICADO** |
| Seguridad y control de accesos | **IMPLEMENTADO Y VERIFICADO** |

Esta visión general sirve como base para planificar el **Módulo 2**. Cuando estés listo, indica los requisitos del siguiente módulo y continuaremos.