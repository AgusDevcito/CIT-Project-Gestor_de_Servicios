# CIT-Project-Gestor_de_Servicios
Plataforma enfocada a la realización, publicación y gestión de propuestas de proyectos y contratación de servicios y cursos de CIT Formosa. 


# ¿De que se trata?

El proyecto de Gestor de Servicios tiene como objetivo principal crear un puente entre las entidades del sector agropecuario y el Centro de Investigacion y Transacciones de Formosa (CIT) para que estas mismas puedan proponerles problematicas a resolver al CIT, pedir algun servicio que el CIT ofrezca ya sea para el ganado o los cultivos,tambien poder ver en un apartado que cursos de capacitacion posee el CIT y tambien poder proponer algunos y por ultimo acceder a informacion de parasitos u otro tipo de enfermedades que puedan poseer el ganado y los cultivos respectivamente 

# Que tenemos pensado hasta ahora:
Lo primero seria que el usuario pueda loguearse como un trabajador o como un usuario normal.


Usuario:El usuario normal posee un login comun con un Nombre,Apellido,DNI,email,etc  una vez registrado el usuario podra acceder a las funcionalidades de solicitar servicio,proponer una problematica,proponer un curso de capacitacion, acceder a un curso de capacitacion y podra ver las patologias,enfermedades y mas apartados de parte de los ganados y cultivos.




CIT:El usuario CIT tendra que loguearse adjuntando un documento que abale el ser un trabajador del CIT,luego de la revision si todo es correcto el trabajador podra acceder a distintas funcionalidades como poder agregar videos,imagenes y explicaciones de como funciona y se ve la patologia o la enfermedad del ganado o del cultivo,tambien podra acceder a la opcion de recomendar alguna problematica propuesta(debido a que es mejor que sea la DRA o un alto mando quien las acepte o rechace),podra modificar los servicios ya sea agregando imagenes o videos, etc.

## Ejecutar backend y PostgreSQL con Docker

Requisitos: Docker Desktop con Docker Compose habilitado.

1. Ya que el archivo de entorno está en `backend\.env`, desde la carpeta raíz inicia los servicios indicándole esa ruta:

   ```powershell
   docker compose --env-file backend/.env up --build
   ```

2. Comprueba el backend en <http://localhost:3000/>. La respuesta esperada es `{"ok":true}`.

Los datos de PostgreSQL y los documentos subidos se conservan en volúmenes de Docker. Para detener los servicios usa `docker compose --env-file backend/.env down`; `docker compose --env-file backend/.env down -v` también elimina esos datos. Este Compose está pensado para desarrollo local, no como configuración de producción.

## Despliegue en Producción

Para entornos productivos se recomienda usar la configuración de Docker‑Compose incluida en la raíz del proyecto (`docker‑compose.yml`).

1. **Configura variables de entorno seguras**
   - Crea un archivo `.env.prod` (no versionado) con los mismos nombres que `backend/.env` pero con valores seguros y secretos.
   - Ejemplo:
     ```
     POSTGRES_USER=prod_user
     POSTGRES_PASSWORD=prod_strong_password
     POSTGRES_DB=prod_db
     JWT_SECRET=very_secret_key
     ```
2. **Genera o copia certificados TLS**
   - Coloca `fullchain.pem` y `privkey.pem` dentro del directorio `certs/` en la raíz del proyecto (este directorio está montado en el contenedor `nginx`).
   - Puedes obtener certificados con **Let’s Encrypt** usando *certbot* o con **Caddy** (manejo automático).
3. **Levanta los contenedores**
   ```bash
   docker compose --env-file .env.prod up -d --build
   ```
   - La API quedará disponible en `https://<tu-dominio>` (puerto 443) y la base de datos en el 5432.
4. **HTTPS y dominio**
   - El contenedor `nginx` está configurado para escuchar en los puertos 80 y 443 y usar los certificados montados en `./certs`.
   - Si deseas redirigir todo el tráfico HTTP a HTTPS, añade la siguiente regla dentro del bloque `server` de `nginx.conf`:
     ```nginx
     if ($scheme = http) { return 301 https://$host$request_uri; }
     ```
5. **CI/CD**
   - El flujo de GitHub Actions (`.github/workflows/ci.yml`) ya ejecuta lint, pruebas, typecheck y construye la imagen Docker en cada push a `main`. Además publica la imagen en GitHub Container Registry y despliega automáticamente al servidor configurado mediante SSH (variables `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`).
6. **Monitorización**
   - Añade Prometheus/Grafana o cualquier solución de observabilidad a tu stack para vigilar salud y métricas.
7. **Procedimiento de rollback y backup**
   - Utiliza `scripts/backup.sh` para crear dumps de la base de datos y `scripts/restore.sh` para restaurar desde un backup.
   - En caso de rollback, detén los contenedores, restaura el backup y vuelve a iniciar con la versión anterior de la imagen.

Mantén la documentación de despliegue actualizada y revisa regularmente la seguridad de los secretos y la configuración del contenedor.
