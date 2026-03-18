"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  LEGAL_TEMPLATES,
  FillData,
  fillText,
  type LegalTemplate,
} from "@/lib/templates/legal-templates";

interface TemplateBrowserProps {
  initialData: {
    companyName: string;
    founderName: string;
    state: string;
  };
}

function TemplateCard({
  template,
  data,
  onDownload,
  onPreview,
}: {
  template: LegalTemplate;
  data: FillData;
  onDownload: (t: LegalTemplate) => void;
  onPreview: (t: LegalTemplate) => void;
}) {
  return (
    <div className="group border border-slate-200 rounded-md bg-white p-5 transition-colors duration-150 hover:border-slate-300">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">
            {template.title}
          </h3>
          <p className="mt-1 text-[13px] text-slate-500 leading-relaxed">
            {fillText(template.description, data)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          <Button size="sm" variant="ghost" onClick={() => onPreview(template)}>
            Preview
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={() => onDownload(template)}
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

function PreviewModal({
  template,
  data,
  onClose,
  onDownload,
}: {
  template: LegalTemplate;
  data: FillData;
  onClose: () => void;
  onDownload: (t: LegalTemplate) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-12 pb-12">
      <div className="w-full max-w-2xl rounded-md bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            {template.title}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => onDownload(template)}
            >
              Download PDF
            </Button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-8 py-6">
          {template.sections.map((section, i) => (
            <div key={i} className={i > 0 ? "mt-6" : ""}>
              {section.heading && (
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">
                  {fillText(section.heading, data)}
                </h3>
              )}
              <div className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-line">
                {fillText(section.body, data)}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200 px-6 py-3">
          <p className="text-xs text-slate-400">
            Not legal advice. Have a lawyer review before signing.
          </p>
        </div>
      </div>
    </div>
  );
}

export function TemplateBrowser({ initialData }: TemplateBrowserProps) {
  const [companyName, setCompanyName] = useState(initialData.companyName);
  const [founderName, setFounderName] = useState(initialData.founderName);
  const [state, setState] = useState(initialData.state);
  const [preview, setPreview] = useState<LegalTemplate | null>(null);

  const data: FillData = { companyName, founderName, state };

  const handleDownload = useCallback(
    async (template: LegalTemplate) => {
      const { generatePDF } = await import("@/lib/templates/generate-pdf");
      generatePDF(template, data);
    },
    [data]
  );

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-base font-semibold text-slate-900">Templates</h1>
        <p className="mt-2 text-[15px] text-slate-700 leading-relaxed">
          What costs $10,000 from a lawyer. Free.
        </p>
        <p className="mt-1 text-[13px] text-slate-500 leading-relaxed">
          Board consent, stock purchase agreement, 83(b) election, IP
          assignment, CIIA, mutual NDA, contractor agreement, co-founder
          agreement — auto-filled with your details, downloaded as PDF, MIT
          licensed.
        </p>
      </div>

      {/* Auto-fill fields */}
      <div className="mb-8 border border-slate-200 rounded-md bg-slate-50/50 p-5">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-4">
          Auto-fill details
        </p>
        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Company name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Acme Inc."
          />
          <Input
            label="Founder name"
            value={founderName}
            onChange={(e) => setFounderName(e.target.value)}
            placeholder="Jane Smith"
          />
          <Input
            label="State"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="Delaware"
          />
        </div>
      </div>

      {/* Template list */}
      <div className="flex flex-col gap-3">
        {LEGAL_TEMPLATES.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            data={data}
            onDownload={handleDownload}
            onPreview={setPreview}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-10 border-t border-slate-100 pt-6">
        <p className="text-xs text-slate-400 leading-relaxed">
          Templates are MIT licensed and provided for educational purposes. Have
          a lawyer review any legal documents before signing. Update them
          whenever you want.
        </p>
      </div>

      {/* Preview modal */}
      {preview && (
        <PreviewModal
          template={preview}
          data={data}
          onClose={() => setPreview(null)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}
