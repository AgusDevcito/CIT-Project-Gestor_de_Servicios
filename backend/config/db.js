import { Sequelize } from "sequelize";
import dotenv from 'dotenv'
dotenv.config()
export const sequelize = new Sequelize({
        database: process.env.DB_NAME,
        username: process.env.DB_USER,
        password: String(process.env.DB_PASSWORD ?? ""),
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        dialect: process.env.DB_DIALECT || "postgres",
        dialectOptions: process.env.DB_SSL === "true" ? {
            ssl: { require: true, rejectUnauthorized: false }
        } : {},
        pool:{
            max:7,
            min:0,
            acquire:30000,
            idle:10000,
        }
    })


export const initDB = async () => {
    await sequelize.authenticate();
    console.log("Conectado a la base de datos");

    if (process.env.DB_SYNC === "true" || process.env.NODE_ENV !== "production") {
        await sequelize.sync();
    }
    const { seedCatalogos } = await import('./catalogos.seed.js');
    await seedCatalogos();
}