import type { WebSocket } from 'ws';
import { WebSocketServer } from 'ws';
import type { Server } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  role?: string;
}

/**
 * WebSocket server for real-time updates.
 * Authenticates via query token or first message; business logic (rooms, events) to be added later.
 */
export function createWebSocketServer(httpServer: Server): WebSocketServer {
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws',
  });

  wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
    const url = new URL(req.url ?? '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwt.secret) as {
          sub: string;
          role?: string;
        };
        ws.userId = decoded.sub;
        ws.role = decoded.role;
      } catch {
        ws.close(4001, 'Invalid token');
        return;
      }
    }

    ws.on('message', (_data) => {
      // Echo / dispatch logic to be implemented with business rules
    });

    ws.on('close', () => {
      // Cleanup per-client state when needed
    });
  });

  return wss;
}
