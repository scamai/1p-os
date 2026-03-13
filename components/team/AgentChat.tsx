"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: string;
}

interface AgentChatProps {
  agentName: string;
  agentInitial: string;
  messages?: Message[];
  onSend: (message: string) => void;
  loading?: boolean;
}

function AgentChat({
  agentName,
  agentInitial,
  messages = [],
  onSend,
  loading = false,
}: AgentChatProps) {
  const [input, setInput] = React.useState("");
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--muted)] text-xs font-medium text-[var(--foreground)]">
            {agentInitial}
          </div>
          <span className="text-sm font-medium text-[var(--foreground)]">
            {agentName}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
            Start a conversation with {agentName}.
          </p>
        )}
        <div className="flex flex-col gap-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : "bg-[var(--muted)] text-[var(--foreground)]"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-[var(--muted)] px-3 py-2 text-sm text-[var(--muted-foreground)]">
                Thinking...
              </div>
            </div>
          )}
        </div>
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-[var(--border)] p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="h-9 flex-1 rounded-md border border-[var(--border)] bg-transparent px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
        <Button type="submit" size="sm" disabled={!input.trim() || loading}>
          Send
        </Button>
      </form>
    </div>
  );
}

export { AgentChat };
