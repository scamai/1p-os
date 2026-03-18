"use client";

import { useState } from "react";
import { Education, EDUCATION } from "@/components/shared/Education";

interface Accelerator {
  id: string;
  name: string;
  location: string;
  batch: string;
  deadline: string;
  investment: string;
  equity: string;
  focus: string[];
  url: string;
  status: "not_started" | "drafting" | "submitted" | "interview" | "accepted" | "rejected";
  notes: string;
}

const ACCELERATORS: Accelerator[] = [
  // ── Pinned ──
  { id: "beta", name: "Beta University", location: "Global", batch: "Cohort 13", deadline: "Jun 15, 2026", investment: "Pre-accelerator", equity: "0%", focus: ["First-time Founders", "Pre-seed", "Community"], url: "https://www.betauniversity.org/", status: "not_started", notes: "Best for first-time founders. No equity taken." },
  { id: "skydeck", name: "Berkeley SkyDeck", location: "Berkeley, CA", batch: "Batch 23", deadline: "Aug 2026 (opens)", investment: "$200K", equity: "7.5%", focus: ["Deep Tech", "AI", "Climate", "Health"], url: "https://skydeck.berkeley.edu/apply/", status: "not_started", notes: "Batch 22 closed Feb 13, 2026. Batch 23 apps open August 2026." },
  // ── By deadline ──
  { id: "500global", name: "500 Global", location: "San Francisco, CA", batch: "Batch 30", deadline: "Mar 31, 2026", investment: "$150K", equity: "6%", focus: ["Global", "Fintech", "AI", "SaaS"], url: "https://500.co/founders", status: "not_started", notes: "" },
  { id: "founders-factory", name: "Founders Factory", location: "London, UK", batch: "AI Health", deadline: "Mar 31, 2026", investment: "$250K", equity: "5-8%", focus: ["AI", "Health", "Education", "Sustainability"], url: "https://foundersfactory.com", status: "not_started", notes: "" },
  { id: "pearvc", name: "PearX (Pear VC)", location: "Palo Alto, CA", batch: "S26", deadline: "Apr 12, 2026", investment: "$250K-2M", equity: "Varies", focus: ["Pre-seed", "AI", "Enterprise", "Consumer"], url: "https://pear.vc/pearx-s26-applications", status: "not_started", notes: "" },
  { id: "a16z-speedrun", name: "a16z Speedrun", location: "San Francisco, CA", batch: "SR007", deadline: "Apr 30, 2026", investment: "$1M", equity: "7%", focus: ["AI", "Crypto", "Bio", "Games", "Infra"], url: "https://speedrun.a16z.com/apply", status: "not_started", notes: "" },
  { id: "yc", name: "Y Combinator", location: "San Francisco, CA", batch: "S2026", deadline: "May 4, 2026", investment: "$500K", equity: "7%", focus: ["All Verticals"], url: "https://apply.ycombinator.com/home", status: "not_started", notes: "" },
  { id: "startx", name: "StartX (Stanford)", location: "Palo Alto, CA", batch: "Fall 2026", deadline: "Jul 15, 2026", investment: "$0 (no equity)", equity: "0%", focus: ["Stanford Affiliated", "All Verticals"], url: "https://startx.com/apply", status: "not_started", notes: "" },
  { id: "sequoia-arc", name: "Sequoia Arc", location: "Global", batch: "Fall 2026", deadline: "Aug 15, 2026", investment: "$1M+", equity: "Varies", focus: ["Pre-seed", "AI", "Enterprise", "Consumer"], url: "https://www.sequoiacap.com/arc", status: "not_started", notes: "" },
  { id: "south-park-commons", name: "South Park Commons", location: "San Francisco, CA", batch: "Fall 2026", deadline: "Aug 15, 2026", investment: "$1M", equity: "Varies", focus: ["Pre-idea", "Exploration", "AI", "Deep Tech"], url: "https://www.southparkcommons.com", status: "not_started", notes: "" },
  { id: "first-round-dorm-room-fund", name: "Dorm Room Fund", location: "Multiple Cities", batch: "2026-27", deadline: "Sep 11, 2026", investment: "$20K-50K", equity: "Varies", focus: ["Student Founders", "Pre-seed"], url: "https://www.dormroomfund.com", status: "not_started", notes: "" },
  { id: "techstars", name: "Techstars", location: "Multiple Cities", batch: "Fall 2026", deadline: "Sep 14, 2026", investment: "$120K", equity: "6%", focus: ["All Verticals", "B2B", "Marketplace"], url: "https://apply.techstars.com", status: "not_started", notes: "" },
  { id: "kleiner-perkins-fellows", name: "Kleiner Perkins Fellows", location: "Menlo Park, CA", batch: "Summer 2027", deadline: "Oct 10, 2026", investment: "Fellowship", equity: "N/A", focus: ["Engineering", "Design", "Product Fellows"], url: "https://fellows.kleinerperkins.com", status: "not_started", notes: "" },
  { id: "lsvp", name: "LSVP Summer Fellowship", location: "Menlo Park, CA", batch: "Summer 2027", deadline: "Jan 9, 2027", investment: "$25K", equity: "Varies", focus: ["Student Founders", "Consumer", "Enterprise"], url: "https://www.lsvp.com/summer-fellowship", status: "not_started", notes: "" },
  { id: "general-catalyst", name: "GC Venture Fellows", location: "Cambridge, MA", batch: "2027-28", deadline: "Mar 1, 2027", investment: "$25K-250K", equity: "Varies", focus: ["Student Founders", "All Verticals"], url: "https://www.generalcatalyst.com/stories/introducing-the-gc-venture-fellowship", status: "not_started", notes: "" },
  // ── Rolling ──
  { id: "antler", name: "Antler", location: "Global (28 cities)", batch: "2026", deadline: "Rolling", investment: "$250K", equity: "8-10%", focus: ["Pre-idea", "AI", "B2B", "Deep Tech"], url: "https://www.antler.co/apply", status: "not_started", notes: "" },
  { id: "seedcamp", name: "Seedcamp", location: "London, UK", batch: "2026", deadline: "Rolling", investment: "€200K", equity: "7.5%", focus: ["European Founders", "AI", "Fintech", "SaaS"], url: "https://seedcamp.com/out/f6-startup-details", status: "not_started", notes: "" },
  { id: "launch", name: "Launch (Jason Calacanis)", location: "San Francisco, CA", batch: "2026", deadline: "Rolling", investment: "$125K", equity: "6%", focus: ["AI", "SaaS", "Marketplace", "Consumer"], url: "https://www.launch.co/accelerator", status: "not_started", notes: "" },
  { id: "entrepreneur-first", name: "Entrepreneur First", location: "London / Singapore / US", batch: "2026", deadline: "Rolling", investment: "$80K", equity: "10%", focus: ["Pre-team", "Deep Tech", "AI"], url: "https://apply.joinef.com", status: "not_started", notes: "" },
  { id: "plug-and-play", name: "Plug and Play", location: "Sunnyvale, CA", batch: "2026", deadline: "Rolling", investment: "$25K-500K", equity: "Varies", focus: ["Enterprise", "Fintech", "Health", "Supply Chain"], url: "https://www.plugandplaytechcenter.com/startups", status: "not_started", notes: "" },
  { id: "greylock-edge", name: "Greylock Edge", location: "Menlo Park, CA", batch: "2026", deadline: "Rolling", investment: "$250K-1M", equity: "Varies", focus: ["Enterprise", "AI", "Consumer"], url: "https://greylock.com/edge", status: "not_started", notes: "" },
  { id: "neo", name: "Neo", location: "San Francisco, CA", batch: "2026", deadline: "Rolling", investment: "$100K+", equity: "Varies", focus: ["Student Founders", "AI", "Consumer"], url: "https://neo.com/accelerator-apply", status: "not_started", notes: "" },
  { id: "indie-bio", name: "IndieBio (SOSV)", location: "San Francisco / New York", batch: "2026", deadline: "Rolling", investment: "$525K", equity: "8%", focus: ["Biotech", "Climate", "Food", "Health"], url: "https://sosv.com/apply/indiebio", status: "not_started", notes: "" },
  { id: "on-deck", name: "On Deck Founders", location: "Remote / SF", batch: "ODF28", deadline: "Rolling", investment: "$125K", equity: "Varies", focus: ["Community", "AI", "SaaS", "Remote"], url: "https://joinodf.com", status: "not_started", notes: "" },
  { id: "accel", name: "Accel", location: "Palo Alto / Bangalore", batch: "2026", deadline: "Rolling", investment: "$250K-1M", equity: "Varies", focus: ["Pre-seed", "SaaS", "AI", "Fintech"], url: "https://www.accel.com", status: "not_started", notes: "" },
  { id: "8vc", name: "8VC Fellowship", location: "Austin, TX", batch: "Summer 2026", deadline: "Rolling", investment: "$200K-1M", equity: "Varies", focus: ["Defense", "Govtech", "Enterprise", "AI"], url: "https://8vc.com/fellowships", status: "not_started", notes: "" },
];

const STATUS_LABELS: Record<Accelerator["status"], string> = {
  not_started: "Apply",
  drafting: "Drafting",
  submitted: "Submitted",
  interview: "Interview",
  accepted: "Accepted",
  rejected: "Rejected",
};

const STATUS_STYLES: Record<Accelerator["status"], string> = {
  not_started: "bg-slate-100 text-slate-500",
  drafting: "bg-slate-200 text-slate-700",
  submitted: "bg-slate-300 text-slate-800",
  interview: "bg-slate-800 text-white",
  accepted: "bg-slate-900 text-white",
  rejected: "bg-slate-100 text-slate-400 line-through",
};

export default function AcceleratorPage() {
  const [accelerators, setAccelerators] = useState(ACCELERATORS);
  const [selected, setSelected] = useState<string | null>(null);

  const updateStatus = (id: string, status: Accelerator["status"]) => {
    setAccelerators((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  const updateNotes = (id: string, notes: string) => {
    setAccelerators((prev) =>
      prev.map((a) => (a.id === id ? { ...a, notes } : a))
    );
  };

  const selectedAcc = accelerators.find((a) => a.id === selected);

  return (
    <div className="mx-auto max-w-[800px]">
      <Education {...EDUCATION.accelerator} />
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-900">Apply to Accelerator</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track your applications to top-tier accelerator programs.
        </p>
      </div>


      {/* List */}
      <div className="space-y-2">
        {accelerators.map((acc, i) => (
          <div
            key={acc.id}
            onClick={() => setSelected(selected === acc.id ? null : acc.id)}
            className={`rounded-lg border transition-colors cursor-pointer ${
              selected === acc.id
                ? "border-slate-400 bg-slate-50"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            {/* Row */}
            <div className="flex items-center gap-3 px-4 py-3">
              {/* no ranking */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <a
                    href={acc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[13px] font-medium text-slate-900 hover:underline"
                  >{acc.name}</a>
                  <span className="text-[10px] text-slate-400">
                    {acc.deadline}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">{acc.location}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-slate-500">{acc.investment} / {acc.equity}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[acc.status]}`}>
                  {STATUS_LABELS[acc.status]}
                </span>
              </div>
            </div>

            {/* Expanded detail */}
            {selected === acc.id && (
              <div className="border-t border-slate-200 px-4 py-3 space-y-3">
                <div className="grid grid-cols-3 gap-4 text-[12px]">
                  <div>
                    <p className="text-slate-500">Batch</p>
                    <p className="text-slate-800">{acc.batch}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Deadline</p>
                    <p className="text-slate-800">{acc.deadline}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Focus</p>
                    <p className="text-slate-800">{acc.focus.join(", ")}</p>
                  </div>
                </div>

                {/* Status buttons */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 mr-1">Status:</span>
                  {(Object.keys(STATUS_LABELS) as Accelerator["status"][]).map((s) => (
                    <button
                      key={s}
                      onClick={(e) => { e.stopPropagation(); updateStatus(acc.id, s); }}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                        acc.status === s
                          ? STATUS_STYLES[s]
                          : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                      }`}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>

                {/* Notes */}
                <div>
                  <textarea
                    value={acc.notes}
                    onChange={(e) => updateNotes(acc.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Add notes about this application..."
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-slate-300 resize-none"
                    rows={2}
                  />
                </div>

                {/* Link */}
                <a
                  href={acc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700"
                >
                  Apply
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
