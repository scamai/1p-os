// =============================================================================
// 1P OS — Channel Connectors
// Unified messaging abstraction for multi-channel agent communication
// =============================================================================

import type { UUID, Timestamp } from '@/lib/types';

// -----------------------------------------------------------------------------
// Channel Types
// -----------------------------------------------------------------------------

export type ChannelCapability =
  | 'send_text'
  | 'send_media'
  | 'receive'
  | 'threads'
  | 'reactions';

export type ChannelStatus = 'connected' | 'disconnected' | 'error';

export interface ChannelConnector {
  id: string;
  name: string;
  icon: string;
  capabilities: ChannelCapability[];
  status: ChannelStatus;

  connect: (config: Record<string, string>) => Promise<void>;
  disconnect: () => Promise<void>;
  sendText: (
    to: string,
    text: string
  ) => Promise<{ messageId: string }>;
  sendMedia?: (
    to: string,
    mediaUrl: string,
    caption?: string
  ) => Promise<{ messageId: string }>;
  onMessage?: (handler: (msg: InboundMessage) => void) => void;
}

export interface InboundMessage {
  id: string;
  channel: string;
  from: string;
  text: string;
  timestamp: Timestamp;
  threadId?: string;
  mediaUrl?: string;
}

export interface ChannelRoute {
  channel: string;
  pattern: string; // e.g., "#support", "dm:*", "group:team"
  agentId: UUID;
}

export interface ChannelInfo {
  id: string;
  name: string;
  icon: string;
  capabilities: ChannelCapability[];
  status: ChannelStatus;
}

// -----------------------------------------------------------------------------
// Base Channel (shared stub logic)
// -----------------------------------------------------------------------------

function createStubConnector(
  id: string,
  name: string,
  icon: string,
  capabilities: ChannelCapability[]
): ChannelConnector {
  let messageHandler: ((msg: InboundMessage) => void) | null = null;
  let currentStatus: ChannelStatus = 'disconnected';

  return {
    id,
    name,
    icon,
    capabilities,
    get status() {
      return currentStatus;
    },
    set status(s: ChannelStatus) {
      currentStatus = s;
    },

    async connect() {
      currentStatus = 'connected';
    },

    async disconnect() {
      currentStatus = 'disconnected';
      messageHandler = null;
    },

    async sendText(_to: string, _text: string) {
      if (currentStatus !== 'connected') {
        throw new Error(`${name} channel is not connected`);
      }
      return { messageId: crypto.randomUUID() };
    },

    sendMedia: capabilities.includes('send_media')
      ? async (_to: string, _mediaUrl: string, _caption?: string) => {
          if (currentStatus !== 'connected') {
            throw new Error(`${name} channel is not connected`);
          }
          return { messageId: crypto.randomUUID() };
        }
      : undefined,

    onMessage: capabilities.includes('receive')
      ? (handler: (msg: InboundMessage) => void) => {
          messageHandler = handler;
          // Keep reference alive for potential future dispatch
          void messageHandler;
        }
      : undefined,
  };
}

// -----------------------------------------------------------------------------
// Channel Stubs
// -----------------------------------------------------------------------------

export function createWhatsAppConnector(): ChannelConnector {
  return createStubConnector(
    'whatsapp',
    'WhatsApp',
    'message-circle',
    ['send_text', 'send_media', 'receive']
  );
}

export function createSlackConnector(): ChannelConnector {
  return createStubConnector(
    'slack',
    'Slack',
    'hash',
    ['send_text', 'send_media', 'receive', 'threads', 'reactions']
  );
}

export function createEmailConnector(): ChannelConnector {
  return createStubConnector(
    'email',
    'Email',
    'mail',
    ['send_text', 'send_media', 'receive', 'threads']
  );
}

export function createTelegramConnector(): ChannelConnector {
  return createStubConnector(
    'telegram',
    'Telegram',
    'send',
    ['send_text', 'send_media', 'receive', 'reactions']
  );
}

export function createDiscordConnector(): ChannelConnector {
  return createStubConnector(
    'discord',
    'Discord',
    'message-square',
    ['send_text', 'send_media', 'receive', 'threads', 'reactions']
  );
}

export function createSMSConnector(): ChannelConnector {
  return createStubConnector(
    'sms',
    'SMS',
    'smartphone',
    ['send_text', 'receive']
  );
}

export function createWebhookConnector(): ChannelConnector {
  return createStubConnector(
    'webhook',
    'Webhook',
    'globe',
    ['send_text', 'receive']
  );
}

// -----------------------------------------------------------------------------
// Channel Manager
// -----------------------------------------------------------------------------

export class ChannelManager {
  private connectors: Map<string, ChannelConnector> = new Map();
  private routes: ChannelRoute[] = [];

  register(connector: ChannelConnector): void {
    this.connectors.set(connector.id, connector);
  }

  get(id: string): ChannelConnector | undefined {
    return this.connectors.get(id);
  }

  list(): ChannelInfo[] {
    return Array.from(this.connectors.values()).map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      capabilities: c.capabilities,
      status: c.status,
    }));
  }

  getConnected(): ChannelInfo[] {
    return this.list().filter((c) => c.status === 'connected');
  }

  // ---------------------------------------------------------------------------
  // Routing
  // ---------------------------------------------------------------------------

  addRoute(route: ChannelRoute): void {
    this.routes.push(route);
  }

  removeRoute(channel: string, pattern: string): void {
    this.routes = this.routes.filter(
      (r) => !(r.channel === channel && r.pattern === pattern)
    );
  }

  getRoutes(): ChannelRoute[] {
    return [...this.routes];
  }

  /**
   * Resolve which agent should handle an inbound message based on routes.
   * Returns the matching agent ID or null if no route matches.
   */
  routeMessage(msg: InboundMessage): UUID | null {
    for (const route of this.routes) {
      if (route.channel !== msg.channel) continue;

      if (this.matchPattern(route.pattern, msg)) {
        return route.agentId;
      }
    }
    return null;
  }

  /**
   * Send a text message through a specific channel connector.
   */
  async sendViaChannel(
    channelId: string,
    to: string,
    text: string
  ): Promise<{ messageId: string }> {
    const connector = this.connectors.get(channelId);

    if (!connector) {
      throw new Error(`Channel "${channelId}" not found`);
    }

    if (connector.status !== 'connected') {
      throw new Error(`Channel "${channelId}" is not connected`);
    }

    return connector.sendText(to, text);
  }

  // ---------------------------------------------------------------------------
  // Pattern Matching
  // ---------------------------------------------------------------------------

  private matchPattern(pattern: string, msg: InboundMessage): boolean {
    // Wildcard: match everything on this channel
    if (pattern === '*') return true;

    // DM patterns: "dm:*" matches any direct message, "dm:user123" matches specific
    if (pattern.startsWith('dm:')) {
      const target = pattern.slice(3);
      if (target === '*') return true;
      return msg.from === target;
    }

    // Group/channel patterns: "group:team" or "#support"
    if (pattern.startsWith('#') || pattern.startsWith('group:')) {
      const target = pattern.startsWith('#')
        ? pattern.slice(1)
        : pattern.slice(6);
      return msg.threadId === target || msg.from === target;
    }

    // Exact match fallback
    return pattern === msg.from || pattern === msg.threadId;
  }
}

// Singleton instance with all channel stubs pre-registered
export const channelManager = new ChannelManager();
channelManager.register(createWhatsAppConnector());
channelManager.register(createSlackConnector());
channelManager.register(createEmailConnector());
channelManager.register(createTelegramConnector());
channelManager.register(createDiscordConnector());
channelManager.register(createSMSConnector());
channelManager.register(createWebhookConnector());
