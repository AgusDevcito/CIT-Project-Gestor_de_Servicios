import { sequelize } from "../config/db.js";
import * as catalogRepository from "../repositories/catalog.repository.js";

const SECTORES: ReadonlyArray<readonly [string, string]> = [
    ["AGRICOLA", "Agrícola"],
    ["GANADERO", "Ganadero"],
    ["FRUTIHORTICOLA", "Frutihortícola"],
];

const ESTADOS: ReadonlyArray<readonly [string, string]> = [
    ["PENDIENTE", "Pendiente"],
    ["EN_REVISION", "En revisión"],
    ["APROBADO", "Aprobado"],
    ["RECHAZADO", "Rechazado"],
    ["ACEPTADA", "Aceptada"],
    ["FINALIZADA", "Finalizada"],
];

const ensureSchemaExtensions = async (): Promise<void> => {
    const statements = [
        `ALTER TABLE public."Servicios" ALTER COLUMN servicio_nombre TYPE VARCHAR(120);`,
        `ALTER TABLE public."Servicios" ADD COLUMN IF NOT EXISTS propuesta_id INTEGER DEFAULT NULL;`,
        `ALTER TABLE public."Propuesta" ADD COLUMN IF NOT EXISTS nombre_organismo VARCHAR(150) DEFAULT NULL;`,
        `ALTER TABLE public."Propuesta" ADD COLUMN IF NOT EXISTS email_contacto VARCHAR(150) DEFAULT NULL;`,
        `ALTER TABLE public."Propuesta" ADD COLUMN IF NOT EXISTS telefono_contacto VARCHAR(60) DEFAULT NULL;`,
        `ALTER TABLE public."Propuesta" ADD COLUMN IF NOT EXISTS bienes_recursos TEXT DEFAULT NULL;`,
        `ALTER TABLE public."Propuesta" ADD COLUMN IF NOT EXISTS documento_url TEXT DEFAULT NULL;`,
        `ALTER TABLE public."Propuesta" ADD COLUMN IF NOT EXISTS documento_nombre VARCHAR(255) DEFAULT NULL;`,
        `ALTER TABLE public."Propuesta" ADD COLUMN IF NOT EXISTS servicio_generado_id INTEGER DEFAULT NULL;`,
        `ALTER TABLE public."Publicaciones" ALTER COLUMN titulo TYPE VARCHAR(160);`,
        `ALTER TABLE public."Publicaciones" ADD COLUMN IF NOT EXISTS publicado BOOLEAN NOT NULL DEFAULT true;`,
        `ALTER TYPE public."enum_Publicaciones_tipo_contenido" ADD VALUE IF NOT EXISTS 'noticia';`,
        `ALTER TYPE public."enum_Publicaciones_tipo_contenido" ADD VALUE IF NOT EXISTS 'jornada';`,
        `ALTER TYPE public."enum_Publicaciones_tipo_contenido" ADD VALUE IF NOT EXISTS 'inscripcion';`,
        `ALTER TYPE public."enum_Publicaciones_tipo_contenido" ADD VALUE IF NOT EXISTS 'capacitacion';`,
        `ALTER TABLE public."Profiles" ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT NULL;`,
    ];

    for (const sql of statements) {
        try {
            await sequelize.query(sql);
        } catch {
            // Ignorar si la tabla aún no existe o el motor de test no requiere migración manual
        }
    }
};

export const seedCatalogos = async (): Promise<void> => {
    await ensureSchemaExtensions();

    for (const [codigo, nombre] of SECTORES) {
        await catalogRepository.upsertSector(codigo, nombre);
    }

    for (const [codigo, nombre] of ESTADOS) {
        await catalogRepository.upsertEstado(codigo, nombre);
    }
};
