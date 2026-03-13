// =============================================================================
// 1P OS — Email Integration (Gmail + Outlook)
// Real API calls to read, send, and manage email
// =============================================================================

import { getValidAccessToken } from "./oauth";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface EmailMessage {
  id: string;
  threadId?: string;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  snippet: string;
  body?: string;
  date: string;
  read: boolean;
  labels?: string[];
  hasAttachments: boolean;
}

export interface EmailThread {
  id: string;
  subject: string;
  messages: EmailMessage[];
  lastMessageDate: string;
}

export interface SendEmailInput {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  replyToMessageId?: string;
  threadId?: string;
}

// -----------------------------------------------------------------------------
// Gmail
// -----------------------------------------------------------------------------

const GMAIL_API = "https://www.googleapis.com/gmail/v1/users/me";

export async function gmailListMessages(
  credentialsEncrypted: string,
  opts: { maxResults?: number; query?: string; labelIds?: string[] } = {}
): Promise<{ messages: EmailMessage[]; updatedCredentials?: string }> {
  const { accessToken, updated } = await getValidAccessToken(credentialsEncrypted);

  const params = new URLSearchParams({
    maxResults: String(opts.maxResults ?? 20),
  });
  if (opts.query) params.set("q", opts.query);
  if (opts.labelIds?.length) params.set("labelIds", opts.labelIds.join(","));

  const listRes = await fetch(`${GMAIL_API}/messages?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!listRes.ok) {
    throw new Error(`Gmail list failed: ${listRes.status}`);
  }

  const list = (await listRes.json()) as { messages?: { id: string; threadId: string }[] };

  if (!list.messages?.length) {
    return { messages: [], updatedCredentials: updated };
  }

  // Batch fetch message details (max 10 at a time for speed)
  const batch = list.messages.slice(0, 10);
  const messages = await Promise.all(
    batch.map((m) => gmailGetMessage(accessToken, m.id))
  );

  return { messages, updatedCredentials: updated };
}

async function gmailGetMessage(accessToken: string, messageId: string): Promise<EmailMessage> {
  const res = await fetch(`${GMAIL_API}/messages/${messageId}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Subject&metadataHeaders=Date`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error(`Gmail get message failed: ${res.status}`);

  const msg = await res.json() as {
    id: string;
    threadId: string;
    snippet: string;
    labelIds?: string[];
    payload?: {
      headers?: { name: string; value: string }[];
      parts?: { filename?: string }[];
    };
  };

  const headers = msg.payload?.headers ?? [];
  const getHeader = (name: string) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

  return {
    id: msg.id,
    threadId: msg.threadId,
    from: getHeader("From"),
    to: getHeader("To").split(",").map((s) => s.trim()).filter(Boolean),
    cc: getHeader("Cc") ? getHeader("Cc").split(",").map((s) => s.trim()) : undefined,
    subject: getHeader("Subject"),
    snippet: msg.snippet,
    date: getHeader("Date"),
    read: !(msg.labelIds ?? []).includes("UNREAD"),
    labels: msg.labelIds,
    hasAttachments: (msg.payload?.parts ?? []).some((p) => p.filename && p.filename.length > 0),
  };
}

export async function gmailSendMessage(
  credentialsEncrypted: string,
  input: SendEmailInput
): Promise<{ messageId: string; updatedCredentials?: string }> {
  const { accessToken, updated } = await getValidAccessToken(credentialsEncrypted);

  // Build RFC 2822 email
  const lines: string[] = [];
  lines.push(`To: ${input.to.join(", ")}`);
  if (input.cc?.length) lines.push(`Cc: ${input.cc.join(", ")}`);
  if (input.bcc?.length) lines.push(`Bcc: ${input.bcc.join(", ")}`);
  lines.push(`Subject: ${input.subject}`);
  lines.push("Content-Type: text/html; charset=utf-8");
  lines.push("");
  lines.push(input.body);

  const raw = btoa(lines.join("\r\n"))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const body: Record<string, string> = { raw };
  if (input.threadId) body.threadId = input.threadId;

  const res = await fetch(`${GMAIL_API}/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Gmail send failed: ${res.status}`);
  }

  const result = (await res.json()) as { id: string };
  return { messageId: result.id, updatedCredentials: updated };
}

export async function gmailMarkRead(
  credentialsEncrypted: string,
  messageId: string
): Promise<void> {
  const { accessToken } = await getValidAccessToken(credentialsEncrypted);

  await fetch(`${GMAIL_API}/messages/${messageId}/modify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
  });
}

// -----------------------------------------------------------------------------
// Outlook (Microsoft Graph)
// -----------------------------------------------------------------------------

const GRAPH_API = "https://graph.microsoft.com/v1.0/me";

export async function outlookListMessages(
  credentialsEncrypted: string,
  opts: { maxResults?: number; filter?: string } = {}
): Promise<{ messages: EmailMessage[]; updatedCredentials?: string }> {
  const { accessToken, updated } = await getValidAccessToken(credentialsEncrypted);

  const params = new URLSearchParams({
    $top: String(opts.maxResults ?? 20),
    $orderby: "receivedDateTime desc",
    $select: "id,conversationId,from,toRecipients,ccRecipients,subject,bodyPreview,receivedDateTime,isRead,hasAttachments",
  });
  if (opts.filter) params.set("$filter", opts.filter);

  const res = await fetch(`${GRAPH_API}/messages?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error(`Outlook list failed: ${res.status}`);

  const data = (await res.json()) as {
    value: {
      id: string;
      conversationId: string;
      from: { emailAddress: { address: string; name: string } };
      toRecipients: { emailAddress: { address: string } }[];
      ccRecipients?: { emailAddress: { address: string } }[];
      subject: string;
      bodyPreview: string;
      receivedDateTime: string;
      isRead: boolean;
      hasAttachments: boolean;
    }[];
  };

  const messages: EmailMessage[] = data.value.map((m) => ({
    id: m.id,
    threadId: m.conversationId,
    from: `${m.from.emailAddress.name} <${m.from.emailAddress.address}>`,
    to: m.toRecipients.map((r) => r.emailAddress.address),
    cc: m.ccRecipients?.map((r) => r.emailAddress.address),
    subject: m.subject,
    snippet: m.bodyPreview,
    date: m.receivedDateTime,
    read: m.isRead,
    hasAttachments: m.hasAttachments,
  }));

  return { messages, updatedCredentials: updated };
}

export async function outlookSendMessage(
  credentialsEncrypted: string,
  input: SendEmailInput
): Promise<{ messageId: string; updatedCredentials?: string }> {
  const { accessToken, updated } = await getValidAccessToken(credentialsEncrypted);

  const message = {
    subject: input.subject,
    body: { contentType: "HTML", content: input.body },
    toRecipients: input.to.map((email) => ({
      emailAddress: { address: email },
    })),
    ccRecipients: input.cc?.map((email) => ({
      emailAddress: { address: email },
    })),
    bccRecipients: input.bcc?.map((email) => ({
      emailAddress: { address: email },
    })),
  };

  const res = await fetch(`${GRAPH_API}/sendMail`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, saveToSentItems: true }),
  });

  if (!res.ok) {
    throw new Error(`Outlook send failed: ${res.status}`);
  }

  return { messageId: crypto.randomUUID(), updatedCredentials: updated };
}

export async function outlookMarkRead(
  credentialsEncrypted: string,
  messageId: string
): Promise<void> {
  const { accessToken } = await getValidAccessToken(credentialsEncrypted);

  await fetch(`${GRAPH_API}/messages/${messageId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ isRead: true }),
  });
}

// -----------------------------------------------------------------------------
// Unified interface
// -----------------------------------------------------------------------------

export async function listEmails(
  provider: "gmail" | "outlook",
  credentialsEncrypted: string,
  opts: { maxResults?: number; query?: string } = {}
): Promise<{ messages: EmailMessage[]; updatedCredentials?: string }> {
  if (provider === "gmail") {
    return gmailListMessages(credentialsEncrypted, opts);
  }
  return outlookListMessages(credentialsEncrypted, {
    maxResults: opts.maxResults,
    filter: opts.query,
  });
}

export async function sendEmail(
  provider: "gmail" | "outlook",
  credentialsEncrypted: string,
  input: SendEmailInput
): Promise<{ messageId: string; updatedCredentials?: string }> {
  if (provider === "gmail") {
    return gmailSendMessage(credentialsEncrypted, input);
  }
  return outlookSendMessage(credentialsEncrypted, input);
}
