// ── Activity Feed — In-memory event bus with SSE support ──

export type ActivityEventType =
  | "task_completed"
  | "decision_created"
  | "goal_decomposed"
  | "email_sent"
  | "error"
  | "heartbeat_start"
  | "heartbeat_end";

export interface ActivityEvent {
  id: string;
  timestamp: string;
  agentName: string;
  agentRole: string;
  action: string;
  detail?: string;
  costUsd?: number;
  goalTitle?: string;
  type: ActivityEventType;
}

// ── In-memory store ──

const MAX_EVENTS = 200;
const events: ActivityEvent[] = [];
let subIdCounter = 0;
const subscribers = new Map<number, (event: ActivityEvent) => void>();

/** Add an event to the feed and notify all subscribers. */
export function pushEvent(event: ActivityEvent): void {
  events.unshift(event);
  if (events.length > MAX_EVENTS) {
    events.length = MAX_EVENTS;
  }
  for (const cb of subscribers.values()) {
    try {
      cb(event);
    } catch {
      // Subscriber error — ignore to protect other subscribers
    }
  }
}

/** Return the most recent N events (newest first). */
export function getRecentEvents(limit = 50): ActivityEvent[] {
  return events.slice(0, limit);
}

/** Subscribe to new events. Returns a subscription id for unsubscribing. */
export function subscribeToEvents(
  callback: (event: ActivityEvent) => void
): number {
  const id = ++subIdCounter;
  subscribers.set(id, callback);
  return id;
}

/** Unsubscribe from events by subscription id. */
export function unsubscribe(id: number): void {
  subscribers.delete(id);
}
