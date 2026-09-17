"use client";

import React, { useEffect, useState } from "react";
import {
  Repeat,
  Search,
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  Clock,
  Gift,
  Calendar,
} from "lucide-react";

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchSubscriptions() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/services/subscriptions", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setSubscriptions(data.subscriptions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  async function handleUpdateStatus(id: string, newStatus: string) {
    if (!confirm(`Are you sure you want to change this subscription status to ${newStatus}?`)) return;
    try {
      const res = await fetch(`/api/admin/services/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchSubscriptions();
      }
    } catch (e) {
      alert("Failed to update subscription");
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
          <Repeat className="w-3.5 h-3.5" />
          Recurring Client Memberships
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Service Subscriptions
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Active memberships for Matchmaker concierge rosters and Breakup Buddy care circles.
        </p>
      </div>

      <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#131d2e] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5">Subscriber</th>
                <th className="px-4 py-3.5">Package</th>
                <th className="px-4 py-3.5">Cycle</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Start Date</th>
                <th className="px-4 py-3.5">Expiry Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500 animate-pulse">
                    Loading subscriptions...
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500 italic">
                    No active subscriptions recorded yet.
                  </td>
                </tr>
              ) : (
                subscriptions.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-4">
                      <div>
                        <div className="font-bold text-white">{s.userName}</div>
                        <span className="text-[10px] text-slate-400">{s.userEmail}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4 font-bold text-purple-300">
                      {s.packageName || s.serviceType}
                    </td>

                    <td className="px-4 py-4 text-slate-400">
                      {s.billingCycle}
                    </td>

                    <td className="px-4 py-4 text-emerald-400 font-bold">
                      ₹{s.amount}
                    </td>

                    <td className="px-4 py-4 text-slate-400">
                      {new Date(s.startDate).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-4 text-slate-300 font-semibold">
                      {new Date(s.expiryDate).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        s.status === "ACTIVE"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : s.status === "PAUSED"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-red-500/20 text-red-400"
                      }`}>
                        {s.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {s.status === "ACTIVE" ? (
                          <button
                            onClick={() => handleUpdateStatus(s.id, "PAUSED")}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-semibold hover:bg-amber-500/20"
                          >
                            Pause
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(s.id, "ACTIVE")}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20"
                          >
                            Resume
                          </button>
                        )}
                        <button
                          onClick={() => handleUpdateStatus(s.id, "CANCELLED")}
                          className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20"
                        >
                          Cancel
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
