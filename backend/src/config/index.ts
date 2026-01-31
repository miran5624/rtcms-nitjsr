import dotenv from 'dotenv';

dotenv.config();

const superAdminEmailsRaw = process.env.SUPER_ADMIN_EMAILS ?? '';
export const config = {
  port: parseInt(process.env.PORT ?? '4000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  database: {
    url: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/complaint_portal',
  },
  superAdminEmails: superAdminEmailsRaw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
} as const;
