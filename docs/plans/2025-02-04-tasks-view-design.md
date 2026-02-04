# Mission Control: Tasks View Design

## Overview

The Tasks view is the primary interface for Mission Control, providing a kanban-style task board where AI agents coordinate work. This design covers the header, stats, kanban board, task detail drawer, and activity timeline.

## Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ HEADER                                                              │
│ [⊞] Mission Control  [Tasks] [Projects] [Memory] ...  [Pause] [⟳]  │
├─────────────────────────────────────────────────────────────────────┤
│ STATS ROW                                                           │
│ 3 Backlog    1 In progress    12 Total    42% Completion           │
├─────────────────────────────────────────────────────────────────────┤
│ ACTION ROW                                                          │
│ [+ New task]   [All] [Jarvis] [Shuri] ...   [All projects ▾]       │
├───────────────────────────────────────────────────┬─────────────────┤
│ KANBAN BOARD                                      │ ACTIVITY        │
│                                                   │                 │
│  Backlog    In Progress    Review    Done        │ • Agent action  │
│  ┌──────┐                                        │   2 days ago    │
│  │ Card │                                        │ • Agent action  │
│  └──────┘                                        │   3 days ago    │
└───────────────────────────────────────────────────┴─────────────────┘
```

## Components

### Header

- **Logo**: Grid icon + "Mission Control" text
- **Navigation tabs**:
  - Tasks (active)
  - Projects (disabled)
  - Memory (disabled)
  - Docs (disabled)
  - Agents (disabled)
- **Right side controls**:
  - Pause/Resume button (toggles WebSocket polling)
  - Refresh button (manual data fetch)
  - Theme toggle (light/dark mode)

Disabled tabs: `opacity-50 cursor-not-allowed pointer-events-none`

### Stats Row

| Stat | Calculation |
|------|-------------|
| Backlog | Count of tasks with status `inbox` or `assigned` |
| In Progress | Count of tasks with status `in_progress` |
| Total | Count of all tasks (including done) |
| Completion | `done / total * 100` |

- Large number (text-2xl font-semibold)
- Small muted label below
- Updates live via WebSocket

### Action Row

- **New task button**: Opens modal to create task
- **Agent filter chips**: Filter kanban by agent, "All" selected by default
- **Project dropdown**: Disabled for now

### Kanban Board

Four columns:

| Column | Status Values | Dot Color |
|--------|---------------|-----------|
| Backlog | `inbox`, `assigned` | Blue |
| In Progress | `in_progress` | Blue |
| Review | `review` | Yellow |
| Done | `done` | Green |

**Column header**:
- Colored status dot
- Label text
- Task count badge
- "+" button to quick-add task

**Task card anatomy**:
```
┌────────────────────────────┐
│ ● Title of the task...     │  ← status dot + truncated title
│ Description snippet that   │  ← 2 lines max, ellipsis
│ can wrap to two lines...   │
│                            │
│ 🏷 tag-name                │  ← optional tags
│ Ⓐ Agent Name       3d ago │  ← avatar + name + relative time
└────────────────────────────┘
```

Clicking a card opens the task detail drawer.

### Task Detail Drawer

Slides in from right side:

```
┌──────────────────────────────────┐
│ [←] Task Title              [⋮] │  ← back button, menu
├──────────────────────────────────┤
│ Status: [In Progress ▾]         │  ← dropdown
│ Assignee: [Jarvis ▾]            │  ← dropdown
├──────────────────────────────────┤
│ Description                      │
│ Full task description text...    │
├──────────────────────────────────┤
│ COMMENTS                         │
│ ┌──────────────────────────────┐ │
│ │ Ⓐ Shuri · 2h ago            │ │
│ │ Comment content...          │ │
│ └──────────────────────────────┘ │
├──────────────────────────────────┤
│ [Type a comment...]        [Send]│
└──────────────────────────────────┘
```

**Features**:
- Change status via dropdown
- Change assignee via dropdown
- View full description
- Comments thread (from `messages` table)
- Add comment input

### Activity Timeline

Right sidebar showing agent actions:

```
• Agent name action Target Name
  2 days ago
```

- Colored dot (varies by action type)
- Agent name in normal weight
- Action verb in muted color
- Target name in accent color
- Relative timestamp below

**Action type mapping**:
| Type | Display |
|------|---------|
| `task_created` | "created" |
| `task_updated` | "updated" |
| `status_changed` | "moved to [status]" |
| `message_sent` | "commented on" |
| `document_created` | "created document" |
| `audit_completed` | "completed audit" |

Activities are created by the CLI when agents perform actions. Frontend only displays them.

### Create Task Modal

Opens when clicking "+ New task":
- Title input (required)
- Description textarea
- Status dropdown (defaults to Backlog)
- Assignee dropdown (optional)
- Cancel / Create buttons

## Schema Changes

Add `avatar` column to agents table:

```sql
ALTER TABLE agents ADD COLUMN avatar TEXT;
```

**Format options**:
- Emoji: `"🤖"`, `"🦊"`
- Lucide icon name: `"bot"`, `"user"`
- Image URL: `"https://..."`

Frontend detects format and renders accordingly.

## File Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── header.tsx
│   │   ├── layout.tsx
│   │   └── theme-toggle.tsx
│   ├── tasks/
│   │   ├── stats-row.tsx
│   │   ├── action-row.tsx
│   │   ├── kanban-board.tsx
│   │   ├── kanban-column.tsx
│   │   ├── task-card.tsx
│   │   ├── task-drawer.tsx
│   │   ├── task-modal.tsx
│   │   └── comment-thread.tsx
│   ├── activity/
│   │   └── activity-timeline.tsx
│   └── shared/
│       ├── agent-avatar.tsx
│       └── relative-time.tsx
├── hooks/
│   ├── use-websocket.ts
│   └── use-tasks.ts
├── lib/
│   └── types.ts
└── pages/
    └── tasks.tsx
```

## Data Flow

1. `use-websocket` connects to Gateway, receives updates
2. `use-tasks` exposes tasks, agents, activities as state
3. Components subscribe and render
4. Mutations send commands back through WebSocket

## Tech Stack

- React 19 + Vite 7 + TypeScript
- shadcn/ui components
- Tailwind CSS v4 with existing theme variables
- WebSocket connection to Clawdbot Gateway
- Dark mode via `.dark` class toggle
