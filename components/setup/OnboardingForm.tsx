"use client";

import * as React from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

interface OnboardingFormData {
  businessName: string;
  state: string;
  description: string;
}

interface OnboardingFormProps {
  onSubmit: (data: OnboardingFormData) => void;
  loading?: boolean;
}

function OnboardingForm({ onSubmit, loading = false }: OnboardingFormProps) {
  const [businessName, setBusinessName] = React.useState("");
  const [state, setState] = React.useState("");
  const [description, setDescription] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ businessName, state, description });
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">
        Tell us about your business
      </h2>

      <Input
        label="Business name"
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
        placeholder="Acme Co."
        required
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--foreground)]">
          State
        </label>
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          required
          className="h-9 w-full rounded-md border border-[var(--border)] bg-transparent px-3 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          <option value="">Select state...</option>
          {US_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--foreground)]">
          What do you do?
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="I run a freelance design studio specializing in brand identity..."
          required
          rows={3}
          className="w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        />
      </div>

      <Button type="submit" loading={loading} className="mt-2">
        {loading ? "Setting up your team..." : "Launch My Team"}
      </Button>
    </form>
  );
}

export { OnboardingForm };
export type { OnboardingFormData };
