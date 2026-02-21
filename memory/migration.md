# Plan de Migración: Meteor → Vite + React + TypeScript + Tailwind + SQLite

> Fecha: 21 de febrero de 2026  
> Proyecto: Language Challenger  
> Estado actual: Meteor.js + MongoDB + React 16 + Ant Design v3 + LESS  
> Estado objetivo: Vite + React 18+ + TypeScript + Tailwind CSS + SQLite

---

## Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Decisiones de Arquitectura](#2-decisiones-de-arquitectura)
3. [Stack Objetivo](#3-stack-objetivo)
4. [Esquema de Base de Datos SQLite](#4-esquema-de-base-de-datos-sqlite)
5. [Estructura del Proyecto Migrado](#5-estructura-del-proyecto-migrado)
6. [Fases de Migración](#6-fases-de-migración)
7. [Detalle por Fase](#7-detalle-por-fase)
8. [Mapeo de Funcionalidades](#8-mapeo-de-funcionalidades)
9. [Riesgos y Mitigaciones](#9-riesgos-y-mitigaciones)

---

## 1. Resumen Ejecutivo

La migración elimina completamente Meteor.js como framework full-stack y lo reemplaza por una arquitectura moderna desacoplada:

- **Frontend**: SPA con Vite + React + TypeScript + Tailwind CSS
- **Backend**: API REST con Node.js + Express/Hono + TypeScript
- **Base de datos**: SQLite con Drizzle ORM (o better-sqlite3 directo)
- **Autenticación**: JWT (JSON Web Tokens)
- **Reactividad**: Se reemplaza DDP por polling o WebSockets con Socket.io (solo donde se necesite reactividad real, como el progreso de importación)

### ¿Por qué SQLite?

- Sin necesidad de servidor de base de datos externo
- Perfecto para aplicación single-user o pocos usuarios concurrentes
- Rendimiento excelente para lectura
- Portable y fácil de respaldar (un solo archivo)
- Compatible con Drizzle ORM para type-safety

---

## 2. Decisiones de Arquitectura

| Decisión       | Elección                     | Justificación                                      |
| -------------- | ---------------------------- | -------------------------------------------------- |
| Bundler        | Vite                         | Rápido, HMR nativo, estándar actual                |
| UI Framework   | React 18+                    | Continuidad; hooks modernos                        |
| Lenguaje       | TypeScript                   | Tipado estático, mejor DX                          |
| Estilos        | Tailwind CSS v4              | Utility-first, sin dependencia de LESS             |
| Componentes UI | shadcn/ui                    | Componentes copiables, basados en Radix + Tailwind |
| Routing        | React Router v6              | Versión moderna con loaders/actions                |
| Estado global  | Zustand                      | Ligero, sin boilerplate                            |
| Data fetching  | TanStack Query (React Query) | Cache, revalidación, loading/error states          |
| Backend        | Hono                         | Ligero, TypeScript-first, similar a Express        |
| ORM            | Drizzle ORM                  | Type-safe, ligero, excelente soporte SQLite        |
| Auth           | JWT + bcrypt                 | Simple, stateless, sin dependencia de Meteor       |
| Gráficos       | Recharts                     | Mantener; ya está en el proyecto                   |
| Validación     | Zod                          | Reemplaza simpl-schema, integración con TypeScript |
| File upload    | multer o similar             | Reemplaza ostrio:files                             |
| Testing        | Vitest + Cypress             | Vitest para unit, Cypress para E2E                 |

---

## 3. Stack Objetivo

```
┌───────────────────────────────────────────────────┐
│              FRONTEND (SPA - Vite)                │
│  React 18 + TypeScript + Tailwind CSS             │
│  shadcn/ui + React Router v6 + TanStack Query     │
│  Zustand (estado global) + Recharts (gráficos)    │
└──────────────────────┬────────────────────────────┘
                       │ HTTP (REST API) + WebSocket
┌──────────────────────▼────────────────────────────┐
│              BACKEND (Node.js - Hono)             │
│  TypeScript + Drizzle ORM + Zod                   │
│  JWT Auth + bcrypt + multer                       │
└──────────────────────┬────────────────────────────┘
                       │
┌──────────────────────▼────────────────────────────┐
│              SQLite (archivo local)               │
│  via better-sqlite3 + Drizzle ORM                 │
└───────────────────────────────────────────────────┘
```

---

## 4. Esquema de Base de Datos SQLite

### 4.1 Tabla `users`

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  email_verified INTEGER DEFAULT 0,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  avatar TEXT,
  is_admin INTEGER DEFAULT 0,
  is_guest INTEGER DEFAULT 0,
  ui_settings TEXT, -- JSON serializado
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### 4.2 Tabla `resources`

```sql
CREATE TABLE resources (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('phrase', 'vocabulary', 'paragraph')),
  tags TEXT, -- JSON array serializado: '["tag1","tag2"]'
  content_es TEXT,
  content_es_audio TEXT,
  content_en TEXT,
  content_en_audio TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_resources_code ON resources(code);
CREATE INDEX idx_resources_type ON resources(type);
```

### 4.3 Tabla `lists`

```sql
CREATE TABLE lists (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  name TEXT NOT NULL,
  tags TEXT, -- JSON array
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### 4.4 Tabla `list_resources` (relación N:M)

```sql
CREATE TABLE list_resources (
  list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (list_id, resource_id)
);

CREATE INDEX idx_list_resources_list ON list_resources(list_id);
```

### 4.5 Tabla `executions`

```sql
CREATE TABLE executions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT,
  tags TEXT, -- JSON array
  in_progress INTEGER DEFAULT 1,
  loops INTEGER DEFAULT 0,
  current_index INTEGER DEFAULT 0,
  config TEXT, -- JSON: {direction, playQuestion, playAnswer, writeAnswer, automaticMode, loop, shuffle}
  counters TEXT, -- JSON: {correct, incorrect, noExecuted}
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_executions_user ON executions(user_id);
```

### 4.6 Tabla `execution_lists` (relación N:M)

```sql
CREATE TABLE execution_lists (
  execution_id TEXT NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  list_id TEXT NOT NULL REFERENCES lists(id),
  PRIMARY KEY (execution_id, list_id)
);
```

### 4.7 Tabla `execution_results`

```sql
CREATE TABLE execution_results (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  execution_id TEXT NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES resources(id),
  list_id TEXT REFERENCES lists(id),
  result INTEGER, -- NULL=no ejecutado, 1=correcto, 0=incorrecto
  position INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_exec_results_execution ON execution_results(execution_id);
```

### 4.8 Tabla `resource_stats`

```sql
CREATE TABLE resource_stats (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  user_id TEXT NOT NULL REFERENCES users(id),
  resource_id TEXT NOT NULL REFERENCES resources(id),
  executions INTEGER DEFAULT 0,
  correct INTEGER DEFAULT 0,
  incorrect INTEGER DEFAULT 0,
  last_exec TEXT,
  last_result INTEGER,
  favourite INTEGER DEFAULT 0,
  UNIQUE(user_id, resource_id)
);

CREATE INDEX idx_resource_stats_user ON resource_stats(user_id);
```

### 4.9 Tabla `list_stats`

```sql
CREATE TABLE list_stats (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  user_id TEXT NOT NULL REFERENCES users(id),
  list_id TEXT NOT NULL REFERENCES lists(id),
  executions INTEGER DEFAULT 0,
  correct INTEGER DEFAULT 0,
  incorrect INTEGER DEFAULT 0,
  UNIQUE(user_id, list_id)
);

CREATE INDEX idx_list_stats_user ON list_stats(user_id);
```

### 4.10 Tabla `user_stats`

```sql
CREATE TABLE user_stats (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
  executions INTEGER DEFAULT 0,
  correct INTEGER DEFAULT 0,
  incorrect INTEGER DEFAULT 0
);
```

### 4.11 Tabla `import_tasks`

```sql
CREATE TABLE import_tasks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
  file_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'finished', 'aborted')),
  progress INTEGER DEFAULT 0,
  total INTEGER DEFAULT 0,
  error_msg TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  finished_at TEXT
);
```

> **Nota:** La vista MongoDB `ResourceStatsView` se reemplaza por un JOIN SQL en las queries. No se necesita materializar.

---

## 5. Estructura del Proyecto Migrado

```
language-challenger/
├── memory/                          # Documentación del proyecto
│   ├── constitution.md
│   └── migration.md
├── packages/
│   └── shared/                      # Tipos y utilidades compartidas
│       ├── src/
│       │   ├── types/
│       │   │   ├── user.ts
│       │   │   ├── resource.ts
│       │   │   ├── list.ts
│       │   │   ├── execution.ts
│       │   │   └── import.ts
│       │   ├── schemas/              # Zod schemas (reemplazan simpl-schema)
│       │   │   ├── user.schema.ts
│       │   │   ├── resource.schema.ts
│       │   │   ├── list.schema.ts
│       │   │   └── execution.schema.ts
│       │   └── utils/
│       │       ├── date-helpers.ts
│       │       ├── type-colors.ts
│       │       ├── get-audio-link.ts
│       │       └── build-filters.ts
│       ├── package.json
│       └── tsconfig.json
├── server/                           # Backend API
│   ├── src/
│   │   ├── index.ts                  # Entry point
│   │   ├── app.ts                    # Hono app setup
│   │   ├── db/
│   │   │   ├── schema.ts            # Drizzle schema definitions
│   │   │   ├── index.ts             # Database connection
│   │   │   ├── migrate.ts           # Migrations runner
│   │   │   └── seed.ts              # Seeds (reemplaza fixtures)
│   │   ├── middleware/
│   │   │   ├── auth.ts              # JWT middleware
│   │   │   └── error-handler.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── users.routes.ts
│   │   │   ├── resources.routes.ts
│   │   │   ├── lists.routes.ts
│   │   │   ├── executions.routes.ts
│   │   │   └── imports.routes.ts
│   │   └── services/
│   │       ├── auth.service.ts
│   │       ├── users.service.ts
│   │       ├── resources.service.ts
│   │       ├── lists.service.ts
│   │       ├── executions.service.ts
│   │       └── imports.service.ts
│   ├── drizzle/                      # Drizzle migrations
│   │   └── *.sql
│   ├── data/
│   │   └── language-challenger.db    # SQLite database file
│   ├── uploads/                      # Temporal para archivos JSON
│   ├── package.json
│   ├── tsconfig.json
│   └── drizzle.config.ts
├── client/                           # Frontend SPA
│   ├── src/
│   │   ├── main.tsx                  # Entry point
│   │   ├── App.tsx                   # Root component + Router
│   │   ├── index.css                # Tailwind imports
│   │   ├── lib/
│   │   │   ├── api.ts               # API client (fetch wrapper)
│   │   │   ├── auth.ts              # Auth context + JWT management
│   │   │   └── utils.ts             # cn() y utilidades
│   │   ├── hooks/
│   │   │   ├── use-auth.ts
│   │   │   ├── use-resources.ts     # TanStack Query hooks
│   │   │   ├── use-lists.ts
│   │   │   ├── use-executions.ts
│   │   │   ├── use-imports.ts
│   │   │   ├── use-event-listener.ts
│   │   │   └── use-timeout.ts
│   │   ├── stores/
│   │   │   └── app.store.ts         # Zustand store (reemplaza ReactiveVar)
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── form.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── switch.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── progress.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── avatar.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   └── ... (más según necesidad)
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── UserMenu.tsx
│   │   │   ├── AudioPlayer.tsx
│   │   │   ├── StatChart.tsx
│   │   │   ├── SearchTagBar.tsx
│   │   │   ├── ResourceForm.tsx
│   │   │   ├── ResourceFormModal.tsx
│   │   │   ├── ListForm.tsx
│   │   │   ├── ListFormModal.tsx
│   │   │   └── execution/
│   │   │       ├── ListExecution.tsx
│   │   │       ├── ConfigForm.tsx
│   │   │       ├── ExecutionContent.tsx
│   │   │       └── ExecutionResult.tsx
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ExecutionsPage.tsx
│   │   │   ├── ResourcesPage.tsx
│   │   │   ├── ListsPage.tsx
│   │   │   └── ImportsPage.tsx
│   │   └── types/                    # Re-export de shared types
│   │       └── index.ts
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── postcss.config.js
├── package.json                      # Workspace root (pnpm workspaces)
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── cypress/                          # E2E tests (mantenido)
    ├── e2e/
    ├── support/
    └── cypress.config.ts
```

---

## 6. Fases de Migración

### Visión General

| Fase | Nombre                        | Duración Est. | Dependencias |
| ---- | ----------------------------- | ------------- | ------------ |
| 0    | Preparación del workspace     | 1 día         | —            |
| 1    | Backend: Esquema y DB         | 2 días        | Fase 0       |
| 2    | Backend: Autenticación        | 1 día         | Fase 1       |
| 3    | Backend: API de Resources     | 1-2 días      | Fase 2       |
| 4    | Backend: API de Lists         | 1 día         | Fase 3       |
| 5    | Backend: API de Executions    | 2-3 días      | Fase 4       |
| 6    | Backend: API de Imports       | 1 día         | Fase 3       |
| 7    | Frontend: Setup + Layout      | 1-2 días      | Fase 2       |
| 8    | Frontend: Login               | 0.5 días      | Fase 7       |
| 9    | Frontend: Página Resources    | 1-2 días      | Fase 7, 3    |
| 10   | Frontend: Página Lists        | 1-2 días      | Fase 9, 4    |
| 11   | Frontend: Página Executions   | 3-4 días      | Fase 10, 5   |
| 12   | Frontend: Página Imports      | 1 día         | Fase 7, 6    |
| 13   | Frontend: ListExecution modal | 2-3 días      | Fase 11      |
| 14   | Seeds y datos de migración    | 1 día         | Fase 5       |
| 15   | Testing E2E                   | 2 días        | Todas        |
| 16   | Pulido y limpieza             | 1-2 días      | Todas        |

**Duración total estimada: 20-30 días de trabajo**

---

## 7. Detalle por Fase

### Fase 0: Preparación del Workspace

**Objetivo:** Configurar el monorepo y herramientas base.

**Tareas:**

1. Crear `pnpm-workspace.yaml` con packages: `client`, `server`, `packages/shared`
2. Inicializar `tsconfig.base.json` con configuración TypeScript compartida
3. Configurar ESLint + Prettier para TypeScript
4. Crear `.gitignore` actualizado
5. **NO eliminar** el código de Meteor todavía — mantenerlo como referencia

**Archivos a crear:**

- `pnpm-workspace.yaml`
- `tsconfig.base.json`
- `.eslintrc.cjs`
- `.prettierrc`

---

### Fase 1: Backend — Esquema y Base de Datos

**Objetivo:** Crear el esquema SQLite con Drizzle ORM.

**Tareas:**

1. Inicializar `server/package.json` con dependencias:
   - `hono`, `@hono/node-server`
   - `drizzle-orm`, `drizzle-kit`, `better-sqlite3`
   - `zod`, `bcrypt`, `jsonwebtoken`
2. Crear `server/src/db/schema.ts` con las definiciones de Drizzle para todas las tablas (ver sección 4)
3. Crear `server/src/db/index.ts` — conexión a SQLite
4. Crear `drizzle.config.ts`
5. Generar y ejecutar la migración inicial
6. Crear `server/src/db/seed.ts` — equivalente a fixtures + migraciones:
   - Crear usuario admin y guest
   - En dev: crear 200 recursos y 50 listas de prueba

**Mapeo Meteor → Drizzle:**

| Meteor (MongoDB)                    | Drizzle (SQLite)                           |
| ----------------------------------- | ------------------------------------------ |
| `new Mongo.Collection('Resources')` | `sqliteTable('resources', {...})`          |
| Schema SimpleSchema                 | Zod schema + Drizzle schema                |
| `collection.insert()`               | `db.insert(table).values()`                |
| `collection.update()`               | `db.update(table).set().where()`           |
| `collection.find()`                 | `db.select().from(table).where()`          |
| `collection.findOne()`              | `db.select().from(table).where().limit(1)` |
| MongoDB `$in`                       | `inArray(column, values)`                  |
| MongoDB `$regex`                    | `like(column, '%value%')`                  |

---

### Fase 2: Backend — Autenticación

**Objetivo:** Implementar login/logout con JWT.

**Tareas:**

1. Crear `server/src/middleware/auth.ts`:
   - Middleware que verifica JWT en header `Authorization: Bearer <token>`
   - Extrae `userId` y lo inyecta en el contexto de Hono
2. Crear `server/src/services/auth.service.ts`:
   - `login(username, password)` → verifica con bcrypt, genera JWT
   - `register(username, email, password)` → crea usuario
3. Crear `server/src/routes/auth.routes.ts`:
   - `POST /api/auth/login` → login
   - `POST /api/auth/logout` → (client-side, solo invalida token)
   - `GET /api/auth/me` → usuario actual

**Mapeo Meteor → REST:**

| Meteor                       | REST API                               |
| ---------------------------- | -------------------------------------- |
| `Meteor.loginWithPassword()` | `POST /api/auth/login`                 |
| `Meteor.logout()`            | Client-side: eliminar token            |
| `Meteor.userId()`            | `ctx.get('userId')` del middleware JWT |
| `Meteor.user()`              | `GET /api/auth/me`                     |

---

### Fase 3: Backend — API de Resources

**Objetivo:** Migrar Methods y Publications de Resources.

**Tareas:**

1. Crear `server/src/services/resources.service.ts`:
   - `getResources(filters, limit, offset)` — reemplaza publicación `resources`
   - `getResourceStats(userId, filters)` — reemplaza publicación `resourcesStats` (SQL JOIN en vez de MongoDB View)
   - `saveResource(data)` — reemplaza method `resources.save`
   - `toggleFavourite(userId, resourceId)` — reemplaza method `resources.toggleFavourite`
2. Crear `server/src/routes/resources.routes.ts`:
   - `GET /api/resources` — lista con filtros query params
   - `GET /api/resources/:id` — recurso individual
   - `POST /api/resources` — crear
   - `PUT /api/resources/:id` — editar
   - `GET /api/resources/stats` — estadísticas del usuario
   - `POST /api/resources/:id/favourite` — toggle favorito

**Reemplazo de la vista MongoDB:**

```sql
-- ResourceStatsView se reemplaza por un JOIN:
SELECT rs.*, r.type, r.tags, rs.last_exec as created_at
FROM resource_stats rs
JOIN resources r ON rs.resource_id = r.id
WHERE rs.user_id = ?
```

**Mapeo de filtros (build-filters.ts → SQL):**

| Filtro Meteor (MongoDB)         | SQL equivalente                               |
| ------------------------------- | --------------------------------------------- |
| `{ tags: { $in: [...] } }`      | `WHERE tags LIKE '%tag%'` o JSON functions    |
| `{ type: 'phrase' }`            | `WHERE type = 'phrase'`                       |
| `{ 'stats.favourite': true }`   | `JOIN resource_stats ... WHERE favourite = 1` |
| `{ createdAt: { $gte: date } }` | `WHERE last_exec >= ?`                        |

---

### Fase 4: Backend — API de Lists

**Objetivo:** Migrar Methods y Publications de Lists.

**Tareas:**

1. Crear `server/src/services/lists.service.ts`:
   - `getLists(filters, userId)` — retorna listas con sus stats
   - `saveList(data)` — crear/editar lista + sync tabla `list_resources`
   - `getListResources(listId)` — recursos de una lista
2. Crear `server/src/routes/lists.routes.ts`:
   - `GET /api/lists` — lista con filtros + stats
   - `GET /api/lists/:id` — lista individual con recursos
   - `POST /api/lists` — crear
   - `PUT /api/lists/:id` — editar

**Cambio clave:** La relación `lists.resources` (array de IDs en MongoDB) se normaliza a la tabla `list_resources`.

---

### Fase 5: Backend — API de Executions (la más compleja)

**Objetivo:** Migrar la lógica de ejecución completa.

**Tareas:**

1. Crear `server/src/services/executions.service.ts`:
   - `getExecutions(userId, filters)` — lista de ejecuciones
   - `startExecution(userId, listIds)` — reemplaza `executions.start`
   - `startTemporary(userId, resourceIds)` — reemplaza `executions.startTemporary`
   - `saveConfig(executionId, config)` — reemplaza `executions.saveConfig`
   - `saveResult(executionId, resultIndex, result)` — reemplaza `executions.saveResult`
   - `restartExecution(executionId)` — reemplaza `executions.restart`
   - `finishExecution(executionId)` — reemplaza `executions.finish`
     - Actualiza `resource_stats` para cada recurso
     - Actualiza `list_stats` para cada lista
     - Actualiza `user_stats`
2. Crear `server/src/routes/executions.routes.ts`:
   - `GET /api/executions` — lista
   - `GET /api/executions/:id` — ejecución con resultados + recursos
   - `POST /api/executions/start` — iniciar
   - `POST /api/executions/start-temporary` — temporal
   - `PATCH /api/executions/:id/config` — guardar config
   - `PATCH /api/executions/:id/result` — guardar resultado individual
   - `POST /api/executions/:id/restart` — reiniciar
   - `POST /api/executions/:id/finish` — finalizar

**Lógica de actualización de stats (finishExecution):**

```typescript
// Equivalente a updateResourceStats + updateListStats + updateUserStats
async finishExecution(executionId: string) {
  const execution = await getExecution(executionId);
  const results = await getExecutionResults(executionId);

  await db.transaction(async (tx) => {
    // 1. Actualizar resource_stats por cada resultado
    for (const result of results) {
      await tx.insert(resourceStats)
        .values({ userId, resourceId: result.resourceId, ... })
        .onConflictDoUpdate({ ... });
    }

    // 2. Actualizar list_stats por cada lista
    for (const listId of execution.listIds) {
      await tx.insert(listStats)
        .values({ userId, listId, ... })
        .onConflictDoUpdate({ ... });
    }

    // 3. Actualizar user_stats
    await tx.insert(userStats)
      .values({ userId, ... })
      .onConflictDoUpdate({ ... });

    // 4. Marcar ejecución como finalizada
    await tx.update(executions)
      .set({ inProgress: false, updatedAt: new Date() })
      .where(eq(executions.id, executionId));
  });
}
```

---

### Fase 6: Backend — API de Imports

**Objetivo:** Migrar la importación de archivos JSON.

**Tareas:**

1. Crear `server/src/services/imports.service.ts`:
   - `uploadAndImport(file)` — recibe archivo, crea task, procesa JSON
   - `getActiveTasks()` — tareas en progreso
   - `getTask(taskId)` — tarea específica
2. Crear `server/src/routes/imports.routes.ts`:
   - `POST /api/imports/upload` — upload de archivo JSON (multipart)
   - `GET /api/imports/tasks` — tareas activas
   - `GET /api/imports/tasks/:id` — progreso de tarea

**Cambio respecto a Meteor:**

- El archivo se recibe via `multipart/form-data` con Hono parser (o multer)
- Se almacena temporalmente en `server/uploads/`
- Se procesa de forma asíncrona
- El progreso se consulta por polling (`GET /api/imports/tasks/:id`) o WebSocket

**Opción reactividad (progreso en tiempo real):**

- Implementar un endpoint WebSocket/SSE para push del progreso
- O simplemente polling cada 2 segundos desde el frontend (más simple)

---

### Fase 7: Frontend — Setup + Layout

**Objetivo:** Crear la SPA base con Vite y el layout principal.

**Tareas:**

1. Crear proyecto Vite:
   ```
   pnpm create vite client --template react-ts
   ```
2. Instalar dependencias:
   ```
   tailwindcss, postcss, autoprefixer
   @tanstack/react-query
   react-router-dom
   zustand
   recharts
   shadcn/ui (via shadcn init)
   ```
3. Configurar Tailwind CSS
4. Instalar componentes shadcn/ui necesarios:
   ```
   button, input, dialog, table, form, select, switch,
   badge, progress, dropdown-menu, avatar, tabs, card,
   sidebar, tooltip, separator, sheet
   ```
5. Crear `client/src/lib/api.ts` — wrapper de fetch con JWT:
   ```typescript
   const api = {
     get: (url) => fetch(url, { headers: { Authorization: `Bearer ${token}` } }),
     post: (url, data) => ...,
     put: (url, data) => ...,
     patch: (url, data) => ...,
     delete: (url) => ...,
   }
   ```
6. Crear layout base:
   - `AppLayout.tsx` — sidebar + header + contenido (reemplaza App de Meteor)
   - `Sidebar.tsx` — menú lateral con items (reemplaza SiderMenu)
   - `Header.tsx` — header con menú de usuario
   - `Footer.tsx` — copyright
   - `UserMenu.tsx` — dropdown con avatar, settings, logout

**Mapeo Ant Design → shadcn/ui + Tailwind:**

| Ant Design                 | shadcn/ui                          | Notas                    |
| -------------------------- | ---------------------------------- | ------------------------ |
| `<Layout>`                 | `<div className="flex">`           | Layout flex con Tailwind |
| `<Layout.Sider>`           | shadcn `<Sidebar>`                 | O custom con Tailwind    |
| `<Layout.Header>`          | `<header className="...">`         | Custom                   |
| `<Layout.Content>`         | `<main className="...">`           | Custom                   |
| `<Menu>`                   | shadcn `<NavigationMenu>` o custom | —                        |
| `<Table>`                  | shadcn `<Table>` + TanStack Table  | —                        |
| `<Modal>`                  | shadcn `<Dialog>`                  | —                        |
| `<Form>` / `Form.create()` | React Hook Form + shadcn `<Form>`  | Cambio mayor             |
| `<Input>`                  | shadcn `<Input>`                   | —                        |
| `<Select>`                 | shadcn `<Select>`                  | —                        |
| `<Switch>`                 | shadcn `<Switch>`                  | —                        |
| `<Button>`                 | shadcn `<Button>`                  | —                        |
| `<Tag>`                    | shadcn `<Badge>`                   | —                        |
| `<Progress>`               | shadcn `<Progress>`                | —                        |
| `<Dropdown>`               | shadcn `<DropdownMenu>`            | —                        |
| `<Avatar>`                 | shadcn `<Avatar>`                  | —                        |
| `<Tabs>`                   | shadcn `<Tabs>`                    | —                        |
| `<Icon>`                   | Lucide React icons                 | —                        |
| `<Spin>`                   | Custom spinner con Tailwind        | —                        |
| `<Steps>`                  | Custom stepper                     | —                        |
| `<Radio>`                  | shadcn `<RadioGroup>`              | —                        |
| `<Tooltip>`                | shadcn `<Tooltip>`                 | —                        |
| `<message.error()>`        | shadcn `<Toast>` (sonner)          | —                        |
| `<Popconfirm>`             | shadcn `<AlertDialog>`             | —                        |

---

### Fase 8: Frontend — Login

**Objetivo:** Migrar la página de login.

**Tareas:**

1. Crear `client/src/lib/auth.ts`:
   - Context de autenticación con JWT
   - `AuthProvider` que verifica token al arrancar
   - Hook `useAuth()` con `login`, `logout`, `user`, `isAuthenticated`
   - Almacenamiento de token en `localStorage`
2. Crear `client/src/pages/LoginPage.tsx`:
   - Formulario con React Hook Form + Zod validation
   - Campos: username, password
   - Redirección a `/executions` tras login exitoso
3. Configurar `ProtectedRoute` en React Router

**Mapeo:**

| Meteor                                      | Nuevo                                |
| ------------------------------------------- | ------------------------------------ |
| `Meteor.loginWithPassword()` via `dispatch` | `POST /api/auth/login` → guardar JWT |
| `Meteor.userId()` / `Meteor.user()`         | `useAuth()` hook                     |
| `withTracker` → isAuthenticated             | `useAuth().isAuthenticated`          |

---

### Fase 9: Frontend — Página Resources

**Objetivo:** Migrar la gestión de recursos.

**Tareas:**

1. Crear hooks con TanStack Query:
   ```typescript
   // hooks/use-resources.ts
   useResources(filters) → useQuery(['resources', filters], fetchResources)
   useSaveResource() → useMutation(saveResource, { onSuccess: invalidate })
   ```
2. Crear `ResourcesPage.tsx`:
   - Tabla de recursos con filtros
   - `SearchTagBar` adaptado a Tailwind
   - Paginación
3. Crear `ResourceFormModal.tsx`:
   - Dialog con React Hook Form
   - Navegación entre recursos
   - `InfoInput` para contenido bilingüe + AudioPlayer
4. Crear `ListFormModal.tsx`:
   - Crear lista desde recursos seleccionados
5. Crear `AudioPlayer.tsx`:
   - Reproducción de audio con controles play/pause/loading
   - Manejo de URLs de Google Drive

**Reemplazo de patrones:**

| Patrón Meteor                         | Patrón Nuevo                              |
| ------------------------------------- | ----------------------------------------- |
| `withTracker` → subscribe + find      | `useQuery` → fetch API                    |
| `ReactiveVar` para filtros            | Zustand store o `useState` + URL params   |
| `Form.create()` + `getFieldDecorator` | React Hook Form + `useForm()`             |
| `withIsLoading` HOC                   | TanStack Query `isLoading` / `isFetching` |
| `dispatch('resources.save', ...)`     | `useMutation` + `api.post/put`            |

---

### Fase 10: Frontend — Página Lists

**Objetivo:** Migrar la gestión de listas.

**Tareas:**

1. Crear hooks:
   ```typescript
   useLists(filters) → useQuery
   useSaveList() → useMutation
   ```
2. Crear `ListsPage.tsx`:
   - Tabla de listas con estadísticas (StatChart)
   - Búsqueda por tags
   - Modal crear/editar lista
   - Botón Start para ejecutar lista

---

### Fase 11: Frontend — Página Executions

**Objetivo:** Migrar el panel de actividad (la página más compleja).

**Tareas:**

1. Crear hooks:
   ```typescript
   useExecutions(filters) → useQuery
   useResourceStats(filters) → useQuery
   useUserStats() → useQuery
   ```
2. Crear `ExecutionsPage.tsx`:
   - Tabs: Lists / Resources
   - Header con UserStats + StatChart
   - SearchTagBar con filtros avanzados
3. Crear tabla de ejecuciones:
   - Columnas: fecha relativa, nombre, stats, botones
   - Componente `Time` para fechas relativas
4. Crear tabla de recursos (con stats):
   - Selección múltiple
   - Toggle favorito
   - Edición de recursos
   - Crear ejecución temporal
5. Crear `UserStats.tsx`:
   - Estadísticas globales con gráfico

**Componente Time (migración de date-helpers):**

Reemplazar `moment` + `chrono-node` por:

- `date-fns` para formateo de fechas relativas
- O `Intl.RelativeTimeFormat` nativo

---

### Fase 12: Frontend — Página Imports

**Objetivo:** Migrar el wizard de importación.

**Tareas:**

1. Crear `ImportsPage.tsx`:
   - Wizard de 4 pasos (stepper custom con Tailwind)
   - Upload de archivo JSON via `fetch` multipart
   - Barra de progreso con polling al endpoint de tasks
2. Crear hook:
   ```typescript
   useImportUpload() → useMutation
   useTask(taskId) → useQuery({ refetchInterval: 2000 })
   ```

**Reemplazo de reactividad:**

| Meteor (reactivo)                  | Nuevo (polling)                                                            |
| ---------------------------------- | -------------------------------------------------------------------------- |
| Subscripción `activeTasks` + oplog | `useQuery` con `refetchInterval: 2000`                                     |
| Subscripción `task` + reactive     | `useQuery` con `refetchInterval: 1000` mientras `status === 'in_progress'` |

---

### Fase 13: Frontend — Modal ListExecution

**Objetivo:** Migrar el componente más complejo del sistema.

**Tareas:**

1. Crear `execution/ListExecution.tsx`:
   - Dialog con 3 modos: CONFIG / RUN / RESULT
   - Gestión de estado complejo (useReducer o Zustand local)
2. Crear `execution/ConfigForm.tsx`:
   - Formulario con switches para configuración
   - React Hook Form
3. Crear `execution/ExecutionContent.tsx`:
   - Mostrar pregunta/respuesta
   - AudioPlayer integrado
   - Modo escritura (TextArea)
   - Modo automático con auto-advance
   - Controles play/pause, prev/next
4. Crear `execution/ExecutionResult.tsx`:
   - PieChart con Recharts
5. Crear hooks de ejecución:
   ```typescript
   useStartExecution() → useMutation
   useSaveConfig() → useMutation
   useSaveResult() → useMutation
   useRestartExecution() → useMutation
   useFinishExecution() → useMutation
   useExecution(id) → useQuery
   ```

**Notas de complejidad:**

- El modo automático con timers requiere cuidado con `useRef` y `useEffect`
- La confirmación al cerrar con ejecución en progreso → `AlertDialog`
- El loop mode (max 5) y shuffle necesitan lógica específica

---

### Fase 14: Seeds y Migración de Datos

**Objetivo:** Preparar la base de datos con datos iniciales.

**Tareas:**

1. Implementar `server/src/db/seed.ts`:
   - Crear usuario admin y guest (con passwords hasheados)
   - En modo desarrollo: generar 200 recursos y 50 listas (con faker)
2. Crear script de migración desde MongoDB (opcional):
   - Exportar datos de MongoDB con `mongoexport`
   - Script Node.js que lee JSON y los inserta en SQLite

---

### Fase 15: Testing E2E

**Objetivo:** Migrar los tests de Cypress.

**Tareas:**

1. Actualizar Cypress a v13+
2. Crear `cypress.config.ts`
3. Migrar los 4 suites de tests:
   - `login.cy.ts`
   - `resources.cy.ts`
   - `lists.cy.ts`
   - `executions.cy.ts`
4. Actualizar selectores (de antd classes a data-testid o shadcn classes)
5. Crear Vitest tests unitarios para:
   - Services del backend
   - Hooks del frontend
   - Utilidades compartidas

---

### Fase 16: Pulido y Limpieza

**Objetivo:** Finalizar la migración.

**Tareas:**

1. Eliminar código de Meteor (todo el directorio `.meteor`, `client/main.html`, etc.)
2. Actualizar `README.md` con nueva documentación
3. Corregir typos identificados: "Lotout", "Lenguage", "placehodler", "desactive"
4. Implementar `resources.remove` (estaba sin implementar)
5. Añadir control de permisos donde falta (lists.save, resources.save)
6. Revisar accesibilidad (a11y)
7. Optimizar bundle size
8. Configurar proxy de Vite para desarrollo:
   ```typescript
   // vite.config.ts
   server: {
     proxy: {
       '/api': 'http://localhost:3001'
     }
   }
   ```

---

## 8. Mapeo Completo de Funcionalidades

### 8.1 Methods → Endpoints REST

| Meteor Method               | HTTP Endpoint                           | Verbo    |
| --------------------------- | --------------------------------------- | -------- |
| `users.loginWithPassword`   | `/api/auth/login`                       | POST     |
| `users.logout`              | Client-side                             | —        |
| `users.updateUISettings`    | `/api/users/me/settings`                | PATCH    |
| `resources.save`            | `/api/resources` o `/api/resources/:id` | POST/PUT |
| `resources.remove`          | `/api/resources/:id`                    | DELETE   |
| `resources.toggleFavourite` | `/api/resources/:id/favourite`          | POST     |
| `lists.save`                | `/api/lists` o `/api/lists/:id`         | POST/PUT |
| `executions.start`          | `/api/executions/start`                 | POST     |
| `executions.startTemporary` | `/api/executions/start-temporary`       | POST     |
| `executions.saveConfig`     | `/api/executions/:id/config`            | PATCH    |
| `executions.saveResult`     | `/api/executions/:id/result`            | PATCH    |
| `executions.restart`        | `/api/executions/:id/restart`           | POST     |
| `executions.finish`         | `/api/executions/:id/finish`            | POST     |

### 8.2 Publications → Endpoints GET

| Publicación Meteor | HTTP Endpoint                | Notas                       |
| ------------------ | ---------------------------- | --------------------------- |
| `executions`       | `GET /api/executions`        | Query params para filtros   |
| `execution`        | `GET /api/executions/:id`    | Incluye results + resources |
| `lists`            | `GET /api/lists`             | Incluye stats del usuario   |
| `resources`        | `GET /api/resources`         | Query params para filtros   |
| `resourcesStats`   | `GET /api/resources/stats`   | JOIN en SQL (sin view)      |
| `allUsers`         | `GET /api/users`             | Campos públicos             |
| `currentUser`      | `GET /api/auth/me`           | Con profile + settings      |
| `userStats`        | `GET /api/users/me/stats`    | Stats del usuario           |
| `activeTasks`      | `GET /api/imports/tasks`     | Solo las activas            |
| `task`             | `GET /api/imports/tasks/:id` | —                           |

### 8.3 Dependencias Eliminadas vs Nuevas

**Dependencias eliminadas (Meteor ecosystem):**

- `meteor` (framework completo)
- `meteor-node-stubs`
- `simpl-schema`
- `react-container-query`
- `react-media`
- `antd` v3
- `less`, `less-loader`
- `moment` (implícito de Meteor)
- `chrono-node`
- `indexof`
- `ostrio:files`
- `reywood:publish-composite`
- `percolate:migrations`

**Dependencias nuevas:**

| Paquete                                   | Propósito                  |
| ----------------------------------------- | -------------------------- |
| `vite`                                    | Bundler                    |
| `typescript`                              | Lenguaje                   |
| `tailwindcss`                             | Estilos                    |
| `@tanstack/react-query`                   | Data fetching              |
| `react-router-dom` v6                     | Routing                    |
| `zustand`                                 | Estado global              |
| `react-hook-form` + `@hookform/resolvers` | Formularios                |
| `zod`                                     | Validación                 |
| `hono` + `@hono/node-server`              | Backend HTTP               |
| `drizzle-orm` + `drizzle-kit`             | ORM                        |
| `better-sqlite3`                          | Driver SQLite              |
| `bcrypt`                                  | Hashing de passwords       |
| `jsonwebtoken`                            | JWT                        |
| `date-fns`                                | Fechas                     |
| `recharts`                                | Gráficos (se mantiene)     |
| `lucide-react`                            | Iconos                     |
| `sonner`                                  | Toasts/notificaciones      |
| `@radix-ui/*`                             | Primitivas UI (via shadcn) |
| `class-variance-authority`                | Variantes de estilos       |
| `clsx` + `tailwind-merge`                 | Utilidades CSS             |

---

## 9. Riesgos y Mitigaciones

| Riesgo                                | Impacto | Mitigación                                                                                                               |
| ------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| Pérdida de reactividad DDP            | Medio   | TanStack Query con `refetchInterval` donde se necesite (imports). Para el resto, invalidación de queries tras mutaciones |
| Complejidad del ListExecution         | Alto    | Migrar primero, refactorizar después. Usar `useReducer` para estado complejo                                             |
| Migración de datos existentes         | Medio   | Crear script de exportación MongoDB → SQLite. Mantener backups                                                           |
| Rendimiento SQLite con concurrencia   | Bajo    | SQLite WAL mode. La app es para pocos usuarios                                                                           |
| Formularios antd v3 → React Hook Form | Medio   | Cada formulario se reescribe completamente con la nueva API                                                              |
| Tags como JSON en SQLite              | Bajo    | Usar `json_each()` de SQLite para queries o normalizar a tabla separada si hay problemas de rendimiento                  |
| Audios de Google Drive                | Bajo    | Mantener `getAudioLink()` tal cual — es independiente del framework                                                      |

---

## Notas Finales

- **Orden recomendado:** Backend primero (fases 1-6), luego Frontend (fases 7-13), finalmente testing y pulido.
- **Desarrollo incremental:** Cada fase produce un artefacto funcional y testeable.
- **Mantener Meteor en paralelo:** No eliminar el código original hasta que la migración esté completa y validada.
- **Commits atómicos:** Cada fase debería ser uno o más commits con mensaje descriptivo.
