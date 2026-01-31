import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface JwtPayload {
  sub?: string;
  userId?: number;
  id?: number;
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
    console.log('Decoded Token Payload:', JSON.stringify(decoded, null, 2));
    // Force convert to string first, then parse int
    const rawId = decoded.userId || decoded.id || decoded.sub;
    const userId = parseInt(String(rawId), 10);
    if (isNaN(userId) || userId <= 0) {
      console.log('Failed ID check. rawId:', rawId, 'parsed userId:', userId);
      throw new Error('Invalid User ID');
    }
    req.user = {
      id: userId,
      role: decoded.role ?? '',
      department: decoded.department ?? '',
    };
    next();
  } catch (err) {
    if (err instanceof Error && err.message === 'Invalid User ID') {
      res.status(401).json({ error: 'Invalid User ID' });
    } else {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
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
    const id = decoded.userId ?? (decoded.sub ? parseInt(decoded.sub, 10) : undefined);
    const numId = typeof id === 'number' && Number.isInteger(id) ? id : 0;
    if (numId > 0) {
      req.user = {
        id: numId,
        role: decoded.role ?? '',
        department: decoded.department ?? '',
      };
    }
  } catch {
    // no token or invalid
  }
  next();
}
