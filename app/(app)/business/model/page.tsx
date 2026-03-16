"use client";

import { useState, useEffect } from "react";
import { Education, EDUCATION } from "@/components/shared/Education";

type Block = {
  id: string;
  title: string;
  hint: string;
  items: string[];
};

const DEFAULT_BLOCKS: Block[] = [
  { id: "key-partners", title: "Key Partners", hint: "Who are your key suppliers and partners? What resources do they provide?", items: [] },
  { id: "key-activities", title: "Key Activities", hint: "What must your business do to deliver its value proposition?", items: [] },
  { id: "key-resources", title: "Key Resources", hint: "What assets are essential? (tech, people, IP, capital)", items: [] },
  { id: "value-props", title: "Value Propositions", hint: "What problem do you solve? Why do customers choose you over alternatives?", items: [] },
  { id: "customer-relationships", title: "Customer Relationships", hint: "How do you acquire, retain, and grow customers?", items: [] },
  { id: "channels", title: "Channels", hint: "How do you reach and deliver value to customers?", items: [] },
  { id: "customer-segments", title: "Customer Segments", hint: "Who are your most important customers? Be specific.", items: [] },
  { id: "cost-structure", title: "Cost Structure", hint: "What are your biggest costs? Fixed vs variable?", items: [] },
  { id: "revenue-streams", title: "Revenue Streams", hint: "How does money come in? Subscription, one-time, usage-based?", items: [] },
];

const STORAGE_KEY = "1pos-business-model-canvas";

// BMC layout: standard Osterwalder grid positions
const GRID_LAYOUT: { id: string; col: string; row: string }[] = [
  { id: "key-partners", col: "col-span-1", row: "row-span-2" },
  { id: "key-activities", col: "col-span-1", row: "row-span-1" },
  { id: "value-props", col: "col-span-1", row: "row-span-2" },
  { id: "customer-relationships", col: "col-span-1", row: "row-span-1" },
  { id: "customer-segments", col: "col-span-1", row: "row-span-2" },
  { id: "key-resources", col: "col-span-1", row: "row-span-1" },
  { id: "channels", col: "col-span-1", row: "row-span-1" },
];

function CanvasBlock({
  block,
  onUpdate,
  tall,
}: {
  block: Block;
  onUpdate: (b: Block) => void;
  tall?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);

  function addItem() {
    const text = draft.trim();
    if (!text) return;
    onUpdate({ ...block, items: [...block.items, text] });
    setDraft("");
  }

  return (
    <div className={`border border-zinc-200 p-3 bg-white flex flex-col ${tall ? "min-h-[200px]" : "min-h-[100px]"}`}>
      <h3 className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest mb-1">
        {block.title}
      </h3>
      {block.items.length === 0 && !focused && (
        <p className="text-[11px] text-zinc-300 italic mb-2">{block.hint}</p>
      )}
      <ul className="flex-1 space-y-1 mb-2">
        {block.items.map((item, idx) => (
          <li key={idx} className="text-[12px] text-zinc-700 flex items-start gap-1.5 group">
            <span className="text-zinc-300 mt-0.5 shrink-0">-</span>
            <span className="flex-1">{item}</span>
            <button
              onClick={() => onUpdate({ ...block, items: block.items.filter((_, i) => i !== idx) })}
              className="text-zinc-200 hover:text-zinc-500 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              x
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-1 mt-auto">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="+"
          className="flex-1 text-[12px] border border-zinc-100 px-2 py-1 text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:border-zinc-400 bg-zinc-50"
        />
      </div>
    </div>
  );
}

export default function Page() {
  const [blocks, setBlocks] = useState<Block[]>(DEFAULT_BLOCKS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setBlocks(JSON.parse(saved)); } catch { /* ignore */ }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
  }, [blocks, loaded]);

  function updateBlock(updated: Block) {
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }

  function getBlock(id: string) {
    return blocks.find((b) => b.id === id)!;
  }

  const totalItems = blocks.reduce((s, b) => s + b.items.length, 0);
  const filledBlocks = blocks.filter((b) => b.items.length > 0).length;

  if (!loaded) return null;

  return (
    <div className="mx-auto max-w-6xl">
      <Education {...EDUCATION.businessModel} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Business Model Canvas</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Map out the 9 building blocks of your business.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[11px] text-zinc-400">{filledBlocks}/9 blocks filled</span>
          <span className="text-[11px] text-zinc-400">{totalItems} items</span>
          <button
            onClick={() => { setBlocks(DEFAULT_BLOCKS); localStorage.removeItem(STORAGE_KEY); }}
            className="text-[11px] text-zinc-400 hover:text-zinc-600"
          >
            Reset
          </button>
        </div>
      </div>

      {/* BMC Grid — Osterwalder standard layout */}
      <div className="border border-zinc-900">
        {/* Top section: 5 columns */}
        <div className="grid grid-cols-10">
          {/* Key Partners — 2 rows */}
          <div className="col-span-2 border-r border-zinc-900">
            <CanvasBlock block={getBlock("key-partners")} onUpdate={updateBlock} tall />
          </div>

          {/* Key Activities + Key Resources — stacked */}
          <div className="col-span-2 border-r border-zinc-900">
            <div className="border-b border-zinc-900">
              <CanvasBlock block={getBlock("key-activities")} onUpdate={updateBlock} />
            </div>
            <CanvasBlock block={getBlock("key-resources")} onUpdate={updateBlock} />
          </div>

          {/* Value Propositions — 2 rows */}
          <div className="col-span-2 border-r border-zinc-900">
            <CanvasBlock block={getBlock("value-props")} onUpdate={updateBlock} tall />
          </div>

          {/* Customer Relationships + Channels — stacked */}
          <div className="col-span-2 border-r border-zinc-900">
            <div className="border-b border-zinc-900">
              <CanvasBlock block={getBlock("customer-relationships")} onUpdate={updateBlock} />
            </div>
            <CanvasBlock block={getBlock("channels")} onUpdate={updateBlock} />
          </div>

          {/* Customer Segments — 2 rows */}
          <div className="col-span-2">
            <CanvasBlock block={getBlock("customer-segments")} onUpdate={updateBlock} tall />
          </div>
        </div>

        {/* Bottom section: 2 columns */}
        <div className="grid grid-cols-2 border-t border-zinc-900">
          <div className="border-r border-zinc-900">
            <CanvasBlock block={getBlock("cost-structure")} onUpdate={updateBlock} />
          </div>
          <CanvasBlock block={getBlock("revenue-streams")} onUpdate={updateBlock} />
        </div>
      </div>
    </div>
  );
}
