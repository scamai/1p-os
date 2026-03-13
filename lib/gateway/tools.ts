// =============================================================================
// 1P OS — Tool Registry
// Agent-discoverable tool system with safety-checked execution
// =============================================================================

import type { UUID } from '@/lib/types';
import { executeAgent } from '@/lib/agents/runtime';
import { agentMemory } from '@/lib/agents/memory';
import { contextCompactor } from '@/lib/agents/context-compactor';
import { sessionManager } from '@/lib/agents/sessions';

// -----------------------------------------------------------------------------
// Tool Types
// -----------------------------------------------------------------------------

export type ToolCategory =
  | 'browse'
  | 'execute'
  | 'communicate'
  | 'file'
  | 'data'
  | 'device'
  | 'automation';

export interface ToolDefinition {
  name: string;
  description: string;
  category: ToolCategory;
  inputSchema: Record<string, unknown>;
  ownerOnly?: boolean;
  execute: (
    input: Record<string, unknown>,
    context: ToolContext
  ) => Promise<ToolResult>;
}

export interface ToolContext {
  agentId: UUID;
  businessId: UUID;
  sessionId: string;
  channel?: string;
}

export interface ToolResult {
  type: 'text' | 'image' | 'error' | 'json';
  content: string;
}

export interface ToolListItem {
  name: string;
  description: string;
  category: ToolCategory;
  inputSchema: Record<string, unknown>;
  ownerOnly?: boolean;
}

// -----------------------------------------------------------------------------
// Stub helper
// -----------------------------------------------------------------------------

function stub(message: string): Promise<ToolResult> {
  return Promise.resolve({
    type: 'json' as const,
    content: JSON.stringify({ stub: true, message }),
  });
}

// -----------------------------------------------------------------------------
// Built-in Tool Definitions
// -----------------------------------------------------------------------------

const BUILT_IN_TOOLS: ToolDefinition[] = [
  {
    name: 'web_browse',
    description: 'Browse a URL and extract content',
    category: 'browse',
    inputSchema: {
      type: 'object',
      required: ['url'],
      properties: {
        url: { type: 'string', description: 'The URL to browse' },
        selector: { type: 'string', description: 'Optional CSS selector to extract specific content' },
      },
    },
    execute: async (input) => stub(`Browsed ${input.url}`),
  },
  {
    name: 'web_search',
    description: 'Search the web for information',
    category: 'browse',
    inputSchema: {
      type: 'object',
      required: ['query'],
      properties: {
        query: { type: 'string', description: 'Search query' },
        maxResults: { type: 'number', description: 'Maximum number of results' },
      },
    },
    execute: async (input) => stub(`Searched for "${input.query}"`),
  },
  {
    name: 'send_email',
    description: 'Send an email to a recipient via connected Gmail or Outlook',
    category: 'communicate',
    inputSchema: {
      type: 'object',
      required: ['to', 'subject', 'body'],
      properties: {
        to: { type: 'string', description: 'Recipient email address' },
        subject: { type: 'string', description: 'Email subject line' },
        body: { type: 'string', description: 'Email body content (HTML supported)' },
        replyTo: { type: 'string', description: 'Optional reply-to address' },
      },
    },
    ownerOnly: true,
    execute: async (input, context) => {
      try {
        const { createClient } = await import('@/lib/supabase/server');
        const { sendEmail } = await import('@/lib/integrations/email');
        const supabase = await createClient();

        // Find a connected email integration for this business
        const { data: integration } = await supabase
          .from('integrations')
          .select('id, provider, credentials_encrypted')
          .eq('business_id', context.businessId)
          .in('provider', ['gmail', 'outlook'])
          .eq('status', 'active')
          .limit(1)
          .single();

        if (!integration?.credentials_encrypted) {
          return {
            type: 'error' as const,
            content: 'No email account connected. Connect Gmail or Outlook in Channels.',
          };
        }

        const provider = integration.provider as 'gmail' | 'outlook';
        const result = await sendEmail(provider, integration.credentials_encrypted, {
          to: [input.to as string],
          subject: input.subject as string,
          body: input.body as string,
        });

        // Update credentials if they were refreshed
        if (result.updatedCredentials) {
          await supabase
            .from('integrations')
            .update({
              credentials_encrypted: result.updatedCredentials,
              last_synced_at: new Date().toISOString(),
            })
            .eq('id', integration.id);
        }

        return {
          type: 'json' as const,
          content: JSON.stringify({
            sent: true,
            messageId: result.messageId,
            provider,
            to: input.to,
          }),
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return { type: 'error' as const, content: `send_email failed: ${message}` };
      }
    },
  },
  {
    name: 'read_email',
    description: 'Read recent emails from connected Gmail or Outlook inbox',
    category: 'communicate',
    inputSchema: {
      type: 'object',
      properties: {
        maxResults: { type: 'number', description: 'Number of emails to fetch (default: 10)' },
        query: { type: 'string', description: 'Search query to filter emails' },
      },
    },
    execute: async (input, context) => {
      try {
        const { createClient } = await import('@/lib/supabase/server');
        const { listEmails } = await import('@/lib/integrations/email');
        const supabase = await createClient();

        const { data: integration } = await supabase
          .from('integrations')
          .select('id, provider, credentials_encrypted')
          .eq('business_id', context.businessId)
          .in('provider', ['gmail', 'outlook'])
          .eq('status', 'active')
          .limit(1)
          .single();

        if (!integration?.credentials_encrypted) {
          return {
            type: 'error' as const,
            content: 'No email account connected. Connect Gmail or Outlook in Channels.',
          };
        }

        const provider = integration.provider as 'gmail' | 'outlook';
        const result = await listEmails(provider, integration.credentials_encrypted, {
          maxResults: (input.maxResults as number) ?? 10,
          query: input.query as string | undefined,
        });

        if (result.updatedCredentials) {
          await supabase
            .from('integrations')
            .update({
              credentials_encrypted: result.updatedCredentials,
              last_synced_at: new Date().toISOString(),
            })
            .eq('id', integration.id);
        }

        return {
          type: 'json' as const,
          content: JSON.stringify({
            count: result.messages.length,
            provider,
            messages: result.messages,
          }),
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return { type: 'error' as const, content: `read_email failed: ${message}` };
      }
    },
  },
  {
    name: 'send_message',
    description: 'Send a message via a connected channel',
    category: 'communicate',
    inputSchema: {
      type: 'object',
      required: ['channel', 'to', 'text'],
      properties: {
        channel: { type: 'string', description: 'Channel ID (e.g., slack, whatsapp)' },
        to: { type: 'string', description: 'Recipient identifier' },
        text: { type: 'string', description: 'Message text' },
      },
    },
    execute: async (input) => stub(`Message sent via ${input.channel} to ${input.to}`),
  },
  {
    name: 'create_invoice',
    description: 'Create a new invoice',
    category: 'data',
    inputSchema: {
      type: 'object',
      required: ['clientName', 'amount'],
      properties: {
        clientName: { type: 'string', description: 'Client name' },
        clientEmail: { type: 'string', description: 'Client email' },
        amount: { type: 'number', description: 'Invoice amount' },
        currency: { type: 'string', description: 'Currency code (default: USD)' },
        description: { type: 'string', description: 'Invoice description' },
        dueDate: { type: 'string', description: 'Due date (ISO 8601)' },
      },
    },
    ownerOnly: true,
    execute: async (input) =>
      stub(`Invoice created for ${input.clientName}: $${input.amount}`),
  },
  {
    name: 'query_data',
    description: 'Query business data from the database',
    category: 'data',
    inputSchema: {
      type: 'object',
      required: ['table'],
      properties: {
        table: {
          type: 'string',
          enum: ['relationships', 'invoices', 'deadlines', 'memories', 'agents'],
          description: 'Table to query',
        },
        filters: {
          type: 'object',
          description: 'Key-value filters to apply',
        },
        limit: { type: 'number', description: 'Max rows to return (default: 50)' },
        orderBy: { type: 'string', description: 'Column to order by' },
      },
    },
    execute: async (input) => stub(`Queried ${input.table}`),
  },
  {
    name: 'file_read',
    description: 'Read a file from the vault',
    category: 'file',
    inputSchema: {
      type: 'object',
      required: ['path'],
      properties: {
        path: { type: 'string', description: 'File path within the vault' },
      },
    },
    execute: async (input) => stub(`Read file at ${input.path}`),
  },
  {
    name: 'file_write',
    description: 'Write a file to the vault',
    category: 'file',
    inputSchema: {
      type: 'object',
      required: ['path', 'content'],
      properties: {
        path: { type: 'string', description: 'File path within the vault' },
        content: { type: 'string', description: 'File content' },
        overwrite: { type: 'boolean', description: 'Overwrite if exists (default: false)' },
      },
    },
    ownerOnly: true,
    execute: async (input) => stub(`Wrote file at ${input.path}`),
  },
  {
    name: 'schedule_task',
    description: 'Schedule a recurring task',
    category: 'automation',
    inputSchema: {
      type: 'object',
      required: ['name', 'schedule', 'message'],
      properties: {
        name: { type: 'string', description: 'Task name' },
        schedule: { type: 'string', description: 'Cron expression or interval' },
        message: { type: 'string', description: 'Message/prompt to execute on trigger' },
        timezone: { type: 'string', description: 'Timezone (default: UTC)' },
      },
    },
    execute: async (input) => stub(`Scheduled task "${input.name}"`),
  },
  {
    name: 'send_notification',
    description: 'Send a notification to the founder',
    category: 'device',
    inputSchema: {
      type: 'object',
      required: ['title', 'body'],
      properties: {
        title: { type: 'string', description: 'Notification title' },
        body: { type: 'string', description: 'Notification body' },
        urgency: {
          type: 'string',
          enum: ['low', 'normal', 'high', 'critical'],
          description: 'Notification urgency',
        },
        actionUrl: { type: 'string', description: 'URL to open on tap' },
      },
    },
    execute: async (input) => stub(`Notification sent: ${input.title}`),
  },
  {
    name: 'generate_canvas',
    description: 'Generate visual content on the canvas',
    category: 'execute',
    inputSchema: {
      type: 'object',
      required: ['prompt'],
      properties: {
        prompt: { type: 'string', description: 'Description of the visual to generate' },
        format: {
          type: 'string',
          enum: ['svg', 'html', 'markdown'],
          description: 'Output format (default: svg)',
        },
        width: { type: 'number', description: 'Canvas width in pixels' },
        height: { type: 'number', description: 'Canvas height in pixels' },
      },
    },
    execute: async (input) => stub(`Canvas generated for: ${input.prompt}`),
  },
  {
    name: 'code_execute',
    description: 'Execute code in a sandboxed environment',
    category: 'execute',
    inputSchema: {
      type: 'object',
      required: ['language', 'code'],
      properties: {
        language: {
          type: 'string',
          enum: ['javascript', 'python', 'shell'],
          description: 'Programming language',
        },
        code: { type: 'string', description: 'Code to execute' },
        timeout: { type: 'number', description: 'Execution timeout in ms (default: 30000)' },
      },
    },
    ownerOnly: true,
    execute: async (input) => stub(`Executed ${input.language} code`),
  },
];

// -----------------------------------------------------------------------------
// Tool Registry
// -----------------------------------------------------------------------------

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  constructor() {
    // Pre-register built-in tools
    for (const tool of BUILT_IN_TOOLS) {
      this.tools.set(tool.name, tool);
    }
  }

  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered`);
    }
    this.tools.set(tool.name, tool);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  list(category?: ToolCategory): ToolListItem[] {
    const tools = Array.from(this.tools.values());
    const filtered = category
      ? tools.filter((t) => t.category === category)
      : tools;

    return filtered.map((t) => ({
      name: t.name,
      description: t.description,
      category: t.category,
      inputSchema: t.inputSchema,
      ownerOnly: t.ownerOnly,
    }));
  }

  async execute(
    name: string,
    input: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> {
    const tool = this.tools.get(name);

    if (!tool) {
      return {
        type: 'error',
        content: `Tool "${name}" not found`,
      };
    }

    // Safety: owner-only tools require additional validation upstream
    // (the gateway route checks agent permissions before calling execute)

    try {
      const result = await tool.execute(input, context);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown execution error';
      return {
        type: 'error',
        content: `Tool "${name}" failed: ${message}`,
      };
    }
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  unregister(name: string): boolean {
    return this.tools.delete(name);
  }
}

// Singleton instance
export const toolRegistry = new ToolRegistry();

// -----------------------------------------------------------------------------
// Agent & Session Tools
// -----------------------------------------------------------------------------

toolRegistry.register({
  name: 'spawn_agent',
  description: 'Spawn a child agent to handle a subtask',
  category: 'automation',
  inputSchema: {
    type: 'object',
    required: ['agentId', 'instruction'],
    properties: {
      agentId: { type: 'string', description: 'ID of the agent to spawn' },
      instruction: { type: 'string', description: 'Instruction / prompt for the subtask' },
    },
  },
  execute: async (input, context) => {
    try {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      const result = await executeAgent(
        input.agentId as string,
        {
          type: 'message',
          data: { message: { content: input.instruction as string } },
          chain_id: context.sessionId,
          chain_depth: 1,
        },
        supabase,
      );
      return {
        type: 'json' as const,
        content: JSON.stringify(result),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { type: 'error' as const, content: `spawn_agent failed: ${message}` };
    }
  },
});

toolRegistry.register({
  name: 'list_agent_tasks',
  description: 'List tasks delegated to child agents',
  category: 'data',
  inputSchema: {
    type: 'object',
    required: ['parentAgentId'],
    properties: {
      parentAgentId: { type: 'string', description: 'ID of the parent agent' },
      status: { type: 'string', description: 'Filter by task status (active, idle, archived)' },
    },
  },
  execute: async (input) => {
    try {
      const sessions = sessionManager.list({
        agentId: input.parentAgentId as string,
        status: (input.status as 'active' | 'idle' | 'archived') ?? undefined,
      });
      return {
        type: 'json' as const,
        content: JSON.stringify(sessions),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { type: 'error' as const, content: `list_agent_tasks failed: ${message}` };
    }
  },
});

toolRegistry.register({
  name: 'search_memory',
  description: "Search an agent's long-term memory",
  category: 'data',
  inputSchema: {
    type: 'object',
    required: ['agentId', 'query'],
    properties: {
      agentId: { type: 'string', description: 'Agent whose memory to search' },
      query: { type: 'string', description: 'Search query' },
      limit: { type: 'number', description: 'Max results to return (default: 10)' },
    },
  },
  execute: async (input) => {
    try {
      const results = agentMemory.search(
        input.agentId as string,
        input.query as string,
        (input.limit as number) ?? 10,
      );
      return {
        type: 'json' as const,
        content: JSON.stringify(results),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { type: 'error' as const, content: `search_memory failed: ${message}` };
    }
  },
});

toolRegistry.register({
  name: 'store_memory',
  description: 'Store a new memory for an agent',
  category: 'data',
  inputSchema: {
    type: 'object',
    required: ['agentId', 'content', 'category'],
    properties: {
      agentId: { type: 'string', description: 'Agent to store the memory for' },
      content: { type: 'string', description: 'Memory content' },
      category: {
        type: 'string',
        enum: ['fact', 'preference', 'relationship', 'event', 'insight'],
        description: 'Memory category',
      },
      importance: { type: 'number', description: 'Importance score 0-1 (default: 0.5)' },
    },
  },
  execute: async (input, context) => {
    try {
      const entry = agentMemory.add(
        input.agentId as string,
        context.businessId,
        {
          content: input.content as string,
          category: input.category as 'fact' | 'preference' | 'relationship' | 'event' | 'insight',
          importance: (input.importance as number) ?? undefined,
        },
      );
      return {
        type: 'json' as const,
        content: JSON.stringify(entry),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { type: 'error' as const, content: `store_memory failed: ${message}` };
    }
  },
});

toolRegistry.register({
  name: 'compact_context',
  description: "Compact a session's context window to save tokens",
  category: 'automation',
  inputSchema: {
    type: 'object',
    required: ['sessionId'],
    properties: {
      sessionId: { type: 'string', description: 'Session to compact' },
      maxMessages: { type: 'number', description: 'Number of recent messages to keep (default: 10)' },
    },
  },
  execute: async (input) => {
    try {
      const maxMessages = (input.maxMessages as number) ?? undefined;
      const result = contextCompactor.compact(input.sessionId as string, {
        keepRecent: maxMessages,
      });
      return {
        type: 'json' as const,
        content: JSON.stringify({
          ...result,
          sessionId: input.sessionId,
        }),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { type: 'error' as const, content: `compact_context failed: ${message}` };
    }
  },
});

toolRegistry.register({
  name: 'list_sessions',
  description: 'List active agent sessions',
  category: 'data',
  inputSchema: {
    type: 'object',
    properties: {
      agentId: { type: 'string', description: 'Filter by agent ID' },
      status: { type: 'string', description: 'Filter by status (active, idle, archived)' },
    },
  },
  execute: async (input) => {
    try {
      const sessions = sessionManager.list({
        agentId: (input.agentId as string) ?? undefined,
        status: (input.status as 'active' | 'idle' | 'archived') ?? undefined,
      });
      return {
        type: 'json' as const,
        content: JSON.stringify(sessions),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { type: 'error' as const, content: `list_sessions failed: ${message}` };
    }
  },
});

// -----------------------------------------------------------------------------
// Composio Tools — Bridge 500+ app integrations into the agent tool system
// -----------------------------------------------------------------------------

toolRegistry.register({
  name: 'composio_list_tools',
  description: 'List available Composio tools from 500+ connected apps (GitHub, Slack, Notion, etc.)',
  category: 'data',
  inputSchema: {
    type: 'object',
    properties: {
      toolkit: { type: 'string', description: 'Filter by toolkit slug (e.g., github, gmail, slack, notion)' },
      limit: { type: 'number', description: 'Max tools to return (default: 20)' },
    },
  },
  execute: async (input) => {
    try {
      const { getComposioClient } = await import('@/lib/integrations/composio');
      const client = getComposioClient();
      if (!client) {
        return {
          type: 'error' as const,
          content: 'Composio is not configured. Add COMPOSIO_API_KEY to enable 500+ app integrations.',
        };
      }

      const tools = await client.listTools({
        toolkits: input.toolkit ? [input.toolkit as string] : undefined,
        limit: (input.limit as number) ?? 20,
      });

      return {
        type: 'json' as const,
        content: JSON.stringify({
          count: tools.length,
          tools: tools.map((t) => ({
            slug: t.slug,
            name: t.name,
            description: t.description,
            toolkit: t.toolkitSlug,
          })),
        }),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { type: 'error' as const, content: `composio_list_tools failed: ${message}` };
    }
  },
});

toolRegistry.register({
  name: 'composio_execute',
  description: 'Execute a Composio tool (e.g., GMAIL_SEND_EMAIL, GITHUB_CREATE_ISSUE, SLACK_SEND_MESSAGE)',
  category: 'execute',
  inputSchema: {
    type: 'object',
    required: ['toolSlug', 'input'],
    properties: {
      toolSlug: {
        type: 'string',
        description: 'Composio tool slug (e.g., GMAIL_SEND_EMAIL, GITHUB_CREATE_REPO, NOTION_CREATE_PAGE)',
      },
      input: {
        type: 'object',
        description: 'Tool-specific input parameters',
      },
    },
  },
  ownerOnly: true,
  execute: async (input, context) => {
    try {
      const { getComposioClient } = await import('@/lib/integrations/composio');
      const client = getComposioClient();
      if (!client) {
        return {
          type: 'error' as const,
          content: 'Composio is not configured. Add COMPOSIO_API_KEY to enable 500+ app integrations.',
        };
      }

      const toolSlug = input.toolSlug as string;
      const toolInput = (input.input as Record<string, unknown>) ?? {};

      // Use businessId as the Composio userId for scoping
      const result = await client.executeTool(toolSlug, context.businessId, toolInput);

      if (!result.success) {
        return {
          type: 'error' as const,
          content: `Composio tool "${toolSlug}" failed: ${result.error}`,
        };
      }

      return {
        type: 'json' as const,
        content: JSON.stringify({
          tool: toolSlug,
          result: result.data,
        }),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { type: 'error' as const, content: `composio_execute failed: ${message}` };
    }
  },
});

toolRegistry.register({
  name: 'composio_connections',
  description: 'List connected Composio accounts and available app integrations',
  category: 'data',
  inputSchema: {
    type: 'object',
    properties: {
      userId: { type: 'string', description: 'User ID to list connections for' },
    },
  },
  execute: async (input, context) => {
    try {
      const { getComposioClient } = await import('@/lib/integrations/composio');
      const client = getComposioClient();
      if (!client) {
        return {
          type: 'error' as const,
          content: 'Composio is not configured.',
        };
      }

      const userId = (input.userId as string) ?? context.businessId;
      const connections = await client.listConnectedAccounts(userId);

      return {
        type: 'json' as const,
        content: JSON.stringify({
          count: connections.length,
          connections: connections.map((c) => ({
            id: c.id,
            app: c.toolkitSlug,
            status: c.status,
            connectedAt: c.createdAt,
          })),
        }),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { type: 'error' as const, content: `composio_connections failed: ${message}` };
    }
  },
});

toolRegistry.register({
  name: 'send_to_agent',
  description: 'Send a message to another agent',
  category: 'communicate',
  inputSchema: {
    type: 'object',
    required: ['fromSessionId', 'toAgentId', 'message'],
    properties: {
      fromSessionId: { type: 'string', description: 'Source session ID' },
      toAgentId: { type: 'string', description: 'Target agent ID' },
      message: { type: 'string', description: 'Message content' },
    },
  },
  execute: async (input) => {
    try {
      const envelope = sessionManager.crossAgentSend(
        input.fromSessionId as string,
        input.toAgentId as string,
        input.message as string,
      );
      return {
        type: 'json' as const,
        content: JSON.stringify({
          sent: true,
          fromSessionId: envelope.fromSessionId,
          fromAgentId: envelope.fromAgentId,
          toAgentId: envelope.toAgentId,
          messageId: envelope.message.id,
        }),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { type: 'error' as const, content: `send_to_agent failed: ${message}` };
    }
  },
});
