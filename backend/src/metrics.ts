import client from 'prom-client';
import type { Request, Response, NextFunction } from 'express';

// Collect default metrics (CPU, memory, event loop, etc.)
import { collectDefaultMetrics, Registry } from 'prom-client';
collectDefaultMetrics();

export const register = client.register as Registry;

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/metrics') {
    res.set('Content-Type', register.contentType);
    res.end(register.metrics());
  } else {
    next();
  }
};
