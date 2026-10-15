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

export const initDB = async (): Promise<void> => {
    await sequelize.authenticate();
    console.log("Conectado a la base de datos");

    if (env.db.sync || !env.isProduction) {
        await sequelize.sync();
    }
};

export const closeDB = async (): Promise<void> => {
    await sequelize.close();
};
