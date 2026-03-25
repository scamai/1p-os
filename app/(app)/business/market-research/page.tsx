"use client";

import { useState, useEffect } from "react";

import { RelatedPages } from "@/components/shared/RelatedPages";

type Threat = "low" | "medium" | "high";
type Competitor = { id: string; name: string; url: string; pricing: string; strengths: string; weaknesses: string; yourEdge: string; threat: Threat };

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

      <h1 className="font-heading text-[clamp(1.5rem,3vw,1.75rem)] italic font-light tracking-[-0.01em] text-black">Market Research</h1>
      <p className="mt-2 text-[14px] leading-[1.6] text-black/40 mb-6">Size your market, understand your customer, and map the competition.</p>

      {/* ICP */}
      <div className="border border-black/[0.08] bg-white p-5 mb-4">
        <h2 className="text-[13px] font-semibold text-black mb-2">Ideal Customer Profile (ICP)</h2>
        <textarea
          value={data.icpDescription}
          onChange={(e) => setData((prev) => ({ ...prev, icpDescription: e.target.value }))}
          rows={3}
          placeholder="Describe your ideal customer in detail. Who are they? What's their role? How big is their company? What pain point keeps them up at night?"
          className="w-full text-[13px] border border-black/[0.08] px-3 py-2 text-black/70 placeholder:text-black/30 focus:outline-none focus:border-black/40 resize-none"
        />
      </div>

      {/* Market Sizing */}
      <div className="border border-black/[0.08] bg-white p-5 mb-4">
        <h2 className="text-[13px] font-semibold text-black mb-1">Market Sizing</h2>
        <p className="text-[12px] text-black/40 mb-5">How big is the opportunity? Be honest — investors will check.</p>

        {/* Funnel visualization */}
        <div className="flex flex-col items-center gap-0 mb-6">
          {(["tam", "sam", "som"] as const).map((key, i) => {
            const labels = { tam: "TAM", sam: "SAM", som: "SOM" };
            const fullLabels = { tam: "Total Addressable Market", sam: "Serviceable Addressable Market", som: "Serviceable Obtainable Market" };
            const widths = ["w-full", "w-[75%]", "w-[50%]"];
            const m = data[key];
            return (
              <div key={key} className={`${widths[i]} transition-all`}>
                <div className={`border border-black/[0.08] bg-black/[0.02] p-4 ${i === 0 ? "" : "border-t-0"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-[13px] font-semibold text-black">{labels[key]}</span>
                      <span className="text-[11px] text-black/40 ml-2">{fullLabels[key]}</span>
                    </div>
                    <p className="text-[18px] font-bold font-mono text-black tracking-tight">{fmt(m.value, m.unit)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 flex-1">
                      <span className="text-black/40 text-[13px]">$</span>
                      <input type="number" min={0} value={m.value || ""}
                        onChange={(e) => setData((prev) => ({ ...prev, [key]: { ...prev[key], value: parseFloat(e.target.value) || 0 } }))}
                        placeholder="0"
                        className="w-full text-[14px] border border-black/[0.08] px-3 py-2 text-black focus:outline-none focus:border-black/30" />
                      <select value={m.unit}
                        onChange={(e) => setData((prev) => ({ ...prev, [key]: { ...prev[key], unit: e.target.value } }))}
                        className="text-[13px] border border-black/[0.08] px-2 py-2 text-black/70 focus:outline-none focus:border-black/30 bg-white">
                        <option value="K">K</option><option value="M">M</option><option value="B">B</option><option value="T">T</option>
                      </select>
                    </div>
                    <input type="text" value={m.source} placeholder="Source (e.g. Gartner 2024)"
                      onChange={(e) => setData((prev) => ({ ...prev, [key]: { ...prev[key], source: e.target.value } }))}
                      className="flex-1 text-[12px] border border-black/[0.08] px-3 py-2 text-black/60 placeholder:text-black/25 focus:outline-none focus:border-black/30" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Funnel summary */}
        <div className="flex items-center justify-center gap-2 text-[13px]">
          <span className="font-mono font-semibold text-black">{fmt(data.tam.value, data.tam.unit)}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black/30"><polyline points="9 18 15 12 9 6" /></svg>
          <span className="font-mono font-semibold text-black">{fmt(data.sam.value, data.sam.unit)}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black/30"><polyline points="9 18 15 12 9 6" /></svg>
          <span className="font-mono font-semibold text-black">{fmt(data.som.value, data.som.unit)}</span>
        </div>
      </div>

      {/* Competitive Landscape */}
      <div className="border border-black/[0.08] bg-white p-5 mb-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[13px] font-semibold text-black">Competitive Landscape</h2>
          <button onClick={() => setEditingComp({ id: uid(), name: "", url: "", pricing: "", strengths: "", weaknesses: "", yourEdge: "", threat: "medium" })}
            className="text-[12px] px-3 py-1.5 bg-black text-white hover:bg-black/80">Add Competitor</button>
        </div>
        <p className="text-[12px] text-black/40 mb-5">&ldquo;We have no competitors&rdquo; is a red flag. Every market has them.</p>

        {/* Edit modal */}
        {editingComp && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-4 sm:p-6 w-full mx-2 sm:mx-0 sm:max-w-lg shadow-xl border border-black/[0.08]">
              <h3 className="text-[14px] font-semibold text-black mb-4">{editingComp.name || "New Competitor"}</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-black/50 mb-1">Name</label>
                    <input type="text" value={editingComp.name} onChange={(e) => setEditingComp({ ...editingComp, name: e.target.value })}
                      placeholder="Acme Inc."
                      className="w-full text-[13px] border border-black/[0.08] px-3 py-2 text-black focus:outline-none focus:border-black/30" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-black/50 mb-1">Website</label>
                    <input type="text" value={editingComp.url} onChange={(e) => setEditingComp({ ...editingComp, url: e.target.value })}
                      placeholder="acme.com"
                      className="w-full text-[13px] border border-black/[0.08] px-3 py-2 text-black focus:outline-none focus:border-black/30" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-black/50 mb-1">Their pricing</label>
                    <input type="text" value={editingComp.pricing} onChange={(e) => setEditingComp({ ...editingComp, pricing: e.target.value })}
                      placeholder="$49/mo, Free tier, Enterprise"
                      className="w-full text-[13px] border border-black/[0.08] px-3 py-2 text-black focus:outline-none focus:border-black/30" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-black/50 mb-1">Threat level</label>
                    <div className="flex gap-1">
                      {(["low", "medium", "high"] as Threat[]).map((t) => (
                        <button key={t} onClick={() => setEditingComp({ ...editingComp, threat: t })}
                          className={`flex-1 py-2 text-[12px] font-medium border transition-colors ${
                            editingComp.threat === t
                              ? t === "high" ? "border-black bg-black text-white" : t === "medium" ? "border-black/60 bg-black/60 text-white" : "border-black/30 bg-black/20 text-black"
                              : "border-black/[0.08] text-black/40 hover:bg-black/[0.02]"
                          }`}>
                          {t === "low" ? "Low" : t === "medium" ? "Medium" : "High"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-black/50 mb-1">Their strengths</label>
                    <textarea value={editingComp.strengths} onChange={(e) => setEditingComp({ ...editingComp, strengths: e.target.value })} rows={2}
                      placeholder="What they do well..."
                      className="w-full text-[13px] border border-black/[0.08] px-3 py-2 text-black focus:outline-none focus:border-black/30 resize-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-black/50 mb-1">Their weaknesses</label>
                    <textarea value={editingComp.weaknesses} onChange={(e) => setEditingComp({ ...editingComp, weaknesses: e.target.value })} rows={2}
                      placeholder="Where they fall short..."
                      className="w-full text-[13px] border border-black/[0.08] px-3 py-2 text-black focus:outline-none focus:border-black/30 resize-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-black/50 mb-1">Your edge over them</label>
                  <input type="text" value={editingComp.yourEdge} onChange={(e) => setEditingComp({ ...editingComp, yourEdge: e.target.value })}
                    placeholder="What makes you win against this competitor?"
                    className="w-full text-[13px] border border-black/[0.08] px-3 py-2 text-black focus:outline-none focus:border-black/30" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button onClick={() => setEditingComp(null)} className="text-[12px] px-4 py-2 border border-black/[0.08] text-black/60 hover:bg-black/[0.02]">Cancel</button>
                <button onClick={saveComp} className="text-[12px] px-4 py-2 bg-black text-white hover:bg-black/80">Save</button>
              </div>
            </div>
          </div>
        )}

        {data.competitors.length === 0 ? (
          <div className="border border-dashed border-black/[0.08] py-10 text-center">
            <p className="text-[13px] text-black/30">No competitors tracked yet.</p>
            <p className="text-[12px] text-black/20 mt-1">Add your top 3-5 competitors to understand how you stack up.</p>
          </div>
        ) : (
          <>
            {/* Threat overview bar */}
            <div className="flex gap-1 mb-4">
              {data.competitors.map((c) => (
                <div key={c.id} className="flex-1 group relative">
                  <div className={`h-2 ${c.threat === "high" ? "bg-black" : c.threat === "medium" ? "bg-black/40" : "bg-black/15"}`} />
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                    <span className="text-[10px] text-black/60 bg-white border border-black/[0.08] px-1.5 py-0.5 whitespace-nowrap shadow-sm">{c.name}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Competitor cards */}
            <div className="space-y-3">
              {data.competitors.map((c) => (
                <div key={c.id} className="border border-black/[0.06] group">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-black/[0.015]">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Threat dot */}
                      <div className={`h-2.5 w-2.5 shrink-0 ${c.threat === "high" ? "bg-black" : c.threat === "medium" ? "bg-black/40" : "bg-black/15"}`} title={`${c.threat} threat`} />
                      <span className="text-[14px] font-medium text-black truncate">{c.name}</span>
                      {c.url && (
                        <a href={c.url.startsWith("http") ? c.url : `https://${c.url}`} target="_blank" rel="noopener noreferrer"
                          className="text-[11px] text-black/30 hover:text-black/60 transition-colors truncate hidden sm:block">
                          {c.url.replace(/^https?:\/\//, "")}
                        </a>
                      )}
                      {c.pricing && <span className="text-[11px] text-black/50 bg-black/[0.04] px-2 py-0.5 shrink-0">{c.pricing}</span>}
                    </div>
                    <div className="flex gap-2 shrink-0 ml-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingComp({ ...c, yourEdge: c.yourEdge || "", threat: c.threat || "medium" })} className="text-[11px] text-black/40 hover:text-black py-1 px-1.5">Edit</button>
                      <button onClick={() => setData((prev) => ({ ...prev, competitors: prev.competitors.filter((x) => x.id !== c.id) }))}
                        className="text-[11px] text-black/30 hover:text-black py-1 px-1.5">Delete</button>
                    </div>
                  </div>

                  {/* Body — strengths vs weaknesses */}
                  {(c.strengths || c.weaknesses || c.yourEdge) && (
                    <div className="px-4 py-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {c.strengths && (
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-black/35 mb-1">Their strengths</p>
                            <p className="text-[12px] leading-[1.6] text-black/55">{c.strengths}</p>
                          </div>
                        )}
                        {c.weaknesses && (
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-black/35 mb-1">Their weaknesses</p>
                            <p className="text-[12px] leading-[1.6] text-black/55">{c.weaknesses}</p>
                          </div>
                        )}
                        {c.yourEdge && (
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-black/35 mb-1">Your edge</p>
                            <p className="text-[12px] leading-[1.6] text-black/70 font-medium">{c.yourEdge}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Trends */}
      <div className="border border-black/[0.08] bg-white p-5">
        <h2 className="text-[13px] font-semibold text-black mb-2">Market Trends</h2>
        <textarea value={data.trends}
          onChange={(e) => setData((prev) => ({ ...prev, trends: e.target.value }))} rows={5}
          placeholder="What's changing in your industry? New regulations, emerging tech, shifting consumer behavior, macro trends..."
          className="w-full text-[13px] border border-black/[0.08] px-3 py-2 text-black/70 placeholder:text-black/30 focus:outline-none focus:border-black/40 resize-none" />
      </div>

      <RelatedPages links={[
        { label: "Ideation", href: "/company/ideation", context: "Validate your problem statement with research findings" },
        { label: "Business Model", href: "/business/model", context: "Use market insights to refine your canvas" },
        { label: "Go-to-Market", href: "/business/gtm", context: "Turn research into a launch strategy" },
      ]} />
    </div>
  );
}
