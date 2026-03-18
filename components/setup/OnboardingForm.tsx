"use client";

import * as React from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

const TEMPLATE_PLACEHOLDERS: Record<string, string> = {
  "freelance-designer":
    "I run a freelance design studio specializing in brand identity and web design for startups...",
  "saas-founder":
    "I'm building a SaaS tool for project management, currently at $5k MRR with 200 users...",
  "consultant-coach":
    "I'm a business consultant helping mid-size companies with operational efficiency...",
  ecommerce:
    "I sell handmade candles online through my Shopify store, doing about 100 orders/month...",
  "content-creator":
    "I create tech review videos on YouTube with 50k subscribers, also run a newsletter...",
  agency:
    "I run a small digital marketing agency with 8 active clients across social, SEO, and paid ads...",
  general:
    "I run a small business and need help with day-to-day admin, scheduling, and bookkeeping...",
};

const TEMPLATE_AGENTS: Record<string, { name: string; role: string }[]> = {
  "freelance-designer": [
    { name: "Project Tracker", role: "operations" },
    { name: "Invoice Manager", role: "finance" },
    { name: "Client Relations", role: "sales" },
    { name: "Schedule Keeper", role: "operations" },
  ],
  "saas-founder": [
    { name: "Support Agent", role: "customer-success" },
    { name: "Revenue Tracker", role: "finance" },
    { name: "Metrics Analyst", role: "product" },
    { name: "Content Writer", role: "marketing" },
    { name: "Billing Ops", role: "finance" },
  ],
  "consultant-coach": [
    { name: "Scheduler", role: "operations" },
    { name: "Client Onboarding", role: "customer-success" },
    { name: "Invoice Manager", role: "finance" },
    { name: "Follow-Up Agent", role: "sales" },
  ],
  ecommerce: [
    { name: "Inventory Monitor", role: "operations" },
    { name: "Order Manager", role: "operations" },
    { name: "Customer Service", role: "customer-success" },
    { name: "Marketing Agent", role: "marketing" },
    { name: "Sales Tracker", role: "sales" },
  ],
  "content-creator": [
    { name: "Content Calendar", role: "marketing" },
    { name: "Social Scheduler", role: "marketing" },
    { name: "Analytics Tracker", role: "product" },
    { name: "Sponsorship Manager", role: "sales" },
  ],
  agency: [
    { name: "Client Manager", role: "customer-success" },
    { name: "Project Tracker", role: "operations" },
    { name: "Resource Planner", role: "operations" },
    { name: "Billing Agent", role: "finance" },
    { name: "Report Generator", role: "marketing" },
    { name: "New Biz Scout", role: "sales" },
  ],
  general: [
    { name: "Email Assistant", role: "operations" },
    { name: "Calendar Manager", role: "operations" },
    { name: "Bookkeeper", role: "finance" },
  ],
};

interface OnboardingFormData {
  businessName: string;
  state: string;
  description: string;
}

interface OnboardingFormProps {
  onSubmit: (data: OnboardingFormData) => void;
  loading?: boolean;
  templateId?: string;
}

function OnboardingForm({ onSubmit, loading = false, templateId = "general" }: OnboardingFormProps) {
  const [businessName, setBusinessName] = React.useState("");
  const [state, setState] = React.useState("");
  const [description, setDescription] = React.useState("");

  const placeholder = TEMPLATE_PLACEHOLDERS[templateId] ?? TEMPLATE_PLACEHOLDERS.general;
  const agents = TEMPLATE_AGENTS[templateId] ?? TEMPLATE_AGENTS.general;
  const estimatedDailyCost = (agents.length * 0.5).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ businessName, state, description });
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-black">
          Tell us about your business
        </h2>
        <p className="mt-0.5 text-sm text-black/50">
          Just a few details and your AI team is ready.
        </p>
      </div>

      <Input
        label="Business name"
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
        placeholder="Acme Co."
        required
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-black">
          State
        </label>
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          required
          className="h-9 w-full rounded-md border border-black/[0.08] bg-transparent px-3 text-sm text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
        >
          <option value="">Select state...</option>
          {US_STATES.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name} ({s.code})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-black">
          What do you do?
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={placeholder}
          required
          rows={3}
          className="w-full rounded-md border border-black/[0.08] bg-transparent px-3 py-2 text-sm text-black placeholder:text-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
        />
      </div>

      {/* Agent preview */}
      <div className="rounded-lg border border-black/[0.08] p-3">
        <p className="mb-2 text-[10px] font-semibold text-black/40 uppercase tracking-wider">
          Your AI Team — {agents.length} agents
        </p>
        <div className="flex flex-col gap-1">
          {agents.map((agent) => (
            <div
              key={agent.name}
              className="flex items-center justify-between py-0.5"
            >
              <span className="text-xs text-black/70">{agent.name}</span>
              <span className="text-[11px] text-black/40 capitalize">
                {agent.role.replace("-", " ")}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 border-t border-black/[0.04] pt-2 text-[11px] text-black/40">
          Est. <span className="font-mono text-black/60">${estimatedDailyCost}/day</span> with balanced strategy
        </div>
      </div>

      <Button type="submit" loading={loading} className="mt-2">
        {loading ? "Setting up..." : "Continue"}
      </Button>
    </form>
  );
}

export { OnboardingForm };
export type { OnboardingFormData };
