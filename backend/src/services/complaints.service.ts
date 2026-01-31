import { pool } from '../config/database.js';

const VALID_CATEGORIES = [
  'academic',
  'hostel',
  'mess',
  'internet',
  'infrastructure',
  'finance',
  'other',
] as const;

export type ComplaintCategory = (typeof VALID_CATEGORIES)[number];

export interface CreateComplaintInput {
  title: string;
  category: string;
  description?: string;
}

export interface ComplaintRow {
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
}

export function isValidCategory(category: string): category is ComplaintCategory {
  return VALID_CATEGORIES.includes(category as ComplaintCategory);
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
      `insert into complaints (author_id, category, status, priority, title, description)
       values ($1, $2::complaint_category, 'open', 'medium', $3, $4)
       returning id, author_id, category, status, priority, title, description, claimed_by, escalation_flag, created_at, updated_at`,
      [studentId, input.category, input.title, input.description ?? null]
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
        }),
      ]
    );
    await client.query('commit');
    return complaint;
  } catch (e) {
    await client.query('rollback');
    throw e;
  } finally {
    client.release();
  }
}
