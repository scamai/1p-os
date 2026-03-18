"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

type KillLevel = "one" | "all" | "lockdown";

interface KillSwitchProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (level: KillLevel, agentId?: string) => void;
  agents?: { id: string; name: string }[];
}

function KillSwitch({ open, onClose, onConfirm, agents = [] }: KillSwitchProps) {
  const [level, setLevel] = React.useState<KillLevel | null>(null);
  const [selectedAgent, setSelectedAgent] = React.useState<string>("");
  const [confirming, setConfirming] = React.useState(false);

  const handleConfirm = () => {
    if (!level) return;
    if (confirming) {
      onConfirm(level, level === "one" ? selectedAgent : undefined);
      setLevel(null);
      setConfirming(false);
      onClose();
    } else {
      setConfirming(true);
    }
  };

  const handleClose = () => {
    setLevel(null);
    setConfirming(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Kill Switch"
      description="Stop agents immediately."
    >
      <div className="flex flex-col gap-3">
        <button
          onClick={() => {
            setLevel("one");
            setConfirming(false);
          }}
          className={`rounded-md border p-3 text-left transition-colors ${
            level === "one"
              ? "border-slate-400 bg-slate-100"
              : "border-slate-200 hover:border-slate-400"
          }`}
        >
          <p className="text-sm font-medium text-slate-900">
            Pause One Agent
          </p>
          <p className="text-xs text-slate-500">
            Pick one to stop.
          </p>
        </button>

        {level === "one" && agents.length > 0 && (
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="">Select agent...</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={() => {
            setLevel("all");
            setConfirming(false);
          }}
          className={`rounded-md border p-3 text-left transition-colors ${
            level === "all"
              ? "border-slate-400 bg-slate-100"
              : "border-slate-200 hover:border-slate-400"
          }`}
        >
          <p className="text-sm font-medium text-slate-900">
            Pause All Agents
          </p>
          <p className="text-xs text-slate-500">
            In-progress tasks finish gracefully.
          </p>
        </button>

        <button
          onClick={() => {
            setLevel("lockdown");
            setConfirming(false);
          }}
          className={`rounded-md border p-3 text-left transition-colors ${
            level === "lockdown"
              ? "border-slate-400 bg-slate-100"
              : "border-slate-200 hover:border-slate-400"
          }`}
        >
          <p className="text-sm font-medium text-slate-900">
            Full Lockdown
          </p>
          <p className="text-xs text-slate-500">
            Nothing runs until you unlock.
          </p>
        </button>

        {level && (
          <div className="mt-2 flex gap-2">
            <Button variant="ghost" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              className="flex-1"
            >
              {confirming ? "Are you sure?" : "Confirm"}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

export { KillSwitch };
