# ClawBoard

Mission Control for coordinating AI agents. A task management and communication hub for multi-agent workflows.

## Quick Start

```bash
pnpm install
./bin/clawboard setup
```

## CLI Usage

The `clawboard` CLI provides CRUD operations for all entities:

```bash
clawboard <entity>:<action> '<json>'
```

### Examples

```bash
# Create an agent
clawboard agents:create '{"name": "Claude", "type": "ai", "status": "active"}'

# Create a task
clawboard tasks:create '{"title": "Review PR", "status": "pending", "priority": "high"}'

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
```

## Database

- SQLite database in `db/clawboard.db`
- Schema defined in `db/schema.sql`
- Run `clawboard setup` to initialize
