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
import { useAdminDialog } from "@/components/admin/AdminDialogProvider";

export default function AdminContentPage() {
  const { alert, confirm, toast } = useAdminDialog();
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
        toast("Platform CMS content updated successfully", "success");
        setSuccessMsg(true);
        setTimeout(() => setSuccessMsg(false), 3000);
      } else {
        alert({
          title: "Save Failed",
          message: data.message || "Failed to update content.",
          type: "danger",
        });
      }
    } catch (e) {
      alert({
        title: "Server Error",
        message: "Error saving content due to a network error.",
        type: "danger",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 border border-rose-200 text-[#7E2248] text-xs font-semibold mb-2">
          <FileText className="w-3.5 h-3.5" />
          Public Platform CMS
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
          Content Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage homepage headlines, safety pledges, and platform announcements dynamically.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Platform content updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* HERO SECTION */}
        <div className="p-6 rounded-3xl bg-white border border-rose-100 shadow-xs space-y-4 text-xs">
          <h3 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Homepage Hero Copy</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Primary Headline</label>
              <input
                type="text"
                value={content.heroHeadline || ""}
                onChange={(e) => setContent({ ...content, heroHeadline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-900 font-bold focus:bg-white focus:border-[#7E2248] focus:ring-1 focus:ring-[#7E2248] outline-hidden transition"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Subheadline / Pitch</label>
              <textarea
                rows={3}
                value={content.heroSubheadline || ""}
                onChange={(e) => setContent({ ...content, heroSubheadline: e.target.value })}
                className="w-full p-3.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-900 focus:bg-white focus:border-[#7E2248] focus:ring-1 focus:ring-[#7E2248] outline-hidden transition"
              />
            </div>
          </div>
        </div>

        {/* ABOUT & PHILOSOPHY */}
        <div className="p-6 rounded-3xl bg-white border border-rose-100 shadow-xs space-y-4 text-xs">
          <h3 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Philosophy & Safety Pledge</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">About JabWeMeet Copy</label>
              <textarea
                rows={3}
                value={content.aboutText || ""}
                onChange={(e) => setContent({ ...content, aboutText: e.target.value })}
                className="w-full p-3.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-900 focus:bg-white focus:border-[#7E2248] focus:ring-1 focus:ring-[#7E2248] outline-hidden transition"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Trust & Safety Pledge</label>
              <textarea
                rows={3}
                value={content.safetyPledge || ""}
                onChange={(e) => setContent({ ...content, safetyPledge: e.target.value })}
                className="w-full p-3.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-900 focus:bg-white focus:border-[#7E2248] focus:ring-1 focus:ring-[#7E2248] outline-hidden transition"
              />
            </div>
          </div>
        </div>

        {/* ANNOUNCEMENT BANNER */}
        <div className="p-6 rounded-3xl bg-white border border-rose-100 shadow-xs space-y-4 text-xs">
          <h3 className="font-serif font-bold text-slate-900 text-sm">Top Global Announcement Banner</h3>
          <div>
            <input
              type="text"
              value={content.announcementBanner || ""}
              onChange={(e) => setContent({ ...content, announcementBanner: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-900 focus:bg-white focus:border-[#7E2248] focus:ring-1 focus:ring-[#7E2248] outline-hidden transition"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#7E2248] hover:bg-[#681938] text-white font-bold text-xs shadow-md shadow-[#7E2248]/20 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving CMS..." : "Publish Content Updates"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
