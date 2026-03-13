"use client";

import * as React from "react";

interface BrowserSession {
  id: string;
  agent: string;
  url: string;
  action: string;
  timestamp: string;
  active: boolean;
}

const ACTIVE_SESSIONS: BrowserSession[] = [
  {
    id: "s1",
    agent: "Sales Agent",
    url: "linkedin.com/in/john-doe",
    action: "Researching lead",
    timestamp: "3 min ago",
    active: true,
  },
  {
    id: "s2",
    agent: "Content Agent",
    url: "docs.google.com/document/d/1a2b3c...",
    action: "Drafting blog post",
    timestamp: "12 min ago",
    active: true,
  },
  {
    id: "s3",
    agent: "Support Agent",
    url: "zendesk.com/tickets/482",
    action: "Reviewing ticket #482",
    timestamp: "1 min ago",
    active: true,
  },
];

const HISTORY_SESSIONS: BrowserSession[] = [
  { id: "h1", agent: "Sales Agent", url: "crunchbase.com/org/acme", action: "Company research", timestamp: "1h ago", active: false },
  { id: "h2", agent: "Dev Agent", url: "stackoverflow.com/questions/...", action: "Debugging reference", timestamp: "2h ago", active: false },
  { id: "h3", agent: "Content Agent", url: "unsplash.com/s/photos/startup", action: "Image sourcing", timestamp: "3h ago", active: false },
  { id: "h4", agent: "Analytics Agent", url: "analytics.google.com/...", action: "Traffic review", timestamp: "4h ago", active: false },
  { id: "h5", agent: "Sales Agent", url: "linkedin.com/company/acme", action: "Lead qualification", timestamp: "5h ago", active: false },
  { id: "h6", agent: "Support Agent", url: "zendesk.com/tickets/479", action: "Ticket resolution", timestamp: "6h ago", active: false },
  { id: "h7", agent: "Content Agent", url: "medium.com/@competitor/...", action: "Competitor analysis", timestamp: "7h ago", active: false },
  { id: "h8", agent: "Dev Agent", url: "github.com/org/repo/pulls", action: "PR review", timestamp: "8h ago", active: false },
  { id: "h9", agent: "Finance Agent", url: "stripe.com/dashboard", action: "Payment check", timestamp: "9h ago", active: false },
  { id: "h10", agent: "Admin Agent", url: "calendar.google.com", action: "Schedule review", timestamp: "10h ago", active: false },
];

function SessionRow({
  session,
  showView,
}: {
  session: BrowserSession;
  showView: boolean;
}) {
  const [viewing, setViewing] = React.useState(false);

  return (
    <div>
      <div className="flex items-center gap-4 rounded-md px-3 py-2.5 hover:bg-zinc-50 transition-colors">
        <span className="w-28 shrink-0 text-sm text-zinc-600 truncate">
          {session.agent}
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-600">
          {session.url}
        </span>
        <span className="hidden w-40 shrink-0 truncate text-xs text-zinc-500 sm:block">
          {session.action}
        </span>
        <span className="w-20 shrink-0 text-right font-mono text-[11px] text-zinc-700">
          {session.timestamp}
        </span>
        {showView && (
          <button
            onClick={() => setViewing((v) => !v)}
            className="shrink-0 text-xs text-zinc-600 hover:text-zinc-600 transition-colors"
          >
            {viewing ? "Hide" : "View"}
          </button>
        )}
      </div>

      {viewing && (
        <div className="mx-3 mb-2 flex h-40 items-center justify-center rounded border border-zinc-200 bg-white">
          <span className="text-xs text-zinc-700">
            Screenshot placeholder
          </span>
        </div>
      )}
    </div>
  );
}

function BrowserPanel() {
  return (
    <section className="mt-10">
      <h2 className="mb-4 font-mono text-[13px] uppercase tracking-widest text-zinc-500">
        Browser Sessions
      </h2>

      <div className="space-y-px">
        <p className="mb-2 text-[11px] font-mono uppercase tracking-wider text-zinc-700">
          Active
        </p>
        {ACTIVE_SESSIONS.map((s) => (
          <SessionRow key={s.id} session={s} showView />
        ))}
      </div>

      <div className="mt-6 space-y-px">
        <p className="mb-2 text-[11px] font-mono uppercase tracking-wider text-zinc-700">
          History
        </p>
        {HISTORY_SESSIONS.map((s) => (
          <SessionRow key={s.id} session={s} showView={false} />
        ))}
      </div>
    </section>
  );
}

export { BrowserPanel };
