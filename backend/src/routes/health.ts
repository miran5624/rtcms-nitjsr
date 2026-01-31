import type { Router } from 'express';
import { testConnection } from '../config/database.js';

export function registerHealthRoutes(router: Router): void {
  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  router.get('/health/ready', async (_req, res) => {
    try {
      const dbOk = await testConnection();
      res.status(dbOk ? 200 : 503).json({
        ready: dbOk,
        database: dbOk ? 'connected' : 'disconnected',
      });
    } catch {
      res.status(503).json({ ready: false, database: 'error' });
    }
  });
}
