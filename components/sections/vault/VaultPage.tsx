"use client";

import * as React from "react";
import { AISummary } from "@/components/shared/AISummary";
import { TabBar } from "@/components/shared/TabBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

// --- Types ---

type AccessLevel = "owner" | "restricted" | "internal" | "team";
type DocSource = "upload" | "gmail" | "google_drive" | "outlook" | "slack" | "notion" | "dropbox" | "agent";
type DocCategory = "contract" | "receipt" | "report" | "legal" | "tax" | "proposal" | "invoice" | "correspondence" | "other";

interface VaultDoc {
  id: string;
  name: string;
  category: DocCategory;
  access_level: AccessLevel;
  source: DocSource;
  file_type: string;
  file_size_bytes: number;
  tags: string[];
  description: string | null;
  linked_to: string;
  created_by: string;
  allowed_agents: string[];
  source_url: string | null;
  created_at: string;
}

interface AgentRef {
  id: string;
  name: string;
  role: string;
}

// --- Constants ---

const CATEGORY_TABS = ["All", "Contracts", "Receipts", "Reports", "Legal", "Tax", "Other"] as const;
type CategoryTab = (typeof CATEGORY_TABS)[number];

const TAB_TO_CATEGORY: Record<string, DocCategory | null> = {
  All: null,
  Contracts: "contract",
  Receipts: "receipt",
  Reports: "report",
  Legal: "legal",
  Tax: "tax",
  Other: "other",
};

const ACCESS_LEVELS: { id: AccessLevel; label: string; description: string }[] = [
  { id: "owner", label: "Owner only", description: "Only you can view this document" },
  { id: "restricted", label: "Restricted", description: "Only selected agents can access" },
  { id: "internal", label: "Internal", description: "All your agents can access" },
  { id: "team", label: "Team", description: "All team members and agents can access" },
];

const SOURCE_LABELS: Record<DocSource, string> = {
  upload: "Upload",
  gmail: "Gmail",
  google_drive: "Google Drive",
  outlook: "Outlook",
  slack: "Slack",
  notion: "Notion",
  dropbox: "Dropbox",
  agent: "Agent",
};

const CATEGORY_LABELS: Record<DocCategory, string> = {
  contract: "Contract",
  receipt: "Receipt",
  report: "Report",
  legal: "Legal",
  tax: "Tax",
  proposal: "Proposal",
  invoice: "Invoice",
  correspondence: "Correspondence",
  other: "Other",
};

// --- Mock data ---

const MOCK_AGENTS: AgentRef[] = [
  { id: "a1", name: "Invoice Manager", role: "finance" },
  { id: "a2", name: "Client Relations", role: "sales" },
  { id: "a3", name: "Project Tracker", role: "operations" },
  { id: "a4", name: "Bookkeeper", role: "finance" },
  { id: "a5", name: "Content Writer", role: "marketing" },
];

const MOCK_DOCS: VaultDoc[] = [
  {
    id: "1", name: "Acme Corp - Service Agreement.pdf", category: "contract",
    access_level: "internal", source: "google_drive", file_type: "application/pdf",
    file_size_bytes: 245000, tags: ["acme", "active"], description: "Master service agreement for Q1 2026 engagement.",
    linked_to: "Acme Corp", created_by: "You", allowed_agents: [],
    source_url: null, created_at: "2026-03-01",
  },
  {
    id: "2", name: "Vercel Pro - March 2026.pdf", category: "receipt",
    access_level: "restricted", source: "gmail", file_type: "application/pdf",
    file_size_bytes: 89000, tags: ["infrastructure", "recurring"], description: null,
    linked_to: "Infrastructure", created_by: "Invoice Manager", allowed_agents: ["a1", "a4"],
    source_url: null, created_at: "2026-03-01",
  },
  {
    id: "3", name: "Globex Inc - SOW.pdf", category: "contract",
    access_level: "team", source: "upload", file_type: "application/pdf",
    file_size_bytes: 312000, tags: ["globex", "sow"], description: "Statement of work for API integration project.",
    linked_to: "API Integration", created_by: "You", allowed_agents: [],
    source_url: null, created_at: "2026-02-15",
  },
  {
    id: "4", name: "Tax Filing Notes.docx", category: "tax",
    access_level: "owner", source: "upload", file_type: "application/msword",
    file_size_bytes: 45000, tags: ["tax", "2025"], description: "Notes for 2025 annual filing.",
    linked_to: "", created_by: "You", allowed_agents: [],
    source_url: null, created_at: "2026-02-28",
  },
  {
    id: "5", name: "Claude API - February.pdf", category: "receipt",
    access_level: "internal", source: "agent", file_type: "application/pdf",
    file_size_bytes: 67000, tags: ["ai", "anthropic"], description: "February usage invoice from Anthropic.",
    linked_to: "AI", created_by: "Bookkeeper", allowed_agents: [],
    source_url: null, created_at: "2026-02-28",
  },
  {
    id: "6", name: "Q1 Revenue Report.pdf", category: "report",
    access_level: "restricted", source: "agent", file_type: "application/pdf",
    file_size_bytes: 156000, tags: ["q1", "finance"], description: "Auto-generated quarterly revenue report.",
    linked_to: "Finance", created_by: "Bookkeeper", allowed_agents: ["a1", "a2", "a4"],
    source_url: null, created_at: "2026-03-10",
  },
  {
    id: "7", name: "NDA - Initech.pdf", category: "legal",
    access_level: "owner", source: "google_drive", file_type: "application/pdf",
    file_size_bytes: 98000, tags: ["nda", "initech"], description: "Mutual NDA with Initech LLC.",
    linked_to: "Initech", created_by: "You", allowed_agents: [],
    source_url: null, created_at: "2026-03-05",
  },
];

// --- Helpers ---

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function accessBadgeVariant(level: AccessLevel): "default" | "success" | "warning" | "destructive" {
  switch (level) {
    case "team": return "success";
    case "internal": return "default";
    case "restricted": return "warning";
    case "owner": return "destructive";
  }
}

function dispatchAppAction(action: string) {
  window.dispatchEvent(new CustomEvent("app-action", { detail: { action } }));
}

// --- Component ---

interface VaultPageProps {
  onAction?: (action: string) => void;
}

function VaultPage({ onAction }: VaultPageProps) {
  const [activeTab, setActiveTab] = React.useState<CategoryTab>("All");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [sourceFilter, setSourceFilter] = React.useState<DocSource | "all">("all");
  const [accessFilter, setAccessFilter] = React.useState<AccessLevel | "all">("all");

  // Access control modal
  const [accessModalDoc, setAccessModalDoc] = React.useState<VaultDoc | null>(null);
  const [editAccessLevel, setEditAccessLevel] = React.useState<AccessLevel>("internal");
  const [editAllowedAgents, setEditAllowedAgents] = React.useState<Set<string>>(new Set());

  const handleAction = onAction ?? dispatchAppAction;

  // Filter docs
  const filtered = MOCK_DOCS.filter((doc) => {
    const catFilter = TAB_TO_CATEGORY[activeTab];
    if (catFilter && doc.category !== catFilter) return false;
    if (sourceFilter !== "all" && doc.source !== sourceFilter) return false;
    if (accessFilter !== "all" && doc.access_level !== accessFilter) return false;
    return true;
  });

  // Source counts for filter
  const sourceCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const doc of MOCK_DOCS) {
      counts[doc.source] = (counts[doc.source] ?? 0) + 1;
    }
    return counts;
  }, []);

  const activeSources = Object.entries(sourceCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  function openAccessModal(doc: VaultDoc) {
    setAccessModalDoc(doc);
    setEditAccessLevel(doc.access_level);
    setEditAllowedAgents(new Set(doc.allowed_agents));
  }

  function toggleAgent(agentId: string) {
    setEditAllowedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) next.delete(agentId);
      else next.add(agentId);
      return next;
    });
  }

  function handleSaveAccess() {
    // In production: PATCH /api/documents/[id] with access_level + allowed_agent_ids
    setAccessModalDoc(null);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-lg font-semibold text-zinc-900">Vault</h1>
      <p className="mt-0.5 text-sm text-zinc-500">
        All your documents in one place. Control who sees what.
      </p>

      <div className="mt-2">
        <AISummary section="vault" />
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragOver(false); }}
        onClick={() => handleAction("upload_document")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleAction("upload_document");
        }}
        className={`mt-6 flex cursor-pointer items-center justify-center rounded-lg border border-dashed p-6 text-center transition-colors duration-200 ${
          isDragOver
            ? "border-zinc-300 bg-zinc-50"
            : "border-zinc-200 hover:border-zinc-300"
        }`}
      >
        <div>
          <svg className="mx-auto h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="mt-1.5 text-xs text-zinc-500">
            Drop files or click to upload
          </p>
        </div>
      </div>

      {/* Filters row */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <TabBar
          tabs={CATEGORY_TABS as unknown as string[]}
          active={activeTab}
          onChange={(tab) => setActiveTab(tab as CategoryTab)}
        />
      </div>

      {/* Source + Access filters */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {/* Source filter */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider mr-1">Source</span>
          <button
            onClick={() => setSourceFilter("all")}
            className={`rounded px-2 py-0.5 text-[11px] transition-colors ${
              sourceFilter === "all" ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            All
          </button>
          {activeSources.map(([src]) => (
            <button
              key={src}
              onClick={() => setSourceFilter(src as DocSource)}
              className={`rounded px-2 py-0.5 text-[11px] transition-colors ${
                sourceFilter === src ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {SOURCE_LABELS[src as DocSource]}
            </button>
          ))}
        </div>

        <span className="text-zinc-200">|</span>

        {/* Access filter */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider mr-1">Access</span>
          <button
            onClick={() => setAccessFilter("all")}
            className={`rounded px-2 py-0.5 text-[11px] transition-colors ${
              accessFilter === "all" ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            All
          </button>
          {ACCESS_LEVELS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAccessFilter(a.id)}
              className={`rounded px-2 py-0.5 text-[11px] transition-colors ${
                accessFilter === a.id ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Document list */}
      <div className="mt-6">
        <div className="flex flex-col">
          {filtered.map((doc) => {
            const isExpanded = expandedId === doc.id;
            return (
              <div key={doc.id} className="border-b border-zinc-100 last:border-0">
                {/* Row */}
                <div
                  className="flex items-center gap-3 py-3 cursor-pointer transition-colors hover:bg-zinc-50/50 rounded-lg px-2 -mx-2"
                  onClick={() => setExpandedId(isExpanded ? null : doc.id)}
                >
                  {/* File icon */}
                  <svg className="h-4 w-4 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-zinc-700 truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-zinc-400">{CATEGORY_LABELS[doc.category]}</span>
                      {doc.linked_to && (
                        <>
                          <span className="text-[10px] text-zinc-300">/</span>
                          <span className="text-[10px] text-zinc-400">{doc.linked_to}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Source */}
                  <span className="shrink-0 text-[10px] text-zinc-400">
                    {SOURCE_LABELS[doc.source]}
                  </span>

                  {/* Access badge */}
                  <Badge variant={accessBadgeVariant(doc.access_level)} className="shrink-0">
                    {ACCESS_LEVELS.find((a) => a.id === doc.access_level)?.label}
                  </Badge>

                  {/* Date */}
                  <span className="shrink-0 font-mono text-[11px] text-zinc-400">{doc.created_at}</span>

                  {/* Chevron */}
                  <svg
                    className={`h-3.5 w-3.5 shrink-0 text-zinc-300 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="ml-7 mb-3 rounded-lg border border-zinc-100 bg-zinc-50/50 p-4">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                      <div>
                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">Size</p>
                        <p className="text-zinc-700">{formatBytes(doc.file_size_bytes)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">Created by</p>
                        <p className="text-zinc-700">{doc.created_by}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">Source</p>
                        <p className="text-zinc-700">{SOURCE_LABELS[doc.source]}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">Access</p>
                        <p className="text-zinc-700">{ACCESS_LEVELS.find((a) => a.id === doc.access_level)?.label}</p>
                      </div>
                      {doc.description && (
                        <div className="col-span-2">
                          <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">Description</p>
                          <p className="text-zinc-600">{doc.description}</p>
                        </div>
                      )}
                      {doc.tags.length > 0 && (
                        <div className="col-span-2">
                          <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Tags</p>
                          <div className="flex flex-wrap gap-1">
                            {doc.tags.map((tag) => (
                              <span key={tag} className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {doc.access_level === "restricted" && doc.allowed_agents.length > 0 && (
                        <div className="col-span-2">
                          <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Allowed agents</p>
                          <div className="flex flex-wrap gap-1">
                            {doc.allowed_agents.map((agentId) => {
                              const agent = MOCK_AGENTS.find((a) => a.id === agentId);
                              return (
                                <span key={agentId} className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600">
                                  {agent?.name ?? agentId}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center gap-2 border-t border-zinc-100 pt-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); openAccessModal(doc); }}
                        className="text-[11px] text-zinc-500 hover:text-zinc-900 transition-colors"
                      >
                        Change access
                      </button>
                      <span className="text-zinc-200">|</span>
                      <button className="text-[11px] text-zinc-500 hover:text-zinc-900 transition-colors">
                        Download
                      </button>
                      <span className="text-zinc-200">|</span>
                      <button className="text-[11px] text-red-400 hover:text-red-600 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-zinc-500">No documents found.</p>
              <p className="mt-1 text-xs text-zinc-400">
                Try adjusting your filters or upload a new document.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Connected sources */}
      <div className="mt-10 border-t border-zinc-100 pt-6">
        <h2 className="text-sm font-semibold text-zinc-900">Document sources</h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          Connect external services to automatically sync documents into your vault.
        </p>

        <div className="mt-4 flex flex-col gap-1.5">
          {([
            { id: "google_drive", name: "Google Drive", desc: "Sync files and folders", connected: true },
            { id: "gmail", name: "Gmail", desc: "Auto-import attachments", connected: true },
            { id: "notion", name: "Notion", desc: "Sync pages and databases", connected: false },
            { id: "slack", name: "Slack", desc: "Save shared files", connected: false },
            { id: "dropbox", name: "Dropbox", desc: "Sync files and folders", connected: false },
            { id: "outlook", name: "Outlook", desc: "Auto-import attachments", connected: false },
          ] as const).map((src) => (
            <div
              key={src.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-medium text-zinc-900">{src.name}</p>
                <p className="text-[11px] text-zinc-500">{src.desc}</p>
              </div>
              {src.connected ? (
                <div className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] text-zinc-500">Connected</span>
                </div>
              ) : (
                <Button
                  onClick={() => handleAction(`connect_${src.id}`)}
                  className="text-xs"
                >
                  Connect
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Access Control Modal */}
      {accessModalDoc && (
        <Modal open onClose={() => setAccessModalDoc(null)}>
          <div className="p-6 max-w-md">
            <h3 className="text-sm font-semibold text-zinc-900">
              Access control
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500 truncate">
              {accessModalDoc.name}
            </p>

            {/* Access level picker */}
            <div className="mt-5 flex flex-col gap-1.5">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider">
                Access level
              </p>
              {ACCESS_LEVELS.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setEditAccessLevel(level.id)}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-all ${
                    editAccessLevel === level.id
                      ? "border-zinc-900 bg-zinc-50"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div>
                    <p className="text-xs font-medium text-zinc-900">{level.label}</p>
                    <p className="text-[11px] text-zinc-500">{level.description}</p>
                  </div>
                  {editAccessLevel === level.id && (
                    <svg className="h-3.5 w-3.5 shrink-0 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {/* Agent picker (only for restricted) */}
            {editAccessLevel === "restricted" && (
              <div className="mt-5">
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2">
                  Select agents with access
                </p>
                <div className="flex flex-col gap-1">
                  {MOCK_AGENTS.map((agent) => {
                    const isAllowed = editAllowedAgents.has(agent.id);
                    return (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => toggleAgent(agent.id)}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-all ${
                          isAllowed
                            ? "border-zinc-900 bg-zinc-50"
                            : "border-zinc-200 hover:border-zinc-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-600">
                            {agent.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-zinc-900">{agent.name}</p>
                            <p className="text-[10px] text-zinc-400 capitalize">{agent.role}</p>
                          </div>
                        </div>
                        {isAllowed && (
                          <svg className="h-3.5 w-3.5 shrink-0 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
                {editAllowedAgents.size === 0 && (
                  <p className="mt-2 text-[11px] text-zinc-400">
                    Select at least one agent, or change access level.
                  </p>
                )}
              </div>
            )}

            {/* Save */}
            <div className="mt-6 flex items-center gap-3">
              <Button onClick={handleSaveAccess}>
                Save
              </Button>
              <button
                onClick={() => setAccessModalDoc(null)}
                className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export { VaultPage };
