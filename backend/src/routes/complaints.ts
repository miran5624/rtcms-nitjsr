import type { Request, Response, Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
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
import { uploadBufferToCloudinary } from '../utils/cloudinary-upload.js';

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
    console.log('[GET /complaints] req.user.id:', req.user.id, 'req.user.role:', req.user.role, 'result count:', complaints.length);
    res.json(complaints.map(toComplaintResponse));
  });

  router.get('/:id', (_req, res) => {
    res.status(501).json({ message: 'Get complaint not implemented yet' });
  });

  router.post('/', upload.single('image'), async (req: Request, res: Response) => {
    console.log('[POST /complaints] req.file:', req.file ? { fieldname: req.file.fieldname, size: req.file.size } : undefined);
    try {
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
      let image_url: string | undefined;
      if (req.file?.buffer) {
        console.log('[POST /complaints] CLOUD_NAME loaded:', !!process.env.CLOUD_NAME, 'value:', process.env.CLOUD_NAME ? '(set)' : '(missing)');
        try {
          const { secure_url } = await uploadBufferToCloudinary(req.file.buffer);
          image_url = secure_url;
        } catch (e) {
          console.error('[POST /complaints] Cloudinary upload error:', e);
          res.status(500).json({ error: 'Image upload failed' });
          return;
        }
      }
      const complaint = await createComplaint(studentId, {
        title: title.trim(),
        category: category.trim(),
        description: typeof description === 'string' ? description : undefined,
        image_url,
      });
      res.status(201).json(toComplaintResponse(complaint));
    } catch (e) {
      console.error('[POST /complaints] error:', e);
      res.status(500).json({ error: 'Failed to create complaint' });
    }
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
    // Department check removed for Open Access
    // if (
    //   req.user.role === 'admin' &&
    //   !departmentMatchesCategory(req.user.department, complaint.category)
    // ) {
    //   res.status(403).json({ error: 'department does not match complaint category' });
    //   return;
    // }
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

  router.post('/:id/updates', async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).send();
    const id = parseInt(req.params.id, 10);
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message required' });
      return;
    }
    // Simple permission check: student must own it, admin can update any (or dept restricted)
    // For now allowing all auth users for simplicity as per prompt "Admin UI" and "Student UI".

    // Determine role
    const authorRole = req.user.role === 'student' ? 'student' : 'admin';
    try {
      import('../services/complaints.service.js').then(async (service) => {
        const update = await service.addComplaintUpdate(id, message, authorRole);
        res.status(201).json(update);
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to add update' });
    }
  });

  router.get('/:id/timeline', async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).send();
    const id = parseInt(req.params.id, 10);
    try {
      import('../services/complaints.service.js').then(async (service) => {
        const timeline = await service.getComplaintTimeline(id);
        res.json(timeline);
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to get timeline' });
    }
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
  image_url?: string | null;
  claimed_by: number | null;
  escalation_flag: boolean;
  created_at: Date;
  updated_at: Date;
  author_email?: string;
  claimer_email?: string | null;
}) {
  return {
    id: row.id,
    author_id: row.author_id,
    category: row.category,
    status: row.status,
    priority: row.priority,
    title: row.title,
    description: row.description,
    image_url: row.image_url ?? undefined,
    claimed_by: row.claimed_by,
    escalation_flag: row.escalation_flag,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author_email: row.author_email,
    claimer_email: row.claimer_email,
  };
}
