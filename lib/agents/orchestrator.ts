import { SupabaseClient } from '@supabase/supabase-js';
import { executeAgent } from '@/lib/agents/runtime';
import { getUnprocessedMessages, markProcessed } from '@/lib/agents/message-bus';

interface AgentRow {
  id: string;
  business_id: string;
  status: string;
  triggers: AgentTriggerConfig[];
}

interface AgentTriggerConfig {
  type: 'schedule' | 'event' | 'message';
  schedule?: string; // cron expression
  event_type?: string;
  last_run?: string;
}

export async function processAgentTriggers(
  businessId: string,
  supabase: SupabaseClient
): Promise<void> {
  try {
    const { data: agents, error } = await supabase
      .from('agents')
      .select('id, business_id, status, triggers')
      .eq('business_id', businessId)
      .in('status', ['idle', 'active']);

    if (error) throw error;
    if (!agents || agents.length === 0) return;

    for (const agent of agents as AgentRow[]) {
      // Process unread messages
      const messages = await getUnprocessedMessages(agent.id, supabase);
      for (const msg of messages) {
        await executeAgent(
          agent.id,
          {
            type: 'message',
            data: { message: msg },
            chain_id: msg.chain_id ?? undefined,
            chain_depth: (msg.chain_depth ?? 0) + 1,
          },
          supabase
        );
        await markProcessed(msg.id, supabase);
      }

      // Check scheduled triggers
      if (agent.triggers && Array.isArray(agent.triggers)) {
        for (const trigger of agent.triggers) {
          if (trigger.type === 'schedule' && shouldRunSchedule(trigger)) {
            await executeAgent(
              agent.id,
              { type: 'schedule', data: { schedule: trigger.schedule } },
              supabase
            );
          }
        }
      }
    }
  } catch (error) {
    console.error('[agents/orchestrator] processAgentTriggers failed:', error);
  }
}

export async function handleEvent(
  businessId: string,
  eventType: string,
  eventData: Record<string, unknown>,
  supabase: SupabaseClient
): Promise<void> {
  try {
    const { data: agents, error } = await supabase
      .from('agents')
      .select('id, business_id, status, triggers')
      .eq('business_id', businessId)
      .in('status', ['idle', 'active']);

    if (error) throw error;
    if (!agents || agents.length === 0) return;

    const matchingAgents = (agents as AgentRow[]).filter((agent) =>
      agent.triggers?.some(
        (t) => t.type === 'event' && t.event_type === eventType
      )
    );

    const results = await Promise.allSettled(
      matchingAgents.map((agent) =>
        executeAgent(
          agent.id,
          { type: 'event', event_type: eventType, data: eventData },
          supabase
        )
      )
    );

    for (const result of results) {
      if (result.status === 'rejected') {
        console.error('[agents/orchestrator] Agent execution failed during event handling:', result.reason);
      }
    }
  } catch (error) {
    console.error('[agents/orchestrator] handleEvent failed:', error);
  }
}

export async function runScheduledAgents(
  supabase: SupabaseClient
): Promise<void> {
  try {
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('id')
      .eq('status', 'active');

    if (error) throw error;
    if (!businesses || businesses.length === 0) return;

    for (const business of businesses) {
      await processAgentTriggers(business.id, supabase);
    }
  } catch (error) {
    console.error('[agents/orchestrator] runScheduledAgents failed:', error);
  }
}

function shouldRunSchedule(trigger: AgentTriggerConfig): boolean {
  if (!trigger.schedule) return false;

  const lastRun = trigger.last_run ? new Date(trigger.last_run) : null;
  const now = new Date();

  if (!lastRun) return true;

  // Simple interval-based check: parse common cron-like patterns
  const schedule = trigger.schedule;

  if (schedule === '* * * * *') {
    // Every minute
    return now.getTime() - lastRun.getTime() >= 60_000;
  }

  if (schedule.startsWith('*/')) {
    // Every N minutes: */5 * * * *
    const parts = schedule.split(' ');
    const minutes = parseInt(parts[0].replace('*/', ''), 10);
    if (!isNaN(minutes)) {
      return now.getTime() - lastRun.getTime() >= minutes * 60_000;
    }
  }

  // Hourly: 0 * * * *
  if (schedule === '0 * * * *') {
    return now.getTime() - lastRun.getTime() >= 3_600_000;
  }

  // Daily: 0 9 * * * (at 9am)
  if (/^0 \d{1,2} \* \* \*$/.test(schedule)) {
    return now.getTime() - lastRun.getTime() >= 86_400_000;
  }

  // Default: check if at least 1 hour has passed
  return now.getTime() - lastRun.getTime() >= 3_600_000;
}
