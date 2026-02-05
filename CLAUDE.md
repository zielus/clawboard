# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start development server
pnpm build        # Type-check and build for production
pnpm lint         # Run ESLint
pnpm preview      # Preview production build
```

## CLI Commands

The `clawboard` CLI provides CRUD operations for all entities. General pattern:

```bash
clawboard <entity>:<action> '<json>'
```

### Available Commands

**Agents**
```bash
clawboard agents:create '{"name": "Agent Name", "role": "Developer", "status": "active|idle|blocked"}'
clawboard agents:list
clawboard agents:update '{"id": "...", "status": "idle"}'
clawboard agents:delete '{"id": "..."}'
```

**Tasks**
```bash
clawboard tasks:create '{"title": "...", "description": "...", "status": "backlog|in_progress|review|done"}'
clawboard tasks:list
clawboard tasks:update '{"id": "...", "status": "in_progress"}'
clawboard tasks:assign '{"taskId": "...", "agentId": "..."}'
clawboard tasks:unassign '{"taskId": "...", "agentId": "..."}'
clawboard tasks:delete '{"id": "..."}'
```

**Messages**
```bash
clawboard messages:create '{"taskId": "...", "agentId": "...", "content": "..."}'
clawboard messages:list '{"taskId": "..."}'
clawboard messages:attach '{"messageId": "...", "documentId": "..."}'
```

**Documents**
```bash
clawboard documents:create '{"title": "...", "type": "deliverable|research|protocol", "taskId": "..."}'
clawboard documents:list
clawboard documents:delete '{"id": "..."}'
```

**Audits**
```bash
clawboard audits:create '{"taskId": "...", "threatLevel": "safe|warning|critical", "content": "..."}'
clawboard audits:list '{"taskId": "..."}'
```

**Activities**
```bash
clawboard activities:create '{"agentId": "...", "type": "created|moved|commented|updated", "taskId": "...", "message": "..."}'
clawboard activities:list '{"agentId": "..."}'
```

**Notifications**
```bash
clawboard notifications:create '{"mentionedAgentId": "...", "content": "..."}'
clawboard notifications:list '{"mentionedAgentId": "..."}'
clawboard notifications:deliver '{"id": "..."}'
```

**Setup**
```bash
clawboard setup    # Initialize database schema
```

## Adding shadcn/ui Components

```bash
pnpm dlx shadcn@latest add <component-name>
```

Components are installed to `src/components/ui/`. The project uses the `radix-vega` style with `zinc` as the base color.

## Architecture

- **React 19** with Vite 7 and TypeScript
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (no separate config file)
- **shadcn/ui** components using Radix UI primitives and `class-variance-authority` for variants
- **Hono** lightweight web framework for backend
- **SQLite** with better-sqlite3 and WAL mode
- **Zod** for schema validation
- **Path alias**: `@/` maps to `src/`

## Project Structure

```
bin/
├── clawboard           # Shell wrapper
└── clawboard.ts        # CLI tool (CRUD operations)
db/
├── schema.sql          # Database schema
└── clawboard.db        # SQLite database (with WAL)
lib/
├── db.ts               # Database connection & initialization
└── types.ts            # Zod validation schemas
src/
├── components/
│   ├── activity/       # Activity timeline
│   ├── agents/         # Agent sidebar
│   ├── layout/         # Header component
│   ├── tasks/          # Kanban board, modals, drawers
│   ├── ui/             # shadcn/ui components
│   └── theme-provider.tsx
├── lib/
│   ├── constants.ts    # Status colors and labels
│   ├── mock-data.ts    # Demo data
│   ├── types.ts        # Frontend type definitions
│   └── utils.ts        # cn() utility for className merging
├── pages/
│   └── tasks.tsx       # Main tasks page (3-column layout)
├── App.tsx             # Root component
├── main.tsx            # Entry point
└── index.css           # Tailwind imports and CSS variables (OKLCH theme)
```

## Database

- **SQLite** with better-sqlite3 (WAL mode enabled)
- **5 main tables**: agents, tasks, documents, messages, activities, audits, notifications
- **2 junction tables**: task_assignees, message_attachments
- Schema defined in `db/schema.sql`
- 12 indexes for query optimization

### Key Tables

| Table | Purpose |
|-------|---------|
| agents | AI/human agents with status (idle/active/blocked) |
| tasks | Tasks with status (backlog/in_progress/review/done) |
| task_assignees | Many-to-many task assignments |
| documents | Attachments (deliverable/research/protocol) |
| messages | Task comments |
| activities | Activity feed (created/moved/commented/updated) |
| audits | Security audits (safe/warning/critical) |
| notifications | Agent mentions |

## Styling

- Theme colors defined as CSS variables in `src/index.css` using OKLCH color space
- Dark mode (default) via `.dark` class on parent element
- Light mode available via theme toggle
- Theme persisted to localStorage (`clawboard-theme`)
- Use `cn()` from `@/lib/utils` to merge Tailwind classes
- Inter Variable font is the default sans-serif
- Status colors: backlog (slate), in_progress (blue), review (amber), done (emerald)

## Component Architecture

The main TasksPage uses a 3-column responsive layout:

```
┌─────────────────────────────────────────────────────────────┐
│                         Header                               │
│  [Logo] [Tasks|Memory|Docs] [Stats] [+New Task] [⟳] [◐]    │
├──────┬──────────────────────────────────────┬───────────────┤
│      │           KanbanBoard                 │   Activity    │
│Agents│  Backlog | In Progress | Review | Done│   Timeline    │
│      │                                       │               │
│(left)│          (center, scrollable)         │    (right)    │
└──────┴──────────────────────────────────────┴───────────────┘
```

- AgentsColumn: Hidden on mobile (`hidden lg:flex`)
- ActivityTimeline: Hidden on tablet (`hidden xl:flex`)
- KanbanBoard: Always visible, horizontal scroll on overflow
