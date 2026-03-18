"use client";

import * as React from "react";

interface AISummaryProps {
  section: string;
  className?: string;
}

function AISummary({ section, className = "" }: AISummaryProps) {
  const [summary, setSummary] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchSummary() {
      try {
        const res = await fetch(
          `/api/ai/summary?section=${encodeURIComponent(section)}`
        );
        if (!res.ok) throw new Error("Failed to fetch summary");
        const data = await res.json();
        if (!cancelled) {
          setSummary(data.summary ?? data.text ?? "");
        }
      } catch {
        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchSummary();
    return () => {
      cancelled = true;
    };
  }, [section]);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="h-[2px] w-full max-w-[200px] overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-slate-900/60" style={{
            animation: "pulse-slide 1.5s ease-in-out infinite",
          }} />
        </div>
        <style>{`
          @keyframes pulse-slide {
            0%, 100% { transform: translateX(-100%); opacity: 0.4; }
            50% { transform: translateX(100%); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <SparkleIcon className="h-3 w-3 flex-shrink-0 text-slate-900" />
      <p className="text-[13px] italic text-slate-500">{summary}</p>
    </div>
  );
}

function SparkleIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 0a.5.5 0 01.473.338l1.528 4.461 4.461 1.528a.5.5 0 010 .946l-4.461 1.528-1.528 4.461a.5.5 0 01-.946 0L5.999 8.801 1.538 7.273a.5.5 0 010-.946L5.999 4.8 7.527.338A.5.5 0 018 0z" />
    </svg>
  );
}

export { AISummary };
