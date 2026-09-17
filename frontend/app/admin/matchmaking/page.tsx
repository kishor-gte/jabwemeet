"use client";

import React, { useEffect, useState } from "react";
import {
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  HeartHandshake,
  Calendar,
  AlertTriangle,
  User,
  ArrowRight,
  Shield,
  Heart,
} from "lucide-react";

export default function AdminMatchmakingPage() {
  const [data, setData] = useState<any>({ requests: [], suggestions: [], appointments: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"requests" | "suggestions" | "dates">("requests");

  async function fetchMatchmaking() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/matchmaking", { credentials: "include" });
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMatchmaking();
  }, []);

  async function handleUpdateRequestStatus(id: string, newStatus: string) {
    try {
      const res = await fetch(`/api/admin/matchmaking/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        fetchMatchmaking();
      }
    } catch (e) {
      alert("Error updating status");
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Vetted Matchmaking & Curated Introductions
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Matchmaking Control Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Governing member introduction requests, RM recommendation queues, mutual consent checks, and date coordination.
          </p>
        </div>

        <a
          href="/admin/matchmaking/dates"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 transition self-start sm:self-auto"
        >
          <Calendar className="w-4 h-4" />
          <span>Scheduled Dates View</span>
        </a>
      </div>

      {/* SENSITIVE QUESTIONNAIRE PRIVACY BANNER */}
      <div className="p-4 rounded-2xl bg-[#0f172a] border border-purple-500/20 text-xs text-slate-300 flex items-start gap-3">
        <Shield className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block">Sensitive Questionnaire & Preference Safeguard:</strong>
          Matchmaking partner questionnaires and deal-breaker parameters are protected under platform privacy regulations. Visible exclusively to verified Relationship Managers and elevated administrators.
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-2 border-b border-white/10 text-xs font-semibold">
        {[
          { id: "requests", label: `Introduction Requests (${data.requests?.length || 0})` },
          { id: "suggestions", label: `Suggested Pairings (${data.suggestions?.length || 0})` },
          { id: "dates", label: `Scheduled Date Appointments (${data.appointments?.length || 0})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 border-b-2 transition ${
              activeTab === tab.id
                ? "border-purple-500 text-white font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: REQUESTS */}
      {activeTab === "requests" && (
        <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#131d2e] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-5 py-3.5">Client Member</th>
                  <th className="px-4 py-3.5">Contact</th>
                  <th className="px-4 py-3.5">City</th>
                  <th className="px-4 py-3.5">Intent / Goal</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Submitted</th>
                  <th className="px-5 py-3.5 text-right">Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {data.requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-500 italic">
                      No introduction requests in queue.
                    </td>
                  </tr>
                ) : (
                  data.requests.map((r: any) => (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white text-sm">{r.client?.name || "Member"}</div>
                      </td>

                      <td className="px-4 py-4 text-slate-400">
                        <div>{r.client?.email}</div>
                        <div className="text-[11px]">{r.client?.phone || "N/A"}</div>
                      </td>

                      <td className="px-4 py-4 capitalize">{r.client?.city || "Unspecified"}</td>

                      <td className="px-4 py-4">
                        <span className="text-slate-300">{r.lookingFor || "Long-term Partner"}</span>
                      </td>

                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          r.status === "New"
                            ? "bg-amber-500/20 text-amber-400"
                            : r.status === "Matched"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-blue-500/20 text-blue-400"
                        }`}>
                          {r.status}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-slate-400 text-[11px]">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {r.status === "New" ? (
                            <button
                              onClick={() => handleUpdateRequestStatus(r.id, "In Progress")}
                              className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                            >
                              Assign Review
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateRequestStatus(r.id, "Matched")}
                              className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                            >
                              Mark Matched
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SUGGESTIONS */}
      {activeTab === "suggestions" && (
        <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#131d2e] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-5 py-3.5">Client Member A</th>
                  <th className="px-4 py-3.5">Proposed Candidate B</th>
                  <th className="px-4 py-3.5">Curating Matchmaker</th>
                  <th className="px-4 py-3.5">Mutual Consent</th>
                  <th className="px-4 py-3.5">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {data.suggestions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-500 italic">
                      No suggestions in queue.
                    </td>
                  </tr>
                ) : (
                  data.suggestions.map((s: any) => (
                    <tr key={s.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-5 py-4 font-bold text-white">
                        {s.client?.name}
                        <span className="text-[11px] text-slate-400 block">{s.client?.city}</span>
                      </td>

                      <td className="px-4 py-4 font-bold text-rose-300">
                        {s.suggestedProfile?.name}
                        <span className="text-[11px] text-slate-400 block">{s.suggestedProfile?.city}</span>
                      </td>

                      <td className="px-4 py-4 text-purple-300">
                        {s.matchmaker?.name || "RM"}
                      </td>

                      <td className="px-4 py-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400">
                          {s.status}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-slate-400 text-[11px]">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DATES */}
      {activeTab === "dates" && (
        <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#131d2e] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-5 py-3.5">Client</th>
                  <th className="px-4 py-3.5">RM In Charge</th>
                  <th className="px-4 py-3.5">Date & Time</th>
                  <th className="px-4 py-3.5">Type & Mode</th>
                  <th className="px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {data.appointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-500 italic">
                      No date appointments recorded.
                    </td>
                  </tr>
                ) : (
                  data.appointments.map((a: any) => (
                    <tr key={a.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-5 py-4 font-bold text-white">
                        {a.client?.name}
                        <span className="text-[11px] text-slate-400 block">{a.client?.phone}</span>
                      </td>

                      <td className="px-4 py-4 text-purple-300">
                        {a.matchmaker?.name}
                      </td>

                      <td className="px-4 py-4 text-slate-200">
                        {new Date(a.date).toLocaleDateString()} at {a.time}
                      </td>

                      <td className="px-4 py-4">
                        <span className="text-slate-300 font-semibold">{a.type} ({a.mode})</span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
