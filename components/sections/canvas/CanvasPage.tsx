"use client";

import * as React from "react";

interface CanvasItem {
  id: string;
  title: string;
  agent: string;
  timestamp: string;
  type: "document" | "report" | "plan" | "draft";
  content: string;
}

const CANVASES: CanvasItem[] = [
  {
    id: "c1",
    title: "Weekly Business Report",
    agent: "Ops Agent",
    timestamp: "2h ago",
    type: "report",
    content: `# Weekly Business Report — Mar 7–13

## Revenue
- Total invoiced: $14,500
- Collected: $4,500 (Acme Corp — monthly retainer)
- Outstanding: $10,000 (Globex $2,800 + Initech $1,200 + Umbrella $6,000)
- Overdue: $1,200 (Initech — 13 days late, auto follow-up sent)

## Agent Performance
| Agent | Tasks | Cost | Hours Saved |
|-------|-------|------|-------------|
| Sales | 12 | $0.45 | 24h |
| Support | 28 | $0.32 | 40h |
| Content | 8 | $0.18 | 15h |
| Ops | 6 | $0.08 | 10h |

## Key Events
- Sales Agent closed Globex lead ($5k proposal pending approval)
- Support Agent maintained 4-min avg response time
- Content Agent published newsletter to 2,400 subscribers

## Action Items
- [ ] Approve Globex proposal
- [ ] Review Content Agent budget (85% used)
- [ ] Follow up on Initech overdue payment`,
  },
  {
    id: "c2",
    title: "Proposal — Globex Inc",
    agent: "Sales Agent",
    timestamp: "1d ago",
    type: "document",
    content: `# Proposal: Globex Inc

**Prepared by:** Sales Agent on behalf of your business
**Date:** March 12, 2026
**Valid until:** March 26, 2026

## Scope of Work
Monthly retainer for full-service support including:
- Dedicated customer success management
- Priority support (4-hour SLA)
- Monthly performance reports
- Quarterly strategy reviews

## Pricing
| Service | Monthly |
|---------|---------|
| Base retainer | $3,500 |
| Priority support add-on | $1,000 |
| Quarterly review sessions | $500 |
| **Total** | **$5,000/mo** |

## Terms
- 6-month minimum commitment
- Net 15 payment terms
- 30-day cancellation notice

## Next Steps
1. Review and approve this proposal
2. Sales Agent will send to Marcus Webb (marcus@globex.io)
3. Follow-up scheduled for March 19 if no response`,
  },
  {
    id: "c3",
    title: "Blog Post — AI Automation Guide",
    agent: "Content Agent",
    timestamp: "3d ago",
    type: "draft",
    content: `# How Solo Founders Are Using AI Agents to Run Their Business

*Draft — ready for your review*

Running a business alone used to mean doing everything yourself. Not anymore.

## The Problem
Solo founders spend 60% of their time on tasks that don't directly generate revenue: invoicing, email, scheduling, reporting, customer support. That's 24 hours a week on admin.

## The Solution
AI agents that handle the repetitive work while you focus on what matters. Not chatbots — actual agents that take action:

- **Sales agents** that qualify leads, send follow-ups, and draft proposals
- **Support agents** that resolve tickets in minutes, not hours
- **Ops agents** that invoice clients, track expenses, and reconcile payments
- **Content agents** that write, schedule, and publish — consistently

## Real Numbers
The average solo founder using AI agents saves:
- 89 hours per month on admin tasks
- $1.03/day in agent costs vs $2,400/month for a VA
- 4-minute average support response time (vs 4 hours)

## Getting Started
The key is starting small. Pick your biggest time sink — usually support or invoicing — and let an agent handle it for a week. Review everything it does. Gradually increase autonomy as trust builds.

---

*Status: Draft complete. Awaiting your approval to publish.*`,
  },
  {
    id: "c4",
    title: "Q2 Growth Plan",
    agent: "Sales Agent",
    timestamp: "5d ago",
    type: "plan",
    content: `# Q2 Growth Plan

## Current State
- MRR: $4,500
- Active clients: 2
- Pipeline: $11,800 (3 leads)
- Avg deal size: $4,150

## Q2 Targets
- MRR target: $12,000 (+167%)
- New clients: 3–4
- Pipeline to build: $30,000

## Strategy

### Month 1 (April)
- Close Globex ($5,000/mo) — proposal pending
- Close Umbrella ($6,000 one-time) — draft ready
- Begin outreach to 20 new prospects

### Month 2 (May)
- Convert 2 pipeline leads
- Launch referral program (ask Acme + Globex)
- Content Agent: publish 4 case studies

### Month 3 (June)
- Target: 5 active clients at avg $2,400/mo MRR
- Evaluate hiring a second Sales Agent for outbound

## Resource Needs
- Sales Agent budget increase: $2/day → $5/day
- Content Agent: 2 case studies + 4 social posts per week
- Ops Agent: automate proposal-to-invoice pipeline`,
  },
];

function CanvasPage() {
  const [selectedId, setSelectedId] = React.useState<string>(CANVASES[0].id);
  const [prompt, setPrompt] = React.useState("");

  const selected = CANVASES.find((c) => c.id === selectedId) ?? CANVASES[0];

  const handleSend = () => {
    if (!prompt.trim()) return;
    // In production, this would send to the agent to generate/update canvas
    // TODO: send to agent to generate/update canvas
    setPrompt("");
  };

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] flex-col">
      <h1 className="mb-4 text-lg font-semibold text-zinc-900">Canvas</h1>

      <div className="flex flex-1 gap-0 overflow-hidden rounded-lg border border-zinc-200">
        {/* Sidebar */}
        <div className="w-[220px] shrink-0 border-r border-zinc-200 bg-zinc-50">
          <div className="p-3">
            <button
              className="w-full text-left text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              + New Canvas
            </button>
          </div>

          <div className="space-y-px">
            {CANVASES.map((canvas) => (
              <button
                key={canvas.id}
                onClick={() => setSelectedId(canvas.id)}
                className={`w-full px-3 py-2.5 text-left transition-colors ${
                  canvas.id === selectedId
                    ? "bg-white border-l-2 border-zinc-900"
                    : "hover:bg-zinc-100 border-l-2 border-transparent"
                }`}
              >
                <p className={`truncate text-sm ${canvas.id === selectedId ? "text-zinc-900 font-medium" : "text-zinc-600"}`}>
                  {canvas.title}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-400">
                  {canvas.agent} · {canvas.timestamp}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col bg-white">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-3">
            <div>
              <h2 className="text-sm font-medium text-zinc-900">{selected.title}</h2>
              <p className="mt-0.5 text-[11px] text-zinc-400">
                {selected.agent} · {selected.timestamp} · {selected.type}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors">
                Export
              </button>
              <button className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors">
                Share
              </button>
            </div>
          </div>

          {/* Canvas body — rendered markdown-style */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="prose prose-zinc prose-sm max-w-none">
              {selected.content.split('\n').map((line, i) => {
                // Simple markdown rendering
                if (line.startsWith('# ')) return <h1 key={i} className="text-lg font-semibold text-zinc-900 mt-6 mb-3 first:mt-0">{line.slice(2)}</h1>;
                if (line.startsWith('## ')) return <h2 key={i} className="text-sm font-semibold text-zinc-900 mt-5 mb-2">{line.slice(3)}</h2>;
                if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-medium text-zinc-700 mt-4 mb-1">{line.slice(4)}</h3>;
                if (line.startsWith('- [ ] ')) return <div key={i} className="flex items-center gap-2 py-0.5 text-[13px] text-zinc-700"><span className="h-3.5 w-3.5 rounded border border-zinc-300" />{line.slice(6)}</div>;
                if (line.startsWith('- ')) return <div key={i} className="flex items-start gap-2 py-0.5 text-[13px] text-zinc-600"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-zinc-400" />{line.slice(2)}</div>;
                if (line.startsWith('| ')) {
                  const cells = line.split('|').filter(Boolean).map(c => c.trim());
                  if (cells.every(c => c.match(/^-+$/))) return null; // separator row
                  return (
                    <div key={i} className="flex gap-4 py-1 text-[12px] font-mono">
                      {cells.map((cell, j) => (
                        <span key={j} className={`flex-1 ${j === 0 ? 'text-zinc-700' : 'text-zinc-500'}`}>{cell}</span>
                      ))}
                    </div>
                  );
                }
                if (line.startsWith('*') && line.endsWith('*')) return <p key={i} className="text-[13px] text-zinc-400 italic py-1">{line.replace(/\*/g, '')}</p>;
                if (line.startsWith('---')) return <hr key={i} className="my-4 border-zinc-100" />;
                if (line.startsWith('**') && line.includes(':**')) {
                  const [label, ...rest] = line.split(':**');
                  return <p key={i} className="text-[13px] text-zinc-600 py-0.5"><span className="font-medium text-zinc-900">{label.replace(/\*/g, '')}:</span> {rest.join(':**').replace(/\*/g, '')}</p>;
                }
                if (line.trim() === '') return <div key={i} className="h-2" />;
                return <p key={i} className="text-[13px] text-zinc-600 leading-relaxed py-0.5">{line}</p>;
              })}
            </div>
          </div>

          {/* Prompt bar */}
          <div className="border-t border-zinc-200 px-6 py-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask an agent to update or create something..."
                className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-300"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
              />
              <button
                onClick={handleSend}
                disabled={!prompt.trim()}
                className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-xs text-white transition-opacity disabled:opacity-30 hover:bg-zinc-800"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { CanvasPage };
