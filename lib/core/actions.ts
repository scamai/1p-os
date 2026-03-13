import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Action Registry — every action the AI Core can take.
 * All actions are deterministic CRUD operations. No AI calls.
 */

export interface ActionResult {
  success: boolean;
  message: string;
  data?: unknown;
  navigate?: string; // URL to navigate to after action
}

export interface ActionDef {
  id: string;
  description: string;
  category: 'create' | 'update' | 'delete' | 'navigate' | 'configure' | 'report';
  requiresApproval: boolean;
  execute: (params: Record<string, unknown>, supabase: SupabaseClient, businessId: string) => Promise<ActionResult>;
}

// ── Action implementations ──

async function createInvoice(params: Record<string, unknown>, supabase: SupabaseClient, businessId: string): Promise<ActionResult> {
  const { data, error } = await supabase
    .from('invoices')
    .insert({
      business_id: businessId,
      client_name: params.client_name as string ?? 'New Client',
      amount: params.amount as number ?? 0,
      currency: (params.currency as string) ?? 'usd',
      description: params.description as string ?? '',
      due_date: params.due_date as string ?? new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: 'draft',
    })
    .select()
    .single();

  if (error) return { success: false, message: `Failed to create invoice: ${error.message}` };
  return { success: true, message: `Invoice created for ${params.client_name ?? 'New Client'}`, data, navigate: '/finance' };
}

async function createExpense(params: Record<string, unknown>, supabase: SupabaseClient, businessId: string): Promise<ActionResult> {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      business_id: businessId,
      description: params.description as string ?? 'New expense',
      amount: params.amount as number ?? 0,
      category: params.category as string ?? 'other',
      date: params.date as string ?? new Date().toISOString().split('T')[0],
    })
    .select()
    .single();

  if (error) return { success: false, message: `Failed to log expense: ${error.message}` };
  return { success: true, message: `Expense logged: $${params.amount ?? 0}`, data, navigate: '/finance' };
}

async function addPerson(params: Record<string, unknown>, supabase: SupabaseClient, businessId: string): Promise<ActionResult> {
  const { data, error } = await supabase
    .from('relationships')
    .insert({
      business_id: businessId,
      name: params.name as string ?? 'New Contact',
      email: params.email as string ?? null,
      type: params.type as string ?? 'lead',
      notes: params.notes as string ?? null,
    })
    .select()
    .single();

  if (error) return { success: false, message: `Failed to add person: ${error.message}` };
  return { success: true, message: `Added ${params.name ?? 'contact'}`, data, navigate: '/people' };
}

async function createAgent(params: Record<string, unknown>, supabase: SupabaseClient, businessId: string): Promise<ActionResult> {
  const { data, error } = await supabase
    .from('agents')
    .insert({
      business_id: businessId,
      name: params.name as string ?? 'New Agent',
      role: params.role as string ?? 'general',
      description: params.description as string ?? '',
      status: 'active',
      system_prompt: params.system_prompt as string ?? '',
      context_permissions: params.context_permissions ?? [],
      allowed_actions: params.allowed_actions ?? [],
      triggers: params.triggers ?? [],
      budget: params.budget ?? {},
    })
    .select()
    .single();

  if (error) return { success: false, message: `Failed to create agent: ${error.message}` };
  return { success: true, message: `Agent "${params.name}" hired`, data, navigate: '/team' };
}

async function pauseAgent(params: Record<string, unknown>, supabase: SupabaseClient, businessId: string): Promise<ActionResult> {
  const agentId = params.agentId as string;
  if (!agentId) return { success: false, message: 'No agent specified' };

  const { error } = await supabase
    .from('agents')
    .update({ status: 'paused' })
    .eq('id', agentId)
    .eq('business_id', businessId);

  if (error) return { success: false, message: `Failed to pause agent: ${error.message}` };
  return { success: true, message: 'Agent paused' };
}

async function resumeAgent(params: Record<string, unknown>, supabase: SupabaseClient, businessId: string): Promise<ActionResult> {
  const agentId = params.agentId as string;
  if (!agentId) {
    // Resume all
    const { error } = await supabase
      .from('agents')
      .update({ status: 'active' })
      .eq('business_id', businessId)
      .eq('status', 'paused');
    if (error) return { success: false, message: `Failed: ${error.message}` };
    return { success: true, message: 'All agents resumed' };
  }

  const { error } = await supabase
    .from('agents')
    .update({ status: 'active' })
    .eq('id', agentId)
    .eq('business_id', businessId);

  if (error) return { success: false, message: `Failed: ${error.message}` };
  return { success: true, message: 'Agent resumed' };
}

async function updateBudget(params: Record<string, unknown>, supabase: SupabaseClient, businessId: string): Promise<ActionResult> {
  const updates: Record<string, unknown> = {};
  if (params.daily_limit !== undefined) updates.global_daily_budget = params.daily_limit;
  if (params.monthly_limit !== undefined) updates.global_monthly_budget = params.monthly_limit;

  const { error } = await supabase
    .from('safety_config')
    .update(updates)
    .eq('business_id', businessId);

  if (error) return { success: false, message: `Failed: ${error.message}` };
  return { success: true, message: 'Budget updated', navigate: '/settings' };
}

async function setModelStrategy(params: Record<string, unknown>, supabase: SupabaseClient, businessId: string): Promise<ActionResult> {
  const strategy = params.strategy as string ?? 'balanced';
  const { error } = await supabase
    .from('safety_config')
    .update({ model_routing_strategy: strategy, routing_strategy: strategy })
    .eq('business_id', businessId);

  if (error) return { success: false, message: `Failed: ${error.message}` };
  return { success: true, message: `Model strategy set to "${strategy}"`, navigate: '/settings' };
}

function navigate(params: Record<string, unknown>): ActionResult {
  const page = params.page as string ?? '/';
  return { success: true, message: `Navigating to ${page}`, navigate: page };
}

// ── Navigate action (synchronous, no DB) ──
async function navigateAction(params: Record<string, unknown>): Promise<ActionResult> {
  return navigate(params);
}

// ── Registry ──

export const ACTION_REGISTRY: Record<string, ActionDef> = {
  create_invoice: {
    id: 'create_invoice',
    description: 'Create a new invoice',
    category: 'create',
    requiresApproval: false,
    execute: createInvoice,
  },
  create_expense: {
    id: 'create_expense',
    description: 'Log an expense',
    category: 'create',
    requiresApproval: false,
    execute: createExpense,
  },
  add_person: {
    id: 'add_person',
    description: 'Add a person/contact',
    category: 'create',
    requiresApproval: false,
    execute: addPerson,
  },
  create_agent: {
    id: 'create_agent',
    description: 'Hire a new agent',
    category: 'create',
    requiresApproval: false,
    execute: createAgent,
  },
  pause_agent: {
    id: 'pause_agent',
    description: 'Pause an agent',
    category: 'configure',
    requiresApproval: false,
    execute: pauseAgent,
  },
  resume_agent: {
    id: 'resume_agent',
    description: 'Resume an agent',
    category: 'configure',
    requiresApproval: false,
    execute: resumeAgent,
  },
  update_budget: {
    id: 'update_budget',
    description: 'Update spending budget',
    category: 'configure',
    requiresApproval: true,
    execute: updateBudget,
  },
  set_model_strategy: {
    id: 'set_model_strategy',
    description: 'Change AI model strategy',
    category: 'configure',
    requiresApproval: false,
    execute: setModelStrategy,
  },
  navigate: {
    id: 'navigate',
    description: 'Go to a page',
    category: 'navigate',
    requiresApproval: false,
    execute: navigateAction,
  },
};

export function getAction(id: string): ActionDef | undefined {
  return ACTION_REGISTRY[id];
}

export function listActions(): ActionDef[] {
  return Object.values(ACTION_REGISTRY);
}
