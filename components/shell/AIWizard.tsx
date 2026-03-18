"use client";

import * as React from "react";

type WizardIntent = "hire_agent" | "install_skill" | "configure_model";

interface WizardMessage {
  id: string;
  role: "ai" | "user";
  content: string;
  options?: string[];
}

interface AIWizardProps {
  intent: WizardIntent;
  onClose: () => void;
  onComplete: (intent: WizardIntent, result: Record<string, string>) => void;
}

const INTENT_CONFIG: Record<WizardIntent, { title: string; greeting: string; steps: WizardStep[] }> = {
  hire_agent: {
    title: "Hire Agent",
    greeting: "I'll help you hire a new agent. What kind of work do you need help with?",
    steps: [
      { key: "need", question: "What kind of work do you need help with?", placeholder: "e.g. handling customer emails, writing blog posts, managing invoices..." },
      { key: "role", question: "Got it. What should we call this agent's role?", placeholder: "e.g. Sales, Support, Marketing, Operations...", suggestions: ["Sales", "Customer Support", "Content & Marketing", "Operations", "Finance", "Development"] },
      { key: "autonomy", question: "How much autonomy should this agent have?", placeholder: "Pick one or describe your preference", suggestions: ["Full autonomy — just notify me of results", "Medium — ask me before big decisions", "Low — check with me on everything"] },
      { key: "budget", question: "What's the daily budget for this agent?", placeholder: "e.g. $2, $5, $10", suggestions: ["$1/day", "$2/day", "$5/day", "$10/day"] },
    ],
  },
  install_skill: {
    title: "Install Skill",
    greeting: "I'll help you add a new skill. What do you want your agents to be able to do?",
    steps: [
      { key: "capability", question: "What do you want your agents to be able to do?", placeholder: "e.g. send Slack messages, generate PDFs, scrape websites..." },
      { key: "agents", question: "Which agents should have access to this skill?", placeholder: "e.g. all agents, just Sales, Support only...", suggestions: ["All agents", "Sales only", "Support only", "Custom selection"] },
      { key: "permissions", question: "Any restrictions on when this skill can be used?", placeholder: "e.g. only during business hours, require approval, no limits", suggestions: ["No restrictions", "Require my approval each time", "Business hours only", "Max 10 uses per day"] },
    ],
  },
  configure_model: {
    title: "Configure Model",
    greeting: "I'll help you set up your AI model preferences. What matters most to you?",
    steps: [
      { key: "priority", question: "What matters most to you?", placeholder: "Pick one or describe", suggestions: ["Keep costs low", "Best quality responses", "Balance of both", "Fast responses"] },
      { key: "provider", question: "Any model provider preference?", placeholder: "e.g. Anthropic, OpenAI, local models...", suggestions: ["Anthropic Claude (recommended)", "OpenAI GPT", "Local/self-hosted", "No preference — route automatically"] },
      { key: "fallback", question: "If the primary model is unavailable, what should happen?", placeholder: "Pick a fallback strategy", suggestions: ["Use a cheaper model", "Queue and retry", "Notify me and pause", "Use any available model"] },
    ],
  },
};

interface WizardStep {
  key: string;
  question: string;
  placeholder: string;
  suggestions?: string[];
}

function AIWizard({ intent, onClose, onComplete }: AIWizardProps) {
  const config = INTENT_CONFIG[intent];
  const [messages, setMessages] = React.useState<WizardMessage[]>([
    { id: "greeting", role: "ai", content: config.greeting, options: config.steps[0]?.suggestions },
  ]);
  const [input, setInput] = React.useState("");
  const [stepIndex, setStepIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [completing, setCompleting] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, [stepIndex]);

  const handleAnswer = (answer: string) => {
    if (!answer.trim() || completing) return;

    const currentStep = config.steps[stepIndex];
    if (!currentStep) return;

    const newAnswers = { ...answers, [currentStep.key]: answer.trim() };
    setAnswers(newAnswers);

    // Add user message
    const userMsg: WizardMessage = {
      id: `user-${stepIndex}`,
      role: "user",
      content: answer.trim(),
    };

    const nextIndex = stepIndex + 1;

    if (nextIndex < config.steps.length) {
      // More questions
      const nextStep = config.steps[nextIndex];
      const aiMsg: WizardMessage = {
        id: `ai-${nextIndex}`,
        role: "ai",
        content: nextStep.question,
        options: nextStep.suggestions,
      };
      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setStepIndex(nextIndex);
    } else {
      // All done — show summary
      setCompleting(true);
      const summaryLines = config.steps.map((s) => {
        const val = s.key === currentStep.key ? answer.trim() : newAnswers[s.key];
        return `${s.key}: ${val}`;
      });
      const summaryMsg: WizardMessage = {
        id: "summary",
        role: "ai",
        content: buildSummary(intent, newAnswers, answer.trim(), currentStep.key),
        options: ["Confirm", "Start over"],
      };
      setMessages((prev) => [...prev, userMsg, summaryMsg]);
    }

    setInput("");
  };

  const handleConfirmAction = (choice: string) => {
    if (choice === "Start over") {
      setMessages([
        { id: "greeting", role: "ai", content: config.greeting, options: config.steps[0]?.suggestions },
      ]);
      setStepIndex(0);
      setAnswers({});
      setCompleting(false);
      return;
    }

    if (choice === "Confirm") {
      onComplete(intent, answers);
    }
  };

  const handleOptionClick = (option: string) => {
    if (completing) {
      handleConfirmAction(option);
    } else {
      handleAnswer(option);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (completing) return;
    handleAnswer(input);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
            AI
          </div>
          <span className="text-sm font-medium text-zinc-900">{config.title}</span>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:text-zinc-700"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 3l8 8M11 3l-8 8" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] ${msg.role === "user" ? "" : ""}`}>
              {msg.role === "ai" && (
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-600">
                    AI
                  </div>
                  <div>
                    <p className="text-sm text-zinc-700 leading-relaxed">{msg.content}</p>
                    {msg.options && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {msg.options.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => handleOptionClick(opt)}
                            className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700 transition-all hover:border-zinc-400 hover:bg-zinc-50"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {msg.role === "user" && (
                <div className="rounded-2xl rounded-br-sm bg-zinc-900 px-3.5 py-2">
                  <p className="text-sm text-white">{msg.content}</p>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Progress indicator */}
        {!completing && (
          <div className="flex items-center gap-1 pt-2">
            {config.steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i <= stepIndex ? "w-6 bg-zinc-900" : "w-3 bg-zinc-200"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      {!completing && (
        <form onSubmit={handleSubmit} className="border-t border-zinc-200 px-5 py-3">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={config.steps[stepIndex]?.placeholder ?? "Type your answer..."}
              className="flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-white transition-opacity disabled:opacity-30"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 6h8M7 3l3 3-3 3" />
              </svg>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function buildSummary(intent: WizardIntent, answers: Record<string, string>, lastAnswer: string, lastKey: string): string {
  const all = { ...answers, [lastKey]: lastAnswer };

  if (intent === "hire_agent") {
    return `Here's what I'll set up:\n\nRole: ${all.role || "—"}\nResponsibilities: ${all.need || "—"}\nAutonomy: ${all.autonomy || "—"}\nBudget: ${all.budget || "—"}\n\nReady to hire this agent?`;
  }
  if (intent === "install_skill") {
    return `Here's the skill I'll install:\n\nCapability: ${all.capability || "—"}\nAccess: ${all.agents || "—"}\nRestrictions: ${all.permissions || "—"}\n\nShall I install this skill?`;
  }
  if (intent === "configure_model") {
    return `Here's your model configuration:\n\nPriority: ${all.priority || "—"}\nProvider: ${all.provider || "—"}\nFallback: ${all.fallback || "—"}\n\nShall I apply these settings?`;
  }
  return "Ready to proceed?";
}

export { AIWizard };
export type { WizardIntent };
