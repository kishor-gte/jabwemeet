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
          className="p-2 rounded-xl bg-white border border-rose-200 text-slate-700 hover:text-slate-900 hover:bg-rose-50 transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#7E2248] text-xs font-semibold mb-1">
            <Clock className="w-3.5 h-3.5 text-[#7E2248]" />
            Support Sessions Desk
          </div>
          <h1 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
            Breakup Buddy Listening Sessions
          </h1>
        </div>
      </div>

      <div className="bg-white border border-rose-100 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-rose-50/60 text-[11px] font-serif font-bold uppercase tracking-wider text-slate-500 border-b border-rose-100">
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
            <tbody className="divide-y divide-rose-50 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 animate-pulse">
                    Loading buddy sessions...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 italic">
                    No active or scheduled sessions at the moment.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-rose-50/30 transition">
                    <td className="px-5 py-4">
                      <div>
                        <div className="font-bold text-slate-900">{s.user?.name || "Member"}</div>
                        <span className="text-[10px] text-slate-500">{s.user?.email}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-bold text-[#7E2248]">
                        {s.buddy?.displayName || s.buddy?.name || "Buddy"}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="px-2 py-0.5 rounded bg-rose-50 text-[#7E2248] border border-rose-200/60 font-semibold text-[11px]">
                        {s.sessionType || "Voice / Chat"}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-700">
                      {new Date(s.scheduledAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {s.durationMinutes || 45} mins
                    </td>

                    <td className="px-4 py-4 text-emerald-700 font-bold">
                      ₹{s.amountEarned || 799}
                    </td>

                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        s.status === "Completed"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : s.status === "Scheduled"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
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
