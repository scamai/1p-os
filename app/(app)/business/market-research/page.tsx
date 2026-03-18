"use client";

import { useState, useEffect } from "react";
import { Education, EDUCATION } from "@/components/shared/Education";

type Competitor = { id: string; name: string; url: string; pricing: string; strengths: string; weaknesses: string };

type MarketData = {
  tam: { value: number; unit: string; source: string };
  sam: { value: number; unit: string; source: string };
  som: { value: number; unit: string; source: string };
  competitors: Competitor[];
  trends: string;
  icpDescription: string;
};

const STORAGE_KEY = "1pos-market-research";
function uid() { return Math.random().toString(36).slice(2, 10); }

const INITIAL: MarketData = {
  tam: { value: 0, unit: "B", source: "" },
  sam: { value: 0, unit: "M", source: "" },
  som: { value: 0, unit: "M", source: "" },
  competitors: [],
  trends: "",
  icpDescription: "",
};

export default function Page() {
  const [data, setData] = useState<MarketData>(INITIAL);
  const [loaded, setLoaded] = useState(false);
  const [editingComp, setEditingComp] = useState<Competitor | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { try { setData({ ...INITIAL, ...JSON.parse(saved) }); } catch { /* ignore */ } }
    setLoaded(true);
  }, []);

  useEffect(() => { if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }, [data, loaded]);

  function fmt(val: number, unit: string) { return val > 0 ? `$${val}${unit}` : "$0"; }

  function saveComp() {
    if (!editingComp) return;
    setData((prev) => ({
      ...prev,
      competitors: prev.competitors.find((c) => c.id === editingComp.id)
        ? prev.competitors.map((c) => (c.id === editingComp.id ? editingComp : c))
        : [...prev.competitors, editingComp],
    }));
    setEditingComp(null);
  }

  if (!loaded) return null;

  return (
    <div className="mx-auto max-w-4xl">
      <Education {...EDUCATION.marketResearch} />
      <h1 className="text-lg font-semibold text-slate-900">Market Research</h1>
      <p className="mt-1 text-sm text-slate-500 mb-6">Size your market, understand your customer, and map the competition.</p>

      {/* ICP */}
      <div className="border border-slate-200 bg-white p-5 mb-4">
        <h2 className="text-[13px] font-semibold text-slate-900 mb-2">Ideal Customer Profile (ICP)</h2>
        <textarea
          value={data.icpDescription}
          onChange={(e) => setData((prev) => ({ ...prev, icpDescription: e.target.value }))}
          rows={3}
          placeholder="Describe your ideal customer in detail. Who are they? What's their role? How big is their company? What pain point keeps them up at night?"
          className="w-full text-[13px] border border-slate-200 px-3 py-2 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 resize-none"
        />
      </div>

      {/* Market Sizing */}
      <div className="border border-slate-200 bg-white p-5 mb-4">
        <h2 className="text-[13px] font-semibold text-slate-900 mb-4">Market Sizing</h2>
        <div className="grid grid-cols-3 gap-0 border border-slate-200">
          {(["tam", "sam", "som"] as const).map((key, i) => {
            const labels = { tam: "TAM (Total)", sam: "SAM (Serviceable)", som: "SOM (Obtainable)" };
            const descriptions = {
              tam: "Everyone who could possibly use this",
              sam: "The segment you can realistically serve",
              som: "What you can capture in 2-3 years",
            };
            const m = data[key];
            return (
              <div key={key} className={`p-4 ${i < 2 ? "border-r border-slate-200" : ""}`}>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">{labels[key]}</p>
                <p className="text-[10px] text-slate-400 mb-3">{descriptions[key]}</p>
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-slate-400 text-[13px]">$</span>
                  <input type="number" min={0} value={m.value}
                    onChange={(e) => setData((prev) => ({ ...prev, [key]: { ...prev[key], value: parseFloat(e.target.value) || 0 } }))}
                    className="w-20 text-[13px] border border-slate-200 px-2 py-1 text-slate-900 text-center focus:outline-none focus:border-slate-400" />
                  <select value={m.unit}
                    onChange={(e) => setData((prev) => ({ ...prev, [key]: { ...prev[key], unit: e.target.value } }))}
                    className="text-[12px] border border-slate-200 px-1 py-1 text-slate-700 focus:outline-none focus:border-slate-400">
                    <option value="K">K</option><option value="M">M</option><option value="B">B</option><option value="T">T</option>
                  </select>
                </div>
                <p className="text-xl font-bold font-mono text-slate-900">{fmt(m.value, m.unit)}</p>
                <input type="text" value={m.source} placeholder="Source..."
                  onChange={(e) => setData((prev) => ({ ...prev, [key]: { ...prev[key], source: e.target.value } }))}
                  className="mt-2 w-full text-[11px] border border-slate-100 px-2 py-1 text-slate-500 placeholder:text-slate-300 focus:outline-none focus:border-slate-400" />
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-center gap-3 text-[12px] text-slate-400">
          <span className="font-mono font-medium text-slate-700">{fmt(data.tam.value, data.tam.unit)}</span>
          <span>-&gt;</span>
          <span className="font-mono font-medium text-slate-700">{fmt(data.sam.value, data.sam.unit)}</span>
          <span>-&gt;</span>
          <span className="font-mono font-medium text-slate-700">{fmt(data.som.value, data.som.unit)}</span>
        </div>
      </div>

      {/* Competitors */}
      <div className="border border-slate-200 bg-white p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-semibold text-slate-900">Competitive Landscape</h2>
          <button onClick={() => setEditingComp({ id: uid(), name: "", url: "", pricing: "", strengths: "", weaknesses: "" })}
            className="text-[12px] px-3 py-1 bg-slate-900 text-white hover:bg-slate-800">Add Competitor</button>
        </div>

        {editingComp && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 w-full max-w-md shadow-xl border border-slate-200">
              <h3 className="text-[13px] font-semibold text-slate-900 mb-3">Competitor</h3>
              <div className="space-y-3">
                {([["name", "Name"], ["url", "Website"], ["pricing", "Pricing"]] as const).map(([f, l]) => (
                  <div key={f}>
                    <label className="block text-[11px] text-slate-500 mb-1">{l}</label>
                    <input type="text" value={editingComp[f]} onChange={(e) => setEditingComp({ ...editingComp, [f]: e.target.value })}
                      className="w-full text-[13px] border border-slate-200 px-2 py-1.5 text-slate-900 focus:outline-none focus:border-slate-400" />
                  </div>
                ))}
                {([["strengths", "What they do well"], ["weaknesses", "Where they fall short"]] as const).map(([f, l]) => (
                  <div key={f}>
                    <label className="block text-[11px] text-slate-500 mb-1">{l}</label>
                    <textarea value={editingComp[f]} onChange={(e) => setEditingComp({ ...editingComp, [f]: e.target.value })} rows={2}
                      className="w-full text-[13px] border border-slate-200 px-2 py-1.5 text-slate-900 focus:outline-none focus:border-slate-400 resize-none" />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setEditingComp(null)} className="text-[12px] px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={saveComp} className="text-[12px] px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800">Save</button>
              </div>
            </div>
          </div>
        )}

        {data.competitors.length === 0 ? (
          <p className="text-[13px] text-slate-300 text-center py-6">No competitors tracked yet. Every market has competitors — if you think yours doesn&apos;t, look harder.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.competitors.map((c) => (
              <div key={c.id} className="py-3 group">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-slate-900">{c.name}</span>
                      {c.url && <span className="text-[11px] text-slate-400">{c.url}</span>}
                      {c.pricing && <span className="text-[11px] text-slate-500 border border-slate-200 px-1.5 py-0.5">{c.pricing}</span>}
                    </div>
                    <div className="mt-1 grid grid-cols-2 gap-4">
                      {c.strengths && <p className="text-[12px] text-slate-500"><span className="font-medium text-slate-600">Strengths:</span> {c.strengths}</p>}
                      {c.weaknesses && <p className="text-[12px] text-slate-500"><span className="font-medium text-slate-600">Weaknesses:</span> {c.weaknesses}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingComp(c)} className="text-[11px] text-slate-400 hover:text-slate-700">Edit</button>
                    <button onClick={() => setData((prev) => ({ ...prev, competitors: prev.competitors.filter((x) => x.id !== c.id) }))}
                      className="text-[11px] text-slate-400 hover:text-slate-700">Del</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trends */}
      <div className="border border-slate-200 bg-white p-5">
        <h2 className="text-[13px] font-semibold text-slate-900 mb-2">Market Trends</h2>
        <textarea value={data.trends}
          onChange={(e) => setData((prev) => ({ ...prev, trends: e.target.value }))} rows={5}
          placeholder="What's changing in your industry? New regulations, emerging tech, shifting consumer behavior, macro trends..."
          className="w-full text-[13px] border border-slate-200 px-3 py-2 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 resize-none" />
      </div>
    </div>
  );
}
