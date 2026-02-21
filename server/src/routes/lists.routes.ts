import { Hono } from 'hono';
import { listsService } from '../services/lists.service';
import { saveListSchema, listFiltersSchema } from '@language-challenger/shared';
import { authMiddleware } from '../middleware/auth';

const listsRoutes = new Hono();

listsRoutes.use('*', authMiddleware);

// GET /api/lists
listsRoutes.get('/', async (c) => {
  const userId = c.get('userId') as string;
  const query = c.req.query();
  const tags = query.tags ? query.tags.split(',') : undefined;
  const parsed = listFiltersSchema.safeParse({ ...query, tags });

  if (!parsed.success) {
    return c.json({ error: 'Invalid filters', details: parsed.error.flatten() }, 400);
  }

  const result = listsService.getLists(userId, parsed.data);
  return c.json(result);
});

// GET /api/lists/tags
listsRoutes.get('/tags', async (c) => {
  const tags = listsService.getAvailableTags();
  return c.json({ tags });
});

// GET /api/lists/:id
listsRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const list = listsService.getListById(id);
  return c.json(list);
});

// GET /api/lists/:id/resources
listsRoutes.get('/:id/resources', async (c) => {
  const id = c.req.param('id');
  const resources = listsService.getListResources(id);
  return c.json(resources);
});

// POST /api/lists
listsRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = saveListSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400);
  }

  const list = listsService.saveList(undefined, parsed.data);
  return c.json(list, 201);
});

// PUT /api/lists/:id
listsRoutes.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = saveListSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400);
  }

  const list = listsService.saveList(id, parsed.data);
  return c.json(list);
});

export { listsRoutes };
