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
    <div className="space-y-8 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#7E2248] text-xs font-semibold mb-2">
            <IndianRupee className="w-3.5 h-3.5" />
            <span>Platform Revenue Share</span>
          </div>
          <h1 className="text-3xl font-serif font-black text-slate-900 tracking-tight">Admin Earnings</h1>
          <p className="text-slate-500 mt-1 text-sm max-w-2xl">
            Track real-time platform revenue sharing. The system automatically retains a{" "}
            <span className="text-[#7E2248] font-bold">5% cut</span> from every package, event ticket booking, and payment across the website.
          </p>
        </div>

        <button
          onClick={() => fetchEarnings(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold text-slate-700 transition active:scale-95 self-start sm:self-auto shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#7E2248] ${refreshing ? "animate-spin" : ""}`} />
          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Admin Cut (5%) */}
        <div className="bg-white rounded-3xl p-7 border-2 border-rose-200 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-100/40 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-12 h-12 bg-rose-50 text-[#7E2248] rounded-2xl flex items-center justify-center border border-rose-200">
              <IndianRupee className="w-6 h-6" />
            </div>
            <span className="px-3 py-1 bg-rose-100 text-[#7E2248] rounded-full text-xs font-bold uppercase tracking-wider border border-rose-200">
              5% Admin Share
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-[11px] uppercase font-serif font-bold text-slate-500 tracking-wider mb-1">Total Admin Revenue</p>
            <h3 className="text-4xl font-serif font-black text-slate-900">
              ₹{totalEarned.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-[#7E2248] font-semibold mt-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> 5% net retained from all website payments
            </p>
          </div>
        </div>

        {/* Total Platform Volume */}
        <div className="bg-white rounded-3xl p-7 border border-rose-100 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center border border-blue-200">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-200">
              100% Gross
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-[11px] uppercase font-serif font-bold text-slate-500 tracking-wider mb-1">Total Platform Payment Volume</p>
            <h3 className="text-4xl font-serif font-black text-slate-900">
              ₹{totalVolume.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" /> Gross volume across all payment sources
            </p>
          </div>
        </div>

        {/* Total Transactions Count */}
        <div className="bg-white rounded-3xl p-7 border border-rose-100 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-12 h-12 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center border border-purple-200">
              <CreditCard className="w-6 h-6" />
            </div>
            <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider border border-purple-200">
              Settled
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-[11px] uppercase font-serif font-bold text-slate-500 tracking-wider mb-1">Total Completed Payments</p>
            <h3 className="text-4xl font-serif font-black text-slate-900">{totalCount}</h3>
            <p className="text-xs text-slate-500 font-medium mt-3 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> Razorpay & Platform verified transactions
            </p>
          </div>
        </div>
      </div>

      {/* CATEGORY BREAKDOWN PILLS */}
      {breakdown && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-3xl bg-white border border-rose-100 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
                <Ticket className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-serif font-bold text-slate-900">Event Tickets</p>
                <p className="text-[11px] text-slate-500">{breakdown.EVENT_TICKET?.count || 0} bookings</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-serif font-bold text-slate-900">
                ₹{(breakdown.EVENT_TICKET?.earned || 0).toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-emerald-700 font-bold">5% cut</p>
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-rose-100 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#7E2248] flex items-center justify-center border border-rose-100">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-serif font-bold text-slate-900">Dating & Buddy Packages</p>
                <p className="text-[11px] text-slate-500">{breakdown.DATING_PACKAGE?.count || 0} purchases</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-serif font-bold text-slate-900">
                ₹{(breakdown.DATING_PACKAGE?.earned || 0).toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-emerald-700 font-bold">5% cut</p>
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-rose-100 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-serif font-bold text-slate-900">Host Subscriptions</p>
                <p className="text-[11px] text-slate-500">{breakdown.HOST_SUBSCRIPTION?.count || 0} subscriptions</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-serif font-bold text-slate-900">
                ₹{(breakdown.HOST_SUBSCRIPTION?.earned || 0).toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-emerald-700 font-bold">5% cut</p>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY TABLE & FILTERS */}
      <div className="bg-white rounded-3xl border border-rose-100 shadow-xs overflow-hidden">
        {/* Header & Controls */}
        <div className="p-6 border-b border-rose-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#7E2248]" />
            <h3 className="text-lg font-serif font-bold text-slate-900">Platform Earnings Ledger</h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-slate-600 font-semibold ml-2">
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
                className="w-full sm:w-60 pl-8 pr-3 py-2 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#7E2248] focus:bg-white"
              />
            </div>

            {/* Category Select Tabs */}
            <div className="inline-flex rounded-xl bg-rose-50/70 p-1 border border-rose-200">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  selectedCategory === "ALL"
                    ? "bg-white text-[#7E2248] shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedCategory("EVENT_TICKET")}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  selectedCategory === "EVENT_TICKET"
                    ? "bg-white text-[#7E2248] shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tickets
              </button>
              <button
                onClick={() => setSelectedCategory("DATING_PACKAGE")}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  selectedCategory === "DATING_PACKAGE"
                    ? "bg-white text-[#7E2248] shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Packages
              </button>
              <button
                onClick={() => setSelectedCategory("HOST_SUBSCRIPTION")}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  selectedCategory === "HOST_SUBSCRIPTION"
                    ? "bg-white text-[#7E2248] shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Subscriptions
              </button>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        {filteredEarnings.length > 0 ? (
          <div className="divide-y divide-rose-50">
            {filteredEarnings.map((e) => {
              const isTicket = e.category === "EVENT_TICKET";
              const isPackage = e.category === "DATING_PACKAGE";
              const isSubscription = e.category === "HOST_SUBSCRIPTION";

              return (
                <div
                  key={e.id}
                  className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-rose-50/30 transition"
                >
                  <div className="flex items-start gap-4 w-full md:w-auto">
                    {/* Category Icon */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                        isTicket
                          ? "bg-purple-50 border-purple-200 text-purple-700"
                          : isPackage
                          ? "bg-rose-50 border-rose-200 text-[#7E2248]"
                          : isSubscription
                          ? "bg-amber-50 border-amber-200 text-amber-700"
                          : "bg-emerald-50 border-emerald-200 text-emerald-700"
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
                        <span className="font-serif font-bold text-slate-900 text-base">
                          5% Cut — {e.userName}
                        </span>
                        <span className="text-xs text-slate-500">({e.userEmail})</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isTicket
                              ? "bg-purple-100 text-purple-700 border border-purple-200"
                              : isPackage
                              ? "bg-rose-100 text-[#7E2248] border border-rose-200"
                              : isSubscription
                              ? "bg-amber-100 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {e.type}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-1">{e.description}</p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
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
                        <span className="font-mono text-[11px] text-slate-500">Ref: {e.referenceId}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="text-right w-full md:w-auto flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-rose-100">
                    <div className="flex items-center gap-1.5 text-emerald-700">
                      <ArrowUpRight className="w-4 h-4" />
                      <span className="text-2xl font-serif font-black">
                        + ₹{Number(e.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 mt-1">
                      from gross payment of{" "}
                      <span className="text-slate-800 font-bold">
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
            <IndianRupee className="w-16 h-16 mx-auto text-rose-200 mb-4" />
            <h3 className="text-lg font-serif font-bold text-slate-900 mb-2">No matching earnings recorded</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
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

