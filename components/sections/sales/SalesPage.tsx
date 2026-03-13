"use client";

import * as React from "react";
import { TabBar } from "@/components/shared/TabBar";

const TABS = ["Pipeline", "Leads", "Proposals", "Activity"] as const;
type SalesTab = (typeof TABS)[number];

const LEADS = [
  { id: "1", name: "Acme Corp", contact: "Jane Smith", value: 12000, stage: "Qualified", date: "Mar 10", source: "Inbound" },
  { id: "2", name: "Globex Inc", contact: "Bob Lee", value: 8500, stage: "Contacted", date: "Mar 8", source: "Outbound" },
  { id: "3", name: "Initech", contact: "Sarah Park", value: 3200, stage: "Proposal Sent", date: "Mar 5", source: "Referral" },
  { id: "4", name: "Umbrella LLC", contact: "Tom Rivera", value: 15000, stage: "Negotiation", date: "Mar 12", source: "Inbound" },
];

const PROPOSALS = [
  { id: "1", client: "Initech", title: "Q2 Retainer", amount: 3200, status: "Sent", date: "Mar 5" },
  { id: "2", client: "Umbrella LLC", title: "Platform Build", amount: 15000, status: "Draft", date: "Mar 12" },
  { id: "3", client: "Acme Corp", title: "Monthly Retainer", amount: 4500, status: "Accepted", date: "Mar 1" },
];

const ACTIVITY = [
  { id: "1", action: "Follow-up email sent to Globex Inc", agent: "Sales Agent", time: "2h ago" },
  { id: "2", action: "Proposal drafted for Umbrella LLC", agent: "Sales Agent", time: "4h ago" },
  { id: "3", action: "Lead qualified: Acme Corp", agent: "Sales Agent", time: "1d ago" },
  { id: "4", action: "Cold outreach sent (12 prospects)", agent: "Sales Agent", time: "1d ago" },
  { id: "5", action: "Meeting scheduled with Initech", agent: "Sales Agent", time: "2d ago" },
];

function PipelineTab() {
  const stages = ["Contacted", "Qualified", "Proposal Sent", "Negotiation", "Closed"];
  const stageLeads = stages.map((stage) => ({
    stage,
    leads: LEADS.filter((l) => l.stage === stage),
    value: LEADS.filter((l) => l.stage === stage).reduce((s, l) => s + l.value, 0),
  }));

  const totalPipeline = LEADS.reduce((s, l) => s + l.value, 0);

  return (
    <div>
      <div className="grid grid-cols-2 gap-x-12 gap-y-8 sm:grid-cols-4">
        <div>
          <p className="text-[11px] text-zinc-500">Pipeline Value</p>
          <p className="mt-1 font-mono text-xl font-semibold text-zinc-900">
            ${totalPipeline.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-500">Active Leads</p>
          <p className="mt-1 font-mono text-xl font-semibold text-zinc-900">{LEADS.length}</p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-500">Proposals Out</p>
          <p className="mt-1 font-mono text-xl font-semibold text-zinc-900">
            {PROPOSALS.filter((p) => p.status === "Sent").length}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-500">Won (MTD)</p>
          <p className="mt-1 font-mono text-xl font-semibold text-zinc-900">
            ${PROPOSALS.filter((p) => p.status === "Accepted")
              .reduce((s, p) => s + p.amount, 0)
              .toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {stageLeads
          .filter((s) => s.leads.length > 0)
          .map((s) => (
            <div key={s.stage} className="rounded-lg border border-zinc-100 px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-medium text-zinc-900">{s.stage}</p>
                <p className="font-mono text-[11px] text-zinc-500">
                  {s.leads.length} lead{s.leads.length > 1 ? "s" : ""} · ${s.value.toLocaleString()}
                </p>
              </div>
              <div className="mt-2 flex flex-col">
                {s.leads.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between border-t border-zinc-50 py-2 first:border-0"
                  >
                    <span className="text-[12px] text-zinc-600">{l.name}</span>
                    <span className="font-mono text-[12px] text-zinc-500">
                      ${l.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

function LeadsTab() {
  return (
    <div className="flex flex-col">
      {LEADS.map((lead) => (
        <div
          key={lead.id}
          className="flex items-center justify-between border-b border-zinc-100 py-3 last:border-0"
        >
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-medium text-zinc-900">{lead.name}</p>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  lead.stage === "Negotiation"
                    ? "bg-zinc-200 text-zinc-700"
                    : lead.stage === "Proposal Sent"
                      ? "bg-zinc-100 text-zinc-600"
                      : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {lead.stage}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              {lead.contact} · {lead.source} · {lead.date}
            </p>
          </div>
          <p className="font-mono text-[13px] text-zinc-900">${lead.value.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

function ProposalsTab() {
  return (
    <div className="flex flex-col">
      {PROPOSALS.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between border-b border-zinc-100 py-3 last:border-0"
        >
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-medium text-zinc-900">{p.title}</p>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  p.status === "Accepted"
                    ? "bg-zinc-100 text-zinc-600"
                    : p.status === "Draft"
                      ? "bg-zinc-50 text-zinc-400"
                      : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {p.status}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              {p.client} · {p.date}
            </p>
          </div>
          <p className="font-mono text-[13px] text-zinc-900">${p.amount.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

function ActivityTab() {
  return (
    <div className="flex flex-col">
      {ACTIVITY.map((a) => (
        <div
          key={a.id}
          className="flex items-center justify-between border-b border-zinc-100 py-3 last:border-0"
        >
          <div>
            <p className="text-[13px] text-zinc-900">{a.action}</p>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              {a.agent} · {a.time}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SalesPage() {
  const [activeTab, setActiveTab] = React.useState<SalesTab>("Pipeline");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-lg font-semibold text-zinc-900">Sales</h1>
      <div className="mt-6">
        <TabBar
          tabs={TABS as unknown as string[]}
          active={activeTab}
          onChange={(tab) => setActiveTab(tab as SalesTab)}
        />
      </div>
      <div className="mt-8">
        {activeTab === "Pipeline" && <PipelineTab />}
        {activeTab === "Leads" && <LeadsTab />}
        {activeTab === "Proposals" && <ProposalsTab />}
        {activeTab === "Activity" && <ActivityTab />}
      </div>
    </div>
  );
}

export { SalesPage };
