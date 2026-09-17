"use client";

import React, { useEffect, useState } from "react";
import {
  Clock,
  Heart,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  User,
  DollarSign,
  ArrowLeft,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminBuddySessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchSessions() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/buddy-sessions", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-1">
            <Clock className="w-3.5 h-3.5" />
            Support Sessions Desk
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Breakup Buddy Listening Sessions
          </h1>
        </div>
      </div>

      <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#131d2e] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5">Member (Client)</th>
                <th className="px-4 py-3.5">Assigned Buddy</th>
                <th className="px-4 py-3.5">Session Type</th>
                <th className="px-4 py-3.5">Scheduled Time</th>
                <th className="px-4 py-3.5">Duration</th>
                <th className="px-4 py-3.5">Fee</th>
                <th className="px-4 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 animate-pulse">
                    Loading buddy sessions...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 italic">
                    No active or scheduled sessions at the moment.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-4">
                      <div>
                        <div className="font-bold text-white">{s.user?.name || "Member"}</div>
                        <span className="text-[10px] text-slate-500">{s.user?.email}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-bold text-blue-400">
                        {s.buddy?.displayName || s.buddy?.name || "Buddy"}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="px-2 py-0.5 rounded bg-white/5 font-semibold text-[11px]">
                        {s.sessionType || "Voice / Chat"}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-300">
                      {new Date(s.scheduledAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="px-4 py-4">
                      {s.durationMinutes || 45} mins
                    </td>

                    <td className="px-4 py-4 text-emerald-400 font-bold">
                      ₹{s.amountEarned || 799}
                    </td>

                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        s.status === "Completed"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : s.status === "Scheduled"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}>
                        {s.status}
                      </span>
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
