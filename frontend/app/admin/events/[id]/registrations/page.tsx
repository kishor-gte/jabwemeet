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
import { useAdminDialog } from "@/components/admin/AdminDialogProvider";

export default function EventRegistrationsPage() {
  const { alert, confirm, toast } = useAdminDialog();
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
            className="p-2 rounded-xl bg-white border border-rose-200 text-slate-700 hover:text-slate-900 hover:bg-rose-50 transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-black text-slate-900 tracking-tight">
              {event?.title}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span>{new Date(event?.date).toLocaleDateString()}</span> •
              <span>{event?.location}, {event?.city}</span>
            </p>
          </div>
        </div>

        <button
          onClick={fetchRegistrations}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-xs font-semibold text-slate-700 self-start sm:self-auto shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#7E2248]" />
          <span>Refresh Roster</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between font-medium ${
          message.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* STATS TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Total Passes</span>
          <span className="text-xl font-serif font-black text-slate-900">{stats?.total || 0}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Paid</span>
          <span className="text-xl font-serif font-black text-emerald-700">{stats?.paid || 0}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Checked In</span>
          <span className="text-xl font-serif font-black text-blue-700">{stats?.checkedIn || 0}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Not Checked In</span>
          <span className="text-xl font-serif font-black text-amber-700">
            {Math.max(0, (stats?.total || 0) - (stats?.checkedIn || 0))}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Cancelled</span>
          <span className="text-xl font-serif font-black text-rose-700">{stats?.cancelled || 0}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Available Seats</span>
          <span className="text-xl font-serif font-black text-slate-700">{stats?.availableSeats || 0}</span>
        </div>
      </div>

      {/* QUICK TICKET VERIFICATION BOX */}
      <div className="p-5 rounded-2xl bg-white border border-rose-100 shadow-xs">
        <form onSubmit={handleQuickCheckIn} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <QrCode className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Scan or enter ticket code (e.g. JWM-20001) for instant venue check-in..."
              value={quickCode}
              onChange={(e) => setQuickCode(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white uppercase font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={actionLoading || !quickCode.trim()}
            className="w-full sm:w-auto px-6 py-2 rounded-xl bg-[#7E2248] hover:bg-[#681938] text-white font-bold text-xs transition shadow-xs disabled:opacity-50 shrink-0"
          >
            Check In Pass
          </button>
        </form>
      </div>

      {/* SEARCH ROSTER */}
      <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search participant roster by name, email, or pass code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white"
          />
        </div>
      </div>

      {/* ROSTER TABLE */}
      <div className="bg-white border border-rose-100 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-rose-50/60 text-[11px] font-serif font-bold uppercase tracking-wider text-slate-500 border-b border-rose-100">
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
            <tbody className="divide-y divide-rose-50 font-medium">
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 italic">
                    No participants found.
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((r) => (
                  <tr key={r.id} className="hover:bg-rose-50/30 transition">
                    <td className="px-5 py-4">
                      <div>
                        <a
                          href={`/admin/users/${r.userId}`}
                          className="font-bold text-slate-900 hover:text-[#7E2248] transition"
                        >
                          {r.userName}
                        </a>
                        <span className="text-[11px] text-slate-500 block">{r.userEmail} • {r.userPhone || "N/A"}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4 font-mono font-bold text-slate-800">
                      {r.ticketCode}
                    </td>

                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        r.paymentStatus === "PAID"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {r.paymentStatus}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="text-slate-700 font-semibold">{r.status}</span>
                    </td>

                    <td className="px-4 py-4">
                      {r.checkedIn ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
                          </span>
                          {r.checkedInAt && (
                            <span className="text-[10px] text-slate-500 block">
                              {new Date(r.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not Checked In</span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-slate-500 text-[11px]">
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
                            if (data.success) {
                              toast(data.message || "Ticket pass sent successfully to attendee email.", "success");
                            } else {
                              alert({
                                title: "Resend Failed",
                                message: data.message || "Could not resend the ticket pass.",
                                type: "danger",
                              });
                            }
                          } catch (e) {
                            alert({
                              title: "Network Error",
                              message: "Failed to resend ticket pass.",
                              type: "danger",
                            });
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-[#7E2248] font-semibold text-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                        title="Resend ticket code & pass via email"
                      >
                        <Ticket className="w-3.5 h-3.5 text-[#7E2248]" />
                        <span>Resend Pass</span>
                      </button>

                      <button
                        onClick={() => handleToggleAttendance(r.id, r.checkedIn)}
                        disabled={actionLoading}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition active:scale-95 disabled:opacity-50 ${
                          r.checkedIn
                            ? "bg-rose-50 hover:bg-rose-100 text-slate-700 border border-rose-200"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
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
