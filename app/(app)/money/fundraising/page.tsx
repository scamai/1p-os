"use client";

import { useState, useEffect } from "react";
import { Education, EDUCATION } from "@/components/shared/Education";

interface Investor {
  id: string;
  name: string;
  firm: string;
  status: "intro" | "meeting" | "termsheet" | "committed" | "passed";
  amount: number;
  notes: string;
}

interface Round {
  id: string;
  name: string;
  target: number;
  valuation: number;
  investors: Investor[];
}

const STATUS_LABELS: Record<Investor["status"], string> = {
  intro: "Intro",
  meeting: "Meeting",
  termsheet: "Term Sheet",
  committed: "Committed",
  passed: "Passed",
};

const STATUS_COLORS: Record<Investor["status"], string> = {
  intro: "bg-zinc-200 text-zinc-700",
  meeting: "bg-zinc-300 text-zinc-800",
  termsheet: "bg-zinc-700 text-white",
  committed: "bg-black text-white",
  passed: "bg-zinc-100 text-zinc-400",
};

const ROUND_PRESETS = ["Pre-seed", "Seed", "Series A", "Series B"];

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export default function Page() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [activeRoundId, setActiveRoundId] = useState<string | null>(null);
  const [showRoundForm, setShowRoundForm] = useState(false);
  const [showInvestorForm, setShowInvestorForm] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState<Investor | null>(null);

  // Round form
  const [rName, setRName] = useState("");
  const [rTarget, setRTarget] = useState("");
  const [rVal, setRVal] = useState("");

  // Investor form
  const [iName, setIName] = useState("");
  const [iFirm, setIFirm] = useState("");
  const [iStatus, setIStatus] = useState<Investor["status"]>("intro");
  const [iAmount, setIAmount] = useState("");
  const [iNotes, setINotes] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("1pos_fundraising");
    if (saved) {
      const parsed = JSON.parse(saved) as Round[];
      setRounds(parsed);
      if (parsed.length > 0) setActiveRoundId(parsed[0].id);
    }
  }, []);

  function save(updated: Round[]) {
    setRounds(updated);
    localStorage.setItem("1pos_fundraising", JSON.stringify(updated));
  }

  function addRound() {
    if (!rName || !rTarget) return;
    const r: Round = {
      id: genId(),
      name: rName,
      target: parseFloat(rTarget) || 0,
      valuation: parseFloat(rVal) || 0,
      investors: [],
    };
    const updated = [...rounds, r];
    save(updated);
    setActiveRoundId(r.id);
    setRName("");
    setRTarget("");
    setRVal("");
    setShowRoundForm(false);
  }

  function deleteRound(id: string) {
    const updated = rounds.filter((r) => r.id !== id);
    save(updated);
    if (activeRoundId === id) setActiveRoundId(updated[0]?.id ?? null);
  }

  const activeRound = rounds.find((r) => r.id === activeRoundId) ?? null;

  function raised() {
    if (!activeRound) return 0;
    return activeRound.investors
      .filter((i) => i.status === "committed")
      .reduce((s, i) => s + i.amount, 0);
  }

  function resetInvestorForm() {
    setIName("");
    setIFirm("");
    setIStatus("intro");
    setIAmount("");
    setINotes("");
    setEditingInvestor(null);
  }

  function openEditInvestor(inv: Investor) {
    setEditingInvestor(inv);
    setIName(inv.name);
    setIFirm(inv.firm);
    setIStatus(inv.status);
    setIAmount(inv.amount.toString());
    setINotes(inv.notes);
    setShowInvestorForm(true);
  }

  function saveInvestor() {
    if (!activeRound || !iName) return;
    const inv: Investor = {
      id: editingInvestor?.id ?? genId(),
      name: iName,
      firm: iFirm,
      status: iStatus,
      amount: parseFloat(iAmount) || 0,
      notes: iNotes,
    };
    const updated = rounds.map((r) => {
      if (r.id !== activeRound.id) return r;
      const investors = editingInvestor
        ? r.investors.map((i) => (i.id === inv.id ? inv : i))
        : [...r.investors, inv];
      return { ...r, investors };
    });
    save(updated);
    resetInvestorForm();
    setShowInvestorForm(false);
  }

  function deleteInvestor(invId: string) {
    if (!activeRound) return;
    const updated = rounds.map((r) => {
      if (r.id !== activeRound.id) return r;
      return { ...r, investors: r.investors.filter((i) => i.id !== invId) };
    });
    save(updated);
  }

  const pct = activeRound && activeRound.target > 0
    ? Math.min(100, Math.round((raised() / activeRound.target) * 100))
    : 0;

  return (
    <div className="mx-auto max-w-[640px]">
      <Education {...EDUCATION.fundraising} />
      <h1 className="text-lg font-semibold text-zinc-900">Fundraising</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Track fundraising rounds, investor pipeline, and capital raised.
      </p>

      {/* Round tabs */}
      <div className="mt-6 flex items-center gap-2 flex-wrap">
        {rounds.map((r) => (
          <button
            key={r.id}
            onClick={() => setActiveRoundId(r.id)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              r.id === activeRoundId
                ? "bg-black text-white border-black"
                : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400"
            }`}
          >
            {r.name}
          </button>
        ))}
        <button
          onClick={() => setShowRoundForm(true)}
          className="px-3 py-1.5 text-sm rounded-md border border-dashed border-zinc-300 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
        >
          + Round
        </button>
      </div>

      {/* Add round form */}
      {showRoundForm && (
        <div className="mt-4 border border-zinc-200 rounded-lg p-4 bg-white">
          <h3 className="text-sm font-medium text-zinc-900 mb-3">New Round</h3>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Round Name</label>
              <div className="flex gap-2 flex-wrap">
                {ROUND_PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setRName(p)}
                    className={`px-2 py-1 text-xs rounded border ${
                      rName === p
                        ? "bg-black text-white border-black"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <input
                value={rName}
                onChange={(e) => setRName(e.target.value)}
                placeholder="Or type a custom name"
                className="mt-2 w-full border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Target ($)</label>
                <input
                  type="number"
                  value={rTarget}
                  onChange={(e) => setRTarget(e.target.value)}
                  placeholder="500000"
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Valuation ($)</label>
                <input
                  type="number"
                  value={rVal}
                  onChange={(e) => setRVal(e.target.value)}
                  placeholder="5000000"
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={addRound}
              className="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-zinc-800"
            >
              Create Round
            </button>
            <button
              onClick={() => setShowRoundForm(false)}
              className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active round details */}
      {activeRound && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-medium text-zinc-900">{activeRound.name}</h2>
              {activeRound.valuation > 0 && (
                <p className="text-xs text-zinc-500">Valuation: {fmt(activeRound.valuation)}</p>
              )}
            </div>
            <button
              onClick={() => deleteRound(activeRound.id)}
              className="text-xs text-zinc-400 hover:text-red-600"
            >
              Delete round
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4 border border-zinc-200 rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-zinc-600">
                {fmt(raised())} raised of {fmt(activeRound.target)}
              </span>
              <span className="font-medium text-zinc-900">{pct}%</span>
            </div>
            <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-black rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Investor pipeline */}
          <div className="mt-6 flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-900">
              Investor Pipeline ({activeRound.investors.length})
            </h3>
            <button
              onClick={() => {
                resetInvestorForm();
                setShowInvestorForm(true);
              }}
              className="text-sm text-zinc-600 hover:text-black"
            >
              + Add Investor
            </button>
          </div>

          {/* Investor form */}
          {showInvestorForm && (
            <div className="mt-3 border border-zinc-200 rounded-lg p-4 bg-white">
              <h3 className="text-sm font-medium text-zinc-900 mb-3">
                {editingInvestor ? "Edit Investor" : "Add Investor"}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Name</label>
                  <input
                    value={iName}
                    onChange={(e) => setIName(e.target.value)}
                    className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Firm</label>
                  <input
                    value={iFirm}
                    onChange={(e) => setIFirm(e.target.value)}
                    className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Status</label>
                  <select
                    value={iStatus}
                    onChange={(e) => setIStatus(e.target.value as Investor["status"])}
                    className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white"
                  >
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    value={iAmount}
                    onChange={(e) => setIAmount(e.target.value)}
                    className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs text-zinc-500 mb-1">Notes</label>
                <textarea
                  value={iNotes}
                  onChange={(e) => setINotes(e.target.value)}
                  rows={2}
                  className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black resize-none"
                />
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={saveInvestor}
                  className="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-zinc-800"
                >
                  {editingInvestor ? "Update" : "Add"}
                </button>
                <button
                  onClick={() => {
                    setShowInvestorForm(false);
                    resetInvestorForm();
                  }}
                  className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Investor list */}
          <div className="mt-3 space-y-2">
            {activeRound.investors.length === 0 && (
              <p className="text-sm text-zinc-400 py-4 text-center">No investors yet. Add your first investor above.</p>
            )}
            {activeRound.investors.map((inv) => (
              <div
                key={inv.id}
                className="border border-zinc-200 rounded-lg p-3 bg-white flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-900">{inv.name}</span>
                    {inv.firm && (
                      <span className="text-xs text-zinc-500">{inv.firm}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[inv.status]}`}>
                      {STATUS_LABELS[inv.status]}
                    </span>
                    {inv.amount > 0 && (
                      <span className="text-xs text-zinc-600">{fmt(inv.amount)}</span>
                    )}
                  </div>
                  {inv.notes && (
                    <p className="text-xs text-zinc-500 mt-1 truncate">{inv.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEditInvestor(inv)}
                    className="text-xs text-zinc-400 hover:text-zinc-700 px-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteInvestor(inv.id)}
                    className="text-xs text-zinc-400 hover:text-red-600 px-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rounds.length === 0 && !showRoundForm && (
        <div className="mt-12 text-center">
          <p className="text-sm text-zinc-500">No fundraising rounds yet.</p>
          <button
            onClick={() => setShowRoundForm(true)}
            className="mt-3 px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-zinc-800"
          >
            Create Your First Round
          </button>
        </div>
      )}
    </div>
  );
}
