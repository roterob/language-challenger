import { db } from '../db/index';
import { importTasks, resources } from '../db/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { readFileSync, unlinkSync } from 'fs';

export const importsService = {
  async uploadAndImport(filePath: string, fileName: string) {
    // Create task
    const task = db
      .insert(importTasks)
      .values({
        fileName,
        status: 'in_progress',
        progress: 0,
        total: 0,
      })
      .returning()
      .get();

    // Process async
    setImmediate(() => {
      this._processImport(task.id, filePath).catch((err) => {
        console.error('Import failed:', err);
        db.update(importTasks)
          .set({
            status: 'aborted',
            errorMsg: err.message,
            updatedAt: new Date().toISOString(),
            finishedAt: new Date().toISOString(),
          })
          .where(eq(importTasks.id, task.id))
          .run();
      });
    });

    return task;
  },

  async _processImport(taskId: string, filePath: string) {
    try {
      const fileContent = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent) as Array<{
        code?: string;
        resourceCode?: string;
        type: string;
        tags?: string[];
        info?: { es?: { text?: string; audio?: string }; en?: { text?: string; audio?: string } };
        content_es?: string;
        content_en?: string;
        content_es_audio?: string;
        content_en_audio?: string;
      }>;

      if (!Array.isArray(data)) {
        throw new Error('Invalid JSON: expected an array');
      }

      db.update(importTasks)
        .set({ total: data.length, updatedAt: new Date().toISOString() })
        .where(eq(importTasks.id, taskId))
        .run();

      for (let i = 0; i < data.length; i++) {
        const item = data[i];

        const code = item.code || item.resourceCode || `IMP-${Date.now()}-${i}`;
        const type = item.type as 'phrase' | 'vocabulary' | 'paragraph';
        const tags = item.tags ?? [];

        // Support both old Meteor format (info.es.text/info.en.text) and new format
        const contentEs = item.info?.es?.text ?? item.content_es ?? null;
        const contentEn = item.info?.en?.text ?? item.content_en ?? null;
        const contentEsAudio = item.info?.es?.audio ?? item.content_es_audio ?? null;
        const contentEnAudio = item.info?.en?.audio ?? item.content_en_audio ?? null;

        // Upsert: insert or update on conflict
        const existing = db.select().from(resources).where(eq(resources.code, code)).get();

        if (existing) {
          db.update(resources)
            .set({
              type,
              tags,
              contentEs,
              contentEn,
              contentEsAudio,
              contentEnAudio,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(resources.id, existing.id))
            .run();
        } else {
          db.insert(resources)
            .values({ code, type, tags, contentEs, contentEn, contentEsAudio, contentEnAudio })
            .run();
        }

        // Update progress every 50 items
        if ((i + 1) % 50 === 0 || i === data.length - 1) {
          db.update(importTasks)
            .set({ progress: i + 1, updatedAt: new Date().toISOString() })
            .where(eq(importTasks.id, taskId))
            .run();
        }
      }

      db.update(importTasks)
        .set({
          status: 'finished',
          progress: data.length,
          updatedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
        })
        .where(eq(importTasks.id, taskId))
        .run();

      // Clean up file
      try {
        unlinkSync(filePath);
      } catch {
        // Ignore cleanup errors
      }
    } catch (err) {
      db.update(importTasks)
        .set({
          status: 'aborted',
          errorMsg: (err as Error).message,
          updatedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
        })
        .where(eq(importTasks.id, taskId))
        .run();
    }
  },

  getActiveTasks() {
    return db
      .select()
      .from(importTasks)
      .where(eq(importTasks.status, 'in_progress'))
      .orderBy(desc(importTasks.createdAt))
      .all();
  },

  getTasks(limit = 50) {
    return db
      .select()
      .from(importTasks)
      .orderBy(desc(importTasks.createdAt))
      .limit(limit)
      .all();
  },

  getTaskById(taskId: string) {
    const task = db.select().from(importTasks).where(eq(importTasks.id, taskId)).get();
    if (!task) {
      throw Object.assign(new Error('Task not found'), { status: 404 });
    }
    return task;
  },
};
