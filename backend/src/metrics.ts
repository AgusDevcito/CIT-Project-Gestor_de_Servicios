import type { Request, Response, NextFunction } from 'express';

// Simple placeholder metrics middleware – no external dependencies
export const register = {
  contentType: 'text/plain',
  metrics: () => 'metrics not collected',
} as const;

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/metrics') {
    res.set('Content-Type', register.contentType);
    res.end(register.metrics());
  } else {
    next();
  }
};
