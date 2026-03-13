"use client";

import * as React from "react";
import { AISummary } from "@/components/shared/AISummary";
import { TabBar } from "@/components/shared/TabBar";

const TABS = ["Schedules", "Webhooks", "Triggers"] as const;
type AutomationTab = (typeof TABS)[number];

interface Schedule {
  id: string;
  name: string;
  schedule: string;
  agent: string;
  status: "Active" | "Paused";
}

interface IncomingWebhook {
  id: string;
  method: string;
  url: string;
  description: string;
  callsToday: number;
}

interface OutgoingWebhook {
  id: string;
  description: string;
  lastFired: string;
}

interface Trigger {
  id: string;
  condition: string;
  action: string;
}

const MOCK_SCHEDULES: Schedule[] = [
  {
    id: "1",
    name: "Morning Briefing",
    schedule: "Every day 8:00 AM",
    agent: "Admin",
    status: "Active",
  },
  {
    id: "2",
    name: "Invoice Reminders",
    schedule: "Every Monday 9:00 AM",
    agent: "Finance",
    status: "Active",
  },
  {
    id: "3",
    name: "Weekly Report",
    schedule: "Every Friday 5:00 PM",
    agent: "Analytics",
    status: "Paused",
  },
  {
    id: "4",
    name: "Lead Follow-up",
    schedule: "Every 2 hours",
    agent: "Sales",
    status: "Active",
  },
];

const MOCK_INCOMING_WEBHOOKS: IncomingWebhook[] = [
  {
    id: "1",
    method: "POST",
    url: "/api/webhooks/stripe-events",
    description: "Stripe payment events",
    callsToday: 142,
  },
  {
    id: "2",
    method: "POST",
    url: "/api/webhooks/github",
    description: "GitHub repo events",
    callsToday: 23,
  },
  {
    id: "3",
    method: "POST",
    url: "/api/webhooks/custom/lead-form",
    description: "Website lead form",
    callsToday: 8,
  },
];

const MOCK_OUTGOING_WEBHOOKS: OutgoingWebhook[] = [
  {
    id: "1",
    description: "Notify Slack on new client",
    lastFired: "2h ago",
  },
  {
    id: "2",
    description: "Update CRM on invoice paid",
    lastFired: "1d ago",
  },
];

const MOCK_TRIGGERS: Trigger[] = [
  {
    id: "1",
    condition: "When invoice overdue > 7 days",
    action: "Sales Agent sends reminder",
  },
  {
    id: "2",
    condition: "When new lead from website",
    action: "Sales Agent qualifies within 1 hour",
  },
  {
    id: "3",
    condition: "When agent budget > 80%",
    action: "Alert founder via all channels",
  },
  {
    id: "4",
    condition: "When contract expires in 30 days",
    action: "Legal Agent drafts renewal",
  },
];

interface AutomationsPageProps {
  onAction?: (action: string) => void;
}

function AutomationsPage({ onAction }: AutomationsPageProps) {
  const [activeTab, setActiveTab] = React.useState<AutomationTab>("Schedules");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-lg font-semibold text-zinc-900">Automations</h1>
      <div className="mt-2">
        <AISummary section="automations" />
      </div>

      <div className="mt-6">
        <TabBar
          tabs={TABS as unknown as string[]}
          active={activeTab}
          onChange={(tab) => setActiveTab(tab as AutomationTab)}
        />
      </div>

      <div className="mt-8">
        {activeTab === "Schedules" && <SchedulesTab onAction={onAction} />}
        {activeTab === "Webhooks" && <WebhooksTab onAction={onAction} />}
        {activeTab === "Triggers" && <TriggersTab onAction={onAction} />}
      </div>
    </div>
  );
}

function SchedulesTab({ onAction }: { onAction?: (action: string) => void }) {
  return (
    <div>
      <div className="flex flex-col">
        {MOCK_SCHEDULES.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between py-3 transition-colors duration-200 hover:bg-zinc-50"
          >
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[14px] text-zinc-800">{item.name}</p>
                <p className="mt-0.5 text-[12px]">
                  <span className="font-mono text-zinc-500">
                    {item.schedule}
                  </span>
                  <span className="mx-1.5 text-zinc-700">&middot;</span>
                  <span className="text-zinc-500">{item.agent}</span>
                </p>
              </div>
            </div>
            <span
              className={`text-[12px] ${
                item.status === "Active" ? "text-zinc-500" : "text-zinc-600"
              }`}
            >
              {item.status}
            </span>
          </div>
        ))}
      </div>
      <button
        className="mt-4 text-[13px] text-zinc-500 transition-colors duration-200 hover:text-zinc-600"
        onClick={() => {
          console.log("[AutomationsPage] new_schedule action");
          onAction?.("new_schedule");
        }}
      >
        + New Schedule
      </button>
    </div>
  );
}

function WebhooksTab({ onAction }: { onAction?: (action: string) => void }) {
  return (
    <div>
      {/* Incoming */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-600">
          Incoming
        </p>
        <div className="mt-3 flex flex-col">
          {MOCK_INCOMING_WEBHOOKS.map((wh) => (
            <div
              key={wh.id}
              className="flex items-center justify-between py-3 transition-colors duration-200 hover:bg-zinc-50"
            >
              <div>
                <p className="text-[13px] text-zinc-600">
                  <span className="font-mono text-zinc-500">{wh.method}</span>{" "}
                  <span className="font-mono text-zinc-500">{wh.url}</span>
                </p>
                <p className="mt-0.5 text-[12px] text-zinc-600">
                  {wh.description}
                </p>
              </div>
              <span className="flex-shrink-0 font-mono text-[12px] text-zinc-500">
                {wh.callsToday} today
              </span>
            </div>
          ))}
        </div>
        <button
          className="mt-3 text-[13px] text-zinc-500 transition-colors duration-200 hover:text-zinc-600"
          onClick={() => {
            console.log("[AutomationsPage] new_webhook action");
            onAction?.("new_webhook");
          }}
        >
          + New Webhook
        </button>
      </div>

      {/* Outgoing */}
      <div className="mt-8">
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-600">
          Outgoing
        </p>
        <div className="mt-3 flex flex-col">
          {MOCK_OUTGOING_WEBHOOKS.map((wh) => (
            <div
              key={wh.id}
              className="flex items-center justify-between py-3 transition-colors duration-200 hover:bg-zinc-50"
            >
              <p className="text-[13px] text-zinc-500">{wh.description}</p>
              <span className="flex-shrink-0 font-mono text-[12px] text-zinc-600">
                Last fired: {wh.lastFired}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TriggersTab({ onAction }: { onAction?: (action: string) => void }) {
  return (
    <div>
      <div className="flex flex-col">
        {MOCK_TRIGGERS.map((trigger) => (
          <div
            key={trigger.id}
            className="py-3 transition-colors duration-200 hover:bg-zinc-50"
          >
            <p className="text-[13px]">
              <span className="text-zinc-600">{trigger.condition}</span>
              <span className="mx-2 text-zinc-600">&rarr;</span>
              <span className="text-zinc-500">{trigger.action}</span>
            </p>
          </div>
        ))}
      </div>
      <button
        className="mt-4 text-[13px] text-zinc-500 transition-colors duration-200 hover:text-zinc-600"
        onClick={() => {
          console.log("[AutomationsPage] new_trigger action");
          onAction?.("new_trigger");
        }}
      >
        + New Trigger
      </button>
    </div>
  );
}

export { AutomationsPage };
