"use client";

import { useState, useEffect, useCallback } from "react";
import { Education, EDUCATION } from "@/components/shared/Education";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Slide {
  id: string;
  title: string;
  content: string;
}

const STORAGE_KEY = "1pos_solutiondeck";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const DEFAULT_SLIDES: Slide[] = [
  {
    id: "s1",
    title: "Problem",
    content:
      "What painful problem exists? Who has it? How are they solving it today (poorly)?",
  },
  {
    id: "s2",
    title: "Solution",
    content:
      "What is your product? How does it solve this problem? What does the user experience look like?",
  },
  {
    id: "s3",
    title: "Market Size",
    content:
      "TAM (Total Addressable Market), SAM (Serviceable Available Market), SOM (Serviceable Obtainable Market). Use bottom-up analysis.",
  },
  {
    id: "s4",
    title: "Business Model",
    content:
      "How do you make money? Pricing model, unit economics, revenue streams. What does a customer pay and how often?",
  },
  {
    id: "s5",
    title: "Traction",
    content:
      "What have you achieved so far? Users, revenue, growth rate, LOIs, waitlist, key milestones. Show momentum.",
  },
  {
    id: "s6",
    title: "Team",
    content:
      "Who are the founders? What makes this team uniquely qualified to solve this problem? Relevant experience and superpowers.",
  },
  {
    id: "s7",
    title: "The Ask",
    content:
      "How much are you raising? What will you use the funds for? What milestones will you hit with this capital?",
  },
];

function loadSlides(): Slide[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through
  }
  return DEFAULT_SLIDES;
}

function saveSlides(slides: Slide[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slides));
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function SolutionDeckPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeSlide, setActiveSlide] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loaded = loadSlides();
    setSlides(loaded);
    if (loaded.length > 0) setActiveSlide(loaded[0].id);
    setLoaded(true);
  }, []);

  const persist = useCallback((next: Slide[]) => {
    setSlides(next);
    saveSlides(next);
  }, []);

  const updateSlide = (id: string, field: "title" | "content", value: string) => {
    persist(
      slides.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const moveSlide = (id: string, direction: "up" | "down") => {
    const idx = slides.findIndex((s) => s.id === id);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === slides.length - 1) return;

    const next = [...slides];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    persist(next);
  };

  const deleteSlide = (id: string) => {
    const next = slides.filter((s) => s.id !== id);
    persist(next);
    if (activeSlide === id) {
      setActiveSlide(next.length > 0 ? next[0].id : null);
    }
  };

  const addSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const slide: Slide = {
      id: generateId(),
      title: newTitle.trim(),
      content: "",
    };
    const next = [...slides, slide];
    persist(next);
    setActiveSlide(slide.id);
    setNewTitle("");
    setShowAddForm(false);
  };

  const exportToClipboard = async () => {
    const text = slides
      .map(
        (s, i) =>
          `--- Slide ${i + 1}: ${s.title} ---\n\n${s.content || "(empty)"}`
      )
      .join("\n\n\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetToTemplate = () => {
    persist(DEFAULT_SLIDES);
    setActiveSlide(DEFAULT_SLIDES[0].id);
  };

  const current = slides.find((s) => s.id === activeSlide);
  const currentIdx = slides.findIndex((s) => s.id === activeSlide);

  if (!loaded) return null;

  return (
    <div className="mx-auto max-w-[900px]">
      <Education {...EDUCATION.solutionDeck} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-black">
            Solution Deck
          </h1>
          <p className="mt-1 text-sm text-black/50">
            Build your pitch deck slide by slide. Pre-filled with a standard
            investor template.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToClipboard}
            className="h-8 rounded-md border border-black/[0.08] px-3 text-[13px] font-medium text-black/60 hover:bg-black/[0.02] transition-colors"
          >
            {copied ? "Copied!" : "Copy as Text"}
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="h-8 rounded-md bg-black px-3 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            {showAddForm ? "Cancel" : "+ Add Slide"}
          </button>
        </div>
      </div>

      {/* Add slide form */}
      {showAddForm && (
        <form
          onSubmit={addSlide}
          className="mt-4 flex gap-2"
        >
          <input
            autoFocus
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Slide title (e.g. 'Why Now?')"
            className="h-9 flex-1 rounded-md border border-black/[0.08] bg-white px-3 text-[13px] text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button
            type="submit"
            className="h-9 rounded-md bg-black px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            Add
          </button>
        </form>
      )}

      <div className="mt-6 flex gap-6">
        {/* Slide list (sidebar) */}
        <div className="w-48 shrink-0 space-y-1">
          {slides.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setActiveSlide(slide.id)}
              className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                activeSlide === slide.id
                  ? "bg-black text-white"
                  : "bg-white border border-black/[0.08] text-black/70 hover:bg-black/[0.02]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-mono ${
                    activeSlide === slide.id ? "text-black/40" : "text-black/40"
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="text-[13px] font-medium truncate">
                  {slide.title}
                </span>
              </div>
              {slide.content && (
                <p
                  className={`mt-0.5 text-[11px] truncate ${
                    activeSlide === slide.id ? "text-black/40" : "text-black/40"
                  }`}
                >
                  {slide.content.slice(0, 40)}
                  {slide.content.length > 40 ? "..." : ""}
                </p>
              )}
            </button>
          ))}

          {slides.length === 0 && (
            <div className="text-center py-8">
              <p className="text-[12px] text-black/40">No slides yet.</p>
            </div>
          )}

          {/* Reset link */}
          <div className="pt-3">
            <button
              onClick={resetToTemplate}
              className="text-[11px] text-black/40 hover:text-black/60 transition-colors"
            >
              Reset to template
            </button>
          </div>
        </div>

        {/* Slide editor */}
        {current ? (
          <div className="flex-1 rounded-xl border border-black/[0.08] bg-white p-6">
            {/* Slide header with controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-black/40">
                  Slide {currentIdx + 1} of {slides.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveSlide(current.id, "up")}
                  disabled={currentIdx === 0}
                  className="h-7 w-7 rounded flex items-center justify-center text-black/40 hover:text-black hover:bg-black/[0.04] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-black/40 transition-colors"
                  title="Move up"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </button>
                <button
                  onClick={() => moveSlide(current.id, "down")}
                  disabled={currentIdx === slides.length - 1}
                  className="h-7 w-7 rounded flex items-center justify-center text-black/40 hover:text-black hover:bg-black/[0.04] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-black/40 transition-colors"
                  title="Move down"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                <div className="w-px h-5 bg-black/[0.08] mx-1" />
                <button
                  onClick={() => deleteSlide(current.id)}
                  className="h-7 w-7 rounded flex items-center justify-center text-black/40 hover:text-black hover:bg-black/[0.04] transition-colors"
                  title="Delete slide"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Title */}
            <input
              value={current.title}
              onChange={(e) =>
                updateSlide(current.id, "title", e.target.value)
              }
              className="w-full text-xl font-semibold text-black bg-transparent border-none focus:outline-none placeholder:text-black/30"
              placeholder="Slide title"
            />

            {/* Content */}
            <textarea
              value={current.content}
              onChange={(e) =>
                updateSlide(current.id, "content", e.target.value)
              }
              rows={12}
              className="mt-4 w-full rounded-md border border-black/[0.08] bg-white px-4 py-3 text-[13px] text-black/70 leading-relaxed placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black resize-y"
              placeholder="Write your slide content here..."
            />

            {/* Word count */}
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-black/40">
                {current.content.trim()
                  ? current.content.trim().split(/\s+/).length
                  : 0}{" "}
                words
              </span>
              {/* Navigate */}
              <div className="flex items-center gap-2">
                {currentIdx > 0 && (
                  <button
                    onClick={() => setActiveSlide(slides[currentIdx - 1].id)}
                    className="text-[12px] text-black/50 hover:text-black transition-colors"
                  >
                    Previous
                  </button>
                )}
                {currentIdx < slides.length - 1 && (
                  <button
                    onClick={() => setActiveSlide(slides[currentIdx + 1].id)}
                    className="text-[12px] text-black/50 hover:text-black transition-colors"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 rounded-xl border border-black/[0.08] bg-white p-12 text-center">
            <p className="text-sm text-black/50">
              Select a slide from the list or add a new one.
            </p>
          </div>
        )}
      </div>

      {/* Full deck preview */}
      {slides.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-semibold text-black/70">
              Full Deck Preview
            </h2>
            <span className="text-[11px] text-black/40">
              {slides.length} slides
            </span>
          </div>
          <div className="space-y-3">
            {slides.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setActiveSlide(slide.id)}
                className={`w-full rounded-xl border p-4 text-left transition-all ${
                  activeSlide === slide.id
                    ? "border-black bg-black/[0.02] ring-1 ring-black"
                    : "border-black/[0.08] bg-white hover:border-black/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="shrink-0 rounded bg-black/[0.04] px-1.5 py-0.5 text-[11px] font-mono text-black/50">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-black">
                      {slide.title}
                    </p>
                    {slide.content && (
                      <p className="mt-1 text-[12px] text-black/50 line-clamp-2">
                        {slide.content}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
