"use client";

import * as React from "react";
import { AgentGrid, type AgentGridItem } from "@/components/team/AgentGrid";
import { AgentDetail } from "@/components/team/AgentDetail";
import { AgentChat } from "@/components/team/AgentChat";
import type { AgentStatus } from "@/components/company/AgentStatusDot";

interface TeamAgent extends AgentGridItem {
  level: string;
  hoursSaved: number;
  costTotal: number;
  decisionsEscalated: number;
  approvalRate: number;
  activityLog: string[];
}

interface TeamViewProps {
  agents: TeamAgent[];
}

function TeamView({ agents }: TeamViewProps) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [chatAgentId, setChatAgentId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<
    { id: string; role: "user" | "agent"; content: string; timestamp: string }[]
  >([]);
  const [chatLoading, setChatLoading] = React.useState(false);

  const selected = agents.find((a) => a.id === selectedId);
  const chatAgent = agents.find((a) => a.id === chatAgentId);

  const handleSendMessage = async (content: string) => {
    if (!chatAgentId) return;

    const userMsg = {
      id: Date.now().toString(),
      role: "user" as const,
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: chatAgentId, message: content }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "agent",
          content: data.response ?? "No response.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "agent",
          content: "Sorry, something went wrong.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleTogglePause = async (agentId: string) => {
    await fetch(`/api/agents/${agentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_pause" }),
    });
  };

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
        Team
      </h1>

      <AgentGrid agents={agents} onSelect={setSelectedId} />

      {selected && (
        <AgentDetail
          agent={selected}
          onClose={() => setSelectedId(null)}
          onChat={(id) => {
            setChatAgentId(id);
            setMessages([]);
            setSelectedId(null);
          }}
          onTogglePause={handleTogglePause}
        />
      )}

      {chatAgent && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-[var(--border)] bg-[var(--background)] shadow-xl">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2">
              <span className="text-sm font-medium text-[var(--foreground)]">
                Chat with {chatAgent.name}
              </span>
              <button
                onClick={() => setChatAgentId(null)}
                className="rounded-sm p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 1l12 12M13 1L1 13" />
                </svg>
              </button>
            </div>
            <div className="flex-1">
              <AgentChat
                agentName={chatAgent.name}
                agentInitial={chatAgent.initial}
                messages={messages}
                onSend={handleSendMessage}
                loading={chatLoading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { TeamView };
