import {
  pushEvent,
  subscribeToEvents,
  unsubscribe,
  type ActivityEvent,
  type ActivityEventType,
} from "@/lib/activity/feed";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ── Simulated agent activities for DEV_BYPASS ──

interface SimTemplate {
  agentName: string;
  agentRole: string;
  action: string;
  detail?: string;
  type: ActivityEventType;
  costRange: [number, number];
}

const SIM_TEMPLATES: SimTemplate[] = [
  {
    agentName: "Sales Agent",
    agentRole: "Sales",
    action: "Qualified inbound lead",
    detail: "Globex Corp — matches ICP, $8k ARR potential",
    type: "task_completed",
    costRange: [0.02, 0.08],
  },
  {
    agentName: "Sales Agent",
    agentRole: "Sales",
    action: "Sent follow-up email",
    detail: "3rd touchpoint to Initech — proposal attached",
    type: "email_sent",
    costRange: [0.01, 0.04],
  },
  {
    agentName: "Sales Agent",
    agentRole: "Sales",
    action: "Drafted proposal for Acme Inc",
    detail: "$12k/yr deal — awaiting your review",
    type: "decision_created",
    costRange: [0.05, 0.12],
  },
  {
    agentName: "Support Agent",
    agentRole: "Support",
    action: "Resolved ticket #1042",
    detail: "Billing question — pointed to docs, 2-min response",
    type: "task_completed",
    costRange: [0.01, 0.03],
  },
  {
    agentName: "Support Agent",
    agentRole: "Support",
    action: "Resolved ticket #1043",
    detail: "Password reset — guided through flow",
    type: "task_completed",
    costRange: [0.01, 0.02],
  },
  {
    agentName: "Support Agent",
    agentRole: "Support",
    action: "Escalated ticket #1044",
    detail: "Refund request from Vandelay — needs approval",
    type: "decision_created",
    costRange: [0.02, 0.05],
  },
  {
    agentName: "Finance Agent",
    agentRole: "Finance",
    action: "Categorized 14 expenses",
    detail: "March transactions — all matched to categories",
    type: "task_completed",
    costRange: [0.03, 0.07],
  },
  {
    agentName: "Finance Agent",
    agentRole: "Finance",
    action: "Sent invoice #INV-0087",
    detail: "Globex Corp — $2,400 for March services",
    type: "email_sent",
    costRange: [0.02, 0.05],
  },
  {
    agentName: "Finance Agent",
    agentRole: "Finance",
    action: "Flagged unusual charge",
    detail: "$340 from unknown vendor — needs review",
    type: "decision_created",
    costRange: [0.01, 0.03],
  },
  {
    agentName: "Content Agent",
    agentRole: "Content",
    action: "Drafted blog post",
    detail: '"5 Ways AI Agents Save Solo Founders 10hrs/week"',
    type: "task_completed",
    costRange: [0.08, 0.18],
  },
  {
    agentName: "Content Agent",
    agentRole: "Content",
    action: "Scheduled 3 social posts",
    detail: "LinkedIn + Twitter — Q2 growth theme",
    type: "task_completed",
    costRange: [0.04, 0.09],
  },
  {
    agentName: "CEO",
    agentRole: "Strategy",
    action: "Decomposed Q2 growth strategy",
    detail: "Created 4 tactical goals from strategic objective",
    type: "goal_decomposed",
    costRange: [0.06, 0.14],
  },
  {
    agentName: "CEO",
    agentRole: "Strategy",
    action: "Reviewed daily metrics",
    detail: "MRR $4.2k, churn 3.8%, 12 active customers",
    type: "task_completed",
    costRange: [0.03, 0.06],
  },
  {
    agentName: "Sales Agent",
    agentRole: "Sales",
    action: "Updated CRM pipeline",
    detail: "Moved 2 deals to negotiation stage",
    type: "task_completed",
    costRange: [0.01, 0.03],
  },
  {
    agentName: "Support Agent",
    agentRole: "Support",
    action: "Updated knowledge base",
    detail: "Added 3 new FAQ entries from recent tickets",
    type: "task_completed",
    costRange: [0.03, 0.06],
  },
  {
    agentName: "Content Agent",
    agentRole: "Content",
    action: "Error: rate limit hit",
    detail: "Pausing for 60s before retry — social post generation",
    type: "error",
    costRange: [0, 0],
  },
];

let simIndex = 0;

function generateSimEvent(): ActivityEvent {
  const template = SIM_TEMPLATES[simIndex % SIM_TEMPLATES.length];
  simIndex++;

  const cost =
    template.costRange[0] +
    Math.random() * (template.costRange[1] - template.costRange[0]);

  return {
    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    agentName: template.agentName,
    agentRole: template.agentRole,
    action: template.action,
    detail: template.detail,
    costUsd: cost > 0 ? Math.round(cost * 100) / 100 : undefined,
    type: template.type,
  };
}

function randomInterval(): number {
  // 8-15 seconds
  return 8000 + Math.random() * 7000;
}

export async function GET(): Promise<Response> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send any recent events as initial payload
      const initialEvent = generateSimEvent();
      pushEvent(initialEvent);
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(initialEvent)}\n\n`)
      );

      // Subscribe to new events from pushEvent
      const subId = subscribeToEvents((event: ActivityEvent) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          // Stream closed
        }
      });

      // DEV_BYPASS: Emit simulated events on an interval
      let timeout: ReturnType<typeof setTimeout>;

      function scheduleNext() {
        timeout = setTimeout(() => {
          try {
            const event = generateSimEvent();
            pushEvent(event);
          } catch {
            // Stream may be closed
          }
          scheduleNext();
        }, randomInterval());
      }

      scheduleNext();

      // Cleanup when the client disconnects
      const cleanup = () => {
        clearTimeout(timeout);
        unsubscribe(subId);
      };

      // Store cleanup so cancel() can call it
      (controller as unknown as Record<string, () => void>).__cleanup = cleanup;
    },
    cancel(controller) {
      const ctrl = controller as unknown as Record<string, (() => void) | undefined>;
      ctrl.__cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
