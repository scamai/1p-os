import { HealthScore } from "@/components/company/HealthScore";
import { CostIndicator } from "@/components/company/CostIndicator";

interface HeaderProps {
  revenue?: number;
  freedomHours?: number;
  healthScore?: number;
  costToday?: number;
  budgetDaily?: number;
  onKillSwitch?: () => void;
}

function Header({
  revenue = 0,
  freedomHours = 0,
  healthScore = 100,
  costToday = 0,
  budgetDaily = 5,
  onKillSwitch,
}: HeaderProps) {
  return (
    <header className="flex h-12 items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold tracking-tight text-[var(--foreground)]">
          1P
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs">
        <div className="hidden items-center gap-1 text-[var(--muted-foreground)] sm:flex">
          <span className="font-mono">${revenue.toLocaleString()}</span>
        </div>

        <div className="hidden items-center gap-1 text-[var(--muted-foreground)] sm:flex">
          <span>{freedomHours}h free</span>
        </div>

        <HealthScore score={healthScore} />

        <CostIndicator spent={costToday} budget={budgetDaily} />

        <button
          onClick={onKillSwitch}
          className="rounded-md bg-[var(--destructive)] px-2 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90"
        >
          KILL
        </button>
      </div>
    </header>
  );
}

export { Header };
