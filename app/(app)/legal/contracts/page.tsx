"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

import { RelatedPages } from "@/components/shared/RelatedPages";
import {
  LEGAL_TEMPLATES,
  FillData,
  fillText,
  type LegalTemplate,
} from "@/lib/templates/legal-templates";

function TemplateCard({
  template,
  data,
  onDownloadPDF,
  onDownloadDOCX,
  onPreview,
}: {
  template: LegalTemplate;
  data: FillData;
  onDownloadPDF: (t: LegalTemplate) => void;
  onDownloadDOCX: (t: LegalTemplate) => void;
  onPreview: (t: LegalTemplate) => void;
}) {
  return (
    <div className="group border border-black/[0.08] rounded-md bg-white p-5 transition-colors duration-150 hover:border-black/30">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-black">
            {template.title}
          </h3>
          <p className="mt-1 text-[13px] text-black/50 leading-relaxed">
            {fillText(template.description, data)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="ghost" onClick={() => onPreview(template)}>
            Preview
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDownloadDOCX(template)}
          >
            DOCX
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={() => onDownloadPDF(template)}
          >
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
  onDownloadPDF,
  onDownloadDOCX,
}: {
  template: LegalTemplate;
  data: FillData;
  onClose: () => void;
  onDownloadPDF: (t: LegalTemplate) => void;
  onDownloadDOCX: (t: LegalTemplate) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-12 pb-12">
      <div className="w-full sm:max-w-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-black/[0.08] px-6 py-4">
          <h2 className="text-sm font-semibold text-black">
            {template.title}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDownloadDOCX(template)}
            >
              DOCX
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={() => onDownloadPDF(template)}
            >
              PDF
            </Button>
            <button
              onClick={onClose}
              className="p-1 text-black/40 hover:text-black/60 transition-colors"
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
        <div className="max-h-[80vh] sm:max-h-[70vh] overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
          {template.sections.map((section, i) => (
            <div key={i} className={i > 0 ? "mt-6" : ""}>
              {section.heading && (
                <h3 className="text-xs font-bold text-black uppercase tracking-wide mb-2">
                  {fillText(section.heading, data)}
                </h3>
              )}
              <div className="text-[13px] text-black/70 leading-relaxed whitespace-pre-line">
                {fillText(section.body, data)}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-black/[0.08] px-6 py-3">
          <p className="text-xs text-black/40">
            Not legal advice. Have a lawyer review before signing.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [companyName, setCompanyName] = useState("");
  const [founderName, setFounderName] = useState("");
  const [state, setState] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [preview, setPreview] = useState<LegalTemplate | null>(null);

  const data = useMemo<FillData>(
    () => ({ companyName, founderName, state, customerName }),
    [companyName, founderName, state, customerName]
  );

  const handleDownloadPDF = useCallback(
    async (template: LegalTemplate) => {
      const { generatePDF } = await import("@/lib/templates/generate-pdf");
      generatePDF(template, data);
    },
    [data]
  );

  const handleDownloadDOCX = useCallback(
    async (template: LegalTemplate) => {
      const { generateDOCX } = await import("@/lib/templates/generate-docx");
      generateDOCX(template, data);
    },
    [data]
  );

  return (
    <div className="mx-auto max-w-2xl">


      <div className="mb-10">
        <h1 className="font-heading text-[clamp(1.5rem,3vw,1.75rem)] italic font-light tracking-[-0.01em] text-black">Contract Templates</h1>
        <p className="mt-2 text-[14px] leading-[1.6] text-black/40">
          Download sample contract templates as PDF or DOCX. Auto-filled with your company details.
        </p>
      </div>

      {/* Auto-fill fields */}
      <div className="mb-8 border border-black/[0.08] rounded-md bg-black/[0.02] p-5">
        <p className="text-xs font-medium text-black/50 uppercase tracking-widest mb-4">
          Auto-fill details
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          <Input
            label="Counterparty name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="John Doe / Globex Corp"
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
            onDownloadPDF={handleDownloadPDF}
            onDownloadDOCX={handleDownloadDOCX}
            onPreview={setPreview}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-10 border-t border-black/[0.04] pt-6">
        <p className="text-xs text-black/40 leading-relaxed">
          Templates are MIT licensed and provided for educational purposes. Have
          a lawyer review any legal documents before signing.
        </p>
      </div>

      {/* Preview modal */}
      {preview && (
        <PreviewModal
          template={preview}
          data={data}
          onClose={() => setPreview(null)}
          onDownloadPDF={handleDownloadPDF}
          onDownloadDOCX={handleDownloadDOCX}
        />
      )}

      <RelatedPages links={[
        { label: "Incorporation", href: "/company/incorporation", context: "Complete formation docs alongside your templates" },
        { label: "SAFEs", href: "/legal/safes", context: "Issue SAFE agreements for early investors" },
        { label: "IP & Trademarks", href: "/legal/ip", context: "Protect your intellectual property and brand" },
      ]} />
    </div>
  );
}
