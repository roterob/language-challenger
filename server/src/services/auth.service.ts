import { db } from '../db/index';
import { users, userStats } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { signToken } from '../middleware/auth';

const SALT_ROUNDS = 10;

export const authService = {
  async login(username: string, password: string) {
    const user = db.select().from(users).where(eq(users.username, username)).get();

    if (!user) {
      throw Object.assign(new Error('Invalid username or password'), { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw Object.assign(new Error('Invalid username or password'), { status: 401 });
    }

    const token = signToken({ userId: user.id, username: user.username });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified ?? false,
        displayName: user.displayName,
        avatar: user.avatar,
        isAdmin: user.isAdmin ?? false,
        isGuest: user.isGuest ?? false,
        createdAt: user.createdAt!,
        updatedAt: user.updatedAt!,
      },
    };
  },

  async getMe(userId: string) {
    const user = db.select().from(users).where(eq(users.id, userId)).get();

    if (!user) {
      throw Object.assign(new Error('User not found'), { status: 404 });
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      emailVerified: user.emailVerified ?? false,
      displayName: user.displayName,
      avatar: user.avatar,
      isAdmin: user.isAdmin ?? false,
      isGuest: user.isGuest ?? false,
      uiSettings: user.uiSettings,
      createdAt: user.createdAt!,
      updatedAt: user.updatedAt!,
    };
  },

  async updateUISettings(userId: string, uiSettings: Record<string, unknown>) {
    db.update(users)
      .set({ uiSettings, updatedAt: new Date().toISOString() })
      .where(eq(users.id, userId))
      .run();

    return { success: true };
  },

  async getUserStats(userId: string) {
    let stats = db.select().from(userStats).where(eq(userStats.userId, userId)).get();

    if (!stats) {
      const result = db
        .insert(userStats)
        .values({ userId, executions: 0, correct: 0, incorrect: 0 })
        .returning()
        .get();
      stats = result;
    }

    return stats;
  },
};
