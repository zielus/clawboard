# UI Redesign Design Document

**Date:** 2025-02-05
**Status:** Approved
**Source:** v0 Mission Control Dashboard (`/Users/zielu/Projects/mission-control-dashboar`)

## Overview

Migrate the v0 Mission Control UI to Clawboard, keeping our OKLCH color theme and branding while adopting their visual polish, component design, and layout proportions.

## Goals

- Adopt v0's polished visual design (cleaner cards, better spacing, refined hover states)
- Keep Clawboard's existing color scheme (OKLCH variables in `index.css`)
- Preserve existing data types and backend logic
- Simplify where possible (consolidate task statuses, activity types)

## Migration Approach: Hybrid

Copy v0's component code directly into the project, then adapt each file to use our color variables and data types.

**Why this approach:**
- v0's components are already well-structured and ready to copy
- Keep existing Vite + React 19 setup (no Next.js migration)
- HSL classes map to our CSS variables automatically (both use shadcn/ui conventions)
- Data types map nearly 1:1

## File Changes

### Components to Replace

| v0 Source | Clawboard Destination |
|-----------|----------------------|
| `components/dashboard-header.tsx` | `src/components/layout/header.tsx` |
| `components/agents-panel.tsx` | `src/components/agents/agents-column.tsx` |
| `components/kanban-board.tsx` | `src/components/tasks/kanban-board.tsx` |
| `components/activity-feed.tsx` | `src/components/activity/activity-timeline.tsx` |

### Files to Keep

- `src/lib/types.ts` - Zod schemas and types (will be updated)
- `src/lib/mock-data.ts` - Sample data (will be updated)
- `src/lib/db.ts` - Database connection
- `src/index.css` - OKLCH color theme
- `src/components/ui/*` - shadcn/ui components (may add missing ones)

### Files to Update

- `src/pages/tasks.tsx` - Adjust imports and props for new component APIs
- `db/schema.sql` - Update CHECK constraints for new statuses/types

## Schema Changes

### Task Status

**Before:**
```sql
CHECK(status IN ('inbox', 'assigned', 'in_progress', 'review', 'done'))
```

**After:**
```sql
CHECK(status IN ('backlog', 'in_progress', 'review', 'done'))
```

Consolidates `inbox` and `assigned` into `backlog`.

### Activity Type

**Before:**
```sql
CHECK(type IN ('task_created', 'task_updated', 'status_changed', 'message_sent', 'document_created', 'audit_completed'))
```

**After:**
```sql
CHECK(type IN ('created', 'moved', 'commented', 'updated'))
```

Mapping:
| Old Type | New Type | UI Display | Icon |
|----------|----------|------------|------|
| `task_created`, `document_created` | `created` | "created" | Plus |
| `status_changed` | `moved` | "moved" | Arrow |
| `message_sent` | `commented` | "commented" | MessageSquare |
| `task_updated`, `audit_completed` | `updated` | "updated" | Pencil |

## Type Changes

### TaskStatus

```typescript
// Before
export type TaskStatus = "inbox" | "assigned" | "in_progress" | "review" | "done";

// After
export type TaskStatus = "backlog" | "in_progress" | "review" | "done";
```

### ActivityType

```typescript
// Before
export type ActivityType =
  | "task_created"
  | "task_updated"
  | "status_changed"
  | "message_sent"
  | "document_created"
  | "audit_completed";

// After
export type ActivityType = "created" | "moved" | "commented" | "updated";
```

## UI Specifications

### Layout (from v0)

```
┌─────────────────────────────────────────────────────────┐
│              Header (h-14)                               │
├─────────┬──────────────────────────────┬────────────────┤
│ Agents  │      Kanban Board            │   Activity     │
│ Panel   │      (flex-1)                │   Feed         │
│ w-64    │                              │   w-72         │
│         │   [4 scrollable columns]     │                │
└─────────┴──────────────────────────────┴────────────────┘
```

### Responsive Behavior

- Mobile/Tablet: Only Kanban board visible
- Large screens (lg): Agents panel + Kanban
- Extra large screens (xl): All three columns

### Multiple Assignees

Display as avatar stack on task cards. Data already supports this via `task_assignees` junction table and `assignees?: Agent[]` on Task type.

### Branding

- Keep rocket icon from v0
- Replace "Mission Control" → "Clawboard"

## Implementation Order

1. **Prep** - Install missing shadcn/ui components via CLI
2. **Copy** - Copy all 4 v0 components at once
3. **Colors** - Bulk find-replace any non-standard color classes
4. **Types** - Update schema.sql and types.ts
5. **Adapt** - Wire components to use Clawboard types and mock data
6. **Page** - Update TasksPage to match new component APIs
7. **Branding** - Replace name, verify logo
8. **Cleanup** - Remove old/unused components

## Out of Scope

- Task creation modal (add later)
- Task detail drawer (add later)
- Backend API integration (existing mock data for now)
- Additional pages (Memory, Docs - remain stubbed)
