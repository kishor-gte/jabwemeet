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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#7E2248] via-[#681938] to-[#50132A] border border-rose-900/20 rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden text-white">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-rose-200 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-rose-200" />
            Compliance & Transparency
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-rose-200" />
            Audit Trail & Activity Logs
          </h1>
          <p className="text-xs sm:text-sm text-rose-100/80 mt-1 max-w-xl">
            Complete tamper-proof record of every administrative action, permission modification, and financial trigger.
          </p>
        </div>
        <div className="relative z-10 inline-flex items-center gap-2 bg-white/15 border border-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold w-fit shadow-xs">
          <Database className="w-3.5 h-3.5 text-rose-200" />
          Append-Only Retention (ISO 27001)
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search action keyword..."
              value={actionSearch}
              onChange={(e) => setActionSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white transition"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#7E2248] hover:bg-[#681938] text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            Filter
          </button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold">Target Resource:</span>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#7E2248] focus:bg-white"
            >
              <option value="ALL">All Resources</option>
              <option value="USER">User Accounts</option>
              <option value="EVENT">Events</option>
              <option value="STAFF">Staff & Admins</option>
              <option value="COUPON">Coupons & Offers</option>
              <option value="SYSTEM_SETTING">System Settings</option>
              <option value="PAYMENT">Payments & Refunds</option>
              <option value="REPORT">Safety Reports</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-3xl bg-white border border-rose-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs animate-pulse">Loading audit entries...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-500">No audit logs matching this criteria</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-rose-50/60 border-b border-rose-100 text-slate-500 text-[11px] font-serif font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-3 w-[15%]">Timestamp</th>
                  <th className="py-3.5 px-3 w-[20%]">Operator / Staff</th>
                  <th className="py-3.5 px-3 w-[18%]">Action</th>
                  <th className="py-3.5 px-3 w-[16%]">Resource</th>
                  <th className="py-3.5 px-3 w-[21%]">Reason / Notes</th>
                  <th className="py-3.5 px-3 w-[10%] text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-50 text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-rose-50/30 transition">
                    <td className="py-3 px-3 w-[15%]">
                      <div className="flex items-start gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="font-mono text-slate-800 text-xs block whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </span>
                          <span className="font-mono text-slate-400 text-[10px] block">
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 w-[20%]">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 text-[#7E2248] flex items-center justify-center font-bold text-[11px] shrink-0">
                          {log.actorName ? log.actorName.charAt(0).toUpperCase() : "A"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 text-xs truncate" title={log.actorName || "Super Admin"}>
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
                        className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-[#7E2248] border border-rose-200/60 truncate max-w-full"
                        title={formatActionName(log.action)}
                      >
                        {formatActionName(log.action)}
                      </span>
                    </td>
                    <td className="py-3 px-3 w-[16%]">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 text-xs block truncate" title={log.targetType}>
                          {log.targetType}
                        </span>
                        <p className="text-[10px] text-slate-500 font-mono truncate" title={log.targetId}>
                          {log.targetId ? (log.targetId.length > 14 ? log.targetId.slice(0, 12) + "..." : log.targetId) : "—"}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-3 w-[21%]">
                      <p className="text-slate-600 text-xs truncate" title={log.reason || "No notes"}>
                        {log.reason || "—"}
                      </p>
                    </td>
                    <td className="py-3 px-3 w-[10%] text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 border border-rose-200 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition shrink-0 shadow-xs"
                      >
                        <Eye className="w-3 h-3 text-[#7E2248]" />
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
        <div className="p-4 border-t border-rose-100 bg-rose-50/30 flex items-center justify-between text-xs text-slate-600">
          <span>
            Showing {logs.length} of {pagination.total} entries
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchLogs(pagination.page - 1)}
              className="p-1.5 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 text-slate-700 disabled:opacity-30 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-900">
              Page {pagination.page} of {totalPages}
            </span>
            <button
              disabled={pagination.page >= totalPages}
              onClick={() => fetchLogs(pagination.page + 1)}
              className="p-1.5 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 text-slate-700 disabled:opacity-30 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Audit Detail Modal with Before/After Diff */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setSelectedLog(null)} />
          <div className="relative w-full max-w-2xl bg-white border border-rose-100 rounded-3xl p-6 shadow-2xl z-10 max-h-[90vh] flex flex-col">
            <div className="border-b border-rose-100 pb-4 mb-4 flex items-center justify-between shrink-0">
              <h2 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#7E2248]" />
                Audit Entry Details
              </h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1 custom-scrollbar text-xs">
              <div className="grid grid-cols-2 gap-3 bg-rose-50/40 p-4 rounded-2xl border border-rose-100">
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Action</span>
                  <span className="font-bold text-[#7E2248]">{formatActionName(selectedLog.action)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Timestamp</span>
                  <span className="font-mono text-slate-700">{new Date(selectedLog.createdAt).toISOString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Operator</span>
                  <span className="font-medium text-slate-900">{selectedLog.actorName} ({selectedLog.actorEmail})</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Staff Role</span>
                  <span className="font-bold text-[#7E2248]">{selectedLog.actorRole}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Target Type & ID</span>
                  <span className="font-mono text-slate-700">{selectedLog.targetType}: {selectedLog.targetId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">Network IP</span>
                  <span className="font-mono text-slate-700">{selectedLog.ipAddress || "Internal System"}</span>
                </div>
              </div>

              {selectedLog.reason && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs">
                  <span className="font-bold block mb-0.5">Stated Justification:</span>
                  <p>{selectedLog.reason}</p>
                </div>
              )}

              {/* Before and After JSON Diff */}
              <div className="space-y-2">
                <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-slate-500">
                  State Mutation Diff
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border border-rose-200 rounded-2xl p-3.5 bg-[#FAF3F6]/60 text-slate-800 font-mono text-[11px] overflow-x-auto">
                    <span className="text-[#7E2248] block text-[10px] font-bold uppercase mb-1 border-b border-rose-200 pb-1">
                      Before Change
                    </span>
                    <pre className="whitespace-pre-wrap">
                      {selectedLog.before ? JSON.stringify(selectedLog.before, null, 2) : "// None / New Record"}
                    </pre>
                  </div>

                  <div className="border border-rose-200 rounded-2xl p-3.5 bg-[#FAF3F6]/60 text-slate-800 font-mono text-[11px] overflow-x-auto">
                    <span className="text-emerald-700 block text-[10px] font-bold uppercase mb-1 border-b border-rose-200 pb-1">
                      After Change
                    </span>
                    <pre className="whitespace-pre-wrap">
                      {selectedLog.after ? JSON.stringify(selectedLog.after, null, 2) : "// Record Deleted / Null"}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-rose-100 flex justify-end shrink-0 mt-4">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-rose-50 hover:bg-rose-100 text-slate-700 border border-rose-200 font-bold rounded-xl text-xs transition"
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
