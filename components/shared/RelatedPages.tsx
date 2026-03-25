"use client";

import Link from "next/link";

// ---------------------------------------------------------------------------
// Related Pages — contextual cross-links between features
// ---------------------------------------------------------------------------

interface RelatedLink {
  label: string;
  href: string;
  context: string; // one-line reason why this is relevant
}

interface RelatedPagesProps {
  links: RelatedLink[];
}

function ChevronRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function RelatedPages({ links }: RelatedPagesProps) {
  if (links.length === 0) return null;

  return (
    <div className="mt-10 border-t border-black/[0.06] pt-5 pb-2">
      <p className="text-[11px] font-medium uppercase tracking-wider text-black/40 mb-2">
        Related
      </p>
      {/* Mobile: full-width stacked list. Desktop: grid */}
      <div className="flex flex-col gap-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex items-center gap-3 border-b border-black/[0.04] py-3 px-1 -mx-1 active:bg-black/[0.02] md:border md:border-black/[0.06] md:bg-white md:p-3 md:mx-0 md:hover:border-black/20 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-black md:text-[13px]">
                {link.label}
              </p>
              <p className="mt-0.5 text-[12px] text-black/40 leading-snug md:text-[11px]">
                {link.context}
              </p>
            </div>
            <span className="text-black/20 group-hover:text-black/60 transition-colors">
              <ChevronRight />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export { RelatedPages };
export type { RelatedLink };
