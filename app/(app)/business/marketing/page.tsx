"use client";

import { useState } from "react";

import { RelatedPages } from "@/components/shared/RelatedPages";
import { useTableData } from "@/lib/hooks/useTableData";

type ContentType = "blog" | "social" | "email" | "ad";

type ContentItem = {
  id: string;
  type: ContentType;
  title: string;
  day: number;
  week_offset: number;
};

type MarketingChannel = {
  id: string;
  channel: string;
  spend: number;
  leads: number;
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TYPE_STYLES: Record<ContentType, string> = {
  blog: "bg-black text-white",
  social: "bg-black/30 text-black/80",
  email: "bg-black/60 text-white",
  ad: "bg-black/[0.04] text-black/70 border border-black/30",
};

export default function Page() {
  const { data: channels, loading: channelsLoading, create: createChannel, remove: removeChannel } = useTableData<MarketingChannel>("marketing_channels");
  const { data: content, loading: contentLoading, create: createContent, remove: removeContent } = useTableData<ContentItem>("content_items");

  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [addingContent, setAddingContent] = useState<{ day: number } | null>(null);
  const [contentDraft, setContentDraft] = useState({ title: "", type: "blog" as ContentType });
  const [showChannelForm, setShowChannelForm] = useState(false);
  const [channelDraft, setChannelDraft] = useState({ channel: "", spend: 0, leads: 0 });

  const loading = channelsLoading || contentLoading;
  const weekOffset = currentWeekOffset;

  async function addContent() {
    if (!contentDraft.title.trim() || addingContent === null) return;
    await createContent({
      title: contentDraft.title.trim(),
      type: contentDraft.type,
      day: addingContent.day,
      week_offset: weekOffset,
    });
    setContentDraft({ title: "", type: "blog" });
    setAddingContent(null);
  }

  async function addChannelTracker() {
    if (!channelDraft.channel.trim()) return;
    await createChannel({
      channel: channelDraft.channel.trim(),
      spend: channelDraft.spend,
      leads: channelDraft.leads,
    });
    setChannelDraft({ channel: "", spend: 0, leads: 0 });
    setShowChannelForm(false);
  }

  function changeWeek(delta: number) {
    setCurrentWeekOffset((prev) => prev + delta);
  }

  if (loading) return null;

  const weekContent = content.filter((c) => c.week_offset === weekOffset);

  return (
    <div className="mx-auto max-w-5xl">

      <h1 className="font-heading text-[clamp(1.5rem,3vw,1.75rem)] italic font-light tracking-[-0.01em] text-black">Marketing</h1>
      <p className="mt-2 text-[14px] leading-[1.6] text-black/40 mb-6">
        Plan content, track channels, and manage campaigns.
      </p>

      {/* Content Calendar */}
      <div className="border border-black/[0.08] rounded-lg p-4 bg-white mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-black">Content Calendar</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeWeek(-1)}
              className="text-xs px-2 py-1 border border-black/[0.08] rounded hover:bg-black/[0.02] text-black/60"
            >
              Prev
            </button>
            <span className="text-xs text-black/50">
              Week {weekOffset === 0 ? "(current)" : weekOffset > 0 ? `+${weekOffset}` : weekOffset}
            </span>
            <button
              onClick={() => changeWeek(1)}
              className="text-xs px-2 py-1 border border-black/[0.08] rounded hover:bg-black/[0.02] text-black/60"
            >
              Next
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          {(["blog", "social", "email", "ad"] as ContentType[]).map((t) => (
            <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded ${TYPE_STYLES[t]}`}>
              {t}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {DAYS.map((day, dayIdx) => {
            const items = weekContent.filter((c) => c.day === dayIdx);
            return (
              <div key={day} className="min-h-[60px] sm:min-h-[100px]">
                <div className="text-xs font-semibold text-black/50 uppercase mb-1.5">{day}</div>
                <div className="space-y-1">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`text-[11px] px-1.5 py-1 rounded group flex items-start justify-between ${TYPE_STYLES[item.type]}`}
                    >
                      <span className="flex-1">{item.title}</span>
                      <button
                        onClick={() => removeContent(item.id)}
                        className="ml-1 sm:opacity-0 sm:group-hover:opacity-100 text-[12px] sm:text-[10px] shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setAddingContent({ day: dayIdx });
                    setContentDraft({ title: "", type: "blog" });
                  }}
                  className="mt-1 text-[10px] text-black/40 hover:text-black/60"
                >
                  + Add
                </button>
              </div>
            );
          })}
        </div>

        {addingContent !== null && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-4 sm:p-5 w-full mx-2 sm:mx-0 sm:max-w-sm shadow-xl">
              <h3 className="text-sm font-semibold text-black mb-3">
                Add Content - {DAYS[addingContent.day]}
              </h3>
              <div className="space-y-2">
                <input
                  type="text"
                  value={contentDraft.title}
                  onChange={(e) => setContentDraft((prev) => ({ ...prev, title: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addContent()}
                  placeholder="Title / description..."
                  className="w-full text-sm border border-black/[0.08] rounded px-2 py-1.5 text-black placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-black/40"
                  autoFocus
                />
                <select
                  value={contentDraft.type}
                  onChange={(e) => setContentDraft((prev) => ({ ...prev, type: e.target.value as ContentType }))}
                  className="w-full text-sm border border-black/[0.08] rounded px-2 py-1.5 text-black focus:outline-none focus:ring-1 focus:ring-black/40"
                >
                  <option value="blog">Blog</option>
                  <option value="social">Social</option>
                  <option value="email">Email</option>
                  <option value="ad">Ad</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setAddingContent(null)}
                  className="text-sm px-3 py-1.5 border border-black/[0.08] rounded text-black/60 hover:bg-black/[0.02]"
                >
                  Cancel
                </button>
                <button
                  onClick={addContent}
                  className="text-sm px-3 py-1.5 bg-black text-white rounded hover:bg-black/80"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Channel Tracker */}
      <div className="border border-black/[0.08] rounded-lg p-4 bg-white mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-black">Channel Tracker</h2>
          <button
            onClick={() => setShowChannelForm(!showChannelForm)}
            className="text-xs px-2 py-1 bg-black text-white rounded hover:bg-black/80"
          >
            Add Channel
          </button>
        </div>

        {showChannelForm && (
          <div className="border border-black/[0.08] rounded p-3 mb-3 bg-black/[0.02]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
              <div>
                <label className="block text-xs text-black/50 mb-1">Channel</label>
                <input
                  type="text"
                  value={channelDraft.channel}
                  onChange={(e) => setChannelDraft((prev) => ({ ...prev, channel: e.target.value }))}
                  className="w-full text-sm border border-black/[0.08] rounded px-2 py-1 text-black focus:outline-none focus:ring-1 focus:ring-black/40"
                />
              </div>
              <div>
                <label className="block text-xs text-black/50 mb-1">Monthly Spend ($)</label>
                <input
                  type="number"
                  min={0}
                  value={channelDraft.spend}
                  onChange={(e) => setChannelDraft((prev) => ({ ...prev, spend: parseFloat(e.target.value) || 0 }))}
                  className="w-full text-sm border border-black/[0.08] rounded px-2 py-1 text-black focus:outline-none focus:ring-1 focus:ring-black/40"
                />
              </div>
              <div>
                <label className="block text-xs text-black/50 mb-1">Leads/mo</label>
                <input
                  type="number"
                  min={0}
                  value={channelDraft.leads}
                  onChange={(e) => setChannelDraft((prev) => ({ ...prev, leads: parseInt(e.target.value) || 0 }))}
                  className="w-full text-sm border border-black/[0.08] rounded px-2 py-1 text-black focus:outline-none focus:ring-1 focus:ring-black/40"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowChannelForm(false)} className="text-xs px-2 py-1 border border-black/[0.08] rounded text-black/60">Cancel</button>
              <button onClick={addChannelTracker} className="text-xs px-2 py-1 bg-black text-white rounded hover:bg-black/80">Add</button>
            </div>
          </div>
        )}

        {channels.length === 0 ? (
          <p className="text-sm text-black/40 text-center py-3">No channels tracked yet.</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="border-b border-black/[0.08]">
                <th className="text-left px-2 py-1.5 text-xs font-semibold text-black/50 uppercase tracking-wide">Channel</th>
                <th className="text-left px-2 py-1.5 text-xs font-semibold text-black/50 uppercase tracking-wide">Spend</th>
                <th className="text-left px-2 py-1.5 text-xs font-semibold text-black/50 uppercase tracking-wide">Leads</th>
                <th className="text-left px-2 py-1.5 text-xs font-semibold text-black/50 uppercase tracking-wide">CAC</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {channels.map((ch) => (
                <tr key={ch.id} className="border-b border-black/[0.04]">
                  <td className="px-2 py-2 text-black font-medium">{ch.channel}</td>
                  <td className="px-2 py-2 text-black/70">${ch.spend.toLocaleString()}</td>
                  <td className="px-2 py-2 text-black/70">{ch.leads}</td>
                  <td className="px-2 py-2 text-black/70">
                    {ch.leads > 0 ? `$${(ch.spend / ch.leads).toFixed(2)}` : "--"}
                  </td>
                  <td className="px-2 py-2">
                    <button onClick={() => removeChannel(ch.id)} className="text-xs text-black/40 hover:text-black/70">Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <RelatedPages links={[
        { label: "Go-to-Market", href: "/business/gtm", context: "Align campaigns with your GTM strategy" },
        { label: "Market Research", href: "/business/market-research", context: "Use audience insights to target campaigns" },
        { label: "Business Model", href: "/business/model", context: "Ensure marketing supports your value proposition" },
      ]} />
    </div>
  );
}
