import type { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import {
  classifyRoleAndDepartment,
  createUser,
  findUserByEmail,
  updateUserRoleDepartment,
  verifyPassword,
} from '../services/auth.service.js';

const DOMAIN = '@nitjsr.ac.in';

export function registerAuthRoutes(router: Router): void {
  router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      res.status(400).json({ error: 'email and password required' });
      return;
    }
    const emailTrim = email.trim().toLowerCase();
    if (!emailTrim.endsWith(DOMAIN)) {
      res.status(403).json({ error: 'domain not allowed' });
      return;
    }
    const { role, department } = classifyRoleAndDepartment(emailTrim);
    let user = await findUserByEmail(emailTrim);
    if (user) {
      const ok = await verifyPassword(password, user.password_hash);
      if (!ok) {
        res.status(401).json({ error: 'invalid credentials' });
        return;
      }
      user = await updateUserRoleDepartment(user.id, role, department);
    } else {
      user = await createUser(emailTrim, password, role, department);
    }
    const payload = {
      sub: String(user.id),
      userId: user.id,
      email: user.email,
      role,
      department,
    };
    const token = jwt.sign(
      payload,
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'] }
    );
    res.json({ token });
  });

  async function handleSignup(req: Request, res: Response) {
    try {
      const { email, password } = req.body ?? {};
      if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
        res.status(400).json({ error: 'email and password required' });
        return;
      }
      const emailTrim = email.trim().toLowerCase();
      if (!emailTrim.endsWith(DOMAIN)) {
        res.status(403).json({ error: 'domain not allowed' });
        return;
      }
      const existing = await findUserByEmail(emailTrim);
      if (existing) {
        res.status(400).json({ error: 'Email already registered' });
        return;
      }
      const { role, department } = classifyRoleAndDepartment(emailTrim);
      await createUser(emailTrim, password, role, department);
      res.status(201).json({ message: 'Account created' });
    } catch (e) {
      console.error('[signup] error:', e);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  router.post('/signup', handleSignup);
  router.post('/register', handleSignup);

  router.post('/refresh', (_req, res) => {
    res.status(501).json({ message: 'Auth refresh not implemented yet' });
  });
}
