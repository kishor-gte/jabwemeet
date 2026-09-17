"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  UserCheck,
  Lock,
  Edit2,
  Clock,
  Mail,
  AlertTriangle,
  X,
  CheckCircle2,
  Users,
  KeyRound,
  FileCheck2,
} from "lucide-react";

interface StaffMember {
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

const ROLE_DESCRIPTIONS: Record<string, { label: string; desc: string; color: string }> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    desc: "Full unrestricted platform control, staff delegation, and billing",
    color: "bg-rose-50 text-rose-700 border-rose-200",
  },
  OPERATIONS_ADMIN: {
    label: "Operations Admin",
    desc: "Oversees Users, Events, Managers, Matchmaking, and Buddies",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  EVENT_ADMIN: {
    label: "Event Host Admin",
    desc: "Oversees real-world events, host assignments, and attendance",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  FINANCE_ADMIN: {
    label: "Finance Admin",
    desc: "Regulates transactions, refunds, GST invoices, and coupon codes",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  SAFETY_ADMIN: {
    label: "Trust & Safety Admin",
    desc: "Investigates safety incidents, reviews documents, and user moderation",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  CONTENT_ADMIN: {
    label: "Content & CMS Admin",
    desc: "Manages homepage copy, safety pledges, and global announcements",
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  SUPPORT_ADMIN: {
    label: "Support Desk Admin",
    desc: "Handles member tickets, inquiries, and resolution updates",
    color: "bg-teal-50 text-teal-700 border-teal-200",
  },
};

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    staffRole: "SUPER_ADMIN",
    status: "ACTIVE",
    reason: "",
  });

  async function fetchStaff() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/staff", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setStaff(data.staffMembers || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStaff();
  }, []);

  function openEditModal(member: StaffMember) {
    setSelectedStaff(member);
    setForm({
      staffRole: member.staffRole || "SUPER_ADMIN",
      status: member.status || "ACTIVE",
      reason: "",
    });
    setErrorMsg("");
    setModalOpen(true);
  }

  async function handleUpdateStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStaff) return;
    if (!form.reason.trim()) {
      setErrorMsg("Please specify a reason for this permission change (logged in Audit Trail).");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/admin/staff/${selectedStaff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        fetchStaff();
      } else {
        setErrorMsg(data.message || "Failed to update staff permissions");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Network error");
    } finally {
      setSaving(false);
    }
  }

  const superAdminCount = staff.filter((s) => s.staffRole === "SUPER_ADMIN").length;
  const activeStaffCount = staff.filter((s) => s.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-rose-600" />
            Staff Roles & Permission Enforcement
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Server-side role-based access control (RBAC). Changes are permanently recorded in the immutable audit log.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Administrators</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{staff.length}</p>
          <span className="text-xs text-slate-400">Authorized staff members</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Active Staff</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{activeStaffCount}</p>
          <span className="text-xs text-slate-400">Can log in & manage</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Super Admins</span>
            <Lock className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-2">{superAdminCount}</p>
          <span className="text-xs text-slate-400">Full system override</span>
        </div>
      </div>

      {/* Staff Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-rose-600" />
            Authorized Platform Operators
          </h2>
          <span className="text-xs text-slate-500">{staff.length} staff accounts</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading staff members...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Assigned Role</th>
                  <th className="py-3.5 px-4">Role Capabilities</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {staff.map((member) => {
                  const roleInfo = ROLE_DESCRIPTIONS[member.staffRole] || ROLE_DESCRIPTIONS.SUPER_ADMIN;
                  return (
                    <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm">
                            {member.name ? member.name.charAt(0).toUpperCase() : "A"}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{member.name}</p>
                            <span className="text-[11px] text-slate-400">ID: {member.id.slice(0, 8)}...</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {member.email}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${roleInfo.color}`}
                        >
                          <Lock className="w-3 h-3" />
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs">
                        {roleInfo.desc}
                      </td>
                      <td className="py-3.5 px-4">
                        {member.status === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            Suspended
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openEditModal(member)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Modify Role
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Hierarchy Reference Card */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
          <FileCheck2 className="w-4 h-4 text-rose-600" />
          Server-Enforced Role Matrix & Permissions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(ROLE_DESCRIPTIONS).map(([key, item]) => (
            <div key={key} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${item.color}`}>
                {item.label}
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Role Modal */}
      {modalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-rose-600" />
                Edit Staff Permissions
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-xs font-semibold text-slate-800">{selectedStaff.name}</p>
                <p className="text-xs font-mono text-slate-500">{selectedStaff.email}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Assign Staff Role *
                </label>
                <select
                  value={form.staffRole}
                  onChange={(e) => setForm({ ...form, staffRole: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 bg-white"
                >
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Full Platform Access)</option>
                  <option value="OPERATIONS_ADMIN">OPERATIONS_ADMIN (Users, Events, Matches)</option>
                  <option value="EVENT_ADMIN">EVENT_ADMIN (Events & Managers)</option>
                  <option value="FINANCE_ADMIN">FINANCE_ADMIN (Billing, Refunds, Invoices)</option>
                  <option value="SAFETY_ADMIN">SAFETY_ADMIN (Reports, Moderation, IDs)</option>
                  <option value="CONTENT_ADMIN">CONTENT_ADMIN (CMS, Announcements, Reviews)</option>
                  <option value="SUPPORT_ADMIN">SUPPORT_ADMIN (Tickets & Queries)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  {ROLE_DESCRIPTIONS[form.staffRole]?.desc}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Account Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 bg-white"
                >
                  <option value="ACTIVE">ACTIVE (Granted Login)</option>
                  <option value="SUSPENDED">SUSPENDED (Access Revoked)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Reason for Modification *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Assigned to Trust & Safety department per HR authorization"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-500"
                />
                <span className="text-[10px] text-slate-400">
                  This justification is permanently stored in the audit trail.
                </span>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-medium rounded-xl text-sm shadow-sm transition-all"
                >
                  {saving ? "Saving..." : "Save Role Change"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
