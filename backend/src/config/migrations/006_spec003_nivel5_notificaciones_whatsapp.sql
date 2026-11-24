-- =============================================================================
-- Spec 003 - Nivel 5: Centro de Notificaciones y Canal WhatsApp
-- Migración 100% aditiva e idempotente
-- =============================================================================

ALTER TABLE "PreferenciasNotificaciones"
    ADD COLUMN IF NOT EXISTS "canal_whatsapp" BOOLEAN NOT NULL DEFAULT true;
