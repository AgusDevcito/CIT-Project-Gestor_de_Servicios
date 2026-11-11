# TECNOLOGÍAS

A continuación se presenta un catálogo de **todas las tecnologías** que forman parte del proyecto *Gestor de Servicios* (backend, frontend y entorno de despliegue). Cada sección incluye:

* **Nombre de la tecnología**
* **Propósito** en el proyecto
* **Cómo está implementada / usada** (paquetes, archivos clave, configuraciones relevantes)

---

## 1. Backend (Node.js)

| Tecnología | Versión | Propósito | Implementación / Uso |
|------------|---------|------------|----------------------|
| **Node.js** | 20 (LTS) | Entorno de ejecución JavaScript del lado del servidor. | `backend/` contiene el código fuente escrito en **TypeScript** que se transpila a JavaScript y se ejecuta con Node. |
| **TypeScript** | 5.x | Añade tipado estático y mejores herramientas de desarrollo. | `tsconfig.json` en `backend/`; la mayoría de archivos tienen extensión `.ts`. |
| **Express** | 4.x | Framework web minimalista para crear el API REST. | `backend/src/app.ts` crea la app, define middlewares (`cors`, `cookie-parser`, `express.json`) y registra las rutas (`src/routes`). |
| **Cors** | 2.x | Gestiona el intercambio de recursos entre dominios. | Configurado en `app.ts` con opciones basadas en `env.corsOrigins`. |
| **Cookie‑Parser** | 1.x | Parsea cookies HTTP (necesario para el token JWT en cookies). | Registrado como middleware en `app.ts`. |
| **JWT (jsonwebtoken)** | 9.x | Genera y verifica tokens de autenticación. | Helpers en `src/helpers/jwt.ts`; se usa en `auth.middleware.ts` vía `verifyToken`. |
| **Nodemailer** | 6.x | Envío de correos (p. ej., confirmación de registro). | Implementado en `src/utils/mail.ts` y usado por `auth.service.ts`, `user.service.ts`. |
| **bcrypt / password‑helpers** | 5.x | Hash de contraseñas antes de almacenarlas. | `src/helpers/password.ts`. |
| **PostgreSQL** | 15 (imagen Docker) | Base de datos relacional para persistencia. | Conexión en `src/config/db.ts`; repositorios (`src/repositories/*.ts`). |
| **ORM (TypeORM / Prisma)** | — | Mapeo de entidades a tablas. | Definiciones de modelos en `src/models/*.model.ts`; uso en repositorios. |
| **Prom‑client** | 14.x | Exporta métricas de Prometheus desde la aplicación. | Archivo `src/metrics.ts` con `metricsMiddleware` expuesto en `/metrics`. |
| **dotenv** | — | Carga variables de entorno desde `.env`. | `src/config/env.ts` lee `process.env`. |
| **helmet (opcional)** | — | Mejora la seguridad HTTP (cabeceras). | Puede añadirse como middleware adicional. |
| **Jest** | 29.x | Framework de pruebas unitarias. | Configurado en `backend/package.json`; tests en `backend/tests/`. |
| **Cypress** | 13.x | Pruebas end‑to‑end (E2E) de la UI y flujo completo. | Test `frontend/cypress/e2e/profile.cy.js`. |
| **k6** | 0.53+ | Pruebas de carga y rendimiento. | Ejecutado en CI (`ci.yml`) con scripts bajo `load-test-advanced`. |
| **OWASP ZAP** | 2.13+ | Escaneo de vulnerabilidades de seguridad. | Ejecutado en CI (`ci.yml`) como “baseline” y “full” scans. |

---

## 2. Frontend (React)

| Tecnología | Versión | Propósito | Implementación / Uso |
|------------|---------|------------|----------------------|
| **React** | 19.2.8 | Librería UI declarativa para construir la SPA. | Código en `frontend/src/` (páginas, componentes, context). |
| **Vite** | 8.2.2 | Bundler y dev‑server rápido. | Configuración en `frontend/vite.config.js`; scripts en `package.json` (`dev`, `build`). |
| **Tailwind CSS** | 4.3.3 | CSS utility‑first para estilos responsivos y consistentes. | Configurado en `tailwind.config.js` y aplicado mediante clases en los componentes. |
| **Axios** | 1.20.0 | Cliente HTTP para consumir el API. | Servicios en `frontend/src/services/*.js` (p. ej., `authService.js`, `profileService.js`). |
| **React Router DOM** | 7.18.4 | Enrutamiento de la SPA. | Definido en `frontend/src/App.jsx` y `App.css`. |
| **React Context (AuthContext)** | — | Maneja el estado de autenticación y refresco de sesión. | Implementado en `frontend/src/context/AuthContext.jsx`. |
| **Cypress (frontend)** | 13.x | Tests E2E de la UI (registro, login, perfil, etc.). | Archivo `frontend/cypress/e2e/profile.cy.js`. |
| **oxlint** | — | Linter para preservar calidad de código. | Configurado en `frontend/package.json` (`lint` script). |
| **Prettier (opcional)** | — | Formateo automático de código. | Puede añadirse como dev‑dependency. |

---

## 3. Contenedorización y Orquestación

| Tecnología | Versión / Imagen | Propósito | Implementación / Uso |
|------------|------------------|-----------|----------------------|
| **Docker** | — | Empaquetado de la aplicación y sus dependencias. | Dockerfiles: `backend/Dockerfile` (multi‑stage) y `Dockerfile` para producción. |
| **Docker Compose** | 3.9 | Orquesta los contenedores (API, DB, Nginx, Prometheus, Grafana). | Archivo `docker-compose.yml` define servicios `api`, `db`, `nginx`, `prometheus`, `grafana`; redes y volúmenes. |
| **Nginx** | alpine | Reverse‑proxy TLS termination y balanceo. | Configuración en `nginx.conf`; expone puertos 80/443, redirige a `api:3000`. |
| **Prometheus** | latest | Recopila métricas expuestas por `/metrics`. | Configurado en `prometheus.yml` y añadido como servicio en `docker‑compose.yml`. |
| **Grafana** | latest | Visualiza métricas y alertas. | Servicio en `docker‑compose.yml`; dashboards configurables para monitorear el API. |
| **certbot / self‑signed script** | — | Genera certificados TLS para entornos de prueba. | Script `scripts/generate_self_signed_cert.sh`; certificados montados en `./certs`. |

---

## 4. Integración Continua / Entrega Continua (CI/CD)

| Herramienta | Propósito | Implementación |
|-------------|-----------|----------------|
| **GitHub Actions** | Pipelines de lint, tests, build, imagen Docker, despliegue, pruebas de carga y seguridad. | Workflow definido en `.github/workflows/ci.yml`. |
| **Dependabot** | Actualiza automáticamente dependencias de npm y GitHub Actions. | Configuración en `.github/dependabot.yml`. |
| **GitHub Container Registry (GHCR)** | Almacena imágenes Docker construidas. | Publicación en CI (`docker tag`/`docker push`). |
| **SSH deploy via Appleboy actions** | Copia archivos y ejecuta `docker compose up` en el servidor. | Jobs `deploy` y `cleanup` en CI. |
| **npm audit** | Detecta vulnerabilidades en paquetes npm. | Paso `Run npm audit` añadido al workflow. |
| **k6** & **OWASP ZAP** | Pruebas de carga y escaneo de vulnerabilidades. | Ejecutados como jobs `load-test-advanced` y ZAP scans. |

---

## 5. Herramientas de Soporte y Operación

| Herramienta | Propósito | Implementación |
|-------------|-----------|----------------|
| **scripts/backup.sh** | Genera dump de la base de datos PostgreSQL. | Usa `pg_dump`; requiere `DATABASE_URL`. |
| **scripts/restore.sh** | Restaura base de datos desde dump. | Usa `pg_restore`. |
| **scripts/generate_self_signed_cert.sh** | Crea certificado auto‑firmado para desarrollo. | Ejecuta `openssl req -x509 …`. |
| **docs/** | Documentación del proyecto (SLA, arquitectura, rotación de secretos, backup‑restore, etc.). | Archivos Markdown generados: `sla.md`, `architecture.md`, `secret-rotation.md`, `secret-rotation-procedure.md`, `backup-restore.md`. |
| **Prometheus alerts** | Notificaciones de degradación del servicio. | Definidos en `prometheus.yml`; pueden conectarse a Alertmanager → Slack. |
| **Grafana dashboards** | Visualización de métricas (latencia, errores, uso de CPU/memoria). | Configurables vía UI en `http://<host>:3001`. |

---

## 6. Resumen de Arquitectura Tecnológica

```
[Cliente]───HTTPS───► Nginx (termina TLS, redirige a /api) ──► API (Node.js/Express)
                                          │
                                          └───► Prometheus (/metrics) ──► Grafana (visualización)
                                          │
                                          └───► PostgreSQL (datos persistentes)
```

* **Frontend**: React + Vite + Tailwind → consumo de API mediante Axios.  
* **Backend**: Node.js + Express + TypeScript → lógica de negocio, JWT, envío de mails, métricas.  
* **Infra**: Docker + Docker‑Compose, Nginx como reverse‑proxy, Prometheus/Grafana para observabilidad.  
* **CI/CD**: GitHub Actions + Dependabot + GHCR + despliegue SSH automatizado.  
* **Seguridad**: JWT en HttpOnly cookies, OWASP ZAP scans, npm audit, política de rotación de secretos.  

---

*Este archivo debe mantenerse actualizado a medida que el proyecto evolucione o se incorporen nuevas dependencias.*