import { SupabaseClient } from '@supabase/supabase-js';

interface LevelThreshold {
  level: number;
  xp_required: number;
  label: string;
  capabilities: string[];
}

const LEVEL_THRESHOLDS: LevelThreshold[] = [
  {
    level: 1,
    xp_required: 0,
    label: 'Basic',
    capabilities: ['basic task execution', 'requires approval for all actions'],
  },
  {
    level: 2,
    xp_required: 100,
    label: 'Competent',
    capabilities: ['can batch decisions', 'fewer approval prompts for routine tasks'],
  },
  {
    level: 3,
    xp_required: 300,
    label: 'Proficient',
    capabilities: ['reduced few-shot examples', 'handles routine tasks autonomously'],
  },
  {
    level: 4,
    xp_required: 700,
    label: 'Expert',
    capabilities: ['can handle complex tasks', 'multi-step reasoning', 'cross-agent coordination'],
  },
  {
    level: 5,
    xp_required: 1500,
    label: 'Autonomous',
    capabilities: ['full autonomy within scope', 'self-directed task discovery', 'mentors lower-level agents'],
  },
];

// XP values for different events
const XP_VALUES = {
  task_completed: 10,
  decision_approved: 5,
  decision_overridden: -3,
} as const;

export function getLevelThresholds(): LevelThreshold[] {
  return LEVEL_THRESHOLDS;
}

export async function addXP(
  agentId: string,
  amount: number,
  supabase: SupabaseClient
): Promise<{ newXP: number; leveledUp: boolean; newLevel: number }> {
  try {
    const { data: agent, error: fetchError } = await supabase
      .from('agents')
      .select('xp, level')
      .eq('id', agentId)
      .single();

    if (fetchError || !agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const currentXP = (agent.xp as number) ?? 0;
    const newXP = Math.max(0, currentXP + amount); // XP cannot go below 0

    const { error: updateError } = await supabase
      .from('agents')
      .update({ xp: newXP, updated_at: new Date().toISOString() })
      .eq('id', agentId);

    if (updateError) throw updateError;

    const levelUpResult = await checkLevelUp(agentId, supabase);

    return {
      newXP,
      leveledUp: levelUpResult.leveledUp,
      newLevel: levelUpResult.newLevel,
    };
  } catch (error) {
    console.error('[agents/evolution] addXP failed:', error);
    throw error;
  }
}

export async function checkLevelUp(
  agentId: string,
  supabase: SupabaseClient
): Promise<{ leveledUp: boolean; newLevel: number }> {
  try {
    const { data: agent, error: fetchError } = await supabase
      .from('agents')
      .select('xp, level')
      .eq('id', agentId)
      .single();

    if (fetchError || !agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const currentXP = (agent.xp as number) ?? 0;
    const currentLevel = (agent.level as number) ?? 1;

    // Find the highest level the agent qualifies for
    let newLevel = 1;
    for (const threshold of LEVEL_THRESHOLDS) {
      if (currentXP >= threshold.xp_required) {
        newLevel = threshold.level;
      }
    }

    if (newLevel !== currentLevel) {
      const { error: updateError } = await supabase
        .from('agents')
        .update({ level: newLevel, updated_at: new Date().toISOString() })
        .eq('id', agentId);

      if (updateError) throw updateError;

      return { leveledUp: newLevel > currentLevel, newLevel };
    }

    return { leveledUp: false, newLevel: currentLevel };
  } catch (error) {
    console.error('[agents/evolution] checkLevelUp failed:', error);
    throw error;
  }
}

export { XP_VALUES };
