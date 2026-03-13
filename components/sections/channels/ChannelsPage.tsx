"use client";

import * as React from "react";
import { AISummary } from "@/components/shared/AISummary";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PROVIDERS, type ProviderConfig } from "@/lib/integrations/providers";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Integration {
  id: string;
  provider: string;
  label: string;
  status: "active" | "pending" | "error" | "revoked";
  metadata?: Record<string, unknown>;
  last_synced_at?: string;
  created_at: string;
}

// ─── Provider display order ──────────────────────────────────────────────────

const DISPLAY_ORDER: { id: string; fallbackName: string; icon: string }[] = [
  { id: "gmail", fallbackName: "Gmail", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { id: "outlook", fallbackName: "Outlook", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { id: "google_calendar", fallbackName: "Google Calendar", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { id: "google_drive", fallbackName: "Google Drive", icon: "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" },
  { id: "slack", fallbackName: "Slack", icon: "M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5zm-5 0c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5S11 2.67 11 3.5v5c0 .83-.67 1.5-1.5 1.5z" },
  { id: "notion", fallbackName: "Notion", icon: "M4 4h16v16H4z M8 8h8 M8 12h8 M8 16h4" },
  { id: "discord", fallbackName: "Discord", icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
  { id: "telegram", fallbackName: "Telegram", icon: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" },
  { id: "whatsapp", fallbackName: "WhatsApp", icon: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" },
  { id: "twilio", fallbackName: "SMS (Twilio)", icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
];

function ChannelIcon({ d }: { d: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-shrink-0 text-zinc-500"
    >
      <path d={d} />
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

function ChannelsPage() {
  const [integrations, setIntegrations] = React.useState<Integration[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [connecting, setConnecting] = React.useState<string | null>(null);
  const [disconnecting, setDisconnecting] = React.useState<string | null>(null);
  const [configError, setConfigError] = React.useState<{ provider: string; message: string } | null>(null);

  // Fetch integrations on mount
  const fetchIntegrations = React.useCallback(async () => {
    try {
      const res = await fetch("/api/integrations");
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data.integrations ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  // Check URL params for connection result
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected")) {
      fetchIntegrations();
      // Clean URL
      window.history.replaceState({}, "", "/channels");
    }
    if (params.get("error")) {
      console.error("Integration error:", params.get("error"));
      window.history.replaceState({}, "", "/channels");
    }
  }, [fetchIntegrations]);

  const handleConnect = async (providerId: string) => {
    setConnecting(providerId);
    setConfigError(null);
    try {
      const res = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerId }),
      });

      const data = await res.json();

      if (data.error === "not_configured") {
        setConfigError({ provider: providerId, message: data.message });
        return;
      }

      if (!res.ok) return;

      if (data.authType === "oauth2" && data.url) {
        window.location.href = data.url;
      }
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (integration: Integration) => {
    setDisconnecting(integration.id);
    try {
      const res = await fetch("/api/integrations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationId: integration.id }),
      });

      if (res.ok) {
        setIntegrations((prev) => prev.filter((i) => i.id !== integration.id));
      }
    } finally {
      setDisconnecting(null);
    }
  };

  const getIntegration = (providerId: string): Integration | undefined =>
    integrations.find((i) => i.provider === providerId);

  const connectedCount = integrations.filter((i) => i.status === "active").length;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Channels</h1>
          <p className="text-sm text-zinc-500">
            Connect your accounts so agents can read, send, and manage on your behalf.
          </p>
        </div>
        {connectedCount > 0 && (
          <Badge variant="success">{connectedCount} connected</Badge>
        )}
      </div>

      <div className="mt-2">
        <AISummary section="channels" />
      </div>

      {/* Config error banner */}
      {configError && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <svg className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">{configError.message}</p>
              <p className="mt-1 text-xs text-amber-600">
                Add the required environment variables to your <code className="rounded bg-amber-100 px-1">.env.local</code> file, then restart the server.
              </p>
            </div>
            <button onClick={() => setConfigError(null)} className="text-amber-400 hover:text-amber-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Channel list */}
      <div className="mt-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-zinc-100" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col">
            {DISPLAY_ORDER.map((item) => {
              const integration = getIntegration(item.id);
              const provider = PROVIDERS[item.id];
              const isConnected = integration?.status === "active";
              const isConnecting = connecting === item.id;
              const isOAuth = provider?.authType === "oauth2";
              const isApiKey = provider?.authType === "api_key";

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-zinc-100 py-3 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <ChannelIcon d={item.icon} />
                    <div>
                      <p className="text-sm text-zinc-900">
                        {provider?.name ?? item.fallbackName}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {isConnected ? (
                          <>
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1" />
                            {integration.label}
                            {integration.last_synced_at && (
                              <span className="text-zinc-400">
                                {" "}&middot; synced {timeAgo(integration.last_synced_at)}
                              </span>
                            )}
                          </>
                        ) : integration?.status === "error" ? (
                          <span className="text-red-500">Connection error — reconnect</span>
                        ) : (
                          <span className="text-zinc-400">
                            {provider?.description ?? "Not connected"}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <>
                        <Badge variant="success">Active</Badge>
                        <button
                          onClick={() => handleDisconnect(integration)}
                          disabled={disconnecting === integration.id}
                          className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          {disconnecting === integration.id ? "..." : "Disconnect"}
                        </button>
                      </>
                    ) : isOAuth ? (
                      <Button
                        onClick={() => handleConnect(item.id)}
                        loading={isConnecting}
                        className="text-xs"
                      >
                        Connect
                      </Button>
                    ) : isApiKey ? (
                      <button
                        onClick={() => handleConnect(item.id)}
                        className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
                      >
                        Configure
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Connected integrations detail */}
      {integrations.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold text-zinc-900">
            Connected Accounts
          </h2>
          <div className="mt-3 rounded-lg border border-zinc-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">Service</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">Account</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">Status</th>
                  <th className="px-3 py-2 text-right font-medium text-zinc-500">Connected</th>
                </tr>
              </thead>
              <tbody>
                {integrations.map((integration) => {
                  const provider = PROVIDERS[integration.provider];
                  return (
                    <tr key={integration.id} className="border-b border-zinc-100 last:border-0">
                      <td className="px-3 py-2 font-medium text-zinc-900">
                        {provider?.name ?? integration.provider}
                      </td>
                      <td className="px-3 py-2 text-zinc-600">
                        {integration.label}
                      </td>
                      <td className="px-3 py-2">
                        <Badge
                          variant={
                            integration.status === "active"
                              ? "success"
                              : integration.status === "error"
                                ? "destructive"
                                : "default"
                          }
                        >
                          {integration.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right text-zinc-500">
                        {timeAgo(integration.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* What agents can do */}
      <div className="mt-10 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <h3 className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">
          What your agents can do with connected accounts
        </h3>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-600">
          <div className="flex items-center gap-2">
            <CheckIcon />
            Read and triage your inbox
          </div>
          <div className="flex items-center gap-2">
            <CheckIcon />
            Draft and send emails
          </div>
          <div className="flex items-center gap-2">
            <CheckIcon />
            Reply to messages on Slack
          </div>
          <div className="flex items-center gap-2">
            <CheckIcon />
            Schedule calendar events
          </div>
          <div className="flex items-center gap-2">
            <CheckIcon />
            Manage files in Drive
          </div>
          <div className="flex items-center gap-2">
            <CheckIcon />
            Send notifications via SMS
          </div>
        </div>
        <p className="mt-3 text-[10px] text-zinc-500">
          All actions go through the safety pipeline. Sensitive actions (sending emails, payments) require your approval.
        </p>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="h-3 w-3 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  return new Date(dateStr).toLocaleDateString();
}

export { ChannelsPage };
