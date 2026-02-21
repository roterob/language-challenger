# Language Challenger — Constitución del Proyecto

> Documento generado a partir de un análisis exhaustivo del código fuente.  
> Fecha: 21 de febrero de 2026

---

## 1. Visión General

**Language Challenger** es una plataforma de entrenamiento para el idioma inglés basada en las cartillas Vaughan. Las cartillas son colecciones de recursos (frases, vocabulario y párrafos) en inglés y español, acompañados de audio para el entrenamiento auditivo.

**Objetivo principal:** monitorizar el progreso del estudiante en base a aciertos/errores en las ejecuciones de listas. El estudiante puede consultar qué recursos son los que más falla o marcar como favoritos los que desee.

---

## 2. Stack Tecnológico Actual

| Capa          | Tecnología                                       |
| ------------- | ------------------------------------------------ |
| Backend       | Meteor.js + MongoDB                              |
| Frontend      | React 16.x + Ant Design v3 + LESS                |
| Routing       | react-router-dom v4                              |
| Gráficos      | Recharts                                         |
| Reactividad   | Meteor DDP (protocolo de datos en tiempo real)   |
| Autenticación | Meteor Accounts (accounts-password)              |
| Archivos      | ostrio:files (upload de JSON)                    |
| Testing       | Cypress (E2E), Mocha                             |
| Herramientas  | Storybook, Hygen (scaffolding), ESLint, Prettier |

---

## 3. Arquitectura de la Aplicación

```
┌─────────────────────────────────────────────────────┐
│                    CLIENTE (SPA)                     │
│  React + Ant Design + react-router + Code Splitting │
│                                                      │
│  dispatch() ──► Meteor.call() / Meteor.loginWith...  │
│  withTracker() ──► Meteor.subscribe() + Collection   │
└──────────────────────┬──────────────────────────────┘
                       │ DDP (WebSocket)
┌──────────────────────▼──────────────────────────────┐
│                   SERVIDOR (Meteor)                  │
│  Methods (RPC) + Publications (datos reactivos)      │
│  Migraciones + Hooks de cuentas + Fixtures           │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                    MongoDB                           │
│  Collections + Views + Indexes                       │
└─────────────────────────────────────────────────────┘
```

### Patrón de datos

- **Collections**: definidas con `Mongo.Collection` + esquemas `simpl-schema`.
- **Methods**: RPC del servidor invocados desde el cliente via `dispatch()`.
- **Publications**: cursores reactivos consumidos con `withTracker()`.
- **dispatch()**: capa de abstracción centralizada que unifica la invocación de Methods, login y logout con manejo de errores automático vía `antd.message`.

---

## 4. Modelo de Datos

### 4.1 Resources (Recursos)

Colección MongoDB: `Resources`

| Campo             | Tipo     | Descripción                                |
| ----------------- | -------- | ------------------------------------------ |
| `_id`             | String   | ID auto-generado                           |
| `code`            | String   | Código identificador único (ej. importado) |
| `type`            | String   | `'phrase'`, `'vocabulary'` o `'paragraph'` |
| `tags`            | [String] | Etiquetas para categorización              |
| `content.es`      | String   | Texto en español                           |
| `content.esAudio` | String   | URL/path del audio en español              |
| `content.en`      | String   | Texto en inglés                            |
| `content.enAudio` | String   | URL/path del audio en inglés               |

**Índice:** `code` (creado en migración v1).

Los audios se almacenan como IDs de Google Drive y se obtienen mediante `getAudioLink()` que genera URLs de descarga.

---

### 4.2 Lists (Listas)

Colección MongoDB: `Lists`

| Campo       | Tipo     | Descripción               |
| ----------- | -------- | ------------------------- |
| `_id`       | String   | ID auto-generado          |
| `name`      | String   | Nombre de la lista        |
| `tags`      | [String] | Etiquetas                 |
| `resources` | [String] | Array de IDs de Resources |

**Nota:** Las listas son **globales** — no tienen `userId`. Son compartidas entre todos los usuarios.

---

### 4.3 Executions (Ejecuciones)

Colección MongoDB: `Executions`

| Campo                  | Tipo         | Descripción                                              |
| ---------------------- | ------------ | -------------------------------------------------------- |
| `_id`                  | String       | ID auto-generado                                         |
| `userId`               | String       | Usuario que ejecuta                                      |
| `listId`               | [String]     | IDs de las listas asociadas                              |
| `name`                 | String       | Nombre (concatenación de nombres de listas)              |
| `tags`                 | [String]     | Unión de tags de las listas                              |
| `inProgress`           | Boolean      | Si está en curso                                         |
| `loops`                | Number       | Contador de repeticiones (default 0)                     |
| `results`              | [Object]     | Array de resultados por recurso                          |
| `results[].resourceId` | String       | ID del recurso                                           |
| `results[].listId`     | String       | ID de la lista de origen                                 |
| `results[].result`     | Boolean/null | `true`=correcto, `false`=incorrecto, `null`=sin ejecutar |
| `config`               | Object       | Configuración del ejercicio                              |
| `config.direction`     | String       | `'es'` o `'en'` (idioma de la pregunta)                  |
| `config.playQuestion`  | Boolean      | Reproducir audio de pregunta                             |
| `config.playAnswer`    | Boolean      | Reproducir audio de respuesta                            |
| `config.writeAnswer`   | Boolean      | Escribir la respuesta                                    |
| `config.automaticMode` | Boolean      | Modo automático                                          |
| `config.loop`          | Boolean      | Modo bucle (default false)                               |
| `config.shuffle`       | Boolean      | Barajar recursos                                         |
| `currentIndex`         | Number       | Índice actual en los resultados                          |
| `createdAt`            | Date         | Fecha de creación                                        |
| `updatedAt`            | Date         | Última actualización                                     |
| `counters`             | Object       | Contadores agregados                                     |
| `counters.correct`     | Number       | Respuestas correctas                                     |
| `counters.incorrect`   | Number       | Respuestas incorrectas                                   |
| `counters.noExecuted`  | Number       | Sin ejecutar                                             |

---

### 4.4 ResourceStats (Estadísticas por Recurso)

Colección MongoDB: `ResourceStats`

| Campo        | Tipo    | Descripción               |
| ------------ | ------- | ------------------------- |
| `_id`        | String  | ID auto-generado          |
| `userId`     | String  | Usuario                   |
| `resourceId` | String  | ID del recurso            |
| `executions` | Number  | Total de veces ejecutado  |
| `correct`    | Number  | Respuestas correctas      |
| `incorrect`  | Number  | Respuestas incorrectas    |
| `lastExec`   | Date    | Última fecha de ejecución |
| `lastResult` | Boolean | Último resultado          |
| `favourite`  | Boolean | Marcado como favorito     |

---

### 4.5 ResourceStatsView (Vista MongoDB)

Vista MongoDB: `ResourceStatsView` (join de ResourceStats + Resources)

Se crea en la migración v2 con un pipeline de agregación:

- `$lookup` de Resources por `resourceId`
- `$unwind` del recurso
- `$addFields` para añadir `type`, `tags`, `createdAt` (= lastExec)

Se usa con `pollingInterval` en publicaciones porque las vistas MongoDB no soportan oplog tailing en Meteor.

---

### 4.6 ListStats (Estadísticas por Lista)

Colección MongoDB: `ListStats`

| Campo        | Tipo   | Descripción                       |
| ------------ | ------ | --------------------------------- |
| `_id`        | String | ID auto-generado                  |
| `userId`     | String | Usuario                           |
| `listId`     | String | ID de la lista                    |
| `executions` | Number | Total de ejecuciones              |
| `correct`    | Number | Respuestas correctas acumuladas   |
| `incorrect`  | Number | Respuestas incorrectas acumuladas |

---

### 4.7 UserStats (Estadísticas de Usuario)

Colección MongoDB: `UserStats`

| Campo        | Tipo   | Descripción            |
| ------------ | ------ | ---------------------- |
| `_id`        | String | ID auto-generado       |
| `userId`     | String | ID del usuario         |
| `executions` | Number | Total de ejecuciones   |
| `correct`    | Number | Correctas acumuladas   |
| `incorrect`  | Number | Incorrectas acumuladas |

---

### 4.8 Users (Usuarios)

Colección: `Meteor.users`

| Campo                 | Tipo     | Descripción                    |
| --------------------- | -------- | ------------------------------ |
| `username`            | String   | Nombre de usuario              |
| `emails`              | [Object] | Array de emails                |
| `profile`             | Object   | Perfil de usuario              |
| `profile.displayName` | String   | Nombre visible                 |
| `profile.avatar`      | String   | URL del avatar                 |
| `profile.isAdmin`     | Boolean  | Es administrador               |
| `profile.isGuest`     | Boolean  | Es invitado                    |
| `profile.menu`        | [Object] | Menú personalizado             |
| `uiSettings`          | Object   | Configuración de UI (blackbox) |
| `services`            | Object   | Servicios de auth de Meteor    |

---

### 4.9 Tasks (Tareas de Importación)

Colección MongoDB: `Tasks`

| Campo        | Tipo   | Descripción                                |
| ------------ | ------ | ------------------------------------------ |
| `_id`        | String | ID auto-generado                           |
| `fileId`     | String | ID del archivo subido                      |
| `fileName`   | String | Nombre del archivo                         |
| `status`     | String | `'in progress'`, `'finished'`, `'aborted'` |
| `progress`   | Number | Progreso actual                            |
| `total`      | Number | Total de elementos                         |
| `errorMsg`   | String | Mensaje de error                           |
| `createdAt`  | Date   | Fecha de creación                          |
| `updatedAt`  | Date   | Última actualización                       |
| `finishedAt` | Date   | Fecha de finalización                      |

---

### 4.10 Imports (Archivos)

Colección de archivos: `Imports` (via `ostrio:files`)

Acepta solo archivos JSON de máximo 10MB. Al subir un archivo, crea un Task y ejecuta la importación de forma diferida.

---

### Diagrama de Relaciones

```
Users (Meteor.users)
  │
  ├──1:1──► UserStats          (userId)
  │
  ├──1:N──► Executions         (userId)
  │           ├── results[].resourceId ──► Resources
  │           └── listId[] ─────────────► Lists
  │
  ├──1:N──► ResourceStats       (userId + resourceId)
  │           └── resourceId ──────────► Resources
  │
  └──1:N──► ListStats           (userId + listId)
              └── listId ──────────────► Lists

Lists
  └── resources[] ─────────────────────► Resources._id

ResourceStatsView (Vista MongoDB)
  = ResourceStats JOIN Resources (por resourceId)

Tasks ◄── Imports (fileId)
  └── importa datos ──────────────────► Resources
```

---

## 5. Funcionalidades del Sistema

### 5.1 Autenticación y Usuarios

- **Login:** Formulario con usuario/contraseña. Usa `Meteor.loginWithPassword`.
- **Logout:** Desde el menú de usuario en el header via `Meteor.logout`.
- **Usuarios por defecto:** Se crean en migraciones:
  - Admin: `admin` / `secret`
  - Guest: `guest` / `secret`
- **Hook onCreateUser:** Al crear un usuario, extrae `displayName`, `avatar`, `isAdmin`, `isGuest`, `menu` del profile y los asigna como campos directos.
- **Configuración de UI (uiSettings):** Cada usuario almacena su configuración de interfaz (ej. estado del sidebar colapsado). Se persiste en el servidor via `users.updateUISettings`.

---

### 5.2 Gestión de Recursos

- **Listado:** Tabla paginada de recursos con búsqueda por tags y filtro por tipo (phrase/vocabulary/paragraph).
- **Crear/Editar recurso:** Modal (`ResourceFormModal`) con formulario que incluye:
  - Código (auto-generado o importado)
  - Tipo (phrase/vocabulary/paragraph)
  - Tags
  - Contenido bilingüe (texto + audio para ES e EN)
  - Reproductor de audio integrado en el formulario
- **Navegación:** El modal permite navegar entre recursos (anterior/siguiente).
- **Importación masiva:** Desde archivos JSON (ver sección 5.6).

---

### 5.3 Gestión de Listas

- **Listado:** Tabla paginada de listas con búsqueda por tags.
- **Crear/Editar lista:** Modal (`ListFormModal`) con nombre, tags y recursos asociados.
- **Crear lista desde selección:** En la página de Recursos, se pueden seleccionar varios recursos y crear una lista con ellos.
- **Estadísticas por lista:** Cada lista muestra sus estadísticas de ejecución (correct/incorrect) del usuario actual via `ListStats`.

---

### 5.4 Ejecución de Listas (Funcionalidad Core)

La ejecución de listas es la funcionalidad central del sistema. Permite al estudiante practicar los recursos de una o varias listas.

#### Flujo de ejecución:

1. **Inicio:** El usuario selecciona una o varias listas y pulsa "Start". Se crea (o reanuda) una ejecución.
2. **Configuración:** Modal con opciones:
   - **Dirección:** ES→EN o EN→ES
   - **Reproducir pregunta:** Auto-play del audio de la pregunta
   - **Reproducir respuesta:** Auto-play del audio de la respuesta
   - **Escribir respuesta:** Modo escritura (TextArea para escribir antes de revelar)
   - **Barajar:** Aleatorizar el orden de los recursos
   - **Modo automático:** Reproducción secuencial automática
   - **Modo bucle:** Repetir al finalizar (máximo 5 loops)
3. **Ejecución:** Para cada recurso:
   - Se muestra la pregunta (en el idioma configurado) con botón de audio
   - El usuario revela la respuesta
   - Marca como correcto o incorrecto
   - En modo automático: reproduce pregunta → respuesta → avanza
4. **Resultado:** Al finalizar, muestra un gráfico PieChart con estadísticas.
5. **Filtrado:** Durante la ejecución, se puede filtrar por resultado (correct/incorrect/all) para repasar.

#### Ejecución temporal:

- Desde la pestaña de Recursos en Executions, se pueden seleccionar recursos individuales y crear una ejecución temporal (sin `listId`).

#### Actualización de estadísticas:

Al finalizar una ejecución, se actualizan automáticamente:

- `ResourceStats`: aciertos/errores por recurso para el usuario
- `ListStats`: aciertos/errores por lista para el usuario
- `UserStats`: totales del usuario

---

### 5.5 Panel de Actividad (Executions)

Página principal del usuario con dos pestañas:

#### Pestaña "Lists":

- Tabla de ejecuciones pasadas y en progreso
- Columnas: fecha relativa, nombre de lista + tags, estadísticas (PieChart o badge "In progress"), botones Start/Review
- Estadísticas globales del usuario (UserStats) con gráfico

#### Pestaña "Resources":

- Tabla de recursos con sus estadísticas personales
- Columnas: fecha, favorito (estrella), recurso + tipo + tags, resultado, errores (gráfico), botón edit
- Selección múltiple para crear ejecución temporal
- Toggle de favorito por recurso
- Ordenamiento por errores

#### Búsqueda avanzada:

Sistema de búsqueda por tags con filtros especiales:

- `type:phrase|vocabulary|paragraph` — Filtrar por tipo
- `from:fecha` — Filtrar por fecha (parseo de lenguaje natural: "last month", "yesterday", etc.)
- `automatic:true|false` — Filtrar por modo automático
- `favourites:true` — Solo favoritos
- `result:passed|failed` — Por último resultado
- `status:in progress|finished` — Por estado de ejecución
- Tags simples se buscan en el campo `tags`

---

### 5.6 Importación de Recursos

Wizard de 4 pasos:

1. **Seleccionar archivo:** Botón de upload (solo JSON, máx 10MB)
2. **Subiendo archivo:** Barra de progreso del upload
3. **Importando recursos:** Barra de progreso real de la importación (via Task)
4. **Proceso finalizado:** Mensaje de éxito

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

La importación se ejecuta en el servidor de forma asíncrona, actualizando el progreso cada 50 registros.

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
App (withTracker + withRouter + react-media)
├── LoginPage (si NO autenticado)
│   └── Login (Form.create de antd)
├── Loading (si cargando)
└── AppGlobalContext.Provider (usuario actual)
    └── ContainerQuery (responsive breakpoints)
        └── Layout (antd)
            ├── SiderMenu (menú lateral)
            ├── HeaderView
            │   ├── GlobalHeader
            │   │   └── RightContent (avatar + dropdown menú)
            │   └── TopNavHeader
            ├── Content (React.Suspense + Switch)
            │   ├── /Executions → ExecutionsPage
            │   ├── /Resources → ResourcesPage
            │   ├── /Lists → ListsPage
            │   └── /Imports → ImportsPage
            └── Footer
```

### 6.2 Rutas

| Ruta          | Componente               | Lazy-loaded |
| ------------- | ------------------------ | ----------- |
| `/`           | Redirect → `/Executions` | —           |
| `/Executions` | ExecutionsPage           | ✅          |
| `/Resources`  | ResourcesPage            | ✅          |
| `/Lists`      | ListsPage                | ✅          |
| `/Imports`    | ImportsPage              | ✅          |

### 6.3 Menú de Navegación

Definido en `defaultSettings.js`:

| Key        | Icono          | Nombre     | Ruta        |
| ---------- | -------------- | ---------- | ----------- |
| executions | thunderbolt    | Executions | /Executions |
| lists      | unordered-list | Lists      | /Lists      |
| resources  | database       | Resources  | /Resources  |
| imports    | upload         | Imports    | /Imports    |

### 6.4 Diseño Responsive

- Usa `react-container-query` con breakpoints: xs, sm, md, lg, xl, xxl
- `react-media` para detectar mobile (max-width: 599px)
- En móvil: sidebar se oculta, header con logo y hamburguesa
- Tablas con scroll horizontal en pantallas pequeñas

---

## 7. Patrones de Código

### 7.1 dispatch() — Capa de abstracción central

```
dispatch(methodName, ...args) → Meteor.call() / Meteor.login() / Meteor.logout()
```

Centraliza todas las llamadas RPC con manejo de errores automático (`antd.message.error`).

### 7.2 withTracker() — Datos reactivos

Todos los containers usan `withTracker` de `react-meteor-data` para suscribirse a publicaciones y obtener datos reactivos de MongoDB.

### 7.3 ReactiveVar — Estado global fuera de React

Usado en Executions y Lists para mantener filtros de búsqueda como estado reactivo fuera del ciclo de vida de React.

### 7.4 withIsLoading — HOC de optimización

Previene re-renders innecesarios durante la carga de datos comparando timestamps.

### 7.5 Code Splitting

Las páginas se cargan con `React.lazy()` + `Suspense` para reducir el bundle inicial.

### 7.6 Antd Form v3

Usa el patrón `Form.create()` (HOC) con `getFieldDecorator` — API deprecada en antd v4+.

---

## 8. Meteor Methods (API del Servidor)

| Método                      | Módulo     | Descripción                                 |
| --------------------------- | ---------- | ------------------------------------------- |
| `executions.start`          | Executions | Inicia o reanuda ejecución de listas        |
| `executions.startTemporary` | Executions | Crea ejecución temporal sin lista           |
| `executions.saveConfig`     | Executions | Guarda configuración de ejecución           |
| `executions.saveResult`     | Executions | Guarda resultado de un recurso              |
| `executions.restart`        | Executions | Reinicia la ejecución (incrementa loops)    |
| `executions.finish`         | Executions | Finaliza ejecución y actualiza stats        |
| `lists.save`                | Lists      | Crear/editar lista (upsert)                 |
| `resources.save`            | Resources  | Crear/editar recurso (upsert)               |
| `resources.toggleFavourite` | Resources  | Alterna favorito de un recurso              |
| `resources.remove`          | Resources  | (No implementado — placeholder)             |
| `users.updateUISettings`    | Users      | Actualiza configuración de UI               |
| `users.logout`              | Users      | (Problema: usa Meteor.logout() del cliente) |

---

## 9. Publicaciones (Datos Reactivos)

| Publicación      | Módulo     | Descripción                                      |
| ---------------- | ---------- | ------------------------------------------------ |
| `executions`     | Executions | Ejecuciones del usuario (con filtros)            |
| `execution`      | Executions | Ejecución específica + Resources + ResourceStats |
| `lists`          | Lists      | Listas con filtros + ListStats del usuario       |
| `resources`      | Resources  | Recursos con filtros                             |
| `resourcesStats` | Resources  | Vista ResourceStatsView del usuario              |
| `allUsers`       | Users      | Todos los usuarios (campos públicos)             |
| `currentUser`    | Users      | Usuario actual extendido                         |
| `userStats`      | Users      | Estadísticas del usuario                         |
| `activeTasks`    | Imports    | Tareas de importación en progreso                |
| `task`           | Imports    | Tarea específica por ID                          |

---

## 10. Migraciones de Base de Datos

| Versión | Nombre           | Acción                                         |
| ------- | ---------------- | ---------------------------------------------- |
| 1       | Initial          | Crea usuario admin, índice `code` en Resources |
| 2       | Views            | Crea vista MongoDB `ResourceStatsView`         |
| 3       | Fixes 1          | Recalcula `lastResult` en ResourceStats        |
| 4       | Fixes listIds    | Convierte `listId` de string a array           |
| 5       | Fixes Executions | Elimina ejecuciones en progreso huérfanas      |
| 6       | Guest user       | Crea usuario invitado                          |

---

## 11. Módulos Utilitarios

| Módulo                    | Descripción                                         |
| ------------------------- | --------------------------------------------------- |
| `array-to-hashmap`        | Convierte array de objetos en hashmap por propiedad |
| `build-filters`           | Construye filtros MongoDB desde tags de búsqueda    |
| `cached-value`            | Placeholder sin implementación                      |
| `create-form-field`       | Transforma objetos a campos de formulario antd      |
| `create-resource-code`    | Genera código aleatorio para recursos               |
| `date-helpers`            | Utilidades de fecha (moment + chrono-node)          |
| `dispatch`                | Capa de abstracción para Meteor Methods             |
| `get-audio-link`          | Genera URL de descarga de Google Drive              |
| `handle-method-exception` | Normaliza excepciones del servidor                  |
| `is-null-or-undefined`    | Valor por defecto si null/undefined                 |
| `type-colors`             | Colores por tipo de recurso                         |
| `use-controlled-state`    | Hook para componentes controlados/no controlados    |

---

## 12. Problemas y Deuda Técnica Detectados

1. **`resources.remove`**: Método sin implementar (placeholder vacío).
2. **`users.logout`**: Llama a `Meteor.logout()` que es del cliente — no funciona en server method.
3. **Sin control de permisos**: `lists.save` y `resources.save` no verifican roles/permisos.
4. **ResourceStatsView**: Requiere `pollingInterval` (impacto en rendimiento).
5. **Typos en código**: "Lotout" (RightContent), "Lenguage" (Login), "placehodler" (InfoInput), "desactive" (Content).
6. **React 16.x**: Versión muy antigua.
7. **Ant Design v3**: API de formularios deprecada (Form.create, getFieldDecorator).
8. **Dependencia de `_` (Underscore)**: Uso de `_.shuffle` sin import explícito — depende del global de Meteor.
9. **Sin TypeScript**: Todo el proyecto en JavaScript sin tipado estático.
10. **LESS**: Sistema de estilos acoplado a las herramientas de Meteor.
