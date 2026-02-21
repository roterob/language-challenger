# Language Challenger 🌐

Aplicación web para aprender inglés practicando con las cartillas Vaughan. Migrada desde Meteor+MongoDB a una arquitectura moderna y desacoplada.

## Arquitectura

```
┌─────────────────────────────────────────────────┐
│  Monorepo (pnpm workspaces)                     │
│                                                  │
│  packages/shared    – Tipos, schemas, utils      │
│  server/            – API REST (Hono + SQLite)   │
│  client/            – SPA (Vite + React 18)      │
│  e2e/               – Tests E2E (Playwright)     │
└─────────────────────────────────────────────────┘
```

### Stack técnico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, React Router v6, Zustand, Recharts |
| **Backend** | Hono, Node.js, TypeScript |
| **Base de datos** | SQLite vía better-sqlite3 + Drizzle ORM |
| **Autenticación** | JWT (jsonwebtoken + bcryptjs) |
| **Validación** | Zod |
| **Testing** | Playwright (E2E) |

## Requisitos

- **Node.js** ≥ 18
- **pnpm** ≥ 9

## Instalación

```bash
pnpm install
```

## Desarrollo

Arrancar servidor y cliente en paralelo:

```bash
pnpm dev
```

O por separado:

```bash
pnpm dev:server   # API en http://localhost:3001
pnpm dev:client   # SPA en http://localhost:5173
```

### Seed de la base de datos

```bash
pnpm seed
```

Crea usuarios `admin` / `guest` (password: `secret`) y datos de ejemplo.

### Migración de datos desde Meteor

Si tienes datos exportados de MongoDB:

```bash
pnpm migrate:meteor -- --resources=resources.json --lists=lists.json --users=users.json
```

## Estructura del proyecto

```
packages/shared/src/
  types/          # Interfaces TypeScript
  schemas/        # Validaciones Zod
  utils/          # Utilidades compartidas

server/src/
  db/             # Schema Drizzle, conexión, seed, migraciones
  middleware/     # Auth JWT, error handler
  services/       # Lógica de negocio
  routes/         # Endpoints API

client/src/
  components/
    ui/           # Componentes shadcn/ui
    layout/       # AppLayout, Sidebar, Header, Footer
  hooks/          # TanStack Query hooks
  pages/          # Páginas de la app
  contexts/       # AuthProvider
  lib/            # API client, utils

e2e/              # Tests Playwright
```

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Usuario actual |
| GET | `/api/resources` | Listar recursos (paginado, filtros) |
| POST | `/api/resources` | Crear recurso |
| PUT | `/api/resources/:id` | Actualizar recurso |
| DELETE | `/api/resources/:id` | Eliminar recurso |
| POST | `/api/resources/:id/favourite` | Toggle favorito |
| GET | `/api/resources/stats/all` | Stats por recurso |
| GET | `/api/lists` | Listar listas |
| POST | `/api/lists` | Crear lista |
| PUT | `/api/lists/:id` | Actualizar lista |
| GET | `/api/lists/:id/resources` | Recursos de una lista |
| POST | `/api/executions/start` | Iniciar ejecución |
| POST | `/api/executions/start-temporary` | Ejecución temporal |
| PUT | `/api/executions/:id/config` | Guardar config |
| POST | `/api/executions/:id/results` | Guardar resultado |
| POST | `/api/executions/:id/restart` | Reiniciar |
| POST | `/api/executions/:id/finish` | Finalizar |
| POST | `/api/imports/upload` | Subir JSON para importar |
| GET | `/api/imports` | Historial de importaciones |
| GET | `/api/imports/active` | Importaciones activas |

## Modelo de datos

- **Users**: usuarios con roles (admin, guest)
- **Resources**: frases, vocabulario y párrafos con traducciones ES↔EN
- **Lists**: agrupaciones de recursos con relación N:M
- **Executions**: sesiones de práctica con configuración y resultados
- **Stats**: estadísticas por recurso, lista y usuario

## Credenciales por defecto

| Usuario | Password | Rol |
|---------|----------|-----|
| admin | secret | Administrador |
| guest | secret | Invitado |
