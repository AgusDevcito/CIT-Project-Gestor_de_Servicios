-- =============================================================================
-- Spec 003 - Nivel 4: Perfil de Entidad / Cooperativa, Intermediación y Mi Cuenta
-- Migración 100% aditiva e idempotente
-- =============================================================================

ALTER TABLE "Profiles"
    ADD COLUMN IF NOT EXISTS "tipo_perfil" VARCHAR(40) NOT NULL DEFAULT 'PRODUCTOR',
    ADD COLUMN IF NOT EXISTS "razon_social" VARCHAR(150) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS "cuit" VARCHAR(30) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS "localidad" VARCHAR(120) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS "telefono_whatsapp" VARCHAR(40) DEFAULT NULL;

ALTER TABLE "Solicituds"
    ADD COLUMN IF NOT EXISTS "beneficiario_nombre" VARCHAR(150) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS "beneficiario_dni_cuit" VARCHAR(40) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS "beneficiario_localidad" VARCHAR(120) DEFAULT NULL;

ALTER TABLE "Propuesta"
    ADD COLUMN IF NOT EXISTS "beneficiario_nombre" VARCHAR(150) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS "beneficiario_dni_cuit" VARCHAR(40) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS "beneficiario_localidad" VARCHAR(120) DEFAULT NULL;
