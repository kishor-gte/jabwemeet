"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  Ticket,
  CheckCircle2,
  XCircle,
  Search,
  ArrowLeft,
  Users,
  QrCode,
  Clock,
  MapPin,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

export default function EventRegistrationsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const [event, setEvent] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [quickCode, setQuickCode] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function fetchRegistrations() {
    try {
      const res = await fetch(`/api/admin/events/${eventId}/registrations`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setEvent(data.event);
        setRegistrations(data.registrations);
        setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (eventId) fetchRegistrations();
  }, [eventId]);

  async function handleToggleAttendance(regId: string, currentCheckedIn: boolean) {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          registrationId: regId,
          checkedIn: !currentCheckedIn,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: data.message, type: "success" });
        fetchRegistrations();
      } else {
        setMessage({ text: data.message || "Failed to update check-in", type: "error" });
      }
    } catch (e) {
      setMessage({ text: "Error updating attendance", type: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleQuickCheckIn(e: React.FormEvent) {
    e.preventDefault();
    if (!quickCode.trim()) return;

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ticketCode: quickCode.trim().toUpperCase(),
          checkedIn: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: `Ticket ${quickCode} successfully checked in! 🎉`, type: "success" });
        setQuickCode("");
        fetchRegistrations();
      } else {
        setMessage({ text: data.message || "Invalid ticket code", type: "error" });
      }
    } catch (e) {
      setMessage({ text: "Error verifying ticket", type: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  const filteredRegistrations = registrations.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.userName?.toLowerCase().includes(q) ||
      r.userEmail?.toLowerCase().includes(q) ||
      r.ticketCode?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 animate-pulse text-xs">
        Loading attendance desk roster...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* TOP BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {event?.title}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>{new Date(event?.date).toLocaleDateString()}</span> •
              <span>{event?.location}, {event?.city}</span>
            </p>
          </div>
        </div>

        <button
          onClick={fetchRegistrations}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Roster</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between font-medium ${
          message.type === "success"
            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
            : "bg-red-500/15 border-red-500/30 text-red-300"
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* STATS TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-[#0f172a] border border-white/10">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Total Passes</span>
          <span className="text-xl font-black text-white">{stats?.total || 0}</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#0f172a] border border-white/10">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Paid</span>
          <span className="text-xl font-black text-emerald-400">{stats?.paid || 0}</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#0f172a] border border-white/10">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Checked In</span>
          <span className="text-xl font-black text-blue-400">{stats?.checkedIn || 0}</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#0f172a] border border-white/10">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Not Checked In</span>
          <span className="text-xl font-black text-amber-400">
            {Math.max(0, (stats?.total || 0) - (stats?.checkedIn || 0))}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-[#0f172a] border border-white/10">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Cancelled</span>
          <span className="text-xl font-black text-red-400">{stats?.cancelled || 0}</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#0f172a] border border-white/10">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Available Seats</span>
          <span className="text-xl font-black text-slate-300">{stats?.availableSeats || 0}</span>
        </div>
      </div>

      {/* QUICK TICKET VERIFICATION BOX */}
      <div className="p-5 rounded-2xl bg-[#0f172a] border border-white/10 shadow-lg">
        <form onSubmit={handleQuickCheckIn} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <QrCode className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Scan or enter ticket code (e.g. JWM-20001) for instant venue check-in..."
              value={quickCode}
              onChange={(e) => setQuickCode(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#162136] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 uppercase font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={actionLoading || !quickCode.trim()}
            className="w-full sm:w-auto px-6 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs transition disabled:opacity-50 shrink-0"
          >
            Check In Pass
          </button>
        </form>
      </div>

      {/* SEARCH ROSTER */}
      <div className="p-4 rounded-2xl bg-[#0f172a] border border-white/10">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search participant roster by name, email, or pass code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#162136] border border-white/10 text-xs text-white focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* ROSTER TABLE */}
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#131d2e] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5">Participant</th>
                <th className="px-4 py-3.5">Pass Code</th>
                <th className="px-4 py-3.5">Payment</th>
                <th className="px-4 py-3.5">Registration Status</th>
                <th className="px-4 py-3.5">Venue Check-in</th>
                <th className="px-4 py-3.5">Registered On</th>
                <th className="px-5 py-3.5 text-right">Desk Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 italic">
                    No participants found.
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-4">
                      <div>
                        <a
                          href={`/admin/users/${r.userId}`}
                          className="font-bold text-white hover:text-red-400 transition"
                        >
                          {r.userName}
                        </a>
                        <span className="text-[11px] text-slate-400 block">{r.userEmail} • {r.userPhone || "N/A"}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4 font-mono font-bold text-slate-200">
                      {r.ticketCode}
                    </td>

                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        r.paymentStatus === "PAID"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}>
                        {r.paymentStatus}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="text-slate-300 font-semibold">{r.status}</span>
                    </td>

                    <td className="px-4 py-4">
                      {r.checkedIn ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
                          </span>
                          {r.checkedInAt && (
                            <span className="text-[10px] text-slate-500 block">
                              {new Date(r.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Not Checked In</span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-slate-400 text-[11px]">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/admin/events/${eventId}/registrations/${r.id}/resend`, {
                              method: "POST",
                              credentials: "include",
                            });
                            const data = await res.json();
                            alert(data.message || "Ticket pass sent successfully! 🎟️✨");
                          } catch (e) {
                            alert("Failed to resend ticket pass.");
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 font-semibold text-xs transition inline-flex items-center gap-1"
                        title="Resend ticket code & pass via email"
                      >
                        <Ticket className="w-3 h-3" />
                        <span>Resend Pass 🎟️</span>
                      </button>

                      <button
                        onClick={() => handleToggleAttendance(r.id, r.checkedIn)}
                        disabled={actionLoading}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition active:scale-95 disabled:opacity-50 ${
                          r.checkedIn
                            ? "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
                        }`}
                      >
                        {r.checkedIn ? "Reverse Check-in" : "Mark Present"}
                      </button>
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
