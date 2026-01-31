import bcrypt from 'bcrypt';
import { pool } from '../config/database.js';
import { config } from '../config/index.js';

const DOMAIN = '@nitjsr.ac.in';
const STUDENT_EMAIL_REGEX = /^202[0-9]{6}@nitjsr\.ac\.in$/;

export interface ClassifiedUser {
  role: 'student' | 'admin' | 'super_admin';
  department: string;
}

export function classifyRoleAndDepartment(email: string): ClassifiedUser {
  const lower = email.trim().toLowerCase();
  if (config.superAdminEmails.includes(lower)) {
    return { role: 'super_admin', department: 'all' };
  }
  if (STUDENT_EMAIL_REGEX.test(email.trim())) {
    return { role: 'student', department: 'n/a' };
  }
  const part = lower.replace(DOMAIN, '');
  if (/\b(warden|chief\.warden)\b/.test(part)) return { role: 'admin', department: 'Hostel' };
  if (/\b(mess|food)\b/.test(part)) return { role: 'admin', department: 'Mess' };
  if (/\b(hod|dean|faculty)\b/.test(part)) return { role: 'admin', department: 'Academic' };
  if (/\b(network|wifi|fic\.net)\b/.test(part)) return { role: 'admin', department: 'Internet / Network' };
  if (/\b(estate|civil|electrical|maintenance)\b/.test(part)) return { role: 'admin', department: 'Infrastructure' };
  if (/\badmin\b/.test(part)) return { role: 'admin', department: 'General' };
  return { role: 'admin', department: 'General' };
}

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  role: string;
  department: string | null;
  full_name: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const r = await pool.query<UserRow>(
    'select id, email, password_hash, role, department, full_name, created_at, updated_at from users where email = $1',
    [email.trim().toLowerCase()]
  );
  return r.rows[0] ?? null;
}

export async function createUser(
  email: string,
  plainPassword: string,
  role: string,
  department: string
): Promise<UserRow> {
  const emailNorm = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(plainPassword, 10);
  const r = await pool.query<UserRow>(
    `insert into users (email, password_hash, role, department, updated_at)
     values ($1, $2, $3::user_role, $4, now())
     returning id, email, password_hash, role, department, full_name, created_at, updated_at`,
    [emailNorm, passwordHash, role, department]
  );
  return r.rows[0];
}

export async function updateUserRoleDepartment(
  userId: number,
  role: string,
  department: string
): Promise<void> {
  await pool.query(
    'update users set role = $1::user_role, department = $2, updated_at = now() where id = $3',
    [role, department, userId]
  );
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
