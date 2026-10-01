"use client";

import React, { useEffect, useState } from "react";
import {
  CreditCard,
  Search,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Receipt,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  async function fetchPayments() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type, status });
      const res = await fetch(`/api/admin/payments?${params.toString()}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setPayments(data.payments);
        setKpis(data.kpis || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPayments();
  }, [type, status]);

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#7E2248] text-xs font-semibold mb-2">
            <CreditCard className="w-3.5 h-3.5 text-[#7E2248]" />
            Financial Operations
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
            Payments & Transactions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time ledger of event tickets, RM retainers, Breakup Buddy sessions, and subscriptions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/admin/payments/refunds"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-xs font-bold text-slate-700 transition shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#7E2248]" />
            <span>Refunds Desk</span>
          </a>
          <a
            href="/admin/payments/invoices"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-xs font-bold text-slate-700 transition shadow-xs"
          >
            <Receipt className="w-3.5 h-3.5 text-[#7E2248]" />
            <span>Invoices</span>
          </a>
        </div>
      </div>

      {/* KPI TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Total Revenue</span>
          <span className="text-xl font-serif font-black text-emerald-700">
            ₹{(kpis.totalRevenue || 0).toLocaleString("en-IN")}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Today&apos;s Revenue</span>
          <span className="text-xl font-serif font-black text-slate-900">
            ₹{(kpis.todayRevenue || 0).toLocaleString("en-IN")}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Monthly Gross</span>
          <span className="text-xl font-serif font-black text-slate-900">
            ₹{(kpis.monthlyRevenue || 0).toLocaleString("en-IN")}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Pending</span>
          <span className="text-xl font-serif font-black text-amber-700">{kpis.pendingCount || 0}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Failed</span>
          <span className="text-xl font-serif font-black text-rose-700">{kpis.failedCount || 0}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Refunded</span>
          <span className="text-xl font-serif font-black text-slate-700">{kpis.refundedCount || 0}</span>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-white border border-rose-100 shadow-xs text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-600 font-semibold">Type:</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
          >
            <option value="ALL">All Types</option>
            <option value="EVENT_TICKET">Event Ticket</option>
            <option value="RELATIONSHIP_MANAGER">Relationship Manager</option>
            <option value="BREAKUP_BUDDY">Breakup Buddy</option>
            <option value="SUBSCRIPTION">Subscription</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-600 font-semibold">Status:</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#FAF3F6]/50 border border-rose-200 text-slate-800 focus:outline-none focus:border-[#7E2248] focus:bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="bg-white border border-rose-100 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-rose-50/60 text-[11px] font-serif font-bold uppercase tracking-wider text-slate-500 border-b border-rose-100">
              <tr>
                <th className="px-5 py-3.5">Transaction ID</th>
                <th className="px-4 py-3.5">User</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Gateway</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 animate-pulse">
                    Loading transactions...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 italic">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-rose-50/30 transition">
                    <td className="px-5 py-4 font-mono font-bold text-slate-800">
                      {p.id}
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-900">{p.userName}</div>
                      <span className="text-[10px] text-slate-500">{p.userEmail}</span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="px-2 py-0.5 rounded bg-rose-50 text-[#7E2248] border border-rose-200/60 font-semibold">
                        {p.type.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-emerald-700 font-bold text-sm">
                      ₹{p.amount.toLocaleString("en-IN")}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {p.gateway || "Razorpay"}
                    </td>

                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === "SUCCESS"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : p.status === "PENDING"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}>
                        {p.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right text-slate-500 text-[11px]">
                      {new Date(p.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
