"use client";

import React, { useEffect, useState } from "react";
import {
  HeartHandshake,
  Search,
  CheckCircle2,
  AlertTriangle,
  Users,
  Sparkles,
  Calendar,
  Eye,
  Mail,
  Phone,
  Shield,
  X,
  ExternalLink,
} from "lucide-react";
import { useAdminDialog } from "@/components/admin/AdminDialogProvider";

export default function AdminRelationshipManagersPage() {
  const { alert, confirm, toast } = useAdminDialog();
  const [managers, setManagers] = useState<any[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedManager, setSelectedManager] = useState<any | null>(null);

  async function fetchRMs() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/relationship-managers", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setManagers(data.managers);
        setPendingRequestsCount(data.pendingRequestsCount || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRMs();
  }, []);

  async function handleToggleApproval(id: string, currentApproved: boolean) {
    const actionName = currentApproved ? "revoke approval for" : "approve";
    const confirmed = await confirm({
      title: `${currentApproved ? "Revoke" : "Approve"} Relationship Manager`,
      message: `Are you sure you want to ${actionName} this Relationship Manager?`,
      type: currentApproved ? "warning" : "confirm",
      confirmText: currentApproved ? "Revoke Approval" : "Approve Manager",
      isDestructive: currentApproved,
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/admin/relationship-managers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isApproved: !currentApproved }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`Relationship Manager ${currentApproved ? "approval revoked" : "approved successfully"}`, "success");
        fetchRMs();
      } else {
        alert({
          title: "Update Failed",
          message: data.message || "Failed to update Relationship Manager status.",
          type: "danger",
        });
      }
    } catch (e) {
      alert({
        title: "Server Error",
        message: "Failed to update RM status due to a network error.",
        type: "danger",
      });
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2">
            <HeartHandshake className="w-3.5 h-3.5" />
            Curated Matchmaking Services
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Relationship Managers (RMs)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Dedicated matchmakers providing hand-picked introductions, pre-date vetting, and personalized feedback.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/admin/matchmaking"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Matchmaking Pipeline ({pendingRequestsCount} new)</span>
          </a>
        </div>
      </div>

      {/* RM WORKFLOW STEP BANNER */}
      <div className="p-5 rounded-2xl bg-[#0f172a] border border-white/10 shadow-lg space-y-2">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Governed RM Matching Flow
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 text-[10px] font-semibold text-center">
          {[
            "1. Package Select",
            "2. Values Profile",
            "3. RM Assigned",
            "4. Profile Vetting",
            "5. Match Suggestion",
            "6. Mutual Consent",
            "7. Date Scheduled",
            "8. Date Feedback",
          ].map((step, idx) => (
            <div key={idx} className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-300">
              {step}
            </div>
          ))}
        </div>
      </div>

      {/* RM DIRECTORY TABLE */}
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#131d2e] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5">Relationship Manager</th>
                <th className="px-4 py-3.5">Contact</th>
                <th className="px-4 py-3.5">City</th>
                <th className="px-4 py-3.5">Active Clients</th>
                <th className="px-4 py-3.5">Suggestions Made</th>
                <th className="px-4 py-3.5">Appointments</th>
                <th className="px-4 py-3.5">Approval</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500 animate-pulse">
                    Loading Relationship Managers...
                  </td>
                </tr>
              ) : managers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500 italic">
                    No relationship managers registered.
                  </td>
                </tr>
              ) : (
                managers.map((m) => (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#182337] border border-white/10 flex items-center justify-center font-bold text-white text-xs overflow-hidden shrink-0">
                          {m.profileImage ? (
                            <img src={m.profileImage} alt={m.name} className="w-full h-full object-cover" />
                          ) : (
                            m.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{m.name}</div>
                          <span className="text-[10px] text-slate-500 block">ID: {m.id.substring(0, 10)}...</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span>{m.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{m.phone || "N/A"}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4 capitalize">{m.city || "Unspecified"}</td>

                    <td className="px-4 py-4">
                      <span className="font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/15">
                        {m.assignedClientsCount || 0} clients
                      </span>
                    </td>

                    <td className="px-4 py-4 text-purple-300 font-bold">
                      {m.madeSuggestionsCount || 0}
                    </td>

                    <td className="px-4 py-4 text-slate-300">
                      {m.appointmentsCount || 0}
                    </td>

                    <td className="px-4 py-4">
                      {m.isApproved ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-bold text-xs">
                          <AlertTriangle className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleApproval(m.id, m.isApproved)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            m.isApproved
                              ? "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                              : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
                          }`}
                        >
                          {m.isApproved ? "Revoke" : "Approve"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
