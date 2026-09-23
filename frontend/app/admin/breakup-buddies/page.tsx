"use client";

import React, { useEffect, useState } from "react";
import {
  Heart,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Mail,
  Phone,
  Calendar,
  Sparkles,
} from "lucide-react";
import { useAdminDialog } from "@/components/admin/AdminDialogProvider";

export default function AdminBreakupBuddiesPage() {
  const { alert, confirm, toast } = useAdminDialog();
  const [buddies, setBuddies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchBuddies() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/breakup-buddies", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setBuddies(data.buddies);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBuddies();
  }, []);

  async function handleToggleApproval(id: string, currentApproved: boolean) {
    const actionName = currentApproved ? "suspend" : "approve";
    const confirmed = await confirm({
      title: `${currentApproved ? "Suspend" : "Approve"} Breakup Buddy`,
      message: `Are you sure you want to ${actionName} this Breakup Buddy?`,
      type: currentApproved ? "warning" : "confirm",
      confirmText: currentApproved ? "Suspend Buddy" : "Approve Buddy",
      isDestructive: currentApproved,
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/admin/breakup-buddies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isApproved: !currentApproved }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`Breakup Buddy successfully ${currentApproved ? "suspended" : "approved"}`, "success");
        fetchBuddies();
      } else {
        alert({
          title: "Update Failed",
          message: data.message || "Failed to update Breakup Buddy status.",
          type: "danger",
        });
      }
    } catch (e) {
      alert({
        title: "Server Error",
        message: "Failed to update Breakup Buddy status due to a network error.",
        type: "danger",
      });
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
            <Heart className="w-3.5 h-3.5" />
            Emotional Support & Listening Circles
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Breakup Buddies Roster
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Empathetic conversation partners and listeners. Dedicated, non-judgmental paid support for healing and moving forward.
          </p>
        </div>

        <a
          href="/admin/breakup-buddy/sessions"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition self-start sm:self-auto"
        >
          <Clock className="w-4 h-4" />
          <span>All Buddy Sessions</span>
        </a>
      </div>

      {/* SERVICE GOVERNANCE DISCLAIMER */}
      <div className="p-4 rounded-2xl bg-[#0f172a] border border-blue-500/20 text-xs text-slate-300 flex items-start gap-3">
        <div className="p-1 rounded-lg bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">ℹ️</div>
        <div>
          <strong className="text-white block">Operational Boundary Note:</strong>
          Breakup Buddy is governed strictly as an empathetic conversation and listening service. It is not licensed psychotherapy or medical clinical care.
        </div>
      </div>

      {/* BUDDIES TABLE */}
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#131d2e] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5">Breakup Buddy</th>
                <th className="px-4 py-3.5">Contact</th>
                <th className="px-4 py-3.5">Availability Window</th>
                <th className="px-4 py-3.5">Areas of Support</th>
                <th className="px-4 py-3.5">Sessions</th>
                <th className="px-4 py-3.5">Approval</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 animate-pulse">
                    Loading Breakup Buddies...
                  </td>
                </tr>
              ) : buddies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 italic">
                    No breakup buddies registered yet.
                  </td>
                </tr>
              ) : (
                buddies.map((b) => (
                  <tr key={b.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#182337] border border-white/10 flex items-center justify-center font-bold text-white text-xs overflow-hidden shrink-0">
                          {b.profilePhoto ? (
                            <img src={b.profilePhoto} alt={b.name} className="w-full h-full object-cover" />
                          ) : (
                            b.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{b.displayName || b.name}</div>
                          <span className="text-[10px] text-slate-500 block">{b.city || "Online"}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span>{b.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{b.phone || "N/A"}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="text-slate-200">
                        {b.availableTimeStart && b.availableTimeEnd
                          ? `${b.availableTimeStart} - ${b.availableTimeEnd}`
                          : "Flexible / On Request"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {b.areasOfExpertise?.length > 0 ? (
                          b.areasOfExpertise.slice(0, 2).map((a: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-slate-300">
                              {a}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 text-[11px]">Listening & Recovery</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="font-bold text-blue-400 px-2.5 py-0.5 rounded-full bg-blue-500/15">
                        {b.sessionsCount || 0} sessions
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      {b.isApproved ? (
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
                      <button
                        onClick={() => handleToggleApproval(b.id, b.isApproved)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          b.isApproved
                            ? "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
                        }`}
                      >
                        {b.isApproved ? "Suspend" : "Approve"}
                      </button>
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
