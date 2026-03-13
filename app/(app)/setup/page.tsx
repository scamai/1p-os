"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { TemplatePicker } from "@/components/setup/TemplatePicker";
import { OnboardingForm, type OnboardingFormData } from "@/components/setup/OnboardingForm";
import { ModelStrategyPicker } from "@/components/setup/ModelStrategyPicker";
import { Button } from "@/components/ui/Button";

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [template, setTemplate] = React.useState<string>("");
  const [formData, setFormData] = React.useState<OnboardingFormData | null>(null);
  const [strategy, setStrategy] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);

  const handleFormSubmit = (data: OnboardingFormData) => {
    setFormData(data);
    setStep(3);
  };

  const handleFinish = async () => {
    if (!template || !formData || !strategy) return;

    setLoading(true);
    try {
      await fetch("/api/ai/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template,
          ...formData,
          modelStrategy: strategy,
        }),
      });
      router.push("/company");
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-8 flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${
              s <= step
                ? "bg-[var(--foreground)]"
                : "bg-[var(--muted)]"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <div>
          <TemplatePicker selected={template} onSelect={setTemplate} />
          <div className="mt-6">
            <Button
              onClick={() => setStep(2)}
              disabled={!template}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <OnboardingForm onSubmit={handleFormSubmit} />
      )}

      {step === 3 && (
        <div>
          <ModelStrategyPicker selected={strategy} onSelect={setStrategy} />
          <div className="mt-6">
            <Button
              onClick={handleFinish}
              disabled={!strategy}
              loading={loading}
            >
              {loading ? "Setting up your team..." : "Launch My Team"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
