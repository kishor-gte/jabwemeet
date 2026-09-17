"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  HeartHandshake,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminDatesSchedulingPage() {
  const router = useRouter();
  const [dates, setDates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchDates() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dates", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setDates(data.dates);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDates();
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-1">
            <Calendar className="w-3.5 h-3.5" />
            Curated Meetings Desk
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Curated Date Scheduling & Progress
          </h1>
        </div>
      </div>

      <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#131d2e] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5">Member Client</th>
                <th className="px-4 py-3.5">Relationship Manager</th>
                <th className="px-4 py-3.5">Scheduled Date & Time</th>
                <th className="px-4 py-3.5">Meeting Mode</th>
                <th className="px-4 py-3.5">Consent & Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-500 animate-pulse">
                    Loading dates schedule...
                  </td>
                </tr>
              ) : dates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-500 italic">
                    No dates scheduled currently.
                  </td>
                </tr>
              ) : (
                dates.map((d) => (
                  <tr key={d.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-4">
                      <div className="font-bold text-white text-sm">{d.client?.name}</div>
                      <span className="text-[10px] text-slate-500">{d.client?.phone}</span>
                    </td>

                    <td className="px-4 py-4 text-purple-300 font-semibold">
                      {d.matchmaker?.name || "Senior Matchmaker"}
                    </td>

                    <td className="px-4 py-4 text-slate-200">
                      {new Date(d.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      at {d.time}
                    </td>

                    <td className="px-4 py-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/5 font-semibold text-slate-300">
                        {d.mode || "Venue Table"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        d.status === "Scheduled"
                          ? "bg-blue-500/20 text-blue-400"
                          : d.status === "Completed"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}>
                        {d.status}
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
