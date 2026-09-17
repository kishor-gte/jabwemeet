"use client";

import React, { useEffect, useState } from "react";
import {
  LifeBuoy,
  Search,
  MessageSquare,
  CheckCircle2,
  Clock,
  Send,
  X,
  User,
  AlertTriangle,
} from "lucide-react";

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");
  const [ticketStatus, setTicketStatus] = useState("RESOLVED");
  const [sending, setSending] = useState(false);

  async function fetchTickets() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/support", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTickets();
  }, []);

  function openReply(t: any) {
    setActiveTicket(t);
    setReplyText("");
    setTicketStatus(t.status === "OPEN" ? "WAITING_FOR_USER" : t.status);
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;

    setSending(true);
    try {
      const res = await fetch(`/api/admin/support/${activeTicket.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: replyText, status: ticketStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveTicket(null);
        fetchTickets();
      } else {
        alert(data.message || "Failed to send reply");
      }
    } catch (e) {
      alert("Error sending reply");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
          <LifeBuoy className="w-3.5 h-3.5" />
          Customer Assistance Desk
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Support Cases & Inquiries
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Respond to member queries regarding venue passes, RM onboarding, and billing.
        </p>
      </div>

      <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#131d2e] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5">Ticket #</th>
                <th className="px-4 py-3.5">Member</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Subject</th>
                <th className="px-4 py-3.5">Priority</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 animate-pulse">
                    Loading support tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 italic">
                    No active support tickets found.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-4 font-mono font-bold text-white">
                      {t.ticketNumber}
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-bold text-white">{t.userName}</div>
                      <span className="text-[10px] text-slate-500">{t.userEmail}</span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300 font-semibold text-[10px]">
                        {t.category}
                      </span>
                    </td>

                    <td className="px-4 py-4 max-w-xs text-slate-200 truncate font-semibold">
                      {t.subject}
                    </td>

                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.priority === "HIGH" || t.priority === "URGENT"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-white/10 text-slate-300"
                      }`}>
                        {t.priority}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === "OPEN"
                          ? "bg-amber-500/20 text-amber-400"
                          : t.status === "RESOLVED"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}>
                        {t.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openReply(t)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                      >
                        Reply / Resolve
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REPLY MODAL */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setActiveTicket(null)} />
          <div className="relative w-full max-w-xl bg-[#0f172a] border border-white/15 rounded-3xl p-6 shadow-2xl z-10 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Ticket #{activeTicket.ticketNumber}</h3>
                <span className="text-xs text-slate-400">{activeTicket.subject}</span>
              </div>
              <button onClick={() => setActiveTicket(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-white/5 space-y-1">
                <span className="text-slate-400 font-semibold block">Member Inquiry ({activeTicket.userName}):</span>
                <p className="text-slate-200 leading-relaxed">{activeTicket.description}</p>
              </div>

              {/* Replies Thread */}
              {activeTicket.replies && (
                <div className="space-y-2">
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">Conversation History:</span>
                  {(typeof activeTicket.replies === "string"
                    ? JSON.parse(activeTicket.replies)
                    : activeTicket.replies
                  ).map((rep: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-[#182337] border border-white/5 space-y-1">
                      <div className="flex justify-between font-bold text-purple-300">
                        <span>{rep.author} ({rep.role})</span>
                        <span className="text-[10px] text-slate-500">{new Date(rep.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-200">{rep.message}</p>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSendReply} className="space-y-3 pt-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Staff Reply Message *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Type official reply to member..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#182337] border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Update Ticket Status</label>
                  <select
                    value={ticketStatus}
                    onChange={(e) => setTicketStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#182337] border border-white/10 text-white"
                  >
                    <option value="WAITING_FOR_USER">WAITING_FOR_USER</option>
                    <option value="IN_REVIEW">IN_REVIEW</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setActiveTicket(null)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sending ? "Sending..." : "Send Reply"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
