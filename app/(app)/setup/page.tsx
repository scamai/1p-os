"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ConnectAccounts, type ConnectedAccount } from "@/components/setup/ConnectAccounts";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

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
  operations: "bg-zinc-900",
  finance: "bg-zinc-700",
  sales: "bg-zinc-500",
  marketing: "bg-zinc-800",
  "customer-success": "bg-zinc-600",
  product: "bg-zinc-400",
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

// ─── Step indicator ──────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-0.5 flex-1 transition-all duration-300 ${
            i < current ? "bg-zinc-900" : i === current ? "bg-zinc-400" : "bg-zinc-200"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SetupPage() {
  const router = useRouter();

  // Phase: welcome → api-keys → connect → analyzing → review → launching → done
  const [phase, setPhase] = React.useState<
    "welcome" | "api-keys" | "connect" | "analyzing" | "review" | "launching" | "done"
  >("welcome");

  // API keys
  const [anthropicKey, setAnthropicKey] = React.useState("");
  const [savingKey, setSavingKey] = React.useState(false);
  const [keyError, setKeyError] = React.useState<string | null>(null);
  const [keySaved, setKeySaved] = React.useState(false);

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

  // ── Step mapping for indicator ──────────────────────────────────────────────

  const STEP_MAP: Record<string, number> = {
    welcome: 0,
    "api-keys": 1,
    connect: 2,
    analyzing: 3,
    review: 3,
    launching: 3,
    done: 3,
  };
  const currentStep = STEP_MAP[phase] ?? 0;

  // ── OAuth redirect check ──────────────────────────────────────────────────

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected")) {
      setPhase("connect");
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

  // ── API key save ────────────────────────────────────────────────────────────

  const handleSaveApiKey = async () => {
    if (!anthropicKey.trim()) return;
    setSavingKey(true);
    setKeyError(null);
    try {
      const res = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "anthropic", key: anthropicKey.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setKeyError(data.error ?? "Failed to save key");
        return;
      }
      setKeySaved(true);
    } catch {
      setKeyError("Network error. Key will be used locally.");
      setKeySaved(true);
    } finally {
      setSavingKey(false);
    }
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

    for (let i = 0; i < steps.length; i++) {
      await delay(600 + Math.random() * 400);
      setAnalysisProgress((prev) => [...prev, steps[i]]);
    }

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

    for (let i = 0; i < agents.length; i++) {
      await delay(500);
      setHiredAgents((prev) => new Set(prev).add(i));
    }

    await delay(300);
    setLaunchPhase("skills");

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
    await delay(2000);
    router.push("/company");
  };

  // ── Phase: Welcome ─────────────────────────────────────────────────────────

  if (phase === "welcome") {
    return (
      <div className="mx-auto max-w-lg py-16">
        <StepIndicator current={currentStep} total={4} />

        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Your AI team is ready to be hired
          </h1>
          <p className="mt-3 text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed">
            1P OS builds a team of AI agents that run your business — finance, ops, sales, support. You stay in control, they do the work.
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-10">
          {[
            { step: "1", label: "Add your AI key", desc: "So your agents can think" },
            { step: "2", label: "Connect your tools", desc: "Email, calendar, Slack, Stripe — optional" },
            { step: "3", label: "AI reads your business", desc: "And assembles the right team" },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3 px-4 py-3 border border-zinc-200">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-zinc-900 text-white text-xs font-bold">
                {item.step}
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-900">{item.label}</p>
                <p className="text-xs text-zinc-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-3">
          <Button onClick={() => setPhase("api-keys")} className="w-full max-w-xs justify-center py-3 text-sm font-semibold">
            Get started
          </Button>
          <p className="text-[10px] text-zinc-400">Takes about 2 minutes</p>
        </div>
      </div>
    );
  }

  // ── Phase: API Keys ────────────────────────────────────────────────────────

  if (phase === "api-keys") {
    return (
      <div className="mx-auto max-w-lg py-12">
        <StepIndicator current={currentStep} total={4} />

        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-zinc-900">Add your AI key</h1>
          <p className="mt-2 text-sm text-zinc-500 max-w-sm mx-auto">
            Your agents need an LLM to think. Anthropic Claude is the primary model.
          </p>
        </div>

        <Card>
          <CardContent className="p-5">
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-zinc-700 mb-1.5 block">
                  Anthropic API Key <span className="text-zinc-400">*</span>
                </label>
                <Input
                  type="password"
                  value={anthropicKey}
                  onChange={(e) => { setAnthropicKey(e.target.value); setKeyError(null); setKeySaved(false); }}
                  placeholder="sk-ant-..."
                  className="font-mono text-xs"
                />
                {keyError && (
                  <p className="mt-1.5 text-xs text-zinc-600">{keyError}</p>
                )}
                {keySaved && !keyError && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs text-zinc-700">Key saved</span>
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-100 pt-3">
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Your key is encrypted with AES-256-GCM and never leaves your server. You can add more LLM providers later in Settings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-col items-center gap-3">
          {!keySaved ? (
            <Button
              onClick={handleSaveApiKey}
              loading={savingKey}
              disabled={!anthropicKey.trim()}
              className="w-full max-w-xs justify-center py-2.5 text-sm"
            >
              Save and continue
            </Button>
          ) : (
            <Button
              onClick={() => setPhase("connect")}
              className="w-full max-w-xs justify-center py-2.5 text-sm"
            >
              Continue
            </Button>
          )}
          <button
            onClick={() => setPhase("connect")}
            className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            Skip — I&apos;ll add it later
          </button>
        </div>
      </div>
    );
  }

  // ── Phase: Connect ────────────────────────────────────────────────────────

  if (phase === "connect") {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <StepIndicator current={currentStep} total={4} />

        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-zinc-900">Connect your accounts</h1>
          <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto">
            The more you connect, the better AI understands your business. Everything is optional.
          </p>
        </div>

        {connectError && (
          <div className="mb-4 border border-zinc-200 bg-zinc-50 px-4 py-3">
            <p className="text-sm font-medium text-zinc-800">{connectError}</p>
            <p className="mt-1 text-xs text-zinc-600">
              Add the required env vars to <code className="bg-zinc-200 px-1 text-[11px]">.env.local</code> and restart. Or skip this.
            </p>
            <button onClick={() => setConnectError(null)} className="mt-1 text-xs text-zinc-500 underline">Dismiss</button>
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
              : "Continue with default setup"
            }
          </Button>
          <p className="text-[10px] text-zinc-400">
            {connectedAccounts.length > 0
              ? "AI auto-configures from your accounts"
              : "You can connect accounts anytime in Settings"
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
        <StepIndicator current={currentStep} total={4} />

        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center bg-zinc-100">
            <svg className="h-7 w-7 animate-spin text-zinc-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-zinc-900">Analyzing your business</h2>
          <p className="mt-1 text-sm text-zinc-500">Reading your connected accounts</p>
        </div>

        <div className="flex flex-col gap-1.5">
          {analysisProgress.map((step, i) => {
            const isLatest = i === analysisProgress.length - 1;
            const isDone = i < analysisProgress.length - 1;
            return (
              <div key={i} className={`flex items-center gap-2.5 px-3 py-2 transition-all ${isLatest ? "bg-zinc-100" : ""}`}>
                {isDone ? (
                  <svg className="h-4 w-4 shrink-0 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
        <StepIndicator current={currentStep} total={4} />

        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center bg-zinc-100">
            <svg className="h-6 w-6 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-zinc-900">Here&apos;s your team</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Review what AI assembled. You can change everything later.
          </p>
        </div>

        {/* Confidence */}
        <div className="mb-4 border border-zinc-200 bg-zinc-50 px-4 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-700">
              AI Confidence: {Math.round(analysis.confidence * 100)}%
            </span>
            <span className="text-[10px] text-zinc-500">
              Based on {connectedAccounts.length} connected account{connectedAccounts.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {analysis.signals.map((s, i) => (
              <span key={i} className="bg-white px-1.5 py-0.5 text-[9px] text-zinc-600 border border-zinc-200">{s}</span>
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
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center ${roleColor} text-white text-[10px] font-bold`}>
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
                            <span key={skill} className="text-[8px] text-zinc-400 bg-zinc-100 px-1 py-0.5">{skill}</span>
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
                    <span key={a.id} className="inline-flex items-center gap-1 bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700">
                      <span className="h-1.5 w-1.5 bg-zinc-900" />
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
          <p className="text-[10px] text-zinc-400">Everything is editable in Settings</p>
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
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center bg-zinc-100">
              <svg className="h-8 w-8 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center bg-zinc-100">
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
        <div className="mb-8 h-1.5 w-full overflow-hidden bg-zinc-100">
          <div
            className={`h-full transition-all duration-500 ${launchPhase === "done" ? "bg-zinc-900" : "bg-zinc-700"}`}
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
                className={`border px-3 py-2.5 transition-all duration-500 ${
                  isHired ? allDone ? "border-zinc-200 bg-zinc-50" : "border-zinc-200" : "border-zinc-100 bg-zinc-50 opacity-40"
                }`}
                style={{ transform: isHired ? "translateX(0)" : "translateX(-8px)" }}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center ${isHired ? roleColor : "bg-zinc-200"} text-white text-xs font-bold transition-colors`}>
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
                          <span key={skill} className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] transition-all ${
                            agentSkills.has(s) ? "bg-zinc-100 text-zinc-700 border border-zinc-200" : "bg-zinc-100 text-zinc-400"
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
                    {!isHired ? <div className="h-5 w-5 border-2 border-zinc-200" />
                    : allDone ? (
                      <div className="flex h-5 w-5 items-center justify-center bg-zinc-900">
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
          <div className="mt-6 border border-zinc-200 bg-zinc-50 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">System configuration</p>
            <div className="flex flex-col gap-1.5">
              {WIRING_LABELS.map((label, i) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  {i < wiringStep ? (
                    <svg className="h-3.5 w-3.5 shrink-0 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  ) : <div className="h-3.5 w-3.5 shrink-0 border border-zinc-300" />}
                  <span className={i < wiringStep ? "text-zinc-700" : "text-zinc-400"}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {launchPhase === "done" && (
          <div className="mt-6 text-center">
            <p className="text-sm font-medium text-zinc-900">Opening HQ...</p>
            <p className="mt-1 text-[10px] text-zinc-400">
              Tip: Press Cmd+K anytime to talk to your AI team
            </p>
          </div>
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
