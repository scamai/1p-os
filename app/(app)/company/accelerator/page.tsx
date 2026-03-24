"use client";

import { useState } from "react";
import { Education, EDUCATION } from "@/components/shared/Education";
import { RelatedPages } from "@/components/shared/RelatedPages";

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
  not_started: "bg-black/[0.04] text-black/50",
  drafting: "bg-black/[0.08] text-black/70",
  submitted: "bg-black/30 text-black/80",
  interview: "bg-black/80 text-white",
  accepted: "bg-black text-white",
  rejected: "bg-black/[0.04] text-black/40 line-through",
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
        <h1 className="font-heading text-[clamp(1.5rem,3vw,1.75rem)] italic font-light tracking-[-0.01em] text-black">Apply to Accelerator</h1>
        <p className="mt-2 text-[14px] leading-[1.6] text-black/40">
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
                ? "border-black/40 bg-black/[0.02]"
                : "border-black/[0.08] bg-white hover:border-black/30"
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
                    className="text-[13px] font-medium text-black hover:underline"
                  >{acc.name}</a>
                  <span className="text-[10px] text-black/40">
                    {acc.deadline}
                  </span>
                </div>
                <p className="text-[11px] text-black/50">{acc.location}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-black/50">{acc.investment} / {acc.equity}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[acc.status]}`}>
                  {STATUS_LABELS[acc.status]}
                </span>
              </div>
            </div>

            {/* Expanded detail */}
            {selected === acc.id && (
              <div className="border-t border-black/[0.08] px-4 py-3 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[12px]">
                  <div>
                    <p className="text-black/50">Batch</p>
                    <p className="text-black/80">{acc.batch}</p>
                  </div>
                  <div>
                    <p className="text-black/50">Deadline</p>
                    <p className="text-black/80">{acc.deadline}</p>
                  </div>
                  <div>
                    <p className="text-black/50">Focus</p>
                    <p className="text-black/80">{acc.focus.join(", ")}</p>
                  </div>
                </div>

                {/* Status buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-black/50 mr-1">Status:</span>
                  {(Object.keys(STATUS_LABELS) as Accelerator["status"][]).map((s) => (
                    <button
                      key={s}
                      onClick={(e) => { e.stopPropagation(); updateStatus(acc.id, s); }}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                        acc.status === s
                          ? STATUS_STYLES[s]
                          : "bg-black/[0.04] text-black/40 hover:bg-black/[0.08] hover:text-black/60"
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
                    className="w-full rounded-md border border-black/[0.08] bg-white px-3 py-2 text-[12px] text-black/70 placeholder:text-black/40 focus:outline-none focus:border-black/30 resize-none"
                    rows={2}
                  />
                </div>

                {/* Link */}
                <a
                  href={acc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[11px] text-black/50 hover:text-black/70"
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

      <RelatedPages links={[
        { label: "Solution Deck", href: "/company/solution-deck", context: "Polish your pitch deck before applying" },
        { label: "Fundraising", href: "/money/fundraising", context: "Track funding rounds and investor pipeline" },
        { label: "Business Model", href: "/business/model", context: "Clarify your business model for applications" },
      ]} />
    </div>
  );
}
