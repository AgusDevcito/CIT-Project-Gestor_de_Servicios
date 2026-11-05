# Arquitectura del proyecto Gestor de Servicios

## Visión general
- **Frontend**: React + Vite, comunica con la API mediante HTTP(s).
- **Backend**: Node.js + Express, expone endpoints bajo `/api`.
- **Base de datos**: PostgreSQL, gestionada por TypeORM/Prisma (según implementación actual).
- **Proxy inverso**: Nginx, termina TLS y distribuye tráfico a la API.
- **Observabilidad**: Prometheus scrapea `/metrics` del backend; Grafana visualiza métricas y alertas.
- **CI/CD**: GitHub Actions compila, testea, publica imagen Docker y despliega vía SSH.

## Diagrama de componentes
```
[Cliente] --> https://<dominio> (NGINX) --> [API] --> PostgreSQL
                ^                                 |
                |                                 v
            Grafana <-- Prometheus <-- /metrics
```

## Puntos críticos
- **TLS**: gestionado por Nginx, certificados en `./certs`.
- **Secretos**: gestionados por variables de entorno y política de rotación (`docs/secret-rotation.md`).
- **Backup**: scripts `backup.sh`/`restore.sh` con dumps periódicos.
- **Escalado**: se podrán añadir réplicas del contenedor `api` y balanceo en Nginx.

## Futuras mejoras
- Implementar OpenTelemetry para trazas distribuidas.
- Añadir soporte de réplicas de PostgreSQL (Patrón de alta disponibilidad).
- Externalizar configuración TLS a Let's Encrypt con Certbot o Caddy.
