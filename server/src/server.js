import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import matchRoutes from './routes/matchRoutes.js';
import { registerMatchSocket } from './socket/matchSocket.js';

const PORT = Number(process.env.PORT) || 4000;
const HOST = '0.0.0.0';

const start = async () => {
  const app = Fastify({ logger: true });

  await connectDB();

  await app.register(cors, {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  await app.register(matchRoutes, { prefix: '/match' });
  await app.register(matchRoutes, { prefix: '/api/match' });

  const io = new Server(app.server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
    },
  });

  app.decorate('io', io);
  registerMatchSocket(io);

  app.log.info('Starting GullyCric server...');

  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`Server listening on http://localhost:${PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
