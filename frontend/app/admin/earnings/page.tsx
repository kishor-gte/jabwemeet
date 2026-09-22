"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  IndianRupee,
  TrendingUp,
  Calendar,
  CreditCard,
  ShieldCheck,
  Search,
  RefreshCw,
  Ticket,
  Heart,
  Sparkles,
  Layers,
  ArrowUpRight,
} from "lucide-react";

interface EarningItem {
  id: string;
  createdAt: string;
  sourceAmount: number;
  amount: number;
  userName: string;
  userEmail: string;
  paymentType: string;
  category: "EVENT_TICKET" | "DATING_PACKAGE" | "HOST_SUBSCRIPTION" | "OTHER";
  type: string;
  description: string;
  referenceId: string;
  gateway: string;
}

interface BreakdownCategory {
  count: number;
  volume: number;
  earned: number;
}

interface EarningsData {
  success: boolean;
  cutPercentage: number;
  totalEarned: number;
  totalVolume: number;
  count: number;
  breakdown?: {
    EVENT_TICKET: BreakdownCategory;
    DATING_PACKAGE: BreakdownCategory;
    HOST_SUBSCRIPTION: BreakdownCategory;
    OTHER: BreakdownCategory;
  };
  earnings: EarningItem[];
}

export default function AdminEarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchEarnings = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch("/api/admin/earnings", { credentials: "include" });
      const json = await res.json();

      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Error fetching admin earnings:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  // Filtered earnings based on category and search query
  const filteredEarnings = useMemo(() => {
    if (!data?.earnings) return [];

    return data.earnings.filter((item) => {
      // Category filter
      if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchName = item.userName?.toLowerCase().includes(q);
        const matchEmail = item.userEmail?.toLowerCase().includes(q);
        const matchRef = item.referenceId?.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchId = item.id?.toLowerCase().includes(q);
        return matchName || matchEmail || matchRef || matchDesc || matchId;
      }

      return true;
    });
  }, [data, selectedCategory, searchQuery]);

  if (loading) {
    return (
      <div className="p-8 text-slate-400 flex flex-col items-center justify-center h-80 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
        <div className="text-base font-semibold text-slate-300">Loading platform earnings data...</div>
      </div>
    );
  }

  const totalEarned = data?.totalEarned || 0;
  const totalVolume = data?.totalVolume || 0;
  const totalCount = data?.count || 0;
  const breakdown = data?.breakdown;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <IndianRupee className="w-3.5 h-3.5" />
            <span>Platform Revenue Share</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Earnings</h1>
          <p className="text-slate-400 mt-1 text-sm max-w-2xl">
            Track real-time platform revenue sharing. The system automatically retains a{" "}
            <span className="text-emerald-400 font-semibold">5% cut</span> from every package, event ticket booking, and payment across the website.
          </p>
        </div>

        <button
          onClick={() => fetchEarnings(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition active:scale-95 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${refreshing ? "animate-spin" : ""}`} />
          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>

      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Admin Cut (5%) */}
        <div className="bg-[#121b2b] rounded-3xl p-7 border border-emerald-500/30 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/15 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20">
              <IndianRupee className="w-6 h-6" />
            </div>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-500/20">

              5% Admin Share
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Total Admin Revenue</p>
            <h3 className="text-4xl font-black text-white">
              ₹{totalEarned.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-emerald-400 font-medium mt-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> 5% net retained from all website payments
            </p>
          </div>
        </div>

        {/* Total Platform Volume */}
        <div className="bg-[#121b2b] rounded-3xl p-7 border border-white/10 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center border border-blue-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-500/20">
              100% Gross
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Total Platform Payment Volume</p>
            <h3 className="text-4xl font-black text-white">
              ₹{totalVolume.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" /> Gross volume across all payment sources
            </p>
          </div>
        </div>

        {/* Total Transactions Count */}
        <div className="bg-[#121b2b] rounded-3xl p-7 border border-white/10 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center border border-purple-500/20">
              <CreditCard className="w-6 h-6" />
            </div>
            <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-xs font-bold uppercase tracking-wider border border-purple-500/20">
              Settled
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Total Completed Payments</p>
            <h3 className="text-4xl font-black text-white">{totalCount}</h3>
            <p className="text-xs text-slate-400 font-medium mt-3 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Razorpay & Platform verified transactions
            </p>
          </div>
        </div>
      </div>

      {/* CATEGORY BREAKDOWN PILLS */}
      {breakdown && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#0e1626] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Ticket className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-300">Event Tickets</p>
                <p className="text-[11px] text-slate-500">{breakdown.EVENT_TICKET?.count || 0} bookings</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white">
                ₹{(breakdown.EVENT_TICKET?.earned || 0).toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-emerald-400 font-medium">5% cut</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0e1626] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-300">Dating & Buddy Packages</p>
                <p className="text-[11px] text-slate-500">{breakdown.DATING_PACKAGE?.count || 0} purchases</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white">
                ₹{(breakdown.DATING_PACKAGE?.earned || 0).toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-emerald-400 font-medium">5% cut</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0e1626] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-300">Host Subscriptions</p>
                <p className="text-[11px] text-slate-500">{breakdown.HOST_SUBSCRIPTION?.count || 0} subscriptions</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white">
                ₹{(breakdown.HOST_SUBSCRIPTION?.earned || 0).toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-emerald-400 font-medium">5% cut</p>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY TABLE & FILTERS */}
      <div className="bg-[#0b1221] rounded-3xl border border-white/10 shadow-xl overflow-hidden">
        {/* Header & Controls */}
        <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Platform Earnings Ledger</h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 font-semibold ml-2">
              {filteredEarnings.length} records
            </span>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 text-xs">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search user, email, ref ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-60 pl-8 pr-3 py-2 rounded-xl bg-[#162136] border border-white/10 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            {/* Category Select Tabs */}
            <div className="inline-flex rounded-xl bg-[#162136] p-1 border border-white/10">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  selectedCategory === "ALL"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedCategory("EVENT_TICKET")}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  selectedCategory === "EVENT_TICKET"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Tickets
              </button>
              <button
                onClick={() => setSelectedCategory("DATING_PACKAGE")}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  selectedCategory === "DATING_PACKAGE"
                    ? "bg-pink-500/20 text-pink-300 border border-pink-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Packages
              </button>
              <button
                onClick={() => setSelectedCategory("HOST_SUBSCRIPTION")}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  selectedCategory === "HOST_SUBSCRIPTION"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Subscriptions
              </button>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        {filteredEarnings.length > 0 ? (
          <div className="divide-y divide-white/5">
            {filteredEarnings.map((e) => {
              const isTicket = e.category === "EVENT_TICKET";
              const isPackage = e.category === "DATING_PACKAGE";
              const isSubscription = e.category === "HOST_SUBSCRIPTION";

              return (
                <div
                  key={e.id}
                  className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-white/[0.02] transition"
                >
                  <div className="flex items-start gap-4 w-full md:w-auto">
                    {/* Category Icon */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                        isTicket
                          ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                          : isPackage
                          ? "bg-pink-500/10 border-pink-500/20 text-pink-400"
                          : isSubscription
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      {isTicket ? (
                        <Ticket className="w-6 h-6" />
                      ) : isPackage ? (
                        <Heart className="w-6 h-6" />
                      ) : isSubscription ? (
                        <Sparkles className="w-6 h-6" />
                      ) : (
                        <ShieldCheck className="w-6 h-6" />
                      )}
                    </div>

                    {/* Details */}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white text-base">
                          5% Cut — {e.userName}
                        </span>
                        <span className="text-xs text-slate-400">({e.userEmail})</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isTicket
                              ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                              : isPackage
                              ? "bg-pink-500/15 text-pink-300 border border-pink-500/30"
                              : isSubscription
                              ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                              : "bg-slate-500/15 text-slate-300 border border-slate-500/30"
                          }`}
                        >
                          {e.type}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 mt-1">{e.description}</p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(e.createdAt).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                        <span>•</span>
                        <span>Gateway: {e.gateway}</span>
                        <span>•</span>
                        <span className="font-mono text-[11px] text-slate-400">Ref: {e.referenceId}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="text-right w-full md:w-auto flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-white/5">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <ArrowUpRight className="w-4 h-4" />
                      <span className="text-2xl font-black">
                        + ₹{Number(e.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 mt-1">
                      from gross payment of{" "}
                      <span className="text-slate-200 font-semibold">
                        ₹{Number(e.sourceAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-16 text-center">
            <IndianRupee className="w-16 h-16 mx-auto text-white/10 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No matching earnings recorded</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `No transactions matched your search "${searchQuery}". Try a different keyword.`
                : "When users purchase dating packages, breakup buddy passes, event tickets, or host subscriptions, the 5% platform cut will automatically appear here."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

