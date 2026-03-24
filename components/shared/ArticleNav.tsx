"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const READING_ORDER = [
  { href: "/launch", label: "Before you started" },
  { href: "/company/founders", label: "Founders" },
  { href: "/company/founder-wellness", label: "Founder Wellness" },
  { href: "/company/ideation", label: "Ideation" },
  { href: "/company/equity", label: "Equity" },
  { href: "/company/incorporation", label: "Incorporation" },
  { href: "/business/traction", label: "Traction" },
  { href: "/money/fundraising", label: "Fundraising" },
  { href: "/business/pricing", label: "Pricing" },
];

export function ArticleNav() {
  const pathname = usePathname();
  const router = useRouter();

  const idx = READING_ORDER.findIndex(
    (a) => pathname === a.href || pathname.startsWith(a.href + "/")
  );

  // Not on an article page
  if (idx === -1) return null;

  const prev = idx > 0 ? READING_ORDER[idx - 1] : null;
  const next = idx < READING_ORDER.length - 1 ? READING_ORDER[idx + 1] : null;

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Don't trigger when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft" && prev) router.push(prev.href);
      if (e.key === "ArrowRight" && next) router.push(next.href);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [prev, next, router]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30">
      <div className="mx-auto max-w-[680px] px-6">
        <div className="flex items-center justify-between border-t border-black/[0.06] bg-white/95 backdrop-blur-sm py-3">
          {prev ? (
            <button
              onClick={() => router.push(prev.href)}
              className="flex items-center gap-2 text-[13px] text-black/40 transition-colors hover:text-black"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              {prev.label}
            </button>
          ) : (
            <div />
          )}

          {/* Progress dots */}
          <div className="hidden sm:flex items-center gap-1">
            {READING_ORDER.map((_, i) => (
              <div
                key={i}
                className={`h-1 w-1 rounded-full transition-colors ${
                  i === idx
                    ? "bg-black"
                    : i < idx
                    ? "bg-black/20"
                    : "bg-black/[0.08]"
                }`}
              />
            ))}
          </div>

          {next ? (
            <button
              onClick={() => router.push(next.href)}
              className="flex items-center gap-2 text-[13px] text-black/40 transition-colors hover:text-black"
            >
              {next.label}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
