// =============================================================================
// 1P OS — Exec Approval Manager
// Approval gate for dangerous agent actions
// =============================================================================

import type { Timestamp } from '@/lib/types';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ApprovalStatus = 'pending' | 'approved' | 'denied' | 'expired';
export type ApprovalPolicy = 'auto' | 'ask' | 'deny';

export interface ExecApprovalRequest {
  id: string;
  agentId: string;
  agentName: string;
  action: string;
  params: Record<string, unknown>;
  reason: string;
  riskLevel: RiskLevel;
  status: ApprovalStatus;
  createdAt: Timestamp;
  resolvedAt?: string;
  resolvedBy?: string;
}

// -----------------------------------------------------------------------------
// Policy Configuration
// -----------------------------------------------------------------------------

const ALWAYS_REQUIRE_APPROVAL: readonly string[] = [
  'send_email',
  'create_invoice',
  'code_execute',
  'file_write',
  'schedule_task',
  'send_message',
] as const;

const AUTO_APPROVE: readonly string[] = [
  'web_browse',
  'web_search',
  'query_data',
  'file_read',
] as const;

const ALWAYS_DENY: readonly string[] = [
  'system_shutdown',
  'drop_database',
  'disable_rls',
] as const;

// Approval cache TTL
const APPROVAL_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Request expiry
const REQUEST_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

// -----------------------------------------------------------------------------
// Approval Cache Entry
// -----------------------------------------------------------------------------

interface CachedApproval {
  agentId: string;
  action: string;
  paramsHash: string;
  approvedAt: number;
}

// -----------------------------------------------------------------------------
// Exec Approval Manager
// -----------------------------------------------------------------------------

export class ExecApprovalManager {
  private requests: Map<string, ExecApprovalRequest> = new Map();
  private approvalCache: Map<string, CachedApproval> = new Map();
  private counter = 0;
  private customPolicies: Map<string, ApprovalPolicy> = new Map();

  // ---------------------------------------------------------------------------
  // Request Management
  // ---------------------------------------------------------------------------

  requestApproval(
    req: Omit<ExecApprovalRequest, 'id' | 'status' | 'createdAt'>
  ): string {
    this.counter++;
    const id = `exec-${Date.now()}-${this.counter}`;

    const request: ExecApprovalRequest = {
      ...req,
      id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.requests.set(id, request);
    return id;
  }

  resolve(id: string, approved: boolean, resolvedBy: string): boolean {
    const request = this.requests.get(id);
    if (!request || request.status !== 'pending') {
      return false;
    }

    request.status = approved ? 'approved' : 'denied';
    request.resolvedAt = new Date().toISOString();
    request.resolvedBy = resolvedBy;

    // Cache the approval for future identical requests
    if (approved) {
      const cacheKey = this.buildCacheKey(
        request.agentId,
        request.action,
        request.params
      );
      this.approvalCache.set(cacheKey, {
        agentId: request.agentId,
        action: request.action,
        paramsHash: this.hashParams(request.params),
        approvedAt: Date.now(),
      });
    }

    return true;
  }

  getRequest(id: string): ExecApprovalRequest | undefined {
    return this.requests.get(id);
  }

  listPending(): ExecApprovalRequest[] {
    this.expireStaleRequests();

    return Array.from(this.requests.values()).filter(
      (r) => r.status === 'pending'
    );
  }

  listAll(): ExecApprovalRequest[] {
    return Array.from(this.requests.values());
  }

  // ---------------------------------------------------------------------------
  // Policy
  // ---------------------------------------------------------------------------

  getPolicy(action: string): ApprovalPolicy {
    // Custom policies take precedence
    const custom = this.customPolicies.get(action);
    if (custom) {
      return custom;
    }

    if ((ALWAYS_DENY as readonly string[]).includes(action)) {
      return 'deny';
    }

    if ((ALWAYS_REQUIRE_APPROVAL as readonly string[]).includes(action)) {
      return 'ask';
    }

    if ((AUTO_APPROVE as readonly string[]).includes(action)) {
      return 'auto';
    }

    // Default: require approval for unknown actions
    return 'ask';
  }

  setPolicy(action: string, policy: ApprovalPolicy): void {
    this.customPolicies.set(action, policy);
  }

  // ---------------------------------------------------------------------------
  // Cached Approval Check
  // ---------------------------------------------------------------------------

  isApproved(
    agentId: string,
    action: string,
    params: Record<string, unknown>
  ): boolean {
    const policy = this.getPolicy(action);

    if (policy === 'auto') {
      return true;
    }

    if (policy === 'deny') {
      return false;
    }

    // Check cache for previously approved identical actions
    const cacheKey = this.buildCacheKey(agentId, action, params);
    const cached = this.approvalCache.get(cacheKey);

    if (!cached) {
      return false;
    }

    // Check TTL
    if (Date.now() - cached.approvedAt > APPROVAL_CACHE_TTL_MS) {
      this.approvalCache.delete(cacheKey);
      return false;
    }

    return true;
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private buildCacheKey(
    agentId: string,
    action: string,
    params: Record<string, unknown>
  ): string {
    return `${agentId}:${action}:${this.hashParams(params)}`;
  }

  private hashParams(params: Record<string, unknown>): string {
    // Simple deterministic hash for parameter comparison
    const sorted = JSON.stringify(params, Object.keys(params).sort());
    let hash = 0;
    for (let i = 0; i < sorted.length; i++) {
      const char = sorted.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    return hash.toString(36);
  }

  private expireStaleRequests(): void {
    const now = Date.now();
    for (const [id, request] of this.requests) {
      if (request.status !== 'pending') {
        continue;
      }
      const createdAt = new Date(request.createdAt).getTime();
      if (now - createdAt > REQUEST_EXPIRY_MS) {
        request.status = 'expired';
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Singleton
// -----------------------------------------------------------------------------

export const execApprovalManager = new ExecApprovalManager();
