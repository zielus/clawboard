# Project Structure Redesign

## Goal

Reorganize the codebase for clearer conventions and better scalability. Update README to focus on what Clawboard delivers.

## Changes

### 1. Backend Code Restructure

Move root `lib/` into `src/` with explicit directories:

| From | To |
|------|-----|
| `lib/db.ts` | `src/db/index.ts` |
| `lib/types.ts` | `src/schemas/index.ts` |
| `lib/operations/*.ts` | `src/api/*.ts` |

New structure:
```
src/
├── api/                    # Backend operations (CRUD)
│   ├── index.ts
│   ├── agents.ts
│   ├── tasks.ts
│   ├── documents.ts
│   ├── messages.ts
│   ├── activities.ts
│   ├── audits.ts
│   └── notifications.ts
├── db/
│   └── index.ts
├── schemas/
│   └── index.ts
└── types/
    └── index.ts
```

### 2. Components Reorganization (Type-Based)

| From | To |
|------|-----|
| `components/tasks/kanban-board.tsx` | `components/display/kanban-board.tsx` |
| `components/tasks/task-card.tsx` | `components/display/task-card.tsx` |
| `components/activity/activity-timeline.tsx` | `components/display/activity-timeline.tsx` |
| `components/agents/agents-column.tsx` | `components/display/agents-column.tsx` |
| `components/tasks/task-modal.tsx` | `components/forms/task-modal.tsx` |
| `components/tasks/task-drawer.tsx` | `components/forms/task-drawer.tsx` |
| `components/layout/header.tsx` | `components/layout/header.tsx` (unchanged) |
| `components/shared/*` | `components/shared/*` (unchanged) |
| `components/ui/*` | `components/ui/*` (unchanged) |

Final structure:
```
components/
├── layout/            # Page structure
│   └── header.tsx
├── display/           # Data presentation
│   ├── kanban-board.tsx
│   ├── task-card.tsx
│   ├── activity-timeline.tsx
│   └── agents-column.tsx
├── forms/             # User input
│   ├── task-modal.tsx
│   └── task-drawer.tsx
├── shared/            # Reusable primitives
│   ├── agent-avatar.tsx
│   ├── status-dot.tsx
│   └── relative-time.tsx
└── ui/                # shadcn/ui (unchanged)
```

### 3. Hooks Directory

Move theme hook to proper location:

| From | To |
|------|-----|
| `components/use-theme.ts` | `hooks/use-theme.ts` |

Add `hooks/index.ts` for re-exports.

### 4. Assets

Move logos to `src/assets/`:
- `public/logo.png` → `src/assets/logo.png`
- `public/logo-no-bg.png` → `src/assets/logo-no-bg.png`

Delete template leftovers:
- `public/vite.svg`
- `public/react.svg`
- `src/assets/react.svg`

### 5. Fix Path Alias

Update `tsconfig.json` to resolve `@/test/*` path alias issue.

### 6. README Updates

#### Rewrite Features Section

Replace current technical feature list with outcome-focused "What Clawboard Delivers":

```markdown
## What Clawboard Delivers

### Agent Task Monitoring
Track what your AI agents are working on in real-time. See at a glance
which agents are active, idle, or blocked. Monitor task progress across
your entire agent fleet from a single dashboard.

### Multi-Agent Coordination
Assign tasks to one or multiple agents. Visualize workload distribution
across your team. Prevent conflicts by seeing who's working on what.

### Activity Feed
Follow every action as it happens — task movements, comments, status
changes. Know which agent did what and when. Full audit trail for
debugging agent behavior.

### Kanban Workflow
Organize work through Backlog → In Progress → Review → Done stages.
Drag tasks between columns. Quick-create tasks without leaving the board.

### CLI Integration
Script and automate with full CRUD operations. Create tasks, assign
agents, post messages — all from the command line. Perfect for
agent-to-agent communication.

### Persistent Storage
SQLite database keeps everything saved. Survive restarts. Query your
data directly if needed.
```

#### Add Project Structure Section

```markdown
## Project Structure

```
src/
├── api/           # Backend operations (CRUD for all entities)
├── db/            # SQLite database connection
├── schemas/       # Zod validation schemas
├── types/         # TypeScript type definitions
├── components/
│   ├── layout/    # Header, page wrappers
│   ├── display/   # Cards, boards, timelines
│   ├── forms/     # Modals, drawers, inputs
│   ├── shared/    # Avatars, status indicators
│   └── ui/        # shadcn/ui primitives
├── hooks/         # Custom React hooks
├── pages/         # Page components
├── lib/           # Utilities (cn, constants)
├── test/          # Test setup and helpers
└── assets/        # Images, logos

bin/               # CLI executable
db/                # SQLite database and schema
docs/plans/        # Design and implementation docs
public/            # Favicons, manifest
```
```

## Final Directory Tree

```
clawboard/
├── bin/
│   ├── clawboard
│   └── clawboard.ts
├── db/
│   ├── schema.sql
│   └── clawboard.db
├── docs/
│   └── plans/
├── public/
│   ├── favicon.ico
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── apple-touch-icon.png
│   ├── android-chrome-192x192.png
│   ├── android-chrome-512x512.png
│   └── site.webmanifest
├── src/
│   ├── api/
│   ├── db/
│   ├── schemas/
│   ├── types/
│   ├── components/
│   │   ├── layout/
│   │   ├── display/
│   │   ├── forms/
│   │   ├── shared/
│   │   └── ui/
│   ├── hooks/
│   ├── pages/
│   ├── lib/
│   ├── test/
│   ├── assets/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── CLAUDE.md
└── README.md
```

## Implementation Notes

- Update all import paths after moving files
- Update `bin/clawboard.ts` imports from `../lib/` to `@/api/`, `@/db/`, `@/schemas/`
- Verify tsconfig paths work for both app and CLI
- Run tests after restructure to catch broken imports
- Update CLAUDE.md to reflect new structure
