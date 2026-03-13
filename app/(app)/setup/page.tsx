"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { TemplatePicker } from "@/components/setup/TemplatePicker";
import { OnboardingForm, type OnboardingFormData } from "@/components/setup/OnboardingForm";
import { ModelStrategyPicker } from "@/components/setup/ModelStrategyPicker";
import { InfraModePicker, type InfraMode } from "@/components/setup/InfraModePicker";
import { ApiKeySetup } from "@/components/setup/ApiKeySetup";
import { ConnectAccounts, type ConnectedAccount } from "@/components/setup/ConnectAccounts";
import { Button } from "@/components/ui/Button";

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

// ─── Step config ─────────────────────────────────────────────────────────────

const STEPS = [
  { id: "business", label: "Your business", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  { id: "template", label: "Your team", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm13 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" },
  { id: "infra", label: "AI engine", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
  { id: "connect", label: "Accounts", icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" },
  { id: "strategy", label: "Strategy", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "launch", label: "Launch", icon: "M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" },
] as const;

const TOTAL_STEPS = STEPS.length;

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);

  // State per step
  const [formData, setFormData] = React.useState<OnboardingFormData | null>(null);
  const [template, setTemplate] = React.useState<string>("");
  const [infraMode, setInfraMode] = React.useState<InfraMode>("cloud");
  const [apiKeys, setApiKeys] = React.useState<Record<string, string>>({});
  const [connectedAccounts, setConnectedAccounts] = React.useState<ConnectedAccount[]>([]);
  const [connectingProvider, setConnectingProvider] = React.useState<string | null>(null);
  const [connectError, setConnectError] = React.useState<string | null>(null);
  const [strategy, setStrategy] = React.useState<string>("balanced");
  const [loading, setLoading] = React.useState(false);

  // Launch visualization
  const [launchPhase, setLaunchPhase] = React.useState<"idle" | "hiring" | "skills" | "wiring" | "done">("idle");
  const [hiredAgents, setHiredAgents] = React.useState<Set<number>>(new Set());
  const [installedSkills, setInstalledSkills] = React.useState<Map<number, Set<number>>>(new Map());
  const [wiringStep, setWiringStep] = React.useState(0);

  const agents = TEMPLATE_AGENTS[template] ?? TEMPLATE_AGENTS.general;
  const agentCount = agents.length;
  const hasAtLeastOneKey = Object.values(apiKeys).some((v) => v.length > 0);

  // ── Fetch existing integrations ────────────────────────────────────────────

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected")) {
      fetchConnected();
      window.history.replaceState({}, "", "/setup");
      setStep(4);
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

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleBusinessSubmit = (data: OnboardingFormData) => {
    setFormData(data);
    setStep(2);
  };

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
        sessionStorage.setItem("setup_step", "4");
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

  // ── Launch sequence ────────────────────────────────────────────────────────

  const handleLaunch = async () => {
    if (!template || !formData || !strategy) return;

    setLoading(true);
    setStep(7);
    setLaunchPhase("hiring");
    setHiredAgents(new Set());
    setInstalledSkills(new Map());
    setWiringStep(0);

    // Phase 1: Hire agents one by one (staggered)
    for (let i = 0; i < agents.length; i++) {
      await delay(600);
      setHiredAgents((prev) => new Set(prev).add(i));
    }

    await delay(400);
    setLaunchPhase("skills");

    // Phase 2: Install skills per agent
    for (let a = 0; a < agents.length; a++) {
      const skillCount = agents[a].skills.length;
      for (let s = 0; s < skillCount; s++) {
        await delay(200);
        setInstalledSkills((prev) => {
          const next = new Map(prev);
          const agentSkills = new Set(next.get(a) ?? []);
          agentSkills.add(s);
          next.set(a, agentSkills);
          return next;
        });
      }
    }

    await delay(400);
    setLaunchPhase("wiring");

    // Phase 3: Wire up systems
    const WIRING_STEPS = [
      "Connecting safety pipeline...",
      "Setting budget limits...",
      "Enabling circuit breakers...",
      "Configuring model routing...",
      "Starting agent runtime...",
    ];
    for (let i = 0; i < WIRING_STEPS.length; i++) {
      await delay(500);
      setWiringStep(i + 1);
    }

    // Actually create the setup
    try {
      const res = await fetch("/api/ai/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template, ...formData, modelStrategy: strategy, infraMode,
          ...(infraMode === "byok" ? { apiKeys } : {}),
          connectedAccounts: connectedAccounts.filter((a) => a.status === "active").map((a) => a.provider),
        }),
      });

      if (!res.ok) throw new Error("Setup failed");
    } catch {
      setLoading(false);
      setStep(6);
      return;
    }

    await delay(600);
    setLaunchPhase("done");
    await delay(1800);
    router.push("/company");
  };

  // ── Launch visualization ───────────────────────────────────────────────────

  if (step === 7) {
    const WIRING_LABELS = [
      "Connecting safety pipeline",
      "Setting budget limits",
      "Enabling circuit breakers",
      "Configuring model routing",
      "Starting agent runtime",
    ];

    const totalSkills = agents.reduce((sum, a) => sum + a.skills.length, 0);
    const installedCount = Array.from(installedSkills.values()).reduce((sum, s) => sum + s.size, 0);

    return (
      <div className="mx-auto max-w-xl py-12">
        {/* Header */}
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
            {launchPhase === "hiring" && "Hiring your AI team..."}
            {launchPhase === "skills" && "Installing skills..."}
            {launchPhase === "wiring" && "Wiring up systems..."}
            {launchPhase === "done" && `${formData?.businessName ?? "Your business"} is live!`}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {launchPhase === "hiring" && `${hiredAgents.size} of ${agentCount} agents`}
            {launchPhase === "skills" && `${installedCount} of ${totalSkills} skills installed`}
            {launchPhase === "wiring" && `${wiringStep} of ${WIRING_LABELS.length} systems`}
            {launchPhase === "done" && `${agentCount} agents ready with ${totalSkills} skills`}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                launchPhase === "done" ? "bg-emerald-500" : "bg-zinc-900"
              }`}
              style={{
                width: `${
                  launchPhase === "hiring" ? (hiredAgents.size / agentCount) * 33
                  : launchPhase === "skills" ? 33 + (installedCount / totalSkills) * 33
                  : launchPhase === "wiring" ? 66 + (wiringStep / WIRING_LABELS.length) * 34
                  : 100
                }%`,
              }}
            />
          </div>
        </div>

        {/* Agent cards */}
        <div className="flex flex-col gap-2">
          {agents.map((agent, i) => {
            const isHired = hiredAgents.has(i);
            const agentSkills = installedSkills.get(i) ?? new Set<number>();
            const allSkillsDone = agentSkills.size === agent.skills.length;
            const roleColor = ROLE_COLORS[agent.role] ?? "bg-zinc-500";

            return (
              <div
                key={agent.name}
                className={`overflow-hidden rounded-lg border transition-all duration-500 ${
                  isHired
                    ? allSkillsDone
                      ? "border-emerald-200 bg-emerald-50/30"
                      : "border-zinc-200 bg-white"
                    : "border-zinc-100 bg-zinc-50 opacity-40"
                }`}
                style={{
                  transform: isHired ? "translateX(0)" : "translateX(-8px)",
                  transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <div className="flex items-center gap-3 px-3 py-2.5">
                  {/* Avatar */}
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    isHired ? roleColor : "bg-zinc-200"
                  } text-white text-xs font-bold transition-colors duration-300`}>
                    {isHired ? agent.name.charAt(0) : "?"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-900 truncate">
                        {agent.name}
                      </span>
                      <span className="shrink-0 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500 capitalize">
                        {agent.role.replace("-", " ")}
                      </span>
                    </div>

                    {/* Skills */}
                    {isHired && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {agent.skills.map((skill, s) => {
                          const installed = agentSkills.has(s);
                          return (
                            <span
                              key={skill}
                              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] transition-all duration-300 ${
                                installed
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-zinc-100 text-zinc-400 border border-zinc-100"
                              }`}
                            >
                              {installed ? (
                                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="h-2.5 w-2.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                              )}
                              {skill}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Status icon */}
                  <div className="shrink-0">
                    {!isHired ? (
                      <div className="h-5 w-5 rounded-full border-2 border-zinc-200" />
                    ) : allSkillsDone ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <svg className="h-5 w-5 animate-spin text-zinc-400" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Wiring steps */}
        {(launchPhase === "wiring" || launchPhase === "done") && (
          <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              System configuration
            </p>
            <div className="flex flex-col gap-1.5">
              {WIRING_LABELS.map((label, i) => {
                const done = i < wiringStep;
                const active = i === wiringStep - 1 && launchPhase === "wiring";
                return (
                  <div key={label} className="flex items-center gap-2 text-xs">
                    {done ? (
                      <svg className="h-3.5 w-3.5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <div className="h-3.5 w-3.5 shrink-0 rounded-full border border-zinc-300" />
                    )}
                    <span className={done ? "text-zinc-700" : active ? "text-zinc-500" : "text-zinc-400"}>
                      {label}
                    </span>
                    {active && (
                      <svg className="h-3 w-3 animate-spin text-zinc-400 ml-auto" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Done message */}
        {launchPhase === "done" && (
          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500">Taking you to your command center...</p>
          </div>
        )}
      </div>
    );
  }

  // ── Main wizard ────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl py-8">
      {/* Step navigation */}
      <div className="mb-8">
        {/* Step dots with labels */}
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const stepNum = i + 1;
            const isActive = stepNum === step;
            const isDone = stepNum < step;
            const isClickable = isDone;

            return (
              <div key={s.id} className="flex flex-col items-center gap-1.5 flex-1">
                <button
                  type="button"
                  onClick={() => isClickable && setStep(stepNum)}
                  disabled={!isClickable}
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isActive
                      ? "border-zinc-900 bg-zinc-900"
                      : isDone
                        ? "border-emerald-500 bg-emerald-500 cursor-pointer hover:bg-emerald-600"
                        : "border-zinc-200 bg-white cursor-default"
                  }`}
                >
                  {isDone ? (
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg
                      className={`h-4 w-4 ${isActive ? "text-white" : "text-zinc-300"}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={s.icon} />
                    </svg>
                  )}
                </button>
                <span className={`text-[10px] font-medium transition-colors ${
                  isActive ? "text-zinc-900" : isDone ? "text-emerald-600" : "text-zinc-400"
                }`}>
                  {s.label}
                </span>
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div
                    className={`absolute h-0.5 transition-colors ${
                      isDone ? "bg-emerald-500" : "bg-zinc-200"
                    }`}
                    style={{
                      // connector lines are placed via the parent flex, handled by gap
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Connecting lines between steps */}
        <div className="relative -mt-[34px] mx-[18px] flex">
          {STEPS.slice(0, -1).map((_, i) => (
            <div
              key={i}
              className={`h-0.5 flex-1 transition-colors duration-300 ${
                i + 1 < step ? "bg-emerald-500" : "bg-zinc-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="mt-6">
        {/* Step 1: Business */}
        {step === 1 && (
          <OnboardingForm onSubmit={handleBusinessSubmit} templateId={template || "general"} />
        )}

        {/* Step 2: Template */}
        {step === 2 && (
          <div>
            <TemplatePicker selected={template} onSelect={setTemplate} />
            <div className="mt-6">
              <Button onClick={() => setStep(3)} disabled={!template}>Continue</Button>
            </div>
          </div>
        )}

        {/* Step 3: AI Infrastructure */}
        {step === 3 && (
          <div>
            <InfraModePicker selected={infraMode} onSelect={setInfraMode} />
            {infraMode === "byok" && (
              <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <ApiKeySetup keys={apiKeys} onChange={setApiKeys} compact />
              </div>
            )}
            <div className="mt-6">
              <Button
                onClick={() => { fetchConnected(); setStep(4); }}
                disabled={infraMode === "byok" && !hasAtLeastOneKey}
              >
                {infraMode === "cloud" ? "Continue with 1P OS Cloud" : "Continue with My Keys"}
              </Button>
              {infraMode === "byok" && !hasAtLeastOneKey && (
                <p className="mt-2 text-xs text-zinc-500">Add at least one API key to continue</p>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Connect Accounts */}
        {step === 4 && (
          <div>
            {connectError && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="flex items-start gap-2">
                  <svg className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800">{connectError}</p>
                    <p className="mt-1 text-xs text-amber-600">
                      Add the required env vars to <code className="rounded bg-amber-100 px-1">.env.local</code> and restart. Or skip this for now.
                    </p>
                  </div>
                  <button onClick={() => setConnectError(null)} className="text-amber-400 hover:text-amber-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            <ConnectAccounts
              connected={connectedAccounts}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onApiKeySave={handleApiKeySave}
              connecting={connectingProvider}
            />
            <div className="mt-6 flex items-center gap-3">
              <Button onClick={() => setStep(5)}>
                {connectedAccounts.length > 0 ? "Continue" : "Skip for now"}
              </Button>
              {connectedAccounts.length === 0 && (
                <p className="text-xs text-zinc-500">You can connect accounts anytime later</p>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Strategy */}
        {step === 5 && (
          <div>
            <ModelStrategyPicker selected={strategy} onSelect={setStrategy} agentCount={agentCount} />
            <div className="mt-6">
              <Button onClick={() => setStep(6)} disabled={!strategy}>Continue</Button>
            </div>
          </div>
        )}

        {/* Step 6: Review & Launch */}
        {step === 6 && (
          <div>
            <h2 className="mb-1 text-lg font-semibold text-zinc-900">Ready to launch</h2>
            <p className="mb-6 text-sm text-zinc-500">
              Review your setup. Click any section to edit.
            </p>

            <div className="flex flex-col gap-2">
              <ReviewCard
                icon={STEPS[0].icon}
                title="Business"
                onClick={() => setStep(1)}
                lines={[formData?.businessName ?? "—", formData?.state ?? ""]}
                done
              />
              <ReviewCard
                icon={STEPS[1].icon}
                title="Team"
                onClick={() => setStep(2)}
                lines={[`${template.replace(/-/g, " ")} template`, `${agentCount} agents`]}
                done
              />
              <ReviewCard
                icon={STEPS[2].icon}
                title="AI Engine"
                onClick={() => setStep(3)}
                lines={[
                  infraMode === "cloud" ? "1P OS Cloud (Smart Router)" : "Bring Your Own Keys",
                  infraMode === "byok" ? `${Object.values(apiKeys).filter((v) => v.length > 0).length} keys configured` : "Auto model routing",
                ]}
                done
              />
              <ReviewCard
                icon={STEPS[3].icon}
                title="Accounts"
                onClick={() => setStep(4)}
                lines={
                  connectedAccounts.length > 0
                    ? connectedAccounts.map((a) => `${a.provider} — ${a.label}`)
                    : ["None connected (optional)"]
                }
                done={connectedAccounts.length > 0}
              />
              <ReviewCard
                icon={STEPS[4].icon}
                title="Strategy"
                onClick={() => setStep(5)}
                lines={[
                  strategy === "quality" ? "Maximize Quality" : strategy === "balanced" ? "Optimize Cost" : "Maximum Savings",
                ]}
                done
              />
            </div>

            {/* Agent preview */}
            <div className="mt-6 rounded-lg border border-zinc-200 p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Your AI team ({agentCount} agents, {agents.reduce((s, a) => s + a.skills.length, 0)} skills)
              </p>
              <div className="flex flex-col gap-1.5">
                {agents.map((agent) => (
                  <div key={agent.name} className="flex items-center gap-2">
                    <div className={`h-6 w-6 rounded-full ${ROLE_COLORS[agent.role] ?? "bg-zinc-500"} flex items-center justify-center text-white text-[10px] font-bold`}>
                      {agent.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-zinc-900">{agent.name}</span>
                        <span className="text-[10px] text-zinc-400 capitalize">{agent.role.replace("-", " ")}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {agent.skills.map((skill) => (
                          <span key={skill} className="text-[9px] text-zinc-400 bg-zinc-100 rounded px-1 py-0.5">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <Button
                onClick={handleLaunch}
                loading={loading}
                className="w-full justify-center py-3 text-base font-semibold"
              >
                Launch My Team
              </Button>
              <p className="mt-2 text-center text-[10px] text-zinc-500">
                You can change any of these settings anytime after setup
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ReviewCard({
  icon,
  title,
  onClick,
  lines,
  done,
}: {
  icon: string;
  title: string;
  onClick: () => void;
  lines: string[];
  done?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2.5 text-left transition-colors hover:bg-zinc-50 hover:border-zinc-300 group"
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
        done ? "bg-emerald-50" : "bg-zinc-100"
      }`}>
        {done ? (
          <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d={icon} />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-zinc-900">{title}</p>
        {lines.map((line, i) => (
          <p key={i} className="text-[11px] text-zinc-500 truncate capitalize">{line}</p>
        ))}
      </div>
      <svg className="h-4 w-4 shrink-0 text-zinc-300 group-hover:text-zinc-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </button>
  );
}
