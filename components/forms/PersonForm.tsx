"use client";

import * as React from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface ContactFormProps {
  onClose: () => void;
  prefill?: Record<string, any>;
}

function ContactForm({ onClose, prefill }: ContactFormProps) {
  const [name, setName] = React.useState(prefill?.name ?? "");
  const [email, setEmail] = React.useState(prefill?.email ?? "");
  const [type, setType] = React.useState(prefill?.type ?? "client");
  const [company, setCompany] = React.useState(prefill?.company ?? "");
  const [notes, setNotes] = React.useState(prefill?.notes ?? "");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchPrefill() {
      try {
        const res = await fetch("/api/ai/prefill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ form_type: "contact" }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.name && !name) setName(data.name);
        if (data.email && !email) setEmail(data.email);
        if (data.type) setType(data.type);
        if (data.company && !company) setCompany(data.company);
        if (data.notes && !notes) setNotes(data.notes);
      } catch {
        // Prefill is best-effort
      }
    }

    fetchPrefill();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, type, company, notes }),
      });
      if (!res.ok) throw new Error("Failed to create contact");
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
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Full name"
        required
      />
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@example.com"
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-600">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
        >
          <option value="client">Client</option>
          <option value="lead">Lead</option>
          <option value="contractor">Contractor</option>
        </select>
      </div>
      <Input
        label="Company"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        placeholder="Company name"
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-600">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes"
          rows={3}
          className="w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
        />
      </div>
      {error && (
        <p className="text-sm text-zinc-500">{error}</p>
      )}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Add Contact
        </Button>
      </div>
    </form>
  );
}

export { ContactForm };
/** @deprecated Use ContactForm instead */
export const PersonForm = ContactForm;
