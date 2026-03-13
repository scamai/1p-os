"use client";

import * as React from "react";
import { Header } from "@/components/shell/Header";
import { CommandBar } from "@/components/shell/CommandBar";
import { KillSwitch } from "@/components/shell/KillSwitch";
import { AgentSidebar, type AgentSidebarAgent } from "@/components/company/AgentSidebar";

interface AppShellProps {
  headerProps: {
    revenue: number;
    freedomHours: number;
    healthScore: number;
    costToday: number;
    budgetDaily: number;
  };
  agents: AgentSidebarAgent[];
  children: React.ReactNode;
}

function AppShell({ headerProps, agents, children }: AppShellProps) {
  const [killSwitchOpen, setKillSwitchOpen] = React.useState(false);

  const handleKillConfirm = async (level: string, agentId?: string) => {
    await fetch("/api/safety/kill-switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, agentId }),
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        {...headerProps}
        onKillSwitch={() => setKillSwitchOpen(true)}
      />
      <CommandBar />
      <KillSwitch
        open={killSwitchOpen}
        onClose={() => setKillSwitchOpen(false)}
        onConfirm={handleKillConfirm}
        agents={agents.map((a) => ({ id: a.id, name: a.name }))}
      />
      <div className="flex flex-1">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
        <AgentSidebar agents={agents} />
      </div>
    </div>
  );
}

export { AppShell };
