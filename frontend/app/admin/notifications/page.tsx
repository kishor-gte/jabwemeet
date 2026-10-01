"use client";

import React, { useEffect, useState } from "react";
import {
  BellRing,
  Send,
  Users,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Clock,
  Plus,
} from "lucide-react";
import { useAdminDialog } from "@/components/admin/AdminDialogProvider";

export default function AdminNotificationsPage() {
  const { alert, confirm, toast } = useAdminDialog();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetAudience, setTargetAudience] = useState("All Users");
  const [sendEmail, setSendEmail] = useState(true);
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function fetchAnnouncements() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.announcements);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    const confirmed = await confirm({
      title: "Broadcast Notification",
      message: `Confirm broadcasting this notification${sendEmail ? " and sending direct emails" : ""} to: ${targetAudience}?`,
      type: "confirm",
      confirmText: "Broadcast Message",
    });
    if (!confirmed) return;

    setSending(true);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, message, targetAudience, sendEmail }),
      });
      const data = await res.json();
      if (data.success) {
        toast("Announcement broadcasted successfully", "success");
        setSuccessMsg(data.message);
        setTitle("");
        setMessage("");
        fetchAnnouncements();
      } else {
        alert({
          title: "Broadcast Failed",
          message: data.message || "Failed to broadcast announcement.",
          type: "danger",
        });
      }
    } catch (e) {
      alert({
        title: "Server Error",
        message: "Error broadcasting announcement due to a network error.",
        type: "danger",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#7E2248] text-xs font-semibold mb-2">
          <BellRing className="w-3.5 h-3.5" />
          Member Communications
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
          Notification & Announcement Center
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Broadcast official updates, schedule changes, and event invites to targeted audiences across the platform.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* COMPOSER */}
      <div className="p-6 rounded-3xl bg-white border border-rose-100 shadow-xs space-y-4">
        <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-slate-500">
          Compose Platform Broadcast
        </h3>

        <form onSubmit={handleSend} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Headline / Subject *</label>
              <input
                type="text"
                required
                placeholder="e.g. VIP Speed Dating Night Announced for Mumbai"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Target Audience</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
              >
                <option value="All Users">All Verified Members</option>
                <option value="Event Attendees">Upcoming Event Attendees</option>
                <option value="RM Subscribers">Relationship Manager Clients</option>
                <option value="Buddy Subscribers">Breakup Buddy Circles</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1 uppercase tracking-wider text-[10px]">Notification Body *</label>
            <textarea
              rows={3}
              required
              placeholder="Type message content..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="w-4 h-4 rounded text-[#7E2248] border-rose-300 focus:ring-[#7E2248] focus:ring-offset-0"
              />
              <span className="text-slate-700 text-xs font-semibold flex items-center gap-1.5">
                <span>✉️</span> Also send Email Blast to recipient list
              </span>
            </label>

            <button
              type="submit"
              disabled={sending}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#7E2248] hover:bg-[#681938] text-white font-bold transition disabled:opacity-50 shadow-md shadow-[#7E2248]/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? "Broadcasting..." : "Broadcast Announcement"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* HISTORY TABLE */}
      <div className="bg-white border border-rose-100 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-rose-50/60 text-[11px] font-serif font-bold uppercase tracking-wider text-slate-500 border-b border-rose-100">
              <tr>
                <th className="px-5 py-3.5">Headline</th>
                <th className="px-4 py-3.5">Audience</th>
                <th className="px-4 py-3.5">Recipients</th>
                <th className="px-4 py-3.5">Sent By</th>
                <th className="px-5 py-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-500 animate-pulse">
                    Loading announcement logs...
                  </td>
                </tr>
              ) : announcements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-500 italic">
                    No announcements broadcasted yet.
                  </td>
                </tr>
              ) : (
                announcements.map((a) => (
                  <tr key={a.id} className="hover:bg-rose-50/30 transition">
                    <td className="px-5 py-4 font-serif font-bold text-slate-900 max-w-sm truncate">{a.title}</td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-100 font-semibold text-[10px] text-slate-700">
                        {a.targetAudience}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-emerald-700 font-bold">{a.recipientCount || 0}</td>
                    <td className="px-4 py-4 text-[#7E2248] font-bold">{a.sentBy || "Admin"}</td>
                    <td className="px-5 py-4 text-right text-slate-500 text-[11px]">
                      {new Date(a.sentAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
