# Backup & Restore Guide

Este documento explica cómo usar los scripts de respaldo y restauración incluidos en el proyecto.

## 1. Crear un backup
```bash
chmod +x scripts/backup.sh
./scripts/backup.sh
```
- El script leerá la variable de entorno `DATABASE_URL` (debe estar configurada, por ejemplo en `.env.prod`).
- Generará un archivo `backup/<db>_YYYYMMDD_HHMMSS.sql` en el directorio `backup/`.

## 2. Restaurar a partir de un backup
```bash
chmod +x scripts/restore.sh
./scripts/restore.sh backup/<db>_YYYYMMDD_HHMMSS.sql
```
- El script verifica que el archivo exista y usa la misma `DATABASE_URL` para conectarse.
- Realiza una restauración completa (`pg_restore -c`).

## 3. Integración en CI/CD
- En pipelines de producción, puedes ejecutar `backup.sh` antes de desplegar una nueva versión y `restore.sh` en caso de fallo.
- Asegúrate de que los secretos (`DATABASE_URL`) estén disponibles como **GitHub Secrets** o variables de entorno del runner.

## 4. Buenas prácticas
- **Retención:** conserva backups al menos 7 días o según los requisitos de tu empresa.
- **Almacenamiento seguro:** sube los archivos a un bucket cifrado o a un almacenamiento de backup externo.
- **Pruebas de restauración:** programa pruebas mensuales para garantizar que los backups funcionen.

---
*Mantén este documento actualizado con cualquier cambio en la estructura de la base de datos o en los scripts.*
