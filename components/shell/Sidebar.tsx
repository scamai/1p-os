"use client";

import { useState, useEffect, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

interface SidebarProps {
  counts?: {
    pendingDecisions?: number;
    overdueInvoices?: number;
    activeRelationships?: number;
    activeProjects?: number;
    activeAgents?: number;
    documentCount?: number;
  };
  onOpenCommandBar?: () => void;
}

// ── Icons (16px, strokeWidth 1.5) ──

function Icon({ d, ...props }: { d: string } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d={d} />
    </svg>
  );
}

function HomeIcon() { return <Icon d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />; }
function UsersIcon() { return <Icon d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />; }
function DollarIcon() { return <Icon d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />; }
function FileIcon() { return <Icon d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M8 13h8M8 17h8" />; }
function TargetIcon() { return <Icon d="M12 22a10 10 0 100-20 10 10 0 000 20zM12 18a6 6 0 100-12 6 6 0 000 12zM12 14a2 2 0 100-4 2 2 0 000 4z" />; }
function TrendIcon() { return <Icon d="M23 6l-9.5 9.5-5-5L1 18" />; }
function BriefcaseIcon() { return <Icon d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />; }
function RocketIcon() { return <Icon d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09zM12 15l-3-3M22 2l-7.5 7.5" />; }
function LightbulbIcon() { return <Icon d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7zM9 21h6" />; }
function PieChartIcon() { return <Icon d="M21.21 15.89A10 10 0 118 2.83M22 12A10 10 0 0012 2v10z" />; }
function MapIcon() { return <Icon d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4zM8 2v16M16 6v16" />; }
function MegaphoneIcon() { return <Icon d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />; }
function ScaleIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18" /><path d="M2 7h20" /><path d="M5 7l-3 9a5 5 0 006 0L5 7z" /><path d="M19 7l-3 9a5 5 0 006 0L19 7z" /></svg>; }
function HeartIcon() { return <Icon d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />; }
function TagIcon() { return <Icon d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01" />; }
function LayersIcon() { return <Icon d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />; }
function SearchIcon() { return <Icon d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35" />; }
function BotIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="9" cy="16" r="1" /><circle cx="15" cy="16" r="1" /><path d="M8 11V7a4 4 0 018 0v4" /><line x1="12" y1="3" x2="12" y2="1" /></svg>; }
function TerminalIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></svg>; }
function SettingsIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>; }

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ── Nav Structure ──

interface NavItem {
  id: string;
  icon: ReactNode;
  label: string;
  href: string;
  count?: number;
  comingSoon?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  icon: ReactNode;
  items: NavItem[];
  defaultOpen?: boolean;
}

function buildNav(counts: SidebarProps["counts"] = {}): { top: NavItem[]; groups: NavGroup[]; bottom: NavItem[] } {
  return {
    top: [
      { id: "before-you-started", icon: <RocketIcon />, label: "Before you started", href: "/launch" },
      { id: "founders", icon: <UsersIcon />, label: "Founders", href: "/company/founders" },
      { id: "founder-wellness", icon: <HeartIcon />, label: "Founder Wellness", href: "/company/founder-wellness" },
      { id: "ideation", icon: <LightbulbIcon />, label: "Ideation", href: "/company/ideation" },
      { id: "equity", icon: <PieChartIcon />, label: "Equity", href: "/company/equity" },
      { id: "incorporation", icon: <FileIcon />, label: "Incorporation", href: "/company/incorporation" },
      { id: "traction", icon: <TargetIcon />, label: "Traction", href: "/business/traction" },
      { id: "fundraising", icon: <DollarIcon />, label: "Fundraising", href: "/money/fundraising" },
      { id: "pricing", icon: <TagIcon />, label: "Pricing", href: "/business/pricing" },
      { id: "legal-guide", icon: <ScaleIcon />, label: "Legal", href: "/legal" },
    ],
    groups: [
      {
        id: "tools",
        label: "Tools",
        icon: <BriefcaseIcon />,
        defaultOpen: false,
        items: [
          { id: "equity-split", icon: <PieChartIcon />, label: "Equity Splitter", href: "/tools/equity-split" },
          { id: "solution-deck", icon: <LayersIcon />, label: "Solution Deck", href: "/company/solution-deck" },
          { id: "accelerator", icon: <TargetIcon />, label: "Accelerator Tracker", href: "/company/accelerator" },
          { id: "runrate", icon: <TrendIcon />, label: "Runrate Calculator", href: "/money/runrate" },
          { id: "biz-model", icon: <MapIcon />, label: "Business Model Canvas", href: "/business/model" },
          { id: "market-research", icon: <SearchIcon />, label: "Market Research", href: "/business/market-research" },
          { id: "gtm", icon: <RocketIcon />, label: "Go-to-Market Planner", href: "/business/gtm", comingSoon: true },
          { id: "marketing", icon: <MegaphoneIcon />, label: "Marketing Tracker", href: "/business/marketing", comingSoon: true },
        ],
      },
      {
        id: "legal",
        label: "Legal",
        icon: <ScaleIcon />,
        defaultOpen: false,
        items: [
          { id: "contracts", icon: <FileIcon />, label: "Templates", href: "/legal/contracts" },
          { id: "legal-safes", icon: <TagIcon />, label: "SAFEs", href: "/legal/safes" },
          { id: "ip", icon: <LightbulbIcon />, label: "IP & Trademarks", href: "/legal/ip" },
        ],
      },
    ],
    bottom: [
      { id: "settings", icon: <SettingsIcon />, label: "Settings", href: "/settings" },
    ],
  };
}

// ── Sidebar Component ──

function Sidebar({ counts = {}, onOpenCommandBar }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = buildNav(counts);

  // Track which Learn articles have been read
  const LEARN_IDS = ["founders", "founder-wellness", "ideation", "equity", "incorporation", "traction", "fundraising", "pricing", "legal-guide"];
  const [readArticles, setReadArticles] = useState<Set<string>>(new Set());

  // Load read articles from localStorage after mount (avoids hydration mismatch)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("1p-read-articles");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time localStorage hydration
      if (saved) setReadArticles(new Set(JSON.parse(saved)));
    } catch { /* ignore */ }
  }, []);

  // Mark current article as read
  useEffect(() => {
    const match = nav.top.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"));
    if (match && LEARN_IDS.includes(match.id)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing read state from navigation
      setReadArticles((prev) => {
        const next = new Set(prev);
        next.add(match.id);
        localStorage.setItem("1p-read-articles", JSON.stringify([...next]));
        return next;
      });
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const defaults: Record<string, boolean> = {};
    for (const g of nav.groups) {
      if (g.defaultOpen) defaults[g.id] = true;
    }
    return defaults;
  });

  // Open group that contains current path
  useEffect(() => {
    for (const group of nav.groups) {
      if (group.items.some((item) => pathname.startsWith(item.href))) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing sidebar state from navigation
        setOpenGroups((prev) => ({ ...prev, [group.id]: true }));
      }
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close mobile menu on navigation
    setMobileOpen(false);
  }, [pathname]);

  function isActive(href: string): boolean {
    if (href === "/company") return pathname === "/" || pathname === "/company";
    return pathname === href || pathname.startsWith(href + "/");
  }

  function navigateTo(href: string) {
    router.push(href);
    setMobileOpen(false);
  }

  function toggleGroup(id: string) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // Top-level flat item with icon and optional read indicator
  function renderTopItem(item: NavItem) {
    const active = isActive(item.href);
    const isRead = LEARN_IDS.includes(item.id) && readArticles.has(item.id);
    return (
      <button
        key={item.id}
        onClick={() => navigateTo(item.href)}
        className={`group flex w-full items-center gap-3 px-3 py-[7px] text-left transition-colors duration-100 ${
          active
            ? "text-black font-medium"
            : "text-black/70 hover:text-black"
        }`}
      >
        <span className={`flex h-4 w-4 shrink-0 items-center justify-center ${
          active ? "text-black" : "text-black/40 group-hover:text-black/60"
        }`}>
          {item.icon}
        </span>
        <span className="flex-1 truncate text-[14px]">{item.label}</span>
        {isRead && !active && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-black/20">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
    );
  }

  // Child item inside a group (plain text, indented, no icon)
  function renderChildItem(item: NavItem, groupId?: string) {
    const active = isActive(item.href);
    const disabled = item.comingSoon;
    const isRead = groupId === "learn" && readArticles.has(item.id);
    return (
      <button
        key={item.id}
        onClick={disabled ? undefined : () => navigateTo(item.href)}
        className={`flex w-full items-center pl-9 pr-3 py-[5px] text-left transition-colors duration-100 ${
          disabled
            ? "text-black/30 cursor-default"
            : active
              ? "text-black font-medium"
              : "text-black/60 hover:text-black"
        }`}
      >
        <span className="flex-1 truncate text-[14px]">{item.label}</span>
        {isRead && !active && (
          <span className="shrink-0 ml-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black/25">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
        {disabled && (
          <span className="shrink-0 bg-black/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-black/40">
            Soon
          </span>
        )}
        {!disabled && item.count !== undefined && item.count > 0 && (
          <span className="shrink-0 bg-black/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-black/60">
            {item.count}
          </span>
        )}
      </button>
    );
  }

  // Group header (icon + label + chevron) — like Carta's "Essentials"
  function renderGroup(group: NavGroup) {
    const isOpen = openGroups[group.id] ?? false;
    const hasActive = group.items.some((item) => isActive(item.href));

    return (
      <div key={group.id}>
        <button
          onClick={() => toggleGroup(group.id)}
          className={`flex w-full items-center gap-3 px-3 py-[7px] text-left transition-colors duration-100 ${
            hasActive
              ? "text-black font-medium"
              : "text-black/70 hover:text-black"
          }`}
        >
          <span className={`flex h-4 w-4 shrink-0 items-center justify-center ${
            hasActive ? "text-black" : "text-black/40"
          }`}>
            {group.icon}
          </span>
          <span className="flex-1 text-[14px]">{group.label}</span>
          <ChevronIcon open={isOpen} />
        </button>

        {isOpen && (
          <div className="space-y-px">
            {group.items.map((item) => renderChildItem(item, group.id))}
          </div>
        )}
      </div>
    );
  }

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-black/[0.06]">
        <span className="font-heading text-[18px] italic font-extralight tracking-[-0.02em] text-black">
          1P
        </span>
        <button
          onClick={onOpenCommandBar}
          className="flex h-7 w-7 items-center justify-center text-black/40 hover:text-black/60 transition-colors"
          aria-label="Search"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-1 space-y-0.5">
        {/* Learn items — always visible, no collapsing */}
        {nav.top.map(renderTopItem)}

        {/* Divider */}
        <div className="!my-3 mx-3 border-t border-black/[0.06]" />

        {/* Groups (Tools, Legal) */}
        {nav.groups.map(renderGroup)}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-black/[0.06] px-1 py-2">
        {nav.bottom.map(renderTopItem)}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-30 w-[220px] border-r border-black/[0.06] bg-white">
        {sidebarContent}
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-40 flex h-10 w-10 items-center justify-center text-black/50 hover:text-black/60 md:hidden"
        aria-label="Open menu"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/10 md:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={`fixed left-0 top-0 bottom-0 z-50 flex w-[220px] flex-col border-r border-black/[0.06] bg-white transition-transform duration-200 md:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {sidebarContent}
      </aside>
    </>
  );
}

export { Sidebar };
export type { SidebarProps };
