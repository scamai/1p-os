// =============================================================================
// Morning Brief Generator
// The CEO agent generates a daily brief summarizing overnight activity,
// pending decisions, costs, and suggested actions.
// =============================================================================

import {
  DEV_BYPASS,
  MOCK_AGENTS,
  MOCK_AUDIT_LOG,
  MOCK_DECISIONS,
  MOCK_GOALS,
  MOCK_BUSINESS,
} from "@/lib/supabase/dev-bypass";

// ── Types ──

export interface MorningBrief {
  greeting: string;
  summary: string;
  stats: {
    tasksCompletedOvernight: number;
    decisionsPending: number;
    costYesterday: number;
    agentsActive: number;
    goalsCompleted: number;
    goalsBlocked: number;
  };
  highlights: Array<{ agent: string; action: string; impact: string }>;
  alerts: Array<{ type: "overdue" | "budget" | "error"; message: string }>;
  suggestedActions: string[];
}

// ── Helpers ──

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// ── Mock Brief (DEV_BYPASS) ──

function generateMockBrief(): MorningBrief {
  const activeAgents = MOCK_AGENTS.filter((a) => a.status === "active").length;
  const completedGoals = MOCK_GOALS.filter((g) => g.status === "completed").length;
  const blockedGoals = MOCK_GOALS.filter((g) => g.status === "blocked").length;
  const pendingDecisions = MOCK_DECISIONS.filter((d) => d.status === "pending").length;
  const totalCost = MOCK_AGENTS.reduce(
    (sum, a) => sum + parseFloat(a.spent_today_usd),
    0
  );

  return {
    greeting: getGreeting(),
    summary: `Your team of ${activeAgents} agents completed ${MOCK_AUDIT_LOG.length} actions overnight. ${pendingDecisions} decisions need your attention, and total spend yesterday was $${totalCost.toFixed(2)} — well within your $${MOCK_BUSINESS.budget_daily} daily budget.`,
    stats: {
      tasksCompletedOvernight: MOCK_AUDIT_LOG.length,
      decisionsPending: pendingDecisions,
      costYesterday: totalCost,
      agentsActive: activeAgents,
      goalsCompleted: completedGoals,
      goalsBlocked: blockedGoals,
    },
    highlights: [
      {
        agent: "Sales Agent",
        action: "Qualified 2 new leads and drafted Globex proposal",
        impact: "Pipeline +$5,000",
      },
      {
        agent: "Finance Agent",
        action: "Reconciled March Stripe payouts",
        impact: "Books up to date",
      },
      {
        agent: "Support Agent",
        action: "Resolved 3 tickets with 4-min avg response",
        impact: "100% SLA met",
      },
      {
        agent: "CEO",
        action: "Decomposed Q2 strategy into 4 tactical goals",
        impact: "Roadmap updated",
      },
    ],
    alerts: [
      {
        type: "budget",
        message:
          "Content Agent at 85% of monthly budget ($42.50 / $50) with 18 days remaining.",
      },
      {
        type: "overdue",
        message:
          'Goal "Send first batch (50 prospects)" is blocked — waiting on email sequence draft.',
      },
    ],
    suggestedActions: [
      "Review and approve the Globex proposal ($5,000)",
      "Decide on Content Agent budget: increase to $75 or pause",
      "Unblock the outbound campaign by reviewing the email draft",
    ],
  };
}

// ── Real Brief (Supabase) ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateRealBrief(businessId: string, supabase: any): Promise<MorningBrief> {
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  const yesterdayStart = new Date();
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  yesterdayStart.setHours(0, 0, 0, 0);
  const yesterdayEnd = new Date();
  yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
  yesterdayEnd.setHours(23, 59, 59, 999);

  // Run all queries in parallel
  const [auditResult, decisionsResult, agentsResult, goalsResult] =
    await Promise.all([
      // Audit log: overnight activity
      supabase
        .from("audit_log")
        .select("*")
        .eq("business_id", businessId)
        .gte("created_at", twelveHoursAgo)
        .order("created_at", { ascending: false }),

      // Pending decisions
      supabase
        .from("decision_cards")
        .select("*")
        .eq("business_id", businessId)
        .eq("status", "pending"),

      // Agents
      supabase
        .from("agents")
        .select("*")
        .eq("business_id", businessId),

      // Goals
      supabase
        .from("goals")
        .select("*")
        .eq("business_id", businessId),
    ]);

  const auditLogs: Array<{
    actor: string;
    action: string;
    cost: number;
    created_at: string;
  }> = auditResult.data ?? [];
  const decisions: Array<{ status: string }> = decisionsResult.data ?? [];
  const agents: Array<{
    name: string;
    status: string;
    spent_today_usd: string;
  }> = agentsResult.data ?? [];
  const goals: Array<{
    status: string;
    due_date: string | null;
    title: string;
  }> = goalsResult.data ?? [];

  const activeAgents = agents.filter((a) => a.status === "active").length;
  const completedGoals = goals.filter((g) => g.status === "completed").length;
  const blockedGoals = goals.filter((g) => g.status === "blocked").length;
  const pendingDecisions = decisions.filter(
    (d) => d.status === "pending"
  ).length;
  const totalCost = agents.reduce(
    (sum, a) => sum + parseFloat(a.spent_today_usd || "0"),
    0
  );

  // Build highlights from audit log (take top 5)
  const highlights = auditLogs.slice(0, 5).map((log) => ({
    agent: log.actor,
    action: log.action,
    impact: log.cost > 0 ? `$${log.cost.toFixed(2)} spent` : "No cost",
  }));

  // Build alerts
  const alerts: MorningBrief["alerts"] = [];

  // Check for overdue goals
  const now = new Date();
  goals
    .filter(
      (g) =>
        g.due_date &&
        new Date(g.due_date) < now &&
        g.status !== "completed" &&
        g.status !== "cancelled"
    )
    .forEach((g) => {
      alerts.push({
        type: "overdue",
        message: `Goal "${g.title}" is past its due date.`,
      });
    });

  // Check blocked goals
  goals
    .filter((g) => g.status === "blocked")
    .forEach((g) => {
      alerts.push({
        type: "overdue",
        message: `Goal "${g.title}" is blocked.`,
      });
    });

  // Check agent budgets (agents spending > 80% of daily budget)
  agents.forEach((a) => {
    const spent = parseFloat(a.spent_today_usd || "0");
    // Default $2/day budget if not specified
    if (spent > 1.6) {
      alerts.push({
        type: "budget",
        message: `${a.name} has spent $${spent.toFixed(2)} today — nearing daily limit.`,
      });
    }
  });

  // Build summary
  const summary =
    auditLogs.length > 0
      ? `Your team of ${activeAgents} agents completed ${auditLogs.length} actions overnight. ${pendingDecisions} decisions need your attention, and total spend was $${totalCost.toFixed(2)}.`
      : `${activeAgents} agents are online. ${pendingDecisions} decisions are pending. No overnight activity recorded.`;

  // Suggested actions
  const suggestedActions: string[] = [];
  if (pendingDecisions > 0) {
    suggestedActions.push(
      `Review ${pendingDecisions} pending decision${pendingDecisions > 1 ? "s" : ""}`
    );
  }
  if (blockedGoals > 0) {
    suggestedActions.push(
      `Unblock ${blockedGoals} blocked goal${blockedGoals > 1 ? "s" : ""}`
    );
  }
  if (alerts.some((a) => a.type === "budget")) {
    suggestedActions.push("Review agent budgets — some agents are nearing limits");
  }
  if (suggestedActions.length === 0) {
    suggestedActions.push("Everything looks good — check back later");
  }

  return {
    greeting: getGreeting(),
    summary,
    stats: {
      tasksCompletedOvernight: auditLogs.length,
      decisionsPending: pendingDecisions,
      costYesterday: totalCost,
      agentsActive: activeAgents,
      goalsCompleted: completedGoals,
      goalsBlocked: blockedGoals,
    },
    highlights,
    alerts,
    suggestedActions,
  };
}

// ── Public API ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateMorningBrief(
  businessId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<MorningBrief> {
  if (DEV_BYPASS) {
    return generateMockBrief();
  }
  return generateRealBrief(businessId, supabase);
}
