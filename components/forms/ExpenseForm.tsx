"use client";

import * as React from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface ExpenseFormProps {
  onClose: () => void;
  prefill?: Record<string, any>;
}

function ExpenseForm({ onClose, prefill }: ExpenseFormProps) {
  const [amount, setAmount] = React.useState(prefill?.amount ?? "");
  const [category, setCategory] = React.useState(prefill?.category ?? "");
  const [description, setDescription] = React.useState(prefill?.description ?? "");
  const [date, setDate] = React.useState(prefill?.date ?? "");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          category,
          description,
          date,
        }),
      });
      if (!res.ok) throw new Error("Failed to create expense");
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
        <label className="text-sm font-medium text-zinc-600">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          className="h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
        >
          <option value="">Select category</option>
          <option value="software">Software</option>
          <option value="hosting">Hosting</option>
          <option value="marketing">Marketing</option>
          <option value="office">Office</option>
          <option value="travel">Travel</option>
          <option value="meals">Meals</option>
          <option value="contractors">Contractors</option>
          <option value="other">Other</option>
        </select>
      </div>
      <Input
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What was this expense for?"
      />
      <Input
        label="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
      {error && (
        <p className="text-sm text-zinc-500">{error}</p>
      )}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Add Expense
        </Button>
      </div>
    </form>
  );
}

export { ExpenseForm };
