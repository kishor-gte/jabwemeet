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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-7 h-7 text-rose-600" />
            Immutable Audit Trail & Activity Logs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete tamper-proof record of every administrative action, permission modification, and financial trigger.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 w-fit">
          <Database className="w-3.5 h-3.5 text-slate-500" />
          Append-Only Retention (ISO 27001)
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search action keyword..."
              value={actionSearch}
              onChange={(e) => setActionSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium"
          >
            Filter
          </button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Filter className="w-4 h-4 text-slate-400" />
            <span>Target Resource:</span>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-rose-500"
            >
              <option value="ALL">All Resources</option>
              <option value="USER">User Accounts</option>
              <option value="EVENT">Events</option>
              <option value="STAFF">Staff & RBAC</option>
              <option value="COUPON">Coupons & Offers</option>
              <option value="SYSTEM_SETTING">System Settings</option>
              <option value="PAYMENT">Payments & Refunds</option>
              <option value="REPORT">Safety Reports</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading audit entries...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium">No audit logs matching this criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Operator / Staff</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Resource Target</th>
                  <th className="py-3.5 px-4">Reason / Notes</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                          {log.actorName ? log.actorName.charAt(0).toUpperCase() : "A"}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-xs">{log.actorName || "Staff Admin"}</p>
                          <span className="text-[11px] text-slate-400 font-mono">{log.actorEmail}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                        {formatActionName(log.action)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs">
                        <span className="font-semibold text-slate-700">{log.targetType}</span>
                        <p className="text-[11px] text-slate-400 font-mono">ID: {log.targetId}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                      {log.reason || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Diff
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {logs.length} of {pagination.total} entries
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchLogs(pagination.page - 1)}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-700">
              Page {pagination.page} of {totalPages}
            </span>
            <button
              disabled={pagination.page >= totalPages}
              onClick={() => fetchLogs(pagination.page + 1)}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Audit Detail Modal with Before/After Diff */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-600" />
                Audit Entry Details
              </h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block uppercase font-semibold text-[10px]">Action</span>
                  <span className="font-bold text-rose-700">{formatActionName(selectedLog.action)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-semibold text-[10px]">Timestamp</span>
                  <span className="font-mono text-slate-800">{new Date(selectedLog.createdAt).toISOString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-semibold text-[10px]">Operator</span>
                  <span className="font-medium text-slate-800">{selectedLog.actorName} ({selectedLog.actorEmail})</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-semibold text-[10px]">Staff Role</span>
                  <span className="font-medium text-slate-800">{selectedLog.actorRole}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-semibold text-[10px]">Target Type & ID</span>
                  <span className="font-mono text-slate-800">{selectedLog.targetType}: {selectedLog.targetId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-semibold text-[10px]">Network IP / Agent</span>
                  <span className="font-mono text-slate-800">{selectedLog.ipAddress || "Internal System"}</span>
                </div>
              </div>

              {selectedLog.reason && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <span className="font-semibold block mb-0.5">Stated Justification / Reason:</span>
                  <p>{selectedLog.reason}</p>
                </div>
              )}

              {/* Before and After JSON Diff */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  State Mutation Diff
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
                    <span className="text-rose-400 block text-[10px] font-bold uppercase mb-1 border-b border-slate-800 pb-1">
                      Before Change
                    </span>
                    <pre className="whitespace-pre-wrap">
                      {selectedLog.before ? JSON.stringify(selectedLog.before, null, 2) : "// None / New Record"}
                    </pre>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
                    <span className="text-emerald-400 block text-[10px] font-bold uppercase mb-1 border-b border-slate-800 pb-1">
                      After Change
                    </span>
                    <pre className="whitespace-pre-wrap">
                      {selectedLog.after ? JSON.stringify(selectedLog.after, null, 2) : "// Record Deleted / Null"}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 shrink-0 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-xl text-xs transition-colors"
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
