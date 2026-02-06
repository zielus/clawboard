import type Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import type {
  Task,
  Agent,
  CreateTaskInput,
  UpdateTaskInput,
  AssignTaskInput,
} from "../types";
import { createActivity } from "./activities";

/**
 * Task with populated assignees
 */
export interface TaskWithAssignees extends Task {
  assignees: Agent[];
}

/**
 * Internal helper to get a task with its assignees
 */
function getTaskWithAssignees(
  db: Database.Database,
  taskId: string
): TaskWithAssignees | null {
  const taskStmt = db.prepare(`
    SELECT id, title, description, status, created_at, updated_at
    FROM tasks
    WHERE id = ?
  `);
  const task = taskStmt.get(taskId) as Task | undefined;

  if (!task) {
    return null;
  }

  const assigneesStmt = db.prepare(`
    SELECT a.id, a.name, a.role, a.badge, a.avatar, a.status, a.current_task_id, a.session_key, a.created_at, a.updated_at
    FROM agents a
    INNER JOIN task_assignees ta ON ta.agent_id = a.id
    WHERE ta.task_id = ?
  `);
  const assignees = assigneesStmt.all(taskId) as Agent[];

  return {
    ...task,
    assignees,
  };
}

/**
 * List all tasks with their assignees ordered by created_at descending
 */
export function tasksList(db: Database.Database): TaskWithAssignees[] {
  const tasksStmt = db.prepare(`
    SELECT id, title, description, status, created_at, updated_at
    FROM tasks
    ORDER BY created_at DESC
  `);
  const tasks = tasksStmt.all() as Task[];

  // Get all task-agent assignments in one query
  const assignmentsStmt = db.prepare(`
    SELECT ta.task_id, a.id, a.name, a.role, a.badge, a.avatar, a.status, a.current_task_id, a.session_key, a.created_at, a.updated_at
    FROM task_assignees ta
    INNER JOIN agents a ON a.id = ta.agent_id
  `);
  const assignments = assignmentsStmt.all() as (Agent & { task_id: string })[];

  // Group assignees by task_id
  const assigneesByTaskId = new Map<string, Agent[]>();
  for (const assignment of assignments) {
    const { task_id, ...agent } = assignment;
    if (!assigneesByTaskId.has(task_id)) {
      assigneesByTaskId.set(task_id, []);
    }
    assigneesByTaskId.get(task_id)!.push(agent as Agent);
  }

  // Combine tasks with their assignees
  return tasks.map((task) => ({
    ...task,
    assignees: assigneesByTaskId.get(task.id) ?? [],
  }));
}

/**
 * Create a new task with optional assignees
 * @throws {Error} "title is required" if title is missing or empty
 */
export function tasksCreate(
  db: Database.Database,
  input: CreateTaskInput
): TaskWithAssignees {
  if (!input.title || input.title.trim() === "") {
    throw new Error("title is required");
  }

  const id = uuidv4();
  const status = input.status ?? "backlog";

  const stmt = db.prepare(`
    INSERT INTO tasks (id, title, description, status)
    VALUES (?, ?, ?, ?)
  `);

  stmt.run(id, input.title, input.description ?? null, status);

  // Assign agents if provided
  if (input.assigneeIds && input.assigneeIds.length > 0) {
    const assignStmt = db.prepare(`
      INSERT OR IGNORE INTO task_assignees (task_id, agent_id)
      VALUES (?, ?)
    `);
    for (const agentId of input.assigneeIds) {
      assignStmt.run(id, agentId);
    }
  }

  // Create task_created activity
  createActivity(
    db,
    "task_created",
    `Task created: ${input.title}`,
    undefined,
    id
  );

  return getTaskWithAssignees(db, id)!;
}

/**
 * Update an existing task
 * @throws {Error} "id is required" if id is missing or empty
 */
export function tasksUpdate(
  db: Database.Database,
  input: UpdateTaskInput
): TaskWithAssignees {
  if (!input.id || input.id.trim() === "") {
    throw new Error("id is required");
  }

  // Get current task to check if status is changing
  const currentTask = getTaskWithAssignees(db, input.id);
  const statusChanged =
    input.status !== undefined && currentTask?.status !== input.status;

  // Build dynamic update query
  const updates: string[] = [];
  const values: unknown[] = [];

  if (input.title !== undefined) {
    updates.push("title = ?");
    values.push(input.title);
  }
  if (input.description !== undefined) {
    updates.push("description = ?");
    values.push(input.description);
  }
  if (input.status !== undefined) {
    updates.push("status = ?");
    values.push(input.status);
  }

  if (updates.length > 0) {
    // Always update updated_at
    updates.push("updated_at = datetime('now')");
    values.push(input.id);

    const stmt = db.prepare(`
      UPDATE tasks
      SET ${updates.join(", ")}
      WHERE id = ?
    `);

    stmt.run(...values);

    // Create activity based on what changed
    if (statusChanged) {
      createActivity(
        db,
        "status_changed",
        `Status changed to ${input.status}`,
        undefined,
        input.id
      );
    } else {
      createActivity(db, "task_updated", "Task updated", undefined, input.id);
    }
  }

  return getTaskWithAssignees(db, input.id)!;
}

/**
 * Assign agents to a task
 * @throws {Error} "id is required" if id is missing or empty
 * @throws {Error} "agentIds is required" if agentIds is missing or empty
 */
export function tasksAssign(
  db: Database.Database,
  input: AssignTaskInput
): TaskWithAssignees {
  if (!input.id || input.id.trim() === "") {
    throw new Error("id is required");
  }
  if (!input.agentIds || input.agentIds.length === 0) {
    throw new Error("agentIds is required");
  }

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO task_assignees (task_id, agent_id)
    VALUES (?, ?)
  `);

  for (const agentId of input.agentIds) {
    stmt.run(input.id, agentId);
  }

  return getTaskWithAssignees(db, input.id)!;
}

/**
 * Unassign agents from a task
 * @throws {Error} "id is required" if id is missing or empty
 * @throws {Error} "agentIds is required" if agentIds is missing or empty
 */
export function tasksUnassign(
  db: Database.Database,
  input: AssignTaskInput
): TaskWithAssignees {
  if (!input.id || input.id.trim() === "") {
    throw new Error("id is required");
  }
  if (!input.agentIds || input.agentIds.length === 0) {
    throw new Error("agentIds is required");
  }

  const stmt = db.prepare(`
    DELETE FROM task_assignees
    WHERE task_id = ? AND agent_id = ?
  `);

  for (const agentId of input.agentIds) {
    stmt.run(input.id, agentId);
  }

  return getTaskWithAssignees(db, input.id)!;
}

/**
 * Delete a task
 * @throws {Error} "id is required" if id is missing or empty
 * @returns {deleted: boolean, id: string}
 */
export function tasksDelete(
  db: Database.Database,
  input: { id: string }
): { deleted: boolean; id: string } {
  if (!input.id || input.id.trim() === "") {
    throw new Error("id is required");
  }

  const stmt = db.prepare("DELETE FROM tasks WHERE id = ?");
  const result = stmt.run(input.id);

  return {
    deleted: result.changes > 0,
    id: input.id,
  };
}
