"use client";

import * as React from "react";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export interface ApiKeyEntry {
  id: string;
  provider: string;
  label: string;
  envVar: string;
  value: string;
  category: string;
  required?: boolean;
}

const PROVIDER_CATALOG: Omit<ApiKeyEntry, "value">[] = [
  // LLMs — Primary
  { id: "anthropic", provider: "anthropic", label: "Anthropic (Claude)", envVar: "ANTHROPIC_API_KEY", category: "LLM", required: true },
  { id: "openai", provider: "openai", label: "OpenAI (GPT)", envVar: "OPENAI_API_KEY", category: "LLM" },
  { id: "google", provider: "google", label: "Google (Gemini)", envVar: "GOOGLE_GENERATIVE_AI_API_KEY", category: "LLM" },
  { id: "mistral", provider: "mistral", label: "Mistral", envVar: "MISTRAL_API_KEY", category: "LLM" },
  { id: "xai", provider: "xai", label: "xAI (Grok)", envVar: "XAI_API_KEY", category: "LLM" },
  { id: "deepseek", provider: "deepseek", label: "DeepSeek", envVar: "DEEPSEEK_API_KEY", category: "LLM" },
  { id: "cohere", provider: "cohere", label: "Cohere", envVar: "COHERE_API_KEY", category: "LLM" },
  { id: "groq", provider: "groq", label: "Groq", envVar: "GROQ_API_KEY", category: "LLM" },
  { id: "perplexity", provider: "perplexity", label: "Perplexity", envVar: "PERPLEXITY_API_KEY", category: "LLM" },
  { id: "fireworks", provider: "fireworks", label: "Fireworks AI", envVar: "FIREWORKS_API_KEY", category: "LLM" },
  { id: "together", provider: "together", label: "Together AI", envVar: "TOGETHER_API_KEY", category: "LLM" },
  { id: "replicate", provider: "replicate", label: "Replicate", envVar: "REPLICATE_API_TOKEN", category: "LLM" },

  // Chinese LLMs
  { id: "minimax", provider: "minimax", label: "MiniMax", envVar: "MINIMAX_API_KEY", category: "LLM" },
  { id: "moonshot", provider: "moonshot", label: "Moonshot / Kimi", envVar: "MOONSHOT_API_KEY", category: "LLM" },
  { id: "zhipu", provider: "zhipu", label: "Zhipu AI (GLM)", envVar: "ZHIPUAI_API_KEY", category: "LLM" },
  { id: "dashscope", provider: "dashscope", label: "Qwen (DashScope)", envVar: "DASHSCOPE_API_KEY", category: "LLM" },
  { id: "yi", provider: "yi", label: "Yi (01.AI)", envVar: "YI_API_KEY", category: "LLM" },
  { id: "baichuan", provider: "baichuan", label: "Baichuan", envVar: "BAICHUAN_API_KEY", category: "LLM" },

  // Gateways
  { id: "openrouter", provider: "openrouter", label: "OpenRouter", envVar: "OPENROUTER_API_KEY", category: "Gateway" },

  // Integrations (500+ apps)
  { id: "composio", provider: "composio", label: "Composio (500+ apps)", envVar: "COMPOSIO_API_KEY", category: "Integrations" },

  // Voice & TTS
  { id: "elevenlabs", provider: "elevenlabs", label: "ElevenLabs", envVar: "ELEVENLABS_API_KEY", category: "Voice" },
  { id: "fish-audio", provider: "fish-audio", label: "Fish Audio", envVar: "FISH_AUDIO_API_KEY", category: "Voice" },
  { id: "cartesia", provider: "cartesia", label: "Cartesia", envVar: "CARTESIA_API_KEY", category: "Voice" },
  { id: "deepgram", provider: "deepgram", label: "Deepgram", envVar: "DEEPGRAM_API_KEY", category: "Voice" },
  { id: "assembly", provider: "assembly", label: "AssemblyAI", envVar: "ASSEMBLY_AI_API_KEY", category: "Voice" },
  { id: "play-ht", provider: "play-ht", label: "Play.ht", envVar: "PLAY_HT_API_KEY", category: "Voice" },
  { id: "resemble", provider: "resemble", label: "Resemble AI", envVar: "RESEMBLE_API_KEY", category: "Voice" },

  // Image
  { id: "stability", provider: "stability", label: "Stability AI", envVar: "STABILITY_API_KEY", category: "Image" },
  { id: "fal", provider: "fal", label: "fal.ai (FLUX)", envVar: "FAL_KEY", category: "Image" },
  { id: "midjourney", provider: "midjourney", label: "Midjourney", envVar: "MIDJOURNEY_API_KEY", category: "Image" },
  { id: "leonardo", provider: "leonardo", label: "Leonardo AI", envVar: "LEONARDO_API_KEY", category: "Image" },
  { id: "ideogram", provider: "ideogram", label: "Ideogram", envVar: "IDEOGRAM_API_KEY", category: "Image" },

  // Video
  { id: "runway", provider: "runway", label: "Runway", envVar: "RUNWAY_API_KEY", category: "Video" },
  { id: "luma", provider: "luma", label: "Luma", envVar: "LUMA_API_KEY", category: "Video" },
  { id: "kling", provider: "kling", label: "Kling AI", envVar: "KLING_API_KEY", category: "Video" },
  { id: "seedance", provider: "seedance", label: "Seedance", envVar: "SEEDANCE_API_KEY", category: "Video" },
  { id: "pika", provider: "pika", label: "Pika Labs", envVar: "PIKA_API_KEY", category: "Video" },
  { id: "minimax-video", provider: "minimax", label: "MiniMax Video (Hailuo)", envVar: "MINIMAX_VIDEO_API_KEY", category: "Video" },
  { id: "pixverse", provider: "pixverse", label: "PixVerse", envVar: "PIXVERSE_API_KEY", category: "Video" },
  { id: "vidu", provider: "vidu", label: "Vidu AI", envVar: "VIDU_API_KEY", category: "Video" },

  // Music
  { id: "suno", provider: "suno", label: "Suno", envVar: "SUNO_API_KEY", category: "Music" },
  { id: "udio", provider: "udio", label: "Udio", envVar: "UDIO_API_KEY", category: "Music" },

  // Search
  { id: "tavily", provider: "tavily", label: "Tavily", envVar: "TAVILY_API_KEY", category: "Search" },
  { id: "exa", provider: "exa", label: "Exa", envVar: "EXA_API_KEY", category: "Search" },
  { id: "serper", provider: "serper", label: "Serper", envVar: "SERPER_API_KEY", category: "Search" },
  { id: "brave-search", provider: "brave", label: "Brave Search", envVar: "BRAVE_SEARCH_API_KEY", category: "Search" },
  { id: "jina", provider: "jina", label: "Jina AI", envVar: "JINA_API_KEY", category: "Search" },
];

const CATEGORIES = ["LLM", "Gateway", "Integrations", "Voice", "Image", "Video", "Music", "Search"];

interface ApiKeySetupProps {
  keys: Record<string, string>;
  onChange: (keys: Record<string, string>) => void;
  compact?: boolean;
}

function ApiKeySetup({ keys, onChange, compact = false }: ApiKeySetupProps) {
  const [search, setSearch] = React.useState("");
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(
    new Set(["LLM"])
  );

  const configuredCount = Object.values(keys).filter((v) => v.length > 0).length;

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const updateKey = (envVar: string, value: string) => {
    onChange({ ...keys, [envVar]: value });
  };

  const filtered = search
    ? PROVIDER_CATALOG.filter(
        (p) =>
          p.label.toLowerCase().includes(search.toLowerCase()) ||
          p.provider.toLowerCase().includes(search.toLowerCase()) ||
          p.category.toLowerCase().includes(search.toLowerCase())
      )
    : PROVIDER_CATALOG;

  return (
    <div>
      {!compact && (
        <>
          <h2 className="mb-1 text-lg font-semibold text-zinc-900">
            Add your API keys
          </h2>
          <p className="mb-4 text-sm text-zinc-500">
            Add at least one LLM key to get started. You can add more anytime in settings.
          </p>
        </>
      )}

      {/* Search + stats */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search providers..."
            className="h-8 w-full rounded-md border border-zinc-200 bg-transparent pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
          />
        </div>
        <Badge variant={configuredCount > 0 ? "success" : "default"}>
          {configuredCount} configured
        </Badge>
      </div>

      {/* Category groups */}
      <div className="flex flex-col gap-2">
        {CATEGORIES.map((cat) => {
          const items = filtered.filter((p) => p.category === cat);
          if (items.length === 0) return null;

          const isExpanded = expandedCategories.has(cat) || search.length > 0;
          const catConfigured = items.filter((p) => (keys[p.envVar] ?? "").length > 0).length;

          return (
            <div
              key={cat}
              className="rounded-lg border border-zinc-200 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleCategory(cat)}
                className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-zinc-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-900">
                    {cat}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {items.length} providers
                  </span>
                  {catConfigured > 0 && (
                    <Badge variant="success">{catConfigured} active</Badge>
                  )}
                </div>
                <svg
                  className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="border-t border-zinc-200 px-3 py-2 flex flex-col gap-2">
                  {items.map((provider) => (
                    <div key={provider.id} className="flex items-center gap-2">
                      <div className="w-32 shrink-0">
                        <label className="text-xs font-medium text-zinc-700">
                          {provider.label}
                          {provider.required && (
                            <span className="ml-0.5 text-red-500">*</span>
                          )}
                        </label>
                      </div>
                      <Input
                        type="password"
                        value={keys[provider.envVar] ?? ""}
                        onChange={(e) => updateKey(provider.envVar, e.target.value)}
                        placeholder={provider.envVar}
                        className="flex-1 font-mono text-xs"
                      />
                      {(keys[provider.envVar] ?? "").length > 0 && (
                        <svg
                          className="h-4 w-4 shrink-0 text-emerald-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { ApiKeySetup, PROVIDER_CATALOG };
