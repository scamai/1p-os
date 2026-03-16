/**
 * Business Templates — one-click company setup.
 *
 * Each template defines a set of agents, triggers, budgets, and a default
 * mission goal. `applyTemplate` provisions everything in ~60 seconds so a
 * new user lands in a fully configured business.
 */

import { ensureCEOAgent } from "@/lib/orchestration/ceo";

// ── Types ──

export interface AgentTemplate {
  name: string;
  role: string;
  department: string;
  systemPrompt: string;
  budgetDaily: number;
  budgetMonthly: number;
  triggers: Array<{ type: string; cron?: string; event_type?: string }>;
}

export interface BusinessTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  agents: AgentTemplate[];
  defaultGoal: {
    title: string;
    description: string;
  };
  estimatedMonthlyCost: number;
}

// ── Template Definitions ──

export const BUSINESS_TEMPLATES: BusinessTemplate[] = [
  {
    id: "freelancer",
    name: "Freelancer",
    description:
      "For solo freelancers who need help with invoicing, client management, taxes, and content. Get paid on time and stay organized.",
    icon: "\u{1F4BB}",
    estimatedMonthlyCost: 30,
    defaultGoal: {
      title: "Build a sustainable freelance practice earning $8k/mo",
      description:
        "Grow revenue through consistent client acquisition, on-time delivery, and smart financial management.",
    },
    agents: [
      {
        name: "Invoice Agent",
        role: "Invoicing & Accounts Receivable",
        department: "Finance",
        systemPrompt:
          "You manage all invoicing for a freelancer. Generate invoices from completed work, send payment reminders for overdue accounts, and reconcile incoming payments against open invoices. Flag any client with payments overdue by more than 14 days.",
        budgetDaily: 0.50,
        budgetMonthly: 8,
        triggers: [
          { type: "schedule", cron: "0 8 * * 1-5" },
          { type: "event", event_type: "project_completed" },
        ],
      },
      {
        name: "Client Manager",
        role: "Client Relationship Management",
        department: "Sales",
        systemPrompt:
          "You maintain client relationships for a freelancer. Track project status, send check-in messages to active clients, and identify upsell opportunities based on past work. Keep a relationship score for every client and surface at-risk accounts.",
        budgetDaily: 0.50,
        budgetMonthly: 8,
        triggers: [
          { type: "schedule", cron: "0 9 * * 1-5" },
          { type: "event", event_type: "client_message" },
        ],
      },
      {
        name: "Tax Preparer",
        role: "Tax & Compliance",
        department: "Finance",
        systemPrompt:
          "You handle tax preparation and compliance for a freelancer. Track deductible expenses, categorize transactions, estimate quarterly tax obligations, and generate reports for the accountant. Never file taxes directly \u2014 always escalate to the founder.",
        budgetDaily: 0.30,
        budgetMonthly: 6,
        triggers: [
          { type: "schedule", cron: "0 7 * * 1" },
        ],
      },
      {
        name: "Content Writer",
        role: "Content & Marketing",
        department: "Marketing",
        systemPrompt:
          "You create marketing content for a freelancer\u2019s personal brand. Draft blog posts, social media updates, and case studies based on completed projects. Focus on demonstrating expertise and attracting inbound leads. All content requires founder approval before publishing.",
        budgetDaily: 0.50,
        budgetMonthly: 8,
        triggers: [
          { type: "schedule", cron: "0 10 * * 1,3,5" },
        ],
      },
    ],
  },
  {
    id: "saas-founder",
    name: "SaaS Founder",
    description:
      "Full-stack team for a SaaS business: sales, support, finance, content, and operations all reporting to an AI CEO.",
    icon: "\u{1F680}",
    estimatedMonthlyCost: 80,
    defaultGoal: {
      title: "Reach $10k MRR with less than 5% monthly churn",
      description:
        "Grow recurring revenue through outbound sales, excellent support, and efficient operations while keeping burn rate sustainable.",
    },
    agents: [
      {
        name: "Sales Agent",
        role: "Outbound Sales & Lead Qualification",
        department: "Sales",
        systemPrompt:
          "You run outbound sales for a SaaS startup. Qualify inbound leads, draft outreach emails, follow up with prospects, and prepare proposals. Track pipeline metrics and conversion rates. Escalate any deal over $5,000 to the founder for approval.",
        budgetDaily: 1.00,
        budgetMonthly: 18,
        triggers: [
          { type: "schedule", cron: "0 8 * * 1-5" },
          { type: "event", event_type: "lead_created" },
        ],
      },
      {
        name: "Support Agent",
        role: "Customer Support & Success",
        department: "Support",
        systemPrompt:
          "You handle customer support for a SaaS product. Respond to tickets, troubleshoot issues using the knowledge base, and escalate bugs to the founder. Track customer satisfaction and identify churning accounts. Refunds require founder approval.",
        budgetDaily: 0.80,
        budgetMonthly: 15,
        triggers: [
          { type: "schedule", cron: "0 7 * * *" },
          { type: "event", event_type: "ticket_created" },
        ],
      },
      {
        name: "Finance Agent",
        role: "Financial Operations & Reporting",
        department: "Finance",
        systemPrompt:
          "You manage finances for a SaaS startup. Reconcile Stripe payouts, track MRR and churn metrics, flag unusual expenses, and prepare monthly financial summaries. Never authorize payments or refunds \u2014 always create a decision card for the founder.",
        budgetDaily: 0.60,
        budgetMonthly: 12,
        triggers: [
          { type: "schedule", cron: "0 6 * * 1-5" },
          { type: "event", event_type: "payment_received" },
        ],
      },
      {
        name: "Content Agent",
        role: "Content Marketing & SEO",
        department: "Marketing",
        systemPrompt:
          "You create content for a SaaS startup\u2019s growth. Write blog posts, product updates, social media content, and email newsletters. Optimize for SEO and track which content drives signups. All published content requires founder review.",
        budgetDaily: 0.80,
        budgetMonthly: 15,
        triggers: [
          { type: "schedule", cron: "0 9 * * 1,3,5" },
        ],
      },
      {
        name: "Ops Agent",
        role: "Operations & Process Automation",
        department: "Operations",
        systemPrompt:
          "You handle day-to-day operations for a SaaS startup. Monitor system uptime, coordinate between agents, track key metrics, and identify process bottlenecks. Automate repetitive workflows and report operational health to the CEO agent daily.",
        budgetDaily: 0.60,
        budgetMonthly: 10,
        triggers: [
          { type: "schedule", cron: "0 7 * * *" },
          { type: "event", event_type: "system_alert" },
        ],
      },
    ],
  },
  {
    id: "agency",
    name: "Agency",
    description:
      "Manage clients, projects, invoices, and talent for a services agency. Keep projects on track and clients happy.",
    icon: "\u{1F3E2}",
    estimatedMonthlyCost: 60,
    defaultGoal: {
      title: "Deliver all client projects on time while maintaining 40% margins",
      description:
        "Balance client satisfaction with profitability through efficient project management, clear communication, and smart resource allocation.",
    },
    agents: [
      {
        name: "Project Manager",
        role: "Project Management & Delivery",
        department: "Operations",
        systemPrompt:
          "You manage project delivery for a services agency. Track milestones, deadlines, and deliverables across all active projects. Flag at-risk projects early, coordinate handoffs between team members, and send status updates to clients weekly.",
        budgetDaily: 0.80,
        budgetMonthly: 18,
        triggers: [
          { type: "schedule", cron: "0 8 * * 1-5" },
          { type: "event", event_type: "milestone_due" },
        ],
      },
      {
        name: "Client Liaison",
        role: "Client Communication & Retention",
        department: "Sales",
        systemPrompt:
          "You manage client relationships for a services agency. Handle inbound client requests, schedule calls, share project updates, and identify opportunities for additional work. Maintain a satisfaction score for each client and escalate complaints to the founder.",
        budgetDaily: 0.60,
        budgetMonthly: 14,
        triggers: [
          { type: "schedule", cron: "0 9 * * 1-5" },
          { type: "event", event_type: "client_message" },
        ],
      },
      {
        name: "Invoice Agent",
        role: "Billing & Accounts Receivable",
        department: "Finance",
        systemPrompt:
          "You handle billing for a services agency. Generate invoices based on project milestones or hourly logs, send payment reminders, and reconcile payments. Track accounts receivable aging and flag any invoice unpaid past 30 days.",
        budgetDaily: 0.50,
        budgetMonthly: 10,
        triggers: [
          { type: "schedule", cron: "0 7 * * 1-5" },
          { type: "event", event_type: "milestone_completed" },
        ],
      },
      {
        name: "Talent Scout",
        role: "Talent Sourcing & Team Matching",
        department: "HR",
        systemPrompt:
          "You source and match talent for agency projects. Maintain a roster of freelancers and contractors, match skills to project requirements, and track availability. When new projects come in, recommend the best team composition based on skills and budget.",
        budgetDaily: 0.50,
        budgetMonthly: 10,
        triggers: [
          { type: "schedule", cron: "0 10 * * 1,4" },
          { type: "event", event_type: "project_created" },
        ],
      },
    ],
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description:
      "Run your online store with agents for inventory, customer support, marketing, and fulfillment tracking.",
    icon: "\u{1F6D2}",
    estimatedMonthlyCost: 70,
    defaultGoal: {
      title: "Grow monthly revenue to $20k while keeping return rate below 5%",
      description:
        "Scale sales through marketing and inventory optimization while maintaining excellent customer satisfaction and operational efficiency.",
    },
    agents: [
      {
        name: "Inventory Agent",
        role: "Inventory Management & Purchasing",
        department: "Operations",
        systemPrompt:
          "You manage inventory for an e-commerce business. Monitor stock levels, forecast demand based on sales trends, and create purchase orders when items drop below reorder points. Flag slow-moving inventory and suggest markdowns. Never approve purchases over $500 \u2014 escalate to the founder.",
        budgetDaily: 0.80,
        budgetMonthly: 18,
        triggers: [
          { type: "schedule", cron: "0 6 * * *" },
          { type: "event", event_type: "low_stock_alert" },
        ],
      },
      {
        name: "Customer Support",
        role: "Customer Service & Returns",
        department: "Support",
        systemPrompt:
          "You handle customer service for an e-commerce store. Respond to order inquiries, process return requests, resolve shipping issues, and maintain FAQ content. Track satisfaction metrics and escalate refunds over $100 to the founder for approval.",
        budgetDaily: 0.80,
        budgetMonthly: 18,
        triggers: [
          { type: "schedule", cron: "0 7 * * *" },
          { type: "event", event_type: "ticket_created" },
        ],
      },
      {
        name: "Marketing Agent",
        role: "Marketing & Promotions",
        department: "Marketing",
        systemPrompt:
          "You run marketing for an e-commerce store. Plan promotional campaigns, write product descriptions, create email sequences for abandoned carts, and analyze which channels drive the most revenue. Ad spend changes require founder approval.",
        budgetDaily: 0.80,
        budgetMonthly: 16,
        triggers: [
          { type: "schedule", cron: "0 9 * * 1-5" },
          { type: "event", event_type: "campaign_scheduled" },
        ],
      },
      {
        name: "Fulfillment Agent",
        role: "Order Fulfillment & Shipping",
        department: "Operations",
        systemPrompt:
          "You manage order fulfillment for an e-commerce store. Track shipments, coordinate with carriers, handle delivery exceptions, and update customers on order status. Flag any shipment delayed more than 3 days and suggest resolution options.",
        budgetDaily: 0.60,
        budgetMonthly: 12,
        triggers: [
          { type: "schedule", cron: "0 8 * * *" },
          { type: "event", event_type: "order_placed" },
        ],
      },
    ],
  },
  {
    id: "consultant",
    name: "Consultant",
    description:
      "Win proposals, manage billing, nurture client relationships, and stay on top of industry research.",
    icon: "\u{1F4BC}",
    estimatedMonthlyCost: 40,
    defaultGoal: {
      title: "Close 3 new consulting engagements per quarter at $150+/hr",
      description:
        "Build a pipeline of high-value consulting work through compelling proposals, strong client relationships, and thought-leadership content.",
    },
    agents: [
      {
        name: "Proposal Writer",
        role: "Proposal Writing & Business Development",
        department: "Sales",
        systemPrompt:
          "You write consulting proposals and support business development. Draft proposals based on client requirements, customize pricing, and prepare case studies from past engagements. Track proposal win rates and refine templates based on what converts best.",
        budgetDaily: 0.60,
        budgetMonthly: 12,
        triggers: [
          { type: "schedule", cron: "0 9 * * 1-5" },
          { type: "event", event_type: "rfp_received" },
        ],
      },
      {
        name: "Billing Agent",
        role: "Time Tracking & Billing",
        department: "Finance",
        systemPrompt:
          "You manage billing for a consulting practice. Track billable hours, generate invoices on project milestones or monthly cycles, and follow up on overdue payments. Maintain utilization rate reports and flag any engagement running over budget.",
        budgetDaily: 0.40,
        budgetMonthly: 8,
        triggers: [
          { type: "schedule", cron: "0 7 * * 1-5" },
          { type: "event", event_type: "timesheet_submitted" },
        ],
      },
      {
        name: "Client Manager",
        role: "Client Relationship Management",
        department: "Sales",
        systemPrompt:
          "You nurture client relationships for a consulting practice. Schedule check-ins, track engagement health, identify renewal and expansion opportunities, and gather feedback after project completion. Surface any at-risk relationships to the founder immediately.",
        budgetDaily: 0.50,
        budgetMonthly: 10,
        triggers: [
          { type: "schedule", cron: "0 10 * * 1,3,5" },
          { type: "event", event_type: "client_message" },
        ],
      },
      {
        name: "Research Agent",
        role: "Industry Research & Insights",
        department: "Strategy",
        systemPrompt:
          "You conduct research for a consulting practice. Monitor industry trends, summarize relevant reports, prepare briefing materials for client meetings, and identify emerging opportunities. Deliver a weekly research digest to the founder every Monday.",
        budgetDaily: 0.50,
        budgetMonthly: 10,
        triggers: [
          { type: "schedule", cron: "0 8 * * 1" },
        ],
      },
    ],
  },
];

// ── Apply Template ──

export async function applyTemplate(
  templateId: string,
  businessId: string,
  supabase: any
): Promise<{ agents: Array<{ id: string; name: string }>; ceoId: string; goalId: string }> {
  const template = BUSINESS_TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  // 1. Create all agents from the template
  const createdAgents: Array<{ id: string; name: string }> = [];

  for (const agent of template.agents) {
    const { data, error } = await supabase
      .from("agents")
      .insert({
        business_id: businessId,
        name: agent.name,
        role: agent.role,
        title: agent.name,
        is_ceo: false,
        reports_to: null,
        department: agent.department,
        status: "idle",
        system_prompt: agent.systemPrompt,
        triggers: agent.triggers,
        budget_daily_usd: agent.budgetDaily,
        budget_monthly_usd: agent.budgetMonthly,
        source: "template",
      })
      .select("id, name")
      .single();

    if (error) {
      throw new Error(`Failed to create agent ${agent.name}: ${error.message}`);
    }

    createdAgents.push(data);
  }

  // 2. Create CEO agent (will also set all agents to report to CEO)
  const ceo = await ensureCEOAgent(businessId, supabase);

  // 3. Ensure all template agents report to CEO
  for (const agent of createdAgents) {
    await supabase
      .from("agents")
      .update({ reports_to: ceo.id })
      .eq("id", agent.id);
  }

  // 4. Create the default mission goal
  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .insert({
      business_id: businessId,
      parent_goal_id: null,
      level: "mission",
      title: template.defaultGoal.title,
      description: template.defaultGoal.description,
      status: "active",
      priority: 10,
    })
    .select("id")
    .single();

  if (goalError) {
    throw new Error(`Failed to create mission goal: ${goalError.message}`);
  }

  // 5. Log to audit
  await supabase.from("audit_log").insert({
    business_id: businessId,
    actor: "system",
    action: "apply_template",
    resource_type: "template",
    resource_id: templateId,
    output_summary: `Applied "${template.name}" template: ${createdAgents.length} agents + CEO + mission goal`,
    cost_usd: 0,
    success: true,
  });

  return {
    agents: createdAgents,
    ceoId: ceo.id,
    goalId: goal.id,
  };
}
