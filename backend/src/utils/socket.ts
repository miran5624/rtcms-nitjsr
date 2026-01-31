import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

let io: Server | null = null;

export function initSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: { origin: '*' },
  });

  io.on('connection', () => {
    console.log('Client connected');
  });

  console.log('Socket initialized');
  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket not initialized');
  return io;
}
