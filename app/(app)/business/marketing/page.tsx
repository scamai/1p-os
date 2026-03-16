"use client";

import { useState, useEffect } from "react";
import { Education, EDUCATION } from "@/components/shared/Education";

type ContentType = "blog" | "social" | "email" | "ad";
type CampaignStatus = "planned" | "active" | "paused" | "completed";

type ContentItem = {
  id: string;
  type: ContentType;
  title: string;
  day: number;
  weekOffset: number;
};

type ChannelTracker = {
  id: string;
  channel: string;
  spend: number;
  leads: number;
};

type Campaign = {
  id: string;
  name: string;
  channel: string;
  status: CampaignStatus;
  startDate: string;
  notes: string;
};

type MarketingData = {
  content: ContentItem[];
  channels: ChannelTracker[];
  campaigns: Campaign[];
  currentWeekOffset: number;
};

const STORAGE_KEY = "1pos-marketing";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TYPE_STYLES: Record<ContentType, string> = {
  blog: "bg-zinc-900 text-white",
  social: "bg-zinc-300 text-zinc-800",
  email: "bg-zinc-600 text-white",
  ad: "bg-zinc-100 text-zinc-700 border border-zinc-300",
};

const CAMPAIGN_STATUS_STYLES: Record<CampaignStatus, string> = {
  planned: "bg-zinc-100 text-zinc-600",
  active: "bg-zinc-900 text-white",
  paused: "bg-zinc-200 text-zinc-500",
  completed: "bg-zinc-300 text-zinc-700",
};

const INITIAL: MarketingData = {
  content: [],
  channels: [],
  campaigns: [],
  currentWeekOffset: 0,
};

export default function Page() {
  const [data, setData] = useState<MarketingData>(INITIAL);
  const [loaded, setLoaded] = useState(false);
  const [addingContent, setAddingContent] = useState<{ day: number } | null>(null);
  const [contentDraft, setContentDraft] = useState({ title: "", type: "blog" as ContentType });
  const [showChannelForm, setShowChannelForm] = useState(false);
  const [channelDraft, setChannelDraft] = useState({ channel: "", spend: 0, leads: 0 });
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [campaignDraft, setCampaignDraft] = useState<Campaign>({
    id: "",
    name: "",
    channel: "",
    status: "planned",
    startDate: "",
    notes: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setData({ ...INITIAL, ...JSON.parse(saved) });
      } catch {
        /* ignore */
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, loaded]);

  const weekOffset = data.currentWeekOffset;

  function addContent() {
    if (!contentDraft.title.trim() || addingContent === null) return;
    setData((prev) => ({
      ...prev,
      content: [
        ...prev.content,
        {
          id: uid(),
          title: contentDraft.title.trim(),
          type: contentDraft.type,
          day: addingContent.day,
          weekOffset,
        },
      ],
    }));
    setContentDraft({ title: "", type: "blog" });
    setAddingContent(null);
  }

  function removeContent(id: string) {
    setData((prev) => ({ ...prev, content: prev.content.filter((c) => c.id !== id) }));
  }

  function addChannelTracker() {
    if (!channelDraft.channel.trim()) return;
    setData((prev) => ({
      ...prev,
      channels: [...prev.channels, { id: uid(), ...channelDraft, channel: channelDraft.channel.trim() }],
    }));
    setChannelDraft({ channel: "", spend: 0, leads: 0 });
    setShowChannelForm(false);
  }

  function removeChannelTracker(id: string) {
    setData((prev) => ({ ...prev, channels: prev.channels.filter((c) => c.id !== id) }));
  }

  function addCampaign() {
    if (!campaignDraft.name.trim()) return;
    setData((prev) => ({
      ...prev,
      campaigns: [...prev.campaigns, { ...campaignDraft, id: uid(), name: campaignDraft.name.trim() }],
    }));
    setCampaignDraft({ id: "", name: "", channel: "", status: "planned", startDate: "", notes: "" });
    setShowCampaignForm(false);
  }

  function updateCampaignStatus(id: string, status: CampaignStatus) {
    setData((prev) => ({
      ...prev,
      campaigns: prev.campaigns.map((c) => (c.id === id ? { ...c, status } : c)),
    }));
  }

  function removeCampaign(id: string) {
    setData((prev) => ({ ...prev, campaigns: prev.campaigns.filter((c) => c.id !== id) }));
  }

  function changeWeek(delta: number) {
    setData((prev) => ({ ...prev, currentWeekOffset: prev.currentWeekOffset + delta }));
  }

  if (!loaded) return null;

  const weekContent = data.content.filter((c) => c.weekOffset === weekOffset);

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

        {data.channels.length === 0 ? (
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
              {data.channels.map((ch) => (
                <tr key={ch.id} className="border-b border-zinc-100">
                  <td className="px-2 py-2 text-zinc-900 font-medium">{ch.channel}</td>
                  <td className="px-2 py-2 text-zinc-700">${ch.spend.toLocaleString()}</td>
                  <td className="px-2 py-2 text-zinc-700">{ch.leads}</td>
                  <td className="px-2 py-2 text-zinc-700">
                    {ch.leads > 0 ? `$${(ch.spend / ch.leads).toFixed(2)}` : "--"}
                  </td>
                  <td className="px-2 py-2">
                    <button onClick={() => removeChannelTracker(ch.id)} className="text-xs text-zinc-400 hover:text-zinc-700">Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Campaigns */}
      <div className="border border-zinc-200 rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-900">Campaigns</h2>
          <button
            onClick={() => {
              setCampaignDraft({ id: "", name: "", channel: "", status: "planned", startDate: "", notes: "" });
              setShowCampaignForm(true);
            }}
            className="text-xs px-2 py-1 bg-zinc-900 text-white rounded hover:bg-zinc-800"
          >
            Add Campaign
          </button>
        </div>

        {showCampaignForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-5 w-full max-w-md shadow-xl">
              <h3 className="text-sm font-semibold text-zinc-900 mb-3">New Campaign</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Name</label>
                  <input
                    type="text"
                    value={campaignDraft.name}
                    onChange={(e) => setCampaignDraft((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full text-sm border border-zinc-200 rounded px-2 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Channel</label>
                    <input
                      type="text"
                      value={campaignDraft.channel}
                      onChange={(e) => setCampaignDraft((prev) => ({ ...prev, channel: e.target.value }))}
                      className="w-full text-sm border border-zinc-200 rounded px-2 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={campaignDraft.startDate}
                      onChange={(e) => setCampaignDraft((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="w-full text-sm border border-zinc-200 rounded px-2 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Notes</label>
                  <textarea
                    value={campaignDraft.notes}
                    onChange={(e) => setCampaignDraft((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                    className="w-full text-sm border border-zinc-200 rounded px-2 py-1.5 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button onClick={() => setShowCampaignForm(false)} className="text-sm px-3 py-1.5 border border-zinc-200 rounded text-zinc-600 hover:bg-zinc-50">Cancel</button>
                <button onClick={addCampaign} className="text-sm px-3 py-1.5 bg-zinc-900 text-white rounded hover:bg-zinc-800">Create</button>
              </div>
            </div>
          </div>
        )}

        {data.campaigns.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-3">No campaigns yet.</p>
        ) : (
          <div className="space-y-2">
            {data.campaigns.map((c) => (
              <div key={c.id} className="border border-zinc-200 rounded p-3 flex items-start gap-3 group">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-zinc-900">{c.name}</span>
                    <select
                      value={c.status}
                      onChange={(e) => updateCampaignStatus(c.id, e.target.value as CampaignStatus)}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium border-none ${CAMPAIGN_STATUS_STYLES[c.status]}`}
                    >
                      <option value="planned">planned</option>
                      <option value="active">active</option>
                      <option value="paused">paused</option>
                      <option value="completed">completed</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    {c.channel && <span>Channel: {c.channel}</span>}
                    {c.startDate && <span>Start: {c.startDate}</span>}
                  </div>
                  {c.notes && <p className="text-xs text-zinc-500 mt-1">{c.notes}</p>}
                </div>
                <button
                  onClick={() => removeCampaign(c.id)}
                  className="text-xs text-zinc-300 hover:text-zinc-600 opacity-0 group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
