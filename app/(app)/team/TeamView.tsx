"use client";

import * as React from "react";
import { AgentGrid, type AgentGridItem } from "@/components/team/AgentGrid";
import { AgentDetail } from "@/components/team/AgentDetail";
import { AgentChat } from "@/components/team/AgentChat";
import { SkillsPanel } from "@/components/sections/team/SkillsPanel";
import { BrowserPanel } from "@/components/sections/team/BrowserPanel";
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

const DEMO_AGENTS: TeamAgent[] = [
  {
    id: "demo-sales",
    name: "Sales Agent",
    role: "Sales",
    initial: "S",
    status: "working",
    tasksCompleted: 12,
    costToday: 0.45,
    level: "Standard",
    hoursSaved: 24,
    costTotal: 8.50,
    decisionsEscalated: 2,
    approvalRate: 95,
    activityLog: ["Closed lead from Globex Inc", "Drafted proposal for Acme Corp", "Updated CRM pipeline"],
  },
  {
    id: "demo-support",
    name: "Support Agent",
    role: "Customer Support",
    initial: "C",
    status: "working",
    tasksCompleted: 28,
    costToday: 0.32,
    level: "Standard",
    hoursSaved: 40,
    costTotal: 12.10,
    decisionsEscalated: 1,
    approvalRate: 98,
    activityLog: ["Resolved 4 tickets overnight", "Escalated billing issue", "Updated FAQ"],
  },
  {
    id: "demo-content",
    name: "Content Agent",
    role: "Content & Marketing",
    initial: "M",
    status: "idle",
    tasksCompleted: 8,
    costToday: 0.18,
    level: "Standard",
    hoursSaved: 15,
    costTotal: 5.20,
    decisionsEscalated: 0,
    approvalRate: 100,
    activityLog: ["Published blog post", "Scheduled 3 social posts"],
  },
  {
    id: "demo-ops",
    name: "Ops Agent",
    role: "Operations",
    initial: "O",
    status: "needs_input",
    tasksCompleted: 6,
    costToday: 0.08,
    level: "Standard",
    hoursSaved: 10,
    costTotal: 3.40,
    decisionsEscalated: 3,
    approvalRate: 90,
    activityLog: ["Budget alert: approaching limit", "Filed expense report"],
  },
];

function dispatchAppAction(action: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("app-action", { detail: { action } }));
  }
}

function TeamView({ agents: serverAgents }: TeamViewProps) {
  // Use server agents if available, otherwise show demo agents
  const agents = serverAgents.length > 0 ? serverAgents : DEMO_AGENTS;

  const [localAgents, setLocalAgents] = React.useState(agents);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [chatAgentId, setChatAgentId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<
    { id: string; role: "user" | "agent"; content: string; timestamp: string }[]
  >([]);
  const [chatLoading, setChatLoading] = React.useState(false);

  const selected = localAgents.find((a) => a.id === selectedId);
  const chatAgent = localAgents.find((a) => a.id === chatAgentId);

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

  const handleDeleteAgent = async (agentId: string) => {
    // For demo agents, just remove from local state
    if (agentId.startsWith("demo-")) {
      setLocalAgents((prev) => prev.filter((a) => a.id !== agentId));
      setSelectedId(null);
      return;
    }
    // For real agents, call the API
    try {
      await fetch(`/api/agents/${agentId}`, { method: "DELETE" });
      setSelectedId(null);
      // Trigger page refresh to refetch agents
      window.location.reload();
    } catch {
      // Silently fail
    }
  };

  const handleHireAgent = () => dispatchAppAction("hire_agent");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-black">Team</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleHireAgent}
            className="text-sm text-black/50 transition-colors hover:text-black"
          >
            + Hire Agent
          </button>
        </div>
      </div>

      <AgentGrid agents={localAgents} onSelect={setSelectedId} onDelete={handleDeleteAgent} onHireAgent={handleHireAgent} />

      <SkillsPanel />

      <BrowserPanel />

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
          onDelete={handleDeleteAgent}
        />
      )}

      {chatAgent && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-black/[0.08] bg-white shadow-xl">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-black/[0.08] px-4 py-2">
              <span className="text-sm font-medium text-black">
                Chat with {chatAgent.name}
              </span>
              <button
                onClick={() => setChatAgentId(null)}
                className="rounded-sm p-1 text-black/50 hover:text-black"
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
