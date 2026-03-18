"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface Template {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_type: string | null;
  contributor: string | null;
  license: string | null;
  is_fillable: boolean;
  download_count: number;
  file_url: string | null;
}

interface TemplateBrowserProps {
  templates: Template[];
}

const CATEGORIES = [
  "all",
  "legal",
  "financial",
  "operational",
  "fundraise",
  "accelerator",
] as const;

function formatCategory(cat: string): string {
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

export function TemplateBrowser({ templates }: TemplateBrowserProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filtered = useMemo(() => {
    if (activeCategory === "all") return templates;
    return templates.filter((t) => t.category === activeCategory);
  }, [templates, activeCategory]);

  const grouped = useMemo(() => {
    const groups: Record<string, Template[]> = {};
    for (const t of filtered) {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    }
    return groups;
  }, [filtered]);

  const categoryOrder = CATEGORIES.filter((c) => c !== "all");

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-base font-semibold text-slate-900">Templates</h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Legal, financial, and operational templates for your startup
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2 py-1 text-xs font-medium transition-colors duration-150 ${
              activeCategory === cat
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {formatCategory(cat)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex items-center justify-center border border-slate-200 px-4 py-12">
          <p className="text-[13px] text-slate-500">
            No templates available in this category.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {categoryOrder.map((cat) => {
            const items = grouped[cat];
            if (!items || items.length === 0) return null;

            return (
              <div key={cat}>
                <h2 className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-3">
                  {formatCategory(cat)}
                </h2>
                <div className="flex flex-col gap-3">
                  {items.map((template) => (
                    <Card key={template.id}>
                      <CardHeader className="pb-0">
                        <div className="flex items-start justify-between">
                          <CardTitle>{template.title}</CardTitle>
                          <div className="flex items-center gap-2 ml-3 shrink-0">
                            <Badge variant="outline">
                              {formatCategory(template.category)}
                            </Badge>
                            {template.file_type && (
                              <Badge variant="default">
                                {template.file_type.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {template.description && (
                          <p className="mt-1 text-[13px] text-slate-500">
                            {template.description}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="pt-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            {template.contributor && (
                              <span>By {template.contributor}</span>
                            )}
                            {template.license && (
                              <span>{template.license}</span>
                            )}
                            <span className="tabular-nums">
                              {template.download_count} downloads
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {template.is_fillable && (
                              <Button size="sm" variant="outline">
                                Auto-fill
                              </Button>
                            )}
                            <Button size="sm" variant="default">
                              Download
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-12 text-xs text-slate-400 leading-relaxed">
        Templates are provided for educational purposes. Have a lawyer review
        any legal documents before signing.
      </p>
    </div>
  );
}
