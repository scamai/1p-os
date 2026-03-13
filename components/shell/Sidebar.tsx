"use client";

import { useState, useEffect, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarItem } from "@/components/shell/SidebarItem";

interface SidebarProps {
  counts?: {
    pendingDecisions?: number;
    overdueInvoices?: number;
    activeRelationships?: number;
    activeProjects?: number;
    activeAgents?: number;
    documentCount?: number;
  };
}

// --- Inline SVG Icons (16px, strokeWidth 1.5) ---

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <line x1="8" y1="11" x2="16" y2="11" />
      <line x1="8" y1="15" x2="13" y2="15" />
    </svg>
  );
}

function BotIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="9" cy="16" r="1" />
      <circle cx="15" cy="16" r="1" />
      <path d="M8 11V7a4 4 0 018 0v4" />
      <line x1="12" y1="3" x2="12" y2="1" />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l1-4h16l1 4" />
      <path d="M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9" />
      <path d="M9 21V13h6v8" />
      <path d="M3 9h18" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function CanvasIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="9" x2="9" y2="21" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// --- Nav item config ---

interface NavItem {
  icon: ReactNode;
  label: string;
  href: string;
  countKey?: keyof NonNullable<SidebarProps["counts"]>;
}

const mainNavItems: NavItem[] = [
  { icon: <HomeIcon />, label: "HQ", href: "/company", countKey: "pendingDecisions" },
  { icon: <DollarIcon />, label: "Finance", href: "/finance", countKey: "overdueInvoices" },
  { icon: <TagIcon />, label: "Sales", href: "/sales" },
  { icon: <UsersIcon />, label: "People", href: "/people", countKey: "activeRelationships" },
  { icon: <ClipboardIcon />, label: "Work", href: "/work", countKey: "activeProjects" },
  { icon: <BotIcon />, label: "Team", href: "/team", countKey: "activeAgents" },
  { icon: <FileTextIcon />, label: "Vault", href: "/vault", countKey: "documentCount" },
  { icon: <MessageIcon />, label: "Channels", href: "/channels" },
  { icon: <BoltIcon />, label: "Automations", href: "/automations" },
  { icon: <CanvasIcon />, label: "Canvas", href: "/canvas" },
  { icon: <StoreIcon />, label: "Talent", href: "/talent" },
];

const bottomNavItems: NavItem[] = [
  { icon: <SettingsIcon />, label: "Settings", href: "/settings" },
];

// --- Sidebar Component ---

function Sidebar({ counts = {} }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function navigateTo(href: string) {
    router.push(href);
    setMobileOpen(false);
  }

  function isActive(href: string): boolean {
    if (href === "/company") {
      return pathname === "/" || pathname === "/company" || pathname.startsWith("/company/");
    }
    return pathname === href || pathname.startsWith(href + "/");
  }

  function renderNavItems(items: NavItem[]) {
    return items.map((item) => (
      <SidebarItem
        key={item.href}
        icon={item.icon}
        label={item.label}
        href={item.href}
        count={item.countKey ? counts[item.countKey] : undefined}
        isActive={isActive(item.href)}
        isExpanded={true}
        onClick={() => navigateTo(item.href)}
      />
    ));
  }

  // --- Desktop sidebar ---
  const desktopSidebar = (
    <aside
      className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-30 w-[200px] border-r border-zinc-200"
    >
      {/* Header */}
      <div className="flex h-12 items-center px-4">
        <span className="text-[13px] font-semibold tracking-tight text-zinc-600">
          1P OS
        </span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto py-2">
        {renderNavItems(mainNavItems)}
      </nav>

      {/* Spacer before Settings (no visible divider) */}
      <div className="pt-4 pb-2">
        {renderNavItems(bottomNavItems)}
      </div>
    </aside>
  );

  // --- Mobile overlay ---
  const mobileSidebar = (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-40 flex h-8 w-8 items-center justify-center text-zinc-500 transition-colors duration-200 hover:text-zinc-600 md:hidden"
        aria-label="Open menu"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile panel */}
      <aside
        className={`
          fixed left-0 top-0 bottom-0 z-50 flex w-[200px] flex-col
          glass border-r border-zinc-200
          transition-transform duration-200 ease-in-out md:hidden
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header with close */}
        <div className="flex h-12 items-center justify-between px-4">
          <span className="text-[13px] font-semibold tracking-tight text-zinc-600">
            1P OS
          </span>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="flex h-6 w-6 items-center justify-center text-zinc-500 transition-colors duration-200 hover:text-zinc-600"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto py-2">
          {renderNavItems(mainNavItems)}
        </nav>

        <div className="pt-4 pb-2">
          {renderNavItems(bottomNavItems)}
        </div>
      </aside>
    </>
  );

  return (
    <>
      {desktopSidebar}
      {mobileSidebar}
    </>
  );
}

export { Sidebar };
export type { SidebarProps };
