/**
 * Agent Orchestrator — coordinates multi-agent workflows.
 *
 * Manages agent spawning, delegation, and result aggregation.
 * Inspired by OpenClaw's subagent spawn/send/yield pattern.
 */

import { sessionManager } from "@/lib/agents/sessions";
import { agentMemory } from "@/lib/agents/memory";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgentTask {
  id: string;
  parentAgentId: string;
  childAgentId: string;
  sessionId: string;
  instruction: string;
  status: "pending" | "running" | "completed" | "failed" | "yielded";
  result?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface WorkflowStep {
  agentId: string;
  instruction: string;
  dependsOn?: string[]; // task IDs that must complete first
}

export interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  status: "pending" | "running" | "completed" | "failed";
  createdAt: string;
}

// ---------------------------------------------------------------------------
// AgentOrchestrator
// ---------------------------------------------------------------------------

export class AgentOrchestrator {
  private tasks = new Map<string, AgentTask>();
  private workflows = new Map<string, Workflow>();

  /**
   * Spawn a child agent task — one agent delegates work to another.
   */
  spawn(
    parentAgentId: string,
    childAgentId: string,
    instruction: string,
  ): AgentTask {
    const session = sessionManager.create(childAgentId, "orchestrator");
    const task: AgentTask = {
      id: crypto.randomUUID(),
      parentAgentId,
      childAgentId,
      sessionId: session.id,
      instruction,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    this.tasks.set(task.id, task);

    // Send the instruction as a cross-agent message
    sessionManager.crossAgentSend(
      session.id,
      childAgentId,
      instruction,
    );

    return task;
  }

  /**
   * Mark a task as running.
   */
  startTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = "running";
    }
  }

  /**
   * Complete a task with a result.
   */
  completeTask(taskId: string, result: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = "completed";
      task.result = result;
      task.completedAt = new Date().toISOString();

      // Store the result in the parent agent's memory for future reference
      agentMemory.add(task.parentAgentId, "", {
        content: `Task delegated to agent ${task.childAgentId}: "${task.instruction}" — Result: ${result}`,
        category: "event",
        importance: 0.6,
      });

      // Send result back to parent agent
      sessionManager.crossAgentSend(
        task.sessionId,
        task.parentAgentId,
        `[Task completed] ${result}`,
      );
    }
  }

  /**
   * Fail a task with an error.
   */
  failTask(taskId: string, error: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = "failed";
      task.error = error;
      task.completedAt = new Date().toISOString();
    }
  }

  /**
   * Yield a task — agent pauses and can resume later.
   */
  yieldTask(taskId: string, partialResult: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = "yielded";
      task.result = partialResult;
    }
  }

  /**
   * Get all tasks for a parent agent.
   */
  getChildTasks(parentAgentId: string): AgentTask[] {
    return Array.from(this.tasks.values())
      .filter((t) => t.parentAgentId === parentAgentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get a specific task.
   */
  getTask(taskId: string): AgentTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Check if all dependencies for a workflow step are met.
   */
  private areDependenciesMet(step: WorkflowStep): boolean {
    if (!step.dependsOn || step.dependsOn.length === 0) return true;
    return step.dependsOn.every((depId) => {
      const task = this.tasks.get(depId);
      return task?.status === "completed";
    });
  }

  /**
   * Create a multi-step workflow.
   */
  createWorkflow(name: string, steps: WorkflowStep[]): Workflow {
    const workflow: Workflow = {
      id: crypto.randomUUID(),
      name,
      steps,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  /**
   * Get next runnable steps in a workflow.
   */
  getReadySteps(workflowId: string): WorkflowStep[] {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return [];
    return workflow.steps.filter((step) => this.areDependenciesMet(step));
  }

  /**
   * List all workflows.
   */
  listWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * List all tasks.
   */
  listTasks(filters?: { status?: AgentTask["status"]; agentId?: string }): AgentTask[] {
    let tasks = Array.from(this.tasks.values());
    if (filters?.status) {
      tasks = tasks.filter((t) => t.status === filters.status);
    }
    if (filters?.agentId) {
      tasks = tasks.filter(
        (t) => t.parentAgentId === filters.agentId || t.childAgentId === filters.agentId,
      );
    }
    return tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const orchestrator = new AgentOrchestrator();
