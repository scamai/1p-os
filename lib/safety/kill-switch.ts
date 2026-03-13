import type { SupabaseClient } from '@supabase/supabase-js';

export type KillSwitchLevel = 1 | 2 | 3;

interface KillSwitchStatus {
  active: boolean;
  level: KillSwitchLevel | null;
  activatedAt: string | null;
  affectedAgents: string[];
}

export async function activateKillSwitch(
  businessId: string,
  level: KillSwitchLevel,
  supabase: SupabaseClient,
  targetAgentId?: string
): Promise<void> {
  const now = new Date().toISOString();

  switch (level) {
    case 1: {
      // Pause one specific agent
      if (!targetAgentId) {
        throw new Error('Level 1 kill switch requires a target agent ID');
      }
      await supabase
        .from('agents')
        .update({ status: 'paused', paused_at: now })
        .eq('id', targetAgentId)
        .eq('business_id', businessId);
      break;
    }
    case 2: {
      // Pause all agents for this business
      await supabase
        .from('agents')
        .update({ status: 'paused', paused_at: now })
        .eq('business_id', businessId);
      break;
    }
    case 3: {
      // Full lockdown — pause all agents and set business to lockdown
      await supabase
        .from('agents')
        .update({ status: 'paused', paused_at: now })
        .eq('business_id', businessId);

      await supabase
        .from('businesses')
        .update({ lockdown_mode: true, lockdown_at: now })
        .eq('id', businessId);
      break;
    }
  }

  // Record the kill switch activation in safety_config
  await supabase
    .from('safety_config')
    .update({
      kill_switch_active: true,
      kill_switch_level: level,
      kill_switch_activated_at: now,
    })
    .eq('business_id', businessId);
}

export async function deactivateKillSwitch(
  businessId: string,
  supabase: SupabaseClient
): Promise<void> {
  // Resume all agents
  await supabase
    .from('agents')
    .update({ status: 'active', paused_at: null })
    .eq('business_id', businessId)
    .eq('status', 'paused');

  // Disable lockdown
  await supabase
    .from('businesses')
    .update({ lockdown_mode: false, lockdown_at: null })
    .eq('id', businessId);

  // Clear kill switch status
  await supabase
    .from('safety_config')
    .update({
      kill_switch_active: false,
      kill_switch_level: null,
      kill_switch_activated_at: null,
    })
    .eq('business_id', businessId);
}

export async function getKillSwitchStatus(
  businessId: string,
  supabase: SupabaseClient
): Promise<KillSwitchStatus> {
  const { data: config } = await supabase
    .from('safety_config')
    .select('kill_switch_active, kill_switch_level, kill_switch_activated_at')
    .eq('business_id', businessId)
    .single();

  if (!config?.kill_switch_active) {
    return { active: false, level: null, activatedAt: null, affectedAgents: [] };
  }

  const { data: pausedAgents } = await supabase
    .from('agents')
    .select('id')
    .eq('business_id', businessId)
    .eq('status', 'paused');

  return {
    active: true,
    level: config.kill_switch_level as KillSwitchLevel,
    activatedAt: config.kill_switch_activated_at,
    affectedAgents: (pausedAgents ?? []).map((a) => a.id),
  };
}
