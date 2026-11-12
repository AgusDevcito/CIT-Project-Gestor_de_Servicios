import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { QueryInterface } from "sequelize";

/**
 * Resuelve la ruta canónica al archivo SQL tanto en desarrollo (TypeScript en /src)
 * como en producción compilada (JavaScript en /dist) o según process.cwd().
 */
export const resolveSqlMigrationPath = (): string => {
    // 1. Intentar relativo a la ubicación del archivo actual
    try {
        const currentDir = typeof __dirname !== "undefined"
            ? __dirname
            : path.dirname(fileURLToPath(import.meta.url));

        const relativeCandidates = [
            path.resolve(currentDir, "../config/migrations/003_spec003_ux_management.sql"),
            path.resolve(currentDir, "../../src/config/migrations/003_spec003_ux_management.sql"),
        ];

        for (const candidate of relativeCandidates) {
            if (fs.existsSync(candidate)) {
                return candidate;
            }
        }
    } catch {
        // Fallback a cwd
    }

    // 2. Intentar relativo a process.cwd()
    const cwdCandidates = [
        path.resolve(process.cwd(), "src/config/migrations/003_spec003_ux_management.sql"),
        path.resolve(process.cwd(), "backend/src/config/migrations/003_spec003_ux_management.sql"),
        path.resolve(process.cwd(), "dist/config/migrations/003_spec003_ux_management.sql"),
    ];

    for (const candidate of cwdCandidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    // Retornar la ruta por defecto esperada
    return path.resolve(process.cwd(), "src/config/migrations/003_spec003_ux_management.sql");
};

/**
 * Extrae el bloque UP ejecutable de `003_spec003_ux_management.sql`
 * (excluyendo el comentario multilínea de reversión final).
 */
export const getUpSqlStatements = (): string => {
    const sqlPath = resolveSqlMigrationPath();
    const raw = fs.readFileSync(sqlPath, "utf8");
    return raw.replace(/\/\*[\s\S]*?\*\//g, "").trim();
};

/**
 * Extrae el bloque DOWN de reversión documentado dentro de `003_spec003_ux_management.sql`.
 */
export const getDownSqlStatements = (): string => {
    const sqlPath = resolveSqlMigrationPath();
    const raw = fs.readFileSync(sqlPath, "utf8");
    const match = raw.match(/\/\*([\s\S]*?)\*\//);
    if (!match || !match[1]) {
        throw new Error("No se encontró el bloque de reversión DOWN en 003_spec003_ux_management.sql");
    }
    return match[1].trim();
};

export async function up(queryInterface: QueryInterface): Promise<void> {
    const upSql = getUpSqlStatements();
    await queryInterface.sequelize.query(upSql);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
    const downSql = getDownSqlStatements();
    await queryInterface.sequelize.query(downSql);
}
