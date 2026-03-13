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

const InvoiceForm = React.lazy(() =>
  import("@/components/forms/InvoiceForm").then((m) => ({ default: m.InvoiceForm }))
);
const ExpenseForm = React.lazy(() =>
  import("@/components/forms/ExpenseForm").then((m) => ({ default: m.ExpenseForm }))
);
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
  | "invoice"
  | "expense"
  | "contact"
  | "project"
  | "document"
  | null;

const formTitles: Record<Exclude<ActiveForm, null>, string> = {
  invoice: "New Invoice",
  expense: "Log Expense",
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

function AppShell({ headerProps, agents, sidebarCounts, children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [killSwitchOpen, setKillSwitchOpen] = React.useState(false);
  const [commandBarOpen, setCommandBarOpen] = React.useState(false);
  const [activeForm, setActiveForm] = React.useState<ActiveForm>(null);
  const [wizardIntent, setWizardIntent] = React.useState<WizardIntent | null>(null);

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
      "/vault": "vault",
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
        case "create_invoice":
          setActiveForm("invoice");
          break;
        case "create_expense":
          setActiveForm("expense");
          break;
        case "create_agent":
          setWizardIntent("hire_agent");
          break;
        case "resume_agent":
        case "pause_agent":
          // These are handled server-side by the core, just refresh
          router.refresh();
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
        case "new_invoice":
          setActiveForm("invoice");
          break;
        case "new_expense":
          setActiveForm("expense");
          break;
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
          <div className="flex items-center justify-center py-8 text-sm text-zinc-500">
            Loading...
          </div>
        }
      >
        {activeForm === "invoice" && <InvoiceForm onClose={() => setActiveForm(null)} />}
        {activeForm === "expense" && <ExpenseForm onClose={() => setActiveForm(null)} />}
        {activeForm === "contact" && <ContactForm onClose={() => setActiveForm(null)} />}
        {activeForm === "project" && <ProjectForm onClose={() => setActiveForm(null)} />}
        {activeForm === "document" && <DocumentUploadForm onClose={() => setActiveForm(null)} />}
      </React.Suspense>
    );
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar counts={sidebarCounts} />

      <div className="ml-0 flex flex-1 flex-col md:ml-[200px]">
        <Header
          businessName={headerProps.businessName}
          healthScore={headerProps.healthScore}
          costToday={headerProps.costToday}
          budgetDaily={headerProps.budgetDaily}
          onKillSwitch={() => setKillSwitchOpen(true)}
          onOpenCommandBar={() => setCommandBarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <CoreBanner section={currentSection} onAction={handleCommandAction} />
          {children}
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

      {/* AI Wizard — conversational flows */}
      {wizardIntent && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setWizardIntent(null)}
          />
          <div className="fixed inset-x-0 top-0 z-50 mx-auto w-full max-w-lg">
            <div className="mx-4 mt-4 h-[70vh] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl">
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
