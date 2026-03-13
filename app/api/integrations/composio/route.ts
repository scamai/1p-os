// =============================================================================
// 1P OS — Composio Integration API
// Manages Composio connections, toolkits, and tool execution.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getComposioClient,
  isComposioEnabled,
} from "@/lib/integrations/composio";

// ---------------------------------------------------------------------------
// GET — List toolkits, tools, or connected accounts
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isComposioEnabled()) {
    return NextResponse.json({ error: "composio_not_configured" }, { status: 400 });
  }

  const client = getComposioClient()!;
  const action = req.nextUrl.searchParams.get("action");

  switch (action) {
    case "toolkits": {
      const toolkits = await client.listToolkits();
      return NextResponse.json({ toolkits });
    }

    case "tools": {
      const toolkitFilter = req.nextUrl.searchParams.get("toolkit");
      const tools = await client.listTools({
        toolkits: toolkitFilter ? [toolkitFilter] : undefined,
        limit: 50,
      });
      return NextResponse.json({ tools });
    }

    case "connections": {
      const connections = await client.listConnectedAccounts(user.id);
      return NextResponse.json({ connections });
    }

    default: {
      // Overview: return enabled status + connection count
      const connections = await client.listConnectedAccounts(user.id);
      return NextResponse.json({
        enabled: true,
        connectionCount: connections.length,
        connections,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// POST — Connect account, execute tool, or subscribe trigger
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isComposioEnabled()) {
    return NextResponse.json({ error: "composio_not_configured" }, { status: 400 });
  }

  const client = getComposioClient()!;
  const body = await req.json();
  const action = body.action as string;

  switch (action) {
    // ─── Connect a new app ────────────────────────────────────────────────────
    case "connect": {
      const { toolkitSlug, redirectUrl } = body;
      if (!toolkitSlug) {
        return NextResponse.json(
          { error: "toolkitSlug is required" },
          { status: 400 },
        );
      }

      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const redirect = redirectUrl ?? `${appUrl}/channels?composio_connected=1`;

      const link = await client.createConnectionLink(
        user.id,
        toolkitSlug,
        redirect,
      );

      if (!link) {
        return NextResponse.json(
          { error: "Failed to create connection link" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        url: link.url,
        connectionId: link.connectionId,
      });
    }

    // ─── Execute a tool ───────────────────────────────────────────────────────
    case "execute": {
      const { toolSlug, input } = body;
      if (!toolSlug) {
        return NextResponse.json(
          { error: "toolSlug is required" },
          { status: 400 },
        );
      }

      const result = await client.executeTool(toolSlug, user.id, input ?? {});

      // Log to audit_log
      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (biz) {
        await supabase.from("audit_log").insert({
          business_id: biz.id,
          actor: "composio",
          action: `composio:${toolSlug}`,
          resource_type: "tool_execution",
          success: result.success,
          metadata: {
            toolSlug,
            input,
            error: result.error ?? null,
          },
        });
      }

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 },
        );
      }

      return NextResponse.json({ data: result.data });
    }

    // ─── Subscribe to trigger ─────────────────────────────────────────────────
    case "subscribe": {
      const { connectedAccountId, triggerSlug, webhookUrl } = body;
      if (!connectedAccountId || !triggerSlug) {
        return NextResponse.json(
          { error: "connectedAccountId and triggerSlug are required" },
          { status: 400 },
        );
      }

      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const webhook =
        webhookUrl ?? `${appUrl}/api/integrations/composio/webhook`;

      const trigger = await client.subscribeTrigger(
        user.id,
        connectedAccountId,
        triggerSlug,
        webhook,
      );

      if (!trigger) {
        return NextResponse.json(
          { error: "Failed to subscribe trigger" },
          { status: 500 },
        );
      }

      return NextResponse.json(trigger);
    }

    default:
      return NextResponse.json(
        { error: `Unknown action: ${action}` },
        { status: 400 },
      );
  }
}

// ---------------------------------------------------------------------------
// DELETE — Disconnect a Composio account
// ---------------------------------------------------------------------------

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isComposioEnabled()) {
    return NextResponse.json({ error: "composio_not_configured" }, { status: 400 });
  }

  const client = getComposioClient()!;
  const body = await req.json();
  const { connectionId } = body;

  if (!connectionId) {
    return NextResponse.json(
      { error: "connectionId is required" },
      { status: 400 },
    );
  }

  const success = await client.deleteConnection(connectionId);
  return NextResponse.json({ success });
}
