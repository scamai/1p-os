"use client";

import * as React from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface ProjectFormProps {
  onClose: () => void;
  prefill?: Record<string, any>;
}

function ProjectForm({ onClose, prefill }: ProjectFormProps) {
  const [name, setName] = React.useState(prefill?.name ?? "");
  const [client, setClient] = React.useState(prefill?.client ?? "");
  const [description, setDescription] = React.useState(prefill?.description ?? "");
  const [budget, setBudget] = React.useState(prefill?.budget ?? "");
  const [startDate, setStartDate] = React.useState(prefill?.start_date ?? "");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          client,
          description,
          budget: budget ? parseFloat(budget) : undefined,
          start_date: startDate,
        }),
      });
      if (!res.ok) throw new Error("Failed to create project");
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
        label="Project Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Project name"
        required
      />
      <Input
        label="Client"
        value={client}
        onChange={(e) => setClient(e.target.value)}
        placeholder="Client name"
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-zinc-600">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Project description"
          rows={3}
          className="w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
        />
      </div>
      <Input
        label="Budget"
        type="number"
        step="0.01"
        min="0"
        value={budget}
        onChange={(e) => setBudget(e.target.value)}
        placeholder="0.00"
      />
      <Input
        label="Start Date"
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />
      {error && (
        <p className="text-sm text-zinc-500">{error}</p>
      )}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Create Project
        </Button>
      </div>
    </form>
  );
}

export { ProjectForm };
