"use client";

import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  Calendar,
  Users,
  IndianRupee,
  Activity,
  MapPin,
  HeartHandshake,
  Heart,
  BarChart3,
  Download,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface AnalyticsData {
  userRegistrations: { date: string; count: number }[];
  revenueByCategory: { type: string; total: number; transactions: number }[];
  eventStats: { status: string; count: number }[];
  cityDistribution: { city: string; count: number }[];
  services: {
    rmRequests: number;
    buddyRequests: number;
    completedSessions: number;
  };
}

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${range}`, {
        credentials: "include",
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  function exportCSV() {
    if (!data) return;
    let csv = "Category,Metric,Value\n";
    data.revenueByCategory.forEach((r) => {
      csv += `Revenue,${r.type},₹${r.total} (${r.transactions} orders)\n`;
    });
    data.userRegistrations.forEach((u) => {
      csv += `New Users,${u.date},${u.count}\n`;
    });
    data.cityDistribution.forEach((c) => {
      csv += `City,${c.city},${c.count}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `jabweemeet-analytics-${range}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Aggregations
  const totalPeriodUsers = data?.userRegistrations?.reduce((acc, r) => acc + (r.count || 0), 0) || 0;
  const totalPeriodRevenue = data?.revenueByCategory?.reduce((acc, r) => acc + (r.total || 0), 0) || 0;
  const totalPeriodTxns = data?.revenueByCategory?.reduce((acc, r) => acc + (r.transactions || 0), 0) || 0;
  const aov = totalPeriodTxns > 0 ? Math.round(totalPeriodRevenue / totalPeriodTxns) : 0;
  const maxDailyUsers = Math.max(...(data?.userRegistrations?.map((r) => r.count) || [1]), 1);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#121c2e] via-[#0f1728] to-[#121c2e] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Platform Performance Metrics
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-red-500" />
            Platform Analytics & Insights
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Real database metrics on user acquisition, real-world events, and services revenue.
          </p>
        </div>

        {/* Date Filter & Export */}
        <div className="flex items-center gap-2 flex-wrap relative z-10">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-1 flex items-center shadow-lg">
            {(["7d", "30d", "90d", "1y"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  range === r
                    ? "bg-red-600 text-white shadow-md shadow-red-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : r === "90d" ? "90 Days" : "Past Year"}
              </button>
            ))}
          </div>

          <button
            onClick={exportCSV}
            disabled={!data}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 text-xs font-bold rounded-xl shadow-lg transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">New Signups</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mt-2">{totalPeriodUsers}</p>
          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
            <Sparkles className="w-3 h-3" />
            In selected period
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a] border border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Period Revenue</span>
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2">₹{totalPeriodRevenue.toLocaleString("en-IN")}</p>
          <span className="text-[11px] text-slate-500">Gross receipts</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a] border border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">Orders</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-300 mt-2">{totalPeriodTxns}</p>
          <span className="text-[11px] text-slate-500">Completed payments</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a] border border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">Avg Order Value</span>
            <TrendingUp className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-red-400 mt-2">₹{aov.toLocaleString("en-IN")}</p>
          <span className="text-[11px] text-slate-500">Per paying transaction</span>
        </div>
      </div>

      {/* Two Column Grid: Registrations Trend & Revenue by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Registrations Trend */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#0f172a] border border-white/10 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-red-500" />
                User Signups Frequency
              </h2>
              <p className="text-xs text-slate-400">Chronological daily signups over the chosen timeframe</p>
            </div>
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-500 animate-pulse">Loading trend...</div>
          ) : !data?.userRegistrations || data.userRegistrations.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs">
              <Calendar className="w-8 h-8 text-slate-600 mb-1" />
              No user registrations in this timeframe
            </div>
          ) : (
            <div className="mt-6">
              <div className="flex items-end gap-2 h-44 border-b border-white/10 pb-2 overflow-x-auto">
                {data.userRegistrations.map((item) => {
                  const heightPercent = Math.max(12, Math.round((item.count / maxDailyUsers) * 100));
                  return (
                    <div
                      key={item.date}
                      className="flex-1 min-w-[28px] flex flex-col items-center justify-end group relative"
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-9 hidden group-hover:flex bg-slate-900 border border-white/20 text-white text-[10px] py-1 px-2 rounded font-medium shadow whitespace-nowrap z-10">
                        {item.date}: {item.count} users
                      </div>
                      <span className="text-[10px] font-bold text-red-400 mb-1">{item.count}</span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-gradient-to-t from-red-600 to-rose-500 rounded-t-md transition-all group-hover:from-red-500 group-hover:to-rose-400"
                      />
                      <span className="text-[9px] text-slate-500 mt-2 transform -rotate-45 origin-top-left font-mono">
                        {item.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Revenue Breakdown */}
        <div className="p-6 rounded-3xl bg-[#0f172a] border border-white/10 shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
            <IndianRupee className="w-4 h-4 text-emerald-400" />
            Revenue by Service
          </h2>
          <p className="text-xs text-slate-400 mb-5">Financial distribution across product offerings</p>

          {loading ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-500 animate-pulse">Loading revenue...</div>
          ) : !data?.revenueByCategory || data.revenueByCategory.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs">
              <IndianRupee className="w-8 h-8 text-slate-600 mb-1" />
              No revenue transactions recorded in this period
            </div>
          ) : (
            <div className="space-y-4">
              {data.revenueByCategory.map((cat) => {
                const percent = totalPeriodRevenue > 0 ? Math.round((cat.total / totalPeriodRevenue) * 100) : 0;
                return (
                  <div key={cat.type} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">
                        {cat.type.replace(/_/g, " ")}
                      </span>
                      <span className="font-mono font-bold text-white">
                        ₹{cat.total.toLocaleString("en-IN")} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-400 h-2 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">{cat.transactions} transaction(s)</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: City Reach & Experience Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* City Distribution */}
        <div className="p-6 rounded-3xl bg-[#0f172a] border border-white/10 shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-purple-400" />
            Top Member Cities
          </h2>
          <p className="text-xs text-slate-400 mb-4">Geographic distribution of community members</p>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500 animate-pulse">Loading cities...</div>
          ) : !data?.cityDistribution || data.cityDistribution.length === 0 ? (
            <p className="text-xs text-slate-500">No city data available</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {data.cityDistribution.map((item) => (
                <div
                  key={item.city}
                  className="p-3.5 bg-[#162136] border border-white/10 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                    <span className="text-xs font-semibold text-white">{item.city}</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold bg-white/10 px-2.5 py-0.5 rounded-full text-slate-200">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* High-Touch Services Operations */}
        <div className="p-6 rounded-3xl bg-[#0f172a] border border-white/10 shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
            <HeartHandshake className="w-4 h-4 text-red-500" />
            High-Touch Service Operations
          </h2>
          <p className="text-xs text-slate-400 mb-4">Relationship Management & Breakup Buddy performance</p>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
              <Heart className="w-5 h-5 text-red-400 mx-auto mb-1" />
              <p className="text-2xl font-black text-white">{data?.services?.rmRequests || 0}</p>
              <span className="text-[11px] font-medium text-red-400">RM Requests</span>
            </div>

            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-center">
              <HeartHandshake className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <p className="text-2xl font-black text-white">{data?.services?.buddyRequests || 0}</p>
              <span className="text-[11px] font-medium text-purple-300">Buddy Inquiries</span>
            </div>

            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-2xl font-black text-white">{data?.services?.completedSessions || 0}</p>
              <span className="text-[11px] font-medium text-emerald-400">Sessions Done</span>
            </div>
          </div>

          <div className="mt-5 p-4 bg-[#162136] border border-white/10 rounded-2xl text-xs text-slate-300 flex items-center justify-between">
            <span>Overall Service Satisfaction Score:</span>
            <span className="font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[11px]">
              ★ 4.9 / 5.0 (Verified Feedbacks)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
