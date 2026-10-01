"use client";

import React, { useEffect, useState } from "react";
import {
  Coffee,
  Search,
  CheckCircle2,
  AlertTriangle,
  Eye,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { useAdminDialog } from "@/components/admin/AdminDialogProvider";

export default function CafePartnerPage() {
  const { alert, confirm, toast } = useAdminDialog();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [city, setCity] = useState("ALL");
  const [verification, setVerification] = useState("ALL");

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    action: "SUSPEND" | "BLOCK" | "ACTIVATE" | "VERIFY";
    title: string;
    message: string;
  } | null>(null);

  const [actionLoading, setActionLoading] = useState(false);

  async function fetchCafePartners(page = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        search,
        role: "CAFE", // Hardcoded to only fetch CAFE partners
        status,
        city,
        verification,
      });
      const res = await fetch(`/api/admin/users?${params.toString()}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCafePartners(1);
  }, [status, city, verification]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchCafePartners(1);
  }

  async function handleConfirmAction() {
    if (!confirmDialog) return;
    setActionLoading(true);
    try {
      let body: any = {};
      if (confirmDialog.action === "SUSPEND") body = { status: "SUSPENDED", reason: "Administrative suspension" };
      else if (confirmDialog.action === "BLOCK") body = { status: "BLOCKED", reason: "Account blocked for safety violations" };
      else if (confirmDialog.action === "ACTIVATE") body = { status: "ACTIVE", reason: "Account reactivated by admin" };
      else if (confirmDialog.action === "VERIFY") body = { isVerified: true, reason: "Verified cafe partner" };

      const res = await fetch(`/api/admin/users/${confirmDialog.userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast("Cafe partner status updated successfully", "success");
        setConfirmDialog(null);
        fetchCafePartners(pagination.page);
      } else {
        alert({
          title: "Status Update Failed",
          message: data.message || "Failed to update status.",
          type: "danger",
        });
      }
    } catch (err) {
      alert({
        title: "Server Error",
        message: "An error occurred while updating status.",
        type: "danger",
      });
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#7E2248] text-xs font-semibold mb-2">
            <Coffee className="w-3.5 h-3.5 text-[#7E2248]" />
            Cafe Partners
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
            Cafe Partner Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Total {pagination.total} registered cafe partners across all statuses.
          </p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by cafe name, email, or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-700 focus:outline-none focus:border-[#7E2248] focus:bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="BLOCKED">Blocked</option>
            </select>

            {/* Verification Filter */}
            <select
              value={verification}
              onChange={(e) => setVerification(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-700 focus:outline-none focus:border-[#7E2248] focus:bg-white"
            >
              <option value="ALL">All Verification</option>
              <option value="VERIFIED">Verified</option>
              <option value="UNVERIFIED">Pending / Unverified</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#7E2248] hover:bg-[#681938] text-white font-bold transition shadow-xs"
            >
              Apply Filter
            </button>
          </div>
        </form>
      </div>

      {/* USERS TABLE */}
      <div className="bg-white border border-rose-100 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-rose-50/60 text-[11px] font-serif font-bold uppercase tracking-wider text-slate-500 border-b border-rose-100">
              <tr>
                <th className="px-5 py-3.5">Cafe Partner</th>
                <th className="px-4 py-3.5">Contact</th>
                <th className="px-4 py-3.5">Location</th>
                <th className="px-4 py-3.5">Verification</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Joined</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Loading cafe partner records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 italic">
                    No cafe partners found matching current filters.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-rose-50/30 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center font-bold text-[#7E2248] text-xs shrink-0 overflow-hidden">
                          {u.profilePhoto || u.profileImage ? (
                            <img src={u.profilePhoto || u.profileImage} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            u.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <a
                            href={`/admin/users/${u.id}`}
                            className="font-bold text-slate-900 hover:text-[#7E2248] transition flex items-center gap-1.5"
                          >
                            <span>{u.name}</span>
                          </a>
                          <span className="text-[10px] text-slate-500 block">ID: {u.id.substring(0, 10)}...</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{u.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{u.phone || "N/A"}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="capitalize text-slate-700">{u.city || "Unspecified"}</span>
                    </td>

                    <td className="px-4 py-4">
                      {u.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : u.status === "SUSPENDED"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}>
                        {u.status || "ACTIVE"}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-500 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/admin/users/${u.id}`}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-slate-600 hover:text-slate-900 border border-rose-200 transition"
                          title="View Cafe Partner Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </a>

                        {!u.isVerified && (
                          <button
                            onClick={() =>
                              setConfirmDialog({
                                open: true,
                                userId: u.id,
                                userName: u.name,
                                action: "VERIFY",
                                title: "Verify Cafe Partner",
                                message: `Are you sure you want to mark ${u.name} as a verified cafe partner?`,
                              })
                            }
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                            title="Verify Cafe Partner"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}

                        {u.status === "ACTIVE" ? (
                          <button
                            onClick={() =>
                              setConfirmDialog({
                                open: true,
                                userId: u.id,
                                userName: u.name,
                                action: "SUSPEND",
                                title: "Suspend Account",
                                message: `Are you sure you want to suspend ${u.name}? They will not be able to log in or manage their venue.`,
                              })
                            }
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition"
                            title="Suspend User"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setConfirmDialog({
                                open: true,
                                userId: u.id,
                                userName: u.name,
                                action: "ACTIVATE",
                                title: "Reactivate Account",
                                message: `Reactivate access for ${u.name}?`,
                              })
                            }
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                            title="Reactivate User"
                          >
                            <UserCheck className="w-4 h-4" />
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

        {/* PAGINATION */}
        <div className="px-5 py-4 bg-rose-50/40 border-t border-rose-100 flex items-center justify-between text-xs">
          <span className="text-slate-600">
            Page {pagination.page} of {Math.max(1, pagination.totalPages)} ({pagination.total} total partners)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchCafePartners(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg bg-white border border-rose-200 text-slate-700 disabled:opacity-30 hover:bg-rose-50 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => fetchCafePartners(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg bg-white border border-rose-200 text-slate-700 disabled:opacity-30 hover:bg-rose-50 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRMATION DIALOG MODAL */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setConfirmDialog(null)} />
          <div className="relative w-full max-w-md bg-white border border-rose-100 rounded-3xl p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-slate-900">{confirmDialog.title}</h3>
                <span className="text-xs text-slate-500">Target: {confirmDialog.userName}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{confirmDialog.message}</p>

            <div className="flex justify-end gap-3 pt-3 border-t border-rose-100">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl bg-rose-50 text-slate-700 hover:bg-rose-100 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmAction}
                className="px-5 py-2 rounded-xl bg-[#7E2248] hover:bg-[#681938] text-white font-bold text-xs transition shadow-xs disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Confirm Action"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
