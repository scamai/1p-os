// =============================================================================
// 1P OS — Gateway Protocol Types
// WebSocket-style communication frames for real-time agent streaming
// =============================================================================

import type { UUID, Timestamp } from '@/lib/types';

// -----------------------------------------------------------------------------
// Frame Types
// -----------------------------------------------------------------------------

export type FrameType = 'req' | 'res' | 'event';

export interface RequestFrame {
  type: 'req';
  id: string;
  method: string;
  params?: Record<string, unknown>;
}

export interface ResponseFrame {
  type: 'res';
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: string;
}

export interface EventFrame {
  type: 'event';
  event: string;
  payload: unknown;
  seq: number;
}

export type Frame = RequestFrame | ResponseFrame | EventFrame;

// -----------------------------------------------------------------------------
// Agent Streaming Events
// -----------------------------------------------------------------------------

export interface AgentStreamEvent {
  sessionId: string;
  runId: string;
  text?: string;
  toolCall?: {
    id: string;
    name: string;
    arguments: string;
  };
  toolResult?: {
    id: string;
    content: string;
  };
  usage?: {
    input: number;
    output: number;
    total: number;
  };
  stopReason?: 'completed' | 'tool_calls' | 'max_tokens' | 'error';
  costUsd?: number;
}

// -----------------------------------------------------------------------------
// Session Types
// -----------------------------------------------------------------------------

export interface Session {
  id: string;
  agentId: UUID;
  channel: string;
  lastActivity: Timestamp;
  model?: string;
  messageCount: number;
}

// -----------------------------------------------------------------------------
// Gateway Methods (RPC method registry)
// -----------------------------------------------------------------------------

export type GatewayMethod =
  | 'tools.list'
  | 'tools.execute'
  | 'channels.list'
  | 'channels.send'
  | 'sessions.list'
  | 'automations.list'
  | 'automations.add'
  | 'agent.run';

export interface GatewayRequest {
  method: GatewayMethod;
  params?: Record<string, unknown>;
}

export interface GatewayResponse {
  ok: boolean;
  data?: unknown;
  error?: string;
}

// -----------------------------------------------------------------------------
// SSE Event Types
// -----------------------------------------------------------------------------

export type SSEEventType =
  | 'agent.stream'
  | 'agent.complete'
  | 'tool.call'
  | 'tool.result'
  | 'notification'
  | 'channel.message'
  | 'automation.run'
  | 'heartbeat';

export interface SSEEvent {
  type: SSEEventType;
  data: unknown;
  timestamp: Timestamp;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

export function createRequestFrame(
  id: string,
  method: string,
  params?: Record<string, unknown>
): RequestFrame {
  return { type: 'req', id, method, params };
}

export function createResponseFrame(
  id: string,
  ok: boolean,
  payloadOrError?: unknown
): ResponseFrame {
  if (ok) {
    return { type: 'res', id, ok: true, payload: payloadOrError };
  }
  return {
    type: 'res',
    id,
    ok: false,
    error: typeof payloadOrError === 'string'
      ? payloadOrError
      : 'Unknown error',
  };
}

export function createEventFrame(
  event: string,
  payload: unknown,
  seq: number
): EventFrame {
  return { type: 'event', event, payload, seq };
}

export function encodeSSE(event: SSEEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
}
