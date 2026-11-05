import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import express, { Request, Response } from "express";
import { routes } from "./routes/index.js";
import { metricsMiddleware } from "./metrics.js";

export const createApp = (): ReturnType<typeof express> => {
  const app = express();

  // CORS configuration – allow credentials and origins from env
  app.use(
    cors({
      origin:
        env.corsOrigins.length > 0
          ? env.corsOrigins
          : env.isProduction
          ? false
          : true,
      credentials: true,
    })
  );

  // Body parser for JSON payloads
  app.use(express.json({ limit: "1mb" }));

  // Cookie parser for HttpOnly JWT cookies
  app.use(cookieParser());

  // Metrics middleware (if any)
  app.use(metricsMiddleware);
    // Debug request logger
    app.use((req, _res, next) => { console.log('Incoming request', req.method, req.path); next(); });

  // Simple health endpoint
  app.get("/", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  // API routes
  app.use("/api", routes);

  // 404 and error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

// Ensure DB is initialized for tests
import { initDB } from "./config/db.js";
(async () => { await initDB(); })();

export const app = createApp();