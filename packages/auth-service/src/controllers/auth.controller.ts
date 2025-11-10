import { Router } from 'express';

const router = Router();

// Mocked login handler
router.post('/login', (req, res) => {
  const { email } = req.body || {};
  // In a real provider this would validate credentials and return tokens.
  res.json({
    accessToken: `mocked-access-token-for-${email || 'anonymous'}`,
    refreshToken: `mocked-refresh-token-for-${email || 'anonymous'}`,
  });
});

// Mocked refresh handler
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) {
    return res.status(400).json({ error: 'refreshToken is required' });
  }
  res.json({
    accessToken: `mocked-new-access-token-for-${refreshToken}`,
  });
});

export default router;
