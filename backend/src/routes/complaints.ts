import type { Request, Response, Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  createComplaint,
  claimComplaint,
  departmentMatchesCategory,
  getComplaintById,
  hasActiveComplaint,
  isValidCategory,
  listComplaints,
  updateComplaintStatus,
  type ResolutionStatus,
} from '../services/complaints.service.js';

export function registerComplaintRoutes(router: Router): void {
  router.use(authMiddleware);

  router.get('/', async (req: Request, res: Response) => {
    if (!req.user) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    const complaints = await listComplaints(
      req.user.role,
      req.user.department,
      req.user.id
    );
    res.json(complaints.map(toComplaintResponse));
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

  router.patch('/:id/claim', async (req: Request, res: Response) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      res.status(403).json({ error: 'admins only' });
      return;
    }
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: 'invalid id' });
      return;
    }
    const complaint = await getComplaintById(id);
    if (!complaint) {
      res.status(404).json({ error: 'complaint not found' });
      return;
    }
    if (
      req.user.role === 'admin' &&
      !departmentMatchesCategory(req.user.department, complaint.category)
    ) {
      res.status(403).json({ error: 'department does not match complaint category' });
      return;
    }
    const updated = await claimComplaint(id, req.user.id);
    if (!updated) {
      res.status(409).json({ error: 'Already claimed' });
      return;
    }
    res.json(toComplaintResponse(updated));
  });

  router.patch('/:id/status', async (req: Request, res: Response) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      res.status(403).json({ error: 'admins only' });
      return;
    }
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: 'invalid id' });
      return;
    }
    const complaint = await getComplaintById(id);
    if (!complaint) {
      res.status(404).json({ error: 'complaint not found' });
      return;
    }
    if (req.user.role === 'admin' && Number(complaint.claimed_by) !== req.user.id) {
      res.status(403).json({ error: 'You cannot resolve a complaint claimed by someone else' });
      return;
    }
    const { status, remarks } = req.body ?? {};
    if (status !== 'resolved' && status !== 'rejected') {
      res.status(400).json({ error: 'status must be resolved or rejected' });
      return;
    }
    if (typeof remarks !== 'string' || remarks.trim() === '') {
      res.status(400).json({ error: 'remarks required' });
      return;
    }
    const updated = await updateComplaintStatus(
      id,
      req.user.id,
      status as ResolutionStatus,
      remarks.trim()
    );
    if (!updated) {
      res.status(500).json({ error: 'update failed' });
      return;
    }
    res.json(toComplaintResponse(updated));
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
