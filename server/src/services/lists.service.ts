import { db } from '../db/index';
import { lists, listResources, listStats, resources } from '../db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import type { SaveListInput } from '@language-challenger/shared';

function parseTags(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'string') {
    try {
      return JSON.parse(tags);
    } catch {
      return [];
    }
  }
  return [];
}

export const listsService = {
  getLists(
    userId: string,
    filters: {
      tags?: string[];
      search?: string;
      limit: number;
      offset: number;
    },
  ) {
    const conditions = [];

    if (filters.search) {
      conditions.push(sql`${lists.name} LIKE ${'%' + filters.search + '%'}`);
    }

    if (filters.tags && filters.tags.length > 0) {
      for (const tag of filters.tags) {
        conditions.push(sql`${lists.tags} LIKE ${`%"${tag}"%`}`);
      }
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const items = db
      .select()
      .from(lists)
      .where(where)
      .limit(filters.limit)
      .offset(filters.offset)
      .orderBy(desc(lists.createdAt))
      .all();

    const countResult = db
      .select({ count: sql<number>`count(*)` })
      .from(lists)
      .where(where)
      .get();

    // Fetch stats and resources for each list
    const enrichedItems = items.map((list) => {
      const stats = db
        .select()
        .from(listStats)
        .where(and(eq(listStats.userId, userId), eq(listStats.listId, list.id)))
        .get();

      const resourceIds = db
        .select({ resourceId: listResources.resourceId })
        .from(listResources)
        .where(eq(listResources.listId, list.id))
        .orderBy(listResources.position)
        .all()
        .map((r) => r.resourceId);

      return {
        ...list,
        tags: parseTags(list.tags),
        resources: resourceIds,
        stats: stats ?? null,
      };
    });

    return {
      lists: enrichedItems,
      total: countResult?.count ?? 0,
    };
  },

  getListById(id: string) {
    const list = db.select().from(lists).where(eq(lists.id, id)).get();
    if (!list) {
      throw Object.assign(new Error('List not found'), { status: 404 });
    }

    const resourceIds = db
      .select({ resourceId: listResources.resourceId })
      .from(listResources)
      .where(eq(listResources.listId, id))
      .orderBy(listResources.position)
      .all()
      .map((r) => r.resourceId);

    return {
      ...list,
      tags: parseTags(list.tags),
      resources: resourceIds,
    };
  },

  saveList(id: string | undefined, data: SaveListInput) {
    const now = new Date().toISOString();

    if (id) {
      // Update
      db.update(lists)
        .set({ name: data.name, tags: data.tags, updatedAt: now })
        .where(eq(lists.id, id))
        .run();

      // Sync resources
      db.delete(listResources).where(eq(listResources.listId, id)).run();
      for (let i = 0; i < data.resources.length; i++) {
        db.insert(listResources)
          .values({
            listId: id,
            resourceId: data.resources[i],
            position: i,
          })
          .run();
      }

      return this.getListById(id);
    } else {
      // Create
      const list = db.insert(lists).values({ name: data.name, tags: data.tags }).returning().get();

      for (let i = 0; i < data.resources.length; i++) {
        db.insert(listResources)
          .values({
            listId: list.id,
            resourceId: data.resources[i],
            position: i,
          })
          .run();
      }

      return this.getListById(list.id);
    }
  },

  getListResources(listId: string) {
    const items = db
      .select({
        resource: resources,
        position: listResources.position,
      })
      .from(listResources)
      .innerJoin(resources, eq(listResources.resourceId, resources.id))
      .where(eq(listResources.listId, listId))
      .orderBy(listResources.position)
      .all();

    return items.map((item) => ({
      ...item.resource,
      tags: item.resource.tags ?? [],
      position: item.position,
    }));
  },

  getAvailableTags(): string[] {
    const rows = db.select({ tags: lists.tags }).from(lists).all();
    const allTags = new Set<string>();
    for (const row of rows) {
      parseTags(row.tags).forEach((t) => allTags.add(t));
    }
    return Array.from(allTags).sort();
  },
};
