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
