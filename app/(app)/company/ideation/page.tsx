"use client";

import { useState, useEffect, useCallback } from "react";
import { Education, EDUCATION } from "@/components/shared/Education";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Competitor {
  id: string;
  name: string;
  url: string;
  strength: string;
  weakness: string;
}

interface IdeationData {
  problemStatement: string;
  targetCustomer: string;
  solutionHypothesis: string;
  unfairAdvantage: string;
  competitors: Competitor[];
}

const STORAGE_KEY = "1pos_ideation";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadData(): IdeationData {
  if (typeof window === "undefined") return defaultData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through
  }
  return defaultData();
}

function defaultData(): IdeationData {
  return {
    problemStatement: "",
    targetCustomer: "",
    solutionHypothesis: "",
    unfairAdvantage: "",
    competitors: [],
  };
}

function saveData(data: IdeationData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ---------------------------------------------------------------------------
// Auto-save textarea
// ---------------------------------------------------------------------------

function Section({
  label,
  hint,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <label className="block text-[13px] font-semibold text-slate-700">
        {label}
      </label>
      <p className="mt-0.5 text-[12px] text-slate-400 mb-3">{hint}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-y leading-relaxed"
        placeholder={`Write your ${label.toLowerCase()} here...`}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function IdeationPage() {
  const [data, setData] = useState<IdeationData>(defaultData());
  const [loaded, setLoaded] = useState(false);
  const [showCompForm, setShowCompForm] = useState(false);
  const [editingComp, setEditingComp] = useState<string | null>(null);

  // Competitor form
  const [compName, setCompName] = useState("");
  const [compUrl, setCompUrl] = useState("");
  const [compStrength, setCompStrength] = useState("");
  const [compWeakness, setCompWeakness] = useState("");

  useEffect(() => {
    setData(loadData());
    setLoaded(true);
  }, []);

  const persist = useCallback((next: IdeationData) => {
    setData(next);
    saveData(next);
  }, []);

  const updateField = (field: keyof Omit<IdeationData, "competitors">, value: string) => {
    persist({ ...data, [field]: value });
  };

  const resetCompForm = () => {
    setCompName("");
    setCompUrl("");
    setCompStrength("");
    setCompWeakness("");
    setEditingComp(null);
  };

  const openEditComp = (c: Competitor) => {
    setCompName(c.name);
    setCompUrl(c.url);
    setCompStrength(c.strength);
    setCompWeakness(c.weakness);
    setEditingComp(c.id);
    setShowCompForm(true);
  };

  const handleCompSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: Competitor = {
      id: editingComp || generateId(),
      name: compName.trim(),
      url: compUrl.trim(),
      strength: compStrength.trim(),
      weakness: compWeakness.trim(),
    };

    if (editingComp) {
      persist({
        ...data,
        competitors: data.competitors.map((c) =>
          c.id === editingComp ? entry : c
        ),
      });
    } else {
      persist({
        ...data,
        competitors: [...data.competitors, entry],
      });
    }
    resetCompForm();
    setShowCompForm(false);
  };

  const deleteComp = (id: string) => {
    persist({
      ...data,
      competitors: data.competitors.filter((c) => c.id !== id),
    });
  };

  // Word counts
  const wordCount = (s: string) =>
    s.trim() ? s.trim().split(/\s+/).length : 0;

  const sections = [
    { key: "problemStatement", filled: !!data.problemStatement.trim() },
    { key: "targetCustomer", filled: !!data.targetCustomer.trim() },
    { key: "solutionHypothesis", filled: !!data.solutionHypothesis.trim() },
    { key: "unfairAdvantage", filled: !!data.unfairAdvantage.trim() },
    { key: "competitors", filled: data.competitors.length > 0 },
  ];
  const filledCount = sections.filter((s) => s.filled).length;

  if (!loaded) return null;

  return (
    <div className="mx-auto max-w-[800px]">
      <Education {...EDUCATION.ideation} />
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Ideation</h1>
        <p className="mt-1 text-sm text-slate-500">
          Define the core of your business: the problem, customer, solution, and
          what makes you different.
        </p>
      </div>

      {/* Completion indicator */}
      <div className="mt-6 flex items-center gap-3">
        <div className="flex gap-1">
          {sections.map((s, i) => (
            <div
              key={i}
              className={`h-1.5 w-8 rounded-full transition-colors ${
                s.filled ? "bg-slate-900" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
        <span className="text-[12px] text-slate-400">
          {filledCount} of {sections.length} sections filled
        </span>
      </div>

      {/* Sections */}
      <div className="mt-6 space-y-4">
        <Section
          label="Problem Statement"
          hint="What painful problem are you solving? Who has this problem and how badly does it hurt?"
          value={data.problemStatement}
          onChange={(v) => updateField("problemStatement", v)}
          rows={4}
        />

        <Section
          label="Target Customer"
          hint="Who is your ideal customer? Be specific: job title, company size, industry, demographics."
          value={data.targetCustomer}
          onChange={(v) => updateField("targetCustomer", v)}
          rows={3}
        />

        <Section
          label="Solution Hypothesis"
          hint="How does your product solve this problem? What does the user experience look like?"
          value={data.solutionHypothesis}
          onChange={(v) => updateField("solutionHypothesis", v)}
          rows={4}
        />

        {/* Competitive Landscape */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[13px] font-semibold text-slate-700">
              Competitive Landscape
            </h2>
            <button
              onClick={() => {
                resetCompForm();
                setShowCompForm(!showCompForm);
              }}
              className="h-7 rounded-md bg-slate-900 px-2.5 text-[12px] font-medium text-white transition-opacity hover:opacity-90"
            >
              {showCompForm ? "Cancel" : "+ Add"}
            </button>
          </div>
          <p className="text-[12px] text-slate-400 mb-4">
            Who else is solving this problem? What are their strengths and
            weaknesses?
          </p>

          {/* Add / Edit Form */}
          {showCompForm && (
            <form
              onSubmit={handleCompSubmit}
              className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-slate-500 mb-1">
                    Competitor Name
                  </label>
                  <input
                    required
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    className="h-8 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="Acme Inc."
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-slate-500 mb-1">
                    Website
                  </label>
                  <input
                    value={compUrl}
                    onChange={(e) => setCompUrl(e.target.value)}
                    className="h-8 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="https://acme.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-slate-500 mb-1">
                    Their Strength
                  </label>
                  <input
                    value={compStrength}
                    onChange={(e) => setCompStrength(e.target.value)}
                    className="h-8 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="Large user base, brand recognition"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-slate-500 mb-1">
                    Their Weakness
                  </label>
                  <input
                    value={compWeakness}
                    onChange={(e) => setCompWeakness(e.target.value)}
                    className="h-8 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="Slow to innovate, expensive"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="h-7 rounded-md bg-slate-900 px-3 text-[12px] font-medium text-white transition-opacity hover:opacity-90"
                >
                  {editingComp ? "Save" : "Add Competitor"}
                </button>
              </div>
            </form>
          )}

          {/* Competitor cards */}
          {data.competitors.length > 0 ? (
            <div className="space-y-2">
              {data.competitors.map((c) => (
                <div
                  key={c.id}
                  className="group rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 hover:bg-white transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-medium text-slate-900">
                          {c.name}
                        </p>
                        {c.url && (
                          <a
                            href={
                              c.url.startsWith("http") ? c.url : `https://${c.url}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {c.url.replace(/^https?:\/\//, "")}
                          </a>
                        )}
                      </div>
                      <div className="mt-1.5 grid grid-cols-2 gap-4">
                        {c.strength && (
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                              Strength
                            </p>
                            <p className="text-[12px] text-slate-600">
                              {c.strength}
                            </p>
                          </div>
                        )}
                        {c.weakness && (
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                              Weakness
                            </p>
                            <p className="text-[12px] text-slate-600">
                              {c.weakness}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="hidden group-hover:flex items-center gap-1 shrink-0 ml-2">
                      <button
                        onClick={() => openEditComp(c)}
                        className="rounded px-2 py-1 text-[11px] text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteComp(c.id)}
                        className="rounded px-2 py-1 text-[11px] text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !showCompForm && (
              <p className="text-[12px] text-slate-400">
                No competitors added yet.
              </p>
            )
          )}
        </div>

        <Section
          label="Unfair Advantage"
          hint="What do you have that can't easily be copied or bought? Domain expertise, network, proprietary data, speed, unique insight?"
          value={data.unfairAdvantage}
          onChange={(v) => updateField("unfairAdvantage", v)}
          rows={3}
        />
      </div>

    </div>
  );
}
