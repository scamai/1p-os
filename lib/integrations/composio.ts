// =============================================================================
// 1P OS — Composio Integration
// Unified SDK for 500+ third-party app integrations (Gmail, Slack, GitHub, etc.)
// Agents discover and execute Composio tools through the gateway.
// =============================================================================

import type { UUID } from "@/lib/types";

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------

let _composioInstance: ComposioClient | null = null;

/**
 * Lightweight wrapper around the Composio SDK.
 * Lazily imports @composio/core so the app still boots without it configured.
 */
export class ComposioClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sdk: any = null;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /** Initialize the underlying SDK (lazy, one-time). */
  private async init() {
    if (this.sdk) return;
    const { Composio } = await import("@composio/core");
    this.sdk = new Composio({ apiKey: this.apiKey });
  }

  // ─── Toolkits ───────────────────────────────────────────────────────────────

  /** List available toolkits (e.g. github, gmail, slack). */
  async listToolkits(): Promise<ComposioToolkit[]> {
    await this.init();
    try {
      const toolkits = await this.sdk.toolkits.list();
      return toolkits.items.map((tk: Record<string, unknown>) => ({
        slug: tk.slug as string,
        name: tk.name as string,
        description: (tk.description as string) ?? "",
        logo: (tk.logo as string) ?? null,
        categories: (tk.categories as string[]) ?? [],
      }));
    } catch (err) {
      console.error("[composio] listToolkits failed:", err);
      return [];
    }
  }

  /** Get toolkit info by slug. */
  async getToolkit(slug: string): Promise<ComposioToolkit | null> {
    await this.init();
    try {
      const tk = await this.sdk.toolkits.get(slug);
      return {
        slug: tk.slug,
        name: tk.name,
        description: tk.description ?? "",
        logo: tk.logo ?? null,
        categories: tk.categories ?? [],
      };
    } catch {
      return null;
    }
  }

  // ─── Tools ──────────────────────────────────────────────────────────────────

  /** List tools, optionally filtered by toolkit slugs. */
  async listTools(opts?: {
    toolkits?: string[];
    limit?: number;
  }): Promise<ComposioTool[]> {
    await this.init();
    try {
      const params: Record<string, unknown> = {};
      if (opts?.toolkits?.length) params.toolkits = opts.toolkits;

      const tools = await this.sdk.tools.list(params);
      const items = tools.items ?? tools;
      return (items as Record<string, unknown>[])
        .slice(0, opts?.limit ?? 100)
        .map(mapTool);
    } catch (err) {
      console.error("[composio] listTools failed:", err);
      return [];
    }
  }

  /** Get a single tool by slug (e.g. GMAIL_SEND_EMAIL). */
  async getTool(slug: string): Promise<ComposioTool | null> {
    await this.init();
    try {
      const tool = await this.sdk.tools.get(slug);
      return mapTool(tool);
    } catch {
      return null;
    }
  }

  /** Execute a Composio tool. */
  async executeTool(
    toolSlug: string,
    userId: string,
    input: Record<string, unknown>,
  ): Promise<ComposioToolResult> {
    await this.init();
    try {
      const result = await this.sdk.tools.execute(toolSlug, {
        userId,
        arguments: input,
      });
      return {
        success: true,
        data: result.data ?? result,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return { success: false, error: message };
    }
  }

  // ─── Connected Accounts ─────────────────────────────────────────────────────

  /** Create a connection link for a user to authorize a toolkit. */
  async createConnectionLink(
    userId: string,
    toolkitSlug: string,
    redirectUrl: string,
  ): Promise<{ url: string; connectionId: string } | null> {
    await this.init();
    try {
      const link = await this.sdk.connectedAccounts.create({
        userId,
        toolkitSlug,
        redirectUrl,
      });
      return {
        url: link.url ?? link.connectionUrl,
        connectionId: link.id ?? link.connectedAccountId,
      };
    } catch (err) {
      console.error("[composio] createConnectionLink failed:", err);
      return null;
    }
  }

  /** List connected accounts for a user. */
  async listConnectedAccounts(
    userId: string,
  ): Promise<ComposioConnection[]> {
    await this.init();
    try {
      const accounts = await this.sdk.connectedAccounts.list({ userId });
      const items = accounts.items ?? accounts;
      return (items as Record<string, unknown>[]).map((a) => ({
        id: a.id as string,
        toolkitSlug: (a.toolkitSlug ?? a.appName) as string,
        status: (a.status as string) ?? "active",
        createdAt: (a.createdAt as string) ?? new Date().toISOString(),
      }));
    } catch (err) {
      console.error("[composio] listConnectedAccounts failed:", err);
      return [];
    }
  }

  /** Disconnect / revoke a connected account. */
  async deleteConnection(connectionId: string): Promise<boolean> {
    await this.init();
    try {
      await this.sdk.connectedAccounts.delete(connectionId);
      return true;
    } catch {
      return false;
    }
  }

  // ─── Triggers ───────────────────────────────────────────────────────────────

  /** Subscribe to events from a connected account (webhooks). */
  async subscribeTrigger(
    userId: string,
    connectedAccountId: string,
    triggerSlug: string,
    webhookUrl: string,
  ): Promise<{ triggerId: string } | null> {
    await this.init();
    try {
      const trigger = await this.sdk.triggers.create({
        userId,
        connectedAccountId,
        triggerSlug,
        webhookUrl,
      });
      return { triggerId: trigger.id ?? trigger.triggerId };
    } catch (err) {
      console.error("[composio] subscribeTrigger failed:", err);
      return null;
    }
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComposioToolkit {
  slug: string;
  name: string;
  description: string;
  logo: string | null;
  categories: string[];
}

export interface ComposioTool {
  slug: string;
  name: string;
  description: string;
  toolkitSlug: string;
  inputSchema: Record<string, unknown>;
  tags: string[];
}

export interface ComposioToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface ComposioConnection {
  id: string;
  toolkitSlug: string;
  status: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapTool(raw: Record<string, unknown>): ComposioTool {
  return {
    slug: raw.slug as string,
    name: (raw.name as string) ?? (raw.slug as string),
    description: (raw.description as string) ?? "",
    toolkitSlug: ((raw.toolkit as Record<string, unknown>)?.slug ??
      raw.appName ??
      "") as string,
    inputSchema: (raw.inputParameters ?? raw.parameters ?? {}) as Record<
      string,
      unknown
    >,
    tags: (raw.tags as string[]) ?? [],
  };
}

// ---------------------------------------------------------------------------
// Singleton accessor
// ---------------------------------------------------------------------------

/**
 * Get the Composio client. Returns null if COMPOSIO_API_KEY is not set.
 */
export function getComposioClient(): ComposioClient | null {
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) return null;

  if (!_composioInstance) {
    _composioInstance = new ComposioClient(apiKey);
  }
  return _composioInstance;
}

/**
 * Check whether Composio is configured.
 */
export function isComposioEnabled(): boolean {
  return !!process.env.COMPOSIO_API_KEY;
}
