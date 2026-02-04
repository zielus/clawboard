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
clawboard agents:create '{"name": "Agent Name", "type": "human|ai", "status": "active"}'
clawboard agents:list
clawboard agents:update '{"id": "...", "status": "inactive"}'
clawboard agents:delete '{"id": "..."}'
```

**Tasks**
```bash
clawboard tasks:create '{"title": "...", "status": "pending", "priority": "medium"}'
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
clawboard documents:create '{"name": "...", "mimeType": "...", "path": "..."}'
clawboard documents:list
clawboard documents:delete '{"id": "..."}'
```

**Audits**
```bash
clawboard audits:create '{"entityType": "...", "entityId": "...", "action": "...", "agentId": "..."}'
clawboard audits:list '{"entityType": "...", "entityId": "..."}'
```

**Activities**
```bash
clawboard activities:create '{"agentId": "...", "activityType": "...", "description": "..."}'
clawboard activities:list '{"agentId": "..."}'
```

**Notifications**
```bash
clawboard notifications:create '{"agentId": "...", "type": "...", "title": "...", "message": "..."}'
clawboard notifications:list '{"agentId": "..."}'
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
- **Path alias**: `@/` maps to `src/`

## Project Structure

```
bin/
├── clawboard           # Shell wrapper
└── clawboard.ts        # CLI tool
db/
└── schema.sql          # Database schema
src/
├── components/
│   └── ui/             # shadcn/ui components
├── lib/
│   ├── db.ts           # Database connection
│   ├── types.ts        # Zod schemas
│   └── utils.ts        # cn() utility for className merging
├── App.tsx             # Root component
├── main.tsx            # Entry point
└── index.css           # Tailwind imports and CSS variables (theme)
```

## Database

- **SQLite** with better-sqlite3
- **7 main tables**: agents, tasks, messages, documents, audits, activities, notifications
- **2 junction tables**: task_agents, message_documents
- Schema defined in `db/schema.sql`

## Styling

- Theme colors defined as CSS variables in `src/index.css` using OKLCH color space
- Dark mode via `.dark` class on parent element
- Use `cn()` from `@/lib/utils` to merge Tailwind classes
- Inter Variable font is the default sans-serif
