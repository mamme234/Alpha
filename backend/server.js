// server.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { connectDB } from './db.js';
import routes from './routes.js';
import { errorHandler, notFound } from './middleware.js';
import { setupSockets } from './socket.js';
import { startScheduler } from './scheduler.js';
import config from './config.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: config.frontendUrl } });

// Security & Performance
app.use(helmet());
app.use(compression());
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests'
}));

// Routes
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

// WebSocket
setupSockets(io);

// Start
const PORT = config.port || 5000;
server.listen(PORT, async () => {
  await connectDB();
  startScheduler();
  console.log(`🚀 Server running on port ${PORT}`);
});
