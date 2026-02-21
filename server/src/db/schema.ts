import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
  index,
  primaryKey,
} from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

// ────────────────────────────────────────────
// Users
// ────────────────────────────────────────────
export const users = sqliteTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  username: text('username').notNull().unique(),
  email: text('email'),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name'),
  avatar: text('avatar'),
  isAdmin: integer('is_admin', { mode: 'boolean' }).default(false),
  isGuest: integer('is_guest', { mode: 'boolean' }).default(false),
  uiSettings: text('ui_settings', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

// ────────────────────────────────────────────
// Resources
// ────────────────────────────────────────────
export const resources = sqliteTable(
  'resources',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    code: text('code').notNull().unique(),
    type: text('type', { enum: ['phrase', 'vocabulary', 'paragraph'] }).notNull(),
    tags: text('tags', { mode: 'json' }).$type<string[]>().default([]),
    contentEs: text('content_es'),
    contentEsAudio: text('content_es_audio'),
    contentEn: text('content_en'),
    contentEnAudio: text('content_en_audio'),
    createdAt: text('created_at').default(sql`(datetime('now'))`),
    updatedAt: text('updated_at').default(sql`(datetime('now'))`),
  },
  (table) => [
    index('idx_resources_code').on(table.code),
    index('idx_resources_type').on(table.type),
  ],
);

// ────────────────────────────────────────────
// Lists
// ────────────────────────────────────────────
export const lists = sqliteTable('lists', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  name: text('name').notNull(),
  tags: text('tags', { mode: 'json' }).$type<string[]>().default([]),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

// ────────────────────────────────────────────
// List Resources (N:M)
// ────────────────────────────────────────────
export const listResources = sqliteTable(
  'list_resources',
  {
    listId: text('list_id')
      .notNull()
      .references(() => lists.id, { onDelete: 'cascade' }),
    resourceId: text('resource_id')
      .notNull()
      .references(() => resources.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.listId, table.resourceId] }),
    index('idx_list_resources_list').on(table.listId),
  ],
);

// ────────────────────────────────────────────
// Executions
// ────────────────────────────────────────────
export const executions = sqliteTable(
  'executions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    name: text('name'),
    tags: text('tags', { mode: 'json' }).$type<string[]>().default([]),
    inProgress: integer('in_progress', { mode: 'boolean' }).default(true),
    loops: integer('loops').default(0),
    currentIndex: integer('current_index').default(0),
    config: text('config', { mode: 'json' }).$type<{
      questionLang: 'en' | 'es';
      playQuestion: boolean;
      playAnswer: boolean;
      writeAnswer: boolean;
      automaticMode: boolean;
      loopMode: boolean;
      shuffle: boolean;
    }>(),
    counters: text('counters', { mode: 'json' })
      .$type<{ correct: number; incorrect: number; noExecuted: number }>()
      .default({ correct: 0, incorrect: 0, noExecuted: 0 }),
    createdAt: text('created_at').default(sql`(datetime('now'))`),
    updatedAt: text('updated_at').default(sql`(datetime('now'))`),
  },
  (table) => [index('idx_executions_user').on(table.userId)],
);

// ────────────────────────────────────────────
// Execution Lists (N:M)
// ────────────────────────────────────────────
export const executionLists = sqliteTable(
  'execution_lists',
  {
    executionId: text('execution_id')
      .notNull()
      .references(() => executions.id, { onDelete: 'cascade' }),
    listId: text('list_id')
      .notNull()
      .references(() => lists.id),
  },
  (table) => [primaryKey({ columns: [table.executionId, table.listId] })],
);

// ────────────────────────────────────────────
// Execution Results
// ────────────────────────────────────────────
export const executionResults = sqliteTable(
  'execution_results',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    executionId: text('execution_id')
      .notNull()
      .references(() => executions.id, { onDelete: 'cascade' }),
    resourceId: text('resource_id')
      .notNull()
      .references(() => resources.id),
    listId: text('list_id').references(() => lists.id),
    result: integer('result', { mode: 'boolean' }),
    position: integer('position').notNull().default(0),
  },
  (table) => [index('idx_exec_results_execution').on(table.executionId)],
);

// ────────────────────────────────────────────
// Resource Stats
// ────────────────────────────────────────────
export const resourceStats = sqliteTable(
  'resource_stats',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    resourceId: text('resource_id')
      .notNull()
      .references(() => resources.id),
    executions: integer('executions').default(0),
    correct: integer('correct').default(0),
    incorrect: integer('incorrect').default(0),
    lastExec: text('last_exec'),
    lastResult: integer('last_result', { mode: 'boolean' }),
    favourite: integer('favourite', { mode: 'boolean' }).default(false),
  },
  (table) => [
    uniqueIndex('idx_resource_stats_unique').on(table.userId, table.resourceId),
    index('idx_resource_stats_user').on(table.userId),
  ],
);

// ────────────────────────────────────────────
// List Stats
// ────────────────────────────────────────────
export const listStats = sqliteTable(
  'list_stats',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    listId: text('list_id')
      .notNull()
      .references(() => lists.id),
    executions: integer('executions').default(0),
    correct: integer('correct').default(0),
    incorrect: integer('incorrect').default(0),
  },
  (table) => [
    uniqueIndex('idx_list_stats_unique').on(table.userId, table.listId),
    index('idx_list_stats_user').on(table.userId),
  ],
);

// ────────────────────────────────────────────
// User Stats
// ────────────────────────────────────────────
export const userStats = sqliteTable('user_stats', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id),
  executions: integer('executions').default(0),
  correct: integer('correct').default(0),
  incorrect: integer('incorrect').default(0),
});

// ────────────────────────────────────────────
// Import Tasks
// ────────────────────────────────────────────
export const importTasks = sqliteTable('import_tasks', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  fileName: text('file_name').notNull(),
  status: text('status', { enum: ['in_progress', 'finished', 'aborted'] })
    .notNull()
    .default('in_progress'),
  progress: integer('progress').default(0),
  total: integer('total').default(0),
  errorMsg: text('error_msg'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
  finishedAt: text('finished_at'),
});
