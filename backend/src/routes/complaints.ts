import type { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';

/**
 * Complaint CRUD routes.
 * Business logic to be implemented in complaint service.
 */
export function registerComplaintRoutes(router: Router): void {
  // All complaint routes require JWT
  router.use(authMiddleware);

  // GET /complaints - list (placeholder)
  router.get('/', (_req, res) => {
    res.status(501).json({ message: 'List complaints not implemented yet' });
  });

  // GET /complaints/:id - get one (placeholder)
  router.get('/:id', (_req, res) => {
    res.status(501).json({ message: 'Get complaint not implemented yet' });
  });

  // POST /complaints - create (placeholder)
  router.post('/', (_req, res) => {
    res.status(501).json({ message: 'Create complaint not implemented yet' });
  });

  // PATCH /complaints/:id - update (placeholder)
  router.patch('/:id', (_req, res) => {
    res.status(501).json({ message: 'Update complaint not implemented yet' });
  });
}
