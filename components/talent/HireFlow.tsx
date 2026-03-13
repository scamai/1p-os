"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface HireFlowProps {
  open: boolean;
  onClose: () => void;
  agent: {
    name: string;
    description: string;
    capabilities: string[];
    permissions: string[];
    estimatedDailyCost: string;
  } | null;
  onConfirmHire: () => void;
  onCustomize: () => void;
}

function HireFlow({
  open,
  onClose,
  agent,
  onConfirmHire,
  onCustomize,
}: HireFlowProps) {
  if (!agent) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Hire ${agent.name}`}
      description={agent.description}
    >
      <div className="flex flex-col gap-4">
        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
            What it will do
          </h4>
          <ul className="flex flex-col gap-1">
            {agent.capabilities.map((cap, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-[var(--foreground)]"
              >
                <span className="mt-1 text-[var(--success)]">+</span>
                {cap}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
            Permissions needed
          </h4>
          <ul className="flex flex-col gap-1">
            {agent.permissions.map((perm, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-[var(--muted-foreground)]"
              >
                <span className="mt-1">-</span>
                {perm}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-md bg-[var(--muted)] p-3">
          <p className="text-xs text-[var(--muted-foreground)]">
            Estimated daily cost
          </p>
          <p className="mt-0.5 text-sm font-semibold text-[var(--foreground)]">
            {agent.estimatedDailyCost}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCustomize} className="flex-1">
            Customize
          </Button>
          <Button onClick={onConfirmHire} className="flex-1">
            Confirm Hire
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export { HireFlow };
