# Service Level Agreement (SLA) for Gestor de Servicios

## Disponibilidad
- **Objetivo:** 99.5 % de disponibilidad mensual del API.
- **Métrica:** Tiempo de actividad medido por Prometheus (up = 1, down = 0).

## Tiempo de respuesta
- **Objetivo:** 95 % de las respuestas < 200 ms (excluyendo llamadas a la base de datos).
- **Métrica:** Histogramas `http_request_duration_seconds` expuestos por el endpoint `/metrics`.

## Recuperación ante fallos
- **Objetivo:** Restaurar la API en menos de 5 min tras una caída confirmada.
- **Procedimiento:**
  1. Ejecutar `scripts/backup.sh` para asegurar el último dump.
  2. En caso de fallo del contenedor, usar `docker compose up -d --force-recreate`.
  3. Si la base de datos está corrupta, restaurar con `scripts/restore.sh <backup_file>`.

## Notificaciones y alertas
- Alertas configuradas en Prometheus → Alertmanager (ejemplo en `docker-compose.yml`).
- Notificaciones enviadas a Slack (canal `#gestor-alerts`).

## Revisión del SLA
- Revisar mensualmente los dashboards de Grafana y el historial de alertas.
- Ajustar objetivos según métricas reales y capacidad de infraestructura.
