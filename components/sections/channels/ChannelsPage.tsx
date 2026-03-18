"use client";

import * as React from "react";
import { AISummary } from "@/components/shared/AISummary";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
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

// Credential fields required per API-key provider
const API_KEY_FIELDS: Record<string, { label: string; key: string; placeholder: string; type?: string }[]> = {
  discord: [
    { label: "Bot Token", key: "bot_token", placeholder: "Enter your Discord bot token", type: "password" },
    { label: "Server ID (optional)", key: "server_id", placeholder: "e.g. 123456789012345678" },
  ],
  telegram: [
    { label: "Bot Token", key: "bot_token", placeholder: "e.g. 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11", type: "password" },
  ],
  whatsapp: [
    { label: "Phone Number ID", key: "phone_number_id", placeholder: "Your WhatsApp Business phone number ID" },
    { label: "Access Token", key: "access_token", placeholder: "Permanent access token", type: "password" },
  ],
  twilio: [
    { label: "Account SID", key: "account_sid", placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
    { label: "Auth Token", key: "auth_token", placeholder: "Your Twilio auth token", type: "password" },
    { label: "Phone Number", key: "phone_number", placeholder: "+1234567890" },
  ],
};

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

  // API-key modal state
  const [apiKeyModal, setApiKeyModal] = React.useState<string | null>(null);
  const [apiKeyValues, setApiKeyValues] = React.useState<Record<string, string>>({});
  const [apiKeyError, setApiKeyError] = React.useState<string | null>(null);
  const [apiKeySaving, setApiKeySaving] = React.useState(false);

  // Disconnect confirmation
  const [confirmDisconnect, setConfirmDisconnect] = React.useState<Integration | null>(null);

  // Composio state
  const [composioEnabled, setComposioEnabled] = React.useState(false);
  const [composioConnections, setComposioConnections] = React.useState<
    { id: string; toolkitSlug: string; status: string; createdAt: string }[]
  >([]);
  const [composioConnecting, setComposioConnecting] = React.useState<string | null>(null);
  const [composioSearch, setComposioSearch] = React.useState("");
  const [showComposioApps, setShowComposioApps] = React.useState(false);

  // Log viewer
  const [showLogs, setShowLogs] = React.useState(false);
  const [logContent, setLogContent] = React.useState<string | null>(null);
  const [logFiles, setLogFiles] = React.useState<string[]>([]);

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

  // Fetch Composio connections
  const fetchComposioConnections = React.useCallback(async () => {
    try {
      const res = await fetch("/api/integrations/composio");
      if (res.ok) {
        const data = await res.json();
        setComposioEnabled(data.enabled ?? false);
        setComposioConnections(data.connections ?? []);
      }
    } catch {
      // Composio not configured — silently ignore
    }
  }, []);

  React.useEffect(() => {
    fetchComposioConnections();
  }, [fetchComposioConnections]);

  // Check URL params for connection result
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected")) {
      fetchIntegrations();
      window.history.replaceState({}, "", "/channels");
    }
    if (params.get("composio_connected")) {
      fetchComposioConnections();
      window.history.replaceState({}, "", "/channels");
    }
    if (params.get("error")) {
      const errMsg = params.get("error");
      setConfigError({
        provider: "oauth",
        message: `Connection failed: ${errMsg === "token_exchange_failed" ? "Could not complete OAuth. Please try again." : errMsg}`,
      });
      window.history.replaceState({}, "", "/channels");
    }
  }, [fetchIntegrations, fetchComposioConnections]);

  // ─── OAuth connect ──────────────────────────────────────────────────────────
  const handleOAuthConnect = async (providerId: string) => {
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

  // ─── Composio connect ──────────────────────────────────────────────────────
  const handleComposioConnect = async (toolkitSlug: string) => {
    setComposioConnecting(toolkitSlug);
    try {
      const res = await fetch("/api/integrations/composio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect", toolkitSlug }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setComposioConnecting(null);
    }
  };

  const handleComposioDisconnect = async (connectionId: string) => {
    await fetch("/api/integrations/composio", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connectionId }),
    });
    await fetchComposioConnections();
  };

  // ─── API-key connect ────────────────────────────────────────────────────────
  const openApiKeyModal = (providerId: string) => {
    setApiKeyModal(providerId);
    setApiKeyValues({});
    setApiKeyError(null);
  };

  const handleApiKeySubmit = async () => {
    if (!apiKeyModal) return;

    const fields = API_KEY_FIELDS[apiKeyModal];
    if (!fields) return;

    // Validate required fields (all except those marked optional in label)
    const requiredFields = fields.filter((f) => !f.label.toLowerCase().includes("optional"));
    for (const field of requiredFields) {
      if (!apiKeyValues[field.key]?.trim()) {
        setApiKeyError(`${field.label} is required`);
        return;
      }
    }

    setApiKeySaving(true);
    setApiKeyError(null);

    try {
      const res = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: apiKeyModal,
          credentials: apiKeyValues,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiKeyError(data.message ?? "Failed to connect");
        return;
      }

      // Success — close modal and refresh
      setApiKeyModal(null);
      setApiKeyValues({});
      await fetchIntegrations();
    } catch {
      setApiKeyError("Network error — please try again");
    } finally {
      setApiKeySaving(false);
    }
  };

  // ─── Disconnect ─────────────────────────────────────────────────────────────
  const handleDisconnect = async (integration: Integration) => {
    setDisconnecting(integration.id);
    setConfirmDisconnect(null);
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

  // ─── Logs ───────────────────────────────────────────────────────────────────
  const fetchLogs = async () => {
    const res = await fetch("/api/integrations/logs");
    if (res.ok) {
      const data = await res.json();
      setLogContent(data.today);
      setLogFiles(data.files ?? []);
    }
    setShowLogs(true);
  };

  const downloadBackup = () => {
    window.open("/api/integrations/logs?export=true", "_blank");
  };

  const getIntegration = (providerId: string): Integration | undefined =>
    integrations.find((i) => i.provider === providerId);

  const connectedCount = integrations.filter((i) => i.status === "active").length;
  const modalProvider = apiKeyModal ? PROVIDERS[apiKeyModal] : null;
  const modalFields = apiKeyModal ? API_KEY_FIELDS[apiKeyModal] : null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Channels</h1>
          <p className="text-sm text-zinc-500">
            Connect your accounts so agents can read, send, and manage on your behalf.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {connectedCount > 0 && (
            <Badge variant="success">{connectedCount} connected</Badge>
          )}
          <button
            onClick={fetchLogs}
            className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
            title="View action logs"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-2">
        <AISummary section="channels" />
      </div>

      {/* Config error banner */}
      {configError && (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-100 px-4 py-3">
          <div className="flex items-start gap-2">
            <svg className="h-4 w-4 shrink-0 text-zinc-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-800">{configError.message}</p>
              <p className="mt-1 text-xs text-zinc-600">
                Add the required environment variables to your <code className="rounded bg-zinc-200 px-1">.env.local</code> file, then restart the server.
              </p>
            </div>
            <button onClick={() => setConfigError(null)} className="text-zinc-400 hover:text-zinc-600">
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
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-900 mr-1" />
                            {integration.label}
                            {integration.last_synced_at && (
                              <span className="text-zinc-400">
                                {" "}&middot; synced {timeAgo(integration.last_synced_at)}
                              </span>
                            )}
                          </>
                        ) : integration?.status === "error" ? (
                          <span className="text-zinc-900">Connection error — reconnect</span>
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
                          onClick={() => setConfirmDisconnect(integration)}
                          disabled={disconnecting === integration.id}
                          className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors"
                        >
                          {disconnecting === integration.id ? "..." : "Disconnect"}
                        </button>
                      </>
                    ) : isOAuth ? (
                      <Button
                        onClick={() => handleOAuthConnect(item.id)}
                        loading={isConnecting}
                        className="text-xs"
                      >
                        Connect
                      </Button>
                    ) : isApiKey ? (
                      <Button
                        onClick={() => openApiKeyModal(item.id)}
                        className="text-xs"
                      >
                        Connect
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Composio: 500+ App Integrations ──────────────────────────────────── */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-900">
              500+ App Integrations
            </h2>
            <Badge variant={composioEnabled ? "success" : "default"}>
              {composioEnabled ? "Composio" : "Not configured"}
            </Badge>
          </div>
          {composioEnabled && (
            <button
              onClick={() => setShowComposioApps(!showComposioApps)}
              className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              {showComposioApps ? "Hide" : "Browse apps"}
            </button>
          )}
        </div>

        {!composioEnabled ? (
          <div className="mt-3 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4">
            <p className="text-sm text-zinc-700">
              Connect 500+ apps — GitHub, Jira, Salesforce, HubSpot, Notion, Linear, and more.
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Add your <code className="rounded bg-zinc-200 px-1">COMPOSIO_API_KEY</code> to{" "}
              <code className="rounded bg-zinc-200 px-1">.env.local</code> to enable.
              Get a key at{" "}
              <a
                href="https://composio.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-900 underline underline-offset-2"
              >
                composio.dev
              </a>
            </p>
          </div>
        ) : (
          <>
            {/* Connected Composio apps */}
            {composioConnections.length > 0 && (
              <div className="mt-3 flex flex-col gap-1">
                {composioConnections.map((conn) => (
                  <div
                    key={conn.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-900" />
                      <span className="text-sm text-zinc-900 capitalize">
                        {conn.toolkitSlug.replace(/_/g, " ")}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {conn.status}
                      </span>
                    </div>
                    <button
                      onClick={() => handleComposioDisconnect(conn.id)}
                      className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Browse & connect new apps */}
            {showComposioApps && (
              <div className="mt-3">
                <div className="relative mb-3">
                  <svg
                    className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={composioSearch}
                    onChange={(e) => setComposioSearch(e.target.value)}
                    placeholder="Search apps (github, jira, salesforce, hubspot...)"
                    className="h-8 w-full rounded-md border border-zinc-200 bg-transparent pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {COMPOSIO_POPULAR_APPS.filter((app) =>
                    composioSearch
                      ? app.name.toLowerCase().includes(composioSearch.toLowerCase()) ||
                        app.slug.toLowerCase().includes(composioSearch.toLowerCase())
                      : true,
                  ).map((app) => {
                    const isConnected = composioConnections.some(
                      (c) => c.toolkitSlug === app.slug,
                    );
                    return (
                      <button
                        key={app.slug}
                        onClick={() =>
                          isConnected
                            ? undefined
                            : handleComposioConnect(app.slug)
                        }
                        disabled={isConnected || composioConnecting === app.slug}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                          isConnected
                            ? "border-zinc-200 bg-zinc-100 text-zinc-700"
                            : "border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                        }`}
                      >
                        <span className="font-medium">{app.name}</span>
                        {isConnected && (
                          <svg className="ml-auto h-3 w-3 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {composioConnecting === app.slug && (
                          <span className="ml-auto text-[10px] text-zinc-400">...</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <p className="mt-2 text-[10px] text-zinc-400">
                  Showing popular apps. Your agents can discover all 500+ tools automatically via <code className="bg-zinc-100 rounded px-0.5">composio_list_tools</code>.
                </p>
              </div>
            )}
          </>
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
          <div className="flex items-center gap-2">
            <CheckIcon />
            Create GitHub issues &amp; PRs
          </div>
          <div className="flex items-center gap-2">
            <CheckIcon />
            500+ apps via Composio
          </div>
        </div>
        <p className="mt-3 text-[10px] text-zinc-500">
          All actions go through the safety pipeline. Sensitive actions (sending emails, payments) require your approval.
        </p>
      </div>

      {/* ─── API Key Modal ─────────────────────────────────────────────────────── */}
      <Modal
        open={!!apiKeyModal}
        onClose={() => { setApiKeyModal(null); setApiKeyError(null); }}
        title={`Connect ${modalProvider?.name ?? ""}`}
        description={modalProvider?.description}
      >
        <div className="flex flex-col gap-3">
          {modalFields?.map((field) => (
            <Input
              key={field.key}
              label={field.label}
              type={field.type ?? "text"}
              placeholder={field.placeholder}
              value={apiKeyValues[field.key] ?? ""}
              onChange={(e) =>
                setApiKeyValues((prev) => ({ ...prev, [field.key]: e.target.value }))
              }
              autoComplete="off"
            />
          ))}

          {apiKeyError && (
            <p className="text-xs text-zinc-800">{apiKeyError}</p>
          )}

          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              onClick={() => { setApiKeyModal(null); setApiKeyError(null); }}
              className="rounded-md px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <Button
              onClick={handleApiKeySubmit}
              loading={apiKeySaving}
              className="text-xs"
            >
              Connect
            </Button>
          </div>

          <p className="text-[10px] text-zinc-400">
            Credentials are encrypted with AES-256-GCM before storage. They are never exposed in logs.
          </p>
        </div>
      </Modal>

      {/* ─── Disconnect Confirmation ───────────────────────────────────────────── */}
      <Modal
        open={!!confirmDisconnect}
        onClose={() => setConfirmDisconnect(null)}
        title="Disconnect integration?"
        description={`This will remove the ${PROVIDERS[confirmDisconnect?.provider ?? ""]?.name ?? confirmDisconnect?.provider} connection and revoke stored credentials.`}
      >
        <div className="flex flex-col gap-3">
          {confirmDisconnect && (
            <div className="rounded-md bg-zinc-50 border border-zinc-200 p-3 text-xs text-zinc-600">
              <p><strong>Service:</strong> {PROVIDERS[confirmDisconnect.provider]?.name ?? confirmDisconnect.provider}</p>
              <p><strong>Account:</strong> {confirmDisconnect.label}</p>
              <p><strong>Connected:</strong> {timeAgo(confirmDisconnect.created_at)}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setConfirmDisconnect(null)}
              className="rounded-md px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => confirmDisconnect && handleDisconnect(confirmDisconnect)}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs text-white hover:bg-zinc-800 transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Log Viewer Modal ──────────────────────────────────────────────────── */}
      <Modal
        open={showLogs}
        onClose={() => setShowLogs(false)}
        title="Integration Logs"
        description="All connect/disconnect actions are logged daily in markdown."
      >
        <div className="flex flex-col gap-3">
          {logContent ? (
            <pre className="max-h-64 overflow-auto rounded-md bg-zinc-50 border border-zinc-200 p-3 text-[11px] text-zinc-700 whitespace-pre-wrap">
              {logContent}
            </pre>
          ) : (
            <p className="text-xs text-zinc-500">No logs for today yet.</p>
          )}

          {logFiles.length > 0 && (
            <div className="text-xs text-zinc-500">
              <p className="font-medium text-zinc-700 mb-1">Available log files:</p>
              <div className="flex flex-wrap gap-1">
                {logFiles.slice(0, 10).map((f) => (
                  <span key={f} className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px]">
                    {f.replace(".md", "")}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-[10px] text-zinc-400">
              Logs stored in data/logs/integrations/
            </p>
            <button
              onClick={downloadBackup}
              className="flex items-center gap-1 rounded-md bg-zinc-900 px-3 py-1.5 text-xs text-white hover:bg-zinc-800 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Backup
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Popular Composio Apps ───────────────────────────────────────────────────

const COMPOSIO_POPULAR_APPS = [
  { slug: "github", name: "GitHub" },
  { slug: "gitlab", name: "GitLab" },
  { slug: "jira", name: "Jira" },
  { slug: "linear", name: "Linear" },
  { slug: "asana", name: "Asana" },
  { slug: "trello", name: "Trello" },
  { slug: "salesforce", name: "Salesforce" },
  { slug: "hubspot", name: "HubSpot" },
  { slug: "pipedrive", name: "Pipedrive" },
  { slug: "airtable", name: "Airtable" },
  { slug: "monday", name: "Monday.com" },
  { slug: "zendesk", name: "Zendesk" },
  { slug: "intercom", name: "Intercom" },
  { slug: "stripe", name: "Stripe" },
  { slug: "shopify", name: "Shopify" },
  { slug: "twitter", name: "Twitter/X" },
  { slug: "linkedin", name: "LinkedIn" },
  { slug: "google_sheets", name: "Google Sheets" },
  { slug: "google_docs", name: "Google Docs" },
  { slug: "dropbox", name: "Dropbox" },
  { slug: "figma", name: "Figma" },
  { slug: "confluence", name: "Confluence" },
  { slug: "clickup", name: "ClickUp" },
  { slug: "freshdesk", name: "Freshdesk" },
];

function CheckIcon() {
  return (
    <svg className="h-3 w-3 text-zinc-900 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
