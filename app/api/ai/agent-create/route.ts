import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const AgentCreateInputSchema = z.object({
  description: z.string().min(1).max(2000),
});

// Role templates — deterministic, no AI needed.
// Keyword matching picks the best role, then we apply the template.

interface RoleTemplate {
  name: string;
  role: string;
  keywords: string[];
  description: string;
  system_prompt: string;
  context_permissions: string[];
  allowed_actions: string[];
  triggers: Array<{ type: string; config: Record<string, unknown> }>;
  budget: { daily_limit: number; monthly_limit: number; model_preference: string };
}

const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    name: 'Sales Agent',
    role: 'sales',
    keywords: ['sales', 'sell', 'lead', 'deal', 'pipeline', 'crm', 'prospect', 'outreach', 'proposal', 'close'],
    description: 'Manages leads, sends proposals, and tracks the sales pipeline.',
    system_prompt: 'You are a sales agent. Qualify leads, send follow-ups, draft proposals, and keep the CRM up to date. Always get approval before sending proposals over $1,000. Be concise and professional in all communications.',
    context_permissions: ['customers', 'invoices', 'projects'],
    allowed_actions: ['send_email', 'update_crm', 'create_invoice', 'web_browse', 'search_memory'],
    triggers: [{ type: 'schedule', config: { cron: '0 9 * * 1-5', description: 'Check pipeline every weekday morning' } }],
    budget: { daily_limit: 2, monthly_limit: 50, model_preference: 'balanced' },
  },
  {
    name: 'Support Agent',
    role: 'customer-support',
    keywords: ['support', 'ticket', 'help', 'customer', 'issue', 'resolve', 'respond', 'faq', 'helpdesk'],
    description: 'Responds to customer tickets and resolves issues.',
    system_prompt: 'You are a customer support agent. Respond to tickets quickly and accurately. Check the FAQ and knowledge base before escalating. Escalate billing issues and refunds over $100 to the founder. Be empathetic and solution-oriented.',
    context_permissions: ['customers', 'documents', 'projects'],
    allowed_actions: ['send_email', 'web_browse', 'search_memory', 'notification_send'],
    triggers: [{ type: 'webhook', config: { event: 'ticket_created', description: 'New support ticket' } }],
    budget: { daily_limit: 2, monthly_limit: 50, model_preference: 'balanced' },
  },
  {
    name: 'Content Agent',
    role: 'content-marketing',
    keywords: ['content', 'blog', 'social', 'marketing', 'newsletter', 'post', 'write', 'seo', 'copy', 'article'],
    description: 'Creates blog posts, social media content, and newsletters.',
    system_prompt: 'You are a content and marketing agent. Write blog posts, social media updates, and newsletters. Match the brand voice. Get approval before publishing anything. Track engagement metrics.',
    context_permissions: ['documents', 'customers'],
    allowed_actions: ['web_browse', 'social_post', 'send_email', 'file_manage', 'search_memory'],
    triggers: [{ type: 'schedule', config: { cron: '0 10 * * 1', description: 'Plan weekly content every Monday' } }],
    budget: { daily_limit: 2, monthly_limit: 50, model_preference: 'quality-first' },
  },
  {
    name: 'Ops Agent',
    role: 'operations',
    keywords: ['ops', 'operations', 'admin', 'finance', 'expense', 'invoice', 'bookkeep', 'reconcil', 'budget', 'payroll'],
    description: 'Handles invoicing, expense tracking, and financial operations.',
    system_prompt: 'You are an operations agent. Process invoices, track expenses, reconcile payments, and generate reports. Flag any anomalies. Require approval for payments over $500 and all refunds.',
    context_permissions: ['finance', 'invoices', 'expenses', 'customers'],
    allowed_actions: ['create_invoice', 'file_manage', 'database_query', 'notification_send', 'search_memory'],
    triggers: [{ type: 'schedule', config: { cron: '0 8 * * 1', description: 'Weekly financial reconciliation' } }],
    budget: { daily_limit: 1, monthly_limit: 30, model_preference: 'cost-optimized' },
  },
  {
    name: 'Dev Agent',
    role: 'development',
    keywords: ['dev', 'code', 'develop', 'build', 'api', 'bug', 'fix', 'deploy', 'test', 'engineer'],
    description: 'Writes code, fixes bugs, and manages deployments.',
    system_prompt: 'You are a development agent. Write clean, tested code. Review PRs, fix bugs, and monitor deployments. Never deploy to production without approval. Follow the project coding standards.',
    context_permissions: ['projects', 'documents'],
    allowed_actions: ['code_execute', 'web_browse', 'api_call', 'file_manage', 'notification_send'],
    triggers: [{ type: 'webhook', config: { event: 'pr_created', description: 'New pull request' } }],
    budget: { daily_limit: 5, monthly_limit: 100, model_preference: 'quality-first' },
  },
  {
    name: 'Research Agent',
    role: 'research',
    keywords: ['research', 'analyze', 'report', 'data', 'insight', 'competitor', 'market', 'trend'],
    description: 'Researches topics, analyzes data, and produces reports.',
    system_prompt: 'You are a research agent. Gather information from the web and internal data, analyze trends, and produce clear reports. Cite sources. Prioritize accuracy over speed.',
    context_permissions: ['documents', 'projects', 'customers'],
    allowed_actions: ['web_browse', 'database_query', 'file_manage', 'search_memory'],
    triggers: [],
    budget: { daily_limit: 3, monthly_limit: 60, model_preference: 'quality-first' },
  },
];

const DEFAULT_TEMPLATE: RoleTemplate = {
  name: 'General Agent',
  role: 'general',
  keywords: [],
  description: 'A general-purpose agent that can handle various tasks.',
  system_prompt: 'You are a helpful business agent. Follow instructions carefully, ask for clarification when needed, and always get approval for important decisions.',
  context_permissions: ['documents'],
  allowed_actions: ['web_browse', 'file_manage', 'notification_send', 'search_memory'],
  triggers: [],
  budget: { daily_limit: 2, monthly_limit: 50, model_preference: 'balanced' },
};

function matchRole(description: string): RoleTemplate {
  const lower = description.toLowerCase();
  let bestMatch: { template: RoleTemplate; score: number } | null = null;

  for (const template of ROLE_TEMPLATES) {
    let score = 0;
    for (const keyword of template.keywords) {
      if (lower.includes(keyword)) score++;
    }
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { template, score };
    }
  }

  return bestMatch?.template ?? DEFAULT_TEMPLATE;
}

function personalize(template: RoleTemplate, description: string, businessName?: string): typeof template & { reasoning: string } {
  // Build a personalized system prompt with business context
  const businessPrefix = businessName
    ? `You work for ${businessName}. `
    : '';

  return {
    ...template,
    system_prompt: businessPrefix + template.system_prompt,
    reasoning: `Matched role "${template.role}" based on keywords in your description. Applied default permissions and budget for this role type.`,
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = AgentCreateInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { description } = parsed.data;

    const { data: business } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('user_id', user.id)
      .single();

    const template = matchRole(description);
    const proposedConfig = personalize(template, description, business?.name ?? undefined);

    return NextResponse.json({ proposedConfig }, { status: 200 });
  } catch (error) {
    console.error('[ai/agent-create] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
