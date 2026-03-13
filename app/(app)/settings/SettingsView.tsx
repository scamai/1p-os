"use client";

import * as React from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Link from "next/link";

interface SettingsViewProps {
  businessName: string;
  email: string;
  timezone: string;
}

function SettingsView({
  businessName: initialName,
  email,
  timezone: initialTimezone,
}: SettingsViewProps) {
  const [name, setName] = React.useState(initialName);
  const [timezone, setTimezone] = React.useState(initialTimezone);
  const [saving, setSaving] = React.useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/context", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: name, timezone }),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
        Settings
      </h1>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <Input
                label="Business name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input label="Email" value={email} disabled />
              <Input
                label="Timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              />
              <Button onClick={handleSave} loading={saving}>
                Save
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>More Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Link
                href="/settings/safety"
                className="rounded-md px-3 py-2 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
              >
                Safety &amp; Budgets
              </Link>
              <Link
                href="/settings/models"
                className="rounded-md px-3 py-2 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
              >
                Model Routing
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { SettingsView };
