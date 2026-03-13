"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export type InfraMode = "cloud" | "byok";

interface InfraModePickerProps {
  selected?: InfraMode;
  onSelect: (mode: InfraMode) => void;
}

const modes = [
  {
    id: "cloud" as InfraMode,
    name: "Use 1P OS Cloud",
    headline: "One click. Zero config.",
    description:
      "We route every AI call through our smart router — automatically picking the best model for each task. You pay one bill, we handle the rest.",
    features: [
      "100+ models from every provider",
      "Smart routing picks the best model per task",
      "One API key, one bill",
      "No rate limits to manage",
      "Automatic failover between providers",
    ],
    badge: "Recommended",
    pricing: "Pay-as-you-go, ~40% cheaper than direct",
  },
  {
    id: "byok" as InfraMode,
    name: "Bring Your Own Keys",
    headline: "Full control. Your accounts.",
    description:
      "Plug in your own API keys from any provider. You manage billing directly with each provider.",
    features: [
      "Use your existing API accounts",
      "Direct provider billing",
      "Add any provider you want",
      "Full control over model selection",
      "Self-hosted / air-gapped friendly",
    ],
    badge: null,
    pricing: "You pay each provider directly",
  },
];

function InfraModePicker({ selected, onSelect }: InfraModePickerProps) {
  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-zinc-900">
        How do you want to run AI?
      </h2>
      <p className="mb-6 text-sm text-zinc-500">
        Use our cloud to get started instantly, or bring your own API keys.
        You can switch anytime.
      </p>

      <div className="flex flex-col gap-3">
        {modes.map((mode) => (
          <Card
            key={mode.id}
            className={`cursor-pointer transition-all ${
              selected === mode.id
                ? "border-zinc-900 ring-1 ring-zinc-300"
                : ""
            }`}
            onClick={() => onSelect(mode.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-zinc-900">
                      {mode.name}
                    </h3>
                    {mode.badge && (
                      <Badge variant="default">{mode.badge}</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-zinc-700">
                    {mode.headline}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {mode.description}
                  </p>
                </div>
                {/* Radio dot */}
                <div className="ml-4 mt-1 shrink-0">
                  <div
                    className={`h-4 w-4 rounded-full border-2 ${
                      selected === mode.id
                        ? "border-zinc-900 bg-zinc-900"
                        : "border-zinc-200"
                    }`}
                  >
                    {selected === mode.id && (
                      <div className="flex h-full items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Features */}
              <ul className="mt-3 flex flex-col gap-1">
                {mode.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-zinc-600">
                    <svg
                      className="h-3 w-3 shrink-0 text-zinc-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-3 border-t border-zinc-100 pt-2">
                <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                  {mode.pricing}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export { InfraModePicker };
