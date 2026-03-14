"use client";

import { useState, useEffect, useCallback, useRef, ReactNode } from "react";
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

function BoxIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
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

function TemplateIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
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

function OrgChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <rect x="2" y="18" width="6" height="4" rx="1" />
      <rect x="16" y="18" width="6" height="4" rx="1" />
      <line x1="12" y1="6" x2="12" y2="14" />
      <line x1="5" y1="14" x2="19" y2="14" />
      <line x1="5" y1="14" x2="5" y2="18" />
      <line x1="19" y1="14" x2="19" y2="18" />
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

function BrainIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z" />
      <line x1="9" y1="21" x2="15" y2="21" />
      <line x1="10" y1="17" x2="10" y2="21" />
      <line x1="14" y1="17" x2="14" y2="21" />
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

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function GripIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="9" cy="6" r="1" />
      <circle cx="15" cy="6" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="9" cy="18" r="1" />
      <circle cx="15" cy="18" r="1" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// --- Nav item config ---

interface NavItemDef {
  id: string;
  icon: ReactNode;
  label: string;
  href: string;
  countKey?: keyof NonNullable<SidebarProps["counts"]>;
  pinned?: boolean; // Cannot be hidden
}

const ALL_NAV_ITEMS: NavItemDef[] = [
  { id: "home", icon: <HomeIcon />, label: "Home", href: "/company", countKey: "pendingDecisions", pinned: true },
  { id: "finance", icon: <DollarIcon />, label: "Finance", href: "/finance", countKey: "overdueInvoices" },
  { id: "sales", icon: <TagIcon />, label: "Sales", href: "/sales" },
  { id: "crm", icon: <UsersIcon />, label: "CRM", href: "/crm", countKey: "activeRelationships" },
  { id: "products", icon: <BoxIcon />, label: "Products", href: "/products" },
  { id: "work", icon: <ClipboardIcon />, label: "Work", href: "/work", countKey: "activeProjects" },
  { id: "team", icon: <BotIcon />, label: "Agents", href: "/team", countKey: "activeAgents" },
  { id: "vault", icon: <FileTextIcon />, label: "Vault", href: "/vault", countKey: "documentCount" },
  { id: "channels", icon: <MessageIcon />, label: "Channels", href: "/channels" },
  { id: "operations", icon: <OrgChartIcon />, label: "Operations", href: "/operations" },
  { id: "automations", icon: <BoltIcon />, label: "Automations", href: "/automations" },
  { id: "memory", icon: <BrainIcon />, label: "Memory", href: "/memory" },
  { id: "canvas", icon: <CanvasIcon />, label: "Canvas", href: "/canvas" },
  { id: "talent", icon: <StoreIcon />, label: "Agent Market", href: "/talent" },
  { id: "setup", icon: <TemplateIcon />, label: "Setup", href: "/setup" },
];

const BOTTOM_NAV_ITEMS: NavItemDef[] = [
  { id: "settings", icon: <SettingsIcon />, label: "Settings", href: "/settings", pinned: true },
];

// --- Persistence ---

const STORAGE_KEY = "1pos-sidebar-config";

interface SidebarConfig {
  order: string[];
  hidden: string[];
}

function getDefaultConfig(): SidebarConfig {
  return {
    order: ALL_NAV_ITEMS.map((item) => item.id),
    hidden: [],
  };
}

function loadConfig(): SidebarConfig {
  if (typeof window === "undefined") return getDefaultConfig();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultConfig();
    const parsed = JSON.parse(raw) as SidebarConfig;
    // Merge in any new items that weren't in the saved config
    const savedIds = new Set(parsed.order);
    const allIds = ALL_NAV_ITEMS.map((i) => i.id);
    for (const id of allIds) {
      if (!savedIds.has(id)) {
        parsed.order.push(id);
      }
    }
    // Remove items that no longer exist
    const validIds = new Set(allIds);
    parsed.order = parsed.order.filter((id) => validIds.has(id));
    parsed.hidden = parsed.hidden.filter((id) => validIds.has(id));
    return parsed;
  } catch {
    return getDefaultConfig();
  }
}

function saveConfig(config: SidebarConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // localStorage unavailable
  }
}

// --- Sidebar Component ---

function Sidebar({ counts = {} }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [config, setConfig] = useState<SidebarConfig>(getDefaultConfig);

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItemRef = useRef<string | null>(null);

  // Load saved config on mount
  useEffect(() => {
    setConfig(loadConfig());
  }, []);

  // Build ordered + visible nav items
  const itemMap = new Map(ALL_NAV_ITEMS.map((item) => [item.id, item]));
  const hiddenSet = new Set(config.hidden);

  const orderedItems: NavItemDef[] = config.order
    .map((id) => itemMap.get(id))
    .filter((item): item is NavItemDef => item !== undefined);

  const visibleItems = orderedItems.filter((item) => !hiddenSet.has(item.id));

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function navigateTo(href: string) {
    if (editing) return;
    router.push(href);
    setMobileOpen(false);
  }

  function isActive(href: string): boolean {
    if (href === "/company") {
      return pathname === "/" || pathname === "/company" || pathname.startsWith("/company/");
    }
    return pathname === href || pathname.startsWith(href + "/");
  }

  const toggleVisibility = useCallback((id: string) => {
    setConfig((prev) => {
      const next = { ...prev };
      if (next.hidden.includes(id)) {
        next.hidden = next.hidden.filter((h) => h !== id);
      } else {
        next.hidden = [...next.hidden, id];
      }
      saveConfig(next);
      return next;
    });
  }, []);

  const handleDragStart = useCallback((index: number, id: string) => {
    setDragIndex(index);
    dragItemRef.current = id;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback((dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    setConfig((prev) => {
      const next = { ...prev };
      const newOrder = [...next.order];
      const [moved] = newOrder.splice(dragIndex, 1);
      newOrder.splice(dropIndex, 0, moved);
      next.order = newOrder;
      saveConfig(next);
      return next;
    });

    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  const resetToDefault = useCallback(() => {
    const defaultConfig = getDefaultConfig();
    setConfig(defaultConfig);
    saveConfig(defaultConfig);
  }, []);

  // Render normal nav items
  function renderNavItems(items: NavItemDef[]) {
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

  // Render edit-mode nav items (with drag handles + visibility toggles)
  function renderEditItems() {
    return orderedItems.map((item, index) => {
      const isHidden = hiddenSet.has(item.id);
      const isDragging = dragIndex === index;
      const isDragOver = dragOverIndex === index;

      return (
        <div
          key={item.id}
          draggable
          onDragStart={() => handleDragStart(index, item.id)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={() => handleDrop(index)}
          onDragEnd={handleDragEnd}
          className={`
            group flex items-center gap-1.5 px-2 py-1.5 mx-2 rounded-lg
            transition-all duration-150 select-none
            ${isDragging ? "opacity-30" : "opacity-100"}
            ${isDragOver ? "bg-zinc-100 border-t-2 border-zinc-300" : "border-t-2 border-transparent"}
            ${isHidden ? "text-zinc-300" : "text-zinc-600"}
            hover:bg-zinc-50
          `}
          style={{ cursor: "grab" }}
        >
          {/* Drag handle */}
          <span className="shrink-0 text-zinc-300 cursor-grab active:cursor-grabbing">
            <GripIcon />
          </span>

          {/* Icon */}
          <span className={`flex h-4 w-4 shrink-0 items-center justify-center ${isHidden ? "opacity-30" : ""}`}>
            {item.icon}
          </span>

          {/* Label */}
          <span className={`flex-1 truncate text-[13px] leading-5 ${isHidden ? "line-through opacity-40" : ""}`}>
            {item.label}
          </span>

          {/* Visibility toggle */}
          {!item.pinned && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleVisibility(item.id);
              }}
              className={`shrink-0 flex h-5 w-5 items-center justify-center rounded transition-colors ${
                isHidden
                  ? "text-zinc-300 hover:text-zinc-500"
                  : "text-zinc-400 hover:text-zinc-600"
              }`}
              aria-label={isHidden ? `Show ${item.label}` : `Hide ${item.label}`}
            >
              {isHidden ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          )}

          {item.pinned && (
            <span className="shrink-0 text-[9px] text-zinc-300 uppercase tracking-wider">
              pinned
            </span>
          )}
        </div>
      );
    });
  }

  // --- Desktop sidebar ---
  const desktopSidebar = (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-30 w-[200px] border-r border-zinc-200">
      {/* Header */}
      <div className="flex h-12 items-center justify-between px-4">
        <span className="text-[13px] font-semibold tracking-tight text-zinc-600">
          1P OS
        </span>
        <button
          type="button"
          onClick={() => setEditing((prev) => !prev)}
          className={`flex h-6 w-6 items-center justify-center rounded transition-colors duration-200 ${
            editing
              ? "bg-zinc-100 text-zinc-900"
              : "text-zinc-300 hover:text-zinc-500"
          }`}
          aria-label={editing ? "Done editing sidebar" : "Customize sidebar"}
        >
          {editing ? <CloseIcon /> : <PencilIcon />}
        </button>
      </div>

      {/* Main nav */}
      {editing ? (
        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-4 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Drag to reorder, toggle to hide
            </p>
          </div>
          {renderEditItems()}
          <div className="px-4 pt-4">
            <button
              type="button"
              onClick={resetToDefault}
              className="text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              Reset to default
            </button>
          </div>
        </div>
      ) : (
        <nav className="flex-1 space-y-0.5 overflow-y-auto py-2">
          {renderNavItems(visibleItems)}
        </nav>
      )}

      {/* Settings (always at bottom) */}
      <div className="pt-4 pb-2">
        {renderNavItems(BOTTOM_NAV_ITEMS)}
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
        {/* Header with close and edit */}
        <div className="flex h-12 items-center justify-between px-4">
          <span className="text-[13px] font-semibold tracking-tight text-zinc-600">
            1P OS
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setEditing((prev) => !prev)}
              className={`flex h-6 w-6 items-center justify-center rounded transition-colors duration-200 ${
                editing
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-300 hover:text-zinc-500"
              }`}
              aria-label={editing ? "Done editing sidebar" : "Customize sidebar"}
            >
              {editing ? <CloseIcon /> : <PencilIcon />}
            </button>
            <button
              onClick={() => { setMobileOpen(false); setEditing(false); }}
              aria-label="Close menu"
              className="flex h-6 w-6 items-center justify-center text-zinc-500 transition-colors duration-200 hover:text-zinc-600"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Nav */}
        {editing ? (
          <div className="flex-1 overflow-y-auto py-2">
            <div className="px-4 pb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Drag to reorder, toggle to hide
              </p>
            </div>
            {renderEditItems()}
            <div className="px-4 pt-4">
              <button
                type="button"
                onClick={resetToDefault}
                className="text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                Reset to default
              </button>
            </div>
          </div>
        ) : (
          <nav className="flex-1 space-y-0.5 overflow-y-auto py-2">
            {renderNavItems(visibleItems)}
          </nav>
        )}

        <div className="pt-4 pb-2">
          {renderNavItems(BOTTOM_NAV_ITEMS)}
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
