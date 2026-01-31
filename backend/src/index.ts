import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './config/index.js';
import { registerRoutes } from './routes/index.js';
import { initCronJobs } from './services/cron.service.js';
import { initSocket } from './utils/socket.js';
import { testConnection } from './config/database.js';

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

registerRoutes(app);

initSocket(httpServer);

httpServer.listen(config.port, async () => {
  console.log(
    `[${config.nodeEnv}] Server listening on http://localhost:${config.port}`
  );
  console.log(`  API:     http://localhost:${config.port}/api`);
  console.log(`  Socket.io: http://localhost:${config.port}`);
  try {
    await testConnection();
    initCronJobs();
  } catch (e) {
    console.warn('DB connection failed, cron jobs not started:', e);
  }
});

export { app, httpServer };
