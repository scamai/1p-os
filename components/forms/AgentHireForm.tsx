"use client";

import * as React from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface AgentHireFormProps {
  onClose: () => void;
  prefill?: Record<string, any>;
}

function AgentHireForm({ onClose, prefill }: AgentHireFormProps) {
  const [role, setRole] = React.useState(prefill?.role ?? "");
  const [description, setDescription] = React.useState(prefill?.description ?? "");
  const [suggestion, setSuggestion] = React.useState<string | null>(null);
  const [suggestionLoading, setSuggestionLoading] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (!description || description.length < 10) {
      setSuggestion(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSuggestionLoading(true);
      try {
        const res = await fetch("/api/ai/prefill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            form_type: "agent_hire",
            context: { role, description },
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        setSuggestion(data.suggestion ?? null);
      } catch {
        // Best-effort
      } finally {
        setSuggestionLoading(false);
      }
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [description, role]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/agents/hire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, description }),
      });
      if (!res.ok) throw new Error("Failed to hire agent");
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
        label="Agent Type / Role"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        placeholder="e.g. Marketing, Finance, Support"
        required
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-600">
          Description of what you need
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the tasks and responsibilities for this agent..."
          rows={4}
          required
          className="w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
        />
      </div>

      {suggestionLoading && (
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
          <span className="text-xs text-zinc-500">
            Finding matching agents...
          </span>
        </div>
      )}

      {suggestion && !suggestionLoading && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
          <p className="text-xs font-medium text-zinc-500">AI Suggestion</p>
          <p className="mt-1 text-sm text-zinc-600">{suggestion}</p>
        </div>
      )}

      {error && (
        <p className="text-sm text-zinc-500">{error}</p>
      )}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Hire Agent
        </Button>
      </div>
    </form>
  );
}

export { AgentHireForm };
