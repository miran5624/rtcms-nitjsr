import type { Request, Response, Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  createComplaint,
  hasActiveComplaint,
  isValidCategory,
} from '../services/complaints.service.js';

export function registerComplaintRoutes(router: Router): void {
  router.use(authMiddleware);

  router.get('/', (_req, res) => {
    res.status(501).json({ message: 'List complaints not implemented yet' });
  });

  router.get('/:id', (_req, res) => {
    res.status(501).json({ message: 'Get complaint not implemented yet' });
  });

  router.post('/', async (req: Request, res: Response) => {
    if (req.user?.role !== 'student') {
      res.status(403).json({ error: 'students only' });
      return;
    }
    const studentId = req.user.id;
    const { title, category, description } = req.body ?? {};
    if (!title || typeof title !== 'string' || title.trim() === '') {
      res.status(400).json({ error: 'title required' });
      return;
    }
    if (!category || typeof category !== 'string') {
      res.status(400).json({ error: 'category required' });
      return;
    }
    if (!isValidCategory(category.trim())) {
      res.status(400).json({
        error: 'invalid category',
        valid: ['academic', 'hostel', 'mess', 'internet', 'infrastructure', 'finance', 'other'],
      });
      return;
    }
    const active = await hasActiveComplaint(studentId);
    if (active) {
      res.status(400).json({ error: 'Active complaint already exists' });
      return;
    }
    const complaint = await createComplaint(studentId, {
      title: title.trim(),
      category: category.trim(),
      description: typeof description === 'string' ? description : undefined,
    });
    res.status(201).json(toComplaintResponse(complaint));
  });

  router.patch('/:id', (_req, res) => {
    res.status(501).json({ message: 'Update complaint not implemented yet' });
  });
}

function toComplaintResponse(row: {
  id: number;
  author_id: number;
  category: string;
  status: string;
  priority: string;
  title: string;
  description: string | null;
  claimed_by: number | null;
  escalation_flag: boolean;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: row.id,
    author_id: row.author_id,
    category: row.category,
    status: row.status,
    priority: row.priority,
    title: row.title,
    description: row.description,
    claimed_by: row.claimed_by,
    escalation_flag: row.escalation_flag,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
