import express from 'express';
import authRouter from './controllers/auth.controller';

export function createApp() {
  const app = express();
  app.use(express.json());

  app.use('/auth', authRouter);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  return app;
}
