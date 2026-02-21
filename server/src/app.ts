import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { errorHandler } from './middleware/error-handler';
import { authRoutes } from './routes/auth.routes';
import { resourcesRoutes } from './routes/resources.routes';
import { listsRoutes } from './routes/lists.routes';
import { executionsRoutes } from './routes/executions.routes';
import { importsRoutes } from './routes/imports.routes';
import { audioRoutes } from './routes/audio.routes';

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  }),
);
app.use('*', errorHandler);

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/resources', resourcesRoutes);
app.route('/api/lists', listsRoutes);
app.route('/api/executions', executionsRoutes);
app.route('/api/imports', importsRoutes);
app.route('/api/audio', audioRoutes);

export { app };
