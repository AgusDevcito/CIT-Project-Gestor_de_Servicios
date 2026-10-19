import { app } from "./app.js";
import { closeDB, initDB } from "./config/db.js";
import { assertEnvironment, env } from "./config/env.js";
import { seedCatalogos } from "./services/catalogSeed.service.js";

const startServer = async (): Promise<void> => {
    assertEnvironment();

    await initDB();
    await seedCatalogos();

    const server = app.listen(env.port, () => {
        console.log(`Escuchando el puerto http://localhost:${env.port}`);
    });

    const shutdown = (signal: string): void => {
        console.log(`Recibida señal ${signal}, cerrando servidor...`);
        server.close(() => {
            void closeDB().finally(() => process.exit(0));
        });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
};

startServer().catch((error) => {
    console.error("No se pudo iniciar la aplicación", error);
    process.exit(1);
});
