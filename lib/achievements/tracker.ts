import { SupabaseClient } from '@supabase/supabase-js';

interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  check: (businessId: string, supabase: SupabaseClient) => Promise<boolean>;
}

interface UnlockedAchievement {
  id: string;
  business_id: string;
  achievement_id: string;
  unlocked_at: string;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'first_1k_month',
    name: 'First $1K Month',
    description: 'Monthly revenue reached $1,000',
    icon: 'dollar',
    check: async (businessId, supabase) => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data } = await supabase
        .from('invoices')
        .select('amount')
        .eq('business_id', businessId)
        .eq('status', 'paid')
        .gte('paid_at', startOfMonth);

      const total = (data ?? []).reduce(
        (sum, inv) => sum + ((inv.amount as number) ?? 0),
        0
      );
      return total >= 1000;
    },
  },
  {
    id: 'zero_admin_week',
    name: 'Zero Admin Week',
    description: '7 days with zero decision cards created',
    icon: 'autopilot',
    check: async (businessId, supabase) => {
      const sevenDaysAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();

      const { count } = await supabase
        .from('decision_cards')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .gte('created_at', sevenDaysAgo);

      return (count ?? 0) === 0;
    },
  },
  {
    id: 'first_autopilot_month',
    name: 'First Autopilot Month',
    description: '30 days with business running on agents',
    icon: 'rocket',
    check: async (businessId, supabase) => {
      const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const { data: agents } = await supabase
        .from('agents')
        .select('created_at')
        .eq('business_id', businessId)
        .in('status', ['idle', 'active'])
        .lte('created_at', thirtyDaysAgo);

      return (agents ?? []).length > 0;
    },
  },
  {
    id: 'revenue_100k',
    name: '$100K Revenue',
    description: 'Annual revenue reached $100,000',
    icon: 'trophy',
    check: async (businessId, supabase) => {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

      const { data } = await supabase
        .from('invoices')
        .select('amount')
        .eq('business_id', businessId)
        .eq('status', 'paid')
        .gte('paid_at', startOfYear);

      const total = (data ?? []).reduce(
        (sum, inv) => sum + ((inv.amount as number) ?? 0),
        0
      );
      return total >= 100_000;
    },
  },
  {
    id: 'compliance_100',
    name: 'Perfect Compliance',
    description: 'All deadlines met on time',
    icon: 'shield',
    check: async (businessId, supabase) => {
      const { count } = await supabase
        .from('compliance_deadlines')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('missed', true);

      return (count ?? 0) === 0;
    },
  },
  {
    id: 'first_agent_hired',
    name: 'First Hire',
    description: 'Created your first agent',
    icon: 'user-plus',
    check: async (businessId, supabase) => {
      const { count } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .neq('status', 'deleted');

      return (count ?? 0) >= 1;
    },
  },
  {
    id: 'team_of_5',
    name: 'Dream Team',
    description: '5 or more active agents',
    icon: 'users',
    check: async (businessId, supabase) => {
      const { count } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .in('status', ['idle', 'active']);

      return (count ?? 0) >= 5;
    },
  },
];

export async function checkAchievements(
  businessId: string,
  supabase: SupabaseClient
): Promise<UnlockedAchievement[]> {
  try {
    // Get already unlocked achievements
    const { data: existing, error: fetchError } = await supabase
      .from('achievements')
      .select('achievement_id')
      .eq('business_id', businessId);

    if (fetchError) throw fetchError;

    const unlockedIds = new Set(
      (existing ?? []).map((a) => a.achievement_id as string)
    );

    const newlyUnlocked: UnlockedAchievement[] = [];

    for (const definition of ACHIEVEMENT_DEFINITIONS) {
      if (unlockedIds.has(definition.id)) continue;

      try {
        const met = await definition.check(businessId, supabase);
        if (met) {
          const { data, error } = await supabase
            .from('achievements')
            .insert({
              business_id: businessId,
              achievement_id: definition.id,
              unlocked_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) {
            console.error(
              `[achievements/tracker] Failed to unlock ${definition.id}:`,
              error
            );
            continue;
          }

          newlyUnlocked.push(data as UnlockedAchievement);
        }
      } catch (checkError) {
        console.error(
          `[achievements/tracker] Check failed for ${definition.id}:`,
          checkError
        );
      }
    }

    return newlyUnlocked;
  } catch (error) {
    console.error('[achievements/tracker] checkAchievements failed:', error);
    return [];
  }
}

export async function getAchievements(
  businessId: string,
  supabase: SupabaseClient
): Promise<Array<UnlockedAchievement & { name: string; description: string; icon: string }>> {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('business_id', businessId)
      .order('unlocked_at', { ascending: false });

    if (error) throw error;

    const definitionMap = new Map(
      ACHIEVEMENT_DEFINITIONS.map((d) => [d.id, d])
    );

    return ((data ?? []) as UnlockedAchievement[]).map((a) => {
      const def = definitionMap.get(a.achievement_id);
      return {
        ...a,
        name: def?.name ?? a.achievement_id,
        description: def?.description ?? '',
        icon: def?.icon ?? 'star',
      };
    });
  } catch (error) {
    console.error('[achievements/tracker] getAchievements failed:', error);
    return [];
  }
}
