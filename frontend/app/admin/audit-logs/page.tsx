"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  Search,
  Filter,
  Clock,
  User,
  Shield,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Database,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  before: any;
  after: any;
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25 });
  const [targetType, setTargetType] = useState("ALL");
  const [actionSearch, setActionSearch] = useState("");

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  async function fetchLogs(page = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "25",
        targetType,
        action: actionSearch,
      });
      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setPagination(data.pagination || { total: 0, page: 1, limit: 25 });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs(1);
  }, [targetType]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchLogs(1);
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

  function formatActionName(action: string) {
    return action.replace(/_/g, " ");
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#121c2e] via-[#0f1728] to-[#121c2e] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Compliance & Transparency
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-red-500" />
            Audit Trail & Activity Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Complete tamper-proof record of every administrative action, permission modification, and financial trigger.
          </p>
        </div>
        <div className="relative z-10 inline-flex items-center gap-2 bg-white/5 border border-white/10 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold w-fit">
          <Database className="w-3.5 h-3.5 text-red-400" />
          Append-Only Retention (ISO 27001)
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0f172a] border border-white/10 shadow-lg flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search action keyword..."
              value={actionSearch}
              onChange={(e) => setActionSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#162136] border border-white/10 text-white rounded-xl text-xs placeholder:text-slate-500 focus:outline-none focus:border-red-500 transition"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-red-500/20"
          >
            Filter
          </button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Target Resource:</span>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="bg-[#162136] border border-white/10 text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-red-500"
            >
              <option value="ALL" className="bg-[#162136] text-white">All Resources</option>
              <option value="USER" className="bg-[#162136] text-white">User Accounts</option>
              <option value="EVENT" className="bg-[#162136] text-white">Events</option>
              <option value="STAFF" className="bg-[#162136] text-white">Staff & Admins</option>
              <option value="COUPON" className="bg-[#162136] text-white">Coupons & Offers</option>
              <option value="SYSTEM_SETTING" className="bg-[#162136] text-white">System Settings</option>
              <option value="PAYMENT" className="bg-[#162136] text-white">Payments & Refunds</option>
              <option value="REPORT" className="bg-[#162136] text-white">Safety Reports</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-3xl bg-[#0f172a] border border-white/10 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs animate-pulse">Loading audit entries...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-400">No audit logs matching this criteria</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/10 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-3 w-[15%]">Timestamp</th>
                  <th className="py-3.5 px-3 w-[20%]">Operator / Staff</th>
                  <th className="py-3.5 px-3 w-[18%]">Action</th>
                  <th className="py-3.5 px-3 w-[16%]">Resource</th>
                  <th className="py-3.5 px-3 w-[21%]">Reason / Notes</th>
                  <th className="py-3.5 px-3 w-[10%] text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3 px-3 w-[15%]">
                      <div className="flex items-start gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="font-mono text-slate-200 text-xs block whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </span>
                          <span className="font-mono text-slate-500 text-[10px] block">
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 w-[20%]">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                          {log.actorName ? log.actorName.charAt(0).toUpperCase() : "A"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white text-xs truncate" title={log.actorName || "Super Admin"}>
                            {log.actorName || "Super Admin"}
                          </p>
                          <span className="text-[10px] text-slate-500 font-mono truncate block" title={log.actorEmail}>
                            {log.actorEmail}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 w-[18%]">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 truncate max-w-full"
                        title={formatActionName(log.action)}
                      >
                        {formatActionName(log.action)}
                      </span>
                    </td>
                    <td className="py-3 px-3 w-[16%]">
                      <div className="min-w-0">
                        <span className="font-bold text-white text-xs block truncate" title={log.targetType}>
                          {log.targetType}
                        </span>
                        <p className="text-[10px] text-slate-500 font-mono truncate" title={log.targetId}>
                          {log.targetId ? (log.targetId.length > 14 ? log.targetId.slice(0, 12) + "..." : log.targetId) : "—"}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-3 w-[21%]">
                      <p className="text-slate-300 text-xs truncate" title={log.reason || "No notes"}>
                        {log.reason || "—"}
                      </p>
                    </td>
                    <td className="py-3 px-3 w-[10%] text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-white border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg transition shrink-0"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Diff</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.01] flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing {logs.length} of {pagination.total} entries
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchLogs(pagination.page - 1)}
              className="p-1.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-slate-300 disabled:opacity-30 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-white">
              Page {pagination.page} of {totalPages}
            </span>
            <button
              disabled={pagination.page >= totalPages}
              onClick={() => fetchLogs(pagination.page + 1)}
              className="p-1.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-slate-300 disabled:opacity-30 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Audit Detail Modal with Before/After Diff */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedLog(null)} />
          <div className="relative w-full max-w-2xl bg-[#0f172a] border border-white/15 rounded-3xl p-6 shadow-2xl z-10 max-h-[90vh] flex flex-col">
            <div className="border-b border-white/10 pb-4 mb-4 flex items-center justify-between shrink-0">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-500" />
                Audit Entry Details
              </h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1 custom-scrollbar text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#162136] p-4 rounded-2xl border border-white/10">
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Action</span>
                  <span className="font-bold text-red-400">{formatActionName(selectedLog.action)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Timestamp</span>
                  <span className="font-mono text-slate-300">{new Date(selectedLog.createdAt).toISOString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Operator</span>
                  <span className="font-medium text-white">{selectedLog.actorName} ({selectedLog.actorEmail})</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Staff Role</span>
                  <span className="font-bold text-red-400">{selectedLog.actorRole}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Target Type & ID</span>
                  <span className="font-mono text-slate-300">{selectedLog.targetType}: {selectedLog.targetId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Network IP</span>
                  <span className="font-mono text-slate-300">{selectedLog.ipAddress || "Internal System"}</span>
                </div>
              </div>

              {selectedLog.reason && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-300 text-xs">
                  <span className="font-bold block mb-0.5">Stated Justification:</span>
                  <p>{selectedLog.reason}</p>
                </div>
              )}

              {/* Before and After JSON Diff */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  State Mutation Diff
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border border-white/10 rounded-2xl p-3.5 bg-[#080d1a] text-slate-200 font-mono text-[11px] overflow-x-auto">
                    <span className="text-red-400 block text-[10px] font-bold uppercase mb-1 border-b border-white/10 pb-1">
                      Before Change
                    </span>
                    <pre className="whitespace-pre-wrap">
                      {selectedLog.before ? JSON.stringify(selectedLog.before, null, 2) : "// None / New Record"}
                    </pre>
                  </div>

                  <div className="border border-white/10 rounded-2xl p-3.5 bg-[#080d1a] text-slate-200 font-mono text-[11px] overflow-x-auto">
                    <span className="text-emerald-400 block text-[10px] font-bold uppercase mb-1 border-b border-white/10 pb-1">
                      After Change
                    </span>
                    <pre className="whitespace-pre-wrap">
                      {selectedLog.after ? JSON.stringify(selectedLog.after, null, 2) : "// Record Deleted / Null"}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end shrink-0 mt-4">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-bold rounded-xl text-xs transition"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
