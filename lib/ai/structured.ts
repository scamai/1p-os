import { z } from 'zod';

export const SetupResultSchema = z.object({
  businessName: z.string(),
  industry: z.string().optional(),
  stage: z.string().optional(),
  agentsToCreate: z.array(
    z.object({
      role: z.string(),
      name: z.string(),
      description: z.string(),
      priority: z.enum(['high', 'medium', 'low']).default('medium'),
    })
  ),
  deadlines: z.array(
    z.object({
      title: z.string(),
      dueDate: z.string(),
      category: z.string(),
      description: z.string().optional(),
    })
  ),
  preferences: z.record(z.string(), z.unknown()).optional(),
  goals: z.array(z.string()).optional(),
});

export type SetupResult = z.infer<typeof SetupResultSchema>;

export const AgentTaskResultSchema = z.object({
  actionTaken: z.string(),
  success: z.boolean(),
  summary: z.string(),
  decisionCards: z
    .array(
      z.object({
        type: z.enum(['approval', 'choice', 'info', 'warning']),
        title: z.string(),
        description: z.string(),
        options: z.array(
          z.object({
            label: z.string(),
            value: z.string(),
            recommended: z.boolean().optional(),
          })
        ),
        urgency: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      })
    )
    .optional(),
  messagesToSend: z
    .array(
      z.object({
        toAgentId: z.string(),
        content: z.string(),
        priority: z.enum(['low', 'normal', 'high']).optional(),
      })
    )
    .optional(),
  memoryToStore: z
    .array(
      z.object({
        content: z.string(),
        category: z.string(),
        tags: z.array(z.string()),
      })
    )
    .optional(),
  costEstimate: z.number().optional(),
});

export type AgentTaskResult = z.infer<typeof AgentTaskResultSchema>;

export const ChatResponseSchema = z.object({
  responseText: z.string(),
  suggestedActions: z
    .array(
      z.object({
        label: z.string(),
        action: z.string(),
        params: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .optional(),
  references: z
    .array(
      z.object({
        type: z.string(),
        id: z.string(),
        label: z.string(),
      })
    )
    .optional(),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;
