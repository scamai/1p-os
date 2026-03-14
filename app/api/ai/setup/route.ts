import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getAgentSystemPrompt } from '@/lib/ai/prompts';

export const dynamic = 'force-dynamic';

const SetupInputSchema = z.object({
  template: z.string().min(1),
  businessName: z.string().min(1),
  state: z.string().min(1),
  description: z.string().min(1),
  modelStrategy: z.enum(['quality', 'balanced', 'savings']).optional(),
});

// Industry template configs — deterministic, no AI needed.
// Each template defines which agents to create, their roles, and initial deadlines.

interface TemplateAgent {
  name: string;
  role: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface TemplateDeadline {
  title: string;
  dueDate: string;
  category: string;
  description: string;
}

interface IndustryTemplate {
  industry: string;
  stage: string;
  agents: TemplateAgent[];
  deadlines: (today: Date) => TemplateDeadline[];
  goals: string[];
}

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const TEMPLATES: Record<string, IndustryTemplate> = {
  saas: {
    industry: 'SaaS',
    stage: 'growing',
    agents: [
      { name: 'Sales Agent', role: 'sales', description: 'Manages leads, proposals, and pipeline', priority: 'high' },
      { name: 'Support Agent', role: 'customer-success', description: 'Handles tickets and customer inquiries', priority: 'high' },
      { name: 'Content Agent', role: 'marketing', description: 'Creates blog posts, social content, newsletters', priority: 'medium' },
      { name: 'Ops Agent', role: 'operations', description: 'Invoicing, expenses, and financial tracking', priority: 'medium' },
    ],
    deadlines: (today) => [
      { title: 'Set up Stripe integration', dueDate: addDays(today, 3), category: 'setup', description: 'Connect payment processing' },
      { title: 'Import existing customers', dueDate: addDays(today, 7), category: 'setup', description: 'Migrate customer data to 1P OS' },
      { title: 'Review agent permissions', dueDate: addDays(today, 14), category: 'security', description: 'Audit agent access after 2 weeks' },
    ],
    goals: ['Increase MRR', 'Reduce support response time', 'Automate billing'],
  },
  consulting: {
    industry: 'Consulting',
    stage: 'established',
    agents: [
      { name: 'Sales Agent', role: 'sales', description: 'Client acquisition and proposal drafting', priority: 'high' },
      { name: 'Ops Agent', role: 'operations', description: 'Invoicing, contracts, and expense tracking', priority: 'high' },
      { name: 'Research Agent', role: 'research', description: 'Market research and competitive analysis', priority: 'medium' },
    ],
    deadlines: (today) => [
      { title: 'Upload client contracts', dueDate: addDays(today, 5), category: 'setup', description: 'Add existing contracts to Vault' },
      { title: 'Set billing schedule', dueDate: addDays(today, 7), category: 'finance', description: 'Configure recurring invoicing' },
    ],
    goals: ['Win new clients', 'Track project profitability', 'Automate invoicing'],
  },
  ecommerce: {
    industry: 'E-commerce',
    stage: 'growing',
    agents: [
      { name: 'Support Agent', role: 'customer-success', description: 'Order inquiries and returns', priority: 'high' },
      { name: 'Content Agent', role: 'marketing', description: 'Product descriptions, social media, ads', priority: 'high' },
      { name: 'Ops Agent', role: 'operations', description: 'Inventory, shipping, and accounting', priority: 'medium' },
    ],
    deadlines: (today) => [
      { title: 'Connect store platform', dueDate: addDays(today, 3), category: 'setup', description: 'Integrate Shopify/WooCommerce' },
      { title: 'Set return policy', dueDate: addDays(today, 5), category: 'setup', description: 'Configure auto-reply for returns' },
    ],
    goals: ['Increase conversion rate', 'Reduce return rate', 'Scale content production'],
  },
  agency: {
    industry: 'Agency',
    stage: 'scaling',
    agents: [
      { name: 'Sales Agent', role: 'sales', description: 'New business and proposals', priority: 'high' },
      { name: 'Ops Agent', role: 'operations', description: 'Project management and invoicing', priority: 'high' },
      { name: 'Content Agent', role: 'marketing', description: 'Agency marketing and case studies', priority: 'low' },
    ],
    deadlines: (today) => [
      { title: 'Import active projects', dueDate: addDays(today, 5), category: 'setup', description: 'Add current client projects' },
      { title: 'Set project budgets', dueDate: addDays(today, 7), category: 'finance', description: 'Configure per-project budgets' },
    ],
    goals: ['Improve utilization', 'Automate client reporting', 'Scale new business'],
  },
  freelance: {
    industry: 'Freelance',
    stage: 'solo',
    agents: [
      { name: 'Ops Agent', role: 'operations', description: 'Invoicing, expenses, and tax prep', priority: 'high' },
      { name: 'Sales Agent', role: 'sales', description: 'Lead follow-up and proposals', priority: 'medium' },
    ],
    deadlines: (today) => [
      { title: 'Set up invoicing', dueDate: addDays(today, 3), category: 'setup', description: 'Configure invoice templates' },
      { title: 'Add existing clients', dueDate: addDays(today, 5), category: 'setup', description: 'Import client contacts' },
    ],
    goals: ['Get paid faster', 'Automate admin work', 'Find new clients'],
  },
};

const DEFAULT_TEMPLATE: IndustryTemplate = {
  industry: 'General',
  stage: 'starting',
  agents: [
    { name: 'Ops Agent', role: 'operations', description: 'General business operations', priority: 'high' },
    { name: 'Sales Agent', role: 'sales', description: 'Sales and client management', priority: 'medium' },
  ],
  deadlines: (today) => [
    { title: 'Complete onboarding', dueDate: addDays(today, 7), category: 'setup', description: 'Finish setting up your workspace' },
  ],
  goals: ['Automate repetitive tasks', 'Stay organized'],
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = SetupInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { template, businessName, state, description, modelStrategy } = parsed.data;
    const routingStrategy = modelStrategy ?? 'balanced';
    const today = new Date();

    // Pick the industry template (or check DB for custom ones)
    let industryConfig = TEMPLATES[template] ?? DEFAULT_TEMPLATE;

    const { data: dbTemplate } = await supabase
      .from('industry_templates')
      .select('*')
      .eq('id', template)
      .single();

    if (dbTemplate?.default_agents?.length) {
      industryConfig = {
        ...industryConfig,
        agents: dbTemplate.default_agents.map((a: { name: string; role: string; description?: string }) => ({
          name: a.name,
          role: a.role,
          description: a.description ?? `Handles ${a.role} tasks`,
          priority: 'medium' as const,
        })),
      };
    }

    // Create business
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .insert({
        user_id: user.id,
        name: businessName,
        industry: industryConfig.industry,
        stage: industryConfig.stage,
        template,
        state,
        goals: industryConfig.goals,
        preferences: { description },
      })
      .select()
      .single();

    if (bizError) {
      console.error('[ai/setup] Failed to create business:', bizError);
      return NextResponse.json(
        { error: 'Failed to create business', details: bizError.message },
        { status: 500 }
      );
    }

    // Create agents with template-based system prompts
    const businessContext = {
      businessName,
      industry: industryConfig.industry,
      stage: industryConfig.stage,
      goals: industryConfig.goals,
    };

    const agentInserts = industryConfig.agents.map((agent) => ({
      business_id: business.id,
      name: agent.name,
      role: agent.role,
      description: agent.description,
      priority: agent.priority,
      status: 'active',
      system_prompt: getAgentSystemPrompt(agent.role, businessContext),
      context_permissions: [],
      allowed_actions: [],
      triggers: [],
      budget: {},
    }));

    let createdAgents: Array<{ id: string; name: string; role: string }> = [];
    if (agentInserts.length > 0) {
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .insert(agentInserts)
        .select('id, name, role');

      if (agentsError) {
        console.error('[ai/setup] Failed to create agents:', agentsError);
      } else {
        createdAgents = agentsData ?? [];
      }
    }

    // Create deadlines
    const deadlines = industryConfig.deadlines(today);
    const deadlineInserts = deadlines.map((d) => ({
      business_id: business.id,
      title: d.title,
      due_date: d.dueDate,
      category: d.category,
      description: d.description,
      status: 'pending',
    }));

    if (deadlineInserts.length > 0) {
      const { error: deadlinesError } = await supabase
        .from('deadlines')
        .insert(deadlineInserts);

      if (deadlinesError) {
        console.error('[ai/setup] Failed to create deadlines:', deadlinesError);
      }
    }

    // Create safety config
    const { error: safetyError } = await supabase
      .from('safety_config')
      .insert({
        business_id: business.id,
        kill_switch_active: false,
        kill_switch_level: 0,
        global_daily_budget: 50.0,
        global_monthly_budget: 500.0,
        routing_strategy: routingStrategy,
        model_routing_strategy: routingStrategy,
      });

    if (safetyError) {
      console.error('[ai/setup] Failed to create safety config:', safetyError);
    }

    return NextResponse.json({
      business,
      agents: createdAgents,
      summary: {
        businessName: business.name,
        agentCount: createdAgents.length,
        modelStrategy: routingStrategy,
        template,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[ai/setup] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
