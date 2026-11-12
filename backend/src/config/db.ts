import { Sequelize } from "sequelize";
import { env } from "./env.js";

export const sequelize = new Sequelize({
    database: env.db.name,
    username: env.db.user,
    password: env.db.password,
    host: env.db.host,
    port: env.db.port,
    dialect: env.db.dialect as "postgres",
    dialectOptions: env.db.ssl
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
    pool: {
        max: 7,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
    logging: false,
});

/**
 * Determina si sequelize.sync() debe ejecutarse.
 * Solo se permite cuando env.db.sync (DB_SYNC="true") está habilitado explícitamente.
 * Si DB_SYNC=false (o no está configurado), NUNCA se sincroniza automáticamente,
 * independientemente de NODE_ENV (sea "development", "test" o "production"),
 * evitando alterar esquemas en bases de datos compartidas (como Supabase) o antes de aplicar migraciones.
 */
export const shouldSyncDatabase = (dbConfig: { sync: boolean }, isProd: boolean): boolean => {
    // Si no está habilitado explícitamente DB_SYNC, nunca sincronizar
    if (!dbConfig.sync) {
        return false;
    }
    // Si DB_SYNC=true pero estamos en producción, proteger contra sincronizaciones destructivas accidentales
    if (isProd) {
        return false;
    }
    return true;
};

export const initDB = async (): Promise<void> => {
    await sequelize.authenticate();
    console.log("Conectado a la base de datos");

    if (shouldSyncDatabase(env.db, env.isProduction)) {
        await sequelize.sync();
    }
};

export const closeDB = async (): Promise<void> => {
    await sequelize.close();
};
