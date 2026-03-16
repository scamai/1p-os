/**
 * Data schema for MVP — types for every "table" in the startup OS.
 * These match 1:1 with localStorage keys via local-db.ts.
 */

// ── Company ──

export interface Founder {
  id: string;
  name: string;
  email: string;
  role: string;
  equity_pct: number;
  vesting_months: number;
  cliff_months: number;
  start_date: string;
  notes: string;
}

export interface Shareholder {
  id: string;
  name: string;
  type: "founder" | "investor" | "advisor" | "esop" | "other";
  shares: number;
  price_per_share: number;
  notes: string;
}

export interface IncorporationStep {
  id: string;
  title: string;
  description: string;
  status: "todo" | "done";
  link: string;
  order: number;
}

export interface Competitor {
  id: string;
  name: string;
  url: string;
  strength: string;
  weakness: string;
}

export interface DeckSlide {
  id: string;
  title: string;
  content: string;
  order: number;
}

// ── Money ──

export interface FundraisingRound {
  id: string;
  name: string;
  target_amount: number;
  raised_amount: number;
  valuation: number;
  status: "planning" | "active" | "closed";
}

export interface Investor {
  id: string;
  round_id: string;
  name: string;
  firm: string;
  status: "intro" | "meeting" | "termsheet" | "committed" | "passed";
  amount: number;
  notes: string;
}

export interface MonthlyFinance {
  id: string;
  month: string; // "2026-03"
  revenue: number;
  expenses: number;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: "revenue" | "expense";
  account: string;
}

export interface TaxDeduction {
  id: string;
  category: string;
  amount: number;
  receipt: boolean;
  notes: string;
}

// ── Business ──

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  billing: "monthly" | "annual";
  features: string[];
}

export interface MarketData {
  id: string;
  tam: number;
  sam: number;
  som: number;
  notes: string;
}

export interface GTMTask {
  id: string;
  phase: "pre_launch" | "launch" | "post_launch";
  title: string;
  status: "todo" | "in_progress" | "done";
  order: number;
}

export interface Channel {
  id: string;
  name: string;
  type: "seo" | "paid" | "social" | "email" | "referral" | "content" | "other";
  spend: number;
  leads: number;
  priority: "high" | "medium" | "low";
}

export interface ContentItem {
  id: string;
  date: string;
  type: "blog" | "social" | "email" | "ad" | "video" | "other";
  title: string;
  channel: string;
  status: "idea" | "drafting" | "published";
}

// ── Legal ──

export interface Contract {
  id: string;
  name: string;
  counterparty: string;
  type: "nda" | "msa" | "sow" | "employment" | "other";
  status: "draft" | "sent" | "signed" | "expired";
  start_date: string;
  end_date: string;
  value: number;
  notes: string;
}

export interface SAFE {
  id: string;
  investor_name: string;
  amount: number;
  valuation_cap: number;
  discount_pct: number;
  date: string;
  status: "pending" | "signed";
}

export interface ComplianceItem {
  id: string;
  category: "corporate" | "employment" | "tax" | "data";
  title: string;
  description: string;
  status: "todo" | "done";
  due_date: string;
  last_reviewed: string;
}

export interface IPItem {
  id: string;
  type: "trademark" | "patent" | "copyright" | "domain";
  name: string;
  filing_date: string;
  status: "filed" | "pending" | "granted" | "expired";
  registration_number: string;
  renewal_date: string;
}

// ── Accelerator ──

export interface AcceleratorApp {
  id: string;
  name: string;
  location: string;
  batch: string;
  deadline: string;
  investment: string;
  equity: string;
  focus: string[];
  url: string;
  status: "not_started" | "drafting" | "submitted" | "interview" | "accepted" | "rejected";
  notes: string;
}

// ── Table names ──

export const TABLES = {
  founders: "founders",
  shareholders: "shareholders",
  incorporation_steps: "incorporation_steps",
  competitors: "competitors",
  deck_slides: "deck_slides",
  fundraising_rounds: "fundraising_rounds",
  investors: "investors",
  monthly_finances: "monthly_finances",
  transactions: "transactions",
  tax_deductions: "tax_deductions",
  pricing_tiers: "pricing_tiers",
  gtm_tasks: "gtm_tasks",
  channels: "channels",
  content_items: "content_items",
  contracts: "contracts",
  safes: "safes",
  compliance_items: "compliance_items",
  ip_items: "ip_items",
  accelerator_apps: "accelerator_apps",
} as const;
