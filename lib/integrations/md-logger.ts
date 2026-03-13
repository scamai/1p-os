// =============================================================================
// 1P OS — Markdown Action Logger
// Writes all integration actions and settings to daily markdown log files.
// Logs are stored in data/logs/ and can be backed up daily.
// =============================================================================

import { promises as fs } from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "data", "logs", "integrations");

function todayFileName(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}.md`;
}

function timestamp(): string {
  return new Date().toISOString();
}

async function ensureDir() {
  await fs.mkdir(LOG_DIR, { recursive: true });
}

export interface LogEntry {
  action: string;            // e.g. "connect", "disconnect", "settings_change"
  provider?: string;         // e.g. "gmail", "slack"
  actor: string;             // user ID or "system"
  details?: string;          // human-readable details
  metadata?: Record<string, unknown>;
}

/**
 * Append a markdown log entry to today's log file.
 */
export async function appendLog(entry: LogEntry): Promise<void> {
  try {
    await ensureDir();

    const filePath = path.join(LOG_DIR, todayFileName());
    const ts = timestamp();

    // Check if file exists — if not, write the header
    let exists = false;
    try {
      await fs.access(filePath);
      exists = true;
    } catch {
      // file doesn't exist yet
    }

    let content = "";

    if (!exists) {
      const dateStr = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      content += `# Integration Log — ${dateStr}\n\n`;
    }

    content += `## ${ts} — ${entry.action.toUpperCase()}\n\n`;
    content += `- **Action:** ${entry.action}\n`;
    if (entry.provider) content += `- **Provider:** ${entry.provider}\n`;
    content += `- **Actor:** ${entry.actor}\n`;
    if (entry.details) content += `- **Details:** ${entry.details}\n`;
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      content += `- **Metadata:**\n`;
      for (const [key, value] of Object.entries(entry.metadata)) {
        content += `  - ${key}: ${typeof value === "string" ? value : JSON.stringify(value)}\n`;
      }
    }
    content += `\n---\n\n`;

    await fs.appendFile(filePath, content, "utf-8");
  } catch (err) {
    // Logging should never throw — fallback to console
    console.error("[md-logger] Failed to write log:", err);
  }
}

/**
 * Read today's log file content.
 */
export async function readTodayLog(): Promise<string | null> {
  try {
    const filePath = path.join(LOG_DIR, todayFileName());
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

/**
 * Read a specific date's log file.
 */
export async function readLogByDate(date: string): Promise<string | null> {
  try {
    const filePath = path.join(LOG_DIR, `${date}.md`);
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

/**
 * List all available log files.
 */
export async function listLogFiles(): Promise<string[]> {
  try {
    await ensureDir();
    const files = await fs.readdir(LOG_DIR);
    return files
      .filter((f) => f.endsWith(".md"))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

/**
 * Export all logs as a single markdown string for backup.
 */
export async function exportAllLogs(): Promise<string> {
  const files = await listLogFiles();
  const parts: string[] = [`# 1P OS — Integration Logs Backup\n\nExported: ${timestamp()}\n\n---\n\n`];

  for (const file of files) {
    try {
      const content = await fs.readFile(path.join(LOG_DIR, file), "utf-8");
      parts.push(content);
      parts.push("\n---\n\n");
    } catch {
      // skip unreadable files
    }
  }

  return parts.join("");
}
