import type { Router } from 'express';

/**
 * Auth routes (login, register, refresh).
 * Business logic to be implemented in auth service.
 */
export function registerAuthRoutes(router: Router): void {
  // POST /auth/login - placeholder
  router.post('/login', (_req, res) => {
    res.status(501).json({ message: 'Auth login not implemented yet' });
  });

  // POST /auth/register - placeholder
  router.post('/register', (_req, res) => {
    res.status(501).json({ message: 'Auth register not implemented yet' });
  });

  // POST /auth/refresh - placeholder
  router.post('/refresh', (_req, res) => {
    res.status(501).json({ message: 'Auth refresh not implemented yet' });
  });
}
