"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  HeartHandshake,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  AlertTriangle,
  Search,
  Sparkles,
  Users,
  Check,
  Play,
  RotateCcw,
  Ban,
  Heart,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAdminDialog } from "@/components/admin/AdminDialogProvider";

export default function AdminDatesSchedulingPage() {
  const { alert, confirm, toast } = useAdminDialog();
  const router = useRouter();
  const [dates, setDates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "ONGOING" | "DONE" | "SCHEDULED" | "CANCELLED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function fetchDates() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dates", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setDates(data.dates || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDates();
  }, []);

  async function handleUpdateStatus(id: string, newStatus: string) {
    const isCancelled = newStatus === "CANCELLED";
    const confirmed = await confirm({
      title: "Update Date Status",
      message: `Are you sure you want to update this date status to "${newStatus}"?`,
      type: isCancelled ? "warning" : "confirm",
      confirmText: isCancelled ? "Cancel Date" : "Update Status",
      isDestructive: isCancelled,
    });
    if (!confirmed) return;

    try {
      setUpdatingId(id);
      const res = await fetch(`/api/admin/dates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`Date status updated to ${newStatus}`, "success");
        fetchDates();
      } else {
        alert({
          title: "Update Failed",
          message: data.message || "Failed to update date status.",
          type: "danger",
        });
      }
    } catch (e) {
      alert({
        title: "Server Error",
        message: "An error occurred while updating the date.",
        type: "danger",
      });
    } finally {
      setUpdatingId(null);
    }
  }

  // Filtered dates
  const filteredDates = useMemo(() => {
    return dates.filter((d) => {
      // Tab filter
      const statusUpper = (d.status || "").toUpperCase();
      const matchesTab =
        activeTab === "ALL" ||
        (activeTab === "ONGOING" && statusUpper === "ONGOING") ||
        (activeTab === "DONE" && (statusUpper === "DONE" || statusUpper === "COMPLETED")) ||
        (activeTab === "SCHEDULED" && statusUpper === "SCHEDULED") ||
        (activeTab === "CANCELLED" && (statusUpper === "CANCELLED" || statusUpper === "REJECTED"));

      // Search filter
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        d.client?.name?.toLowerCase().includes(q) ||
        d.client?.phone?.includes(q) ||
        d.partner?.name?.toLowerCase().includes(q) ||
        d.partner?.phone?.includes(q) ||
        d.matchmaker?.name?.toLowerCase().includes(q) ||
        d.venue?.toLowerCase().includes(q) ||
        d.location?.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [dates, activeTab, searchQuery]);

  // Metric counts
  const countAll = dates.length;
  const countOngoing = dates.filter((d) => d.status?.toUpperCase() === "ONGOING").length;
  const countDone = dates.filter(
    (d) => d.status?.toUpperCase() === "DONE" || d.status?.toUpperCase() === "COMPLETED"
  ).length;
  const countScheduled = dates.filter((d) => d.status?.toUpperCase() === "SCHEDULED").length;
  const countCancelled = dates.filter(
    (d) => d.status?.toUpperCase() === "CANCELLED" || d.status?.toUpperCase() === "REJECTED"
  ).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white border border-rose-200 text-slate-700 hover:text-slate-900 hover:bg-rose-50 transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#7E2248] text-xs font-semibold mb-1">
              <Calendar className="w-3.5 h-3.5 text-[#7E2248]" />
              Curated Meetings Desk
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
              Curated Date Scheduling & Progress
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Live tracking and status management for ongoing, completed, and scheduled dates.
            </p>
          </div>
        </div>

        <button
          onClick={fetchDates}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-xs font-semibold text-slate-700 flex items-center gap-2 self-start sm:self-auto transition shadow-xs"
        >
          <RotateCcw className={`w-3.5 h-3.5 text-[#7E2248] ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab("ALL")}
          className={`cursor-pointer bg-white border ${
            activeTab === "ALL" ? "border-[#7E2248] ring-1 ring-[#7E2248]" : "border-rose-100"
          } rounded-3xl p-4 transition hover:border-rose-300 shadow-xs`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">All Dates</span>
            <Calendar className="w-4 h-4 text-[#7E2248]" />
          </div>
          <div className="text-2xl font-serif font-black text-slate-900 mt-1">{countAll}</div>
        </div>

        <div
          onClick={() => setActiveTab("ONGOING")}
          className={`cursor-pointer bg-white border ${
            activeTab === "ONGOING" ? "border-emerald-600 ring-1 ring-emerald-600" : "border-rose-100"
          } rounded-3xl p-4 transition hover:border-emerald-300 shadow-xs`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-emerald-700 uppercase font-bold tracking-wider">Ongoing / Today</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-2xl font-serif font-black text-emerald-700 mt-1">{countOngoing}</div>
        </div>

        <div
          onClick={() => setActiveTab("DONE")}
          className={`cursor-pointer bg-white border ${
            activeTab === "DONE" ? "border-blue-600 ring-1 ring-blue-600" : "border-rose-100"
          } rounded-3xl p-4 transition hover:border-blue-300 shadow-xs`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-blue-700 uppercase font-bold tracking-wider">Done / Completed</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-serif font-black text-blue-700 mt-1">{countDone}</div>
        </div>

        <div
          onClick={() => setActiveTab("SCHEDULED")}
          className={`cursor-pointer bg-white border ${
            activeTab === "SCHEDULED" ? "border-amber-600 ring-1 ring-amber-600" : "border-rose-100"
          } rounded-3xl p-4 transition hover:border-amber-300 shadow-xs`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-amber-700 uppercase font-bold tracking-wider">Scheduled</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-serif font-black text-amber-700 mt-1">{countScheduled}</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white border border-rose-100 rounded-3xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: "ALL", label: "All", count: countAll },
            { id: "ONGOING", label: "Ongoing", count: countOngoing },
            { id: "DONE", label: "Done", count: countDone },
            { id: "SCHEDULED", label: "Scheduled", count: countScheduled },
            { id: "CANCELLED", label: "Cancelled", count: countCancelled },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "bg-[#7E2248] text-white shadow-xs font-bold"
                  : "bg-rose-50 text-slate-700 hover:text-slate-900 border border-rose-100"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === tab.id ? "bg-black/20 text-white" : "bg-white text-slate-600 border border-rose-200"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search participant, matchmaker, venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#FAF3F6]/50 border border-rose-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white"
          />
        </div>
      </div>

      {/* Dates Table */}
      <div className="bg-white border border-rose-100 rounded-3xl overflow-hidden shadow-xs">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-rose-50/60 text-[11px] font-serif font-bold uppercase tracking-wider text-slate-500 border-b border-rose-100">
              <tr>
                <th className="px-5 py-3.5">Matched Couple</th>
                <th className="px-4 py-3.5">Relationship Manager</th>
                <th className="px-4 py-3.5">Scheduled Date & Time</th>
                <th className="px-4 py-3.5">Venue & Location</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 animate-pulse">
                    Loading dates schedule...
                  </td>
                </tr>
              ) : filteredDates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 italic">
                    {dates.length === 0
                      ? "No dates scheduled in the database yet."
                      : `No ${activeTab.toLowerCase()} dates found matching your filter.`}
                  </td>
                </tr>
              ) : (
                filteredDates.map((d) => {
                  const isOngoing = d.status === "Ongoing";
                  const isDone = d.status === "Done" || d.status === "Completed";
                  const isCancelled = d.status === "Cancelled" || d.status === "Rejected";
                  const isUpdating = updatingId === d.id;

                  return (
                    <tr key={d.id} className="hover:bg-rose-50/30 transition">
                      {/* Matched Couple */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {/* Member 1 */}
                          <div>
                            <div className="font-bold text-slate-900 text-sm">
                              {d.client?.name || "Client Member"}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                              {d.client?.phone && <span>{d.client.phone}</span>}
                              {d.client?.gender && <span>• {d.client.gender}</span>}
                              {d.client?.city && <span>• {d.client.city}</span>}
                            </div>
                          </div>

                          {/* Heart icon separator if matched pair */}
                          {d.partner ? (
                            <>
                              <div className="w-6 h-6 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-[#7E2248] shrink-0">
                                <Heart className="w-3.5 h-3.5 fill-rose-200" />
                              </div>

                              {/* Member 2 */}
                              <div>
                                <div className="font-bold text-[#7E2248] text-sm">
                                  {d.partner.name || "Matched Partner"}
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                                  {d.partner.phone && <span>{d.partner.phone}</span>}
                                  {d.partner.gender && <span>• {d.partner.gender}</span>}
                                  {d.partner.city && <span>• {d.partner.city}</span>}
                                </div>
                              </div>
                            </>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-slate-600 border border-rose-100">
                              Direct Consultation
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Relationship Manager / Matchmaker */}
                      <td className="px-4 py-4 text-[#7E2248] font-semibold">
                        <div className="flex items-center gap-1.5">
                          <HeartHandshake className="w-3.5 h-3.5 text-[#7E2248] shrink-0" />
                          <span>{d.matchmaker?.name || "Senior Matchmaker"}</span>
                        </div>
                      </td>

                      {/* Scheduled Date & Time */}
                      <td className="px-4 py-4 text-slate-700">
                        <div className="font-bold text-slate-900">
                          {new Date(d.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{d.time || "Scheduled Time"}</span>
                          {isOngoing && (
                            <span className="ml-1 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase border border-emerald-200">
                              Today
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Venue & Location */}
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#7E2248] shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-slate-800 capitalize">
                              {d.venue || d.mode || "Venue Table"}
                            </div>
                            <div className="text-[10px] text-slate-500 capitalize">
                              {d.location || "City Location"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            isOngoing
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isDone
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : isCancelled
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {isOngoing && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                          {isDone && <Check className="w-3 h-3 text-blue-600" />}
                          {d.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isOngoing && !isDone && (
                            <button
                              onClick={() => handleUpdateStatus(d.id, "Ongoing")}
                              disabled={isUpdating}
                              title="Mark as Ongoing"
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 border border-emerald-200 transition flex items-center gap-1"
                            >
                              <Play className="w-3 h-3" /> Ongoing
                            </button>
                          )}

                          {!isDone && (
                            <button
                              onClick={() => handleUpdateStatus(d.id, "Done")}
                              disabled={isUpdating}
                              title="Mark as Done"
                              className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 border border-blue-200 transition flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Mark Done
                            </button>
                          )}

                          {!isCancelled && (
                            <button
                              onClick={() => handleUpdateStatus(d.id, "Cancelled")}
                              disabled={isUpdating}
                              title="Cancel Date"
                              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1"
                            >
                              <Ban className="w-3 h-3" /> Cancel
                            </button>
                          )}

                          {isDone && (
                            <button
                              onClick={() => handleUpdateStatus(d.id, "Ongoing")}
                              disabled={isUpdating}
                              title="Reopen as Ongoing"
                              className="px-2.5 py-1 rounded-lg bg-rose-50 text-slate-600 text-xs font-semibold hover:bg-rose-100 border border-rose-200 transition"
                            >
                              Reopen
                            </button>
                          )}
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
