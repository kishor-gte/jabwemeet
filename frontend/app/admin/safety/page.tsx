"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  UserX,
  XCircle,
  FileText,
  Clock,
  Shield,
  X,
} from "lucide-react";

export default function AdminSafetyPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<any | null>(null);
  const [status, setStatus] = useState("IN_REVIEW");
  const [internalNotes, setInternalNotes] = useState("");
  const [actionToUser, setActionToUser] = useState("");
  const [updating, setUpdating] = useState(false);

  async function fetchReports() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/safety/reports", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setReports(data.reports);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
  }, []);

  function openDetail(r: any) {
    setActiveReport(r);
    setStatus(r.status || "IN_REVIEW");
    setInternalNotes(r.internalNotes || "");
    setActionToUser("");
  }

  async function handleUpdateReport(e: React.FormEvent) {
    e.preventDefault();
    if (!activeReport) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/safety/reports/${activeReport.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status,
          internalNotes,
          actionToUser: actionToUser || undefined,
          reason: "Super Admin updated case investigation",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveReport(null);
        fetchReports();
      } else {
        alert(data.message || "Failed to update report");
      }
    } catch (e) {
      alert("Error updating report");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold mb-2">
          <ShieldAlert className="w-3.5 h-3.5" />
          Member Protection & Compliance
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Trust & Safety Center
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Investigate reported conduct, venue safety reports, and enforce platform zero-harassment guidelines.
        </p>
      </div>

      <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#131d2e] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5">Report ID</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Reported Member / Target</th>
                <th className="px-4 py-3.5">Filed By</th>
                <th className="px-4 py-3.5">Allegation</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Investigation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 animate-pulse">
                    Loading safety records...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-emerald-400 italic">
                    ✓ All clear! Zero active safety reports.
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-4 font-mono font-bold text-slate-300">{r.id}</td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-0.5 rounded bg-white/5 font-semibold text-[10px]">
                        {r.category}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-white">{r.reportedUserName || "Event / General"}</div>
                      <span className="text-[10px] text-slate-500">{r.reportedUserEmail}</span>
                    </td>
                    <td className="px-4 py-4 text-slate-300">{r.reporterName || "Anonymous Member"}</td>
                    <td className="px-4 py-4 max-w-xs text-slate-300 truncate font-semibold">
                      {r.reason}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === "OPEN"
                          ? "bg-red-500/20 text-red-400"
                          : r.status === "IN_REVIEW"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-emerald-500/20 text-emerald-400"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openDetail(r)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 font-bold text-xs"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INVESTIGATION DRAWER / MODAL */}
      {activeReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setActiveReport(null)} />
          <div className="relative w-full max-w-xl bg-[#0f172a] border border-white/15 rounded-3xl p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <span>Case #{activeReport.id}: {activeReport.reason}</span>
              </h3>
              <button onClick={() => setActiveReport(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-white/5 space-y-1">
                <div className="flex justify-between font-semibold text-slate-400">
                  <span>Reported Party: <strong className="text-white">{activeReport.reportedUserName || "N/A"}</strong></span>
                  <span>Category: {activeReport.category}</span>
                </div>
                <p className="text-slate-200 pt-1 leading-relaxed">{activeReport.details || "No additional text provided."}</p>
              </div>

              <form onSubmit={handleUpdateReport} className="space-y-3 pt-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Investigation Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#182337] border border-white/10 text-white"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_REVIEW">IN_REVIEW</option>
                    <option value="WAITING_FOR_USER">WAITING_FOR_USER</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Administrative Disciplinary Action</label>
                  <select
                    value={actionToUser}
                    onChange={(e) => setActionToUser(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#182337] border border-white/10 text-white"
                  >
                    <option value="">No Account Penalty (Investigation Note Only)</option>
                    <option value="SUSPEND">Suspend Reported User</option>
                    <option value="BLOCK">Permanently Block Reported User</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Staff Investigation Notes & Resolution</label>
                  <textarea
                    rows={3}
                    placeholder="Document outcome of phone outreach, witness verification, or reason for dismissal..."
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#182337] border border-white/10 text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setActiveReport(null)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition disabled:opacity-50"
                  >
                    {updating ? "Saving..." : "Save Resolution"}
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
