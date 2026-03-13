"use client";

import * as React from "react";
import { TabBar } from "@/components/shared/TabBar";
import { DevicesPanel } from "@/components/sections/settings/DevicesPanel";

const TABS = ["Business", "Security", "Models", "API Keys", "Usage"];

// --- Business Tab (fully wired) ---

function BusinessTab() {
  const [name, setName] = React.useState("");
  const [entity, setEntity] = React.useState("llc");
  const [industry, setIndustry] = React.useState("");
  const [timezone, setTimezone] = React.useState("America/New_York");
  const [currency, setCurrency] = React.useState("USD");
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/context");
        if (res.ok) {
          const data = await res.json();
          if (data.business) {
            setName(data.business.name ?? "");
            setEntity(data.business.entity_type ?? "llc");
            setIndustry(data.business.industry ?? "");
            setTimezone(data.business.timezone ?? "America/New_York");
            setCurrency(data.business.currency ?? "USD");
          }
        }
      } catch {
        // Use defaults
      }
      setLoaded(true);
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/context", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: name,
          entity_type: entity,
          industry,
          timezone,
          currency,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return <div className="animate-pulse space-y-4"><div className="h-4 w-48 rounded bg-zinc-100" /><div className="h-8 rounded bg-zinc-100" /><div className="h-8 rounded bg-zinc-100" /></div>;
  }

  return (
    <div className="space-y-5">
      <label className="block">
        <span className="text-[12px] text-zinc-500">Business Name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full bg-transparent border-b border-zinc-200 pb-1.5 text-[13px] text-zinc-900 outline-none transition-colors focus:border-zinc-400"
        />
      </label>

      <label className="block">
        <span className="text-[12px] text-zinc-500">Entity Type</span>
        <select
          value={entity}
          onChange={(e) => setEntity(e.target.value)}
          className="mt-1 block w-full bg-transparent border-b border-zinc-200 pb-1.5 text-[13px] text-zinc-900 outline-none transition-colors focus:border-zinc-400"
        >
          <option value="llc">LLC</option>
          <option value="corp">Corp</option>
          <option value="sole-prop">Sole Prop</option>
          <option value="other">Other</option>
        </select>
      </label>

      <label className="block">
        <span className="text-[12px] text-zinc-500">Industry</span>
        <input
          type="text"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="mt-1 block w-full bg-transparent border-b border-zinc-200 pb-1.5 text-[13px] text-zinc-900 outline-none transition-colors focus:border-zinc-400"
        />
      </label>

      <label className="block">
        <span className="text-[12px] text-zinc-500">Timezone</span>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="mt-1 block w-full bg-transparent border-b border-zinc-200 pb-1.5 text-[13px] text-zinc-900 outline-none transition-colors focus:border-zinc-400"
        >
          <option value="America/New_York">America/New_York</option>
          <option value="America/Chicago">America/Chicago</option>
          <option value="America/Denver">America/Denver</option>
          <option value="America/Los_Angeles">America/Los_Angeles</option>
          <option value="Europe/London">Europe/London</option>
          <option value="Europe/Berlin">Europe/Berlin</option>
          <option value="Asia/Tokyo">Asia/Tokyo</option>
          <option value="Asia/Singapore">Asia/Singapore</option>
        </select>
      </label>

      <label className="block">
        <span className="text-[12px] text-zinc-500">Currency</span>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="mt-1 block w-full bg-transparent border-b border-zinc-200 pb-1.5 text-[13px] text-zinc-900 outline-none transition-colors focus:border-zinc-400"
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="AUD">AUD</option>
          <option value="CAD">CAD</option>
        </select>
      </label>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-[12px] text-zinc-500 transition-colors hover:text-zinc-900 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {saved && <span className="text-[12px] text-zinc-400">Saved</span>}
      </div>
    </div>
  );
}

// --- Security Tab (fully wired) ---

function SecurityTab() {
  const [budgetDaily, setBudgetDaily] = React.useState(20);
  const [budgetMonthly, setBudgetMonthly] = React.useState(500);
  const [alertThreshold, setAlertThreshold] = React.useState(80);
  const [cbEnabled, setCbEnabled] = React.useState(true);
  const [cbThreshold, setCbThreshold] = React.useState(50);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [approvals, setApprovals] = React.useState<Array<{ id: string; action: string; agent: string }>>([]);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/safety/budget");
        if (res.ok) {
          const data = await res.json();
          setBudgetDaily(data.globalDailyBudget ?? 20);
          setBudgetMonthly(data.globalMonthlyBudget ?? 500);
          setAlertThreshold(data.alertThreshold ?? 80);
          setCbEnabled(data.circuitBreakerEnabled ?? true);
          setCbThreshold(data.circuitBreakerThreshold ?? 50);
        }
      } catch {
        // Use defaults
      }
      try {
        const res = await fetch("/api/security/approvals");
        if (res.ok) {
          const data = await res.json();
          setApprovals(data.approvals ?? []);
        }
      } catch {
        // No approvals
      }
    }
    load();
  }, []);

  const handleSaveBudget = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/safety/budget", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          globalDailyBudget: budgetDaily,
          globalMonthlyBudget: budgetMonthly,
          alertThreshold,
          circuitBreakerEnabled: cbEnabled,
          circuitBreakerThreshold: cbThreshold,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleApproval = async (id: string, decision: "approve" | "deny") => {
    try {
      await fetch("/api/security/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, decision }),
      });
      setApprovals((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // Silent
    }
  };

  const handleKillSwitch = async () => {
    if (!confirm("This will pause ALL agents immediately. Continue?")) return;
    try {
      await fetch("/api/safety/kill-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: "all" }),
      });
    } catch {
      // Silent
    }
  };

  return (
    <div className="space-y-8">
      {/* Budget */}
      <div className="space-y-4">
        <p className="text-xs font-medium text-zinc-900">Budget Limits</p>
        <label className="block">
          <span className="text-[12px] text-zinc-500">Daily budget ($)</span>
          <input
            type="number"
            step="0.50"
            min="0"
            value={budgetDaily}
            onChange={(e) => setBudgetDaily(parseFloat(e.target.value) || 0)}
            className="mt-1 block w-full bg-transparent border-b border-zinc-200 pb-1.5 text-[13px] text-zinc-900 outline-none focus:border-zinc-400"
          />
        </label>
        <label className="block">
          <span className="text-[12px] text-zinc-500">Monthly budget ($)</span>
          <input
            type="number"
            step="5"
            min="0"
            value={budgetMonthly}
            onChange={(e) => setBudgetMonthly(parseFloat(e.target.value) || 0)}
            className="mt-1 block w-full bg-transparent border-b border-zinc-200 pb-1.5 text-[13px] text-zinc-900 outline-none focus:border-zinc-400"
          />
        </label>
      </div>

      {/* Alert */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-zinc-900">Alerts</p>
        <label className="text-[12px] text-zinc-500">
          Alert at {alertThreshold}% of daily budget
        </label>
        <input
          type="range"
          min="50"
          max="100"
          step="5"
          value={alertThreshold}
          onChange={(e) => setAlertThreshold(parseInt(e.target.value))}
          className="w-full accent-zinc-900"
        />
      </div>

      {/* Circuit Breaker */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-zinc-900">Circuit Breaker</p>
        <label className="flex items-center gap-2 text-[13px] text-zinc-700 cursor-pointer">
          <input
            type="checkbox"
            checked={cbEnabled}
            onChange={(e) => setCbEnabled(e.target.checked)}
            className="accent-zinc-900"
          />
          Auto-pause agents if daily spend exceeds threshold
        </label>
        {cbEnabled && (
          <label className="block">
            <span className="text-[12px] text-zinc-500">Threshold ($)</span>
            <input
              type="number"
              step="1"
              min="1"
              value={cbThreshold}
              onChange={(e) => setCbThreshold(parseFloat(e.target.value) || 0)}
              className="mt-1 block w-full bg-transparent border-b border-zinc-200 pb-1.5 text-[13px] text-zinc-900 outline-none focus:border-zinc-400"
            />
          </label>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSaveBudget}
          disabled={saving}
          className="text-[12px] text-zinc-500 transition-colors hover:text-zinc-900 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Safety Settings"}
        </button>
        {saved && <span className="text-[12px] text-zinc-400">Saved</span>}
      </div>

      {/* Exec Approvals */}
      {approvals.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-zinc-900">Pending Approvals</p>
          {approvals.map((item) => (
            <div key={item.id} className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
              <div>
                <p className="text-[13px] text-zinc-900">{item.action}</p>
                <p className="text-[11px] text-zinc-500">{item.agent}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApproval(item.id, "approve")}
                  className="text-[12px] text-zinc-500 transition-colors hover:text-zinc-900"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleApproval(item.id, "deny")}
                  className="text-[12px] text-zinc-400 transition-colors hover:text-zinc-700"
                >
                  Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Devices */}
      <DevicesPanel />

      {/* Kill Switch */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-zinc-900">Emergency</p>
        <button
          onClick={handleKillSwitch}
          className="rounded border border-zinc-300 px-4 py-2 text-[13px] text-zinc-700 transition-colors hover:bg-zinc-100"
        >
          Emergency Stop — Pause All Agents
        </button>
      </div>
    </div>
  );
}

// --- Models Tab (links to full page) ---

function ModelsTab() {
  const [strategy, setStrategy] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/efficiency/routing");
        if (res.ok) {
          const data = await res.json();
          setStrategy(data.routing?.strategy ?? "balanced");
        }
      } catch {
        setStrategy("balanced");
      }
    }
    load();
  }, []);

  const strategies = [
    { id: "quality", label: "Quality", desc: "Best models for every task" },
    { id: "balanced", label: "Balanced", desc: "Smart routing by task complexity" },
    { id: "savings", label: "Savings", desc: "Cheapest models that work" },
  ];

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/efficiency/routing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy: id }),
      });
      if (res.ok) {
        setStrategy(id);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs font-medium text-zinc-900">Routing Strategy</p>
        <div className="space-y-2">
          {strategies.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSave(s.id)}
              disabled={saving}
              className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all ${
                strategy === s.id
                  ? "border-zinc-900 bg-zinc-50"
                  : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <span className={`inline-block h-2 w-2 rounded-full ${strategy === s.id ? "bg-zinc-900" : "bg-zinc-300"}`} />
              <div>
                <p className={`text-[13px] ${strategy === s.id ? "text-zinc-900 font-medium" : "text-zinc-600"}`}>{s.label}</p>
                <p className="text-[11px] text-zinc-400">{s.desc}</p>
              </div>
            </button>
          ))}
        </div>
        {saved && <span className="text-[12px] text-zinc-400">Strategy updated</span>}
      </div>

      <a
        href="/settings/models"
        className="inline-block text-[12px] text-zinc-500 transition-colors hover:text-zinc-900"
      >
        View full model routing details →
      </a>
    </div>
  );
}

// --- API Keys Tab ---

function APIKeysTab() {
  const [keys, setKeys] = React.useState([
    { name: "Anthropic", envVar: "ANTHROPIC_API_KEY", set: false },
    { name: "OpenAI", envVar: "OPENAI_API_KEY", set: false },
    { name: "Stripe", envVar: "STRIPE_SECRET_KEY", set: false },
    { name: "Supabase", envVar: "NEXT_PUBLIC_SUPABASE_URL", set: false },
  ]);

  React.useEffect(() => {
    // Check which env vars are configured via API
    async function check() {
      try {
        const res = await fetch("/api/context");
        if (res.ok) {
          const data = await res.json();
          const configured = data.configuredKeys ?? [];
          setKeys((prev) =>
            prev.map((k) => ({
              ...k,
              set: configured.includes(k.envVar) || configured.includes(k.name.toLowerCase()),
            }))
          );
        }
      } catch {
        // Use defaults — assume not set
      }
    }
    check();
  }, []);

  return (
    <div className="space-y-6">
      <p className="text-[12px] text-zinc-500">
        API keys are stored as environment variables. Edit your <code className="rounded bg-zinc-100 px-1 py-0.5 text-[11px] font-mono">.env.local</code> file to update them.
      </p>

      <div className="space-y-3">
        {keys.map((key) => (
          <div
            key={key.name}
            className="flex items-center justify-between border-b border-zinc-100 pb-2.5"
          >
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-zinc-900">{key.name}</span>
              <span className="font-mono text-[11px] text-zinc-400">{key.envVar}</span>
            </div>
            <span className={`text-[12px] ${key.set ? "text-zinc-900" : "text-zinc-400"}`}>
              {key.set ? "Configured" : "Not set"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Usage Tab ---

function UsageTab() {
  const [usage, setUsage] = React.useState<{
    apiCalls: number;
    tokens: number;
    cost: number;
    agents: Array<{ name: string; cost: number; tasks: number }>;
  } | null>(null);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/safety/budget");
        if (res.ok) {
          const data = await res.json();
          setUsage({
            apiCalls: data.totalCalls ?? 0,
            tokens: data.totalTokens ?? 0,
            cost: data.currentSpend ?? 0,
            agents: data.agentBreakdown ?? [],
          });
        }
      } catch {
        // Default
      }
    }
    load();
  }, []);

  if (!usage) {
    return <div className="animate-pulse space-y-4"><div className="h-4 w-32 rounded bg-zinc-100" /><div className="h-16 rounded bg-zinc-100" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium text-zinc-900">This Month</p>
        <div className="mt-3 grid grid-cols-3 gap-8">
          <div>
            <p className="text-[11px] text-zinc-500">API Calls</p>
            <p className="font-mono text-lg font-semibold text-zinc-900">{usage.apiCalls.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500">Tokens</p>
            <p className="font-mono text-lg font-semibold text-zinc-900">
              {usage.tokens >= 1_000_000 ? `${(usage.tokens / 1_000_000).toFixed(1)}M` : `${(usage.tokens / 1_000).toFixed(0)}k`}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500">Total Cost</p>
            <p className="font-mono text-lg font-semibold text-zinc-900">${usage.cost.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {usage.agents.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-zinc-900">Per Agent</p>
          {usage.agents.map((a) => (
            <div key={a.name} className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
              <div>
                <span className="text-[13px] text-zinc-900">{a.name}</span>
                <span className="ml-2 text-[11px] text-zinc-400">{a.tasks} tasks</span>
              </div>
              <span className="font-mono text-[13px] text-zinc-500">${a.cost.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-zinc-400">
        Self-hosted — you pay only for AI API usage directly to providers.
      </p>
    </div>
  );
}

// --- Main ---

function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState("Business");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-lg font-semibold text-zinc-900">Settings</h1>

      <div className="mt-6 border-b border-zinc-200">
        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      <div className="mt-8">
        {activeTab === "Business" && <BusinessTab />}
        {activeTab === "Security" && <SecurityTab />}
        {activeTab === "Models" && <ModelsTab />}
        {activeTab === "API Keys" && <APIKeysTab />}
        {activeTab === "Usage" && <UsageTab />}
      </div>
    </div>
  );
}

export { SettingsPage };
