import cors from 'cors';
import express from 'express';
import authRoutes from './routes/auth.js';
import { config } from './config.js';
import { getLogger } from './logger.js';

const app = express();
const log = getLogger('inno-agent-auth');

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost',
    'http://127.0.0.1',
    'http://inno.localhost',
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Accept', 'Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '2mb' }));

app.get('/healthz', (_req, res) => {
  res.json({ ok: true });
});

app.use(authRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  log.error({ err }, 'Unhandled error');
  res.status(500).json({ error: err?.message || 'Internal server error' });
});

const server = app.listen(config.port, config.host, () => {
  log.info({ host: config.host, port: config.port }, 'Inno Agent auth backend is listening');
});

function shutdown() {
  log.info('Shutting down');
  server.close();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
