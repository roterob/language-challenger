import { Hono } from 'hono';
import { authService } from '../services/auth.service';
import { loginSchema, updateUISettingsSchema } from '@language-challenger/shared';
import { authMiddleware } from '../middleware/auth';

const authRoutes = new Hono();

// POST /api/auth/login
authRoutes.post('/login', async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400);
  }

  const result = await authService.login(parsed.data.username, parsed.data.password);
  return c.json(result);
});

// GET /api/auth/me
authRoutes.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId') as string;
  const user = await authService.getMe(userId);
  return c.json(user);
});

// PATCH /api/auth/me/settings
authRoutes.patch('/me/settings', authMiddleware, async (c) => {
  const userId = c.get('userId') as string;
  const body = await c.req.json();
  const parsed = updateUISettingsSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400);
  }

  const result = await authService.updateUISettings(userId, parsed.data.uiSettings);
  return c.json(result);
});

// GET /api/auth/me/stats
authRoutes.get('/me/stats', authMiddleware, async (c) => {
  const userId = c.get('userId') as string;
  const stats = await authService.getUserStats(userId);
  return c.json({ stats });
});

export { authRoutes };
