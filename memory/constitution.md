# Language Challenger — Constitución del Proyecto

> Documento generado a partir de un análisis exhaustivo del código fuente.  
> Última actualización: 21 de febrero de 2026  
> Estado: Migrado desde Meteor.js + MongoDB a stack moderno desacoplado

---

## 1. Visión General

**Language Challenger** es una plataforma de entrenamiento para el idioma inglés basada en las cartillas Vaughan. Las cartillas son colecciones de recursos (frases, vocabulario y párrafos) en inglés y español, acompañados de audio para el entrenamiento auditivo.

**Objetivo principal:** monitorizar el progreso del estudiante en base a aciertos/errores en las ejecuciones de listas. El estudiante puede consultar qué recursos son los que más falla o marcar como favoritos los que desee.

---

## 2. Stack Tecnológico

| Capa            | Tecnología                                      |
| --------------- | ----------------------------------------------- |
| Backend         | Node.js + Hono (TypeScript)                     |
| Base de datos   | SQLite (better-sqlite3) + Drizzle ORM           |
| Frontend        | Vite + React 18 + TypeScript + Tailwind CSS v3  |
| Componentes UI  | shadcn/ui (Radix UI + Tailwind + CVA)           |
| Routing         | React Router v6                                 |
| Estado global   | Zustand                                         |
| Data fetching   | TanStack Query (React Query)                    |
| Validación      | Zod (shared entre client y server)              |
| Autenticación   | JWT (jsonwebtoken) + bcryptjs                   |
| Gráficos        | Recharts                                        |
| Testing         | Playwright (E2E)                                |
| Herramientas    | pnpm workspaces, ESLint (flat config), Prettier |
| Gestión de deps | pnpm v10 (monorepo)                             |

---

## 3. Arquitectura de la Aplicación

```
┌───────────────────────────────────────────────────┐
│              FRONTEND (SPA – Vite)                │
│  React 18 + TypeScript + Tailwind CSS             │
│  shadcn/ui + React Router v6 + TanStack Query     │
│  Zustand (estado global) + Recharts (gráficos)    │
│  Lazy loading por ruta + manualChunks (Vite)      │
└──────────────────────┬────────────────────────────┘
                       │ HTTP REST API (proxy en dev)
┌──────────────────────▼────────────────────────────┐
│              BACKEND (Node.js – Hono)             │
│  TypeScript + Drizzle ORM + Zod                   │
│  JWT Auth + bcryptjs                              │
│  CORS + Logger + Error handler middleware         │
└──────────────────────┬────────────────────────────┘
                       │
┌──────────────────────▼────────────────────────────┐
│              SQLite (archivo local)               │
│  via better-sqlite3 + Drizzle ORM                 │
│  WAL mode + foreign keys habilitados              │
└───────────────────────────────────────────────────┘
```

### Estructura del monorepo

```
language-challenger/
├── packages/shared/      # Tipos TS, esquemas Zod, utilidades compartidas
├── server/               # API REST con Hono + Drizzle + SQLite
├── client/               # SPA con Vite + React 18 + Tailwind
├── e2e/                  # Tests E2E con Playwright
└── memory/               # Documentación del proyecto
```

### Patrón de datos

- **Tablas**: definidas con Drizzle ORM (`sqliteTable`) + esquemas Zod de validación en `packages/shared`.
- **API REST**: endpoints Hono bajo `/api/` consumidos desde el cliente vía `api.get()`/`api.post()`.
- **TanStack Query**: hooks personalizados (`useResources`, `useLists`, etc.) con cache, revalidación automática e invalidación tras mutaciones.
- **Zustand**: estado global ligero (sidebar colapsado, UI settings).
- **api client**: capa de abstracción en `client/src/lib/api.ts` que gestiona token JWT, headers, redirect automático en 401 y soporte FormData.

---

## 4. Modelo de Datos

Base de datos: SQLite con Drizzle ORM. Esquema definido en `server/src/db/schema.ts`.  
IDs: UUID v4 generados con `randomUUID()` de `node:crypto`.  
Fechas: almacenadas como `TEXT` con formato `datetime('now')`.  
Arrays/objetos: almacenados como JSON en columnas `TEXT` con `{ mode: 'json' }`.

### 4.1 Tabla `users`

| Columna          | Tipo    | Descripción                               |
| ---------------- | ------- | ----------------------------------------- |
| `id`             | TEXT PK | UUID auto-generado                        |
| `username`       | TEXT    | Nombre de usuario (UNIQUE)                |
| `email`          | TEXT    | Email (opcional)                          |
| `email_verified` | INTEGER | Boolean: email verificado                 |
| `password_hash`  | TEXT    | Hash bcryptjs                             |
| `display_name`   | TEXT    | Nombre visible                            |
| `avatar`         | TEXT    | URL del avatar                            |
| `is_admin`       | INTEGER | Boolean: es administrador                 |
| `is_guest`       | INTEGER | Boolean: es invitado                      |
| `ui_settings`    | TEXT    | JSON: configuración de UI (sidebar, etc.) |
| `created_at`     | TEXT    | Timestamp de creación                     |
| `updated_at`     | TEXT    | Timestamp de última actualización         |

---

### 4.2 Tabla `resources`

| Columna            | Tipo    | Descripción                                     |
| ------------------ | ------- | ----------------------------------------------- |
| `id`               | TEXT PK | UUID auto-generado                              |
| `code`             | TEXT    | Código identificador único (UNIQUE, indexado)   |
| `type`             | TEXT    | Enum: `'phrase'`, `'vocabulary'`, `'paragraph'` |
| `tags`             | TEXT    | JSON array de strings                           |
| `content_es`       | TEXT    | Texto en español                                |
| `content_es_audio` | TEXT    | ID de Google Drive del audio en español         |
| `content_en`       | TEXT    | Texto en inglés                                 |
| `content_en_audio` | TEXT    | ID de Google Drive del audio en inglés          |
| `created_at`       | TEXT    | Timestamp de creación                           |
| `updated_at`       | TEXT    | Timestamp de última actualización               |

**Índices:** `idx_resources_code` (code), `idx_resources_type` (type).

Los audios se almacenan como IDs de Google Drive y se obtienen mediante `getAudioLink()` (en `packages/shared`) que genera URLs de descarga directa.

---

### 4.3 Tabla `lists`

| Columna      | Tipo    | Descripción                       |
| ------------ | ------- | --------------------------------- |
| `id`         | TEXT PK | UUID auto-generado                |
| `name`       | TEXT    | Nombre de la lista                |
| `tags`       | TEXT    | JSON array de strings             |
| `created_at` | TEXT    | Timestamp de creación             |
| `updated_at` | TEXT    | Timestamp de última actualización |

**Nota:** Las listas son **globales** — no tienen `userId`. Son compartidas entre todos los usuarios.

### 4.4 Tabla `list_resources` (N:M)

| Columna       | Tipo    | Descripción                          |
| ------------- | ------- | ------------------------------------ |
| `list_id`     | TEXT FK | → `lists.id` (ON DELETE CASCADE)     |
| `resource_id` | TEXT FK | → `resources.id` (ON DELETE CASCADE) |
| `position`    | INTEGER | Orden del recurso en la lista        |

**PK compuesta:** (`list_id`, `resource_id`). Índice en `list_id`.

---

### 4.5 Tabla `executions`

| Columna         | Tipo    | Descripción                                   |
| --------------- | ------- | --------------------------------------------- |
| `id`            | TEXT PK | UUID auto-generado                            |
| `user_id`       | TEXT FK | → `users.id`                                  |
| `name`          | TEXT    | Nombre (concatenación de nombres de listas)   |
| `tags`          | TEXT    | JSON array de strings                         |
| `in_progress`   | INTEGER | Boolean: si está en curso                     |
| `loops`         | INTEGER | Contador de repeticiones (default 0)          |
| `current_index` | INTEGER | Índice actual en los resultados               |
| `config`        | TEXT    | JSON: configuración del ejercicio (ver abajo) |
| `counters`      | TEXT    | JSON: `{ correct, incorrect, noExecuted }`    |
| `created_at`    | TEXT    | Timestamp de creación                         |
| `updated_at`    | TEXT    | Timestamp de última actualización             |

**Estructura de `config` (JSON):**

- `questionLang`: `'en'` | `'es'`
- `playQuestion`: boolean
- `playAnswer`: boolean
- `writeAnswer`: boolean
- `automaticMode`: boolean
- `loopMode`: boolean
- `shuffle`: boolean

**Índice:** `idx_executions_user` (user_id).

### 4.6 Tabla `execution_lists` (N:M)

| Columna        | Tipo    | Descripción                           |
| -------------- | ------- | ------------------------------------- |
| `execution_id` | TEXT FK | → `executions.id` (ON DELETE CASCADE) |
| `list_id`      | TEXT FK | → `lists.id`                          |

**PK compuesta:** (`execution_id`, `list_id`).

### 4.7 Tabla `execution_results`

| Columna        | Tipo    | Descripción                                       |
| -------------- | ------- | ------------------------------------------------- |
| `id`           | TEXT PK | UUID auto-generado                                |
| `execution_id` | TEXT FK | → `executions.id` (ON DELETE CASCADE)             |
| `resource_id`  | TEXT FK | → `resources.id`                                  |
| `list_id`      | TEXT FK | → `lists.id` (nullable, null en temporales)       |
| `result`       | INTEGER | Boolean/null: `true`=correcto, `false`=incorrecto |
| `position`     | INTEGER | Posición del recurso en la ejecución              |

**Índice:** `idx_exec_results_execution` (execution_id).

---

### 4.8 Tabla `resource_stats`

| Columna       | Tipo    | Descripción                    |
| ------------- | ------- | ------------------------------ |
| `id`          | TEXT PK | UUID auto-generado             |
| `user_id`     | TEXT FK | → `users.id`                   |
| `resource_id` | TEXT FK | → `resources.id`               |
| `executions`  | INTEGER | Total de veces ejecutado       |
| `correct`     | INTEGER | Respuestas correctas           |
| `incorrect`   | INTEGER | Respuestas incorrectas         |
| `last_exec`   | TEXT    | Última fecha de ejecución      |
| `last_result` | INTEGER | Boolean: último resultado      |
| `favourite`   | INTEGER | Boolean: marcado como favorito |

**Índices:** `idx_resource_stats_unique` (UNIQUE: user_id, resource_id), `idx_resource_stats_user` (user_id).

---

### 4.9 Tabla `list_stats`

| Columna      | Tipo    | Descripción                       |
| ------------ | ------- | --------------------------------- |
| `id`         | TEXT PK | UUID auto-generado                |
| `user_id`    | TEXT FK | → `users.id`                      |
| `list_id`    | TEXT FK | → `lists.id`                      |
| `executions` | INTEGER | Total de ejecuciones              |
| `correct`    | INTEGER | Respuestas correctas acumuladas   |
| `incorrect`  | INTEGER | Respuestas incorrectas acumuladas |

**Índices:** `idx_list_stats_unique` (UNIQUE: user_id, list_id), `idx_list_stats_user` (user_id).

---

### 4.10 Tabla `user_stats`

| Columna      | Tipo    | Descripción            |
| ------------ | ------- | ---------------------- |
| `id`         | TEXT PK | UUID auto-generado     |
| `user_id`    | TEXT FK | → `users.id` (UNIQUE)  |
| `executions` | INTEGER | Total de ejecuciones   |
| `correct`    | INTEGER | Correctas acumuladas   |
| `incorrect`  | INTEGER | Incorrectas acumuladas |

---

### 4.11 Tabla `import_tasks`

| Columna       | Tipo    | Descripción                                      |
| ------------- | ------- | ------------------------------------------------ |
| `id`          | TEXT PK | UUID auto-generado                               |
| `file_name`   | TEXT    | Nombre del archivo                               |
| `status`      | TEXT    | Enum: `'in_progress'`, `'finished'`, `'aborted'` |
| `progress`    | INTEGER | Progreso actual                                  |
| `total`       | INTEGER | Total de elementos                               |
| `error_msg`   | TEXT    | Mensaje de error (nullable)                      |
| `created_at`  | TEXT    | Timestamp de creación                            |
| `updated_at`  | TEXT    | Timestamp de última actualización                |
| `finished_at` | TEXT    | Timestamp de finalización (nullable)             |

---

### Diagrama de Relaciones

```
users
  │
  ├──1:1──► user_stats           (user_id UNIQUE)
  │
  ├──1:N──► executions           (user_id)
  │           ├── execution_results[].resource_id ──► resources
  │           ├── execution_results[].list_id ─────► lists
  │           └── execution_lists[].list_id ───────► lists
  │
  ├──1:N──► resource_stats        (user_id + resource_id UNIQUE)
  │           └── resource_id ──────────► resources
  │
  └──1:N──► list_stats            (user_id + list_id UNIQUE)
              └── list_id ──────────────► lists

lists
  └── list_resources (N:M) ─────────────► resources

import_tasks (independiente)
  └── archivo JSON ──importa──────────► resources
```

---

## 5. Funcionalidades del Sistema

### 5.1 Autenticación y Usuarios

- **Login:** Formulario con usuario/contraseña. Envía `POST /api/auth/login` y recibe un JWT.
- **Token:** Se almacena en `localStorage`. Se envía en cada request como `Authorization: Bearer <token>`.
- **Logout:** Desde el menú de usuario en el header. Elimina el token de localStorage y redirige a `/login`.
- **Usuarios por defecto (seed):**
  - Admin: `admin` / `secret` (isAdmin: true)
  - Guest: `guest` / `secret` (isGuest: true)
- **AuthProvider (React Context):** Al montar, intenta recuperar el token de localStorage y carga el perfil con `GET /api/auth/me`. Expone `user`, `login()`, `logout()`, `updateUser()`.
- **ProtectedRoute:** Componente wrapper que redirige a `/login` si no hay usuario autenticado.
- **Configuración de UI (uiSettings):** Cada usuario almacena su configuración de interfaz. Se persiste en el servidor via `PATCH /api/auth/me/settings`.

---

### 5.2 Gestión de Recursos

- **Listado:** Tabla paginada con TanStack Table, búsqueda por tags y filtro por tipo (phrase/vocabulary/paragraph).
- **Crear/Editar recurso:** Modal (`ResourceFormModal`) con React Hook Form + Zod que incluye:
  - Código (auto-generado o importado)
  - Tipo (phrase/vocabulary/paragraph)
  - Tags (gestión dinámica con input + badges)
  - Contenido bilingüe (texto + ID de audio para ES e EN)
  - Reproductor de audio integrado (`AudioPlayer`)
- **Favoritos:** Toggle de estrella directamente desde la tabla.
- **Importación masiva:** Desde archivos JSON (ver sección 5.6).

---

### 5.3 Gestión de Listas

- **Listado:** Grid de cards con estadísticas visuales (barra de progreso correct/incorrect).
- **Crear/Editar lista:** Modal (`ListFormModal`) con nombre, tags y selector de recursos (lista de checkboxes con búsqueda).
- **Estadísticas por lista:** Cada card muestra el número de recursos y las estadísticas de ejecución del usuario actual via `list_stats`.
- **Práctica directa:** Botón "Practicar" en cada card que abre el modal `ListExecution`.

---

### 5.4 Ejecución de Listas (Funcionalidad Core)

La ejecución de listas es la funcionalidad central del sistema. Se gestiona completamente en el modal `ListExecution` con 3 modos: CONFIG, RUN y RESULT.

#### Flujo de ejecución:

1. **CONFIG:** Modal con opciones de configuración:
   - **Dirección:** ES→EN o EN→ES (`questionLang`)
   - **Reproducir pregunta:** Auto-play del audio de la pregunta
   - **Reproducir respuesta:** Auto-play del audio de la respuesta
   - **Escribir respuesta:** Modo escritura
   - **Barajar:** Aleatorizar el orden de los recursos
   - **Modo automático:** Reproducción secuencial automática
   - **Modo bucle:** Repetir al finalizar
2. **RUN:** Para cada recurso:
   - Se muestra la pregunta (en el idioma configurado) con botón de audio
   - El usuario revela la respuesta
   - Marca como correcto o incorrecto
   - Barra de progreso, temporizador, navegación prev/next
3. **RESULT:** Al finalizar:
   - PieChart con estadísticas (correct/incorrect/pending)
   - Desglose detallado por recurso
   - Opciones: reiniciar, cerrar

#### Actualización de estadísticas:

Al finalizar una ejecución, se actualizan automáticamente via el endpoint `PATCH /api/executions/:id/finish`:

- `resource_stats`: aciertos/errores por recurso para el usuario
- `list_stats`: aciertos/errores por lista para el usuario
- `user_stats`: totales del usuario

---

### 5.5 Panel de Actividad (Executions)

Página con estadísticas del usuario y dos pestañas (Tabs de shadcn/ui):

#### Tarjetas de estadísticas:

- Cards superiores con `UserStats`: total de ejecuciones, correctas, incorrectas, porcentaje de acierto.

#### Pestaña "History":

- Tabla de ejecuciones pasadas y en progreso
- Columnas: fecha relativa, nombre de ejecución + tags (badges), estadísticas (PieChart mini o badge "In progress"), botones Start/Review

#### Pestaña "Resources":

- Tabla de recursos con sus estadísticas personales (`resource_stats`)
- Columnas: fecha, favorito (estrella), recurso + tipo + tags, resultado, errores, botón edit
- Toggle de favorito por recurso

---

### 5.6 Importación de Recursos

Página con dos secciones:

1. **Zona de upload:** Área drag & drop o click para seleccionar archivo JSON (máx 10MB). Al subir, se envía a `POST /api/imports/upload` con FormData.
2. **Tareas activas:** Polling automático (TanStack Query `refetchInterval: 2000`) que muestra las tareas en progreso con barra de progreso.
3. **Historial:** Tabla con todas las tareas de importación pasadas.

**Formato JSON esperado:**

```json
[
  {
    "id": "string",
    "type": "phrase|vocabulary|paragraph",
    "tags": ["string"],
    "es": "texto en español",
    "en": "texto en inglés",
    "resource_es": "google_drive_id_audio_es",
    "resource_en": "google_drive_id_audio_en"
  }
]
```

La importación se ejecuta en el servidor de forma asíncrona, actualizando el progreso en `import_tasks`.

---

### 5.7 Favoritos

- Cualquier recurso puede marcarse como favorito por el usuario.
- Se almacena en `ResourceStats.favourite`.
- El toggle se realiza desde la tabla de recursos en Executions.
- Se puede filtrar por favoritos con `favourites:true`.

---

## 6. Estructura de la UI

### 6.1 Layout Principal

```
App (React Router v6)
├── /login → LoginPage (si NO autenticado)
└── / → ProtectedRoute (redirige a /login si no hay token)
    └── AppLayout (sidebar colapsable + header + content)
        ├── Header
        │   ├── Botón toggle sidebar (PanelLeft)
        │   └── UserMenu (avatar + dropdown: perfil, logout)
        ├── Sidebar (NavLink con iconos Lucide)
        │   ├── /resources → Recursos (BookOpen)
        │   ├── /lists → Listas (ListChecks)
        │   ├── /executions → Ejecuciones (PlayCircle)
        │   └── /imports → Importar (Upload)
        ├── Content (React.Suspense + Outlet)
        │   ├── /resources → ResourcesPage (lazy)
        │   ├── /lists → ListsPage (lazy)
        │   ├── /executions → ExecutionsPage (lazy)
        │   └── /imports → ImportsPage (lazy)
        └── Footer
```

### 6.2 Rutas

| Ruta          | Componente     | Lazy-loaded | Auth requerida |
| ------------- | -------------- | ----------- | -------------- |
| `/login`      | LoginPage      | ❌          | ❌             |
| `/`           | → `/resources` | —           | ✅             |
| `/resources`  | ResourcesPage  | ✅          | ✅             |
| `/lists`      | ListsPage      | ✅          | ✅             |
| `/executions` | ExecutionsPage | ✅          | ✅             |
| `/imports`    | ImportsPage    | ✅          | ✅             |
| `*`           | → `/`          | —           | —              |

### 6.3 Componentes UI (shadcn/ui)

Componentes base copiados al proyecto en `client/src/components/ui/`:

`button`, `input`, `label`, `card`, `badge`, `dialog`, `dropdown-menu`, `separator`, `tabs`, `select`, `switch`, `tooltip`, `avatar`, `progress`

Todos basados en Radix UI primitives + Tailwind CSS + `class-variance-authority` (CVA).

### 6.4 Componentes Compartidos

| Componente          | Archivo                   | Descripción                               |
| ------------------- | ------------------------- | ----------------------------------------- |
| `AudioPlayer`       | `audio-player.tsx`        | Reproductor de audio de Google Drive      |
| `TypeBadge`         | `type-badge.tsx`          | Badge coloreado por tipo de recurso       |
| `ResourceFormModal` | `resource-form-modal.tsx` | CRUD de recursos (React Hook Form + Zod)  |
| `ListFormModal`     | `list-form-modal.tsx`     | Editor de listas con selector de recursos |
| `ListExecution`     | `list-execution.tsx`      | Modal de práctica (CONFIG/RUN/RESULT)     |
| `ProtectedRoute`    | `protected-route.tsx`     | Guard de autenticación                    |

### 6.5 Code Splitting

- **Lazy loading:** Todas las páginas se cargan con `React.lazy()` + `Suspense`.
- **Manual chunks (Vite):** El bundle se divide en:
  - `vendor`: react, react-dom, react-router-dom
  - `query`: @tanstack/react-query
  - `ui`: Radix UI (dialog, dropdown, select, tabs)
  - `charts`: recharts

---

## 7. Patrones de Código

### 7.1 API Client — Capa de abstracción HTTP

```
api.get<T>(url) / api.post<T>(url, body) / api.put<T>() / api.patch<T>() / api.delete<T>()
```

Definido en `client/src/lib/api.ts`. Gestiona automáticamente:
- Token JWT en header `Authorization: Bearer`
- Redirect a `/login` en respuestas 401
- Soporte para `FormData` (upload de archivos)
- Parsing JSON de respuestas

### 7.2 TanStack Query Hooks — Data fetching

Hooks personalizados en `client/src/hooks/`:
- `useResources()`, `useResource(id)`, `useSaveResource()`, `useToggleFavourite()`
- `useLists()`, `useSaveList()`
- `useExecutions()`, `useExecution(id)`, `useStartExecution()`, etc.
- `useUploadImport()`, `useImportTasks()`, `useActiveImportTasks()`

Cada hook encapsula `useQuery` o `useMutation` con cache keys y `queryClient.invalidateQueries()` automático tras mutaciones.

### 7.3 AuthContext — Autenticación con React Context

`AuthProvider` en `client/src/contexts/auth-context.tsx`:
- Almacena token JWT en `localStorage`
- Expone `user`, `login()`, `logout()`, `updateUser()`
- Carga perfil del usuario al montar con `GET /api/auth/me`
- `ProtectedRoute` redirige a `/login` si no hay usuario autenticado

### 7.4 Validación compartida con Zod

Los esquemas Zod viven en `packages/shared/src/schemas/` y se usan tanto en:
- **Server**: validación de request body en cada ruta Hono (`schema.safeParse(body)`)
- **Client**: validación de formularios con `@hookform/resolvers/zod`

### 7.5 Hono Middleware

- `authMiddleware`: extrae y verifica JWT del header `Authorization`, inyecta `userId` en el contexto Hono
- `errorHandler`: captura excepciones y devuelve respuestas JSON estandarizadas

### 7.6 Drizzle ORM — Queries type-safe

Las queries se realizan con la API funcional de Drizzle:
- `db.select().from(table).where(eq(col, val))`
- `db.insert(table).values({...}).returning()`
- `db.update(table).set({...}).where(...)`
- Joins explícitos con `leftJoin()` / `innerJoin()`
- JSON columns con `{ mode: 'json' }` para arrays y objetos

---

## 8. API REST (Endpoints del Servidor)

Todas las rutas bajo `/api/`. Autenticación via JWT Bearer token excepto donde se indica.

### Auth (`/api/auth`)

| Método | Ruta                | Auth | Descripción                        |
| ------ | ------------------- | ---- | ---------------------------------- |
| POST   | `/auth/login`       | ❌   | Login con username/password → JWT  |
| GET    | `/auth/me`          | ✅   | Perfil del usuario actual          |
| PATCH  | `/auth/me/settings` | ✅   | Actualizar uiSettings              |
| GET    | `/auth/me/stats`    | ✅   | Estadísticas del usuario (UserStats)|

### Resources (`/api/resources`)

| Método | Ruta                            | Auth | Descripción                        |
| ------ | ------------------------------- | ---- | ---------------------------------- |
| GET    | `/resources`                    | ✅   | Listar recursos (paginado + filtros)|
| GET    | `/resources/stats`              | ✅   | Stats por recurso del usuario      |
| GET    | `/resources/:id`                | ✅   | Detalle de un recurso              |
| POST   | `/resources`                    | ✅   | Crear recurso                      |
| PUT    | `/resources/:id`                | ✅   | Editar recurso                     |
| PATCH  | `/resources/:id/favourite`      | ✅   | Toggle favorito                    |

### Lists (`/api/lists`)

| Método | Ruta                      | Auth | Descripción                          |
| ------ | ------------------------- | ---- | ------------------------------------ |
| GET    | `/lists`                  | ✅   | Listar listas (con stats del usuario)|
| GET    | `/lists/:id`              | ✅   | Detalle de una lista                 |
| GET    | `/lists/:id/resources`    | ✅   | Recursos de una lista                |
| POST   | `/lists`                  | ✅   | Crear lista                          |
| PUT    | `/lists/:id`              | ✅   | Editar lista                         |

### Executions (`/api/executions`)

| Método | Ruta                               | Auth | Descripción                          |
| ------ | ---------------------------------- | ---- | ------------------------------------ |
| GET    | `/executions`                      | ✅   | Listar ejecuciones del usuario       |
| GET    | `/executions/:id`                  | ✅   | Detalle de ejecución con results     |
| POST   | `/executions/start`                | ✅   | Iniciar ejecución de listas          |
| POST   | `/executions/start-temporary`      | ✅   | Crear ejecución temporal sin lista   |
| PATCH  | `/executions/:id/config`           | ✅   | Guardar configuración                |
| PATCH  | `/executions/:id/result`           | ✅   | Guardar resultado de un recurso      |
| PATCH  | `/executions/:id/restart`          | ✅   | Reiniciar ejecución (incrementa loops)|
| PATCH  | `/executions/:id/finish`           | ✅   | Finalizar ejecución + actualizar stats|

### Imports (`/api/imports`)

| Método | Ruta                      | Auth | Descripción                      |
| ------ | ------------------------- | ---- | -------------------------------- |
| POST   | `/imports/upload`         | ✅   | Upload JSON + iniciar importación|
| GET    | `/imports/tasks`          | ✅   | Listar todas las tareas          |
| GET    | `/imports/tasks/active`   | ✅   | Tareas en progreso               |
| GET    | `/imports/tasks/:id`      | ✅   | Detalle de una tarea             |

### Health

| Método | Ruta           | Auth | Descripción       |
| ------ | -------------- | ---- | ----------------- |
| GET    | `/health`      | ❌   | Health check      |

---

## 9. Hooks de Data Fetching (reemplazo de Publications)

| Hook                    | Módulo     | Equivale a (Meteor)       | Descripción                                       |
| ----------------------- | ---------- | ------------------------- | ------------------------------------------------- |
| `useResources(params)`  | Resources  | `pub: resources`          | Recursos paginados con filtros                    |
| `useResourceStats()`    | Resources  | `pub: resourcesStats`     | Stats por recurso del usuario via `/resources/stats`|
| `useLists(params)`      | Lists      | `pub: lists`              | Listas con stats del usuario                      |
| `useExecutions(params)` | Executions | `pub: executions`         | Ejecuciones del usuario con filtros               |
| `useExecution(id)`      | Executions | `pub: execution`          | Ejecución específica con results + resources      |
| `useActiveImportTasks()`| Imports    | `pub: activeTasks`        | Tareas en progreso (polling 2s)                   |
| `useImportTasks()`      | Imports    | `pub: task`               | Historial de todas las tareas                     |
| `useAuth().user`        | Users      | `pub: currentUser`        | Usuario actual via AuthContext                    |

---

## 10. Base de Datos: Seed e Inicialización

### Seed (`server/src/db/seed.ts`)

Ejecutable con `pnpm seed`. Crea:
- **Usuarios por defecto:**
  - Admin: `admin` / `secret` (isAdmin: true)
  - Guest: `guest` / `secret` (isGuest: true)
- **40 recursos de ejemplo:** 20 phrases, 15 vocabulary, 5 paragraphs
- **7 listas de ejemplo** con recursos asociados

### Migración desde Meteor (`server/src/db/migrate-meteor.ts`)

Script para importar datos existentes de MongoDB (exports JSON). Ejecutable con `pnpm migrate:meteor`.
- Importa usuarios preservando hashes bcrypt de Meteor
- Importa recursos con deduplicación por `code`
- Importa listas con mapeo de IDs Meteor → SQLite UUIDs

### Drizzle Migrations

Gestionadas con `drizzle-kit`. Archivo SQL en `server/drizzle/0000_orange_star_brand.sql`.

---

## 11. Módulos Utilitarios (`packages/shared`)

| Módulo                     | Ubicación                   | Descripción                                    |
| -------------------------- | --------------------------- | ---------------------------------------------- |
| `get-audio-link`           | `shared/utils/`             | Genera URL de descarga de Google Drive          |
| `type-colors`              | `shared/utils/`             | Colores por tipo: phrase=#61bd4f, vocabulary=#f2d600, paragraph=#ff9f1a |
| `date-helpers`             | `shared/utils/`             | `parseDate()` + `formatRelativeTime()`         |
| `build-filters`            | `shared/utils/`             | Parser de tags de búsqueda con filtros especiales |
| Schemas (user, resource, list, execution) | `shared/schemas/` | Validación Zod compartida client+server        |
| Types (user, resource, list, execution, import) | `shared/types/` | Interfaces TypeScript                          |

### Utilidad `cn()` (cliente)

```ts
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs) { return twMerge(clsx(inputs)); }
```

Patrón estándar de shadcn/ui para combinar clases Tailwind de forma segura.

---

## 12. Scripts del Proyecto

| Script             | Comando                   | Descripción                                      |
| ------------------ | ------------------------- | ------------------------------------------------ |
| `pnpm dev`         | `concurrently` server+client | Arranca server (3001) y client (5173) en paralelo|
| `pnpm dev:server`  | `tsx watch src/index.ts`  | Server con hot-reload                            |
| `pnpm dev:client`  | `vite`                    | Cliente con HMR                                  |
| `pnpm build`       | Build server + client     | Producción                                       |
| `pnpm seed`        | `tsx src/db/seed.ts`      | Poblar DB con datos de ejemplo                   |
| `pnpm migrate:meteor` | `tsx src/db/migrate-meteor.ts` | Migrar datos de Meteor/MongoDB              |
| `pnpm typecheck`   | `tsc --noEmit` en todos   | Verificación de tipos                            |

---

## 13. Testing

### E2E con Playwright (`e2e/`)

Configuración en `e2e/playwright.config.ts`. Tests en `e2e/app.spec.ts`.

| Test                     | Descripción                                    |
| ------------------------ | ---------------------------------------------- |
| Redirect to login        | Verifica que `/` redirige a `/login` sin auth  |
| Show login page          | Verifica el formulario de login                |
| Invalid credentials      | Verifica error con credenciales incorrectas    |
| Admin login              | Login con admin/secret exitoso                 |
| Display resources        | Verifica que la tabla de recursos se muestra   |
| Navigate to lists/exec   | Navegación por las rutas principales           |
| Logout                   | Verifica que el logout funciona                |

El config arranca ambos servidores automáticamente (`webServer`).

---

## 14. Problemas Resueltos (respecto a versión Meteor)

1. ✅ **TypeScript**: Todo el proyecto tipado estáticamente con TS strict.
2. ✅ **React 18**: Hooks modernos, Concurrent features, Suspense.
3. ✅ **Ant Design v3 → shadcn/ui**: Componentes modernos, sin API deprecada.
4. ✅ **LESS → Tailwind CSS**: Utility-first, sin preprocesador.
5. ✅ **MongoDB → SQLite**: Sin servidor externo, portable, Drizzle type-safe.
6. ✅ **Meteor DDP → REST + TanStack Query**: Cache, revalidación, sin dependencia Meteor.
7. ✅ **simpl-schema → Zod**: Validación TypeScript-native compartida.
8. ✅ **dispatch() + withTracker → api client + hooks**: Patrón moderno React.
9. ✅ **ResourceStatsView (MongoDB view)**: Reemplazada por JOINs SQL en Drizzle.
10. ✅ **ostrio:files → Hono parseBody()**: Upload nativo sin dependencias Meteor.
11. ✅ **`_.shuffle` global → Fisher-Yates** en servicio de ejecuciones.
12. ✅ **Code splitting**: React.lazy + Vite manualChunks (bundle principal 162KB).

