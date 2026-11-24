-- =============================================================================
-- Spec 003 - Nivel 2: Entrega Digital de Resultados (Informes PDF en Solicitudes)
-- Migración 100% aditiva e idempotente
-- =============================================================================

ALTER TABLE "Solicituds"
    ADD COLUMN IF NOT EXISTS "resultado_archivo_url" VARCHAR(255) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS "resultado_nombre" VARCHAR(255) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS "resultado_observaciones" TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS "fecha_entrega_resultado" TIMESTAMP WITH TIME ZONE DEFAULT NULL;
