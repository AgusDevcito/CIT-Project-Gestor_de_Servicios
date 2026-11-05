import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import express from "express";
import { routes } from "./routes/index.js";

import { metricsMiddleware } from "./metrics.js";
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
    app.use(cookieParser());

    app.use(metricsMiddleware);

    app.get("/", (_req: any, res: any) => {
    res.json({ ok: true });
});

    app.use("/api", routes);

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
};

export const app = createApp();
