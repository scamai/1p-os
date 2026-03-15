"use client";

import * as React from "react";

// ── Types ──

interface TerminalTab {
  id: string;
  label: string;
  sessionId: string;
  cwd: string;
}

interface QuickDir {
  label: string;
  path: string;
}

type SplitMode = "none" | "vertical" | "horizontal";

const PTY_URL = "ws://localhost:3100";
const STORAGE_KEY = "1pos-terminal";

// ── Persistence ──

interface TerminalStore {
  bookmarks: QuickDir[];
  recentDirs: string[];
}

function loadStore(): TerminalStore {
  if (typeof window === "undefined") return { bookmarks: [], recentDirs: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { bookmarks: [], recentDirs: [] };
  } catch {
    return { bookmarks: [], recentDirs: [] };
  }
}

function saveStore(store: TerminalStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

function addRecentDir(dir: string) {
  const store = loadStore();
  store.recentDirs = [dir, ...store.recentDirs.filter((d) => d !== dir)].slice(0, 10);
  saveStore(store);
}

function addBookmark(label: string, path: string) {
  const store = loadStore();
  if (!store.bookmarks.find((b) => b.path === path)) {
    store.bookmarks.push({ label, path });
    saveStore(store);
  }
}

function removeBookmark(path: string) {
  const store = loadStore();
  store.bookmarks = store.bookmarks.filter((b) => b.path !== path);
  saveStore(store);
}

// ── Single Terminal Panel ──

function TerminalPanel({
  sessionId,
  cwd,
  isFocused,
  onFocus,
  onTitleChange,
}: {
  sessionId: string;
  cwd: string;
  isFocused: boolean;
  onFocus: () => void;
  onTitleChange?: (title: string) => void;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const termRef = React.useRef<any>(null);
  const wsRef = React.useRef<WebSocket | null>(null);
  const [status, setStatus] = React.useState<"connecting" | "connected" | "error">("connecting");

  React.useEffect(() => {
    if (!containerRef.current) return;
    let disposed = false;

    async function init() {
      const { Terminal } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");
      const { WebLinksAddon } = await import("@xterm/addon-web-links");

      await new Promise<void>((resolve) => {
        if (document.querySelector('link[href*="xterm"]')) { resolve(); return; }
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/css/xterm.min.css";
        link.onload = () => resolve();
        link.onerror = () => resolve();
        document.head.appendChild(link);
      });

      if (disposed) return;

      const term = new Terminal({
        cursorBlink: true,
        cursorStyle: "bar",
        fontSize: 13,
        fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', Menlo, monospace",
        lineHeight: 1.35,
        theme: {
          background: "#09090b",
          foreground: "#d4d4d8",
          cursor: "#34d399",
          cursorAccent: "#09090b",
          selectionBackground: "#3f3f4660",
          black: "#18181b", red: "#f87171", green: "#34d399", yellow: "#fbbf24",
          blue: "#60a5fa", magenta: "#c084fc", cyan: "#22d3ee", white: "#d4d4d8",
          brightBlack: "#52525b", brightRed: "#fca5a5", brightGreen: "#6ee7b7",
          brightYellow: "#fde68a", brightBlue: "#93c5fd", brightMagenta: "#d8b4fe",
          brightCyan: "#67e8f9", brightWhite: "#fafafa",
        },
        scrollback: 10000,
        allowProposedApi: true,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(new WebLinksAddon());
      termRef.current = term;

      term.open(containerRef.current!);
      fitAddon.fit();

      const encodedCwd = encodeURIComponent(cwd);
      const ws = new WebSocket(
        `${PTY_URL}?session=${sessionId}&cols=${term.cols}&rows=${term.rows}&cwd=${encodedCwd}`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        if (!disposed) setStatus("connected");
        setTimeout(() => term.focus(), 100);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "ready") term.focus();
          else if (msg.type === "output") term.write(msg.data);
          else if (msg.type === "exit") term.write(`\r\n[exited ${msg.code}]\r\n`);
        } catch { term.write(event.data); }
      };

      ws.onerror = () => {
        if (!disposed) setStatus("error");
        term.write("\r\n\x1b[31m[PTY server not running]\x1b[0m\r\n");
        term.write("\x1b[90mpython3 scripts/pty-server.py\x1b[0m\r\n");
      };

      ws.onclose = () => { if (!disposed) setStatus("error"); };

      term.onData((data: string) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "input", data }));
        }
      });

      term.onTitleChange((title: string) => onTitleChange?.(title));

      const ro = new ResizeObserver(() => {
        try {
          fitAddon.fit();
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
          }
        } catch {}
      });
      ro.observe(containerRef.current!);
      return () => ro.disconnect();
    }

    init();
    return () => { disposed = true; wsRef.current?.close(); termRef.current?.dispose(); };
  }, [sessionId, cwd]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (isFocused) termRef.current?.focus();
  }, [isFocused]);

  return (
    <div
      className={`relative h-full bg-[#09090b] ${isFocused ? "ring-1 ring-emerald-500/30 ring-inset" : ""}`}
      onClick={() => { onFocus(); termRef.current?.focus(); }}
    >
      {status === "error" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90 gap-3">
          <p className="text-sm text-zinc-400">PTY server not running</p>
          <code className="rounded bg-zinc-800 px-3 py-1.5 text-[12px] text-emerald-400 font-mono">
            python3 scripts/pty-server.py
          </code>
          <button onClick={() => window.location.reload()} className="mt-2 text-[12px] text-zinc-500 hover:text-zinc-300 underline">
            Retry
          </button>
        </div>
      )}
      {status === "connecting" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-400" />
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" style={{ minHeight: "100px" }} />
    </div>
  );
}

// ── Quick Launch Menu ──

function QuickLaunch({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (cwd: string, label?: string) => void;
}) {
  const [store, setStore] = React.useState<TerminalStore>({ bookmarks: [], recentDirs: [] });
  const [customPath, setCustomPath] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setStore(loadStore());
      setCustomPath("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const defaultDirs: QuickDir[] = [
    { label: "Project root", path: process.env.NEXT_PUBLIC_APP_URL ? "." : "/Users" },
    { label: "Home", path: "~" },
    { label: "Desktop", path: "~/Desktop" },
    { label: "Downloads", path: "~/Downloads" },
  ];

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[380px] rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-zinc-800">
          <p className="text-[12px] font-medium text-zinc-400">Open terminal in...</p>
          <div className="mt-2 flex gap-1">
            <input
              ref={inputRef}
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customPath.trim()) {
                  onSelect(customPath.trim());
                  onClose();
                }
                if (e.key === "Escape") onClose();
              }}
              placeholder="/path/to/project"
              className="flex-1 rounded bg-zinc-800 px-2.5 py-1.5 text-[12px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 font-mono"
            />
            <button
              onClick={() => {
                if (customPath.trim()) { onSelect(customPath.trim()); onClose(); }
              }}
              className="rounded bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-500"
            >
              Open
            </button>
          </div>
        </div>

        {/* Bookmarks */}
        {store.bookmarks.length > 0 && (
          <div className="px-2 py-2 border-b border-zinc-800/50">
            <p className="px-2 text-[10px] font-medium text-zinc-500 uppercase mb-1">Bookmarks</p>
            {store.bookmarks.map((b) => (
              <div key={b.path} className="flex items-center group">
                <button
                  onClick={() => { onSelect(b.path, b.label); onClose(); }}
                  className="flex-1 flex items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                  <span className="truncate">{b.label}</span>
                  <span className="text-[10px] text-zinc-600 truncate ml-auto font-mono">{b.path}</span>
                </button>
                <button
                  onClick={() => { removeBookmark(b.path); setStore(loadStore()); }}
                  className="hidden group-hover:flex h-5 w-5 items-center justify-center rounded text-zinc-600 hover:text-red-400"
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Recent dirs */}
        {store.recentDirs.length > 0 && (
          <div className="px-2 py-2 border-b border-zinc-800/50">
            <p className="px-2 text-[10px] font-medium text-zinc-500 uppercase mb-1">Recent</p>
            {store.recentDirs.slice(0, 5).map((dir) => (
              <button
                key={dir}
                onClick={() => { onSelect(dir); onClose(); }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors font-mono"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                <span className="truncate">{dir}</span>
              </button>
            ))}
          </div>
        )}

        {/* Quick dirs */}
        <div className="px-2 py-2">
          <p className="px-2 text-[10px] font-medium text-zinc-500 uppercase mb-1">Quick</p>
          {defaultDirs.map((d) => (
            <button
              key={d.path}
              onClick={() => { onSelect(d.path, d.label); onClose(); }}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
              <span>{d.label}</span>
              <span className="text-[10px] text-zinc-600 ml-auto font-mono">{d.path}</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-zinc-800 text-[10px] text-zinc-600">
          ⌘N open here · ⌘B bookmark current dir
        </div>
      </div>
    </div>
  );
}

// ── Multi-tab Terminal ──

let tabCounter = 0;
function newTabId() { tabCounter++; return String(tabCounter); }

export function Terminal() {
  const [tabs, setTabs] = React.useState<TerminalTab[]>(() => {
    const id = newTabId();
    return [{ id, label: "zsh", sessionId: crypto.randomUUID(), cwd: "" }];
  });
  const [activeTab, setActiveTab] = React.useState(tabs[0].id);
  const [splitMode, setSplitMode] = React.useState<SplitMode>("none");
  const [splitTab, setSplitTab] = React.useState<TerminalTab | null>(null);
  const [focusSide, setFocusSide] = React.useState<"main" | "split">("main");
  const [quickLaunchOpen, setQuickLaunchOpen] = React.useState(false);
  const [quickLaunchTarget, setQuickLaunchTarget] = React.useState<"tab" | "split">("tab");

  const addTab = React.useCallback((cwd = "", label?: string) => {
    const id = newTabId();
    const tab: TerminalTab = { id, label: label || "zsh", sessionId: crypto.randomUUID(), cwd };
    setTabs((t) => [...t, tab]);
    setActiveTab(id);
    if (cwd) addRecentDir(cwd);
  }, []);

  const closeTab = React.useCallback(
    (id: string) => {
      if (splitTab?.id === id) { setSplitTab(null); setSplitMode("none"); }
      setTabs((prev) => {
        const next = prev.filter((t) => t.id !== id);
        if (next.length === 0) {
          const newId = newTabId();
          return [{ id: newId, label: "zsh", sessionId: crypto.randomUUID(), cwd: "" }];
        }
        return next;
      });
      if (activeTab === id) {
        setActiveTab((prev) => {
          const remaining = tabs.filter((t) => t.id !== id);
          return remaining[0]?.id ?? "1";
        });
      }
    },
    [activeTab, tabs, splitTab]
  );

  const toggleSplit = React.useCallback(
    (mode: SplitMode, cwd = "") => {
      if (splitMode === mode) { setSplitMode("none"); setSplitTab(null); }
      else {
        setSplitMode(mode);
        if (!splitTab) {
          const id = newTabId();
          const tab: TerminalTab = { id, label: "zsh", sessionId: crypto.randomUUID(), cwd };
          setTabs((t) => [...t, tab]);
          setSplitTab(tab);
        }
      }
    },
    [splitMode, splitTab]
  );

  const updateTabLabel = React.useCallback((tabId: string, title: string) => {
    const short = title.split(":").pop()?.trim().split("/").pop() || title;
    setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, label: short || t.label } : t)));
  }, []);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd+T — new tab
      if ((e.metaKey || e.ctrlKey) && e.key === "t" && !e.shiftKey) {
        e.preventDefault(); addTab();
      }
      // Cmd+W — close tab
      if ((e.metaKey || e.ctrlKey) && e.key === "w") {
        e.preventDefault();
        closeTab(focusSide === "split" && splitTab ? splitTab.id : activeTab);
      }
      // Cmd+D — split vertical
      if ((e.metaKey || e.ctrlKey) && e.key === "d" && !e.shiftKey) {
        e.preventDefault(); toggleSplit("vertical");
      }
      // Cmd+Shift+D — split horizontal
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault(); toggleSplit("horizontal");
      }
      // Cmd+N — quick launch (new tab in specific dir)
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        setQuickLaunchTarget("tab");
        setQuickLaunchOpen(true);
      }
      // Cmd+B — bookmark current (placeholder — needs cwd tracking)
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        const name = prompt("Bookmark name:");
        const path = prompt("Path:");
        if (name && path) addBookmark(name, path);
      }
      // Cmd+1-9 — switch tabs
      if ((e.metaKey || e.ctrlKey) && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        const visibleTabs = tabs.filter((t) => t.id !== splitTab?.id);
        if (visibleTabs[idx]) setActiveTab(visibleTabs[idx].id);
      }
      // Cmd+] / Cmd+[ — switch split pane
      if ((e.metaKey || e.ctrlKey) && (e.key === "]" || e.key === "[")) {
        e.preventDefault();
        setFocusSide((s) => (s === "main" ? "split" : "main"));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [addTab, closeTab, activeTab, toggleSplit, tabs, focusSide, splitTab]);

  const activeTabData = tabs.find((t) => t.id === activeTab);

  return (
    <div className="relative flex h-full flex-col bg-zinc-950 rounded-lg overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center border-b border-zinc-800 bg-zinc-900/80 h-9 shrink-0">
        <div className="flex flex-1 items-center overflow-x-auto">
          {tabs
            .filter((t) => t.id !== splitTab?.id)
            .map((tab, i) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                onDoubleClick={() => {
                  const name = prompt("Rename tab:", tab.label);
                  if (name) setTabs((prev) => prev.map((t) => (t.id === tab.id ? { ...t, label: name } : t)));
                }}
                className={`group relative flex h-9 items-center gap-1.5 px-3 text-[12px] font-mono transition-colors shrink-0 border-r border-zinc-800/50 ${
                  activeTab === tab.id ? "bg-zinc-950 text-zinc-200" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                }`}
              >
                <span className="text-[10px] text-zinc-600">{i + 1}</span>
                <span className="max-w-[100px] truncate">{tab.label}</span>
                {tab.cwd && <span className="text-[9px] text-zinc-700 truncate max-w-[60px]">{tab.cwd.split("/").pop()}</span>}
                {tabs.length > 1 && (
                  <span
                    onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                    className="ml-0.5 hidden group-hover:flex h-4 w-4 items-center justify-center rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700 cursor-pointer"
                  >
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </span>
                )}
                {activeTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-px bg-emerald-500" />}
              </button>
            ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 px-2 shrink-0">
          <button onClick={() => addTab()} className="flex h-6 w-6 items-center justify-center rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800" title="New tab (⌘T)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
          <button
            onClick={() => { setQuickLaunchTarget("tab"); setQuickLaunchOpen(true); }}
            className="flex h-6 w-6 items-center justify-center rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800"
            title="Open in folder (⌘N)"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
          </button>
          <button
            onClick={() => toggleSplit("vertical")}
            className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${splitMode === "vertical" ? "text-emerald-400 bg-zinc-800" : "text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800"}`}
            title="Split (⌘D)"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="12" y1="3" x2="12" y2="21" /></svg>
          </button>
          <button
            onClick={() => toggleSplit("horizontal")}
            className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${splitMode === "horizontal" ? "text-emerald-400 bg-zinc-800" : "text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800"}`}
            title="Split H (⌘⇧D)"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="12" x2="21" y2="12" /></svg>
          </button>
        </div>
      </div>

      {/* Terminal panels */}
      <div className={`flex-1 min-h-0 ${splitMode === "vertical" ? "flex flex-row" : splitMode === "horizontal" ? "flex flex-col" : ""}`}>
        {activeTabData && (
          <div className={splitMode !== "none" ? "flex-1 min-h-0 min-w-0" : "h-full"}>
            <TerminalPanel
              key={activeTabData.sessionId}
              sessionId={activeTabData.sessionId}
              cwd={activeTabData.cwd}
              isFocused={focusSide === "main"}
              onFocus={() => setFocusSide("main")}
              onTitleChange={(t) => updateTabLabel(activeTabData.id, t)}
            />
          </div>
        )}
        {splitMode !== "none" && splitTab && (
          <>
            <div className={`${splitMode === "vertical" ? "w-px" : "h-px"} bg-zinc-700 shrink-0`} />
            <div className="flex-1 min-h-0 min-w-0">
              <TerminalPanel
                key={splitTab.sessionId}
                sessionId={splitTab.sessionId}
                cwd={splitTab.cwd}
                isFocused={focusSide === "split"}
                onFocus={() => setFocusSide("split")}
                onTitleChange={(t) => updateTabLabel(splitTab.id, t)}
              />
            </div>
          </>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-zinc-800 px-3 py-1 bg-zinc-900/50 shrink-0">
        <span className="text-[10px] text-zinc-600">
          {tabs.length} tab{tabs.length !== 1 ? "s" : ""}
          {splitMode !== "none" && " · split"}
        </span>
        <span className="text-[10px] text-zinc-700">
          ⌘T new · ⌘N open in dir · ⌘D split · ⌘B bookmark · ⌘] switch pane
        </span>
      </div>

      {/* Quick launch overlay */}
      <QuickLaunch
        open={quickLaunchOpen}
        onClose={() => setQuickLaunchOpen(false)}
        onSelect={(cwd, label) => {
          if (quickLaunchTarget === "tab") {
            addTab(cwd, label);
          } else {
            toggleSplit("vertical", cwd);
          }
        }}
      />
    </div>
  );
}
