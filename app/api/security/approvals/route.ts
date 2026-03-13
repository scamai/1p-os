// =============================================================================
// 1P OS — Exec Approvals API
// GET: list pending approvals
// POST: create approval request
// PATCH: resolve (approve/deny)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { execApprovalManager } from '@/lib/security/exec-approvals';

// -----------------------------------------------------------------------------
// Validation Schemas
// -----------------------------------------------------------------------------

const CreateRequestSchema = z.object({
  agentId: z.string().min(1),
  agentName: z.string().min(1),
  action: z.string().min(1),
  params: z.record(z.string(), z.unknown()).default({}),
  reason: z.string().min(1),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
});

const ResolveSchema = z.object({
  id: z.string().min(1),
  approved: z.boolean(),
});

// -----------------------------------------------------------------------------
// GET — List pending approval requests
// -----------------------------------------------------------------------------

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pending = execApprovalManager.listPending();

    return NextResponse.json({ approvals: pending }, { status: 200 });
  } catch (error) {
    console.error('[security/approvals] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// -----------------------------------------------------------------------------
// POST — Create a new approval request
// -----------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = CreateRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { agentId, agentName, action, params, reason, riskLevel } =
      parsed.data;

    // Check policy before creating a request
    const policy = execApprovalManager.getPolicy(action);

    if (policy === 'deny') {
      return NextResponse.json(
        { error: `Action "${action}" is permanently denied by policy` },
        { status: 403 }
      );
    }

    if (policy === 'auto') {
      return NextResponse.json(
        {
          approval: null,
          autoApproved: true,
          message: `Action "${action}" is auto-approved by policy`,
        },
        { status: 200 }
      );
    }

    // Check cached approval
    if (execApprovalManager.isApproved(agentId, action, params)) {
      return NextResponse.json(
        {
          approval: null,
          autoApproved: true,
          message: 'Previously approved action (cached)',
        },
        { status: 200 }
      );
    }

    const id = execApprovalManager.requestApproval({
      agentId,
      agentName,
      action,
      params,
      reason,
      riskLevel,
    });

    const created = execApprovalManager.getRequest(id);

    return NextResponse.json({ approval: created }, { status: 201 });
  } catch (error) {
    console.error('[security/approvals] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// -----------------------------------------------------------------------------
// PATCH — Resolve an approval request (approve or deny)
// -----------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = ResolveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, approved } = parsed.data;

    const resolved = execApprovalManager.resolve(id, approved, user.id);

    if (!resolved) {
      return NextResponse.json(
        { error: 'Approval request not found or already resolved' },
        { status: 404 }
      );
    }

    const updated = execApprovalManager.getRequest(id);

    return NextResponse.json({ approval: updated }, { status: 200 });
  } catch (error) {
    console.error('[security/approvals] PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
