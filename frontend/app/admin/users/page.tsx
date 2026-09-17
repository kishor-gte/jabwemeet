"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  Filter,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  UserCheck,
  UserX,
  X,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("ALL");
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

  async function fetchUsers(page = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        search,
        role,
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
    fetchUsers(1);
  }, [role, status, city, verification]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchUsers(1);
  }

  async function handleConfirmAction() {
    if (!confirmDialog) return;
    setActionLoading(true);
    try {
      let body: any = {};
      if (confirmDialog.action === "SUSPEND") body = { status: "SUSPENDED", reason: "Administrative suspension" };
      else if (confirmDialog.action === "BLOCK") body = { status: "BLOCKED", reason: "Account blocked for safety violations" };
      else if (confirmDialog.action === "ACTIVATE") body = { status: "ACTIVE", reason: "Account reactivated by admin" };
      else if (confirmDialog.action === "VERIFY") body = { isVerified: true, reason: "Verified member profile" };

      const res = await fetch(`/api/admin/users/${confirmDialog.userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setConfirmDialog(null);
        fetchUsers(pagination.page);
      } else {
        alert(data.message || "Failed to update user");
      }
    } catch (err) {
      alert("Error updating user status");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            Platform Membership
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            User Directory & Access Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Total {pagination.total} registered platform members across all roles and verification statuses.
          </p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="p-4 rounded-2xl bg-[#0f172a] border border-white/10 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, email, or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#162136] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Role Filter */}
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#162136] border border-white/10 text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="USER">Members (USER)</option>
              <option value="MATCHMAKER">Relationship Managers</option>
              <option value="BREAKUP_BUDDY">Breakup Buddies</option>
              <option value="HOST">Event Hosts / Managers</option>
              <option value="ADMIN">Administrators</option>
            </select>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#162136] border border-white/10 text-slate-200 focus:outline-none"
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
              className="px-3 py-2 rounded-xl bg-[#162136] border border-white/10 text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Verification</option>
              <option value="VERIFIED">Verified</option>
              <option value="UNVERIFIED">Pending / Unverified</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition"
            >
              Apply Filter
            </button>
          </div>
        </form>
      </div>

      {/* USERS TABLE */}
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#131d2e] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-4 py-3.5">Contact</th>
                <th className="px-4 py-3.5">Location</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Verification</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Joined</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500">
                    Loading user records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500 italic">
                    No users found matching current filters.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#182337] border border-white/10 flex items-center justify-center font-bold text-white text-xs shrink-0 overflow-hidden">
                          {u.profilePhoto || u.profileImage ? (
                            <img src={u.profilePhoto || u.profileImage} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            u.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <a
                            href={`/admin/users/${u.id}`}
                            className="font-bold text-white hover:text-red-400 transition flex items-center gap-1.5"
                          >
                            <span>{u.name}</span>
                          </a>
                          <span className="text-[10px] text-slate-500 block">ID: {u.id.substring(0, 10)}...</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{u.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{u.phone || "N/A"}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="capitalize">{u.city || "Unspecified"}</span>
                    </td>

                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        u.role === "ADMIN"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : u.role === "MATCHMAKER"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : u.role === "BREAKUP_BUDDY"
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          : u.role === "HOST"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-white/10 text-slate-300 border border-white/10"
                      }`}>
                        {u.role === "MATCHMAKER" ? "Relationship Manager" : u.role}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      {u.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        u.status === "ACTIVE"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : u.status === "SUSPENDED"
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-red-500/15 text-red-400"
                      }`}>
                        {u.status || "ACTIVE"}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-400 text-[11px]">
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
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition"
                          title="View 360° Profile"
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
                                title: "Verify User Profile",
                                message: `Are you sure you want to mark ${u.name} as a verified member?`,
                              })
                            }
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
                            title="Verify Member"
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
                                message: `Are you sure you want to suspend ${u.name}? They will not be able to log in or book events.`,
                              })
                            }
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition"
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
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
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
        <div className="px-5 py-4 bg-[#131d2e] border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Page {pagination.page} of {Math.max(1, pagination.totalPages)} ({pagination.total} total members)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchUsers(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 disabled:opacity-30 hover:bg-white/10 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => fetchUsers(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 disabled:opacity-30 hover:bg-white/10 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRMATION DIALOG MODAL */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setConfirmDialog(null)} />
          <div className="relative w-full max-w-md bg-[#0f172a] border border-white/15 rounded-3xl p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{confirmDialog.title}</h3>
                <span className="text-xs text-slate-400">Target: {confirmDialog.userName}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{confirmDialog.message}</p>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmAction}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition disabled:opacity-50"
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
