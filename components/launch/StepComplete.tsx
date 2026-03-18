"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

interface StepCompleteProps {
  stepId: string;
  userId: string;
  isCompleted: boolean;
  nextStepUrl?: string | null;
}

export function StepComplete({
  stepId,
  userId,
  isCompleted,
  nextStepUrl,
}: StepCompleteProps) {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(isCompleted);
  const router = useRouter();

  async function handleComplete() {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.from("user_launch_progress").upsert(
      {
        user_id: userId,
        step_id: stepId,
        is_completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,step_id" }
    );

    if (!error) {
      setCompleted(true);
      // Brief success state before navigating
      setTimeout(() => {
        if (nextStepUrl) {
          router.push(nextStepUrl);
        } else {
          router.refresh();
        }
      }, 600);
    }

    setLoading(false);
  }

  if (completed) {
    return (
      <div className="flex items-center gap-2 py-2">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-slate-900"
        >
          <path d="M3 8.5l3.5 3.5L13 4" />
        </svg>
        <span className="text-sm font-medium text-slate-900">Completed</span>
      </div>
    );
  }

  return (
    <Button onClick={handleComplete} loading={loading}>
      Mark complete
    </Button>
  );
}
