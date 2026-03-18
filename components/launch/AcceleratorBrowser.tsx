"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface Program {
  id: string;
  name: string;
  description: string | null;
  investment_amount: number | null;
  equity_taken: number | null;
  program_length_weeks: number | null;
  deadline: string | null;
  application_url: string | null;
  notable_alumni: string[] | null;
  sectors: string[] | null;
  stages: string[] | null;
  location: string | null;
}

interface Profile {
  product_type: string | null;
  home_state: string | null;
  planning_to_raise: boolean | null;
}

interface MatchResult {
  program_id: string;
  match_score: number;
  reasons: string[];
}

interface AcceleratorBrowserProps {
  programs: Program[];
  profile: Profile | null;
}

function formatCurrency(amount: number | null): string {
  if (amount == null) return "--";
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

export function AcceleratorBrowser({ programs, profile }: AcceleratorBrowserProps) {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMatched, setHasMatched] = useState(false);

  async function handleFindMatch() {
    if (!profile) return;
    setLoading(true);
    try {
      const res = await fetch("/api/launch/accelerators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        const data = await res.json();
        setMatches(data.matches || []);
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
      setHasMatched(true);
    }
  }

  function getMatchScore(programId: string): number | null {
    const m = matches.find((r) => r.program_id === programId);
    return m ? m.match_score : null;
  }

  function getMatchReasons(programId: string): string[] {
    const m = matches.find((r) => r.program_id === programId);
    return m?.reasons || [];
  }

  const sortedPrograms = hasMatched
    ? [...programs].sort((a, b) => {
        const scoreA = getMatchScore(a.id) ?? 0;
        const scoreB = getMatchScore(b.id) ?? 0;
        return scoreB - scoreA;
      })
    : programs;

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-base font-semibold text-slate-900">
          Accelerator Programs
        </h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Browse programs and find your best match
        </p>
      </div>

      {!profile ? (
        <div className="flex items-center justify-center border border-slate-200 px-4 py-12">
          <p className="text-[13px] text-slate-500">
            Complete your founder onboarding to get personalized accelerator
            matches.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <Button onClick={handleFindMatch} loading={loading}>
              Find your match
            </Button>
          </div>

          {programs.length === 0 ? (
            <div className="flex items-center justify-center border border-slate-200 px-4 py-12">
              <p className="text-[13px] text-slate-500">
                No accelerator programs available yet.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedPrograms.map((program) => {
                const score = getMatchScore(program.id);
                const reasons = getMatchReasons(program.id);

                return (
                  <Card key={program.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle>{program.name}</CardTitle>
                        {score != null && (
                          <span className="text-xs font-medium text-slate-700 tabular-nums">
                            {score}% match
                          </span>
                        )}
                      </div>
                      {program.description && (
                        <p className="mt-1 text-[13px] text-slate-500">
                          {program.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      {score != null && (
                        <div className="mb-4">
                          <div className="h-1.5 w-full bg-slate-100">
                            <div
                              className="h-1.5 bg-slate-900 transition-all duration-150"
                              style={{ width: `${Math.min(score, 100)}%` }}
                            />
                          </div>
                          {reasons.length > 0 && (
                            <p className="mt-1.5 text-xs text-slate-400">
                              {reasons.join(" · ")}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
                        {program.investment_amount != null && (
                          <div>
                            <span className="text-slate-400">Investment: </span>
                            <span className="text-slate-700">
                              {formatCurrency(program.investment_amount)}
                            </span>
                          </div>
                        )}
                        {program.equity_taken != null && (
                          <div>
                            <span className="text-slate-400">Equity: </span>
                            <span className="text-slate-700">
                              {program.equity_taken}%
                            </span>
                          </div>
                        )}
                        {program.program_length_weeks != null && (
                          <div>
                            <span className="text-slate-400">Length: </span>
                            <span className="text-slate-700">
                              {program.program_length_weeks} weeks
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-400">Deadline: </span>
                          <span className="text-slate-700">
                            {program.deadline
                              ? new Date(program.deadline).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric", year: "numeric" }
                                )
                              : "Rolling"}
                          </span>
                        </div>
                      </div>

                      {program.notable_alumni &&
                        program.notable_alumni.length > 0 && (
                          <div className="mt-3">
                            <span className="text-xs text-slate-400">
                              Notable alumni:{" "}
                            </span>
                            <span className="text-xs text-slate-600">
                              {program.notable_alumni.join(", ")}
                            </span>
                          </div>
                        )}

                      {program.application_url && (
                        <div className="mt-4">
                          <a
                            href={program.application_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="outline">
                              Apply
                            </Button>
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <p className="mt-12 text-xs text-slate-400 leading-relaxed">
        Program details are sourced from public information. Verify deadlines
        and terms on official program websites.
      </p>
    </div>
  );
}
