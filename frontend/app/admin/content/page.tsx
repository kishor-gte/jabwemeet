"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  Save,
  CheckCircle2,
  Sparkles,
  Shield,
  HelpCircle,
} from "lucide-react";

export default function AdminContentPage() {
  const [content, setContent] = useState<any>({
    heroHeadline: "",
    heroSubheadline: "",
    aboutText: "",
    safetyPledge: "",
    announcementBanner: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  async function fetchContent() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/content", { credentials: "include" });
      const data = await res.json();
      if (data.success && data.content) {
        setContent(data.content);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchContent();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(false);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(true);
        setTimeout(() => setSuccessMsg(false), 3000);
      } else {
        alert(data.message || "Failed to update content");
      }
    } catch (e) {
      alert("Error saving content");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
          <FileText className="w-3.5 h-3.5" />
          Public Platform CMS
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Content Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage homepage headlines, safety pledges, and platform announcements dynamically.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Platform content updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* HERO SECTION */}
        <div className="p-6 rounded-3xl bg-[#0f172a] border border-white/10 space-y-4 text-xs">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Homepage Hero Copy</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Primary Headline</label>
              <input
                type="text"
                value={content.heroHeadline || ""}
                onChange={(e) => setContent({ ...content, heroHeadline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#182337] border border-white/10 text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Subheadline / Pitch</label>
              <textarea
                rows={3}
                value={content.heroSubheadline || ""}
                onChange={(e) => setContent({ ...content, heroSubheadline: e.target.value })}
                className="w-full p-3.5 rounded-xl bg-[#182337] border border-white/10 text-white"
              />
            </div>
          </div>
        </div>

        {/* ABOUT & PHILOSOPHY */}
        <div className="p-6 rounded-3xl bg-[#0f172a] border border-white/10 space-y-4 text-xs">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Philosophy & Safety Pledge</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">About JabWeMeet Copy</label>
              <textarea
                rows={3}
                value={content.aboutText || ""}
                onChange={(e) => setContent({ ...content, aboutText: e.target.value })}
                className="w-full p-3.5 rounded-xl bg-[#182337] border border-white/10 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Trust & Safety Pledge</label>
              <textarea
                rows={3}
                value={content.safetyPledge || ""}
                onChange={(e) => setContent({ ...content, safetyPledge: e.target.value })}
                className="w-full p-3.5 rounded-xl bg-[#182337] border border-white/10 text-white"
              />
            </div>
          </div>
        </div>

        {/* ANNOUNCEMENT BANNER */}
        <div className="p-6 rounded-3xl bg-[#0f172a] border border-white/10 space-y-4 text-xs">
          <h3 className="font-bold text-white text-sm">Top Global Announcement Banner</h3>
          <div>
            <input
              type="text"
              value={content.announcementBanner || ""}
              onChange={(e) => setContent({ ...content, announcementBanner: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#182337] border border-white/10 text-white"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving CMS..." : "Publish Content Updates"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
