import { Hono } from 'hono';

const audioRoutes = new Hono();

// GET /api/audio/:id  — proxy de Google Drive para evitar bloqueos CORS/403
audioRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const url = `https://drive.google.com/uc?export=open&id=${id}`;

  const response = await fetch(url, {
    headers: {
      // Simular un user-agent de navegador para evitar el bloqueo
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    return c.json({ error: 'Audio not found' }, 404);
  }

  const contentType = response.headers.get('content-type') ?? 'audio/mpeg';
  const buffer = await response.arrayBuffer();

  c.header('Content-Type', contentType);
  c.header('Cache-Control', 'public, max-age=86400');
  return c.body(buffer as any);
});

export { audioRoutes };
