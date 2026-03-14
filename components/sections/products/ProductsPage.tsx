"use client";

import * as React from "react";

// ── Types ──

interface CodeInstance {
  id: string;
  name: string;
  status: "running" | "stopped" | "deploying" | "error";
  model: string;
  task: string;
  uptime: string;
  tokensToday: number;
  costToday: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  repo?: string;
  status: "active" | "paused" | "archived";
  instances: CodeInstance[];
  createdAt: string;
}

// ── Mock Data ──

const MODELS = [
  { id: "claude-opus-4", name: "Claude Opus 4", cost: "$15/MTok" },
  { id: "claude-sonnet-4", name: "Claude Sonnet 4", cost: "$3/MTok" },
  { id: "claude-haiku-3.5", name: "Claude Haiku 3.5", cost: "$0.80/MTok" },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "1P OS",
    description: "AI-native operating system for solo founders",
    repo: "github.com/you/1pos",
    status: "active",
    createdAt: "Mar 1",
    instances: [
      {
        id: "cc-1",
        name: "Frontend",
        status: "running",
        model: "claude-sonnet-4",
        task: "Building sales page components",
        uptime: "2h 14m",
        tokensToday: 48200,
        costToday: 0.24,
      },
      {
        id: "cc-2",
        name: "Backend API",
        status: "running",
        model: "claude-sonnet-4",
        task: "Implementing voice transcription endpoint",
        uptime: "1h 02m",
        tokensToday: 31500,
        costToday: 0.16,
      },
      {
        id: "cc-3",
        name: "Testing",
        status: "stopped",
        model: "claude-haiku-3.5",
        task: "Idle",
        uptime: "—",
        tokensToday: 0,
        costToday: 0,
      },
    ],
  },
  {
    id: "2",
    name: "Landing Page",
    description: "Marketing site for product launch",
    repo: "github.com/you/landing",
    status: "active",
    createdAt: "Mar 10",
    instances: [
      {
        id: "cc-4",
        name: "Design to Code",
        status: "running",
        model: "claude-opus-4",
        task: "Converting Figma designs to React",
        uptime: "45m",
        tokensToday: 22100,
        costToday: 0.33,
      },
    ],
  },
];

// ── Status Dot ──

function StatusDot({ status }: { status: CodeInstance["status"] }) {
  const colors = {
    running: "bg-emerald-400",
    stopped: "bg-zinc-300",
    deploying: "bg-amber-400 animate-pulse",
    error: "bg-red-400",
  };
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${colors[status]}`} />;
}

// ── Instance Card (like a DigitalOcean droplet) ──

function InstanceCard({
  instance,
  onToggle,
  onModelChange,
  onRemove,
}: {
  instance: CodeInstance;
  onToggle: () => void;
  onModelChange: (model: string) => void;
  onRemove: () => void;
}) {
  const isRunning = instance.status === "running" || instance.status === "deploying";

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <StatusDot status={instance.status} />
          <span className="text-[13px] font-medium text-zinc-900">{instance.name}</span>
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
            {MODELS.find((m) => m.id === instance.model)?.name ?? instance.model}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Toggle on/off */}
          <button
            onClick={onToggle}
            className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
              isRunning
                ? "bg-zinc-900 text-white hover:bg-zinc-700"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {isRunning ? "Stop" : "Start"}
          </button>
          {/* Remove */}
          <button
            onClick={onRemove}
            className="rounded p-1 text-zinc-300 transition-colors hover:text-zinc-500"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        {/* Task */}
        <p className="text-[12px] text-zinc-500">{instance.task}</p>

        {/* Stats row */}
        <div className="mt-3 flex items-center gap-6">
          <div>
            <p className="text-[10px] text-zinc-400">Uptime</p>
            <p className="font-mono text-[12px] text-zinc-700">{instance.uptime}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-400">Tokens today</p>
            <p className="font-mono text-[12px] text-zinc-700">
              {instance.tokensToday > 0 ? `${(instance.tokensToday / 1000).toFixed(1)}k` : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-400">Cost today</p>
            <p className="font-mono text-[12px] text-zinc-700">
              {instance.costToday > 0 ? `$${instance.costToday.toFixed(2)}` : "—"}
            </p>
          </div>
          <div className="ml-auto">
            <p className="text-[10px] text-zinc-400">Model</p>
            <select
              value={instance.model}
              onChange={(e) => onModelChange(e.target.value)}
              className="mt-0.5 rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[11px] text-zinc-700 focus:outline-none"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.cost}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Product Card ──

function ProductCard({
  product,
  onUpdate,
}: {
  product: Product;
  onUpdate: (updated: Product) => void;
}) {
  const [expanded, setExpanded] = React.useState(true);

  const totalCost = product.instances.reduce((s, i) => s + i.costToday, 0);
  const runningCount = product.instances.filter((i) => i.status === "running").length;

  function toggleInstance(instanceId: string) {
    const updated = {
      ...product,
      instances: product.instances.map((inst) =>
        inst.id === instanceId
          ? {
              ...inst,
              status: (inst.status === "running" ? "stopped" : "deploying") as CodeInstance["status"],
              uptime: inst.status === "running" ? "—" : "0m",
              task: inst.status === "running" ? "Idle" : "Starting...",
            }
          : inst
      ),
    };
    onUpdate(updated);

    // Simulate deploy → running after 1.5s
    if (updated.instances.find((i) => i.id === instanceId)?.status === "deploying") {
      setTimeout(() => {
        onUpdate({
          ...updated,
          instances: updated.instances.map((inst) =>
            inst.id === instanceId
              ? { ...inst, status: "running", task: "Ready — awaiting instructions" }
              : inst
          ),
        });
      }, 1500);
    }
  }

  function changeModel(instanceId: string, model: string) {
    onUpdate({
      ...product,
      instances: product.instances.map((inst) =>
        inst.id === instanceId ? { ...inst, model } : inst
      ),
    });
  }

  function removeInstance(instanceId: string) {
    onUpdate({
      ...product,
      instances: product.instances.filter((i) => i.id !== instanceId),
    });
  }

  function addInstance() {
    const newId = `cc-${Date.now()}`;
    onUpdate({
      ...product,
      instances: [
        ...product.instances,
        {
          id: newId,
          name: `Instance ${product.instances.length + 1}`,
          status: "stopped",
          model: "claude-sonnet-4",
          task: "Idle",
          uptime: "—",
          tokensToday: 0,
          costToday: 0,
        },
      ],
    });
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/50">
      {/* Product Header */}
      <div
        className="flex cursor-pointer items-center justify-between px-5 py-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-[11px] font-bold text-white">
            {product.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-semibold text-zinc-900">{product.name}</h2>
              <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
                {product.status}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">{product.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="font-mono text-[12px] text-zinc-700">
              {runningCount}/{product.instances.length} running
            </p>
            <p className="font-mono text-[10px] text-zinc-400">
              ${totalCost.toFixed(2)} today
            </p>
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`text-zinc-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* Instances */}
      {expanded && (
        <div className="border-t border-zinc-200 px-5 py-4">
          <div className="flex flex-col gap-3">
            {product.instances.map((inst) => (
              <InstanceCard
                key={inst.id}
                instance={inst}
                onToggle={() => toggleInstance(inst.id)}
                onModelChange={(model) => changeModel(inst.id, model)}
                onRemove={() => removeInstance(inst.id)}
              />
            ))}
          </div>

          {/* Add Instance Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              addInstance();
            }}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 py-2.5 text-[12px] text-zinc-400 transition-colors hover:border-zinc-400 hover:text-zinc-600"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Claude Code Instance
          </button>
        </div>
      )}
    </div>
  );
}

// ── New Product Dialog ──

function NewProductDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string, repo: string) => void;
}) {
  const [name, setName] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [repo, setRepo] = React.useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
        <h3 className="text-[15px] font-semibold text-zinc-900">New Product</h3>
        <div className="mt-4 flex flex-col gap-3">
          <div>
            <label className="text-[11px] text-zinc-500">Product Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My SaaS App"
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-[13px] text-zinc-900 placeholder:text-zinc-300 focus:border-zinc-400 focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="text-[11px] text-zinc-500">Description</label>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="What are you building?"
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-[13px] text-zinc-900 placeholder:text-zinc-300 focus:border-zinc-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] text-zinc-500">Repository (optional)</label>
            <input
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="github.com/you/repo"
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-[13px] text-zinc-900 placeholder:text-zinc-300 focus:border-zinc-400 focus:outline-none"
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-[12px] text-zinc-500 hover:text-zinc-700"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (name.trim()) {
                onCreate(name.trim(), desc.trim(), repo.trim());
                setName("");
                setDesc("");
                setRepo("");
                onClose();
              }
            }}
            disabled={!name.trim()}
            className="rounded-lg bg-zinc-900 px-4 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-30"
          >
            Create Product
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──

function ProductsPage() {
  const [products, setProducts] = React.useState<Product[]>(INITIAL_PRODUCTS);
  const [showNew, setShowNew] = React.useState(false);

  const totalInstances = products.reduce((s, p) => s + p.instances.length, 0);
  const runningInstances = products.reduce(
    (s, p) => s + p.instances.filter((i) => i.status === "running").length,
    0
  );
  const totalCost = products.reduce(
    (s, p) => s + p.instances.reduce((si, i) => si + i.costToday, 0),
    0
  );

  function updateProduct(updated: Product) {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  function createProduct(name: string, description: string, repo: string) {
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name,
      description,
      repo: repo || undefined,
      status: "active",
      createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      instances: [],
    };
    setProducts((prev) => [newProduct, ...prev]);
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">Products</h1>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-zinc-700"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Product
        </button>
      </div>

      {/* Overview Stats */}
      <div className="mt-6 grid grid-cols-3 gap-6">
        <div>
          <p className="text-[11px] text-zinc-500">Products</p>
          <p className="mt-1 font-mono text-xl font-semibold text-zinc-900">{products.length}</p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-500">Instances</p>
          <p className="mt-1 font-mono text-xl font-semibold text-zinc-900">
            {runningInstances}
            <span className="text-sm text-zinc-400">/{totalInstances}</span>
          </p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-500">Cost Today</p>
          <p className="mt-1 font-mono text-xl font-semibold text-zinc-900">
            ${totalCost.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Product Cards */}
      <div className="mt-8 flex flex-col gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onUpdate={updateProduct} />
        ))}

        {products.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-[13px] text-zinc-400">No products yet</p>
            <button
              onClick={() => setShowNew(true)}
              className="mt-2 text-[13px] text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
            >
              Create your first product
            </button>
          </div>
        )}
      </div>

      <NewProductDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreate={createProduct}
      />
    </div>
  );
}

export { ProductsPage };
