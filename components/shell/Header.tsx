import { HealthScore } from "@/components/company/HealthScore";
import { CostIndicator } from "@/components/company/CostIndicator";

interface HeaderProps {
  businessName?: string;
  healthScore?: number;
  costToday?: number;
  budgetDaily?: number;
  onKillSwitch?: () => void;
  onOpenCommandBar?: () => void;
}

function Header({
  businessName,
  healthScore = 100,
  costToday = 0,
  budgetDaily = 5,
  onKillSwitch,
  onOpenCommandBar,
}: HeaderProps) {
  return (
    <header className="flex h-12 items-center justify-between px-6">
      {/* Left: logo + business name */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-zinc-500">1P</span>
        {businessName && (
          <>
            <span className="text-zinc-600">/</span>
            <span className="text-[13px] text-zinc-500">{businessName}</span>
          </>
        )}
      </div>

      {/* Right: command bar, cost, health, kill switch */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenCommandBar}
          className="hidden items-center rounded-md border border-zinc-200 px-2 py-0.5 text-xs text-zinc-600 transition-colors duration-200 hover:text-zinc-500 sm:flex"
        >
          <kbd className="font-mono text-[10px]">&#8984;K</kbd>
        </button>

        <CostIndicator spent={costToday} budget={budgetDaily} />

        <HealthScore score={healthScore} />

        <button
          onClick={onKillSwitch}
          className="relative flex h-3 w-3 items-center justify-center"
          aria-label="Kill switch"
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-zinc-900 opacity-10" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-zinc-900" />
        </button>
      </div>
    </header>
  );
}

export { Header };
export type { HeaderProps };
