import { ALL_ACTIONS } from '@/lib/context/permissions';

interface AgentForValidation {
  allowed_actions?: string[];
  status?: string;
  circuit_open?: boolean;
}

interface ValidationResult {
  valid: boolean;
  reason?: string;
}

const DANGEROUS_PATTERNS = [
  /\beval\b/i,
  /\bexec\b/i,
  /\bsystem\b/i,
  /\brm\s+-rf\b/i,
  /\bdrop\s+table\b/i,
  /\bdelete\s+from\b/i,
  /\btruncate\b/i,
  /<script\b/i,
  /javascript:/i,
  /data:text\/html/i,
  /\bonclick\b/i,
  /\bonerror\b/i,
];

export function validateAction(
  agent: AgentForValidation,
  action: string,
  params?: Record<string, unknown>
): ValidationResult {
  // Check agent status
  if (agent.status === 'paused') {
    return { valid: false, reason: 'Agent is currently paused' };
  }

  if (agent.circuit_open) {
    return { valid: false, reason: 'Agent circuit breaker is open' };
  }

  // Check if action is in allowed list
  if (!agent.allowed_actions?.includes(action)) {
    return {
      valid: false,
      reason: `Action "${action}" is not in agent's allowed actions`,
    };
  }

  // Check if action is a recognized action
  if (!(ALL_ACTIONS as readonly string[]).includes(action)) {
    return {
      valid: false,
      reason: `Action "${action}" is not a recognized system action`,
    };
  }

  // Validate params for dangerous patterns
  if (params) {
    const paramsStr = JSON.stringify(params);
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(paramsStr)) {
        return {
          valid: false,
          reason: `Action params contain a potentially dangerous pattern: ${pattern.source}`,
        };
      }
    }
  }

  return { valid: true };
}

export function sanitizeOutput(output: string): string {
  let sanitized = output;

  // Remove potential script injections
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers
  sanitized = sanitized.replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '');

  // Remove javascript: and data: URIs
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  // Remove zero-width characters that could be used for prompt injection
  sanitized = sanitized.replace(/[\u200B-\u200F\u2028-\u202F\uFEFF]/g, '');

  return sanitized;
}
