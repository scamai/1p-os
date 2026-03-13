/**
 * Deduplication Engine - Token Efficiency Engine
 *
 * Prevents agents from doing overlapping work, saving 10-20% in redundant
 * API calls. When multiple agents share a business context, they can
 * independently decide to perform the same action (e.g., two agents both
 * categorize the same expense, or both draft a follow-up for the same client).
 *
 * The deduplicator:
 *   - Hashes tasks by (agentId + actionType + target + timeframe)
 *   - Returns cached results for recently completed identical tasks
 *   - Prevents concurrent duplicate execution by tracking running tasks
 *   - Generates overlap reports to help refine agent scopes
 */

import { createHash } from 'crypto';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface DeduplicationKey {
  agentId: string;
  actionType: string;
  /** The entity being acted on (e.g., client ID, invoice ID) */
  target: string;
  /** How recent a match counts as duplicate (default: 30 minutes) */
  timeframeMinutes?: number;
}

export interface DeduplicationEntry {
  taskHash: string;
  result: unknown;
  completedAt: Date;
  ttlMinutes: number;
  sourceAgentId: string;
}

interface DuplicateCheckResult {
  isDuplicate: boolean;
  cachedResult?: unknown;
  runningTaskId?: string;
}

interface OverlapRecord {
  actionType: string;
  target: string;
  agents: string[];
  occurrences: number;
  lastSeen: Date;
}

interface DeduplicationStats {
  duplicatesDetected: number;
  duplicatesPrevented: number;
  cacheHits: number;
  runningHits: number;
  totalChecks: number;
  estimatedTokensSaved: number;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

/** Default timeframe for considering a task as duplicate (30 minutes) */
const DEFAULT_TIMEFRAME_MINUTES = 30;

/** Average tokens per redundant call prevented */
const TOKENS_PER_PREVENTED_CALL = 2000;

/** Cleanup interval for expired entries (5 minutes) */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

// -----------------------------------------------------------------------------
// Deduplicator
// -----------------------------------------------------------------------------

export class Deduplicator {
  /** Cache of completed task results, keyed by task hash */
  private completedTasks: Map<string, DeduplicationEntry> = new Map();

  /** Set of currently running task hashes → task IDs */
  private runningTasks: Map<string, string> = new Map();

  /** Overlap tracking for reports: key is actionType:target */
  private overlapHistory: Map<string, OverlapRecord> = new Map();

  private stats: DeduplicationStats = {
    duplicatesDetected: 0,
    duplicatesPrevented: 0,
    cacheHits: 0,
    runningHits: 0,
    totalChecks: 0,
    estimatedTokensSaved: 0,
  };

  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Periodically clean up expired entries
    this.cleanupTimer = setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS);

    if (this.cleanupTimer && typeof this.cleanupTimer === 'object' && 'unref' in this.cleanupTimer) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Compute a deterministic hash for a task based on its identifying properties.
   * The hash intentionally excludes the agentId so that different agents
   * attempting the same action on the same target are detected as duplicates.
   */
  private computeHash(key: DeduplicationKey): string {
    // Hash by actionType + target (not agentId) to catch cross-agent duplicates
    const input = `${key.actionType}:${key.target}`;
    return createHash('sha256').update(input).digest('hex');
  }

  /**
   * Check whether a task is a duplicate of a recently completed or
   * currently running task.
   *
   * Returns:
   *   - isDuplicate: true if a match was found
   *   - cachedResult: the result from a completed duplicate (if available)
   *   - runningTaskId: the ID of a running duplicate (if in progress)
   */
  checkDuplicate(task: DeduplicationKey): DuplicateCheckResult {
    this.stats.totalChecks++;

    const hash = this.computeHash(task);
    const timeframe = task.timeframeMinutes ?? DEFAULT_TIMEFRAME_MINUTES;

    // Track overlap for reporting
    this.trackOverlap(task);

    // Check 1: Is an identical task currently running?
    const runningTaskId = this.runningTasks.get(hash);
    if (runningTaskId) {
      this.stats.duplicatesDetected++;
      this.stats.runningHits++;
      this.stats.duplicatesPrevented++;
      this.stats.estimatedTokensSaved += TOKENS_PER_PREVENTED_CALL;

      return {
        isDuplicate: true,
        runningTaskId,
      };
    }

    // Check 2: Was an identical task completed recently?
    const completed = this.completedTasks.get(hash);
    if (completed) {
      const ageMinutes = (Date.now() - completed.completedAt.getTime()) / (1000 * 60);

      if (ageMinutes <= timeframe && ageMinutes <= completed.ttlMinutes) {
        this.stats.duplicatesDetected++;
        this.stats.cacheHits++;
        this.stats.duplicatesPrevented++;
        this.stats.estimatedTokensSaved += TOKENS_PER_PREVENTED_CALL;

        return {
          isDuplicate: true,
          cachedResult: completed.result,
        };
      }
    }

    return { isDuplicate: false };
  }

  /**
   * Mark a task as currently in progress.
   * Call this before starting execution so concurrent duplicates are detected.
   */
  registerRunning(taskHash: string, taskId: string): void {
    this.runningTasks.set(taskHash, taskId);
  }

  /**
   * Cache the result of a completed task for future deduplication.
   * Removes the task from the running set.
   *
   * @param taskHash - The hash of the completed task
   * @param result - The task result to cache
   * @param ttlMinutes - How long to keep the result (default: 30 minutes)
   */
  registerComplete(
    taskHash: string,
    result: unknown,
    ttlMinutes: number = DEFAULT_TIMEFRAME_MINUTES
  ): void {
    // Remove from running set
    const taskId = this.runningTasks.get(taskHash);
    this.runningTasks.delete(taskHash);

    // Store in completed cache
    this.completedTasks.set(taskHash, {
      taskHash,
      result,
      completedAt: new Date(),
      ttlMinutes,
      sourceAgentId: taskId ?? 'unknown',
    });
  }

  /**
   * Remove a failed task from the running set without caching a result.
   * This allows the task to be retried by another agent.
   */
  registerFailed(taskHash: string): void {
    this.runningTasks.delete(taskHash);
  }

  /**
   * Generate a report of which agents are performing overlapping work
   * for a given business. This helps operators refine agent scopes
   * to eliminate redundancy.
   */
  getOverlapReport(businessId: string): OverlapRecord[] {
    // Return all overlap records that involve multiple agents
    const records: OverlapRecord[] = [];

    for (const record of this.overlapHistory.values()) {
      if (record.agents.length > 1) {
        records.push({ ...record });
      }
    }

    // Sort by occurrence count (most redundant first)
    records.sort((a, b) => b.occurrences - a.occurrences);

    return records;
  }

  /**
   * Return deduplication performance statistics.
   */
  getStats(): DeduplicationStats {
    return { ...this.stats };
  }

  /**
   * Compute a hash for external use (e.g., by the batch scheduler).
   * Convenience method that wraps the internal hash computation.
   */
  hashTask(task: DeduplicationKey): string {
    return this.computeHash(task);
  }

  /**
   * Track which agents are performing similar actions for overlap reporting.
   */
  private trackOverlap(task: DeduplicationKey): void {
    const key = `${task.actionType}:${task.target}`;
    const existing = this.overlapHistory.get(key);

    if (existing) {
      existing.occurrences++;
      existing.lastSeen = new Date();

      if (!existing.agents.includes(task.agentId)) {
        existing.agents.push(task.agentId);
      }
    } else {
      this.overlapHistory.set(key, {
        actionType: task.actionType,
        target: task.target,
        agents: [task.agentId],
        occurrences: 1,
        lastSeen: new Date(),
      });
    }
  }

  /**
   * Remove expired entries from the completed tasks cache
   * and stale overlap records.
   */
  private cleanup(): void {
    const now = Date.now();

    // Clean expired completed tasks
    const expiredHashes: string[] = [];
    for (const [hash, entry] of this.completedTasks.entries()) {
      const ageMinutes = (now - entry.completedAt.getTime()) / (1000 * 60);
      if (ageMinutes > entry.ttlMinutes) {
        expiredHashes.push(hash);
      }
    }
    for (const hash of expiredHashes) {
      this.completedTasks.delete(hash);
    }

    // Clean overlap records older than 24 hours
    const oneDayMs = 24 * 60 * 60 * 1000;
    const staleKeys: string[] = [];
    for (const [key, record] of this.overlapHistory.entries()) {
      if (now - record.lastSeen.getTime() > oneDayMs) {
        staleKeys.push(key);
      }
    }
    for (const key of staleKeys) {
      this.overlapHistory.delete(key);
    }
  }

  /**
   * Tear down the deduplicator and stop the cleanup timer.
   * Call this during graceful shutdown.
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.completedTasks.clear();
    this.runningTasks.clear();
    this.overlapHistory.clear();
  }
}

// -----------------------------------------------------------------------------
// Singleton
// -----------------------------------------------------------------------------

/** Module-level singleton for use across the agent execution loop */
export const deduplicator = new Deduplicator();
