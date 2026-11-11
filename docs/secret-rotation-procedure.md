# Política de rotación de secretos

Esta política complementa la documentación en `docs/secret-rotation.md` y define el proceso práctico para rotar secretos en el proyecto.

## 1. Identificación de secretos
- Variables de entorno definidas en `.env.prod` (DB credentials, JWT secret, etc.).
- Secretos almacenados en GitHub Secrets para CI/CD.

## 2. Herramientas de rotación automática
- **GitHub Actions**: se añadirá un workflow `rotate-secrets.yml` que genere nuevos valores, los actualice en los repositorios y despliegue.
- **AWS Secrets Manager / HashiCorp Vault** (para entornos futuros) pueden integrarse.

## 3. Proceso manual (fallback)
1. Generar nuevo valor (p. ej., `openssl rand -hex 32`).
2. Actualizar el secreto en GitHub Secrets y en el archivo `.env.prod` (no versionado). 
3. Ejecutar el pipeline CI para desplegar la nueva configuración.
4. Verificar que la aplicación inicie correctamente.
5. Documentar la rotación en `docs/secret-rotation.md`.

## 4. Cronograma de rotación
- **Crítico** (DB password, JWT secret): cada 90 días.
- **No crítico** (API keys de terceros): cada 180 días.

## 5. Auditoría
- Cada rotación se registra en `docs/secret-rotation.md` bajo el encabezado **Historial de rotaciones**.
- Los logs de GitHub Actions (`rotate-secrets.yml`) quedan archivados en el repositorio.
