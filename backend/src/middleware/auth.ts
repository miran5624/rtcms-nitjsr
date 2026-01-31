import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface JwtPayload {
  sub?: string;
  userId?: number;
  email?: string;
  role?: string;
  department?: string;
  iat?: number;
  exp?: number;
}

export interface RequestUser {
  id: number;
  role: string;
  department: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    const id = decoded.userId ?? (decoded.sub ? parseInt(decoded.sub, 10) : 0);
    req.user = {
      id: Number.isInteger(id) ? id : 0,
      role: decoded.role ?? '',
      department: decoded.department ?? '',
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    const id = decoded.userId ?? (decoded.sub ? parseInt(decoded.sub, 10) : 0);
    req.user = {
      id: Number.isInteger(id) ? id : 0,
      role: decoded.role ?? '',
      department: decoded.department ?? '',
    };
  } catch {
    // no token or invalid
  }
  next();
}
