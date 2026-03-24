"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ---------------------------------------------------------------------------
// Equity Split Calculator — draggable sliders, no database
// ---------------------------------------------------------------------------

type Founder = { id: string; name: string; pct: number };

const STORAGE_KEY = "1pos-equity-split";
function uid() { return Math.random().toString(36).slice(2, 10); }

const DEFAULT: Founder[] = [
  { id: uid(), name: "Founder 1", pct: 50 },
  { id: uid(), name: "Founder 2", pct: 50 },
];

const SHADES = ["bg-black", "bg-black/70", "bg-black/50", "bg-black/35", "bg-black/20"];

// ── Drag slider ──

function Slider({ value, max, onChange, shade = "bg-black" }: { value: number; max: number; onChange: (v: number) => void; shade?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const pctFromEvent = useCallback((e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    const track = trackRef.current;
    if (!track) return value;
    const rect = track.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(ratio * max);
  }, [max, value]);

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    dragging.current = true;
    onChange(pctFromEvent(e));

    const onMove = (ev: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const clientX = "touches" in ev ? ev.touches[0].clientX : ev.clientX;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onChange(Math.round(ratio * max));
    };

    const onEnd = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
  }, [max, onChange, pctFromEvent]);

  const pct = max > 0 ? (value / max) * 100 : 0;

  return (
    <div
      ref={trackRef}
      className="relative h-8 cursor-pointer select-none touch-none"
      onMouseDown={handleStart}
      onTouchStart={handleStart}
    >
      {/* Track bg */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 bg-black/[0.06]" />
      {/* Filled */}
      <div className={`absolute top-1/2 -translate-y-1/2 left-0 h-2 ${shade} transition-[width] duration-75`} style={{ width: `${pct}%` }} />
      {/* Thumb */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 border-2 border-black bg-white shadow-sm transition-[left] duration-75"
        style={{ left: `${pct}%` }}
      />
    </div>
  );
}

// ── Page ──

export default function EquitySplitPage() {
  const [founders, setFounders] = useState<Founder[]>(DEFAULT);
  const [optionPool, setOptionPool] = useState(10);
  const [loaded, setLoaded] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.founders) setFounders(parsed.founders);
        if (parsed.optionPool !== undefined) setOptionPool(parsed.optionPool);
      } catch { /* ignore */ }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify({ founders, optionPool }));
  }, [founders, optionPool, loaded]);

  const totalPct = founders.reduce((s, f) => s + f.pct, 0);
  const founderPool = 100 - optionPool;

  function addFounder() {
    setFounders((prev) => [...prev, { id: uid(), name: `Founder ${prev.length + 1}`, pct: 0 }]);
  }

  function removeFounder(id: string) {
    setFounders((prev) => prev.filter((f) => f.id !== id));
  }

  function updatePct(id: string, pct: number) {
    setFounders((prev) => prev.map((f) => f.id === id ? { ...f, pct } : f));
  }

  function updateName(id: string, name: string) {
    setFounders((prev) => prev.map((f) => f.id === id ? { ...f, name } : f));
  }

  function splitEqual() {
    const each = Math.round(founderPool / founders.length);
    setFounders((prev) => prev.map((f, i) =>
      ({ ...f, pct: i === 0 ? founderPool - each * (prev.length - 1) : each })
    ));
  }

  if (!loaded) return null;

  return (
    <div className="mx-auto max-w-[560px]">
      <h1 className="font-heading text-[clamp(1.5rem,3vw,1.75rem)] italic font-light tracking-[-0.01em] text-black">
        Equity Split
      </h1>
      <p className="mt-2 text-[14px] leading-[1.6] text-black/40 mb-8">
        Drag the sliders to model founder equity.
      </p>

      {/* Live stacked bar — the main visual */}
      <div className="border border-black/[0.08] bg-white p-4 mb-4">
        <div className="flex h-10 overflow-hidden mb-3">
          {founders.map((f, i) => {
            const effectivePct = founderPool > 0 ? (f.pct / (totalPct || 1)) * founderPool : 0;
            return (
              <div
                key={f.id}
                className={`${SHADES[i % SHADES.length]} transition-all duration-75 flex items-center justify-center overflow-hidden`}
                style={{ width: `${effectivePct}%` }}
              >
                {effectivePct > 8 && (
                  <span className="text-[11px] font-mono font-semibold text-white truncate px-1">
                    {effectivePct.toFixed(1)}%
                  </span>
                )}
              </div>
            );
          })}
          <div
            className="bg-black/[0.06] transition-all duration-75 flex items-center justify-center overflow-hidden"
            style={{ width: `${optionPool}%` }}
          >
            {optionPool > 6 && (
              <span className="text-[11px] font-mono text-black/40 truncate px-1">
                {optionPool}%
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {founders.map((f, i) => (
            <div key={f.id} className="flex items-center gap-1.5">
              <div className={`h-2 w-2 ${SHADES[i % SHADES.length]}`} />
              <span className="text-[11px] text-black/50">{f.name || "Unnamed"}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 bg-black/[0.06]" />
            <span className="text-[11px] text-black/50">ESOP</span>
          </div>
        </div>
      </div>

      {/* Option pool slider */}
      <div className="border border-black/[0.08] bg-white p-4 mb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[13px] font-semibold text-black">Option Pool (ESOP)</p>
          <span className="text-[18px] font-mono font-bold text-black">{optionPool}%</span>
        </div>
        <p className="text-[11px] text-black/40 mb-3">Reserved for future employees. Standard is 10-15%.</p>
        <Slider
          value={optionPool}
          max={50}
          onChange={setOptionPool}
          shade="bg-black/20"
        />
      </div>

      {/* Founders */}
      <div className="border border-black/[0.08] bg-white p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13px] font-semibold text-black">Founders</p>
          <div className="flex gap-2">
            <button onClick={splitEqual} className="text-[11px] px-2.5 py-1.5 border border-black/[0.08] text-black/50 hover:bg-black/[0.02]">
              Split equal
            </button>
            <button onClick={addFounder} className="text-[11px] px-2.5 py-1.5 bg-black text-white hover:bg-black/80">
              Add
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {founders.map((f, i) => {
            const effectivePct = founderPool > 0 ? (f.pct / (totalPct || 1)) * founderPool : 0;
            return (
              <div key={f.id}>
                {/* Name + percentage + remove */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`h-3 w-3 shrink-0 ${SHADES[i % SHADES.length]}`} />
                    {editingName === f.id ? (
                      <input
                        autoFocus
                        type="text"
                        value={f.name}
                        onChange={(e) => updateName(f.id, e.target.value)}
                        onBlur={() => setEditingName(null)}
                        onKeyDown={(e) => { if (e.key === "Enter") setEditingName(null); }}
                        className="text-[14px] font-medium text-black border-b border-black/20 focus:outline-none focus:border-black bg-transparent px-0 py-0 min-w-0 flex-1"
                      />
                    ) : (
                      <button
                        onClick={() => setEditingName(f.id)}
                        className="text-[14px] font-medium text-black text-left truncate hover:underline decoration-black/20 underline-offset-2"
                      >
                        {f.name || "Unnamed"}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="text-[18px] font-mono font-bold text-black tabular-nums">
                      {effectivePct.toFixed(1)}%
                    </span>
                    {founders.length > 1 && (
                      <button onClick={() => removeFounder(f.id)}
                        className="text-black/15 hover:text-black/60 transition-colors p-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Draggable slider */}
                <Slider
                  value={f.pct}
                  max={100}
                  onChange={(v) => updatePct(f.id, v)}
                  shade={SHADES[i % SHADES.length]}
                />
              </div>
            );
          })}
        </div>

        {totalPct !== 100 && totalPct > 0 && (
          <p className="mt-4 text-[11px] text-black/40 font-mono">
            Founder split: {totalPct}% {totalPct > 100 ? "(over-allocated)" : `(${100 - totalPct}% unallocated)`}
          </p>
        )}
      </div>

      {/* Summary */}
      <div className="border border-black/[0.08] bg-black/[0.02] p-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-black/40 mb-3">Ownership Summary</p>
        <div className="space-y-2">
          {founders.map((f) => {
            const effectivePct = founderPool > 0 ? (f.pct / (totalPct || 1)) * founderPool : 0;
            return (
              <div key={f.id} className="flex items-center justify-between">
                <span className="text-[13px] text-black">{f.name || "Unnamed"}</span>
                <span className="text-[14px] font-mono font-semibold text-black">{effectivePct.toFixed(2)}%</span>
              </div>
            );
          })}
          <div className="border-t border-black/[0.08] pt-2 flex items-center justify-between">
            <span className="text-[13px] text-black/50">Option Pool (ESOP)</span>
            <span className="text-[14px] font-mono font-semibold text-black/50">{optionPool.toFixed(2)}%</span>
          </div>
          <div className="border-t border-black/[0.08] pt-2 flex items-center justify-between">
            <span className="text-[13px] font-medium text-black">Total</span>
            <span className="text-[14px] font-mono font-bold text-black">100.00%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
