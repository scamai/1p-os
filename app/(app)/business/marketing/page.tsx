"use client";

import { useState } from "react";
import { Education, EDUCATION } from "@/components/shared/Education";
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
  blog: "bg-zinc-900 text-white",
  social: "bg-zinc-300 text-zinc-800",
  email: "bg-zinc-600 text-white",
  ad: "bg-zinc-100 text-zinc-700 border border-zinc-300",
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
      <Education {...EDUCATION.marketing} />
      <h1 className="text-lg font-semibold text-zinc-900">Marketing</h1>
      <p className="mt-1 text-sm text-zinc-500 mb-6">
        Plan content, track channels, and manage campaigns.
      </p>

      {/* Content Calendar */}
      <div className="border border-zinc-200 rounded-lg p-4 bg-white mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-900">Content Calendar</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeWeek(-1)}
              className="text-xs px-2 py-1 border border-zinc-200 rounded hover:bg-zinc-50 text-zinc-600"
            >
              Prev
            </button>
            <span className="text-xs text-zinc-500">
              Week {weekOffset === 0 ? "(current)" : weekOffset > 0 ? `+${weekOffset}` : weekOffset}
            </span>
            <button
              onClick={() => changeWeek(1)}
              className="text-xs px-2 py-1 border border-zinc-200 rounded hover:bg-zinc-50 text-zinc-600"
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

        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((day, dayIdx) => {
            const items = weekContent.filter((c) => c.day === dayIdx);
            return (
              <div key={day} className="min-h-[100px]">
                <div className="text-xs font-semibold text-zinc-500 uppercase mb-1.5">{day}</div>
                <div className="space-y-1">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`text-[11px] px-1.5 py-1 rounded group flex items-start justify-between ${TYPE_STYLES[item.type]}`}
                    >
                      <span className="flex-1">{item.title}</span>
                      <button
                        onClick={() => removeContent(item.id)}
                        className="ml-1 opacity-0 group-hover:opacity-100 text-[10px] shrink-0"
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
                  className="mt-1 text-[10px] text-zinc-400 hover:text-zinc-600"
                >
                  + Add
                </button>
              </div>
            );
          })}
        </div>

        {addingContent !== null && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-5 w-full max-w-sm shadow-xl">
              <h3 className="text-sm font-semibold text-zinc-900 mb-3">
                Add Content - {DAYS[addingContent.day]}
              </h3>
              <div className="space-y-2">
                <input
                  type="text"
                  value={contentDraft.title}
                  onChange={(e) => setContentDraft((prev) => ({ ...prev, title: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addContent()}
                  placeholder="Title / description..."
                  className="w-full text-sm border border-zinc-200 rounded px-2 py-1.5 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  autoFocus
                />
                <select
                  value={contentDraft.type}
                  onChange={(e) => setContentDraft((prev) => ({ ...prev, type: e.target.value as ContentType }))}
                  className="w-full text-sm border border-zinc-200 rounded px-2 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
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
                  className="text-sm px-3 py-1.5 border border-zinc-200 rounded text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addContent}
                  className="text-sm px-3 py-1.5 bg-zinc-900 text-white rounded hover:bg-zinc-800"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Channel Tracker */}
      <div className="border border-zinc-200 rounded-lg p-4 bg-white mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-900">Channel Tracker</h2>
          <button
            onClick={() => setShowChannelForm(!showChannelForm)}
            className="text-xs px-2 py-1 bg-zinc-900 text-white rounded hover:bg-zinc-800"
          >
            Add Channel
          </button>
        </div>

        {showChannelForm && (
          <div className="border border-zinc-200 rounded p-3 mb-3 bg-zinc-50">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Channel</label>
                <input
                  type="text"
                  value={channelDraft.channel}
                  onChange={(e) => setChannelDraft((prev) => ({ ...prev, channel: e.target.value }))}
                  className="w-full text-sm border border-zinc-200 rounded px-2 py-1 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Monthly Spend ($)</label>
                <input
                  type="number"
                  min={0}
                  value={channelDraft.spend}
                  onChange={(e) => setChannelDraft((prev) => ({ ...prev, spend: parseFloat(e.target.value) || 0 }))}
                  className="w-full text-sm border border-zinc-200 rounded px-2 py-1 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Leads/mo</label>
                <input
                  type="number"
                  min={0}
                  value={channelDraft.leads}
                  onChange={(e) => setChannelDraft((prev) => ({ ...prev, leads: parseInt(e.target.value) || 0 }))}
                  className="w-full text-sm border border-zinc-200 rounded px-2 py-1 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowChannelForm(false)} className="text-xs px-2 py-1 border border-zinc-200 rounded text-zinc-600">Cancel</button>
              <button onClick={addChannelTracker} className="text-xs px-2 py-1 bg-zinc-900 text-white rounded hover:bg-zinc-800">Add</button>
            </div>
          </div>
        )}

        {channels.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-3">No channels tracked yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="text-left px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Channel</th>
                <th className="text-left px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Spend</th>
                <th className="text-left px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Leads</th>
                <th className="text-left px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wide">CAC</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {channels.map((ch) => (
                <tr key={ch.id} className="border-b border-zinc-100">
                  <td className="px-2 py-2 text-zinc-900 font-medium">{ch.channel}</td>
                  <td className="px-2 py-2 text-zinc-700">${ch.spend.toLocaleString()}</td>
                  <td className="px-2 py-2 text-zinc-700">{ch.leads}</td>
                  <td className="px-2 py-2 text-zinc-700">
                    {ch.leads > 0 ? `$${(ch.spend / ch.leads).toFixed(2)}` : "--"}
                  </td>
                  <td className="px-2 py-2">
                    <button onClick={() => removeChannel(ch.id)} className="text-xs text-zinc-400 hover:text-zinc-700">Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
