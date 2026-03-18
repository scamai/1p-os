"use client";

export type InfraMode = "cloud" | "byok";

interface InfraModePickerProps {
  selected?: InfraMode;
  onSelect: (mode: InfraMode) => void;
}

const modes = [
  {
    id: "cloud" as InfraMode,
    name: "1P OS Cloud",
    headline: "One click. Zero config.",
    description:
      "We route every AI call through our smart router -- automatically picking the best model for each task. You pay one bill, we handle the rest.",
    features: [
      "100+ models from every provider",
      "Smart routing picks the best model per task",
      "One API key, one bill",
      "No rate limits to manage",
      "Automatic failover between providers",
    ],
    recommended: true,
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
    recommended: false,
    pricing: "You pay each provider directly",
  },
];

function InfraModePicker({ selected, onSelect }: InfraModePickerProps) {
  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-black">
        How do you want to run AI?
      </h2>
      <p className="mb-6 text-sm text-black/50">
        Use our cloud to get started instantly, or bring your own API keys.
        You can switch anytime.
      </p>

      <div className="flex flex-col gap-3">
        {modes.map((mode) => {
          const isSelected = selected === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelect(mode.id)}
              className={`rounded-lg border px-4 py-4 text-left transition-all ${
                isSelected
                  ? "border-black bg-black/[0.02]"
                  : "border-black/[0.08] hover:border-black/30 hover:bg-black/[0.02]/50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-black">
                      {mode.name}
                    </span>
                    {mode.recommended && (
                      <span className="text-[10px] text-black/40">Recommended</span>
                    )}
                    {isSelected && (
                      <svg className="h-3.5 w-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-black/50">{mode.description}</p>
                </div>
              </div>

              <ul className="mt-3 flex flex-col gap-1">
                {mode.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-black/50">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-black/30" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-3 border-t border-black/[0.04] pt-2">
                <p className="text-[10px] text-black/40 uppercase tracking-wider">
                  {mode.pricing}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { InfraModePicker };
