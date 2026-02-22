import { Hono } from 'hono';
import https from 'node:https';

const audioRoutes = new Hono();

// Agente que ignora errores de certificado (proxy corporativo / cert autofirmado)
const tlsAgent = new https.Agent({ rejectUnauthorized: false });

function fetchWithAgent(
  url: string,
): Promise<{ status: number; headers: Record<string, string>; buffer: Buffer }> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { agent: tlsAgent, headers: { 'User-Agent': 'Mozilla/5.0' } },
      (res) => {
        // Seguir redirecciones manualmente
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          return fetchWithAgent(res.headers.location).then(resolve).catch(reject);
        }
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            status: res.statusCode ?? 200,
            headers: res.headers as Record<string, string>,
            buffer: Buffer.concat(chunks),
          });
        });
        res.on('error', reject);
      },
    );
    req.on('error', reject);
  });
}

// GET /api/audio/:id  — proxy de Google Drive para evitar bloqueos CORS/403
audioRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const url = `https://drive.google.com/uc?export=open&id=${id}`;

  try {
    const { status, headers, buffer } = await fetchWithAgent(url);

    if (status < 200 || status >= 300) {
      return c.json({ error: 'Audio not found' }, 404);
    }

    const contentType = headers['content-type'] ?? 'audio/mpeg';
    c.header('Content-Type', contentType);
    c.header('Cache-Control', 'public, max-age=86400');
    return c.body(buffer as any);
  } catch (e: any) {
    console.error('[audio proxy] error:', e.message);
    return c.json({ error: 'Failed to fetch audio' }, 500);
  }
});

export { audioRoutes };
