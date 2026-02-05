# ClawBoard Design History

This document captures key decisions from previous design iterations.

## Evolution

**v1 (Feb 2):** Simple Kanban board with Gemini security auditing

- 4 columns: backlog, in_progress, review, completed
- Threat levels with Telegram alerts via Happy persona
- Single assignee per task

**v2 (Feb 4):** Mission Control redesign

- 6 tables: agents, tasks, audits, messages, activities, documents
- 3-column UI: Agents | Mission Queue | Live Feed
- 5 columns: inbox, assigned, in_progress, review, done
- CLI pattern: `clawboard entity:action '<json>'`

**v3 (Feb 4):** Current database migration

- 7 tables + 2 junction tables
- Multiple assignees per task (task_assignees junction)
- Message attachments (message_attachments junction)
- Notifications table for @mentions
- CLI-only for now (routes deferred)

## Key Decisions

**SQLite over Postgres:** Shared file database allows agents to write directly. WAL mode for concurrent access.

**Junction tables over arrays:** SQLite doesn't support arrays. Junction tables (task_assignees, message_attachments) handle many-to-many relationships properly.

**CLI-first:** Agents interact via `clawboard entity:action '<json>'`. HTTP routes added later for UI.

**Port 18790:** Standard local network access for Mac Mini deployment.

**Activity auto-creation:** CLI automatically logs activities when tasks, messages, or documents change.

## Tech Stack

- React 19, Vite 7, Tailwind CSS v4, shadcn/ui
- Hono + @hono/node-server (ready for routes)
- better-sqlite3, zod, uuid
- @dnd-kit for drag-drop (when UI added)

## Deferred Features

- API routes (polling, SSE)
- UI components (3-column layout, agent cards, activity feed)
- Gemini security auditing
- Happy persona Telegram alerts
