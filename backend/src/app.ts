import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import "./models/index.js";
import { routes } from "./routes/index.js";

export const createApp = (): express.Express => {
    const app = express();

    app.use(
        cors({
            origin:
                env.corsOrigins.length > 0
                    ? env.corsOrigins
                    : env.isProduction
                      ? false
                      : true,
        }),
    );
    app.use(express.json({ limit: "1mb" }));

    app.get("/", (_req, res) => {
        res.json({ ok: true });
    });

    app.use("/api", routes);

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
};

export const app = createApp();
