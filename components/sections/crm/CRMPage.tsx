"use client";

import * as React from "react";
import { TabBar } from "@/components/shared/TabBar";
import { useTableData } from "@/lib/hooks/useTableData";

const TABS = ["All", "Clients", "Leads", "Contractors"] as const;
type CRMTab = (typeof TABS)[number];

type ContactType = "Client" | "Lead" | "Contractor";

interface Contact {
  id: string;
  name: string;
  type: ContactType;
  lastInteraction: string;
  lastAgent: string;
  totalRevenue: number;
  email: string;
  notes: string;
  status: string;
}

interface LeadRow {
  id: string;
  name: string;
  email?: string;
  type?: string;
  status?: string;
  notes?: string;
  last_interaction?: string;
  total_revenue?: number;
  source?: string;
  value?: number;
  stage?: string;
  contact_name?: string;
  created_at?: string;
}

const MOCK_CONTACTS: Contact[] = [
  {
    id: "1", name: "Sarah Chen", type: "Client", lastInteraction: "Today",
    lastAgent: "Support Agent", totalRevenue: 12500, email: "sarah@acme.co",
    notes: "Renewed contract for Q2. Support Agent resolved her billing question this morning.",
    status: "Active",
  },
  {
    id: "2", name: "Marcus Webb", type: "Lead", lastInteraction: "Yesterday",
    lastAgent: "Sales Agent", totalRevenue: 0, email: "marcus@globex.io",
    notes: "Interested in premium tier. Sales Agent sent follow-up email with pricing.",
    status: "Warm",
  },
  {
    id: "3", name: "Priya Patel", type: "Contractor", lastInteraction: "Mar 8",
    lastAgent: "Ops Agent", totalRevenue: 3200, email: "priya@freelance.dev",
    notes: "Design work for landing page. Ops Agent processed her latest invoice.",
    status: "Active",
  },
  {
    id: "4", name: "James Liu", type: "Client", lastInteraction: "Yesterday",
    lastAgent: "Sales Agent", totalRevenue: 8400, email: "james@initech.com",
    notes: "Monthly retainer. Sales Agent is upselling additional services.",
    status: "Active",
  },
  {
    id: "5", name: "Olivia Torres", type: "Lead", lastInteraction: "Mar 9",
    lastAgent: "Content Agent", totalRevenue: 0, email: "olivia@startup.co",
    notes: "Downloaded whitepaper. Content Agent added her to nurture sequence.",
    status: "New",
  },
  {
    id: "6", name: "David Kim", type: "Lead", lastInteraction: "Today",
    lastAgent: "Sales Agent", totalRevenue: 0, email: "david@bigcorp.com",
    notes: "Inbound from website. Sales Agent qualified — budget confirmed, decision in 2 weeks.",
    status: "Hot",
  },
];

function mapLeadToContact(lead: LeadRow): Contact {
  const typeMap: Record<string, ContactType> = {
    client: "Client",
    lead: "Lead",
    contractor: "Contractor",
  };
  return {
    id: lead.id,
    name: lead.name || lead.contact_name || "Unknown",
    type: typeMap[(lead.type ?? "lead").toLowerCase()] ?? "Lead",
    lastInteraction: lead.last_interaction
      ? new Date(lead.last_interaction).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "—",
    lastAgent: "—",
    totalRevenue: lead.total_revenue ?? lead.value ?? 0,
    email: lead.email ?? "",
    notes: lead.notes ?? "",
    status: lead.status ?? "Active",
  };
}

function ContactRow({ contact, expanded, onToggle }: { contact: Contact; expanded: boolean; onToggle: () => void }) {
  return (
    <>
      <div
        className="flex items-center justify-between border-b border-zinc-100 py-3 cursor-pointer transition-colors hover:bg-zinc-50 last:border-0"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white">
            {contact.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-medium text-zinc-900">{contact.name}</p>
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500">
                {contact.type}
              </span>
              {contact.status !== "Active" && (
                <span className="text-[10px] text-zinc-400">{contact.status}</span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">
              Last: {contact.lastAgent} · {contact.lastInteraction}
            </p>
          </div>
        </div>
        <div className="text-right">
          {contact.totalRevenue > 0 && (
            <p className="font-mono text-[13px] text-zinc-900">
              ${contact.totalRevenue.toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-3">
          <div className="grid grid-cols-2 gap-4 text-[12px]">
            <div>
              <p className="text-[11px] text-zinc-400">Email</p>
              <p className="mt-0.5 text-zinc-600">{contact.email}</p>
            </div>
            <div>
              <p className="text-[11px] text-zinc-400">Last Agent</p>
              <p className="mt-0.5 text-zinc-600">{contact.lastAgent}</p>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[11px] text-zinc-400">Notes</p>
            <p className="mt-0.5 text-[12px] text-zinc-600">{contact.notes}</p>
          </div>
        </div>
      )}
    </>
  );
}

function dispatchAppAction(action: string) {
  window.dispatchEvent(new CustomEvent("app-action", { detail: { action } }));
}

interface CRMPageProps {
  onAction?: (action: string) => void;
}

function CRMPage({ onAction }: CRMPageProps) {
  const [activeTab, setActiveTab] = React.useState<CRMTab>("All");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const handleAction = onAction ?? dispatchAppAction;

  const { data: rawLeads, loading, error } = useTableData<LeadRow>("leads");

  const contacts: Contact[] = React.useMemo(() => {
    if (error && rawLeads.length === 0) return MOCK_CONTACTS;
    if (rawLeads.length === 0 && !loading) return [];
    return rawLeads.map(mapLeadToContact);
  }, [rawLeads, loading, error]);

  const filtered = contacts.filter((c) => {
    if (activeTab === "All") return true;
    if (activeTab === "Clients") return c.type === "Client";
    if (activeTab === "Leads") return c.type === "Lead";
    if (activeTab === "Contractors") return c.type === "Contractor";
    return true;
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">CRM</h1>
        <button
          className="text-[13px] text-zinc-500 transition-colors hover:text-zinc-900"
          onClick={() => handleAction("add_contact")}
        >
          + Add Contact
        </button>
      </div>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-3 gap-6">
        <div>
          <p className="text-[11px] text-zinc-500">Clients</p>
          <p className="mt-1 font-mono text-lg font-semibold text-zinc-900">
            {loading ? "—" : contacts.filter(c => c.type === "Client").length}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-500">Active Leads</p>
          <p className="mt-1 font-mono text-lg font-semibold text-zinc-900">
            {loading ? "—" : contacts.filter(c => c.type === "Lead").length}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-zinc-500">Total Revenue</p>
          <p className="mt-1 font-mono text-lg font-semibold text-zinc-900">
            {loading ? "—" : `$${contacts.reduce((s, c) => s + c.totalRevenue, 0).toLocaleString()}`}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <TabBar
          tabs={TABS as unknown as string[]}
          active={activeTab}
          onChange={(tab) => setActiveTab(tab as CRMTab)}
        />
      </div>
      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded bg-zinc-100" />
            ))}
          </div>
        ) : (
          <>
            {filtered.map((contact) => (
              <ContactRow
                key={contact.id}
                contact={contact}
                expanded={expandedId === contact.id}
                onToggle={() => setExpandedId(expandedId === contact.id ? null : contact.id)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="py-8 text-center text-[13px] text-zinc-500">
                No contacts found.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export { CRMPage };
