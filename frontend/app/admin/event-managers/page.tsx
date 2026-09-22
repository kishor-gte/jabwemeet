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

export default function AdminEventManagersPage() {
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
    if (!confirm(`Are you sure you want to ${currentApproved ? "suspend" : "approve"} this Event Host?`)) return;
    try {
      const res = await fetch(`/api/admin/event-managers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isApproved: !currentApproved }),
      });
      const data = await res.json();
      if (data.success) {
        fetchManagers();
      } else {
        alert(data.message || "Failed to update status");
      }
    } catch (e) {
      alert("Failed to update status");
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
          <UserCheck className="w-3.5 h-3.5" />
          Field Operations
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Event Managers & Hosts
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Hosts responsible for running in-person singles mixers, speed dating tables, and travel meetups.
        </p>
      </div>

      <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#131d2e] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
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
            <tbody className="divide-y divide-white/5 font-medium">
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
                  <tr key={m.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-4">
                      <div>
                        <div className="font-bold text-white text-sm">{m.name}</div>
                        <span className="text-[10px] text-slate-500 block">ID: {m.id.substring(0, 10)}...</span>
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
                      <span className="font-bold text-white px-2 py-0.5 rounded-full bg-white/5">
                        {m.assignedEventsCount || 0} events
                      </span>
                    </td>

                    <td className="px-4 py-4 text-emerald-400 font-bold">
                      {m.upcomingEventsCount || 0}
                    </td>

                    <td className="px-4 py-4 text-slate-400">
                      {m.completedEventsCount || 0}
                    </td>

                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        m.status === "ACTIVE" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                      }`}>
                        {m.status || "ACTIVE"}
                      </span>
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
                      <button
                        onClick={() => handleToggleApproval(m.id, m.isApproved)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          m.isApproved
                            ? "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
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
