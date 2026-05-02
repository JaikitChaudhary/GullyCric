import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import matchRoutes from './routes/matchRoutes.js';
import { listMatches } from './controllers/matchController.js';
import { registerMatchSocket } from './socket/matchSocket.js';

const PORT = Number(process.env.PORT) || 4000;
const HOST = '0.0.0.0';

const start = async () => {
  const app = Fastify({ logger: true });

  await connectDB();

  await app.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  app.get('/ping', async () => ({
    status: 'ok',
    message: 'GullyCric server is alive',
    timestamp: new Date().toISOString(),
  }));

  app.get('/matches', listMatches);
  app.get('/api/matches', listMatches);

  await app.register(matchRoutes, { prefix: '/match' });
  await app.register(matchRoutes, { prefix: '/api/match' });

  const io = new Server(app.server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  app.decorate('io', io);
  registerMatchSocket(io);

  app.log.info('Starting GullyCric server...');

  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`Server listening on http://localhost:${PORT}`);

    const keepAliveUrl = process.env.PING_URL || `http://localhost:${PORT}/ping`;
    const keepAliveIntervalMs = 5 * 60 * 1000;

    app.log.info(`Keep-alive ping configured for: ${keepAliveUrl}`);

    setInterval(async () => {
      try {
        await fetch(keepAliveUrl);
        app.log.info('Keep-alive ping sent');
      } catch (error) {
        app.log.warn('Keep-alive ping failed:', error.message);
      }
    }, keepAliveIntervalMs);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
