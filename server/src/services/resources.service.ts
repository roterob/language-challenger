import { db } from '../db/index';
import { resources, resourceStats } from '../db/schema';
import { eq, like, and, inArray, sql, desc, asc } from 'drizzle-orm';
import type { SaveResourceInput } from '@language-challenger/shared';

export const resourcesService = {
  getResources(filters: {
    tags?: string[];
    type?: string;
    search?: string;
    limit: number;
    offset: number;
  }) {
    const conditions = [];

    if (filters.type) {
      conditions.push(eq(resources.type, filters.type as 'phrase' | 'vocabulary' | 'paragraph'));
    }

    if (filters.search) {
      conditions.push(
        sql`(${resources.contentEs} LIKE ${'%' + filters.search + '%'} OR ${resources.contentEn} LIKE ${'%' + filters.search + '%'} OR ${resources.code} LIKE ${'%' + filters.search + '%'})`,
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      for (const tag of filters.tags) {
        conditions.push(sql`${resources.tags} LIKE ${'%' + tag + '%'}`);
      }
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const items = db
      .select()
      .from(resources)
      .where(where)
      .limit(filters.limit)
      .offset(filters.offset)
      .orderBy(desc(resources.createdAt))
      .all();

    const countResult = db
      .select({ count: sql<number>`count(*)` })
      .from(resources)
      .where(where)
      .get();

    return {
      items: items.map((r) => ({
        ...r,
        tags: r.tags ?? [],
      })),
      total: countResult?.count ?? 0,
    };
  },

  getResourceById(id: string) {
    const resource = db.select().from(resources).where(eq(resources.id, id)).get();
    if (!resource) {
      throw Object.assign(new Error('Resource not found'), { status: 404 });
    }
    return { ...resource, tags: resource.tags ?? [] };
  },

  saveResource(id: string | undefined, data: SaveResourceInput) {
    const now = new Date().toISOString();

    if (id) {
      db.update(resources)
        .set({
          code: data.code,
          type: data.type,
          tags: data.tags,
          contentEs: data.contentEs,
          contentEsAudio: data.contentEsAudio,
          contentEn: data.contentEn,
          contentEnAudio: data.contentEnAudio,
          updatedAt: now,
        })
        .where(eq(resources.id, id))
        .run();

      return this.getResourceById(id);
    } else {
      const result = db
        .insert(resources)
        .values({
          code: data.code,
          type: data.type,
          tags: data.tags,
          contentEs: data.contentEs,
          contentEsAudio: data.contentEsAudio,
          contentEn: data.contentEn,
          contentEnAudio: data.contentEnAudio,
        })
        .returning()
        .get();

      return { ...result, tags: result.tags ?? [] };
    }
  },

  deleteResource(id: string) {
    const resource = db.select().from(resources).where(eq(resources.id, id)).get();
    if (!resource) {
      throw Object.assign(new Error('Resource not found'), { status: 404 });
    }

    db.delete(resources).where(eq(resources.id, id)).run();
    return { success: true };
  },

  toggleFavourite(userId: string, resourceId: string) {
    // Verify resource exists
    const resource = db.select().from(resources).where(eq(resources.id, resourceId)).get();
    if (!resource) {
      throw Object.assign(new Error('Resource not found'), { status: 404 });
    }

    const existing = db
      .select()
      .from(resourceStats)
      .where(and(eq(resourceStats.userId, userId), eq(resourceStats.resourceId, resourceId)))
      .get();

    if (existing) {
      db.update(resourceStats)
        .set({ favourite: !existing.favourite })
        .where(eq(resourceStats.id, existing.id))
        .run();

      return { favourite: !existing.favourite };
    } else {
      db.insert(resourceStats)
        .values({
          userId,
          resourceId,
          executions: 0,
          correct: 0,
          incorrect: 0,
          favourite: true,
        })
        .run();

      return { favourite: true };
    }
  },

  getResourceStats(
    userId: string,
    filters: {
      tags?: string[];
      type?: string;
      favourite?: boolean;
      result?: 'passed' | 'failed';
      from?: string;
      limit: number;
      offset: number;
    },
  ) {
    const conditions = [eq(resourceStats.userId, userId)];

    if (filters.type) {
      conditions.push(eq(resources.type, filters.type as 'phrase' | 'vocabulary' | 'paragraph'));
    }

    if (filters.tags && filters.tags.length > 0) {
      for (const tag of filters.tags) {
        conditions.push(sql`${resources.tags} LIKE ${'%' + tag + '%'}`);
      }
    }

    if (filters.favourite !== undefined) {
      conditions.push(eq(resourceStats.favourite, filters.favourite));
    }

    if (filters.result === 'passed') {
      conditions.push(eq(resourceStats.lastResult, true));
    } else if (filters.result === 'failed') {
      conditions.push(eq(resourceStats.lastResult, false));
    }

    if (filters.from) {
      conditions.push(sql`${resourceStats.lastExec} >= ${filters.from}`);
    }

    const where = and(...conditions);

    const items = db
      .select({
        id: resourceStats.id,
        userId: resourceStats.userId,
        resourceId: resourceStats.resourceId,
        executions: resourceStats.executions,
        correct: resourceStats.correct,
        incorrect: resourceStats.incorrect,
        lastExec: resourceStats.lastExec,
        lastResult: resourceStats.lastResult,
        favourite: resourceStats.favourite,
        resource: {
          id: resources.id,
          code: resources.code,
          type: resources.type,
          tags: resources.tags,
          contentEs: resources.contentEs,
          contentEsAudio: resources.contentEsAudio,
          contentEn: resources.contentEn,
          contentEnAudio: resources.contentEnAudio,
          createdAt: resources.createdAt,
          updatedAt: resources.updatedAt,
        },
      })
      .from(resourceStats)
      .innerJoin(resources, eq(resourceStats.resourceId, resources.id))
      .where(where)
      .limit(filters.limit)
      .offset(filters.offset)
      .orderBy(desc(resourceStats.lastExec))
      .all();

    const countResult = db
      .select({ count: sql<number>`count(*)` })
      .from(resourceStats)
      .innerJoin(resources, eq(resourceStats.resourceId, resources.id))
      .where(where)
      .get();

    return {
      items,
      total: countResult?.count ?? 0,
    };
  },
};
