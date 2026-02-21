import { Hono } from 'hono';
import { resourcesService } from '../services/resources.service';
import {
  saveResourceSchema,
  resourceFiltersSchema,
  resourceStatsFiltersSchema,
} from '@language-challenger/shared';
import { authMiddleware } from '../middleware/auth';

const resourcesRoutes = new Hono();

// All routes require auth
resourcesRoutes.use('*', authMiddleware);

// GET /api/resources
resourcesRoutes.get('/', async (c) => {
  const query = c.req.query();
  const tags = query.tags ? query.tags.split(',') : undefined;
  const parsed = resourceFiltersSchema.safeParse({ ...query, tags });

  if (!parsed.success) {
    return c.json({ error: 'Invalid filters', details: parsed.error.flatten() }, 400);
  }

  const result = resourcesService.getResources(parsed.data);
  return c.json(result);
});

// GET /api/resources/stats
resourcesRoutes.get('/stats', async (c) => {
  const userId = c.get('userId') as string;
  const query = c.req.query();
  const tags = query.tags ? query.tags.split(',') : undefined;
  const parsed = resourceStatsFiltersSchema.safeParse({ ...query, tags });

  if (!parsed.success) {
    return c.json({ error: 'Invalid filters', details: parsed.error.flatten() }, 400);
  }

  const result = resourcesService.getResourceStats(userId, parsed.data);
  return c.json(result);
});

// GET /api/resources/tags
resourcesRoutes.get('/tags', async (c) => {
  const tags = resourcesService.getAvailableTags();
  return c.json({ tags });
});

// GET /api/resources/:id
resourcesRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const resource = resourcesService.getResourceById(id);
  return c.json(resource);
});

// POST /api/resources
resourcesRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = saveResourceSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400);
  }

  const resource = resourcesService.saveResource(undefined, parsed.data);
  return c.json(resource, 201);
});

// PUT /api/resources/:id
resourcesRoutes.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = saveResourceSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400);
  }

  const resource = resourcesService.saveResource(id, parsed.data);
  return c.json(resource);
});

// DELETE /api/resources/:id
resourcesRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const result = resourcesService.deleteResource(id);
  return c.json(result);
});

// POST /api/resources/:id/favourite
resourcesRoutes.post('/:id/favourite', async (c) => {
  const userId = c.get('userId') as string;
  const resourceId = c.req.param('id');
  const result = resourcesService.toggleFavourite(userId, resourceId);
  return c.json(result);
});

export { resourcesRoutes };
