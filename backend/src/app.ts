import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import express, { Request, Response } from "express";
import { routes } from "./routes/index.js";
import { metricsMiddleware } from "./metrics.js";

export const createApp = (): ReturnType<typeof express> => {
  const app = express();

  // CORS configuration — Bearer token via Authorization header
  app.use(
    cors({
      origin:
        env.corsOrigins.length > 0
          ? env.corsOrigins
          : env.isProduction
          ? false
          : true,
    })
  );

  // Body parser for JSON payloads
  app.use(express.json({ limit: "1mb" }));

  // Metrics middleware (if any)
  app.use(metricsMiddleware);

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

export const app = createApp();
