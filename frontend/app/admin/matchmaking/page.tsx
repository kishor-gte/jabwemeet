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
import { useAdminDialog } from "@/components/admin/AdminDialogProvider";

export default function AdminMatchmakingPage() {
  const { alert, confirm, toast } = useAdminDialog();
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
        toast(`Request status updated to ${newStatus.replace("_", " ")}`, "success");
        fetchMatchmaking();
      } else {
        alert({
          title: "Update Failed",
          message: json.message || "Failed to update matchmaking request status.",
          type: "danger",
        });
      }
    } catch (e) {
      alert({
        title: "Server Error",
        message: "Error updating request status due to a network error.",
        type: "danger",
      });
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#7E2248] text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#7E2248]" />
            Vetted Matchmaking & Curated Introductions
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
            Matchmaking Control Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Governing member introduction requests, RM recommendation queues, mutual consent checks, and date coordination.
          </p>
        </div>

        <a
          href="/admin/matchmaking/dates"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7E2248] hover:bg-[#681938] text-white text-xs font-bold shadow-md shadow-[#7E2248]/20 transition self-start sm:self-auto"
        >
          <Calendar className="w-4 h-4" />
          <span>Scheduled Dates View</span>
        </a>
      </div>

      {/* SENSITIVE QUESTIONNAIRE PRIVACY BANNER */}
      <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 text-xs text-slate-700 flex items-start gap-3">
        <Shield className="w-4 h-4 text-[#7E2248] shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-900 block font-serif">Sensitive Questionnaire & Preference Safeguard:</strong>
          Matchmaking partner questionnaires and deal-breaker parameters are protected under platform privacy regulations. Visible exclusively to verified Relationship Managers and elevated administrators.
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-2 border-b border-rose-100 text-xs font-semibold">
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
                ? "border-[#7E2248] text-[#7E2248] font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: REQUESTS */}
      {activeTab === "requests" && (
        <div className="bg-white border border-rose-100 rounded-3xl overflow-hidden shadow-xs">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 table-fixed">
              <thead className="bg-rose-50/60 text-[11px] font-serif font-bold uppercase tracking-wider text-slate-500 border-b border-rose-100">
                <tr>
                  <th className="w-[17%] px-4 py-3.5">Client Member</th>
                  <th className="w-[21%] px-3 py-3.5">Contact</th>
                  <th className="w-[11%] px-3 py-3.5">City</th>
                  <th className="w-[23%] px-3 py-3.5">Intent / Goal</th>
                  <th className="w-[10%] px-3 py-3.5">Status</th>
                  <th className="w-[9%] px-3 py-3.5">Submitted</th>
                  <th className="w-[9%] px-4 py-3.5 text-right">Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-50 font-medium">
                {data.requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400 italic">
                      No introduction requests in queue.
                    </td>
                  </tr>
                ) : (
                  data.requests.map((r: any) => (
                    <tr key={r.id} className="hover:bg-rose-50/30 transition">
                      <td className="px-4 py-4 min-w-0">
                        <div className="font-bold text-slate-900 text-sm truncate" title={r.client?.name || "Member"}>
                          {r.client?.name || "Member"}
                        </div>
                      </td>

                      <td className="px-3 py-4 text-slate-600 min-w-0">
                        <div className="truncate text-slate-800" title={r.client?.email}>{r.client?.email || "N/A"}</div>
                        <div className="text-[11px] truncate text-slate-400">{r.client?.phone || "N/A"}</div>
                      </td>

                      <td className="px-3 py-4 capitalize min-w-0">
                        <div className="truncate text-slate-700" title={r.client?.city || "Unspecified"}>
                          {r.client?.city || "Unspecified"}
                        </div>
                      </td>

                      <td className="px-3 py-4 min-w-0">
                        <span className="text-slate-700 block truncate" title={r.lookingFor || "Long-term Partner"}>
                          {r.lookingFor || "Long-term Partner"}
                        </span>
                      </td>

                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === "New"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : r.status === "Matched"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}>
                          {r.status}
                        </span>
                      </td>

                      <td className="px-3 py-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end">
                          {r.status === "New" ? (
                            <button
                              onClick={() => handleUpdateRequestStatus(r.id, "In Progress")}
                              className="px-2.5 py-1 rounded-xl bg-[#7E2248] hover:bg-[#681938] text-white font-bold text-[11px] transition shadow-xs"
                            >
                              Assign Review
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateRequestStatus(r.id, "Matched")}
                              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-xs"
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
        <div className="bg-white border border-rose-100 rounded-3xl overflow-hidden shadow-xs">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 table-fixed">
              <thead className="bg-rose-50/60 text-[11px] font-serif font-bold uppercase tracking-wider text-slate-500 border-b border-rose-100">
                <tr>
                  <th className="w-[23%] px-5 py-3.5">Client Member A</th>
                  <th className="w-[23%] px-4 py-3.5">Proposed Candidate B</th>
                  <th className="w-[20%] px-4 py-3.5">Curating Matchmaker</th>
                  <th className="w-[17%] px-4 py-3.5">Mutual Consent</th>
                  <th className="w-[17%] px-4 py-3.5">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-50 font-medium">
                {data.suggestions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400 italic">
                      No suggestions in queue.
                    </td>
                  </tr>
                ) : (
                  data.suggestions.map((s: any) => (
                    <tr key={s.id} className="hover:bg-rose-50/30 transition">
                      <td className="px-5 py-4 min-w-0">
                        <div className="font-bold text-slate-900 truncate" title={s.client?.name}>
                          {s.client?.name}
                        </div>
                        <span className="text-[11px] text-slate-500 block truncate" title={s.client?.city}>
                          {s.client?.city}
                        </span>
                      </td>

                      <td className="px-4 py-4 min-w-0">
                        <div className="font-bold text-[#7E2248] truncate" title={s.suggestedProfile?.name}>
                          {s.suggestedProfile?.name}
                        </div>
                        <span className="text-[11px] text-slate-500 block truncate" title={s.suggestedProfile?.city}>
                          {s.suggestedProfile?.city}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-slate-700 min-w-0">
                        <div className="truncate font-semibold" title={s.matchmaker?.name || "RM"}>
                          {s.matchmaker?.name || "RM"}
                        </div>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {s.status}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-slate-500 text-[11px] whitespace-nowrap">
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
        <div className="bg-white border border-rose-100 rounded-3xl overflow-hidden shadow-xs">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 table-fixed">
              <thead className="bg-rose-50/60 text-[11px] font-serif font-bold uppercase tracking-wider text-slate-500 border-b border-rose-100">
                <tr>
                  <th className="w-[25%] px-5 py-3.5">Client</th>
                  <th className="w-[20%] px-4 py-3.5">RM In Charge</th>
                  <th className="w-[22%] px-4 py-3.5">Date & Time</th>
                  <th className="w-[18%] px-4 py-3.5">Type & Mode</th>
                  <th className="w-[15%] px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-50 font-medium">
                {data.appointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400 italic">
                      No date appointments recorded.
                    </td>
                  </tr>
                ) : (
                  data.appointments.map((a: any) => (
                    <tr key={a.id} className="hover:bg-rose-50/30 transition">
                      <td className="px-5 py-4 min-w-0">
                        <div className="font-bold text-slate-900 truncate" title={a.client?.name}>
                          {a.client?.name}
                        </div>
                        <span className="text-[11px] text-slate-500 block truncate" title={a.client?.phone}>
                          {a.client?.phone}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-[#7E2248] font-semibold min-w-0">
                        <div className="truncate" title={a.matchmaker?.name}>
                          {a.matchmaker?.name}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-700 min-w-0">
                        <div className="truncate">
                          {new Date(a.date).toLocaleDateString()} at {a.time}
                        </div>
                      </td>

                      <td className="px-4 py-4 min-w-0">
                        <span className="text-slate-700 font-semibold block truncate" title={`${a.type} (${a.mode})`}>
                          {a.type} ({a.mode})
                        </span>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
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
