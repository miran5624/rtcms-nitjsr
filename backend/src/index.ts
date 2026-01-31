import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './config/index.js';
import { registerRoutes } from './routes/index.js';
import { createWebSocketServer } from './websocket/index.js';

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

registerRoutes(app);

createWebSocketServer(httpServer);

httpServer.listen(config.port, () => {
  console.log(
    `[${config.nodeEnv}] Server listening on http://localhost:${config.port}`
  );
  console.log(`  API:     http://localhost:${config.port}/api`);
  console.log(`  WebSocket: ws://localhost:${config.port}/ws`);
});

export { app, httpServer };
