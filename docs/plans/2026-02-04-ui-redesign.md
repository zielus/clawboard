# UI Redesign: Visual Hierarchy Improvements

## Goal

Improve visual hierarchy so important details are easier to spot at a glance.

## Color System

### CSS Variables (`index.css`)

```css
/* Task status colors */
--status-backlog: oklch(0.55 0.01 260);      /* gray - waiting */
--status-in-progress: oklch(0.65 0.20 250);  /* blue - active work */
--status-review: oklch(0.75 0.15 85);        /* amber - needs attention */
--status-done: oklch(0.65 0.17 145);         /* green - complete */

/* Agent status colors */
--agent-idle: oklch(0.55 0.01 260);          /* gray - not working */
--agent-active: oklch(0.65 0.17 145);        /* green - working */
--agent-blocked: oklch(0.60 0.20 25);        /* red - problem */

/* Column backgrounds (status color at ~5% opacity) */
--column-bg-backlog: oklch(0.55 0.01 260 / 5%);
--column-bg-in-progress: oklch(0.65 0.20 250 / 5%);
--column-bg-review: oklch(0.75 0.15 85 / 5%);
--column-bg-done: oklch(0.65 0.17 145 / 5%);
```

### TypeScript Constants (`src/lib/constants.ts`)

```ts
export const TASK_STATUS_COLORS = {
  backlog: 'var(--status-backlog)',
  in_progress: 'var(--status-in-progress)',
  review: 'var(--status-review)',
  done: 'var(--status-done)',
} as const;

export const AGENT_STATUS_COLORS = {
  idle: 'var(--agent-idle)',
  active: 'var(--agent-active)',
  blocked: 'var(--agent-blocked)',
} as const;

export const COLUMN_BACKGROUNDS = {
  backlog: 'var(--column-bg-backlog)',
  in_progress: 'var(--column-bg-in-progress)',
  review: 'var(--column-bg-review)',
  done: 'var(--column-bg-done)',
} as const;
```

## Header Redesign

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo] Mission Control   │  4 Backlog · 2 In Progress · 1 Review · 10 Total  │  [⏸ Pause] [↻] [◐] │
│ Tasks  Memory  Docs      │            (centered stats)                        │     controls      │
└─────────────────────────────────────────────────────────────────┘
```

### Changes

- **Height**: Increase from `h-14` to `h-16` or `h-18`
- **Background**: `bg-muted` instead of border-bottom separator
- **Nav items**: Remove "Projects" and "Agents"
- **Icons**: Add icons to Tasks, Memory, Docs (Memory/Docs stay disabled)
  - Tasks: `CheckSquare`
  - Memory: `Brain`
  - Docs: `FileText`

### Centered Stats

- Large colorful numbers using status colors
- Smaller muted label below each
- Stats: Backlog, In Progress, Review, Total

### Control Buttons

- **Pause/Resume**: Icon + label (`[⏸ Pause]` / `[▶ Resume]`)
  - Icon morphs smoothly between pause/play
  - Label swaps alongside
  - Color: green when running, amber when paused
  - Tooltip: "Pause agents" / "Resume agents"
- **Refresh**: Icon only
  - Rotates 360° on click with easing
  - Tooltip: "Refresh data"
- **Theme toggle**: Unchanged

## Tasks Page Layout

### Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                          HEADER                                  │
├──────────┬────────────────────────────────────┬─────────────────┤
│  AGENTS  │            KANBAN BOARD            │    ACTIVITY     │
│          │                                    │                 │
│ [card]   │  Backlog   In Progress   Review   Done              │
│ [card]   │  [task]    [task]        [task]   [task]            │
│ [card]   │  [task]    [task]                 [task]            │
│          │                                    │                 │
│          │                                    │    [item]       │
│          │                                    │    [item]       │
└──────────┴────────────────────────────────────┴─────────────────┘
```

### Changes

- Remove `StatsRow` component (stats moved to header)
- Remove `ActionRow` component (agent filters removed)
- Add Agents column on left
- Keep Activity timeline on right (restyle to match agents column)

## Agents Column

### Purpose

Display all agents with their current status. No filtering behavior (display only).

### Agent Card Layout

```
┌─────────────────────────┐
│ [Avatar]  Agent Name    │
│           Role          │
│ ● Active       2m ago   │
└─────────────────────────┘
```

### Implementation

- Use shadcn `Card` component with defaults
- `AgentAvatar` component for avatar
- `RelativeTime` component for timestamp
- Status dot: 8px circle with color from `AGENT_STATUS_COLORS`
- Status label: "Idle", "Active", "Blocked"
- Scrollable container

## Task Card

### Layout

```
┌─────────────────────────┐
│ CardHeader              │
│  ● Title                │
│  Description (muted)    │
├─────────────────────────┤
│ CardFooter              │
│  [Av] Assignee   2m ago │
└─────────────────────────┘
```

### Implementation

- Use shadcn `Card` component as wrapper (make clickable)
- `CardHeader` containing:
  - Status dot (8px, colored from `TASK_STATUS_COLORS`)
  - `CardTitle` for task title
  - `CardDescription` for task description (if present)
- `CardFooter` containing:
  - `AgentAvatar` + assignee name (or "Unassigned")
  - `RelativeTime` timestamp, right-aligned

## Kanban Board

### Changes

- Remove vertical separator lines between columns
- Add subtle tinted background per column using status color at ~5% opacity
- Small gap between columns for visual separation
- Column headers keep status dot + label

### Visual

```
┌─────────┬─────────┬─────────┬─────────┐
│ Backlog │In Prog. │ Review  │  Done   │
│ (gray   │ (blue   │ (amber  │ (green  │
│  tint)  │  tint)  │  tint)  │  tint)  │
└─────────┴─────────┴─────────┴─────────┘
```

## Activity Timeline

### Purpose

Show recent activity with consistent styling matching agents column.

### Activity Item Layout

```
┌──────────────────────────┐
│ [Av] John created        │
│      "Fix login bug…"    │
│                   2m ago │
└──────────────────────────┘
```

### Implementation

- Use shadcn `Card` component (matches agent cards)
- Small `AgentAvatar` (24px) on left
- Line 1: Agent name + action verb
- Line 2: Task title in quotes, truncated if long
- Line 3: Timestamp right-aligned, muted
- Scrollable container

### Action Vocabulary

- task_created → "created"
- task_updated → "updated"
- status_changed → "moved to {status}"
- message_sent → "commented on"

## General Changes

- Drop "Projects" feature entirely (no filtering, buttons, or views)
- All timestamps use `RelativeTime` component (already exists)
- Use shadcn components with minimal custom styling
- Prefer defaults, only customize when necessary

## Files to Modify

1. `src/index.css` - Add CSS variables for status colors and column backgrounds
2. `src/lib/constants.ts` - Create with color mappings
3. `src/components/layout/header.tsx` - Redesign with new layout
4. `src/pages/tasks.tsx` - Three-column layout, remove StatsRow/ActionRow
5. `src/components/tasks/kanban-column.tsx` - Add background colors, remove separators
6. `src/components/tasks/task-card.tsx` - Refactor to use shadcn Card components
7. `src/components/activity/activity-timeline.tsx` - Restyle with cards and avatars
8. New: `src/components/agents/agent-card.tsx` - Agent card component
9. New: `src/components/agents/agents-column.tsx` - Agents sidebar

## Files to Remove/Deprecate

- `src/components/tasks/stats-row.tsx` - Stats moved to header
- `src/components/tasks/action-row.tsx` - Agent filters removed
