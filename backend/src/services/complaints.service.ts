import { pool } from '../config/database.js';
import { getIO } from '../utils/socket.js';

const VALID_CATEGORIES = [
  'academic',
  'hostel',
  'mess',
  'internet',
  'infrastructure',
  'finance',
  'other',
] as const;

const DEPARTMENT_TO_CATEGORY: Record<string, string> = {
  hostel: 'hostel',
  mess: 'mess',
  academic: 'academic',
  'internet / network': 'internet',
  infrastructure: 'infrastructure',
};

export type ComplaintCategory = (typeof VALID_CATEGORIES)[number];

export interface CreateComplaintInput {
  title: string;
  category: string;
  description?: string;
  image_url?: string;
}

export interface ComplaintRow {
  id: number;
  author_id: number;
  category: string;
  status: string;
  priority: string;
  title: string;
  description: string | null;
  image_url: string | null;
  claimed_by: number | null;
  escalation_flag: boolean;
  created_at: Date;
  updated_at: Date;
}

export function isValidCategory(category: string): category is ComplaintCategory {
  return VALID_CATEGORIES.includes(category as ComplaintCategory);
}

export function departmentMatchesCategory(
  department: string,
  complaintCategory: string
): boolean {
  const d = department.trim().toLowerCase();
  if (d === 'general' || d === 'all') return true;
  const cat = complaintCategory.trim().toLowerCase();
  const mapped = DEPARTMENT_TO_CATEGORY[d];
  if (mapped) return mapped === cat;
  return d === cat;
}

function departmentToFilterCategory(department: string): string | null {
  const d = department.trim().toLowerCase();
  if (d === 'general' || d === 'all') return null;
  return DEPARTMENT_TO_CATEGORY[d] ?? d;
}

export async function listComplaints(
  role: string,
  department: string,
  userId: number
): Promise<ComplaintRow[]> {
  if (role === 'student') {
    const r = await pool.query<ComplaintRow>(
      `select id, author_id, category, status, priority, title, description, image_url, claimed_by, escalation_flag, created_at, updated_at
       from complaints where author_id = $1 order by created_at desc`,
      [userId]
    );
    console.log('[listComplaints] student author_id:', userId, 'result count:', r.rows.length);
    return r.rows;
  }
  if (role === 'super_admin') {
    const r = await pool.query<ComplaintRow>(
      `select id, author_id, category, status, priority, title, description, image_url, claimed_by, escalation_flag, created_at, updated_at
       from complaints order by created_at desc`
    );
    console.log('[listComplaints] super_admin result count:', r.rows.length);
    return r.rows;
  }
  const filterCat = departmentToFilterCategory(department);
  if (filterCat === null) {
    const r = await pool.query<ComplaintRow>(
      `select id, author_id, category, status, priority, title, description, image_url, claimed_by, escalation_flag, created_at, updated_at
       from complaints order by created_at desc`
    );
    console.log('[listComplaints] admin (General/All) result count:', r.rows.length);
    return r.rows;
  }
  const r = await pool.query<ComplaintRow>(
    `select id, author_id, category, status, priority, title, description, image_url, claimed_by, escalation_flag, created_at, updated_at
     from complaints where lower(category::text) = lower($1) order by created_at desc`,
    [filterCat]
  );
  console.log('[listComplaints] admin department filter:', filterCat, 'result count:', r.rows.length);
  return r.rows;
}

export async function getComplaintById(id: number): Promise<ComplaintRow | null> {
  const r = await pool.query<ComplaintRow>(
    `select id, author_id, category, status, priority, title, description, image_url, claimed_by, escalation_flag, created_at, updated_at
     from complaints where id = $1`,
    [id]
  );
  return r.rows[0] ?? null;
}

export async function claimComplaint(
  complaintId: number,
  adminId: number
): Promise<ComplaintRow | null> {
  const client = await pool.connect();
  try {
    const update = await client.query<ComplaintRow>(
      `update complaints set claimed_by = $1, status = 'in_progress', updated_at = now()
       where id = $2 and claimed_by is null
       returning id, author_id, category, status, priority, title, description, image_url, claimed_by, escalation_flag, created_at, updated_at`,
      [adminId, complaintId]
    );
    const row = update.rows[0] ?? null;
    if (!row) return null;
    await client.query(
      `insert into complaint_activity_logs (complaint_id, actor_id, action, new_state)
       values ($1, $2, 'CLAIMED', $3::jsonb)`,
      [complaintId, adminId, JSON.stringify({ claimed_by: adminId, status: 'in_progress' })]
    );
    return row;
  } finally {
    client.release();
  }
}

export type ResolutionStatus = 'resolved' | 'rejected';

export async function updateComplaintStatus(
  complaintId: number,
  adminId: number,
  status: ResolutionStatus,
  remarks: string
): Promise<ComplaintRow | null> {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const action = status === 'resolved' ? 'RESOLVED' : 'REJECTED';
    const update = await client.query<ComplaintRow>(
      `update complaints set status = $1, updated_at = now() where id = $2
       returning *`,
      [status, complaintId]
    );
    const row = update.rows[0] ?? null;
    if (!row) {
      await client.query('rollback');
      return null;
    }
    await client.query(
      `insert into complaint_activity_logs (complaint_id, actor_id, action, new_state)
       values ($1, $2, $3, $4::jsonb)`,
      [complaintId, adminId, action, JSON.stringify({ status, remarks })]
    );
    await client.query('commit');
    try {
      getIO().emit('complaint_status_change', row);
    } catch {
      // socket not ready or emit failed
    }
    return row;
  } catch (e) {
    await client.query('rollback');
    throw e;
  } finally {
    client.release();
  }
}

export async function hasActiveComplaint(studentId: number): Promise<boolean> {
  const r = await pool.query<{ count: string }>(
    `select 1 from complaints
     where author_id = $1 and status in ('open', 'in_progress')
     limit 1`,
    [studentId]
  );
  return r.rowCount !== null && r.rowCount > 0;
}

export async function createComplaint(
  studentId: number,
  input: CreateComplaintInput
): Promise<ComplaintRow> {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const insert = await client.query<ComplaintRow>(
      `insert into complaints (author_id, category, status, priority, title, description, image_url)
       values ($1, $2::complaint_category, 'open', 'medium', $3, $4, $5)
       returning id, author_id, category, status, priority, title, description, image_url, claimed_by, escalation_flag, created_at, updated_at`,
      [studentId, input.category, input.title, input.description ?? null, input.image_url ?? null]
    );
    const complaint = insert.rows[0];
    await client.query(
      `insert into complaint_activity_logs (complaint_id, actor_id, action, new_state)
       values ($1, $2, 'CREATED', $3::jsonb)`,
      [
        complaint.id,
        studentId,
        JSON.stringify({
          id: complaint.id,
          author_id: complaint.author_id,
          category: complaint.category,
          status: complaint.status,
          priority: complaint.priority,
          title: complaint.title,
          description: complaint.description,
          image_url: complaint.image_url,
        }),
      ]
    );
    await client.query('commit');
    try {
      getIO().emit('new_complaint', complaint);
    } catch {
      // socket not ready or emit failed
    }
    return complaint;
  } catch (e) {
    await client.query('rollback');
    throw e;
  } finally {
    client.release();
  }
}
