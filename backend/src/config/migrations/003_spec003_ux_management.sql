-- =============================================================================
-- MIGRACIÓN: 003_spec003_ux_management.sql
-- ESPECIFICACIÓN: Spec-003 (Experiencia de Usuario, Gestión Personal y Notificaciones)
-- MOTOR OBJETIVO: PostgreSQL / Supabase
-- MODO: 100% Aditivo, Idempotente (IF NOT EXISTS / ON CONFLICT) y No Destructivo
-- =============================================================================
-- NOTAS DE COMPATIBILIDAD Y POLÍTICA DE INTEGRIDAD HISTÓRICA:
-- 1. En el modelo real `Estado` (tabla public."Estados"), las columnas son:
--    ("id", "codigo", "nombre", "activo") y `timestamps: false`.
--    La inserción del estado 'CANCELADA' utiliza `ON CONFLICT ("codigo") DO UPDATE`
--    respaldada por la restricción `UNIQUE ("codigo")`, garantizando idempotencia
--    atómica incluso bajo ejecución concurrente.
-- 2. Política de integridad histórica (Spec-003):
--    - `Notificaciones.user_id` -> `ON DELETE RESTRICT` (impide el borrado físico
--      accidental de un usuario que posea notificaciones históricas; la baja de
--      cuenta en Spec-003 desactiva y anonimiza sin ejecutar DELETE en "Users").
--    - `PreferenciasNotificaciones.user_id` -> `ON DELETE RESTRICT` con restricción
--      única `uq_preferencias_notificaciones_user_id` (sin índice duplicado adicional).
--    - `Solicituds.cancelado_por_id` -> `ON DELETE SET NULL` (preserva la solicitud
--      histórica aunque se desvincule la referencia al operador).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Catálogo de Estados: alta idempotente y atómica del estado 'CANCELADA'
-- -----------------------------------------------------------------------------
INSERT INTO public."Estados" ("codigo", "nombre", "activo")
VALUES ('CANCELADA', 'Cancelada', true)
ON CONFLICT ("codigo") DO UPDATE
SET "nombre" = EXCLUDED."nombre",
    "activo" = true;

-- -----------------------------------------------------------------------------
-- 2. Tabla public."Solicituds": trazabilidad de observaciones y cancelación
-- -----------------------------------------------------------------------------
ALTER TABLE public."Solicituds"
    ADD COLUMN IF NOT EXISTS "observaciones_cit" TEXT DEFAULT NULL;

ALTER TABLE public."Solicituds"
    ADD COLUMN IF NOT EXISTS "observaciones_internas" TEXT DEFAULT NULL;

ALTER TABLE public."Solicituds"
    ADD COLUMN IF NOT EXISTS "fecha_cancelacion" TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE public."Solicituds"
    ADD COLUMN IF NOT EXISTS "cancelado_por_id" INTEGER DEFAULT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_solicituds_cancelado_por_user'
    ) THEN
        ALTER TABLE public."Solicituds"
            ADD CONSTRAINT "fk_solicituds_cancelado_por_user"
            FOREIGN KEY ("cancelado_por_id")
            REFERENCES public."Users" ("id")
            ON DELETE SET NULL
            ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_solicituds_cancelado_por_id"
    ON public."Solicituds" ("cancelado_por_id");

CREATE INDEX IF NOT EXISTS "idx_solicituds_servicio_estado"
    ON public."Solicituds" ("servicio_id", "estado_id");

-- -----------------------------------------------------------------------------
-- 3. Tabla public."Servicios": ciclo de vida del servicio en catálogo
-- -----------------------------------------------------------------------------
ALTER TABLE public."Servicios"
    ADD COLUMN IF NOT EXISTS "estado_servicio" VARCHAR(20) NOT NULL DEFAULT 'ACTIVO';

ALTER TABLE public."Servicios"
    ADD COLUMN IF NOT EXISTS "motivo_cancelacion" TEXT DEFAULT NULL;

ALTER TABLE public."Servicios"
    ADD COLUMN IF NOT EXISTS "fecha_cambio_estado" TIMESTAMP WITH TIME ZONE DEFAULT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_servicios_estado_servicio'
    ) THEN
        ALTER TABLE public."Servicios"
            ADD CONSTRAINT "chk_servicios_estado_servicio"
            CHECK ("estado_servicio" IN ('ACTIVO', 'ARCHIVADO', 'CANCELADO'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_servicios_estado_servicio"
    ON public."Servicios" ("estado_servicio");

-- -----------------------------------------------------------------------------
-- 4. Nueva tabla public."Notificaciones" (Integridad histórica: ON DELETE RESTRICT)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."Notificaciones" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "mensaje" TEXT NOT NULL,
    "enlace" VARCHAR(255) DEFAULT NULL,
    "referencia_tipo" VARCHAR(50) DEFAULT NULL,
    "referencia_id" INTEGER DEFAULT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fecha_lectura" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "fk_notificaciones_user"
        FOREIGN KEY ("user_id")
        REFERENCES public."Users" ("id")
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT "chk_notificaciones_tipo"
        CHECK ("tipo" IN (
            'NUEVA_PUBLICACION',
            'CAMBIO_ESTADO_PROPUESTA',
            'NUEVO_SERVICIO',
            'ACTUALIZACION_PLATAFORMA',
            'ACTIVIDAD_USUARIO'
        ))
);

CREATE INDEX IF NOT EXISTS "idx_notificaciones_user_leida_created"
    ON public."Notificaciones" ("user_id", "leida", "createdAt" DESC);

-- -----------------------------------------------------------------------------
-- 5. Nueva tabla public."PreferenciasNotificaciones" (ON DELETE RESTRICT)
--    La restricción UNIQUE "uq_preferencias_notificaciones_user_id" crea su
--    propio índice B-tree único sobre ("user_id"), evitando índices redundantes.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."PreferenciasNotificaciones" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "noticias_publicaciones" BOOLEAN NOT NULL DEFAULT true,
    "cambios_propuestas" BOOLEAN NOT NULL DEFAULT true,
    "nuevos_servicios" BOOLEAN NOT NULL DEFAULT true,
    "actualizaciones_plataforma" BOOLEAN NOT NULL DEFAULT true,
    "actividad_usuario" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "uq_preferencias_notificaciones_user_id"
        UNIQUE ("user_id"),
    CONSTRAINT "fk_preferencias_notificaciones_user"
        FOREIGN KEY ("user_id")
        REFERENCES public."Users" ("id")
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- -----------------------------------------------------------------------------
-- 6. Inicialización idempotente de preferencias para usuarios existentes
-- -----------------------------------------------------------------------------
INSERT INTO public."PreferenciasNotificaciones" (
    "user_id",
    "noticias_publicaciones",
    "cambios_propuestas",
    "nuevos_servicios",
    "actualizaciones_plataforma",
    "actividad_usuario",
    "createdAt",
    "updatedAt"
)
SELECT
    u."id",
    true,
    true,
    true,
    true,
    true,
    NOW(),
    NOW()
FROM public."Users" u
ON CONFLICT ("user_id") DO NOTHING;

COMMIT;

-- =============================================================================
-- ESTRATEGIA DE REVERSIÓN (DOWN / ROLLBACK MANUAL CONTROLADO)
-- =============================================================================
-- ADVERTENCIA DE PÉRDIDA DE DATOS AL REVERTIR:
-- 1. Ejecutar DROP TABLE sobre "PreferenciasNotificaciones" y "Notificaciones"
--    eliminará todas las preferencias configuradas y el historial de notificaciones.
-- 2. Ejecutar DROP COLUMN sobre "Servicios" ("estado_servicio", "motivo_cancelacion",
--    "fecha_cambio_estado") y sobre "Solicituds" ("observaciones_cit",
--    "observaciones_internas", "fecha_cancelacion", "cancelado_por_id") descartará
--    los valores almacenados en dichas columnas.
-- 3. El estado 'CANCELADA' en "Estados" NO se elimina con DELETE para no violar
--    claves foráneas de solicitudes o propuestas históricas; únicamente se marca
--    con "activo" = false.
-- =============================================================================
/*
BEGIN;

DROP TABLE IF EXISTS public."PreferenciasNotificaciones";

DROP INDEX IF EXISTS public."idx_notificaciones_user_leida_created";
DROP TABLE IF EXISTS public."Notificaciones";

DROP INDEX IF EXISTS public."idx_servicios_estado_servicio";
ALTER TABLE public."Servicios" DROP CONSTRAINT IF EXISTS "chk_servicios_estado_servicio";
ALTER TABLE public."Servicios" DROP COLUMN IF EXISTS "fecha_cambio_estado";
ALTER TABLE public."Servicios" DROP COLUMN IF EXISTS "motivo_cancelacion";
ALTER TABLE public."Servicios" DROP COLUMN IF EXISTS "estado_servicio";

DROP INDEX IF EXISTS public."idx_solicituds_servicio_estado";
DROP INDEX IF EXISTS public."idx_solicituds_cancelado_por_id";
ALTER TABLE public."Solicituds" DROP CONSTRAINT IF EXISTS "fk_solicituds_cancelado_por_user";
ALTER TABLE public."Solicituds" DROP COLUMN IF EXISTS "cancelado_por_id";
ALTER TABLE public."Solicituds" DROP COLUMN IF EXISTS "fecha_cancelacion";
ALTER TABLE public."Solicituds" DROP COLUMN IF EXISTS "observaciones_internas";
ALTER TABLE public."Solicituds" DROP COLUMN IF EXISTS "observaciones_cit";

UPDATE public."Estados"
SET "activo" = false
WHERE "codigo" = 'CANCELADA';

COMMIT;
*/
