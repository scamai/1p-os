"use client";

import * as React from "react";

type SkillCategory = "communication" | "data" | "automation" | "content" | "system";

interface Skill {
  id: string;
  name: string;
  description: string;
  agents: string;
  active: boolean;
  category: SkillCategory;
}

const CATEGORY_LABELS: Record<SkillCategory, string> = {
  communication: "Communication",
  data: "Data & Analytics",
  automation: "Automation",
  content: "Content",
  system: "System",
};

const SKILLS: Skill[] = [
  { id: "email-send", name: "Email Send", description: "Send emails via connected accounts", agents: "Sales, Admin", active: true, category: "communication" },
  { id: "notification-send", name: "Notification Send", description: "Push notifications to founder", agents: "All", active: true, category: "communication" },
  { id: "calendar", name: "Calendar", description: "Create, read, update calendar events", agents: "Admin", active: false, category: "communication" },
  { id: "database-query", name: "Database Query", description: "Query business database", agents: "Analytics", active: true, category: "data" },
  { id: "invoice-generate", name: "Invoice Generate", description: "Create and send invoices", agents: "Finance", active: true, category: "data" },
  { id: "web-browse", name: "Web Browse", description: "Browse and extract web content", agents: "All", active: true, category: "automation" },
  { id: "api-call", name: "API Call", description: "Make HTTP requests to external services", agents: "All", active: true, category: "automation" },
  { id: "code-execute", name: "Code Execute", description: "Run code in sandboxed environment", agents: "Dev Agent", active: true, category: "automation" },
  { id: "social-post", name: "Social Post", description: "Post to social media platforms", agents: "Content", active: false, category: "content" },
  { id: "file-manage", name: "File Manage", description: "Read, write, organize files in Vault", agents: "All", active: true, category: "system" },
];

function SkillCard({
  skill,
  onToggle,
  onDelete,
}: {
  skill: Skill;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  return (
    <div
      className={`rounded-lg border border-black/[0.08] bg-white px-4 py-3 transition-all cursor-pointer hover:shadow-sm ${!skill.active ? "opacity-50" : ""}`}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-black">{skill.name}</p>
            {!skill.active && (
              <span className="rounded bg-black/[0.04] px-1.5 py-0.5 text-[10px] text-black/50">Off</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-black/50">{skill.description}</p>
          <p className="mt-1.5 font-mono text-[11px] text-black/40">
            {skill.agents}
          </p>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 border-t border-black/[0.04] pt-3">
          {confirmDelete ? (
            <div className="flex items-center justify-between">
              <span className="text-xs text-black/50">Remove {skill.name}?</span>
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
                  className="text-xs text-black/50 hover:text-black/70"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(skill.id); }}
                  className="text-xs font-medium text-black hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); onToggle(skill.id); }}
                className="text-xs text-black/50 hover:text-black transition-colors"
              >
                {skill.active ? "Deactivate" : "Activate"}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                className="text-xs text-black/40 hover:text-black/70 transition-colors"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SkillsPanel() {
  const [skills, setSkills] = React.useState<Skill[]>(SKILLS);

  const handleToggle = (id: string) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  const handleDelete = (id: string) => {
    setSkills((prev) => prev.filter((s) => s.id !== id));
  };

  const grouped = React.useMemo(() => {
    const groups: Partial<Record<SkillCategory, Skill[]>> = {};
    for (const skill of skills) {
      if (!groups[skill.category]) groups[skill.category] = [];
      groups[skill.category]!.push(skill);
    }
    return groups;
  }, [skills]);

  const categoryOrder: SkillCategory[] = ["communication", "data", "automation", "content", "system"];

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-black">Skills</h2>
        <span className="text-xs text-black/40">{skills.length} installed</span>
      </div>

      {skills.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-black/50">No skills installed.</p>
          <button
            onClick={() => setSkills(SKILLS)}
            className="mt-2 text-xs text-black/50 hover:text-black transition-colors"
          >
            Restore defaults
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {categoryOrder.map((cat) => {
            const catSkills = grouped[cat];
            if (!catSkills || catSkills.length === 0) return null;
            return (
              <div key={cat}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-medium text-black">{CATEGORY_LABELS[cat]}</span>
                  <span className="text-[10px] text-black/40">{catSkills.length}</span>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {catSkills.map((skill) => (
                    <SkillCard
                      key={skill.id}
                      skill={skill}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={() => window.dispatchEvent(new CustomEvent("app-action", { detail: { action: "install_skill" } }))}
        className="mt-4 text-xs text-black/40 hover:text-black/70 transition-colors"
      >
        + Install Skill
      </button>
    </section>
  );
}

export { SkillsPanel };
