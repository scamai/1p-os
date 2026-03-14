"use client";

import * as React from "react";

// ── Types ──

interface TerminalTab {
  id: string;
  label: string;
  sessionId: string;
}

type SplitMode = "none" | "vertical" | "horizontal";

const PTY_URL = "ws://localhost:3100";

// ── Single Terminal Panel (xterm.js + WebSocket) ──

function TerminalPanel({
  sessionId,
  isFocused,
  onFocus,
  onTitleChange,
}: {
  sessionId: string;
  isFocused: boolean;
  onFocus: () => void;
  onTitleChange?: (title: string) => void;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const termRef = React.useRef<any>(null);
  const wsRef = React.useRef<WebSocket | null>(null);
  const fitRef = React.useRef<any>(null);
  const [status, setStatus] = React.useState<"connecting" | "connected" | "error">("connecting");

  React.useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;

    async function init() {
      // Dynamic import to avoid SSR issues
      const { Terminal } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");
      const { WebLinksAddon } = await import("@xterm/addon-web-links");

      // Load xterm CSS — must load before term.open() for correct sizing
      await new Promise<void>((resolve) => {
        if (document.querySelector('link[href*="xterm"]')) {
          resolve();
          return;
        }
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/css/xterm.min.css";
        link.onload = () => resolve();
        link.onerror = () => resolve(); // continue even if CSS fails
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
          black: "#18181b",
          red: "#f87171",
          green: "#34d399",
          yellow: "#fbbf24",
          blue: "#60a5fa",
          magenta: "#c084fc",
          cyan: "#22d3ee",
          white: "#d4d4d8",
          brightBlack: "#52525b",
          brightRed: "#fca5a5",
          brightGreen: "#6ee7b7",
          brightYellow: "#fde68a",
          brightBlue: "#93c5fd",
          brightMagenta: "#d8b4fe",
          brightCyan: "#67e8f9",
          brightWhite: "#fafafa",
        },
        scrollback: 10000,
        allowProposedApi: true,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(new WebLinksAddon());

      termRef.current = term;
      fitRef.current = fitAddon;

      term.open(containerRef.current!);
      fitAddon.fit();

      // Connect WebSocket
      const cols = term.cols;
      const rows = term.rows;
      const ws = new WebSocket(`${PTY_URL}?session=${sessionId}&cols=${cols}&rows=${rows}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!disposed) {
          setStatus("connected");
          // Focus terminal so keystrokes work immediately
          setTimeout(() => term.focus(), 100);
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "ready") {
            term.focus();
          } else if (msg.type === "output") {
            term.write(msg.data);
          } else if (msg.type === "exit") {
            term.write(`\r\n[Process exited with code ${msg.code}]\r\n`);
          }
        } catch {
          // Raw data
          term.write(event.data);
        }
      };

      ws.onerror = () => {
        if (!disposed) setStatus("error");
        term.write("\r\n\x1b[31m[Connection error — is pty-server running?]\x1b[0m\r\n");
        term.write("\x1b[90mRun: node scripts/pty-server.mjs\x1b[0m\r\n");
      };

      ws.onclose = () => {
        if (!disposed) setStatus("error");
      };

      // Terminal → PTY
      term.onData((data: string) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "input", data }));
        }
      });

      // Handle resize
      const resizeObserver = new ResizeObserver(() => {
        try {
          fitAddon.fit();
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
          }
        } catch {
          // ignore
        }
      });
      resizeObserver.observe(containerRef.current!);

      // Track title changes (shows current directory / process)
      term.onTitleChange((title: string) => {
        onTitleChange?.(title);
      });

      return () => {
        resizeObserver.disconnect();
      };
    }

    init();

    return () => {
      disposed = true;
      wsRef.current?.close();
      termRef.current?.dispose();
    };
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus terminal when panel is focused
  React.useEffect(() => {
    if (isFocused && termRef.current) {
      termRef.current.focus();
    }
  }, [isFocused]);

  return (
    <div
      className={`relative h-full bg-[#09090b] ${isFocused ? "ring-1 ring-emerald-500/30 ring-inset" : ""}`}
      onClick={() => {
        onFocus();
        termRef.current?.focus();
      }}
    >
      {status === "error" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90 gap-3">
          <p className="text-sm text-zinc-400">PTY server not running</p>
          <code className="rounded bg-zinc-800 px-3 py-1.5 text-[12px] text-emerald-400 font-mono">
            node scripts/pty-server.mjs
          </code>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-[12px] text-zinc-500 hover:text-zinc-300 underline"
          >
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

// ── Multi-tab Terminal ──

let tabCounter = 0;
function newTabId() {
  tabCounter++;
  return String(tabCounter);
}

export function Terminal() {
  const [tabs, setTabs] = React.useState<TerminalTab[]>(() => {
    const id = newTabId();
    return [{ id, label: "zsh", sessionId: crypto.randomUUID() }];
  });
  const [activeTab, setActiveTab] = React.useState(tabs[0].id);
  const [splitMode, setSplitMode] = React.useState<SplitMode>("none");
  const [splitTab, setSplitTab] = React.useState<TerminalTab | null>(null);
  const [focusSide, setFocusSide] = React.useState<"main" | "split">("main");

  const addTab = React.useCallback(() => {
    const id = newTabId();
    const tab: TerminalTab = { id, label: "zsh", sessionId: crypto.randomUUID() };
    setTabs((t) => [...t, tab]);
    setActiveTab(id);
  }, []);

  const closeTab = React.useCallback(
    (id: string) => {
      if (splitTab?.id === id) {
        setSplitTab(null);
        setSplitMode("none");
      }
      setTabs((prev) => {
        const next = prev.filter((t) => t.id !== id);
        if (next.length === 0) {
          const newId = newTabId();
          return [{ id: newId, label: "zsh", sessionId: crypto.randomUUID() }];
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
    (mode: SplitMode) => {
      if (splitMode === mode) {
        setSplitMode("none");
        setSplitTab(null);
      } else {
        setSplitMode(mode);
        if (!splitTab) {
          const id = newTabId();
          const tab: TerminalTab = { id, label: "zsh", sessionId: crypto.randomUUID() };
          setTabs((t) => [...t, tab]);
          setSplitTab(tab);
        }
      }
    },
    [splitMode, splitTab]
  );

  const updateTabLabel = React.useCallback(
    (tabId: string, title: string) => {
      // Extract short name from title (usually "user@host: /path")
      const short = title.split(":").pop()?.trim().split("/").pop() || title;
      setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, label: short || t.label } : t)));
    },
    []
  );

  // Keyboard shortcuts
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "t" && !e.shiftKey) {
        e.preventDefault();
        addTab();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "w") {
        e.preventDefault();
        const target = focusSide === "split" && splitTab ? splitTab.id : activeTab;
        closeTab(target);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "d" && !e.shiftKey) {
        e.preventDefault();
        toggleSplit("vertical");
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "D" || e.key === "d")) {
        if (e.shiftKey) {
          e.preventDefault();
          toggleSplit("horizontal");
        }
      }
      // Cmd+1-9 switch tabs
      if ((e.metaKey || e.ctrlKey) && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (tabs[idx]) setActiveTab(tabs[idx].id);
      }
      // Cmd+] / Cmd+[ to switch focus in split
      if ((e.metaKey || e.ctrlKey) && e.key === "]") {
        e.preventDefault();
        setFocusSide((s) => (s === "main" ? "split" : "main"));
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "[") {
        e.preventDefault();
        setFocusSide((s) => (s === "main" ? "split" : "main"));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [addTab, closeTab, activeTab, toggleSplit, tabs, focusSide, splitTab]);

  const activeTabData = tabs.find((t) => t.id === activeTab);

  return (
    <div className="flex h-full flex-col bg-zinc-950 rounded-lg overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center border-b border-zinc-800 bg-zinc-900/80 h-9 shrink-0">
        <div className="flex flex-1 items-center overflow-x-auto">
          {tabs
            .filter((t) => t.id !== splitTab?.id) // Don't show split tab in tab bar
            .map((tab, i) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                onDoubleClick={() => {
                  const name = prompt("Rename tab:", tab.label);
                  if (name) setTabs((prev) => prev.map((t) => (t.id === tab.id ? { ...t, label: name } : t)));
                }}
                className={`group relative flex h-9 items-center gap-1.5 px-3 text-[12px] font-mono transition-colors shrink-0 border-r border-zinc-800/50 ${
                  activeTab === tab.id
                    ? "bg-zinc-950 text-zinc-200"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                }`}
              >
                <span className="text-[10px] text-zinc-600">{i + 1}</span>
                <span className="max-w-[100px] truncate">{tab.label}</span>
                {tabs.length > 1 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="ml-0.5 hidden group-hover:flex h-4 w-4 items-center justify-center rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700 cursor-pointer"
                  >
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </span>
                )}
                {activeTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-px bg-emerald-500" />}
              </button>
            ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 px-2 shrink-0">
          <button
            onClick={addTab}
            className="flex h-6 w-6 items-center justify-center rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            title="New tab (⌘T)"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button
            onClick={() => toggleSplit("vertical")}
            className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${splitMode === "vertical" ? "text-emerald-400 bg-zinc-800" : "text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800"}`}
            title="Split vertical (⌘D)"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="12" y1="3" x2="12" y2="21" />
            </svg>
          </button>
          <button
            onClick={() => toggleSplit("horizontal")}
            className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${splitMode === "horizontal" ? "text-emerald-400 bg-zinc-800" : "text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800"}`}
            title="Split horizontal (⌘⇧D)"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="12" x2="21" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Terminal panels */}
      <div
        className={`flex-1 min-h-0 ${
          splitMode === "vertical" ? "flex flex-row" : splitMode === "horizontal" ? "flex flex-col" : ""
        }`}
      >
        {/* Main panel */}
        {activeTabData && (
          <div className={splitMode !== "none" ? "flex-1 min-h-0 min-w-0" : "h-full"}>
            <TerminalPanel
              key={activeTabData.sessionId}
              sessionId={activeTabData.sessionId}
              isFocused={focusSide === "main"}
              onFocus={() => setFocusSide("main")}
              onTitleChange={(t) => updateTabLabel(activeTabData.id, t)}
            />
          </div>
        )}

        {/* Split divider + panel */}
        {splitMode !== "none" && splitTab && (
          <>
            <div className={`${splitMode === "vertical" ? "w-px" : "h-px"} bg-zinc-700 shrink-0`} />
            <div className="flex-1 min-h-0 min-w-0">
              <TerminalPanel
                key={splitTab.sessionId}
                sessionId={splitTab.sessionId}
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
          ⌘T new · ⌘W close · ⌘D split · ⌘] switch pane
        </span>
      </div>
    </div>
  );
}
