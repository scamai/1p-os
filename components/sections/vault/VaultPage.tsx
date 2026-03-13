"use client";

import * as React from "react";
import { AISummary } from "@/components/shared/AISummary";
import { TabBar } from "@/components/shared/TabBar";

const TABS = ["All", "Contracts", "Receipts", "Other"] as const;
type VaultTab = (typeof TABS)[number];

type DocType = "Contract" | "Receipt" | "Other";

interface VaultDoc {
  id: string;
  name: string;
  type: DocType;
  date: string;
  linkedTo: string;
}

const MOCK_DOCS: VaultDoc[] = [
  { id: "1", name: "Acme Corp - Service Agreement.pdf", type: "Contract", date: "2026-03-01", linkedTo: "Acme Corp" },
  { id: "2", name: "Vercel Pro - March 2026.pdf", type: "Receipt", date: "2026-03-01", linkedTo: "Infrastructure" },
  { id: "3", name: "Globex Inc - SOW.pdf", type: "Contract", date: "2026-02-15", linkedTo: "API Integration" },
  { id: "4", name: "Tax Filing Notes.docx", type: "Other", date: "2026-02-28", linkedTo: "" },
  { id: "5", name: "Claude API - February.pdf", type: "Receipt", date: "2026-02-28", linkedTo: "AI" },
];

function dispatchAppAction(action: string) {
  window.dispatchEvent(new CustomEvent("app-action", { detail: { action } }));
}

interface VaultPageProps {
  onAction?: (action: string) => void;
}

function VaultPage({ onAction }: VaultPageProps) {
  const [activeTab, setActiveTab] = React.useState<VaultTab>("All");
  const [previewId, setPreviewId] = React.useState<string | null>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const handleAction = onAction ?? dispatchAppAction;

  const filtered = MOCK_DOCS.filter((doc) => {
    if (activeTab === "All") return true;
    if (activeTab === "Contracts") return doc.type === "Contract";
    if (activeTab === "Receipts") return doc.type === "Receipt";
    if (activeTab === "Other") return doc.type === "Other";
    return true;
  });

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-lg font-semibold text-zinc-900">Vault</h1>
      <div className="mt-2">
        <AISummary section="vault" />
      </div>

      {/* Upload zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => handleAction("upload_document")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleAction("upload_document");
        }}
        className={`mt-6 flex cursor-pointer items-center justify-center rounded-lg border border-dashed p-8 text-center transition-colors duration-200 ${
          isDragOver
            ? "border-zinc-200 bg-zinc-50"
            : "border-zinc-200 hover:border-zinc-300"
        }`}
      >
        <div>
          <svg
            className="mx-auto h-5 w-5 text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          <p className="mt-2 text-[13px] text-zinc-700">
            Drop files here to upload
          </p>
        </div>
      </div>

      <div className="mt-6">
        <TabBar
          tabs={TABS as unknown as string[]}
          active={activeTab}
          onChange={(tab) => setActiveTab(tab as VaultTab)}
        />
      </div>

      <div className="mt-8">
        <div className="flex flex-col">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="cursor-pointer transition-colors duration-200 hover:bg-zinc-50"
              onClick={() =>
                setPreviewId(previewId === doc.id ? null : doc.id)
              }
            >
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <svg
                    className="h-4 w-4 flex-shrink-0 text-zinc-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                    />
                  </svg>
                  <div>
                    <p className="text-[13px] text-zinc-600">{doc.name}</p>
                    <p className="text-[11px] text-zinc-600">
                      {doc.type}
                      {doc.linkedTo ? ` \u00B7 ${doc.linkedTo}` : ""}
                    </p>
                  </div>
                </div>
                <p className="font-mono text-[11px] text-zinc-600">{doc.date}</p>
              </div>

              {previewId === doc.id && (
                <div className="mb-3 ml-7 rounded bg-zinc-50 px-5 py-6 text-center">
                  <p className="text-[13px] text-zinc-700">
                    Document preview placeholder
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-700">
                    Preview will render here when document storage is connected.
                  </p>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-8 text-center text-[13px] text-zinc-600">
              No documents found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { VaultPage };
