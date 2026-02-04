import { z } from 'zod';

// === ENUMS ===

export const AgentStatus = z.enum(['idle', 'active', 'blocked']);
export type AgentStatus = z.infer<typeof AgentStatus>;

export const TaskStatus = z.enum(['inbox', 'assigned', 'in_progress', 'review', 'done']);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const ThreatLevel = z.enum(['safe', 'warning', 'critical']);
export type ThreatLevel = z.infer<typeof ThreatLevel>;

export const ActivityType = z.enum([
  'task_created',
  'task_updated',
  'status_changed',
  'message_sent',
  'document_created',
  'audit_completed',
]);
export type ActivityType = z.infer<typeof ActivityType>;

export const DocumentType = z.enum(['deliverable', 'research', 'protocol']);
export type DocumentType = z.infer<typeof DocumentType>;

// === AGENTS ===

export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string().nullable(),
  badge: z.string().nullable(),
  status: AgentStatus,
  current_task_id: z.string().nullable(),
  session_key: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Agent = z.infer<typeof AgentSchema>;

export const CreateAgentInput = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  badge: z.string().optional(),
  status: AgentStatus.optional().default('idle'),
  sessionKey: z.string().optional(),
});
export type CreateAgentInput = z.infer<typeof CreateAgentInput>;

export const UpdateAgentInput = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  role: z.string().nullable().optional(),
  badge: z.string().nullable().optional(),
  status: AgentStatus.optional(),
  currentTaskId: z.string().nullable().optional(),
  sessionKey: z.string().nullable().optional(),
});
export type UpdateAgentInput = z.infer<typeof UpdateAgentInput>;

// === TASKS ===

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: TaskStatus,
  created_at: z.string(),
  updated_at: z.string(),
});
export type Task = z.infer<typeof TaskSchema>;

export const CreateTaskInput = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: TaskStatus.optional().default('inbox'),
  assigneeIds: z.array(z.string()).optional(),
});
export type CreateTaskInput = z.infer<typeof CreateTaskInput>;

export const UpdateTaskInput = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: TaskStatus.optional(),
});
export type UpdateTaskInput = z.infer<typeof UpdateTaskInput>;

export const AssignTaskInput = z.object({
  id: z.string(),
  agentIds: z.array(z.string()),
});
export type AssignTaskInput = z.infer<typeof AssignTaskInput>;

// === MESSAGES ===

export const MessageSchema = z.object({
  id: z.string(),
  task_id: z.string(),
  from_agent_id: z.string().nullable(),
  content: z.string(),
  created_at: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;

export const CreateMessageInput = z.object({
  taskId: z.string(),
  fromAgentId: z.string().optional(),
  content: z.string().min(1),
  attachmentIds: z.array(z.string()).optional(),
});
export type CreateMessageInput = z.infer<typeof CreateMessageInput>;

export const AttachToMessageInput = z.object({
  id: z.string(),
  documentIds: z.array(z.string()),
});
export type AttachToMessageInput = z.infer<typeof AttachToMessageInput>;

// === DOCUMENTS ===

export const DocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string().nullable(),
  type: DocumentType.nullable(),
  task_id: z.string().nullable(),
  agent_id: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Document = z.infer<typeof DocumentSchema>;

export const CreateDocumentInput = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  type: DocumentType.optional(),
  taskId: z.string().optional(),
  agentId: z.string().optional(),
});
export type CreateDocumentInput = z.infer<typeof CreateDocumentInput>;

// === AUDITS ===

export const AuditSchema = z.object({
  id: z.string(),
  task_id: z.string(),
  threat_level: ThreatLevel.nullable(),
  content: z.string().nullable(),
  created_at: z.string(),
});
export type Audit = z.infer<typeof AuditSchema>;

export const CreateAuditInput = z.object({
  taskId: z.string(),
  threatLevel: ThreatLevel.optional(),
  content: z.string().optional(),
});
export type CreateAuditInput = z.infer<typeof CreateAuditInput>;

// === ACTIVITIES ===

export const ActivitySchema = z.object({
  id: z.string(),
  type: ActivityType,
  agent_id: z.string().nullable(),
  task_id: z.string().nullable(),
  message: z.string(),
  created_at: z.string(),
});
export type Activity = z.infer<typeof ActivitySchema>;

export const CreateActivityInput = z.object({
  type: ActivityType,
  agentId: z.string().optional(),
  taskId: z.string().optional(),
  message: z.string().min(1),
});
export type CreateActivityInput = z.infer<typeof CreateActivityInput>;

// === NOTIFICATIONS ===

export const NotificationSchema = z.object({
  id: z.string(),
  mentioned_agent_id: z.string(),
  content: z.string(),
  delivered: z.number().transform((v) => Boolean(v)),
  created_at: z.string(),
});
export type Notification = z.infer<typeof NotificationSchema>;

export const CreateNotificationInput = z.object({
  mentionedAgentId: z.string(),
  content: z.string().min(1),
});
export type CreateNotificationInput = z.infer<typeof CreateNotificationInput>;
