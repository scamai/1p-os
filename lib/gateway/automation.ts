// =============================================================================
// 1P OS — Automation Engine
// Cron scheduling, interval jobs, and event-driven triggers for agents
// =============================================================================

import type { UUID, Timestamp } from '@/lib/types';

// -----------------------------------------------------------------------------
// Schedule Types
// -----------------------------------------------------------------------------

export type CronSchedule =
  | { kind: 'cron'; expr: string; tz?: string }
  | { kind: 'interval'; everyMs: number }
  | { kind: 'once'; at: string };

// -----------------------------------------------------------------------------
// Job Types
// -----------------------------------------------------------------------------

export interface AutomationJob {
  id: UUID;
  name: string;
  schedule: CronSchedule;
  agentId: UUID;
  payload: {
    message: string;
    model?: string;
  };
  delivery?: {
    mode: 'none' | 'announce' | 'webhook';
    channel?: string;
    to?: string;
  };
  status: 'active' | 'paused' | 'error';
  state: {
    lastRunAt?: Timestamp;
    lastStatus?: 'ok' | 'error' | 'skipped';
    nextRunAt?: Timestamp;
    consecutiveErrors: number;
  };
}

// -----------------------------------------------------------------------------
// Event Trigger Types
// -----------------------------------------------------------------------------

export interface EventTrigger {
  id: UUID;
  name: string;
  event: string; // "invoice.overdue", "lead.new", "budget.exceeded", etc.
  condition?: string; // optional expression for filtering
  action: {
    agentId: UUID;
    message: string;
  };
  status: 'active' | 'paused';
}

// -----------------------------------------------------------------------------
// Engine Events
// -----------------------------------------------------------------------------

export interface AutomationRunResult {
  jobId: UUID;
  agentId: UUID;
  status: 'ok' | 'error' | 'skipped';
  startedAt: Timestamp;
  completedAt: Timestamp;
  error?: string;
}

export interface TriggerFireResult {
  triggerId: UUID;
  event: string;
  agentId: UUID;
  dispatched: boolean;
  error?: string;
}

// -----------------------------------------------------------------------------
// Automation Engine
// -----------------------------------------------------------------------------

export class AutomationEngine {
  private jobs: Map<UUID, AutomationJob> = new Map();
  private triggers: Map<UUID, EventTrigger> = new Map();
  private timers: Map<UUID, ReturnType<typeof setTimeout>> = new Map();
  private onDispatch: ((agentId: UUID, message: string) => Promise<void>) | null = null;

  /**
   * Set the dispatch handler called when a job fires or trigger matches.
   * This connects the automation engine to the agent runtime.
   */
  setDispatcher(
    handler: (agentId: UUID, message: string) => Promise<void>
  ): void {
    this.onDispatch = handler;
  }

  // ---------------------------------------------------------------------------
  // Job Management
  // ---------------------------------------------------------------------------

  addJob(job: AutomationJob): void {
    if (this.jobs.has(job.id)) {
      throw new Error(`Job "${job.id}" already exists`);
    }

    this.jobs.set(job.id, job);

    if (job.status === 'active') {
      this.scheduleJob(job);
    }
  }

  removeJob(id: UUID): boolean {
    this.clearTimer(id);
    return this.jobs.delete(id);
  }

  listJobs(): AutomationJob[] {
    return Array.from(this.jobs.values());
  }

  getJob(id: UUID): AutomationJob | undefined {
    return this.jobs.get(id);
  }

  pauseJob(id: UUID): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;

    job.status = 'paused';
    this.clearTimer(id);
    return true;
  }

  resumeJob(id: UUID): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;

    job.status = 'active';
    job.state.consecutiveErrors = 0;
    this.scheduleJob(job);
    return true;
  }

  // ---------------------------------------------------------------------------
  // Trigger Management
  // ---------------------------------------------------------------------------

  addTrigger(trigger: EventTrigger): void {
    if (this.triggers.has(trigger.id)) {
      throw new Error(`Trigger "${trigger.id}" already exists`);
    }
    this.triggers.set(trigger.id, trigger);
  }

  removeTrigger(id: UUID): boolean {
    return this.triggers.delete(id);
  }

  listTriggers(): EventTrigger[] {
    return Array.from(this.triggers.values());
  }

  getTrigger(id: UUID): EventTrigger | undefined {
    return this.triggers.get(id);
  }

  /**
   * Fire an event and dispatch to all matching triggers.
   * Returns results for each trigger that was evaluated.
   */
  async fireEvent(
    event: string,
    data: Record<string, unknown>
  ): Promise<TriggerFireResult[]> {
    const results: TriggerFireResult[] = [];

    for (const trigger of this.triggers.values()) {
      if (trigger.status !== 'active') continue;
      if (trigger.event !== event) continue;

      // Evaluate condition if present
      if (trigger.condition && !this.evaluateCondition(trigger.condition, data)) {
        results.push({
          triggerId: trigger.id,
          event,
          agentId: trigger.action.agentId,
          dispatched: false,
        });
        continue;
      }

      // Dispatch to agent
      try {
        if (this.onDispatch) {
          await this.onDispatch(
            trigger.action.agentId,
            trigger.action.message
          );
        }

        results.push({
          triggerId: trigger.id,
          event,
          agentId: trigger.action.agentId,
          dispatched: true,
        });
      } catch (err) {
        results.push({
          triggerId: trigger.id,
          event,
          agentId: trigger.action.agentId,
          dispatched: false,
          error: err instanceof Error ? err.message : 'Dispatch failed',
        });
      }
    }

    return results;
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  destroy(): void {
    for (const timerId of this.timers.values()) {
      clearTimeout(timerId);
    }
    this.timers.clear();
    this.jobs.clear();
    this.triggers.clear();
    this.onDispatch = null;
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  private scheduleJob(job: AutomationJob): void {
    this.clearTimer(job.id);

    const delayMs = this.computeDelay(job.schedule);
    if (delayMs === null) return;

    job.state.nextRunAt = new Date(Date.now() + delayMs).toISOString();

    const timer = setTimeout(async () => {
      await this.executeJob(job);
    }, delayMs);

    this.timers.set(job.id, timer);
  }

  private async executeJob(job: AutomationJob): Promise<void> {
    const startedAt = new Date().toISOString();

    try {
      job.state.lastRunAt = startedAt;

      if (this.onDispatch) {
        await this.onDispatch(job.agentId, job.payload.message);
      }

      job.state.lastStatus = 'ok';
      job.state.consecutiveErrors = 0;
    } catch (err) {
      job.state.lastStatus = 'error';
      job.state.consecutiveErrors += 1;

      // Auto-pause after 5 consecutive errors
      if (job.state.consecutiveErrors >= 5) {
        job.status = 'error';
        return;
      }
    }

    // Reschedule if recurring
    if (job.status === 'active' && job.schedule.kind !== 'once') {
      this.scheduleJob(job);
    }
  }

  private computeDelay(schedule: CronSchedule): number | null {
    switch (schedule.kind) {
      case 'interval':
        return schedule.everyMs;

      case 'once': {
        const target = new Date(schedule.at).getTime();
        const now = Date.now();
        return target > now ? target - now : null;
      }

      case 'cron':
        return this.parseCronToNextRun(schedule.expr);

      default:
        return null;
    }
  }

  /**
   * Parse a 5-field cron expression and compute milliseconds until the next
   * matching minute. Supports wildcards, ranges (1-5), steps, and lists (1,3,5).
   */
  private parseCronToNextRun(expression: string): number {
    const now = new Date();
    const fields = expression.trim().split(/\s+/);
    if (fields.length !== 5) return 60 * 60 * 1000; // fallback 1hr

    const [minField, hourField, domField, monField, dowField] = fields;

    function parseField(field: string, min: number, max: number): number[] {
      const values: number[] = [];
      for (const part of field.split(',')) {
        if (part === '*') {
          for (let i = min; i <= max; i++) values.push(i);
        } else if (part.includes('/')) {
          const [range, stepStr] = part.split('/');
          const step = parseInt(stepStr, 10);
          const start = range === '*' ? min : parseInt(range, 10);
          for (let i = start; i <= max; i += step) values.push(i);
        } else if (part.includes('-')) {
          const [startStr, endStr] = part.split('-');
          for (let i = parseInt(startStr, 10); i <= parseInt(endStr, 10); i++) {
            values.push(i);
          }
        } else {
          values.push(parseInt(part, 10));
        }
      }
      return values.sort((a, b) => a - b);
    }

    const minutes = parseField(minField, 0, 59);
    const hours = parseField(hourField, 0, 23);
    const doms = parseField(domField, 1, 31);
    const months = parseField(monField, 1, 12);
    const dows = parseField(dowField, 0, 6);

    // Find next matching time (search up to ~366 days ahead)
    const candidate = new Date(now);
    candidate.setSeconds(0, 0);
    candidate.setMinutes(candidate.getMinutes() + 1); // start from next minute

    for (let i = 0; i < 525960; i++) {
      const m = candidate.getMinutes();
      const h = candidate.getHours();
      const dom = candidate.getDate();
      const mon = candidate.getMonth() + 1;
      const dow = candidate.getDay();

      if (
        minutes.includes(m) &&
        hours.includes(h) &&
        doms.includes(dom) &&
        months.includes(mon) &&
        dows.includes(dow)
      ) {
        return candidate.getTime() - now.getTime();
      }
      candidate.setMinutes(candidate.getMinutes() + 1);
    }

    return 60 * 60 * 1000; // fallback
  }

  private clearTimer(id: UUID): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }

  /**
   * Evaluate a simple condition expression against event data.
   * For production, this would use a proper expression evaluator.
   * Currently supports basic "key == value" and "key > value" checks.
   */
  private evaluateCondition(
    condition: string,
    data: Record<string, unknown>
  ): boolean {
    try {
      // Simple key-operator-value parsing
      const match = condition.match(
        /^(\w+)\s*(==|!=|>|<|>=|<=)\s*(.+)$/
      );
      if (!match) return true; // If we can't parse, allow it

      const [, key, operator, rawValue] = match;
      const actual = data[key];
      const expected = isNaN(Number(rawValue))
        ? rawValue.replace(/^["']|["']$/g, '')
        : Number(rawValue);

      switch (operator) {
        case '==':
          return actual === expected;
        case '!=':
          return actual !== expected;
        case '>':
          return Number(actual) > Number(expected);
        case '<':
          return Number(actual) < Number(expected);
        case '>=':
          return Number(actual) >= Number(expected);
        case '<=':
          return Number(actual) <= Number(expected);
        default:
          return true;
      }
    } catch {
      return true;
    }
  }
}

// Singleton instance
export const automationEngine = new AutomationEngine();
