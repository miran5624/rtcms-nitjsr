import bcrypt from 'bcrypt';
import { pool } from '../config/database.js';
import { config } from '../config/index.js';

const DOMAIN = '@nitjsr.ac.in';
// YYYYugBBXXX@nitjsr.ac.in — year (4) + ug + branch (2 letters) + roll (3 digits)
const STUDENT_EMAIL_REGEX = /^20[0-9]{2}ug[a-z]{2}[0-9]{3}@nitjsr\.ac\.in$/;

export interface ClassifiedUser {
  role: 'student' | 'admin' | 'super_admin';
  department: string;
}

export function classifyRoleAndDepartment(email: string): ClassifiedUser {
  const lower = email.trim().toLowerCase();
  if (config.superAdminEmails.includes(lower)) {
    return { role: 'super_admin', department: 'all' };
  }
  // VIP Mappings
  const vipMap: Record<string, string> = {
    'chiefwarden@nitjsr.ac.in': 'hostel',
    'mess@nitjsr.ac.in': 'mess',
    'it@nitjsr.ac.in': 'internet',
    'deanacad@nitjsr.ac.in': 'academic',
    'estate@nitjsr.ac.in': 'infrastructure',
    'enquiry@nitjsr.ac.in': 'other',
    'dean.sw@nitjsr.ac.in': 'superadmin',
    'director@nitjsr.ac.in': 'superadmin',
  };

  if (vipMap[lower]) {
    return { role: 'admin', department: vipMap[lower] };
  }

  if (STUDENT_EMAIL_REGEX.test(lower)) {
    return { role: 'student', department: 'n/a' };
  }

  const part = lower.replace(DOMAIN, '');
  if (/\b(warden|chief\.warden)\b/.test(part)) return { role: 'admin', department: 'hostel' };
  if (/\b(mess|food)\b/.test(part)) return { role: 'admin', department: 'mess' };
  if (/\b(hod|dean|faculty)\b/.test(part)) return { role: 'admin', department: 'academic' };
  if (/\b(network|wifi|fic\.net)\b/.test(part)) return { role: 'admin', department: 'internet' };
  if (/\b(estate|civil|electrical|maintenance)\b/.test(part)) return { role: 'admin', department: 'infrastructure' };
  if (/\badmin\b/.test(part)) return { role: 'admin', department: 'other' };
  return { role: 'admin', department: 'other' };
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
     returning *`,
    [emailNorm, passwordHash, role, department]
  );
  const user = r.rows[0];
  if (!user) throw new Error('createUser: no row returned');
  console.log('User DB Action Complete. ID:', user.id);
  return user;
}

export async function updateUserRoleDepartment(
  userId: number,
  role: string,
  department: string
): Promise<UserRow> {
  const r = await pool.query<UserRow>(
    `update users set role = $1::user_role, department = $2, updated_at = now() where id = $3
     returning *`,
    [role, department, userId]
  );
  const user = r.rows[0];
  if (!user) throw new Error('updateUserRoleDepartment: no row returned');
  console.log('User DB Action Complete. ID:', user.id);
  return user;
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
