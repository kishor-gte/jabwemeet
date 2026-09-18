"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  Lock,
  Edit2,
  Clock,
  Mail,
  AlertTriangle,
  X,
  CheckCircle2,
  Users,
  Shield,
  Calendar,
  Sparkles,
} from "lucide-react";

interface AdminMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  staffRole: string;
  status: string;
  createdAt: string;
  lastActiveAt: string | null;
}

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminMember | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    status: "ACTIVE",
    reason: "",
  });

  async function fetchAdmins() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/staff", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setAdmins(data.staffMembers || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAdmins();
  }, []);

  function openEditModal(admin: AdminMember) {
    setSelectedAdmin(admin);
    setForm({
      status: admin.status || "ACTIVE",
      reason: "",
    });
    setErrorMsg("");
    setModalOpen(true);
  }

  async function handleUpdateAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAdmin) return;
    if (!form.reason.trim()) {
      setErrorMsg("Please specify a justification for this account change (logged in Audit Trail).");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/admin/staff/${selectedAdmin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          staffRole: "SUPER_ADMIN",
          status: form.status,
          reason: form.reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        fetchAdmins();
      } else {
        setErrorMsg(data.message || "Failed to update admin status");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Network error");
    } finally {
      setSaving(false);
    }
  }

  const activeCount = admins.filter((s) => s.status === "ACTIVE").length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#121c2e] via-[#0f1728] to-[#121c2e] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Security & Governance
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-red-500" />
            Admin Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Super Administrator accounts with full platform governance. All account status modifications are recorded in the audit trail.
          </p>
        </div>
        <div className="relative z-10 inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-xl text-xs font-bold w-fit">
          <Lock className="w-3.5 h-3.5" />
          Single Role Architecture: SUPER_ADMIN Only
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Administrators</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mt-2">{admins.length}</p>
          <span className="text-[11px] text-slate-500">Authorized platform accounts</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a] border border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Active Admins</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2">{activeCount}</p>
          <span className="text-[11px] text-slate-500">Granted active access</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a] border border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">Privilege Model</span>
            <Shield className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-red-400 mt-2">SUPER_ADMIN</p>
          <span className="text-[11px] text-slate-500">Full operational control</span>
        </div>
      </div>

      {/* Admin Roster Table */}
      <div className="rounded-3xl bg-[#0f172a] border border-white/10 shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-500" />
            Super Administrator Directory
          </h2>
          <span className="text-xs text-slate-400">{admins.length} registered admin(s)</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs animate-pulse">Loading admin directory...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/10 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-5">Admin Name</th>
                  <th className="py-4 px-4">Email</th>
                  <th className="py-4 px-4">Role</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Last Active</th>
                  <th className="py-4 px-4">Created Date</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center font-bold text-sm">
                          {admin.name ? admin.name.charAt(0).toUpperCase() : "A"}
                        </div>
                        <div>
                          <p className="font-bold text-white">{admin.name}</p>
                          <span className="text-[10px] text-slate-500 font-mono">ID: {admin.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-300 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        {admin.email}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                        <Lock className="w-3 h-3" />
                        SUPER_ADMIN
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {admin.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/20">
                          Suspended
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-400 font-mono">
                      {admin.lastActiveAt ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {new Date(admin.lastActiveAt).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-600">Never</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-400 font-mono">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => openEditModal(admin)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-white border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Manage Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Status Modal */}
      {modalOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#0f172a] border border-white/15 rounded-3xl p-6 shadow-2xl z-10">
            <div className="px-1 py-1 border-b border-white/10 pb-4 mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-red-500" />
                Manage Super Admin Status
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAdmin} className="space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="p-3.5 bg-[#162136] border border-white/10 rounded-2xl">
                <p className="text-xs font-bold text-white">{selectedAdmin.name}</p>
                <p className="text-[11px] font-mono text-slate-400">{selectedAdmin.email}</p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Administrative Role
                </label>
                <div className="px-3.5 py-2.5 bg-[#182337] border border-white/10 rounded-xl text-xs font-bold text-red-400 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-500" />
                  SUPER_ADMIN (Full Platform Access)
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  All platform administrators operate under the unified SUPER_ADMIN role.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Account Status *
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#182337] border border-white/10 text-white focus:outline-none focus:border-red-500"
                >
                  <option value="ACTIVE" className="bg-[#182337] text-white">ACTIVE (Granted Full Access)</option>
                  <option value="SUSPENDED" className="bg-[#182337] text-white">SUSPENDED (Access Revoked)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Reason / Justification *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Account activated following onboarding verification"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#182337] border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500"
                />
                <span className="text-[10px] text-slate-500">
                  This justification is permanently stored in the audit trail.
                </span>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-medium rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition"
                >
                  {saving ? "Saving..." : "Save Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
