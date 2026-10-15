import { initDB } from "./config/db.js";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import { routes } from "./router/routes.js";

dotenv.config();
const PORT = Number(process.env.PORT || 3000);
const app = express();
const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
    : [];

app.use(cors({
    origin: allowedOrigins.length > 0
        ? allowedOrigins
        : process.env.NODE_ENV === "production" ? false : true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.get('/',(req,res) => res.json({ok:true}))

app.use('/api',routes)

app.use((error, _req, res, _next) => {
    console.error("Error no controlado:", error);

    if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ msg: "El archivo supera el tamaño máximo permitido." });
    }

    if (error.message === "Solo se permiten PDF, JPG o PNG.") {
        return res.status(400).json({ msg: error.message });
    }

    return res.status(500).json({ msg: "Error interno del servidor" });
});


export const startServer = async () => {
    const requiredEnvironment = ["DB_NAME", "DB_USER", "DB_HOST"];
    const missingEnvironment = requiredEnvironment.filter((key) => !process.env[key]);

    if (!process.env.JWT_SECRET && !process.env.JWT_SECRECT) {
        missingEnvironment.push("JWT_SECRET");
    }

    if (missingEnvironment.length > 0) {
        throw new Error(`Faltan variables de entorno: ${missingEnvironment.join(", ")}`);
    }

    await initDB();
    return app.listen(PORT, () => {
        console.log(`Escuchando el puerto http://localhost:${PORT}`);
    });
};

if (process.env.NODE_ENV !== "test") {
    startServer().catch((error) => {
        console.error("No se pudo iniciar la aplicación", error);
        process.exit(1);
    });
}



