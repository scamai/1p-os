"use client";

import { useState, useRef, useCallback } from "react";
import { Education, EDUCATION } from "@/components/shared/Education";
import { useSingletonData } from "@/lib/hooks/useSingletonData";

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
  const inputRef = useRef<HTMLInputElement>(null);

  function addItem() {
    const text = draft.trim();
    if (!text) return;
    onUpdate({ ...block, items: [...block.items, text] });
    setDraft("");
    // Re-focus input after React re-render
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div className={`border border-black/[0.08] p-3 bg-white flex flex-col ${tall ? "min-h-[200px]" : "min-h-[100px]"}`}>
      <h3 className="text-[10px] font-bold text-black uppercase tracking-widest mb-1">
        {block.title}
      </h3>
      {block.items.length === 0 && !focused && (
        <p className="text-[11px] text-black/30 italic mb-2">{block.hint}</p>
      )}
      <ul className="flex-1 space-y-1 mb-2">
        {block.items.map((item, idx) => (
          <li key={idx} className="text-[12px] text-black/70 flex items-start gap-1.5 group">
            <span className="text-black/30 mt-0.5 shrink-0">-</span>
            <span className="flex-1">{item}</span>
            <button
              onClick={() => onUpdate({ ...block, items: block.items.filter((_, i) => i !== idx) })}
              className="text-black/[0.08] hover:text-black/50 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              x
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-1 mt-auto">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="+"
          className="flex-1 text-[12px] border border-black/[0.04] px-2 py-1 text-black placeholder:text-black/30 focus:outline-none focus:border-black/40 bg-black/[0.02]"
        />
      </div>
    </div>
  );
}

export default function Page() {
  const { data, loading, update } = useSingletonData<{ blocks: Block[] }>(
    "business_canvas",
    { blocks: DEFAULT_BLOCKS }
  );

  const blocks = data.blocks ?? DEFAULT_BLOCKS;

  function updateBlock(updated: Block) {
    const newBlocks = blocks.map((b) => (b.id === updated.id ? updated : b));
    update({ blocks: newBlocks });
  }

  const getBlock = useCallback((id: string) => {
    return blocks.find((b) => b.id === id)!;
  }, [blocks]);

  const totalItems = blocks.reduce((s, b) => s + b.items.length, 0);
  const filledBlocks = blocks.filter((b) => b.items.length > 0).length;

  const exportPDF = useCallback(() => {
    // Build a print-optimized HTML document
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Business Model Canvas</title>
<style>
  @page { size: landscape; margin: 0.5in; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Instrument Sans', -apple-system, system-ui, sans-serif; color: #000; }
  h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 300; font-style: italic; font-size: 24px; margin-bottom: 16px; }
  .meta { font-size: 10px; color: rgba(0,0,0,0.4); margin-bottom: 20px; }
  .grid { display: grid; grid-template-columns: repeat(10, 1fr); border: 1px solid #000; }
  .cell { border-right: 1px solid #000; padding: 10px; min-height: 140px; }
  .cell:last-child { border-right: none; }
  .cell-title { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(0,0,0,0.5); margin-bottom: 6px; }
  .cell-item { font-size: 10px; color: rgba(0,0,0,0.7); margin-bottom: 3px; padding-left: 8px; text-indent: -8px; }
  .cell-item::before { content: "– "; color: rgba(0,0,0,0.3); }
  .span2 { grid-column: span 2; }
  .tall { grid-row: span 2; min-height: 280px; }
  .stacked { display: flex; flex-direction: column; }
  .stacked > div { flex: 1; padding: 10px; }
  .stacked > div:first-child { border-bottom: 1px solid #000; }
  .bottom { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid #000; }
  .bottom > div:first-child { border-right: 1px solid #000; }
  .bottom .cell { min-height: 100px; }
  .footer { margin-top: 16px; font-size: 9px; color: rgba(0,0,0,0.3); }
</style>
</head>
<body>
<h1>Business Model Canvas</h1>
<p class="meta">${filledBlocks}/9 blocks filled · ${totalItems} items · Exported ${new Date().toLocaleDateString()}</p>
<div class="grid">
  <div class="span2 cell tall">${renderBlockHTML("key-partners")}</div>
  <div class="span2 stacked cell">${renderStackedHTML("key-activities", "key-resources")}</div>
  <div class="span2 cell tall">${renderBlockHTML("value-props")}</div>
  <div class="span2 stacked cell">${renderStackedHTML("customer-relationships", "channels")}</div>
  <div class="span2 cell tall" style="border-right:none">${renderBlockHTML("customer-segments")}</div>
</div>
<div class="bottom" style="border:1px solid #000;border-top:none;">
  <div class="cell">${renderBlockHTML("cost-structure")}</div>
  <div class="cell">${renderBlockHTML("revenue-streams")}</div>
</div>
<p class="footer">1 Person Company · 1press.com</p>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    // Auto-trigger print dialog after a short delay
    setTimeout(() => win.print(), 300);

    function renderBlockHTML(id: string): string {
      const b = getBlock(id);
      return \`<div class="cell-title">\${b.title}</div>\${
        b.items.length > 0
          ? b.items.map((item) => \`<div class="cell-item">\${escapeHTML(item)}</div>\`).join("")
          : \`<div style="font-size:9px;color:rgba(0,0,0,0.2);font-style:italic">\${escapeHTML(b.hint)}</div>\`
      }\`;
    }

    function renderStackedHTML(topId: string, bottomId: string): string {
      return \`<div>\${renderBlockHTML(topId)}</div><div>\${renderBlockHTML(bottomId)}</div>\`;
    }

    function escapeHTML(str: string): string {
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
  }, [blocks, filledBlocks, totalItems, getBlock]);

  if (loading) return null;

  return (
    <div className="mx-auto max-w-6xl">
      <Education {...EDUCATION.businessModel} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-black">Business Model Canvas</h1>
          <p className="mt-1 text-sm text-black/50">
            Map out the 9 building blocks of your business.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[11px] text-black/40">{filledBlocks}/9 blocks filled</span>
          <span className="text-[11px] text-black/40">{totalItems} items</span>
          <button
            onClick={exportPDF}
            className="h-7 px-3 text-[11px] font-medium text-black border border-black/[0.08] hover:bg-black/[0.02] transition-colors"
          >
            Export PDF
          </button>
          <button
            onClick={() => update({ blocks: DEFAULT_BLOCKS })}
            className="text-[11px] text-black/40 hover:text-black/60"
          >
            Reset
          </button>
        </div>
      </div>

      {/* BMC Grid — Osterwalder standard layout */}
      <div className="border border-black">
        {/* Top section: 5 columns */}
        <div className="grid grid-cols-10">
          {/* Key Partners — 2 rows */}
          <div className="col-span-2 border-r border-black">
            <CanvasBlock block={getBlock("key-partners")} onUpdate={updateBlock} tall />
          </div>

          {/* Key Activities + Key Resources — stacked */}
          <div className="col-span-2 border-r border-black">
            <div className="border-b border-black">
              <CanvasBlock block={getBlock("key-activities")} onUpdate={updateBlock} />
            </div>
            <CanvasBlock block={getBlock("key-resources")} onUpdate={updateBlock} />
          </div>

          {/* Value Propositions — 2 rows */}
          <div className="col-span-2 border-r border-black">
            <CanvasBlock block={getBlock("value-props")} onUpdate={updateBlock} tall />
          </div>

          {/* Customer Relationships + Channels — stacked */}
          <div className="col-span-2 border-r border-black">
            <div className="border-b border-black">
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
        <div className="grid grid-cols-2 border-t border-black">
          <div className="border-r border-black">
            <CanvasBlock block={getBlock("cost-structure")} onUpdate={updateBlock} />
          </div>
          <CanvasBlock block={getBlock("revenue-streams")} onUpdate={updateBlock} />
        </div>
      </div>
    </div>
  );
}
