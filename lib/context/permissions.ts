import type { ContextScope } from '@/lib/context/engine';

export const CONTEXT_SCOPES: ContextScope[] = [
  'identity',
  'financials',
  'relationships',
  'deadlines',
  'preferences',
  'memory',
];

export const ALL_ACTIONS = [
  'send_email',
  'send_invoice',
  'create_contract',
  'schedule_meeting',
  'update_crm',
  'post_social',
  'file_taxes',
  'create_payment_link',
  'update_website',
  'generate_report',
  'create_task',
  'send_notification',
  'update_financials',
  'manage_subscriptions',
  'delegate_task',
  'access_bank_data',
  'sign_document',
] as const;

export type Action = (typeof ALL_ACTIONS)[number];

interface AgentPermissions {
  context_permissions?: string[];
  allowed_actions?: string[];
}

export function checkAgentPermission(
  agent: AgentPermissions,
  scope: ContextScope
): boolean {
  if (!agent.context_permissions) return false;
  return agent.context_permissions.includes(scope);
}

export function checkAgentAction(
  agent: AgentPermissions,
  action: string
): boolean {
  if (!agent.allowed_actions) return false;
  return agent.allowed_actions.includes(action);
}
