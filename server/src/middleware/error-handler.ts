import { Context, Next } from 'hono';

export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (err) {
    console.error('Unhandled error:', err);

    if (err instanceof Error) {
      const status = (err as { status?: number }).status || 500;
      return c.json(
        {
          error: err.message || 'Internal Server Error',
        },
        status as 200,
      );
    }

    return c.json({ error: 'Internal Server Error' }, 500);
  }
};
