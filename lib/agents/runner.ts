/**
 * Agent Runner — LLM conversation loop with tool execution.
 *
 * Separate from runtime.ts (which handles the 17-step trigger pipeline).
 * This module handles the interactive conversation loop: send a message,
 * get a response, execute tool calls, loop, and return the final result.
 */

import { getAnthropicClient } from "@/lib/ai/client";
import { getAgentSystemPrompt } from "@/lib/ai/prompts";
import { sessionManager } from "@/lib/agents/sessions";
import { agentMemory } from "@/lib/agents/memory";
import { modelRouter } from "@/lib/agents/model-router";
import { toolRegistry } from "@/lib/gateway/tools";
import { execApprovalManager } from "@/lib/security/exec-approvals";
import { createClient } from "@/lib/supabase/server";
import type { AgentSession } from "@/lib/agents/sessions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AgentRunEvent =
  | { type: "text"; data: { text: string } }
  | { type: "tool_call"; data: { id: string; name: string; input: unknown } }
  | { type: "tool_result"; data: { id: string; content: string } }
  | { type: "thinking"; data: { modelSelection: string } }
  | {
      type: "usage";
      data: {
        input: number;
        output: number;
        total: number;
        costUsd: number;
      };
    }
  | { type: "done"; data: { response: string; durationMs: number } }
  | { type: "error"; data: { message: string } };

export interface AgentRunParams {
  agentId: string;
  businessId: string;
  sessionId: string;
  message: string;
  model?: string;
  channel?: string;
  onEvent?: (event: AgentRunEvent) => void;
}

export interface AgentRunResult {
  sessionId: string;
  response: string;
  toolCalls: { name: string; input: unknown; result: unknown }[];
  usage: { input: number; output: number; total: number };
  costUsd: number;
  model: string;
  durationMs: number;
}

interface ToolDefinition {
  name: string;
  description: string;
  input_schema: { type: "object"; properties: Record<string, unknown>; required?: string[] };
}

/**
 * Minimal agent record — the fields we need from the DB row.
 */
interface AgentRecord {
  id: string;
  business_id: string;
  name: string;
  role: string;
  system_prompt?: string;
  allowed_actions?: string[];
  model_preference?: string;
  context_permissions?: string;
}

// ---------------------------------------------------------------------------
// Built-in Tool Definitions (fallback when gateway tools unavailable)
// ---------------------------------------------------------------------------

const BUILTIN_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "search_memory",
    description:
      "Search the agent's long-term memory for relevant information.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query" },
      },
      required: ["query"],
    },
  },
  {
    name: "store_memory",
    description:
      "Store a new fact, insight, or observation in long-term memory.",
    input_schema: {
      type: "object" as const,
      properties: {
        content: { type: "string", description: "What to remember" },
        category: {
          type: "string",
          enum: ["fact", "preference", "relationship", "event", "insight"],
        },
        importance: {
          type: "number",
          description: "0-1 importance score",
        },
      },
      required: ["content", "category"],
    },
  },
  {
    name: "send_to_agent",
    description:
      "Send a message to another agent for cross-agent coordination.",
    input_schema: {
      type: "object" as const,
      properties: {
        to_agent_id: { type: "string", description: "The target agent ID" },
        message: { type: "string", description: "Message content" },
      },
      required: ["to_agent_id", "message"],
    },
  },
];

/**
 * Execute a built-in tool (fallback when gateway tools unavailable).
 */
async function executeBuiltinTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  agentId: string,
  businessId: string,
  sessionId: string,
): Promise<unknown> {
  switch (toolName) {
    case "search_memory": {
      const results = await agentMemory.searchAsync(
        agentId,
        toolInput.query as string,
        5,
      );
      return results.map((r) => ({
        content: r.content,
        category: r.category,
        importance: r.importance,
      }));
    }
    case "store_memory": {
      const entry = await agentMemory.addAsync(agentId, businessId, {
        content: toolInput.content as string,
        category: toolInput.category as
          | "fact"
          | "preference"
          | "relationship"
          | "event"
          | "insight",
        importance: (toolInput.importance as number) ?? 0.5,
      });
      return { stored: true, id: entry.id };
    }
    case "send_to_agent": {
      const envelope = sessionManager.crossAgentSend(
        sessionId,
        toolInput.to_agent_id as string,
        toolInput.message as string,
      );
      return { sent: true, envelopeId: envelope.message.id };
    }
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// ---------------------------------------------------------------------------
// Agent config loader
// ---------------------------------------------------------------------------

async function loadAgentConfig(agentId: string, businessId: string): Promise<AgentRecord> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("agents")
      .select("id, business_id, name, role, system_prompt, allowed_actions, model_preference, context_permissions")
      .eq("id", agentId)
      .eq("business_id", businessId)
      .single();

    if (error || !data) {
      // Fallback for dev/testing
      return {
        id: agentId,
        business_id: businessId,
        name: `Agent ${agentId.slice(0, 8)}`,
        role: "ops",
        allowed_actions: undefined,
      };
    }
    return data as AgentRecord;
  } catch {
    return {
      id: agentId,
      business_id: businessId,
      name: `Agent ${agentId.slice(0, 8)}`,
      role: "ops",
      allowed_actions: undefined,
    };
  }
}

// ---------------------------------------------------------------------------
// Cost calculation
// ---------------------------------------------------------------------------

function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const profile = modelRouter.getProfile(
    model.includes("haiku") ? "claude-haiku" : "claude-sonnet",
  );
  if (!profile) {
    // Fallback estimate
    return (inputTokens * 0.003 + outputTokens * 0.015) / 1000;
  }
  return (
    (inputTokens * profile.costPer1kTokens.input +
      outputTokens * profile.costPer1kTokens.output) /
    1000
  );
}

// ---------------------------------------------------------------------------
// Tool resolution
// ---------------------------------------------------------------------------

/**
 * Resolve tool definitions — prefer gateway tools if available, else builtins.
 */
function resolveToolDefinitions(
  allowedActions?: string[],
): ToolDefinition[] {
  let definitions: ToolDefinition[];

  if (toolRegistry) {
    definitions = toolRegistry.list().map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema as ToolDefinition["input_schema"],
    }));
  } else {
    definitions = BUILTIN_TOOL_DEFINITIONS;
  }

  if (allowedActions) {
    definitions = definitions.filter((t) =>
      allowedActions.includes(t.name),
    );
  }

  return definitions;
}

/**
 * Execute a tool call — uses gateway tools + exec approval if available,
 * otherwise falls back to built-in tools.
 */
async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  agentId: string,
  businessId: string,
  sessionId: string,
): Promise<unknown> {
  // Check exec approval if available
  if (execApprovalManager) {
    const policy = execApprovalManager.getPolicy(toolName);
    if (policy === "deny") {
      return { error: `Tool "${toolName}" is denied by policy.` };
    }
    if (
      policy === "ask" &&
      !execApprovalManager.isApproved(agentId, toolName, toolInput)
    ) {
      const requestId = execApprovalManager.requestApproval({
        agentId,
        agentName: `Agent ${agentId.slice(0, 8)}`,
        action: toolName,
        params: toolInput,
        reason: "Agent requested tool execution",
        riskLevel: "medium",
      });
      return {
        pending_approval: true,
        requestId,
        message: `Tool "${toolName}" requires approval. Request ID: ${requestId}`,
      };
    }
  }

  // Execute via gateway tools if available
  if (toolRegistry) {
    const tool = toolRegistry.get(toolName);
    if (tool) {
      const result = await tool.execute(toolInput, {
        agentId,
        businessId,
        sessionId,
      });
      try {
        return JSON.parse(result.content);
      } catch {
        return { content: result.content, type: result.type };
      }
    }
  }

  // Fallback to built-in tools
  return executeBuiltinTool(
    toolName,
    toolInput,
    agentId,
    businessId,
    sessionId,
  );
}

// ---------------------------------------------------------------------------
// AgentRunner
// ---------------------------------------------------------------------------

const MAX_TOOL_ITERATIONS = 10;

export class AgentRunner {
  /**
   * Main execution loop.
   *
   * 1. Load session from sessionManager
   * 2. Build messages (system + history + new message)
   * 3. Select model via modelRouter
   * 4. Call LLM (via Anthropic client)
   * 5. If tool_use in response: check exec approval, execute via
   *    toolRegistry, loop (max 10)
   * 6. Emit events via onEvent
   * 7. Record to session
   * 8. Return result
   */
  async run(params: AgentRunParams): Promise<AgentRunResult> {
    const {
      agentId,
      businessId,
      sessionId,
      message,
      model: modelOverride,
      onEvent,
    } = params;

    const startTime = Date.now();
    const emit = (event: AgentRunEvent): void => {
      onEvent?.(event);
    };

    // ── 1. Session ─────────────────────────────────────────────────────

    let session: AgentSession | undefined = sessionManager.get(sessionId);
    if (!session) {
      session = sessionManager.create(agentId, params.channel ?? "web");
    }

    // Drain cross-agent inbox
    const inboxMessages = sessionManager.drainInbox(sessionId);
    for (const envelope of inboxMessages) {
      sessionManager.addMessage(sessionId, {
        role: "user",
        content: `[Message from agent ${envelope.fromAgentId}]: ${envelope.message.content}`,
      });
    }

    // ── 2. Agent config ────────────────────────────────────────────────

    const agent = await loadAgentConfig(agentId, businessId);

    // ── 3. Model selection with failover ───────────────────────────────

    let selectedModel: string;
    let profileId: string;

    if (modelOverride) {
      selectedModel = modelOverride;
      profileId = modelOverride;
    } else if (agent.model_preference) {
      selectedModel = agent.model_preference;
      profileId = agent.model_preference;
    } else {
      const selection = modelRouter.selectModel("moderate");
      selectedModel = selection.profile.model;
      profileId = selection.profile.id;
      emit({
        type: "thinking",
        data: { modelSelection: selection.reason },
      });
    }

    // ── 4. Build messages ──────────────────────────────────────────────

    const systemPrompt =
      agent.system_prompt ??
      getAgentSystemPrompt(agent.role, {
        businessName: undefined,
        industry: undefined,
      });

    // Inject relevant memories into the system prompt (semantic search via mem0)
    const relevantMemories = await agentMemory.getRelevantAsync(agentId, message, 3);
    const memoryBlock =
      relevantMemories.length > 0
        ? `\n\n## Relevant Memories\n${relevantMemories
            .map((m) => `- [${m.category}] ${m.content}`)
            .join("\n")}`
        : "";

    const fullSystemPrompt = systemPrompt + memoryBlock;

    // Append the new user message to the session
    sessionManager.addMessage(sessionId, {
      role: "user",
      content: message,
    });

    // Build the Anthropic messages array from session history
    const history = sessionManager.getHistory(sessionId);
    const anthropicMessages: Array<{
      role: "user" | "assistant";
      content: string | Array<Record<string, unknown>>;
    }> = [];

    for (const msg of history) {
      if (msg.role === "system") continue;
      if (msg.role === "tool") {
        anthropicMessages.push({
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: msg.toolCallId ?? "unknown",
              content: msg.content,
            },
          ],
        });
      } else {
        anthropicMessages.push({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        });
      }
    }

    // ── 5–6. LLM call + tool loop ──────────────────────────────────────

    const allowedTools = resolveToolDefinitions(agent.allowed_actions);

    const toolCallLog: {
      name: string;
      input: unknown;
      result: unknown;
    }[] = [];
    let totalInput = 0;
    let totalOutput = 0;
    let finalText = "";
    let iterations = 0;

    // Working copy of messages for the loop
    const workingMessages: any[] = [...anthropicMessages]; // Anthropic MessageParam[]

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++;

      let response;
      try {
        const client = getAnthropicClient();
        response = await client.messages.create({
          model: selectedModel,
          max_tokens: 4096,
          system: fullSystemPrompt,
          messages: workingMessages,
          ...(allowedTools.length > 0
            ? {
                tools: allowedTools.map((t) => ({
                  name: t.name,
                  description: t.description,
                  input_schema: t.input_schema,
                })),
              }
            : {}),
        });
      } catch (primaryError) {
        // Model failover: try the next available model
        modelRouter.recordFailure(
          profileId,
          primaryError instanceof Error
            ? primaryError.message
            : "Unknown error",
        );

        emit({
          type: "error",
          data: {
            message: `Primary model failed: ${selectedModel}. Attempting failover.`,
          },
        });

        const fallback = modelRouter.selectModel("moderate");
        selectedModel = fallback.profile.model;
        profileId = fallback.profile.id;

        try {
          const client = getAnthropicClient();
          response = await client.messages.create({
            model: selectedModel,
            max_tokens: 4096,
            system: fullSystemPrompt,
            messages: workingMessages,
            ...(allowedTools.length > 0
              ? {
                  tools: allowedTools.map((t) => ({
                    name: t.name,
                    description: t.description,
                    input_schema: t.input_schema,
                  })),
                }
              : {}),
          });
        } catch (fallbackError) {
          modelRouter.recordFailure(
            profileId,
            fallbackError instanceof Error
              ? fallbackError.message
              : "Unknown error",
          );
          const errMsg =
            fallbackError instanceof Error
              ? fallbackError.message
              : "LLM call failed";
          emit({ type: "error", data: { message: errMsg } });
          throw fallbackError;
        }
      }

      // Track usage
      const iterInput = response.usage?.input_tokens ?? 0;
      const iterOutput = response.usage?.output_tokens ?? 0;
      totalInput += iterInput;
      totalOutput += iterOutput;

      const iterCost = estimateCost(selectedModel, iterInput, iterOutput);

      emit({
        type: "usage",
        data: {
          input: iterInput,
          output: iterOutput,
          total: iterInput + iterOutput,
          costUsd: iterCost,
        },
      });

      modelRouter.recordSuccess(
        profileId,
        Date.now() - startTime,
        iterInput + iterOutput,
      );

      // Process response content blocks
      const assistantContent: Array<Record<string, unknown>> = [];
      let hasToolUse = false;

      for (const block of response.content) {
        if (block.type === "text") {
          finalText += block.text;
          assistantContent.push({ type: "text", text: block.text });
          emit({ type: "text", data: { text: block.text } });
        } else if (block.type === "tool_use") {
          hasToolUse = true;
          const toolName = block.name;
          const toolInput = block.input as Record<string, unknown>;
          const toolCallId = block.id;

          assistantContent.push({
            type: "tool_use",
            id: toolCallId,
            name: toolName,
            input: toolInput,
          });

          emit({
            type: "tool_call",
            data: { id: toolCallId, name: toolName, input: toolInput },
          });

          // Check if the agent is allowed to execute this tool
          const isAllowed =
            !agent.allowed_actions ||
            agent.allowed_actions.includes(toolName);

          let toolResult: unknown;
          if (isAllowed) {
            try {
              toolResult = await executeTool(
                toolName,
                toolInput,
                agentId,
                businessId,
                sessionId,
              );
            } catch (err) {
              toolResult = {
                error: `Tool execution failed: ${
                  err instanceof Error ? err.message : "Unknown error"
                }`,
              };
            }
          } else {
            toolResult = {
              error: `Tool "${toolName}" is not in this agent's allowed actions.`,
            };
          }

          const resultContent = JSON.stringify(toolResult);

          toolCallLog.push({
            name: toolName,
            input: toolInput,
            result: toolResult,
          });

          emit({
            type: "tool_result",
            data: { id: toolCallId, content: resultContent },
          });

          // Record tool messages in session
          sessionManager.addMessage(sessionId, {
            role: "assistant",
            content: JSON.stringify({
              tool_use: toolName,
              input: toolInput,
            }),
            toolName,
            toolCallId,
          });

          sessionManager.addMessage(sessionId, {
            role: "tool",
            content: resultContent,
            toolName,
            toolCallId,
          });

          // Append tool result for next LLM iteration
          workingMessages.push({
            role: "assistant",
            content: assistantContent,
          });
          workingMessages.push({
            role: "user",
            content: [
              {
                type: "tool_result",
                tool_use_id: toolCallId,
                content: resultContent,
              },
            ],
          });
        }
      }

      // If no tool use, we are done
      if (!hasToolUse) {
        break;
      }

      // If stop_reason is "end_turn" even with tool use, break
      if (response.stop_reason === "end_turn") {
        break;
      }
    }

    // ── 7–8. Record to session + extract memories ─────────────────────

    if (finalText) {
      sessionManager.addMessage(sessionId, {
        role: "assistant",
        content: finalText,
        tokenCount: totalOutput,
      });

      // Auto-extract memories from the conversation (non-blocking)
      agentMemory
        .addFromConversation(agentId, businessId, [
          { role: "user", content: message },
          { role: "assistant", content: finalText },
        ])
        .catch((err) => {
          console.error("[runner] Memory extraction failed:", err);
        });
    }

    const costUsd = estimateCost(selectedModel, totalInput, totalOutput);
    sessionManager.addSessionCost(sessionId, costUsd);

    // Update session token counts
    const currentSession = sessionManager.get(sessionId);
    if (currentSession) {
      currentSession.tokenCount.input += totalInput;
      currentSession.tokenCount.output += totalOutput;
      currentSession.tokenCount.total =
        currentSession.tokenCount.input + currentSession.tokenCount.output;
      currentSession.model = selectedModel;
    }

    // ── 9. Return result ───────────────────────────────────────────────

    const result: AgentRunResult = {
      sessionId,
      response: finalText,
      toolCalls: toolCallLog,
      usage: {
        input: totalInput,
        output: totalOutput,
        total: totalInput + totalOutput,
      },
      costUsd,
      model: selectedModel,
      durationMs: Date.now() - startTime,
    };

    emit({
      type: "done",
      data: { response: finalText, durationMs: result.durationMs },
    });

    return result;
  }

  /**
   * Streaming variant — returns an AsyncGenerator of AgentRunEvents.
   *
   * Internally delegates to `run()` with an onEvent callback that feeds
   * events into an async queue.
   */
  async *runWithStreaming(
    params: Omit<AgentRunParams, "onEvent">,
  ): AsyncGenerator<AgentRunEvent> {
    const events: AgentRunEvent[] = [];
    let resolve: (() => void) | null = null;
    let done = false;

    const onEvent = (event: AgentRunEvent): void => {
      events.push(event);
      if (event.type === "done" || event.type === "error") {
        done = true;
      }
      resolve?.();
    };

    // Start the run in the background
    const runPromise = this.run({ ...params, onEvent }).catch((err) => {
      events.push({
        type: "error",
        data: {
          message: err instanceof Error ? err.message : "Unknown error",
        },
      });
      done = true;
      resolve?.();
    });

    // Yield events as they arrive
    while (!done || events.length > 0) {
      if (events.length > 0) {
        yield events.shift()!;
      } else if (!done) {
        await new Promise<void>((r) => {
          resolve = r;
        });
      }
    }

    // Ensure the run promise is settled
    await runPromise;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const agentRunner = new AgentRunner();
