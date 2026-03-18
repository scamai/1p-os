"use client";

import * as React from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// --- Types ---

export interface ConnectedAccount {
  id: string;
  provider: string;
  label: string;
  status: "active" | "pending" | "error";
}

interface AccountOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  authType: "oauth" | "api_key";
  category: "email" | "calendar" | "chat" | "storage" | "social" | "sms";
  fields?: { key: string; label: string; placeholder: string }[];
}

const ACCOUNT_OPTIONS: AccountOption[] = [
  {
    id: "gmail",
    name: "Gmail",
    description: "Read, send, and manage your Gmail",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    authType: "oauth",
    category: "email",
  },
  {
    id: "outlook",
    name: "Outlook / Microsoft 365",
    description: "Read, send, and manage Outlook email",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    authType: "oauth",
    category: "email",
  },
  {
    id: "google_calendar",
    name: "Google Calendar",
    description: "Manage events and scheduling",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    authType: "oauth",
    category: "calendar",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send and receive Slack messages",
    icon: "M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z",
    authType: "oauth",
    category: "chat",
  },
  {
    id: "discord",
    name: "Discord",
    description: "Connect your Discord bot",
    icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
    authType: "api_key",
    category: "chat",
    fields: [{ key: "bot_token", label: "Bot Token", placeholder: "Your Discord bot token" }],
  },
  {
    id: "telegram",
    name: "Telegram",
    description: "Connect your Telegram bot",
    icon: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
    authType: "api_key",
    category: "chat",
    fields: [{ key: "bot_token", label: "Bot Token", placeholder: "Your Telegram bot token" }],
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "WhatsApp Business API",
    icon: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z",
    authType: "api_key",
    category: "chat",
    fields: [
      { key: "phone_number_id", label: "Phone Number ID", placeholder: "Your WhatsApp phone number ID" },
      { key: "access_token", label: "Access Token", placeholder: "Your access token" },
    ],
  },
  {
    id: "google_drive",
    name: "Google Drive",
    description: "Read and manage files",
    icon: "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z",
    authType: "oauth",
    category: "storage",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Read and write Notion pages",
    icon: "M4 4h16v16H4zM8 8h8M8 12h8M8 16h4",
    authType: "oauth",
    category: "storage",
  },
  {
    id: "twilio",
    name: "SMS (Twilio)",
    description: "Send and receive SMS",
    icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
    authType: "api_key",
    category: "sms",
    fields: [
      { key: "account_sid", label: "Account SID", placeholder: "ACxxxxxxxx" },
      { key: "auth_token", label: "Auth Token", placeholder: "Your auth token" },
      { key: "phone_number", label: "From Number", placeholder: "+1234567890" },
    ],
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  email: "Email",
  calendar: "Calendar",
  chat: "Chat & Messaging",
  storage: "Files & Docs",
  sms: "SMS",
};

const CATEGORY_ORDER = ["email", "calendar", "chat", "storage", "sms"];

// --- Component ---

interface ConnectAccountsProps {
  connected: ConnectedAccount[];
  onConnect: (providerId: string) => void;
  onDisconnect: (providerId: string) => void;
  onApiKeySave: (providerId: string, fields: Record<string, string>) => void;
  connecting: string | null;
}

function ConnectAccounts({
  connected,
  onConnect,
  onDisconnect,
  onApiKeySave,
  connecting,
}: ConnectAccountsProps) {
  const [expandedApiKey, setExpandedApiKey] = React.useState<string | null>(null);
  const [apiKeyValues, setApiKeyValues] = React.useState<Record<string, Record<string, string>>>({});

  const getConnected = (id: string) =>
    connected.find((c) => c.provider === id);

  const connectedCount = connected.filter((c) => c.status === "active").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Connect your accounts
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Give your AI team access to your tools. All actions go through the safety pipeline.
          </p>
        </div>
        {connectedCount > 0 && (
          <Badge variant="success">{connectedCount} connected</Badge>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {CATEGORY_ORDER.map((cat) => {
          const items = ACCOUNT_OPTIONS.filter((o) => o.category === cat);
          if (items.length === 0) return null;

          return (
            <div key={cat}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {CATEGORY_LABELS[cat]}
              </p>
              <div className="flex flex-col gap-1">
                {items.map((option) => {
                  const conn = getConnected(option.id);
                  const active = conn?.status === "active";
                  const isExpanded = expandedApiKey === option.id;

                  return (
                    <div key={option.id}>
                      <div className="flex items-center justify-between border border-slate-200 px-3 py-2.5 transition-colors hover:bg-slate-50/50">
                        <div className="flex items-center gap-3">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="shrink-0 text-slate-400"
                          >
                            <path d={option.icon} />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {option.name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {active ? (
                                <>
                                  <span className="inline-block h-1.5 w-1.5 bg-slate-900 mr-1" />
                                  {conn.label}
                                </>
                              ) : (
                                option.description
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {active ? (
                            <>
                              <Badge variant="success">Connected</Badge>
                              <button
                                onClick={() => onDisconnect(option.id)}
                                className="text-[11px] text-slate-400 hover:text-slate-900 transition-colors"
                              >
                                Disconnect
                              </button>
                            </>
                          ) : option.authType === "oauth" ? (
                            <Button
                              onClick={() => onConnect(option.id)}
                              loading={connecting === option.id}
                              className="text-xs"
                            >
                              Connect
                            </Button>
                          ) : (
                            <button
                              onClick={() =>
                                setExpandedApiKey(isExpanded ? null : option.id)
                              }
                              className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
                            >
                              {isExpanded ? "Cancel" : "Configure"}
                            </button>
                          )}
                        </div>
                      </div>

                      {isExpanded && option.fields && (
                        <div className="ml-7 mt-1 mb-2 border border-slate-200 bg-slate-50 p-3">
                          <div className="flex flex-col gap-2">
                            {option.fields.map((field) => (
                              <Input
                                key={field.key}
                                label={field.label}
                                type="password"
                                placeholder={field.placeholder}
                                value={apiKeyValues[option.id]?.[field.key] ?? ""}
                                onChange={(e) =>
                                  setApiKeyValues((prev) => ({
                                    ...prev,
                                    [option.id]: {
                                      ...(prev[option.id] ?? {}),
                                      [field.key]: e.target.value,
                                    },
                                  }))
                                }
                                className="font-mono text-xs"
                              />
                            ))}
                            <Button
                              onClick={() => {
                                onApiKeySave(option.id, apiKeyValues[option.id] ?? {});
                                setExpandedApiKey(null);
                              }}
                              className="text-xs self-start"
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 border border-slate-100 bg-slate-50 p-3">
        <p className="text-[10px] text-slate-400">
          Credentials are encrypted with AES-256-GCM. Sensitive actions always require your approval.
          You can connect more accounts anytime in Settings.
        </p>
      </div>
    </div>
  );
}

export { ConnectAccounts };
