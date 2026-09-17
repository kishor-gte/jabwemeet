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

export default function AdminNotificationsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetAudience, setTargetAudience] = useState("All Users");
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

    if (!confirm(`Confirm broadcasting this notification to: ${targetAudience}?`)) return;

    setSending(true);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, message, targetAudience }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        setTitle("");
        setMessage("");
        fetchAnnouncements();
      } else {
        alert(data.message || "Failed to broadcast");
      }
    } catch (e) {
      alert("Error broadcasting announcement");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2">
          <BellRing className="w-3.5 h-3.5" />
          Member Communications
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Notification & Announcement Center
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Broadcast official updates, schedule changes, and event invites to targeted audiences across the platform.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* COMPOSER */}
      <div className="p-6 rounded-3xl bg-[#0f172a] border border-white/10 shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Compose Platform Broadcast
        </h3>

        <form onSubmit={handleSend} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">Headline / Subject *</label>
              <input
                type="text"
                required
                placeholder="e.g. VIP Speed Dating Night Announced for Mumbai"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#182337] border border-white/10 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Target Audience</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#182337] border border-white/10 text-white"
              >
                <option value="All Users">All Verified Members</option>
                <option value="Event Attendees">Upcoming Event Attendees</option>
                <option value="RM Subscribers">Relationship Manager Clients</option>
                <option value="Buddy Subscribers">Breakup Buddy Circles</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Notification Body *</label>
            <textarea
              rows={3}
              required
              placeholder="Type message content..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-[#182337] border border-white/10 text-white"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? "Broadcasting..." : "Broadcast Announcement"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* HISTORY TABLE */}
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#131d2e] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5">Headline</th>
                <th className="px-4 py-3.5">Audience</th>
                <th className="px-4 py-3.5">Recipients</th>
                <th className="px-4 py-3.5">Sent By</th>
                <th className="px-5 py-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
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
                  <tr key={a.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-4 font-bold text-white max-w-sm truncate">{a.title}</td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-0.5 rounded bg-white/5 font-semibold text-[10px]">
                        {a.targetAudience}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-emerald-400 font-bold">{a.recipientCount || 0}</td>
                    <td className="px-4 py-4 text-purple-300">{a.sentBy || "Admin"}</td>
                    <td className="px-5 py-4 text-right text-slate-400 text-[11px]">
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
