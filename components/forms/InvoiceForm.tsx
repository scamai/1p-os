"use client";

import * as React from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface InvoiceFormProps {
  onClose: () => void;
  prefill?: Record<string, any>;
}

function InvoiceForm({ onClose, prefill }: InvoiceFormProps) {
  const [client, setClient] = React.useState(prefill?.client ?? "");
  const [amount, setAmount] = React.useState(prefill?.amount ?? "");
  const [description, setDescription] = React.useState(prefill?.description ?? "");
  const [dueDate, setDueDate] = React.useState(prefill?.due_date ?? "");
  const [status, setStatus] = React.useState(prefill?.status ?? "draft");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchPrefill() {
      try {
        const res = await fetch("/api/ai/prefill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ form_type: "invoice" }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.client && !client) setClient(data.client);
        if (data.amount && !amount) setAmount(data.amount);
        if (data.description && !description) setDescription(data.description);
        if (data.due_date && !dueDate) setDueDate(data.due_date);
        if (data.status) setStatus(data.status);
      } catch {
        // Prefill is best-effort
      }
    }

    fetchPrefill();
    return () => {
      cancelled = true;
    };
    // Run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client,
          amount: parseFloat(amount),
          description,
          due_date: dueDate,
          status,
        }),
      });
      if (!res.ok) throw new Error("Failed to create invoice");
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Client"
        value={client}
        onChange={(e) => setClient(e.target.value)}
        placeholder="Client name"
        required
      />
      <Input
        label="Amount"
        type="number"
        step="0.01"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
        required
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-black/60">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Invoice description"
          rows={3}
          className="w-full rounded-md border border-black/[0.08] bg-transparent px-3 py-2 text-sm text-black placeholder:text-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
        />
      </div>
      <Input
        label="Due Date"
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        required
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-black/60">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 w-full rounded-md border border-black/[0.08] bg-transparent px-3 text-sm text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
        >
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
        </select>
      </div>
      {error && (
        <p className="text-sm text-black/50">{error}</p>
      )}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Create Invoice
        </Button>
      </div>
    </form>
  );
}

export { InvoiceForm };
