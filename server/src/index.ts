import { serve } from '@hono/node-server';
import { app } from './app';

const port = parseInt(process.env.PORT || '3001', 10);

console.log(`🚀 Server starting on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`✅ Server running on http://localhost:${port}`);
console.log(`   Health check: http://localhost:${port}/api/health`);
