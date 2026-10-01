"use client";

import React, { useEffect, useState } from "react";
import {
  UserCheck,
  Calendar,
  Search,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  Building,
} from "lucide-react";
import { useAdminDialog } from "@/components/admin/AdminDialogProvider";

export default function AdminEventManagersPage() {
  const { alert, confirm, toast } = useAdminDialog();
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchManagers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/event-managers", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setManagers(data.managers);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchManagers();
  }, []);

  async function handleToggleApproval(id: string, currentApproved: boolean) {
    const actionName = currentApproved ? "suspend" : "approve";
    const confirmed = await confirm({
      title: `${currentApproved ? "Suspend" : "Approve"} Event Host`,
      message: `Are you sure you want to ${actionName} this Event Host?`,
      type: currentApproved ? "warning" : "confirm",
      confirmText: currentApproved ? "Suspend Host" : "Approve Host",
      isDestructive: currentApproved,
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/event-managers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isApproved: !currentApproved }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`Event Host successfully ${currentApproved ? "suspended" : "approved"}`, "success");
        fetchManagers();
      } else {
        alert({
          title: "Update Failed",
          message: data.message || "Failed to update host status.",
          type: "danger",
        });
      }
    } catch (e) {
      alert({
        title: "Server Error",
        message: "Failed to update host status due to a network error.",
        type: "danger",
      });
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#7E2248] text-xs font-semibold mb-2">
          <UserCheck className="w-3.5 h-3.5" />
          Field Operations
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
          Event Managers & Hosts
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Hosts responsible for running in-person singles mixers, speed dating tables, and travel meetups.
        </p>
      </div>

      <div className="bg-white border border-rose-100 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-rose-50/60 text-[11px] font-serif font-bold uppercase tracking-wider text-slate-500 border-b border-rose-100">
              <tr>
                <th className="px-5 py-3.5">Host / Manager</th>
                <th className="px-4 py-3.5">Contact</th>
                <th className="px-4 py-3.5">City</th>
                <th className="px-4 py-3.5">Assigned Events</th>
                <th className="px-4 py-3.5">Upcoming</th>
                <th className="px-4 py-3.5">Completed</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Approval</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-500 animate-pulse">
                    Loading Event Managers...
                  </td>
                </tr>
              ) : managers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-500 italic">
                    No event hosts registered yet.
                  </td>
                </tr>
              ) : (
                managers.map((m) => (
                  <tr key={m.id} className="hover:bg-rose-50/30 transition">
                    <td className="px-5 py-4">
                      <div>
                        <div className="font-serif font-bold text-slate-900 text-sm">{m.name}</div>
                        <span className="text-[10px] text-slate-400 block font-mono">ID: {m.id.substring(0, 10)}...</span>
                      </div>
                    </td>

                    <td className="px-4 py-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{m.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{m.phone || "N/A"}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4 capitalize text-slate-600">{m.city || "Unspecified"}</td>

                    <td className="px-4 py-4">
                      <span className="font-bold text-slate-800 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-100">
                        {m.assignedEventsCount || 0} events
                      </span>
                    </td>

                    <td className="px-4 py-4 text-emerald-700 font-bold">
                      {m.upcomingEventsCount || 0}
                    </td>

                    <td className="px-4 py-4 text-slate-500">
                      {m.completedEventsCount || 0}
                    </td>

                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        m.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}>
                        {m.status || "ACTIVE"}
                      </span>
                    </td>
                    
                    <td className="px-4 py-4">
                      {m.isApproved ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-xs">
                          <AlertTriangle className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleToggleApproval(m.id, m.isApproved)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          m.isApproved
                            ? "bg-rose-50 hover:bg-rose-100 text-slate-700 border border-rose-200 shadow-2xs"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20"
                        }`}
                      >
                        {m.isApproved ? "Suspend" : "Approve"}
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
