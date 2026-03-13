"use client";

import * as React from "react";
import { ModelStrategyPicker } from "@/components/setup/ModelStrategyPicker";
import { Button } from "@/components/ui/Button";

export default function ModelsPage() {
  const [selected, setSelected] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await fetch("/api/efficiency/routing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy: selected }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
        Model Routing
      </h1>
      <p className="mb-6 text-sm text-[var(--muted-foreground)]">
        Choose how your agents select AI models for their tasks.
      </p>

      <ModelStrategyPicker selected={selected} onSelect={setSelected} />

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={handleSave} disabled={!selected} loading={saving}>
          Save Strategy
        </Button>
        {saved && (
          <span className="text-sm text-[var(--success)]">Saved!</span>
        )}
      </div>
    </div>
  );
}
