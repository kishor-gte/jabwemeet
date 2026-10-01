"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  DollarSign,
  Users,
  Sparkles,
  Filter,
} from "lucide-react";
import { useAdminDialog } from "@/components/admin/AdminDialogProvider";

export default function AdminSubscriptionsPage() {
  const { alert, confirm, toast } = useAdminDialog();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  async function fetchSubscriptions() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/services/subscriptions", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setSubscriptions(data.subscriptions || []);
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
    const isCancelled = newStatus === "CANCELLED";
    const confirmed = await confirm({
      title: "Update Subscription",
      message: `Are you sure you want to change this subscription status to ${newStatus}?`,
      type: isCancelled ? "warning" : "confirm",
      confirmText: isCancelled ? "Cancel Subscription" : "Update Status",
      isDestructive: isCancelled,
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/services/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`Subscription marked as ${newStatus}`, "success");
        fetchSubscriptions();
      } else {
        alert({
          title: "Update Failed",
          message: data.message || "Failed to update subscription.",
          type: "danger",
        });
      }
    } catch (e) {
      alert({
        title: "Server Error",
        message: "Failed to update subscription due to a network error.",
        type: "danger",
      });
    }
  }

  // Filtered subscriptions
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((s) => {
      // Search
      const matchesSearch =
        !searchQuery ||
        s.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.packageName?.toLowerCase().includes(searchQuery.toLowerCase());

      // Service Filter
      const serviceType = s.serviceType || s.packageType || "";
      const matchesService =
        selectedService === "ALL" ||
        (selectedService === "HOST" && (serviceType.includes("HOST") || s.packageType === "HOST")) ||
        (selectedService === "BUDDY" && (serviceType.includes("BUDDY") || s.packageType === "BREAKUP_BUDDY")) ||
        (selectedService === "DATING" && (serviceType.includes("DATING") || serviceType.includes("RELATIONSHIP")));

      // Status Filter
      const matchesStatus =
        selectedStatus === "ALL" || s.status?.toUpperCase() === selectedStatus;

      return matchesSearch && matchesService && matchesStatus;
    });
  }, [subscriptions, searchQuery, selectedService, selectedStatus]);

  // Metric stats
  const totalCount = subscriptions.length;
  const activeCount = subscriptions.filter((s) => s.status === "ACTIVE").length;
  const totalRevenue = subscriptions.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const hostCount = subscriptions.filter(
    (s) => s.serviceType?.includes("HOST") || s.packageType === "HOST"
  ).length;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#7E2248] text-xs font-semibold mb-2">
          <Repeat className="w-3.5 h-3.5" />
          Active Subscriptions & Recurring Memberships
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
          Service Subscriptions
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Monitor all host subscriptions, matchmaker concierge rosters, and client service memberships.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-rose-100 rounded-3xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 uppercase font-serif font-semibold">Total Subscriptions</div>
            <div className="text-xl font-serif font-black text-slate-900">{totalCount}</div>
          </div>
        </div>

        <div className="bg-white border border-rose-100 rounded-3xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 uppercase font-serif font-semibold">Active Subscriptions</div>
            <div className="text-xl font-serif font-black text-emerald-700">{activeCount}</div>
          </div>
        </div>

        <div className="bg-white border border-rose-100 rounded-3xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 uppercase font-serif font-semibold">Total Revenue</div>
            <div className="text-xl font-serif font-black text-slate-900">₹{totalRevenue.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-white border border-rose-100 rounded-3xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#7E2248] shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 uppercase font-serif font-semibold">Host Subscriptions</div>
            <div className="text-xl font-serif font-black text-[#7E2248]">{hostCount}</div>
          </div>
        </div>
      </div>

      {/* Controls / Filter bar */}
      <div className="bg-white border border-rose-100 rounded-3xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by subscriber or package..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#FAF3F6]/50 border border-rose-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Service Type Filter */}
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="bg-[#FAF3F6]/50 border border-rose-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#7E2248] focus:bg-white font-medium"
          >
            <option value="ALL">All Services</option>
            <option value="HOST">Host Subscriptions</option>
            <option value="BUDDY">Breakup Buddy</option>
            <option value="DATING">Dating / Matchmaker</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#FAF3F6]/50 border border-rose-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#7E2248] focus:bg-white font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-rose-100 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-rose-50/60 text-[11px] font-serif font-bold uppercase tracking-wider text-slate-500 border-b border-rose-100">
              <tr>
                <th className="px-5 py-3.5">Subscriber</th>
                <th className="px-4 py-3.5">Service Type</th>
                <th className="px-4 py-3.5">Package</th>
                <th className="px-4 py-3.5">Cycle</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Start Date</th>
                <th className="px-4 py-3.5">Expiry Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-500 animate-pulse">
                    Loading subscriptions...
                  </td>
                </tr>
              ) : filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-500 italic">
                    {subscriptions.length === 0
                      ? "No active subscriptions recorded yet."
                      : "No subscriptions match your search filters."}
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((s) => {
                  const isHost =
                    s.serviceType?.includes("HOST") || s.packageType === "HOST";

                  return (
                    <tr key={s.id} className="hover:bg-rose-50/30 transition">
                      <td className="px-5 py-4">
                        <div>
                          <div className="font-serif font-bold text-slate-900">{s.userName}</div>
                          <span className="text-[10px] text-slate-500">{s.userEmail}</span>
                          {s.userPhone && (
                            <div className="text-[10px] text-slate-400">{s.userPhone}</div>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isHost
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : s.serviceType?.includes("BUDDY")
                              ? "bg-rose-50 text-[#7E2248] border border-rose-200"
                              : "bg-blue-50 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {isHost ? "Host Plan" : s.serviceType || "Service"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-serif font-bold text-slate-900 capitalize">{s.packageName || s.serviceType}</div>
                        {(s.sessionLimit || s.maxEvents) && (
                          <span className="text-[10px] text-slate-500">
                            {s.sessionLimit || s.maxEvents} Events Quota
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {s.billingCycle}
                      </td>

                      <td className="px-4 py-4 text-emerald-700 font-serif font-black">
                        ₹{s.amount}
                      </td>

                      <td className="px-4 py-4 text-slate-500">
                        {new Date(s.startDate).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-4 text-slate-800 font-semibold">
                        {new Date(s.expiryDate).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            s.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : s.status === "PAUSED"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {s.status === "ACTIVE" ? (
                            <button
                              onClick={() => handleUpdateStatus(s.id, "PAUSED")}
                              className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 text-xs font-semibold hover:bg-amber-100 border border-amber-200 transition"
                            >
                              Pause
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(s.id, "ACTIVE")}
                              className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 border border-emerald-200 transition"
                            >
                              Resume
                            </button>
                          )}
                          <button
                            onClick={() => handleUpdateStatus(s.id, "CANCELLED")}
                            className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 border border-rose-200 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
