"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Header } from "@/components/shell/Header";
import { CommandBar } from "@/components/shell/CommandBar";
import { KillSwitch } from "@/components/shell/KillSwitch";
import { Sidebar } from "@/components/shell/Sidebar";
import { InlineFormSheet } from "@/components/shell/InlineFormSheet";
import { AIWizard, type WizardIntent } from "@/components/shell/AIWizard";
import { CoreBanner } from "@/components/shell/CoreBanner";
import { AlwaysOnVoice } from "@/components/shell/AlwaysOnVoice";
import { FounderEducation } from "@/components/shared/FounderEducation";
import { ArticleNav } from "@/components/shared/ArticleNav";

const ContactForm = React.lazy(() =>
  import("@/components/forms/PersonForm").then((m) => ({ default: m.ContactForm }))
);
const ProjectForm = React.lazy(() =>
  import("@/components/forms/ProjectForm").then((m) => ({ default: m.ProjectForm }))
);
const DocumentUploadForm = React.lazy(() =>
  import("@/components/forms/DocumentUploadForm").then((m) => ({
    default: m.DocumentUploadForm,
  }))
);

type ActiveForm =
  | "contact"
  | "project"
  | "document"
  | null;

const formTitles: Record<Exclude<ActiveForm, null>, string> = {
  contact: "Add Contact",
  project: "New Project",
  document: "Upload Document",
};

interface AppShellProps {
  headerProps: {
    businessName?: string;
    healthScore: number;
    costToday: number;
    budgetDaily: number;
  };
  agents: { id: string; name: string; status: string }[];
  sidebarCounts?: {
    pendingDecisions?: number;
    overdueInvoices?: number;
    activeRelationships?: number;
    activeProjects?: number;
    activeAgents?: number;
    documentCount?: number;
  };
  children: React.ReactNode;
}

function ArticleLayout({ onBack, children }: { onBack: () => void; children: React.ReactNode; }) {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    function handleScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) { setProgress(100); return; }
      setProgress(Math.min(100, Math.round((scrollTop / docHeight) * 100)));
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Horizontal progress bar — fixed at top */}
      <div className="fixed left-0 right-0 top-0 z-50 h-[2px] bg-black/[0.04]">
        <div
          className="h-full bg-black/30 transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <nav className="sticky top-[2px] z-40 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-[680px] px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-[13px] text-black/40 hover:text-black/70 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Dashboard
          </button>
          <button
            onClick={onBack}
            className="font-heading text-[15px] italic font-extralight tracking-[-0.02em] text-black/30 hover:text-black/60 transition-colors"
          >
            1P
          </button>
        </div>
      </nav>
      <main className="flex-1 overflow-y-auto pb-16">
        {children}
      </main>
      <ArticleNav />
    </div>
  );
}

function AppShell({ headerProps, agents, sidebarCounts, children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [killSwitchOpen, setKillSwitchOpen] = React.useState(false);
  const [commandBarOpen, setCommandBarOpen] = React.useState(false);
  const [activeForm, setActiveForm] = React.useState<ActiveForm>(null);
  const [wizardIntent, setWizardIntent] = React.useState<WizardIntent | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [sidebarEditMode, setSidebarEditMode] = React.useState(false);

  // Map pathname to section name for CoreBanner
  const currentSection = React.useMemo(() => {
    const map: Record<string, string> = {
      "/": "hq",
      "/finance": "finance",
      "/sales": "sales",
      "/crm": "crm",
      "/work": "work",
      "/team": "team",
      "/talent": "team",
      "/canvas": "canvas",
      "/settings": "settings",
    };
    return map[pathname] ?? "hq";
  }, [pathname]);

  // Global Cmd+K listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandBarOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleKillConfirm = async (level: string, agentId?: string) => {
    await fetch("/api/safety/kill-switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, agentId }),
    });
  };

  const handleCommandAction = React.useCallback(
    (action: string, params?: Record<string, unknown>) => {
      switch (action) {
        // Navigation (from AI Core)
        case "navigate":
          if (params?.page) router.push(params.page as string);
          break;
        // AI Core actions
        case "create_agent":
          setWizardIntent("hire_agent");
          break;
        case "resume_agent":
        case "pause_agent":
          // These are handled server-side by the core, just refresh
          router.refresh();
          break;
        case "resume_all":
          fetch("/api/agents/resume-all", { method: "POST" }).then(() => router.refresh());
          break;
        // AI wizard flows
        case "hire_agent":
          setWizardIntent("hire_agent");
          break;
        case "install_skill":
          setWizardIntent("install_skill");
          break;
        case "configure_model":
          setWizardIntent("configure_model");
          break;
        // Traditional forms
        case "add_contact":
          setActiveForm("contact");
          break;
        case "new_project":
          setActiveForm("project");
          break;
        case "upload_document":
          setActiveForm("document");
          break;
        case "kill_switch":
          setKillSwitchOpen(true);
          break;
        // Sidebar control
        case "toggle_sidebar":
          setSidebarCollapsed((prev) => !prev);
          window.dispatchEvent(new CustomEvent("sidebar-toggle"));
          break;
        case "edit_sidebar":
          setSidebarEditMode((prev) => !prev);
          window.dispatchEvent(new CustomEvent("sidebar-edit-toggle"));
          break;
        // Decision actions
        case "approve_decision":
          fetch("/api/decisions/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ scope: params?.scope ?? "next" }),
          }).then(() => router.refresh());
          break;
        case "reject_decision":
          fetch("/api/decisions/reject", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ what: params?.what }),
          }).then(() => router.refresh());
          break;
        // Search
        case "search":
          if (params?.query) {
            router.push(`/launch?q=${encodeURIComponent(params.query as string)}`);
          }
          break;
        // Automations
        case "new_automation":
          router.push("/automations?new=1");
          break;
        case "toggle_automation":
          fetch("/api/automations/toggle", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params),
          }).then(() => router.refresh());
          break;
        // Voice control
        case "voice_mute":
          window.dispatchEvent(new CustomEvent("voice-control", { detail: { action: "mute" } }));
          break;
        case "voice_unmute":
          window.dispatchEvent(new CustomEvent("voice-control", { detail: { action: "unmute" } }));
          break;
        default:
          break;
      }
    },
    [router]
  );

  // Listen for app-action events dispatched by section pages
  React.useEffect(() => {
    const handleAppAction = (e: Event) => {
      const detail = (e as CustomEvent<{ action: string }>).detail;
      if (detail?.action) {
        handleCommandAction(detail.action);
      }
    };
    window.addEventListener("app-action", handleAppAction);
    return () => window.removeEventListener("app-action", handleAppAction);
  }, [handleCommandAction]);

  const handleWizardComplete = async (intent: WizardIntent, result: Record<string, string>) => {
    try {
      if (intent === "hire_agent") {
        await fetch("/api/agents/hire", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result),
        });
      } else if (intent === "install_skill") {
        await fetch("/api/skills/install", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result),
        });
      } else if (intent === "configure_model") {
        await fetch("/api/settings/models", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result),
        });
      }
    } catch {
      // Best effort
    }
    setWizardIntent(null);
  };

  const renderFormContent = () => {
    if (!activeForm) return null;
    return (
      <React.Suspense
        fallback={
          <div className="flex items-center justify-center py-8 text-sm text-black/50">
            Loading...
          </div>
        }
      >
        {activeForm === "contact" && <ContactForm onClose={() => setActiveForm(null)} />}
        {activeForm === "project" && <ProjectForm onClose={() => setActiveForm(null)} />}
        {activeForm === "document" && <DocumentUploadForm onClose={() => setActiveForm(null)} />}
      </React.Suspense>
    );
  };

  const isArticlePage = pathname === "/company/founders" || pathname === "/company/ideation" || pathname === "/company/equity" || pathname === "/company/incorporation" || pathname === "/company/founder-wellness" || pathname === "/business/traction" || pathname === "/money/fundraising" || pathname === "/business/pricing" || pathname === "/legal";

  if (isArticlePage) {
    return <ArticleLayout onBack={() => router.push("/launch")}>{children}</ArticleLayout>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar counts={sidebarCounts} onOpenCommandBar={() => setCommandBarOpen(true)} />

      <div className="ml-0 flex flex-1 flex-col md:ml-[220px]">
        <Header
          businessName={headerProps.businessName}
          healthScore={headerProps.healthScore}
          costToday={headerProps.costToday}
          budgetDaily={headerProps.budgetDaily}
          onKillSwitch={() => setKillSwitchOpen(true)}
          onOpenCommandBar={() => setCommandBarOpen(true)}
          onVoiceTranscript={(text) => {
            // Open command bar with the voice transcript and auto-process
            setCommandBarOpen(true);
            // Dispatch a custom event so CommandBar can pick up the transcript
            window.dispatchEvent(
              new CustomEvent("voice-transcript", { detail: { text } })
            );
          }}
        />

        <main className="flex-1 overflow-y-auto bg-white p-4 md:p-8">
          <CoreBanner section={currentSection} onAction={handleCommandAction} />
          {children}
          <FounderEducation />
        </main>
      </div>

      <CommandBar
        open={commandBarOpen}
        onClose={() => setCommandBarOpen(false)}
        onAction={handleCommandAction}
        agents={agents.map((a) => ({ id: a.id, name: a.name }))}
      />

      <KillSwitch
        open={killSwitchOpen}
        onClose={() => setKillSwitchOpen(false)}
        onConfirm={handleKillConfirm}
        agents={agents.map((a) => ({ id: a.id, name: a.name }))}
      />

      <InlineFormSheet
        open={activeForm !== null}
        onClose={() => setActiveForm(null)}
        title={activeForm ? formTitles[activeForm] : ""}
      >
        {renderFormContent()}
      </InlineFormSheet>

      {/* Always-on voice control — listens globally without CommandBar */}
      <AlwaysOnVoice
        onAction={handleCommandAction}
        onOpenCommandBar={() => setCommandBarOpen(true)}
      />

      {/* AI Wizard — conversational flows */}
      {wizardIntent && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setWizardIntent(null)}
          />
          <div className="fixed inset-x-0 top-0 z-50 mx-auto w-full sm:max-w-lg">
            <div className="mx-2 sm:mx-4 mt-2 sm:mt-4 h-[85vh] sm:h-[70vh] overflow-hidden border border-black/[0.06] bg-white shadow-2xl">
              <AIWizard
                intent={wizardIntent}
                onClose={() => setWizardIntent(null)}
                onComplete={handleWizardComplete}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export { AppShell };
export type { AppShellProps };
