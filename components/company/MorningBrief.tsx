"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/Card";

interface MorningBriefProps {
  summary?: string | null;
}

function MorningBrief({ summary }: MorningBriefProps) {
  const [dismissed, setDismissed] = React.useState(false);

  if (!summary || dismissed) return null;

  return (
    <Card className="mb-4 border-black/50/20">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-black/50">
              Morning Brief
            </p>
            <p className="text-sm text-black">{summary}</p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 rounded-sm p-1 text-black/50 transition-colors hover:text-black"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export { MorningBrief };
