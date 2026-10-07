import type { ChatEvent, ConversationMessage, VisitorContext } from '../chat-events';

export type TaskStatus = 'queued' | 'running' | 'waiting' | 'completed' | 'canceled' | 'failed';
export type TaskDelivery = 'pending' | 'submitted' | 'interrupted' | 'quiet';
export interface TaskInput {
  requestId: string;
  message: string;
  history: ConversationMessage[];
  context?: VisitorContext;
  receivedAt?: number;
  voice?: boolean;
  sessionId?: string;
  delegationId?: string;
}
export interface AgentTask {
  id: string;
  revision: number;
  instruction: string;
  input: TaskInput;
  status: TaskStatus;
  events: ChatEvent[];
  answer: string;
  updatedAt: number;
  delivery: TaskDelivery;
  previousResult?: { goal: string; status: TaskStatus; answer: string } | null;
}
export interface TaskSnapshot {
  version: number;
  turns: { id: string; input: TaskInput }[];
  tasks: AgentTask[];
}
export interface TaskPlan {
  actions: { kind: 'start' | 'update' | 'cancel' | 'continue'; taskId?: string; instruction?: string }[];
  reply?: string;
}
export const activeTask = (task: Pick<AgentTask, 'status'>) => ['queued', 'running', 'waiting'].includes(task.status);

/** Persist coherent text chunks rather than one database event per streamed token. */
export function addTaskEvent(events: ChatEvent[], event: ChatEvent): ChatEvent[] {
  const last = events.at(-1);
  if (event.type === 'text' && last?.type === 'text') return [...events.slice(0, -1), { type: 'text', delta: last.delta + event.delta }];
  return [...events, event];
}
