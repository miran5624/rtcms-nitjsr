import type { Express, Router } from 'express';
import express from 'express';
import { registerAuthRoutes } from './auth.js';
import { registerComplaintRoutes } from './complaints.js';
import { registerHealthRoutes } from './health.js';

export function registerRoutes(app: Express): void {
  const api = express.Router();

  const healthRouter: Router = express.Router();
  registerHealthRoutes(healthRouter);
  api.use(healthRouter);

  const authRouter: Router = express.Router();
  registerAuthRoutes(authRouter);
  api.use('/auth', authRouter);

  const complaintsRouter: Router = express.Router();
  registerComplaintRoutes(complaintsRouter);
  api.use('/complaints', complaintsRouter);

  app.use('/api', api);
}
