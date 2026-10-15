# Documentación del registro de usuarios con validación CIT

## Objetivo

Este backend permite registrar usuarios con un rol específico. Cuando el usuario es del tipo `cit`, el sistema exige que adjunte un documento de respaldo para poder completar el registro. Si no presenta ese documento, la inscripción queda rechazada.

## ¿Qué se implementó?

Se agregó la posibilidad de recibir un archivo en el endpoint de registro y se validó la regla de negocio:

- `role = "cit"` → requiere documento
- `role = "user"` o `role = "admin"` → no requiere documento

La validación está hecha en el backend para evitar que un usuario se registre como trabajador CIT sin la documentación necesaria.

## ¿Por qué fue necesario?

El problema original era que el registro solo aceptaba JSON y no revisaba si el usuario formaba parte del CIT. Eso dejaba abierta la posibilidad de crear cuentas sin verificar la condición laboral.

Con esta implementación se cumple una regla de negocio importante:

> Solo los trabajadores del CIT Formosa pueden registrarse con el rol `cit` si adjuntan un documento válido.

## Cómo funciona

### 1) Ruta de registro

La ruta quedó configurada en:

- `POST /api/register`

Esta ruta usa `multer` para aceptar archivos y los guarda en la carpeta `uploads`.

### 2) Subida de archivo

El archivo se recibe con el nombre `document` y se guarda como un archivo físico en la carpeta del proyecto:

- `backend/uploads/`

Además, se genera una URL pública para acceder al archivo:

- `/uploads/<nombre-del-archivo>`

Esto permite luego reutilizar esa referencia en la base de datos o en la interfaz.

### 3) Validación del rol

La lógica de validación se encuentra en:

- `backend/helper/citRegistration.js`

La función principal se llama `validateCITRegistration` y comprueba lo siguiente:

- Si `role` es `cit`
- Y no existe `document_url` ni un archivo `file`
- Entonces lanza un error

Ese error devuelve una respuesta HTTP `400` con el mensaje:

`Los trabajadores de CIT Formosa deben adjuntar un documento para registrarse.`

### 4) Registro del usuario

Cuando la validación pasa, el controlador crea el usuario y guarda la referencia del documento en la base de datos:

- `document_url`
- `document_name`

Esto queda en el modelo `User`:

- `backend/models/user.models.js`

### 5) Requiere documento solo para CIT

Los otros roles no requieren archivo. Por ejemplo:

- `user` → permitido sin documento
- `admin` → permitido sin documento
- `cit` → exige documento

## Estructura relevante

### Backend

- `backend/controllers/auth.controllers.js` → lógica del registro y respuesta HTTP
- `backend/router/auth.route.js` → define la ruta de registro con carga de archivo
- `backend/helper/upload.js` → configuración de `multer`
- `backend/helper/citRegistration.js` → validación de CIT
- `backend/models/user.models.js` → modelo del usuario con campos de documento
- `backend/app.js` → habilita archivos estáticos en `/uploads`

## Ejemplo de uso

Se debe enviar una petición `multipart/form-data` con los siguientes campos:

- `first_name`
- `last_name`
- `avatar_url`
- `username`
- `email`
- `password`
- `role`
- `document` (solo si es CIT)

### Ejemplo de rol CIT

```http
POST /api/register
Content-Type: multipart/form-data
```

Campos:

- `role: cit`
- `username: usuario123`
- `email: usuario@cit.com`
- `password: 123456`
- `document: archivo.pdf`

Si no se adjunta el documento, el backend rechaza la operación.

## Pruebas realizadas

Se creó una prueba automatizada para validar el comportamiento:

- `backend/tests/cit-registration.test.js`

Verifica que:

- un usuario CIT sin documento falla
- un usuario CIT con documento pasa
- un usuario normal sin documento pasa

## Resultado verificado

La prueba se ejecutó correctamente con resultado:

- 3 pruebas aprobadas
- 0 fallidas

## Conclusión

Este cambio deja el backend listo para controlar el registro de personal del CIT de forma segura, validando la documentación antes de permitir la creación de la cuenta.

# Relaciones entre las tablas

Esta sección explica cómo se conectan las tablas de la base de datos. En Sequelize, cada modelo representa una tabla y cada asociación representa una relación entre dos tablas.

## ¿Qué es una relación?

Una relación indica qué registro de una tabla pertenece a qué registro de otra tabla. Por ejemplo, un usuario puede tener un perfil. Para conectar ambos registros usamos una clave foránea (`foreignKey`).

La clave foránea es una columna que guarda el `id` de otro registro:

- `Profile.user_id` guarda el `id` de `User`.
- `Propuesta.solicitante` guarda el `id` del usuario que creó la propuesta.
- `Propuesta.cirRevisorId` guarda el `id` del usuario CIT que revisó la propuesta.
- `Publicaciones.author_id` guarda el `id` del usuario que creó la publicación.
- `Archivos.publicacion_id` guarda el `id` de la publicación a la que pertenece el archivo.

## Mapa de relaciones

### User y Profile

La relación es uno a uno:

- Un `User` tiene un `Profile`.
- Un `Profile` pertenece a un `User`.
- Un usuario no puede tener dos perfiles porque `Profile.user_id` es único.

En el código se consulta usando los alias `Profile` y `User`:

```js
User.hasOne(Profile, { foreignKey: "user_id", as: "Profile" });
Profile.belongsTo(User, { foreignKey: "user_id", as: "User" });
```

### User y Propuesta como solicitante

La relación es uno a muchos:

- Un usuario puede crear muchas propuestas.
- Cada propuesta tiene un solo solicitante.

El alias para consultar esta relación es `Solicitante` en una propuesta y `PropuestasSolicitadas` en un usuario.

### User y Propuesta como revisor

La relación también es uno a muchos, pero cumple otro propósito:

- Un usuario CIT puede revisar muchas propuestas.
- Una propuesta puede tener un revisor CIT.
- Mientras la propuesta está pendiente, `cirRevisorId` puede estar vacío.

El alias para consultar esta relación es `Revisor` en una propuesta y `PropuestasRevisadas` en un usuario.

Es importante que solicitante y revisor tengan alias distintos porque ambos apuntan a la tabla `User`.

### User y Publicaciones

La relación es uno a muchos:

- Un usuario CIT puede crear muchas publicaciones.
- Cada publicación tiene un autor.

El alias de la relación es `Autor` cuando se consulta una publicación y `Publicaciones` cuando se consulta un usuario.

### Publicaciones y Archivos

La relación es uno a muchos:

- Una publicación puede tener muchos archivos.
- Cada archivo pertenece a una publicación.

El alias de la relación es `Archivo` en una publicación y `Publicacion` en un archivo. Un archivo puede ser una imagen o un video.

## ¿Qué significa `include`?

`include` le dice a Sequelize que también debe traer los registros relacionados. Por ejemplo:

```js
const publicacion = await Publicaciones.findByPk(id, {
	include: [
		{ model: User, as: "Autor" },
		{ model: ArchivoPublicacion, as: "Archivo" },
	],
});
```

El resultado contiene la publicación, los datos del autor y sus archivos. Sin `include`, Sequelize devolvería solamente las columnas de la tabla `Publicaciones`.

# Controladores y rutas

Todas las rutas del backend comienzan con `/api`, porque `app.js` monta el router principal usando `app.use('/api', routes)`.

## Usuarios

Estas rutas se encuentran en `backend/router/user.routes.js` y usan los controladores de `backend/controllers/user.controllers.js`:

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/api/users` | Lista usuarios, perfiles y no muestra contraseñas. |
| `GET` | `/api/user/:id` | Busca un usuario y su perfil. |
| `POST` | `/api/user/create` | Crea un usuario y guarda su contraseña cifrada. |
| `PUT` | `/api/user/:id` | Actualiza los datos del usuario. |
| `DELETE` | `/api/user/:id` | Elimina un usuario. |

## Perfiles

Estas rutas se encuentran en `backend/router/profile.routes.js` y necesitan el token `Bearer` en la cabecera `Authorization`:

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/api/profiles` | Lista perfiles junto con su usuario. |
| `GET` | `/api/profile/:userId` | Busca el perfil de un usuario. |
| `PUT` | `/api/profile/:userId` | Actualiza nombre, apellido o avatar. |

Ejemplo de actualización:

```json
{
	"first_name": "Ana",
	"last_name": "Gomez",
	"avatar_url": "/uploads/ana.jpg"
}
```

## Propuestas

Estas rutas se encuentran en `backend/router/propuestas.routes.js`:

| Método | Ruta | Permiso | Qué hace |
|---|---|---|---|
| `POST` | `/api/propuesta/crear` | Usuario autenticado | Crea una propuesta pendiente. |
| `GET` | `/api/propuestas` | Usuario CIT | Lista propuestas pendientes con solicitante y revisor. |
| `POST` | `/api/propuestas/dictaminar/:id` | Usuario CIT | Aprueba o rechaza una propuesta. |

Ejemplo para crear una propuesta:

```json
{
	"titulo": "Control de plaga en cultivo",
	"sector": "Agricola",
	"problematica": "Se detecto una plaga que esta afectando el rendimiento del cultivo."
}
```

Ejemplo para dictaminarla:

```json
{
	"decision": "APROBADO",
	"justificacion": "La propuesta cumple los requisitos tecnicos y puede ser atendida."
}
```

## Publicaciones

Estas rutas se encuentran en `backend/router/publicaciones.routes.js`:

| Método | Ruta | Permiso | Qué hace |
|---|---|---|---|
| `GET` | `/api/publicaciones` | Usuario autenticado | Lista publicaciones con autor y archivos. |
| `GET` | `/api/publicacion/:id` | Usuario autenticado | Obtiene una publicación completa. |
| `POST` | `/api/publicacion/crear` | Usuario CIT | Crea una publicación técnica. |
| `PUT` | `/api/publicacion/:id` | Usuario CIT | Modifica una publicación. |
| `DELETE` | `/api/publicacion/:id` | Usuario CIT | Elimina una publicación y sus archivos. |

Ejemplo para crear una publicación:

```json
{
	"titulo": "Identificación de una enfermedad",
	"contenido": "Descripción y recomendaciones para reconocer la enfermedad.",
	"tipo_contenido": "enfermedad",
	"sector": "Ganadero"
}
```

## Archivos de publicaciones

Los archivos se administran en la misma ruta de publicaciones:

| Método | Ruta | Permiso | Qué hace |
|---|---|---|---|
| `GET` | `/api/publicacion/:publicacionId/archivos` | Usuario autenticado | Lista los archivos de una publicación. |
| `POST` | `/api/publicacion/:publicacionId/archivos` | Usuario CIT | Guarda la URL y los datos de un archivo. |
| `DELETE` | `/api/archivo/:id` | Usuario CIT | Elimina un archivo. |

Ejemplo para asociar un archivo:

```json
{
	"tipo": "imagen",
	"archivo_url": "/uploads/plaga.jpg",
	"archivo_nombre": "plaga.jpg",
	"orden": 1
}
```

## Orden recomendado para probar la aplicación

1. Registrar un usuario con `POST /api/register`.
2. Iniciar sesión con `POST /api/login` y guardar el token recibido.
3. Enviar el token como `Authorization: Bearer TOKEN` en las rutas protegidas.
4. Crear una propuesta o consultar publicaciones según el rol del usuario.
5. Si el usuario es CIT, crear publicaciones y asociarles archivos.

El token identifica al usuario mediante `req.user.id` y su rol mediante `req.user.role`. Los middlewares `requireAuth`, `requireCIT` y `requireUser` revisan esos datos antes de ejecutar el controlador.
