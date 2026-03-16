"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ConnectAccounts, type ConnectedAccount } from "@/components/setup/ConnectAccounts";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

// ─── Agent data per template ─────────────────────────────────────────────────

const TEMPLATE_AGENTS: Record<
  string,
  { name: string; role: string; skills: string[] }[]
> = {
  "freelance-designer": [
    { name: "Project Tracker", role: "operations", skills: ["Task boards", "Deadline alerts", "Time tracking"] },
    { name: "Invoice Manager", role: "finance", skills: ["Invoice creation", "Payment tracking", "Late reminders"] },
    { name: "Client Relations", role: "sales", skills: ["CRM sync", "Follow-ups", "Proposal drafts"] },
    { name: "Schedule Keeper", role: "operations", skills: ["Calendar sync", "Booking links", "Reminders"] },
  ],
  "saas-founder": [
    { name: "Support Agent", role: "customer-success", skills: ["Ticket triage", "FAQ answers", "Escalation"] },
    { name: "Revenue Tracker", role: "finance", skills: ["MRR tracking", "Churn alerts", "Invoice sync"] },
    { name: "Metrics Analyst", role: "product", skills: ["Dashboard reports", "Cohort analysis", "KPI alerts"] },
    { name: "Content Writer", role: "marketing", skills: ["Blog drafts", "Social posts", "SEO optimization"] },
    { name: "Billing Ops", role: "finance", skills: ["Stripe sync", "Dunning", "Revenue recognition"] },
  ],
  "consultant-coach": [
    { name: "Scheduler", role: "operations", skills: ["Calendar sync", "Booking pages", "Timezone mgmt"] },
    { name: "Client Onboarding", role: "customer-success", skills: ["Welcome emails", "Intake forms", "Setup guides"] },
    { name: "Invoice Manager", role: "finance", skills: ["Invoice creation", "Payment tracking", "Receipts"] },
    { name: "Follow-Up Agent", role: "sales", skills: ["Lead nurture", "Check-ins", "Proposal follow-up"] },
  ],
  ecommerce: [
    { name: "Inventory Monitor", role: "operations", skills: ["Stock alerts", "Reorder triggers", "Supplier comms"] },
    { name: "Order Manager", role: "operations", skills: ["Order tracking", "Shipping updates", "Returns"] },
    { name: "Customer Service", role: "customer-success", skills: ["Ticket response", "FAQ bot", "Refund processing"] },
    { name: "Marketing Agent", role: "marketing", skills: ["Email campaigns", "Social posts", "Promo codes"] },
    { name: "Sales Tracker", role: "sales", skills: ["Revenue reports", "Conversion tracking", "Upsell alerts"] },
  ],
  "content-creator": [
    { name: "Content Calendar", role: "marketing", skills: ["Editorial planning", "Deadline tracking", "Idea bank"] },
    { name: "Social Scheduler", role: "marketing", skills: ["Auto-posting", "Best time analysis", "Hashtag research"] },
    { name: "Analytics Tracker", role: "product", skills: ["View tracking", "Engagement reports", "Growth alerts"] },
    { name: "Sponsorship Manager", role: "sales", skills: ["Outreach emails", "Rate cards", "Contract tracking"] },
  ],
  agency: [
    { name: "Client Manager", role: "customer-success", skills: ["Status updates", "Satisfaction checks", "Onboarding"] },
    { name: "Project Tracker", role: "operations", skills: ["Task boards", "Milestone tracking", "Resource allocation"] },
    { name: "Resource Planner", role: "operations", skills: ["Capacity planning", "Scheduling", "Workload balance"] },
    { name: "Billing Agent", role: "finance", skills: ["Time-based invoices", "Retainer tracking", "Expense reports"] },
    { name: "Report Generator", role: "marketing", skills: ["Client reports", "Performance dashboards", "ROI calc"] },
    { name: "New Biz Scout", role: "sales", skills: ["Lead research", "Outreach sequences", "Proposal drafts"] },
  ],
  general: [
    { name: "Email Assistant", role: "operations", skills: ["Inbox triage", "Draft replies", "Follow-up reminders"] },
    { name: "Calendar Manager", role: "operations", skills: ["Scheduling", "Conflict detection", "Meeting prep"] },
    { name: "Bookkeeper", role: "finance", skills: ["Expense tracking", "Receipt scanning", "Monthly reports"] },
  ],
};

const ROLE_COLORS: Record<string, string> = {
  operations: "bg-blue-500",
  finance: "bg-emerald-500",
  sales: "bg-amber-500",
  marketing: "bg-purple-500",
  "customer-success": "bg-rose-500",
  product: "bg-cyan-500",
};

// ─── AI analysis result ──────────────────────────────────────────────────────

interface AIAnalysis {
  businessName: string;
  industry: string;
  template: string;
  description: string;
  state: string;
  confidence: number;
  signals: string[];
  suggestedAgents: { name: string; role: string; reason: string }[];
  suggestedStrategy: "quality" | "balanced" | "savings";
  strategyReason: string;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SetupPage() {
  const router = useRouter();

  // Phase: connect → analyzing → review → launching → done
  const [phase, setPhase] = React.useState<"connect" | "analyzing" | "review" | "launching" | "done">("connect");

  // Connect
  const [connectedAccounts, setConnectedAccounts] = React.useState<ConnectedAccount[]>([]);
  const [connectingProvider, setConnectingProvider] = React.useState<string | null>(null);
  const [connectError, setConnectError] = React.useState<string | null>(null);

  // AI analysis
  const [analysis, setAnalysis] = React.useState<AIAnalysis | null>(null);
  const [analysisProgress, setAnalysisProgress] = React.useState<string[]>([]);

  // Launch visualization
  const [hiredAgents, setHiredAgents] = React.useState<Set<number>>(new Set());
  const [installedSkills, setInstalledSkills] = React.useState<Map<number, Set<number>>>(new Map());
  const [wiringStep, setWiringStep] = React.useState(0);
  const [launchPhase, setLaunchPhase] = React.useState<"hiring" | "skills" | "wiring" | "done">("hiring");

  // ── OAuth redirect check ──────────────────────────────────────────────────

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected")) {
      fetchConnected();
      window.history.replaceState({}, "", "/setup");
    }
  }, []);

  const fetchConnected = async () => {
    try {
      const res = await fetch("/api/integrations");
      if (res.ok) {
        const data = await res.json();
        setConnectedAccounts(
          (data.integrations ?? []).map((i: { id: string; provider: string; label: string; status: string }) => ({
            id: i.id, provider: i.provider, label: i.label, status: i.status,
          }))
        );
      }
    } catch { /* non-fatal */ }
  };

  // ── Connect handlers ──────────────────────────────────────────────────────

  const handleConnect = async (providerId: string) => {
    setConnectingProvider(providerId);
    setConnectError(null);
    try {
      const res = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerId }),
      });
      const data = await res.json();
      if (data.error === "not_configured") {
        setConnectError(data.message);
        return;
      }
      if (!res.ok) return;
      if (data.authType === "oauth2" && data.url) {
        window.location.href = data.url;
      }
    } finally {
      setConnectingProvider(null);
    }
  };

  const handleDisconnect = async (providerId: string) => {
    const account = connectedAccounts.find((a) => a.provider === providerId);
    if (!account) return;
    try {
      await fetch("/api/integrations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationId: account.id }),
      });
      setConnectedAccounts((prev) => prev.filter((a) => a.id !== account.id));
    } catch { /* non-fatal */ }
  };

  const handleApiKeySave = async (providerId: string, fields: Record<string, string>) => {
    try {
      const res = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerId, credentials: fields }),
      });
      if (res.ok) {
        setConnectedAccounts((prev) => [
          ...prev,
          { id: crypto.randomUUID(), provider: providerId, label: providerId, status: "active" },
        ]);
      }
    } catch { /* non-fatal */ }
  };

  // ── AI Analysis ───────────────────────────────────────────────────────────

  const startAnalysis = async () => {
    setPhase("analyzing");
    setAnalysisProgress([]);

    const steps = [
      "Scanning accounts...",
      "Reading patterns...",
      "Identifying business type...",
      "Selecting agent team...",
      "Done.",
    ];

    // Animate progress steps
    for (let i = 0; i < steps.length; i++) {
      await delay(600 + Math.random() * 400);
      setAnalysisProgress((prev) => [...prev, steps[i]]);
    }

    // Call the AI to analyze
    try {
      const res = await fetch("/api/ai/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze",
          connectedAccounts: connectedAccounts.filter((a) => a.status === "active").map((a) => a.provider),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAnalysis(data.analysis ?? generateFallbackAnalysis());
      } else {
        setAnalysis(generateFallbackAnalysis());
      }
    } catch {
      setAnalysis(generateFallbackAnalysis());
    }

    await delay(500);
    setPhase("review");
  };

  function generateFallbackAnalysis(): AIAnalysis {
    // Smart fallback based on what accounts are connected
    const hasEmail = connectedAccounts.some((a) => ["gmail", "outlook"].includes(a.provider));
    const hasCalendar = connectedAccounts.some((a) => a.provider === "google_calendar");
    const hasSlack = connectedAccounts.some((a) => a.provider === "slack");
    const hasStripe = connectedAccounts.some((a) => a.provider === "stripe");

    const signals: string[] = [];
    let template = "general";
    let industry = "Small Business";

    if (hasEmail) signals.push("Email account connected");
    if (hasCalendar) signals.push("Calendar connected — scheduling is important");
    if (hasSlack) signals.push("Slack connected — team communication active");
    if (hasStripe) {
      signals.push("Stripe connected — processing payments");
      template = "saas-founder";
      industry = "SaaS / Tech";
    }

    if (connectedAccounts.length === 0) {
      signals.push("No accounts connected — using general setup");
    }

    return {
      businessName: "My Business",
      industry,
      template,
      description: "AI-detected business based on connected accounts",
      state: "",
      confidence: connectedAccounts.length > 2 ? 0.85 : connectedAccounts.length > 0 ? 0.6 : 0.3,
      signals,
      suggestedAgents: (TEMPLATE_AGENTS[template] ?? TEMPLATE_AGENTS.general).map((a) => ({
        name: a.name,
        role: a.role,
        reason: `Handles ${a.skills[0]?.toLowerCase() ?? "tasks"}`,
      })),
      suggestedStrategy: "balanced",
      strategyReason: "Best balance of quality and cost for most businesses",
    };
  }

  // ── Launch ────────────────────────────────────────────────────────────────

  const agents = analysis
    ? TEMPLATE_AGENTS[analysis.template] ?? TEMPLATE_AGENTS.general
    : TEMPLATE_AGENTS.general;

  const handleLaunch = async () => {
    if (!analysis) return;

    setPhase("launching");
    setLaunchPhase("hiring");
    setHiredAgents(new Set());
    setInstalledSkills(new Map());
    setWiringStep(0);

    // Phase 1: Hire agents
    for (let i = 0; i < agents.length; i++) {
      await delay(500);
      setHiredAgents((prev) => new Set(prev).add(i));
    }

    await delay(300);
    setLaunchPhase("skills");

    // Phase 2: Install skills
    for (let a = 0; a < agents.length; a++) {
      for (let s = 0; s < agents[a].skills.length; s++) {
        await delay(150);
        setInstalledSkills((prev) => {
          const next = new Map(prev);
          const set = new Set(next.get(a) ?? []);
          set.add(s);
          next.set(a, set);
          return next;
        });
      }
    }

    await delay(300);
    setLaunchPhase("wiring");

    for (let i = 0; i < 5; i++) {
      await delay(400);
      setWiringStep(i + 1);
    }

    // Actually create
    try {
      await fetch("/api/ai/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: analysis.template,
          businessName: analysis.businessName,
          state: analysis.state,
          description: analysis.description,
          modelStrategy: analysis.suggestedStrategy,
          infraMode: "cloud",
          connectedAccounts: connectedAccounts.filter((a) => a.status === "active").map((a) => a.provider),
        }),
      });
    } catch { /* non-fatal */ }

    await delay(500);
    setLaunchPhase("done");
    await delay(1500);
    router.push("/company");
  };

  // ── Phase: Connect ────────────────────────────────────────────────────────

  if (phase === "connect") {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-zinc-900">Connect your accounts</h1>
          <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto">
            Connect your tools. AI reads your business and builds your team. <strong>No forms.</strong>
          </p>
        </div>

        {connectError && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-medium text-amber-800">{connectError}</p>
            <p className="mt-1 text-xs text-amber-600">
              Add the required env vars to <code className="rounded bg-amber-100 px-1">.env.local</code> and restart. Or skip this.
            </p>
            <button onClick={() => setConnectError(null)} className="mt-1 text-xs text-amber-500 underline">Dismiss</button>
          </div>
        )}

        <ConnectAccounts
          connected={connectedAccounts}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onApiKeySave={handleApiKeySave}
          connecting={connectingProvider}
        />

        <div className="mt-8 flex flex-col items-center gap-3">
          <Button onClick={startAnalysis} className="px-8 py-2.5 text-sm">
            {connectedAccounts.length > 0
              ? `Analyze my ${connectedAccounts.length} connected account${connectedAccounts.length > 1 ? "s" : ""}`
              : "Start with default setup"
            }
          </Button>
          <p className="text-[10px] text-zinc-400">
            {connectedAccounts.length > 0
              ? "AI auto-configures from your accounts"
              : "Connect accounts later in Settings"
            }
          </p>
        </div>
      </div>
    );
  }

  // ── Phase: Analyzing ──────────────────────────────────────────────────────

  if (phase === "analyzing") {
    return (
      <div className="mx-auto max-w-md py-16">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
            <svg className="h-7 w-7 animate-spin text-zinc-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-zinc-900">Analyzing...</h2>
          <p className="mt-1 text-sm text-zinc-500">Reading your connected accounts</p>
        </div>

        <div className="flex flex-col gap-1.5">
          {analysisProgress.map((step, i) => {
            const isLatest = i === analysisProgress.length - 1;
            const isDone = i < analysisProgress.length - 1;
            return (
              <div key={i} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 transition-all ${isLatest ? "bg-zinc-100" : ""}`}>
                {isDone ? (
                  <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 shrink-0 animate-spin text-zinc-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                )}
                <span className={`text-xs ${isDone ? "text-zinc-500" : "text-zinc-900 font-medium"}`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Phase: Review (AI shows what it found) ────────────────────────────────

  if (phase === "review" && analysis) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-zinc-900">Your setup</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Review and launch.
          </p>
        </div>

        {/* Confidence */}
        <div className={`mb-4 rounded-lg border px-4 py-2.5 ${
          analysis.confidence >= 0.7 ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${analysis.confidence >= 0.7 ? "text-emerald-700" : "text-amber-700"}`}>
              AI Confidence: {Math.round(analysis.confidence * 100)}%
            </span>
            <span className="text-[10px] text-zinc-500">
              Based on {connectedAccounts.length} connected account{connectedAccounts.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {analysis.signals.map((s, i) => (
              <span key={i} className="rounded bg-white/60 px-1.5 py-0.5 text-[9px] text-zinc-600">{s}</span>
            ))}
          </div>
        </div>

        {/* What AI detected */}
        <div className="flex flex-col gap-3">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Your Business</h3>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Name</span>
                  <span className="text-sm font-semibold text-zinc-900">{analysis.businessName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Industry</span>
                  <span className="text-sm text-zinc-900">{analysis.industry}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Strategy</span>
                  <span className="text-sm text-zinc-900 capitalize">{analysis.suggestedStrategy}</span>
                </div>
              </div>
              <p className="mt-2 text-[10px] text-zinc-400">{analysis.strategyReason}</p>
            </CardContent>
          </Card>

          {/* Team AI will hire */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                Your AI Team ({agents.length} agents)
              </h3>
              <div className="flex flex-col gap-2">
                {agents.map((agent, i) => {
                  const suggestion = analysis.suggestedAgents[i];
                  const roleColor = ROLE_COLORS[agent.role] ?? "bg-zinc-500";
                  return (
                    <div key={agent.name} className="flex items-center gap-2.5">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${roleColor} text-white text-[10px] font-bold`}>
                        {agent.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-zinc-900">{agent.name}</span>
                          <span className="text-[10px] text-zinc-400 capitalize">{agent.role.replace("-", " ")}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500">
                          {suggestion?.reason ?? agent.skills.join(", ")}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {agent.skills.map((skill) => (
                            <span key={skill} className="text-[8px] text-zinc-400 bg-zinc-100 rounded px-1 py-0.5">{skill}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Connected accounts summary */}
          {connectedAccounts.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Connected ({connectedAccounts.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {connectedAccounts.map((a) => (
                    <span key={a.id} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {a.label || a.provider}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <Button onClick={handleLaunch} className="w-full max-w-sm justify-center py-3 text-base font-semibold">
            Launch My Team
          </Button>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPhase("connect")}
              className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Connect more accounts
            </button>
            <button
              onClick={startAnalysis}
              className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Re-analyze
            </button>
          </div>
          <p className="text-[10px] text-zinc-400">Editable in Settings</p>
        </div>
      </div>
    );
  }

  // ── Phase: Launching (animated) ───────────────────────────────────────────

  if (phase === "launching") {
    const WIRING_LABELS = [
      "Safety pipeline",
      "Budget limits",
      "Circuit breakers",
      "Model routing",
      "Agent runtime",
    ];

    const totalSkills = agents.reduce((sum, a) => sum + a.skills.length, 0);
    const installedCount = Array.from(installedSkills.values()).reduce((sum, s) => sum + s.size, 0);
    const progress =
      launchPhase === "hiring" ? (hiredAgents.size / agents.length) * 33
      : launchPhase === "skills" ? 33 + (installedCount / totalSkills) * 33
      : launchPhase === "wiring" ? 66 + (wiringStep / 5) * 34
      : 100;

    return (
      <div className="mx-auto max-w-xl py-12">
        <div className="mb-8 text-center">
          {launchPhase === "done" ? (
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
              <svg className="h-8 w-8 animate-spin text-zinc-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
          )}
          <h2 className="text-lg font-semibold text-zinc-900">
            {launchPhase === "hiring" && "Hiring agents..."}
            {launchPhase === "skills" && "Installing skills..."}
            {launchPhase === "wiring" && "Wiring systems..."}
            {launchPhase === "done" && `${analysis?.businessName ?? "Your business"} is live.`}
          </h2>
        </div>

        {/* Progress bar */}
        <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${launchPhase === "done" ? "bg-emerald-500" : "bg-zinc-900"}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Agent cards */}
        <div className="flex flex-col gap-2">
          {agents.map((agent, i) => {
            const isHired = hiredAgents.has(i);
            const agentSkills = installedSkills.get(i) ?? new Set<number>();
            const allDone = agentSkills.size === agent.skills.length;
            const roleColor = ROLE_COLORS[agent.role] ?? "bg-zinc-500";

            return (
              <div
                key={agent.name}
                className={`rounded-lg border px-3 py-2.5 transition-all duration-500 ${
                  isHired ? allDone ? "border-emerald-200 bg-emerald-50/30" : "border-zinc-200" : "border-zinc-100 bg-zinc-50 opacity-40"
                }`}
                style={{ transform: isHired ? "translateX(0)" : "translateX(-8px)" }}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isHired ? roleColor : "bg-zinc-200"} text-white text-xs font-bold transition-colors`}>
                    {isHired ? agent.name.charAt(0) : "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-900">{agent.name}</span>
                      <span className="text-[10px] text-zinc-400 capitalize">{agent.role.replace("-", " ")}</span>
                    </div>
                    {isHired && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {agent.skills.map((skill, s) => (
                          <span key={skill} className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] transition-all ${
                            agentSkills.has(s) ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-zinc-100 text-zinc-400"
                          }`}>
                            {agentSkills.has(s) ? (
                              <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            ) : (
                              <svg className="h-2.5 w-2.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                            )}
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0">
                    {!isHired ? <div className="h-5 w-5 rounded-full border-2 border-zinc-200" />
                    : allDone ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </div>
                    ) : (
                      <svg className="h-5 w-5 animate-spin text-zinc-400" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Wiring */}
        {(launchPhase === "wiring" || launchPhase === "done") && (
          <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">System configuration</p>
            <div className="flex flex-col gap-1.5">
              {WIRING_LABELS.map((label, i) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  {i < wiringStep ? (
                    <svg className="h-3.5 w-3.5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  ) : <div className="h-3.5 w-3.5 shrink-0 rounded-full border border-zinc-300" />}
                  <span className={i < wiringStep ? "text-zinc-700" : "text-zinc-400"}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {launchPhase === "done" && (
          <p className="mt-6 text-center text-sm text-zinc-500">Opening HQ...</p>
        )}
      </div>
    );
  }

  // Fallback
  return null;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
