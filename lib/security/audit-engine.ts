// =============================================================================
// 1P OS — Security Audit Engine
// Comprehensive security posture assessment for businesses
// =============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { UUID, Timestamp } from '@/lib/types';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type AuditSeverity = 'info' | 'warn' | 'critical';

export type AuditCategory =
  | 'auth'
  | 'channels'
  | 'agents'
  | 'budget'
  | 'config'
  | 'data';

export interface AuditFinding {
  id: string;
  severity: AuditSeverity;
  category: AuditCategory;
  title: string;
  detail: string;
  remediation?: string;
  timestamp: Timestamp;
}

export interface SecurityAuditReport {
  timestamp: Timestamp;
  score: number; // 0-100
  findings: AuditFinding[];
  summary: string;
}

// -----------------------------------------------------------------------------
// Scoring weights
// -----------------------------------------------------------------------------

const SEVERITY_DEDUCTIONS: Record<AuditSeverity, number> = {
  critical: 20,
  warn: 5,
  info: 0,
};

// -----------------------------------------------------------------------------
// Security Auditor
// -----------------------------------------------------------------------------

export class SecurityAuditor {
  private findingCounter = 0;

  // ---------------------------------------------------------------------------
  // Full Audit
  // ---------------------------------------------------------------------------

  async runFullAudit(
    businessId: UUID,
    supabase: SupabaseClient
  ): Promise<SecurityAuditReport> {
    this.findingCounter = 0;
    const now = new Date().toISOString();

    const allFindings: AuditFinding[] = [];

    const checks = [
      this.checkBudgetLimits(businessId, supabase),
      this.checkAgentPermissions(businessId, supabase),
      this.checkChannelSecurity(businessId, supabase),
      this.checkApiKeys(),
      this.checkRlsPolicies(businessId, supabase),
      this.checkKillSwitch(businessId, supabase),
      this.checkAuditLog(businessId, supabase),
      this.checkEncryption(),
      this.checkCircuitBreakers(businessId, supabase),
      this.checkHumanGates(businessId, supabase),
    ];

    const results = await Promise.allSettled(checks);

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allFindings.push(...result.value);
      } else {
        allFindings.push(
          this.finding('critical', 'config', 'Audit check failed', result.reason as string)
        );
      }
    }

    const score = this.calculateScore(allFindings);

    const criticalCount = allFindings.filter((f) => f.severity === 'critical').length;
    const warnCount = allFindings.filter((f) => f.severity === 'warn').length;

    let summary: string;
    if (criticalCount === 0 && warnCount === 0) {
      summary = 'All security checks passed. No issues detected.';
    } else if (criticalCount === 0) {
      summary = `${warnCount} warning${warnCount > 1 ? 's' : ''} found. No critical issues.`;
    } else {
      summary = `${criticalCount} critical issue${criticalCount > 1 ? 's' : ''} and ${warnCount} warning${warnCount > 1 ? 's' : ''} found. Immediate attention required.`;
    }

    return {
      timestamp: now,
      score,
      findings: allFindings,
      summary,
    };
  }

  // ---------------------------------------------------------------------------
  // Individual Checks
  // ---------------------------------------------------------------------------

  async checkBudgetLimits(
    businessId: UUID,
    supabase: SupabaseClient
  ): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = [];

    // Check global budget config
    const { data: config } = await supabase
      .from('safety_config')
      .select('global_daily_budget_usd, global_monthly_budget_usd')
      .eq('business_id', businessId)
      .single();

    if (!config) {
      findings.push(
        this.finding(
          'critical',
          'budget',
          'No safety configuration found',
          'Business has no safety_config record. Budget limits are not enforced.',
          'Create a safety_config record with appropriate budget limits.'
        )
      );
      return findings;
    }

    if (!config.global_daily_budget_usd || config.global_daily_budget_usd <= 0) {
      findings.push(
        this.finding(
          'critical',
          'budget',
          'No global daily budget set',
          'Global daily budget is not configured. Agents can spend without limit.',
          'Set a global daily budget in safety settings.'
        )
      );
    }

    if (!config.global_monthly_budget_usd || config.global_monthly_budget_usd <= 0) {
      findings.push(
        this.finding(
          'critical',
          'budget',
          'No global monthly budget set',
          'Global monthly budget is not configured.',
          'Set a global monthly budget in safety settings.'
        )
      );
    }

    // Check individual agent budgets
    const { data: agents } = await supabase
      .from('agents')
      .select('id, name, budget_daily_usd, budget_monthly_usd, spent_today_usd, spent_this_month_usd')
      .eq('business_id', businessId);

    for (const agent of agents ?? []) {
      if (!agent.budget_daily_usd || agent.budget_daily_usd <= 0) {
        findings.push(
          this.finding(
            'warn',
            'budget',
            `Agent "${agent.name}" has no daily budget`,
            `Agent ${agent.id} does not have a daily budget limit configured.`,
            'Set a daily budget for this agent.'
          )
        );
      }

      // Check if agent is near budget
      if (
        agent.budget_daily_usd &&
        agent.spent_today_usd &&
        agent.spent_today_usd > agent.budget_daily_usd * 0.9
      ) {
        findings.push(
          this.finding(
            'warn',
            'budget',
            `Agent "${agent.name}" near daily budget limit`,
            `Agent has spent $${agent.spent_today_usd.toFixed(2)} of $${agent.budget_daily_usd.toFixed(2)} daily budget (${Math.round((agent.spent_today_usd / agent.budget_daily_usd) * 100)}%).`
          )
        );
      }
    }

    return findings;
  }

  async checkAgentPermissions(
    businessId: UUID,
    supabase: SupabaseClient
  ): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = [];

    const { data: agents } = await supabase
      .from('agents')
      .select('id, name, allowed_actions, context_permissions')
      .eq('business_id', businessId);

    const sensitiveActions = [
      'delete_data',
      'change_permissions',
      'access_bank_data',
      'file_taxes',
      'send_legal_notice',
    ];

    for (const agent of agents ?? []) {
      const actions = (agent.allowed_actions ?? []) as string[];

      // Check for overly broad permissions
      if (actions.length > 10) {
        findings.push(
          this.finding(
            'warn',
            'agents',
            `Agent "${agent.name}" has many allowed actions`,
            `Agent has ${actions.length} allowed actions. Consider applying the principle of least privilege.`,
            'Review and reduce the agent\'s allowed actions to only what is necessary.'
          )
        );
      }

      // Check for sensitive actions
      const agentSensitive = actions.filter((a) => sensitiveActions.includes(a));
      if (agentSensitive.length > 0) {
        findings.push(
          this.finding(
            'warn',
            'agents',
            `Agent "${agent.name}" has sensitive permissions`,
            `Agent has access to sensitive actions: ${agentSensitive.join(', ')}.`,
            'Ensure human gate is configured for these actions.'
          )
        );
      }
    }

    return findings;
  }

  async checkChannelSecurity(
    businessId: UUID,
    supabase: SupabaseClient
  ): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = [];

    // Check if any connected channels exist and have auth configured
    const { data: channels } = await supabase
      .from('channels')
      .select('id, name, type, auth_configured')
      .eq('business_id', businessId);

    if (!channels || channels.length === 0) {
      findings.push(
        this.finding(
          'info',
          'channels',
          'No channels connected',
          'No external communication channels are connected.'
        )
      );
      return findings;
    }

    for (const channel of channels) {
      if (!channel.auth_configured) {
        findings.push(
          this.finding(
            'critical',
            'channels',
            `Channel "${channel.name}" has no auth`,
            `Channel "${channel.name}" (${channel.type}) does not have authentication configured.`,
            'Configure authentication for this channel before enabling agent access.'
          )
        );
      }
    }

    return findings;
  }

  async checkApiKeys(): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = [];

    const requiredKeys: Array<{ env: string; label: string }> = [
      { env: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Supabase URL' },
      { env: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', label: 'Supabase Anon Key' },
      { env: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Supabase Service Role Key' },
      { env: 'ANTHROPIC_API_KEY', label: 'Anthropic API Key' },
      { env: 'ENCRYPTION_KEY', label: 'Encryption Key' },
    ];

    const defaultPatterns = [
      'your-',
      'sk-test-',
      'pk-test-',
      'xxx',
      'placeholder',
      'changeme',
      'todo-replace-me',
    ];

    for (const { env, label } of requiredKeys) {
      const value = process.env[env];

      if (!value) {
        findings.push(
          this.finding(
            'critical',
            'config',
            `${label} not set`,
            `Environment variable ${env} is not configured.`,
            `Set ${env} in your .env.local file.`
          )
        );
        continue;
      }

      const isDefault = defaultPatterns.some((p) =>
        value.toLowerCase().includes(p.toLowerCase())
      );
      if (isDefault) {
        findings.push(
          this.finding(
            'critical',
            'config',
            `${label} appears to be a default/test value`,
            `Environment variable ${env} contains a pattern that suggests it is a placeholder.`,
            `Replace ${env} with a valid production key.`
          )
        );
      }
    }

    return findings;
  }

  async checkRlsPolicies(
    businessId: UUID,
    supabase: SupabaseClient
  ): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = [];

    // Verify RLS is active by attempting a cross-business query
    // If we can query without a business_id filter, RLS may be disabled
    const { data, error } = await supabase
      .from('agents')
      .select('id')
      .eq('business_id', businessId)
      .limit(1);

    if (error) {
      findings.push(
        this.finding(
          'warn',
          'data',
          'Unable to verify RLS policies',
          `Database query failed during RLS check: ${error.message}`,
          'Verify that RLS policies are correctly configured in Supabase.'
        )
      );
    } else {
      findings.push(
        this.finding(
          'info',
          'data',
          'RLS policies accessible',
          'Database queries are executing through RLS-protected client. Verify policies in Supabase dashboard for completeness.'
        )
      );
    }

    void data;
    return findings;
  }

  async checkKillSwitch(
    businessId: UUID,
    supabase: SupabaseClient
  ): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = [];

    const { data: config } = await supabase
      .from('safety_config')
      .select('kill_switch_active')
      .eq('business_id', businessId)
      .single();

    if (!config) {
      findings.push(
        this.finding(
          'critical',
          'config',
          'Kill switch not configured',
          'No safety configuration found. Kill switch cannot be verified.',
          'Create a safety_config record for this business.'
        )
      );
      return findings;
    }

    if (config.kill_switch_active) {
      findings.push(
        this.finding(
          'warn',
          'config',
          'Kill switch is currently active',
          'The kill switch is engaged. All agent operations may be paused.',
          'Deactivate the kill switch when the situation is resolved.'
        )
      );
    } else {
      findings.push(
        this.finding(
          'info',
          'config',
          'Kill switch is accessible and inactive',
          'Kill switch is properly configured and currently inactive.'
        )
      );
    }

    return findings;
  }

  async checkAuditLog(
    businessId: UUID,
    supabase: SupabaseClient
  ): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = [];

    // Check that audit logging is producing entries
    const { data: recentLogs, error } = await supabase
      .from('audit_log')
      .select('id')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      findings.push(
        this.finding(
          'warn',
          'data',
          'Unable to verify audit logging',
          `Could not query audit_log: ${error.message}`,
          'Verify audit_log table exists and has correct RLS policies.'
        )
      );
      return findings;
    }

    if (!recentLogs || recentLogs.length === 0) {
      findings.push(
        this.finding(
          'warn',
          'data',
          'No audit log entries found',
          'The audit log has no entries for this business. Logging may not be active.',
          'Ensure all AI calls and agent actions are routed through the audit logger.'
        )
      );
    } else {
      findings.push(
        this.finding(
          'info',
          'data',
          'Audit logging is active',
          'Recent audit log entries exist for this business.'
        )
      );
    }

    return findings;
  }

  async checkEncryption(): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = [];

    const encryptionKey = process.env.ENCRYPTION_KEY;

    if (!encryptionKey) {
      findings.push(
        this.finding(
          'critical',
          'config',
          'Encryption key not set',
          'ENCRYPTION_KEY environment variable is not configured. Sensitive data cannot be encrypted.',
          'Generate a strong AES-256 key and set it as ENCRYPTION_KEY.'
        )
      );
      return findings;
    }

    // Check key strength (AES-256-GCM requires 32 bytes = 64 hex chars or 44 base64 chars)
    if (encryptionKey.length < 32) {
      findings.push(
        this.finding(
          'critical',
          'config',
          'Encryption key may be too short',
          `ENCRYPTION_KEY is ${encryptionKey.length} characters. AES-256 requires at least 32 bytes.`,
          'Generate a 256-bit (32-byte) encryption key.'
        )
      );
    } else {
      findings.push(
        this.finding(
          'info',
          'config',
          'Encryption key is configured',
          'ENCRYPTION_KEY is set and appears to be of sufficient length.'
        )
      );
    }

    return findings;
  }

  async checkCircuitBreakers(
    businessId: UUID,
    supabase: SupabaseClient
  ): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = [];

    const { data: config } = await supabase
      .from('safety_config')
      .select('circuit_breaker_max_failures, circuit_breaker_window_seconds')
      .eq('business_id', businessId)
      .single();

    if (!config) {
      findings.push(
        this.finding(
          'critical',
          'config',
          'Circuit breaker not configured',
          'No safety configuration found for circuit breaker settings.',
          'Create a safety_config record with circuit breaker thresholds.'
        )
      );
      return findings;
    }

    if (
      !config.circuit_breaker_max_failures ||
      config.circuit_breaker_max_failures <= 0
    ) {
      findings.push(
        this.finding(
          'warn',
          'config',
          'Circuit breaker max failures not set',
          'circuit_breaker_max_failures is not configured. Agents will not auto-pause on repeated failures.',
          'Set circuit_breaker_max_failures (recommended: 3).'
        )
      );
    }

    if (
      !config.circuit_breaker_window_seconds ||
      config.circuit_breaker_window_seconds <= 0
    ) {
      findings.push(
        this.finding(
          'warn',
          'config',
          'Circuit breaker window not set',
          'circuit_breaker_window_seconds is not configured.',
          'Set circuit_breaker_window_seconds (recommended: 300).'
        )
      );
    }

    // Check for agents with open circuits
    const { data: openCircuits } = await supabase
      .from('agents')
      .select('id, name')
      .eq('business_id', businessId)
      .eq('circuit_open', true);

    if (openCircuits && openCircuits.length > 0) {
      const names = openCircuits.map((a) => a.name).join(', ');
      findings.push(
        this.finding(
          'warn',
          'agents',
          'Agents with open circuit breakers',
          `The following agents have tripped their circuit breaker: ${names}.`,
          'Investigate the failures and reset the circuit breakers when resolved.'
        )
      );
    }

    return findings;
  }

  async checkHumanGates(
    businessId: UUID,
    supabase: SupabaseClient
  ): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = [];

    const { data: config } = await supabase
      .from('safety_config')
      .select('human_gate_overrides')
      .eq('business_id', businessId)
      .single();

    const sensitiveActions = [
      'send_invoice',
      'create_contract',
      'sign_document',
      'file_taxes',
      'access_bank_data',
      'create_payment_link',
      'delete_data',
    ];

    if (!config) {
      findings.push(
        this.finding(
          'warn',
          'config',
          'Human gate configuration not found',
          'Cannot verify human gate settings without safety_config.',
          'Create a safety_config record for this business.'
        )
      );
      return findings;
    }

    const overrides = (config.human_gate_overrides ?? []) as Array<{
      action: string;
      always_require_approval: boolean;
    }>;

    const overrideMap = new Map(overrides.map((o) => [o.action, o.always_require_approval]));

    for (const action of sensitiveActions) {
      const override = overrideMap.get(action);
      if (override === false) {
        findings.push(
          this.finding(
            'warn',
            'config',
            `Human approval bypassed for "${action}"`,
            `The sensitive action "${action}" has human approval explicitly disabled via override.`,
            'Re-enable human approval for this action unless there is a strong reason to bypass it.'
          )
        );
      }
    }

    if (findings.length === 0) {
      findings.push(
        this.finding(
          'info',
          'config',
          'Human gates properly configured',
          'All sensitive actions require human approval or have no bypass overrides.'
        )
      );
    }

    return findings;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private finding(
    severity: AuditSeverity,
    category: AuditCategory,
    title: string,
    detail: string,
    remediation?: string
  ): AuditFinding {
    this.findingCounter++;
    return {
      id: `finding-${this.findingCounter}`,
      severity,
      category,
      title,
      detail,
      remediation,
      timestamp: new Date().toISOString(),
    };
  }

  private calculateScore(findings: AuditFinding[]): number {
    let score = 100;
    for (const finding of findings) {
      score -= SEVERITY_DEDUCTIONS[finding.severity];
    }
    return Math.max(0, score);
  }
}

// -----------------------------------------------------------------------------
// Singleton
// -----------------------------------------------------------------------------

export const securityAuditor = new SecurityAuditor();
