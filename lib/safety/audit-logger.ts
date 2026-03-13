import type { SupabaseClient } from '@supabase/supabase-js';

export interface AuditEntry {
  businessId: string;
  actor: string; // agent ID or 'user' or 'system'
  action: string;
  resourceType?: string;
  resourceId?: string;
  costUsd?: number;
  modelUsed?: string;
  tokensUsed?: number;
  contextAccessed?: string[];
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

interface AuditFilters {
  startDate?: string;
  endDate?: string;
  actor?: string;
  action?: string;
  resourceType?: string;
  success?: boolean;
  limit?: number;
  offset?: number;
}

export async function logAudit(
  entry: AuditEntry,
  supabase: SupabaseClient
): Promise<void> {
  const { error } = await supabase.from('audit_log').insert({
    business_id: entry.businessId,
    actor: entry.actor,
    action: entry.action,
    resource_type: entry.resourceType ?? null,
    resource_id: entry.resourceId ?? null,
    cost_usd: entry.costUsd ?? null,
    model_used: entry.modelUsed ?? null,
    tokens_used: entry.tokensUsed ?? null,
    context_accessed: entry.contextAccessed ?? null,
    success: entry.success,
    error_message: entry.errorMessage ?? null,
    metadata: entry.metadata ?? null,
    created_at: new Date().toISOString(),
  });

  if (error) {
    // Log to console as fallback — audit logging should never throw
    console.error('[safety/audit-logger] Failed to write audit log:', error, entry);
  }
}

export async function getAuditLog(
  businessId: string,
  filters: AuditFilters,
  supabase: SupabaseClient
): Promise<Record<string, unknown>[]> {
  let query = supabase
    .from('audit_log')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate);
  }
  if (filters.actor) {
    query = query.eq('actor', filters.actor);
  }
  if (filters.action) {
    query = query.eq('action', filters.action);
  }
  if (filters.resourceType) {
    query = query.eq('resource_type', filters.resourceType);
  }
  if (filters.success !== undefined) {
    query = query.eq('success', filters.success);
  }

  query = query.range(
    filters.offset ?? 0,
    (filters.offset ?? 0) + (filters.limit ?? 50) - 1
  );

  const { data, error } = await query;

  if (error) {
    console.error('[safety/audit-logger] Failed to fetch audit log:', error);
    return [];
  }

  return data ?? [];
}
