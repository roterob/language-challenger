import { Hono } from 'hono';
import { importsService } from '../services/imports.service';
import { authMiddleware } from '../middleware/auth';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsDir = resolve(__dirname, '../../uploads');

const importsRoutes = new Hono();

importsRoutes.use('*', authMiddleware);

// POST /api/imports/upload
importsRoutes.post('/upload', async (c) => {
  const body = await c.req.parseBody();
  const file = body['file'];

  if (!file || typeof file === 'string') {
    return c.json({ error: 'No file uploaded' }, 400);
  }

  // Validate file type
  if (!file.name?.endsWith('.json')) {
    return c.json({ error: 'Only JSON files are accepted' }, 400);
  }

  // Validate file size (10MB max)
  const MAX_SIZE = 10 * 1024 * 1024;
  const arrayBuffer = await file.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_SIZE) {
    return c.json({ error: 'File too large. Maximum size is 10MB' }, 400);
  }

  // Save file temporarily
  mkdirSync(uploadsDir, { recursive: true });
  const tempFileName = `${randomUUID()}.json`;
  const tempFilePath = resolve(uploadsDir, tempFileName);
  writeFileSync(tempFilePath, Buffer.from(arrayBuffer));

  // Start import
  const task = await importsService.uploadAndImport(tempFilePath, file.name ?? 'unknown.json');
  return c.json(task, 201);
});

// GET /api/imports/tasks
importsRoutes.get('/tasks', async (c) => {
  const tasks = importsService.getTasks();
  return c.json(tasks);
});

// GET /api/imports/tasks/active
importsRoutes.get('/tasks/active', async (c) => {
  const tasks = importsService.getActiveTasks();
  return c.json(tasks);
});

// GET /api/imports/tasks/:id
importsRoutes.get('/tasks/:id', async (c) => {
  const id = c.req.param('id');
  const task = importsService.getTaskById(id);
  return c.json(task);
});

export { importsRoutes };
