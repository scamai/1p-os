import { SupabaseClient } from '@supabase/supabase-js';
import { generateStructured } from '@/lib/ai/client';
import { createAgent } from '@/lib/agents/lifecycle';

interface AgentConfig {
  name: string;
  role: string;
  system_prompt: string;
  permissions: Record<string, unknown>;
  allowed_actions: string[];
  triggers: Array<{ type: string; schedule?: string; event_type?: string }>;
  budget?: { daily_limit?: number; monthly_limit?: number; currency?: string };
  model_preference?: string;
}

interface TemplateAgent {
  name: string;
  role: string;
  system_prompt_template: string;
  permissions: Record<string, unknown>;
  allowed_actions: string[];
  triggers: Array<{ type: string; schedule?: string; event_type?: string }>;
}

interface IndustryTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  agents: TemplateAgent[];
}

const DEFAULT_CONFIGS: Record<string, Omit<AgentConfig, 'name' | 'system_prompt'>> = {
  finance: {
    role: 'finance',
    permissions: { can_read_invoices: true, can_create_invoices: true, can_send_reminders: true },
    allowed_actions: ['create_invoice', 'send_email', 'update_record', 'add_memory', 'log_event'],
    triggers: [
      { type: 'schedule', schedule: '0 9 * * *' },
      { type: 'event', event_type: 'invoice_overdue' },
      { type: 'event', event_type: 'payment_received' },
    ],
    budget: { daily_limit: 5, monthly_limit: 100, currency: 'USD' },
  },
  sales: {
    role: 'sales',
    permissions: { can_read_contacts: true, can_update_relationships: true, can_send_emails: true },
    allowed_actions: ['send_email', 'update_relationship', 'create_task', 'add_memory', 'log_event'],
    triggers: [
      { type: 'event', event_type: 'new_lead' },
      { type: 'event', event_type: 'deal_stage_changed' },
      { type: 'schedule', schedule: '0 8 * * 1' },
    ],
    budget: { daily_limit: 8, monthly_limit: 150, currency: 'USD' },
  },
  legal: {
    role: 'legal',
    permissions: { can_read_contracts: true, can_flag_compliance: true, can_create_tasks: true },
    allowed_actions: ['create_task', 'send_email', 'add_memory', 'log_event'],
    triggers: [
      { type: 'event', event_type: 'contract_expiring' },
      { type: 'event', event_type: 'compliance_deadline' },
      { type: 'schedule', schedule: '0 10 * * 1' },
    ],
    budget: { daily_limit: 3, monthly_limit: 60, currency: 'USD' },
  },
  marketing: {
    role: 'marketing',
    permissions: { can_read_analytics: true, can_send_emails: true, can_create_content: true },
    allowed_actions: ['send_email', 'create_task', 'add_memory', 'log_event'],
    triggers: [
      { type: 'schedule', schedule: '0 9 * * 1' },
      { type: 'event', event_type: 'campaign_completed' },
    ],
    budget: { daily_limit: 5, monthly_limit: 100, currency: 'USD' },
  },
  ops: {
    role: 'ops',
    permissions: { can_manage_tasks: true, can_read_all: true, can_coordinate_agents: true },
    allowed_actions: ['create_task', 'update_record', 'send_email', 'add_memory', 'log_event'],
    triggers: [
      { type: 'schedule', schedule: '0 8 * * *' },
      { type: 'event', event_type: 'task_overdue' },
      { type: 'event', event_type: 'agent_error' },
    ],
    budget: { daily_limit: 10, monthly_limit: 200, currency: 'USD' },
  },
};

export async function createAgentsFromTemplate(
  businessId: string,
  templateSlug: string,
  businessDescription: string,
  supabase: SupabaseClient
): Promise<AgentConfig[]> {
  try {
    const { data: template, error } = await supabase
      .from('industry_templates')
      .select('*')
      .eq('slug', templateSlug)
      .single();

    if (error || !template) {
      throw new Error(`Template not found: ${templateSlug}`);
    }

    const typedTemplate = template as IndustryTemplate;
    const createdAgents: AgentConfig[] = [];

    for (const agentTemplate of typedTemplate.agents) {
      // Customize system prompt with business description
      const systemPrompt = agentTemplate.system_prompt_template
        .replace(/\{\{business_description\}\}/g, businessDescription)
        .replace(/\{\{business_id\}\}/g, businessId);

      const config: AgentConfig = {
        name: agentTemplate.name,
        role: agentTemplate.role,
        system_prompt: systemPrompt,
        permissions: agentTemplate.permissions,
        allowed_actions: agentTemplate.allowed_actions,
        triggers: agentTemplate.triggers,
      };

      await createAgent(businessId, config, supabase);
      createdAgents.push(config);
    }

    return createdAgents;
  } catch (error) {
    console.error('[agents/factory] createAgentsFromTemplate failed:', error);
    throw error;
  }
}

export async function createCustomAgent(
  businessId: string,
  naturalLanguageDescription: string,
  supabase: SupabaseClient
): Promise<AgentConfig> {
  try {
    const schema = {
      parse: (data: unknown): AgentConfig => {
        const d = data as Record<string, unknown>;
        return {
          name: d.name as string,
          role: d.role as string,
          system_prompt: d.system_prompt as string,
          permissions: (d.permissions as Record<string, unknown>) ?? {},
          allowed_actions: (d.allowed_actions as string[]) ?? [],
          triggers: (d.triggers as AgentConfig['triggers']) ?? [],
          budget: d.budget as AgentConfig['budget'],
          model_preference: d.model_preference as string | undefined,
        };
      },
    };

    const config = await generateStructured<AgentConfig>(
      `Create an AI agent configuration based on this description: "${naturalLanguageDescription}"

Return a JSON object with these fields:
- name: a short, professional name for the agent
- role: one of "finance", "sales", "legal", "marketing", "ops", or a custom role
- system_prompt: a detailed system prompt explaining the agent's responsibilities and how it should behave
- permissions: an object of permission flags relevant to the role
- allowed_actions: array of actions from: create_invoice, send_email, update_relationship, add_memory, create_task, update_record, log_event
- triggers: array of trigger objects with type ("schedule"|"event"), optional schedule (cron), optional event_type
- budget: object with daily_limit and monthly_limit in USD
- model_preference: the AI model to use (default: "claude-sonnet-4-20250514")`,
      schema,
      {
        systemPrompt: 'You are an expert at designing AI agent configurations for business automation.',
        temperature: 0.5,
      }
    );

    // Return config for user approval — do not create yet
    return config;
  } catch (error) {
    console.error('[agents/factory] createCustomAgent failed:', error);
    throw error;
  }
}

export function getDefaultAgentConfig(
  role: string
): Omit<AgentConfig, 'name' | 'system_prompt'> | null {
  return DEFAULT_CONFIGS[role] ?? null;
}
