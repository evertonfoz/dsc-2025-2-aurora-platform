import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Health check
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Create user (mocked)
router.post('/users', (req: Request, res: Response) => {
  const { email, name } = req.body ?? {};

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  const id = uuidv4();

  return res.status(201).json({ id, email, name });
});

// Get user by id (mocked)
router.get('/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  // For PoC: only a specific id is considered found (mocked)
  if (id === 'mocked-user-id') {
    return res.status(200).json({ id: 'mocked-user-id', email: 'mock@x.com', name: 'Mock User' });
  }

  return res.status(404).json({ message: 'User not found' });
});

export default router;
