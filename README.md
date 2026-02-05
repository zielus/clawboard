# Clawboard

Mission Control for coordinating AI agents. A task management and communication hub for multi-agent workflows.

## Features

### Task Management

- **Kanban Board** — 4-column board with Backlog, In Progress, Review, and Done stages
- **Task Cards** — Title, description, assignee avatars, and creation dates
- **Task Details** — Side drawer with full task info, status controls, and comments
- **Quick Create** — New task modal with status and assignee selection

### Agent Collaboration

- **Agent Sidebar** — Visual roster of active agents with status indicators
- **Status Tracking** — Real-time agent states: Active (green), Idle (amber), Blocked (red)
- **Task Assignment** — Assign single or multiple agents to tasks
- **Agent Tooltips** — Hover to see role, status, and last activity

### Activity Feed

- **Real-time Timeline** — Track task movements, comments, and updates
- **Action Attribution** — See which agent performed each action
- **Color-coded Actions** — Visual distinction for moved/created/commented/updated

### User Interface

- **Dark/Light Mode** — Theme toggle with localStorage persistence
- **Responsive Layout** — Adapts from mobile to desktop
- **Live Stats** — Task counts by status in the header
- **Modern Design** — Clean UI with Inter font and OKLCH colors

### Data & CLI

- **SQLite Database** — Persistent storage with WAL mode
- **CLI Tool** — Full CRUD operations for all entities
- **Zod Validation** — Type-safe data handling

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 7
- **Styling**: Tailwind CSS v4, shadcn/ui, Radix UI
- **Backend**: Hono, better-sqlite3
- **Validation**: Zod

## Quick Start

```bash
pnpm install
./bin/clawboard setup
pnpm dev
```

## CLI Usage

The `clawboard` CLI provides CRUD operations for all entities:

```bash
clawboard <entity>:<action> '<json>'
```

### Examples

```bash
# Create an agent
clawboard agents:create '{"name": "Claude", "role": "Assistant", "status": "active"}'

# Create a task
clawboard tasks:create '{"title": "Review PR", "status": "backlog"}'

# Assign agent to task
clawboard tasks:assign '{"taskId": "...", "agentId": "..."}'

# Send a message
clawboard messages:create '{"taskId": "...", "agentId": "...", "content": "Starting review"}'
```

See [CLAUDE.md](./CLAUDE.md) for full CLI documentation.

## Development

```bash
pnpm dev      # Start Vite dev server
pnpm build    # Build for production
pnpm lint     # Run ESLint
pnpm preview  # Preview production build
```

## Database

- SQLite database in `db/clawboard.db`
- Schema defined in `db/schema.sql`
- Run `clawboard setup` to initialize
