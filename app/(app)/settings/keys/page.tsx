"use client";

import * as React from "react";
import { ApiKeySetup } from "@/components/setup/ApiKeySetup";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";

export default function ApiKeysPage() {
  const [infraMode, setInfraMode] = React.useState<"cloud" | "byok">("cloud");
  const [keys, setKeys] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/context");
        if (res.ok) {
          const data = await res.json();
          setInfraMode(data.infraMode ?? "cloud");
          // Keys come back masked — only set if we have them
          if (data.apiKeys) setKeys(data.apiKeys);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/context", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ infraMode, apiKeys: keys }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  const switchToCloud = async () => {
    setInfraMode("cloud");
    setSaving(true);
    try {
      await fetch("/api/context", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ infraMode: "cloud" }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const switchToBYOK = () => {
    setInfraMode("byok");
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-slate-100" />
          <div className="h-32 rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-lg font-semibold text-slate-900">
        AI Infrastructure
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        Choose how your agents access AI models.
      </p>

      {/* Current mode indicator */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Current mode</p>
              <p className="text-sm font-semibold text-slate-900">
                {infraMode === "cloud" ? "1P OS Cloud (Smart Router)" : "Bring Your Own Keys"}
              </p>
            </div>
            <Badge variant={infraMode === "cloud" ? "success" : "default"}>
              {infraMode === "cloud" ? "Managed" : "Self-managed"}
            </Badge>
          </div>

          {infraMode === "cloud" ? (
            <div className="mt-3 rounded-md bg-slate-50 p-3">
              <p className="text-xs text-slate-600">
                All AI calls route through 1P OS. We pick the best model for each task automatically.
                No API keys needed.
              </p>
              <button
                type="button"
                onClick={switchToBYOK}
                className="mt-2 text-xs font-medium text-slate-900 underline underline-offset-2 hover:text-slate-600 transition-colors"
              >
                Switch to Bring Your Own Keys
              </button>
            </div>
          ) : (
            <div className="mt-3 rounded-md bg-slate-50 p-3">
              <p className="text-xs text-slate-600">
                You manage your own API keys and billing with each provider.
              </p>
              <button
                type="button"
                onClick={switchToCloud}
                className="mt-2 text-xs font-medium text-slate-900 underline underline-offset-2 hover:text-slate-600 transition-colors"
              >
                Switch to 1P OS Cloud (no keys needed)
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BYOK key management */}
      {infraMode === "byok" && (
        <>
          <ApiKeySetup keys={keys} onChange={setKeys} />
          <div className="mt-6 flex items-center gap-3">
            <Button onClick={handleSave} loading={saving}>
              Save Keys
            </Button>
            {saved && (
              <span className="text-sm text-slate-700">Saved!</span>
            )}
          </div>
          <p className="mt-2 text-[10px] text-slate-500">
            Keys are encrypted with AES-256-GCM before storage. We never log or expose raw keys.
          </p>
        </>
      )}
    </div>
  );
}
