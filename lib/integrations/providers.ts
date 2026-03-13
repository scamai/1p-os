// =============================================================================
// 1P OS — Integration Provider Registry
// OAuth config + metadata for each connectable service
// =============================================================================

export interface ProviderConfig {
  id: string;
  name: string;
  icon: string;
  category: "email" | "chat" | "sms" | "social" | "webhook" | "calendar" | "storage";
  authType: "oauth2" | "api_key" | "webhook";
  oauth?: {
    authUrl: string;
    tokenUrl: string;
    scopes: string[];
    pkce?: boolean;
  };
  description: string;
}

export const PROVIDERS: Record<string, ProviderConfig> = {
  gmail: {
    id: "gmail",
    name: "Gmail",
    icon: "mail",
    category: "email",
    authType: "oauth2",
    oauth: {
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scopes: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.modify",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
      pkce: false,
    },
    description: "Read, send, and manage Gmail messages",
  },
  outlook: {
    id: "outlook",
    name: "Outlook",
    icon: "mail",
    category: "email",
    authType: "oauth2",
    oauth: {
      authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      scopes: [
        "https://graph.microsoft.com/Mail.ReadWrite",
        "https://graph.microsoft.com/Mail.Send",
        "https://graph.microsoft.com/User.Read",
        "offline_access",
      ],
      pkce: true,
    },
    description: "Read, send, and manage Outlook/Microsoft 365 email",
  },
  slack: {
    id: "slack",
    name: "Slack",
    icon: "hash",
    category: "chat",
    authType: "oauth2",
    oauth: {
      authUrl: "https://slack.com/oauth/v2/authorize",
      tokenUrl: "https://slack.com/api/oauth.v2.access",
      scopes: [
        "channels:history",
        "channels:read",
        "chat:write",
        "im:history",
        "im:read",
        "im:write",
        "users:read",
      ],
    },
    description: "Send and receive Slack messages",
  },
  discord: {
    id: "discord",
    name: "Discord",
    icon: "message-square",
    category: "chat",
    authType: "api_key",
    description: "Connect your Discord bot",
  },
  telegram: {
    id: "telegram",
    name: "Telegram",
    icon: "send",
    category: "chat",
    authType: "api_key",
    description: "Connect your Telegram bot",
  },
  whatsapp: {
    id: "whatsapp",
    name: "WhatsApp",
    icon: "message-circle",
    category: "chat",
    authType: "api_key",
    description: "Connect WhatsApp Business API",
  },
  twilio: {
    id: "twilio",
    name: "SMS (Twilio)",
    icon: "smartphone",
    category: "sms",
    authType: "api_key",
    description: "Send and receive SMS via Twilio",
  },
  google_calendar: {
    id: "google_calendar",
    name: "Google Calendar",
    icon: "calendar",
    category: "calendar",
    authType: "oauth2",
    oauth: {
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scopes: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
      ],
    },
    description: "Read and manage Google Calendar events",
  },
  google_drive: {
    id: "google_drive",
    name: "Google Drive",
    icon: "folder",
    category: "storage",
    authType: "oauth2",
    oauth: {
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scopes: [
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/drive.file",
      ],
    },
    description: "Read and manage Google Drive files",
  },
  notion: {
    id: "notion",
    name: "Notion",
    icon: "file-text",
    category: "storage",
    authType: "oauth2",
    oauth: {
      authUrl: "https://api.notion.com/v1/oauth/authorize",
      tokenUrl: "https://api.notion.com/v1/oauth/token",
      scopes: [],
    },
    description: "Read and write Notion pages and databases",
  },
};

export function getProvider(id: string): ProviderConfig | undefined {
  return PROVIDERS[id];
}

export function listProviders(category?: ProviderConfig["category"]): ProviderConfig[] {
  const all = Object.values(PROVIDERS);
  return category ? all.filter((p) => p.category === category) : all;
}
