import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'language-challenger-secret-key-change-in-production';

export interface JwtPayload {
  userId: string;
  username: string;
}

export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing or invalid token' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const payload = verifyToken(token);
    c.set('userId', payload.userId);
    c.set('username', payload.username);
    await next();
  } catch {
    return c.json({ error: 'Unauthorized: Invalid or expired token' }, 401);
  }
};
