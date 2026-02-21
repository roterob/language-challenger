import { db } from '../db/index';
import {
  executions,
  executionLists,
  executionResults,
  lists,
  listResources,
  resourceStats,
  listStats,
  userStats,
  resources,
} from '../db/schema';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import type { ExecutionConfigInput, SaveResultInput } from '@language-challenger/shared';

export const executionsService = {
  getExecutions(
    userId: string,
    filters: {
      tags?: string[];
      inProgress?: boolean;
      automatic?: boolean;
      from?: string;
      limit: number;
      offset: number;
    },
  ) {
    const conditions = [eq(executions.userId, userId)];

    if (filters.inProgress !== undefined) {
      conditions.push(eq(executions.inProgress, filters.inProgress));
    }

    if (filters.tags && filters.tags.length > 0) {
      for (const tag of filters.tags) {
        conditions.push(sql`${executions.tags} LIKE ${'%' + tag + '%'}`);
      }
    }

    if (filters.from) {
      conditions.push(sql`${executions.createdAt} >= ${filters.from}`);
    }

    if (filters.automatic !== undefined) {
      conditions.push(
        sql`json_extract(${executions.config}, '$.automaticMode') = ${filters.automatic ? 1 : 0}`,
      );
    }

    const where = and(...conditions);

    const items = db
      .select()
      .from(executions)
      .where(where)
      .limit(filters.limit)
      .offset(filters.offset)
      .orderBy(desc(executions.updatedAt))
      .all();

    const countResult = db
      .select({ count: sql<number>`count(*)` })
      .from(executions)
      .where(where)
      .get();

    // Enrich with list IDs
    const enrichedItems = items.map((exec) => {
      const execListIds = db
        .select({ listId: executionLists.listId })
        .from(executionLists)
        .where(eq(executionLists.executionId, exec.id))
        .all()
        .map((el) => el.listId);

      return {
        ...exec,
        tags: exec.tags ?? [],
        counters: exec.counters ?? { correct: 0, incorrect: 0, noExecuted: 0 },
        listIds: execListIds,
      };
    });

    return {
      executions: enrichedItems,
      total: countResult?.count ?? 0,
    };
  },

  getExecutionById(executionId: string, userId: string) {
    const exec = db
      .select()
      .from(executions)
      .where(and(eq(executions.id, executionId), eq(executions.userId, userId)))
      .get();

    if (!exec) {
      throw Object.assign(new Error('Execution not found'), { status: 404 });
    }

    const execListIds = db
      .select({ listId: executionLists.listId })
      .from(executionLists)
      .where(eq(executionLists.executionId, executionId))
      .all()
      .map((el) => el.listId);

    const results = db
      .select({
        id: executionResults.id,
        executionId: executionResults.executionId,
        resourceId: executionResults.resourceId,
        listId: executionResults.listId,
        result: executionResults.result,
        position: executionResults.position,
        resource: {
          id: resources.id,
          code: resources.code,
          type: resources.type,
          tags: resources.tags,
          contentEs: resources.contentEs,
          contentEsAudio: resources.contentEsAudio,
          contentEn: resources.contentEn,
          contentEnAudio: resources.contentEnAudio,
        },
      })
      .from(executionResults)
      .innerJoin(resources, eq(executionResults.resourceId, resources.id))
      .where(eq(executionResults.executionId, executionId))
      .orderBy(executionResults.position)
      .all();

    return {
      ...exec,
      tags: exec.tags ?? [],
      counters: exec.counters ?? { correct: 0, incorrect: 0, noExecuted: 0 },
      listIds: execListIds,
      results: results.map((r) => ({
        ...r,
        resource: { ...r.resource, tags: r.resource.tags ?? [] },
      })),
    };
  },

  startExecution(userId: string, listIds: string[]) {
    // Check if there's already an in-progress execution for these lists
    const existingExecs = db
      .select()
      .from(executions)
      .where(and(eq(executions.userId, userId), eq(executions.inProgress, true)))
      .all();

    for (const exec of existingExecs) {
      const execListIdRows = db
        .select({ listId: executionLists.listId })
        .from(executionLists)
        .where(eq(executionLists.executionId, exec.id))
        .all();
      const execListIds = execListIdRows.map((r) => r.listId).sort();

      if (JSON.stringify(execListIds) === JSON.stringify([...listIds].sort())) {
        return this.getExecutionById(exec.id, userId);
      }
    }

    // Get all lists with their resources
    const fetchedLists = listIds.map((lid) => {
      const list = db.select().from(lists).where(eq(lists.id, lid)).get();
      if (!list) throw Object.assign(new Error(`List ${lid} not found`), { status: 404 });

      const listResourceIds = db
        .select({ resourceId: listResources.resourceId })
        .from(listResources)
        .where(eq(listResources.listId, lid))
        .orderBy(listResources.position)
        .all();

      return { ...list, resources: listResourceIds.map((r) => r.resourceId) };
    });

    const name = fetchedLists.map((l) => l.name).join(' & ');
    const tags = [...new Set(fetchedLists.flatMap((l) => (l.tags as string[]) ?? []))];

    // Create execution
    const exec = db
      .insert(executions)
      .values({
        userId,
        name,
        tags,
        inProgress: true,
        loops: 0,
        currentIndex: 0,
        counters: { correct: 0, incorrect: 0, noExecuted: 0 },
      })
      .returning()
      .get();

    // Link lists
    for (const lid of listIds) {
      db.insert(executionLists).values({ executionId: exec.id, listId: lid }).run();
    }

    // Create results
    let position = 0;
    for (const list of fetchedLists) {
      for (const resourceId of list.resources) {
        db.insert(executionResults)
          .values({
            executionId: exec.id,
            resourceId,
            listId: list.id,
            result: null,
            position: position++,
          })
          .run();
      }
    }

    return this.getExecutionById(exec.id, userId);
  },

  startTemporary(userId: string, name: string, tags: string[], resourceIds: string[]) {
    const exec = db
      .insert(executions)
      .values({
        userId,
        name,
        tags,
        inProgress: true,
        loops: 0,
        currentIndex: 0,
        counters: { correct: 0, incorrect: 0, noExecuted: 0 },
      })
      .returning()
      .get();

    for (let i = 0; i < resourceIds.length; i++) {
      db.insert(executionResults)
        .values({
          executionId: exec.id,
          resourceId: resourceIds[i],
          listId: null,
          result: null,
          position: i,
        })
        .run();
    }

    return this.getExecutionById(exec.id, userId);
  },

  saveConfig(executionId: string, userId: string, config: ExecutionConfigInput) {
    const exec = db
      .select()
      .from(executions)
      .where(
        and(
          eq(executions.id, executionId),
          eq(executions.userId, userId),
          eq(executions.inProgress, true),
        ),
      )
      .get();

    if (!exec) {
      throw Object.assign(new Error('Execution not found or not in progress'), { status: 404 });
    }

    // If shuffle is enabled and no config existed before, shuffle the results
    if (!exec.config && config.shuffle) {
      const results = db
        .select()
        .from(executionResults)
        .where(eq(executionResults.executionId, executionId))
        .all();

      // Fisher-Yates shuffle
      const shuffled = [...results];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      for (let i = 0; i < shuffled.length; i++) {
        db.update(executionResults)
          .set({ position: i })
          .where(eq(executionResults.id, shuffled[i].id))
          .run();
      }
    }

    db.update(executions)
      .set({ config, updatedAt: new Date().toISOString() })
      .where(eq(executions.id, executionId))
      .run();

    return this.getExecutionById(executionId, userId);
  },

  saveResult(executionId: string, userId: string, data: SaveResultInput) {
    const exec = db
      .select()
      .from(executions)
      .where(
        and(
          eq(executions.id, executionId),
          eq(executions.userId, userId),
          eq(executions.inProgress, true),
        ),
      )
      .get();

    if (!exec) {
      throw Object.assign(new Error('Execution not found or not in progress'), { status: 404 });
    }

    // Find the result entry to update
    const resultEntry = db
      .select()
      .from(executionResults)
      .where(
        and(
          eq(executionResults.executionId, executionId),
          eq(executionResults.resourceId, data.resourceId),
          data.listId
            ? eq(executionResults.listId, data.listId)
            : sql`${executionResults.listId} IS NULL`,
        ),
      )
      .get();

    if (resultEntry) {
      db.update(executionResults)
        .set({ result: data.result })
        .where(eq(executionResults.id, resultEntry.id))
        .run();
    }

    // Update current index
    db.update(executions)
      .set({ currentIndex: data.currentIndex, updatedAt: new Date().toISOString() })
      .where(eq(executions.id, executionId))
      .run();

    // Update resource stats for non-null results
    if (data.result !== null) {
      this._updateResourceStats(userId, data.resourceId, data.result);
    }

    return { success: true };
  },

  restartExecution(executionId: string, userId: string) {
    const exec = db
      .select()
      .from(executions)
      .where(
        and(
          eq(executions.id, executionId),
          eq(executions.userId, userId),
          eq(executions.inProgress, true),
        ),
      )
      .get();

    if (!exec) {
      throw Object.assign(new Error('Execution not found or not in progress'), { status: 404 });
    }

    const newLoops = (exec.loops ?? 0) + 1;

    db.update(executions)
      .set({
        loops: newLoops,
        currentIndex: 0,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(executions.id, executionId))
      .run();

    return this.getExecutionById(executionId, userId);
  },

  finishExecution(executionId: string, userId: string) {
    const exec = db
      .select()
      .from(executions)
      .where(and(eq(executions.id, executionId), eq(executions.userId, userId)))
      .get();

    if (!exec) {
      throw Object.assign(new Error('Execution not found'), { status: 404 });
    }

    const results = db
      .select()
      .from(executionResults)
      .where(eq(executionResults.executionId, executionId))
      .all();

    // Calculate counters
    const listCounters: Record<string, { correct: number; incorrect: number; noExecuted: number }> =
      {};
    const totalCounters = { correct: 0, incorrect: 0, noExecuted: 0 };

    for (const r of results) {
      const key = r.listId || 'tempList';
      if (!listCounters[key]) {
        listCounters[key] = { correct: 0, incorrect: 0, noExecuted: 0 };
      }

      if (r.result === null) {
        listCounters[key].noExecuted += 1;
        totalCounters.noExecuted += 1;
      } else if (r.result) {
        listCounters[key].correct += 1;
        totalCounters.correct += 1;
      } else {
        listCounters[key].incorrect += 1;
        totalCounters.incorrect += 1;
      }
    }

    // Update list stats
    const execListIds = db
      .select({ listId: executionLists.listId })
      .from(executionLists)
      .where(eq(executionLists.executionId, executionId))
      .all();

    for (const { listId } of execListIds) {
      const counters = listCounters[listId];
      if (counters) {
        this._updateListStats(userId, listId, counters.correct, counters.incorrect);
      }
    }

    // Update user stats
    this._updateUserStats(userId, totalCounters.correct, totalCounters.incorrect);

    // Mark execution as finished
    db.update(executions)
      .set({
        inProgress: false,
        counters: totalCounters,
        currentIndex: 0,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(executions.id, executionId))
      .run();

    return this.getExecutionById(executionId, userId);
  },

  _updateResourceStats(userId: string, resourceId: string, result: boolean) {
    const existing = db
      .select()
      .from(resourceStats)
      .where(and(eq(resourceStats.userId, userId), eq(resourceStats.resourceId, resourceId)))
      .get();

    const now = new Date().toISOString();

    if (existing) {
      db.update(resourceStats)
        .set({
          executions: (existing.executions ?? 0) + 1,
          correct: (existing.correct ?? 0) + (result ? 1 : 0),
          incorrect: (existing.incorrect ?? 0) + (result ? 0 : 1),
          lastExec: now,
          lastResult: result,
        })
        .where(eq(resourceStats.id, existing.id))
        .run();
    } else {
      db.insert(resourceStats)
        .values({
          userId,
          resourceId,
          executions: 1,
          correct: result ? 1 : 0,
          incorrect: result ? 0 : 1,
          lastExec: now,
          lastResult: result,
          favourite: false,
        })
        .run();
    }
  },

  _updateListStats(userId: string, listId: string, correct: number, incorrect: number) {
    const existing = db
      .select()
      .from(listStats)
      .where(and(eq(listStats.userId, userId), eq(listStats.listId, listId)))
      .get();

    if (existing) {
      db.update(listStats)
        .set({
          executions: (existing.executions ?? 0) + 1,
          correct: (existing.correct ?? 0) + correct,
          incorrect: (existing.incorrect ?? 0) + incorrect,
        })
        .where(eq(listStats.id, existing.id))
        .run();
    } else {
      db.insert(listStats)
        .values({
          userId,
          listId,
          executions: 1,
          correct,
          incorrect,
        })
        .run();
    }
  },

  _updateUserStats(userId: string, correct: number, incorrect: number) {
    const existing = db.select().from(userStats).where(eq(userStats.userId, userId)).get();

    if (existing) {
      db.update(userStats)
        .set({
          executions: (existing.executions ?? 0) + 1,
          correct: (existing.correct ?? 0) + correct,
          incorrect: (existing.incorrect ?? 0) + incorrect,
        })
        .where(eq(userStats.id, existing.id))
        .run();
    } else {
      db.insert(userStats)
        .values({
          userId,
          executions: 1,
          correct,
          incorrect,
        })
        .run();
    }
  },
};
