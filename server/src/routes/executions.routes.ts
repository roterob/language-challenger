import { Hono } from 'hono';
import { executionsService } from '../services/executions.service';
import {
  executionFiltersSchema,
  startExecutionSchema,
  startTemporaryExecutionSchema,
  executionConfigSchema,
  saveResultSchema,
} from '@language-challenger/shared';
import { authMiddleware } from '../middleware/auth';

const executionsRoutes = new Hono();

executionsRoutes.use('*', authMiddleware);

// GET /api/executions
executionsRoutes.get('/', async (c) => {
  const userId = c.get('userId') as string;
  const query = c.req.query();
  const tags = query.tags ? query.tags.split(',') : undefined;
  const parsed = executionFiltersSchema.safeParse({ ...query, tags });

  if (!parsed.success) {
    return c.json({ error: 'Invalid filters', details: parsed.error.flatten() }, 400);
  }

  const result = executionsService.getExecutions(userId, parsed.data);
  return c.json(result);
});

// GET /api/executions/:id
executionsRoutes.get('/:id', async (c) => {
  const userId = c.get('userId') as string;
  const id = c.req.param('id');
  const exec = executionsService.getExecutionById(id, userId);
  return c.json(exec);
});

// POST /api/executions/start
executionsRoutes.post('/start', async (c) => {
  const userId = c.get('userId') as string;
  const body = await c.req.json();
  const parsed = startExecutionSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400);
  }

  const exec = executionsService.startExecution(userId, parsed.data.listIds);
  return c.json(exec, 201);
});

// POST /api/executions/start-temporary
executionsRoutes.post('/start-temporary', async (c) => {
  const userId = c.get('userId') as string;
  const body = await c.req.json();
  const parsed = startTemporaryExecutionSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400);
  }

  const exec = executionsService.startTemporary(
    userId,
    parsed.data.name,
    parsed.data.tags,
    parsed.data.resourceIds,
  );
  return c.json(exec, 201);
});

// PATCH /api/executions/:id/config
executionsRoutes.patch('/:id/config', async (c) => {
  const userId = c.get('userId') as string;
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = executionConfigSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400);
  }

  const exec = executionsService.saveConfig(id, userId, parsed.data);
  return c.json(exec);
});

// PATCH /api/executions/:id/result
executionsRoutes.patch('/:id/result', async (c) => {
  const userId = c.get('userId') as string;
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = saveResultSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400);
  }

  const result = executionsService.saveResult(id, userId, parsed.data);
  return c.json(result);
});

// POST /api/executions/:id/restart
executionsRoutes.post('/:id/restart', async (c) => {
  const userId = c.get('userId') as string;
  const id = c.req.param('id');
  const exec = executionsService.restartExecution(id, userId);
  return c.json(exec);
});

// POST /api/executions/:id/finish
executionsRoutes.post('/:id/finish', async (c) => {
  const userId = c.get('userId') as string;
  const id = c.req.param('id');
  const exec = executionsService.finishExecution(id, userId);
  return c.json(exec);
});

export { executionsRoutes };
